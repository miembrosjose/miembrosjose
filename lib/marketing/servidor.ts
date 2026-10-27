// CENTRO DE ORGANIZACIÓN — la puerta y el vocabulario.
//
// ── DOS PERMISOS, NO UNO ───────────────────────────────────────────────────
// Entrar aquí lo puede hacer cualquier administrador: Regi organiza, crea,
// edita, marca y registra. Eso es casi todo.
//
// Lo que NO puede hacer es aprobar guiones ni cambiar las frecuencias
// acordadas. Para eso está `es_propietario`, que es de una sola persona.
//
// ── POR QUÉ SE COMPRUEBA EN EL SERVIDOR Y NO EN EL BOTÓN ──────────────────
// Un botón escondido se salta con una petición a mano. La pantalla puede
// apagar un botón para que sea cómodo hacerlo bien; quien decide si se puede
// es esto.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"
import type { User } from "@supabase/supabase-js"

export type Permiso = { user: User; esPropietario: boolean }

/**
 * Deja pasar a administración, y dice si además es el dueño.
 *
 * Devuelve una respuesta ya hecha cuando no se puede pasar, para que quien
 * llama no tenga que recordar qué código devolver en cada caso.
 */
export async function exigirMarketing(): Promise<Permiso | { respuesta: NextResponse }> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { respuesta: NextResponse.json({ error: "No autenticado" }, { status: 401 }) }
  }
  if (!isAdmin(user)) {
    return { respuesta: NextResponse.json({ error: "Prohibido" }, { status: 403 }) }
  }

  // ── POR QUÉ ESTO SE LEE DE `profiles` Y NO DEL TOKEN ────────────────────
  // `is_admin` vive en el token y por eso no hace falta consultarlo. Esto no:
  // vive en una tabla, y se lee en cada petición. Es un viaje más, pero
  // significa que quitarle el permiso a alguien tiene efecto inmediato en vez
  // de esperar a que caduque su sesión.
  const { data } = await getSupabaseAdmin()
    .from("profiles")
    .select("es_propietario")
    .eq("id", user.id)
    .maybeSingle()

  return { user, esPropietario: data?.es_propietario === true }
}

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
