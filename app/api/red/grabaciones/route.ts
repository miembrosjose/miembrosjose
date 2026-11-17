// GET /api/red/grabaciones?pagina=0&por=12
//
// El archivo de los Encuentros de la Red, para cualquiera con sesión.
//
// ── PAGINADO DESDE EL PRIMER DÍA ──────────────────────────────────────────
// La ruta de encuentros convocados pide `limit(50)` sin cursor: al número 51,
// los más antiguos dejan de aparecer y nadie se entera. Con una reunión al mes
// eso tarda cuatro años en notarse; con una a la semana, un año.
//
// Aquí se pagina desde el principio porque el archivo solo crece. Nunca se
// hace una consulta cuyo resultado dependa de que la lista siga siendo corta.
//
// ── SE USA EL CLIENTE DE SESIÓN, NO service_role ──────────────────────────
// Así la RLS tiene la última palabra: los borradores no salen de la base para
// quien no es administración, aunque esta ruta se equivocara al filtrar.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { leerVturb } from "@/lib/red/vturb"
import { faltaLaTabla } from "@/lib/red/grabaciones"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const POR_PAGINA_POR_DEFECTO = 12
const POR_PAGINA_MAXIMO = 48

type Fila = {
  id: number
  titulo: string
  descripcion: string
  fecha: string
  miniatura: string | null
  embed: string
  estado: string
}

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const sp = req.nextUrl.searchParams
  const pagina = Math.max(0, Number(sp.get("pagina")) || 0)
  const porCrudo = Number(sp.get("por")) || POR_PAGINA_POR_DEFECTO
  const por = Math.min(POR_PAGINA_MAXIMO, Math.max(1, porCrudo))

  const desde = pagina * por
  const hasta = desde + por - 1

  const { data, error, count } = await supabase
    .from("network_recordings")
    // `cuenta_id` y `player_id` no se piden: las direcciones se sacan de
    // `embed`, que es la única fuente. Traerlas además invitaría a armar la
    // dirección con ellas en algún sitio, y entonces habría dos.
    .select(
      "id, titulo, descripcion, fecha, miniatura, embed, estado",
      { count: "exact" },
    )
    // Las fijadas arriba; el resto, lo más reciente primero. `id` al final
    // deja el orden estable cuando dos grabaciones comparten fecha, que es lo
    // normal: una reunión da varias piezas el mismo día.
    .order("sort_order", { ascending: false })
    .order("fecha", { ascending: false })
    .order("id", { ascending: false })
    .range(desde, hasta)

  if (error) {
    // ── MIENTRAS EL SQL NO SE HAYA CORRIDO ────────────────────────────────
    // El despliegue y la migración son dos actos separados, y el orden entre
    // ellos no lo decide nadie: se corre el SQL cuando se puede entrar a
    // Supabase. Si el código llega primero, la pestaña entera daría un error
    // rojo a todo el mundo por una tabla que falta.
    //
    // Así se comporta como un archivo vacío, que es la verdad: todavía no hay
    // grabaciones. Y se avisa aparte —solo a administración— de que falta
    // correr el SQL, para que la espera no se confunda con un fallo.
    if (faltaLaTabla(error)) {
      return NextResponse.json({
        grabaciones: [], total: 0, pagina: 0, por, hayMas: false, sinTabla: true,
      })
    }
    console.error("[/api/red/grabaciones] GET", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const filas = (data || []) as Fila[]
  const total = count ?? filas.length

  return NextResponse.json({
    grabaciones: filas.map(aRespuesta),
    total,
    pagina,
    por,
    hayMas: desde + filas.length < total,
  })
}

/**
 * Lo que ve el navegador.
 *
 * El bloque de VTurb NO se manda: se mandan las direcciones ya armadas. El
 * navegador no tiene que interpretar HTML pegado por nadie, y solo puede
 * cargar un reproductor de converteai, porque es lo único que sale de aquí.
 *
 * ── POR QUÉ SE VUELVE A LEER EL CÓDIGO EN VEZ DE USAR LAS COLUMNAS ────────
 * Las columnas `cuenta_id` y `player_id` están ahí para poder buscar y para
 * verlas en el panel, pero armar las direcciones con ellas obligaba a escribir
 * la versión del reproductor a mano —«v4»— en este archivo. Dos sitios donde
 * vive el mismo dato es un sitio de más: el día que una grabación se guarde
 * con v5, esta ruta seguiría pidiendo la v4 y el vídeo no cargaría.
 *
 * `leerVturb` es la misma función que valida al guardar. Una sola.
 */
function aRespuesta(f: Fila) {
  const lectura = leerVturb(f.embed)
  const g = lectura.ok ? lectura.grabacion : null

  return {
    id: f.id,
    titulo: f.titulo,
    descripcion: f.descripcion,
    fecha: f.fecha,
    miniatura: f.miniatura,
    borrador: f.estado !== "publicado",
    iframe: g?.iframe ?? null,
    script: g?.script ?? null,
    // Solo el formato moderno trae este elemento; es lo que decide si el
    // reproductor se monta nativo (pantalla completa de verdad) o en iframe.
    elementoId: g?.elementoId ?? null,
  }
}
