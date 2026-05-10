// Loader server-side dos configs do checkout.
// Tenta buscar do Supabase primeiro; se falhar, usa o config hardcoded como fallback.

import { CHECKOUT_CONFIGS, type CheckoutConfig, type CheckoutRegion } from "./checkout-configs"

/**
 * Carrega o config da região direto do Supabase (server-side, runtime edge).
 * Falha silenciosa: se Supabase indisponível ou não tiver dados, retorna o hardcoded.
 *
 * Cache de 5s no servidor (via Next fetch revalidate) — edição no dashboard
 * aparece em até 5s no checkout sem precisar de redeploy.
 */
export async function loadCheckoutConfig(region: CheckoutRegion): Promise<CheckoutConfig> {
  const fallback = CHECKOUT_CONFIGS[region]

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return fallback

  try {
    const res = await fetch(
      `${url}/rest/v1/checkout_config?region=eq.${region}&select=config`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        next: { revalidate: 5 },
      }
    )
    if (!res.ok) return fallback

    const rows = (await res.json()) as Array<{ config: CheckoutConfig }>
    if (!rows.length || !rows[0].config) return fallback

    // Merge defensivo: o config do DB sobrescreve o hardcoded, mas se faltar
    // algum campo (ex: novo field adicionado), usa o do hardcoded
    return { ...fallback, ...rows[0].config }
  } catch {
    return fallback
  }
}
