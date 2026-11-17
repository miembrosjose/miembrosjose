// GET  /api/red/grabaciones/<id>/comentarios  → el hilo entero
// POST /api/red/grabaciones/<id>/comentarios  → escribir uno
//
// ── UN SOLO NIVEL, GARANTIZADO AQUÍ ───────────────────────────────────────
// Si se responde a una respuesta, el comentario nuevo cuelga del RAÍZ de esa
// conversación, no de la respuesta. Eso no se deja en manos de la pantalla:
// una petición hecha a mano podría anidar sin fin, y a la cuarta respuesta el
// texto cabe en tres palabras por línea en un teléfono.
//
// Es la misma regla que ya aplica el foro en `forum_replies`.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin"
import { buildAvatarLetters } from "@/app/miembros/_lib/format"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_TEXTO = 1000

type FilaComentario = {
  id: string
  user_id: string
  parent_id: string | null
  author_name: string
  author_username: string | null
  author_avatar: string
  author_avatar_url: string | null
  author_badge_id: string | null
  author_is_admin: boolean
  body: string
  likes_count: number
  created_at: string
  edited_at: string | null
}

const CAMPOS =
  "id, user_id, parent_id, author_name, author_username, author_avatar, " +
  "author_avatar_url, author_badge_id, author_is_admin, body, likes_count, " +
  "created_at, edited_at"

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  const grabacion = Number(id)
  if (!Number.isInteger(grabacion)) {
    return NextResponse.json({ error: "Identificador inválido" }, { status: 400 })
  }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data, error } = await supabase
    .from("network_recording_comments")
    .select(CAMPOS)
    .eq("recording_id", grabacion)
    .order("created_at", { ascending: true })
    .limit(500)

  if (error) {
    // Mientras la migración no se haya corrido, el hilo se comporta como
    // vacío en vez de pintar un error rojo bajo el vídeo.
    if (faltaLaTabla(error)) {
      return NextResponse.json({ comentarios: [], mios: [], sinTabla: true })
    }
    console.error("[grabaciones/comentarios] GET", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const filas = (data || []) as unknown as FilaComentario[]

  // Cuáles ha marcado ESTA persona. En una sola consulta: una por comentario
  // sería una tormenta de peticiones en un hilo largo.
  let mios: string[] = []
  if (filas.length > 0) {
    const { data: likes } = await supabase
      .from("network_recording_comment_likes")
      .select("comment_id")
      .eq("user_id", user.id)
      .in("comment_id", filas.map((f) => f.id))
    mios = (likes || []).map((l) => l.comment_id as string)
  }

  return NextResponse.json({
    comentarios: filas,
    mios,
    puedoModerar: isAdmin(user),
  })
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  const grabacion = Number(id)
  if (!Number.isInteger(grabacion)) {
    return NextResponse.json({ error: "Identificador inválido" }, { status: 400 })
  }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { texto?: string; responderA?: string | null }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const texto = (body.texto || "").trim()
  if (!texto) return NextResponse.json({ error: "Escribe algo." }, { status: 400 })
  if (texto.length > MAX_TEXTO) {
    return NextResponse.json(
      { error: `El comentario no puede pasar de ${MAX_TEXTO} caracteres.` },
      { status: 400 },
    )
  }

  // ── EL APLANADO ────────────────────────────────────────────────────────
  // Si se responde a algo que ya es una respuesta, se cuelga de su raíz.
  let padre: string | null = null
  if (body.responderA) {
    const { data: aQuien } = await supabase
      .from("network_recording_comments")
      .select("id, parent_id, recording_id")
      .eq("id", body.responderA)
      .maybeSingle<{ id: string; parent_id: string | null; recording_id: number }>()

    if (!aQuien || aQuien.recording_id !== grabacion) {
      return NextResponse.json(
        { error: "Ese comentario ya no está." },
        { status: 400 },
      )
    }
    padre = aQuien.parent_id ?? aQuien.id
  }

  // La identidad, congelada: ver el comentario de la migración.
  const meta = (user.user_metadata || {}) as {
    full_name?: string; name?: string; avatar_url?: string
    featured_badge_id?: string | null; username?: string
  }
  const nombre = meta.full_name || meta.name
    || (user.email ? user.email.split("@")[0] : "Miembro")

  const { data, error } = await supabase
    .from("network_recording_comments")
    .insert({
      recording_id: grabacion,
      user_id: user.id,
      parent_id: padre,
      author_name: nombre,
      author_username: (typeof meta.username === "string" && meta.username) || null,
      author_avatar: buildAvatarLetters(nombre),
      author_avatar_url: (typeof meta.avatar_url === "string" && meta.avatar_url) || null,
      author_badge_id:
        (typeof meta.featured_badge_id === "string" && meta.featured_badge_id)
        || (isAdmin(user) ? "admin_seal" : "welcome"),
      author_is_admin: isAdmin(user),
      body: texto,
    })
    .select(CAMPOS)
    .single()

  if (error) {
    if (faltaLaTabla(error)) {
      return NextResponse.json(
        { error: "Falta correr docs/sql/encuentros_comentarios.sql en Supabase." },
        { status: 409 },
      )
    }
    console.error("[grabaciones/comentarios] POST", error.message)
    return NextResponse.json({ error: "No se pudo publicar." }, { status: 500 })
  }

  return NextResponse.json({ comentario: data }, { status: 201 })
}

function faltaLaTabla(error: { code?: string; message?: string }): boolean {
  const codigo = error.code || ""
  if (codigo === "42P01" || codigo === "PGRST205") return true
  return /does not exist|schema cache/i.test(error.message || "")
}
