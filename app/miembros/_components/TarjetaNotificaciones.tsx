"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  «MANTENTE CONECTADO CON LA RED» · la tarjeta del inicio
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ UNA TARJETA Y NO UNA VENTANA ───────────────────────────────────
// Porque esto no es urgente. Nadie necesita activar los avisos antes de poder
// usar la plataforma, y una ventana que tapa el contenido para pedir un
// permiso opcional es la forma más rápida de que se cierre sin leerla.
//
// Va donde ya viven los avisos del inicio —junto al Pulso y al Próximo
// Encuentro— y usa su misma caja. No inventa nada visual.
//
// ── CUÁNDO APARECE ────────────────────────────────────────────────────────
// Solo cuando sirve de algo. Es decir: cuando los avisos NO están activos en
// este dispositivo, el permiso no está bloqueado, no se cerró hace poco, y no
// es alguien que los apagó a propósito.
//
// Lo de «en este dispositivo» no es un detalle. Tener los avisos en el móvil
// no dice nada sobre la tableta, y cada aparato se suscribe por separado.
//
// ── Y CUÁNDO DESAPARECE ───────────────────────────────────────────────────
// En el momento en que el servidor confirma la suscripción, sin recargar
// nada: el estado vive aquí y `activarNotificaciones` devuelve el resultado.

import { useCallback, useEffect, useState } from "react"
import { Bell, Loader2, X } from "lucide-react"
import { useAuth } from "../_lib/auth-context"
import { usePwa } from "../_lib/pwa-contexto"
import {
  activarNotificaciones, estadoActual, registrarWorker, type EstadoPush,
} from "../_lib/push-cliente"
import { aplazarTarjeta, inviteQueToca } from "@/lib/pwa/reglas"
import { HojaInstalacionBajoPeticion } from "./InvitarAInstalar"
import estilos from "./TarjetaNotificaciones.module.css"

const CLAVE = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

/**
 * Los estados en los que tiene sentido ofrecer algo.
 *
 * `activo` no está, evidentemente. `denegado` tampoco: el navegador ya no
 * vuelve a preguntar y la única salida son los ajustes del sistema, así que
 * una tarjeta que ofreciera activarlos sería un botón que no puede funcionar.
 * Eso se explica en la campana, que es donde se va a buscar cuando algo no va.
 *
 * `desactivado` tampoco: esa persona ya decidió, y volver a ofrecérselo en el
 * inicio es pedirle que deshaga lo que acaba de hacer.
 *
 * `incompleto` sí, porque ahí sí hay algo que arreglar y se arregla solo con
 * pulsar: el permiso ya está dado, falta que el servidor se entere.
 */
const OFRECEN_ALGO: EstadoPush[] = ["sin_permiso", "requiere_instalar", "incompleto"]

export function TarjetaNotificaciones() {
  const { user } = useAuth()
  const { instalada, aparato } = usePwa()
  const [estado, setEstado] = useState<EstadoPush | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [cerrada, setCerrada] = useState(false)
  // La hoja de instalación, abierta A PETICIÓN desde el botón de aquí.
  // Es distinto de que asome sola: los plazos existen para no insistir, no
  // para impedir que alguien la busque.
  const [hojaAbierta, setHojaAbierta] = useState(false)

  const mirar = useCallback(async () => {
    if (!user?.id) return
    setEstado(await estadoActual(user.id))
  }, [user?.id])

  useEffect(() => {
    // Registrar el worker no pide nada ni molesta: solo lo deja listo para
    // cuando la persona decida activar. Hacerlo aquí evita la carrera de
    // registrarlo y suscribirse en el mismo clic.
    void registrarWorker().then(mirar)
  }, [mirar])

  // ── SI LO ACTIVA DESDE LA CAMPANA, ESTO SE ENTERA ───────────────────────
  // La campana tiene su propio panel con los mismos botones. Sin esto, alguien
  // podía activar los avisos ahí y encontrarse la tarjeta del inicio
  // ofreciéndole exactamente lo que acababa de hacer.
  useEffect(() => {
    const alCambiar = () => { void mirar() }
    window.addEventListener("los144k:push-cambio", alCambiar)
    return () => window.removeEventListener("los144k:push-cambio", alCambiar)
  }, [mirar])

  const activar = async () => {
    if (!CLAVE || !user?.id) return

    // En iPhone y iPad sin instalar no hay permiso que pedir: el sistema no lo
    // concede desde una pestaña. Se manda a instalar, que es el paso que de
    // verdad falta.
    if (estado === "requiere_instalar") {
      setHojaAbierta(true)
      return
    }

    setOcupado(true)
    try {
      const siguiente = await activarNotificaciones(CLAVE, user.id)
      setEstado(siguiente)
      // Que lo sepa la campana, por si está abierta detrás.
      window.dispatchEvent(new CustomEvent("los144k:push-cambio"))
    } finally {
      setOcupado(false)
    }
  }

  const cerrar = () => {
    setCerrada(true)
    if (user?.id) aplazarTarjeta(user.id)
  }

  if (!CLAVE || !user?.id || cerrada || estado === null) return null

  // ── LA REGLA ES UNA Y ESTÁ EN UN SOLO SITIO ────────────────────────────
  // `inviteQueToca` es quien decide cuál de las dos invitaciones corresponde.
  // Si toca instalar, esta tarjeta NO se dibuja: la hoja de instalación va
  // primero, y cuando se responda —instalando o aplazando— le tocará a esta
  // en la siguiente visita.
  //
  // Sin esto, cada pieza comprobaría por su cuenta si la otra se está
  // enseñando, y esa clase de condición cruzada acaba contradiciéndose el
  // día que se toca una de las dos.
  //
  // En un ordenador no se ofrece ninguna: esto habla de llevar la Red en el
  // bolsillo, y en un portátil es ruido en la pantalla de inicio.
  const toca = inviteQueToca({
    userId: user.id,
    puedeInstalar: !instalada && aparato !== "escritorio",
    puedeActivarAvisos: OFRECEN_ALGO.includes(estado) && aparato !== "escritorio",
  })
  if (toca !== "notificaciones") return null

  // Un iPhone sin instalar lo que necesita es la hoja de instalación, y esa la
  // decide el orquestador. Si la hoja ya se enseñó y se aplazó, esta tarjeta
  // sigue siendo la forma de volver a encontrarla.
  const hayQueInstalarAntes = estado === "requiere_instalar" && !instalada

  return (
    <div className={estilos.caja}>
      <div className={estilos.icono}>
        <Bell size={16} />
      </div>

      <div className={estilos.cuerpo}>
        <p className={estilos.titulo}>Mantente conectado con la Red.</p>
        <p className={estilos.texto}>
          {estado === "incompleto"
            ? "Diste el permiso, pero este dispositivo no llegó a quedar registrado. Vuelve a intentarlo: no te pedirá nada otra vez."
            : hayQueInstalarAntes
              ? "En iPhone y iPad los avisos solo llegan con la aplicación en la pantalla de inicio. Se hace una vez y no ocupa casi nada."
              : "Activa las notificaciones para recibir avisos de nuevos recursos, enseñanzas, mensajes y comunicaciones importantes, aunque no tengas la aplicación abierta."}
        </p>

        <button type="button" onClick={activar} disabled={ocupado} className={estilos.boton}>
          {ocupado ? <Loader2 size={13} className={estilos.girando} /> : <Bell size={13} />}
          {hayQueInstalarAntes
            ? "Instalar para recibir notificaciones"
            : estado === "incompleto"
              ? "Reintentar"
              : "Activar notificaciones"}
        </button>
      </div>

      <button type="button" onClick={cerrar} className={estilos.cerrar} aria-label="Ahora no">
        <X size={14} />
      </button>

      <HojaInstalacionBajoPeticion abierta={hojaAbierta} onCerrar={() => setHojaAbierta(false)} />
    </div>
  )
}
