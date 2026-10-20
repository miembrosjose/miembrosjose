// API — incrementa contador de dias únicos de login do user.
// Chamada sempre que o user entra na area de membros (1x por carregamento).
//
// POST /api/profile/login-ping
//   Sem body. Atualiza user.user_metadata:
//     - last_login_date: "YYYY-MM-DD" (string)
//     - unique_login_days: int (incrementado se hoje != last_login_date)
//
// Idempotente: várias chamadas no mesmo dia não incrementam.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { emitCommunityEvent } from "@/lib/notify"

export const dynamic = "force-dynamic"

const XP_PER_LOGIN_DAY = 50

export async function POST() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD UTC
  const meta = (user.user_metadata || {}) as {
    last_login_date?: string
    unique_login_days?: number
    full_name?: string
    avatar_url?: string
  }

  // Já bateu hoje: não faz nada
  if (meta.last_login_date === today) {
    return NextResponse.json({ ok: true, days: meta.unique_login_days || 0, incremented: false })
  }

  // ── LA SEÑAL DE VIDA, DONDE SÍ SE PUEDE CONSULTAR ──────────────────────
  // `last_login_date` vive en los metadatos de la cuenta, y eso no se puede
  // consultar en masa: para contar a los inactivos habría que recorrer todas
  // las cuentas de cien en cien. La misma fecha va también a una columna de
  // `profiles`, que sí es una consulta con índice.
  //
  // Va aquí dentro y no antes del corte de arriba a propósito: una escritura
  // al día por persona, igual que el contador. Para ventanas de siete, catorce
  // o treinta días, la hora exacta no cambia nada.
  //
  // Si falla, no se interrumpe el resto: perder una señal es una campaña de
  // reactivación algo menos precisa; abortar aquí es perder los XP del día.
  const admin = getSupabaseAdmin()
  try {
    await admin.from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", user.id)
  } catch (e) {
    console.warn("[login-ping] last_seen_at:", e instanceof Error ? e.message : e)
  }

  const newDays = (meta.unique_login_days || 0) + 1
  const { error } = await supabase.auth.updateUser({
    data: {
      last_login_date: today,
      unique_login_days: newDays,
    },
  })
  if (error) {
    console.error("[/api/profile/login-ping]", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }

  // +50 XP pelo 1º acesso do dia. Server-side via service_role pra bypassar RLS.
  try {
    await admin.rpc("apply_xp_delta", {
      p_user_id: user.id,
      p_event_type: "login_day",
      p_xp_delta: XP_PER_LOGIN_DAY,
      p_level_delta: 0,
      p_source_table: "auth.users",
      p_source_id: today,
    })
  } catch (e) {
    console.warn("[login-ping] apply_xp_delta falhou:", e)
  }

  // Broadcast público SE atingiu marco de streak (30, 90, 365)
  if (newDays === 30 || newDays === 90 || newDays === 365) {
    try {
      const fullName = meta.full_name || (user.email ? user.email.split("@")[0] : "Miembro")
      const avatarUrl = (typeof meta.avatar_url === "string" && meta.avatar_url) || null
      const labels: Record<number, string> = { 30: "Habitué — 30 días", 90: "Veterano — 90 días", 365: "Eterno — 365 días" }
      const label = labels[newDays]

      // Comunidad: UNA fila en community_events (antes: fan-out a todos).
      await emitCommunityEvent({
        type: "public_streak",
        actorUserId: user.id,
        actorName: fullName,
        actorAvatarUrl: avatarUrl,
        title: `${fullName} alcanzó ${label} 🔥`,
        preview: "Constancia que vale oro.",
        category: "streak",
        visibility: "members",
        priority: newDays >= 365 ? "highlight" : "important",
      })
    } catch (e) {
      console.warn("[login-ping] streak broadcast falhou:", e)
    }
  }

  return NextResponse.json({ ok: true, days: newDays, incremented: true, xp_awarded: XP_PER_LOGIN_DAY })
}
