"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { captureAndStoreParams, getPathWithParams } from "@/lib/url-params"
import { useGlobalAudio } from "@/components/global-audio-provider"
import { ArrowRight } from "lucide-react"
import { VIDEO_HOME_TRANSITION as VIDEO_URL } from "@/lib/cdn-video"

export default function ExperienceButton() {
  const router = useRouter()
  const { playVibradAudio } = useGlobalAudio()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showVideo, setShowVideo] = useState(false)
  const navigatedRef = useRef(false)

  useEffect(() => {
    captureAndStoreParams()
    router.prefetch(getPathWithParams("/call"))
  }, [router])

  const navigateToCall = () => {
    if (navigatedRef.current) return
    navigatedRef.current = true
    router.push(getPathWithParams("/call"))
  }

  const handleStartExperience = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Não preventDefault em catch-22: se o play falhar, deixamos o <a href>
    // navegar normalmente. Mas se conseguirmos tocar o vídeo aqui, intercepta.
    e.preventDefault()

    captureAndStoreParams()

    // Cue de áudio cinematográfico (vibrad ringtone)
    const audioPromise = playVibradAudio()
    if (audioPromise) audioPromise.catch(() => {})

    setShowVideo(true)

    // CRÍTICO: play() chamado SÍNCRONO dentro do click handler = user gesture válido.
    // Browsers (incluindo iOS Safari, Chrome Android) liberam autoplay com som
    // quando vem de gesture explícito. Sem precisar de muted hack.
    const v = videoRef.current
    if (v) {
      v.muted = true // garante autoplay 100% — desmutamos depois que tocar
      const playPromise = v.play()
      if (playPromise) {
        playPromise
          .then(() => {
            // Vídeo tocou — desmuta após primeiros 50ms (transição suave de áudio)
            setTimeout(() => {
              if (videoRef.current) videoRef.current.muted = false
            }, 50)
          })
          .catch(() => {
            // Se mesmo com user gesture falhar (raríssimo), navega direto.
            navigateToCall()
          })
      }
    } else {
      // videoRef ainda não montou (não deveria acontecer com pre-render).
      navigateToCall()
    }
  }

  const handleVideoEnded = () => {
    navigateToCall()
  }

  const callPath = getPathWithParams("/call")

  return (
    <>
      <a
        href={callPath}
        onClick={handleStartExperience}
        className="group relative no-underline w-full sm:w-auto max-w-sm sm:max-w-none flex items-center justify-center gap-2 sm:gap-4 px-3 py-4 sm:px-14 sm:py-5 mt-8 text-[12px] sm:text-sm font-bold uppercase tracking-[0.14em] sm:tracking-[0.35em] whitespace-nowrap transition-colors duration-500 cursor-pointer min-h-[48px] bg-red-900 text-white border border-red-950/60 hover:bg-red-800 active:bg-red-950"
        style={{ fontFamily: "var(--font-cinzel), serif" }}
      >
        {/* Cantos brutalist — film leader marks */}
        <span aria-hidden className="absolute top-0 left-0 h-2 w-2 border-t border-l border-white/30 -translate-x-px -translate-y-px" />
        <span aria-hidden className="absolute top-0 right-0 h-2 w-2 border-t border-r border-white/30 translate-x-px -translate-y-px" />
        <span aria-hidden className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-white/30 -translate-x-px translate-y-px" />
        <span aria-hidden className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-white/30 translate-x-px translate-y-px" />

        <span>ENTRAR EN LA EXPERIENCIA</span>
        <ArrowRight
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-500 ease-out group-hover:translate-x-1 pointer-events-none"
          strokeWidth={2.5}
        />
      </a>

      {/* Container fullscreen com background preto — quando showVideo=true
          ocupa toda a tela e centraliza o vídeo. Mobile: vídeo enche tudo.
          Desktop: vídeo fica centralizado com letterbox preto nas laterais. */}
      <div
        aria-hidden={!showVideo}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: showVideo ? 9999 : -1,
          backgroundColor: "black",
          opacity: showVideo ? 1 : 0,
          pointerEvents: showVideo ? "auto" : "none",
          transition: "opacity 300ms ease-in",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Vídeo cinematográfico — sempre presente no DOM (preloadando).
            CRÍTICO: o ref precisa apontar pro MESMO elemento durante todo
            o ciclo (preload → play → fullscreen) pra play() funcionar como
            user gesture. object-contain mantém aspect ratio e centraliza
            no desktop (letterbox). */}
        <video
          ref={videoRef}
          src={VIDEO_URL}
          preload="auto"
          playsInline
          onEnded={handleVideoEnded}
          onError={handleVideoEnded}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: "auto",
            height: "auto",
            objectFit: "contain",
          }}
        />
      </div>
    </>
  )
}
