// GET /api/meditations/[id]/state
// Estado para el reproductor: acceso, precio REAL (desde Supabase), y si el
// usuario ya tiene acceso (incluida con membresía, o premium comprada).

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getServerMeditation } from "@/lib/meditations"
import { getMembership, hasPremiumEntitlement } from "@/lib/membership"

export const dynamic = "force-dynamic"

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await getSupabaseServer()
  const membership = await getMembership(supabase)
  if (!membership.authenticated) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }

  const med = await getServerMeditation(id)
  if (!med) return NextResponse.json({ error: "not_found" }, { status: 404 })

  let owned = false
  if (med.accessType === "included") {
    owned = membership.active
  } else {
    owned = membership.active && (await hasPremiumEntitlement(supabase, membership.userId!, id))
  }

  return NextResponse.json({
    id: med.id,
    access_type: med.accessType,
    title: med.title,
    subtitle: med.subtitle,
    price_cents: med.priceCents,
    currency: med.currency,
    purchasable: med.isPurchasable,
    membership_active: membership.active,
    owned,
  })
}
