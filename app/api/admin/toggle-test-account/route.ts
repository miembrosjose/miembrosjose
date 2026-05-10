// API admin — marca/desmarca conta como test account.
//
// POST /api/admin/toggle-test-account
//   Body: { email: string, is_test?: boolean (default true) }
//
// Ação: seta app_metadata.is_test_account = true|false do user com esse email.
// Filtros que respeitam essa flag:
//  - /api/leaderboard (ranking de members)
//  - (futuramente: top3 broadcast trigger SQL, online widget, miembros lista)
//
// Auth: admin only.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { email?: string; is_test?: boolean }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = (body.email || "").trim().toLowerCase()
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 })
  }
  const isTest = body.is_test !== false // default true

  const admin = getSupabaseAdmin()
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const target = (list?.users || []).find(
    (u) => (u.email || "").toLowerCase().trim() === email,
  )

  if (!target) {
    return NextResponse.json({ error: "User não encontrado", email }, { status: 404 })
  }

  const currentMeta = (target.app_metadata || {}) as Record<string, unknown>
  const newMeta = { ...currentMeta, is_test_account: isTest }

  const { error: updErr } = await admin.auth.admin.updateUserById(target.id, {
    app_metadata: newMeta,
  })
  if (updErr) {
    return NextResponse.json({ error: "update_failed", message: updErr.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    email,
    user_id: target.id,
    is_test_account: isTest,
    message: isTest
      ? `${email} marcado como conta de teste — removido do ranking`
      : `${email} desmarcado — voltou ao ranking`,
  })
}
