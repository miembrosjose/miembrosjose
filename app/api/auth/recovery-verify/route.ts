// POST /api/auth/recovery-verify
//
// Segundo paso del flujo de recuperación (a prueba de escáneres de email).
// El enlace del correo abre una página intermedia (GET, no consume el token);
// SOLO cuando la persona pulsa "Continuar" se envía este POST, que ejecuta
// verifyOtp. Así los escáneres de Gmail/Outlook (que hacen GET) no consumen el
// token de un solo uso.
//
// Copia EXPLÍCITAMENTE las cookies de sesión creadas por verifyOtp a la MISMA
// respuesta de redirección (patrón @supabase/ssr con getAll/setAll). Añade
// Cache-Control: private, no-store. Nunca registra el token_hash.

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { EmailOtpType } from "@supabase/supabase-js"

const DEFAULT_NEXT = "/miembros/cuenta/recuperar"

// Solo rutas internas: empieza con "/", no "//", sin esquema/host. Evita open redirect.
function safeNext(next: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return DEFAULT_NEXT
  if (next.includes("://") || next.includes("\\")) return DEFAULT_NEXT
  return next
}

function noStore(res: NextResponse): NextResponse {
  res.headers.set("Cache-Control", "private, no-store")
  return res
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  const tokenHash = form ? String(form.get("token_hash") || "") : ""
  const type = (form ? String(form.get("type") || "") : "") as EmailOtpType
  const next = safeNext(form ? String(form.get("next") || "") : "")
  const origin = req.nextUrl.origin

  const failDest = new URL(next, origin)
  failDest.searchParams.set("error", "invalid_link")

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // ── POR QUÉ MÁS DE UN TIPO ────────────────────────────────────────────
  // Esto solo aceptaba "recovery", y por eso la protección contra escáneres
  // servía para las contraseñas olvidadas y no para las invitaciones — que
  // se gastan igual, y de hecho fue una invitación gastada la que dejó a una
  // persona fuera el 6 de noviembre de 2026.
  //
  // La lista es explícita a propósito: `verifyOtp` acepta tipos que aquí no
  // pintan nada, como el cambio de correo, y dejar pasar cualquier cosa que
  // venga en la URL sería dejar que la elija quien manda el enlace.
  const ACEPTADOS: EmailOtpType[] = ["recovery", "invite", "magiclink", "signup"]

  if (!url || !anon || !tokenHash || !ACEPTADOS.includes(type)) {
    return noStore(NextResponse.redirect(failDest, { status: 303 }))
  }

  // Respuesta de redirección a la pantalla de nueva contraseña. Las cookies de
  // sesión se escriben AQUÍ mismo (setAll copia a esta respuesta).
  const dest = new URL(next, origin)
  const response = NextResponse.redirect(dest, { status: 303 })

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })

  if (error) {
    // No revelamos detalle ni el token; mensaje humano en la pantalla destino.
    console.error("[recovery-verify] verifyOtp failed")
    return noStore(NextResponse.redirect(failDest, { status: 303 }))
  }

  return noStore(response)
}
