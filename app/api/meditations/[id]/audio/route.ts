// Streaming seguro de meditaciones desde el bucket PRIVADO los144000-media
// (binding R2 `MEDIA`). Nunca expone el object key ni una URL pública.
//
// Flujo:
//   1. Resuelve la meditación por id → object key + nivel de acceso (server).
//   2. Verifica sesión + membresía (y entitlement si es premium) SERVER-SIDE.
//   3. Lee el objeto vía env.MEDIA y lo sirve con soporte de Range Requests
//      (206 Partial Content) para adelantar/retroceder en audios largos, sin
//      cargar todo el MP3 en memoria (se transmite el ReadableStream de R2).

import { NextRequest } from "next/server"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getServerMeditation } from "@/lib/meditations"
import { getMembership, hasPremiumEntitlement } from "@/lib/membership"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Tipos mínimos del binding R2 (evita depender de @cloudflare/workers-types).
type R2Range = { offset?: number; length?: number } | { suffix: number }
type R2ObjectBody = {
  body: ReadableStream
  size: number
  httpEtag: string
  writeHttpMetadata: (headers: Headers) => void
}
type R2Object = { size: number }
type R2BucketLike = {
  head: (key: string) => Promise<R2Object | null>
  get: (key: string, opts?: { range?: R2Range }) => Promise<R2ObjectBody | null>
}
type CfEnv = { MEDIA?: R2BucketLike }

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  const med = await getServerMeditation(id)
  if (!med) return new Response("Meditación no encontrada", { status: 404 })

  // ── Control de acceso (server-side, nunca solo frontend) ──────────────────
  const supabase = await getSupabaseServer()
  const membership = await getMembership(supabase)
  if (!membership.authenticated) {
    return new Response("Sesión requerida", { status: 401 })
  }
  if (!membership.active) {
    return new Response("Membresía activa requerida", { status: 403 })
  }
  // Premium: el permiso REAL viene de Supabase (entitlement), no de que el key
  // contenga "premium". Nunca se entrega el MP3 antes de comprobar la compra.
  if (med.accessType === "premium") {
    const ok = await hasPremiumEntitlement(supabase, membership.userId!, med.id)
    if (!ok) return new Response("Meditación premium bloqueada", { status: 403 })
  }

  // ── Acceso a R2 vía binding (bucket privado) ──────────────────────────────
  let bucket: R2BucketLike | undefined
  try {
    const cf = getCloudflareContext() as { env?: CfEnv }
    bucket = cf.env?.MEDIA
  } catch {
    bucket = undefined
  }
  if (!bucket) {
    return new Response("Almacenamiento de medios no disponible", { status: 503 })
  }

  // Tamaño total (para calcular rangos y Content-Length sin traer el cuerpo).
  const meta = await bucket.head(med.objectKey)
  if (!meta) return new Response("Audio no encontrado", { status: 404 })
  const total = meta.size

  const baseHeaders = (): Headers => {
    const h = new Headers()
    h.set("Content-Type", "audio/mpeg")
    h.set("Accept-Ranges", "bytes")
    // Audio privado: no cachear en CDN/proxies compartidos.
    h.set("Cache-Control", "private, no-store")
    return h
  }

  const rangeHeader = req.headers.get("range")
  if (rangeHeader) {
    const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader)
    let start: number
    let end: number
    if (match && match[1] === "" && match[2] !== "") {
      // Sufijo: bytes=-N → últimos N bytes.
      const suffix = parseInt(match[2], 10)
      start = Math.max(0, total - suffix)
      end = total - 1
    } else {
      start = match && match[1] ? parseInt(match[1], 10) : 0
      end = match && match[2] ? parseInt(match[2], 10) : total - 1
    }
    if (end >= total) end = total - 1
    if (
      Number.isNaN(start) || Number.isNaN(end) ||
      start > end || start >= total || start < 0
    ) {
      const h = baseHeaders()
      h.set("Content-Range", `bytes */${total}`)
      return new Response("Rango no satisfacible", { status: 416, headers: h })
    }

    const length = end - start + 1
    const object = await bucket.get(med.objectKey, { range: { offset: start, length } })
    if (!object) return new Response("Audio no encontrado", { status: 404 })

    const headers = baseHeaders()
    object.writeHttpMetadata(headers)
    headers.set("Content-Type", "audio/mpeg")
    headers.set("ETag", object.httpEtag)
    headers.set("Content-Range", `bytes ${start}-${end}/${total}`)
    headers.set("Content-Length", String(length))
    return new Response(object.body, { status: 206, headers })
  }

  // Sin Range → objeto completo (streaming del ReadableStream de R2).
  const object = await bucket.get(med.objectKey)
  if (!object) return new Response("Audio no encontrado", { status: 404 })
  const headers = baseHeaders()
  object.writeHttpMetadata(headers)
  headers.set("Content-Type", "audio/mpeg")
  headers.set("ETag", object.httpEtag)
  headers.set("Content-Length", String(total))
  return new Response(object.body, { status: 200, headers })
}
