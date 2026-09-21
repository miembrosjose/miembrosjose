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
    .maybeSingle()

  // La plataforma tiene DOS marcas de administrador y hasta ahora cada ruta
  // miraba solo una: este helper miraba profiles.is_admin, mientras que el
  // panel y rutas como grant-topo miran app_metadata.is_admin. Con una sola de
  // las dos puesta, el administrador veía la pestaña pero recibía 403 al
  // pulsar cualquier botón.
  //
  // Se aceptan ambas porque ambas son de confianza: app_metadata solo lo
  // escribe service_role, y profiles.is_admin quedó protegido al revocar
  // UPDATE sobre profiles a `authenticated`. Ninguna es editable por su dueño.
  const porPerfil = profile?.is_admin === true
  const porMetadata = (user.app_metadata as { is_admin?: boolean } | null)?.is_admin === true

  if (!porPerfil && !porMetadata) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Acesso negado" }, { status: 403 }),
    }
  }

  return {
    ok: true,
    user: { id: user.id, email: profile?.email ?? user.email ?? "", is_admin: true },
  }
}
