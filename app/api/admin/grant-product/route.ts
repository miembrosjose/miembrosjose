// API admin — libera produto manualmente pra um user (sem cobrança).
//
// POST /api/admin/grant-product
//   Body: { email: string, product_keys: string[] }
//
// Estratégia: insere registro em stripe_sales com sale_type='manual' e items[]
// contendo as keys. Reaproveita toda a lógica de ownership existente
// (/api/profile/owned-products já agrega items[] de stripe_sales).
//
// Sem cobrança real, sem Stripe Customer, sem PaymentIntent. Marca claramente
// pra reports diferenciarem do que veio do funil real.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

const VALID_KEYS = new Set(["creativos", "andromeda", "analytics", "revisao", "minivsl", "bonus-ganchos"])

const KEY_NAMES: Record<string, string> = {
  creativos: "Producto 1",
  andromeda: "Producto 2",
  analytics: "Producto 3",
  revisao: "Servicio Premium",
  minivsl: "Upsell 1",
  "bonus-ganchos": "Bonus 1",
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { email?: string; product_keys?: string[] }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const email = (body.email || "").trim().toLowerCase()
  const keys = Array.isArray(body.product_keys) ? body.product_keys : []

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 })
  }
  if (keys.length === 0) {
    return NextResponse.json({ error: "Selecciona al menos un producto" }, { status: 400 })
  }
  for (const k of keys) {
    if (!VALID_KEYS.has(k)) {
      return NextResponse.json({ error: `Invalid key: ${k}` }, { status: 400 })
    }
  }

  const items = keys.map((key) => ({
    key,
    name: KEY_NAMES[key] || key,
    price: 0,
    qty: 1,
  }))

  const admin = getSupabaseAdmin()
  const fakePiId = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  // Lookup user_id existente pelo email — owned-products filtra por user_id
  // (não mais email). Se conta ainda não existe, fica NULL e quando user
  // criar conta com esse email, o trigger SQL on_invite_used_link_sale
  // vincula via stripe_payment_intent_id (mas só se for invite usado).
  // Pra grant-product, o caso normal é admin liberando pra user JÁ logado,
  // então user_id quase sempre existe.
  let existingUserId: string | null = null
  try {
    const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const matched = listed?.users?.find((u) => u.email?.toLowerCase() === email)
    existingUserId = matched?.id ?? null
  } catch {
    // ignora — fica NULL
  }

  // PASSO 1: INSERT primeiro. Se falhar (constraint, network, etc), o estado
  // anterior fica intacto — admin recebe erro e tenta de novo.
  // (Antes a ordem era inversa: cleanup → INSERT. Race ruim: cleanup OK + INSERT
  // falho = revoke perdido sem produto liberado.)
  const { error } = await admin.from("stripe_sales").insert({
    stripe_session_id: null,
    stripe_payment_intent_id: fakePiId,        // não-Stripe; identificador único só pra constraint
    stripe_customer_id: null,
    sale_type: "manual",                       // diferencia de 'front' e 'upsell' nos reports
    region: "MANUAL",
    items,
    amount_total: 0,
    currency: "usd",
    customer_email: email,
    customer_name: null,
    customer_phone: null,
    customer_country: null,
    user_id: existingUserId,
    utm: { source: "admin_grant", granted_by: user.email },
    status: "paid",
  })

  if (error) {
    console.error("[/api/admin/grant-product]", error)
    return NextResponse.json({ error: "Database error: " + error.message }, { status: 500 })
  }

  // PASSO 2: cleanup do revoked_products SÓ depois do INSERT bem-sucedido.
  // Se falhar aqui, owned-products vai filtrar a key como revogada (cliente
  // não vê o produto liberado) — mas o sale tá no banco e admin pode tentar
  // revoke-product DELETE pra limpar. Estado consistente, não perde dados.
  const { error: revokeCleanError } = await admin
    .from("revoked_products")
    .delete()
    .eq("customer_email", email)
    .in("product_key", keys)
  if (revokeCleanError) {
    console.warn("[/api/admin/grant-product] revoked_products cleanup:", revokeCleanError)
    // Não retorna erro 500 — sale foi criado com sucesso. Apenas warn.
  }

  return NextResponse.json({ ok: true, granted: keys, email })
}
