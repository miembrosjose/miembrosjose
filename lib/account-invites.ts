// Geração e validação de tokens únicos para criação de conta pós-compra Stripe.
//
// Uso:
//  - createOrRefreshInvite(): chamado do webhook Stripe após sale_type=front
//  - getInviteByToken(): chamado em /cuenta/crear pra validar token
//  - markInviteUsed(): após criar conta no Supabase Auth com sucesso
//
// Segurança:
//  - Token = 32 bytes random, base64url-encoded (~43 chars). Crypto-secure.
//  - Validação SEMPRE server-side. Token nunca chega ao cliente exceto pela URL.
//  - Após used_at preenchido, token é inutilizável (lookup ignora).

import { getSupabaseAdmin } from "@/lib/supabase/admin"

const TOKEN_BYTES = 32
const EXPIRATION_DAYS = 7

export type InviteRecord = {
  id: string
  email: string
  token: string
  stripe_payment_intent_id: string | null
  stripe_customer_id: string | null
  customer_name: string | null
  customer_phone: string | null
  created_at: string
  expires_at: string
  used_at: string | null
  email_sent_at: string | null
  email_error: string | null
  resend_count: number
}

/**
 * Gera token URL-safe de 32 bytes (~43 chars base64url).
 * Edge runtime compatible: usa Web Crypto API.
 */
export function generateToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES)
  crypto.getRandomValues(bytes)
  // base64url (sem +, /, =) — seguro pra URL sem encode
  let str = ""
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i])
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/**
 * Cria ou atualiza invite para um email. Lógica:
 *  - Se conta já existe no Supabase Auth → retorna { skipped: true } (não envia email)
 *  - Se invite pendente (não usado) → regenera token + reseta expires_at
 *  - Se não existe → cria novo
 *
 * Chamado do webhook Stripe. Idempotente (seguro contra retry).
 */
export async function createOrRefreshInvite(params: {
  email: string
  stripePaymentIntentId: string
  stripeCustomerId?: string | null
  customerName?: string | null
  customerPhone?: string | null
}): Promise<
  | { skipped: true; reason: "account_exists" | "already_sent"; customerName: string | null; invite?: InviteRecord }
  | { skipped: false; invite: InviteRecord }
> {
  const supabase = getSupabaseAdmin()
  const cleanEmail = params.email.trim().toLowerCase()

  // 1. Checa se já existe conta no Supabase Auth com esse email.
  // IMPORTANTE: NÃO usar .schema("auth") — falha silenciosamente em prod
  // (mesmo bug recorrente que causou /u/[id] 404 e admin Miembros vazio).
  // Use auth.admin.listUsers + filter em memória.
  try {
    const { data: listed } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const exists = (listed?.users || []).some((u) => u.email?.toLowerCase() === cleanEmail)
    if (exists) {
      console.log(`[createOrRefreshInvite] account already exists for ${cleanEmail} — skipping invite`)
      return { skipped: true, reason: "account_exists", customerName: params.customerName ?? null }
    }
  } catch (e) {
    console.warn(`[createOrRefreshInvite] listUsers failed (não bloqueia):`, e)
    // não bloqueia criação se check falhar
  }

  // 2. Se já existe invite pendente (não usado) → regenera token
  const { data: existingInvite } = await supabase
    .from("account_invites")
    .select("*")
    .eq("email", cleanEmail)
    .maybeSingle()

  const newToken = generateToken()
  const newExpiresAt = new Date(Date.now() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000).toISOString()

  if (existingInvite) {
    if (existingInvite.used_at) {
      // Conta já criada (used_at preenchido) — não duplica
      return {
        skipped: true,
        reason: "account_exists",
        customerName: params.customerName ?? existingInvite.customer_name ?? null,
      }
    }
    // IDEMPOTENCIA: se email já foi enviado com sucesso E o invite ainda é válido,
    // NÃO regenera token nem reenvia. Cobre caso de Stripe disparar 2 eventos
    // (invoice.payment_succeeded + invoice_payment.paid) e nosso webhook processar
    // os dois — sem essa proteção, cliente recebe 2 emails com tokens diferentes.
    const sentRecently =
      existingInvite.email_sent_at &&
      !existingInvite.email_error &&
      new Date(existingInvite.expires_at).getTime() > Date.now()
    if (sentRecently) {
      console.log(
        `[createOrRefreshInvite] email já enviado pra ${cleanEmail} em ${existingInvite.email_sent_at} — skip duplicado`,
      )
      return {
        skipped: true,
        reason: "already_sent",
        customerName: existingInvite.customer_name ?? params.customerName ?? null,
        invite: existingInvite as InviteRecord,
      }
    }
    // Email NÃO enviado (ou erro anterior, ou expirou) → regenera + tenta de novo
    const { data: updated, error } = await supabase
      .from("account_invites")
      .update({
        token: newToken,
        expires_at: newExpiresAt,
        stripe_payment_intent_id: params.stripePaymentIntentId,
        stripe_customer_id: params.stripeCustomerId ?? null,
        customer_name: params.customerName ?? existingInvite.customer_name ?? null,
        customer_phone: params.customerPhone ?? existingInvite.customer_phone ?? null,
        resend_count: (existingInvite.resend_count ?? 0) + 1,
        email_sent_at: null,
        email_error: null,
      })
      .eq("id", existingInvite.id)
      .select("*")
      .single()
    if (error || !updated) throw new Error(`update invite: ${error?.message ?? "unknown"}`)
    return { skipped: false, invite: updated as InviteRecord }
  }

  // 3. Cria novo invite
  const { data: created, error } = await supabase
    .from("account_invites")
    .insert({
      email: cleanEmail,
      token: newToken,
      expires_at: newExpiresAt,
      stripe_payment_intent_id: params.stripePaymentIntentId,
      stripe_customer_id: params.stripeCustomerId ?? null,
      customer_name: params.customerName ?? null,
      customer_phone: params.customerPhone ?? null,
    })
    .select("*")
    .single()

  if (error || !created) throw new Error(`insert invite: ${error?.message ?? "unknown"}`)
  return { skipped: false, invite: created as InviteRecord }
}

/**
 * Busca invite por token (usado em /cuenta/crear).
 * Retorna null se: token não existe, já foi usado, ou expirou.
 */
export async function getInviteByToken(token: string): Promise<InviteRecord | null> {
  if (!token || typeof token !== "string" || token.length < 20) return null

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("account_invites")
    .select("*")
    .eq("token", token)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle()

  if (error || !data) return null
  return data as InviteRecord
}

/**
 * Marca invite como usado. Chamar APÓS criar conta no Supabase Auth com sucesso.
 * Garante que o token não pode mais ser reutilizado.
 *
 * userId (opcional) — quando passado, popula used_by_user_id, que dispara
 * o trigger SQL `on_invite_used_link_sale` pra vincular stripe_sales daquele
 * payment_intent ao user. Sem isso, sales ficam órfãs (user_id=NULL).
 */
export async function markInviteUsed(inviteId: string, userId?: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const updates: Record<string, unknown> = { used_at: new Date().toISOString() }
  if (userId) updates.used_by_user_id = userId
  const { error } = await supabase
    .from("account_invites")
    .update(updates)
    .eq("id", inviteId)
    .is("used_at", null) // proteção contra race condition

  if (error) throw new Error(`mark invite used: ${error.message}`)
}

/**
 * Atualiza status de envio de email (sucesso ou erro) — pra debug e métricas.
 */
export async function setInviteEmailStatus(
  inviteId: string,
  status: { sent: boolean; error?: string | null }
): Promise<void> {
  const supabase = getSupabaseAdmin()
  await supabase
    .from("account_invites")
    .update({
      email_sent_at: status.sent ? new Date().toISOString() : null,
      email_error: status.error ?? null,
    })
    .eq("id", inviteId)
}
