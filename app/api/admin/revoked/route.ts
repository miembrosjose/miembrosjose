// API admin — lista users que perderam acesso (manual ou refund automático).
//
// GET /api/admin/revoked
// Retorna lista agregada por email: cada email tem array de produtos
// revogados + flag full_access_revoked + history.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

type RevokedRow = {
  id: string
  customer_email: string
  product_key: string
  reason: string | null
  source: string
  source_ref: string | null
  revoked_at: string
  notes: string | null
}

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const admin = getSupabaseAdmin()

  // 1) Pega todas as revogações (revoked_products)
  const { data, error } = await admin
    .from("revoked_products")
    .select("id, customer_email, product_key, reason, source, source_ref, revoked_at, notes")
    .order("revoked_at", { ascending: false })
    .limit(500)

  if (error) {
    console.error("[/api/admin/revoked]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  // 2) Agrupa por email
  const byEmail = new Map<string, {
    email: string
    products: { key: string; reason: string | null; source: string; revoked_at: string; notes: string | null }[]
    has_front: boolean
    last_revoked_at: string
  }>()

  for (const r of (data || []) as RevokedRow[]) {
    const email = r.customer_email.toLowerCase()
    if (!byEmail.has(email)) {
      byEmail.set(email, { email, products: [], has_front: false, last_revoked_at: r.revoked_at })
    }
    const entry = byEmail.get(email)!
    entry.products.push({
      key: r.product_key,
      reason: r.reason,
      source: r.source,
      revoked_at: r.revoked_at,
      notes: r.notes,
    })
    if (r.product_key === "front") entry.has_front = true
    if (r.revoked_at > entry.last_revoked_at) entry.last_revoked_at = r.revoked_at
  }

  // 3) Hidrata com user info (full_name, avatar) + access_revoked do app_metadata
  const emails = Array.from(byEmail.keys())
  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const usersByEmail = new Map<string, { id: string; full_name: string; avatar_url: string | null; access_revoked: boolean }>()
  for (const u of listed?.users || []) {
    const e = u.email?.toLowerCase() || ""
    if (!e) continue
    const meta = (u.user_metadata || {}) as { full_name?: string; avatar_url?: string }
    const appMeta = (u.app_metadata || {}) as { access_revoked?: boolean }
    usersByEmail.set(e, {
      id: u.id,
      full_name: meta.full_name || e.split("@")[0],
      avatar_url: typeof meta.avatar_url === "string" ? meta.avatar_url : null,
      access_revoked: appMeta.access_revoked === true,
    })
  }

  const items = emails.map((email) => {
    const entry = byEmail.get(email)!
    const u = usersByEmail.get(email) || null
    return {
      email,
      user_id: u?.id || null,
      full_name: u?.full_name || email.split("@")[0],
      avatar_url: u?.avatar_url || null,
      full_access_revoked: u?.access_revoked === true,
      products: entry.products,
      product_count: entry.products.length,
      has_front: entry.has_front,
      last_revoked_at: entry.last_revoked_at,
    }
  })

  // Ordena: full_access_revoked primeiro, depois mais recente
  items.sort((a, b) => {
    if (a.full_access_revoked !== b.full_access_revoked) return a.full_access_revoked ? -1 : 1
    return b.last_revoked_at.localeCompare(a.last_revoked_at)
  })

  return NextResponse.json({ items, total: items.length })
}
