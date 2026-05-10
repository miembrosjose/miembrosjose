// API — registra desbloqueio de insignia + concede XP.
//
// POST /api/profile/insignia-unlocked
//   Body: { insignia_id: string }
//
// Concede XP baseado na categoria:
//   - progression (aulas/episodios): +50
//   - community / time / agents: +200
//   - products: 0 (compra ja deu +1 level)
//
// Dedup: cada user só ganha XP UMA vez por insignia (verifica xp_events).

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAchievementById } from "@/lib/achievements"

export const dynamic = "force-dynamic"

const XP_BY_CATEGORY: Record<string, number> = {
  progression: 50,
  community: 200,
  time: 200,
  agents: 200,
  products: 0, // compra ja deu +1 level
  exclusive: 0, // admin_seal etc — não premia XP
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { insignia_id?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const id = (body.insignia_id || "").trim()
  if (!id) return NextResponse.json({ error: "insignia_id required" }, { status: 400 })

  const ach = getAchievementById(id)
  if (!ach) return NextResponse.json({ error: "Insignia inválida" }, { status: 400 })

  const xpAmount = XP_BY_CATEGORY[ach.category] ?? 0
  const admin = getSupabaseAdmin()

  // Grava na lista de unlocked do user (cross-device sync). Idempotente:
  // PRIMARY KEY (user_id, achievement_id) + ignoreDuplicates evita erro
  // se já existir. RLS aplica via supabase server client, mas usamos admin
  // pra bypass simplificar (validação feita logicamente acima — id existe + auth OK).
  const { error: unlockErr } = await admin
    .from("user_unlocked_achievements")
    .upsert(
      { user_id: user.id, achievement_id: id },
      { onConflict: "user_id,achievement_id", ignoreDuplicates: true },
    )
  if (unlockErr) {
    console.error("[/api/profile/insignia-unlocked] upsert failed:", {
      user_id: user.id,
      achievement_id: id,
      error: unlockErr.message,
      code: unlockErr.code,
    })
    return NextResponse.json(
      { error: "Failed to save unlock: " + unlockErr.message },
      { status: 500 },
    )
  }

  // Dedup XP: já recebeu XP por essa insignia? (separado do unlock — XP só
  // é creditado 1×, mas a linha em user_unlocked_achievements é idempotente
  // e sempre upsertada acima)
  const { data: existing } = await admin
    .from("xp_events")
    .select("id")
    .eq("user_id", user.id)
    .eq("event_type", "insignia_unlocked")
    .eq("source_id", id)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ ok: true, dedup: true, xp_awarded: 0 })
  }

  if (xpAmount > 0) {
    await admin.rpc("apply_xp_delta", {
      p_user_id: user.id,
      p_event_type: "insignia_unlocked",
      p_xp_delta: xpAmount,
      p_level_delta: 0,
      p_source_table: "achievements",
      p_source_id: id,
    })
  }

  // Produtos: +1 level por compra (dedup próprio: event_type product_level_grant)
  if (ach.category === "products") {
    const { data: levelGranted } = await admin
      .from("xp_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_type", "product_level_grant")
      .eq("source_id", id)
      .limit(1)
    if (!levelGranted?.length) {
      await admin.rpc("apply_xp_delta", {
        p_user_id: user.id,
        p_event_type: "product_level_grant",
        p_xp_delta: 0,
        p_level_delta: 1,
        p_source_table: "achievements",
        p_source_id: id,
      })
    }
  }

  // Whitelist de insignias com BROADCAST (toast lateral pros outros users):
  //   - 5 produtos premium (Creativos, Andrómeda, Analytics, Mini VSL, Revisão)
  //   - 4 ranks intermediários (Operador, Estratega, Capo, Padrino)
  //   - 2 chamas time (Habitué, Veterano)
  //   - 1 entrenamiento completo (concluiu todos os episódios)
  //
  // Top tier (el_topo, el_estudio, time_eterno, rank_leyenda) NÃO usa esse
  // endpoint — vem por grant-topo/grant-estudio admin OU por triggers SQL
  // que usam tipo public_insignia diretamente. Essas 4 disparam fullscreen
  // overlay no client (BroadcastProvider detecta pelo title).
  //
  // Outras insignias (welcome, agents, seasons, vip_community, ranks bronze,
  // time_devoto, admin_seal) só mostram toast LOCAL pro recipient — não
  // aparecem pros outros (evita spam de FOMO em conquistas comuns).
  const BROADCAST_IDS = new Set([
    // Top tier (2 que passam por aqui — el_topo e el_estudio vão por endpoints
    // dedicados grant-topo/grant-estudio). ETERNO e LEYENDA disparam fullscreen
    // no client porque o BroadcastProvider detecta "ETERNO"/"LEYENDA" no title.
    "time_eterno", "rank_leyenda",
    // Products gold (5)
    "product_creativos", "product_andromeda", "product_analytics", "product_minivsl", "product_revisao",
    // Ranks comunidad (4 intermediários)
    "rank_operador", "rank_estratega", "rank_capo", "rank_padrino",
    // Tempo chamas (2)
    "time_habitue", "time_veterano",
    // Progressão completa
    "training_complete",
  ])
  const shouldBroadcast = BROADCAST_IDS.has(ach.id)

  if (shouldBroadcast) {
    const meta = (user.user_metadata || {}) as { full_name?: string; avatar_url?: string }
    const fullName = meta.full_name || (user.email ? user.email.split("@")[0] : "Miembro")
    const avatarUrl = (typeof meta.avatar_url === "string" && meta.avatar_url) || null
    const tierEmoji = ach.tier === "topo" ? "🔥" : ach.tier === "diamond" ? "💎" : ach.tier === "gold" ? "🥇" : "🥈"

    // Notif pessoal pro recipient — sempre persiste no sino
    await admin.from("notifications").insert({
      user_id: user.id,
      type: "public_insignia_self",
      source_user_id: user.id,
      source_user_name: fullName,
      source_user_avatar_url: avatarUrl,
      title: `Desbloqueaste "${ach.name}" ${tierEmoji}`,
      preview: ach.desc,
    })

    // Broadcast FOMO pra outros users.
    // CRÍTICO: usar auth.admin.listUsers, NÃO .schema("auth").from("users")
    // que falha silenciosamente em prod (retorna array vazio sem erro).
    const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const otherUsers = (listed?.users || []).filter((u) => u.id !== user.id)

    if (otherUsers.length > 0) {
      const rows = otherUsers.map((u) => ({
        user_id: u.id as string,
        type: "public_insignia",
        source_user_id: user.id,
        source_user_name: fullName,
        source_user_avatar_url: avatarUrl,
        title: `${fullName} desbloqueó "${ach.name}" ${tierEmoji}`,
        preview: ach.desc,
      }))
      for (let i = 0; i < rows.length; i += 100) {
        await admin.from("notifications").insert(rows.slice(i, i + 100))
      }
    }
  }

  return NextResponse.json({ ok: true, xp_awarded: xpAmount, category: ach.category, broadcast: shouldBroadcast })
}
