// GET /api/user/product-access → lista de product_ids que o user tem acesso

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (profile?.is_admin) {
    const { data: all } = await supabase.from("products").select("id")
    return NextResponse.json({
      product_ids: (all ?? []).map((p) => p.id),
      is_admin_override: true,
    })
  }

  const { data, error } = await supabase
    .from("user_product_access")
    .select("product_id")
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    product_ids: (data ?? []).map((r) => r.product_id),
    is_admin_override: false,
  })
}
