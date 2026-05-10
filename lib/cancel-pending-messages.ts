// Cancela mensagens WhatsApp pendentes pra um cliente quando a compra é
// aprovada (Stripe payment_intent.succeeded, checkout.session.completed,
// invoice.payment_succeeded, Hotmart PURCHASE_APPROVED).
//
// Bug que isso resolve:
//   - Cliente abandonava carrinho → enfileirava sequência abandoned (5 msgs)
//   - Depois voltava e pagava → mensagens ainda eram enviadas (cliente
//     recebia "vc abandonou el carrinho!" depois de já ter pago)
//   - Card falhou → enfileirava recovery card_failure (3min delay)
//     Cliente tentava de novo no MESMO checkout e pagava → mensagem ainda
//     ia disparar
//
// CRÍTICO — só cancela RECOVERY messages, nunca felicidades:
//   - Stripe payment_intent.succeeded e o /api/whatsapp/stripe-events rodam
//     em PARALELO. O stripe-events enfileira purchase_approved (felicidades)
//     com delay 5min. Se cancelPendingMessages rodasse SEM filtro de event_type,
//     poderia matar a felicidades antes dela disparar (race condition).
//   - Whitelist explícito de event_types canceláveis: abandoned, card_failure_recovery.
//   - purchase_approved (felicidades) e refund NÃO são tocados.

import { getSupabaseAdmin } from "@/lib/supabase/admin"

type CancelArgs = {
  email?: string | null
  pi_id?: string | null
  reason?: string  // 'purchase_approved' | 'recovery_paid' etc
}

// Event types que SÃO canceláveis quando uma compra é aprovada.
// purchase_approved (felicidades) e refund NÃO entram aqui — eles são
// mensagens de pós-venda e devem ir mesmo se cliente fizer outra compra.
const CANCELABLE_EVENT_TYPES = ["abandoned", "card_failure_recovery"] as const

/**
 * Cancela mensagens RECOVERY pendentes pra esse cliente (abandoned cart +
 * card failure recovery). Mensagens de felicidades/pós-venda nunca são
 * tocadas. Usa email OU pi_id (qualquer um que matchar).
 *
 * Idempotente: se nada estiver pendente, não faz nada.
 */
export async function cancelPendingMessages(args: CancelArgs): Promise<{ canceled: number }> {
  const admin = getSupabaseAdmin()
  const reason = args.reason || "purchase_approved"

  const conditions: string[] = []
  if (args.email) conditions.push(`email.eq.${args.email.toLowerCase().trim()}`)
  if (args.pi_id) conditions.push(`pi_id.eq.${args.pi_id}`)

  if (conditions.length === 0) return { canceled: 0 }

  const { data, error } = await admin
    .from("whatsapp_pending")
    .update({
      canceled_at: new Date().toISOString(),
      cancel_reason: reason,
    })
    .or(conditions.join(","))
    .in("event_type", CANCELABLE_EVENT_TYPES as unknown as string[])
    .is("sent_at", null)
    .is("canceled_at", null)
    .select("id, event_type, email")

  if (error) {
    console.error("[cancelPendingMessages]", error)
    return { canceled: 0 }
  }

  const count = data?.length || 0
  if (count > 0) {
    const types = (data || []).map((r) => (r as { event_type: string }).event_type)
    console.log(`[cancelPendingMessages] canceled ${count} pendings (${types.join(", ")}) — reason=${reason} email=${args.email} pi=${args.pi_id}`)
  }
  return { canceled: count }
}
