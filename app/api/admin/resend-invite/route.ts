// API admin — reenvia email de invite/login pra cliente que não recebeu.
//
// Uso típico: cliente pagou (Stripe ou Hotmart) e webhook falhou silenciosamente
// (Resend down, exception transitória, etc). Em vez de liberar tudo manualmente
// via /grant-membership, esse endpoint só reenvia o email.
//
// POST /api/admin/resend-invite
//   Body: { email: string }
//
// Lógica:
//   - Se cliente JÁ tem conta no Auth → manda email "compra aprobada, login con
//     tu cuenta existente" (sendAccountExistsEmail)
//   - Se tem invite não usado → regenera token + manda email de criação de conta
//   - Se não tem nem conta nem invite → erro (provavelmente venda não existe)

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"
import { createOrRefreshInvite } from "@/lib/account-invites"
import { sendAccountInviteEmail, sendAccountExistsEmail } from "@/lib/email/account-invite"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { email?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = (body.email || "").trim().toLowerCase()
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Tenta criar/refrescar invite. Se já existe conta, retorna { skipped: true }
  // — nesse caso mandamos email de login. Caso contrário, manda invite novo.
  const fakePiId = `resend_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  // Pega o nome do cliente da venda mais recente (stripe_sales) pra personalizar email
  let customerName: string | null = null
  let customerPhone: string | null = null
  try {
    const { data: sale } = await admin
      .from("stripe_sales")
      .select("customer_name, customer_phone")
      .eq("customer_email", email)
      .limit(1)
      .single()
    if (sale) {
      customerName = (sale as { customer_name?: string | null }).customer_name ?? null
      customerPhone = (sale as { customer_phone?: string | null }).customer_phone ?? null
    }
  } catch {
    // ok — cliente pode não ter venda (admin tá liberando antes da venda)
  }

  try {
    const result = await createOrRefreshInvite({
      email,
      stripePaymentIntentId: fakePiId,
      stripeCustomerId: null,
      customerName,
      customerPhone,
    })

    if (result.skipped) {
      // Cliente já tem conta — manda email de login
      const sent = await sendAccountExistsEmail({
        email,
        customerName: result.customerName,
        source: "admin_resend",
        sourceRef: fakePiId,
      })
      if (!sent.ok) {
        return NextResponse.json(
          { error: `Falha ao enviar email: ${sent.error}` },
          { status: 500 }
        )
      }
      return NextResponse.json({
        ok: true,
        type: "account_exists",
        message: "Email de login enviado (cliente já tem conta)",
      })
    }

    // Invite novo/regenerado — manda email de criação de conta
    const sent = await sendAccountInviteEmail(result.invite, {
      source: "admin_resend",
      sourceRef: fakePiId,
    })
    if (!sent.ok) {
      return NextResponse.json(
        { error: `Falha ao enviar email: ${sent.error}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      type: "invite",
      invite_id: result.invite.id,
      resend_count: result.invite.resend_count,
      message: "Email de invite enviado",
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown"
    console.error("[resend-invite] erro:", msg, e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
