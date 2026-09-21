// Cloudflare R2 — subida y borrado de archivos del bucket "miembros"
// (portadas y videos de temporadas, avatares, imágenes del feed).
//
// ── POR QUÉ NO SE USA EL SDK DE AWS ─────────────────────────────────────────
// Antes esto hablaba con R2 por su API compatible con S3, usando
// @aws-sdk/client-s3. Funcionaba, pero ese paquete entra entero en el bundle
// del Worker, y el Worker ya iba al límite de CPU de arranque: el error 1102
// que tumbó el sitio dos veces.
//
// Dentro de un Worker no hace falta: Cloudflare expone el bucket como un
// binding nativo (AVATARS_BUCKET en wrangler.jsonc), sin firmar peticiones ni
// hablar HTTP con nadie. Menos código, menos arranque y una credencial menos
// en juego.
//
// Fuera del Worker —por ejemplo en `next dev`— no hay binding. Ahí se cae al
// camino firmado, implementado a mano con SigV4 y fetch, que son unas líneas
// frente a los megabytes del SDK.

import { getCloudflareContext } from "@opennextjs/cloudflare"

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const BUCKET = process.env.R2_BUCKET
const PUBLIC_URL = process.env.R2_PUBLIC_URL

/** Lo mínimo del binding de R2 que se usa aquí. */
type R2BucketLike = {
  put: (key: string, value: ArrayBuffer | Uint8Array, opts?: {
    httpMetadata?: { contentType?: string; cacheControl?: string }
  }) => Promise<unknown>
  delete: (key: string) => Promise<void>
}

/** El bucket nativo, si estamos dentro del Worker. */
function getBucket(): R2BucketLike | null {
  try {
    const cf = getCloudflareContext() as { env?: { AVATARS_BUCKET?: R2BucketLike } }
    return cf.env?.AVATARS_BUCKET ?? null
  } catch {
    return null
  }
}

function requireEnv() {
  if (!PUBLIC_URL) {
    throw new Error("R2_PUBLIC_URL no configurada.")
  }
}

/** Sube un archivo binario a R2. Devuelve la URL pública. */
export async function uploadToR2(params: {
  key: string
  body: Buffer | Uint8Array
  contentType: string
}): Promise<{ url: string; key: string }> {
  requireEnv()

  const cuerpo = new Uint8Array(params.body)
  const bucket = getBucket()

  if (bucket) {
    await bucket.put(params.key, cuerpo, {
      httpMetadata: {
        contentType: params.contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
    })
  } else {
    await peticionFirmada("PUT", params.key, cuerpo, params.contentType)
  }

  return { key: params.key, url: `${PUBLIC_URL}/${params.key}` }
}

/** Borra un archivo de R2, a partir de la URL pública o de la clave. */
export async function deleteFromR2(urlOrKey: string): Promise<void> {
  requireEnv()

  let key = urlOrKey
  if (urlOrKey.startsWith(PUBLIC_URL!)) {
    key = urlOrKey.slice(PUBLIC_URL!.length).replace(/^\//, "")
  }
  if (!key) return

  const bucket = getBucket()
  if (bucket) {
    await bucket.delete(key)
    return
  }
  await peticionFirmada("DELETE", key)
}

/** Genera una clave segura para subir — kind/<uuid>.<ext> */
export function generateKey(kind: "seasons" | "avatars" | "feed" | "misc", ext: string): string {
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin"
  const id = crypto.randomUUID()
  return `${kind}/${id}.${safeExt}`
}

// ════════════════════════════════════════════════════════════════════════════
// Camino de respaldo: SigV4 a mano
// ════════════════════════════════════════════════════════════════════════════
// Solo se usa fuera del Worker (desarrollo local). Firma con WebCrypto, que
// está disponible tanto en Node moderno como en el navegador.

async function hmac(clave: ArrayBuffer | Uint8Array, dato: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey(
    "raw",
    clave as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  return crypto.subtle.sign("HMAC", k, new TextEncoder().encode(dato))
}

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function sha256Hex(dato: Uint8Array | string): Promise<string> {
  const bytes = typeof dato === "string" ? new TextEncoder().encode(dato) : dato
  return hex(await crypto.subtle.digest("SHA-256", bytes as unknown as ArrayBuffer))
}

async function peticionFirmada(
  metodo: "PUT" | "DELETE",
  key: string,
  cuerpo?: Uint8Array,
  contentType?: string,
): Promise<void> {
  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET) {
    throw new Error(
      "Sin binding de R2 y sin credenciales: configura R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY y R2_BUCKET.",
    )
  }

  const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`
  const ruta = `/${BUCKET}/${key.split("/").map(encodeURIComponent).join("/")}`
  const ahora = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "")
  const fecha = ahora.slice(0, 8)
  const payloadHash = await sha256Hex(cuerpo ?? new Uint8Array())

  const cabeceras: Record<string, string> = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": ahora,
  }
  if (contentType) cabeceras["content-type"] = contentType

  const nombres = Object.keys(cabeceras).sort()
  const canonicas = nombres.map((n) => `${n}:${cabeceras[n]}\n`).join("")
  const firmadas = nombres.join(";")

  const canonica = [metodo, ruta, "", canonicas, firmadas, payloadHash].join("\n")
  const ambito = `${fecha}/auto/s3/aws4_request`
  const porFirmar = ["AWS4-HMAC-SHA256", ahora, ambito, await sha256Hex(canonica)].join("\n")

  let clave: ArrayBuffer = new TextEncoder().encode(`AWS4${SECRET_ACCESS_KEY}`).buffer as ArrayBuffer
  for (const parte of [fecha, "auto", "s3", "aws4_request"]) clave = await hmac(clave, parte)
  const firma = hex(await hmac(clave, porFirmar))

  const res = await fetch(`https://${host}${ruta}`, {
    method: metodo,
    headers: {
      ...cabeceras,
      Authorization:
        `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY_ID}/${ambito}, ` +
        `SignedHeaders=${firmadas}, Signature=${firma}`,
    },
    body: cuerpo ? (cuerpo as unknown as BodyInit) : undefined,
  })

  if (!res.ok && !(metodo === "DELETE" && res.status === 404)) {
    throw new Error(`R2 ${metodo} ${res.status}: ${await res.text().catch(() => "")}`)
  }
}
