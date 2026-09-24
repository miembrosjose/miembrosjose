// API — los avisos del proveedor.
//
//   POST /api/comunicaciones/webhook
//
// Resend llama aquí cada vez que le pasa algo a un correo: se entregó, se
// abrió, se hizo clic, rebotó, alguien se quejó. De estos avisos salen las
// únicas métricas que tenemos, porque su API no ofrece un resumen por campaña.
//
// ── ESTA RUTA ES PÚBLICA. POR ESO SE FIRMA ─────────────────────────────────
// No hay sesión detrás: la llama una máquina de fuera. Sin comprobar la firma,
// cualquiera que conozca la dirección podría inventarse mil aperturas.
//
// La firma es la de Svix, que es lo que usa Resend. Se comprueba con la clave
// secreta del endpoint, y se comprueba también la MARCA DE TIEMPO: sin eso,
// alguien que capture un aviso legítimo podría reenviarlo mil veces. Con la
// clave única de la tabla, además, repetirlo no contaría de todos modos.
//
// ── Y NO SE GUARDA EL CORREO DE NADIE ──────────────────────────────────────
// De cada aviso se anota lo mínimo: de qué comunicación es, qué identificador
// interno tenía ese correo, y qué pasó. La dirección no se guarda. Para contar
// cuántos abrieron no hace falta saber quiénes, y guardarlo sería acumular un
// registro de comportamiento que nadie pidió.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

/** Qué avisos nos interesan. Los demás se aceptan y se ignoran. */
const NOS_INTERESA: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
}

/** Margen de tolerancia de la marca de tiempo, en minutos. */
const TOLERANCIA_MIN = 5

/**
 * Comprueba la firma de Svix.
 *
 * El esquema: se firma `<id>.<timestamp>.<cuerpo>` con HMAC-SHA256 y la clave
 * del endpoint, que viene en base64 detrás de un `whsec_`. La cabecera puede
 * traer VARIAS firmas separadas por espacios —así se rotan las claves sin
 * cortar el servicio— y basta con que una coincida.
 *
 * La comparación es de tiempo constante. Comparar con `===` filtra, por lo que
 * tarda, cuántos caracteres del principio eran correctos.
 */
async function firmaValida(
  cuerpo: string,
  cabeceras: { id: string | null; timestamp: string | null; firma: string | null },
  secreto: string,
): Promise<boolean> {
  const { id, timestamp, firma } = cabeceras
  if (!id || !timestamp || !firma) return false

  // ── La marca de tiempo ────────────────────────────────────────────────
  const t = Number(timestamp)
  if (!Number.isFinite(t)) return false
  const desfaseMin = Math.abs(Date.now() / 1000 - t) / 60
  if (desfaseMin > TOLERANCIA_MIN) return false

  // ── La firma ──────────────────────────────────────────────────────────
  const base64 = secreto.startsWith("whsec_") ? secreto.slice(6) : secreto
  let clave: CryptoKey
  try {
    const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0))
    clave = await crypto.subtle.importKey(
      "raw", bytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
    )
  } catch {
    return false
  }

  const firmado = await crypto.subtle.sign(
    "HMAC", clave, new TextEncoder().encode(`${id}.${timestamp}.${cuerpo}`),
  )
  const esperada = btoa(String.fromCharCode(...new Uint8Array(firmado)))

  // La cabecera trae «v1,<firma> v1,<otra>».
  const candidatas = firma.split(" ").map((p) => p.split(",")[1]).filter(Boolean)
  return candidatas.some((c) => igualesEnTiempoConstante(c, esperada))
}

function igualesEnTiempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let dif = 0
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return dif === 0
}

export async function POST(req: NextRequest) {
  const secreto = process.env.RESEND_WEBHOOK_SECRET

  // El cuerpo se lee crudo, sin parsear: la firma se calcula sobre los bytes
  // exactos que llegaron. Parsear y volver a serializar cambia espacios y
  // orden de claves, y la firma deja de coincidir.
  const crudo = await req.text()

  if (!secreto) {
    // Sin secreto configurado no se acepta nada. Rechazar con 503 es correcto:
    // no es que el aviso esté mal, es que aquí todavía no se puede comprobar.
    console.warn("[comunicaciones/webhook] RESEND_WEBHOOK_SECRET sin configurar")
    return NextResponse.json({ error: "No configurado" }, { status: 503 })
  }

  const ok = await firmaValida(
    crudo,
    {
      id: req.headers.get("svix-id"),
      timestamp: req.headers.get("svix-timestamp"),
      firma: req.headers.get("svix-signature"),
    },
    secreto,
  )
  if (!ok) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 })
  }

  let evento: { type?: string; data?: { broadcast_id?: string; email_id?: string } }
  try { evento = JSON.parse(crudo) } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const tipo = NOS_INTERESA[evento.type || ""]
  const broadcastId = evento.data?.broadcast_id
  const emailId = evento.data?.email_id

  // Un aviso que no nos interesa, o que no pertenece a ninguna campaña —un
  // correo transaccional, por ejemplo— se acepta sin más. Devolver un error
  // haría que el proveedor lo reintentara para siempre.
  if (!tipo || !broadcastId || !emailId) {
    return NextResponse.json({ ok: true, ignorado: true })
  }

  const admin = getSupabaseAdmin()

  const { data: com } = await admin
    .from("communications")
    .select("id")
    .eq("provider_broadcast_id", broadcastId)
    .maybeSingle()

  if (!com) return NextResponse.json({ ok: true, ignorado: true })

  // Si ya estaba, la clave primaria lo rechaza y no pasa nada. Ese es el
  // mecanismo que hace que un reintento del proveedor no invente una apertura.
  const { error } = await admin
    .from("communication_metric_events")
    .upsert(
      { communication_id: com.id, email_id: emailId, event_type: tipo },
      { onConflict: "communication_id,email_id,event_type", ignoreDuplicates: true },
    )

  if (error) {
    console.error("[comunicaciones/webhook] anotar:", error.message)
    // 500 para que el proveedor lo reintente: perder un aviso es perder una
    // cifra, y esta es la única vez que va a llegar.
    return NextResponse.json({ error: "No se pudo anotar" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
