// GET /api/members
//   Lista todos os miembros ativos (público pra qualquer member logado).
//   Sem email — só dados públicos (nome, username, avatar, level, badges).
//
// Query params:
//   ?limit=N (default 500, max 1000)
//   ?sort=recent|level|name (default recent = created_at desc)

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { computeLevel, applyAdminLevelOverride } from "@/lib/xp"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "500", 10), 1000)
  const sort = req.nextUrl.searchParams.get("sort") || "recent"

  const admin = getSupabaseAdmin()

  // Lista users via Supabase Auth admin (sempre via service_role)
  const { data: listed, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: limit,
  })
  if (listErr) {
    console.error("[/api/members] listUsers", listErr)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const users = (listed?.users || []).filter((u) => {
    if (!u.email) return false                                              // só com email = miembro real
    const appMeta = (u.app_metadata || {}) as { access_revoked?: boolean }
    if (appMeta.access_revoked === true) return false                       // esconde users com acesso revogado (refund/dispute/manual)
    return true
  })
  const userIds = users.map((u) => u.id)

  // XP de todos
  const { data: xpRows } = await admin
    .from("user_xp")
    .select("user_id, total_xp, bonus_levels")
    .in("user_id", userIds)
  const xpMap = new Map<string, { total_xp: number; bonus_levels: number }>()
  for (const x of xpRows || []) {
    xpMap.set(x.user_id, { total_xp: x.total_xp || 0, bonus_levels: x.bonus_levels || 0 })
  }

  const enriched = users.map((u) => {
    const meta = (u.user_metadata || {}) as {
      full_name?: string
      name?: string
      username?: string
      avatar_url?: string
      featured_badge_id?: string | null
      featured_star_id?: string | null
      featured_flame_id?: string | null
    }
    const isAdmin = (u.app_metadata as { is_admin?: boolean } | undefined)?.is_admin === true
    const xp = xpMap.get(u.id) || { total_xp: 0, bonus_levels: 0 }
    const lvInfo = applyAdminLevelOverride(
      computeLevel(xp.total_xp, xp.bonus_levels),
      isAdmin,
    )
    const fullName = meta.full_name || meta.name || u.email?.split("@")[0] || "Miembro"
    return {
      id: u.id,
      full_name: fullName,
      username: meta.username || null,
      avatar_url: meta.avatar_url || null,
      featured_badge_id: isAdmin ? "admin_seal" : meta.featured_badge_id || "welcome",
      featured_star_id: meta.featured_star_id || null,
      featured_flame_id: meta.featured_flame_id || null,
      is_admin: isAdmin,
      level: lvInfo.level,
      total_xp: lvInfo.total_xp,
      member_since: u.created_at,
    }
  })

  // Ordenar
  if (sort === "level") {
    enriched.sort((a, b) => b.total_xp - a.total_xp)
  } else if (sort === "name") {
    enriched.sort((a, b) => a.full_name.localeCompare(b.full_name, "es-419"))
  } else {
    // recent: created_at desc
    enriched.sort((a, b) => (b.member_since || "").localeCompare(a.member_since || ""))
  }

  return NextResponse.json({ members: enriched, total: enriched.length })
}
