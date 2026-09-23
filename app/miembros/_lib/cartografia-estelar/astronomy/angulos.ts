// CARTOGRAFÍA ESTELAR 144 — geometría angular.
//
// Funciones puras, sin dependencias. Aquí no hay astronomía: hay trigonometría
// y aritmética de círculos, que es donde se cuelan los errores de envolvente
// (el salto de 359° a 0°) si no se tratan a propósito.

export const GRADOS_A_RADIANES = Math.PI / 180
export const RADIANES_A_GRADOS = 180 / Math.PI

/** Lleva cualquier ángulo al rango [0, 360). */
export function normalizar(grados: number): number {
  const g = grados % 360
  return g < 0 ? g + 360 : g
}

/**
 * Diferencia mínima entre dos longitudes, en [0, 180].
 *
 * El caso que importa: entre 359° y 1° hay 2 grados, no 358. Restar sin más
 * daría 358 y el aspecto no se detectaría.
 */
export function separacionLongitud(a: number, b: number): number {
  const d = Math.abs(normalizar(a) - normalizar(b))
  return d > 180 ? 360 - d : d
}

/**
 * Separación angular REAL entre dos puntos de la esfera celeste.
 *
 * Esto NO es lo mismo que la separación por longitud eclíptica. Una estrella
 * muy al norte o al sur de la eclíptica puede compartir longitud con un
 * planeta —y formar una conjunción simbólica exacta— estando a decenas de
 * grados de distancia real en el cielo.
 *
 * Se usa la fórmula de Vincenty para ángulos, que no pierde precisión con
 * separaciones muy pequeñas como sí hace el coseno del arco.
 */
export function separacionReal(
  ra1: number, dec1: number,
  ra2: number, dec2: number,
): number {
  const r1 = ra1 * GRADOS_A_RADIANES
  const d1 = dec1 * GRADOS_A_RADIANES
  const r2 = ra2 * GRADOS_A_RADIANES
  const d2 = dec2 * GRADOS_A_RADIANES

  const dRa = r2 - r1
  const num = Math.hypot(
    Math.cos(d2) * Math.sin(dRa),
    Math.cos(d1) * Math.sin(d2) - Math.sin(d1) * Math.cos(d2) * Math.cos(dRa),
  )
  const den = Math.sin(d1) * Math.sin(d2) + Math.cos(d1) * Math.cos(d2) * Math.cos(dRa)
  return Math.atan2(num, den) * RADIANES_A_GRADOS
}

/** Grados decimales a grados y minutos de arco, para mostrar. */
export function aGradosMinutos(grados: number): string {
  const abs = Math.abs(grados)
  let g = Math.floor(abs)
  let m = Math.round((abs - g) * 60)
  // 59.7' redondea a 60', que hay que subir al grado.
  if (m === 60) { m = 0; g += 1 }
  return `${g}°${String(m).padStart(2, "0")}′`
}
