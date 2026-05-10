// GET /api/dm/threads
//
// Retorna lista de threads (1 por par de users com quem o user atual conversou).
// Cada thread inclui: outro user (id, nome, avatar, badges, online), última msg,
// unread count, last_message_at pra ordenação.
//
// Implementação: como Supabase não tem facilidade pra group by pair, fazemos
// 1 query buscando todas msgs do user (sender ou recipient), depois agrupamos
// em memória pelo "outro user". Pra escala atual (centenas a poucos milhares
// de msgs por user) é OK. Se virar bottleneck, otimização: materialized view
// `direct_message_threads` atualizada via trigger.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

type DMRow = {
  id: string
  sender_id: string
  recipient_id: string
  body: string | null
  media_url: string | null
  media_type: string | null
  created_at: string
  read_at: string | null
}

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const admin = getSupabaseAdmin()

  // Pega todas mensagens onde user é sender ou recipient (limit 2k pra cobrir
  // histórico extenso sem matar a query — usuário ativo que extrapolar 2k pode
  // continuar conversando, só não vai ver thread inicial)
  const { data: msgs, error } = await admin
    .from("direct_messages")
    .select("id, sender_id, recipient_id, body, media_url, media_type, created_at, read_at")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(2000)

  if (error) {
    console.error("[/api/dm/threads] query", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  type ThreadAgg = {
    other_user_id: string
    last_message_id: string
    last_message_body: string | null
    last_message_media_type: string | null
    last_message_at: string
    last_message_from_self: boolean
    unread_count: number
  }

  const byOther = new Map<string, ThreadAgg>()
  for (const m of (msgs || []) as DMRow[]) {
    const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id
    const existing = byOther.get(otherId)
    if (!existing) {
      byOther.set(otherId, {
        other_user_id: otherId,
        last_message_id: m.id,
        last_message_body: m.body,
        last_message_media_type: m.media_type,
        last_message_at: m.created_at,
        last_message_from_self: m.sender_id === user.id,
        unread_count: m.recipient_id === user.id && !m.read_at ? 1 : 0,
      })
    } else {
      // Já tenho a mais recente (ordenei desc); só conta unread
      if (m.recipient_id === user.id && !m.read_at) {
        existing.unread_count += 1
      }
    }
  }

  const threads = Array.from(byOther.values()).sort(
    (a, b) => b.last_message_at.localeCompare(a.last_message_at),
  )

  // Enriquecer com dados dos outros users (nome, avatar, badges)
  const otherIds = threads.map((t) => t.other_user_id)
  const usersById: Record<string, {
    full_name: string
    username: string | null
    avatar_url: string | null
    featured_badge_id: string | null
    is_admin: boolean
  }> = {}

  if (otherIds.length > 0) {
    // listUsers com perPage alto pra pegar todos. Em escala, paginar.
    try {
      const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const idSet = new Set(otherIds)
      for (const u of listed?.users || []) {
        if (!idSet.has(u.id)) continue
        const meta = (u.user_metadata || {}) as {
          full_name?: string
          name?: string
          username?: string
          avatar_url?: string
          featured_badge_id?: string
        }
        const isAdmin = (u.app_metadata as { is_admin?: boolean } | undefined)?.is_admin === true
        usersById[u.id] = {
          full_name: meta.full_name || meta.name || u.email?.split("@")[0] || "Miembro",
          username: meta.username || null,
          avatar_url: meta.avatar_url || null,
          featured_badge_id: isAdmin ? "admin_seal" : meta.featured_badge_id || "welcome",
          is_admin: isAdmin,
        }
      }
    } catch (e) {
      console.warn("[/api/dm/threads] listUsers", e)
    }
  }

  return NextResponse.json({
    threads: threads.map((t) => ({
      ...t,
      other_user: usersById[t.other_user_id] || {
        full_name: "Miembro",
        username: null,
        avatar_url: null,
        featured_badge_id: null,
        is_admin: false,
      },
    })),
  })
}
