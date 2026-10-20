"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  EL ESTADO DE LA APLICACIÓN EN ESTE DISPOSITIVO
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ ESTO ES UN CONTEXTO Y NO ESTADO DE UN COMPONENTE ──────────────
// Por un detalle del navegador que costaría tiempo descubrir: Chrome lanza
// `beforeinstallprompt` MUY pronto, a los pocos segundos de cargar la página,
// y lo lanza UNA vez.
//
// La invitación a instalar no se enseña hasta pasado medio minuto —a
// propósito: antes de eso la persona todavía no sabe qué es esto—. Si el
// oyente viviera dentro de esa invitación, se registraría cuando el evento ya
// ha pasado, y en Android no habría botón de instalar nunca. La pantalla
// diría «ve al menú del navegador» en un navegador que sabe instalar solo.
//
// Así que el oyente se pone al entrar en el área de miembros, y el evento se
// guarda aquí hasta que alguien lo use.
//
// ── Y POR QUÉ TAMBIÉN VIVE AQUÍ LA CUENTA DE VISITAS ──────────────────────
// Porque «esta es la segunda vez que entra» es un hecho del momento en que se
// entra, no de cuando se decide enseñar algo. Contarlo dentro de la
// invitación significaría contar solo las visitas en las que la invitación
// llegó a montarse — que son justamente las que no interesan.

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react"
import { useAuth } from "./auth-context"
import { contarVisita, instalacionHecha } from "@/lib/pwa/reglas"
import { estaInstalada, queAparato, type Aparato } from "./push-cliente"

/**
 * El evento de instalación de Chrome.
 *
 * No está en los tipos del DOM porque no es estándar: solo lo implementan los
 * navegadores basados en Chromium. En iPhone no existe y nunca existirá, que
 * es justo por lo que allí hay que explicar los pasos a mano.
 */
type EventoInstalacion = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type Pwa = {
  /** Qué aparato tenemos delante, hasta donde se puede saber. */
  aparato: Aparato
  /** ¿Se está usando desde el icono, y no desde una pestaña? */
  instalada: boolean
  /**
   * ¿Puede el navegador instalarla él solo?
   *
   * Solo es `true` cuando el navegador lo ha dicho. No se deduce de que sea
   * Android: un botón de instalar que no instala es peor que no tener botón.
   */
  puedeInstalarSola: boolean
  /** Lanza el instalador del navegador. Devuelve si aceptó. */
  instalar: () => Promise<boolean>
  /** Cuántas veces ha entrado esta persona, contando esta. */
  visitas: number
  /** Todavía no se sabe nada: el primer render del servidor. */
  listo: boolean
}

const Ctx = createContext<Pwa | null>(null)

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [evento, setEvento] = useState<EventoInstalacion | null>(null)
  const [instalada, setInstalada] = useState(false)
  const [aparato, setAparato] = useState<Aparato>("desconocido")
  const [visitas, setVisitas] = useState(0)
  const [listo, setListo] = useState(false)

  // La visita se cuenta una sola vez por carga, aunque el proveedor se vuelva
  // a renderizar. Sin esto, cada cambio de sección sumaría una.
  const contada = useRef(false)

  useEffect(() => {
    setAparato(queAparato())
    setInstalada(estaInstalada())
    setListo(true)
  }, [])

  useEffect(() => {
    if (!user?.id || contada.current) return
    contada.current = true
    setVisitas(contarVisita(user.id))
  }, [user?.id])

  useEffect(() => {
    const alPoderInstalar = (e: Event) => {
      // Sin esto, Chrome enseña ADEMÁS su propia barra, y salen dos
      // invitaciones a la vez diciendo lo mismo.
      e.preventDefault()
      setEvento(e as EventoInstalacion)
    }

    // Si la instalan —por aquí o por el menú del navegador— no hay nada más
    // que ofrecer, ni ahora ni nunca.
    const alInstalar = () => {
      setEvento(null)
      setInstalada(true)
      if (user?.id) instalacionHecha(user.id)
    }

    window.addEventListener("beforeinstallprompt", alPoderInstalar)
    window.addEventListener("appinstalled", alInstalar)
    return () => {
      window.removeEventListener("beforeinstallprompt", alPoderInstalar)
      window.removeEventListener("appinstalled", alInstalar)
    }
  }, [user?.id])

  const instalar = useCallback(async () => {
    if (!evento) return false
    try {
      await evento.prompt()
      const { outcome } = await evento.userChoice
      // El evento solo sirve una vez: el navegador no lo vuelve a lanzar
      // hasta que se den de nuevo las condiciones.
      setEvento(null)
      if (outcome === "accepted" && user?.id) instalacionHecha(user.id)
      return outcome === "accepted"
    } catch {
      return false
    }
  }, [evento, user?.id])

  const valor = useMemo<Pwa>(() => ({
    aparato,
    instalada,
    puedeInstalarSola: evento !== null,
    instalar,
    visitas,
    listo,
  }), [aparato, instalada, evento, instalar, visitas, listo])

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

/**
 * Fuera del proveedor devuelve un estado inerte en vez de lanzar.
 *
 * Esto lo usan piezas que también se montan en pantallas sueltas —el perfil,
 * una vista de administración— y romper una pantalla entera porque falta un
 * proveedor que solo sirve para ofrecer una instalación sería desproporcionado.
 */
export function usePwa(): Pwa {
  return useContext(Ctx) ?? {
    aparato: "desconocido",
    instalada: false,
    puedeInstalarSola: false,
    instalar: async () => false,
    visitas: 0,
    listo: false,
  }
}
