// Límites y validación de los campos de una grabación.
//
// Vive aparte porque crear y editar validan LO MISMO. Cuando cada ruta tenía
// su copia, bastaba con cambiar un límite en una para que la otra aceptara lo
// que la primera rechazaba, y eso no se nota hasta que alguien edita.

/**
 * ¿El error de la base es «esa tabla todavía no existe»?
 *
 * ── PARA QUÉ ──────────────────────────────────────────────────────────────
 * Desplegar el código y correr el SQL son dos actos separados, y el orden no
 * lo decide nadie: la migración se corre cuando se puede entrar a Supabase. Si
 * el código llega primero, la pestaña daría un error rojo a toda la Red por
 * una tabla que falta, cuando la verdad es más simple: todavía no hay
 * grabaciones.
 *
 * Postgres lo dice con el código 42P01. PostgREST, mientras no ha recargado su
 * esquema, lo dice de otra forma y con otro código. Se miran los dos y también
 * el texto: con una sola comprobación, el aviso salía unas veces y otras no,
 * según el momento en que se preguntara.
 */
export function faltaLaTabla(error: { code?: string; message?: string }): boolean {
  const codigo = error.code || ""
  const mensaje = error.message || ""
  if (codigo === "42P01" || codigo === "PGRST205") return true
  return /does not exist|schema cache/i.test(mensaje)
}

export const MAX_TITULO = 160
export const MAX_DESCRIPCION = 2000
/** Lo que da VTurb ronda el kilobyte; con 20 sobra y se corta un pegote absurdo. */
export const MAX_EMBED = 20_000

export type Campos = {
  titulo?: string
  descripcion?: string
  fecha?: string | null
}

/**
 * Comprueba los campos de texto. Devuelve el primer problema en palabras, o
 * null si todo está bien.
 *
 * Solo mira lo que venga: en una edición parcial, lo que no se manda no se
 * toca y por tanto no se valida.
 */
export function problemaConLosCampos(body: Record<string, unknown>): string | null {
  if (body.titulo !== undefined) {
    const t = typeof body.titulo === "string" ? body.titulo.trim() : ""
    if (!t) return "Ponle un título."
    if (t.length > MAX_TITULO) {
      return `El título no puede pasar de ${MAX_TITULO} caracteres.`
    }
  }

  if (body.descripcion !== undefined) {
    if (typeof body.descripcion !== "string") return "La descripción no es texto."
    if (body.descripcion.trim().length > MAX_DESCRIPCION) {
      return `La descripción no puede pasar de ${MAX_DESCRIPCION} caracteres.`
    }
  }

  if (body.embed !== undefined) {
    if (typeof body.embed !== "string") return "El código de VTurb no es texto."
    if (body.embed.length > MAX_EMBED) {
      return "Ese código es demasiado largo para ser el de VTurb."
    }
  }

  if (body.estado !== undefined) {
    if (body.estado !== "borrador" && body.estado !== "publicado") {
      return "El estado solo puede ser borrador o publicado."
    }
  }

  if (normalizarFecha(body.fecha) === "invalida") {
    return "La fecha tiene que ser como 2026-11-15."
  }

  return null
}

/**
 * Devuelve la fecha en formato de base, `null` si no se mandó (y entonces la
 * base pone hoy), o "invalida" si se mandó algo que no es una fecha.
 *
 * Se distingue «no mandó fecha» de «mandó basura» porque son dos cosas
 * distintas: la primera es normal y la segunda hay que decírsela.
 */
export function normalizarFecha(v: unknown): string | null | "invalida" {
  if (v === undefined || v === null || v === "") return null
  if (typeof v !== "string") return "invalida"
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "invalida"
  const d = new Date(v + "T00:00:00Z")
  if (!Number.isFinite(d.getTime())) return "invalida"
  return v
}
