import { NextRequest, NextResponse } from "next/server";
import { verifyDashboardAuth } from "@/lib/dashboard-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Endpoint de métricas do dashboard.
 *
 * Hotmart removido em 2026-04-29 (Opção 1 do cleanup). Retorna métricas zeradas
 * até dashboard ser refatorada pra ler `stripe_sales` ou nova dashboard implementada.
 * Auth e estrutura mantidas pra não quebrar `metrics-tab.tsx` que consome.
 */
export async function GET(req: NextRequest) {
  const authError = await verifyDashboardAuth(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const fbSpend = parseFloat(searchParams.get("spend") ?? "0") || 0;

  return NextResponse.json({
    avgTicket:            0,
    effectiveSales:       0,
    netRevenue:           0,
    ltv:                  0,
    uniqueBuyers:         0,
    totalHistoricRevenue: 0,
    cac:                  0,
    uniqueNewBuyers:      0,
    cpa:                  0,
    totalSales:           0,
    fbSpend:              +fbSpend.toFixed(2),
  });
}
