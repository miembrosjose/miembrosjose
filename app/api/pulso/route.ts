// API — Pulso 144, el ritual semanal.
//
//   GET  /api/pulso   la pregunta activa, sus respuestas y la tuya
//   POST /api/pulso   publica o edita tu respuesta
//   DELETE /api/pulso borra la tuya
//
// Los corazones de cada respuesta se ponen y se quitan en /api/pulso/corazon.
//
// Usa la sesión del usuario, no service_role: las policies de RLS son las que
// garantizan que nadie edite la respuesta de otro, no el acierto de este
// archivo.
//
// DISEÑO PARA EMPEZAR VACÍO: cuando no hay respuestas, esto devuelve una lista
// vacía y `total: 0`. La interfaz NO pinta un contador a cero —eso diría que
// el sitio está muerto—, pinta una invitación. Ver PulsoSemana.tsx.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

const MAX_CUERPO = 2000

/**
 * Un correo no es un nombre.
 *
 * Algunas filas de `profiles` guardan el correo en `full_name` porque así se
 * creó la cuenta. Enseñarlo en el Pulso publicaba la dirección de esa persona
 * a toda la Red, que es peor que no saber cómo se llama.
 */
function pareceCorreo(v: string | null | undefined): boolean {
  return typeof v === "string" && /S+@S+.S+/.test(v)
}

type FilaPulso = {
  id: string
  numero: number
  pregunta: string
  invitacion: string
  practica_titulo: string | null
  practica_url: string | null
  practica_duracion: string | null
  inicia_en: string
  dias: number
}

/**
 * Días que quedan, contando por fecha y no por milisegundos.
 *
 * Restar timestamps daría resultados distintos según la hora a la que alguien
 * abra la página, y "quedan 3 días" no debería cambiar a las 00:01.
 */
function diasRestantes(iniciaEn: string, dias: number): number {
  const [a, m, d] = iniciaEn.split("-").map((x) => parseInt(x, 10))
  const inicio = Date.UTC(a, m - 1, d)
  const hoy = new Date()
  const hoyUTC = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate())
  const transcurridos = Math.floor((hoyUTC - inicio) / 86_400_000)
  return Math.max(0, dias - transcurridos)
}

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  // El pulso activo: el más reciente que ya empezó. Así se pueden dejar varios
  // preparados y rotan solos, sin que nadie tenga que publicar cada lunes.
  const hoy = new Date().toISOString().slice(0, 10)
  const { data: pulso, error } = await supabase
    .from("pulso_semanal")
    .select("id, numero, pregunta, invitacion, practica_titulo, practica_url, practica_duracion, inicia_en, dias")
    .lte("inicia_en", hoy)
    .order("inicia_en", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: "No se pudo leer el pulso" }, { status: 500 })
  }
  if (!pulso) {
    // Todavía no hay ninguno publicado. No es un error.
    return NextResponse.json({ pulso: null })
  }

  const p = pulso as FilaPulso

  const { data: respuestas } = await supabase
    .from("pulso_respuestas")
    .select("id, user_id, cuerpo, creado_en")
    .eq("pulso_id", p.id)
    .order("creado_en", { ascending: false })
    .limit(50)

  const lista = respuestas ?? []

  // ── Quién escribió cada respuesta ────────────────────────────────────────
  //
  // La fuente del nombre y la foto es `auth.users.user_metadata`, que es lo
  // que rellena el alta y lo que actualiza «Editar perfil». Es la misma que
  // usan /api/members y el directorio de La Red, así que una persona se llama
  // igual en toda la plataforma.
  //
  // `profiles` queda como respaldo, no como primera opción: ahí el nombre
  // puede haberse quedado con el correo de cuando se creó la cuenta, y en
  // pantalla salía "fulano@correo.com" en vez del nombre, con la inicial del
  // correo por avatar.
  //
  // Todo con service_role a propósito: la policy de `profiles` limita la
  // lectura a la fila propia, así que el cliente de sesión solo veía el perfil
  // de quien mira y los demás salían como "Miembro".
  const ids = [...new Set(lista.map((r) => r.user_id))]
  const autores = new Map<string, { nombre: string; avatar: string | null }>()
  if (ids.length > 0) {
    const admin = getSupabaseAdmin()
    const [listado, { data: perfiles }] = await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from("profiles").select("id, full_name, avatar_url").in("id", ids),
    ])

    const porId = new Map(ids.map((id) => [id, true]))
    for (const u of listado?.data?.users || []) {
      if (!porId.has(u.id)) continue
      const meta = (u.user_metadata || {}) as {
        full_name?: string
        name?: string
        avatar_url?: string
        /** Lo que trae Google cuando se entra con su botón. */
        picture?: string
      }
      const nombre = meta.full_name || meta.name || ""
      const avatar = meta.avatar_url || meta.picture || null
      if (nombre || avatar) {
        autores.set(u.id, { nombre: nombre || "Miembro", avatar })
      }
    }

    // Respaldo, y solo para lo que falte. Un nombre que es en realidad un
    // correo no se enseña: antes de eso, "Miembro".
    for (const perfil of perfiles ?? []) {
      const ya = autores.get(perfil.id)
      const nombre = pareceCorreo(perfil.full_name) ? "" : (perfil.full_name || "")
      if (!ya) {
        if (!nombre && !perfil.avatar_url) continue
        autores.set(perfil.id, { nombre: nombre || "Miembro", avatar: perfil.avatar_url ?? null })
        continue
      }
      if (ya.nombre === "Miembro" && nombre) ya.nombre = nombre
      if (!ya.avatar && perfil.avatar_url) ya.avatar = perfil.avatar_url
    }
  }

  // ── Los corazones ────────────────────────────────────────────────────────
  // Con el cliente de sesión: la policy de lectura deja ver todos, y así el
  // recuento nunca puede enseñar más de lo que la RLS permite.
  //
  // Si la tabla todavía no existe —la migración docs/sql/pulso_corazones.sql
  // se ejecuta a mano— esto falla y se sigue adelante con cero. Un módulo a
  // medias no debe tumbar la pantalla entera.
  const corazones = new Map<string, number>()
  const mios = new Set<string>()
  const idsRespuestas = lista.map((r) => r.id)
  if (idsRespuestas.length > 0) {
    const { data: marcas } = await supabase
      .from("pulso_corazones")
      .select("respuesta_id, user_id")
      .in("respuesta_id", idsRespuestas)
    for (const m of marcas ?? []) {
      corazones.set(m.respuesta_id, (corazones.get(m.respuesta_id) || 0) + 1)
      if (m.user_id === user.id) mios.add(m.respuesta_id)
    }
  }

  const mia = lista.find((r) => r.user_id === user.id)

  return NextResponse.json({
    pulso: {
      id: p.id,
      numero: p.numero,
      pregunta: p.pregunta,
      invitacion: p.invitacion,
      practica: p.practica_url
        ? { titulo: p.practica_titulo, url: p.practica_url, duracion: p.practica_duracion }
        : null,
      diasRestantes: diasRestantes(p.inicia_en, p.dias),
    },
    respuestas: lista.map((r) => ({
      id: r.id,
      cuerpo: r.cuerpo,
      creadoEn: r.creado_en,
      esMia: r.user_id === user.id,
      autor: autores.get(r.user_id) ?? { nombre: "Miembro", avatar: null },
      corazones: corazones.get(r.id) ?? 0,
      miCorazon: mios.has(r.id),
    })),
    miRespuesta: mia?.cuerpo ?? null,
    // Cuánta gente ha marcado la tuya. Ver que a alguien le llegó lo que
    // escribiste es la razón por la que se vuelve la semana siguiente.
    miRespuestaCorazones: mia ? corazones.get(mia.id) ?? 0 : 0,
    total: lista.length,
  })
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const b = (body ?? {}) as Record<string, unknown>
  const pulsoId = typeof b.pulsoId === "string" ? b.pulsoId : null
  const cuerpo = typeof b.cuerpo === "string" ? b.cuerpo.trim() : ""

  if (!pulsoId) return NextResponse.json({ error: "Falta el pulso" }, { status: 400 })
  if (cuerpo.length === 0) {
    return NextResponse.json({ error: "Escribe algo antes de publicar" }, { status: 400 })
  }
  if (cuerpo.length > MAX_CUERPO) {
    return NextResponse.json({ error: "Demasiado largo" }, { status: 400 })
  }

  // Una respuesta por persona y semana: si ya existe, se actualiza. El pulso es
  // una observación, no un hilo de mensajes.
  const { error } = await supabase
    .from("pulso_respuestas")
    .upsert(
      { pulso_id: pulsoId, user_id: user.id, cuerpo, actualizado_en: new Date().toISOString() },
      { onConflict: "pulso_id,user_id" },
    )

  if (error) {
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const url = new URL(req.url)
  const pulsoId = url.searchParams.get("pulsoId")
  const respuestaId = url.searchParams.get("respuestaId")

  // ── MODERACIÓN ────────────────────────────────────────────────────────
  // Con `respuestaId` se borra UNA respuesta concreta, sea de quien sea. Solo
  // la administración, y por eso va con la clave de servicio: las policies de
  // RLS impiden a propósito tocar lo ajeno, que es justo lo que hay que poder
  // hacer para moderar.
  //
  // Antes esto no existía. El Pulso es la única parte de la Red donde
  // cualquiera escribe en público, y no había forma de retirar nada: había
  // que entrar a la base de datos a mano.
  if (respuestaId) {
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const admin = getSupabaseAdmin()
    const { error } = await admin.from("pulso_respuestas").delete().eq("id", respuestaId)

    if (error) {
      console.error("[/api/pulso DELETE admin]", error)
      return NextResponse.json({ error: "No se pudo borrar" }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  if (!pulsoId) return NextResponse.json({ error: "Falta el pulso" }, { status: 400 })

  // El `eq` sobre user_id es redundante con la policy, y se deja: si alguien
  // cambiara la policy por error, esto sigue impidiendo borrar lo ajeno.
  const { error } = await supabase
    .from("pulso_respuestas")
    .delete()
    .eq("pulso_id", pulsoId)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: "No se pudo borrar" }, { status: 500 })
  return NextResponse.json({ ok: true })
}
