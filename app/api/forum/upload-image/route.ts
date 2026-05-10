// API — upload de mídia (imagem OU vídeo) pra post do fórum.
//
// POST /api/forum/upload-image
//   FormData com `file`:
//     - Imagem: cliente JÁ converte pra WebP via Canvas (max 8MB)
//     - Vídeo: enviado direto sem conversão (max 50MB)
//       Aceita: video/mp4, video/webm, video/quicktime
//   Reusa AVATARS_BUCKET com prefix forum/<user_id>/<ts>.<ext>
//   Retorna { image_url } (campo mantém nome legacy, mas pode ser vídeo)

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getCloudflareContext } from "@opennextjs/cloudflare"

export const dynamic = "force-dynamic"

const IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png", "image/gif"]
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
const ALLOWED_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES]

const MAX_IMAGE_SIZE = 8 * 1024 * 1024  // 8MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

const PUBLIC_URL_BASE = "https://avatars.SEU_DOMINIO.com"

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
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Tipo no permitido (imagen WebP/JPG/PNG/GIF o video MP4/WebM/MOV)" }, { status: 400 })
  }

  const isVideo = VIDEO_TYPES.includes(file.type)
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
  if (file.size > maxSize) {
    return NextResponse.json({
      error: isVideo ? "Video mayor a 50MB" : "Imagen mayor a 8MB",
    }, { status: 400 })
  }

  // Determina extensão pelo MIME type
  const extMap: Record<string, string> = {
    "image/webp": "webp",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  }
  const ext = extMap[file.type] || "bin"

  // Path: forum/<user_id>/<timestamp>.<ext>
  const filename = `forum/${user.id}/${Date.now()}.${ext}`

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
    console.error("[/api/forum/upload-image] R2 error:", e)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }

  const mediaUrl = `${PUBLIC_URL_BASE}/${filename}`
  return NextResponse.json({
    image_url: mediaUrl,    // legacy field name (campo no DB ainda chama image_url)
    media_url: mediaUrl,
    media_type: isVideo ? "video" : "image",
  })
}
