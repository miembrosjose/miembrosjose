// GET /auth/confirm  — confirmación de enlaces de email de Supabase (SSR).
//
// Patrón oficial de Supabase para Next.js SSR (cookies): el email de
// recuperación enlaza a esta ruta con ?token_hash=...&type=recovery&next=...
// Aquí se verifica el token con verifyOtp, se establece la sesión en cookies
// (cliente server-side existente) y se redirige a la pantalla `next` (interna).
//
// IMPORTANTE: se usa redirect() de next/navigation (NO NextResponse.redirect),
// porque redirect() sí adjunta a la respuesta las cookies de sesión que setea
// verifyOtp. Con NextResponse.redirect las cookies no viajan y el navegador
// no recibe la sesión → "Link inválido" en la pantalla de nueva contraseña.
//
// Nunca expone tokens ni errores internos: ante cualquier fallo redirige a la
// pantalla de destino con ?error para que muestre un mensaje humano.

import { type NextRequest } from "next/server"
import { redirect } from "next/navigation"
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
  const { searchParams } = new URL(req.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = safeNext(searchParams.get("next"))

  let verified = false
  // Solo aceptamos recovery en este flujo.
  if (tokenHash && type === "recovery") {
    const supabase = await getSupabaseServer()
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    verified = !error
  }

  // redirect() de next/navigation lanza NEXT_REDIRECT (control de flujo) y
  // adjunta las cookies de sesión establecidas por verifyOtp.
  if (verified) {
    redirect(next)
  }

  const sep = next.includes("?") ? "&" : "?"
  redirect(`${next}${sep}error=invalid_link`)
}
