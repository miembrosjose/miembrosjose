import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getClientIp as getIp } from "@/lib/get-client-ip";

const PWD = process.env.SLUG_PASSWORD ?? "";
const MAX_ATTEMPTS = 3;
const BLOCK_MINUTES = 15;

async function checkAuth(req: NextRequest): Promise<true | NextResponse> {
  const ip = getIp(req);
  const supabase = getSupabaseAdmin();

  // Verifica se IP está bloqueado ou excedeu tentativas
  // Tabela: ip (text), attempts (int), blocked_until (timestamptz)
  const { data: rateLimit } = await supabase
    .from("dashboard_rate_limit")
    .select("attempts, blocked_until")
    .eq("ip", ip)
    .maybeSingle();

  // Se bloqueado e ainda no período de bloqueio
  if (rateLimit?.blocked_until) {
    const blockedUntil = new Date(rateLimit.blocked_until);
    if (blockedUntil > new Date()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  // Se excedeu tentativas
  if ((rateLimit?.attempts ?? 0) >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pwd = req.headers.get("x-slug-password");
  if (!pwd || pwd !== PWD) {
    // Registra tentativa errada - incrementa ou insere
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

  // Senha correta — limpa tentativas deste IP
  await supabase.from("dashboard_rate_limit").delete().eq("ip", ip);
  return true;
}

// GET — retorna modo atual e IP do owner salvo
export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth !== true) return auth;
  const supabase = getSupabaseAdmin();
  const [modeRow, ipRow] = await Promise.all([
    supabase.from("funnel_config").select("value").eq("key", "test_mode").single(),
    supabase.from("funnel_config").select("value").eq("key", "owner_ip").single(),
  ]);
  // Sempre atualiza o ownerIp com o IP atual de quem acessa o dashboard
  const currentIp = getIp(req);
  await supabase.from("funnel_config").upsert({ key: "owner_ip", value: currentIp }, { onConflict: "key" });
  return NextResponse.json({
    mode: modeRow.data?.value ?? "off",
    ownerIp: currentIp,
  });
}

// POST — altera o modo { mode: "off" | "test" }
export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth !== true) return auth;
  const { mode } = await req.json();
  if (!["off", "test"].includes(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }
  const ownerIp = getIp(req);
  const supabase = getSupabaseAdmin();
  await Promise.all([
    supabase.from("funnel_config").upsert({ key: "test_mode", value: mode }, { onConflict: "key" }),
    supabase.from("funnel_config").upsert({ key: "owner_ip", value: ownerIp }, { onConflict: "key" }),
  ]);
  return NextResponse.json({ ok: true, mode, ownerIp });
}
