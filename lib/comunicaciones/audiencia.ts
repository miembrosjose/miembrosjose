// CENTRO DE COMUNICACIONES — a quién le llega, y a quién no.
//
// ── TODO ESTO OCURRE EN EL SERVIDOR ────────────────────────────────────────
// Ni un solo correo de nadie viaja al navegador para contarlo. El panel pide
// un número y recibe un número. Con mil miembros daría igual; con veinte mil
// sería la diferencia entre una pantalla que responde y una que se cuelga, y
// además no hay ninguna razón para que el navegador de administración tenga
// en memoria el correo de toda La Red.
//
// ── LA FUENTE DE VERDAD ES SUPABASE ────────────────────────────────────────
// Quién es miembro, con qué correo y qué quiere recibir se decide aquí. Resend
// solo reparte. Por eso el recuento se hace contra `profiles` y
// `email_preferences`, nunca preguntándole a Resend cuántos contactos tiene.
//
// ── POR QUÉ NO SE USA auth.admin.listUsers ─────────────────────────────────
// Es la forma en que el panel lista miembros hoy, y funciona para doscientos.
// Pero devuelve páginas de cien, no se puede filtrar ni contar del lado del
// servidor, y para saber cuántas personas recibirían un correo habría que
// traérselas todas. `profiles` es una tabla normal: se cuenta con un count.

import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { ACHIEVEMENTS } from "@/lib/achievements"
import { nombrePais } from "@/lib/red/paises"
import type { Audiencia, Canal, PreferenciaCorreo, TipoComunicacion } from "./tipos"
import { preferenciaDe } from "./tipos"

export type MotivoExclusion =
  | "sin_correo"
  | "correo_invalido"
  | "baja_total"
  | "preferencia_apagada"
  | "duplicado"
  | "no_llego_a_temporada"
  | "sin_ese_rol"
  | "sin_esa_insignia"
  | "no_termino_temporada"
  | "aun_activo"
  | "inactivo_hace_mucho"
  | "sin_senal"
  | "ya_la_termino"
  | "no_la_empezo"
  | "otro_pais"
  | "otra_ciudad"
  | "no_en_la_lista"

export type ResumenAudiencia = {
  /** Cómo se llama esta audiencia en pantalla. */
  etiqueta: string
  /** Cuántas personas hay en el padrón antes de excluir a nadie. */
  total: number
  /** Cuántas lo recibirían. */
  destinatarios: number
  /** Cuántas quedan fuera, y por qué. */
  excluidos: number
  motivos: Array<{ motivo: MotivoExclusion; etiqueta: string; cuantos: number }>
  /** La preferencia que gobierna este envío. */
  preferencia: PreferenciaCorreo
}

const ETIQUETA_MOTIVO: Record<MotivoExclusion, string> = {
  sin_correo: "Sin correo registrado",
  correo_invalido: "Correo con formato inválido",
  baja_total: "Se dio de baja de todas las comunicaciones",
  preferencia_apagada: "Desactivó esta clase de comunicación",
  duplicado: "Correo repetido (se envía una sola vez)",
  no_llego_a_temporada: "Todavía no ha llegado a esa temporada",
  sin_ese_rol: "No tiene el rol pedido",
  sin_esa_insignia: "No ha desbloqueado esa insignia",
  no_termino_temporada: "Todavía no ha terminado esa temporada",
  aun_activo: "Ha aparecido hace menos de ese tiempo",
  inactivo_hace_mucho: "Lleva más tiempo sin aparecer del pedido",
  sin_senal: "Nunca hemos registrado una señal suya",
  ya_la_termino: "Ya terminó esa temporada",
  no_la_empezo: "Todavía no ha empezado esa temporada",
  otro_pais: "Está en otro país, o no lo ha puesto",
  otra_ciudad: "Está en otra ciudad, o no la ha puesto",
  no_en_la_lista: "No está entre las personas elegidas",
}

const ETIQUETA_PREFERENCIA: Record<PreferenciaCorreo, string> = {
  novedades: "Novedades importantes",
  contenidos: "Nuevos contenidos y transmisiones",
  sesiones: "Sesiones en vivo y activaciones",
  red: "Encuentros y actividad de La Red",
  recordatorios: "Recordatorios para continuar",
}

/**
 * Comprobación de correo deliberadamente laxa.
 *
 * No se trata de decidir si una dirección existe —eso solo lo sabe el servidor
 * que la recibe— sino de descartar lo que seguro que no es una: una cadena sin
 * arroba, sin punto detrás, o con espacios. Ser más estricto aquí solo sirve
 * para dejar fuera a personas con direcciones perfectamente válidas.
 */
export function correoPlausible(e: string | null | undefined): boolean {
  if (!e) return false
  const s = e.trim()
  if (s.length < 6 || s.length > 254) return false
  if (/\s/.test(s)) return false
  return /^[^@]+@[^@]+\.[^@]{2,}$/.test(s)
}

export type Destinatario = { userId: string; email: string; nombre: string | null }

/**
 * Hasta qué temporada ha llegado cada quien.
 *
 * Dos fuentes que SUMAN, nunca se contradicen:
 *   · haber visto algún capítulo de una temporada
 *   · tener su acceso concedido
 *
 * Quien ya estuvo dentro no puede quedarse fuera de un correo por un desajuste
 * de la tabla comercial; y quien acaba de comprar la cuarta no tiene que
 * haberla empezado para que le hablen de ella.
 *
 * Se lee de una vez para todo el padrón. Preguntar por persona serían mil
 * consultas para enseñar un número.
 */
async function temporadaAlcanzada(): Promise<Map<string, number>> {
  return (await avanceDeTodos()).alcanzada
}

/**
 * El avance de todo el padrón, en una sola lectura.
 *
 * Devuelve dos cosas que se parecen y no son iguales:
 *
 *   alcanzada   la temporada más alta que ha tocado — vale con un capítulo
 *   completadas las que ha visto ENTERAS
 *
 * Entre una y otra está toda la diferencia entre «sigue, que viene la 4» y
 * «felicidades, acabaste el camino». Se calculan juntas porque salen de la
 * misma tabla y leerla dos veces sería leer lo mismo dos veces.
 */
async function avanceDeTodos(): Promise<{
  alcanzada: Map<string, number>
  completadas: Map<string, Set<number>>
}> {
  const admin = getSupabaseAdmin()
  const mayor = new Map<string, number>()
  const anotar = (uid: string, n: number) => {
    if (!Number.isFinite(n)) return
    const ya = mayor.get(uid)
    if (ya === undefined || n > ya) mayor.set(uid, n)
  }

  // ── Cuántos capítulos tiene cada temporada ────────────────────────────
  // Se cuentan las filas reales de `episodes`; `seasons.episodes` queda de
  // respaldo por si una temporada está declarada y aún sin cargar. Es el mismo
  // criterio que usa el cálculo de insignias, y tiene que serlo: si aquí se
  // contara distinto, «terminó la Temporada 3» y la insignia de terminarla
  // dirían cosas diferentes de la misma persona.
  const [{ data: temporadasFilas }, { data: capitulos }] = await Promise.all([
    admin.from("seasons").select("id, num, episodes"),
    admin.from("episodes").select("season_id"),
  ])

  const numPorSeasonId = new Map<string, number>()
  const declarados = new Map<number, number>()
  for (const s of (temporadasFilas || []) as Array<{ id: string; num: number; episodes: number | null }>) {
    numPorSeasonId.set(s.id, Number(s.num))
    if (s.episodes) declarados.set(Number(s.num), Number(s.episodes))
  }

  const reales = new Map<number, number>()
  for (const c of (capitulos || []) as Array<{ season_id: string }>) {
    const n = numPorSeasonId.get(c.season_id)
    if (n) reales.set(n, (reales.get(n) || 0) + 1)
  }

  const totalDe = (n: number) => reales.get(n) || declarados.get(n) || 0

  // ── Qué ha visto cada quien ───────────────────────────────────────────
  // Por (temporada, capítulo) y no por número de filas: la misma persona puede
  // tener dos filas del mismo capítulo, y contarlas daría por terminada una
  // temporada vista a medias.
  const vistos = new Map<string, Map<number, Set<number>>>()

  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await admin
      .from("user_episode_progress")
      .select("user_id, season_num, episode_num")
      .range(desde, desde + 999)
    if (error) break
    const lote = (data || []) as Array<{ user_id: string; season_num: number; episode_num: number }>
    for (const f of lote) {
      anotar(f.user_id, Number(f.season_num))
      const suyas = vistos.get(f.user_id) ?? new Map<number, Set<number>>()
      const cap = suyas.get(Number(f.season_num)) ?? new Set<number>()
      cap.add(Number(f.episode_num))
      suyas.set(Number(f.season_num), cap)
      vistos.set(f.user_id, suyas)
    }
    if (lote.length < 1000) break
  }

  const completadas = new Map<string, Set<number>>()
  for (const [uid, suyas] of vistos) {
    const hechas = new Set<number>()
    for (const [temporada, caps] of suyas) {
      const total = totalDe(temporada)
      // Una temporada sin capítulos cargados no se puede haber terminado. Sin
      // esta guarda, 0 >= 0 la daría por completa para todo el mundo.
      if (total > 0 && caps.size >= total) hechas.add(temporada)
    }
    if (hechas.size > 0) completadas.set(uid, hechas)
  }

  await completarConAcceso(mayor, numPorSeasonId)
  return { alcanzada: mayor, completadas }
}

/** El acceso concedido también cuenta como «alcanzada». */
async function completarConAcceso(
  mayor: Map<string, number>,
  numPorSeasonId: Map<string, number>,
): Promise<void> {
  const admin = getSupabaseAdmin()

  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await admin
      .from("user_season_access")
      .select("user_id, season_id")
      .range(desde, desde + 999)
    if (error) break
    const lote = (data || []) as Array<{ user_id: string; season_id: string }>
    for (const f of lote) {
      const n = numPorSeasonId.get(f.season_id)
      if (!n) continue
      const ya = mayor.get(f.user_id)
      if (ya === undefined || n > ya) mayor.set(f.user_id, n)
    }
    if (lote.length < 1000) break
  }
}

/**
 * Quién ha desbloqueado qué insignia.
 *
 * Se lee de `user_unlocked_achievements`, que es donde quedan guardadas al
 * concederse. No se derivan aquí: derivarlas es la lógica de
 * lib/insignias-ganadas.ts, que mira episodios, foro, accesos y compras de una
 * persona concreta. Hacer eso para todo el padrón serían miles de consultas
 * para enseñar un número.
 *
 * Consecuencia que conviene saber: si alguien cumple los requisitos de una
 * insignia pero todavía no ha entrado en la plataforma desde que los cumplió,
 * no la tiene concedida y este filtro no lo incluye. Es lo correcto —la
 * insignia aún no existe para esa persona— pero explica alguna cifra menor de
 * la esperada.
 */
async function insigniasPorMiembro(): Promise<Map<string, Set<string>>> {
  const admin = getSupabaseAdmin()
  const mapa = new Map<string, Set<string>>()
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await admin
      .from("user_unlocked_achievements")
      .select("user_id, achievement_id")
      .range(desde, desde + 999)
    if (error) break
    const lote = (data || []) as Array<{ user_id: string; achievement_id: string }>
    for (const f of lote) {
      const s = mapa.get(f.user_id) ?? new Set<string>()
      s.add(f.achievement_id)
      mapa.set(f.user_id, s)
    }
    if (lote.length < 1000) break
  }
  return mapa
}

/** Quién tiene qué rol vigente en La Red. */
async function rolesPorMiembro(): Promise<Map<string, Set<string>>> {
  const admin = getSupabaseAdmin()
  const mapa = new Map<string, Set<string>>()
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await admin
      .from("network_role_assignments")
      .select("user_id, role_code")
      .is("revoked_at", null)
      .range(desde, desde + 999)
    if (error) break
    const lote = (data || []) as Array<{ user_id: string; role_code: string }>
    for (const f of lote) {
      const s = mapa.get(f.user_id) ?? new Set<string>()
      s.add(f.role_code)
      mapa.set(f.user_id, s)
    }
    if (lote.length < 1000) break
  }
  return mapa
}

export const ETIQUETA_ROL: Record<string, string> = {
  organizador: "Organizador",
  facilitador: "Facilitador",
  embajador: "Embajador Galáctico",
  colaborador: "Colaborador",
  cartografo: "Cartógrafo",
  guardian: "Guardián de La Red",
  instructor: "Instructor",
}

/**
 * La última señal de vida de cada miembro.
 *
 * ── POR QUÉ UNA FUNCIÓN DE LA BASE Y NO UNA CONSULTA DE AQUÍ ───────────────
 * Lo que hace falta es un máximo por persona, y la API de tablas no sabe
 * agrupar: habría que traerse `xp_events` entera —decenas de miles de filas—
 * para calcular un número por miembro. `actividad_de_miembros()` lo calcula
 * dentro y devuelve una fila por persona.
 *
 * Qué cuenta como señal, y por qué es una sola y no dos, está explicado en
 * docs/sql/campanas_01_actividad.sql.
 *
 * ── SI LA FUNCIÓN NO EXISTE TODAVÍA ────────────────────────────────────────
 * Se devuelve un mapa vacío y se lanza, porque un filtro de inactividad sin
 * datos de actividad no da «nadie»: daría «todos», y eso es una campaña de
 * reactivación mandada a toda La Red. Es mejor que el envío no salga.
 */
async function actividadDeTodos(): Promise<Map<string, number>> {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.rpc("actividad_de_miembros")

  if (error) {
    throw new Error(
      "No se pudo leer la actividad de los miembros. " +
      "Si es la primera vez, falta correr docs/sql/campanas_01_actividad.sql. " +
      `Detalle: ${error.message}`,
    )
  }

  const cuando = new Map<string, number>()
  for (const f of (data || []) as Array<{ user_id: string; ultima_senal: string | null }>) {
    if (!f.ultima_senal) continue
    const t = new Date(f.ultima_senal).getTime()
    if (Number.isFinite(t)) cuando.set(f.user_id, t)
  }
  return cuando
}

/**
 * Dónde está cada miembro, según lo que él mismo puso.
 *
 * No una deducción por la dirección IP: eso dice dónde está el teléfono hoy.
 *
 * `show_city` no se mira a propósito. Ese interruptor decide si su ciudad se
 * ENSEÑA a los demás en el mapa y en el directorio, que es otra cosa: aquí no
 * se enseña a nadie, se usa para decidir a quién le interesa un encuentro en
 * su ciudad. Y nada de esto viaja al navegador: lo que sale al panel es un
 * número.
 */
async function ubicacionDeTodos(): Promise<Map<string, { pais: string; ciudad: number | null }>> {
  const admin = getSupabaseAdmin()
  const donde = new Map<string, { pais: string; ciudad: number | null }>()

  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await admin
      .from("member_location")
      .select("user_id, country_code, city_id")
      .range(desde, desde + 999)
    if (error) throw new Error(`No se pudo leer la ubicación: ${error.message}`)

    const lote = (data || []) as Array<{ user_id: string; country_code: string; city_id: number | null }>
    for (const f of lote) {
      donde.set(f.user_id, {
        pais: (f.country_code || "").toUpperCase(),
        ciudad: f.city_id ?? null,
      })
    }
    if (lote.length < 1000) break
  }

  return donde
}

/** Cómo se lee esta audiencia en una línea. */
export function describirAudiencia(a: Audiencia): string {
  const partes: string[] = []
  if (a.temporadaMin) partes.push("que llegaron a la Temporada " + a.temporadaMin + " o más")
  if (a.temporadaCompletada) {
    partes.push(
      a.temporadaCompletada >= 4
        ? "que completaron el camino entero"
        : "que terminaron la Temporada " + a.temporadaCompletada,
    )
  }
  if (a.roles?.length) {
    partes.push("con rol de " + a.roles.map((r) => ETIQUETA_ROL[r] ?? r).join(" o "))
  }
  if (a.insignias?.length) {
    partes.push("con la insignia " + a.insignias.map((i) => nombreInsignia(i)).join(" o "))
  }
  if (a.empezoSinTerminar) {
    partes.push("que empezaron la Temporada " + a.empezoSinTerminar + " y no la terminaron")
  }
  if (a.inactivoDias) {
    partes.push("sin aparecer desde hace " + a.inactivoDias + " días o más")
  }
  if (a.activoDias) {
    partes.push("que han aparecido en los últimos " + a.activoDias + " días")
  }
  if (a.paises?.length) {
    partes.push("de " + a.paises.map((c) => nombrePais(c)).join(" o "))
  }
  if (a.ciudades?.length) {
    partes.push(a.ciudades.length === 1 ? "de una ciudad concreta" : "de " + a.ciudades.length + " ciudades")
  }
  // Las personas nombradas van al principio de la frase, no al final: si
  // hay una lista, es el dato que manda y lo demás son matices.
  if (a.personas?.length) {
    const cuantas = a.personas.length === 1 ? "Una persona" : a.personas.length + " personas elegidas"
    return partes.length === 0 ? cuantas : cuantas + ", " + partes.join(", ")
  }
  return partes.length === 0
    ? "Todos los miembros activos"
    : "Miembros " + partes.join(", ")
}

/**
 * El padrón que recibiría esta comunicación, resuelto entero.
 *
 * Devuelve las personas, no solo el número, porque es lo que necesita la
 * sincronización de contactos. El recuento para el panel usa esto mismo y se
 * queda solo con las cifras: una sola manera de decidir quién entra, para que
 * el número que se enseña antes de enviar no pueda diferir de a quién le llega.
 */
export async function resolverAudiencia(
  audiencia: Audiencia,
  tipo: TipoComunicacion,
  canal: Canal = "email",
): Promise<{ destinatarios: Destinatario[]; resumen: ResumenAudiencia }> {
  // Para los dispositivos y los topes, un mensaje directo se parece más al
  // push que al correo: va a una persona identificada, no a una dirección.
  const esPush = canal === "push"
  const admin = getSupabaseAdmin()
  const preferencia = preferenciaDe(tipo)

  if (audiencia?.kind !== "todos") {
    throw new Error("Audiencia no reconocida")
  }

  // Los padrones de filtro solo se leen si algún filtro los pide. Sin filtros,
  // esto no hace ni una consulta de más.
  const temporadaMin = Number(audiencia.temporadaMin)
  const pideTemporada = Number.isFinite(temporadaMin) && temporadaMin > 0
  const rolesPedidos = (audiencia.roles || []).filter(Boolean)
  const pideRol = rolesPedidos.length > 0
  const insigniasPedidas = (audiencia.insignias || []).filter(Boolean)
  const pideInsignia = insigniasPedidas.length > 0

  const completadaMin = Number(audiencia.temporadaCompletada)
  const pideCompletada = Number.isFinite(completadaMin) && completadaMin > 0

  // ── EMPEZÓ Y NO TERMINÓ ─────────────────────────────────────────────────
  // El segmento más útil que tiene la plataforma, y el único que necesita las
  // dos caras del avance a la vez: haber llegado a esa temporada Y no tenerla
  // completa.
  const aMedias = Number(audiencia.empezoSinTerminar)
  const pideAMedias = Number.isFinite(aMedias) && aMedias > 0

  const diasInactivo = Number(audiencia.inactivoDias)
  const pideInactivo = Number.isFinite(diasInactivo) && diasInactivo > 0
  const diasActivo = Number(audiencia.activoDias)
  const pideActivo = Number.isFinite(diasActivo) && diasActivo > 0

  const paisesPedidos = (audiencia.paises || []).filter(Boolean).map((c) => c.toUpperCase())
  const pidePais = paisesPedidos.length > 0
  const ciudadesPedidas = (audiencia.ciudades || []).filter((n) => Number.isFinite(Number(n))).map(Number)
  const pideCiudad = ciudadesPedidas.length > 0

  const elegidas = new Set((audiencia.personas || []).filter(Boolean))
  const pidePersonas = elegidas.size > 0

  // El avance se calcula una vez y sirve a los tres filtros que lo usan.
  const avanceCompleto = (pideTemporada || pideCompletada || pideAMedias)
    ? await avanceDeTodos()
    : { alcanzada: new Map<string, number>(), completadas: new Map<string, Set<number>>() }

  // ── POR QUÉ ESTOS DOS VAN EN PARALELO Y LOS DE ARRIBA NO ────────────────
  // Porque son independientes entre sí y cada uno es una ida y vuelta a la
  // base. Esperar a uno para empezar el otro sería sumar dos esperas donde
  // cabe una sola.
  const [actividad, ubicacion, roles, insignias] = await Promise.all([
    (pideInactivo || pideActivo) ? actividadDeTodos() : Promise.resolve(new Map<string, number>()),
    (pidePais || pideCiudad) ? ubicacionDeTodos() : Promise.resolve(new Map<string, { pais: string; ciudad: number | null }>()),
    pideRol ? rolesPorMiembro() : Promise.resolve(new Map<string, Set<string>>()),
    pideInsignia ? insigniasPorMiembro() : Promise.resolve(new Map<string, Set<string>>()),
  ])
  const avance = avanceCompleto.alcanzada
  const completadas = avanceCompleto.completadas

  // El corte en el tiempo se calcula UNA vez, antes del bucle. Dentro sería
  // un `Date.now()` por miembro, y con mil personas el primero y el último se
  // medirían contra instantes distintos.
  const ahoraMs = Date.now()
  const DIA = 24 * 60 * 60 * 1000

  // ── El padrón ───────────────────────────────────────────────────────────
  // Por páginas, porque una tabla puede crecer más que el límite por defecto
  // de PostgREST y un límite silencioso aquí sería enviar a la mitad de la
  // gente creyendo que se envió a todos.
  const filas: Array<{ id: string; email: string | null; full_name: string | null }> = []
  const PAGINA = 1000
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await admin
      .from("profiles")
      .select("id, email, full_name")
      .range(desde, desde + PAGINA - 1)
    if (error) throw new Error(`No se pudo leer el padrón: ${error.message}`)
    const lote = data || []
    filas.push(...(lote as typeof filas))
    if (lote.length < PAGINA) break
  }

  // ── Quién ha dicho que no ───────────────────────────────────────────────
  // Solo las filas que EXCLUYEN. Quien no ha tocado nunca sus preferencias no
  // tiene fila, y lo recibe todo: es lo que espera alguien que acaba de entrar.
  //
  // ── Y POR QUÉ UN FALLO AQUÍ DETIENE TODO ───────────────────────────
  // Esta consulta no se podía fallar en silencio, y lo hacía: sin mirar el
  // error, una tabla inaccesible o una columna que todavía no existe daban
  // una lista vacía de exclusiones, que no significa "nadie se dio de baja"
  // sino "no se sabe". Y el envío seguía, a todos.
  //
  // Escribirle a quien pidió no recibir nada no se deshace. Ante la duda, no
  // se envía.
  // ── EL MENSAJE DIRECTO NO MIRA LAS PREFERENCIAS DE CORREO ─────────────
  //
  // Darse de baja de las novedades es decir «no me mandéis publicidad al
  // correo». No es decir «no me escribáis». Un mensaje privado llega a la
  // bandeja de mensajes de la plataforma, de persona a persona, y se puede
  // contestar: aplicarle la baja del boletín dejaría sin respuesta a alguien
  // que solo quería que no le llegaran novedades.
  //
  // Lo que sí lo frena es lo mismo que frena cualquier mensaje: el bloqueo
  // entre dos personas, que se comprueba al enviarlo y no aquí.
  const sinPreferencias = canal === "dm"

  const { data: prefs, error: errPrefs } = sinPreferencias
    ? { data: [], error: null }
    : await admin
      .from("email_preferences")
      .select(`user_id, unsubscribed_all, ${preferencia}`)
      .or(`unsubscribed_all.eq.true,${preferencia}.eq.false`)

  if (errPrefs) {
    throw new Error(
      "No se pudieron leer las preferencias de quien se dio de baja, así que " +
      "el envío no sale. Si la preferencia es nueva, falta correr " +
      `docs/sql/campanas_02_categorias.sql. Detalle: ${errPrefs.message}`,
    )
  }

  const bajaTotal = new Set<string>()
  const apagada = new Set<string>()
  for (const p of (prefs || []) as unknown as Array<Record<string, unknown>>) {
    const id = String(p.user_id)
    if (p.unsubscribed_all === true) bajaTotal.add(id)
    else if (p[preferencia] === false) apagada.add(id)
  }

  // ── El reparto ──────────────────────────────────────────────────────────
  const cuenta: Record<MotivoExclusion, number> = {
    sin_correo: 0, correo_invalido: 0, baja_total: 0,
    preferencia_apagada: 0, duplicado: 0,
    no_llego_a_temporada: 0, sin_ese_rol: 0, sin_esa_insignia: 0,
    no_termino_temporada: 0,
    aun_activo: 0, inactivo_hace_mucho: 0, sin_senal: 0,
    ya_la_termino: 0, no_la_empezo: 0,
    otro_pais: 0, otra_ciudad: 0, no_en_la_lista: 0,
  }
  const vistos = new Set<string>()
  const destinatarios: Destinatario[] = []

  for (const f of filas) {
    const correo = (f.email || "").trim().toLowerCase()

    // ── POR QUE UNA NOTIFICACION NO EXIGE CORREO ──────────────────────
    // A un aviso en el teléfono no le hace falta la dirección: va a los
    // dispositivos de la persona. Dejar fuera a quien tiene el correo mal
    // escrito habría sido quitarle avisos por un dato que no se usa.
    if (!esPush) {
      if (!correo) { cuenta.sin_correo++; continue }
      if (!correoPlausible(correo)) { cuenta.correo_invalido++; continue }
    }
    if (bajaTotal.has(f.id)) { cuenta.baja_total++; continue }
    if (apagada.has(f.id)) { cuenta.preferencia_apagada++; continue }

    // ── LAS PERSONAS ELEGIDAS, PRIMERO ──────────────────────────────────
    // Si hay una lista, es el filtro que manda: todo lo demás son matices
    // sobre ella. Y va antes que las preferencias para que el panel diga
    // «no está entre las elegidas» en vez de «se dio de baja», que explica
    // otra cosa.
    if (pidePersonas && !elegidas.has(f.id)) {
      cuenta.no_en_la_lista++
      continue
    }

    // Los filtros van DESPUÉS de las preferencias: quien se dio de baja
    // aparece como «se dio de baja» y no como «no tiene el rol», que es lo que
    // de verdad explica por qué no le llega.
    if (pideTemporada && (avance.get(f.id) ?? 0) < temporadaMin) {
      cuenta.no_llego_a_temporada++
      continue
    }
    if (pideCompletada && !(completadas.get(f.id)?.has(completadaMin))) {
      cuenta.no_termino_temporada++
      continue
    }

    // ── EMPEZÓ Y NO TERMINÓ ─────────────────────────────────────────────
    // Dos condiciones, y cada una con su propio motivo: «todavía no la ha
    // empezado» y «ya la terminó» son dos razones distintas de quedarse
    // fuera, y verlas separadas en el ensayo es lo que permite entender la
    // cifra en vez de confiar en ella.
    if (pideAMedias) {
      if ((avance.get(f.id) ?? 0) < aMedias) {
        cuenta.no_la_empezo++
        continue
      }
      if (completadas.get(f.id)?.has(aMedias)) {
        cuenta.ya_la_termino++
        continue
      }
    }

    // ── EL TIEMPO SIN APARECER ──────────────────────────────────────────
    // Quien no tiene ninguna señal registrada queda FUERA de los dos
    // filtros, no dentro del de inactividad. Un nulo no significa «hace
    // mucho», significa «no lo sabemos», y mandarle un «vuelve» a quien
    // quizá entró ayer es peor que no mandarle nada.
    if (pideInactivo || pideActivo) {
      const senal = actividad.get(f.id)
      if (senal === undefined) {
        cuenta.sin_senal++
        continue
      }
      if (pideInactivo && senal > ahoraMs - diasInactivo * DIA) {
        cuenta.aun_activo++
        continue
      }
      if (pideActivo && senal < ahoraMs - diasActivo * DIA) {
        cuenta.inactivo_hace_mucho++
        continue
      }
    }

    // ── DÓNDE ESTÁ ──────────────────────────────────────────────────────
    // Sin fila en `member_location` no hay país ni ciudad, y quien no lo ha
    // puesto no puede entrar en un filtro geográfico: no es que esté fuera
    // del país, es que no sabemos dónde está.
    if (pidePais || pideCiudad) {
      const donde = ubicacion.get(f.id)
      if (pidePais && (!donde || !paisesPedidos.includes(donde.pais))) {
        cuenta.otro_pais++
        continue
      }
      if (pideCiudad && (!donde || donde.ciudad == null || !ciudadesPedidas.includes(donde.ciudad))) {
        cuenta.otra_ciudad++
        continue
      }
    }

    if (pideRol) {
      const suyos = roles.get(f.id)
      if (!suyos || !rolesPedidos.some((r) => suyos.has(r))) {
        cuenta.sin_ese_rol++
        continue
      }
    }
    if (pideInsignia) {
      const suyas = insignias.get(f.id)
      if (!suyas || !insigniasPedidas.some((i) => suyas.has(i))) {
        cuenta.sin_esa_insignia++
        continue
      }
    }
    // Dos perfiles con el mismo correo reciben un solo mensaje. Recibir dos
    // copias del mismo correo es lo que hace que alguien marque como spam.
    //
    // Por push se agrupa por persona y no por correo: ahi el duplicado no
    // puede ocurrir —cada perfil es una fila— y agrupar por correo habría
    // dejado sin aviso al segundo perfil de quien tiene dos, que en el
    // teléfono sí son dos personas distintas.
    const llave = esPush ? f.id : correo
    if (vistos.has(llave)) { cuenta.duplicado++; continue }

    vistos.add(llave)
    destinatarios.push({ userId: f.id, email: correo, nombre: f.full_name })
  }

  const motivos = (Object.keys(cuenta) as MotivoExclusion[])
    .filter((m) => cuenta[m] > 0)
    .map((m) => ({ motivo: m, etiqueta: ETIQUETA_MOTIVO[m], cuantos: cuenta[m] }))

  const excluidos = motivos.reduce((a, m) => a + m.cuantos, 0)

  return {
    destinatarios,
    resumen: {
      etiqueta: describirAudiencia(audiencia),
      total: filas.length,
      destinatarios: destinatarios.length,
      excluidos,
      motivos,
      preferencia,
    },
  }
}

/** Solo las cifras. Es lo único que sale hacia el panel. */
export async function contarAudiencia(
  audiencia: Audiencia,
  tipo: TipoComunicacion,
  canal: Canal = "email",
): Promise<ResumenAudiencia> {
  const { resumen } = await resolverAudiencia(audiencia, tipo, canal)
  return resumen
}

/**
 * Lo mismo, y además QUIÉNES son.
 *
 * ── POR QUÉ HACÍA FALTA ───────────────────────────────────────────────────
 * Un número no se puede comprobar. «68 personas» es igual de creíble siendo
 * correcto que estando mal: no hay forma de mirarlo y decir «falta fulana» o
 * «esa no debería estar». Con los nombres delante, sí.
 *
 * ── POR QUÉ SE CORTA ──────────────────────────────────────────────────────
 * Porque el objetivo es RECONOCER la audiencia, no auditarla. Con doscientos
 * nombres ya no se lee: se desplaza. El número de arriba sigue siendo el
 * total, y se dice cuántos quedan sin enseñar para que nadie crea que la
 * lista es todo.
 */
export async function quienesSon(
  audiencia: Audiencia,
  tipo: TipoComunicacion,
  canal: Canal = "email",
  tope = 200,
): Promise<{ resumen: ResumenAudiencia; personas: Destinatario[]; mas: number }> {
  const { resumen, destinatarios } = await resolverAudiencia(audiencia, tipo, canal)

  // Por nombre, y los que no tienen al final. Buscar a alguien en una lista
  // sin orden es mirarla entera.
  const ordenados = [...destinatarios].sort((a, b) => {
    const x = (a.nombre || "").trim()
    const y = (b.nombre || "").trim()
    if (!x && !y) return a.email.localeCompare(b.email)
    if (!x) return 1
    if (!y) return -1
    return x.localeCompare(y, "es")
  })

  return {
    resumen,
    personas: ordenados.slice(0, tope),
    mas: Math.max(0, ordenados.length - tope),
  }
}

export function etiquetaPreferencia(p: PreferenciaCorreo): string {
  return ETIQUETA_PREFERENCIA[p]
}

/**
 * Los países y las ciudades DONDE HAY MIEMBROS, con cuántos hay en cada uno.
 *
 * ── POR QUÉ NO SE OFRECE LA LISTA DE PAÍSES DEL MUNDO ──────────────────────
 * Porque un filtro que da cero no es un filtro, es una pérdida de tiempo con
 * forma de opción. Ofrecer «Japón» cuando no hay nadie en Japón obliga a
 * elegirlo, mirar el ensayo de audiencia, ver un cero y volver atrás.
 *
 * Aquí cada opción trae su número al lado. Con eso, elegir «Colombia · 34» es
 * una decisión informada antes de pulsar nada, y la ciudad —que mucha gente no
 * ha puesto— se ve enseguida que es un filtro estrecho.
 *
 * ── POR QUÉ SOLO LAS CIUDADES CON DOS O MÁS ────────────────────────────────
 * Una ciudad con un solo miembro es, en la práctica, el nombre de esa persona.
 * Una lista de cuarenta ciudades de una persona cada una es un directorio
 * encubierto en un desplegable de administración, y para escribirle a alguien
 * concreto ya están las personas elegidas.
 */
export async function dondeHayMiembros(): Promise<{
  paises: Array<{ id: string; etiqueta: string; cuantos: number }>
  ciudades: Array<{ id: number; etiqueta: string; pais: string; cuantos: number }>
}> {
  const admin = getSupabaseAdmin()

  const porPais = new Map<string, number>()
  const porCiudad = new Map<number, number>()

  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await admin
      .from("member_location")
      .select("country_code, city_id")
      .range(desde, desde + 999)
    if (error) break

    const lote = (data || []) as Array<{ country_code: string; city_id: number | null }>
    for (const f of lote) {
      const pais = (f.country_code || "").toUpperCase()
      if (pais) porPais.set(pais, (porPais.get(pais) || 0) + 1)
      if (f.city_id != null) porCiudad.set(f.city_id, (porCiudad.get(f.city_id) || 0) + 1)
    }
    if (lote.length < 1000) break
  }

  // Los nombres de las ciudades, solo de las que tienen a alguien. Pedir el
  // catálogo entero serían miles de filas para nombrar veinte.
  const conGente = [...porCiudad.entries()].filter(([, n]) => n >= 2)
  const nombres = new Map<number, { nombre: string; pais: string }>()

  if (conGente.length > 0) {
    const { data } = await admin
      .from("network_cities")
      .select("id, name, country_code, admin1")
      .in("id", conGente.map(([id]) => id))

    for (const c of (data || []) as Array<{ id: number; name: string; country_code: string; admin1: string | null }>) {
      // La provincia va en el nombre porque hay ciudades homónimas, y dos
      // «Córdoba» en un desplegable no se pueden distinguir.
      nombres.set(c.id, {
        nombre: c.admin1 ? `${c.name} (${c.admin1})` : c.name,
        pais: (c.country_code || "").toUpperCase(),
      })
    }
  }

  return {
    paises: [...porPais.entries()]
      .map(([id, cuantos]) => ({ id, etiqueta: nombrePais(id), cuantos }))
      .sort((a, b) => b.cuantos - a.cuantos || a.etiqueta.localeCompare(b.etiqueta, "es")),
    ciudades: conGente
      .map(([id, cuantos]) => ({
        id,
        etiqueta: nombres.get(id)?.nombre ?? `Ciudad ${id}`,
        pais: nombres.get(id)?.pais ?? "",
        cuantos,
      }))
      .sort((a, b) => b.cuantos - a.cuantos || a.etiqueta.localeCompare(b.etiqueta, "es")),
  }
}

/**
 * Los filtros que se pueden elegir hoy, sin consultar nada.
 *
 * Solo hay filtros de cosas que la base SABE. El país y la ciudad no están
 * aquí porque dependen de quién hay en cada sitio hoy: salen de
 * `dondeHayMiembros()`, con el recuento al lado, para que elegir uno sea una
 * decisión informada y no una apuesta que luego hay que deshacer.
 */
export const FILTROS_DISPONIBLES = {
  temporadas: [1, 2, 3, 4],
  roles: Object.entries(ETIQUETA_ROL).map(([id, etiqueta]) => ({ id, etiqueta })),
  /**
   * Las insignias, del catálogo de verdad.
   *
   * No una lista escrita a mano aquí: `ACHIEVEMENTS` es la fuente, y así una
   * insignia nueva aparece en los filtros sin que nadie tenga que acordarse de
   * añadirla en dos sitios.
   *
   * Las retiradas se quedan fuera. Siguen existiendo para quien las ganó en su
   * día —no se le quitan— pero ofrecerlas como filtro es ofrecer un envío a un
   * grupo que ya no crece y que casi nadie recuerda.
   */
  insignias: ACHIEVEMENTS
    .filter((a) => !a.retirada)
    .map((a) => ({ id: a.id, etiqueta: a.name, categoria: a.category, tier: a.tier })),
}

function nombreInsignia(id: string): string {
  return ACHIEVEMENTS.find((a) => a.id === id)?.name ?? id
}
