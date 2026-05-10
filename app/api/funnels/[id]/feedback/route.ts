// API — feedback (comentário) em funnel.
//
// GET    /api/funnels/[id]/feedback                   → lista feedbacks do funnel
// POST   /api/funnels/[id]/feedback                   → cria feedback { body }
// DELETE /api/funnels/[id]/feedback?fid=xxx           → admin deleta feedback

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"
// Snapshot author_is_admin é feito via isAdmin(user) no insert.

export const dynamic = "force-dynamic"

const BODY_MAX = 2000

function buildAvatarLetters(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "??"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data, error } = await supabase
    .from("funnel_feedbacks")
    .select("id, user_id, parent_id, author_name, author_username, author_avatar, author_avatar_url, author_badge_id, author_star_id, author_flame_id, author_avatar_border, author_is_admin, body, created_at")
    .eq("funnel_id", id)
    .order("created_at", { ascending: true })
    .limit(500)
  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json({ feedbacks: data || [] })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { body?: string; parent_id?: string | null }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const text = (body.body || "").trim()
  if (!text || text.length > BODY_MAX) return NextResponse.json({ error: "Texto inválido" }, { status: 400 })

  // Reply: parent_id deve ser de feedback do MESMO funnel (segurança).
  // Threading 1 nível: parent não pode ser reply (replies não têm replies).
  let parentId: string | null = null
  if (body.parent_id) {
    const { data: parent } = await supabase
      .from("funnel_feedbacks")
      .select("id, parent_id, funnel_id")
      .eq("id", body.parent_id)
      .limit(1)
      .maybeSingle()
    if (!parent || (parent as { funnel_id: string }).funnel_id !== id) {
      return NextResponse.json({ error: "Parent feedback inválido" }, { status: 400 })
    }
    if ((parent as { parent_id: string | null }).parent_id) {
      return NextResponse.json({ error: "No se pueden responder respuestas (1 nivel solamente)" }, { status: 400 })
    }
    parentId = (parent as { id: string }).id
  }

  const meta = (user.user_metadata || {}) as {
    full_name?: string
    name?: string
    avatar_url?: string
    username?: string
    featured_badge_id?: string | null
    featured_star_id?: string | null
    featured_flame_id?: string | null
    avatar_border_color?: string | null
  }
  const authorName = meta.full_name || meta.name || (user.email ? user.email.split("@")[0] : "Miembro")
  const authorUsername = (typeof meta.username === "string" && meta.username) || null
  const authorAvatar = buildAvatarLetters(authorName)
  const authorAvatarUrl = (typeof meta.avatar_url === "string" && meta.avatar_url) || null
  const authorAvatarBorder = (typeof meta.avatar_border_color === "string" && meta.avatar_border_color) || null
  // Respeita a escolha em /perfil. Fallback: admin → admin_seal, outros → welcome.
  const chosenBadge = (typeof meta.featured_badge_id === "string" && meta.featured_badge_id) || null
  const authorBadgeId = chosenBadge || (isAdmin(user) ? "admin_seal" : "welcome")
  const authorStarId =
    (typeof meta.featured_star_id === "string" && meta.featured_star_id) || null
  const authorFlameId =
    (typeof meta.featured_flame_id === "string" && meta.featured_flame_id) || null

  const { data, error } = await supabase
    .from("funnel_feedbacks")
    .insert({
      funnel_id: id,
      user_id: user.id,
      parent_id: parentId,
      author_name: authorName,
      author_username: authorUsername,
      author_avatar: authorAvatar,
      author_avatar_url: authorAvatarUrl,
      author_badge_id: authorBadgeId,
      author_star_id: authorStarId,
      author_flame_id: authorFlameId,
      author_avatar_border: authorAvatarBorder,
      author_is_admin: isAdmin(user),
      body: text,
    })
    .select("id, user_id, parent_id, author_name, author_username, author_avatar, author_avatar_url, author_badge_id, author_star_id, author_flame_id, author_avatar_border, author_is_admin, body, created_at")
    .single()
  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json({ feedback: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const fid = req.nextUrl.searchParams.get("fid")
  if (!fid) return NextResponse.json({ error: "fid required" }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { error } = await admin.from("funnel_feedbacks").delete().eq("id", fid)
  if (error) return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  return NextResponse.json({ ok: true })
}
