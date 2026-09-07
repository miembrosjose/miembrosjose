// GET  /api/lugares → lugares publicados (+ pendientes/ocultos si admin)
// POST /api/lugares → un usuario autenticado envía un punto (queda pendiente)

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(r: any) {
  return {
    id: r.id, name: r.name, slug: r.slug ?? "", country: r.country ?? "",
    region: r.region ?? undefined, city: r.city ?? undefined,
    latitude: r.latitude, longitude: r.longitude,
    category: r.category, authorityLevel: r.authority_level, status: r.status,
    shortDescription: r.short_description ?? "", longDescription: r.long_description ?? undefined,
    memoryType: r.memory_type ?? undefined, contactRelation: undefined,
    visitRecommendations: r.visit_recommendations ?? undefined, suggestedPractice: r.suggested_practice ?? undefined,
    tags: r.tags ?? [], images: r.images ?? [], videos: r.videos ?? [],
    createdBy: r.created_by ?? undefined, createdAt: r.created_at, updatedAt: r.updated_at,
    approvedBy: r.approved_by ?? undefined, approvedAt: r.approved_at ?? undefined,
  }
}

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user?.id ?? null
  let adminUser = false
  if (uid) {
    const { data } = await supabase.from("profiles").select("is_admin").eq("id", uid).single()
    adminUser = !!data?.is_admin
  }

  const admin = getSupabaseAdmin()
  let query = admin.from("contact_places").select("*").order("created_at", { ascending: true })
  // Admin ve todo; un usuario ve lo publicado + sus propios envíos.
  if (!adminUser) {
    query = uid ? query.or(`status.eq.published,created_by_id.eq.${uid}`) : query.eq("status", "published")
  }
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const places = (data ?? []).map((r) => ({ ...mapRow(r), mine: !!uid && r.created_by_id === uid }))
  return NextResponse.json({ places, isAdmin: adminUser })
}

export async function POST(req: Request) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  let b: Record<string, unknown>
  try { b = await req.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  const name = String(b.name || "").trim()
  const country = String(b.country || "").trim()
  const shortDescription = String(b.shortDescription || "").trim()
  if (name.length < 2 || country.length < 2 || shortDescription.length < 4) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
  }
  const slug = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

  const admin = getSupabaseAdmin()
  const { data, error } = await admin.from("contact_places").insert({
    name, slug, country,
    region: b.region ? String(b.region) : null,
    city: b.city ? String(b.city) : null,
    latitude: typeof b.latitude === "number" ? b.latitude : null,
    longitude: typeof b.longitude === "number" ? b.longitude : null,
    category: String(b.category || "comunitario"),
    authority_level: "pending", status: "pending_review",
    short_description: shortDescription,
    long_description: b.longDescription ? String(b.longDescription) : null,
    memory_type: b.memoryType ? String(b.memoryType) : null,
    visit_recommendations: b.visitRecommendations ? String(b.visitRecommendations) : null,
    tags: Array.isArray(b.tags) ? (b.tags as unknown[]).map(String).slice(0, 20) : [],
    created_by: user.email || "Comunidad", created_by_id: user.id,
  }).select("*").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ place: mapRow(data) })
}
