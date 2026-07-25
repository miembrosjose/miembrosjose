// Conexión interna segura: el webhook del EMBUDO (otro Supabase) reenvía aquí
// los eventos de Stripe para activar/actualizar miembros en ESTA plataforma.
//
// Seguridad:
//  - POST únicamente. Autenticación por `Authorization: Bearer <EMBUDO_SYNC_SECRET>`.
//  - EMBUDO_SYNC_SECRET es un SECRETO de servidor (Cloudflare `wrangler secret put`),
//    nunca NEXT_PUBLIC_, nunca en el repo. Comparación en tiempo constante.
//  - Escribe con el service_role existente (getSupabaseAdmin) — solo server-side.
//
// Idempotencia: tabla public.member_sync_events (una fila por source_event_id).
// Orden de eventos: member_subscriptions.last_status_event_created_at.
//
// Nunca se registran emails completos, Authorization ni secretos. Errores al
// cliente siempre genéricos.

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

const MAX_BODY_BYTES = 8 * 1024 // 8 KB — el payload es pequeño
const ACTIVATE_REDIRECT = "https://los144000.com/activar-cuenta"
const ACTIONS = new Set(["activate", "renew", "past_due", "cancel"] as const)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Action = "activate" | "renew" | "past_due" | "cancel"

// Respuesta JSON genérica (sin detalles internos).
function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status })
}

// Comparación en tiempo constante, sin dependencias de runtime (Node/workerd).
// Recorre siempre la longitud del secreto esperado para no filtrar por timing.
function safeEqual(provided: string, expected: string): boolean {
  const enc = new TextEncoder()
  const a = enc.encode(provided)
  const b = enc.encode(expected)
  let diff = a.length ^ b.length
  for (let i = 0; i < b.length; i++) {
    diff |= (a[i] ?? 0) ^ b[i]
  }
  return diff === 0
}

export async function POST(req: NextRequest) {
  // ── 1. Autenticación (antes de tocar el body o Supabase) ─────────────────
  const expected = process.env.EMBUDO_SYNC_SECRET
  if (!expected) {
    // Fail-closed: sin secreto configurado, nadie entra. No revelamos el motivo.
    console.error("[member-sync] stage=auth code=secret_not_configured")
    return json(401, { error: "unauthorized" })
  }
  const authHeader = req.headers.get("authorization") || ""
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
  if (!provided || !safeEqual(provided, expected)) {
    return json(401, { error: "unauthorized" })
  }

  // ── 2. Límite de tamaño + parseo ─────────────────────────────────────────
  const declaredLen = Number(req.headers.get("content-length") || "0")
  if (Number.isFinite(declaredLen) && declaredLen > MAX_BODY_BYTES) {
    return json(400, { error: "invalid_request" })
  }
  const raw = await req.text()
  if (raw.length > MAX_BODY_BYTES) {
    return json(400, { error: "invalid_request" })
  }
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(raw) as Record<string, unknown>
  } catch {
    return json(400, { error: "invalid_request" })
  }

  // ── 3. Validación ────────────────────────────────────────────────────────
  const action = payload.action as Action
  if (!ACTIONS.has(action)) return json(400, { error: "invalid_request" })

  const email = String(payload.email ?? "").trim().toLowerCase()
  if (!EMAIL_RE.test(email) || email.length > 320) {
    return json(400, { error: "invalid_request" })
  }

  const sourceEventId = String(payload.source_event_id ?? "").trim()
  if (!sourceEventId || sourceEventId.length > 255) {
    return json(400, { error: "invalid_request" })
  }

  const sourceEventType =
    payload.source_event_type != null ? String(payload.source_event_type).slice(0, 255) : null

  const rawCreatedAt = payload.source_event_created_at
  const eventCreatedAt =
    typeof rawCreatedAt === "number" && Number.isFinite(rawCreatedAt)
      ? Math.floor(rawCreatedAt)
      : null

  const subscriptionStatus =
    payload.subscription_status != null ? String(payload.subscription_status).slice(0, 64) : null

  const stripeCustomerId =
    payload.stripe_customer_id != null ? String(payload.stripe_customer_id).slice(0, 255) : null
  const stripeSubscriptionId =
    payload.stripe_subscription_id != null
      ? String(payload.stripe_subscription_id).slice(0, 255)
      : null

  let currentPeriodEnd: string | null = null
  if (payload.current_period_end != null) {
    const d = new Date(String(payload.current_period_end))
    if (!Number.isNaN(d.getTime())) currentPeriodEnd = d.toISOString()
  }

  const admin = getSupabaseAdmin()

  // ── 4. Idempotencia: reclamar el evento ──────────────────────────────────
  // INSERT 'processing'. Si choca (23505) → ya existe: revisamos su estado.
  let claimed = false
  const { data: claimRow, error: claimErr } = await admin
    .from("member_sync_events")
    .insert({
      source_event_id: sourceEventId,
      source_event_type: sourceEventType,
      action,
      processing_status: "processing",
    })
    .select("source_event_id")
    .maybeSingle()

  if (!claimErr && claimRow) {
    claimed = true
  } else if (claimErr && claimErr.code === "23505") {
    const { data: existing } = await admin
      .from("member_sync_events")
      .select("processing_status")
      .eq("source_event_id", sourceEventId)
      .maybeSingle()
    const st = existing?.processing_status
    if (st === "completed") {
      // Ya procesado → no repetir acciones.
      return json(200, { ok: true, duplicate: true })
    }
    if (st === "failed") {
      // Reintento seguro: reclamamos solo si sigue 'failed'.
      const { data: reclaimed } = await admin
        .from("member_sync_events")
        .update({ processing_status: "processing", error_at: null })
        .eq("source_event_id", sourceEventId)
        .eq("processing_status", "failed")
        .select("source_event_id")
        .maybeSingle()
      if (reclaimed) claimed = true
      else return json(409, { error: "processing" }) // otro proceso lo tomó
    } else {
      // 'processing' (u otro) → en curso, reintentable sin duplicar.
      return json(409, { error: "processing" })
    }
  } else {
    console.error("[member-sync] stage=claim code=db_error")
    return json(500, { error: "internal_error" })
  }

  if (!claimed) return json(500, { error: "internal_error" })

  // ── 5. Procesamiento ─────────────────────────────────────────────────────
  try {
    await applyMembership(admin, {
      action,
      email,
      eventCreatedAt,
      subscriptionStatus,
      stripeCustomerId,
      stripeSubscriptionId,
      currentPeriodEnd,
    })

    // La invitación se envía SOLO en 'activate' (aunque el evento de estado sea
    // más viejo que otro ya aplicado — el chequeo de invitación es independiente).
    if (action === "activate") {
      await ensureInvite(admin, email)
    }

    await admin
      .from("member_sync_events")
      .update({ processing_status: "completed", completed_at: new Date().toISOString() })
      .eq("source_event_id", sourceEventId)

    return json(200, { ok: true })
  } catch (e) {
    const code = e instanceof Error ? e.message.slice(0, 40) : "error"
    console.error(
      "[member-sync] stage=process action=%s type=%s code=%s",
      action,
      sourceEventType ?? "",
      code,
    )
    await admin
      .from("member_sync_events")
      .update({ processing_status: "failed", error_at: new Date().toISOString() })
      .eq("source_event_id", sourceEventId)
      .then(() => {}, () => {})
    return json(500, { error: "internal_error" })
  }
}

// ── Upsert de membresía con orden de eventos + unicidad case-insensitive ────
async function applyMembership(
  admin: ReturnType<typeof getSupabaseAdmin>,
  p: {
    action: Action
    email: string
    eventCreatedAt: number | null
    subscriptionStatus: string | null
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    currentPeriodEnd: string | null
  },
) {
  const desiredStatus =
    p.action === "activate" || p.action === "renew"
      ? "active"
      : p.action === "past_due"
        ? "past_due"
        : "canceled"

  // El email ya viene normalizado a minúsculas y SIEMPRE se guarda así, por lo
  // que .eq() coincide; el índice UNIQUE sobre lower(email) es la garantía final.
  const { data: existing } = await admin
    .from("member_subscriptions")
    .select("id, last_status_event_created_at")
    .eq("email", p.email)
    .maybeSingle()

  // ¿El evento entrante es igual o posterior al último de estado aplicado?
  const shouldApplyState = (last: number | null | undefined) =>
    last == null || p.eventCreatedAt == null || p.eventCreatedAt >= last

  const buildUpdates = () => {
    const u: Record<string, unknown> = {
      status: desiredStatus,
      updated_at: new Date().toISOString(),
    }
    if (p.subscriptionStatus != null) u.subscription_status = p.subscriptionStatus
    if (p.eventCreatedAt != null) u.last_status_event_created_at = p.eventCreatedAt
    if (p.action === "activate" || p.action === "renew") {
      if (p.currentPeriodEnd != null) u.current_period_end = p.currentPeriodEnd
    }
    if (p.action === "activate") {
      if (p.stripeCustomerId != null) u.stripe_customer_id = p.stripeCustomerId
      if (p.stripeSubscriptionId != null) u.stripe_subscription_id = p.stripeSubscriptionId
    }
    return u
  }

  if (existing) {
    // Evento fuera de orden (más viejo) → no reemplazamos el estado actual.
    if (!shouldApplyState(existing.last_status_event_created_at)) return
    const { error } = await admin
      .from("member_subscriptions")
      .update(buildUpdates())
      .eq("id", existing.id)
    if (error) throw new Error(`update:${error.code || "err"}`)
    return
  }

  // No existe → insertar. Ante carrera 23505, re-buscar y actualizar.
  const insertRow: Record<string, unknown> = {
    email: p.email,
    status: desiredStatus,
    subscription_status: p.subscriptionStatus,
    current_period_end:
      p.action === "activate" || p.action === "renew" ? p.currentPeriodEnd : null,
    stripe_customer_id: p.action === "activate" ? p.stripeCustomerId : null,
    stripe_subscription_id: p.action === "activate" ? p.stripeSubscriptionId : null,
    last_status_event_created_at: p.eventCreatedAt,
  }
  const { error: insErr } = await admin.from("member_subscriptions").insert(insertRow)
  if (!insErr) return

  if (insErr.code === "23505") {
    // Carrera: otra request insertó primero → re-buscar y actualizar con orden.
    const { data: raced } = await admin
      .from("member_subscriptions")
      .select("id, last_status_event_created_at")
      .eq("email", p.email)
      .maybeSingle()
    if (!raced) throw new Error("race_no_row")
    if (!shouldApplyState(raced.last_status_event_created_at)) return
    const { error } = await admin
      .from("member_subscriptions")
      .update(buildUpdates())
      .eq("id", raced.id)
    if (error) throw new Error(`update_race:${error.code || "err"}`)
    return
  }
  throw new Error(`insert:${insErr.code || "err"}`)
}

// ── Invitación (solo activate). Usuario ya existente = no-op correcto ───────
async function ensureInvite(admin: ReturnType<typeof getSupabaseAdmin>, email: string) {
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: ACTIVATE_REDIRECT,
  })
  if (!error) return // invitación enviada

  // Detección de usuario ya existente → no fallar, no duplicar invitaciones.
  const status = (error as { status?: number }).status
  const code = (error as { code?: string }).code || ""
  const msg = (error.message || "").toLowerCase()
  const alreadyExists =
    code === "email_exists" ||
    status === 422 ||
    msg.includes("already been registered") ||
    msg.includes("already registered") ||
    msg.includes("already exists")
  if (alreadyExists) return // membresía queda activa; no se reenvía invitación

  // Otro error (rate limit / SMTP) → reintentable (marca failed arriba).
  throw new Error(`invite:${code || status || "error"}`)
}
