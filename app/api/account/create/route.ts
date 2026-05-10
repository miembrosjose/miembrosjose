// POST /api/account/create
// Body: { token, password }
// Cria usuário no Supabase Auth + marca invite como usado.

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getInviteByToken, markInviteUsed } from "@/lib/account-invites"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

const MIN_PASSWORD_LENGTH = 8

export async function POST(req: NextRequest) {
  let body: { token?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 })
  }

  const token = (body.token || "").trim()
  const password = body.password || ""

  if (!token) return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 })
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ ok: false, error: "password_too_short" }, { status: 400 })
  }

  // Valida token (não expirado, não usado)
  const invite = await getInviteByToken(token)
  if (!invite) {
    return NextResponse.json({ ok: false, error: "invalid_or_expired" }, { status: 404 })
  }

  // Cria usuário no Supabase Auth (email já confirmado — Stripe garantiu)
  const supabase = getSupabaseAdmin()
  const { data, error: createErr } = await supabase.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    user_metadata: {
      name: invite.customer_name ?? null,
      phone: invite.customer_phone ?? null,
      stripe_customer_id: invite.stripe_customer_id ?? null,
    },
  })

  if (createErr) {
    // Log COMPLETO pra debug — antes era opaco e usuario só via "Algo salió mal"
    console.error("[account/create] createUser FAILED", {
      email: invite.email,
      error_message: createErr.message,
      error_code: createErr.code,
      error_status: (createErr as { status?: number }).status,
      invite_id: invite.id,
    })

    // Email já existe → conta criada por outra via, marca invite usado pra evitar reuso
    if (createErr.message?.toLowerCase().includes("already") || createErr.code === "email_exists") {
      await markInviteUsed(invite.id).catch(() => {})
      return NextResponse.json({ ok: false, error: "account_already_exists" }, { status: 409 })
    }

    // Detecção comum: trigger SQL falhou ao rodar (ex: column user_id not found
    // se migration nao foi rodada, ou outro erro de db). Retorna mensagem clara.
    const lowerMsg = (createErr.message || "").toLowerCase()
    if (lowerMsg.includes("database error") || lowerMsg.includes("relation") || lowerMsg.includes("column") || lowerMsg.includes("trigger")) {
      return NextResponse.json({
        ok: false,
        error: "database_error",
        debug: createErr.message, // pra admin ver no DevTools
      }, { status: 500 })
    }

    return NextResponse.json({ ok: false, error: createErr.message }, { status: 500 })
  }

  // Marca token como usado (uma vez só) E vincula ao novo user_id.
  // O used_by_user_id dispara trigger SQL `on_invite_used_link_sale` pra
  // vincular stripe_sales daquele payment_intent ao user.
  try {
    await markInviteUsed(invite.id, data.user?.id)
  } catch (e) {
    // Conta foi criada mas marcação falhou — log e segue.
    // markInviteUsed é idempotente (.is("used_at", null) protege).
    console.warn(`[account/create] failed to mark invite ${invite.id} as used:`, e)
  }

  return NextResponse.json({ ok: true, user_id: data.user?.id ?? null })
}
