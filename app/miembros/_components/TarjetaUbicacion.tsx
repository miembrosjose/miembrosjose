"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  «TODAVÍA NO ESTÁS EN EL MAPA» · la tarjeta del inicio
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ EXISTE ────────────────────────────────────────────────────────
// Hasta el 26-11-2026 el selector de ubicación solo ofrecía 46 países y 235
// ciudades, porque la lista salía de un catálogo sembrado a mano. Mucha gente
// entró, no encontró su país —o encontró el país y no su ciudad— y lo dejó.
// Esa gente no está en el mapa, y no es porque no quisiera.
//
// El catálogo ya está arreglado, pero nadie va a volver a mirar por su cuenta
// una pantalla que la primera vez no le sirvió. Hay que decírselo.
//
// ── POR QUÉ UNA TARJETA Y NO UN AVISO AL MÓVIL ────────────────────────────
// Porque esto no ocurre ahora. Una notificación es para lo que pasa hoy —una
// sesión en vivo, un encuentro—, y gastarla en mantenimiento le quita fuerza
// para cuando de verdad haga falta. Tampoco una ventana: al entrar ya hay un
// gate de perfil incompleto, y dos interrupciones seguidas se cierran las dos
// sin leerse.
//
// Va donde ya viven los avisos del inicio y usa la caja de la tarjeta de
// notificaciones. No inventa nada visual a propósito.
//
// ── A QUIÉN SE LE ENSEÑA, Y A QUIÉN NO ────────────────────────────────────
//   sin ubicación      sí — nunca llegó a ponerla
//   país sin ciudad    sí, y con OTRO texto — esta persona lo intentó
//   ciudad oculta      NO. Eligió no aparecer en el mapa, y eso es una
//                      decisión, no un hueco que rellenar. Pedirle que
//                      «actualice su ubicación» es pedirle que deshaga lo
//                      que decidió.
//
// Esa última regla es la misma que gobierna la tarjeta de notificaciones, y
// la misma que escribe el aviso del perfil: insistir después de que alguien
// ya eligió es acoso.

import { useEffect, useState } from "react"
import { MapPin, X } from "lucide-react"
import estilos from "./TarjetaNotificaciones.module.css"

/** Dónde se anota que alguien la cerró. Por dispositivo. */
const CLAVE_APLAZADA = "los144k_ubicacion_aplazada"

/**
 * Cuánto se calla después de un «ahora no».
 *
 * No es para siempre: quien la cierra un martes con prisa no está diciendo
 * «nunca», está diciendo «ahora no». Y no es tampoco una semana, porque
 * entonces vuelve antes de que a nadie se le haya olvidado que la cerró.
 *
 * Quien SÍ pone su ubicación deja de verla para siempre, y eso no depende de
 * este plazo ni de este dispositivo: depende del servidor, que es donde está
 * la verdad.
 */
const DIAS_CALLADA = 30

type Estado = "cargando" | "sin_poner" | "sin_ciudad" | "nada"

/**
 * ¿Se cerró hace poco?
 *
 * ── LO QUE ESTE RECUERDO NO SABE ──────────────────────────────────────────
 * Vive en el navegador, así que es POR DISPOSITIVO: cerrarla en el ordenador
 * no la calla en el móvil. Y en un iPhone, la aplicación instalada tiene su
 * propio almacenamiento, distinto del navegador.
 *
 * Se acepta a cambio de no tener que guardar en la base de datos un «no me
 * apetece ahora». Lo que no se acepta es que un fallo al leerlo haga
 * desaparecer la tarjeta: ante la duda, se enseña.
 */
function seCerroHacePoco(): boolean {
  try {
    const guardado = localStorage.getItem(CLAVE_APLAZADA)
    if (!guardado) return false
    const cuando = Number(guardado)
    if (!Number.isFinite(cuando)) return false
    return Date.now() - cuando < DIAS_CALLADA * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export function TarjetaUbicacion() {
  const [estado, setEstado] = useState<Estado>("cargando")

  useEffect(() => {
    let vivo = true
    void (async () => {
      // Si la cerró hace poco no se pregunta nada: una consulta para no
      // enseñar nada es una consulta de más en la pantalla de inicio.
      if (seCerroHacePoco()) { if (vivo) setEstado("nada"); return }
      try {
        const r = await fetch("/api/red/ubicacion", { credentials: "include" })
        if (!r.ok) throw new Error("ubicacion")
        const d = await r.json()
        if (!vivo) return
        const loc = d.location as { city_id: number | null } | null
        if (!loc) setEstado("sin_poner")
        else if (loc.city_id === null) setEstado("sin_ciudad")
        // Con ciudad puesta no se dice nada, se muestre o no en el mapa.
        else setEstado("nada")
      } catch {
        // Un fallo de red no es motivo para dar la lata. Se calla.
        if (vivo) setEstado("nada")
      }
    })()
    return () => { vivo = false }
  }, [])

  if (estado === "cargando" || estado === "nada") return null

  function cerrar() {
    try { localStorage.setItem(CLAVE_APLAZADA, String(Date.now())) } catch { /* modo privado */ }
    setEstado("nada")
  }

  // ── DOS MENSAJES, PORQUE SON DOS SITUACIONES ──────────────────────────
  // A quien lo intentó y se quedó a medias hay que decirle que vuelva a
  // intentarlo, y POR QUÉ: si se le repite la misma invitación de siempre,
  // da por hecho que le va a pasar lo mismo que la otra vez.
  const loIntento = estado === "sin_ciudad"

  return (
    <div className={estilos.caja}>
      <div className={estilos.icono}>
        <MapPin size={16} />
      </div>

      <div className={estilos.cuerpo}>
        <p className={estilos.titulo}>
          {loIntento ? "Ya está tu ciudad en el mapa" : "Todavía no estás en el mapa de la Red"}
        </p>
        <p className={estilos.texto}>
          {loIntento
            ? "Elegiste tu país pero no llegaste a marcar tu ciudad. Hasta hace poco el buscador " +
              "solo tenía unas pocas; ahora están todas. Vuelve y busca la tuya."
            : "Marca tu país y tu ciudad para encontrar a miembros de 144 mil cerca de ti. " +
              "Tú decides después si tu ciudad se muestra: puedes estar en la Red sin que nadie " +
              "sepa dónde vives."}
        </p>

        {/* Lleva a la pantalla donde se arregla, y al bloque exacto. Mandar a
            la página de perfil a secas obligaría a bajar buscando cuál de las
            siete secciones es. */}
        <a href="/miembros/perfil#lugar" className={estilos.boton}>
          <MapPin size={13} />
          {loIntento ? "Marcar mi ciudad" : "Marcar mi lugar"}
        </a>
      </div>

      <button type="button" onClick={cerrar} className={estilos.cerrar} aria-label="Ahora no">
        <X size={15} />
      </button>
    </div>
  )
}
