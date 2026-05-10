import { headers } from "next/headers"
import { getCheckoutRegion } from "@/lib/checkout-configs"
import type { GeoData } from "@/lib/geo-types"

const REGION_CURRENCY: Record<string, string> = {
  DEFAULT: "USD",
  USD:     "USD",
  EUR:     "EUR",
  GBP:     "GBP",
  CHF:     "CHF",
}

export async function getGeoData(): Promise<GeoData> {
  const h = await headers()
  const country = (h.get("cf-ipcountry") || "").toUpperCase().replace("XX", "")
  const region  = country ? getCheckoutRegion(country) : "DEFAULT"
  return {
    country,
    ip:       h.get("cf-connecting-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
    // city/state/zip vêm do middleware via request.cf (Cloudflare Workers).
    // No Pages legacy esses headers não existem → ficam vazios (degrada graciosamente).
    city:     h.get("x-geo-city")  || "",
    state:    h.get("x-geo-state") || "",
    zip:      h.get("x-geo-zip")   || "",
    currency: REGION_CURRENCY[region] ?? "USD",
    region,
  }
}
