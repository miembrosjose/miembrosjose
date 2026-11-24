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

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X, Sparkles } from "lucide-react"

import { aTiempoUniversal } from "../../_lib/cartografia-estelar/astronomy/tiempo"
import type { Nacimiento } from "../../_lib/cartografia-estelar/domain/types"
import { FormularioNacimiento, type Portada } from "../cartografia-estelar/FormularioNacimiento"

import { calcularCarta } from "../../_lib/carta-astral/motor/carta"
import { pesarSignos } from "../../_lib/carta-astral/motor/pesos"
import { Lectura } from "./Lectura"


import { usePanelAPantallaCompleta } from "../../_lib/panel-modal"
import { useProducts } from "../../_lib/use-products"
import { useProductAccess } from "../../_lib/use-product-access"
import {
  isCartaAstralToolProduct, numeroLibre, CARTA_ASTRAL_PRODUCT_NUM,
} from "../../_lib/tool-products"
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

/** ¿La portada es un vídeo? Mismo criterio que el resto de la Biblioteca. */
const esVideo = (u?: string | null) => !!u && /\.(mp4|webm|mov)(\?|$)/i.test(u)

export function CartaAstral() {
  const [abierto, setAbierto] = useState(false)

  // ── LA PORTADA SE EDITA DESDE «GESTIONAR PRODUCTOS» ───────────────────
  // Igual que Numerología, Código de Origen y Cartografía: detrás de la
  // tarjeta hay un producto de la Biblioteca, y de ahí salen la portada y el
  // nombre. Sin esto, la Carta Astral no aparecía en la lista de Gestionar y
  // no había forma de cambiarle la imagen sin tocar código.
  const { products, loading: cargandoProductos, createProduct } = useProducts()
  const producto = useMemo(() => products.find(isCartaAstralToolProduct) ?? null, [products])
  const { isAdminOverride } = useProductAccess()

  // Alta automática, una sola vez y solo para administración.
  const sembrado = useRef(false)
  useEffect(() => {
    if (sembrado.current || !isAdminOverride || cargandoProductos || producto) return
    // Salvaguarda: si ese número ya lo tiene otro producto, no se siembra.
    // Sembrar encima secuestraría la tarjeta ajena, que es justo lo que pasó
    // cuando estos números eran 94 y 95.
    if (!numeroLibre(CARTA_ASTRAL_PRODUCT_NUM, products)) return
    sembrado.current = true
    createProduct({
      num: CARTA_ASTRAL_PRODUCT_NUM, name: "Carta Astral · Camino Solar",
      description: "El mapa del cielo del minuto en que naciste, leído desde el Camino Solar: qué signos pesan en ti y qué sistema orgánico señala cada uno.",
      category: "biblioteca", gradient: "linear-gradient(135deg, #04040c 0%, #6D4A9B 100%)",
      emoji: "☉", sort_order: 5, is_locked: false, price_cents: 0, currency: "usd",
    } as never).catch(() => { /* si falla, no reintentar en bucle */ })
  }, [isAdminOverride, cargandoProductos, producto, products, createProduct])

  const portada = (producto as { media_url?: string } | null)?.media_url || null
  const titulo = producto?.name?.trim() || "Carta Astral · Camino Solar"

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
          {portada ? (
            esVideo(portada)
              ? <video src={portada} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline loop autoPlay />
              : <img src={portada} alt={titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            // Mientras no haya portada puesta desde Gestionar, algo que no
            // parezca un hueco.
            <div className={s.portadaProvisional}>
              <Sparkles size={26} color={VIOLET} aria-hidden />
            </div>
          )}
        </div>

        <div className={prod.body}>
          <h3 className={prod.name} style={{ color: "#F3F6FA" }}>{titulo}</h3>
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
