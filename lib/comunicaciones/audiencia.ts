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
import type { Audiencia, PreferenciaCorreo, TipoComunicacion } from "./tipos"
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
}

const ETIQUETA_PREFERENCIA: Record<PreferenciaCorreo, string> = {
  novedades: "Novedades importantes",
  contenidos: "Nuevos contenidos y transmisiones",
  sesiones: "Sesiones en vivo y activaciones",
  red: "Encuentros y actividad de La Red",
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
): Promise<{ destinatarios: Destinatario[]; resumen: ResumenAudiencia }> {
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

  const avanceCompleto = (pideTemporada || pideCompletada)
    ? await avanceDeTodos()
    : { alcanzada: new Map<string, number>(), completadas: new Map<string, Set<number>>() }

  const [, roles, insignias] = await Promise.all([
    Promise.resolve(null),
    pideRol ? rolesPorMiembro() : Promise.resolve(new Map<string, Set<string>>()),
    pideInsignia ? insigniasPorMiembro() : Promise.resolve(new Map<string, Set<string>>()),
  ])
  const avance = avanceCompleto.alcanzada
  const completadas = avanceCompleto.completadas

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
  const { data: prefs } = await admin
    .from("email_preferences")
    .select(`user_id, unsubscribed_all, ${preferencia}`)
    .or(`unsubscribed_all.eq.true,${preferencia}.eq.false`)

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
  }
  const vistos = new Set<string>()
  const destinatarios: Destinatario[] = []

  for (const f of filas) {
    const correo = (f.email || "").trim().toLowerCase()

    if (!correo) { cuenta.sin_correo++; continue }
    if (!correoPlausible(correo)) { cuenta.correo_invalido++; continue }
    if (bajaTotal.has(f.id)) { cuenta.baja_total++; continue }
    if (apagada.has(f.id)) { cuenta.preferencia_apagada++; continue }

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
    if (vistos.has(correo)) { cuenta.duplicado++; continue }

    vistos.add(correo)
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
): Promise<ResumenAudiencia> {
  const { resumen } = await resolverAudiencia(audiencia, tipo)
  return resumen
}

export function etiquetaPreferencia(p: PreferenciaCorreo): string {
  return ETIQUETA_PREFERENCIA[p]
}

/**
 * Los filtros que se pueden elegir hoy.
 *
 * Solo hay filtros de cosas que la base SABE. Ofrecer «por ciudad» cuando
 * apenas unas pocas personas la han puesto produciría audiencias de tres
 * personas y la sensación de que el sistema está roto.
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
