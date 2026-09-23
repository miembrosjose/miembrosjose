// API — lista de insignias desbloqueadas pelo user (sincroniza entre devices).
//
// GET /api/profile/unlocked-achievements
//   Retorna [{ achievement_id, unlocked_at }] do user logado
//
// Devuelve DOS cosas juntas:
//   · Lo que hay en la tabla: lo que concedió la administración o una compra.
//   · Lo que el servidor puede demostrar ahora mismo —capítulos vistos, días
//     de acceso, aportaciones—, aunque nadie lo haya escrito nunca.
//
// Lo segundo hace falta porque las patentes de comunidad y las llamas de
// tiempo se calculan al vuelo y no tienen fila propia. Antes el selector del
// perfil las sacaba de una copia en localStorage, y esa copia era justamente
// por donde se colaba cualquier insignia.
//
// POST não fica aqui — o client chama /api/profile/insignia-unlocked
// que registra XP + grava em user_unlocked_achievements numa só chamada.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { insigniasGanadas } from "@/lib/insignias-ganadas"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const [{ data, error }, ganadas] = await Promise.all([
    supabase
      .from("user_unlocked_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", user.id)
      .order("unlocked_at", { ascending: true }),
    insigniasGanadas(user),
  ])

  if (error) {
    console.error("[/api/profile/unlocked-achievements GET]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const filas = (data || []) as Array<{ achievement_id: string; unlocked_at: string }>
  const yaEstan = new Set(filas.map((f) => f.achievement_id))

  // Las calculadas no tienen fecha propia: se marcan con la de hoy, que es
  // cuando el servidor las ha confirmado.
  const ahora = new Date().toISOString()
  const completa = [
    ...filas,
    ...[...ganadas]
      .filter((id) => !yaEstan.has(id))
      .map((id) => ({ achievement_id: id, unlocked_at: ahora })),
  ]

  return NextResponse.json({ unlocked: completa })
}
