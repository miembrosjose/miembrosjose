// API — produtos comprados pelo user (bumps + upsells).
//
// GET /api/profile/owned-products
//   Query stripe_sales WHERE user_id = auth.uid() AND status = 'paid'.
//   Agrega items[].key de TODAS as vendas (front + upsells + standalone).
//   Combo: items[] já vem com keys individuais (creativos+andromeda+analytics
//   em 1 só items[]) — ownership cobre todos automaticamente.
//   Downsell: keys vem com sufixo `__downsell` no banco (pra reports). A gente
//   strip o sufixo aqui pra ownership tratar igual ao produto base.
//
// IMPORTANTE: filter é por user_id (não customer_email). Antes era por email
// e isso causava bug — quando admin criava user manual com email que tinha
// testes antigos, agregava tudo dos testes. Migration adicionou stripe_sales.user_id
// + triggers SQL pra vincular sales aos users via account_invites.
//
// Retorna:
//   { product_keys: ["creativos", "andromeda"], front: true }
//
// Auth: cookie Supabase (subdomínio miembros.SEU_DOMINIO.com).

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

// Keys válidas que batem com produtos da Tienda Premium + Bonuses do prototipo.
// Outras keys (ex: "front", "front_oficial", futuros produtos) ficam de fora
// pra evitar lixar a UI com IDs internos.
const PRODUCT_KEYS = new Set([
  "creativos",
  "andromeda",
  "analytics",
  "revisao",
  "minivsl",
  "bonus-ganchos",   // Bonus desbloqueado via auto-grant (comentário em post BONO)
])

type SaleRow = {
  items: Array<{ key: string; name?: string; price?: number; qty?: number }> | null
  expires_at: string | null
}

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  // stripe_sales tem RLS desabilitado mas grants pro role authenticated podem
  // não estar setados — usa admin client (service_role) e filtra por user_id.
  // Service role é privado server-side (nunca chega no browser).
  // revoked_products continua filtrando por email (não tem user_id)
  const admin = getSupabaseAdmin()
  const email = user.email.toLowerCase()

  const [{ data, error }, { data: revoked }] = await Promise.all([
    admin.from("stripe_sales").select("items, expires_at").eq("user_id", user.id).eq("status", "paid"),
    admin.from("revoked_products").select("product_key").eq("customer_email", email),
  ])

  if (error) {
    console.error("[/api/profile/owned-products] query error:", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  // Set de keys revogadas (manual + refund automático Stripe/Hotmart)
  const revokedKeys = new Set<string>((revoked || []).map((r) => (r as { product_key: string }).product_key))

  const ownedKeys = new Set<string>()
  let hasFront = false
  let frontExpiresAt: string | null = null
  const now = Date.now()

  for (const row of (data || []) as SaleRow[]) {
    // Determina se esse sale tem o front. Se sim, valida expires_at.
    // Pra outros produtos (bumps/upsells), expires_at é ignorado — permanente.
    const saleHasFront = (row.items || []).some(
      (it) => it?.key && it.key.replace(/__downsell$/, "") === "front",
    )

    if (saleHasFront) {
      // Sale do front válido = expires_at NULL (permanente, ex: pré-migration)
      // OU expires_at no futuro
      const expiresAtMs = row.expires_at ? new Date(row.expires_at).getTime() : null
      const isValid = expiresAtMs === null || expiresAtMs > now
      if (isValid && !revokedKeys.has("front")) {
        hasFront = true
        // Guarda a expiração mais distante (caso o user tenha múltiplos sales,
        // ex: comprou + admin liberou de novo) — vale a maior.
        if (row.expires_at) {
          if (!frontExpiresAt || new Date(row.expires_at).getTime() > new Date(frontExpiresAt).getTime()) {
            frontExpiresAt = row.expires_at
          }
        }
      }
    }

    for (const it of row.items || []) {
      if (!it?.key) continue
      const cleanKey = it.key.replace(/__downsell$/, "")
      if (revokedKeys.has(cleanKey)) continue   // Pula keys revogadas
      if (cleanKey === "front") continue        // Já tratado acima com expires_at
      if (PRODUCT_KEYS.has(cleanKey)) ownedKeys.add(cleanKey)
    }
  }

  return NextResponse.json({
    product_keys: Array.from(ownedKeys),
    front: hasFront,
    front_expires_at: frontExpiresAt,
  })
}
