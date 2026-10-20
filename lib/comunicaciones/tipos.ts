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

/** Las nueve clases de comunicación que administración puede crear. */
export type TipoComunicacion =
  | "contenido"
  | "sesion"
  | "activacion"
  | "encuentro"
  | "novedades"
  | "especial"
  | "lanzamiento"
  | "recursos"
  | "recordatorio"

/**
 * Las cuatro familias de plantilla.
 *
 * No hay treinta plantillas: hay cuatro maneras de estar en una bandeja de
 * entrada. Lo que cambia entre dos comunicaciones del mismo tipo es lo que
 * dicen, no cómo se ven.
 */
export type FamiliaPlantilla = "contenido" | "sesion" | "red" | "especial"

/**
 * Las cinco preferencias de correo.
 *
 * Coinciden con las columnas de `email_preferences` y con lo que se ve en el
 * perfil. Un tipo pertenece a una y solo a una: quien apaga «sesiones en vivo»
 * tiene que dejar de recibir sesiones Y activaciones, sin excepciones que
 * haya que recordar.
 *
 * ── POR QUÉ `recordatorios` ESTÁ APARTE DE TODO LO DEMÁS ──────────────────
 * Las otras cuatro responden a algo que la persona está siguiendo: un
 * episodio de la temporada que ve, una sesión a la que va, la actividad de
 * una Red en la que participa. Un recordatorio no responde a nada suyo: es
 * una decisión nuestra de interrumpirla para que vuelva.
 *
 * Esa diferencia tiene que poder expresarse. Sin su propio interruptor, quien
 * no quiere que le insistan tendría que apagar también los avisos de las
 * sesiones, y lo que acabaría haciendo es darse de baja de todo.
 */
export type PreferenciaCorreo = "novedades" | "contenidos" | "sesiones" | "red" | "recordatorios"

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
  /**
   * Algo que estará disponible próximamente.
   *
   * ── POR QUÉ ES UN TIPO Y NO UN CONTENIDO MÁS ────────────────────────────
   * Porque dice lo contrario: un «nuevo contenido» invita a entrar a verlo, y
   * esto invita a esperar. El botón por defecto no puede llevar al producto,
   * porque el producto todavía está cerrado, y mandar a alguien a una puerta
   * cerrada es peor que no mandarle nada.
   */
  lanzamiento: {
    id: "lanzamiento",
    nombre: "Próximo lanzamiento",
    descripcion: "Algo que estará disponible pronto. Se anuncia antes de abrirlo.",
    familia: "especial",
    preferencia: "novedades",
    llevaFecha: false,
    ctaPorDefecto: "Ver la biblioteca",
    eyebrowPorDefecto: "Pronto en Los 144.000",
  },
  recursos: {
    id: "recursos",
    nombre: "Nuevos recursos",
    descripcion: "Guías, meditaciones, materiales y herramientas de preparación.",
    familia: "contenido",
    preferencia: "contenidos",
    llevaFecha: false,
    ctaPorDefecto: "Explorar",
    eyebrowPorDefecto: "Nuevos recursos",
  },
  /**
   * «Continúa donde lo dejaste», «hace un mes que no apareces».
   *
   * ── EL ÚNICO TIPO QUE NO RESPONDE A NADA QUE HAYA PEDIDO NADIE ──────────
   * Todos los demás salen de un hecho que le interesa a quien lo recibe: hay
   * un episodio nuevo, hay una sesión el jueves. Este sale de una decisión
   * nuestra sobre su tiempo, y por eso es el único con su propio interruptor
   * en las preferencias: se puede apagar sin perder nada más.
   *
   * No lleva eyebrow. «RECORDATORIO» en mayúsculas encima de un mensaje que
   * dice «tu preparación continúa» convierte una invitación en una factura.
   */
  recordatorio: {
    id: "recordatorio",
    nombre: "Recordatorio",
    descripcion: "Para quien dejó algo a medias o lleva tiempo sin aparecer.",
    familia: "especial",
    preferencia: "recordatorios",
    llevaFecha: false,
    ctaPorDefecto: "Continuar",
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
  /**
   * Fuera de la vista, pero no borrada.
   *
   * ── POR QUÉ ARCHIVAR Y NO BORRAR ────────────────────────────────────────
   * Una comunicación enviada es la única prueba de qué se dijo, a cuánta
   * gente y cuándo. Borrarla no borra el correo —ese está en mil bandejas de
   * entrada— pero sí borra la única manera de responder a «¿qué mandamos el
   * martes?». Y se lleva por delante las métricas.
   *
   * Archivar limpia la lista y no pierde nada. Es reversible.
   */
  | "archived"

export const ESTADOS: Record<EstadoComunicacion, { etiqueta: string; tono: "neutro" | "espera" | "bien" | "mal" }> = {
  draft:     { etiqueta: "Borrador",   tono: "neutro" },
  scheduled: { etiqueta: "Programada", tono: "espera" },
  queued:    { etiqueta: "En cola",    tono: "espera" },
  sending:   { etiqueta: "Enviando",   tono: "espera" },
  sent:      { etiqueta: "Enviada",    tono: "bien" },
  cancelled: { etiqueta: "Cancelada",  tono: "neutro" },
  failed:    { etiqueta: "Falló",      tono: "mal" },
  archived:  { etiqueta: "Archivada",  tono: "neutro" },
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

/**
 * A quién va una comunicación.
 *
 * Un objeto y no columnas sueltas: añadir un filtro es añadir un campo, sin
 * tocar el esquema. Los campos vacíos no filtran, así que `{kind:"todos"}` es
 * exactamente lo mismo que el objeto entero sin nada puesto.
 *
 * ── LOS FILTROS SE SUMAN, NUNCA SE RESTAN ─────────────────────────────────
 * Poner dos estrecha; no hay forma de que uno amplíe lo que otro quitó. Es la
 * regla que hace que el número del ensayo de audiencia se pueda razonar: cada
 * filtro que se añade, el número baja o se queda igual.
 */
export type Audiencia = {
  kind: "todos"
  /**
   * Quien haya llegado AL MENOS a esta temporada.
   *
   * «Llegar» es haber visto algún capítulo de ella o tener su acceso. Las dos
   * fuentes suman: quien ya estuvo dentro no puede quedarse fuera de un correo
   * por un desajuste de la tabla comercial, y quien acaba de comprar la cuarta
   * tampoco tiene que haberla empezado para que le hablen de ella.
   */
  temporadaMin?: number | null
  /**
   * Quien haya TERMINADO esta temporada.
   *
   * ── NO ES LO MISMO QUE temporadaMin ─────────────────────────────────────
   * «Llegó a la 3» incluye a quien vio el primer capítulo y lo dejó.
   * «Terminó la 3» es quien la vio entera. Entre las dos cosas está toda la
   * diferencia entre «sigue, que viene la 4» y «felicidades, acabaste».
   *
   * Con 4 aquí se obtiene lo que hacía falta: quién ha completado el camino
   * entero y puede pasar a los Objetivos.
   */
  temporadaCompletada?: number | null
  /**
   * Solo quien tenga alguno de estos roles de La Red.
   *
   * Vacío o ausente es «da igual el rol», no «sin rol». Un filtro que exige
   * algo es lo contrario de un filtro que no se ha puesto.
   */
  roles?: string[] | null
  /**
   * Solo quien haya desbloqueado alguna de estas insignias.
   *
   * Es lo que permite felicitar a quien acaba de llegar a algo: «has alcanzado
   * Arquitecto Cósmico» va justamente a quien lo alcanzó.
   *
   * ── LAS TRES COSAS QUE NO SON LO MISMO ──────────────────────────────────
   *   avance     por dónde va en el camino
   *   rol        qué función desempeña en La Red
   *   insignia   qué ha logrado
   *
   * Se parecen y no lo son: un Guardián puede no haber pasado de la primera
   * temporada, y quien tiene diez insignias puede no tener ningún rol. Por eso
   * son tres filtros y no uno con tres nombres.
   */
  insignias?: string[] | null

  /**
   * Solo quien no ha dado señales de vida en estos días o más.
   *
   * ── QUÉ CUENTA COMO SEÑAL ───────────────────────────────────────────────
   * Haber abierto la plataforma, o haber hecho algo en ella: un comentario,
   * un capítulo visto, un «me gusta». Lo más reciente de las dos cosas.
   *
   * ── POR QUÉ NO ES «EL ÚLTIMO INICIO DE SESIÓN» ──────────────────────────
   * Porque entrar y participar no son lo mismo, y tratarlos igual sería decir
   * que alguien está activo porque abrió la aplicación y la cerró. Pero
   * tampoco hacen falta dos filtros: participar implica haber entrado, así
   * que lo que de verdad importa para reactivar a alguien es cuándo fue la
   * última vez que se supo algo de esa persona, por cualquiera de las dos
   * vías.
   *
   * ── Y POR QUÉ QUIEN NO TIENE NINGUNA SEÑAL QUEDA FUERA ──────────────────
   * Un nulo no significa «hace mucho», significa «no lo sabemos»: cuentas de
   * antes de que esto existiera que no han vuelto a entrar. Mandarles una
   * campaña de «vuelve» sin saber si se fueron es adivinar, y en el peor caso
   * es escribirle a alguien que entró ayer.
   */
  inactivoDias?: number | null

  /**
   * Lo contrario: solo quien SÍ ha aparecido en los últimos días.
   *
   * Para lo que no tiene sentido mandar a quien no está: un encuentro mañana,
   * una convocatoria que se cierra el viernes.
   */
  activoDias?: number | null

  /**
   * Solo quien empezó esta temporada y NO la ha terminado.
   *
   * ── POR QUÉ ES UN FILTRO APARTE Y NO LA RESTA DE LOS OTROS DOS ──────────
   * Se podría pedir «llegó a la 3» y «no completó la 3», pero los filtros de
   * esta pantalla solo estrechan: no hay forma de expresar una negación. Y es
   * justamente el segmento más útil que tiene la plataforma — gente que
   * empezó algo y lo dejó a medias— así que merece su propia casilla en vez
   * de un truco.
   */
  empezoSinTerminar?: number | null

  /**
   * Solo quien esté en estos países. Códigos ISO de dos letras.
   *
   * Sale de `member_location`, que es donde el miembro puso su país al
   * entrar en La Red. No de una deducción por la dirección IP: eso dice
   * dónde está el teléfono hoy, no dónde vive la persona.
   */
  paises?: string[] | null

  /**
   * Solo quien esté en estas ciudades. Identificadores de `network_cities`.
   *
   * ── CUIDADO CON ESTE FILTRO ─────────────────────────────────────────────
   * La ciudad es opcional para el miembro y mucha gente no la ha puesto.
   * Filtrar por ciudad puede dejar una audiencia de cuatro personas cuando
   * en esa ciudad hay cuarenta. El ensayo de audiencia lo dice antes de
   * enviar, y por eso hay que mirarlo.
   */
  ciudades?: number[] | null

  /**
   * Solo estas personas, nombradas una por una.
   *
   * ── POR QUÉ ES UN FILTRO Y NO OTRA CLASE DE AUDIENCIA ───────────────────
   * Porque sigue la regla de la pantalla: nada de lo que hay aquí amplía la
   * audiencia, todo la estrecha. Una lista de personas combinada con «que
   * terminaron la Temporada 2» da la intersección, no la suma — y eso es lo
   * que uno espera de una pantalla donde cada casilla baja el número.
   *
   * Es también lo que permite escribirle a UNA persona sin montar un camino
   * aparte para ello: se pone su nombre y la audiencia es ella.
   */
  personas?: string[] | null
}

/**
 * Por dónde sale una comunicación.
 *
 * Es lo mismo redactado igual y dirigido a la misma gente; lo único que
 * cambia es la salida. Un correo tiene sitio para un titular, una imagen y
 * varios párrafos. Una notificación tiene sitio para un título y dos líneas,
 * y llega al bolsillo en el momento en que se manda.
 */
export type Canal = "email" | "push"

export type Comunicacion = {
  id: string
  type: TipoComunicacion
  /** Por dónde sale. Lo que ya existía es correo, por el valor por defecto. */
  canal: Canal
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
  /**
   * La llave que reserva el envío.
   *
   * Nula mientras es un borrador. Se pone en el mismo UPDATE condicional que
   * pasa la comunicación a «enviando», y eso es lo que impide que dos clics
   * creen dos Broadcasts: la base decide quién gana. Se suelta solo al volver
   * a editar una comunicación que falló.
   */
  send_idempotency_key: string | null
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
