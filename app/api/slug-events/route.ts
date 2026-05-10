import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getClientIp as getIp } from "@/lib/get-client-ip";

const SLUG_PASSWORD = process.env.SLUG_PASSWORD || "";
const MAX_ATTEMPTS = 3;
const BLOCK_MINUTES = 15;

// Data de início da contabilização — resetado em 21/04/2026
const EVENTS_SINCE = "2026-04-21T03:00:00.000Z";

export async function GET(req: NextRequest) {
  const ip = getIp(req);
  const supabase = getSupabaseAdmin();

  // Rate limiting
  const { data: rateLimit } = await supabase
    .from("dashboard_rate_limit")
    .select("attempts, blocked_until")
    .eq("ip", ip)
    .maybeSingle();

  if (rateLimit?.blocked_until) {
    const blockedUntil = new Date(rateLimit.blocked_until);
    if (blockedUntil > new Date()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  if ((rateLimit?.attempts ?? 0) >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pwd = req.headers.get("x-slug-password");

  if (!pwd || pwd !== SLUG_PASSWORD) {
    if (rateLimit) {
      const newAttempts = (rateLimit.attempts ?? 0) + 1;
      const blockedUntil = newAttempts >= MAX_ATTEMPTS
        ? new Date(Date.now() + BLOCK_MINUTES * 60 * 1000).toISOString()
        : null;
      await supabase
        .from("dashboard_rate_limit")
        .update({ attempts: newAttempts, blocked_until: blockedUntil })
        .eq("ip", ip);
    } else {
      await supabase.from("dashboard_rate_limit").insert({ ip, attempts: 1 });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Senha correta — limpa tentativas
  await supabase.from("dashboard_rate_limit").delete().eq("ip", ip);

  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since");
  const until = searchParams.get("until");

  // Events query
  let query = supabase
    .from("funnel_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10000);

  // Enforces minimum date — never returns events before EVENTS_SINCE
  const sinceFloor = since && since + "T00:00:00.000Z" > EVENTS_SINCE
    ? since + "T00:00:00.000Z"
    : EVENTS_SINCE;
  query = query.gte("created_at", sinceFloor);
  if (until) query = query.lte("created_at", until + "T23:59:59.999Z");

  const { data: events, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Hotmart removido em 2026-04-29. Sales sempre vazio até dashboard ser
  // refatorada pra ler `stripe_sales` ou usuario implementar nova dashboard.
  return NextResponse.json({ events, sales: [] });
}
