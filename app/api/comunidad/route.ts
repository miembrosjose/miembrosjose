// API — el inicio del Centro de Comunidad.
//
//   GET /api/comunidad
//
// Devuelve, en UNA petición, todo lo que necesita la portada de la comunidad:
// los espacios con su actividad, dónde va esta persona en su recorrido, lo
// destacado y lo que acaba de moverse.
//
// Una sola petición y no cinco porque la portada no tiene sentido a medias: o
// se ve entera o se ve mal, y en un teléfono cinco viajes de ida y vuelta se
// notan.
//
// TODO lo que sale de aquí pasa antes por `contextoDe`, que decide qué
// espacios puede leer quien pregunta. Una temporada que aún no ha abierto
// aparece —se sabe que existe— pero no suelta ni un título de dentro.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { contextoDe, puedeEntrar, puedeModerar } from "@/lib/comunidad/acceso"
import { listarHilos, marcarLoMio, resumenPorEspacio } from "@/lib/comunidad/hilos"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const ctx = await contextoDe(user)

  // Lo fijado por administración ya no se pide aquí: cada espacio lo enseña
  // arriba del todo, que es donde se busca, y traerlo también a la portada
  // hacía aparecer la misma conversación dos veces en dos pantallas. Una
  // consulta menos en la pantalla que más tarda en abrir.
  const [resumen, recientes] = await Promise.all([
    resumenPorEspacio(ctx.legibles),
    // Lo que acaba de moverse, atravesando todos los espacios abiertos.
    //
    // «Moverse» es que alguien haya dicho algo. Los temas sembrados por
    // administración que aún no tienen respuesta se quedan fuera: ya aparecen
    // arriba como los pasos del camino que son, y repetirlos aquí llenaba la
    // portada de entradas iguales que no llevaban a ninguna conversación.
    listarHilos({ legibles: ctx.legibles, fijadas: false, conVidaPropia: true, limite: 8 }),
  ])

  const espacios = ctx.espacios.map((e) => {
    const abierto = puedeEntrar(e, ctx.abiertas)
    const datos = resumen.get(e.id)
    return {
      id: e.id,
      slug: e.slug,
      name: e.name,
      kicker: e.kicker,
      description: e.description,
      tipo: e.tipo,
      season_num: e.season_num,
      desbloquea_con: e.desbloquea_con,
      icono: e.icono,
      abierto,
      // De un espacio cerrado no sale ni el número de conversaciones: saber
      // que dentro hay veinte hilos ya es un adelanto de lo que viene.
      conversaciones: abierto ? datos?.conversaciones ?? 0 : null,
      ultima_actividad: abierto ? datos?.ultima ?? null : null,
    }
  })

  const conRecientes = await marcarLoMio(
    supabase,
    user.id,
    recientes.hilos as unknown as Array<Record<string, unknown>>,
  )

  return NextResponse.json({
    espacios,
    recorrido: {
      temporada_actual: ctx.temporadaActual,
      abiertas: [...ctx.abiertas].sort((a, b) => a - b),
    },
    recientes: conRecientes,
    puedo: {
      moderar: puedeModerar(ctx.papel),
      estructurar: ctx.papel === "administracion",
    },
  })
}
