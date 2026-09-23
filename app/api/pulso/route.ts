// API — Pulso 144, el ritual semanal.
//
//   GET  /api/pulso   la pregunta activa, sus respuestas y la tuya
//   POST /api/pulso   publica o edita tu respuesta
//   DELETE /api/pulso borra la tuya
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

export const dynamic = "force-dynamic"

const MAX_CUERPO = 2000

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

  // Los nombres y avatares salen de `profiles`, en una sola consulta.
  const ids = [...new Set(lista.map((r) => r.user_id))]
  const autores = new Map<string, { nombre: string; avatar: string | null }>()
  if (ids.length > 0) {
    const { data: perfiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", ids)
    for (const perfil of perfiles ?? []) {
      autores.set(perfil.id, {
        nombre: perfil.full_name || "Miembro",
        avatar: perfil.avatar_url ?? null,
      })
    }
  }

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
    })),
    miRespuesta: lista.find((r) => r.user_id === user.id)?.cuerpo ?? null,
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

  const pulsoId = new URL(req.url).searchParams.get("pulsoId")
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
