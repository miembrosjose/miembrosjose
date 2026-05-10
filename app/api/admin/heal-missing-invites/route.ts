// API admin — varre vendas paid recentes e dispara invite/email pra clientes
// que ficaram sem receber por causa de bug em webhook. Auto-recovery.
//
// POST /api/admin/heal-missing-invites
//   Body: { hours?: number }  (default: 48 — varre últimas 48h)
//
// Estratégia:
//   1. Pega stripe_sales onde:
//      - sale_type IN ('front', 'standalone') OU sale_type='front_installment'
//      - status = 'paid'
//      - created_at >= now() - hours
//   2. Pra cada sale, verifica em account_invites se tem invite com email_sent_at filled
//   3. Se NÃO tem ou email_sent_at é NULL ou tem email_error → cria/regenera invite e manda email
//   4. Retorna lista de quem foi curado + erros
//
// Pode ser hit manualmente OU configurar Cloudflare Cron Trigger pra rodar a cada N min.
//
// Auth: admin only.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"
import { createOrRefreshInvite } from "@/lib/account-invites"
import { sendAccountInviteEmail, sendAccountExistsEmail } from "@/lib/email/account-invite"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { hours?: number } = {}
  try { body = await req.json() } catch {}
  const hours = Math.max(1, Math.min(720, body.hours || 48))

  const admin = getSupabaseAdmin()
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  // 1. Pega TODAS sales front/standalone paid recentes
  const { data: recentSales, error } = await admin
    .from("stripe_sales")
    .select("id, sale_type, customer_email, customer_name, customer_phone, stripe_payment_intent_id, stripe_customer_id, created_at, items, plan")
    .in("sale_type", ["front", "standalone", "front_installment"])
    .eq("status", "paid")
    .gte("created_at", cutoff)
    .not("customer_email", "is", null)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "query_sales", message: error.message }, { status: 500 })
  }

  const result = {
    scanned: recentSales?.length || 0,
    healed: [] as Array<{ email: string; sale_id: string; type: string }>,
    skipped_already_sent: [] as string[],
    skipped_account_exists_email_sent: [] as string[],
    errors: [] as Array<{ email: string; error: string }>,
  }

  // Dedupe por email (cliente pode ter várias sales — só precisa 1 invite)
  const processed = new Set<string>()

  for (const sale of recentSales || []) {
    const email = (sale.customer_email || "").trim().toLowerCase()
    if (!email || processed.has(email)) continue
    processed.add(email)

    // Verifica account_invites
    const { data: invite } = await admin
      .from("account_invites")
      .select("*")
      .eq("email", email)
      .maybeSingle()

    // Se invite existe + email_sent_at preenchido + sem erro + ainda válido → skip
    if (
      invite &&
      invite.email_sent_at &&
      !invite.email_error &&
      new Date(invite.expires_at).getTime() > Date.now()
    ) {
      result.skipped_already_sent.push(email)
      continue
    }

    // Verifica se já tem conta em auth.users (resend irá decidir pelo path account_exists)
    try {
      const inviteResult = await createOrRefreshInvite({
        email,
        stripePaymentIntentId: sale.stripe_payment_intent_id || `heal_${sale.id}`,
        stripeCustomerId: sale.stripe_customer_id || null,
        customerName: sale.customer_name || null,
        customerPhone: sale.customer_phone || null,
      })

      if (inviteResult.skipped && inviteResult.reason === "already_sent") {
        result.skipped_already_sent.push(email)
        continue
      }

      if (inviteResult.skipped && inviteResult.reason === "account_exists") {
        // Cliente já tem conta — manda email de login
        const sent = await sendAccountExistsEmail({
          email,
          customerName: inviteResult.customerName,
          source: "heal_missing_invites",
          sourceRef: sale.id,
        })
        if (!sent.ok) {
          result.errors.push({ email, error: `sendAccountExistsEmail: ${sent.error}` })
          continue
        }
        result.healed.push({ email, sale_id: sale.id, type: "account_exists" })
        continue
      }

      // Caso normal: manda invite
      if (!inviteResult.skipped) {
        const sent = await sendAccountInviteEmail(inviteResult.invite, {
          source: "heal_missing_invites",
          sourceRef: sale.id,
        })
        if (!sent.ok) {
          result.errors.push({ email, error: `sendAccountInviteEmail: ${sent.error}` })
          continue
        }
        result.healed.push({ email, sale_id: sale.id, type: "invite" })
      }
    } catch (e) {
      result.errors.push({ email, error: e instanceof Error ? e.message : "unknown" })
    }
  }

  return NextResponse.json(result)
}
