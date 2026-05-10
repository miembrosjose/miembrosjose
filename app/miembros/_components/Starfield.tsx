"use client"

// Canvas starfield com 3 camadas de profundidade + warp jump.
// Fases: drift → accelerate → warp → decelerate → idle.
// Sem deps externas. ~600 estrelas, 60fps.

import { useEffect, useRef } from "react"

export type StarfieldPhase = "drift" | "accelerate" | "warp" | "decelerate" | "idle"

type Props = {
  phase: StarfieldPhase
  className?: string
}

type Star = {
  x: number      // posição relativa ao centro [-1..1]
  y: number      // posição relativa ao centro [-1..1]
  z: number      // profundidade [0..1] (0 = perto, 1 = longe)
  layer: 0 | 1 | 2  // qual camada de profundidade
  prevX: number  // pra desenhar trail no warp
  prevY: number
}

const STAR_COUNT = 600
const LAYER_DENSITY: [number, number, number] = [0.15, 0.35, 0.5]  // % por camada

function randStar(): Star {
  const r = Math.random()
  let layer: 0 | 1 | 2 = 0
  if (r < LAYER_DENSITY[0]) layer = 0
  else if (r < LAYER_DENSITY[0] + LAYER_DENSITY[1]) layer = 1
  else layer = 2

  return {
    x: (Math.random() - 0.5) * 2,
    y: (Math.random() - 0.5) * 2,
    z: Math.random(),
    layer,
    prevX: 0,
    prevY: 0,
  }
}

export function Starfield({ phase, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const phaseRef = useRef<StarfieldPhase>(phase)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let dpr = window.devicePixelRatio || 1
    let width = 0
    let height = 0

    function resize() {
      if (!canvas) return
      dpr = window.devicePixelRatio || 1
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const resizeObs = new ResizeObserver(resize)
    resizeObs.observe(canvas)

    // Inicializa estrelas
    const stars: Star[] = Array.from({ length: STAR_COUNT }, randStar)

    let raf = 0
    let running = true
    // velocidade interpolada (suaviza transições entre phases)
    let speed = 0.0006
    let warpAmount = 0  // 0 = sem trail, 1 = trail máximo

    function targetSpeed(p: StarfieldPhase): number {
      switch (p) {
        case "drift":      return 0.0008
        case "accelerate": return 0.012
        case "warp":       return 0.06
        case "decelerate": return 0.004
        case "idle":       return 0.0008
      }
    }

    function targetWarp(p: StarfieldPhase): number {
      switch (p) {
        case "drift":      return 0
        case "accelerate": return 0.25
        case "warp":       return 1
        case "decelerate": return 0.4
        case "idle":       return 0
      }
    }

    function frame() {
      if (!running || !ctx) return
      const p = phaseRef.current
      const tSpeed = targetSpeed(p)
      const tWarp = targetWarp(p)

      // Lerp suave (mais lento em transições pra fora do warp)
      const lerpSpeed = p === "warp" ? 0.08 : 0.04
      speed += (tSpeed - speed) * lerpSpeed
      warpAmount += (tWarp - warpAmount) * 0.06

      // Limpa com leve trail pra dar sensação de motion blur
      const fadeAlpha = warpAmount > 0.5 ? 0.15 : 0.4
      ctx.fillStyle = `rgba(0, 0, 5, ${fadeAlpha})`
      ctx.fillRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2
      const maxDim = Math.max(width, height)

      for (const star of stars) {
        // guarda posição anterior pra trail
        star.prevX = star.x
        star.prevY = star.y

        // move estrela em direção ao "viewer" (z diminui)
        const layerSpeedMult = star.layer === 0 ? 0.4 : star.layer === 1 ? 0.8 : 1.4
        star.z -= speed * layerSpeedMult

        // se passou do viewer, recicla no fundo com posição angular nova
        if (star.z <= 0) {
          star.z = 1
          star.x = (Math.random() - 0.5) * 2
          star.y = (Math.random() - 0.5) * 2
          star.prevX = star.x
          star.prevY = star.y
        }

        // projeta 3D → 2D
        const k = 1 / star.z
        const px = cx + star.x * k * cx
        const py = cy + star.y * k * cy

        const prevK = 1 / Math.min(1, star.z + speed * layerSpeedMult)
        const ppx = cx + star.prevX * prevK * cx
        const ppy = cy + star.prevY * prevK * cy

        // só desenha se estiver dentro da tela (com folga)
        if (px < -50 || px > width + 50 || py < -50 || py > height + 50) continue

        // brilho diminui com distância da camada de fundo
        const baseBrightness = star.layer === 0 ? 0.3 : star.layer === 1 ? 0.6 : 1
        const distBrightness = Math.max(0, Math.min(1, (1 - star.z) * 1.4))
        const alpha = baseBrightness * distBrightness

        // tamanho cresce conforme estrela se aproxima
        const size = (1 - star.z) * (star.layer === 2 ? 2.2 : 1.4)

        // cor da estrela: maioria branca-azulada, algumas gold (raras)
        // distribui por hash do x*y pra ficar consistente
        const hash = Math.abs((star.x * 1000 + star.y * 1000) | 0) % 100
        let color: string
        if (hash < 4) color = `rgba(201, 169, 97, ${alpha})`         // gold (4%)
        else if (hash < 10) color = `rgba(252, 165, 165, ${alpha})`  // rosé (6%)
        else if (hash < 18) color = `rgba(186, 230, 253, ${alpha})`  // ice blue (8%)
        else color = `rgba(245, 245, 250, ${alpha})`                 // off-white (82%)

        if (warpAmount > 0.05) {
          // desenha como linha (trail) — efeito warp
          const trailIntensity = warpAmount * (star.layer === 2 ? 1 : 0.5)
          const dx = px - ppx
          const dy = py - ppy
          const len = Math.hypot(dx, dy)
          if (len > 0.5) {
            ctx.strokeStyle = color
            ctx.lineWidth = Math.max(0.6, size * (0.7 + trailIntensity * 0.5))
            ctx.lineCap = "round"
            ctx.beginPath()
            ctx.moveTo(ppx, ppy)
            ctx.lineTo(px, py)
            ctx.stroke()
          } else {
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(px, py, size, 0, Math.PI * 2)
            ctx.fill()
          }
        } else {
          // estrela como ponto (drift normal)
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(px, py, size, 0, Math.PI * 2)
          ctx.fill()

          // halo sutil em estrelas próximas/grandes
          if (size > 1.4 && star.layer === 2) {
            const grad = ctx.createRadialGradient(px, py, 0, px, py, size * 4)
            grad.addColorStop(0, color)
            grad.addColorStop(1, "rgba(0,0,0,0)")
            ctx.fillStyle = grad
            ctx.beginPath()
            ctx.arc(px, py, size * 4, 0, Math.PI * 2)
            ctx.fill()
          }
        }

        // suprime variável "maxDim" warning
        void maxDim
      }

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      resizeObs.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        background: "transparent",
      }}
      aria-hidden
    />
  )
}
