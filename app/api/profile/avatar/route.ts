// API — upload de avatar do user.
//
// POST /api/profile/avatar
//   Recebe FormData com File (tipo image/webp, max 2MB), sobe no R2 (binding
//   AVATARS_BUCKET), atualiza user.user_metadata.avatar_url com a URL pública.
//
// O cliente JÁ converte a imagem pra WebP via Canvas API ANTES de enviar.
// Aqui a gente só valida tipo + tamanho e faz o upload.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getCloudflareContext } from "@opennextjs/cloudflare"

export const dynamic = "force-dynamic"

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ["image/webp"] // cliente converte tudo pra webp
const PUBLIC_URL_BASE = process.env.R2_PUBLIC_URL || ""

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
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File exceeds 2MB" }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only WebP allowed" }, { status: 400 })
  }

  // Filename: user_id + timestamp pra invalidar cache de browser entre uploads
  const filename = `${user.id}/${Date.now()}.webp`

  // R2Bucket type minimal (sem dep @cloudflare/workers-types)
  type R2BucketLike = {
    put: (key: string, value: ArrayBuffer | Uint8Array | Blob, options?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>
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
      httpMetadata: { contentType: "image/webp" },
    })
  } catch (e) {
    console.error("[/api/profile/avatar] R2 upload error:", e)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }

  const avatarUrl = `${PUBLIC_URL_BASE}/${filename}`

  // Atualiza user_metadata pro avatar_url novo
  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  })
  if (updateError) {
    console.error("[/api/profile/avatar] updateUser error:", updateError)
    return NextResponse.json({ error: "Profile update failed" }, { status: 500 })
  }

  return NextResponse.json({ avatar_url: avatarUrl })
}
