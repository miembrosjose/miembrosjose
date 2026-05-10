// API admin — lista todos os membros com último acesso, level, posts, insignias.
//
// GET /api/admin/members?limit=200
//   Retorna lista ordenada por last_login_date desc.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"
import { computeLevel, applyAdminLevelOverride } from "@/lib/xp"

export const dynamic = "force-dynamic"

type AuthUser = {
  id: string
  email: string
  raw_user_meta_data: Record<string, unknown> | null
  created_at: string
}

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const limit = Math.min(parseInt(new URL(req.url).searchParams.get("limit") || "200", 10), 500)

  const admin = getSupabaseAdmin()

  // Usa o endpoint oficial /auth/admin/users (lista TODOS auth.users via service_role).
  // O hack .schema("auth").from("users") falha silenciosamente em produção
  // dependendo de grants e versão da REST do PostgREST.
  const { data: listed, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: limit,
  })
  if (listErr) {
    console.error("[/api/admin/members] auth.admin.listUsers", listErr)
    return NextResponse.json({ error: "Failed to list users", details: listErr.message }, { status: 500 })
  }

  // Normaliza pro shape AuthUser (mapeando campos camelCase → snake_case
  // pra coerência com o resto do código que já consumia .raw_user_meta_data)
  const usersList: AuthUser[] = (listed?.users || []).map((u) => ({
    id: u.id,
    email: u.email || "",
    raw_user_meta_data: (u.user_metadata || {}) as Record<string, unknown>,
    created_at: u.created_at,
  }))
  // Admins precisam ser sinalizados pra aplicar override LV 999 / 999.999 XP
  const adminIds = new Set<string>()
  for (const u of listed?.users || []) {
    if ((u.app_metadata as { is_admin?: boolean } | undefined)?.is_admin === true) {
      adminIds.add(u.id)
    }
  }
  // Ordena por created_at desc (mais novo primeiro)
  usersList.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
  const ids = usersList.map((u) => u.id)

  // XP de todos
  const { data: xpRows } = await admin
    .from("user_xp")
    .select("user_id, total_xp, bonus_levels")
    .in("user_id", ids)
  const xpMap = new Map<string, { total_xp: number; bonus_levels: number }>()
  for (const x of xpRows || []) xpMap.set(x.user_id, { total_xp: x.total_xp || 0, bonus_levels: x.bonus_levels || 0 })

  // Posts count por user
  const { data: postRows } = await admin
    .from("forum_posts")
    .select("user_id")
    .in("user_id", ids)
  const postCountMap = new Map<string, number>()
  for (const p of postRows || []) postCountMap.set(p.user_id, (postCountMap.get(p.user_id) || 0) + 1)

  // Compras (stripe_sales) — produtos owned + revoked_products pra filtrar.
  // CRÍTICO: filtra stripe_sales por user_id (não customer_email) — esse era
  // o mesmo bug que /api/profile/owned-products tinha. Email reuso de testes
  // antigos mostrava produtos errados pro admin. Migration adicionou user_id
  // + triggers que vinculam sales aos users via account_invites.
  // revoked_products continua por email (não tem user_id na tabela).
  const emails = usersList.map((u) => u.email.toLowerCase())
  const [{ data: salesRows }, { data: revokedRows }] = await Promise.all([
    admin
      .from("stripe_sales")
      .select("user_id, items, sale_type, created_at, expires_at")
      .in("user_id", ids)
      .eq("status", "paid"),
    admin
      .from("revoked_products")
      .select("customer_email, product_key")
      .in("customer_email", emails),
  ])

  // Set de keys revogadas por email (manual + refund/dispute automático)
  const revokedByEmail = new Map<string, Set<string>>()
  for (const r of revokedRows || []) {
    const e = (r as { customer_email: string }).customer_email
    const k = (r as { product_key: string }).product_key
    if (!revokedByEmail.has(e)) revokedByEmail.set(e, new Set())
    revokedByEmail.get(e)!.add(k)
  }

  // Map id → email pra cruzar com revokedByEmail (que usa email)
  const emailByUserId = new Map<string, string>()
  for (const u of usersList) emailByUserId.set(u.id, u.email.toLowerCase())

  const productsByUserId = new Map<string, string[]>()
  const revokedByUserId = new Map<string, string[]>()
  // Maior expires_at do FRONT por user (pra mostrar prazo no painel admin)
  const frontExpiresByUserId = new Map<string, string>()
  for (const s of salesRows || []) {
    const userId = (s as { user_id: string | null }).user_id
    if (!userId) continue // sales orphan (sem conta vinculada) — pula
    const email = emailByUserId.get(userId) || ""
    const items = (s.items as Array<{ key?: string; name?: string }>) || []
    const revokedSet = revokedByEmail.get(email) || new Set<string>()
    const owned = productsByUserId.get(userId) || []
    const revoked = revokedByUserId.get(userId) || []

    // Detecta se esse sale tem front e atualiza maior expires_at
    const sExp = (s as { expires_at?: string | null }).expires_at
    const saleHasFront = items.some((it) => it.key && it.key.replace(/__downsell$/, "") === "front")
    if (saleHasFront && sExp) {
      const current = frontExpiresByUserId.get(userId)
      if (!current || new Date(sExp).getTime() > new Date(current).getTime()) {
        frontExpiresByUserId.set(userId, sExp)
      }
    }

    for (const it of items) {
      if (!it.key) continue
      const clean = it.key.replace(/__downsell$/, "")
      if (revokedSet.has(clean)) {
        if (!revoked.includes(clean)) revoked.push(clean)
      } else {
        if (!owned.includes(clean)) owned.push(clean)
      }
    }
    productsByUserId.set(userId, owned)
    revokedByUserId.set(userId, revoked)
  }

  const enriched = usersList.map((u) => {
    const meta = (u.raw_user_meta_data || {}) as {
      full_name?: string
      username?: string
      avatar_url?: string
      last_login_date?: string
      unique_login_days?: number
      welcome_broadcasted?: boolean
    }
    const xp = xpMap.get(u.id) || { total_xp: 0, bonus_levels: 0 }
    const lvInfo = applyAdminLevelOverride(
      computeLevel(xp.total_xp, xp.bonus_levels),
      adminIds.has(u.id),
    )
    const postCount = postCountMap.get(u.id) || 0
    return {
      id: u.id,
      email: u.email,
      full_name: meta.full_name || u.email.split("@")[0],
      username: meta.username || null,
      avatar_url: meta.avatar_url || null,
      member_since: u.created_at,
      last_login_date: meta.last_login_date || null,
      unique_login_days: meta.unique_login_days || 0,
      level: lvInfo.level,
      total_xp: lvInfo.total_xp,
      post_count: postCount,
      products: productsByUserId.get(u.id) || [],
      products_revoked: revokedByUserId.get(u.id) || [],
      front_expires_at: frontExpiresByUserId.get(u.id) || null,
      welcome_broadcasted: meta.welcome_broadcasted === true,
    }
  })

  return NextResponse.json({ members: enriched })
}
