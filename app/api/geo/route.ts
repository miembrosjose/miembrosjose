// Endpoint público de geolocalização — retorna dados completos via Cloudflare Workers
// (request.cf injetado como headers pelo middleware: city/state/zip + cf-ipcountry/cf-connecting-ip).
//
// Uso típico: script no GTM faz fetch nesse endpoint, popula window.cfGeo, dispara
// evento geolocationDataReady no dataLayer e salva em localStorage pra reuso futuro.
//
// CORS liberado pra qualquer origem — endpoint só retorna dados que o próprio Cloudflare
// já expõe ao cliente. Sem PII sensível.

import { NextResponse } from "next/server"
import { getGeoData } from "@/lib/geo-server"

export const dynamic = "force-dynamic"

export async function GET() {
  const geo = await getGeoData()
  return NextResponse.json(
    {
      ip:      geo.ip,
      city:    geo.city,
      postal:  geo.zip,
      region:  geo.state,
      country: geo.country,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "private, no-cache, no-store, max-age=0",
      },
    }
  )
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
