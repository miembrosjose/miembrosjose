// API pública (autenticada) — retorna todos overrides de site_texts.
// Usado no boot da area de membros pra aplicar textos editados pelo admin.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data, error } = await supabase.from("site_texts").select("key, value")
  if (error) {
    console.error("[/api/site-texts]", error)
    return NextResponse.json({ overrides: {} })
  }

  const overrides: Record<string, string> = {}
  for (const row of data || []) {
    overrides[row.key] = row.value
  }
  return NextResponse.json({ overrides })
}
