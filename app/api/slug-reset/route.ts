import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getClientIp as getIp } from "@/lib/get-client-ip";

const MAX_ATTEMPTS = 3;
const BLOCK_MINUTES = 15;

async function checkAuth(req: NextRequest): Promise<true | NextResponse> {
  const ip = getIp(req);
  const supabase = getSupabaseAdmin();
  const blockSince = new Date(Date.now() - BLOCK_MINUTES * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("dashboard_rate_limit")
    .select("*", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("attempted_at", blockSince);
  if ((count ?? 0) >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const pwd = req.headers.get("x-slug-password");
  if (!pwd || pwd !== process.env.SLUG_PASSWORD) {
    await supabase.from("dashboard_rate_limit").insert({ ip });
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await supabase.from("dashboard_rate_limit").delete().eq("ip", ip);
  return true;
}

export async function DELETE(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth !== true) return auth;

  const { mode, ownerIp, dateFrom, dateTo } = await req.json().catch(() => ({}));

  const supabase = getSupabaseAdmin();

  // Determina o intervalo a apagar
  let from: Date;
  let to: Date;

  if (dateFrom && dateTo) {
    from = new Date(dateFrom + "T00:00:00");
    to   = new Date(dateTo   + "T23:59:59");
  } else if (dateFrom === "all") {
    // Todo o período: sem filtro de data
    from = new Date(0);
    to   = new Date("2099-12-31T23:59:59");
  } else {
    // Padrão: só hoje
    from = new Date();
    from.setHours(0, 0, 0, 0);
    to = new Date();
    to.setHours(23, 59, 59, 999);
  }

  let query = supabase
    .from("funnel_events")
    .delete()
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString());

  if (mode === "test" && ownerIp) {
    query = query.eq("ip", ownerIp);
  } else if (mode === "off" && ownerIp) {
    query = query.neq("ip", ownerIp);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
