import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Cliente Supabase com permissões de service_role para uso exclusivo em
 * API routes (server-side).
 *
 * Falha ruidosamente se SUPABASE_SERVICE_ROLE_KEY não estiver configurada
 * — evita fallback silencioso para ANON_KEY que, com RLS ativo, faria
 * inserts/updates falharem em silêncio.
 *
 * Nunca importe este módulo em Client Components — SERVICE_ROLE_KEY
 * jamais deve chegar ao browser.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurado")
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurado (obrigatório em server-side)")

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
