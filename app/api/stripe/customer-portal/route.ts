// POST /api/stripe/customer-portal
//
// Crea una sesión ÚNICA del Stripe Billing Portal para el usuario autenticado
// y devuelve solo la URL temporal. Nunca acepta un customer id del navegador:
// el stripe_customer_id se lee SIEMPRE server-side desde member_subscriptions
// (RLS: cada usuario solo puede leer su propia fila).
//
// STRIPE_SECRET_KEY vive solo en el servidor (getStripe, cliente fetch para
// Cloudflare Workers). Nunca se envía al navegador ni se filtra en errores.

import { NextResponse } from "next/server"
import { requireMiembrosAuth } from "@/app/miembros/_lib/auth-server"
import { getStripe } from "@/lib/stripe/server"

const RETURN_URL = "https://los144000.com/miembros"

export async function POST() {
  // Auth server-side con el helper existente (sesión válida + membresía activa
  // o admin). Si no cumple, requireMiembrosAuth redirige (control de flujo Next).
  const { user, supabase } = await requireMiembrosAuth()
  if (!user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const email = user.email.trim().toLowerCase()

  try {
    // Búsqueda case-insensitive: guardamos el email en minúsculas y el RLS
    // filtra por lower(email) == lower(jwt email), así que solo devuelve su fila.
    const { data: sub, error } = await supabase
      .from("member_subscriptions")
      .select("stripe_customer_id")
      .eq("email", email)
      .maybeSingle()

    if (error) {
      console.error("[customer-portal] stage=lookup code=%s", error.code || "db_error")
      return NextResponse.json({ error: "portal_error" }, { status: 500 })
    }

    const customerId = sub?.stripe_customer_id
    if (!customerId) {
      // No hay cuenta de facturación asociada (p. ej. admin sin suscripción).
      return NextResponse.json({ error: "no_billing_account" }, { status: 404 })
    }

    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: RETURN_URL,
      locale: "es",
    })

    // Solo la URL temporal. Nada más.
    return NextResponse.json({ url: session.url })
  } catch (e) {
    // Error genérico al cliente; log server-side sin secretos ni datos internos.
    const code =
      e && typeof e === "object" && "code" in e ? String((e as { code?: unknown }).code) : "error"
    console.error("[customer-portal] stage=portal code=%s", code.slice(0, 40))
    return NextResponse.json({ error: "portal_error" }, { status: 500 })
  }
}
