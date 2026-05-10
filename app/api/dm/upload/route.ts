// POST /api/dm/upload
//
// Upload de mídia (imagem ou áudio) pra usar em mensagem direta.
// FormData com `file` + (opcional) `kind` ('image' | 'audio').
// Detecta automaticamente pelo MIME se kind não fornecido.
// Path R2: dm/<user_id>/<timestamp>.<ext>
//
// Retorna { media_url, media_type }.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getCloudflareContext } from "@opennextjs/cloudflare"

export const dynamic = "force-dynamic"

const IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png", "image/gif"]
const AUDIO_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/aac",
  "audio/wav",
]

const MAX_IMAGE_SIZE = 8 * 1024 * 1024  // 8MB
const MAX_AUDIO_SIZE = 15 * 1024 * 1024 // 15MB (~10min de voz)

const PUBLIC_URL_BASE = "https://avatars.SEU_DOMINIO.com"

const EXT_MAP: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/aac": "aac",
  "audio/wav": "wav",
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File required" }, { status: 400 })
  }

  const isImage = IMAGE_TYPES.includes(file.type)
  const isAudio = AUDIO_TYPES.includes(file.type)

  if (!isImage && !isAudio) {
    return NextResponse.json(
      { error: "Tipo no permitido (imagen WebP/JPG/PNG/GIF o audio WebM/OGG/M4A/MP3/WAV)" },
      { status: 400 },
    )
  }

  const maxSize = isAudio ? MAX_AUDIO_SIZE : MAX_IMAGE_SIZE
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: isAudio ? "Audio mayor a 15MB" : "Imagen mayor a 8MB" },
      { status: 400 },
    )
  }

  const ext = EXT_MAP[file.type] || "bin"
  const filename = `dm/${user.id}/${Date.now()}.${ext}`

  type R2BucketLike = {
    put: (
      key: string,
      value: ArrayBuffer | Uint8Array | Blob,
      options?: { httpMetadata?: { contentType?: string } }
    ) => Promise<unknown>
  }
  type CfEnv = { AVATARS_BUCKET?: R2BucketLike }
  let bucket: R2BucketLike | undefined
  try {
    const ctx = getCloudflareContext() as { env?: CfEnv }
    bucket = ctx.env?.AVATARS_BUCKET
  } catch {
    bucket = undefined
  }
  if (!bucket) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 })
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    await bucket.put(filename, arrayBuffer, {
      httpMetadata: { contentType: file.type },
    })
  } catch (e) {
    console.error("[/api/dm/upload] R2 error:", e)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }

  return NextResponse.json({
    media_url: `${PUBLIC_URL_BASE}/${filename}`,
    media_type: isAudio ? "audio" : "image",
  })
}
