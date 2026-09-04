"use client"

// Video de banner con la MISMA lógica iOS-safe que el fondo de las temporadas
// (SeasonVideo): fuerza muted+playsinline, hace play() y, si el autoplay se
// bloquea, pinta el primer frame. Acepta imagen o video. Sin esto, un <video>
// simple a veces no reproduce/pinta (quedaba "en negro").

import { useEffect, useRef } from "react"

export function BannerVideo({ src, className }: { src: string; className?: string }) {
  const isImage = /\.(webp|png|jpe?g|gif|avif)(\?|$)/i.test(src)
  const ref = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (isImage) return
    const video = ref.current
    if (!video) return
    video.muted = true
    video.defaultMuted = true
    video.setAttribute("muted", "")
    video.setAttribute("playsinline", "")
    video.setAttribute("webkit-playsinline", "")

    const paintFirstFrame = () => {
      try {
        if (video.readyState >= 1 && video.currentTime < 0.05) video.currentTime = 0.1
      } catch { /* ignora */ }
    }
    const playMuted = () => {
      video.muted = true
      const p = video.play()
      if (p && typeof p.catch === "function") p.catch(paintFirstFrame)
    }
    const onReady = () => playMuted()
    video.addEventListener("loadeddata", onReady)
    video.addEventListener("canplay", onReady)
    try { video.load() } catch { /* ignora */ }
    playMuted()
    return () => {
      video.removeEventListener("loadeddata", onReady)
      video.removeEventListener("canplay", onReady)
    }
  }, [isImage, src])

  if (isImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={className} />
  }

  // src DIRECTO + autoPlay (idéntico a la previsualización del admin y a los
  // banners de temporada que sí se ven). Nada de <source> con fragmento #t=,
  // que era lo que no cargaba.
  return (
    <video
      ref={ref}
      className={className}
      src={src}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      {...{ "webkit-playsinline": "true" }}
    />
  )
}
