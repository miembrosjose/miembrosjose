// POST /api/admin/upload — recebe arquivo via multipart/form-data, sobe pro R2.
// Só admin pode usar. Aceita imagens (já convertidas pra WebP no browser) e
// vídeos brutos. Retorna a URL pública do arquivo.

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { uploadToR2, generateKey } from "@/lib/r2"

export const runtime = "nodejs"

const MAX_SIZE = 500 * 1024 * 1024 // 500 MB

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Form data inválido" }, { status: 400 })
  }

  const file = formData.get("file")
  const kindRaw = formData.get("kind")
  const kind =
    kindRaw === "seasons" || kindRaw === "avatars" || kindRaw === "feed" || kindRaw === "misc"
      ? kindRaw
      : "misc"

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo ausente ou inválido" }, { status: 400 })
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "Arquivo vazio" }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `Arquivo maior que 500 MB (${Math.round(file.size / 1024 / 1024)} MB)` },
      { status: 413 },
    )
  }

  // Detecta extensão pelo nome OU pelo content-type
  const name = file.name || "upload"
  const dotIdx = name.lastIndexOf(".")
  let ext = dotIdx > 0 ? name.slice(dotIdx + 1) : ""
  if (!ext && file.type) {
    if (file.type === "image/webp") ext = "webp"
    else if (file.type === "image/jpeg") ext = "jpg"
    else if (file.type === "image/png") ext = "png"
    else if (file.type === "video/mp4") ext = "mp4"
    else if (file.type === "video/webm") ext = "webm"
    else if (file.type === "video/quicktime") ext = "mov"
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const key = generateKey(kind, ext)

  try {
    const result = await uploadToR2({
      key,
      body: buffer,
      contentType: file.type || "application/octet-stream",
    })
    return NextResponse.json({
      url: result.url,
      key: result.key,
      size: file.size,
      contentType: file.type,
    })
  } catch (e) {
    console.error("[admin/upload] R2 erro:", e)
    const msg = e instanceof Error ? e.message : "Erro no upload"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
