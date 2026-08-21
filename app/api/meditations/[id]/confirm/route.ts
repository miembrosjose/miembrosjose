// POST /api/meditations/[id]/confirm  { payment_intent_id }
// Cierra el flujo tras una autenticación 3DS o el Payment Element: recupera el
// PaymentIntent, valida que es NUESTRO (metadata + usuario + meditación) y que
// está 'succeeded', y registra el entitlement de forma idempotente.
//
// El frontend NUNCA crea el entitlement; aquí el servidor verifica contra Stripe.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe/server"
import { getServerMeditation } from "@/lib/meditations"
import { getMembership } from "@/lib/membership"
import { registerMeditationEntitlement } from "@/lib/meditation-purchase"

export const dynamic = "force-dynamic"

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await getSupabaseServer()
  const membership = await getMembership(supabase)
  if (!membership.authenticated) {
    return NextResponse.json({ status: "unauthenticated" }, { status: 401 })
  }
  if (!membership.active) {
    return NextResponse.json({ status: "membership_required" }, { status: 403 })
  }

  let body: { payment_intent_id?: string }
  try { body = await req.json() } catch { return NextResponse.json({ status: "invalid_body" }, { status: 400 }) }
  const piId = typeof body.payment_intent_id === "string" ? body.payment_intent_id : ""
  if (!piId) return NextResponse.json({ status: "invalid_body" }, { status: 400 })

  const med = await getServerMeditation(id)
  if (!med || med.accessType !== "premium") {
    return NextResponse.json({ status: "not_found" }, { status: 404 })
  }

  const userId = membership.userId!
  const stripe = getStripe()
  const pi = await stripe.paymentIntents.retrieve(piId)

  // El PI debe ser NUESTRO: tipo, usuario y meditación coincidentes.
  if (
    pi.metadata?.type !== "premium_meditation" ||
    pi.metadata?.user_id !== userId ||
    pi.metadata?.meditation_id !== med.id
  ) {
    return NextResponse.json({ status: "mismatch" }, { status: 403 })
  }

  if (pi.status !== "succeeded") {
    return NextResponse.json({ status: "pending", pi_status: pi.status })
  }

  await registerMeditationEntitlement({
    userId,
    meditationId: med.id,
    paymentIntentId: pi.id,
    amountCents: pi.amount,
    currency: pi.currency,
  })
  return NextResponse.json({ status: "unlocked" })
}
