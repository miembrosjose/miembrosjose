// GET  /api/red/ciudades               → todos los países, con cuántas ciudades tiene cada uno
// GET  /api/red/ciudades?pais=EC       → ciudades de ese país que ya están en el catálogo
// GET  /api/red/ciudades?pais=EC&q=cue → busca en el catálogo y, si hace falta, en OpenStreetMap
// POST /api/red/ciudades               → mete en el catálogo una ciudad encontrada en OpenStreetMap
//
// ── QUÉ ESTABA MAL (26-11-2026) ────────────────────────────────────────────
// El catálogo eran 235 ciudades en 46 países, sembradas a mano una vez. Y la
// lista de países no salía de los países que existen, sino de los que TENÍAN
// ciudades sembradas. Las dos cosas juntas dejaban fuera a cualquiera que no
// viviera donde alguien se acordó de sembrar: no podía decir de dónde era ni
// en el alta ni en su perfil.
//
// No era una decisión de producto. La idea original —que no se pueda elegir
// un país y luego quedarse sin ciudades— era buena; el problema es que la
// respuesta fue recortar la lista en vez de llenar el catálogo.
//
// ── CÓMO SE ARREGLA SIN SEMBRAR NADA ───────────────────────────────────────
// El catálogo deja de ser una lista cerrada y pasa a llenarse solo. La
// búsqueda mira primero en `network_cities` —rápido, nuestro— y, si ahí no
// hay casi nada, pregunta a OpenStreetMap. Cuando alguien elige una de las de
// fuera, esa ciudad SE GUARDA en el catálogo y a partir de entonces ya es
// nuestra: la segunda persona de ese pueblo la encuentra sin salir de aquí.
//
// Así se conserva lo que importaba del diseño original —datos normalizados,
// nada de texto libre, «CDMX» y «Ciudad de México» no pueden ser dos filas—
// sin que la normalización signifique dejar gente fuera.
//
// ── POR QUÉ EL ALTA NO SE FÍA DEL NAVEGADOR ────────────────────────────────
// `network_cities` es una tabla COMPARTIDA: lo que una persona cree ahí lo
// ven todas. Si el alta aceptara el nombre que manda el navegador, cualquiera
// con la consola abierta podría llenar el catálogo de basura.
//
// Por eso el navegador solo manda el IDENTIFICADOR de OpenStreetMap, y es el
// servidor quien vuelve a pedir esa ficha y saca de ahí el nombre, la región
// y las coordenadas. Se puede crear cualquier ciudad que exista de verdad, y
// nada más.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { PAIS_NOMBRE, nombrePais, banderaPais, normalizar } from "@/lib/red/paises"
// La lectura de las fichas vive aparte y sin dependencias, porque es la
// frontera de lo que puede entrar en un catálogo compartido. Probada en
// scripts/probar-osm.mjs.
import {
  type FichaOSM, inicialDeTipo, esIdentificadorValido, esUnSitioHabitado,
  regionDe, nombreDe, etiquetaDe, leerFicha,
} from "@/lib/red/osm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_RESULTS = 40

/**
 * A partir de cuántos resultados propios NO se pregunta fuera.
 *
 * OpenStreetMap pide no abusar de su servicio, así que cada consulta que se
 * le ahorra cuenta. Cinco es suficiente para que alguien de una ciudad grande
 * no provoque nunca una llamada: quien escribe «Mad» en España ya tiene lo
 * que buscaba. Y quien escribe el nombre de su pueblo no tiene ninguno, que
 * es justo el caso por el que esto existe.
 */
const SUFICIENTES = 5

/** Lo que OpenStreetMap pide que mande quien usa su servicio. */
const AGENTE = "Los144000/1.0 (miembros)"

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const pais = (req.nextUrl.searchParams.get("pais") || "").toUpperCase().trim()
  const q = (req.nextUrl.searchParams.get("q") || "").trim()

  // ── Sin país: TODOS los países ──────────────────────────────────────────
  // Antes solo salían los que tenían ciudades sembradas. Ahora salen todos, y
  // cada uno viene con cuántos MIEMBROS hay allí, que es lo que el selector
  // usa para poner delante los sitios donde ya hay gente sin esconder el resto.
  //
  // ── POR QUÉ MIEMBROS Y NO CIUDADES DEL CATÁLOGO ─────────────────────────
  // Porque esto empezó contando ciudades y el grupo se llamaba «Donde ya hay
  // miembros»: salían 46 países —todos los que alguien sembró alguna vez—
  // mientras el mapa decía 14. La etiqueta prometía una cosa y los datos eran
  // otra, y eso es peor que no agrupar: hace dudar de las dos pantallas.
  //
  // El criterio es EL MISMO que el del mapa —quien activó «mostrar mi
  // ciudad»— para que los dos sitios cuenten lo mismo. Si alguien eligió país
  // pero no quiere aparecer, su país no sale aquí: igual que no sale allí.
  if (!pais) {
    const [catalogo, ubicaciones] = await Promise.all([
      supabase.from("network_cities").select("country_code").eq("is_active", true),
      supabase
        .from("member_location")
        .select("country_code")
        .eq("show_city", true)
        .not("city_id", "is", null),
    ])

    if (catalogo.error) {
      console.error("[/api/red/ciudades] paises", catalogo.error.message)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    const ciudadesPorPais = new Map<string, number>()
    for (const row of catalogo.data || []) {
      const c = (row as { country_code: string }).country_code
      ciudadesPorPais.set(c, (ciudadesPorPais.get(c) || 0) + 1)
    }

    // Un fallo aquí no puede dejar sin países al formulario: se pierde el
    // agrupado —todos caen en «todos los países»— y se puede seguir.
    const miembrosPorPais = new Map<string, number>()
    if (!ubicaciones.error) {
      for (const row of ubicaciones.data || []) {
        const c = (row as { country_code: string }).country_code
        if (c) miembrosPorPais.set(c, (miembrosPorPais.get(c) || 0) + 1)
      }
    } else {
      console.error("[/api/red/ciudades] miembros", ubicaciones.error.message)
    }

    const paises = Object.keys(PAIS_NOMBRE)
      .map((code) => ({
        code,
        name: PAIS_NOMBRE[code],
        flag: banderaPais(code),
        cities: ciudadesPorPais.get(code) || 0,
        members: miembrosPorPais.get(code) || 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "es-419"))

    return NextResponse.json({ paises })
  }

  if (!/^[A-Z]{2}$/.test(pais)) {
    return NextResponse.json({ error: "País inválido" }, { status: 400 })
  }

  // ── Las que ya tenemos ──────────────────────────────────────────────────
  let query = supabase
    .from("network_cities")
    .select("id, name, admin1, lat, lon")
    .eq("country_code", pais)
    .eq("is_active", true)

  if (q) {
    // name_norm ya está sin tildes y en minúsculas; normalizamos la consulta
    // igual para que «Cuenca», «cuenca» y «cuencá» encuentren lo mismo.
    query = query.ilike("name_norm", `%${normalizar(q)}%`)
  }

  const { data, error } = await query.order("name").limit(MAX_RESULTS)

  if (error) {
    console.error("[/api/red/ciudades] ciudades", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const propias = (data || []).map((c) => {
    const row = c as { id: number; name: string; admin1: string | null }
    return {
      id: row.id as number | null,
      name: row.name,
      admin1: row.admin1,
      label: etiquetaDe(row.name, row.admin1),
      osm: null as string | null,
    }
  })

  // ── Y si no hay casi nada, se pregunta fuera ────────────────────────────
  // Solo con tres letras o más: con una o dos, OpenStreetMap devolvería medio
  // país y además sería una llamada por tecla.
  let deFuera: typeof propias = []
  if (q.length >= 3 && propias.length < SUFICIENTES) {
    deFuera = await buscarEnOpenStreetMap(q, pais, propias)
  }

  return NextResponse.json({
    pais: { code: pais, name: nombrePais(pais), flag: banderaPais(pais) },
    ciudades: [...propias, ...deFuera],
  })
}

/**
 * Buscar ciudades en OpenStreetMap, dentro de un país.
 *
 * Nunca rompe la respuesta: si el servicio tarda, falla o cambia, se devuelve
 * una lista vacía y la persona se queda con las ciudades del catálogo. Que un
 * servicio ajeno esté caído no puede dejar a nadie sin poder guardar su país.
 */
async function buscarEnOpenStreetMap(
  q: string,
  pais: string,
  yaTenemos: Array<{ name: string; admin1: string | null }>,
): Promise<Array<{ id: number | null; name: string; admin1: string | null; label: string; osm: string | null }>> {
  // `featuretype=settlement` deja fuera calles, ríos y comercios: solo sitios
  // donde vive gente. Sin esto, buscar «San» en México devuelve avenidas.
  const url =
    "https://nominatim.openstreetmap.org/search" +
    `?q=${encodeURIComponent(q)}` +
    `&countrycodes=${pais.toLowerCase()}` +
    "&featuretype=settlement&format=jsonv2&addressdetails=1&accept-language=es&limit=8"

  let fichas: FichaOSM[] = []
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": AGENTE, Accept: "application/json" },
      // Un día de caché: las ciudades no se mueven, y así escribir lo mismo
      // dos veces no son dos llamadas al servicio de otros.
      next: { revalidate: 86400 },
    })
    if (!r.ok) return []
    fichas = (await r.json()) as FichaOSM[]
  } catch {
    return []
  }

  // Lo que ya está en el catálogo no se repite: saldría dos veces en la lista
  // y la de fuera crearía una fila duplicada al elegirla.
  const conocidas = new Set(
    yaTenemos.map((c) => `${normalizar(c.name)}|${normalizar(c.admin1 || "")}`),
  )
  const vistas = new Set<string>()
  const salida = []

  for (const f of fichas || []) {
    if (!esUnSitioHabitado(f)) continue
    const inicial = inicialDeTipo(f.osm_type)
    if (!inicial || !f.osm_id) continue

    const name = nombreDe(f)
    if (!name) continue
    const admin1 = regionDe(f)

    const clave = `${normalizar(name)}|${normalizar(admin1 || "")}`
    if (conocidas.has(clave) || vistas.has(clave)) continue
    vistas.add(clave)

    salida.push({
      id: null,
      name,
      admin1,
      label: etiquetaDe(name, admin1),
      osm: `${inicial}${f.osm_id}`,
    })
  }

  return salida
}

/**
 * POST — meter en el catálogo una ciudad que vino de OpenStreetMap.
 *
 * Body: { pais: "MX", osm: "R123456" }
 *
 * Devuelve la fila del catálogo, recién creada o la que ya estaba. Es
 * idempotente a propósito: dos personas del mismo pueblo eligiendo a la vez
 * tienen que acabar con la MISMA ciudad, no con dos filas iguales. De eso se
 * encarga la restricción `unique (country_code, name, admin1)` que la tabla ya
 * tenía; aquí solo hay que leerla de vuelta cuando salta.
 */
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { pais?: unknown; osm?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const pais = typeof body.pais === "string" ? body.pais.toUpperCase().trim() : ""
  const osm = typeof body.osm === "string" ? body.osm.trim().toUpperCase() : ""
  if (!/^[A-Z]{2}$/.test(pais) || !PAIS_NOMBRE[pais]) {
    return NextResponse.json({ error: "País inválido" }, { status: 400 })
  }
  if (!esIdentificadorValido(osm)) {
    return NextResponse.json({ error: "Identificador inválido" }, { status: 400 })
  }

  // ── La ficha se pide al servicio, no se acepta del navegador ────────────
  // Esto es lo que impide que nadie invente una ciudad: el nombre, la región
  // y las coordenadas salen de aquí.
  let ficha: FichaOSM | null = null
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/lookup?osm_ids=${encodeURIComponent(osm)}` +
        "&format=jsonv2&addressdetails=1&accept-language=es",
      {
        headers: { "User-Agent": AGENTE, Accept: "application/json" },
        next: { revalidate: 86400 },
      },
    )
    if (r.ok) {
      const fichas = (await r.json()) as FichaOSM[]
      ficha = fichas?.[0] || null
    }
  } catch {
    ficha = null
  }

  if (!ficha) {
    return NextResponse.json(
      { error: "No se pudo comprobar esa ciudad. Inténtalo de nuevo en un momento." },
      { status: 502 },
    )
  }

  // ── Todo lo que hay que comprobar, en un solo sitio ────────────────────
  // Que sea un sitio habitado y no un río, que esté en el país que dice el
  // formulario —guardar Cuenca de Ecuador declarando España rompería los
  // recuentos—, que tenga nombre y que tenga coordenadas de este planeta.
  const leida = leerFicha(ficha, pais)
  if (!leida) {
    return NextResponse.json(
      { error: "Esa ciudad no se pudo comprobar en el país elegido" },
      { status: 400 },
    )
  }
  const { name, admin1, lat, lon } = leida

  // ── Se escribe con el rol de servicio, y es a propósito ─────────────────
  // `network_cities` es un catálogo compartido y los miembros no tienen —ni
  // deben tener— permiso para escribir en él. Lo que se guarda aquí no es lo
  // que mandó nadie: es lo que acaba de contestar OpenStreetMap.
  const admin = getSupabaseAdmin()

  /**
   * Buscar la fila que ya existe, con cuidado con el nulo.
   *
   * ── POR QUÉ NO VALE UN `.eq("admin1", null)` ──────────────────────────
   * Porque en SQL nada es igual a NULL, ni siquiera NULL. Un `.eq` con nulo
   * no encuentra las filas sin región, así que para una ciudad sin provincia
   * —que las hay— esto diría siempre «no existe».
   *
   * Y eso no acaba en un duplicado inofensivo: la restricción de unicidad de
   * la tabla también trata los nulos como distintos, así que el alta pasaría
   * y acabaríamos con dos filas del mismo pueblo, cada una con sus miembros.
   * Por eso para el nulo hay que preguntar `is null`.
   */
  const buscarLaQueHaya = () => {
    const base = admin
      .from("network_cities")
      .select("id, name, admin1")
      .eq("country_code", pais)
      .eq("name", name)
    return (admin1 === null ? base.is("admin1", null) : base.eq("admin1", admin1)).maybeSingle()
  }

  const yaEsta = await buscarLaQueHaya()
  if (yaEsta.data) return NextResponse.json({ ciudad: comoSeDevuelve(yaEsta.data as FilaCiudad) })

  const creada = await admin
    .from("network_cities")
    .insert({ country_code: pais, name, admin1, lat, lon, is_active: true })
    .select("id, name, admin1")
    .maybeSingle()

  if (creada.error) {
    // 23505: otra persona la creó entre la comprobación y el alta. No es un
    // error para quien está rellenando el formulario: la ciudad existe, que
    // es lo que pedía. Se lee la que ganó.
    if (creada.error.code === "23505") {
      const otra = await buscarLaQueHaya()
      if (otra.data) return NextResponse.json({ ciudad: comoSeDevuelve(otra.data as FilaCiudad) })
    }
    console.error("[/api/red/ciudades] alta code=%s", creada.error.code || "db_error")
    return NextResponse.json({ error: "No se pudo guardar esa ciudad" }, { status: 500 })
  }

  if (!creada.data) return NextResponse.json({ error: "No se pudo guardar esa ciudad" }, { status: 500 })
  return NextResponse.json({ ciudad: comoSeDevuelve(creada.data as FilaCiudad) })
}

type FilaCiudad = { id: number; name: string; admin1: string | null }

function comoSeDevuelve(c: FilaCiudad) {
  return { id: c.id, name: c.name, admin1: c.admin1, label: etiquetaDe(c.name, c.admin1), osm: null }
}
