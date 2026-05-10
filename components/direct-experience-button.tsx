"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { captureAndStoreParams, getPathWithParams } from "@/lib/url-params"
import { useGlobalAudio } from "@/components/global-audio-provider"
import { ArrowRight } from "lucide-react"
import { VIDEO_HOME_TRANSITION as VIDEO_URL } from "@/lib/cdn-video"

export default function DirectExperienceButton() {
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
    e.preventDefault()
    captureAndStoreParams()

    // Cue de áudio cinematográfico (vibrad ringtone) — igual home
    const audioPromise = playVibradAudio()
    if (audioPromise) audioPromise.catch(() => {})

    setShowVideo(true)

    // CRÍTICO: play() chamado SÍNCRONO dentro do click handler = user gesture válido.
    // Browsers (iOS Safari, Chrome Android) liberam autoplay com som vindo de gesture
    // explícito. Mesma estratégia do ExperienceButton da home.
    const v = videoRef.current
    if (v) {
      v.muted = true // garante autoplay — desmutamos após começar a tocar
      const playPromise = v.play()
      if (playPromise) {
        playPromise
          .then(() => {
            setTimeout(() => {
              if (videoRef.current) videoRef.current.muted = false
            }, 50)
          })
          .catch(() => {
            navigateToCall()
          })
      }
    } else {
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
        className="group relative flex items-center justify-center w-full h-12 px-4 text-[11px] sm:text-sm font-bold uppercase tracking-[0.18em] whitespace-nowrap transition-all duration-300 border bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 border-neutral-700 text-neutral-300 hover:scale-105 active:scale-95 no-underline"
        style={{ fontFamily: "var(--font-cinzel), serif" }}
      >
        {/* Cantos brutalist — film leader marks */}
        <span aria-hidden className="absolute top-0 left-0 h-2 w-2 border-t border-l border-white/20 pointer-events-none" />
        <span aria-hidden className="absolute top-0 right-0 h-2 w-2 border-t border-r border-white/20 pointer-events-none" />
        <span aria-hidden className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-white/20 pointer-events-none" />
        <span aria-hidden className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-white/20 pointer-events-none" />

        <span className="relative z-10 flex items-center gap-3 leading-7">
          <span>ENTRAR EN LA EXPERIENCIA</span>
        </span>
        <ArrowRight
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-500 ease-out group-hover:translate-x-1 pointer-events-none"
          strokeWidth={2.5}
        />
      </a>

      {/* Overlay fullscreen com vídeo cinematográfico — mesma estética da home.
          Mobile: vídeo enche tudo. Desktop: centralizado com letterbox preto. */}
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
