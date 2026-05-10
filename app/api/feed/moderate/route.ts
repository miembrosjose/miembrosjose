
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { verifyDashboardAuth } from "@/lib/dashboard-auth"

// GET /api/feed/moderate?status=pending|approved|rejected|all
// Lista comentários pra moderação. Default: pending.
export async function GET(req: NextRequest) {
  const authError = await verifyDashboardAuth(req); if (authError) return authError

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") || "pending"
  const supabase = getSupabaseAdmin()

  let q = supabase
    .from("feed_comments")
    .select("id, video_id, instagram_handle, comment_text, status, is_pinned, created_at")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500)

  if (status !== "all") q = q.eq("status", status)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ comments: data ?? [] })
}

const IG_REGEX = /^(?!.*\.\.)(?!\.)(?!.*\.$)[A-Za-z0-9._]{1,30}$/

// POST /api/feed/moderate
// body:
//   { id, action: 'approve'|'reject'|'pin'|'unpin'|'delete' }  — ações sobre existente
//   { action: 'create', video_id, instagram_handle, comment_text }  — criar comentário manual (já aprovado)
export async function POST(req: NextRequest) {
  const authError = await verifyDashboardAuth(req); if (authError) return authError

  try {
    const body = await req.json()
    const action = typeof body.action === "string" ? body.action : ""

    // Criação manual pelo admin — sempre nasce aprovado
    if (action === "create") {
      const video_id = Number(body.video_id)
      const handleRaw = typeof body.instagram_handle === "string" ? body.instagram_handle : ""
      const text = typeof body.comment_text === "string" ? body.comment_text.trim() : ""
      const alsoLike = body.also_like !== false // default true se não vier
      const handle = handleRaw.trim().replace(/^@+/, "").toLowerCase()

      if (!Number.isInteger(video_id) || video_id < 1) {
        return NextResponse.json({ error: "video_id inválido" }, { status: 400 })
      }
      if (!handle || !IG_REGEX.test(handle)) {
        return NextResponse.json({ error: "@ de Instagram inválido" }, { status: 400 })
      }
      if (text.length < 2 || text.length > 500) {
        return NextResponse.json({ error: "Comentário muito curto ou muito longo" }, { status: 400 })
      }

      const supabase = getSupabaseAdmin()

      // session_id único por ação admin pra não colidir com unique constraint do like
      const adminSid = `admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

      const { data, error } = await supabase
        .from("feed_comments")
        .insert({
          video_id,
          session_id: adminSid,
          instagram_handle: handle,
          comment_text: text,
          status: "approved",
        })
        .select("id, video_id, instagram_handle, comment_text, status, is_pinned, created_at")
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Insere a curtida junto (opcional, default true) — ignora erro silencioso
      // pra não derrubar a criação do comentário se o like falhar
      if (alsoLike) {
        await supabase
          .from("feed_likes")
          .insert({ video_id, session_id: adminSid })
          .select()
          .maybeSingle()
      }

      return NextResponse.json({ ok: true, comment: data })
    }

    const id = typeof body.id === "string" ? body.id : ""
    if (!id || !["approve","reject","pin","unpin","delete"].includes(action)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    if (action === "delete") {
      const { error } = await supabase.from("feed_comments").delete().eq("id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    if (action === "approve" || action === "reject") {
      const { error } = await supabase
        .from("feed_comments")
        .update({ status: action === "approve" ? "approved" : "rejected" })
        .eq("id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    if (action === "pin" || action === "unpin") {
      // Pra pin: desfixa outros do mesmo vídeo antes
      if (action === "pin") {
        const { data: target } = await supabase
          .from("feed_comments")
          .select("video_id, status")
          .eq("id", id)
          .single()

        if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 })

        // Auto-aprova ao fixar
        await supabase
          .from("feed_comments")
          .update({ is_pinned: false })
          .eq("video_id", target.video_id)
          .eq("is_pinned", true)

        const { error } = await supabase
          .from("feed_comments")
          .update({ is_pinned: true, status: "approved" })
          .eq("id", id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      } else {
        const { error } = await supabase
          .from("feed_comments")
          .update({ is_pinned: false })
          .eq("id", id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
