import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const cfCountry = request.headers.get("cf-ipcountry")
    if (cfCountry && cfCountry !== "XX") {
      return NextResponse.json({ countryCode: cfCountry })
    }
    return NextResponse.json({ countryCode: "UNKNOWN" })
  } catch {
    return NextResponse.json({ countryCode: "UNKNOWN" })
  }
}
