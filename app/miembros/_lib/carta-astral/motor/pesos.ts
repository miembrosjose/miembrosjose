// ═══════════════════════════════════════════════════════════════════════════
//  PRESENTE O PREDOMINANTE · AUSENTE O DÉBIL
// ═══════════════════════════════════════════════════════════════════════════
//
// La hoja «Registro» del Camino Solar tiene una columna —«Posición en mi
// carta astral»— con dos valores: PRESENTE O PREDOMINANTE y AUSENTE O DÉBIL.
// De ahí sale todo lo demás: si el signo está presente se lee su ATRIBUTO y
// el EQUILIBRIO de su sistema orgánico; si está ausente, su CONFLICTO y el
// DESEQUILIBRIO del sistema.
//
// José rellenaba esa columna a mano mirando su carta. Esto lo calcula.
//
// ── POR QUÉ CON PESOS Y NO CONTANDO PLANETAS ──────────────────────────────
// Contar a todos igual pone a Plutón —que pasa veinte años en el mismo
// signo, igual para una generación entera— a la altura del Ascendente, que
// cambia cada cuatro minutos y es de cada persona. Con eso, dos desconocidos
// nacidos el mismo año saldrían parecidos y la lectura no distinguiría a
// nadie.
//
// Así que el Sol, la Luna y el Ascendente pesan más. Son los tres que toda
// la tradición trata como el eje de una carta, y los tres que de verdad
// cambian de una persona a otra.
//
// Los números no salen de ninguna autoridad: son una escala declarada, y están
// aquí para poder discutirlos y cambiarlos. Lo que NO se puede hacer es
// esconderlos.

import type { SignoId } from "../contenido/signos"
import { ORDEN_CAMINO } from "../contenido/signos"
import type { Carta, PuntoId } from "./carta"

/**
 * Lo que aporta cada punto al signo donde cae.
 *
 *   3 · El eje de la carta. Propios de la persona.
 *   2 · Los personales rápidos y el Medio Cielo (la vocación, el rumbo).
 *   1 · Los lentos: compartidos con mucha gente de la misma época.
 */
export const PESOS: Record<PuntoId, number> = {
  sol: 3,
  luna: 3,
  ascendente: 3,

  mercurio: 2,
  venus: 2,
  marte: 2,
  medio_cielo: 2,

  jupiter: 1,
  saturno: 1,
  urano: 1,
  neptuno: 1,
  pluton: 1,
  nodo_norte: 1,
}

/** Suma de todos los pesos: 23 repartidos entre doce signos. */
export const PESO_TOTAL = Object.values(PESOS).reduce((a, b) => a + b, 0)

export type Estado = "predominante" | "presente" | "ausente"

export type PesoDeSigno = {
  signo: SignoId
  puntos: number
  estado: Estado
  /** Qué cayó ahí, para poder enseñar el por qué. */
  habitantes: Array<{ id: PuntoId; nombre: string; peso: number }>
}

/**
 * El umbral de «predominante».
 *
 * Con 23 puntos entre doce signos, la media sale a 1,9. Cuatro puntos es algo
 * que no pasa por casualidad: exige el Sol o la Luna acompañados, o tres
 * personales juntos.
 */
const UMBRAL_PREDOMINANTE = 4

/**
 * El peso de los doce signos, de más a menos.
 *
 * ── SIEMPRE HAY UN PREDOMINANTE ───────────────────────────────────────────
 * Si ningún signo llega a cuatro puntos —una carta muy repartida—, el más
 * alto se marca igual como predominante. Una lectura que dijera «no tienes
 * ningún signo predominante» no le serviría a nadie, y además sería falsa:
 * alguno destaca siempre, aunque sea por poco.
 */
export function pesarSignos(carta: Carta): PesoDeSigno[] {
  const acumulado = new Map<SignoId, PesoDeSigno>()

  // Los doce entran, aunque se queden a cero. Un signo ausente no es un signo
  // que falte: es la mitad de la lectura.
  for (const signo of ORDEN_CAMINO) {
    acumulado.set(signo, { signo, puntos: 0, estado: "ausente", habitantes: [] })
  }

  for (const p of carta.puntos) {
    const peso = PESOS[p.id]
    if (!peso) continue
    const fila = acumulado.get(p.signo)
    if (!fila) continue
    fila.puntos += peso
    fila.habitantes.push({ id: p.id, nombre: p.nombre, peso })
  }

  const filas = [...acumulado.values()]

  // Dentro de cada signo, lo que más pesa primero: así la explicación empieza
  // por «el Sol y la Luna», no por «Plutón».
  for (const f of filas) f.habitantes.sort((a, b) => b.peso - a.peso)

  for (const f of filas) {
    f.estado = f.puntos >= UMBRAL_PREDOMINANTE ? "predominante" : f.puntos > 0 ? "presente" : "ausente"
  }

  filas.sort((a, b) => b.puntos - a.puntos)

  // La red de seguridad del comentario de arriba.
  if (filas.length > 0 && filas[0].puntos > 0 && !filas.some((f) => f.estado === "predominante")) {
    filas[0].estado = "predominante"
  }

  return filas
}

/** Atajo: los signos ausentes, que son los que apuntan al desequilibrio. */
export function signosAusentes(pesos: PesoDeSigno[]): PesoDeSigno[] {
  return pesos.filter((p) => p.estado === "ausente")
}

/** Atajo: los predominantes. */
export function signosPredominantes(pesos: PesoDeSigno[]): PesoDeSigno[] {
  return pesos.filter((p) => p.estado === "predominante")
}
