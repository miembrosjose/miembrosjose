// API — troca de senha do user.
//
// POST /api/profile/change-password
//   Body: { current_password: string, new_password: string }
//   1. Valida senha atual fazendo signInWithPassword (não cria nova sessão,
//      só verifica que credentials batem)
//   2. Se OK, chama updateUser({ password }) na sessão atual
//   3. Erro: 401 se senha atual errada, 400 se nova senha curta

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const MIN_PASSWORD_LENGTH = 8

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  let body: { current_password?: string; new_password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const currentPassword = body.current_password || ""
  const newPassword = body.new_password || ""

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` },
      { status: 400 }
    )
  }
  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "La nueva contraseña debe ser diferente de la actual" },
      { status: 400 }
    )
  }

  // 1. Valida senha atual usando client SEPARADO sem cookies (não cria nova
  //    sessão na request atual). Usa credenciais isoladas pra confirmar
  //    que a current_password está correta.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const validateClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error: signInError } = await validateClient.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (signInError) {
    return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 401 })
  }

  // 2. Atualiza pra nova senha (na sessão original do user)
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (updateError) {
    console.error("[/api/profile/change-password] updateUser error:", updateError)
    return NextResponse.json({ error: "Error al actualizar contraseña" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
