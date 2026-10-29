// ═══════════════════════════════════════════════════════════════════════════
//  COMUNICACIONES DENTRO DE LA PLATAFORMA
// ═══════════════════════════════════════════════════════════════════════════
//
// Un aviso que no depende de nada: ni de que el navegador tenga permiso para
// notificar, ni de que el correo llegue a la bandeja principal, ni de que la
// persona esté en Telegram. Entra a Los 144000 y está ahí.
//
// ── UNA FILA, MUCHOS LECTORES ──────────────────────────────────────────────
// Publicar un aviso NO escribe una fila por miembro. Escribe una sola, y cada
// persona la ve porque cumple las condiciones, no porque alguien le haya
// hecho una copia.
//
// La diferencia no es de estilo. Con 144.000 miembros, el modelo de la copia
// escribe 144.000 filas por aviso, y la mayoría no dicen nada: «no leído» es
// la ausencia de noticia, no un dato. Aquí la fila nace cuando la persona
// interactúa, y los no leídos se cuentan restando.
//
// Es el mismo principio que ya usa `community_events` para la actividad de la
// Red. No se inventa una arquitectura nueva: se aplica la que hay.

import { getSupabaseAdmin } from "@/lib/supabase/admin"

/** Lo que el miembro ve de una comunicación interna. */
export type ComunicacionInterna = {
  id: string
  titulo: string
  cuerpo: string
  imagen_url: string | null
  cta_text: string | null
  cta_url: string | null
  /**
   * Qué hace el botón cuando no es ir a una dirección.
   *
   * Para Telegram no hay ninguna que se pueda escribir: la del grupo es
   * personal y caduca. El botón le pide al flotante que ya existe que haga
   * lo que ya sabe hacer.
   */
  cta_accion: "telegram" | null
  /** 'feed' espera en el centro de avisos; 'modal_once' interrumpe una vez. */
  display_mode: "feed" | "modal_once"
  published_at: string
  leida: boolean
}

/** Cómo se cerró. Lo registra quien marca, no se deduce. */
export type ComoSeLeyo = "abierta" | "cerrada" | "cta"

/**
 * Los campos que hacen falta para pintar una comunicación por dentro.
 *
 * Se piden los del correo también, porque los de dentro admiten nulo y caen
 * a ellos: marcar «también dentro de la plataforma» en algo ya escrito no
 * debe obligar a reescribirlo.
 */
const CAMPOS = `
  id, display_mode, published_at, audiencia_hasta,
  interno_titulo, interno_cuerpo, interno_cta_text, interno_cta_url, interno_cta_accion,
  interno_image_url,
  heading, subject, body, cta_text, cta_url, image_url
`

type Fila = Record<string, unknown>

function texto(v: unknown): string {
  return typeof v === "string" ? v.trim() : ""
}

/** El campo de dentro si lo hay; si no, el del correo. */
function conFallback(fila: Fila, dentro: string, correo: string): string {
  return texto(fila[dentro]) || texto(fila[correo])
}

function aComunicacion(fila: Fila, leidas: Set<string>): ComunicacionInterna {
  const id = String(fila.id)
  return {
    id,
    titulo: conFallback(fila, "interno_titulo", "heading") || texto(fila.subject) || "Comunicación",
    cuerpo: conFallback(fila, "interno_cuerpo", "body"),
    imagen_url: texto(fila.interno_image_url) || texto(fila.image_url) || null,
    cta_text: texto(fila.interno_cta_text) || texto(fila.cta_text) || null,
    cta_url: texto(fila.interno_cta_url) || texto(fila.cta_url) || null,
    cta_accion: fila.interno_cta_accion === "telegram" ? "telegram" : null,
    display_mode: fila.display_mode === "modal_once" ? "modal_once" : "feed",
    published_at: String(fila.published_at ?? ""),
    leida: leidas.has(id),
  }
}

/**
 * Si la tabla todavía no existe.
 *
 * ── POR QUÉ SE DISTINGUE ESTE ERROR DE LOS DEMÁS ──────────────────────────
 * Entre desplegar el código y correr el SQL pasan horas o días, y en ese
 * hueco estas consultas fallan. Si se tratara como una avería, la campana
 * diría «error» a todo el mundo por algo que no lo es. Se devuelve vacío y
 * la plataforma sigue igual que antes de todo esto.
 */
function faltaLaTabla(mensaje: string): boolean {
  return /communication_reads|canales|display_mode|published_at|audiencia_hasta|interno_cta_accion|interno_destinatarios|does not exist|schema cache/i
    .test(mensaje)
}

/**
 * Las comunicaciones internas que le tocan a una persona.
 *
 * ── QUIÉN ES ELEGIBLE ──────────────────────────────────────────────────────
 * Quien pueda llamar a esto ya es miembro: el área de miembros comprueba la
 * suscripción antes de dejar entrar. Así que aquí solo queda una condición
 * propia del aviso, `audiencia_hasta`:
 *
 *   nulo  →  lo ve todo el mundo, también quien se registre mañana.
 *   fecha →  solo las cuentas creadas antes de ese instante.
 *
 * Eso segundo es lo que impide que dentro de seis meses alguien que acaba de
 * llegar se encuentre con el anuncio de hoy.
 */
export async function internasDe(
  userId: string,
  creadaEn: string,
  { limite = 30 }: { limite?: number } = {},
): Promise<{ lista: ComunicacionInterna[]; sinLeer: number }> {
  const admin = getSupabaseAdmin()

  const { data, error } = await admin
    .from("communications")
    .select(CAMPOS)
    .contains("canales", ["interno"])
    .not("published_at", "is", null)
    .or(`audiencia_hasta.is.null,audiencia_hasta.gte.${creadaEn}`)
    // ── A QUIÉN VA ──────────────────────────────────────────────────────
    // Nulo = a todo el mundo. Una lista = solo a quien esté dentro.
    //
    // Esto FALTABA, y el efecto era que un comunicado dirigido a una persona
    // lo veía la plataforma entera. La audiencia se elegía en el panel y
    // aquí no se miraba por ninguna parte.
    .or(`interno_destinatarios.is.null,interno_destinatarios.cs.{${userId}}`)
    .order("published_at", { ascending: false })
    .limit(limite)

  if (error) {
    if (faltaLaTabla(error.message)) return { lista: [], sinLeer: 0 }
    console.error("[comunicaciones/internas] listar:", error.message)
    return { lista: [], sinLeer: 0 }
  }

  const filas = (data || []) as Fila[]
  if (filas.length === 0) return { lista: [], sinLeer: 0 }

  // Las marcas de lectura, en una sola consulta acotada a lo que se acaba de
  // traer. Pedir «todo lo que ha leído esta persona» crecería para siempre.
  const ids = filas.map((f) => String(f.id))
  const { data: marcas, error: errMarcas } = await admin
    .from("communication_reads")
    .select("communication_id")
    .eq("user_id", userId)
    .in("communication_id", ids)

  if (errMarcas && !faltaLaTabla(errMarcas.message)) {
    // ── POR QUÉ SE FALLA HACIA «LEÍDA» ───────────────────────────────────
    // Si no se sabe qué ha leído, enseñarlo todo como sin leer haría que la
    // ventana que bloquea volviera a salir a quien ya la cerró. Es la única
    // consecuencia de verdad molesta, así que ante la duda se calla.
    console.error("[comunicaciones/internas] lecturas:", errMarcas.message)
    const todas = new Set(ids)
    return { lista: filas.map((f) => aComunicacion(f, todas)), sinLeer: 0 }
  }

  const leidas = new Set(
    (marcas || []).map((m) => String((m as { communication_id: string }).communication_id)),
  )

  const lista = filas.map((f) => aComunicacion(f, leidas))
  return { lista, sinLeer: lista.filter((c) => !c.leida).length }
}

/**
 * Marcar una como leída.
 *
 * Idempotente a propósito: la ventana que bloquea puede mandar esto dos veces
 * —un clic nervioso, una recarga a destiempo— y la segunda no debe fallar ni
 * pisar la hora de la primera.
 */
export async function marcarLeida(
  comunicacionId: string,
  userId: string,
  via: ComoSeLeyo = "abierta",
): Promise<{ ok: true } | { error: string }> {
  const admin = getSupabaseAdmin()

  const { error } = await admin
    .from("communication_reads")
    .upsert(
      { communication_id: comunicacionId, user_id: userId, via },
      { onConflict: "communication_id,user_id", ignoreDuplicates: true },
    )

  if (error) {
    if (faltaLaTabla(error.message)) {
      return { error: "Falta correr docs/sql/comunicaciones_03_internas.sql." }
    }
    console.error("[comunicaciones/internas] marcar:", error.message)
    return { error: "No se pudo marcar como leída." }
  }

  return { ok: true }
}

/**
 * Cuánta gente ha leído una, para el panel.
 *
 * ── POR QUÉ NO SE CALCULA «NO LEÍDA» AQUÍ ─────────────────────────────────
 * Porque «elegibles» depende de quién es miembro AHORA, y eso lo sabe el
 * motor de audiencias, no esta tabla. Aquí se cuenta lo que esta tabla sabe
 * —las lecturas— y quien llame resta.
 */
export async function cuantosLeyeron(comunicacionId: string): Promise<number | null> {
  const { count, error } = await getSupabaseAdmin()
    .from("communication_reads")
    .select("user_id", { count: "exact", head: true })
    .eq("communication_id", comunicacionId)

  if (error) {
    if (!faltaLaTabla(error.message)) {
      console.error("[comunicaciones/internas] recuento:", error.message)
    }
    return null
  }
  return count ?? 0
}
