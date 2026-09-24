// CENTRO DE COMUNICACIONES — el vocabulario.
//
// Este archivo es la frontera entre lo que administración escribe y lo que
// sale por correo. Aquí y solo aquí se decide qué tipos existen, a qué familia
// de plantilla pertenece cada uno y qué preferencia del miembro lo gobierna.
//
// ── DOS MUNDOS QUE NO SE MEZCLAN ───────────────────────────────────────────
// TRANSACCIONAL: el enlace de acceso, la recuperación de cuenta, el aviso de
// pago fallido. Salen de un hecho concreto, no dependen de que nadie se haya
// suscrito, y viven en lib/email/ desde antes de todo esto. No se tocan.
//
// EDITORIAL: lo que hay aquí. Un episodio nuevo, una sesión en vivo, un
// encuentro. Respetan preferencias, respetan la baja, y llevan enlace para
// darse de baja.
//
// Confundirlos tiene dos consecuencias feas y opuestas: dejar a alguien sin su
// enlace de acceso porque se dio de baja de las novedades, o escribirle
// novedades a quien pidió no recibirlas. Por eso están separados desde el tipo.

/** Las seis clases de comunicación que administración puede crear. */
export type TipoComunicacion =
  | "contenido"
  | "sesion"
  | "activacion"
  | "encuentro"
  | "novedades"
  | "especial"

/**
 * Las cuatro familias de plantilla.
 *
 * No hay treinta plantillas: hay cuatro maneras de estar en una bandeja de
 * entrada. Lo que cambia entre dos comunicaciones del mismo tipo es lo que
 * dicen, no cómo se ven.
 */
export type FamiliaPlantilla = "contenido" | "sesion" | "red" | "especial"

/**
 * Las cuatro preferencias de correo.
 *
 * Coinciden con las columnas de `email_preferences` y con lo que se ve en el
 * perfil. Un tipo pertenece a una y solo a una: quien apaga «sesiones en vivo»
 * tiene que dejar de recibir sesiones Y activaciones, sin excepciones que
 * haya que recordar.
 */
export type PreferenciaCorreo = "novedades" | "contenidos" | "sesiones" | "red"

export type DefinicionTipo = {
  id: TipoComunicacion
  /** Cómo se llama en el panel. */
  nombre: string
  /** Una línea que explica cuándo se usa. */
  descripcion: string
  familia: FamiliaPlantilla
  preferencia: PreferenciaCorreo
  /** Si la comunicación lleva bloque de fecha y hora. */
  llevaFecha: boolean
  /** El texto por defecto del botón, para no empezar de cero. */
  ctaPorDefecto: string
  /** El eyebrow por defecto: la línea pequeña de arriba del titular. */
  eyebrowPorDefecto: string
}

export const TIPOS: Record<TipoComunicacion, DefinicionTipo> = {
  contenido: {
    id: "contenido",
    nombre: "Nuevo contenido",
    descripcion: "Un episodio, un módulo, una transmisión, una sección o una temporada.",
    familia: "contenido",
    preferencia: "contenidos",
    llevaFecha: false,
    ctaPorDefecto: "Ver ahora",
    eyebrowPorDefecto: "Nuevo en Los 144.000",
  },
  sesion: {
    id: "sesion",
    nombre: "Sesión en vivo",
    descripcion: "Un encuentro en directo con fecha, hora y zona horaria.",
    familia: "sesion",
    preferencia: "sesiones",
    llevaFecha: true,
    ctaPorDefecto: "Reservar mi lugar",
    eyebrowPorDefecto: "Sesión en vivo",
  },
  activacion: {
    id: "activacion",
    nombre: "Activación",
    descripcion: "Una práctica o activación con momento señalado.",
    familia: "sesion",
    preferencia: "sesiones",
    llevaFecha: true,
    ctaPorDefecto: "Participar",
    eyebrowPorDefecto: "Activación",
  },
  encuentro: {
    id: "encuentro",
    nombre: "Encuentro",
    descripcion: "Un encuentro de La Red, presencial o en línea.",
    familia: "red",
    preferencia: "red",
    llevaFecha: true,
    ctaPorDefecto: "Ver el encuentro",
    eyebrowPorDefecto: "Encuentro de La Red",
  },
  novedades: {
    id: "novedades",
    nombre: "Novedades de La Red",
    descripcion: "Lo que está ocurriendo en la comunidad.",
    familia: "red",
    preferencia: "novedades",
    llevaFecha: false,
    ctaPorDefecto: "Entrar a La Red",
    eyebrowPorDefecto: "Novedades",
  },
  especial: {
    id: "especial",
    nombre: "Comunicación especial",
    descripcion: "Un mensaje importante que no encaja en los demás.",
    familia: "especial",
    preferencia: "novedades",
    llevaFecha: false,
    ctaPorDefecto: "Leer más",
    eyebrowPorDefecto: "",
  },
}

export const TIPOS_LISTA: DefinicionTipo[] = Object.values(TIPOS)

export function esTipoValido(v: unknown): v is TipoComunicacion {
  return typeof v === "string" && v in TIPOS
}

/** Qué preferencia gobierna este tipo. Nunca se decide en otro sitio. */
export function preferenciaDe(tipo: TipoComunicacion): PreferenciaCorreo {
  return TIPOS[tipo].preferencia
}

// ── Estados ────────────────────────────────────────────────────────────────

export type EstadoComunicacion =
  | "draft"
  | "scheduled"
  | "queued"
  | "sending"
  | "sent"
  | "cancelled"
  | "failed"

export const ESTADOS: Record<EstadoComunicacion, { etiqueta: string; tono: "neutro" | "espera" | "bien" | "mal" }> = {
  draft:     { etiqueta: "Borrador",   tono: "neutro" },
  scheduled: { etiqueta: "Programada", tono: "espera" },
  queued:    { etiqueta: "En cola",    tono: "espera" },
  sending:   { etiqueta: "Enviando",   tono: "espera" },
  sent:      { etiqueta: "Enviada",    tono: "bien" },
  cancelled: { etiqueta: "Cancelada",  tono: "neutro" },
  failed:    { etiqueta: "Falló",      tono: "mal" },
}

/**
 * Una comunicación ya salida no se edita.
 *
 * Cambiar el texto de algo que ya está en mil bandejas de entrada no cambia
 * nada en esas bandejas: solo hace que el registro deje de coincidir con lo
 * que la gente leyó. Si hay que decir otra cosa, se duplica y se manda otra.
 */
export function esEditable(estado: EstadoComunicacion): boolean {
  return estado === "draft" || estado === "failed"
}

/** Solo se cancela lo que todavía no ha salido. */
export function esCancelable(estado: EstadoComunicacion): boolean {
  return estado === "scheduled"
}

// ── La comunicación ────────────────────────────────────────────────────────

export type Audiencia = {
  /**
   * Hoy solo existe «todos». Cuando haya datos para más —temporada, ciudad,
   * círculo— serán campos de este mismo objeto, sin migración.
   */
  kind: "todos"
}

export type Comunicacion = {
  id: string
  type: TipoComunicacion
  internal_title: string
  subject: string
  preheader: string
  eyebrow: string
  heading: string
  body: string
  image_url: string | null
  cta_text: string | null
  cta_url: string | null
  event_title: string | null
  event_at: string | null
  event_timezone: string | null
  event_location: string | null
  audience: Audiencia
  status: EstadoComunicacion
  scheduled_at: string | null
  scheduled_timezone: string | null
  provider_broadcast_id: string | null
  provider_audience_id: string | null
  provider_topic_id: string | null
  provider_error: string | null
  recipients_estimated: number | null
  recipients_excluded: number | null
  sent_at: string | null
  metrics: MetricasComunicacion | null
  metrics_synced_at: string | null
  created_by: string | null
  sent_by: string | null
  created_at: string
  updated_at: string
}

/**
 * Lo que hace falta saber de una comunicación enviada.
 *
 * Tres preguntas, no cien métricas: ¿llegó?, ¿lo abrieron?, ¿hicieron clic?
 * Lo demás —rebotes, quejas, bajas— importa cuando algo va mal, y por eso
 * está, pero no manda en la pantalla.
 */
export type MetricasComunicacion = {
  enviados?: number
  entregados?: number
  aperturas?: number
  clics?: number
  rebotes?: number
  quejas?: number
  bajas?: number
}
