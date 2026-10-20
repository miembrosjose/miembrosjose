// API — preferências de notificação por user.
//
// GET  /api/profile/notification-prefs   → retorna prefs (com defaults)
// POST /api/profile/notification-prefs   → atualiza (body: NotificationPrefs parcial)
//
// Salva em user.user_metadata.notification_prefs. Default: tudo ativado.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export type NotificationPrefs = {
  own: {
    level_up: boolean
    forum_replies: boolean
    forum_likes: boolean
    follows: boolean
    feed_posts: boolean
    funnel_xp: boolean
  }
  others: {
    welcome: boolean
    level_up: boolean
    insignia: boolean
    streak: boolean
    funnel_hot: boolean
    funnel_new: boolean
    top3: boolean
  }
  sound: boolean

  /**
   * Lo que llega al MÓVIL. Separado de lo de arriba a propósito.
   *
   * ── POR QUÉ NO SE REAPROVECHAN LAS DE ARRIBA ──────────────────────────
   * `own` y `others` dicen qué aparece DENTRO de la plataforma, donde la
   * persona ya está mirando. Esto dice qué interrumpe su día. No es lo
   * mismo querer ver algo al entrar que querer que suene el teléfono.
   *
   * ── Y POR QUÉ NO SUSTITUYEN AL PERMISO DEL SISTEMA ────────────────────
   * El permiso del navegador decide SI PUEDE llegar algo. Esto decide QUÉ.
   * Son dos capas distintas: se puede tener el permiso dado y no querer los
   * mensajes, y al revés no se puede nada.
   */
  push: {
    /** Mensajes privados. */
    mensajes: boolean
    /**
     * Enseñar el texto del mensaje en la notificación.
     *
     * Apagado, el aviso dice solo quién escribe. Importa porque una
     * notificación se lee en la pantalla BLOQUEADA, a la vista de
     * cualquiera que esté al lado.
     */
    vista_previa: boolean
    /** Insignias y subidas de grado. */
    logros: boolean
    /** Comunicados de la administración. */
    comunicados: boolean
  }
}

export const DEFAULT_PREFS: NotificationPrefs = {
  own: {
    level_up: true,
    forum_replies: true,
    forum_likes: true,
    follows: true,
    feed_posts: true,
    funnel_xp: true,
  },
  others: {
    welcome: true,
    level_up: true,
    insignia: true,
    streak: true,
    funnel_hot: true,
    funnel_new: true,
    top3: true,
  },
  sound: true,
  // Todo encendido salvo que se diga lo contrario. Quien no quiera avisos en
  // el móvil ya tiene una forma más contundente: no dar el permiso.
  push: {
    mensajes: true,
    vista_previa: true,
    logros: true,
    comunicados: true,
  },
}

function mergePrefs(stored: unknown): NotificationPrefs {
  const s = (stored && typeof stored === "object" ? stored : {}) as Partial<NotificationPrefs>
  return {
    own: { ...DEFAULT_PREFS.own, ...(s.own || {}) },
    others: { ...DEFAULT_PREFS.others, ...(s.others || {}) },
    sound: typeof s.sound === "boolean" ? s.sound : DEFAULT_PREFS.sound,
    // Las cuentas de antes de esto no tienen la sección: se rellena con los
    // valores por defecto en vez de quedar indefinida.
    push: { ...DEFAULT_PREFS.push, ...(s.push || {}) },
  }
}

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const meta = (user.user_metadata || {}) as { notification_prefs?: unknown }
  return NextResponse.json({ ok: true, prefs: mergePrefs(meta.notification_prefs) })
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: Partial<NotificationPrefs>
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const current = mergePrefs((user.user_metadata as { notification_prefs?: unknown })?.notification_prefs)
  const next: NotificationPrefs = {
    own: { ...current.own, ...(body.own || {}) },
    others: { ...current.others, ...(body.others || {}) },
    sound: typeof body.sound === "boolean" ? body.sound : current.sound,
    push: { ...current.push, ...(body.push || {}) },
  }

  const { error } = await supabase.auth.updateUser({ data: { notification_prefs: next } })
  if (error) {
    console.error("[/api/profile/notification-prefs]", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, prefs: next })
}
