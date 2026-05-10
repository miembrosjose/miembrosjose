// API admin — estende validade do front de um user em +1 ano.
//
// POST /api/admin/extend-access
//   Body: { email: string, days?: number }
//
// Lógica:
//   - Acha todos stripe_sales do user com items contendo key='front' E status=paid
//   - Soma `days` dias (default 365) ao expires_at MAIOR já existente
//     (ou ao now() se nenhum existir)
//   - Atualiza TODOS os sales front desse user pra novo expires_at
//
// Por que atualiza todos: owned-products usa MAX(expires_at) entre todos sales
// front do user. Atualizando todos garante consistência se cliente comprou
// em múltiplas vias (Hotmart antigo + Stripe novo, etc).

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { email?: string; days?: number }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = (body.email || "").trim().toLowerCase()
  const days = Math.max(1, Math.min(3650, Number(body.days) || 365)) // 1 dia a 10 anos

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Lookup user_id pelo email
  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const targetUser = listed?.users?.find((u) => u.email?.toLowerCase() === email)
  if (!targetUser) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  // Busca todos os stripe_sales do user com front
  const { data: sales, error: salesErr } = await admin
    .from("stripe_sales")
    .select("id, expires_at, items")
    .eq("user_id", targetUser.id)
    .eq("status", "paid")
  if (salesErr) {
    return NextResponse.json({ error: salesErr.message }, { status: 500 })
  }

  const frontSales = (sales || []).filter((s) =>
    Array.isArray(s.items) &&
    s.items.some((it: { key?: string }) => it?.key && it.key.replace(/__downsell$/, "") === "front"),
  )

  if (frontSales.length === 0) {
    return NextResponse.json({ error: "Cliente no tiene compra de front. Use Liberar acceso primero." }, { status: 400 })
  }

  // Pega o maior expires_at atual (ou now() se todos NULL/passados)
  const nowMs = Date.now()
  let baseMs = nowMs
  for (const s of frontSales) {
    if (s.expires_at) {
      const ms = new Date(s.expires_at).getTime()
      if (ms > baseMs) baseMs = ms
    }
  }

  // Adiciona N dias
  const newExpiresAt = new Date(baseMs + days * 24 * 60 * 60 * 1000).toISOString()

  // Atualiza TODOS os sales front desse user
  const ids = frontSales.map((s) => s.id)
  const { error: updateErr } = await admin
    .from("stripe_sales")
    .update({ expires_at: newExpiresAt })
    .in("id", ids)
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    email,
    days_added: days,
    new_expires_at: newExpiresAt,
    sales_updated: ids.length,
    granted_by: user.email,
  })
}
