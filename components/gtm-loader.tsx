"use client"

import Script from "next/script"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { pushDataLayerEvent } from "@/lib/tracker"
import type { GeoData } from "@/lib/geo-types"

// Rotas onde GTM/Pixel/Clarity/CAPI NÃO devem disparar.
// /dashboard = painel privado interno.
// /miembros/* = área de alunos pagos — não é parte do funil de marketing,
// alunos não devem ser perfilados/trackeados.
function isTrackingDisabled(pathname: string): boolean {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return true
  if (pathname === "/miembros" || pathname.startsWith("/miembros/")) return true
  return false
}

export function GtmLoader({ geoData }: { geoData?: GeoData }) {
  const pathname = usePathname()

  useEffect(() => {
    if (isTrackingDisabled(pathname)) return

    window.dataLayer = window.dataLayer || []

    // Bloqueia o trigger automático de "History Change" do GTM uma única vez.
    // Isso impede que o GTM dispare page_view sozinho nas navegações SPA do funil.
    //
    // ⚠️ NUNCA adicionar bloqueios por categoria em /checkout. A causa raiz
    // do Stripe Elements quebrar (IntegrationError __shared_params__ /
    // controllerId) era a tag GTM "000 - 04 - Passagem de UTMs" modificando
    // src dos iframes do Stripe. Resolvido em 06/05/2026 adicionando check
    // isProtectedIframe() na propria tag pra ignorar js.stripe.com,
    // *.stripe.network, hcaptcha.com, paypal.com, mercadopago.com.
    //
    // Categorias que ja quebraram tracking quando adicionadas como "rede de
    // seguranca" (NUNCA RE-ADICIONAR):
    // - `html`: bloqueia tudo Custom HTML (UTMs, Clarity, Cookies, Geo)
    // - `customScripts`: bloqueia Custom JS variables (Adsmurai usa)
    // - `customPixels`: bloqueia community templates (Adsmurai)
    // - `nonGoogleScripts`: bloqueia Facebook Pixel template
    const blocklist = ["history"]
    const alreadyBlocked = (window.dataLayer as Record<string, unknown>[]).some(
      (entry) => entry["gtm.blocklist"] !== undefined
    )
    if (!alreadyBlocked) {
      window.dataLayer.push({ "gtm.blocklist": blocklist })
    }

    // Dispara page_view manualmente UMA ÚNICA VEZ — somente na home "/"
    // Nas demais páginas do funil o GTM já está carregado mas não empurra
    // nenhum page_view novo, mantendo o pixel limpo.
    if (pathname === "/") {
      const alreadyFired = (window.dataLayer as Record<string, unknown>[]).some(
        (entry) => entry["event"] === "page_view"
      )
      if (!alreadyFired) {
        pushDataLayerEvent("page_view", undefined, { page_path: "/", page_title: document.title }, geoData)
      }
    }
  }, [pathname, geoData])

  // Bloqueia render do GTM em rotas privadas (dashboard + área de membros)
  if (isTrackingDisabled(pathname)) {
    return null
  }

  return (
    <>
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MVMB7LFB');`,
        }}
      />
      <noscript>
        <iframe
          src="https://www.googletagmanager.com/ns.html?id=GTM-MVMB7LFB"
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  )
}
