import { createBrowserClient } from "@supabase/ssr"

export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurado")
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY não configurado")

  return createBrowserClient(url, key)
}
