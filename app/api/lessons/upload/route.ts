// POST /api/lessons/upload — upload de vídeo pra R2.
// Reusa AVATARS_BUCKET com path lessons/<user_id>/<ts>.<ext>.
// Aceita MP4, WebM, MOV. Max 100MB.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getCloudflareContext } from "@opennextjs/cloudflare"

export const dynamic = "force-dynamic"

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB

const PUBLIC_URL_BASE = "https://avatars.SEU_DOMINIO.com"

const EXT_MAP: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
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
    return NextResponse.json({ error: "Video required" }, { status: 400 })
  }
  if (!VIDEO_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Formato no permitido (MP4, WebM, MOV)" }, { status: 400 })
  }
  if (file.size > MAX_VIDEO_SIZE) {
    return NextResponse.json({ error: "Video mayor a 100MB" }, { status: 400 })
  }

  const ext = EXT_MAP[file.type] || "mp4"
  const filename = `lessons/${user.id}/${Date.now()}.${ext}`

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
  if (!bucket) return NextResponse.json({ error: "Storage not configured" }, { status: 500 })

  try {
    const arrayBuffer = await file.arrayBuffer()
    await bucket.put(filename, arrayBuffer, { httpMetadata: { contentType: file.type } })
  } catch (e) {
    console.error("[/api/lessons/upload]", e)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }

  return NextResponse.json({ video_url: `${PUBLIC_URL_BASE}/${filename}` })
}
