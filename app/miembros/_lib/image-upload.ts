// Helper de conversão e upload de imagem/vídeo pra área de membros.
// Equivalente a convertForumImageToWebp do area-prototipo.html.
// Usa /api/forum/upload-image que já existe (aceita webp/jpg/png/gif/mp4/webm/mov).

import { api } from "./api"

const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"])

/**
 * Converte imagem (jpg/png/etc) pra WebP via Canvas, redimensiona se > maxWidth.
 * Vídeos passam direto sem conversão (servidor aceita).
 */
export async function convertToWebpIfImage(file: File, maxWidth = 1280): Promise<File> {
  if (VIDEO_TYPES.has(file.type)) return file

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      try {
        let { width, height } = img
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("Canvas context indisponível")
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url)
            if (!blob) {
              reject(new Error("Conversão falhou"))
              return
            }
            const webpFile = new File([blob], file.name.replace(/\.\w+$/, ".webp"), {
              type: "image/webp",
            })
            resolve(webpFile)
          },
          "image/webp",
          0.85,
        )
      } catch (e) {
        URL.revokeObjectURL(url)
        reject(e)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Falha ao ler imagem"))
    }
    img.src = url
  })
}

/**
 * Sobe arquivo pro Supabase Storage via API. Cliente envia FormData.
 * Retorna URL pública absoluta.
 */
export async function uploadMedia(file: File): Promise<string> {
  const fd = new FormData()
  fd.append("file", file)
  const data = await api<{ image_url: string }>("/api/forum/upload-image", {
    method: "POST",
    body: fd,
  })
  return data.image_url
}
