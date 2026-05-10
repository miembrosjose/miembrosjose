// GET /api/account/validate-token?token=XXX
// Valida token de invite. Retorna email + status sem expor outros dados sensíveis.

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getInviteByToken } from "@/lib/account-invites"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim() || ""
  if (!token) {
    return NextResponse.json({ valid: false, reason: "missing_token" }, { status: 400 })
  }

  const invite = await getInviteByToken(token)
  if (!invite) {
    return NextResponse.json({ valid: false, reason: "invalid_or_expired" }, { status: 404 })
  }

  return NextResponse.json({
    valid: true,
    email: invite.email,
    customer_name: invite.customer_name,
  })
}
