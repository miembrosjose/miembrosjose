// Concesión de insignias desde el servidor.
//
// Se comprueba antes de insertar en vez de confiar en una restricción única
// sobre (user_id, achievement_id), que puede no existir: es el mismo patrón
// que ya usaban grant-topo y las funciones de la Red.
//
// NUNCA lanza. Una insignia es el reflejo de algo que ya ocurrió —una compra,
// una aprobación—, así que si falla no debe deshacer lo principal.

import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function concederInsignia(userId: string, achievementId: string): Promise<void> {
  if (!userId || !achievementId) return
  try {
    const admin = getSupabaseAdmin()
    const { data: ya } = await admin
      .from("user_unlocked_achievements")
      .select("achievement_id")
      .eq("user_id", userId)
      .eq("achievement_id", achievementId)
      .limit(1)
    if (ya && ya.length > 0) return

    const { error } = await admin
      .from("user_unlocked_achievements")
      .insert({ user_id: userId, achievement_id: achievementId })
    if (error) console.error("[conceder-insignia]", achievementId, error.message)
  } catch (e) {
    console.error("[conceder-insignia]", achievementId, e instanceof Error ? e.message : e)
  }
}
