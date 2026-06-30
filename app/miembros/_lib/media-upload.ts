// Helpers de upload de mídia.
// - Imagens: convertidas pra WebP no browser antes de subir (canvas).
// - Vídeos: sobem brutos (sem compressão client-side).
// O endpoint /api/admin/upload guarda no Cloudflare R2.

const WEBP_QUALITY = 0.85
const MAX_IMAGE_DIMENSION = 2400 // largest side em px (reduz se maior)

export type UploadResult = {
  url: string
  key: string
  size: number
  contentType: string
}

export async function uploadMedia(file: File, kind: "seasons" | "feed" | "avatars" | "misc" = "seasons"): Promise<UploadResult> {
  let blob: Blob = file
  let name = file.name
  let contentType = file.type

  // Imagem → converte pra WebP no client
  if (file.type.startsWith("image/")) {
    const webp = await imageToWebP(file)
    blob = webp.blob
    name = file.name.replace(/\.[^.]+$/, "") + ".webp"
    contentType = "image/webp"
  }

  const formData = new FormData()
  formData.append("file", new File([blob], name, { type: contentType }))
  formData.append("kind", kind)

  const res = await fetch("/api/admin/upload", {
    method: "POST",
    credentials: "include",
    body: formData,
  })

  if (!res.ok) {
    const d = await res.json().catch(() => ({}))
    throw new Error(d.error || `HTTP ${res.status}`)
  }

  return (await res.json()) as UploadResult
}

async function imageToWebP(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  // Carrega como bitmap (mais rápido que <img>)
  const bitmap = await createImageBitmap(file)

  // Redimensiona se for maior que MAX_IMAGE_DIMENSION
  let { width, height } = bitmap
  const longest = Math.max(width, height)
  if (longest > MAX_IMAGE_DIMENSION) {
    const ratio = MAX_IMAGE_DIMENSION / longest
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  // Renderiza em canvas
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d", { alpha: true })
  if (!ctx) throw new Error("Canvas 2D context indisponível")
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  // Exporta WebP
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
  )
  if (!blob) throw new Error("Falha ao gerar WebP")

  return { blob, width, height }
}
