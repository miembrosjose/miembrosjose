// API — registra el desbloqueo de una insignia.
//
// POST /api/profile/insignia-unlocked   { insignia_id }
//
// ── QUÉ SE COMPRUEBA ANTES DE CONCEDER ─────────────────────────────────────
// Esta ruta concedía CUALQUIER insignia del catálogo a quien la pidiera. Una
// línea en la consola del navegador bastaba para ponerse «Instructor de Los
// 144.000» o «Embajador Galáctico».
//
// Ahora se pregunta a lib/insignias-ganadas: ¿los HECHOS que guarda el
// servidor —capítulos vistos, días de acceso, aportaciones, compras—
// respaldan esta insignia? Si no, se rechaza. Las que concede la
// administración no pasan por aquí: se escriben desde sus propias rutas.
//
// ── POR QUÉ ESTA RUTA YA CASI NO HACE FALTA ────────────────────────────────
// Las insignias de avance las concede el propio servidor al guardar el avance
// (ver /api/profile/episode-progress). Esta ruta se conserva para lo que el
// servidor no puede observar —abrir el enlace del grupo de WhatsApp— y para
// que el navegador pueda reclamar algo que quedó sin conceder por una caída
// de red. Conceder dos veces no duplica nada.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getAchievementById } from "@/lib/achievements"
import { AUTODECLARABLES, insigniasGanadas } from "@/lib/insignias-ganadas"
import { concederInsignia } from "@/lib/insignias-conceder"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { insignia_id?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const id = (body.insignia_id || "").trim()
  if (!id) return NextResponse.json({ error: "insignia_id required" }, { status: 400 })
  if (!getAchievementById(id)) {
    return NextResponse.json({ error: "Insignia inválida" }, { status: 400 })
  }

  // El servidor no se fía de quien pide: comprueba.
  if (!AUTODECLARABLES.has(id)) {
    const ganadas = await insigniasGanadas(user)
    if (!ganadas.has(id)) {
      return NextResponse.json(
        { error: "Esa insignia no se ha ganado todavía.", concedida: false },
        { status: 403 },
      )
    }
  }

  const nueva = await concederInsignia(user, id)
  return NextResponse.json({ ok: true, concedida: true, nueva })
}
