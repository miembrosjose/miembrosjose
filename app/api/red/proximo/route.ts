// API — el próximo encuentro, para anunciarlo en la portada.
//
//   GET /api/red/proximo
//
// Devuelve como mucho DOS: el siguiente y el de después. La portada no es un
// calendario; es un anuncio. Quien quiera la lista entera va a La Red.
//
// Devuelve `{ encuentros: [] }` cuando no hay ninguno. La portada entonces no
// pinta la sección: mejor ausente que vacía, sobre todo ahora que la
// plataforma está empezando y una rejilla vacía dice que aquí no pasa nada.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type Ciudad = { name: string | null; admin1: string | null } | null

type Fila = {
  id: number
  titulo: string
  descripcion: string
  starts_at: string
  ends_at: string | null
  lugar: string
  cupo: number | null
  modalidad: string | null
  enlace: string | null
  country_code: string | null
  network_cities: Ciudad | Ciudad[]
}

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const ahora = new Date().toISOString()

  const { data, error } = await supabase
    .from("network_meetings")
    .select("id, titulo, descripcion, starts_at, ends_at, lugar, cupo, modalidad, enlace, country_code, network_cities(name, admin1)")
    .eq("estado", "publicado")
    .gte("starts_at", ahora)
    .order("starts_at", { ascending: true })
    .limit(2)

  if (error) {
    // La columna `modalidad` puede no existir todavía si no se ha corrido la
    // migración. No es motivo para romper la portada: se devuelve vacío y la
    // sección simplemente no aparece.
    return NextResponse.json({ encuentros: [] })
  }

  const filas = (data ?? []) as unknown as Fila[]
  if (filas.length === 0) return NextResponse.json({ encuentros: [] })

  // Cuántos han confirmado en cada uno. Una sola consulta para los dos.
  const ids = filas.map((f) => f.id)
  const { data: participantes } = await supabase
    .from("network_meeting_participants")
    .select("meeting_id")
    .in("meeting_id", ids)

  const conteo = new Map<number, number>()
  for (const p of participantes ?? []) {
    conteo.set(p.meeting_id, (conteo.get(p.meeting_id) ?? 0) + 1)
  }

  return NextResponse.json({
    encuentros: filas.map((f) => {
      // Supabase devuelve la relación como objeto o como array de uno según
      // cómo infiera la cardinalidad. Se normaliza aquí.
      const c = Array.isArray(f.network_cities) ? f.network_cities[0] : f.network_cities
      const online = f.modalidad === "online"
      return {
        id: f.id,
        titulo: f.titulo,
        descripcion: f.descripcion,
        empiezaEn: f.starts_at,
        terminaEn: f.ends_at,
        online,
        enlace: online ? f.enlace : null,
        // Para un online, el "dónde" es la plataforma; para un presencial, la
        // ciudad. Nunca un domicilio: eso no se guarda.
        donde: online
          ? (f.lugar || "En línea")
          : [c?.name, c?.admin1].filter(Boolean).join(", ") || f.lugar || "",
        cupo: f.cupo,
        confirmados: conteo.get(f.id) ?? 0,
      }
    }),
  })
}
