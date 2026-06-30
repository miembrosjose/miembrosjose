// Helper de checagem de admin em rotas /api/admin/*.
// Retorna o user se for admin, OU uma NextResponse com erro 401/403.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export type AdminUser = {
  id: string
  email: string
  is_admin: true
}

export async function requireAdmin(): Promise<
  { ok: true; user: AdminUser } | { ok: false; response: NextResponse }
> {
  const supabase = await getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, email")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Acesso negado" }, { status: 403 }),
    }
  }

  return {
    ok: true,
    user: { id: user.id, email: profile.email, is_admin: true },
  }
}
