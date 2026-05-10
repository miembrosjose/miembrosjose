// POST /api/account/logout
// Encerra sessão Supabase Auth + redireciona pra /login.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await getSupabaseServer()
  await supabase.auth.signOut()
  return NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_MIEMBROS_URL || "https://miembros.SEU_DOMINIO.com"),
    { status: 303 } // 303 = "See Other" — força GET no redirect (POST → GET)
  )
}
