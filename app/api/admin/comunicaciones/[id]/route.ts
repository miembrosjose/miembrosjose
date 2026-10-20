// API — una comunicación: leerla, editarla, borrarla.
//
//   GET    /api/admin/comunicaciones/<id>
//   PATCH  /api/admin/comunicaciones/<id>   { campos editables }
//   DELETE /api/admin/comunicaciones/<id>
//
// ── LO QUE YA SALIÓ NO SE EDITA ────────────────────────────────────────────
// Cambiar el texto de una comunicación enviada no cambia nada en las bandejas
// de entrada donde está: solo hace que el registro deje de coincidir con lo
// que la gente leyó. Y editar una programada por detrás sería peor todavía,
// porque el proveedor ya tiene su copia y seguiría enviando la vieja.
//
// Se puede editar un borrador, y una que falló. Nada más. La comprobación está
// en el servidor, no en el botón.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import {
  exigirAdmin, leerComunicacion, registrarEvento, soloEditable,
} from "@/lib/comunicaciones/servidor"
import { esEditable, esTipoValido, TIPOS, type TipoComunicacion } from "@/lib/comunicaciones/tipos"
import { validarComunicacion } from "@/lib/comunicaciones/validacion"
import { isNetworkRole } from "@/lib/red/roles"
import { ACHIEVEMENTS } from "@/lib/achievements"

export const dynamic = "force-dynamic"

/** ¿El título sigue siendo el que puso la máquina al crearla? */
function esTituloAutomatico(titulo: string, tipo: string): boolean {
  const t = (titulo || "").trim()
  if (!t) return true
  if (t === `${TIPOS[tipo as TipoComunicacion]?.nombre} · sin título`) return true
  // También lo son los que esta misma función generó antes, para que corregir
  // el asunto vuelva a actualizarlo en vez de quedarse con el asunto viejo.
  return t.startsWith(`${TIPOS[tipo as TipoComunicacion]?.nombre} · `) && / · \d{1,2} \w{3}$/.test(t)
}

/** «Sesión en vivo · Cierre de Libra · 24 sep» */
function tituloSugerido(tipo: string, asunto: string): string {
  const nombre = TIPOS[tipo as TipoComunicacion]?.nombre ?? "Comunicación"
  const corto = asunto.length > 48 ? asunto.slice(0, 45).trimEnd() + "…" : asunto
  const fecha = new Intl.DateTimeFormat("es-419", { day: "numeric", month: "short" }).format(new Date())
  return `${nombre} · ${corto} · ${fecha}`
}

/**
 * La audiencia, comprobada aquí y no solo en la pantalla.
 *
 * Una audiencia llega del navegador, y del navegador puede llegar cualquier
 * cosa. Un rol inventado no ampliaría el envío —nadie lo tiene, así que la
 * audiencia saldría vacía— pero una temporada disparatada sí dejaría una
 * comunicación imposible de enviar sin decir por qué.
 */
function revisarAudiencia(v: unknown): string | null {
  const a = v as {
    kind?: string
    temporadaMin?: unknown
    temporadaCompletada?: unknown
    empezoSinTerminar?: unknown
    roles?: unknown
    insignias?: unknown
    inactivoDias?: unknown
    activoDias?: unknown
    paises?: unknown
    ciudades?: unknown
    personas?: unknown
  } | null
  if (!a || a.kind !== "todos") return "Esa audiencia no está disponible"

  const temporada = (x: unknown): boolean => {
    const n = Number(x)
    return Number.isInteger(n) && n >= 1 && n <= 4
  }

  if (a.temporadaMin != null && !temporada(a.temporadaMin)) return "Esa temporada no existe"
  if (a.temporadaCompletada != null && !temporada(a.temporadaCompletada)) return "Esa temporada no existe"
  if (a.empezoSinTerminar != null && !temporada(a.empezoSinTerminar)) return "Esa temporada no existe"

  // ── POR QUÉ SE ACOTAN LOS DÍAS ────────────────────────────────────────────
  // Un cero sería «sin aparecer desde hace cero días», que es todo el mundo:
  // una campaña de reactivación mandada a La Red entera. Y un número
  // disparatado deja una audiencia vacía sin decir por qué.
  const dias = (x: unknown): boolean => {
    const n = Number(x)
    return Number.isInteger(n) && n >= 1 && n <= 3650
  }
  if (a.inactivoDias != null && !dias(a.inactivoDias)) {
    return "Los días de inactividad tienen que ser un número entre 1 y 3650"
  }
  if (a.activoDias != null && !dias(a.activoDias)) {
    return "Los días de actividad tienen que ser un número entre 1 y 3650"
  }
  // Pedir las dos cosas a la vez es pedir a quien no apareció en treinta días
  // y sí apareció en siete. Siempre da cero, y el cero no explica nada.
  if (a.inactivoDias != null && a.activoDias != null) {
    return "No se puede filtrar por inactividad y por actividad a la vez: no hay nadie que cumpla las dos"
  }

  if (a.roles != null) {
    if (!Array.isArray(a.roles)) return "Los roles tienen que ser una lista"
    const malos = a.roles.filter((r) => !isNetworkRole(r))
    if (malos.length > 0) return "Hay un rol que no existe"
  }

  if (a.insignias != null) {
    if (!Array.isArray(a.insignias)) return "Las insignias tienen que ser una lista"
    const conocidas = new Set(ACHIEVEMENTS.map((x) => x.id))
    if (a.insignias.some((i) => typeof i !== "string" || !conocidas.has(i))) {
      return "Hay una insignia que no existe"
    }
  }

  if (a.paises != null) {
    if (!Array.isArray(a.paises)) return "Los países tienen que ser una lista"
    // Solo la forma: dos letras. Que ese país tenga miembros o no lo dice el
    // ensayo de audiencia, que es donde hay que mirarlo.
    if (a.paises.some((c) => typeof c !== "string" || !/^[A-Za-z]{2}$/.test(c))) {
      return "Hay un país que no es un código de dos letras"
    }
  }

  if (a.ciudades != null) {
    if (!Array.isArray(a.ciudades)) return "Las ciudades tienen que ser una lista"
    if (a.ciudades.some((n) => !Number.isInteger(Number(n)) || Number(n) <= 0)) {
      return "Hay una ciudad que no es válida"
    }
  }

  // ── LAS PERSONAS SE COMPRUEBAN DE VERDAD ──────────────────────────────────
  // Un identificador inventado aquí no ampliaría nada —no existe, así que no
  // recibiría nada— pero dejaría una audiencia que dice «3 personas elegidas»
  // y le llega a dos, sin explicar a quién falta. Se comprueba que existan.
  if (a.personas != null) {
    if (!Array.isArray(a.personas)) return "Las personas tienen que ser una lista"
    if (a.personas.length === 0) return null
    if (a.personas.length > MAX_PERSONAS) {
      return `Como mucho ${MAX_PERSONAS} personas elegidas una por una. Para más, usa los filtros.`
    }
    if (a.personas.some((p) => typeof p !== "string" || !/^[0-9a-f-]{36}$/i.test(p))) {
      return "Hay un identificador de persona que no es válido"
    }
  }

  return null
}

/**
 * Cuántas personas se pueden nombrar una por una.
 *
 * No es un límite técnico: es que una lista de doscientos nombres elegidos a
 * mano no es una lista, es un filtro mal hecho. Para eso están los demás.
 */
const MAX_PERSONAS = 50

/** Que las personas elegidas existan de verdad. */
async function personasQueExisten(ids: string[]): Promise<string | null> {
  if (ids.length === 0) return null
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("id")
    .in("id", ids)
  if (error) return "No se pudo comprobar la lista de personas"
  const halladas = new Set((data || []).map((f) => (f as { id: string }).id))
  const faltan = ids.filter((i) => !halladas.has(i))
  if (faltan.length > 0) {
    return faltan.length === 1
      ? "Una de las personas elegidas ya no existe"
      : `${faltan.length} de las personas elegidas ya no existen`
  }
  return null
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const { id } = await ctx.params
  const c = await leerComunicacion(id)
  if (!c) return NextResponse.json({ error: "No existe" }, { status: 404 })

  // La validación viaja con la comunicación: el panel enseña los avisos sin
  // tener que pedirlos aparte, y siempre coinciden con los que aplicará el
  // envío porque salen de la misma función.
  return NextResponse.json({ ok: true, comunicacion: c, veredicto: validarComunicacion(c) })
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const { id } = await ctx.params
  const actual = await leerComunicacion(id)
  if (!actual) return NextResponse.json({ error: "No existe" }, { status: 404 })

  if (!esEditable(actual.status)) {
    return NextResponse.json(
      { error: "Esta comunicación ya no se puede editar. Duplícala si quieres partir de ella." },
      { status: 409 },
    )
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const cambios = soloEditable(body)

  // ── EL TÍTULO INTERNO SE ESCRIBE SOLO MIENTRAS NADIE LO TOQUE ───────────
  // Nace como «Sesión en vivo · sin título» y, si nadie lo cambia, así se
  // queda. Con seis borradores abiertos la lista pasa a ser seis líneas
  // idénticas y no hay forma de saber cuál es cuál sin abrirlas.
  //
  // En cuanto hay asunto, el título se compone con él. Solo mientras siga
  // siendo el automático: en el momento en que se escribe uno a mano, deja de
  // tocarse para siempre. Sobrescribir lo que alguien eligió es peor que
  // dejarlo feo.
  const asuntoNuevo = typeof cambios.subject === "string" ? cambios.subject.trim() : null
  if (asuntoNuevo && esTituloAutomatico(actual.internal_title, actual.type) && !("internal_title" in cambios)) {
    cambios.internal_title = tituloSugerido(actual.type, asuntoNuevo)
  }

  if ("type" in cambios && !esTipoValido(cambios.type)) {
    return NextResponse.json({ error: "Tipo de comunicación desconocido" }, { status: 400 })
  }
  if ("audience" in cambios) {
    const problema = revisarAudiencia(cambios.audience)
    if (problema) return NextResponse.json({ error: problema }, { status: 400 })

    // Esta comprobación va aparte porque pregunta a la base, y lo de arriba
    // no pregunta nada. Solo se hace si hay una lista: en el caso normal
    // —audiencia por filtros— no cuesta ni una consulta.
    const nombradas = (cambios.audience as { personas?: unknown } | null)?.personas
    if (Array.isArray(nombradas) && nombradas.length > 0) {
      const falta = await personasQueExisten(nombradas as string[])
      if (falta) return NextResponse.json({ error: falta }, { status: 400 })
    }
  }

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: "Nada que cambiar" }, { status: 400 })
  }

  // Un intento de enviar que falló deja la comunicación en `failed`. Al volver
  // a tocarla, vuelve a ser un borrador: si no, se quedaría marcada como
  // fallida para siempre aunque el problema estuviera resuelto.
  //
  // La llave de envío se suelta aquí y SOLO aquí. Mientras la comunicación
  // está fallida la conserva, para que el mismo doble clic que la hizo fallar
  // no la reintente solo; corregir algo es lo que declara que hay un intento
  // nuevo, y entonces la llave vieja deja de valer.
  if (actual.status === "failed") {
    cambios.status = "draft"
    cambios.provider_error = null
    cambios.send_idempotency_key = null
  }

  const { data, error } = await getSupabaseAdmin()
    .from("communications")
    .update(cambios)
    .eq("id", id)
    .select("*")
    .single()

  if (error || !data) {
    console.error("[comunicaciones] actualizar:", error?.message)
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 })
  }

  // La auditoría guarda QUÉ campos se tocaron, no su contenido: el contenido
  // ya está en la fila, y copiarlo en cada guardado haría crecer el historial
  // con el cuerpo entero del correo cada vez que se corrige una coma.
  await registrarEvento(id, g.user.id, "updated", { campos: Object.keys(cambios) })

  return NextResponse.json({ ok: true, comunicacion: data, veredicto: validarComunicacion(data) })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const { id } = await ctx.params
  const actual = await leerComunicacion(id)
  if (!actual) return NextResponse.json({ error: "No existe" }, { status: 404 })

  // Solo se borra lo que nunca salió. Lo enviado es historial: borrarlo dejaría
  // la plataforma sin memoria de un correo que sí recibió mucha gente.
  if (actual.status !== "draft" && actual.status !== "failed") {
    return NextResponse.json(
      { error: "Solo se pueden borrar borradores. Lo enviado queda como historial." },
      { status: 409 },
    )
  }

  const { error } = await getSupabaseAdmin().from("communications").delete().eq("id", id)
  if (error) {
    console.error("[comunicaciones] borrar:", error.message)
    return NextResponse.json({ error: "No se pudo borrar" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
