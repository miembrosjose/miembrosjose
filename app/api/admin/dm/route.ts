// API admin — leitura de mensagens diretas pra moderação.
//
// GET /api/admin/dm
//   Sem params: lista threads recentes (top 100 pares com última mensagem).
//   ?with_a=<userId>&with_b=<userId>: mensagens entre A e B (qualquer direção).
//
// Acesso: somente is_admin via app_metadata.
// Admin lê via service_role (bypassa RLS).

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const a = req.nextUrl.searchParams.get("with_a")
  const b = req.nextUrl.searchParams.get("with_b")
  const admin = getSupabaseAdmin()

  // Modo conversa específica
  if (a && b) {
    const { data, error } = await admin
      .from("direct_messages")
      .select("id, sender_id, recipient_id, body, media_url, media_type, created_at, read_at, edited_at, deleted_at")
      .or(
        `and(sender_id.eq.${a},recipient_id.eq.${b}),` +
          `and(sender_id.eq.${b},recipient_id.eq.${a})`,
      )
      .order("created_at", { ascending: true })
      .limit(500)
    if (error) {
      console.error("[/api/admin/dm thread]", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
    return NextResponse.json({ messages: data || [] })
  }

  // Modo lista de threads recentes — pega últimas 1000 msgs e agrupa por par
  const { data: msgs, error } = await admin
    .from("direct_messages")
    .select("id, sender_id, recipient_id, body, media_url, media_type, created_at")
    .order("created_at", { ascending: false })
    .limit(1000)

  if (error) {
    console.error("[/api/admin/dm list]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  type Pair = {
    user_a: string
    user_b: string
    last_message_at: string
    last_message_body: string | null
    last_message_media_type: string | null
    total_messages: number
  }

  const byPair = new Map<string, Pair>()
  for (const m of msgs || []) {
    const a = m.sender_id < m.recipient_id ? m.sender_id : m.recipient_id
    const b = m.sender_id < m.recipient_id ? m.recipient_id : m.sender_id
    const key = `${a}|${b}`
    const existing = byPair.get(key)
    if (!existing) {
      byPair.set(key, {
        user_a: a,
        user_b: b,
        last_message_at: m.created_at,
        last_message_body: m.body,
        last_message_media_type: m.media_type,
        total_messages: 1,
      })
    } else {
      existing.total_messages += 1
    }
  }

  const pairs = Array.from(byPair.values())
    .sort((x, y) => y.last_message_at.localeCompare(x.last_message_at))
    .slice(0, 100)

  // Enriquecer com nomes
  const allIds = new Set<string>()
  for (const p of pairs) {
    allIds.add(p.user_a)
    allIds.add(p.user_b)
  }
  const usersById: Record<string, { full_name: string; avatar_url: string | null; is_admin: boolean }> = {}
  try {
    const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    for (const u of listed?.users || []) {
      if (!allIds.has(u.id)) continue
      const meta = (u.user_metadata || {}) as { full_name?: string; name?: string; avatar_url?: string }
      usersById[u.id] = {
        full_name: meta.full_name || meta.name || u.email?.split("@")[0] || "Miembro",
        avatar_url: meta.avatar_url || null,
        is_admin: (u.app_metadata as { is_admin?: boolean } | undefined)?.is_admin === true,
      }
    }
  } catch {
    // ignora — front lida com fallback
  }

  return NextResponse.json({
    threads: pairs.map((p) => ({
      ...p,
      user_a_info: usersById[p.user_a] || { full_name: "Miembro", avatar_url: null, is_admin: false },
      user_b_info: usersById[p.user_b] || { full_name: "Miembro", avatar_url: null, is_admin: false },
    })),
  })
}

// DELETE /api/admin/dm/<message_id> — remove mensagem (soft delete)
export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const messageId = req.nextUrl.searchParams.get("id")
  if (!messageId) return NextResponse.json({ error: "id required" }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { error } = await admin
    .from("direct_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId)

  if (error) {
    console.error("[/api/admin/dm DELETE]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
