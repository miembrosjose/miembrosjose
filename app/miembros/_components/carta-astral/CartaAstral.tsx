"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  CARTA ASTRAL · Camino Solar
// ═══════════════════════════════════════════════════════════════════════════
//
// ── SOLO LA VE ADMINISTRACIÓN ─────────────────────────────────────────────
// Quien monta esta tarjeta lo hace dentro de un `isAdmin &&`, en
// SpaHomeShellInner. Mientras siga así, ningún miembro ve ni rastro: no
// aparece la tarjeta, no se descarga el código y no hay dirección a la que
// llegar escribiéndola a mano, porque esto no es una ruta.
//
// Cuando se abra a todo el mundo, basta quitar esa condición.
//
// ── EL CÁLCULO NO SALE DE ESTE NAVEGADOR ──────────────────────────────────
// Igual que la Cartografía Estelar: la fecha, la hora y el lugar se quedan en
// este dispositivo. No hay servidor que los vea, porque no se envían.
//
// ── SE REUTILIZA EL FORMULARIO DE LA CARTOGRAFÍA ──────────────────────────
// Pide exactamente lo mismo —fecha, hora y lugar— y ya tiene resuelta la
// parte difícil: la búsqueda de ciudad tolerante a tildes y a nombres en
// inglés. Duplicarlo habría significado arreglar dos veces el mismo fallo.

import { useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { X, Sparkles } from "lucide-react"

import { aTiempoUniversal } from "../../_lib/cartografia-estelar/astronomy/tiempo"
import type { Nacimiento } from "../../_lib/cartografia-estelar/domain/types"
import { FormularioNacimiento, type Portada } from "../cartografia-estelar/FormularioNacimiento"

import { calcularCarta } from "../../_lib/carta-astral/motor/carta"
import { pesarSignos } from "../../_lib/carta-astral/motor/pesos"
import { Lectura } from "./Lectura"


import { usePanelAPantallaCompleta } from "../../_lib/panel-modal"
import { PanelFallo } from "../PanelFallo"
import prod from "../products.module.css"
import s from "./carta.module.css"

const CLAVE = "los144k_carta_astral_nacimiento"
const VIOLET = "#a78bca"

/**
 * Lo primero que se lee al abrir.
 *
 * ── POR QUÉ ESTABA MAL ────────────────────────────────────────────────────
 * El formulario se comparte con la Cartografía Estelar —piden lo mismo y la
 * búsqueda de ciudad es complicada de hacer bien—, pero el TEXTO venía fijo
 * dentro. Así que al abrir la Carta Astral ponía «Traza tu cartografía» y
 * «50 puntos del cielo», que es otra herramienta. Parecía que te habías
 * equivocado de botón.
 *
 * Lo detectó José: «es igual a cartografía estelar».
 *
 * ── Y POR QUÉ DICE LO QUE DICE ────────────────────────────────────────────
 * Quien abre esto por primera vez no sabe qué es una carta astral, o cree
 * que es el horóscopo del periódico. Antes de pedirle la hora exacta de su
 * nacimiento conviene decirle para qué se la estamos pidiendo.
 */
const PORTADA: Portada = {
  kicker: "Carta Astral · Camino Solar",
  titulo: "Calcula tu carta astral",
  entrada:
    "Una carta astral es el mapa del cielo en el minuto y el lugar exactos en que naciste: " +
    "dónde estaba cada planeta visto desde ahí. No es el horóscopo del periódico, que solo " +
    "mira tu signo solar — aquí entran los diez planetas, las doce casas y las distancias " +
    "entre ellos.",
  matiz:
    "Después la leemos desde el Camino Solar: qué signos pesan en ti, cuáles faltan, y qué " +
    "sistema orgánico señala cada uno. Hace falta la hora lo más aproximada que puedas: " +
    "el Ascendente cambia cada cuatro minutos.",
  accion: "Calcular mi carta astral",
}

function guardar(n: Nacimiento) {
  try { localStorage.setItem(CLAVE, JSON.stringify(n)) } catch { /* cuota llena */ }
}
function recuperar(): Nacimiento | null {
  try {
    const raw = localStorage.getItem(CLAVE)
    return raw ? (JSON.parse(raw) as Nacimiento) : null
  } catch { return null }
}
function olvidar() {
  try { localStorage.removeItem(CLAVE) } catch { /* bloqueado */ }
}

export function CartaAstral() {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={prod.card}
        style={{ cursor: "pointer", position: "relative" }}
      >
        {/* El letrero de NUEVO. Se quita borrando este bloque. */}
        <span className={s.etiquetaNuevo}>Nuevo</span>

        <div className={prod.thumb}>
          {/* Marcador: la portada se cambia luego, como en las demás
              herramientas. Hasta entonces, algo que no parezca un hueco. */}
          <div className={s.portadaProvisional}>
            <Sparkles size={26} color={VIOLET} aria-hidden />
          </div>
        </div>

        <div className={prod.body}>
          <h3 className={prod.name} style={{ color: "#F3F6FA" }}>Carta Astral · Camino Solar</h3>
          <p className={s.kicker}>Planetas · casas · sistemas</p>
        </div>
      </button>

      {abierto && <Panel onClose={() => setAbierto(false)} />}
    </>
  )
}

function Panel({ onClose }: { onClose: () => void }) {
  const { montado, propsDelFondo } = usePanelAPantallaCompleta(onClose)

  const [nacimiento, setNacimiento] = useState<Nacimiento | null>(() => recuperar())
  const [error, setError] = useState<string | null>(null)

  // El cálculo entero, de una vez. Es determinista y rápido: no hace falta
  // trocearlo ni guardarlo en ningún sitio.
  const calculo = useMemo(() => {
    if (!nacimiento) return null
    try {
      const { utcMs, desfaseTexto } = aTiempoUniversal(nacimiento)
      const carta = calcularCarta(utcMs, nacimiento.lugar.latitud, nacimiento.lugar.longitud)
      return { carta, pesos: pesarSignos(carta), desfaseTexto }
    } catch (e) {
      // Un fallo aquí casi siempre es una zona horaria que el navegador no
      // conoce. Se dice, en vez de dejar la pantalla en blanco.
      return { fallo: e instanceof Error ? e.message : "No se pudo calcular." } as const
    }
  }, [nacimiento])

  const trazar = (n: Nacimiento) => {
    setError(null)
    guardar(n)
    setNacimiento(n)
  }

  const reiniciar = () => {
    olvidar()
    setNacimiento(null)
    setError(null)
  }

  if (!montado) return null

  return createPortal(
    <div className={s.fondo} {...propsDelFondo} role="dialog" aria-label="Carta Astral">
      <div className={s.panel}>
        <button type="button" onClick={onClose} aria-label="Cerrar" className={s.cerrar}>
          <X size={18} />
        </button>

        <div className={s.scroll}>
          <PanelFallo modulo="Carta Astral" onReiniciar={reiniciar}>
            {!nacimiento || !calculo ? (
              <FormularioNacimiento onTrazar={trazar} error={error} portada={PORTADA} />
            ) : "fallo" in calculo ? (
              <div className={s.aviso}>
                <p>{calculo.fallo}</p>
                <button type="button" className={s.secundario} onClick={reiniciar}>
                  Volver a escribir mis datos
                </button>
              </div>
            ) : (
              <Lectura
                carta={calculo.carta}
                pesos={calculo.pesos}
                nacimiento={nacimiento}
                desfase={calculo.desfaseTexto}
                onReiniciar={reiniciar}
              />
            )}
          </PanelFallo>
        </div>
      </div>
    </div>,
    document.body,
  )
}
