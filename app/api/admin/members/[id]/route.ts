// API admin — detalhe de um membro com aulas/insignias desbloqueadas.
//
// GET /api/admin/members/[id]
// Retorna: meta básico + lista de insignias desbloqueadas (com timestamps),
// aulas/episódios completos, e xp_events agrupados.
//
// Uso: pra detectar reembolso de má fé — admin vê quanto conteúdo a pessoa
// realmente consumiu antes de pedir reembolso.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"
import { ACHIEVEMENTS } from "@/lib/achievements"

export const dynamic = "force-dynamic"

type SaleRow = { items: Array<{ key?: string; name?: string }> | null; sale_type: string | null; created_at: string }
type XpEventRow = { event_type: string; source_table: string | null; source_id: string | null; xp_delta: number; level_delta: number; created_at: string }

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const admin = getSupabaseAdmin()

  // 1) Auth user via API oficial
  const { data: gotUser, error: getErr } = await admin.auth.admin.getUserById(id)
  if (getErr || !gotUser?.user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  const target = gotUser.user
  const meta = (target.user_metadata || {}) as { full_name?: string; username?: string; avatar_url?: string; last_login_date?: string; unique_login_days?: number }

  // 2) Compras (stripe_sales) — produtos comprados de verdade + revoked_products
  // pra separar do que foi revogado (manual / refund / chargeback / dispute).
  // CRÍTICO: filtra stripe_sales por user_id (não email) — evita mostrar
  // testes antigos de email reuso. Migration adicionou user_id + triggers que
  // vinculam sales aos users via account_invites. revoked_products continua
  // por email (não tem user_id na tabela).
  const email = (target.email || "").toLowerCase()
  let sales: SaleRow[] = []
  let revokedKeys = new Set<string>()
  let frontRevoked = false
  if (email) {
    const [{ data: salesData }, { data: revokedData }] = await Promise.all([
      admin
        .from("stripe_sales")
        .select("items, sale_type, created_at, status, expires_at")
        .eq("user_id", target.id)
        .eq("status", "paid")
        .order("created_at", { ascending: true }),
      admin
        .from("revoked_products")
        .select("product_key")
        .eq("customer_email", email),
    ])
    sales = (salesData || []) as SaleRow[]
    revokedKeys = new Set(
      (revokedData || []).map((r) => (r as { product_key: string }).product_key)
    )
    frontRevoked = revokedKeys.has("front")
  }

  const ownedKeys = new Set<string>()
  const revokedOwnedKeys = new Set<string>()
  let hasFrontSale = false
  let frontExpiresAt: string | null = null
  let frontExpired = false
  const nowMs = Date.now()
  for (const s of sales) {
    const saleHasFront = (s.items || []).some(
      (it) => it?.key && it.key.replace(/__downsell$/, "") === "front",
    )
    if (saleHasFront) {
      hasFrontSale = true
      // Pega o maior expires_at entre todos os sales front do user
      const sExp = (s as SaleRow & { expires_at?: string | null }).expires_at
      if (sExp && (!frontExpiresAt || new Date(sExp).getTime() > new Date(frontExpiresAt).getTime())) {
        frontExpiresAt = sExp
      }
    }
    for (const it of s.items || []) {
      if (!it?.key) continue
      const clean = it.key.replace(/__downsell$/, "")
      if (clean === "front") continue // já tratado acima
      if (revokedKeys.has(clean)) {
        revokedOwnedKeys.add(clean)
      } else {
        ownedKeys.add(clean)
      }
    }
  }
  // Front expirado se expires_at existe E está no passado
  if (frontExpiresAt && new Date(frontExpiresAt).getTime() <= nowMs) {
    frontExpired = true
  }
  // hasFront = comprou front E não foi revogado E não expirou
  const targetAppMeta = (target.app_metadata || {}) as { access_revoked?: boolean }
  const hasFront = hasFrontSale && !frontRevoked && !frontExpired && targetAppMeta.access_revoked !== true

  // 3) xp_events — pra detectar aulas/insignias desbloqueadas
  const { data: events } = await admin
    .from("xp_events")
    .select("event_type, source_table, source_id, xp_delta, level_delta, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: true })
    .limit(1000)
  const evs = (events || []) as XpEventRow[]

  // Map: insignia_id → ach data + timestamp
  const insigniasMap = new Map<string, { ach: typeof ACHIEVEMENTS[number] | null; unlocked_at: string }>()
  for (const e of evs) {
    if (e.event_type === "insignia_aula" || e.event_type === "insignia_unlocked") {
      const id = e.source_id
      if (id && !insigniasMap.has(id)) {
        const ach = ACHIEVEMENTS.find((a) => a.id === id) || null
        insigniasMap.set(id, { ach, unlocked_at: e.created_at })
      }
    }
  }
  const insignias = Array.from(insigniasMap.entries()).map(([id, v]) => ({
    id,
    name: v.ach?.name || id,
    desc: v.ach?.desc || null,
    tier: v.ach?.tier || null,
    category: v.ach?.category || null,
    unlocked_at: v.unlocked_at,
  }))

  // 4) Comentários em episódios — fonte adicional pra detectar conteúdo consumido
  const { data: epComments } = await admin
    .from("episode_comments")
    .select("season_num, episode_num, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: true })

  // 5) Aggregates simples de atividade (pra dashboard)
  const eventsByType: Record<string, number> = {}
  for (const e of evs) eventsByType[e.event_type] = (eventsByType[e.event_type] || 0) + 1

  // 6) Counts paralelo
  const [
    { count: postCount },
    { count: replyCount },
    { count: funnelCount },
  ] = await Promise.all([
    admin.from("forum_posts").select("id", { count: "exact", head: true }).eq("user_id", id),
    admin.from("forum_replies").select("id", { count: "exact", head: true }).eq("user_id", id),
    admin.from("user_funnels").select("id", { count: "exact", head: true }).eq("user_id", id),
  ])

  return NextResponse.json({
    member: {
      id: target.id,
      email: target.email || "",
      full_name: meta.full_name || target.email?.split("@")[0] || "Miembro",
      username: meta.username || null,
      avatar_url: meta.avatar_url || null,
      member_since: target.created_at,
      last_login_date: meta.last_login_date || null,
      unique_login_days: meta.unique_login_days || 0,
    },
    purchases: {
      front: hasFront,
      front_revoked: hasFrontSale && (frontRevoked || targetAppMeta.access_revoked === true),
      front_expires_at: frontExpiresAt,
      front_expired: frontExpired,
      products: Array.from(ownedKeys),
      products_revoked: Array.from(revokedOwnedKeys),
      total_sales: sales.length,
      first_purchase_at: sales[0]?.created_at || null,
      last_purchase_at: sales[sales.length - 1]?.created_at || null,
    },
    insignias,                // todas insignias desbloqueadas (aulas + raras)
    episode_comments: epComments || [],  // qual episódio comentou (= viu)
    activity: {
      posts: postCount || 0,
      replies: replyCount || 0,
      funnels: funnelCount || 0,
      events_by_type: eventsByType,
      total_events: evs.length,
    },
  })
}
