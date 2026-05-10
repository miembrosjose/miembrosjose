// POST /api/dm/send
//
// Envia mensagem direta. Body: { recipient_id, body?, media_url?, media_type? }
// Pelo menos um de: body, media_url. Verifica bloqueios em ambas direções.
//
// Rate limit simples: 30 mensagens / minuto por user (anti-spam básico).

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

const MAX_BODY_LEN = 2000
const VALID_MEDIA_TYPES = new Set(["image", "audio"])

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  // Anti-spam: 30 msgs/min por sender
  const rl = await checkRateLimit("dm-send", user.id, 30, 60)
  if (!rl.allowed) return rateLimitResponse(rl) as NextResponse

  let body: {
    recipient_id?: string
    body?: string
    media_url?: string
    media_type?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const recipientId = (body.recipient_id || "").trim()
  if (!recipientId) {
    return NextResponse.json({ error: "recipient_id required" }, { status: 400 })
  }
  if (recipientId === user.id) {
    return NextResponse.json({ error: "Can't message self" }, { status: 400 })
  }

  const text = (body.body || "").trim()
  const mediaUrl = (body.media_url || "").trim() || null
  const mediaType = (body.media_type || "").trim() || null

  // Validação: precisa ter texto OU mídia
  if (!text && !mediaUrl) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 })
  }
  if (text && text.length > MAX_BODY_LEN) {
    return NextResponse.json({ error: `Texto máximo ${MAX_BODY_LEN} caracteres` }, { status: 400 })
  }
  if (mediaUrl && !mediaType) {
    return NextResponse.json({ error: "media_type required when media_url provided" }, { status: 400 })
  }
  if (mediaType && !VALID_MEDIA_TYPES.has(mediaType)) {
    return NextResponse.json({ error: "Invalid media_type" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Checa se recipient existe (e pega básico pra notif futura)
  try {
    const { data: target, error: targetErr } = await admin.auth.admin.getUserById(recipientId)
    if (targetErr || !target?.user) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
    }
  } catch {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
  }

  // Bloqueios: rejeita se EU bloqueei o recipient OU se ele me bloqueou.
  // Symmetria: se eu bloqueei alguém, não posso mandar (intencional pra evitar
  // confusão). Se ele me bloqueou, idem.
  const { data: blocks } = await admin
    .from("direct_message_blocks")
    .select("blocker_id, blocked_id")
    .or(
      `and(blocker_id.eq.${user.id},blocked_id.eq.${recipientId}),` +
        `and(blocker_id.eq.${recipientId},blocked_id.eq.${user.id})`,
    )
    .limit(2)

  if (blocks && blocks.length > 0) {
    return NextResponse.json(
      { error: "No es posible enviar mensaje a este usuario" },
      { status: 403 },
    )
  }

  // Insere
  const { data: inserted, error: insErr } = await admin
    .from("direct_messages")
    .insert({
      sender_id: user.id,
      recipient_id: recipientId,
      body: text || null,
      media_url: mediaUrl,
      media_type: mediaType,
    })
    .select("id, sender_id, recipient_id, body, media_url, media_type, created_at, read_at")
    .single()

  if (insErr || !inserted) {
    console.error("[/api/dm/send] insert", insErr)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ message: inserted })
}
