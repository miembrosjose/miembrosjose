// Server-side Supabase client com cookies do Next.js Server Components.
// Usado em pages/layouts pra ler a sessão do user atual via cookies httpOnly.
//
// Cookie domain: ".SEU_DOMINIO.com" (com ponto inicial) — válido em
// SEU_DOMINIO.com E miembros.SEU_DOMINIO.com. Login em qualquer subdomínio
// é reconhecido em ambos.

import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

// los144000.com es un dominio único (sin subdominio miembros.*), así que las
// cookies de sesión deben ser host-only. Un domain explícito que no sea sufijo
// del host haría que el navegador RECHACE las cookies que setea el servidor
// (p. ej. en /auth/confirm), rompiendo la sesión SSR.
const COOKIE_DOMAIN: string | undefined = undefined

export async function getSupabaseServer() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurado")
  if (!anonKey) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY não configurado")

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const opts: CookieOptions = COOKIE_DOMAIN
              ? { ...options, domain: COOKIE_DOMAIN }
              : options
            cookieStore.set(name, value, opts)
          })
        } catch {
          // Server Component não pode setar cookies — middleware faz isso.
          // Silencia pra não quebrar render.
        }
      },
    },
  })
}
