"use client"

// CÓDIGO DE ORIGEN — herramienta hermana de Numerología Cósmica.
//
// Misma tarjeta, mismo overlay, misma paleta y la MISMA estructura de bloques
// numerados: quien conoce una sabe leer la otra sin que nadie se lo explique.
//
// El cálculo ocurre ENTERO en el navegador: la fecha y la hora de nacimiento
// no salen del dispositivo, no se envían a ningún servicio y no se guardan en
// el servidor. Lo único que persiste es la última lectura, en este navegador.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X, Compass, RefreshCw } from "lucide-react"
import { calcularCodigoOrigen } from "../_lib/codigo-origen/engine"
import { construirSintesis144, fechaDesdeNumerologia } from "../_lib/codigo-origen/sintesis-144"
import { FRECUENCIAS } from "../_lib/codigo-origen/interpretations"
import type { CodigoOrigenResultado, Nacimiento } from "../_lib/codigo-origen/types"
import { useProducts } from "../_lib/use-products"
import { useProductAccess } from "../_lib/use-product-access"
import { isCodigoOrigenToolProduct, numeroLibre, CODIGO_ORIGEN_PRODUCT_NUM } from "../_lib/tool-products"
import { CabeceraRecurso } from "./CabeceraRecurso"
import { ComoSaleElPorcentaje } from "./ComoSaleElPorcentaje"
import prod from "./products.module.css"
import s from "./codigo-origen.module.css"
import { usePanelAPantallaCompleta } from "../_lib/panel-modal"
import { PanelFallo } from "./PanelFallo"

// Exactamente los de NumerologiaCosmica.tsx. Si allí cambian, aquí también.
const GOLD = "#e6cf95"
const GOLD_DEEP = "#c9a86b"
const VIOLET = "#a78bca"

const ULTIMA = "los144k_codigo_origen_last"

function guardar(n: Nacimiento) {
  try { localStorage.setItem(ULTIMA, JSON.stringify(n)) } catch { /* cuota */ }
}
function recuperar(): Nacimiento | null {
  try {
    const raw = localStorage.getItem(ULTIMA)
    return raw ? (JSON.parse(raw) as Nacimiento) : null
  } catch { return null }
}

/** ¿La portada es un vídeo? Mismo criterio que el resto de la Biblioteca. */
const esVideo = (u?: string | null) => !!u && /\.(mp4|webm|mov)(\?|$)/i.test(u)

export function CodigoOrigen() {
  const [abierto, setAbierto] = useState(false)
  const [guardado, setGuardado] = useState<Nacimiento | null>(null)

  useEffect(() => { setGuardado(recuperar()) }, [])

  // ── Portada, nombre y descripción, editables desde "Gestionar" ──
  // Igual que Numerología Cósmica y Lugares de Contacto.
  const { products, loading: cargandoProductos, createProduct } = useProducts()
  const producto = useMemo(() => products.find(isCodigoOrigenToolProduct) ?? null, [products])
  const { isAdminOverride } = useProductAccess()

  const sembrado = useRef(false)
  useEffect(() => {
    if (sembrado.current || !isAdminOverride || cargandoProductos || producto) return
    // Salvaguarda: si ese número ya lo tiene otro producto, no se siembra.
    // Sembrar encima secuestraría la tarjeta ajena, que es justo lo que pasó
    // cuando estos números eran 94 y 95.
    if (!numeroLibre(CODIGO_ORIGEN_PRODUCT_NUM, products)) return
    sembrado.current = true
    createProduct({
      num: CODIGO_ORIGEN_PRODUCT_NUM, name: "Código de Origen",
      description: "Una lectura simbólica de las frecuencias presentes en el momento de tu nacimiento.",
      category: "biblioteca", gradient: "linear-gradient(135deg, #0c0a1c 0%, #6D4A9B 100%)",
      emoji: "🧭", sort_order: 3, is_locked: false, price_cents: 0, currency: "usd",
    } as never).catch(() => { /* si falla, no reintentar en bucle */ })
  }, [isAdminOverride, cargandoProductos, producto, products, createProduct])

  const portada = producto?.media_url || null
  const titulo = producto?.name?.trim() || "Código de Origen"
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
              <span className={s.portadaHalo} aria-hidden />
              <Compass size={52} strokeWidth={1.2} className={s.portadaIcono} />
            </div>
          )}
        </div>
        <div className={prod.body}>
          <h3 className={prod.name} style={{ color: "#F3F6FA" }}>{titulo}</h3>
          <p style={{ margin: 0, fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", color: VIOLET, fontFamily: "var(--font-mono,monospace)" }}>
            Frecuencias · Vector · Arquetipo
          </p>
          <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "#a8a8c0", lineHeight: 1.45 }}>
            {guardado
              ? "Tu lectura está guardada en este dispositivo. Ábrela cuando quieras."
              : (descripcion || "Una lectura simbólica de las frecuencias presentes en el momento de tu nacimiento.")}
          </p>
        </div>
      </button>

      {abierto && <Panel onClose={() => setAbierto(false)} />}
    </>
  )
}

// ── Overlay ─────────────────────────────────────────────────────────────────
function Panel({ onClose }: { onClose: () => void }) {
  const { montado, propsDelFondo } = usePanelAPantallaCompleta(onClose)

  const [nacimiento, setNacimiento] = useState<Nacimiento | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Lo guardado en este dispositivo, una sola vez al abrir.
  useEffect(() => { setNacimiento(recuperar()) }, [])

  const resultado = useMemo(() => {
    if (!nacimiento) return null
    try { return calcularCodigoOrigen(nacimiento) } catch { return null }
  }, [nacimiento])

  const calcular = useCallback((n: Nacimiento) => {
    try {
      calcularCodigoOrigen(n) // valida antes de guardar
      guardar(n)
      setNacimiento(n)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revisa los datos")
    }
  }, [])

  if (!montado) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[600] flex items-start justify-center sm:items-center"
      style={{
        background: "rgba(4,5,12,0.9)",
        backdropFilter: "blur(6px)",
        padding: "calc(env(safe-area-inset-top,0px) + 16px) 12px calc(env(safe-area-inset-bottom,0px) + 16px)",
        overscrollBehavior: "contain",
      }}
      {...propsDelFondo}
      role="dialog"
      aria-label="Código de Origen"
    >
      <div className={s.panel}>
        <button type="button" onClick={onClose} aria-label="Cerrar" className={s.cerrar}>
          <X size={18} />
        </button>

        <div className={s.scroll}>
          {/* Si algo falla al dibujar, el panel se queda y lo dice. */}
          <PanelFallo
            modulo="Código de Origen"
            onReiniciar={() => { setNacimiento(null); setError(null) }}
          >
            {!resultado
              ? <Formulario onCalcular={calcular} error={error} />
              : <Lectura r={resultado} onRehacer={() => { setNacimiento(null); setError(null) }} />}
          </PanelFallo>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ── Formulario ──────────────────────────────────────────────────────────────
function Formulario({
  onCalcular, error,
}: {
  onCalcular: (n: Nacimiento) => void
  error: string | null
}) {
  // Si Numerología Cósmica ya guardó la fecha, se reutiliza. No se vuelve a
  // pedir lo que la persona ya dio en la herramienta hermana.
  const heredada = useMemo(() => fechaDesdeNumerologia(), [])

  const [fecha, setFecha] = useState(
    heredada
      ? `${heredada.anio}-${String(heredada.mes).padStart(2, "0")}-${String(heredada.dia).padStart(2, "0")}`
      : "",
  )
  const [hora, setHora] = useState("12:00")

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    // Se parte por separadores en vez de usar `new Date`: esa función
    // interpreta la cadena según la zona horaria y podría devolver el día
    // anterior. El día que se escribe es el día que se calcula.
    const [anio, mes, dia] = fecha.split("-").map((v) => parseInt(v, 10))
    const [h, min] = hora.split(":").map((v) => parseInt(v, 10))
    if ([anio, mes, dia, h, min].some((v) => !Number.isFinite(v))) return
    onCalcular({ anio, mes, dia, hora: h, minuto: min })
  }

  return (
    <>
      {/* Este módulo se abría sin explicar de qué iba: una línea sobre
          «frecuencias» y directo a pedir la fecha. */}
      <CabeceraRecurso
        kicker="Escáner de código de origen"
        titulo="Código de Origen"
        entrada="A partir del día y la hora en que naciste, siete bloques que describen cómo entras en contacto con el mundo: tu frecuencia raíz, la de apoyo, tu vector y tu arquetipo."
        matiz="Es una lectura simbólica, no un diagnóstico ni una predicción. El cálculo ocurre en tu dispositivo y no se envía a ningún servicio."
      />

      <form onSubmit={enviar} className={s.form}>
        {heredada && (
          <p className={s.heredada}>
            Tomamos tu fecha de nacimiento de Numerología Cósmica. Puedes cambiarla aquí.
          </p>
        )}

        <label className={s.campo}>
          <span>Fecha de nacimiento</span>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required className={s.input} />
        </label>

        <label className={s.campo}>
          <span>Hora de nacimiento</span>
          <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required className={s.input} />
          <small className={s.ayuda}>
            Si no la sabes con certeza, deja las 12:00. La lectura seguirá siendo válida,
            aunque el matiz de la hora será aproximado.
          </small>
        </label>

        {error && <p className={s.error}>{error}</p>}

        <button type="submit" className={s.primario} disabled={!fecha || !hora}>
          Ver mi Código de Origen
        </button>

        <p className={s.privacidad}>
          El cálculo ocurre en tu dispositivo. Estos datos no se envían a ningún servicio.
        </p>
      </form>
    </>
  )
}

// ── La lectura ──────────────────────────────────────────────────────────────
type Bloque = {
  kicker: string
  titulo: string
  sub: string
  texto: string
  /** Ancla visual a la derecha: el porcentaje, o el símbolo del bloque. */
  ancla?: string
  /** Párrafos extra, en menor jerarquía. */
  extras?: Array<{ etiqueta: string; texto: string }>
  color?: string
}

function Lectura({ r, onRehacer }: { r: CodigoOrigenResultado; onRehacer: () => void }) {
  const sintesis = useMemo(() => construirSintesis144(r), [r])
  const pct = (id: string) => r.reparto.find((f) => f.id === id)?.porcentaje ?? 0

  const bloques: Bloque[] = [
    {
      kicker: "Bloque 1",
      titulo: "Tu frecuencia raíz",
      sub: `${r.raiz.nombre} · ${pct(r.raiz.id)}% de tu configuración`,
      ancla: `${pct(r.raiz.id)}%`,
      color: r.raiz.color,
      texto: r.raiz.descripcion,
      extras: [
        { etiqueta: "Cómo se reconoce", texto: r.raiz.enLaPractica },
        { etiqueta: "Don", texto: r.raiz.don },
        { etiqueta: "Cuando se desequilibra", texto: r.raiz.desequilibrio },
      ],
    },
    {
      kicker: "Bloque 2",
      titulo: "Tu frecuencia de apoyo",
      sub: `${r.apoyo.nombre} · ${pct(r.apoyo.id)}% de tu configuración`,
      ancla: `${pct(r.apoyo.id)}%`,
      color: r.apoyo.color,
      texto: r.apoyo.descripcion,
      extras: [
        { etiqueta: "Cómo se reconoce", texto: r.apoyo.enLaPractica },
        { etiqueta: "Don", texto: r.apoyo.don },
      ],
    },
    {
      kicker: "Bloque 3",
      titulo: "La combinación",
      sub: `${r.raiz.nombre} sobre ${r.apoyo.nombre}`,
      texto: r.combinacion,
    },
    {
      kicker: "Bloque 4",
      titulo: "Tu vector",
      sub: `Dirección · ${r.vector.nombre}`,
      texto: r.vector.descripcion,
      extras: [{ etiqueta: "Cómo dialoga con tu raíz", texto: r.matizDelVector }],
    },
    {
      kicker: "Bloque 5",
      titulo: "Tu arquetipo de origen",
      sub: `${r.arquetipo.nombre} · ${r.arquetipo.frase}`,
      texto: r.arquetipo.don,
      extras: [
        { etiqueta: "Tensión", texto: r.arquetipo.tension },
        { etiqueta: "Clave de integración", texto: r.arquetipo.integracion },
        { etiqueta: "Dentro de la Red", texto: r.arquetipo.enLaRed },
      ],
    },
    {
      kicker: "Bloque 6",
      titulo: "Tu frecuencia de integración",
      sub: `${r.integracion.nombre} · ${pct(r.integracion.id)}% — la menos presente`,
      ancla: `${pct(r.integracion.id)}%`,
      color: r.integracion.color,
      texto: r.integracion.integracion,
      extras: [{ etiqueta: "Una práctica concreta", texto: r.integracion.practica }],
    },
    {
      kicker: "Bloque 7",
      titulo: "Tu configuración",
      sub: "La síntesis de tu código",
      texto: r.configuracion.join(" "),
    },
  ]

  return (
    <>
      <header className={s.cabecera}>
        <p className={s.kicker}>Escáner de código de origen</p>
        <h2 className={s.titulo}>{r.raiz.nombre} · {r.arquetipo.nombre}</h2>
        <p className={s.subtitulo}>
          Vector de {r.vector.nombre.toLowerCase()}, con {r.apoyo.nombre.toLowerCase()} como apoyo.
        </p>
      </header>

      <Mandala r={r} />
      <TiraDeFrecuencias r={r} />

      {/* Cinco cifras sin decir de dónde vienen se leen como un veredicto. Con
          el método delante se leen como una medida, que es lo que son. Plegado,
          para que no se interponga en la lectura de quien no lo necesita. */}
      <ComoSaleElPorcentaje r={r} />

      <div style={{ marginTop: "1.8rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {bloques.map((b) => <BloqueLectura key={b.kicker} b={b} />)}
      </div>

      {sintesis && (
        <section className={s.sintesis144}>
          <p className={s.kicker}>Síntesis 144</p>
          <div className={s.puente}>
            <div>
              <span className={s.puenteEtiqueta}>Numerología Cósmica</span>
              <span className={s.puenteValor}>Camino {sintesis.caminoVida} · plano {sintesis.plano}</span>
            </div>
            <div>
              <span className={s.puenteEtiqueta}>Código de Origen</span>
              <span className={s.puenteValor}>{sintesis.frecuencias}</span>
              <span className={s.puenteValor}>{sintesis.vector} · {sintesis.arquetipo}</span>
            </div>
          </div>
          {sintesis.texto.map((p, i) => <p key={i} className={s.sintesisTexto}>{p}</p>)}
        </section>
      )}

      <section className={s.practicas}>
        <p className={s.kicker}>Para llevarte</p>
        <h3 className={s.practicasTitulo}>Tres observaciones, no tres tareas</h3>
        <p className={s.practicasIntro}>
          Ninguna pide que creas nada. Se hacen mirando, y el resultado es tuyo.
        </p>
        <ol className={s.practicasLista}>
          {[r.raiz, r.apoyo, r.integracion].map((f) => (
            <li key={f.id}>
              <span className={s.practicaFrec} style={{ color: f.color }}>{f.nombre}</span>
              <span className={s.practicaTexto}>{f.practica}</span>
            </li>
          ))}
        </ol>
      </section>

      <button type="button" className={s.rehacer} onClick={onRehacer}>
        <RefreshCw size={13} /> Cambiar los datos
      </button>
    </>
  )
}

function BloqueLectura({ b }: { b: Bloque }) {
  return (
    <div style={{
      padding: "1.1rem 1.2rem",
      borderRadius: 14,
      border: "1px solid rgba(167,139,202,0.2)",
      borderLeft: `3px solid ${b.color ?? GOLD}`,
      background: "rgba(10,11,26,0.5)",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.8rem" }}>
        <div>
          <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: VIOLET }}>{b.kicker}</span>
          <h4 style={{ margin: "0.3rem 0 0", fontFamily: "var(--font-cinzel,serif)", fontWeight: 700, fontSize: "1.12rem", color: "#fff" }}>{b.titulo}</h4>
        </div>
        {b.ancla && (
          <span style={{ flexShrink: 0, fontFamily: "var(--font-cinzel,serif)", fontWeight: 800, fontSize: "1.7rem", color: GOLD_DEEP, opacity: 0.85 }}>{b.ancla}</span>
        )}
      </div>
      <p style={{ margin: "0.35rem 0 0.7rem", fontFamily: "var(--font-mono,monospace)", fontSize: "0.64rem", letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD_DEEP }}>{b.sub}</p>
      <p style={{ margin: 0, fontSize: "0.96rem", lineHeight: 1.78, color: "#e6e9f7" }}>{b.texto}</p>

      {b.extras && b.extras.length > 0 && (
        <dl style={{ display: "flex", flexDirection: "column", gap: "0.55rem", margin: "0.95rem 0 0", paddingTop: "0.8rem", borderTop: "1px solid rgba(167,139,202,0.16)" }}>
          {b.extras.map((x) => (
            <div key={x.etiqueta} style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
              <dt style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "0.56rem", letterSpacing: "0.2em", textTransform: "uppercase", color: VIOLET }}>{x.etiqueta}</dt>
              <dd style={{ margin: 0, fontSize: "0.87rem", lineHeight: 1.65, color: "#b6bacd" }}>{x.texto}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

// ── El mandala ──────────────────────────────────────────────────────────────
// Cinco sectores de un círculo, cada uno con el radio proporcional a su peso.
// Dibujo propio: no reproduce el gráfico de ningún sistema existente.
function Mandala({ r }: { r: CodigoOrigenResultado }) {
  const C = 110
  const RMAX = 80
  const RMIN = 26
  const maximo = Math.max(...r.reparto.map((f) => f.peso)) || 1

  // El orden de dibujo es el orden fijo de las frecuencias, no el del reparto:
  // así el mandala de una misma persona siempre tiene la misma orientación.
  const orden = Object.values(FRECUENCIAS)

  const sectores = orden.map((frec, i) => {
    const peso = r.reparto.find((f) => f.id === frec.id)?.peso ?? 0
    const radio = RMIN + (RMAX - RMIN) * (peso / maximo)
    const desde = (i * 72 - 90) * (Math.PI / 180)
    const hasta = ((i + 1) * 72 - 90) * (Math.PI / 180)
    const medio = (desde + hasta) / 2
    const x1 = C + radio * Math.cos(desde), y1 = C + radio * Math.sin(desde)
    const x2 = C + radio * Math.cos(hasta), y2 = C + radio * Math.sin(hasta)
    return {
      id: frec.id,
      nombre: frec.nombre,
      color: frec.color,
      esRaiz: frec.id === r.raiz.id,
      d: `M ${C} ${C} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radio.toFixed(2)} ${radio.toFixed(2)} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`,
      // Punto de la etiqueta, algo más afuera del radio máximo.
      lx: C + (RMAX + 15) * Math.cos(medio),
      ly: C + (RMAX + 15) * Math.sin(medio),
    }
  })

  return (
    <div className={s.mandalaCaja}>
      {/* ── EL LIENZO ES MÁS ANCHO QUE EL DIBUJO, A PROPÓSITO ──────────────
          El círculo mide 220 y las etiquetas van FUERA de él, centradas sobre
          un punto que en los lados cae casi en el borde. Con un lienzo de 220
          justos, «PROFUNDIDAD» y «ACTIVACIÓN» sobresalían y el borde del SVG
          les cortaba las puntas: se leía «laridad» y «activaci».

          El lienzo se abre 25 unidades a cada lado. El círculo no cambia de
          tamaño ni de sitio; solo deja de recortarse lo que hay alrededor. */}
      <svg viewBox="-25 0 270 220" className={s.mandala} role="img" aria-label={`Reparto de tus frecuencias. Raíz: ${r.raiz.nombre}.`}>
        <circle cx={C} cy={C} r={RMAX + 8} fill="none" stroke="rgba(230,207,149,0.18)" strokeWidth="0.7" />
        <circle cx={C} cy={C} r={RMAX + 15} fill="none" stroke="rgba(230,207,149,0.1)" strokeWidth="0.6" strokeDasharray="3 5" />
        {sectores.map((sec) => (
          <path
            key={sec.id}
            d={sec.d}
            fill={sec.color}
            fillOpacity={sec.esRaiz ? 0.55 : 0.32}
            stroke={sec.color}
            strokeWidth={sec.esRaiz ? 1.6 : 1}
            strokeLinejoin="round"
          />
        ))}
        {sectores.map((sec) => (
          <text
            key={sec.id}
            x={sec.lx}
            y={sec.ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={sec.color}
            fillOpacity={sec.esRaiz ? 1 : 0.7}
            style={{ fontSize: 7.5, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "var(--font-mono,monospace)" }}
          >
            {sec.nombre}
          </text>
        ))}
        <circle cx={C} cy={C} r="6" fill="#0a0a18" stroke={GOLD} strokeWidth="1.2" />
        <circle cx={C} cy={C} r="2" fill={GOLD} />
      </svg>
    </div>
  )
}

// ── Tira de las cinco frecuencias, en el formato de Numerología ─────────────
function TiraDeFrecuencias({ r }: { r: CodigoOrigenResultado }) {
  return (
    <div className={s.tira}>
      {r.reparto.map((f) => {
        const frec = FRECUENCIAS[f.id]
        return (
          <div key={f.id} className={s.tiraItem}>
            <div className={s.tiraValor} style={{ color: frec.color }}>{f.porcentaje}%</div>
            <div className={s.tiraEtiqueta}>{frec.nombre}</div>
          </div>
        )
      })}
    </div>
  )
}
