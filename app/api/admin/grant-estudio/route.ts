// API admin — concede / revoga insignia EL ESTUDIO (insignia premium
// exclusiva pra clientes que contrataram o serviço "¿Quieres un área de
// miembros igual a esta?", vendido via Wise/contato direto).
//
// Espelho exato do /api/admin/grant-topo, só muda o achievement_id e os
// textos do broadcast.
//
// POST /api/admin/grant-estudio
//   Body: { user_id: string }
//   Ação: insere user_unlocked_achievements + dispara broadcast pra
//         comunidade ver ("Fulano entró en EL ESTUDIO 🎬") gerando FOMO.
//
// DELETE /api/admin/grant-estudio
//   Body: { user_id: string }
//   Ação: remove user_unlocked_achievements (em caso de reembolso /
//         atribuição errada). Não dispara broadcast.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

const ESTUDIO_ID = "el_estudio"

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { user_id?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const targetUserId = (body.user_id || "").trim()
  if (!targetUserId) {
    return NextResponse.json({ error: "user_id requerido" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  const { data: targetUser, error: userErr } = await admin.auth.admin.getUserById(targetUserId)
  if (userErr || !targetUser?.user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }
  const targetMeta = (targetUser.user.user_metadata || {}) as {
    full_name?: string
    avatar_url?: string
  }
  const targetName =
    targetMeta.full_name ||
    (targetUser.user.email ? targetUser.user.email.split("@")[0] : "Miembro")
  const targetAvatar =
    (typeof targetMeta.avatar_url === "string" && targetMeta.avatar_url) || null

  const { data: existingUnlock } = await admin
    .from("user_unlocked_achievements")
    .select("achievement_id")
    .eq("user_id", targetUserId)
    .eq("achievement_id", ESTUDIO_ID)
    .limit(1)

  const alreadyHad = !!(existingUnlock && existingUnlock.length > 0)

  if (!alreadyHad) {
    const { error: insertErr } = await admin
      .from("user_unlocked_achievements")
      .insert({ user_id: targetUserId, achievement_id: ESTUDIO_ID })
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }
  }

  if (!alreadyHad) {
    try {
      await admin.rpc("apply_xp_delta", {
        p_user_id: targetUserId,
        p_event_type: "insignia_unlocked",
        p_xp_delta: 0,
        p_level_delta: 0,
        p_source_table: "achievements",
        p_source_id: ESTUDIO_ID,
      })
    } catch {
      // ignora
    }
  }

  if (!alreadyHad) {
    // Notif pessoal pro recipient
    await admin.from("notifications").insert({
      user_id: targetUserId,
      type: "public_insignia_self",
      source_user_id: targetUserId,
      source_user_name: targetName,
      source_user_avatar_url: targetAvatar,
      title: "¡Conquistaste el Servicio Premium A!",
      preview: "Insignia exclusiva — Servicio Premium A",
    })

    // Broadcast pros outros users
    // CRÍTICO: usar auth.admin.listUsers, NÃO .schema("auth").from("users")
    // que falha silenciosamente em prod (retorna array vazio sem erro).
    const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const otherUsers = (listed?.users || []).filter((u) => u.id !== targetUserId)

    if (otherUsers.length > 0) {
      const rows = otherUsers.map((u) => ({
        user_id: u.id as string,
        type: "public_insignia",
        source_user_id: targetUserId,
        source_user_name: targetName,
        source_user_avatar_url: targetAvatar,
        title: `${targetName} entró en Servicio Premium A`,
        preview: "Insignia exclusiva — Servicio Premium A",
      }))
      for (let i = 0; i < rows.length; i += 100) {
        await admin.from("notifications").insert(rows.slice(i, i + 100))
      }
    }
  }

  return NextResponse.json({
    ok: true,
    user_id: targetUserId,
    user_name: targetName,
    already_had: alreadyHad,
    granted_by: user.email,
  })
}

export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { user_id?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const targetUserId = (body.user_id || "").trim()
  if (!targetUserId) {
    return NextResponse.json({ error: "user_id requerido" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  await admin
    .from("user_unlocked_achievements")
    .delete()
    .eq("user_id", targetUserId)
    .eq("achievement_id", ESTUDIO_ID)

  await admin
    .from("xp_events")
    .delete()
    .eq("user_id", targetUserId)
    .eq("event_type", "insignia_unlocked")
    .eq("source_id", ESTUDIO_ID)

  const { data: targetUser } = await admin.auth.admin.getUserById(targetUserId)
  if (targetUser?.user) {
    const meta = (targetUser.user.user_metadata || {}) as { featured_badge_id?: string }
    if (meta.featured_badge_id === ESTUDIO_ID) {
      await admin.auth.admin.updateUserById(targetUserId, {
        user_metadata: { ...meta, featured_badge_id: null },
      })
    }
  }

  return NextResponse.json({ ok: true, user_id: targetUserId, revoked_by: user.email })
}
