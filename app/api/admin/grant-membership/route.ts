// API admin — libera acesso à área de membros pra alguém manualmente
// (uso típico: cliente pagou via Wise/transferência, fora do Stripe).
//
// POST /api/admin/grant-membership
//   Body: { email: string, name?: string, phone?: string, send_email?: boolean }
//
// Faz tudo de uma vez:
//   1. Insert em stripe_sales com sale_type='front' (libera membership real)
//   2. Cria/atualiza account_invite (token único 7 dias)
//   3. Manda email Resend "Tu acceso a Los 144000 está listo" (se send_email=true)
//
// Idempotente: se conta já existe, pula invite (cliente loga normal). Se invite
// pendente, regenera token + reenvia email.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"
import { createOrRefreshInvite } from "@/lib/account-invites"
import { sendAccountInviteEmail } from "@/lib/email/account-invite"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { email?: string; name?: string; phone?: string; send_email?: boolean }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = (body.email || "").trim().toLowerCase()
  const name = (body.name || "").trim() || null
  const phone = (body.phone || "").trim() || null
  const sendEmail = body.send_email !== false // default true

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const fakePiId = `manual_membership_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  // 1. Limpa revoked_products dessa key (se cliente foi banido antes e agora
  //    voltou — admin pode ter mudado de ideia/cliente recomprou).
  //    Silent fail — se der erro, o INSERT abaixo ainda concede acesso.
  try {
    await admin
      .from("revoked_products")
      .delete()
      .eq("customer_email", email)
      .eq("product_key", "front")
  } catch {
    // ignora
  }

  // 1b. Lookup user_id existente pelo email (caso conta já exista).
  // Se não existir ainda, fica NULL e trigger SQL `on_invite_used_link_sale`
  // vincula quando user usar invite + criar conta.
  let existingUserId: string | null = null
  try {
    const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const matched = listed?.users?.find((u) => u.email?.toLowerCase() === email)
    existingUserId = matched?.id ?? null
  } catch {
    // ignora — fica NULL
  }

  // 2. Insert stripe_sales com sale_type='front' — libera o acesso à
  //    membership na home dos /miembros. items=[{key:"front"}] não inclui
  //    bumps; pra liberar bumps tb, use /api/admin/grant-product depois.
  const { error: insertErr } = await admin.from("stripe_sales").insert({
    stripe_session_id: null,
    stripe_payment_intent_id: fakePiId,
    stripe_customer_id: null,
    sale_type: "front",
    region: "MANUAL",
    items: [{ key: "front", name: "Los 144000", price: 0, qty: 1 }],
    amount_total: 0,
    currency: "usd",
    customer_email: email,
    customer_name: name,
    customer_phone: phone,
    customer_country: null,
    user_id: existingUserId,
    utm: { source: "admin_grant_membership", granted_by: user.email },
    status: "paid",
  })

  if (insertErr) {
    console.error("[/api/admin/grant-membership] insert error:", insertErr)
    return NextResponse.json(
      { error: "Database error: " + insertErr.message },
      { status: 500 },
    )
  }

  // 3. Cria/atualiza invite + manda email se solicitado
  let emailStatus: "sent" | "skipped_account_exists" | "error" | "not_requested" = "not_requested"
  let emailError: string | null = null

  if (sendEmail) {
    try {
      const result = await createOrRefreshInvite({
        email,
        stripePaymentIntentId: fakePiId,
        customerName: name,
        customerPhone: phone,
      })

      if (result.skipped) {
        emailStatus = "skipped_account_exists"
      } else {
        const sent = await sendAccountInviteEmail(result.invite, {
          source: "manual_grant",
          sourceRef: fakePiId,
        })
        if (sent.ok) {
          emailStatus = "sent"
        } else {
          emailStatus = "error"
          emailError = sent.error || "Resend send failed"
        }
      }
    } catch (e) {
      emailStatus = "error"
      emailError = e instanceof Error ? e.message : "invite/email failed"
    }
  }

  return NextResponse.json({
    ok: true,
    email,
    sale_inserted: true,
    email_status: emailStatus,
    email_error: emailError,
    granted_by: user.email,
  })
}
