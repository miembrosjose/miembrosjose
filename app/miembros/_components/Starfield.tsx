"use client"

// Canvas starfield com 3 camadas de profundidade + warp jump.
// Velocidade calculada como curva contínua em função do tempo (sem saltos).
// Sem deps externas. ~600 estrelas, 60fps.

import { useEffect, useRef } from "react"

type Props = {
  /** Timestamp (performance.now()) de quando a intro começou. null = não iniciada. */
  startedAt: number | null
  className?: string
}

/**
 * Curva contínua de velocidade — fluida do começo ao fim.
 *
 * T+0     → 800ms    drift constante (suave, calmo)
 * T+800   → 3500ms   ease-in-quad: drift → warp peak (aceleração progressiva)
 * T+3500  → 3700ms   warp peak hold (breve)
 * T+3700  → 5000ms   ease-out-cubic: warp peak → idle (desacelera longo)
 * T+5000+            idle constante
 */
function speedAt(t: number): number {
  const DRIFT = 0.0008
  const PEAK = 0.075

  if (t < 800) return DRIFT
  if (t < 3500) {
    const p = (t - 800) / (3500 - 800)
    // ease-in-quad — começa devagar, acelera progressivamente
    const eased = p * p
    return DRIFT + eased * (PEAK - DRIFT)
  }
  if (t < 3700) return PEAK
  if (t < 5000) {
    const p = (t - 3700) / (5000 - 3700)
    // ease-out-cubic — desacelera suave
    const eased = 1 - Math.pow(1 - p, 3)
    return PEAK - eased * (PEAK - DRIFT)
  }
  return DRIFT
}

/** Trail amount derivado da velocidade — começa quando speed > threshold, satura no peak. */
function warpFromSpeed(speed: number): number {
  const MIN = 0.006
  const MAX = 0.075
  if (speed <= MIN) return 0
  if (speed >= MAX) return 1
  const linear = (speed - MIN) / (MAX - MIN)
  // ease-in-quad também no trail pra não aparecer abrupto
  return linear * linear
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

export function Starfield({ startedAt, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const startedAtRef = useRef<number | null>(startedAt)

  useEffect(() => {
    startedAtRef.current = startedAt
  }, [startedAt])

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

    function frame() {
      if (!running || !ctx) return

      // Calcula velocidade direto da curva contínua de tempo — sem lerp,
      // sem saltos entre phases. Aceleração e desaceleração suaves.
      const start = startedAtRef.current
      const elapsed = start === null ? 0 : performance.now() - start
      const speed = speedAt(elapsed)
      const warpAmount = warpFromSpeed(speed)

      // Limpa com leve trail (motion blur). Mais blur conforme warp aumenta.
      const fadeAlpha = 0.4 - warpAmount * 0.27
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`
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
        if (hash < 4) color = `rgba(109, 74, 155, ${alpha})`         // gold (4%)
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
