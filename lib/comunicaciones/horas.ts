// ═══════════════════════════════════════════════════════════════════════════
//  QUÉ HORA ES DONDE ESTÁ LA RED
// ═══════════════════════════════════════════════════════════════════════════
//
// ── EL PROBLEMA ────────────────────────────────────────────────────────────
// Una notificación suena. A las tres de la mañana suena igual, y despierta.
// El correo no tiene este problema —espera en la bandeja— pero un aviso en el
// teléfono no espera a nada.
//
// ── POR QUÉ NO SE RETIENE EL ENVÍO ─────────────────────────────────────────
// Porque no sabemos la hora de nadie. Lo que la plataforma guarda es el país
// que cada miembro eligió al entrar en La Red, y un país no siempre es una
// hora: México tiene cuatro zonas, Brasil cuatro, Estados Unidos seis. Retener
// un envío basándose en una suposición significa retenerlo mal para mucha
// gente, y además dejar de enviarlo en el momento en que alguien lo decidió.
//
// ── LO QUE SÍ SE PUEDE HACER ───────────────────────────────────────────────
// Decírselo. Antes de confirmar, la pantalla dice qué hora es donde hay
// miembros y cuántos están durmiendo, con los países que SÍ se pueden situar
// sin adivinar. Quien envía decide con eso delante; muchas veces la respuesta
// correcta es «da igual, es urgente», y una regla automática no lo sabría.
//
// Y los que no se pueden situar se cuentan aparte, dichos como lo que son: no
// se omiten para que el aviso parezca más completo de lo que es.
//
// ── SI ALGÚN DÍA SE QUIERE HACER BIEN ──────────────────────────────────────
// Hace falta la zona horaria de cada persona, y solo hay dos formas de
// tenerla: preguntarla, o leerla del navegador al entrar
// (`Intl.DateTimeFormat().resolvedOptions().timeZone`). La segunda es gratis y
// no molesta a nadie. El día que esa columna exista, esto se convierte en una
// regla de verdad y no en un aviso.

/**
 * Países de una sola zona horaria, donde el código basta para saber la hora.
 *
 * ── POR QUÉ FALTAN MÉXICO, BRASIL Y ESTADOS UNIDOS ────────────────────────
 * Porque tienen varias. Poner «America/Mexico_City» para todo México diría
 * una hora equivocada para Tijuana, y una hora equivocada es peor que decir
 * «de estos no lo sabemos»: la primera se cree, la segunda se tiene en cuenta.
 *
 * Son justamente los países con más miembros, así que el aviso siempre dirá
 * de cuánta gente no puede hablar. Es el precio de no inventarse nada.
 */
export const ZONA_SEGURA_POR_PAIS: Record<string, string> = {
  CO: "America/Bogota",
  PE: "America/Lima",
  EC: "America/Guayaquil",
  VE: "America/Caracas",
  BO: "America/La_Paz",
  PY: "America/Asuncion",
  UY: "America/Montevideo",
  CL: "America/Santiago",
  AR: "America/Argentina/Buenos_Aires",
  GT: "America/Guatemala",
  SV: "America/El_Salvador",
  HN: "America/Tegucigalpa",
  NI: "America/Managua",
  CR: "America/Costa_Rica",
  PA: "America/Panama",
  DO: "America/Santo_Domingo",
  CU: "America/Havana",
  PR: "America/Puerto_Rico",
  ES: "Europe/Madrid",
  PT: "Europe/Lisbon",
  IT: "Europe/Rome",
  FR: "Europe/Paris",
  DE: "Europe/Berlin",
  GB: "Europe/London",
  IE: "Europe/Dublin",
  NL: "Europe/Amsterdam",
  BE: "Europe/Brussels",
  CH: "Europe/Zurich",
  AT: "Europe/Vienna",
}

/**
 * Desde qué hora y hasta qué hora se considera madrugada.
 *
 * De once de la noche a siete de la mañana. No es una franja estricta de
 * sueño: es la franja en la que un teléfono que suena molesta a alguien que no
 * esperaba que sonara.
 */
const DESDE = 23
const HASTA = 7

/** Qué hora es ahora en esa zona, en horas enteras. */
function horaEn(zona: string): number | null {
  try {
    const txt = new Intl.DateTimeFormat("es-ES", {
      timeZone: zona,
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
    const n = Number(txt.replace(/\D/g, ""))
    return Number.isFinite(n) ? n % 24 : null
  } catch {
    return null
  }
}

export type AvisoDeHora = {
  /** Cuánta gente está en plena noche, de la que se puede situar. */
  durmiendo: number
  /** Los sitios concretos, para poder decirlo con nombres. */
  sitios: Array<{ pais: string; etiqueta: string; hora: string; cuantos: number }>
  /** Cuánta gente está en países de varias zonas, de los que no se sabe. */
  sinSituar: number
}

/**
 * ¿Es mala hora para mandar esto?
 *
 * Recibe el reparto de miembros por país —el mismo que ya calcula la pantalla
 * de audiencia— y devuelve a cuánta gente le sonaría el teléfono de noche.
 *
 * Nunca impide nada. Solo informa.
 */
export function avisoDeHora(
  paises: Array<{ id: string; etiqueta: string; cuantos: number }>,
): AvisoDeHora {
  const sitios: AvisoDeHora["sitios"] = []
  let durmiendo = 0
  let sinSituar = 0

  for (const p of paises) {
    const zona = ZONA_SEGURA_POR_PAIS[p.id.toUpperCase()]
    if (!zona) {
      sinSituar += p.cuantos
      continue
    }
    const h = horaEn(zona)
    if (h === null) {
      sinSituar += p.cuantos
      continue
    }
    if (h >= DESDE || h < HASTA) {
      durmiendo += p.cuantos
      sitios.push({
        pais: p.id,
        etiqueta: p.etiqueta,
        hora: `${String(h).padStart(2, "0")}:00`,
        cuantos: p.cuantos,
      })
    }
  }

  // De más gente a menos: lo primero que hay que leer es dónde molestaría más.
  sitios.sort((a, b) => b.cuantos - a.cuantos)

  return { durmiendo, sitios, sinSituar }
}
