
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

const BOT_UA_PATTERNS = [
  "bot", "crawler", "spider", "crawling", "facebookexternalhit",
  "linkedinbot", "twitterbot", "whatsapp", "slurp", "bingbot",
  "googlebot", "headlesschrome", "phantomjs", "python-requests",
  "curl/", "wget/", "go-http-client", "gptbot", "claudebot",
]

function isBot(req: NextRequest): boolean {
  const ua = (req.headers.get("user-agent") ?? "").toLowerCase()
  if (!ua) return true
  return BOT_UA_PATTERNS.some((p) => ua.includes(p))
}

// Instagram: 1-30 chars, letras/números/ponto/underscore
// não pode começar nem terminar com ponto, não pode ter pontos consecutivos
const IG_REGEX = /^(?!.*\.\.)(?!\.)(?!.*\.$)[A-Za-z0-9._]{1,30}$/

function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "").toLowerCase()
}

export async function POST(req: NextRequest) {
  try {
    if (isBot(req)) return NextResponse.json({ ok: true, ignored: true })

    const body = await req.json()
    const video_id = Number(body.video_id)
    const session_id = typeof body.session_id === "string" ? body.session_id.slice(0, 100) : ""
    const handleRaw = typeof body.instagram_handle === "string" ? body.instagram_handle : ""
    const text = typeof body.comment_text === "string" ? body.comment_text.trim() : ""

    if (!Number.isInteger(video_id) || video_id < 1 || !session_id) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const handle = normalizeHandle(handleRaw)
    if (!handle || !IG_REGEX.test(handle)) {
      return NextResponse.json({ error: "Verifica el @ de Instagram" }, { status: 400 })
    }

    if (text.length < 2 || text.length > 500) {
      return NextResponse.json({ error: "Comentario muy corto o muy largo" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Regra: 1 comentário por sessão por vídeo
    const { count: existingCount } = await supabase
      .from("feed_comments")
      .select("*", { count: "exact", head: true })
      .eq("session_id", session_id)
      .eq("video_id", video_id)

    if ((existingCount ?? 0) >= 1) {
      return NextResponse.json({ error: "Ya comentaste en este video" }, { status: 429 })
    }

    const { data, error } = await supabase
      .from("feed_comments")
      .insert({
        video_id,
        session_id,
        instagram_handle: handle,
        comment_text: text,
        status: "pending",
      })
      .select("id, video_id, instagram_handle, comment_text, status, is_pinned, created_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, comment: data })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
