"use client"

// ACTIVAR LAS NOTIFICACIONES EN EL MÓVIL.
//
// ── POR QUÉ ESTO NO ES UN INTERRUPTOR MÁS ──────────────────────────────────
// Los demás ajustes de este modal se guardan y ya está. Este depende de tres
// cosas que no controlamos: el navegador, el sistema operativo y una decisión
// que la persona solo puede tomar una vez.
//
// El permiso de notificaciones, si se deniega, NO se puede volver a pedir. El
// navegador deja de preguntar y la única salida son los ajustes del sistema.
// Por eso aquí se explica antes y se pide después, nunca al revés.
//
// ── Y POR QUÉ EL IPHONE TIENE SU PROPIO TEXTO ──────────────────────────────
// En iPhone esto simplemente no funciona desde una pestaña de Safari: las
// notificaciones web exigen que la web esté añadida a la pantalla de inicio.
// No es un fallo ni algo que podamos arreglar. Decir «activar» a alguien que
// no puede activarlo es peor que explicarle lo que le falta.

import { useCallback, useEffect, useState } from "react"
import { Bell, BellOff, Check, Share, Plus, Loader2 } from "lucide-react"
import {
  estadoActual,
  activarNotificaciones,
  desactivarNotificaciones,
  registrarWorker,
  type EstadoPush,
} from "../_lib/push-cliente"

const CLAVE = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

export function PushEnElMovil() {
  const [estado, setEstado] = useState<EstadoPush | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const refrescar = useCallback(async () => {
    setEstado(await estadoActual())
  }, [])

  useEffect(() => {
    // Registrar el worker no pide nada ni molesta: solo lo deja listo para
    // cuando la persona decida activar. Hacerlo aquí evita la carrera de
    // registrarlo y suscribirse en el mismo clic.
    void registrarWorker().then(refrescar)
  }, [refrescar])

  const activar = async () => {
    if (!CLAVE) return
    setOcupado(true)
    try {
      setEstado(await activarNotificaciones(CLAVE))
    } finally {
      setOcupado(false)
    }
  }

  const desactivar = async () => {
    setOcupado(true)
    try {
      await desactivarNotificaciones()
      await refrescar()
    } finally {
      setOcupado(false)
    }
  }

  if (estado === null) return null

  // Sin clave configurada en el servidor, el botón no podría funcionar. Más
  // vale no enseñarlo que enseñar algo que falla al pulsarlo.
  if (!CLAVE) return null

  return (
    <div style={caja}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
        {estado === "activo" ? <Bell size={15} color="#7ee0a8" /> : <BellOff size={15} color="#a78bca" />}
        <strong style={{ fontSize: "0.9rem", color: "#F3F6FA" }}>Avisos en el móvil</strong>
      </div>

      {estado === "activo" && (
        <>
          <p style={texto}>
            <Check size={12} style={{ verticalAlign: "-2px" }} /> Este dispositivo recibirá
            avisos aunque tengas la aplicación cerrada.
          </p>

          <QuePuedeLlegar />

          <button type="button" onClick={desactivar} disabled={ocupado} style={botonTenue}>
            {ocupado ? <Loader2 size={12} className="animate-spin" /> : null} Dejar de recibir aquí
          </button>
        </>
      )}

      {estado === "sin_permiso" && (
        <>
          <p style={texto}>
            Te avisaremos de lo que no puede esperar: un mensaje tuyo, un encuentro, un
            comunicado. Nada más.
          </p>
          <button type="button" onClick={activar} disabled={ocupado} style={boton}>
            {ocupado ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} />}
            Activar en este dispositivo
          </button>
        </>
      )}

      {/* ── EL CASO DEL IPHONE ──────────────────────────────────────────── */}
      {estado === "requiere_instalar" && (
        <>
          <p style={texto}>
            En iPhone, los avisos solo llegan si añades <strong>Los 144.000</strong> a tu
            pantalla de inicio. Es cosa de Safari, y se hace una sola vez:
          </p>
          <ol style={pasos}>
            <li>
              Toca <Share size={12} style={{ verticalAlign: "-2px" }} /> <strong>Compartir</strong>,
              abajo en el centro
            </li>
            <li>
              Baja y elige <Plus size={12} style={{ verticalAlign: "-2px" }} />{" "}
              <strong>Añadir a pantalla de inicio</strong>
            </li>
            <li>Abre la aplicación desde su icono y vuelve aquí</li>
          </ol>
        </>
      )}

      {estado === "denegado" && (
        <p style={texto}>
          Bloqueaste los avisos en este dispositivo. El navegador ya no vuelve a preguntar:
          hay que activarlos desde los ajustes del sistema, en las notificaciones de Los
          144.000.
        </p>
      )}

      {estado === "no_soportado" && (
        <p style={texto}>
          Este navegador no admite avisos. Prueba desde Chrome en Android o instalando la
          aplicación en iPhone.
        </p>
      )}
    </div>
  )
}

const caja: React.CSSProperties = {
  margin: "0 0 1rem",
  padding: "0.9rem 1rem",
  border: "1px solid rgba(167,139,202,0.25)",
  borderRadius: 12,
  background: "rgba(109,74,155,0.07)",
}

const texto: React.CSSProperties = {
  margin: "0 0 0.7rem",
  fontSize: "0.82rem",
  lineHeight: 1.55,
  color: "#a8a8c0",
}

const pasos: React.CSSProperties = {
  margin: "0 0 0.2rem",
  paddingLeft: "1.1rem",
  fontSize: "0.82rem",
  lineHeight: 1.75,
  color: "#a8a8c0",
}

const boton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.45rem",
  padding: "0.55rem 1rem",
  border: "1px solid #6D4A9B",
  borderRadius: 8,
  background: "rgba(109,74,155,0.25)",
  color: "#F3F6FA",
  fontSize: "0.78rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  cursor: "pointer",
}

const botonTenue: React.CSSProperties = {
  ...boton,
  border: "1px solid #251f30",
  background: "transparent",
  color: "#8b90b4",
  fontWeight: 400,
}

/**
 * Qué puede llegar al móvil, y cuánto se enseña.
 *
 * ── POR QUÉ SOLO SE VE CUANDO YA ESTÁN ACTIVAS ─────────────────────────────
 * Elegir categorías antes de haber dado el permiso es pedir una decisión
 * sobre algo que todavía no ocurre. Primero se activa, y entonces tiene
 * sentido afinar.
 *
 * ── POR QUÉ SON CUATRO Y NO QUINCE ─────────────────────────────────────────
 * La plataforma genera avisos de muchas cosas, pero al teléfono solo salen
 * tres clases: alguien te escribe, llegas a un hito del camino, o José manda
 * algo a La Red. Un interruptor por cada aviso posible convertiría esto en
 * una pantalla de configuración que nadie termina de leer, y lo que la gente
 * acaba haciendo con esas pantallas es apagarlo todo.
 *
 * Lo que NO está aquí tampoco llega al teléfono: ver quién respondió en el
 * foro o quién te sigue se mira en la campana, cuando uno entra.
 *
 * ── LA VISTA PREVIA NO ES UN DETALLE ───────────────────────────────────────
 * Una notificación se lee en la pantalla BLOQUEADA, a la vista de quien esté
 * al lado. Apagarla hace que el aviso diga QUIÉN escribe y nunca QUÉ: hay que
 * desbloquear para enterarse. En una plataforma donde se habla de heridas y
 * de procesos personales, esa diferencia importa.
 */
type PrefsPush = {
  mensajes: boolean
  vista_previa: boolean
  logros: boolean
  comunicados: boolean
}

function QuePuedeLlegar() {
  const [prefs, setPrefs] = useState<PrefsPush | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    fetch("/api/profile/notification-prefs", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const p = d?.prefs?.push
        // Se lee como «apagado solo si lo dice expresamente». Una cuenta de
        // antes de esta pantalla no tiene la sección, y lo correcto ahí es
        // que lo reciba todo, no que se quede sin avisos sin haber elegido.
        if (p) {
          setPrefs({
            mensajes: p.mensajes !== false,
            vista_previa: p.vista_previa !== false,
            logros: p.logros !== false,
            comunicados: p.comunicados !== false,
          })
        }
      })
      .catch(() => { /* se queda oculto: mejor nada que un interruptor que miente */ })
  }, [])

  const cambiar = async (clave: keyof PrefsPush, valor: boolean) => {
    if (!prefs) return
    const siguiente = { ...prefs, [clave]: valor }
    setPrefs(siguiente)          // se pinta ya: esperar al servidor se nota
    setGuardando(true)
    try {
      const r = await fetch("/api/profile/notification-prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ push: siguiente }),
      })
      // Un 500 no lanza por sí solo: sin esto, un guardado que falla se veía
      // igual que uno que funcionó, y la persona se iba creyendo que lo tenía
      // apagado.
      if (!r.ok) throw new Error("no se guardó")
    } catch {
      setPrefs(prefs)            // no se guardó: se devuelve a como estaba
    } finally {
      setGuardando(false)
    }
  }

  if (!prefs) return null

  return (
    <div style={{ margin: "0 0 0.85rem" }}>
      <Linea
        etiqueta="Mensajes privados"
        nota="Cuando alguien te escribe"
        activo={prefs.mensajes}
        onCambio={(v) => void cambiar("mensajes", v)}
        deshabilitado={guardando}
      />
      <Linea
        etiqueta="Enseñar el texto"
        nota="Apagado, el aviso dice quién escribe pero no qué"
        activo={prefs.vista_previa}
        onCambio={(v) => void cambiar("vista_previa", v)}
        deshabilitado={guardando || !prefs.mensajes}
      />
      <Linea
        etiqueta="Hitos del camino"
        nota="Subir de grado y terminar una temporada. Las insignias pequeñas no suenan"
        activo={prefs.logros}
        onCambio={(v) => void cambiar("logros", v)}
        deshabilitado={guardando}
      />
      <Linea
        etiqueta="Comunicados"
        nota="Lo que José manda a La Red: un encuentro, una transmisión"
        activo={prefs.comunicados}
        onCambio={(v) => void cambiar("comunicados", v)}
        deshabilitado={guardando}
      />
    </div>
  )
}

function Linea({
  etiqueta, nota, activo, onCambio, deshabilitado,
}: {
  etiqueta: string
  nota: string
  activo: boolean
  onCambio: (v: boolean) => void
  deshabilitado?: boolean
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.6rem",
        padding: "0.45rem 0",
        cursor: deshabilitado ? "default" : "pointer",
        opacity: deshabilitado ? 0.5 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={activo}
        disabled={deshabilitado}
        onChange={(e) => onCambio(e.target.checked)}
        style={{ marginTop: "0.2rem", accentColor: "#6D4A9B" }}
      />
      <span>
        <span style={{ display: "block", fontSize: "0.82rem", color: "#F3F6FA" }}>{etiqueta}</span>
        <span style={{ display: "block", fontSize: "0.72rem", color: "#8b90b4" }}>{nota}</span>
      </span>
    </label>
  )
}
