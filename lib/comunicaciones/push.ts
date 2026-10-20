// ENVIAR UNA COMUNICACIÓN POR NOTIFICACIÓN, EN VEZ DE POR CORREO.
//
// ── CÓMO SE DIFERENCIA DEL CORREO ──────────────────────────────────────────
// El correo sale por Resend: se sincroniza una lista de contactos, se crea un
// broadcast y el proveedor lo reparte. Aquí no hay proveedor que reparta: esta
// plataforma habla con el servicio de push de cada dispositivo, uno por uno, y
// lo que falla queda anotado en `push_envios`.
//
// ── POR QUÉ ESTO NO USA `avisarAPersona` ───────────────────────────────────
// Sería lo natural: ya existe, ya sabe mandar a todos los dispositivos de una
// persona. Pero hace una consulta por persona y dos escrituras por dispositivo,
// y eso con doscientos destinatarios son más de ochocientas llamadas de red.
//
// Un Worker tiene un presupuesto de peticiones por cada petición que atiende.
// Pasado ese presupuesto, la tanda no falla con un error claro: se corta por
// la mitad, y nadie sabe a quién le llegó. Lo peor que le puede pasar a un
// envío masivo es quedarse a medias sin dejar constancia.
//
// Así que aquí se hace por lotes: una consulta para todas las suscripciones,
// una pasada de preferencias, los envíos —que sí son inevitablemente uno por
// dispositivo— y las escrituras agrupadas al final. Con doscientas personas de
// un dispositivo cada una, pasa de unas 800 llamadas a unas 210.
//
// `avisarAPersona` sigue siendo lo correcto para un aviso suelto: un mensaje
// privado, una insignia. Esto es para cuando van cientos de golpe.
//
// ── POR QUÉ NO SE PARALELIZA ───────────────────────────────────────────────
// Sería más rápido mandar de cien en cien. Y también sería la forma de que un
// error de redacción llegue a mil teléfonos antes de que a nadie le dé tiempo
// a cerrar la pestaña. En secuencia, un envío se puede parar.

import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { enviarAUnDispositivo } from "@/lib/push/enviar"
import type { Destinatario } from "./audiencia"

/**
 * El techo de dispositivos de una sola tanda.
 *
 * ── POR QUÉ SE PARA ANTES DE EMPEZAR Y NO A MITAD ──────────────────────────
 * Porque pasado el presupuesto del Worker, el corte no avisa: la tanda muere
 * donde iba, la comunicación se queda a medias y la única forma de saber a
 * quién le llegó es leer `push_envios` a mano. Es preferible no empezar y
 * decirlo.
 *
 * Si algún día La Red crece hasta aquí, lo que toca no es subir el número: es
 * una cola que mande por tandas y recuerde por dónde iba.
 */
const TECHO_DISPOSITIVOS = 700

/** De cuánto en cuánto se agrupan las consultas y las escrituras. */
const LOTE = 200

export type ResultadoPush = {
  /** A cuánta gente se intentó. */
  personas: number
  /** A cuántas les llegó al menos a un dispositivo. */
  alcanzadas: number
  /** Quienes no tenían ningún dispositivo con los avisos activados. */
  sinDispositivo: number
  /** Quienes lo tienen apagado en sus preferencias. */
  noQuieren: number
  /** Dispositivos que respondieron mal. */
  fallidos: number
  /** Suscripciones muertas que se han desactivado en esta pasada. */
  retiradas: number
  /** El primer error, para enseñarlo en el panel. */
  error?: string
  /** Cuando no se ha enviado nada en absoluto, por qué. */
  abortado?: string
}

type Sub = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string }

function trocear<T>(xs: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n))
  return out
}

/**
 * Quién, de entre los que tienen dispositivo, ha dicho que no quiere
 * comunicados.
 *
 * ── POR QUÉ SE LEE EN BLOQUE Y NO PERSONA A PERSONA ────────────────────────
 * Las preferencias viven en los metadatos de la cuenta, y preguntarlas de una
 * en una serían doscientas llamadas antes de mandar nada. El listado va por
 * páginas y se recorre entero una vez.
 *
 * ── POR QUÉ UN FALLO AQUÍ DETIENE EL ENVÍO ─────────────────────────────────
 * Si no se puede leer quién dijo que no, la opción «mandar a todos por si
 * acaso» es exactamente mandárselo a quien lo apagó. Eso no se recupera: ya
 * sonó en su teléfono. Mejor no enviar, y que se vuelva a intentar.
 */
async function quienesNoQuieren(conDispositivo: Set<string>): Promise<Set<string>> {
  const admin = getSupabaseAdmin()
  const no = new Set<string>()

  // El tope existe para que un listado que no termine nunca no se convierta
  // en un bucle infinito dentro de una petición. Son diez mil cuentas.
  const MAX_PAGINAS = 50
  for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
    const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: LOTE })
    if (error) throw new Error("No se pudieron leer las preferencias: " + error.message)

    const cuentas = data?.users || []
    if (cuentas.length === 0) break

    for (const u of cuentas) {
      if (!conDispositivo.has(u.id)) continue
      const prefs = (u.user_metadata as { notification_prefs?: { push?: { comunicados?: boolean } } } | null)
        ?.notification_prefs
      // Solo excluye un «no» explícito. Quien nunca ha tocado sus preferencias
      // lo recibe: es lo que espera alguien que acaba de activar los avisos.
      if (prefs?.push?.comunicados === false) no.add(u.id)
    }

    if (cuentas.length < LOTE) break
  }

  return no
}

/**
 * Reparte una comunicación a los dispositivos de cada destinatario.
 *
 * No lanza por un fallo de una persona: una suscripción muerta no puede
 * abortar un envío a doscientas. Sí se detiene, sin mandar nada, si no puede
 * saber quién no lo quiere recibir.
 */
export async function enviarComunicacionPush(
  destinatarios: Destinatario[],
  aviso: { titulo: string; cuerpo: string; url: string | null },
  comunicacionId: string,
): Promise<ResultadoPush> {
  const r: ResultadoPush = {
    personas: destinatarios.length,
    alcanzadas: 0,
    sinDispositivo: 0,
    noQuieren: 0,
    fallidos: 0,
    retiradas: 0,
  }

  const admin = getSupabaseAdmin()
  const ids = [...new Set(destinatarios.map((d) => d.userId))]

  // ── Los dispositivos, de una vez ────────────────────────────────────────
  const subs: Sub[] = []
  for (const lote of trocear(ids, LOTE)) {
    const { data, error } = await admin
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth")
      .in("user_id", lote)
      .eq("activa", true)
    if (error) {
      r.abortado = "No se pudieron leer los dispositivos: " + error.message
      return r
    }
    subs.push(...((data || []) as Sub[]))
  }

  const porPersona = new Map<string, Sub[]>()
  for (const s of subs) {
    const suyos = porPersona.get(s.user_id)
    if (suyos) suyos.push(s)
    else porPersona.set(s.user_id, [s])
  }

  r.sinDispositivo = ids.length - porPersona.size

  if (porPersona.size === 0) return r

  if (subs.length > TECHO_DISPOSITIVOS) {
    r.abortado =
      "Son " + subs.length + " dispositivos y de una vez caben " + TECHO_DISPOSITIVOS + ". " +
      "Estrecha la audiencia —por temporada, rol o insignia— y manda en dos veces."
    return r
  }

  // ── Quién no lo quiere ──────────────────────────────────────────────────
  let noQuieren: Set<string>
  try {
    noQuieren = await quienesNoQuieren(new Set(porPersona.keys()))
  } catch (e) {
    r.abortado = e instanceof Error ? e.message : "No se pudieron leer las preferencias."
    return r
  }
  r.noQuieren = noQuieren.size

  // ── El reparto ──────────────────────────────────────────────────────────
  const ahora = new Date().toISOString()
  const vivas: string[] = []
  const muertas: string[] = []
  const registro: Array<Record<string, unknown>> = []

  for (const [userId, dispositivos] of porPersona) {
    if (noQuieren.has(userId)) continue

    let leLlego = false

    for (const s of dispositivos) {
      const res = await enviarAUnDispositivo(s, {
        title: aviso.titulo,
        body: aviso.cuerpo,
        url: aviso.url || "/miembros",
        // ── POR QUÉ LA ETIQUETA LLEVA EL ID DE LA COMUNICACIÓN ────────────
        // Si alguien reenviara la misma comunicación por error, el segundo
        // aviso REEMPLAZA al primero en el teléfono en vez de aparecer dos
        // veces. No evita el envío doble —de eso se encarga la llave de
        // idempotencia— pero evita que se vea doble.
        tag: "comunicado-" + comunicacionId,
      })

      if (res.estado === "ok") {
        leLlego = true
        vivas.push(s.id)
      } else if (res.estado === "gone") {
        // Muerta de verdad. Se apaga, no se borra: así queda constancia de
        // cuánta gente perdió los avisos y por qué.
        r.retiradas++
        muertas.push(s.id)
      } else {
        r.fallidos++
        if (!r.error) r.error = res.error
      }

      registro.push({
        user_id: userId,
        subscription_id: s.id,
        categoria: "comunicados",
        titulo: aviso.titulo.slice(0, 200),
        url: aviso.url,
        resultado: res.estado === "ok" ? "ok" : res.estado === "gone" ? "gone" : "fallo",
        http_status: "http" in res ? res.http : null,
        error: res.estado === "fallo" ? res.error.slice(0, 500) : null,
      })
    }

    if (leLlego) r.alcanzadas++
  }

  // ── Las escrituras, agrupadas ───────────────────────────────────────────
  // Van al final y por lotes a propósito: dentro del bucle serían dos
  // llamadas más por dispositivo, que es justo lo que agota el presupuesto.
  //
  // Y van en `try` porque a estas alturas los avisos YA están en los
  // teléfonos: no haberlos apuntado es una molestia, pero no es un fallo del
  // envío y no se debe presentar como tal.
  try {
    for (const lote of trocear(vivas, LOTE)) {
      await admin.from("push_subscriptions").update({ last_used_at: ahora }).in("id", lote)
    }
    for (const lote of trocear(muertas, LOTE)) {
      await admin.from("push_subscriptions")
        .update({ activa: false, motivo_baja: "gone", updated_at: ahora })
        .in("id", lote)
    }
    for (const lote of trocear(registro, LOTE)) {
      await admin.from("push_envios").insert(lote)
    }
  } catch (e) {
    console.error("[comunicaciones] registro del envío push:", e instanceof Error ? e.message : e)
  }

  return r
}
