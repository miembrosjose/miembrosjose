"use client"

import { useState, useEffect, useRef, type ImgHTMLAttributes } from "react"

type FadeImgProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** Duração do fade-in em ms. Default 500ms. */
  fadeDuration?: number
}

/**
 * `<img>` com fade-in suave quando termina de carregar.
 *
 * Substitui o efeito ruim de "linha por linha descendo" que aparece
 * em WebP/JPEG não-progressive em rede lenta. Imagem inicia com
 * opacity 0, transição suave pra 1 quando `onLoad` dispara OU quando
 * já estava no cache (img.complete = true no mount).
 *
 * Aceita todas as props normais de `<img>` (src, alt, className,
 * style, fetchPriority, etc.). Se passar `onLoad` próprio, ele
 * dispara junto com o setLoaded interno.
 */
export function FadeImg({
  fadeDuration = 500,
  className = "",
  style = {},
  onLoad,
  ...props
}: FadeImgProps) {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    // Edge case: imagem já estava no cache HTTP do browser quando
    // componente montou — `onLoad` não dispara nesse caso. Checa
    // imgRef.current.complete e seta loaded direto.
    if (imgRef.current?.complete) setLoaded(true)
  }, [])

  return (
    <img
      ref={imgRef}
      {...props}
      className={className}
      style={{
        ...style,
        opacity: loaded ? 1 : 0,
        transition: `opacity ${fadeDuration}ms ease-in`,
      }}
      onLoad={(e) => {
        setLoaded(true)
        onLoad?.(e)
      }}
    />
  )
}
