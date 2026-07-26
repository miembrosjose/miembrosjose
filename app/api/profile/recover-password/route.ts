// API — solicita reset de senha via email.
//
// POST /api/profile/recover-password
//   Body: { email: string }
//   Chama supabase.auth.resetPasswordForEmail — Supabase envia email com
//   link pra /miembros/cuenta/recuperar?access_token=...&type=recovery
//
// Não autentica (público — qualquer um pode pedir reset pra qualquer email).
// Retorna 200 sempre (mesmo se email não existir) — anti enumeração.

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = (body.email || "").trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Redirect URL: página real donde el usuario define la nueva contraseña tras
  // hacer clic en el email. Debe estar permitida en Supabase → Authentication →
  // URL Configuration → Redirect URLs.
  const redirectTo = "https://los144000.com/miembros/cuenta/recuperar"

  // Anti-enumeração: ignora erro (resetPasswordForEmail não acusa email
  // inexistente — só retorna error se passar args invalidos). Sempre 200.
  await client.auth.resetPasswordForEmail(email, { redirectTo }).catch(() => {})

  return NextResponse.json({ ok: true })
}
