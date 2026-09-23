"use client"

// CARTOGRAFÍA ESTELAR 144 — entrada y orquestación.
//
// ── DOS VISTAS, UN SOLO ESTADO ─────────────────────────────────────────────
// El mapa 3D y la lista NO son dos herramientas: son la misma información con
// la misma selección. Si eliges Sirio en la lista y cambias al mapa, la cámara
// vuela a Sirio. Si estás en Sirio en el mapa y cambias a la lista, Sirio
// sigue seleccionado y desplegado. Por eso `seleccionado`, `orden` y `filtros`
// viven aquí y no dentro de cada vista.
//
// ── EL PAQUETE INICIAL NO LLEVA THREE.JS ───────────────────────────────────
// Mapa3D se carga con import dinámico y solo cuando alguien pide esa vista.
// La lista es la vista por defecto en móvil y funciona entera sin WebGL, que
// además la convierte en el equivalente accesible del lienzo.
//
// ── PRIVACIDAD ─────────────────────────────────────────────────────────────
// El cálculo entero ocurre en este navegador. La fecha, la hora y el lugar se
// guardan en localStorage de este dispositivo y no se envían a ningún sitio.

import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X, Sparkles, Info, Box, List, Layers, RotateCcw } from "lucide-react"
import { construirCartografia } from "../../_lib/cartografia-estelar/domain/construir"
import { contenidoPortal } from "../../_lib/cartografia-estelar/content/portales"
import { AVISO_DOS_CAPAS } from "../../_lib/cartografia-estelar/content/avisos"
import type { Cartografia, Nacimiento } from "../../_lib/cartografia-estelar/domain/types"
import { Metodologia } from "./Metodologia"
import { FormularioNacimiento } from "./FormularioNacimiento"
import { PrimeraExperiencia } from "./PrimeraExperiencia"
import { VistaPortal } from "./VistaPortal"
import { SintesisGlobal } from "./SintesisGlobal"
import { VistaLista, FILTROS_VACIOS, type Filtros, type Orden } from "./VistaLista"
import { useProducts } from "../../_lib/use-products"
import { useProductAccess } from "../../_lib/use-product-access"
import { isCartografiaToolProduct, CARTOGRAFIA_PRODUCT_NUM } from "../../_lib/tool-products"
import prod from "../products.module.css"
import s from "./cartografia.module.css"

// Three.js fuera del paquete inicial de /miembros. Mientras carga, la lista
// sigue disponible: nadie se queda mirando un hueco.
const Mapa3D = dynamic(() => import("./Mapa3D"), {
  ssr: false,
  loading: () => <div className={s.cargando3d}>Cargando el mapa…</div>,
})

const CLAVE = "los144k_cartografia_estelar_nacimiento"
const CLAVE_INTRO = "los144k_cartografia_estelar_intro_vista"
const VIOLET = "#a78bca"

type Vista = "mapa" | "lista" | "sintesis"

function guardar(n: Nacimiento) {
  try { localStorage.setItem(CLAVE, JSON.stringify(n)) } catch { /* cuota */ }
}
function recuperar(): Nacimiento | null {
  try {
    const raw = localStorage.getItem(CLAVE)
    return raw ? (JSON.parse(raw) as Nacimiento) : null
  } catch { return null }
}
/**
 * Borra los datos guardados en ESTE dispositivo.
 *
 * Es todo lo que hay que borrar: nunca se enviaron a ningún servidor. Se
 * olvida también que la introducción ya se vio, porque quien cambia sus datos
 * suele querer volver a recorrer la explicación con los nuevos.
 */
function olvidar() {
  try {
    localStorage.removeItem(CLAVE)
    localStorage.removeItem(CLAVE_INTRO)
  } catch { /* almacenamiento bloqueado */ }
}
function introVista(): boolean {
  try { return localStorage.getItem(CLAVE_INTRO) === "1" } catch { return false }
}
function marcarIntroVista() {
  try { localStorage.setItem(CLAVE_INTRO, "1") } catch { /* cuota */ }
}

/** ¿La portada es un vídeo? Mismo criterio que el resto de la Biblioteca. */
const esVideo = (u?: string | null) => !!u && /\.(mp4|webm|mov)(\?|$)/i.test(u)

export function CartografiaEstelar() {
  const [abierto, setAbierto] = useState(false)
  const [tiene, setTiene] = useState(false)

  useEffect(() => { setTiene(recuperar() !== null) }, [abierto])

  // ── Portada, nombre y descripción, editables desde "Gestionar" ──
  // Igual que Numerología Cósmica y Lugares de Contacto: la tarjeta se apoya
  // en un producto de la Biblioteca. El num estable mantiene el vínculo
  // aunque se renombre.
  const { products, loading: cargandoProductos, createProduct } = useProducts()
  const producto = useMemo(() => products.find(isCartografiaToolProduct) ?? null, [products])
  const { isAdminOverride } = useProductAccess()

  // Alta automática una sola vez, y solo para administración.
  const sembrado = useRef(false)
  useEffect(() => {
    if (sembrado.current || !isAdminOverride || cargandoProductos || producto) return
    sembrado.current = true
    createProduct({
      num: CARTOGRAFIA_PRODUCT_NUM, name: "Cartografía Estelar 144",
      description: "Compara tu nacimiento con 50 puntos del cielo: estrellas, cúmulos, nebulosas, galaxias y centros del universo.",
      category: "biblioteca", gradient: "linear-gradient(135deg, #04040c 0%, #6D4A9B 100%)",
      emoji: "✨", sort_order: 4, is_locked: false, price_cents: 0, currency: "usd",
    } as never).catch(() => { /* si falla, no reintentar en bucle */ })
  }, [isAdminOverride, cargandoProductos, producto, createProduct])

  const portada = producto?.media_url || null
  const titulo = producto?.name?.trim() || "Cartografía Estelar 144"
  const descripcion = producto?.description?.trim()

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} className={prod.card} style={{ cursor: "pointer" }}>
        <div className={prod.thumb}>
          {portada ? (
            esVideo(portada)
              ? <video src={portada} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline loop autoPlay />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={portada} alt={titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div className={s.portada}>
              <span className={s.portadaEstrellas} aria-hidden />
              <Sparkles size={48} strokeWidth={1.1} className={s.portadaIcono} />
            </div>
          )}
        </div>
        <div className={prod.body}>
          <h3 className={prod.name} style={{ color: "#F3F6FA" }}>{titulo}</h3>
          <p style={{ margin: 0, fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", color: VIOLET, fontFamily: "var(--font-mono,monospace)" }}>
            Estrellas · cúmulos · centros
          </p>
          <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "#a8a8c0", lineHeight: 1.45 }}>
            {tiene
              ? "Tu cartografía está trazada. Vuelve a explorarla cuando quieras."
              : (descripcion || "Compara tu nacimiento con una selección de estrellas, cúmulos y centros cósmicos.")}
          </p>
        </div>
      </button>

      {abierto && <Panel onClose={() => setAbierto(false)} />}
    </>
  )
}

function Panel({ onClose }: { onClose: () => void }) {
  const [montado, setMontado] = useState(false)
  const [nacimiento, setNacimiento] = useState<Nacimiento | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [enIntro, setEnIntro] = useState(false)
  const [vista, setVista] = useState<Vista>("lista")
  const [portalAbierto, setPortalAbierto] = useState<string | null>(null)
  const [verMetodologia, setVerMetodologia] = useState(false)

  // Estado COMPARTIDO entre mapa y lista.
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [orden, setOrden] = useState<Orden>("resonancia")
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS)

  const [confirmarReinicio, setConfirmarReinicio] = useState(false)

  // ── Volver arriba al cambiar de pantalla ──
  // Sin esto, al pasar de un paso al siguiente la pantalla nueva aparece
  // desplazada por donde estaba la anterior: se entra por la mitad del texto
  // y el título no se ve.
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const arriba = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    // "auto" y no "smooth": al cambiar de pantalla el desplazamiento animado
    // se percibe como que la página se mueve sola.
    el.scrollTo({ top: 0, behavior: "auto" })
  }, [])

  useEffect(() => {
    setMontado(true)
    const guardado = recuperar()
    setNacimiento(guardado)
    if (guardado && !introVista()) setEnIntro(true)

    // ── Bloqueo del fondo ──
    // `overflow: hidden` en el cuerpo NO basta en Safari de iOS: al arrastrar
    // dentro del panel, la página de detrás se mueve igual. Lo que sí funciona
    // es fijar el cuerpo y compensar con la posición de desplazamiento, que se
    // restaura al cerrar para no perder el sitio donde estaba la persona.
    const y = window.scrollY
    const previo = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    }
    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.top = `-${y}px`
    document.body.style.width = "100%"

    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", esc)
    return () => {
      document.body.style.overflow = previo.overflow
      document.body.style.position = previo.position
      document.body.style.top = previo.top
      document.body.style.width = previo.width
      window.scrollTo(0, y)
      window.removeEventListener("keydown", esc)
    }
  }, [onClose])

  const carto = useMemo<Cartografia | null>(() => {
    if (!nacimiento) return null
    try { return construirCartografia(nacimiento) } catch { return null }
  }, [nacimiento])

  const trazar = useCallback((n: Nacimiento) => {
    try {
      construirCartografia(n) // valida antes de guardar
      guardar(n)
      setNacimiento(n)
      setError(null)
      setEnIntro(!introVista())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revisa los datos")
    }
  }, [])

  const terminarIntro = useCallback(() => {
    marcarIntroVista()
    setEnIntro(false)
  }, [])

  const abrirPortal = useCallback((id: string) => {
    setSeleccionado(id)
    setPortalAbierto(id)
  }, [])

  /** Vuelve al formulario en blanco. Todo lo demás se recalcula solo. */
  const reiniciar = useCallback(() => {
    olvidar()
    setNacimiento(null)
    setError(null)
    setEnIntro(false)
    setPortalAbierto(null)
    setVerMetodologia(false)
    setSeleccionado(null)
    setFiltros(FILTROS_VACIOS)
    setOrden("resonancia")
    setVista("lista")
    setConfirmarReinicio(false)
  }, [])

  useEffect(() => { arriba() }, [vista, portalAbierto, verMetodologia, enIntro, arriba])

  if (!montado) return null

  const contenido = () => {
    if (!carto) return <FormularioNacimiento onTrazar={trazar} error={error} />
    if (verMetodologia) {
      return (
        <Metodologia
          carto={carto}
          onVolver={() => setVerMetodologia(false)}
          onReiniciar={() => setConfirmarReinicio(true)}
        />
      )
    }
    if (enIntro) return <PrimeraExperiencia carto={carto} onTerminar={terminarIntro} onCambioDePaso={arriba} />
    if (portalAbierto) {
      return (
        <VistaPortal
          carto={carto}
          portalId={portalAbierto}
          onVolver={() => setPortalAbierto(null)}
          onIrAPortal={abrirPortal}
          onCambioDePortal={arriba}
        />
      )
    }

    return (
      <>
        {/* El selector va arriba del todo y es lo primero que se toca. */}
        <div className={s.selectorVista} role="tablist" aria-label="Cómo ver tu cartografía">
          <button
            type="button" role="tab" aria-selected={vista === "mapa"}
            className={vista === "mapa" ? s.pestanaActiva : s.pestana}
            onClick={() => setVista("mapa")}
          >
            <Box size={14} /> Mapa 3D
          </button>
          <button
            type="button" role="tab" aria-selected={vista === "lista"}
            className={vista === "lista" ? s.pestanaActiva : s.pestana}
            onClick={() => setVista("lista")}
          >
            <List size={14} /> Lista
          </button>
          <button
            type="button" role="tab" aria-selected={vista === "sintesis"}
            className={vista === "sintesis" ? s.pestanaActiva : s.pestana}
            onClick={() => setVista("sintesis")}
          >
            <Layers size={14} /> Síntesis
          </button>
        </div>

        {vista === "mapa" && (
          <>
            <Mapa3D
              carto={carto}
              seleccionado={seleccionado}
              onSeleccionar={setSeleccionado}
              destacados={null}
              nivel={seleccionado ? 3 : 1}
              puntoResaltado={null}
            />
            {seleccionado && <FichaMapa carto={carto} portalId={seleccionado} onAbrir={abrirPortal} />}
          </>
        )}

        {vista === "lista" && (
          <VistaLista
            carto={carto}
            seleccionado={seleccionado}
            onSeleccionar={(id) => setSeleccionado(id === seleccionado ? null : id)}
            onAbrir={abrirPortal}
            orden={orden}
            onOrden={setOrden}
            filtros={filtros}
            onFiltros={setFiltros}
          />
        )}

        {vista === "sintesis" && <SintesisGlobal carto={carto} onAbrirPortal={abrirPortal} />}

        <div className={s.pie}>
          <button type="button" className={s.secundario} onClick={() => setVerMetodologia(true)}>
            <Info size={13} /> ¿De dónde sale todo esto?
          </button>
          <button type="button" className={s.secundario} onClick={() => setConfirmarReinicio(true)}>
            <RotateCcw size={13} /> Cambiar mis datos
          </button>
        </div>
        <p className={s.avisoCapas}>{AVISO_DOS_CAPAS}</p>
      </>
    )
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[600] flex items-start justify-center sm:items-center"
      style={{
        background: "rgba(2,2,8,0.95)",
        backdropFilter: "blur(8px)",
        padding: "calc(env(safe-area-inset-top,0px) + 12px) 10px calc(env(safe-area-inset-bottom,0px) + 12px)",
        overscrollBehavior: "contain",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-label="Cartografía Estelar 144"
    >
      <div className={s.panel}>
        <button type="button" onClick={onClose} aria-label="Cerrar" className={s.cerrar}>
          <X size={18} />
        </button>
        <div className={s.scroll} ref={scrollRef}>{contenido()}</div>

        {/* Se confirma antes de borrar. No es grave —los datos se vuelven a
            escribir en un minuto— pero perder una cartografía que llevabas
            explorando días sin querer sí sería molesto. */}
        {confirmarReinicio && (
          <div
            className={s.cajonFondo}
            onClick={(e) => { if (e.target === e.currentTarget) setConfirmarReinicio(false) }}
          >
            <div className={s.cajon} role="dialog" aria-label="Cambiar mis datos">
              <div className={s.cajonCabecera}>
                <h3 className={s.cajonTitulo}>¿Cambiar tus datos?</h3>
                <button
                  type="button"
                  onClick={() => setConfirmarReinicio(false)}
                  aria-label="Cerrar"
                  className={s.cajonCerrar}
                >
                  <X size={16} />
                </button>
              </div>
              <div className={s.cajonCuerpo}>
                <p className={s.parrafo}>
                  Se borrará la fecha, la hora y el lugar que guardaste en este dispositivo,
                  y volverás a empezar desde el formulario.
                </p>
                <p className={s.parrafoSecundario}>
                  Tu cartografía no se pierde para siempre: si vuelves a escribir los mismos
                  datos, sale exactamente la misma. No hay nada guardado en ningún servidor.
                </p>
                <div className={s.confirmarBotones}>
                  <button type="button" className={s.primario} onClick={reiniciar}>
                    Sí, empezar de nuevo
                  </button>
                  <button
                    type="button"
                    className={s.secundario}
                    onClick={() => setConfirmarReinicio(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

/** Lo que aparece al seleccionar un portal en el mapa 3D. */
function FichaMapa({ carto, portalId, onAbrir }: {
  carto: Cartografia
  portalId: string
  onAbrir: (id: string) => void
}) {
  const r = carto.resonancias.find((x) => x.portalId === portalId)
  const c = contenidoPortal(portalId)
  if (!r || !c) return null

  return (
    <div className={s.fichaMapa}>
      <p className={s.fichaEsencia}>{c.esencia}</p>
      <p className={s.fichaDatos}>
        Resonancia <strong>{r.resonancia}</strong> · {r.contactos.length}{" "}
        {r.contactos.length === 1 ? "contacto" : "contactos"}
      </p>
      <button type="button" className={s.primario} onClick={() => onAbrir(portalId)}>
        Entrar en esta resonancia
      </button>
    </div>
  )
}
