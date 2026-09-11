// GET /api/transmission-categories
// Categorías editoriales de Transmisiones (data-driven) + estado de bloqueo
// para el usuario actual (paywall). Degrada a [] si la tabla no existe aún.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getCategoryAccess, isCategoryLocked } from "@/lib/transmissions-access"

export const dynamic = "force-dynamic"

type CatRow = {
  slug: string
  name: string
  description: string | null
  sort_order: number
  is_locked?: boolean | null
  unlock_url?: string | null
  price_usd?: number | null
}

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  // Intenta con columnas de paywall; si no existen, cae a selección básica.
  let rows: CatRow[] = []
  let hasLockCols = true
  {
    const { data, error } = await supabase
      .from("transmission_categories")
      .select("slug, name, description, sort_order, is_locked, unlock_url, price_usd")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
    if (error) {
      hasLockCols = false
    } else {
      rows = (data as CatRow[]) || []
    }
  }
  if (!hasLockCols) {
    const { data, error } = await supabase
      .from("transmission_categories")
      .select("slug, name, description, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
    if (error) return NextResponse.json({ categories: [] })
    rows = (data as CatRow[]) || []
  }

  const access = await getCategoryAccess(supabase, user.id)

  const categories = rows.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description ?? null,
    sort_order: c.sort_order,
    locked: isCategoryLocked(c.slug, c.is_locked === true, access),
    unlock_url: c.unlock_url ?? null,
    price_usd: c.price_usd ?? null,
  }))

  return NextResponse.json({ categories })
}
