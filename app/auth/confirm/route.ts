// GET /auth/confirm  — confirmación de enlaces de email de Supabase (SSR).
//
// Patrón oficial de Supabase para Next.js SSR (cookies): el email de
// recuperación enlaza a esta ruta con ?token_hash=...&type=recovery&next=...
// Aquí se verifica el token con verifyOtp, se establece la sesión en cookies
// (cliente server-side existente) y se redirige a la pantalla `next` (interna).
//
// Nunca expone tokens ni errores internos: ante cualquier fallo redirige a la
// pantalla de destino con ?error para que muestre un mensaje humano.

import { type NextRequest, NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { getSupabaseServer } from "@/lib/supabase/server"

// Pantalla real donde el usuario crea la nueva contraseña.
const DEFAULT_NEXT = "/miembros/cuenta/recuperar"

// Solo rutas internas: debe empezar con "/", no ser "//" ni traer esquema/host.
// Evita open redirect a dominios externos.
function safeNext(next: string | null): string {
  if (!next) return DEFAULT_NEXT
  if (!next.startsWith("/")) return DEFAULT_NEXT
  if (next.startsWith("//")) return DEFAULT_NEXT
  if (next.includes("://") || next.includes("\\")) return DEFAULT_NEXT
  return next
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = safeNext(searchParams.get("next"))

  const dest = new URL(next, origin)

  // Solo aceptamos recovery en este flujo.
  if (!tokenHash || type !== "recovery") {
    dest.searchParams.set("error", "invalid_link")
    return NextResponse.redirect(dest)
  }

  const supabase = await getSupabaseServer()
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })

  if (error) {
    // No revelamos el detalle del error; la pantalla muestra un mensaje humano.
    dest.searchParams.set("error", "invalid_link")
    return NextResponse.redirect(dest)
  }

  // Sesión de recuperación establecida en cookies → a la pantalla de contraseña.
  return NextResponse.redirect(dest)
}
