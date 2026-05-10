// Cron endpoint — varre vendas paid das ultimas 24h e libera acesso pra
// todo mundo que pagou mas nao recebeu email de invite.
//
// AUTOMATICO via pg_cron a cada 5 minutos. Roda independente de webhook
// (se webhook falhar por qualquer motivo, esse cron arruma em ate 5min).
//
// POST /api/cron/heal-invites
// Auth: header X-Cron-Secret == WHATSAPP_CRON_SECRET (reusa secret existente)
//
// Logica:
//   1. Lista stripe_sales (front, front_installment, standalone) paid nas
//      ultimas 24 horas com customer_email preenchido
//   2. Pra cada email unico, verifica account_invites.email_sent_at
//   3. Se invite nao existe OU email_sent_at NULL OU tem error → cria/regenera
//      invite + manda email (createOrRefreshInvite + sendAccountInviteEmail)
//   4. Idempotente: se ja foi enviado antes, retorna already_sent e pula
//   5. Loga cada cura em whatsapp_logs (event_type=heal_invite) pra auditoria

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { createOrRefreshInvite } from "@/lib/account-invites"
import { sendAccountInviteEmail, sendAccountExistsEmail } from "@/lib/email/account-invite"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret")
  const expected = process.env.WHATSAPP_CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: "WHATSAPP_CRON_SECRET nao configurado" }, { status: 500 })
  }
  if (cronSecret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // 1. Pega vendas recentes (front + front_installment + standalone) com email
  const { data: recentSales, error: salesErr } = await admin
    .from("stripe_sales")
    .select("id, sale_type, customer_email, customer_name, customer_phone, stripe_payment_intent_id, stripe_customer_id, created_at")
    .in("sale_type", ["front", "standalone", "front_installment"])
    .eq("status", "paid")
    .gte("created_at", cutoff24h)
    .not("customer_email", "is", null)

  if (salesErr) {
    console.error("[cron/heal-invites] query sales:", salesErr.message)
    return NextResponse.json({ error: "query_sales", message: salesErr.message }, { status: 500 })
  }

  const result = {
    scanned: recentSales?.length || 0,
    healed_invite: 0,
    healed_account_exists: 0,
    skipped_already_sent: 0,
    errors: [] as Array<{ email: string; error: string }>,
  }

  // Dedupe por email — cliente pode ter varias sales (parcelado), so 1 email
  const processed = new Set<string>()

  for (const sale of recentSales || []) {
    const email = (sale.customer_email || "").trim().toLowerCase()
    if (!email || processed.has(email)) continue
    processed.add(email)

    // CAMADA 1: invite com email_sent_at recente
    const { data: invite } = await admin
      .from("account_invites")
      .select("*")
      .eq("email", email)
      .maybeSingle()

    if (
      invite &&
      invite.email_sent_at &&
      !invite.email_error &&
      new Date(invite.expires_at).getTime() > Date.now()
    ) {
      result.skipped_already_sent++
      continue
    }

    // CAMADA 3: dedup adicional via whatsapp_logs — se cron ja disparou
    // QUALQUER email pra esse cliente (invite ou account_exists) nas ultimas
    // 24h, NAO repete. Cobre o edge case de user ja ter conta + invite
    // sem email_sent_at preenchido (cron mandaria account_exists toda hora).
    const cooldownAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentHeal } = await admin
      .from("whatsapp_logs")
      .select("id")
      .eq("event_type", "heal_invite")
      .eq("status", "sent")
      .eq("email", email)
      .gte("created_at", cooldownAgo)
      .limit(1)
    if (recentHeal && recentHeal.length > 0) {
      result.skipped_already_sent++
      continue
    }

    // Tenta criar/regenerar invite + enviar email
    try {
      const inviteResult = await createOrRefreshInvite({
        email,
        stripePaymentIntentId: sale.stripe_payment_intent_id || `heal_cron_${sale.id}`,
        stripeCustomerId: sale.stripe_customer_id || null,
        customerName: sale.customer_name || null,
        customerPhone: sale.customer_phone || null,
      })

      if (inviteResult.skipped && inviteResult.reason === "already_sent") {
        result.skipped_already_sent++
        continue
      }

      if (inviteResult.skipped && inviteResult.reason === "account_exists") {
        const sent = await sendAccountExistsEmail({
          email,
          customerName: inviteResult.customerName,
          source: "cron_heal_invites",
          sourceRef: sale.id,
        })
        if (!sent.ok) {
          result.errors.push({ email, error: `account_exists_email: ${sent.error}` })
          continue
        }
        result.healed_account_exists++
        // Log
        await admin.from("whatsapp_logs").insert({
          event_type: "heal_invite",
          status: "sent",
          email,
          details: { type: "account_exists", source: "cron_heal_invites", sale_id: sale.id },
        }).then(() => {}).catch(() => {})
        continue
      }

      if (!inviteResult.skipped) {
        const sent = await sendAccountInviteEmail(inviteResult.invite, {
          source: "cron_heal_invites",
          sourceRef: sale.id,
        })
        if (!sent.ok) {
          result.errors.push({ email, error: `invite_email: ${sent.error}` })
          continue
        }
        result.healed_invite++
        // Log
        await admin.from("whatsapp_logs").insert({
          event_type: "heal_invite",
          status: "sent",
          email,
          details: { type: "invite", source: "cron_heal_invites", sale_id: sale.id },
        }).then(() => {}).catch(() => {})
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown"
      result.errors.push({ email, error: msg })
      console.error(`[cron/heal-invites] ${email}:`, msg)
    }
  }

  console.log("[cron/heal-invites] result:", JSON.stringify(result))
  return NextResponse.json(result)
}
