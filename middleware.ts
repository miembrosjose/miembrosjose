// Headers de segurança aplicados a TODAS as rotas (incluindo Edge runtime).
//
// Necessário porque next.config.mjs `headers()` e public/_headers NÃO são aplicados
// em rotas Edge runtime quando o build sai pra Cloudflare Pages.
//
// O middleware roda ANTES de cada request, injeta os headers, e deixa a request seguir.
// Custo de performance: ~0ms (executado no edge antes do Next.js).
//
// Manter sincronizado com next.config.mjs > async headers().

import { NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { getCloudflareContext } from "@opennextjs/cloudflare"

const MIEMBROS_HOST = "miembros.SEU_DOMINIO.com"
// Rotas públicas dentro do subdomínio miembros — não exigem sessão
const MIEMBROS_PUBLIC_PATHS = ["/miembros/login", "/miembros/cuenta", "/miembros/recuperar-contrasena"]
const COOKIE_DOMAIN = ".SEU_DOMINIO.com" // válido em SEU_DOMINIO.com E miembros.SEU_DOMINIO.com

// Salespages embedadas no popup da area de membros (miembros.SEU_DOMINIO.com).
// Pra essas rotas, frame-ancestors permite o subdomínio miembros (sem isso o
// browser bloqueia o iframe via clickjacking protection).
const EMBEDDABLE_IN_MIEMBROS = ["/creativos", "/andromeda", "/analytics", "/embudo", "/revisao", "/minivsl"]

// script-src + script-src-elem precisam ter os MESMOS dominios. Chrome moderno
// usa script-src-elem como diretiva mais especifica pra <script> tags; sem ela,
// fallback pra script-src gera warning "violates script-src" mesmo quando o
// dominio esta listado. Setando explicito = warning some.
const SCRIPT_SOURCES = "'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://scripts.converteai.net https://cdn.converteai.net https://*.cloudflareinsights.com https://*.clarity.ms https://www.clarity.ms https://connect.facebook.net https://cdn-st.adsmurai.com https://client.crisp.chat"

const STYLE_SOURCES = "'self' 'unsafe-inline' https://fonts.googleapis.com https://client.crisp.chat"

const buildCSP = (frameAncestors: string) => [
  "default-src 'self'",
  `script-src ${SCRIPT_SOURCES}`,
  `script-src-elem ${SCRIPT_SOURCES}`,
  `style-src ${STYLE_SOURCES}`,
  `style-src-elem ${STYLE_SOURCES}`,
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com https://client.crisp.chat",
  "connect-src 'self' https://SEU_DOMINIO.com https://www.SEU_DOMINIO.com https://api.stripe.com https://*.stripe.com https://m.stripe.network https://*.supabase.co wss://*.supabase.co https://open.er-api.com https://www.googletagmanager.com https://www.google-analytics.com https://*.cloudflareinsights.com https://api.vturb.com.br https://*.vturb.net https://*.converteai.net https://*.b-cdn.net https://*.sentry.io https://pay.google.com https://*.applepay.cdn-apple.com https://www.clarity.ms https://*.clarity.ms https://www.facebook.com https://connect.facebook.net https://SEU_TRACKING_WEBHOOK.com https://cdn-st.adsmurai.com https://client.crisp.chat wss://client.relay.crisp.chat https://image.crisp.chat https://storage.crisp.chat",
  "frame-src 'self' https://SEU_DOMINIO.com https://js.stripe.com https://*.stripe.com https://hooks.stripe.com https://www.googletagmanager.com https://pay.google.com https://*.converteai.net https://scripts.converteai.net https://cdn.converteai.net",
  "media-src 'self' blob: https:",
  "worker-src 'self' blob:",
  "manifest-src 'self' https://pay.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  `frame-ancestors ${frameAncestors}`,
  "upgrade-insecure-requests",
].join("; ")

const CSP = buildCSP("'none'")
const CSP_EMBEDDABLE = buildCSP("'self' https://miembros.SEU_DOMINIO.com")

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const host = req.headers.get("host") || ""

  // ── DEV LOCAL: pula middleware completamente pra não quebrar HMR/scripts inline.
  // CSP rigoroso + upgrade-insecure-requests + frame-ancestors quebram protótipo HTML
  // e Next dev tools em localhost. Em produção todos os headers são aplicados normal.
  if ((process.env.NODE_ENV as string) === "development") {
    return NextResponse.next()
  }

  // ── SUBDOMÍNIO miembros.SEU_DOMINIO.com ──────────────────────────────────
  // Estratégia: rewrite interno pra prefixar /miembros, depois auth check.
  // Cliente nunca vê /miembros na URL — só miembros.SEU_DOMINIO.com/login etc.
  if (host === MIEMBROS_HOST) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Helper: lê sessão Supabase. Retorna user ou null.
    const checkAuth = async () => {
      if (!supabaseUrl || !supabaseKey) return null
      const tempRes = NextResponse.next()
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() { return req.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: CookieOptions }) => {
              tempRes.cookies.set(name, value, { ...options, domain: COOKIE_DOMAIN })
            })
          },
        },
      })
      const { data: { user } } = await supabase.auth.getUser()
      return user
    }

    // Helper: aplica headers de segurança + força no-store pra Cloudflare
    // não cachear (subdomínio é gated, conteúdo muda por user, e CF estava
    // cacheando agressivamente HIT-ando versões antigas)
    const applyHeaders = (res: NextResponse) => {
      res.headers.set("Content-Security-Policy", CSP)
      res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
      res.headers.set("X-Frame-Options", "DENY")
      res.headers.set("X-Content-Type-Options", "nosniff")
      res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
      // microphone=(self) e camera=(self) liberam pro proprio site usar mic/camera
      // (DMs com audio, futuro video chat). Sem (self), getUserMedia falha
      // mesmo com user permitindo no browser.
      res.headers.set("Permissions-Policy", "geolocation=(), microphone=(self), camera=(self), payment=*")
      res.headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate, max-age=0")
      res.headers.set("CDN-Cache-Control", "no-store")
      res.headers.set("Cloudflare-CDN-Cache-Control", "no-store")
      return res
    }

    // Helper: detecta acesso revogado (refund de front ou ban manual via admin).
    // app_metadata.access_revoked é setado por:
    //   - POST /api/admin/revoke-product (manual, admin UI)
    //   - Stripe webhook charge.refunded quando sale_type='front'
    //   - Hotmart webhook PURCHASE_REFUNDED/CHARGEBACK quando front
    type AppMeta = { access_revoked?: boolean }
    const hasAccessRevoked = (user: { app_metadata?: unknown } | null | undefined): boolean => {
      if (!user) return false
      const am = (user.app_metadata || {}) as AppMeta
      return am.access_revoked === true
    }

    // ── / : cai no rewrite normal pra /miembros (SPA Next.js oficial) ──
    // (área de membros oficial migrou de area-prototipo.html → SPA Next.js
    // no commit e5c7afe, 02/05/2026). O HTML legacy foi removido em
    // 2026-05-02 após validação da SPA em prod.

    // ── Demais rotas (login, cuenta, etc.): rewrite pra /miembros/* + auth ──
    const rewriteUrl = req.nextUrl.clone()
    const isStaticFile = /\.[a-z0-9]{2,5}$/i.test(pathname)
    if (
      !pathname.startsWith("/miembros") &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/_next") &&
      !isStaticFile
    ) {
      rewriteUrl.pathname = `/miembros${pathname}`
    }

    const targetPath = rewriteUrl.pathname
    const isPublic = MIEMBROS_PUBLIC_PATHS.some((p) => targetPath.startsWith(p))

    if (!isPublic && targetPath.startsWith("/miembros")) {
      const user = await checkAuth()
      if (!user) {
        const loginUrl = new URL(`https://${MIEMBROS_HOST}/login`)
        loginUrl.searchParams.set("redirectTo", pathname)
        return NextResponse.redirect(loginUrl)
      }
      if (hasAccessRevoked(user)) {
        return NextResponse.redirect(new URL(`https://${MIEMBROS_HOST}/login?revoked=1`))
      }
    }

    return applyHeaders(NextResponse.rewrite(rewriteUrl))
  }

  // ── DOMÍNIO PRINCIPAL SEU_DOMINIO.com ────────────────────────────────────
  // Bloqueio reverso: se cliente acessar /login, /cuenta/crear ou /miembros direto
  // no domínio principal, redirect pro subdomínio bonito.
  // EM DEV LOCAL (npm run dev): pula bloqueio + auth pra iterar UI sem login.
  const isDev = (process.env.NODE_ENV as string) === "development"
  if (
    !isDev &&
    (pathname.startsWith("/miembros") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/cuenta"))
  ) {
    const targetPath = pathname.replace(/^\/miembros/, "") || "/"
    const redirectUrl = new URL(`https://${MIEMBROS_HOST}${targetPath}${req.nextUrl.search}`)
    return NextResponse.redirect(redirectUrl, 308)
  }

  // Dashboard auth guard — HTTP Basic Auth, sem rota extra
  if (pathname.startsWith("/dashboard")) {
    const authHeader = req.headers.get("authorization") ?? ""
    let authorized = false

    if (authHeader.startsWith("Basic ")) {
      try {
        const decoded = atob(authHeader.slice(6))
        const password = decoded.split(":").slice(1).join(":")
        authorized = password === (process.env.DASHBOARD_PASSWORD ?? "")
      } catch { /* base64 inválido */ }
    }

    if (!authorized) {
      return new NextResponse("Acesso negado", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="[BRAND_NAME] Dashboard"' },
      })
    }
  }

  // Geo via request.cf — acessa via getCloudflareContext() do @opennextjs/cloudflare.
  // (NextRequest.cf direto retorna undefined em OpenNext Workers.)
  // Injeta cidade/estado/zip/timezone como headers custom pro getGeoData() ler
  // server-side e propagar pros eventos dataLayer (Meta Advanced Matching).
  type CfFields = { city?: string; region?: string; postalCode?: string; timezone?: string }
  let cf: CfFields | undefined
  try {
    const ctx = getCloudflareContext() as { cf?: CfFields }
    cf = ctx.cf
  } catch {
    // getCloudflareContext pode falhar em build/dev — segue sem geo enriquecido.
    cf = undefined
  }

  const reqHeaders = new Headers(req.headers)
  if (cf) {
    if (typeof cf.city === "string"       && cf.city)       reqHeaders.set("x-geo-city",     cf.city)
    if (typeof cf.region === "string"     && cf.region)     reqHeaders.set("x-geo-state",    cf.region)
    if (typeof cf.postalCode === "string" && cf.postalCode) reqHeaders.set("x-geo-zip",      cf.postalCode)
    if (typeof cf.timezone === "string"   && cf.timezone)   reqHeaders.set("x-geo-timezone", cf.timezone)
  }

  const res = NextResponse.next({ request: { headers: reqHeaders } })

  // Salespages embedadas no popup da area de membros precisam permitir iframe
  // do subdominio miembros (frame-ancestors). X-Frame-Options DENY impediria
  // tudo — pra essas rotas usamos só CSP frame-ancestors (mais granular).
  const isEmbeddable = EMBEDDABLE_IN_MIEMBROS.includes(pathname)
  const cspToUse = isEmbeddable ? CSP_EMBEDDABLE : CSP

  res.headers.set("Content-Security-Policy", cspToUse)
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  if (!isEmbeddable) res.headers.set("X-Frame-Options", "DENY")
  res.headers.set("X-Content-Type-Options", "nosniff")
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  res.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=*")

  return res
}

export const config = {
  // Aplica em TODAS as rotas, exceto:
  //  - /_next/static/* (assets do Next.js — já cacheados, não precisam de CSP)
  //  - /_next/image/* (otimizador, não usado mas excluído por segurança)
  //  - /favicon.png e arquivos estáticos do public/ (já têm headers via _headers)
  matcher: ["/((?!_next/static|_next/image|favicon.png).*)"],
}
