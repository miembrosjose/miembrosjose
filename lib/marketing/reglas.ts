// CENTRO DE ORGANIZACIÓN — las reglas, sin depender de nada.
//
// ── POR QUÉ ESTO ESTÁ SEPARADO DEL GUARDIA ────────────────────────────
// `servidor.ts` importa Next y el cliente de Supabase porque tiene que leer
// la sesión. Esto no importa nada: son funciones que reciben un objeto y
// devuelven otro.
//
// Estaban juntas, y eso hacía que la regla más importante de todo el módulo
// —quién puede aprobar un guion— no se pudiera probar sin levantar medio
// Next. Una regla de permisos que no se puede probar es una regla en la que
// hay que confiar.
//
// Ahora se prueba: npm run probar:guiones

// ── EL VOCABULARIO ─────────────────────────────────────────────────────────
//
// Las mismas listas que el `check` de la tabla. Están aquí para poder
// rechazar un valor malo con una frase en español en vez de dejar que falle
// la base y devolver un error que no dice nada.

export const CATEGORIAS = [
  "reel", "carrusel", "historias",
  "guion",
  "contenido_miembros",
  "correo", "notificacion",
  "comunidad",
  "transmision", "protocolo",
  "reunion", "resultados",
  "efemeride",
  "otra",
] as const

export type Categoria = (typeof CATEGORIAS)[number]

export const ESTADOS = ["pendiente", "en_curso", "hecha", "cancelada"] as const
export type Estado = (typeof ESTADOS)[number]

export const AMBITOS = ["publico", "miembros", "interno"] as const
export const EJES = ["atraccion", "conocimiento", "comunidad", "membresia"] as const

export type Actividad = {
  id: string
  titulo: string
  categoria: Categoria
  ambito: "publico" | "miembros" | "interno"
  eje: string | null
  campana: string
  fecha: string
  fecha_entrega: string | null
  estado: Estado
  responsable_id: string | null
  notas: string
  enlaces: Array<{ titulo: string; url: string }>
  checklist: Array<{ texto: string; hecha: boolean }>
  es_referencia: boolean
  created_at: string
  updated_at: string
}

/**
 * Lo que se puede escribir desde fuera.
 *
 * Una lista explícita, no «todo lo que venga en el cuerpo». Sin esto, una
 * petición podría colar `created_by` o `id` y dejar la tabla contando una
 * historia que no ocurrió.
 */
const CAMPOS = [
  "titulo", "categoria", "ambito", "eje", "campana",
  "fecha", "fecha_entrega", "estado", "responsable_id",
  "notas", "enlaces", "checklist", "es_referencia",
] as const

const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/

/**
 * Se queda con lo escribible y comprueba que tenga sentido.
 *
 * Devuelve el error en español, o los campos limpios. Comprobarlo aquí y no
 * dejárselo a la base es lo que hace que un desplegable mal enviado diga
 * «esa categoría no existe» en vez de «violates check constraint».
 */
export function limpiarActividad(
  body: Record<string, unknown>,
  { parcial }: { parcial: boolean },
): { error: string } | { campos: Record<string, unknown> } {
  const c: Record<string, unknown> = {}

  for (const campo of CAMPOS) {
    if (!(campo in body)) continue
    c[campo] = body[campo]
  }

  if (!parcial) {
    if (!String(c.titulo ?? "").trim()) return { error: "Ponle un nombre a la actividad." }
    if (!c.fecha) return { error: "Falta la fecha." }
    if (!c.categoria) return { error: "Falta la categoría." }
  }

  if ("titulo" in c) {
    const t = String(c.titulo).trim()
    if (!t) return { error: "El nombre no puede quedar vacío." }
    c.titulo = t.slice(0, 200)
  }

  if ("categoria" in c && !CATEGORIAS.includes(c.categoria as Categoria)) {
    return { error: "Esa categoría no existe." }
  }
  if ("estado" in c && !ESTADOS.includes(c.estado as Estado)) {
    return { error: "Ese estado no existe." }
  }
  if ("ambito" in c && !AMBITOS.includes(c.ambito as never)) {
    return { error: "Ese ámbito no existe." }
  }
  if ("eje" in c && c.eje !== null && !EJES.includes(c.eje as never)) {
    return { error: "Ese eje editorial no existe." }
  }

  if ("fecha" in c && !ES_FECHA.test(String(c.fecha))) {
    return { error: "La fecha no es válida." }
  }
  if ("fecha_entrega" in c && c.fecha_entrega !== null && !ES_FECHA.test(String(c.fecha_entrega))) {
    return { error: "La fecha de entrega no es válida." }
  }

  // ── LAS LISTAS, COMPROBADAS UNA A UNA ─────────────────────────────────
  // Van a `jsonb`, que acepta cualquier cosa: sin esto, un fallo del
  // navegador podría guardar un checklist con la forma equivocada y la
  // pantalla se rompería al dibujarlo, no al guardarlo.
  if ("enlaces" in c) {
    if (!Array.isArray(c.enlaces)) return { error: "Los enlaces tienen que ser una lista." }
    c.enlaces = (c.enlaces as Array<Record<string, unknown>>)
      .filter((e) => e && typeof e === "object")
      .map((e) => ({
        titulo: String(e.titulo ?? "").slice(0, 120),
        url: String(e.url ?? "").slice(0, 2000),
      }))
      .filter((e) => e.url)
      .slice(0, 20)
  }

  if ("checklist" in c) {
    if (!Array.isArray(c.checklist)) return { error: "El checklist tiene que ser una lista." }
    c.checklist = (c.checklist as Array<Record<string, unknown>>)
      .filter((p) => p && typeof p === "object")
      .map((p) => ({ texto: String(p.texto ?? "").slice(0, 300), hecha: p.hecha === true }))
      .filter((p) => p.texto)
      .slice(0, 60)
  }

  if ("notas" in c) c.notas = String(c.notas ?? "").slice(0, 8000)
  if ("campana" in c) c.campana = String(c.campana ?? "").trim().slice(0, 120)
  if ("es_referencia" in c) c.es_referencia = c.es_referencia === true

  if ("responsable_id" in c && c.responsable_id !== null) {
    if (!/^[0-9a-f-]{36}$/i.test(String(c.responsable_id))) {
      return { error: "Ese responsable no es válido." }
    }
  }

  if (Object.keys(c).length === 0) return { error: "No hay nada que cambiar." }
  return { campos: c }
}

// ── LOS GUIONES ────────────────────────────────────────────────────────────

export const FORMATOS = ["reel", "carrusel", "historias", "transmision", "otro"] as const
export const ESTADOS_GUION = ["idea", "desarrollo", "revision", "aprobado", "publicado"] as const

export type EstadoGuion = (typeof ESTADOS_GUION)[number]

export type Comentario = {
  autor_id: string | null
  autor: string
  texto: string
  fecha: string
}

export type Guion = {
  id: string
  titulo: string
  formato: (typeof FORMATOS)[number]
  ambito: "publico" | "miembros"
  estado: EstadoGuion
  tema: string
  objetivo: string
  gancho: string
  guion: string
  idea_visual: string
  campana: string
  fecha_entrega: string | null
  fecha_publicacion: string | null
  responsable_id: string | null
  actividad_id: string | null
  comentarios: Comentario[]
  created_at: string
  updated_at: string
}

const CAMPOS_GUION = [
  "titulo", "formato", "ambito", "estado",
  "tema", "objetivo", "gancho", "guion", "idea_visual", "campana",
  "fecha_entrega", "fecha_publicacion", "responsable_id", "actividad_id",
] as const

/** Los textos largos, y hasta dónde. */
const LARGOS: Record<string, number> = {
  tema: 2000, objetivo: 2000, gancho: 1000,
  guion: 40000, idea_visual: 4000,
}

/**
 * Lo que se puede escribir en un guion, comprobado.
 *
 * ── LA ÚNICA REGLA QUE DEPENDE DE QUIÉN ERES ──────────────────────────────
 * Aprobar. Todo lo demás —escribir, corregir, entregar, programar— lo puede
 * hacer cualquiera de los dos, porque es el trabajo.
 *
 * Y se comprueba AQUÍ, en el servidor. La pantalla esconde el botón para que
 * sea cómodo hacerlo bien, pero un botón escondido se salta con una petición
 * a mano: quien decide si se puede es esto.
 */
export function limpiarGuion(
  body: Record<string, unknown>,
  { parcial, esPropietario }: { parcial: boolean; esPropietario: boolean },
): { error: string } | { campos: Record<string, unknown> } {
  const c: Record<string, unknown> = {}

  for (const campo of CAMPOS_GUION) {
    if (!(campo in body)) continue
    c[campo] = body[campo]
  }

  if (!parcial && !String(c.titulo ?? "").trim()) {
    return { error: "Ponle un título, aunque sea provisional." }
  }

  if ("titulo" in c) {
    const t = String(c.titulo).trim()
    if (!t) return { error: "El título no puede quedar vacío." }
    c.titulo = t.slice(0, 250)
  }

  if ("formato" in c && !FORMATOS.includes(c.formato as never)) {
    return { error: "Ese formato no existe." }
  }
  if ("ambito" in c && !["publico", "miembros"].includes(String(c.ambito))) {
    return { error: "Ese ámbito no existe." }
  }

  if ("estado" in c) {
    if (!ESTADOS_GUION.includes(c.estado as EstadoGuion)) {
      return { error: "Ese estado no existe." }
    }
    // ── APROBAR ES DEL DUEÑO ───────────────────────────────────────────
    // «Publicado» también: dar algo por publicado es afirmar que salió, y
    // eso lo cierra quien dirige. Lo demás no tiene restricción.
    if ((c.estado === "aprobado" || c.estado === "publicado") && !esPropietario) {
      return { error: "Solo el propietario puede aprobar o dar por publicado un guion." }
    }
  }

  for (const [campo, tope] of Object.entries(LARGOS)) {
    if (campo in c) c[campo] = String(c[campo] ?? "").slice(0, tope)
  }
  if ("campana" in c) c.campana = String(c.campana ?? "").trim().slice(0, 120)

  for (const campo of ["fecha_entrega", "fecha_publicacion"] as const) {
    if (campo in c && c[campo] !== null && !/^\d{4}-\d{2}-\d{2}$/.test(String(c[campo]))) {
      return { error: "Esa fecha no es válida." }
    }
  }

  for (const campo of ["responsable_id", "actividad_id"] as const) {
    if (campo in c && c[campo] !== null && !/^[0-9a-f-]{36}$/i.test(String(c[campo]))) {
      return { error: "Ese identificador no es válido." }
    }
  }

  if (Object.keys(c).length === 0) return { error: "No hay nada que cambiar." }
  return { campos: c }
}

/**
 * Añade una observación a la conversación del guion.
 *
 * ── POR QUÉ EL NOMBRE SE COPIA ─────────────────────────────────────────────
 * Para que un comentario de hace tres meses siga diciendo quién lo escribió
 * aunque esa cuenta ya no exista. Guardar solo el identificador habría
 * dejado la conversación llena de huecos el día que alguien se va.
 */
export function anadirComentario(
  previos: unknown,
  nuevo: { autorId: string; autor: string; texto: string },
): Comentario[] | { error: string } {
  const texto = nuevo.texto.trim()
  if (!texto) return { error: "La observación está vacía." }

  const lista = Array.isArray(previos) ? (previos as Comentario[]) : []

  return [
    ...lista,
    {
      autor_id: nuevo.autorId,
      autor: nuevo.autor.slice(0, 80),
      texto: texto.slice(0, 4000),
      fecha: new Date().toISOString(),
    },
  // Un guion que lleva cuarenta idas y venidas no necesita las cuarenta: se
  // conservan las últimas, que son las que explican dónde está ahora.
  ].slice(-60)
}
