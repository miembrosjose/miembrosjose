// GET  /api/admin/novedades  → todas, incluidas las ya retiradas
// POST /api/admin/novedades  → publicar una nueva
//
// ── POR QUÉ ESTO EXISTE ───────────────────────────────────────────────────
// Las novedades son entradas del foro en el espacio `novedades`, con unas
// columnas de más: la hora del acto, el botón y, desde ahora, la caducidad.
// Hasta aquí solo se podían crear pegando SQL en Supabase, así que publicar
// un aviso de dos líneas dependía de que yo estuviera delante.
//
// Un aviso que hay que pedirle a alguien no se publica: se deja para luego.
// Por eso esto va al panel.
//
// ── NO SE REUSÓ /api/forum/posts ──────────────────────────────────────────
// Esa ruta no pone `space_id` —sus entradas van al foro general— ni sabe nada
// de la hora del acto ni de la caducidad. Añadirle un modo especial habría
// metido las reglas de las novedades dentro del foro de todos.

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"
import { buildAvatarLetters } from "@/app/miembros/_lib/format"
import { camposDeNovedad } from "@/lib/novedades"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** El espacio «novedades», o null si la migración del espacio no se corrió. */
async function espacioNovedades(): Promise<string | null> {
  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from("community_spaces")
    .select("id")
    .eq("slug", "novedades")
    .maybeSingle<{ id: string }>()
  return data?.id ?? null
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const espacio = await espacioNovedades()
  if (!espacio) return NextResponse.json({ novedades: [], sinEspacio: true })

  const admin = getSupabaseAdmin()
  const CAMPOS =
    "id, title, body, created_at, evento_at, evento_zona, cta_texto, cta_url, " +
    "replies_count, caduca_at"

  // El tipo se declara a mano: al construir la lista de campos con una
  // variable —hace falta para el reintento sin `caduca_at`— Supabase pierde
  // la inferencia y devuelve una unión con su tipo de error.
  type FilaDb = {
    id: string
    title: string
    body: string
    created_at: string
    evento_at: string | null
    evento_zona: string | null
    cta_texto: string | null
    cta_url: string | null
    replies_count: number | null
    caduca_at?: string | null
  }

  const primera = await admin
    .from("forum_posts")
    .select(CAMPOS)
    .eq("space_id", espacio)
    .order("created_at", { ascending: false })
    .limit(60)
  let data = primera.data as unknown as FilaDb[] | null
  let error = primera.error as { message: string } | null

  // Mientras novedades_02_caducidad.sql no se haya corrido.
  let sinCaducidad = false
  if (error && /caduca_at/i.test(error.message)) {
    sinCaducidad = true
    const r = await admin
      .from("forum_posts")
      .select(CAMPOS.replace(", caduca_at", ""))
      .eq("space_id", espacio)
      .order("created_at", { ascending: false })
      .limit(60)
    data = r.data as unknown as FilaDb[] | null
    error = r.error as { message: string } | null
  }

  if (error) {
    console.error("[admin/novedades] GET", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const ahora = Date.now()
  return NextResponse.json({
    sinCaducidad,
    novedades: (data || []).map((p) => {
      const caduca = (p as { caduca_at?: string | null }).caduca_at ?? null
      return {
        id: p.id as string,
        titulo: p.title as string,
        cuerpo: p.body as string,
        creada: p.created_at as string,
        eventoAt: (p.evento_at as string | null) ?? null,
        eventoZona: (p.evento_zona as string | null) ?? null,
        ctaTexto: (p.cta_texto as string | null) ?? null,
        ctaUrl: (p.cta_url as string | null) ?? null,
        respuestas: (p.replies_count as number | null) ?? 0,
        caducaAt: caduca,
        retirada: !!caduca && new Date(caduca).getTime() <= ahora,
      }
    }),
  })
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const campos = camposDeNovedad(body, { exigirTexto: true })
  if ("error" in campos) {
    return NextResponse.json({ error: campos.error }, { status: 400 })
  }

  const espacio = await espacioNovedades()
  if (!espacio) {
    return NextResponse.json(
      { error: "Falta correr docs/sql/novedades_01_espacio.sql en Supabase." },
      { status: 409 },
    )
  }

  // ── La identidad de quien publica, congelada en la entrada ────────────
  // Mismo patrón que el foro: se guarda cómo se llamaba y qué insignia
  // llevaba al publicar, para que cambiar el perfil después no reescriba el
  // pasado.
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const meta = (user.user_metadata || {}) as {
    full_name?: string; name?: string; avatar_url?: string
    featured_badge_id?: string | null; featured_star_id?: string | null
    featured_flame_id?: string | null; avatar_border_color?: string | null
    username?: string
  }
  const nombre = meta.full_name || meta.name
    || (user.email ? user.email.split("@")[0] : "Administración")

  const admin = getSupabaseAdmin()
  const fila: Record<string, unknown> = {
    space_id: espacio,
    user_id: user.id,
    author_name: nombre,
    author_username: (typeof meta.username === "string" && meta.username) || null,
    author_avatar: buildAvatarLetters(nombre),
    author_avatar_url: (typeof meta.avatar_url === "string" && meta.avatar_url) || null,
    author_avatar_border:
      (typeof meta.avatar_border_color === "string" && meta.avatar_border_color) || null,
    author_badge_id:
      (typeof meta.featured_badge_id === "string" && meta.featured_badge_id)
      || (isAdmin(user) ? "admin_seal" : "welcome"),
    author_star_id: (typeof meta.featured_star_id === "string" && meta.featured_star_id) || null,
    author_flame_id: (typeof meta.featured_flame_id === "string" && meta.featured_flame_id) || null,
    author_is_admin: true,
    title: campos.titulo,
    body: campos.cuerpo,
    evento_at: campos.eventoAt,
    evento_zona: campos.eventoZona,
    cta_texto: campos.ctaTexto,
    cta_url: campos.ctaUrl,
    caduca_at: campos.caducaAt,
  }

  let { data, error } = await admin.from("forum_posts").insert(fila).select("id").single()

  // Sin la migración de caducidad, se publica igual: sin fecha de retirada.
  if (error && /caduca_at/i.test(error.message)) {
    delete fila.caduca_at
    const r = await admin.from("forum_posts").insert(fila).select("id").single()
    data = r.data
    error = r.error
  }

  if (error) {
    console.error("[admin/novedades] POST", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data?.id }, { status: 201 })
}
