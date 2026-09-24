// API — un espacio del Centro de Comunidad.
//
//   GET /api/comunidad/espacios/<slug>?categoria=&orden=&q=&cursor=
//
// Devuelve el espacio, sus categorías si las tiene, lo fijado y la lista de
// conversaciones con su paginación.
//
// ── LA COMPROBACIÓN QUE IMPORTA ────────────────────────────────────────────
// Si el espacio es de una temporada que esta persona no tiene abierta, la
// respuesta es 403 y no lleva NADA de dentro: ni títulos, ni autores, ni
// cuántas conversaciones hay. Lo único que se devuelve es el nombre del
// espacio y por qué está cerrado, para poder dibujar el candado.
//
// Esto no es una duplicación de lo que hace la interfaz: es lo único que
// protege de verdad. Pedir esta dirección a mano es trivial.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { categoriasDe, contextoDe, puedeEntrar, puedeModerar } from "@/lib/comunidad/acceso"
import { listarHilos, marcarLoMio, type Orden } from "@/lib/comunidad/hilos"

export const dynamic = "force-dynamic"

const ORDENES: Orden[] = ["recientes", "activas", "sin_respuesta"]

export async function GET(req: NextRequest, ctxRuta: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctxRuta.params

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const ctx = await contextoDe(user)
  const espacio = ctx.espacios.find((e) => e.slug === slug)
  if (!espacio) return NextResponse.json({ error: "Ese espacio no existe" }, { status: 404 })

  if (!puedeEntrar(espacio, ctx.abiertas)) {
    return NextResponse.json(
      {
        error: "cerrado",
        espacio: {
          slug: espacio.slug,
          name: espacio.name,
          kicker: espacio.kicker,
          tipo: espacio.tipo,
          season_num: espacio.season_num,
        },
        mensaje:
          "Continúa tu recorrido para entrar aquí. Las conversaciones de esta etapa " +
          "te esperan cuando llegues, sin adelantarte nada.",
      },
      { status: 403 },
    )
  }

  const sp = req.nextUrl.searchParams
  const categoriaSlug = (sp.get("categoria") || "").trim()
  const ordenPedido = (sp.get("orden") || "recientes") as Orden
  const orden: Orden = ORDENES.includes(ordenPedido) ? ordenPedido : "recientes"
  const q = (sp.get("q") || "").trim() || null
  const cursor = sp.get("cursor")

  const categorias = await categoriasDe([espacio.id])
  const categoria = categoriaSlug ? categorias.find((c) => c.slug === categoriaSlug) : null
  if (categoriaSlug && !categoria) {
    return NextResponse.json({ error: "Esa categoría no existe aquí" }, { status: 404 })
  }

  const [fijadas, lista] = await Promise.all([
    // Las fijadas solo en la primera página: en las siguientes ya se vieron.
    cursor
      ? Promise.resolve({ hilos: [], siguienteCursor: null })
      : listarHilos({ legibles: ctx.legibles, spaceId: espacio.id, fijadas: true, limite: 5 }),
    listarHilos({
      legibles: ctx.legibles,
      spaceId: espacio.id,
      categoryId: categoria?.id ?? null,
      orden,
      q,
      antesDe: cursor,
      fijadas: false,
      limite: 20,
    }),
  ])

  const [conFijadas, conLista] = await Promise.all([
    marcarLoMio(supabase, user.id, fijadas.hilos as unknown as Array<Record<string, unknown>>),
    marcarLoMio(supabase, user.id, lista.hilos as unknown as Array<Record<string, unknown>>),
  ])

  return NextResponse.json({
    espacio: {
      id: espacio.id,
      slug: espacio.slug,
      name: espacio.name,
      kicker: espacio.kicker,
      description: espacio.description,
      tipo: espacio.tipo,
      season_num: espacio.season_num,
      icono: espacio.icono,
    },
    categorias: categorias.map((c) => ({
      id: c.id, slug: c.slug, name: c.name, description: c.description,
    })),
    categoria_activa: categoria?.slug ?? null,
    fijadas: conFijadas,
    hilos: conLista,
    siguiente_cursor: lista.siguienteCursor,
    orden,
    puedo: { moderar: puedeModerar(ctx.papel) },
  })
}
