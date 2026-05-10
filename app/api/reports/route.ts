// API — qualquer member reporta uma interação.
//
// POST /api/reports
//   Body: { target_type, target_id, reason_category, message }
//
// Server preenche target_user_id e target_snapshot consultando a tabela
// correspondente (forum_posts, forum_replies, etc) — pra admin ter contexto
// mesmo se o author deletar o conteúdo depois.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

const VALID_TYPES = new Set([
  "forum_post", "forum_reply", "episode_comment",
  "funnel", "funnel_feedback", "user",
])
const VALID_CATEGORIES = new Set([
  "spam", "inappropriate", "harassment", "offensive",
  "misleading", "copyright", "other",
])

type SnapshotResult = { user_id: string | null; snapshot: Record<string, unknown> | null }

async function fetchTargetSnapshot(targetType: string, targetId: string): Promise<SnapshotResult> {
  const admin = getSupabaseAdmin()
  try {
    if (targetType === "forum_post") {
      const { data } = await admin.from("forum_posts").select("user_id, title, body, created_at").eq("id", targetId).maybeSingle()
      if (!data) return { user_id: null, snapshot: null }
      return { user_id: (data as { user_id: string }).user_id, snapshot: data as Record<string, unknown> }
    }
    if (targetType === "forum_reply") {
      const { data } = await admin.from("forum_replies").select("user_id, body, post_id, created_at").eq("id", targetId).maybeSingle()
      if (!data) return { user_id: null, snapshot: null }
      return { user_id: (data as { user_id: string }).user_id, snapshot: data as Record<string, unknown> }
    }
    if (targetType === "episode_comment") {
      const { data } = await admin.from("episode_comments").select("user_id, body, season_num, episode_num, created_at").eq("id", targetId).maybeSingle()
      if (!data) return { user_id: null, snapshot: null }
      return { user_id: (data as { user_id: string }).user_id, snapshot: data as Record<string, unknown> }
    }
    if (targetType === "funnel") {
      const { data } = await admin.from("user_funnels").select("user_id, name, niche, url, image_url, created_at").eq("id", targetId).maybeSingle()
      if (!data) return { user_id: null, snapshot: null }
      return { user_id: (data as { user_id: string }).user_id, snapshot: data as Record<string, unknown> }
    }
    if (targetType === "funnel_feedback") {
      const { data } = await admin.from("funnel_feedbacks").select("user_id, body, funnel_id, created_at").eq("id", targetId).maybeSingle()
      if (!data) return { user_id: null, snapshot: null }
      return { user_id: (data as { user_id: string }).user_id, snapshot: data as Record<string, unknown> }
    }
    if (targetType === "user") {
      // target_id é o uuid do user reportado
      return { user_id: targetId, snapshot: null }
    }
  } catch {}
  return { user_id: null, snapshot: null }
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { target_type?: string; target_id?: string; reason_category?: string; message?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const target_type = (body.target_type || "").trim()
  const target_id = (body.target_id || "").trim()
  const reason_category = (body.reason_category || "").trim()
  const message = (body.message || "").trim()

  if (!VALID_TYPES.has(target_type)) return NextResponse.json({ error: "target_type inválido" }, { status: 400 })
  if (!target_id) return NextResponse.json({ error: "target_id obligatorio" }, { status: 400 })
  if (!VALID_CATEGORIES.has(reason_category)) return NextResponse.json({ error: "categoría inválida" }, { status: 400 })
  if (!message || message.length > 2000) return NextResponse.json({ error: "Mensaje obligatorio (máx 2000)" }, { status: 400 })

  // Não pode reportar a si mesmo
  if (target_type === "user" && target_id === user.id) {
    return NextResponse.json({ error: "No puedes reportarte a ti mismo" }, { status: 400 })
  }

  const { user_id: target_user_id, snapshot } = await fetchTargetSnapshot(target_type, target_id)

  // Não pode reportar o próprio conteúdo
  if (target_user_id && target_user_id === user.id) {
    return NextResponse.json({ error: "No puedes reportar tu propio contenido" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const { error } = await admin.from("user_reports").insert({
    reporter_id: user.id,
    target_type,
    target_id,
    target_user_id,
    reason_category,
    message,
    target_snapshot: snapshot,
  })
  if (error) {
    // Detecta unique violation (já reportou pending) → 409
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ya reportaste este contenido. Esperá la revisión del admin." }, { status: 409 })
    }
    console.error("[/api/reports POST]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
