import ExperienceButton from "@/components/experience-button"
import { FunnelPrefetcher } from "@/components/funnel-prefetcher"
import { FadeImg } from "@/components/fade-img"
import { HERO_IMAGE } from "@/lib/cdn-image"
import { VIDEO_HOME_TRANSITION } from "@/lib/cdn-video"

export default function HomePage() {
  return (
    <>
    <FunnelPrefetcher route="/" />
    <link rel="preload" as="image" href={HERO_IMAGE} fetchPriority="high" crossOrigin="anonymous" />
    {/* Preload do vídeo cinematográfico — começa no primeiro byte da home,
        em paralelo com a imagem hero. Quando o ExperienceButton renderiza o
        <video preload="auto">, pega do cache HTTP instantaneamente. */}
    <link rel="preload" as="video" href={VIDEO_HOME_TRANSITION} fetchPriority="high" type="video/mp4" crossOrigin="anonymous" />

    <div className="relative bg-black text-white selection:bg-red-900/40 overflow-hidden" style={{ minHeight: '100dvh' }}>

      {/* ── BG IMAGE — protagonista, não decoração ────────── */}
      <div className="absolute inset-0 z-0">
        <FadeImg
          src={HERO_IMAGE}
          alt=""
          fetchPriority="high"
          className="object-cover w-full h-full"
        />
        {/* Gradient overlay — image respira no topo, denso embaixo pra legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/94 to-black" />
        {/* Vinheta sutil pra focar no centro/imagem */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.35)_90%)]" />
        {/* Grain cinematográfico */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-grain" />
      </div>

      {/* ── STUDIO MARK — texto "[BRAND_NAME]" no canto superior esquerdo (sem imagem, carrega instantâneo) ──── */}
      <div className="absolute top-6 left-5 sm:left-6 z-30 flex items-center gap-3">
        <span className="block h-4 w-px bg-red-900/70 flex-shrink-0" />
        <span
          className="text-[9px] font-semibold uppercase tracking-[0.5em] leading-none text-neutral-400"
          style={{ fontFamily: "var(--font-cinzel)" }}
        >
          Copy Film&apos;s
        </span>
      </div>

      {/* ── CONTEÚDO — ancorado abaixo da imagem, posição cinematográfica ── */}
      <div
        className="relative z-10 flex flex-col justify-end items-center px-5 pt-32 pb-12 sm:pb-16 animate-fade-up-instant"
        style={{ minHeight: '100dvh' }}
      >
        <div className="w-full max-w-3xl flex flex-col items-center text-center">

          {/* HEADLINE — título do filme, escala cinematográfica */}
          <h1
            className="leading-[1.05] mb-10 sm:mb-14 text-white"
            style={{
              fontFamily: 'var(--font-cinzel), serif',
              fontSize: 'clamp(1.75rem, 6vw, 4.25rem)',
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            ¿Estás preparado para vivir una{" "}
            <em className="not-italic font-bold text-red-900 drop-shadow-[0_0_30px_rgba(127,29,29,0.6)]">
              experiencia de marketing
            </em>{" "}
            como nunca has visto?
          </h1>

          {/* AUDIO CUE — pareado horizontalmente, pequeno e funcional */}
          <div className="mb-2 flex items-center gap-2 sm:gap-3">
            {/* Speaker icon com ping */}
            <span className="relative inline-flex items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-red-900/40" />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-700 relative z-10"
                aria-hidden="true"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            </span>

            {/* Divider vertical mínimo */}
            <span className="h-3 w-px bg-neutral-600" />

            {/* "sube el volumen" */}
            <p
              className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] sm:tracking-[0.5em] text-neutral-400"
              style={{ fontFamily: 'var(--font-cinzel), serif' }}
            >
              sube el volumen
            </p>
          </div>

          {/* CTA — botão "play" cinematográfico */}
          <ExperienceButton />
        </div>
      </div>

    </div>
    </>
  )
}
