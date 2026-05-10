
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

export async function POST(req: NextRequest) {
  try {
    if (isBot(req)) return NextResponse.json({ ok: true, ignored: true })

    const body = await req.json()
    const video_id = Number(body.video_id)
    const session_id = typeof body.session_id === "string" ? body.session_id.slice(0, 100) : ""

    if (!Number.isInteger(video_id) || video_id < 1 || !session_id) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Insere — se já existe (mesma sessão já curtiu), ignora sem erro
    await supabase
      .from("feed_likes")
      .insert({ video_id, session_id })
      .select()
      .maybeSingle()
    // O erro de conflito (23505) é esperado e não precisa de tratamento —
    // significa que essa sessão já curtiu o vídeo, o que é ok.

    // Retorna total atualizado
    const { count } = await supabase
      .from("feed_likes")
      .select("*", { count: "exact", head: true })
      .eq("video_id", video_id)

    return NextResponse.json({ ok: true, total: count ?? 0 })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
