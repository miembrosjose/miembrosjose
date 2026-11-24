"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  LAS 237.393 CIUDADES, SIN HACER ESPERAR A NADIE
// ═══════════════════════════════════════════════════════════════════════════
//
// ── CÓMO SE REPARTE EL TRABAJO ────────────────────────────────────────────
// Hay dos buscadores y no sobra ninguno:
//
//   · El LOCAL tiene 7.329 ciudades dentro de la aplicación. Responde en el
//     mismo golpe de tecla, sin red, y cubre casi todas las capitales y
//     ciudades grandes. Es el que hace que escribir se sienta instantáneo.
//
//   · El del SERVIDOR tiene las 237.393. Tarda lo que tarde la red, así que
//     va por detrás, y es el que encuentra el pueblo.
//
// Se lanzan los dos. Lo local aparece de inmediato y lo del servidor se suma
// cuando llega. Quien escribe «Bogotá» ve el resultado al instante y no se
// entera de que había una segunda búsqueda; quien escribe «Villa de Leyva» ve
// un momento de espera y después su pueblo.
//
// ── POR QUÉ ESPERA 350 ms ─────────────────────────────────────────────────
// Sin esa pausa, escribir «Barranquilla» dispara doce peticiones y llegan
// desordenadas: se vería la lista parpadear y, a veces, quedarse con el
// resultado de «Barranq». Se espera a que la mano pare.
//
// ── Y SI LA RED FALLA ─────────────────────────────────────────────────────
// No pasa nada visible: quedan los resultados locales. Un buscador que se
// rompe entero porque falló una petición secundaria es peor que uno con
// menos alcance.

import { useEffect, useRef, useState } from "react"
import type { CiudadEncontrada } from "./ciudades"

const ESPERA_MS = 350

type Estado = {
  /** Lo que encontró el servidor. Vacío mientras no haya llegado nada. */
  ciudades: CiudadEncontrada[]
  buscando: boolean
  /** La tabla no está importada todavía. Se avisa en administración. */
  sinTabla: boolean
}

export function useCiudadesMundo(texto: string, activo: boolean): Estado {
  const [estado, setEstado] = useState<Estado>({ ciudades: [], buscando: false, sinTabla: false })
  // Para descartar respuestas viejas que lleguen tarde.
  const ultima = useRef(0)

  useEffect(() => {
    if (!activo) {
      setEstado({ ciudades: [], buscando: false, sinTabla: false })
      return
    }

    const consulta = texto.trim()
    if (consulta.length < 2) {
      setEstado({ ciudades: [], buscando: false, sinTabla: false })
      return
    }

    const mio = ++ultima.current
    const abortar = new AbortController()
    setEstado((e) => ({ ...e, buscando: true }))

    const temporizador = window.setTimeout(async () => {
      // «Ciudad, país» se parte igual que en la búsqueda local, y el país va
      // aparte para que el servidor pueda filtrar por él.
      const partes = consulta.split(",")
      const q = partes[0].trim()
      const lugar = partes.slice(1).join(" ").trim()

      try {
        const r = await fetch(
          `/api/geo/ciudades?q=${encodeURIComponent(q)}${lugar ? `&lugar=${encodeURIComponent(lugar)}` : ""}`,
          { credentials: "include", signal: abortar.signal },
        )
        const j = await r.json()
        // Llegó tarde: ya se escribió otra cosa. Se tira.
        if (mio !== ultima.current) return
        setEstado({
          ciudades: Array.isArray(j.ciudades) ? j.ciudades : [],
          buscando: false,
          sinTabla: !!j.sinTabla,
        })
      } catch {
        if (mio !== ultima.current) return
        // Sin ruido: quedan los resultados locales.
        setEstado({ ciudades: [], buscando: false, sinTabla: false })
      }
    }, ESPERA_MS)

    return () => {
      window.clearTimeout(temporizador)
      abortar.abort()
    }
  }, [texto, activo])

  return estado
}

/**
 * Junta lo local y lo del servidor sin repetir.
 *
 * Lo local va primero porque ya estaba en pantalla: reordenar la lista debajo
 * del dedo cuando llega la respuesta hace que se toque lo que no era.
 *
 * Se consideran la misma ciudad dos que coincidan en nombre y caigan a menos
 * de un par de kilómetros. Comparar solo el nombre juntaría los cuatro
 * «Santiago»; comparar coordenadas exactas no juntaría nada, porque las dos
 * bases redondean distinto.
 */
export function juntarSinRepetir(
  locales: CiudadEncontrada[],
  delMundo: CiudadEncontrada[],
): CiudadEncontrada[] {
  const salida = [...locales]

  for (const c of delMundo) {
    const repetida = salida.some(
      (x) =>
        x.nombre.toLowerCase() === c.nombre.toLowerCase() &&
        Math.abs(x.lat - c.lat) < 0.03 &&
        Math.abs(x.lon - c.lon) < 0.03,
    )
    if (!repetida) salida.push(c)
  }

  return salida
}
