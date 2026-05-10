"use client"

// Componente helper: <img> garantida circular.
//
// Por que existe: tokens.css forca border-radius:0 !important em tudo
// dentro de .miembros-shell. CSS modules em prod sao minificados e a
// excecao [class*='avatar' i] perde efeito. Usar !important no module
// nao resolve porque a disputa de specificity em prod nao e
// deterministica (CSS modules vs reset global).
//
// Solucao nuclear: useEffect + element.style.setProperty com 3o arg
// 'important'. Inline style com !important via DOM API vence QUALQUER
// CSS regra externa, independente de specificity ou ordem.

import { ImgHTMLAttributes, useEffect, useRef } from "react"

export function CircleImg(props: ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.setProperty("border-radius", "50%", "important")
    el.style.setProperty("object-fit", "cover", "important")
  }, [props.src])

  return <img ref={ref} {...props} />
}
