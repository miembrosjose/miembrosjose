// CENTRO DE COMUNICACIONES — lo que toda ruta necesita antes de hacer nada.
//
// ── LA COMPROBACIÓN DE ADMINISTRACIÓN VIVE AQUÍ ────────────────────────────
// Enviar un correo a toda La Red es la acción más privilegiada de la
// plataforma: no se deshace y sale del dominio. Esconder el botón no protege
// nada —una petición a mano lo salta— así que cada ruta empieza llamando a
// `exigirAdmin`, y ninguna hace nada antes.
//
// No se construye un sistema de administración nuevo: se usa el que ya existe,
// `isAdmin(user)`, que lee `app_metadata.is_admin`. Ese campo solo lo puede
// escribir la clave de servicio, no el propio usuario, que es justo lo que lo
// hace de fiar.

import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"
import type { Comunicacion } from "./tipos"

export type Autorizado = { user: User }

/**
 * Deja pasar solo a administración.
 *
 * Devuelve o bien el usuario, o bien la respuesta que hay que devolver tal
 * cual. El llamador hace `if ("respuesta" in g) return g.respuesta`, que es
 * difícil de olvidar y fácil de leer.
 */
export async function exigirAdmin(): Promise<Autorizado | { respuesta: NextResponse }> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { respuesta: NextResponse.json({ error: "No autenticado" }, { status: 401 }) }
  }
  if (!isAdmin(user)) {
    // El mismo cuerpo que el resto del panel. No se dice «no eres admin» con
    // más detalle: a quien no lo es, no se le describe lo que hay detrás.
    return { respuesta: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { user }
}

/**
 * Deja constancia.
 *
 * Fail-open a propósito: si el registro de auditoría falla, la acción que lo
 * provocó NO se cae. Perder una línea de historial es malo; perder un envío
 * que el proveedor ya aceptó, porque el insert de auditoría falló después, es
 * mucho peor —quedaría una comunicación enviada que la base cree borrador.
 */
export async function registrarEvento(
  communicationId: string,
  actorId: string | null,
  action:
    | "created" | "updated" | "duplicated"
    | "test_sent" | "audience_checked"
    | "sent" | "scheduled" | "cancelled" | "failed"
    | "metrics_synced",
  detail?: Record<string, unknown>,
): Promise<void> {
  try {
    await getSupabaseAdmin().from("communication_events").insert({
      communication_id: communicationId,
      actor_id: actorId,
      action,
      detail: detail ?? null,
    })
  } catch (e) {
    console.warn("[comunicaciones] auditoría:", e instanceof Error ? e.message : e)
  }
}

/** Una comunicación, o null. */
export async function leerComunicacion(id: string): Promise<Comunicacion | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("communications")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) {
    console.error("[comunicaciones] leer:", error.message)
    return null
  }
  return (data as Comunicacion | null) ?? null
}

/**
 * Los campos que administración puede escribir.
 *
 * Una lista explícita, y no «todo lo que venga en el cuerpo». Sin esto, una
 * petición podría colar `status: "sent"`, `provider_broadcast_id` o
 * `recipients_estimated` y dejar la base contando una historia que no ocurrió.
 * El estado y lo del proveedor los escribe el servidor, y solo el servidor.
 */
export const CAMPOS_EDITABLES = [
  "canal", "type", "internal_title", "subject", "preheader",
  "eyebrow", "heading", "body", "image_url",
  "cta_text", "cta_url",
  "event_title", "event_at", "event_timezone", "event_location",
  "audience",

  // ── LO QUE SE VE DENTRO DE LA PLATAFORMA ─────────────────────────────
  // Admiten nulo y caen a los del correo: marcar «también dentro» en algo
  // ya escrito no debe obligar a reescribirlo.
  "canales",
  "interno_titulo", "interno_cuerpo", "interno_image_url",
  "interno_cta_text", "interno_cta_url", "interno_cta_accion",
  "display_mode", "audiencia_hasta",

  // ── EL CORREO ESCRITO A MANO ─────────────────────────────────────────
  "email_modo", "email_html",
] as const

export type CampoEditable = (typeof CAMPOS_EDITABLES)[number]

/** Se queda solo con lo editable, y limpia los textos. */
export function soloEditable(body: Record<string, unknown>): Record<string, unknown> {
  const limpio: Record<string, unknown> = {}
  for (const campo of CAMPOS_EDITABLES) {
    if (!(campo in body)) continue
    // ── LOS CANALES ────────────────────────────────────────────────────
    // Una lista, no un valor. Se filtra contra lo que existe y se quitan los
    // repetidos: la base también lo rechazaría, pero allí el error sale como
    // un fallo de base de datos y en pantalla no se entiende nada.
    //
    // Si llega vacía se deja como está. Una comunicación sin ningún canal no
    // se puede enviar por ningún sitio, y un formulario a medio rellenar no
    // debería poder dejarla así.
    if (campo === "canales") {
      const dados = Array.isArray(body.canales) ? body.canales : []
      const validos = [...new Set(
        dados.filter((c): c is string => typeof c === "string")
          .filter((c) => c === "email" || c === "push" || c === "interno"),
      )]
      if (validos.length > 0) {
        limpio.canales = validos
        // `canal` se sigue rellenando con el primero. No se usa para decidir
        // nada nuevo, pero puede quedar alguna consulta vieja que lo lea, y
        // una columna desactualizada miente mejor que una vacía.
        limpio.canal = validos.includes("email") ? "email" : validos[0]
      }
      continue
    }

    // Lista cerrada: esto lo rellena un desplegable, y un texto libre que el
    // navegador convierte en una llamada es por donde entra lo que nadie
    // previó.
    if (campo === "interno_cta_accion") {
      limpio.interno_cta_accion = body.interno_cta_accion === "telegram" ? "telegram" : null
      continue
    }
    if (campo === "display_mode") {
      limpio.display_mode = body.display_mode === "modal_once" ? "modal_once" : "feed"
      continue
    }
    if (campo === "email_modo") {
      limpio.email_modo = body.email_modo === "codigo" ? "codigo" : "visual"
      continue
    }

    if (campo === "canal") {
      // Un valor que no sea uno de los dos dejaría una comunicación que
      // nadie sabe enviar. La base también lo rechaza, pero allí el error
      // sale como un fallo de la base y en pantalla no se entiende nada.
      limpio.canal = body.canal === "push" ? "push" : "email"
      continue
    }
    const v = body[campo]
    if (typeof v === "string") {
      const s = v.trim()
      // Las direcciones y la fecha se guardan como null cuando están vacías:
      // una cadena vacía en una columna de URL obliga a comprobar dos casos en
      // todas partes.
      const anulable = [
        "image_url", "cta_text", "cta_url",
        "event_title", "event_at", "event_timezone", "event_location",
        "interno_image_url", "interno_cta_text", "interno_cta_url",
        "audiencia_hasta", "email_html",
      ]
      limpio[campo] = s === "" && anulable.includes(campo) ? null : s
    } else if (v === null || typeof v === "object") {
      limpio[campo] = v
    }
  }
  return limpio
}

/**
 * Lo que guarda la sincronización de contactos.
 *
 * Vive aquí y no en `proveedor.ts` para que aquel archivo siga hablando solo
 * con Resend y este solo con la base. Se escribe en lotes: una fila por
 * contacto y mil contactos serían mil viajes.
 */
export async function guardarContactosSincronizados(
  audienceId: string,
  filas: Array<{ userId: string; contactId: string | null; email: string; unsubscribed: boolean; error?: string }>,
): Promise<void> {
  if (filas.length === 0) return
  const admin = getSupabaseAdmin()
  const ahora = new Date().toISOString()

  const LOTE = 500
  for (let i = 0; i < filas.length; i += LOTE) {
    const trozo = filas.slice(i, i + LOTE).map((f) => ({
      user_id: f.userId,
      email: f.email,
      resend_contact_id: f.contactId,
      resend_audience_id: audienceId,
      synced_email: f.error ? null : f.email,
      synced_unsubscribed: f.error ? null : f.unsubscribed,
      synced_at: f.error ? null : ahora,
      sync_error: f.error ?? null,
    }))
    const { error } = await admin
      .from("communication_contacts")
      .upsert(trozo, { onConflict: "user_id" })
    if (error) console.error("[comunicaciones] guardar contactos:", error.message)
  }
}

/** Lo que ya se sincronizó, para no repetir llamadas al proveedor. */
export async function leerContactosSincronizados(): Promise<
  Map<string, { contactId: string | null; email: string | null; unsubscribed: boolean | null }>
> {
  const mapa = new Map<string, { contactId: string | null; email: string | null; unsubscribed: boolean | null }>()
  const admin = getSupabaseAdmin()
  const PAGINA = 1000
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await admin
      .from("communication_contacts")
      .select("user_id, resend_contact_id, synced_email, synced_unsubscribed")
      .range(desde, desde + PAGINA - 1)
    if (error) {
      console.error("[comunicaciones] leer contactos:", error.message)
      break
    }
    const lote = data || []
    for (const f of lote as Array<Record<string, unknown>>) {
      mapa.set(String(f.user_id), {
        contactId: (f.resend_contact_id as string) ?? null,
        email: (f.synced_email as string) ?? null,
        unsubscribed: (f.synced_unsubscribed as boolean) ?? null,
      })
    }
    if (lote.length < PAGINA) break
  }
  return mapa
}

/**
 * Las preferencias de correo de una persona, con los valores por defecto.
 *
 * Quien no tiene fila lo recibe todo. Se resuelve al leer y no creando filas
 * para todo el mundo: una tabla con una fila por miembro que dice «sí a todo»
 * es una tabla que hay que mantener sincronizada con las altas para nada.
 */
export type PreferenciasCorreo = {
  novedades: boolean
  contenidos: boolean
  sesiones: boolean
  red: boolean
  unsubscribed_all: boolean
}

export const PREFERENCIAS_POR_DEFECTO: PreferenciasCorreo = {
  novedades: true, contenidos: true, sesiones: true, red: true, unsubscribed_all: false,
}

export async function leerPreferencias(userId: string): Promise<PreferenciasCorreo> {
  const { data } = await getSupabaseAdmin()
    .from("email_preferences")
    .select("novedades, contenidos, sesiones, red, unsubscribed_all")
    .eq("user_id", userId)
    .maybeSingle()
  if (!data) return { ...PREFERENCIAS_POR_DEFECTO }
  return { ...PREFERENCIAS_POR_DEFECTO, ...(data as Partial<PreferenciasCorreo>) }
}
