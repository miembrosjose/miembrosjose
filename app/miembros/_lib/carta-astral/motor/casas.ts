// ═══════════════════════════════════════════════════════════════════════════
//  LAS DOCE CASAS · Placidus, con red de seguridad
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ PLACIDUS Y NO SIGNOS ENTEROS ──────────────────────────────────
// Por signos enteros, cada casa es un signo y no hay nada que calcular. Es más
// simple y funciona en cualquier latitud.
//
// Pero casi todas las webs de astrología usan Placidus. Si aquí Venus sale en
// la casa 2 y en otra página sale en la 3, lo que se concluye no es «usan
// sistemas distintos»: se concluye que esto está roto. Y a esa desconfianza no
// se vuelve.
//
// Así que Placidus manda, y los signos enteros quedan al lado para quien
// prefiera esa lectura.
//
// ── DE DÓNDE SALEN LAS FÓRMULAS ───────────────────────────────────────────
// No están copiadas: se derivan, y la derivación cabe aquí.
//
// El ángulo horario de un punto es H = TSL − α, con α su ascensión recta. En
// el Medio Cielo H = 0, o sea α = RAMC. Un punto de declinación δ sale por el
// horizonte cuando H = −SD, siendo SD el semiarco diurno:
//
//     SD = 90° + AD        con    AD = asin(tan φ · tan δ)
//
// Entre el MC y el Ascendente, el punto recorre ese semiarco. Placidus parte
// ese recorrido en TRES, y de ahí salen las casas 11 y 12:
//
//     casa 11 →  H = −SD/3     →  α = RAMC + SD/3
//     casa 12 →  H = −2·SD/3   →  α = RAMC + 2·SD/3
//     casa 1  →  H = −SD       →  α = RAMC + SD      (el Ascendente)
//
// Y del Ascendente al Fondo del Cielo recorre el semiarco nocturno,
// SN = 180° − SD, partido también en tres: casas 2 y 3.
//
// Desarrollando, las cuatro se reducen a la misma forma:
//
//     α = RAMC + base + c · AD
//
//        casa 11 → base 30°,  c = 1/3
//        casa 12 → base 60°,  c = 2/3
//        casa 2  → base 120°, c = 2/3
//        casa 3  → base 150°, c = 1/3
//
// Como AD depende de δ, que depende de la propia longitud que buscamos, hay
// que iterar. Converge en cuatro o cinco vueltas.
//
// ── DÓNDE SE ROMPE, Y QUÉ SE HACE ENTONCES ────────────────────────────────
// `asin(tan φ · tan δ)` no existe cuando |tan φ · tan δ| > 1: es el caso de
// las latitudes polares, donde hay puntos de la eclíptica que ni salen ni se
// ponen. Placidus ahí no está definido — no es un fallo del cálculo, es que la
// pregunta no tiene respuesta.
//
// En vez de devolver un número sin sentido, se cae a signos enteros y la carta
// lo DICE. Pasa por encima del círculo polar, unos 66,5°: Reikiavik está
// justo debajo; Tromsø, por encima.

import { type SignoId, signoDeGrado, gradoEnSigno } from "../contenido/signos"

const GRADOS = 180 / Math.PI
const RADIANES = Math.PI / 180

const norm = (g: number) => ((g % 360) + 360) % 360

export type SistemaCasas = "placidus" | "signos_enteros"

export type Casa = {
  numero: number
  /** Longitud eclíptica de la cúspide, 0–360. */
  cuspide: number
  signo: SignoId
  grado: number
}

/**
 * Longitud eclíptica del punto de la eclíptica cuya ascensión recta es α.
 *
 *   tan α = cos ε · tan λ   ⟹   λ = atan2(sin α, cos α · cos ε)
 *
 * Con atan2 el cuadrante sale solo.
 */
function longitudDesdeAscensionRecta(alfa: number, oblicuidad: number): number {
  const a = alfa * RADIANES
  const e = oblicuidad * RADIANES
  return norm(Math.atan2(Math.sin(a), Math.cos(a) * Math.cos(e)) * GRADOS)
}

/** Las cuatro cúspides intermedias, cada una con su base y su coeficiente. */
const INTERMEDIAS: Array<{ casa: number; base: number; c: number }> = [
  { casa: 11, base: 30, c: 1 / 3 },
  { casa: 12, base: 60, c: 2 / 3 },
  { casa: 2, base: 120, c: 2 / 3 },
  { casa: 3, base: 150, c: 1 / 3 },
]

/**
 * Una cúspide intermedia, por iteración.
 *
 * Devuelve `null` si Placidus no está definido ahí: quien llama decide qué
 * hacer, y lo que hace es caer a signos enteros para TODAS las casas. Mezclar
 * cuatro cúspides de Placidus con ocho de otro sistema daría una carta que no
 * es de ninguno de los dos.
 */
function cuspideIntermedia(
  ramc: number, latitud: number, oblicuidad: number,
  base: number, c: number,
): number | null {
  const phi = latitud * RADIANES
  const e = oblicuidad * RADIANES

  let alfa = norm(ramc + base)

  for (let vuelta = 0; vuelta < 12; vuelta++) {
    const lambda = longitudDesdeAscensionRecta(alfa, oblicuidad)
    const delta = Math.asin(Math.sin(e) * Math.sin(lambda * RADIANES))

    const seno = Math.tan(phi) * Math.tan(delta)
    // Aquí es donde Placidus deja de existir.
    if (!Number.isFinite(seno) || Math.abs(seno) > 1) return null

    const ad = Math.asin(seno) * GRADOS
    const siguiente = norm(ramc + base + c * ad)

    // Convergencia: una diezmilésima de grado son 0,36 segundos de arco, muy
    // por debajo de lo que cambia nada.
    let salto = Math.abs(siguiente - alfa)
    if (salto > 180) salto = 360 - salto
    alfa = siguiente
    if (salto < 1e-4) break
  }

  return longitudDesdeAscensionRecta(alfa, oblicuidad)
}

/** Las doce casas por signos enteros: casa 1 = el signo del Ascendente. */
export function casasSignosEnteros(ascendente: number): Casa[] {
  const inicio = Math.floor(norm(ascendente) / 30)
  return Array.from({ length: 12 }, (_, i) => {
    const cuspide = norm((inicio + i) * 30)
    return { numero: i + 1, cuspide, signo: signoDeGrado(cuspide), grado: 0 }
  })
}

/**
 * Las doce casas de Placidus, o `null` si la latitud no lo permite.
 *
 * `ramc` es la ascensión recta del Medio Cielo, que coincide con el tiempo
 * sideral local expresado en grados.
 */
export function casasPlacidus(
  ramc: number, latitud: number, oblicuidad: number,
  ascendente: number, medioCielo: number,
): Casa[] | null {
  // Por encima del círculo polar ni se intenta: la fórmula fallaría de todas
  // formas, y así el motivo queda dicho en vez de deducido.
  if (Math.abs(latitud) > 66.5) return null

  const cuspides = new Map<number, number>()
  cuspides.set(1, norm(ascendente))
  cuspides.set(10, norm(medioCielo))

  for (const { casa, base, c } of INTERMEDIAS) {
    const v = cuspideIntermedia(ramc, latitud, oblicuidad, base, c)
    if (v === null) return null
    cuspides.set(casa, v)
  }

  // Las seis restantes son las opuestas. No se calculan aparte: por
  // definición están a 180°, y calcularlas por su lado podría dar una carta
  // con la casa 7 que no mira a la 1.
  for (const [desde, hasta] of [[1, 7], [2, 8], [3, 9], [10, 4], [11, 5], [12, 6]] as const) {
    cuspides.set(hasta, norm(cuspides.get(desde)! + 180))
  }

  const casas: Casa[] = []
  for (let n = 1; n <= 12; n++) {
    const cuspide = cuspides.get(n)!
    casas.push({ numero: n, cuspide, signo: signoDeGrado(cuspide), grado: gradoEnSigno(cuspide) })
  }
  return casas
}

/**
 * En qué casa cae una longitud.
 *
 * Las casas no miden 30° en Placidus: una puede ocupar 50° y la de al lado 12.
 * Así que no vale dividir; hay que mirar entre qué dos cúspides cae, contando
 * que la rueda da la vuelta por 0°.
 */
export function casaDe(longitud: number, casas: Casa[]): number {
  const l = norm(longitud)
  for (let i = 0; i < 12; i++) {
    const desde = casas[i].cuspide
    const hasta = casas[(i + 1) % 12].cuspide
    const ancho = norm(hasta - desde)
    const dentro = norm(l - desde)
    // `< ancho` y no `<=`: un punto justo en la cúspide pertenece a la casa
    // que empieza ahí, no a la que termina.
    if (dentro < ancho) return casas[i].numero
  }
  // Inalcanzable si las cúspides están bien: los doce tramos suman 360°. Se
  // devuelve la primera en vez de lanzar, porque una carta a medias es peor
  // que una casa discutible.
  return 1
}
