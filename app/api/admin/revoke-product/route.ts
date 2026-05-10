// API admin — revoga acesso a produto(s) de um user.
//
// POST /api/admin/revoke-product
//   Body: { email, product_keys: string[], reason?, notes? }
//
// Lógica:
//   - Pra cada key, insere row em revoked_products (source='manual')
//   - Se inclui 'front' → também marca app_metadata.access_revoked = true
//     no auth.users (perda de acesso completo). Middleware /miembros bloqueia.
//
// Pra restaurar: DELETE /api/admin/revoke-product?email=xxx&key=yyy
//   key = 'all' → restaura tudo + reseta access_revoked

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

const VALID_KEYS = new Set(["creativos", "andromeda", "analytics", "revisao", "minivsl", "front"])

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { email?: string; product_keys?: string[]; reason?: string; notes?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const email = (body.email || "").trim().toLowerCase()
  const keys = Array.isArray(body.product_keys) ? body.product_keys : []
  const reason = body.reason || "manual"
  const notes = body.notes || null

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

  const admin = getSupabaseAdmin()

  // Insere uma row por key (idempotente: ON CONFLICT não faz nada se já existe
  // mesma combinação. Mas como não tem unique constraint, fica histórico mesmo)
  const rows = keys.map((key) => ({
    customer_email: email,
    product_key: key,
    reason,
    source: "manual" as const,
    source_ref: user.email || user.id,
    revoked_by: user.id,
    notes,
  }))

  const { error: insertErr } = await admin.from("revoked_products").insert(rows)
  if (insertErr) {
    console.error("[/api/admin/revoke-product]", insertErr)
    return NextResponse.json({ error: "Database error: " + insertErr.message }, { status: 500 })
  }

  // Se inclui 'front': revoga acesso completo via app_metadata
  let fullAccessRevoked = false
  if (keys.includes("front")) {
    // Acha o user pelo email
    const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const target = (listed?.users || []).find((u) => u.email?.toLowerCase() === email)
    if (target) {
      const { error: updErr } = await admin.auth.admin.updateUserById(target.id, {
        app_metadata: { ...target.app_metadata, access_revoked: true, access_revoked_at: new Date().toISOString() },
      })
      if (!updErr) fullAccessRevoked = true
    }
  }

  return NextResponse.json({
    ok: true,
    revoked_keys: keys,
    full_access_revoked: fullAccessRevoked,
    email,
  })
}

export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase()
  const key = (req.nextUrl.searchParams.get("key") || "").trim()
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

  const admin = getSupabaseAdmin()

  if (key === "all") {
    // Restaura tudo
    const { error } = await admin.from("revoked_products").delete().eq("customer_email", email)
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 })

    // E reseta access_revoked
    const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const target = (listed?.users || []).find((u) => u.email?.toLowerCase() === email)
    if (target) {
      await admin.auth.admin.updateUserById(target.id, {
        app_metadata: { ...target.app_metadata, access_revoked: false },
      })
    }
    return NextResponse.json({ ok: true, restored: "all" })
  } else if (key === "front") {
    // Restaura acesso completo (sem deletar revogações de bumps/upsells)
    const { error } = await admin.from("revoked_products").delete()
      .eq("customer_email", email).eq("product_key", "front")
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 })

    const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const target = (listed?.users || []).find((u) => u.email?.toLowerCase() === email)
    if (target) {
      await admin.auth.admin.updateUserById(target.id, {
        app_metadata: { ...target.app_metadata, access_revoked: false },
      })
    }
    return NextResponse.json({ ok: true, restored: "front" })
  } else if (VALID_KEYS.has(key)) {
    const { error } = await admin.from("revoked_products").delete()
      .eq("customer_email", email).eq("product_key", key)
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 })
    return NextResponse.json({ ok: true, restored: key })
  } else {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 })
  }
}
