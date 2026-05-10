// Helpers centralizados pra revogar/restaurar acesso a produtos.
// Usado por webhooks (Stripe charge.refunded, charge.dispute.created,
// Hotmart PURCHASE_REFUNDED/CHARGEBACK/CANCELED/PROTEST), e indiretamente
// pela API admin manual.
//
// Estratégia:
//   - revoked_products = source-of-truth pra revogações por (email, key)
//   - app_metadata.access_revoked = lockout COMPLETO (front refund, ban manual)
//   - source_ref = identificador externo (PI Stripe ou transactionId Hotmart)
//     pra permitir reverter/restaurar quando refund é cancelado.

import { getSupabaseAdmin } from "@/lib/supabase/admin"

const VALID_KEYS = new Set(["creativos", "andromeda", "analytics", "revisao", "minivsl", "front"])

type RevokeArgs = {
  email: string
  productKeys: string[]              // keys (sem __downsell, já normalizadas)
  reason: "refund" | "chargeback" | "dispute" | "cancel" | "manual" | "fraud"
  source: "stripe" | "hotmart" | "manual"
  sourceRef: string                  // PI Stripe (ex: pi_xxx) ou Hotmart transactionId
  isFrontSale: boolean               // true → revoga acesso completo via app_metadata
  notes?: string | null
}

/**
 * Revoga acesso aos produtos especificados.
 * Se isFrontSale=true, marca app_metadata.access_revoked=true (lockout completo).
 */
export async function revokeAccessByTransaction(args: RevokeArgs): Promise<void> {
  const admin = getSupabaseAdmin()
  const cleanEmail = args.email.toLowerCase().trim()
  if (!cleanEmail || args.productKeys.length === 0) return

  const cleanKeys = Array.from(new Set(
    args.productKeys
      .map((k) => k.replace(/__downsell$/, ""))
      .filter((k) => k && VALID_KEYS.has(k))
  ))
  if (cleanKeys.length === 0) return

  // Insere uma row por key. Não dedup por (email, key) pra preservar histórico.
  const rows = cleanKeys.map((key) => ({
    customer_email: cleanEmail,
    product_key: key,
    reason: args.reason,
    source: args.source,
    source_ref: args.sourceRef,
    notes: args.notes || null,
  }))
  const { error } = await admin.from("revoked_products").insert(rows)
  if (error) {
    console.error("[revokeAccessByTransaction] insert", error)
    return
  }

  // Front: revoga acesso COMPLETO via app_metadata
  if (args.isFrontSale || cleanKeys.includes("front")) {
    try {
      const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const target = (listed?.users || []).find((u) => u.email?.toLowerCase() === cleanEmail)
      if (target) {
        await admin.auth.admin.updateUserById(target.id, {
          app_metadata: {
            ...target.app_metadata,
            access_revoked: true,
            access_revoked_at: new Date().toISOString(),
            access_revoked_reason: `${args.source}_${args.reason}_front`,
            access_revoked_source_ref: args.sourceRef,
          },
        })
      }
    } catch (e) {
      console.warn("[revokeAccessByTransaction] failed to revoke front access:", e)
    }
  }
}

/**
 * Restaura acesso quando refund é cancelado / dispute won / cliente desistiu.
 * Identifica revogações pelo source_ref (PI Stripe ou transactionId Hotmart).
 *
 * Faz:
 *   1. DELETE revoked_products WHERE source_ref = sourceRef
 *   2. Se app_metadata.access_revoked_source_ref bater, reseta access_revoked=false
 *   3. Volta stripe_sales.status='paid' se estava 'refunded'
 */
export async function restoreAccessByTransaction(args: {
  email: string
  sourceRef: string
  source: "stripe" | "hotmart"
}): Promise<{ restored_keys: string[]; full_access_restored: boolean }> {
  const admin = getSupabaseAdmin()
  const cleanEmail = args.email.toLowerCase().trim()
  if (!cleanEmail) return { restored_keys: [], full_access_restored: false }

  // 1) Deleta revogações dessa transação
  const { data: removed } = await admin
    .from("revoked_products")
    .delete()
    .eq("customer_email", cleanEmail)
    .eq("source_ref", args.sourceRef)
    .select("product_key")
  const restoredKeys = (removed || []).map((r) => (r as { product_key: string }).product_key)

  // 2) Se a revogação completa (front) foi por essa source_ref, reseta
  let fullAccessRestored = false
  try {
    const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const target = (listed?.users || []).find((u) => u.email?.toLowerCase() === cleanEmail)
    if (target) {
      const appMeta = (target.app_metadata || {}) as { access_revoked?: boolean; access_revoked_source_ref?: string }
      if (appMeta.access_revoked === true && appMeta.access_revoked_source_ref === args.sourceRef) {
        await admin.auth.admin.updateUserById(target.id, {
          app_metadata: {
            ...target.app_metadata,
            access_revoked: false,
            access_revoked_at: null,
            access_revoked_reason: null,
            access_revoked_source_ref: null,
          },
        })
        fullAccessRestored = true
      }
    }
  } catch (e) {
    console.warn("[restoreAccessByTransaction] auth update:", e)
  }

  // 3) Volta status='paid' em stripe_sales (se estava refunded)
  const piId = args.source === "hotmart" ? `hotmart_${args.sourceRef}` : args.sourceRef
  await admin.from("stripe_sales")
    .update({ status: "paid" })
    .eq("stripe_payment_intent_id", piId)
    .eq("status", "refunded")

  return { restored_keys: restoredKeys, full_access_restored: fullAccessRestored }
}

/**
 * Verifica se uma transação tem revogações ativas (úsado por webhooks
 * pra detectar "PURCHASE_APPROVED chegando depois de refund cancelado").
 */
export async function hasActiveRevocations(email: string, sourceRef: string): Promise<boolean> {
  const admin = getSupabaseAdmin()
  const { count } = await admin
    .from("revoked_products")
    .select("id", { count: "exact", head: true })
    .eq("customer_email", email.toLowerCase().trim())
    .eq("source_ref", sourceRef)
  return (count || 0) > 0
}
