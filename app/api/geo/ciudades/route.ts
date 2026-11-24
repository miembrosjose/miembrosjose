// ═══════════════════════════════════════════════════════════════════════════
//  BUSCAR UNA CIUDAD ENTRE LAS 237.393 DEL MUNDO
// ═══════════════════════════════════════════════════════════════════════════
//
//   GET /api/geo/ciudades?q=villa%20de%20leyva
//   GET /api/geo/ciudades?q=santiago&lugar=chile
//
// ── POR QUÉ ESTO EXISTE SI YA HABÍA BUSCADOR ──────────────────────────────
// El buscador del navegador trabaja sobre 7.329 ciudades que viajan dentro de
// la aplicación. Para la Cartografía bastaba. Para una carta astral no: el
// Ascendente depende del sitio exacto, y la salida «usa la ciudad grande más
// cercana» es pedirle a alguien que aproxime justo donde esto presume de
// precisar.
//
// Las 237.393 no caben en un navegador —serían varios megas en cada visita—,
// así que viven en la base y se preguntan por aquí.
//
// ── LO QUE VIAJA Y LO QUE NO ──────────────────────────────────────────────
// Viaja el NOMBRE QUE SE ESTÁ ESCRIBIENDO. Nada más.
//
// La fecha y la hora de nacimiento NO pasan por aquí: se quedan en el
// navegador y el cálculo entero ocurre allí. Esa parte de la promesa sigue
// entera, y el aviso del formulario lo dice con estas palabras en vez de con
// el «nada sale de este dispositivo» de antes, que habría dejado de ser cierto.
//
// ── POR QUÉ PIDE SESIÓN ───────────────────────────────────────────────────
// Los datos son públicos —GeoNames, CC BY— así que no hay secreto que
// guardar. Pero una dirección abierta que devuelve callejero mundial es una
// API gratis para cualquiera, y la factura de esa fiesta la paga esta cuenta.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/** Igual que `normalizar()` del cliente. Si cambia uno, cambia el otro. */
function normalizar(texto: string): string {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.'´`’]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Escapa lo que en LIKE significa otra cosa.
 *
 * Sin esto, escribir «%» devolvería la tabla entera y «_» casaría con
 * cualquier letra. No es un agujero de seguridad —el cliente de Supabase
 * parametriza— pero sí una forma de pedirle a la base un trabajo enorme
 * escribiendo un carácter.
 */
function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, (c) => "\\" + c)
}

type Fila = {
  nombre: string
  provincia: string | null
  pais: string
  pais_codigo: string
  lat: number
  lon: number
  zona: string
  poblacion: number
}

const CUANTAS = 8

export async function GET(req: Request) {
  const url = new URL(req.url)
  const consulta = normalizar(url.searchParams.get("q") ?? "")
  const lugar = normalizar(url.searchParams.get("lugar") ?? "")

  // Dos letras, igual que la búsqueda local: menos devuelve media tabla.
  if (consulta.length < 2) {
    return NextResponse.json({ ciudades: [] })
  }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Usuario no identificado" }, { status: 401 })
  }

  const patron = escaparLike(consulta)

  // ── DOS PASADAS, Y EN ESTE ORDEN ────────────────────────────────────────
  // Primero por PRINCIPIO de nombre, que es lo que casi siempre se busca y
  // además usa el índice de prefijo. Solo si eso no llena la lista se busca
  // por el medio, que es más caro y trae más ruido: «ana» encontraría
  // «Santana», «Guanacaste» y medio mundo.
  let filas: Fila[] = []

  const porPrincipio = supabase
    .from("geo_ciudades")
    .select("nombre, provincia, pais, pais_codigo, lat, lon, zona, poblacion")
    .like("nombre_norm", `${patron}%`)
    .order("poblacion", { ascending: false })
    .limit(CUANTAS)

  const { data: d1, error: e1 } = lugar
    ? await porPrincipio.or(`pais.ilike.%${lugar}%,provincia.ilike.%${lugar}%`)
    : await porPrincipio

  if (e1) {
    // Que falte la tabla no es un error del que informar a quien escribe: la
    // búsqueda local sigue funcionando y lo único que pierde es alcance.
    console.error("[geo] búsqueda por prefijo:", e1.message)
    return NextResponse.json({ ciudades: [], sinTabla: true })
  }

  filas = (d1 ?? []) as Fila[]

  if (filas.length < CUANTAS && consulta.length >= 3) {
    const vistos = new Set(filas.map((f) => `${f.nombre}|${f.pais_codigo}|${f.lat}`))
    const porDentro = supabase
      .from("geo_ciudades")
      .select("nombre, provincia, pais, pais_codigo, lat, lon, zona, poblacion")
      .like("nombre_norm", `%${patron}%`)
      .order("poblacion", { ascending: false })
      .limit(CUANTAS * 2)

    const { data: d2 } = lugar
      ? await porDentro.or(`pais.ilike.%${lugar}%,provincia.ilike.%${lugar}%`)
      : await porDentro

    for (const f of (d2 ?? []) as Fila[]) {
      const clave = `${f.nombre}|${f.pais_codigo}|${f.lat}`
      if (vistos.has(clave)) continue
      vistos.add(clave)
      filas.push(f)
      if (filas.length >= CUANTAS) break
    }
  }

  return NextResponse.json({
    ciudades: filas.map((f) => ({
      nombre: `${f.nombre}, ${f.pais}`,
      provincia: f.provincia && f.provincia !== f.nombre ? f.provincia : "",
      lat: f.lat,
      lon: f.lon,
      zona: f.zona,
    })),
  })
}
