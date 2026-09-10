// GET /api/transmission-categories
// Categorías editoriales de Transmisiones (data-driven). Lectura por RLS
// (miembros autenticados ven activas). Degrada a [] si la tabla no existe aún.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from("transmission_categories")
      .select("slug, name, description, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
    if (error) return NextResponse.json({ categories: [] })
    return NextResponse.json({ categories: data || [] })
  } catch {
    return NextResponse.json({ categories: [] })
  }
}
