// GET /api/admin/ai-status
// Diagnóstico admin del Revelador con IA: dice si la clave está presente, qué
// modelo usa, y hace un ping mínimo a Anthropic para ver si responde. Nunca
// devuelve el valor de la clave.

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const key = process.env.ANTHROPIC_API_KEY || ""
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5"
  const hasKey = !!key

  const result: Record<string, unknown> = {
    hasKey,
    keyLength: key.length,
    keyPrefix: key ? key.slice(0, 7) : "",
    model,
  }

  if (!hasKey) {
    result.ping = "sin_clave"
    result.hint = "No hay ANTHROPIC_API_KEY en el Worker. Cárgala como SECRET (encriptada), no como Variable de texto plano — las Variables se borran en cada deploy."
    return NextResponse.json(result)
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 8, messages: [{ role: "user", content: "ping" }] }),
    })
    result.pingStatus = res.status
    if (res.ok) {
      result.ping = "ok"
    } else {
      const txt = await res.text().catch(() => "")
      result.ping = "error_proveedor"
      result.error = txt.slice(0, 400)
    }
  } catch (e) {
    result.ping = "excepcion"
    result.error = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(result)
}
