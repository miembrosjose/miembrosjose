// GET  /api/admin/grabaciones  → todas, borradores incluidos (solo admin)
// POST /api/admin/grabaciones  → crear una pegando el código de VTurb
//
// ── QUÉ SE PIDE Y QUÉ NO ──────────────────────────────────────────────────
// Título, y si se quiere una descripción y la fecha del encuentro. NO se pide
// imagen de portada: la previsualización sale del propio vídeo.
//
// Esa es la diferencia con las temporadas, donde hay que subir un vídeo de
// fondo a mano. Aquí el vídeo ya vive en VTurb, que genera su miniatura. Pedir
// además una imagen sería pedir trabajo para tener dos versiones de lo mismo
// y que se desincronicen.
//
// ── LA COMPROBACIÓN QUE EVITA EL HUECO ROTO ───────────────────────────────
// Al guardar se comprueba que la miniatura existe de verdad antes de dejarla
// escrita, y la respuesta DICE qué se encontró. No se adivina: si VTurb no la
// sirve, se guarda nula y la tarjeta se dibuja sin imagen.

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseServer } from "@/lib/supabase/server"
import { leerVturb, miniaturaExiste } from "@/lib/red/vturb"
import { faltaLaTabla, normalizarFecha, problemaConLosCampos } from "@/lib/red/grabaciones"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from("network_recordings")
    .select("*")
    .order("sort_order", { ascending: false })
    .order("fecha", { ascending: false })
    .order("id", { ascending: false })

  if (error) {
    // Mientras la migración no se haya corrido, el panel abre y lo dice, en
    // vez de enseñar un error de base de datos que no explica qué hacer.
    if (faltaLaTabla(error)) {
      return NextResponse.json({ grabaciones: [], sinTabla: true })
    }
    console.error("[admin/grabaciones] GET", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ grabaciones: data ?? [] })
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  // El título es obligatorio al crear; `problemaConLosCampos` solo revisa lo
  // que llega, así que la ausencia se comprueba aquí.
  if (typeof body.titulo !== "string" || !body.titulo.trim()) {
    return NextResponse.json({ error: "Ponle un título." }, { status: 400 })
  }
  const problema = problemaConLosCampos(body)
  if (problema) return NextResponse.json({ error: problema }, { status: 400 })

  const lectura = leerVturb(typeof body.embed === "string" ? body.embed : "")
  if (!lectura.ok) {
    return NextResponse.json({ error: lectura.motivo }, { status: 400 })
  }
  const g = lectura.grabacion

  const fecha = normalizarFecha(body.fecha) as string | null

  // La miniatura solo se guarda si existe. Ver lib/red/vturb.ts.
  const hayMiniatura = await miniaturaExiste(g.miniatura)

  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from("network_recordings")
    .insert({
      titulo: body.titulo.trim(),
      descripcion:
        typeof body.descripcion === "string" ? body.descripcion.trim() : "",
      embed: g.embed,
      cuenta_id: g.cuentaId,
      player_id: g.playerId,
      miniatura: hayMiniatura ? g.miniatura : null,
      ...(fecha ? { fecha } : {}),
      // Nace en borrador a propósito: primero se mira que la
      // previsualización y el reproductor son los correctos, después se
      // publica. Un pegote equivocado no debería ser visible mientras se
      // arregla.
      estado: "borrador",
      created_by: auth.user.id,
    })
    .select()
    .single()

  if (error) {
    console.error("[admin/grabaciones] POST", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      grabacion: data,
      // Lo que el panel le cuenta a quien acaba de pegar el código.
      previsualizacion: {
        encontrada: hayMiniatura,
        url: hayMiniatura ? g.miniatura : null,
        origen: g.miniaturaDelCodigo ? "codigo" : "deducida",
      },
    },
    { status: 201 },
  )
}
