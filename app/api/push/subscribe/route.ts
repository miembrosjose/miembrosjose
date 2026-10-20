// API — registrar y retirar el dispositivo de una persona para recibir push.
//
//   POST   /api/push/subscribe    { subscription, reemplaza? }
//   DELETE /api/push/subscribe    { endpoint }
//
// ── POR QUÉ ESTO NO LO ESCRIBE EL NAVEGADOR DIRECTAMENTE ───────────────────
// La tabla tiene políticas de lectura y borrado para cada persona, pero NO de
// escritura. La inserción pasa por aquí, con la sesión comprobada y la clave
// de servicio.
//
// Si el navegador pudiera insertar, bastaría con cambiar un `user_id` en la
// petición para registrar un dispositivo a nombre de otro y empezar a recibir
// sus avisos. Aquí el `user_id` NO viene del cliente: sale de la sesión.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

type SuscripcionCliente = {
  endpoint?: unknown
  keys?: { p256dh?: unknown; auth?: unknown }
}

function texto(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : ""
}

/**
 * ¿Es esto la dirección de un servicio de push?
 *
 * ── POR QUÉ SE COMPRUEBA ───────────────────────────────────────────────────
 * El endpoint llega del navegador, y del navegador llega lo que sea. Con una
 * sesión válida se puede mandar aquí cualquier dirección, y a partir de ese
 * momento el servidor le haría peticiones POST cada vez que esa persona
 * tuviera un aviso.
 *
 * El daño es limitado —una suscripción solo recibe los avisos de SU dueño, y
 * el contenido va cifrado con las claves que el propio cliente dio— pero
 * convierte la plataforma en un cliente HTTP a donde le digan, y eso no tiene
 * ninguna razón de ser.
 *
 * ── POR QUÉ NO HAY UNA LISTA DE SERVICIOS PERMITIDOS ───────────────────────
 * Sería más estricto y es tentador: son tres o cuatro —Google, Apple, Mozilla,
 * Microsoft—. Pero cada navegador nuevo trae el suyo, y una lista cerrada
 * significa que el día que alguien entre desde un navegador que no estaba
 * previsto, active los avisos y no le llegue nada, no habrá forma de saber por
 * qué: la plataforma diría que todo está bien.
 *
 * Dejar sin avisos a una persona real para cerrar un riesgo que solo le afecta
 * a quien lo provoca es un mal cambio. Lo que sí se rechaza es lo que no puede
 * ser legítimo de ninguna manera.
 */
function direccionDeServicioValida(endpoint: string): boolean {
  let u: URL
  try { u = new URL(endpoint) } catch { return false }

  // Un servicio de push es siempre https. Sin excepciones.
  if (u.protocol !== "https:") return false

  const host = u.hostname.toLowerCase()

  // Nada de direcciones numéricas ni de nombres sin dominio: no hay ningún
  // servicio de push que viva en una IP o en «localhost», y sí son la forma
  // de intentar que el servidor hable con algo de su propia red.
  if (!host.includes(".")) return false
  if (/^[\d.]+$/.test(host)) return false
  if (host.endsWith(".localhost") || host.endsWith(".local")) return false
  if (host.includes(":")) return false

  return true
}

/**
 * ¿Son estas claves las que dice el estándar?
 *
 * `p256dh` es un punto de curva P-256 sin comprimir: 65 bytes que empiezan por
 * 0x04. `auth` es un secreto de 16 bytes. Lo dice el RFC 8291 y lo cumplen
 * todos los navegadores.
 *
 * ── POR QUÉ SE MIRA AQUÍ Y NO AL ENVIAR ────────────────────────────────────
 * Porque al enviar ya es tarde. Una clave mal formada no rompe nada visible:
 * el cifrado falla, el envío se apunta como fallido y esa persona se queda sin
 * avisos para siempre creyendo que los tiene activados. Comprobarlo al
 * registrar convierte un silencio permanente en un error inmediato.
 */
function clavesPlausibles(p256dh: string, auth: string): boolean {
  const bytes = (clave: string): number => {
    // El relleno con = no debería venir, pero algún navegador lo manda y
    // no es motivo para rechazar un dispositivo que funciona.
    const limpio = clave.replace(/=+$/, "")
    if (!/^[A-Za-z0-9_+/-]+$/.test(limpio)) return -1
    return Math.floor((limpio.length * 3) / 4)
  }
  return bytes(p256dh) === 65 && bytes(auth) === 16
}

/**
 * ¿Este dispositivo está registrado, y es de quien pregunta?
 *
 *   GET /api/push/subscribe?endpoint=<el del navegador>
 *
 * ── POR QUÉ NO BASTA CON MIRAR EL NAVEGADOR ───────────────────────────────
 * El navegador sabe si TIENE una suscripción, y durante meses eso se tomó por
 * «los avisos están activos». No es lo mismo, y hay tres maneras de que
 * mientan la una sobre la otra:
 *
 *   · Dos cuentas en el mismo teléfono. El navegador conserva la suscripción
 *     de la primera persona. La segunda entra, la plataforma ve que hay
 *     suscripción y le dice «activo» — pero los avisos de esa suscripción le
 *     llegan a la otra.
 *
 *   · El registro falló. Se concedió el permiso, el navegador creó la
 *     suscripción y la llamada para guardarla no llegó. Local dice que sí;
 *     el servidor no sabe a dónde mandar nada.
 *
 *   · La suscripción se apagó por el otro lado. Un servicio de push responde
 *     410 cuando ya no existe, y entonces se marca `activa = false`. El
 *     navegador puede seguir teniendo el objeto viejo.
 *
 * En los tres casos la pantalla diría que todo está bien y no llegaría nada.
 * Esta ruta es la única forma de saberlo de verdad.
 *
 * ── LO QUE DEVUELVE, Y LO QUE NO ──────────────────────────────────────────
 * Un sí o un no sobre ESTE endpoint, y cuántos dispositivos tiene en total
 * quien pregunta —que sirve para decir «lo tienes activo en otro sitio»—.
 * Nunca la lista de endpoints ni las claves: no hacen falta para nada que
 * ocurra en el navegador, y son lo único sensible que guarda esa tabla.
 */
export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const endpoint = texto(req.nextUrl.searchParams.get("endpoint"), 2000)

  const admin = getSupabaseAdmin()

  // Cuántos dispositivos activos tiene en total. Es lo que permite decirle a
  // alguien «aquí no, pero en tu teléfono sí» en vez de dejarle pensando que
  // no los activó nunca.
  const { count: otros } = await admin
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("activa", true)

  if (!endpoint) {
    return NextResponse.json({ ok: true, esteDispositivo: false, dispositivos: otros ?? 0 })
  }

  // ── EL `user_id` VA EN LA CONSULTA, NO SE COMPRUEBA DESPUÉS ─────────────
  // Buscar solo por endpoint y mirar luego de quién es significaría que, por
  // un descuido de una línea, esta ruta confirmaría la suscripción de otra
  // persona. Así no hay nada que recordar comprobar.
  const { data } = await admin
    .from("push_subscriptions")
    .select("id")
    .eq("endpoint", endpoint)
    .eq("user_id", user.id)
    .eq("activa", true)
    .maybeSingle()

  return NextResponse.json({
    ok: true,
    esteDispositivo: Boolean(data),
    dispositivos: otros ?? 0,
  })
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { subscription?: SuscripcionCliente; reemplaza?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const s = body.subscription || {}
  const endpoint = texto(s.endpoint, 2000)
  const p256dh = texto(s.keys?.p256dh, 500)
  const auth = texto(s.keys?.auth, 500)

  // Las tres son obligatorias: sin cualquiera de ellas el mensaje no se puede
  // cifrar, y el servicio de push lo rechazaría en cada envío.
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "suscripcion_incompleta" }, { status: 400 })
  }

  if (!direccionDeServicioValida(endpoint)) {
    return NextResponse.json({ error: "endpoint_no_valido" }, { status: 400 })
  }
  if (!clavesPlausibles(p256dh, auth)) {
    return NextResponse.json({ error: "claves_no_validas" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const ahora = new Date().toISOString()

  // El navegador puede rotar la suscripción: cuando avisa de cuál sustituye,
  // se retira la vieja para no quedarse mandando a una dirección muerta.
  const reemplaza = texto(body.reemplaza, 2000)
  if (reemplaza && reemplaza !== endpoint) {
    await admin.from("push_subscriptions")
      .update({ activa: false, motivo_baja: "rotada", updated_at: ahora })
      .eq("endpoint", reemplaza)
      .eq("user_id", user.id)
  }

  // `onConflict: endpoint` es lo que permite varios dispositivos por persona:
  // cada uno tiene su endpoint, así que cada uno es su propia fila. Volver a
  // suscribirse desde el MISMO dispositivo actualiza la suya en vez de
  // acumular duplicados.
  //
  // Se reactiva a propósito: si estaba apagada por un fallo anterior y la
  // persona vuelve a autorizar, tiene que volver a funcionar.
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh,
      auth,
      user_agent: texto(req.headers.get("user-agent"), 300),
      activa: true,
      motivo_baja: null,
      updated_at: ahora,
    },
    { onConflict: "endpoint" },
  )

  if (error) {
    console.error("[/api/push/subscribe]", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { endpoint?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const endpoint = texto(body.endpoint, 2000)
  if (!endpoint) return NextResponse.json({ error: "falta_endpoint" }, { status: 400 })

  const admin = getSupabaseAdmin()
  // El `eq` sobre user_id importa: sin él, conociendo un endpoint ajeno se
  // podría dejar a otro sin notificaciones.
  const { error } = await admin.from("push_subscriptions")
    .update({ activa: false, motivo_baja: "revocada", updated_at: new Date().toISOString() })
    .eq("endpoint", endpoint)
    .eq("user_id", user.id)

  if (error) {
    console.error("[/api/push/subscribe DELETE]", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
