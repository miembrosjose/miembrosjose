// Emisor central de "Actividad de la Red" (community_events).
// UNA fila por evento comunitario — nunca fan-out. Los avisos personales siguen
// insertándose directamente en `notifications`. Degrada en silencio si la tabla
// aún no existe (antes de correr community_events.sql).

import { getSupabaseAdmin } from "@/lib/supabase/admin"

export type CommunityEventInput = {
  type: string
  actorUserId?: string | null
  actorName?: string | null
  actorAvatarUrl?: string | null
  title: string
  preview?: string | null
  category?: string   // progress | season | badge | rank | streak | forum | map | node | message | system
  visibility?: string // public | members | country | city | anonymous | admin
  priority?: string   // low | normal | important | highlight
  link?: string | null
  country?: string | null
  city?: string | null
  metadata?: Record<string, unknown> | null
}

export async function emitCommunityEvent(e: CommunityEventInput): Promise<void> {
  try {
    const admin = getSupabaseAdmin()
    await admin.from("community_events").insert({
      type: e.type,
      actor_user_id: e.actorUserId ?? null,
      actor_name: e.actorName ?? null,
      actor_avatar_url: e.actorAvatarUrl ?? null,
      title: e.title,
      preview: e.preview ?? null,
      category: e.category ?? "system",
      visibility: e.visibility ?? "members",
      priority: e.priority ?? "normal",
      link: e.link ?? null,
      country: e.country ?? null,
      city: e.city ?? null,
      metadata: e.metadata ?? null,
    })
  } catch {
    /* community_events puede no existir todavía — no romper el flujo */
  }
}
