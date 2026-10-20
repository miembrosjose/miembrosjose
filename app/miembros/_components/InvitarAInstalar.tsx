"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  QUIÉN DECIDE QUÉ SE ENSEÑA · el orquestador de las invitaciones
// ═══════════════════════════════════════════════════════════════════════════
//
// Hay dos invitaciones —instalar la aplicación y activar los avisos— y la
// regla principal es que nunca se enseñan las dos a la vez. Dos peticiones
// juntas no son una invitación: son un peaje.
//
// ── POR QUÉ ESA DECISIÓN VIVE AQUÍ Y NO EN CADA PIEZA ─────────────────────
// Porque si cada una decide por su cuenta, las dos pueden decidir que sí. Y
// la comprobación cruzada —«no me enseño si la otra se está enseñando»—
// repartida en dos componentes es la clase de condición que acaba
// contradiciéndose a sí misma el día que se toca uno de los dos.
//
// Aquí hay un solo sitio donde se decide, y las piezas solo saben dibujarse.
//
// ── EL ORDEN, Y POR QUÉ ES ESE ────────────────────────────────────────────
// Instalar va primero. No por preferencia: en iPhone y iPad, sin la
// aplicación en la pantalla de inicio NO HAY avisos posibles, así que ofrecer
// el permiso antes sería ofrecer algo que el sistema no va a conceder.
//
// Si no toca instalar —ya lo está, se aplazó, o es un ordenador— entonces le
// toca a la tarjeta de los avisos.
//
// ── LO QUE ESTO NO HACE ───────────────────────────────────────────────────
// No bloquea nada, ni ahora ni nunca. Quien use la plataforma desde el
// navegador del ordenador tiene que poder seguir haciéndolo exactamente igual.

import { useEffect, useState } from "react"
import { useAuth } from "../_lib/auth-context"
import { usePwa } from "../_lib/pwa-contexto"
import { HojaInstalacion } from "./HojaInstalacion"
import {
  PLAZOS, aplazarInstalacion, instalacionHecha, instalacionSilenciada, visitasSuficientes,
} from "@/lib/pwa/reglas"

export function InvitarAInstalar() {
  const { user } = useAuth()
  const { aparato, instalada, listo } = usePwa()
  const [abierta, setAbierta] = useState(false)
  // Una vez cerrada en esta sesión, no vuelve a asomar aunque pasen los
  // treinta segundos otra vez al cambiar de sección.
  const [yaSeVio, setYaSeVio] = useState(false)

  useEffect(() => {
    if (!listo || !user?.id || yaSeVio) return

    // Ya instalada: no hay nada que ofrecer. Es la comprobación más barata y
    // va primera.
    if (instalada) return

    // En un ordenador la aplicación no aporta nada: la plataforma ya está en
    // una pestaña y los avisos del escritorio no son lo que esto promete.
    if (aparato === "escritorio") return

    if (!visitasSuficientes(user.id)) return
    if (instalacionSilenciada(user.id)) return

    // ── POR QUÉ SE ESPERA MEDIO MINUTO ───────────────────────────────────
    // Alguien que acaba de entrar está mirando qué es esto, no decidiendo si
    // lo quiere en su pantalla de inicio. El tiempo dentro es la señal de que
    // de verdad está usando la plataforma y no se equivocó de pestaña.
    const reloj = window.setTimeout(() => setAbierta(true), PLAZOS.esperaDentroMs)
    return () => window.clearTimeout(reloj)
  }, [listo, user?.id, instalada, aparato, yaSeVio])

  if (!abierta || !user?.id) return null

  return (
    <HojaInstalacion
      onCerrar={() => {
        setAbierta(false)
        setYaSeVio(true)
        aplazarInstalacion(user.id)
      }}
      onInstalada={() => {
        setAbierta(false)
        setYaSeVio(true)
        instalacionHecha(user.id)
      }}
    />
  )
}

/**
 * La misma hoja, pero abierta a propósito.
 *
 * ── PARA QUÉ HACE FALTA ESTO ──────────────────────────────────────────────
 * Quien dice «ahora no» no se queda sin poder instalarla: la tarjeta del
 * inicio y el panel de la campana pueden volver a abrir las instrucciones
 * cuando la persona las busque. Pedirlo no es lo mismo que recibirlo sin
 * pedirlo, y por eso esto no comprueba plazos ni visitas — los plazos
 * existen para no insistir, no para impedir.
 */
export function HojaInstalacionBajoPeticion({ abierta, onCerrar }: {
  abierta: boolean
  onCerrar: () => void
}) {
  const { user } = useAuth()
  if (!abierta) return null
  return (
    <HojaInstalacion
      onCerrar={onCerrar}
      onInstalada={() => {
        if (user?.id) instalacionHecha(user.id)
        onCerrar()
      }}
    />
  )
}
