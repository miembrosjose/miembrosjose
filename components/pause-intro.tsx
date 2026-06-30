"use client"

import { useEffect, useState } from "react"
import { HERO_IMAGE } from "@/lib/cdn-image"

const BG_URL = HERO_IMAGE

interface PauseIntroProps {
  onComplete: () => void
  forceShow?: boolean
}

export function PauseIntro({ onComplete, forceShow = false }: PauseIntroProps) {
  const [cardIndex, setCardIndex] = useState(0)
  const [bgLoaded, setBgLoaded] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.onload = () => setBgLoaded(true)
    img.onerror = () => setBgLoaded(true)
    img.src = BG_URL
    if (img.complete) setBgLoaded(true)
  }, [])

  useEffect(() => {
    if (!forceShow && sessionStorage.getItem("introFinished") === "true") {
      setCardIndex(5)
      onComplete()
      return
    }

    const t0 = setTimeout(() => setCardIndex(1), 800)
    const t1 = setTimeout(() => setCardIndex(2), 1500)
    const t2 = setTimeout(() => setCardIndex(3), 3500)
    const t3 = setTimeout(() => setCardIndex(4), 6500)

    const t4 = setTimeout(() => {
      setCardIndex(5)
      setTimeout(() => {
        sessionStorage.setItem("introFinished", "true")
        onComplete()
      }, 1000)
    }, 11500)

    return () => {
      clearTimeout(t0)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const progressWidth =
    cardIndex >= 4 ? "92%" :
    cardIndex >= 3 ? "60%" :
    cardIndex >= 2 ? "28%" :
    cardIndex >= 1 ? "10%" : "0%"

  return (
    <section
      className={`fixed inset-0 w-full flex flex-col items-center justify-center px-6 z-[100] transition-opacity duration-1000 ${
        cardIndex >= 5 ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* BG com fade-in no load */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: bgLoaded ? 1 : 0,
          backgroundImage: `url(${BG_URL})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Gradient overlay — same as salespage */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/94 to-black pointer-events-none z-[1]" />
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.35)_90%)] pointer-events-none z-[1]" />
      {/* Grain */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none z-[1] bg-grain" />

      {/* Studio mark — alinhado ao container max-w-7xl da salespage */}
      <div className="absolute top-4 sm:top-6 left-0 right-0 z-30 pointer-events-none">
        <div className="relative w-full max-w-7xl mx-auto pl-8 pr-8 md:pl-12 md:pr-12 lg:pl-16 lg:pr-16">
          <div className="flex items-center gap-3">
            <span className="block h-4 w-px bg-red-900/70 flex-shrink-0" />
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.5em] leading-none text-neutral-400"
              style={{ fontFamily: "var(--font-cinzel)" }}
            >
              Los 144000
            </span>
          </div>
        </div>
      </div>

      {/* Corner marks */}
      <span aria-hidden className="absolute top-3 left-3 h-3 w-3 border-t border-l border-white/10 z-30" />
      <span aria-hidden className="absolute top-3 right-3 h-3 w-3 border-t border-r border-white/10 z-30" />
      <span aria-hidden className="absolute bottom-3 left-3 h-3 w-3 border-b border-l border-white/10 z-30" />
      <span aria-hidden className="absolute bottom-3 right-3 h-3 w-3 border-b border-r border-white/10 z-30" />

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.04] z-30">
        <div
          className="h-full bg-red-900/60"
          style={{ width: progressWidth, transition: "width 2800ms ease-out" }}
        />
      </div>

      {/* Content */}
      <div
        className="relative flex flex-col items-center gap-6 text-center max-w-[340px] w-full z-20"
        style={{ fontFamily: "var(--font-cinzel)" }}
      >
        {/* Title block */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-6xl font-black uppercase tracking-[0.08em] text-white leading-none">
            PAUSA.
          </h1>
          <div className="w-10 h-[2px] bg-red-900" />
        </div>

        {/* Line 1 */}
        <p
          className={`text-white/45 text-[0.75rem] tracking-[0.35em] uppercase transition-all duration-700 ease-out ${
            cardIndex >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          ¿Te diste cuenta?
        </p>

        {/* Clock card */}
        <div
          className={`w-full relative flex flex-col items-center gap-3 transition-all duration-700 ease-out ${
            cardIndex >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
          style={{
            background: "rgba(10,10,12,0.95)",
            border: "1px solid rgba(255,255,255,0.07)",
            padding: "24px 24px 20px",
          }}
        >
          <span aria-hidden className="absolute top-0 left-0 h-1.5 w-1.5 border-t border-l border-white/15 pointer-events-none" />
          <span aria-hidden className="absolute top-0 right-0 h-1.5 w-1.5 border-t border-r border-white/15 pointer-events-none" />
          <span aria-hidden className="absolute bottom-0 left-0 h-1.5 w-1.5 border-b border-l border-white/15 pointer-events-none" />
          <span aria-hidden className="absolute bottom-0 right-0 h-1.5 w-1.5 border-b border-r border-white/15 pointer-events-none" />
          <p className="text-[0.57rem] uppercase tracking-[0.5em] text-white/55">
            Tiempo en pantalla
          </p>
          <div className="flex items-baseline gap-2">
            <span
              className="text-[3.5rem] font-black text-white leading-none tabular-nums"
              style={{ fontFamily: "monospace" }}
            >
              10
            </span>
            <span className="text-base text-white/30 tracking-widest font-light">min</span>
          </div>
          <div className="w-8 h-px bg-red-900/50" />
          <p className="text-[0.58rem] text-white/55 tracking-[0.45em] uppercase">
            que estás aquí
          </p>
        </div>

        {/* Italic line */}
        <p
          className={`text-white/38 text-[0.78rem] italic transition-all duration-700 ease-out ${
            cardIndex >= 3 ? "opacity-100" : "opacity-0"
          }`}
        >
          Y déjame adivinar...
        </p>

        {/* White card */}
        <div
          className={`w-full relative text-center transition-all duration-700 ease-out ${
            cardIndex >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
          style={{
            background: "rgba(14,14,16,0.85)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "18px 20px",
          }}
        >
          <span aria-hidden className="absolute top-0 left-0 h-1.5 w-1.5 border-t border-l border-white/15 pointer-events-none" />
          <span aria-hidden className="absolute top-0 right-0 h-1.5 w-1.5 border-t border-r border-white/15 pointer-events-none" />
          <span aria-hidden className="absolute bottom-0 left-0 h-1.5 w-1.5 border-b border-l border-white/15 pointer-events-none" />
          <span aria-hidden className="absolute bottom-0 right-0 h-1.5 w-1.5 border-b border-r border-white/15 pointer-events-none" />
          <p className="text-[0.8rem] leading-relaxed text-white/52">
            Ni te diste cuenta de que el tiempo pasó tan rápido.{" "}
            <strong className="text-white/82 font-semibold">Ni lo notaste.</strong>
          </p>
        </div>

        {/* Red card */}
        <div
          className={`w-full relative text-center transition-all duration-700 ease-out ${
            cardIndex >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
          style={{
            background: "rgba(100,20,20,0.07)",
            border: "1px solid rgba(127,29,29,0.28)",
            padding: "18px 20px",
          }}
        >
          <span aria-hidden className="absolute top-0 left-0 h-1.5 w-1.5 border-t border-l border-white/15 pointer-events-none" />
          <span aria-hidden className="absolute top-0 right-0 h-1.5 w-1.5 border-t border-r border-white/15 pointer-events-none" />
          <span aria-hidden className="absolute bottom-0 left-0 h-1.5 w-1.5 border-b border-l border-white/15 pointer-events-none" />
          <span aria-hidden className="absolute bottom-0 right-0 h-1.5 w-1.5 border-b border-r border-white/15 pointer-events-none" />
          <p className="text-[0.8rem] leading-relaxed text-white/52">
            ¿Recuerdas la{" "}
            <strong className="text-white/82 font-semibold underline underline-offset-2">
              última vez
            </strong>{" "}
            que estuviste tanto tiempo así <em>inmerso</em> en una oferta?{" "}
            <strong className="text-red-500/75 font-semibold">Probablemente nunca.</strong>
          </p>
        </div>
      </div>
    </section>
  )
}
