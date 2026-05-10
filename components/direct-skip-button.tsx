"use client"

import { useState } from "react"
import { trackPageview } from "@/lib/tracker"
import { appendParamsToUrl } from "@/lib/url-params"
import { safeStorage } from "@/lib/safe-storage"
import { getCheckoutUrl } from "@/lib/checkout-urls"
import { Loader2, ArrowRight } from "lucide-react"

export default function DirectSkipButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (isLoading) return
    setIsLoading(true)
    safeStorage.set("_fskip", "1")
    trackPageview("/skip-direct", { skip: "true" })

    let countryCode = "UNKNOWN"
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      const res = await fetch("/api/geoip", { signal: controller.signal })
      clearTimeout(timeoutId)
      if (res.ok) {
        const data = await res.json()
        countryCode = data.countryCode ?? "UNKNOWN"
      }
    } catch { /* default to UNKNOWN */ }

    window.location.href = appendParamsToUrl(getCheckoutUrl(countryCode))
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`group relative flex items-center justify-center w-full h-12 px-4 text-[11px] sm:text-sm font-bold uppercase tracking-[0.18em] whitespace-nowrap transition-colors duration-500 border ${
        isLoading
          ? "bg-neutral-800 text-neutral-400 cursor-wait border-neutral-700"
          : "bg-red-900 text-white border-red-950/60 hover:bg-red-800 active:bg-red-950 cursor-pointer"
      }`}
      style={{ fontFamily: "var(--font-cinzel), serif" }}
    >
      <span aria-hidden className="absolute top-0 left-0 h-2 w-2 border-t border-l border-white/30 pointer-events-none" />
      <span aria-hidden className="absolute top-0 right-0 h-2 w-2 border-t border-r border-white/30 pointer-events-none" />
      <span aria-hidden className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-white/30 pointer-events-none" />
      <span aria-hidden className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-white/30 pointer-events-none" />
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-neutral-400 shrink-0" strokeWidth={2.5} />
          <span>CARGANDO...</span>
        </>
      ) : (
        <>
          <span>YA PASÉ POR LA EXPERIENCIA</span>
          <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-500 ease-out group-hover:translate-x-1 pointer-events-none" strokeWidth={2.5} />
        </>
      )}
    </button>
  )
}
