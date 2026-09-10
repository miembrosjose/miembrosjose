// Expansión de consulta para la búsqueda de Transmisiones.
//
// El buscador usa full-text de Postgres (config 'spanish'), pero además
// expandimos términos con sinónimos editoriales para que, p.ej., "dinero"
// también encuentre "abundancia", "recursos", "escasez". La expansión ocurre
// en el servidor (nunca se descarga el corpus al navegador).
//
// El resultado es una cadena estilo websearch ("a OR b OR c") apta para
// .textSearch(col, q, { type: 'websearch', config: 'spanish' }).

const SYNONYM_GROUPS: string[][] = [
  ["dinero", "abundancia", "recursos", "escasez", "prosperidad", "riqueza", "creación"],
  ["amor", "pareja", "relaciones", "vínculo", "corazón"],
  ["familia", "hijos", "niños", "padres", "ancestros"],
  ["sanación", "sanar", "salud", "herida", "trauma", "curación"],
  ["miedo", "ansiedad", "angustia", "sombra"],
  ["propósito", "misión", "sentido", "vocación", "camino"],
  ["contacto", "extraterrestre", "cósmico", "estelar", "familia cósmica"],
  ["conciencia", "consciencia", "despertar", "presencia", "realidad"],
  ["tiempo", "sueños", "multidimensional", "dimensiones"],
  ["intuición", "capacidades", "dones", "percepción"],
  ["muerte", "transición", "trascender", "más allá"],
  ["tierra", "planeta", "servicio", "red", "144000"],
  ["energía", "vibración", "frecuencia"],
]

export function expandQuery(raw: string): string {
  const q = (raw || "").trim().toLowerCase()
  if (!q) return ""
  // Tokeniza respetando palabras; ignora signos.
  const tokens = q.split(/\s+/).map((t) => t.replace(/[^\p{L}\p{N}]/gu, "")).filter(Boolean)
  const terms = new Set<string>()
  for (const tok of tokens) {
    terms.add(tok)
    for (const group of SYNONYM_GROUPS) {
      if (group.some((g) => g === tok || g.split(" ").includes(tok))) {
        group.forEach((g) => terms.add(g))
      }
    }
  }
  // websearch entiende OR en mayúsculas. Frases con espacio → entre comillas.
  return Array.from(terms)
    .map((t) => (t.includes(" ") ? `"${t}"` : t))
    .join(" OR ")
}
