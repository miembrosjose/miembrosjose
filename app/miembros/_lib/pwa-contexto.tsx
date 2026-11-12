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
import { activarNotificaciones, estaInstalada, queAparato, type Aparato } from "./push-cliente"
import { apagadoAdrede } from "@/lib/pwa/reglas"

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
  const { user, patchMetadata } = useAuth()
  const [evento, setEvento] = useState<EventoInstalacion | null>(null)
  const [instalada, setInstalada] = useState(false)
  const [aparato, setAparato] = useState<Aparato>("desconocido")
  const [visitas, setVisitas] = useState(0)
  const [listo, setListo] = useState(false)

  // La visita se cuenta una sola vez por carga, aunque el proveedor se vuelva
  // a renderizar. Sin esto, cada cambio de sección sumaría una.
  const contada = useRef(false)
  const anotada = useRef(false)
  const recuperada = useRef(false)

  useEffect(() => {
    setAparato(queAparato())
    setInstalada(estaInstalada())
    setListo(true)
  }, [])

  // ── QUE LA CUENTA SEPA QUE YA TIENE LA APLICACIÓN ─────────────────────
  //
  // `estaInstalada()` solo sabe de ESTE navegador, y en iPhone la aplicación
  // de la pantalla de inicio tiene su propio almacenamiento, separado del de
  // Safari. Por eso alguien que la usa a diario desde el icono recibe, al
  // entrar una vez por Safari, la invitación a instalar lo que ya tiene.
  //
  // Se anota en la cuenta la primera vez que se abre desde el icono. A partir
  // de ahí la plataforma lo sabe entre desde donde entre.
  useEffect(() => {
    if (!user?.id || anotada.current) return
    if (!estaInstalada()) return
    if ((user.user_metadata as { app_instalada_at?: string } | null)?.app_instalada_at) return
    anotada.current = true
    void fetch("/api/profile/app-instalada", { method: "POST", credentials: "include" })
      .then(() => patchMetadata({ app_instalada_at: new Date().toISOString() }))
      .catch(() => { /* se reintenta en el siguiente arranque */ })
  }, [user?.id, user?.user_metadata, patchMetadata])

  // ── VOLVER A SUSCRIBIR LO QUE SE CAYÓ SOLO ────────────────────────────
  //
  // Una suscripción de avisos muere por su cuenta: al reinstalar la
  // aplicación, al limpiar los datos del navegador, o porque el servicio de
  // Apple o Google decide que ese registro caducó. Entonces el servidor la
  // marca como muerta y esa persona deja de recibir nada.
  //
  // Nadie se entera. No hay aviso que avise de que no hay avisos: el móvil
  // sigue teniendo el permiso concedido, la pantalla sigue diciendo que todo
  // está bien, y simplemente no suena nunca más. El 12 de noviembre de 2026
  // había veinte dispositivos así, y una administradora entre ellos: mandó
  // una notificación a toda la plataforma y no le llegó ni a ella.
  //
  // Con el permiso ya concedido, volver a suscribirse NO pregunta nada: el
  // navegador contesta «granted» al instante. Así que se repara en silencio
  // al abrir la aplicación, que es exactamente cuando debe hacerse.
  //
  // Solo si el permiso está concedido y no se apagaron a propósito: quien
  // dijo que no, dijo que no.
  useEffect(() => {
    if (!user?.id || recuperada.current) return
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission !== "granted") return
    if (apagadoAdrede(user.id)) return

    const clave = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!clave) return

    recuperada.current = true
    void activarNotificaciones(clave, user.id).catch(() => {
      /* si no se puede, la tarjeta de siempre sigue ofreciéndolo */
    })
  }, [user?.id])

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

  // ── «INSTALADA» ES DE LA CUENTA, NO DE ESTE NAVEGADOR ─────────────────
  // `estaInstalada()` solo ve este navegador. Si la cuenta ya la instaló
  // alguna vez —en el móvil, desde el icono— no hay por qué volver a
  // ofrecérsela aquí: es la misma persona y ya la tiene.
  const instaladaEnLaCuenta =
    instalada ||
    Boolean((user?.user_metadata as { app_instalada_at?: string } | null)?.app_instalada_at)

  const valor = useMemo<Pwa>(() => ({
    aparato,
    instalada: instaladaEnLaCuenta,
    puedeInstalarSola: evento !== null,
    instalar,
    visitas,
    listo,
  }), [aparato, instaladaEnLaCuenta, evento, instalar, visitas, listo])

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
