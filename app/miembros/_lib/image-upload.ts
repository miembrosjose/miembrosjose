// Helper de conversão e upload de imagem/vídeo pra área de membros.
// Equivalente a convertForumImageToWebp.
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

// ═══════════════════════════════════════════════════════════════════════════
//  LA FOTO DE PERFIL · recorte cuadrado antes de subirla
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ ESTO ESTÁ AQUÍ Y NO EN CADA PANTALLA ──────────────────────────
// Estaba escrito dos veces —en el alta y en la pantalla de perfil— y las dos
// copias no eran iguales. La del alta rechazaba con el EVENTO del navegador
// en vez de con un Error:
//
//   i.onerror = reject        // ← llega un Event, no un Error
//
// Y quien lo recogía comprobaba `err instanceof Error`, que con un Event da
// false, así que enseñaba su texto de reserva: «Error al guardar perfil».
//
// El 3 de noviembre de 2026 eso dejó a una persona sin poder darse de alta,
// mirando una frase que no decía nada y que ni siquiera era verdad: el perfil
// no había llegado a guardarse porque la foto no había llegado a convertirse.
//
// ── LO QUE CAMBIA ─────────────────────────────────────────────────────────
// Cada salida mala lanza un Error con una frase que se le puede enseñar a
// quien está delante. Y si el teléfono no sabe hacer WebP, se sube JPEG en
// vez de dar por bueno un archivo vacío.
const LADO_MAXIMO = 512

/**
 * Convierte una foto en un cuadrado de hasta 512px, recortado por el centro.
 *
 * Devuelve WebP; si el navegador no sabe hacerlo, JPEG. Las dos las acepta
 * /api/profile/avatar.
 */
export async function avatarCuadrado(file: File): Promise<File> {
  const url = URL.createObjectURL(file)

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      // ── POR QUÉ UN Error Y NO `reject` A SECAS ────────────────────────
      // `reject` recibe el Event del navegador. Un Event no tiene `.message`
      // y no pasa `instanceof Error`, así que todo lo que lo recoja acaba
      // enseñando un texto genérico y el motivo se pierde.
      i.onerror = () => reject(new Error("No se pudo abrir esa imagen. Prueba con otra foto."))
      i.src = url
    })

    if (!img.width || !img.height) {
      throw new Error("Esa imagen llegó vacía. Prueba con otra foto.")
    }

    // El lado del cuadrado: nunca más de 512, y nunca más que la foto. Así
    // una foto pequeña no se estira hasta verse borrosa.
    const origen = Math.min(img.width, img.height)
    const lado = Math.min(LADO_MAXIMO, origen)

    const canvas = document.createElement("canvas")
    canvas.width = lado
    canvas.height = lado
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Este navegador no puede preparar la foto. Prueba desde otro.")

    ctx.drawImage(
      img,
      (img.width - origen) / 2, (img.height - origen) / 2, origen, origen,
      0, 0, lado, lado,
    )

    const comoBlob = (tipo: string, calidad: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, tipo, calidad))

    // ── EL REPUESTO ───────────────────────────────────────────────────────
    // `toBlob` con un formato que el navegador no sabe escribir devuelve
    // null, sin aviso. La versión anterior hacía `new File([blob!])` con ese
    // null dentro: se subía un archivo de cuatro bytes que decía «null», y el
    // fallo aparecía después, en otro sitio y sin relación aparente.
    const webp = await comoBlob("image/webp", 0.9)
    if (webp && webp.size > 0) return new File([webp], "avatar.webp", { type: "image/webp" })

    const jpeg = await comoBlob("image/jpeg", 0.9)
    if (jpeg && jpeg.size > 0) return new File([jpeg], "avatar.jpg", { type: "image/jpeg" })

    throw new Error("Este navegador no pudo preparar la foto. Prueba con otra imagen o desde otro navegador.")
  } finally {
    // La versión del alta no lo soltaba nunca: cada foto elegida dejaba sus
    // megas retenidos hasta recargar la página.
    URL.revokeObjectURL(url)
  }
}
