// POST /api/stripe/customer-portal
//
// Crea una sesión ÚNICA del Stripe Billing Portal para el usuario autenticado y
// devuelve solo la URL temporal. Requiere una sesión válida de Supabase, pero
// NO exige membresía "active": los estados past_due (para regularizar el pago) y
// canceled (para ver facturas) también deben poder abrir el portal.
//
// El stripe_customer_id se lee SIEMPRE server-side desde member_subscriptions
// (RLS: cada usuario solo lee su propia fila). Nunca se acepta un customer id del
// navegador. STRIPE_SECRET_KEY vive solo en el servidor. Errores genéricos.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe/server"

const RETURN_URL = "https://los144000.com/miembros"

function json(status: number, body: Record<string, unknown>) {
  const res = NextResponse.json(body, { status })
  res.headers.set("Cache-Control", "private, no-store")
  return res
}

export async function POST() {
  const supabase = await getSupabaseServer()

  // Solo requiere identidad autenticada (no exige status active).
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return json(401, { error: "unauthorized" })
  }

  const email = user.email.trim().toLowerCase()

  try {
    // RLS restringe a la propia fila; filtro explícito por email normalizado.
    const { data: sub, error } = await supabase
      .from("member_subscriptions")
      .select("stripe_customer_id")
      .eq("email", email)
      .maybeSingle()

    if (error) {
      console.error("[customer-portal] stage=lookup code=%s", error.code || "db_error")
      return json(500, { error: "portal_error" })
    }

    const customerId = sub?.stripe_customer_id
    if (!customerId) {
      // Sin cuenta de facturación (p. ej. admin sin suscripción o sin fila).
      return json(404, { error: "no_billing_account" })
    }

    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: RETURN_URL,
      locale: "es",
    })

    return json(200, { url: session.url })
  } catch (e) {
    const code =
      e && typeof e === "object" && "code" in e ? String((e as { code?: unknown }).code) : "error"
    console.error("[customer-portal] stage=portal code=%s", code.slice(0, 40))
    return json(500, { error: "portal_error" })
  }
}
