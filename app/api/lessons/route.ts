// GET  /api/lessons?sort=recent|popular&tag=<tag>
//      Lista lessões aprovadas. Filtros opcionais.
//
// POST /api/lessons
//      Cria nova lessão (vai pra fila de aprovação).
//      Body: { title, description?, video_url, tags? }

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

const MAX_TITLE = 120
const MAX_DESC = 1000
const MAX_TAGS = 5
const MAX_TAG_LEN = 24

type LessonRow = {
  id: string
  user_id: string
  title: string
  description: string | null
  video_url: string
  tags: string[]
  likes_count: number
  dislikes_count: number
  views_count: number
  created_at: string
}

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const sort = req.nextUrl.searchParams.get("sort") || "recent"
  const tag = (req.nextUrl.searchParams.get("tag") || "").trim().toLowerCase()
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "60", 10), 100)

  const admin = getSupabaseAdmin()

  let q = admin
    .from("member_lessons")
    .select("id, user_id, title, description, video_url, tags, likes_count, dislikes_count, views_count, created_at")
    .eq("approved", true)
    .limit(limit)

  if (sort === "popular") {
    q = q.order("likes_count", { ascending: false }).order("created_at", { ascending: false })
  } else {
    q = q.order("created_at", { ascending: false })
  }

  if (tag) {
    q = q.contains("tags", [tag])
  }

  const { data: lessons, error } = await q

  if (error) {
    console.error("[/api/lessons GET]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  // Enriquecer com dados dos autores + viewer's like state
  const userIds = Array.from(new Set((lessons || []).map((l) => l.user_id)))
  const lessonIds = (lessons || []).map((l) => l.id)

  const [{ data: listed }, { data: viewerVotes }] = await Promise.all([
    userIds.length > 0
      ? admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      : Promise.resolve({ data: { users: [] } } as { data: { users: Array<{ id: string; email: string | null; user_metadata: Record<string, unknown> | null; app_metadata: Record<string, unknown> | null }> } }),
    lessonIds.length > 0
      ? admin
          .from("member_lesson_likes")
          .select("lesson_id, vote")
          .eq("user_id", user.id)
          .in("lesson_id", lessonIds)
      : Promise.resolve({ data: [] as Array<{ lesson_id: string; vote: string }> }),
  ])

  const userMap: Record<string, { full_name: string; username: string | null; avatar_url: string | null; featured_badge_id: string | null; is_admin: boolean }> = {}
  for (const u of listed?.users || []) {
    if (!userIds.includes(u.id)) continue
    const meta = (u.user_metadata || {}) as { full_name?: string; name?: string; username?: string; avatar_url?: string; featured_badge_id?: string }
    const isAdmin = (u.app_metadata as { is_admin?: boolean } | undefined)?.is_admin === true
    userMap[u.id] = {
      full_name: meta.full_name || meta.name || u.email?.split("@")[0] || "Miembro",
      username: meta.username || null,
      avatar_url: meta.avatar_url || null,
      featured_badge_id: isAdmin ? "admin_seal" : meta.featured_badge_id || "welcome",
      is_admin: isAdmin,
    }
  }

  const voteByLesson = new Map<string, "like" | "dislike">()
  for (const r of viewerVotes || []) {
    if (r.vote === "like" || r.vote === "dislike") {
      voteByLesson.set(r.lesson_id, r.vote)
    }
  }

  return NextResponse.json({
    lessons: (lessons || []).map((l: LessonRow) => ({
      ...l,
      author: userMap[l.user_id] || { full_name: "Miembro", username: null, avatar_url: null, featured_badge_id: null, is_admin: false },
      viewer_vote: voteByLesson.get(l.id) || null,
    })),
  })
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  // Rate limit: 5 publicações / hora por user (aprovação manual filtra spam,
  // mas evita queue inundada)
  const rl = await checkRateLimit("lesson-create", user.id, 5, 3600)
  if (!rl.allowed) return rateLimitResponse(rl) as NextResponse

  let body: { title?: string; description?: string; video_url?: string; tags?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const title = (body.title || "").trim()
  const description = (body.description || "").trim() || null
  const videoUrl = (body.video_url || "").trim()
  const rawTags = Array.isArray(body.tags) ? body.tags : []

  if (!title) return NextResponse.json({ error: "Título obligatorio" }, { status: 400 })
  if (title.length > MAX_TITLE) return NextResponse.json({ error: `Título máximo ${MAX_TITLE} caracteres` }, { status: 400 })
  if (description && description.length > MAX_DESC) return NextResponse.json({ error: `Descripción máximo ${MAX_DESC} caracteres` }, { status: 400 })
  if (!videoUrl) return NextResponse.json({ error: "Video obligatorio" }, { status: 400 })

  // Normalizar tags: lowercase, sem #, sem espaços extras, único
  const tags = Array.from(
    new Set(
      rawTags
        .map((t) => String(t).trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-"))
        .filter((t) => t.length > 0 && t.length <= MAX_TAG_LEN)
    ),
  ).slice(0, MAX_TAGS)

  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from("member_lessons")
    .insert({
      user_id: user.id,
      title,
      description,
      video_url: videoUrl,
      tags,
      approved: false,
    })
    .select("id, created_at")
    .single()

  if (error) {
    console.error("[/api/lessons POST]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    id: data.id,
    message: "Tu lección está en revisión. La publicaremos en breve.",
  })
}
