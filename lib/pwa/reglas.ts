// ═══════════════════════════════════════════════════════════════════════════
//  CUÁNDO SE INVITA, CUÁNDO SE CALLA · todas las reglas, en un solo sitio
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ ESTO ES UN ARCHIVO Y NO TRES CONSTANTES REPARTIDAS ─────────────
// Son dos invitaciones —instalar la aplicación y activar los avisos— y cada
// una tiene varios plazos. Repartidos por los componentes, la pregunta «¿cada
// cuánto se le insiste a alguien?» no tiene respuesta: hay que abrir cuatro
// archivos y sumar.
//
// Peor todavía: el día que haya que suavizarlo —y ese día llega siempre—
// alguien cambiaría tres de los cuatro números y nadie notaría el que quedó.
//
// Aquí está todo. Cambiar la frecuencia con la que la plataforma pide algo es
// cambiar los números de arriba de este archivo.
//
// ── LA REGLA QUE GOBIERNA A TODAS ─────────────────────────────────────────
// Nunca se enseñan las dos invitaciones a la vez. Instalar va primero —sin
// aplicación, en iPhone no hay avisos posibles— y la tarjeta de notificaciones
// espera. Ver `inviteQueToca`.

// ── LOS PLAZOS ─────────────────────────────────────────────────────────────

const DIA = 24 * 60 * 60 * 1000

export const PLAZOS = {
  /** Visitas que tienen que haber ocurrido antes de invitar a nada. */
  visitasAntesDeInvitar: 2,

  /**
   * Lo que se espera dentro de la plataforma antes de que asome nada.
   *
   * No es una pausa estética: es la diferencia entre invitar a alguien que
   * está usando esto e invitar a alguien que todavía no sabe qué es.
   */
  esperaDentroMs: 30_000,

  /** Tras el primer «ahora no» a instalar. */
  instalacionPrimeraNegativaMs: 21 * DIA,

  /**
   * Tras el segundo.
   *
   * Quien dice que no dos veces ya ha contestado. Tres meses es, en la
   * práctica, «no volver a sacarlo salvo que él lo busque» — y buscarlo se
   * puede, desde la campana.
   */
  instalacionSegundaNegativaMs: 90 * DIA,

  /** Tras cerrar la tarjeta de notificaciones con la equis. */
  tarjetaCerradaMs: 14 * DIA,
} as const

// ── DÓNDE SE GUARDA ────────────────────────────────────────────────────────
//
// En este navegador, y con el identificador de la persona dentro de la clave.
//
// ── POR QUÉ NO VA AL SERVIDOR ──────────────────────────────────────────────
// Porque todo esto es del DISPOSITIVO, no de la persona. Si alguien dice
// «ahora no» en el móvil, eso no significa nada sobre su portátil: en el
// portátil ni siquiera hay nada que instalar. Sincronizarlo sería hacer que
// una decisión tomada en un sitio callara una invitación pertinente en otro.
//
// ── Y POR QUÉ LLEVA EL IDENTIFICADOR DENTRO ────────────────────────────────
// Un teléfono compartido es un caso real. Sin el identificador, la segunda
// persona hereda el silencio de la primera y nunca se entera de que esto se
// puede instalar. Con él, cada cuenta lleva su propia cuenta de visitas y sus
// propios aplazamientos, sin identificar al aparato de ninguna manera.

type Marca = "visitas" | "instalar_hasta" | "instalar_negativas" | "tarjeta_hasta" | "push_apagado"

function clave(marca: Marca, userId: string): string {
  return `los144k_pwa_${marca}_${userId}`
}

/**
 * Lee un número guardado.
 *
 * Todo lo de aquí devuelve un valor utilizable pase lo que pase. En una
 * ventana privada, con las cookies bloqueadas o durante la captura de una
 * miniatura, `localStorage` puede no existir o lanzar al tocarlo — y una
 * invitación a instalar no puede ser el motivo de que no cargue la pantalla
 * de inicio.
 */
function leer(marca: Marca, userId: string): number {
  try {
    const v = Number(localStorage.getItem(clave(marca, userId)) || 0)
    return Number.isFinite(v) ? v : 0
  } catch {
    return 0
  }
}

function escribir(marca: Marca, userId: string, valor: number): void {
  try { localStorage.setItem(clave(marca, userId), String(valor)) } catch { /* da igual */ }
}

// ── LAS VISITAS ────────────────────────────────────────────────────────────

/** Cuenta esta visita y devuelve cuántas van. */
export function contarVisita(userId: string): number {
  const n = leer("visitas", userId) + 1
  escribir("visitas", userId, n)
  return n
}

export function visitasSuficientes(userId: string): boolean {
  return leer("visitas", userId) >= PLAZOS.visitasAntesDeInvitar
}

// ── LA INSTALACIÓN ─────────────────────────────────────────────────────────

export function instalacionSilenciada(userId: string): boolean {
  return leer("instalar_hasta", userId) > Date.now()
}

/**
 * «Ahora no».
 *
 * El plazo crece con cada negativa: la primera calla tres semanas, la segunda
 * tres meses. Quien ya ha dicho que no dos veces ha contestado de sobra, y
 * seguir preguntándole cada tres semanas durante un año es lo que convierte
 * una invitación en una molestia.
 */
export function aplazarInstalacion(userId: string): void {
  const negativas = leer("instalar_negativas", userId) + 1
  escribir("instalar_negativas", userId, negativas)
  escribir(
    "instalar_hasta",
    userId,
    Date.now() + (negativas >= 2
      ? PLAZOS.instalacionSegundaNegativaMs
      : PLAZOS.instalacionPrimeraNegativaMs),
  )
}

/**
 * Se instaló. No se vuelve a preguntar nunca.
 *
 * Cien años, que es la forma de decir «nunca» sin inventar un valor especial
 * que luego haya que comprobar aparte en los tres sitios que leen esto.
 */
export function instalacionHecha(userId: string): void {
  escribir("instalar_hasta", userId, Date.now() + 36500 * DIA)
}

// ── LA TARJETA DE NOTIFICACIONES ───────────────────────────────────────────

export function tarjetaSilenciada(userId: string): boolean {
  return leer("tarjeta_hasta", userId) > Date.now()
}

export function aplazarTarjeta(userId: string): void {
  escribir("tarjeta_hasta", userId, Date.now() + PLAZOS.tarjetaCerradaMs)
}

/**
 * Apagó los avisos en este dispositivo, a propósito.
 *
 * ── POR QUÉ HACE FALTA RECORDARLO ──────────────────────────────────────────
 * Al desactivar, la suscripción se borra del navegador y el estado vuelve a
 * «sin permiso» — exactamente igual que quien nunca los activó. Sin esta
 * marca, la tarjeta del inicio le reaparecería a quien acaba de apagarlos, y
 * la plataforma estaría pidiéndole que deshaga lo que acaba de decidir.
 *
 * Se guarda aquí y no en la base porque la decisión es de ESTE dispositivo:
 * apagar los avisos en el móvil no dice nada sobre la tableta.
 */
export function marcarApagadoAdrede(userId: string): void {
  escribir("push_apagado", userId, Date.now())
}

export function apagadoAdrede(userId: string): boolean {
  return leer("push_apagado", userId) > 0
}

/** Vuelve a activarlos: la marca deja de valer. */
export function olvidarApagado(userId: string): void {
  escribir("push_apagado", userId, 0)
}

// ── QUIÉN TIENE PRIORIDAD ──────────────────────────────────────────────────

export type Invitacion = "instalar" | "notificaciones" | "ninguna"

/**
 * Qué se le enseña a esta persona, si es que se le enseña algo.
 *
 * ── POR QUÉ NUNCA LAS DOS ──────────────────────────────────────────────────
 * Porque son dos peticiones, y dos peticiones a la vez no son una invitación:
 * son un peaje. Además el orden importa de verdad en iPhone, donde sin la
 * aplicación instalada no hay avisos posibles — pedir el permiso antes sería
 * pedir algo que el sistema no va a conceder.
 *
 * Así que instalar va primero y la tarjeta espera a la siguiente visita. Si no
 * toca instalar —porque ya está instalada, porque se aplazó, o porque es un
 * ordenador— entonces le toca a la tarjeta.
 */
export function inviteQueToca(opciones: {
  userId: string
  /** ¿Se puede ofrecer instalar? (no instalada, aparato que lo admite) */
  puedeInstalar: boolean
  /** ¿Tiene sentido ofrecer los avisos? (no activos, no bloqueados, no apagados adrede) */
  puedeActivarAvisos: boolean
}): Invitacion {
  const { userId, puedeInstalar, puedeActivarAvisos } = opciones

  // ── LA CUENTA DE VISITAS SOLO FRENA LA INSTALACIÓN ──────────────────────
  // Existe para no abordar a alguien que acaba de entrar por primera vez y
  // todavía está mirando qué es esto.
  //
  // Aplicarla también a la tarjeta de los avisos era un error, y uno que
  // solo se ve en un iPhone: la aplicación añadida a la pantalla de inicio
  // tiene su PROPIO almacenamiento, separado del de Safari. Al abrirla por
  // primera vez desde su icono, la cuenta empieza de cero — y la tarjeta se
  // callaba justo en el momento en que más sentido tiene, que es cuando
  // alguien acaba de instalarla.
  //
  // Quien ha llegado a instalarla ya ha demostrado de sobra que usa esto.
  if (puedeInstalar && !instalacionSilenciada(userId) && visitasSuficientes(userId)) {
    return "instalar"
  }
  if (puedeActivarAvisos && !tarjetaSilenciada(userId)) return "notificaciones"

  return "ninguna"
}
