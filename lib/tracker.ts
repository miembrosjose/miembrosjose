"use client";

import { safeStorage } from "./safe-storage";
import { readCookie } from "./cookies";
import type { GeoData } from "./geo-types";

// Mapa: para cada página, qual é a página anterior esperada no funil
const EXPECTED_PREV: Record<string, string[]> = {
  "/call":      ["/"],
  "/quiz":      ["/call"],
  "/audio":   ["/quiz"],
  "/payaso":      ["/audio"],
  "/pantalla":     ["/payaso"],
  "/whats":  ["/pantalla"],
  "/tiktok":      ["/whats"],
  "/salespage":      ["/tiktok", "/hotmart-direct"],
};

/**
 * Agenda trabalho de baixa prioridade pra rodar quando o thread principal
 * está ocioso. Usado pra prefetchar próxima página do funil sem competir
 * com LCP/TBT da página atual.
 *
 * Fallback: setTimeout em browsers sem requestIdleCallback (Safari iOS antigo).
 * fallbackMs default = 1 (next macrotask) preserva comportamento histórico
 * das pages do funil. Passe valor maior se for trabalho mais pesado.
 */
export function runWhenIdle(fn: () => void, fallbackMs = 1): void {
  if (typeof window === "undefined") return;
  type IdleWin = Window & { requestIdleCallback?: (cb: () => void) => number };
  const w = window as IdleWin;
  if (typeof w.requestIdleCallback === "function") {
    w.requestIdleCallback(fn);
  } else {
    setTimeout(fn, fallbackMs);
  }
}

export function generateSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = safeStorage.get("_fsid");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    safeStorage.set("_fsid", sid);
  }
  return sid;
}

export function resetSessionId(): void {
  if (typeof window === "undefined") return;
  safeStorage.remove("_fsid");
}

function isSkipSession(): boolean {
  if (typeof window === "undefined") return false;
  return safeStorage.get("_fskip") === "1";
}

const SALESPAGES = new Set(["/salespage"]);

// Marca a página atual como visitada e retorna a página anterior.
// Quando a página é uma salespage, grava _came_from_funnel ANTES de sobrescrever
// _flast — assim o checkout sempre sabe se a sessão veio pelo funil ou diretamente.
function recordVisit(page: string): string {
  if (typeof window === "undefined") return "";
  const prev = safeStorage.get("_flast") ?? "";

  // Grava o flag de origem apenas ao chegar em uma das 5 salespages (lido por buildCheckoutSck)
  if (SALESPAGES.has(page)) {
    const cameFromFunnel = EXPECTED_PREV[page]?.includes(prev) ?? false;
    safeStorage.set("_came_from_funnel", cameFromFunnel ? "1" : "0");
  }

  safeStorage.set("_flast", page);
  return prev;
}

/**
 * Retorna o sck correto para injetar no link de checkout da Hotmart.
 *
 * Formato: {campanha}_{tipo}_{sessionId}
 *
 * Exemplos:
 * - "copy-films-latam_funil_abc123" → campanha "copy-films-latam", veio pelo funil
 * - "ig_direct_xyz789" → utm_source "ig", acesso direto
 * - "_direct_xyz789" → sem UTM nenhum, acesso direto
 *
 * Isso preserva a informação da campanha do Facebook para aparecer na Hotmart,
 * enquanto ainda permite identificar se o usuário veio pelo funil ou direto.
 *
 * No dashboard, pode-se:
 * - Filtrar por campanha: WHERE source LIKE '%copy-films-latam%'
 * - Filtrar por tipo: WHERE source LIKE '%_funil_%' ou '%_direct_%'
 * - Extrair session_id: split por "_" e pegar o último elemento
 */
export function buildCheckoutSck(): string {
  if (typeof window === "undefined") return "";
  const sid = generateSessionId();
  const completed = safeStorage.get("_funnel_completed") === "1";
  const legacyFlag = safeStorage.get("_came_from_funnel") === "1";
  const cameFromFunnel = completed || legacyFlag;
  const tipo = cameFromFunnel ? "funil" : "direct";

  // Busca a campanha: força captureAndStoreParams() ANTES de ler o sessionStorage.
  // Isso garante que UTMs presentes na URL atual sejam salvos imediatamente,
  // resolvendo qualquer race condition entre useEffects no React.
  let campanha = "";
  try {
    // 0. Força captura síncrona dos UTMs da URL atual para o sessionStorage.
    //    Se já foram capturados antes, não faz nada de diferente (é idempotente).
    //    Importado inline para evitar dependência circular — usa a mesma lógica
    //    de captureAndStoreParams mas diretamente aqui.
    {
      const STORAGE_KEY = "funnel_utm_params";
      const TRACKED = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","fbclid","gclid","src","sck","ref"];
      const urlNow = new URLSearchParams(window.location.search);
      const freshFromUrl: Record<string, string> = {};
      TRACKED.forEach((p) => {
        const v = urlNow.get(p);
        if (v && !/\{\{.*?\}\}/.test(v)) {
          if (p === "utm_campaign" || p === "utm_medium" || p === "utm_content") {
            freshFromUrl[p] = v.trim().toLowerCase().replace(/\s+/g, "-");
          } else {
            freshFromUrl[p] = v;
          }
        }
      });
      if (Object.keys(freshFromUrl).length > 0) {
        try {
          const existing = safeStorage.get(STORAGE_KEY);
          const existingParsed = existing ? JSON.parse(existing) : {};
          safeStorage.set(STORAGE_KEY, JSON.stringify({ ...existingParsed, ...freshFromUrl }));
        } catch { /* silent */ }
      }
    }

    // 1. Lê sessionStorage — já atualizado com URL atual pela etapa 0 acima
    const stored = safeStorage.get("funnel_utm_params");
    const params = stored ? JSON.parse(stored) : {};

    // Prioridade de campanha:
    // 1. utm_campaign (nome real da campanha do FB)
    // 2. utm_medium  (ex: "cpc_NomeCampanha" — extrai a parte após "cpc_")
    // 3. utm_source  (ex: "ig", "facebook", "fb")
    // 4. src         (parâmetro customizado)
    const rawCampaign = params.utm_campaign || "";
    const rawMedium   = params.utm_medium   || "";
    const rawSource   = params.utm_source   || "";
    const rawSrc      = params.src          || "";

    // Tenta extrair nome real do utm_medium se vier no formato "cpc_NomeCampanha"
    let mediumCampanha = "";
    if (rawMedium && !rawCampaign) {
      const mediumParts = rawMedium.split("_");
      // Remove o prefixo do tipo (cpc, cpm, etc.) e usa o resto como campanha
      if (mediumParts.length >= 2 && ["cpc","cpm","cpv","ppc"].includes(mediumParts[0])) {
        mediumCampanha = mediumParts.slice(1).join("_").replace(/[^a-zA-Z0-9\-_]/g, "").slice(0, 50);
      }
    }

    const raw = rawCampaign || mediumCampanha || rawSource || rawSrc || "";
    if (raw && !/\{\{.*?\}\}/.test(raw)) {
      campanha = raw.replace(/[^a-zA-Z0-9\-_]/g, "").slice(0, 50);
    }
    // Fallback: se tem fbclid mas sem UTMs — tráfego pago do Facebook sem parâmetros
    if (!campanha && params.fbclid) {
      campanha = "facebook";
    }
  } catch { /* silent */ }

  // Formato final: {campanha}_{tipo}_{sid}
  // Se não tem campanha, fica apenas {tipo}_{sid}
  return campanha ? `${campanha}_${tipo}_${sid}` : `${tipo}_${sid}`;
}

/**
 * Deve ser chamada no tiktok IMEDIATAMENTE antes do router.push para
 * salespage. Grava o flag de forma síncrona no sessionStorage —
 * sem depender da ordem de execução dos useEffects — garantindo que
 * buildCheckoutSck() sempre retorne "funil_" para quem completou o funil.
 */
export function markFunnelCompleted(): void {
  if (typeof window === "undefined") return;
  safeStorage.set("_funnel_completed", "1");
}

// Fetch wrapper com timeout de 5s para /api/track.
// Evita que chamadas travadas consumam recursos em dispositivos fracos.
async function trackFetch(body: unknown, opts: { keepalive?: boolean } = {}): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      keepalive: opts.keepalive,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

// Detecção básica de bot no cliente — apenas por user-agent.
// Removido o check navigator.plugins/languages porque dava falso-positivo
// em iOS Safari, navegadores in-app (Facebook, Instagram) e modos privados,
// fazendo visitantes reais não serem contabilizados.
function isBot(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  const botPatterns = [
    "bot", "crawler", "spider", "crawling", "facebookexternalhit",
    "linkedinbot", "twitterbot", "whatsapp", "slurp", "bingbot",
    "googlebot", "yandexbot", "baiduspider", "semrushbot", "ahrefsbot",
    "mj12bot", "dotbot", "rogerbot", "pingdom", "headlesschrome",
    "phantomjs", "python-requests", "curl", "wget", "go-http-client",
  ];
  return botPatterns.some((p) => ua.includes(p));
}

export async function trackPageview(page: string, meta?: Record<string, string>) {
  try {
    if (isBot()) return;
    const prev_page = recordVisit(page);
    const skip = isSkipSession();
    await trackFetch({
      session_id: generateSessionId(),
      page,
      event_type: "pageview",
      prev_page,
      form_data: { ...(meta ?? {}), ...(skip ? { skip: "true" } : {}) },
    });
  } catch {}
}

// trackSection — igual ao trackPageview mas NÃO atualiza _flast no sessionStorage.
// Usar para eventos de scroll/visibilidade dentro de uma mesma página (ex: pricing section)
// para não corromper a cadeia de prev_page do funil.
export async function trackSection(virtualPage: string, meta?: Record<string, string>) {
  try {
    if (isBot()) return;
    const prev_page = safeStorage.get("_flast") ?? "";
    const skip = isSkipSession();
    await trackFetch({
      session_id: generateSessionId(),
      page: virtualPage,
      event_type: "section_view",
      prev_page,
      form_data: { ...(meta ?? {}), ...(skip ? { skip: "true" } : {}) },
    });
  } catch {}
}

export async function trackCheckout(page: string, formData: Record<string, string>) {
  try {
    if (isBot()) return;
    const skip = isSkipSession();
    await trackFetch({
      session_id: generateSessionId(),
      page,
      event_type: "checkout_click",
      prev_page: safeStorage.get("_flast") ?? "",
      form_data: { ...formData, ...(skip ? { skip: "true" } : {}) },
    }, { keepalive: true });
  } catch {}
}

// trackEngagement — disparado no unload/visibilitychange da salespage
// Registra tempo de permanência (segundos) e % máximo de rolagem da página
export async function trackEngagement(page: string, data: { time_seconds: number; max_scroll_pct: number }) {
  try {
    if (isBot()) return;
    const skip = isSkipSession();
    await trackFetch({
      session_id: generateSessionId(),
      page,
      event_type: "page_engagement",
      prev_page: safeStorage.get("_flast") ?? "",
      form_data: {
        time_seconds: String(data.time_seconds),
        max_scroll_pct: String(data.max_scroll_pct),
        ...(skip ? { skip: "true" } : {}),
      },
    });
  } catch {}
}

// ─── dataLayer helpers ───────────────────────────────────────────────────────

// Gera UUID v4 — usa crypto.randomUUID se disponível, fallback manual.
function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback (navegadores antigos sem crypto.randomUUID)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Pega ou cria external_id persistente do user (UUID em localStorage).
// Linka visitas cross-session pro Meta — funciona como "ID anônimo do usuário".
function getOrCreateExternalId(): string {
  if (typeof window === "undefined") return "";
  try {
    const KEY = "_cf_external_id";
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = generateUuid();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

// Empurra um evento GTM para o dataLayer com dados de Advanced Matching opcionais.
// fn  → primeiro nome (minúsculas)  — se vier nome completo, separa em fn + ln
// em  → email (minúsculas)
// ph  → telefone somente dígitos incluindo DDI+DDD
//
// Auto-injeta:
//  - user_data.fbp, fbc, client_user_agent (cookies + navigator)
//  - user_data.external_id (UUID persistente em localStorage)
//  - event_id (UUID único por evento — pra dedup Pixel ↔ CAPI)
//  - event_source_url (URL atual)
export function pushDataLayerEvent(
  eventName: string,
  userData?: { fn?: string; em?: string; ph?: string },
  extraData?: Record<string, unknown>,
  geoData?: GeoData
): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  const payload: Record<string, unknown> = {
    event: eventName,
    event_id: generateUuid(),
    event_source_url: window.location.href,
    ...extraData,
  };

  // Monta user_data mesclando campos de usuário + geo (cidade/estado/zip/país)
  const ud: Record<string, string> = {};
  if (userData?.fn) {
    const parts = userData.fn.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (parts.length > 0) ud.fn = parts[0];
    if (parts.length > 1) ud.ln = parts.slice(1).join(" ");
  }
  if (userData?.em) ud.em = userData.em.toLowerCase().trim();
  if (userData?.ph) ud.ph = userData.ph.replace(/\D/g, "");
  if (geoData?.country) ud.country = geoData.country.toLowerCase();
  if (geoData?.city)    ud.ct      = geoData.city.toLowerCase();
  if (geoData?.state)   ud.st      = geoData.state.toLowerCase();
  if (geoData?.zip)     ud.zp      = geoData.zip;

  // Identificadores Meta — lidos automaticamente do browser
  const fbp = readCookie("_fbp");
  const fbc = readCookie("_fbc");
  if (fbp) ud.fbp = fbp;
  if (fbc) ud.fbc = fbc;
  if (typeof navigator !== "undefined" && navigator.userAgent) {
    ud.client_user_agent = navigator.userAgent;
  }
  const externalId = getOrCreateExternalId();
  if (externalId) ud.external_id = externalId;

  if (Object.keys(ud).length > 0) payload.user_data = ud;

  // Campos de geo no topo do evento (convenção GA4 / dashboards internos)
  if (geoData?.ip)       payload.ip       = geoData.ip;
  if (geoData?.currency) payload.currency = geoData.currency;
  if (geoData?.region)   payload.region   = geoData.region;

  window.dataLayer.push(payload);
}

export async function trackCheckoutAbandon(page: string) {
  try {
    if (isBot()) return;
    const skip = isSkipSession();
    await trackFetch({
      session_id: generateSessionId(),
      page,
      event_type: "checkout_abandon",
      prev_page: safeStorage.get("_flast") ?? "",
      form_data: skip ? { skip: "true" } : null,
    });
  } catch {}
}
