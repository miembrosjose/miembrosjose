// ═══════════════════════════════════════════════════════════════════════════
//  GET /api/novedades · lo que José ha publicado, de lo más nuevo a lo viejo
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ UNA RUTA PROPIA SI LOS DATOS SON DEL FORO ─────────────────────
// Porque la pantalla de Inicio necesita una cosa que la del foro no: el
// CUERPO entero de cada novedad, para poder dibujarla ahí mismo sin que nadie
// tenga que ir a otro sitio a leerla. La lista de un espacio devuelve
// resúmenes, que es lo correcto cuando hay cincuenta conversaciones y aquí
// sería un recorte molesto en mitad de un anuncio.
//
// ── EL ESPACIO PUEDE ESTAR OCULTO ─────────────────────────────────────────
// `visible = false` significa que la sección existe, tiene contenido de
// verdad, y todavía no se ha abierto. Mientras tanto solo la ve la
// administración — que es quien la está revisando.
//
// Eso NO es una comprobación cosmética del lado del navegador: si alguien
// llama a esta dirección a mano, el servidor le contesta que no hay nada.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export type Novedad = {
  id: string
  titulo: string
  cuerpo: string
  autor: string
  creada: string
  eventoAt: string | null
  eventoZona: string | null
  ctaTexto: string | null
  ctaUrl: string | null
  respuestas: number
  /** Hora a la que deja de salir en la portada. Null = no caduca. */
  caducaAt: string | null
  /** Solo lo ve administración: ya caducada, pero sigue en su panel. */
  retirada: boolean
}

/** La fila tal como vive en la base. */
type FilaDb = {
  id: string
  title: string
  body: string
  author_name: string
  created_at: string
  evento_at: string | null
  evento_zona: string | null
  cta_texto: string | null
  cta_url: string | null
  replies_count: number | null
  /** Ausente mientras novedades_02_caducidad.sql no se haya corrido. */
  caduca_at?: string | null
}

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const admin = getSupabaseAdmin()

  const { data: espacio } = await admin
    .from("community_spaces")
    .select("id, visible")
    .eq("slug", "novedades")
    .maybeSingle<{ id: string; visible: boolean | null }>()

  // Sin espacio, la migración no se ha corrido. No es un error que haya que
  // enseñarle a nadie: simplemente todavía no hay sección.
  if (!espacio) return NextResponse.json({ hay: false, novedades: [] })

  const puedeVer = espacio.visible === true || isAdmin(user)
  if (!puedeVer) return NextResponse.json({ hay: false, novedades: [] })

  // ── LAS CADUCADAS NO SALEN ────────────────────────────────────────────
  // «El domingo 15 nos vemos en vivo» seguía en la portada días después. Eso
  // es peor que no anunciar nada: quien entra el martes lee una convocatoria
  // a algo que ya pasó y aprende que esta sección no es de fiar.
  //
  // El filtro va en el SERVIDOR, no escondiendo filas en el navegador: una
  // novedad retirada no tiene por qué seguir viajando hasta el teléfono de
  // nadie.
  //
  // Administración las sigue viendo todas, para poder editarlas y para no
  // perder de vista lo que se anunció.
  const esAdmin = isAdmin(user)
  const CAMPOS =
    "id, title, body, author_name, created_at, evento_at, evento_zona, " +
    "cta_texto, cta_url, replies_count, caduca_at"

  let consulta = admin
    .from("forum_posts")
    .select(CAMPOS)
    .eq("space_id", espacio.id)
  if (!esAdmin) {
    consulta = consulta.or(`caduca_at.is.null,caduca_at.gt.${new Date().toISOString()}`)
  }

  // El tipo se declara a mano: al construir la lista de campos con una
  // variable —hace falta para el reintento sin `caduca_at`— Supabase pierde
  // la inferencia y devuelve una unión con su tipo de error.
  const primera = await consulta
    .order("created_at", { ascending: false })
    .limit(20)
  let data = primera.data as unknown as FilaDb[] | null
  let error = primera.error as { message: string } | null

  // Mientras la migración novedades_02_caducidad.sql no se haya corrido, la
  // columna no existe. Se reintenta sin ella: la sección sigue funcionando
  // como antes en vez de quedarse en blanco esperando un SQL.
  if (error && /caduca_at/i.test(error.message)) {
    const reintento = await admin
      .from("forum_posts")
      .select(CAMPOS.replace(", caduca_at", ""))
      .eq("space_id", espacio.id)
      .order("created_at", { ascending: false })
      .limit(20)
    data = reintento.data as unknown as FilaDb[] | null
    error = reintento.error as { message: string } | null
  }

  if (error) {
    console.error("[novedades] no se pudieron leer:", error.message)
    return NextResponse.json({ error: "No se pudieron leer" }, { status: 500 })
  }

  const ahora = Date.now()
  const novedades: Novedad[] = (data || []).map((p) => ({
    id: p.id as string,
    titulo: p.title as string,
    cuerpo: p.body as string,
    autor: p.author_name as string,
    creada: p.created_at as string,
    eventoAt: (p.evento_at as string | null) ?? null,
    eventoZona: (p.evento_zona as string | null) ?? null,
    ctaTexto: (p.cta_texto as string | null) ?? null,
    ctaUrl: (p.cta_url as string | null) ?? null,
    respuestas: (p.replies_count as number | null) ?? 0,
    caducaAt: ((p as { caduca_at?: string | null }).caduca_at) ?? null,
    retirada: (() => {
      const c = (p as { caduca_at?: string | null }).caduca_at
      return !!c && new Date(c).getTime() <= ahora
    })(),
  }))

  return NextResponse.json({
    hay: novedades.length > 0,
    // Para que la pantalla pueda avisar a quien la revisa de que todavía no
    // la ve nadie más. Sin ese aviso, es facilísimo darla por publicada.
    oculta: espacio.visible !== true,
    novedades,
  })
}
