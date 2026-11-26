// ═══════════════════════════════════════════════════════════════════════════
//  LOS FILTROS DE TEMPORADA · leerlos y decidir con ellos
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ ESTO ESTÁ SOLO Y SIN IMPORTAR NADA ────────────────────────────
// Porque de aquí sale a quién le llega un correo, y eso tiene que poder
// probarse. El motor de audiencias importa el cliente de la base y media
// docena de módulos más, así que no se puede abrir con Node a pelo: una
// prueba de esta decisión tendría que montar una base entera.
//
// Sin dependencias, la decisión se prueba con una lista de números. Las
// pruebas están en scripts/probar-temporadas.mjs.
//
// ── LAS TRES PREGUNTAS, QUE NO SON LA MISMA ───────────────────────────────
//   llegó a         por dónde va: un UMBRAL, «la 2 o más allá»
//   terminó         la vio entera
//   dejó a medias   la empezó y no la acabó
//
// La primera admite un solo número y las otras dos una lista. No es un
// descuido: «al menos la 1 o al menos la 2» es «al menos la 1», porque la
// unión de dos umbrales es el más bajo. Una casilla que no puede cambiar el
// resultado engaña más de lo que ayuda.

/**
 * Las temporadas que pide un filtro, venga como venga.
 *
 * Acepta una lista —lo de ahora— y un número suelto, porque los borradores
 * guardados antes del 26-11-2026 lo tienen así. Un borrador no se migra: se
 * abre, y tiene que seguir significando lo mismo.
 *
 * Se descarta lo que no sea una temporada de verdad: un nulo, un texto o un
 * cero no pueden convertirse en «la temporada 0» y dejar una audiencia vacía
 * sin que nadie entienda por qué.
 */
export function temporadasDe(v: unknown): number[] {
  const crudas = Array.isArray(v) ? v : [v]
  const limpias = crudas
    .map((x) => Number(x))
    .filter((n) => Number.isInteger(n) && n >= 1)
  // Sin repetidas y en orden: la frase se lee mejor y dos veces la misma
  // temporada no estrecha nada.
  return [...new Set(limpias)].sort((x, y) => x - y)
}

/** «la Temporada 2», «la Temporada 2 o la 3». Para las frases. */
export function frasearTemporadas(ns: number[]): string {
  const partes = ns.map((n) => "la Temporada " + n)
  if (partes.length <= 1) return partes[0] ?? ""
  return partes.slice(0, -1).join(", ") + " o " + partes[partes.length - 1]
}

/**
 * ¿Terminó alguna de las elegidas?
 *
 * Varias marcadas se cumplen con CUALQUIERA, igual que con los países. Lo
 * contrario —exigir todas— ni se puede pedir desde la pantalla ni haría
 * falta: para terminar la 3 hay que haber pasado por la 2.
 */
export function terminoAlguna(pedidas: number[], suyas: Set<number> | undefined): boolean {
  return pedidas.some((n) => suyas?.has(n) === true)
}

/**
 * Por qué esta persona entra o no en «dejó a medias».
 *
 * ── POR QUÉ DEVUELVE UN MOTIVO Y NO UN SÍ O UN NO ─────────────────────────
 * Porque «todavía no ha llegado ahí» y «ya la terminó» son dos razones
 * opuestas de quedarse fuera, y el ensayo de audiencia las enseña separadas.
 * Verlas juntas como «no cumple» sería perder justo lo que explica la cifra:
 * a uno hay que animarle a empezar y al otro a seguir.
 *
 * Con varias elegidas basta una a medias. Si llegó a alguna de ellas pero no
 * tiene ninguna colgando, es que las tiene terminadas: va por delante.
 */
export type MotivoAMedias = "entra" | "ya_la_termino" | "no_la_empezo"

export function estaAMedias(
  pedidas: number[],
  avance: number,
  completadas: Set<number> | undefined,
): MotivoAMedias {
  if (pedidas.some((n) => avance >= n && completadas?.has(n) !== true)) return "entra"
  if (pedidas.some((n) => avance >= n)) return "ya_la_termino"
  return "no_la_empezo"
}
