// PATCH  /api/lugares/[id] → admin modera (aprobar/destacar/ocultar/rechazar/editar)
// DELETE /api/lugares/[id] → admin elimina

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { concederInsignia } from "@/lib/conceder-insignia"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const STATUS = new Set(["published", "pending_review", "rejected", "hidden"])
const LEVEL = new Set(["official", "community", "pending", "featured"])

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await ctx.params

  let b: Record<string, unknown>
  try { b = await req.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof b.status === "string" && STATUS.has(b.status)) patch.status = b.status
  if (typeof b.authorityLevel === "string" && LEVEL.has(b.authorityLevel)) patch.authority_level = b.authorityLevel
  if (typeof b.category === "string") patch.category = b.category
  if (typeof b.shortDescription === "string") patch.short_description = b.shortDescription
  if (typeof b.longDescription === "string") patch.long_description = b.longDescription
  if (typeof b.visitRecommendations === "string") patch.visit_recommendations = b.visitRecommendations
  if (b.status === "published" || b.authorityLevel === "featured") {
    patch.approved_by = auth.user.email
    patch.approved_at = new Date().toISOString()
  }

  const admin = getSupabaseAdmin()
  const { data, error } = await admin.from("contact_places").update(patch).eq("id", id).select("*").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // FARO DEL TERRITORIO — al aprobar la aportación, quien la propuso recibe
  // su insignia. Se concede solo al publicar, no al editar un punto ya
  // publicado, y solo si hubo alguien detrás de la propuesta.
  if (b.status === "published" && data?.created_by_id) {
    await concederInsignia(data.created_by_id as string, "faro_territorio")
  }

  return NextResponse.json({ ok: true, place: data })
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await ctx.params
  const admin = getSupabaseAdmin()
  const { error } = await admin.from("contact_places").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
