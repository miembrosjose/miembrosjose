// API — las actividades del calendario.
//
//   GET  /api/admin/marketing/actividades?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
//   POST /api/admin/marketing/actividades
//   DELETE /api/admin/marketing/actividades   { ids: [...] }
//
// ── POR QUÉ SIEMPRE SE PIDE UN RANGO ───────────────────────────────────────
// Porque la pregunta de esta pantalla es siempre «qué hay entre estas dos
// fechas»: la semana, el mes. Traerlo todo funcionaría el primer año y luego
// sería cargar tres mil filas para dibujar siete días.
//
// El rango lo decide el navegador —la semana que está mirando— y el servidor
// solo lo acota para que un rango disparatado no se traiga la tabla entera.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { exigirMarketing, limpiarActividad } from "@/lib/marketing/servidor"

export const dynamic = "force-dynamic"

/** Lo más ancho que se puede pedir de una vez. Un año y medio. */
const MAX_DIAS = 550

const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/

/** Cuántas se pueden borrar de una tacada. Un mes entero no llega. */
const MAX_BORRADO = 400

/** Un identificador de Postgres y nada más. */
const ES_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest) {
  const g = await exigirMarketing()
  if ("respuesta" in g) return g.respuesta

  const p = req.nextUrl.searchParams
  const desde = p.get("desde") || ""
  const hasta = p.get("hasta") || ""

  if (!ES_FECHA.test(desde) || !ES_FECHA.test(hasta)) {
    return NextResponse.json({ error: "Hacen falta `desde` y `hasta`." }, { status: 400 })
  }

  const dias = (new Date(hasta).getTime() - new Date(desde).getTime()) / 86400000
  if (!Number.isFinite(dias) || dias < 0) {
    return NextResponse.json({ error: "Ese rango no tiene sentido." }, { status: 400 })
  }
  if (dias > MAX_DIAS) {
    return NextResponse.json({ error: "Ese rango es demasiado ancho." }, { status: 400 })
  }

  const { data, error } = await getSupabaseAdmin()
    .from("mkt_actividades")
    .select("*")
    .gte("fecha", desde)
    .lte("fecha", hasta)
    // Por fecha, y dentro del día las referencias al final: una luna llena no
    // es una tarea, así que no debe encabezar el día por delante de lo que sí
    // hay que hacer.
    .order("fecha", { ascending: true })
    .order("es_referencia", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[marketing] listar:", error.message)

    // ── EL HUECO ENTRE DESPLEGAR Y CORRER EL SQL ──────────────────────
    // El código sube con un empujón a `main`; la tabla la crea una persona a
    // mano en Supabase. Entre las dos cosas hay horas o días, y en ese hueco
    // esta pantalla diría "no se pudo leer el calendario" — que suena a
    // avería y manda a buscar donde no es.
    if (/mkt_actividades|does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json({
        error: "Falta crear la tabla. Corre docs/sql/marketing_01_actividades.sql "
          + "en Supabase y vuelve a entrar.",
      }, { status: 503 })
    }

    return NextResponse.json({ error: "No se pudo leer el calendario" }, { status: 500 })
  }

  // ── QUIÉN PUEDE SER RESPONSABLE ───────────────────────────────────────
  // Sale de `profiles`, no de la lista de cuentas: son dos filas y una
  // consulta de tabla normal. Pedirlo aparte habría sido otra ida y vuelta
  // para rellenar un desplegable de dos nombres.
  const { data: equipo } = await getSupabaseAdmin()
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_admin", true)

  return NextResponse.json({
    ok: true,
    actividades: data || [],
    equipo: (equipo || []).map((m) => ({
      id: (m as { id: string }).id,
      nombre: (m as { full_name: string | null; email: string | null }).full_name
        || (m as { email: string | null }).email
        || "Sin nombre",
    })),
    // La pantalla necesita saber si quien mira puede aprobar, y es más
    // barato decírselo aquí que en una segunda petición.
    esPropietario: g.esPropietario,
    yo: g.user.id,
  })
}

export async function POST(req: NextRequest) {
  const g = await exigirMarketing()
  if ("respuesta" in g) return g.respuesta

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const limpio = limpiarActividad(body, { parcial: false })
  if ("error" in limpio) return NextResponse.json({ error: limpio.error }, { status: 400 })

  const { data, error } = await getSupabaseAdmin()
    .from("mkt_actividades")
    .insert({ ...limpio.campos, created_by: g.user.id })
    .select("*")
    .single()

  if (error) {
    console.error("[marketing] crear:", error.message)
    return NextResponse.json({ error: "No se pudo crear la actividad" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, actividad: data })
}

/**
 * Borrar varias de una vez.
 *
 *   DELETE /api/admin/marketing/actividades   { ids: [...] }
 *
 * ── POR QUÉ UNA LISTA DE IDENTIFICADORES Y NO UN FILTRO ───────────────────
 * Sería más corto mandar «borra todo lo que haya entre estas dos fechas» y
 * dejar que el servidor resuelva. Y sería la forma de que un día un rango mal
 * calculado —un mes que empieza en el día 1 del año equivocado— se lleve por
 * delante medio calendario sin que nadie lo haya visto en pantalla.
 *
 * Con una lista explícita eso no puede pasar: solo se borra lo que el
 * navegador tenía delante y la persona marcó. Si la lista viene vacía, no se
 * borra nada, que es exactamente lo que debe ocurrir.
 */
export async function DELETE(req: NextRequest) {
  const g = await exigirMarketing()
  if ("respuesta" in g) return g.respuesta

  let body: { ids?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inv\u00e1lido" }, { status: 400 })
  }

  const ids = Array.isArray(body.ids)
    ? [...new Set(body.ids.filter((x): x is string => typeof x === "string" && ES_ID.test(x)))]
    : []

  // Sin nada que borrar no es un error: es que no hab\u00eda nada marcado.
  if (ids.length === 0) return NextResponse.json({ ok: true, borradas: 0 })

  // El tope existe por el mismo motivo que el del rango: una pantalla ense\u00f1a
  // como mucho un mes, y un mes no llega a esto ni de lejos.
  if (ids.length > MAX_BORRADO) {
    return NextResponse.json(
      { error: `No se pueden borrar m\u00e1s de ${MAX_BORRADO} de una vez.` },
      { status: 400 },
    )
  }

  const { data, error } = await getSupabaseAdmin()
    .from("mkt_actividades")
    .delete()
    .in("id", ids)
    .select("id")

  if (error) {
    console.error("[marketing] borrar en bloque:", error.message)
    return NextResponse.json({ error: "No se pudo borrar" }, { status: 500 })
  }

  // Se devuelve lo que de verdad se borr\u00f3, no lo que se pidi\u00f3: si alguien
  // borr\u00f3 una desde otra pesta\u00f1a, el n\u00famero sale m\u00e1s bajo y eso es correcto.
  return NextResponse.json({ ok: true, borradas: (data || []).length })
}
