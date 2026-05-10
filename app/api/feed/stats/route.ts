
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

// GET /api/feed/stats?video_ids=1,2,3&session_id=xxx
//
// Retorna:
// {
//   likes: { "1": 47, "2": 12 },
//   userLiked: { "1": true, "2": false },
//   comments: { "1": [ ... ] }   // aprovados + os próprios pending do usuário
// }
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const videoIdsParam = searchParams.get("video_ids") || ""
    const session_id = (searchParams.get("session_id") || "").slice(0, 100)

    const video_ids = videoIdsParam
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isInteger(v) && v >= 1)
      .slice(0, 20) // cap de segurança

    if (video_ids.length === 0) {
      return NextResponse.json({ likes: {}, userLiked: {}, comments: {} })
    }

    const supabase = getSupabaseAdmin()

    // 1) Conta curtidas por vídeo (uma query só agrupada)
    const { data: allLikes } = await supabase
      .from("feed_likes")
      .select("video_id, session_id")
      .in("video_id", video_ids)

    const likes: Record<string, number> = {}
    const userLiked: Record<string, boolean> = {}
    for (const id of video_ids) {
      likes[String(id)] = 0
      userLiked[String(id)] = false
    }
    for (const row of allLikes ?? []) {
      const k = String(row.video_id)
      likes[k] = (likes[k] ?? 0) + 1
      if (session_id && row.session_id === session_id) {
        userLiked[k] = true
      }
    }

    // 2) Comentários: aprovados + os próprios do usuário (qualquer status ≠ rejected)
    const { data: approved } = await supabase
      .from("feed_comments")
      .select("id, video_id, instagram_handle, comment_text, status, is_pinned, created_at")
      .in("video_id", video_ids)
      .eq("status", "approved")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })

    let ownPending: typeof approved = []
    const userHasCommented: Record<string, boolean> = {}
    for (const id of video_ids) userHasCommented[String(id)] = false

    if (session_id) {
      const { data } = await supabase
        .from("feed_comments")
        .select("id, video_id, instagram_handle, comment_text, status, is_pinned, created_at")
        .in("video_id", video_ids)
        .eq("session_id", session_id)
        .neq("status", "rejected")
        .order("created_at", { ascending: false })
      ownPending = data ?? []

      // Marca quais vídeos essa sessão já comentou (qualquer status ≠ rejected)
      for (const c of data ?? []) {
        userHasCommented[String(c.video_id)] = true
      }
    }

    const comments: Record<string, unknown[]> = {}
    for (const id of video_ids) comments[String(id)] = []

    // Dedup: se um comentário já veio nos aprovados, não duplica no próprio
    const approvedIds = new Set((approved ?? []).map((c) => c.id))

    for (const c of approved ?? []) {
      comments[String(c.video_id)].push(c)
    }
    for (const c of ownPending ?? []) {
      if (approvedIds.has(c.id)) continue
      comments[String(c.video_id)].unshift(c) // próprio pending vai pro topo
    }

    return NextResponse.json({ likes, userLiked, comments, userHasCommented })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
