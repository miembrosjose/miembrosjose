"use client"

// NUMEROLOGÍA CÓSMICA — herramienta gratuita de la Biblioteca de Los 144.000.
// Panel visible → formulario → "Escáner de código personal" (7 bloques).
// Estética cósmica (violeta/oro), responsive, scroll interno, guarda en la
// Gran Bitácora. Sin dependencias externas.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X, Sparkles, Lock, BookmarkPlus, RefreshCw, Check, FileDown, KeyRound, Gem } from "lucide-react"
import {
  calcular, num, planoTexto, mensajeMision, resultadoATexto,
  saveLastReading, loadLastReading, bitacoraPrompt,
  type NumerologiaResultado,
} from "../_lib/numerologia"
import {
  generarLecturaProfunda, lecturaProfundaATexto,
  type LecturaProfunda, type BitacoraContexto,
} from "../_lib/numerologia-profunda"
import { upsertAnswer, entriesByCategory } from "../_lib/journal-store"
import { useProducts, type DbProduct } from "../_lib/use-products"
import { useProductAccess } from "../_lib/use-product-access"
import { ProductUnlockInline } from "./ProductUnlockInline"
import prod from "./products.module.css"
import { usePanelAPantallaCompleta } from "../_lib/panel-modal"
import { PanelFallo } from "./PanelFallo"

const GOLD = "#e6cf95"
const GOLD_DEEP = "#c9a86b"
const VIOLET = "#a78bca"

const MANUAL_UNLOCK_KEY = "los144k_numerologia_premium"

type Stage = "form" | "result" | "deep"

function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

// Identifica el producto de DB que representa la herramienta Numerología Cósmica
// (para portada/nombre/descripción/precio editables desde "Gestionar"). Excluye
// cualquier variante "profunda" heredada.
export function isNumerologiaToolProduct(p: { name: string }): boolean {
  const n = norm(p.name)
  return n.includes("numerolog") && !n.includes("profund")
}
function findNumerologiaProduct(products: DbProduct[]): DbProduct | null {
  return products.find(isNumerologiaToolProduct) || null
}

function money(cents: number, currency = "usd"): string {
  const sym = currency.toLowerCase() === "usd" ? "US$" : currency.toUpperCase() + " "
  return `${sym} ${(cents / 100).toFixed(2)}`
}
const isVideo = (u?: string | null) => !!u && /\.(mp4|webm|mov)(\?|$)/i.test(u)

function readBitacoraCtx(): BitacoraContexto {
  const has = (c: Parameters<typeof entriesByCategory>[0]) =>
    entriesByCategory(c).some((e) => e.answer.trim().length > 0)
  return {
    historia: has("historia"), linaje: has("linaje"), territorio: has("territorio"),
    acciones: has("acciones"), revelaciones: has("revelaciones"),
  }
}

export function NumerologiaCosmica() {
  const [open, setOpen] = useState(false)
  const [stage, setStage] = useState<Stage>("form")
  const [result, setResult] = useState<NumerologiaResultado | null>(null)
  const [hasSaved, setHasSaved] = useState(false)
  const [deep, setDeep] = useState<LecturaProfunda | null>(null)
  const [manualUnlock, setManualUnlock] = useState(false)

  // form fields
  const [nombre, setNombre] = useState("")
  const [fecha, setFecha] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [cosmico, setCosmico] = useState("")

  const { products } = useProducts()
  const { hasAccess, isAdminOverride } = useProductAccess()
  const numProduct = useMemo(() => findNumerologiaProduct(products), [products])
  // Para admin, hasAccess() devuelve TODO desbloqueado (override global). Eso
  // impide probar el ciclo compra→reinicio, así que al admin lo tratamos como
  // bloqueado por defecto y solo desbloquea con el botón manual (que el reinicio
  // limpia). El usuario real depende de su compra en user_product_access.
  const realOwned = numProduct ? hasAccess(numProduct.id) : false
  const unlocked = isAdminOverride ? manualUnlock : (manualUnlock || realOwned)
  const precioLabel = numProduct && numProduct.price_cents > 0 ? money(numProduct.price_cents, numProduct.currency) : "US$ 20.00"

  const bodyRef = useRef<HTMLDivElement>(null)

  // Carga la última lectura guardada (para el botón del panel).
  useEffect(() => {
    const last = loadLastReading()
    if (last) setResult(last)
    try { setManualUnlock(localStorage.getItem(MANUAL_UNLOCK_KEY) === "1") } catch { /* privado */ }
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }) }, [stage])

  const prefill = useCallback((r: NumerologiaResultado) => {
    setNombre(r.nombre); setFecha(r.fecha); setCiudad(r.ciudad); setCosmico(r.nombreCosmico)
  }, [])

  const openForm = useCallback(() => {
    setStage("form"); setOpen(true)
  }, [])

  const openResult = useCallback(() => {
    if (result) { prefill(result); setStage("result"); setOpen(true) }
  }, [result, prefill])

  const canSubmit = nombre.trim().length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(fecha)

  const submit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    if (!canSubmit) return
    const r = calcular({ nombre, fecha, ciudad, nombreCosmico: cosmico })
    setResult(r)
    saveLastReading(r)
    setHasSaved(false)
    setDeep(null)
    setStage("result")
  }, [canSubmit, nombre, fecha, ciudad, cosmico])

  const guardar = useCallback(() => {
    if (!result) return
    upsertAnswer({
      category: "numerologia",
      source: "numerologia",
      sourceLabel: "Numerología Cósmica",
      prompt: bitacoraPrompt(result),
      answer: resultadoATexto(result),
      isPrivate: true,
    })
    setHasSaved(true)
  }, [result])

  // ── Lectura profunda ────────────────────────────────────────────────
  const generarDeep = useCallback(() => {
    if (!result) return
    const L = generarLecturaProfunda(result, readBitacoraCtx())
    setDeep(L)
    setStage("deep")
  }, [result])

  const abrirDeep = useCallback(() => {
    if (deep) setStage("deep"); else generarDeep()
  }, [deep, generarDeep])

  const guardarDeep = useCallback(() => {
    if (!result || !deep) return
    upsertAnswer({
      category: "numerologia",
      source: "numerologia_profunda",
      sourceLabel: "Numerología Cósmica · Revelación de Misión",
      prompt: `Revelación profunda · ${result.nombre} · ${result.fecha.split("-").reverse().join("/")}`,
      answer: lecturaProfundaATexto(result, deep),
      isPrivate: true,
    })
    // guarda también la lectura gratuita si no estaba
    guardar()
  }, [result, deep, guardar])

  const descargarPdf = useCallback(() => {
    if (!result || !deep) return
    const html = buildDeepReportHtml(result, deep, unlocked ? (isAdminOverride ? "admin" : "desbloqueado") : "pendiente")
    const w = window.open("", "_blank", "width=820,height=1000")
    if (!w) { alert("Permite las ventanas emergentes para descargar tu informe PDF."); return }
    w.document.open(); w.document.write(html); w.document.close()
  }, [result, deep, unlocked, isAdminOverride])

  const activarManual = useCallback(() => {
    try { localStorage.setItem(MANUAL_UNLOCK_KEY, "1") } catch { /* privado */ }
    setManualUnlock(true)
    setTimeout(() => abrirDeep(), 60)
  }, [abrirDeep])

  const onCardClick = useCallback(() => {
    if (result) openResult(); else openForm()
  }, [result, openResult, openForm])

  return (
    <>
      <NumerologiaCard onClick={onCardClick} result={result} product={numProduct} />
      {open && createPortal(
        <Overlay onClose={() => setOpen(false)}>
          <div
            ref={bodyRef}
            className="min-h-0 flex-1 overflow-y-auto"
            style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
          >
            <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(1.4rem,4vw,2.6rem) clamp(1.1rem,4vw,2rem) 4rem" }}>
              {/* Si algo falla al dibujar, el panel se queda y lo dice. */}
              <PanelFallo modulo="Numerología Cósmica" onReiniciar={() => setStage("form")}>
              {stage === "form" ? (
                <FormView
                  nombre={nombre} setNombre={setNombre}
                  fecha={fecha} setFecha={setFecha}
                  ciudad={ciudad} setCiudad={setCiudad}
                  cosmico={cosmico} setCosmico={setCosmico}
                  canSubmit={canSubmit} onSubmit={submit}
                />
              ) : stage === "deep" && result && deep ? (
                <DeepView
                  r={result} L={deep}
                  isAdmin={isAdminOverride}
                  onGuardar={guardarDeep}
                  onPdf={descargarPdf}
                  onActualizar={generarDeep}
                  onVolver={() => setStage("result")}
                />
              ) : result ? (
                <ResultView
                  r={result}
                  hasSaved={hasSaved}
                  onGuardar={guardar}
                  onActualizar={() => { prefill(result); setStage("form") }}
                  unlocked={unlocked}
                  isAdmin={isAdminOverride}
                  numProduct={numProduct}
                  precioLabel={precioLabel}
                  onOpenDeep={abrirDeep}
                  onPurchased={abrirDeep}
                  onActivarManual={activarManual}
                />
              ) : null}
              </PanelFallo>
            </div>
          </div>
        </Overlay>,
        document.body,
      )}
    </>
  )
}

// ── Tarjeta en el formato de la Biblioteca (mismo grid que los productos) ─
// Portada, nombre y descripción son editables desde "Gestionar" (producto de DB).
function NumerologiaCard({ onClick, result, product }: {
  onClick: () => void; result: NumerologiaResultado | null; product: DbProduct | null
}) {
  const cover = product?.media_url || null
  const titulo = product?.name?.trim() || "Numerología Cósmica"
  const descripcion = product?.description?.trim()
  return (
    <button type="button" onClick={onClick} className={prod.card} style={{ cursor: "pointer" }}>
      <div className={prod.thumb}>
        {cover ? (
          isVideo(cover)
            ? <video src={cover} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline loop autoPlay />
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={cover} alt={titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: "radial-gradient(120% 90% at 50% 18%, rgba(167,139,202,0.5) 0%, rgba(60,44,110,0.4) 42%, rgba(12,10,28,0.9) 100%)",
          }}>
            <div aria-hidden style={{
              position: "absolute", width: 150, height: 150, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(230,207,149,0.35), transparent 68%)",
            }} />
            <Sparkles size={54} strokeWidth={1.3} style={{ color: GOLD, filter: "drop-shadow(0 0 14px rgba(217,184,102,0.6))", position: "relative" }} />
          </div>
        )}
      </div>
      <div className={prod.body}>
        <h3 className={prod.name} style={{ color: "#F3F6FA" }}>{titulo}</h3>
        <p style={{ margin: 0, fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", color: VIOLET, fontFamily: "var(--font-mono,monospace)" }}>
          Nombre · Fecha · Alma · Misión
        </p>
        <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "#a8a8c0", lineHeight: 1.45 }}>
          {result
            ? `Tu última lectura: Camino ${result.caminoVida} · Alma ${result.alma}.`
            : (descripcion || "Descubre tu código personal a partir de tu nombre y tu fecha de nacimiento.")}
        </p>
      </div>
    </button>
  )
}

// ── Overlay a pantalla completa ─────────────────────────────────────────
//
// Este panel NO bloqueaba el fondo. Como está fijo sobre la página, al
// arrastrar dentro se movía la portada de detrás y todo parecía ir a
// tirones: eso era la "pantalla entrecortada". El bloqueo —y el cierre al
// tocar fuera, que tampoco era de fiar— viven ahora en _lib/panel-modal.
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const { propsDelFondo } = usePanelAPantallaCompleta(onClose)
  return (
    <div
      className="fixed inset-0 z-[600] flex items-start justify-center sm:items-center"
      style={{
        background: "rgba(4,5,12,0.9)",
        backdropFilter: "blur(6px)",
        padding: "calc(env(safe-area-inset-top,0px) + 16px) 12px calc(env(safe-area-inset-bottom,0px) + 16px)",
        overscrollBehavior: "contain",
      }}
      {...propsDelFondo}
    >
      <div
        className="relative flex w-[min(760px,calc(100vw-24px))] flex-col overflow-hidden"
        style={{
          maxHeight: "calc(100dvh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px) - 32px)",
          borderRadius: 18,
          border: "1px solid rgba(167,139,202,0.3)",
          background: "linear-gradient(160deg, rgba(20,18,46,0.98), rgba(8,9,20,0.98))",
          boxShadow: "0 40px 90px -20px rgba(0,0,0,0.9)",
        }}
      >
        <button type="button" onClick={onClose} aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 rounded-full p-2 text-[#a8a8c0] transition-colors hover:bg-[#251f30] hover:text-white">
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  )
}

// ── Fecha: helpers para el formato día/mes/año ───────────────────────────
function isoToDMY(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ""
}
function maskDMY(raw: string): string {
  const dig = raw.replace(/\D/g, "").slice(0, 8)
  const parts: string[] = [dig.slice(0, 2)]
  if (dig.length > 2) parts.push(dig.slice(2, 4))
  if (dig.length > 4) parts.push(dig.slice(4, 8))
  return parts.filter(Boolean).join("/")
}
function dmyToIso(txt: string): string {
  const m = txt.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return ""
  const d = +m[1], mo = +m[2], y = +m[3]
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1900 || y > 2099) return ""
  return `${m[3]}-${m[2]}-${m[1]}`
}

// ── Formulario ──────────────────────────────────────────────────────────
function FormView(p: {
  nombre: string; setNombre: (v: string) => void
  fecha: string; setFecha: (v: string) => void
  ciudad: string; setCiudad: (v: string) => void
  cosmico: string; setCosmico: (v: string) => void
  canSubmit: boolean; onSubmit: (e?: React.FormEvent) => void
}) {
  const [fechaTxt, setFechaTxt] = useState(() => isoToDMY(p.fecha))
  // Sincroniza si la fecha cambia desde fuera (p.ej. "Actualizar mi lectura").
  useEffect(() => { setFechaTxt(isoToDMY(p.fecha)) }, [p.fecha])
  const fechaValida = dmyToIso(fechaTxt) !== ""
  const fechaTocada = fechaTxt.length > 0

  return (
    <form onSubmit={p.onSubmit}>
      <p style={kickerStyle}>Escáner de código personal</p>
      <h2 style={titleStyle}>Numerología Cósmica</h2>
      <p style={{ margin: "0.9rem 0 0", fontSize: "0.95rem", lineHeight: 1.78, color: "#c6cbe6" }}>
        Tu nombre y tu fecha de nacimiento guardan una arquitectura vibratoria. La Numerología Cósmica abre
        una primera lectura de tu código personal: la forma en que tu conciencia entra en la materia, expresa
        su energía y comienza a revelar su servicio dentro de la Red.
      </p>
      <p style={{ margin: "0.7rem 0 1.6rem", fontSize: "0.88rem", lineHeight: 1.65, color: "#9297bb" }}>
        Escribe tu nombre tal como resuena en ti. La lectura se calcula al instante y puedes guardarla en tu bitácora.
      </p>

      <Field label="Nombre completo" required>
        {/* Sin autoFocus: en el móvil abría el teclado al entrar, el panel se
            encogía a la mitad de alto y la pantalla daba un salto antes de
            que a nadie le diera tiempo a leer de qué iba el módulo. */}
        <input value={p.nombre} onChange={(e) => p.setNombre(e.target.value)} placeholder="Tu nombre y apellidos" style={inputStyle} />
      </Field>
      <Field label="Fecha de nacimiento" required hint="día / mes / año">
        <input
          inputMode="numeric"
          value={fechaTxt}
          onChange={(e) => {
            const masked = maskDMY(e.target.value)
            setFechaTxt(masked)
            p.setFecha(dmyToIso(masked))
          }}
          placeholder="DD/MM/AAAA"
          maxLength={10}
          style={{ ...inputStyle, letterSpacing: "0.08em", ...(fechaTocada && !fechaValida ? { borderColor: "rgba(220,120,120,0.6)" } : {}) }}
        />
        <span style={{ display: "block", marginTop: "0.35rem", fontSize: "0.68rem", color: fechaTocada && !fechaValida ? "#d78" : "#6a6f92", fontFamily: "var(--font-mono,monospace)", letterSpacing: "0.04em" }}>
          {fechaTocada && !fechaValida
            ? "Escribe la fecha como DD/MM/AAAA — ejemplo: 27/12/1988"
            : "Ejemplo: 27/12/1988 (día, mes y año)"}
        </span>
      </Field>
      <Field label="Ciudad / territorio actual" hint="opcional">
        <input value={p.ciudad} onChange={(e) => p.setCiudad(e.target.value)} placeholder="Dónde habitas hoy" style={inputStyle} />
      </Field>
      <Field label="Nombre cósmico" hint="opcional">
        <input value={p.cosmico} onChange={(e) => p.setCosmico(e.target.value)} placeholder="Si tienes un nombre espiritual" style={inputStyle} />
      </Field>

      <button type="submit" disabled={!p.canSubmit} style={{ ...primaryBtn, width: "100%", justifyContent: "center", marginTop: "0.6rem", opacity: p.canSubmit ? 1 : 0.45, cursor: p.canSubmit ? "pointer" : "not-allowed" }}>
        <Sparkles size={16} /> Revelar mi código personal
      </button>
      <p style={{ margin: "0.9rem 0 0", textAlign: "center", fontSize: "0.68rem", letterSpacing: "0.1em", color: "#6a6f92", fontFamily: "var(--font-mono,monospace)" }}>
        Cálculo local · privado · nada se comparte
      </p>
    </form>
  )
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: "1.1rem" }}>
      <span style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: VIOLET, fontFamily: "var(--font-mono,monospace)" }}>
        {label}{required && <span style={{ color: GOLD }}> *</span>}{hint && <span style={{ color: "#6a6f92", fontWeight: 400 }}> · {hint}</span>}
      </span>
      {children}
    </label>
  )
}

// ── Resultado: 7 bloques ────────────────────────────────────────────────
function ResultView({ r, hasSaved, onGuardar, onActualizar, unlocked, isAdmin, numProduct, precioLabel, onOpenDeep, onPurchased, onActivarManual }: {
  r: NumerologiaResultado; hasSaved: boolean; onGuardar: () => void; onActualizar: () => void
  unlocked: boolean; isAdmin: boolean; numProduct: DbProduct | null; precioLabel: string
  onOpenDeep: () => void; onPurchased: () => void; onActivarManual: () => void
}) {
  const bloques = useMemo(() => {
    const c = num(r.caminoVida), a = num(r.alma), pe = num(r.personalidad), ex = num(r.expresion)
    const pv = r.primeraVocal, gd = num(r.grupoDominante.numero)
    return [
      { n: r.caminoVida, kicker: "Bloque 1", titulo: "Tu frecuencia de encarnación", sub: `Camino de vida · ${r.caminoVida} · ${c.titulo}`,
        texto: c.lectura + (r.signoSolar ? ` En el plano simbólico, tu Sol natal en ${r.signoSolar} colorea esta frecuencia como un matiz visible de tu carácter.` : "") },
      { n: r.alma, kicker: "Bloque 2", titulo: "El impulso del alma", sub: `Número del alma · ${r.alma} · ${a.titulo}`,
        texto: `Lo que tu alma busca en secreto se mueve en clave de ${a.esencia}. ` + a.lectura },
      { n: r.personalidad, kicker: "Bloque 3", titulo: "Tu presencia ante el mundo", sub: `Personalidad externa · ${r.personalidad} · ${pe.titulo}`,
        texto: `La forma en que otros te perciben antes de conocerte vibra en ${pe.esencia}. ` + pe.lectura },
      { n: r.expresion, kicker: "Bloque 4", titulo: "Dirección de servicio", sub: `Expresión / destino · ${r.expresion} · ${ex.titulo}`,
        texto: `El conjunto de tu nombre orienta tu expresión hacia ${ex.esencia}. ` + ex.lectura },
      { n: r.grupoDominante.numero, kicker: "Bloque 5", titulo: "El verbo de tu nombre", sub: `Primera vocal ${pv.letra || "—"}${pv.numero ? ` · ${pv.numero}` : ""} · grupo dominante ${r.grupoDominante.numero} · ${gd.titulo}`,
        texto: `La primera vocal de tu nombre marca el tono con que tu energía entra en cada situación${pv.numero ? `: la vibración ${pv.numero}, de ${num(pv.numero).esencia}` : ""}. Y el número que más se repite en tu nombre —el ${r.grupoDominante.numero}, ${gd.titulo}— es el verbo que tu vida conjuga una y otra vez: ${gd.esencia}.` },
      { n: null, kicker: "Bloque 6", titulo: "Plano dominante", sub: `Tu concentración principal: plano ${r.plano}`,
        texto: planoTexto(r.plano) },
      { n: null, kicker: "Bloque 7", titulo: "Mensaje inicial de misión", sub: "La síntesis de tu código",
        texto: mensajeMision(r) },
    ]
  }, [r])

  return (
    <div>
      <p style={kickerStyle}>Escáner de código personal</p>
      <h2 style={titleStyle}>La lectura de {r.nombre.split(" ")[0]}</h2>
      <p style={{ margin: "0.7rem 0 0", fontSize: "0.78rem", letterSpacing: "0.08em", color: "#8b90b4", fontFamily: "var(--font-mono,monospace)" }}>
        {r.fecha.split("-").reverse().join("/")}{r.ciudad ? ` · ${r.ciudad}` : ""}{r.nombreCosmico ? ` · ${r.nombreCosmico}` : ""}
      </p>

      {/* Resumen de números */}
      <div style={{ marginTop: "1.4rem", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(74px,1fr))", gap: "0.6rem" }}>
        {[
          { l: "Camino", v: r.caminoVida }, { l: "Alma", v: r.alma },
          { l: "Personalidad", v: r.personalidad }, { l: "Expresión", v: r.expresion },
        ].map((x) => (
          <div key={x.l} style={{ textAlign: "center", padding: "0.7rem 0.4rem", borderRadius: 12, border: "1px solid rgba(167,139,202,0.22)", background: "rgba(10,11,26,0.5)" }}>
            <div style={{ fontFamily: "var(--font-cinzel,serif)", fontWeight: 800, fontSize: "1.6rem", background: "linear-gradient(180deg,#fff,#e6cf95)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{x.v}</div>
            <div style={{ marginTop: 2, fontSize: "0.56rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b90b4", fontFamily: "var(--font-mono,monospace)" }}>{x.l}</div>
          </div>
        ))}
      </div>

      {/* Bloques */}
      <div style={{ marginTop: "1.8rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {bloques.map((b, i) => (
          <div key={i} style={{
            padding: "1.1rem 1.2rem", borderRadius: 14,
            border: "1px solid rgba(167,139,202,0.2)", borderLeft: `3px solid ${GOLD}`,
            background: "rgba(10,11,26,0.5)",
          }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.8rem" }}>
              <div>
                <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: VIOLET }}>{b.kicker}</span>
                <h4 style={{ margin: "0.3rem 0 0", fontFamily: "var(--font-cinzel,serif)", fontWeight: 700, fontSize: "1.12rem", color: "#fff" }}>{b.titulo}</h4>
              </div>
              {typeof b.n === "number" && (
                <span style={{ flexShrink: 0, fontFamily: "var(--font-cinzel,serif)", fontWeight: 800, fontSize: "1.7rem", color: GOLD_DEEP, opacity: 0.85 }}>{b.n}</span>
              )}
            </div>
            <p style={{ margin: "0.35rem 0 0.7rem", fontFamily: "var(--font-mono,monospace)", fontSize: "0.64rem", letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD_DEEP }}>{b.sub}</p>
            <p style={{ margin: 0, fontSize: "0.96rem", lineHeight: 1.78, color: "#e6e9f7" }}>{b.texto}</p>
          </div>
        ))}
      </div>

      {/* Acciones */}
      <div style={{ marginTop: "1.6rem", display: "flex", flexWrap: "wrap", gap: "0.7rem" }}>
        <button type="button" onClick={onGuardar} disabled={hasSaved} style={{ ...primaryBtn, opacity: hasSaved ? 0.6 : 1, cursor: hasSaved ? "default" : "pointer" }}>
          {hasSaved ? <><Check size={15} /> Guardado en tu bitácora</> : <><BookmarkPlus size={15} /> Guardar en mi bitácora</>}
        </button>
        <button type="button" onClick={onActualizar} style={ghostBtn}>
          <RefreshCw size={14} /> Actualizar mi lectura
        </button>
      </div>

      {/* Profundizar lectura — versión premium */}
      <ProfundizarBlock
        unlocked={unlocked} isAdmin={isAdmin} numProduct={numProduct} precioLabel={precioLabel}
        onOpenDeep={onOpenDeep} onPurchased={onPurchased} onActivarManual={onActivarManual}
      />

      {/* Cerraduras futuras */}
      <LockedCards />
    </div>
  )
}

// ── Bloque premium: PROFUNDIZAR LECTURA — USD 20 ─────────────────────────
function ProfundizarBlock({ unlocked, isAdmin, numProduct, precioLabel, onOpenDeep, onPurchased, onActivarManual }: {
  unlocked: boolean; isAdmin: boolean; numProduct: DbProduct | null; precioLabel: string
  onOpenDeep: () => void; onPurchased: () => void; onActivarManual: () => void
}) {
  const purchasable = !!(numProduct && numProduct.price_cents > 0 && numProduct.is_locked)
  return (
    <div style={{
      position: "relative", marginTop: "2.4rem", padding: "clamp(1.3rem,4vw,1.9rem)", borderRadius: 18,
      border: `1px solid ${unlocked ? "rgba(217,184,102,0.5)" : "rgba(167,139,202,0.35)"}`,
      background: "linear-gradient(155deg, rgba(46,34,80,0.55) 0%, rgba(18,15,38,0.75) 60%, rgba(8,9,20,0.8) 100%)",
      overflow: "hidden",
    }}>
      <div aria-hidden style={{ position: "absolute", top: -70, right: -50, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(217,184,102,0.22), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>
        <p style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "0.4rem", fontFamily: "var(--font-mono,monospace)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD }}>
          <Gem size={13} /> Lectura profunda
        </p>
        <h3 style={{ margin: "0.6rem 0 0", fontFamily: "var(--font-cinzel,serif)", fontWeight: 800, fontSize: "clamp(1.3rem,3.5vw,1.7rem)", lineHeight: 1.12, color: "#fff" }}>
          Revelación Numerológica de Misión
        </h3>
        <p style={{ margin: "0.7rem 0 0", fontSize: "0.92rem", lineHeight: 1.72, color: "#c6cbe6" }}>
          Una lectura completa que cruza tu nombre, tu fecha, tu matriz, tu alma, tu presencia, tu servicio,
          tu linaje, tu territorio, el ciclo que atraviesas ahora y los cinco objetivos de Los 144.000.
          Dieciséis capítulos interpretados, no una calculadora.
        </p>

        {unlocked ? (
          <div style={{ marginTop: "1.3rem" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, fontFamily: "var(--font-mono,monospace)" }}>
              <Check size={13} /> Lectura desbloqueada
            </span>
            <button type="button" onClick={onOpenDeep} style={{ ...goldBtn, marginTop: "0.9rem" }}>
              <Sparkles size={16} /> Ver mi Revelación de Misión
            </button>
          </div>
        ) : (
          <div style={{ marginTop: "1.3rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.7rem", marginBottom: "0.9rem" }}>
              <span style={{ fontFamily: "var(--font-cinzel,serif)", fontWeight: 800, fontSize: "1.9rem", color: GOLD }}>{precioLabel}</span>
              <span style={{ fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8b90b4", fontFamily: "var(--font-mono,monospace)" }}>Pago único</span>
            </div>

            {isAdmin ? (
              // Admin: el cobro real devolvería owned=true (override). Previsualiza.
              <button type="button" onClick={onActivarManual} style={goldBtn}>
                <KeyRound size={15} /> Desbloquear (admin · pruebas)
              </button>
            ) : purchasable && numProduct ? (
              // Usuario real: desbloqueo 1-clic embebido (sin segundo modal).
              <ProductUnlockInline
                productId={numProduct.id}
                priceCents={numProduct.price_cents}
                currency={numProduct.currency}
                priceLabel={precioLabel}
                buttonLabel={`Desbloquear · ${precioLabel}`}
                buttonStyle={{ ...goldBtn, width: "100%", justifyContent: "center" }}
                onSuccess={onPurchased}
              />
            ) : (
              <p style={{ margin: "0.4rem 0 0", fontSize: "0.72rem", lineHeight: 1.5, color: "#9297bb", fontFamily: "var(--font-mono,monospace)" }}>
                El cobro aún no está integrado en la plataforma para este producto. El flujo queda preparado y
                se activará en cuanto el checkout esté disponible.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── 3 tarjetas bloqueadas (estructura futura, sin venta) ─────────────────
const LOCKED = [
  { name: "Numeroscopio de Misión", text: "Tu nombre convertido en matriz vibratoria." },
  { name: "Mapa del Alma y Linaje", text: "La relación entre tu código, tu historia familiar y la medicina que vienes a transformar." },
  { name: "Carta del Tiempo", text: "El ciclo que atraviesas ahora y la acción que corresponde." },
]

function LockedCards() {
  return (
    <div style={{ marginTop: "2.4rem" }}>
      <p style={{ ...kickerStyle, textAlign: "center" }}>Lecturas profundas · próximamente</p>
      <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "0.9rem" }}>
        {LOCKED.map((c) => (
          <div key={c.name} style={{
            position: "relative", padding: "1.3rem 1.1rem", borderRadius: 14,
            border: "1px solid rgba(167,139,202,0.22)",
            background: "linear-gradient(160deg, rgba(24,20,48,0.5), rgba(10,11,26,0.55))",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34,
              borderRadius: 999, border: `1px solid ${VIOLET}`, color: VIOLET, marginBottom: "0.8rem",
              boxShadow: "0 0 18px -6px rgba(167,139,202,0.7)",
            }}>
              <Lock size={16} />
            </div>
            <h4 style={{ margin: 0, fontFamily: "var(--font-cinzel,serif)", fontWeight: 700, fontSize: "1rem", color: "#eef1fb" }}>{c.name}</h4>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", lineHeight: 1.6, color: "#9297bb" }}>{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── estilos compartidos ──────────────────────────────────────────────────
const primaryBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.5rem",
  padding: "0.72rem 1.2rem", borderRadius: 999, border: "1px solid rgba(217,184,102,0.5)",
  background: "linear-gradient(135deg,#e6cf95,#c9a86b)", color: "#1a1204",
  fontFamily: "var(--font-mono,monospace)", fontSize: "0.68rem", fontWeight: 700,
  letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
}
const ghostBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.45rem",
  padding: "0.72rem 1.15rem", borderRadius: 999, border: "1px solid rgba(167,139,202,0.4)",
  background: "transparent", color: VIOLET,
  fontFamily: "var(--font-mono,monospace)", fontSize: "0.68rem", fontWeight: 700,
  letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
}
const goldBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.5rem",
  padding: "0.85rem 1.5rem", borderRadius: 12, border: "1px solid rgba(217,184,102,0.6)",
  background: "linear-gradient(135deg,#e6cf95 0%,#d9b866 60%,#c9a86b 100%)", color: "#1a1204",
  fontFamily: "var(--font-mono,monospace)", fontSize: "0.7rem", fontWeight: 700,
  letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer",
  boxShadow: "0 12px 30px -10px rgba(217,184,102,0.5)",
}
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.7rem 0.85rem", borderRadius: 10,
  border: "1px solid rgba(167,139,202,0.28)", background: "rgba(10,11,26,0.6)",
  color: "#eef1fb", fontSize: "0.95rem", outline: "none",
  fontFamily: "var(--font-geist-sans,sans-serif)",
}
const kickerStyle: React.CSSProperties = {
  margin: 0, fontFamily: "var(--font-mono,monospace)", fontSize: "0.6rem", fontWeight: 700,
  letterSpacing: "0.32em", textTransform: "uppercase", color: GOLD,
}
const titleStyle: React.CSSProperties = {
  margin: "0.6rem 0 0", fontFamily: "var(--font-cinzel,serif)", fontWeight: 800,
  fontSize: "clamp(1.5rem,4vw,2.1rem)", lineHeight: 1.1, color: "#fff",
}

// ── Vista de la Lectura Profunda (16 secciones) ──────────────────────────
function DeepSection({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section style={{
      marginTop: "1.1rem", padding: "1.15rem 1.25rem", borderRadius: 14,
      border: "1px solid rgba(167,139,202,0.2)", borderLeft: `3px solid ${GOLD}`, background: "rgba(10,11,26,0.5)",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem" }}>
        <span style={{ fontFamily: "var(--font-cinzel,serif)", fontWeight: 800, fontSize: "1.2rem", color: GOLD_DEEP }}>{n}</span>
        <h3 style={{ margin: 0, fontFamily: "var(--font-cinzel,serif)", fontWeight: 700, fontSize: "1.16rem", color: "#fff" }}>{title}</h3>
      </div>
      <div style={{ marginTop: "0.6rem" }}>{children}</div>
    </section>
  )
}
function paras(text: string) {
  return text.split("\n\n").map((p, i) => (
    <p key={i} style={{ margin: i ? "0.7rem 0 0" : 0, fontSize: "0.96rem", lineHeight: 1.8, color: "#e6e9f7" }}>{p}</p>
  ))
}

function DeepView({ r, L, isAdmin, onGuardar, onPdf, onActualizar, onVolver }: {
  r: NumerologiaResultado; L: LecturaProfunda; isAdmin: boolean
  onGuardar: () => void; onPdf: () => void; onActualizar: () => void; onVolver: () => void
}) {
  const [savedNow, setSavedNow] = useState(false)
  const chip = (label: string, val: string) => (
    <div style={{ padding: "0.5rem 0.7rem", borderRadius: 10, border: "1px solid rgba(167,139,202,0.22)", background: "rgba(10,11,26,0.55)", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-cinzel,serif)", fontWeight: 800, fontSize: "1.15rem", color: GOLD }}>{val}</div>
      <div style={{ fontSize: "0.52rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b90b4", fontFamily: "var(--font-mono,monospace)", marginTop: 2 }}>{label}</div>
    </div>
  )
  return (
    <div>
      <button type="button" onClick={onVolver} style={{ ...ghostBtn, padding: "0.5rem 0.9rem", marginBottom: "1rem" }}>← Volver a la lectura</button>
      <p style={{ ...kickerStyle, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}><Gem size={12} /> Revelación numerológica de misión</p>
      <h2 style={titleStyle}>{r.nombre}</h2>
      <p style={{ margin: "0.6rem 0 0", fontSize: "0.78rem", letterSpacing: "0.08em", color: "#8b90b4", fontFamily: "var(--font-mono,monospace)" }}>
        {r.fecha.split("-").reverse().join("/")}{r.ciudad ? ` · ${r.ciudad}` : ""}{r.nombreCosmico ? ` · ${r.nombreCosmico}` : ""}
      </p>

      <DeepSection n={1} title="Mensaje principal de revelación">{paras(L.revelacion)}</DeepSection>

      <DeepSection n={2} title="Matriz numerológica del nombre">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.9rem" }}>
          {L.matriz.letras.map((x, i) => (
            <div key={i} title={x.tipo} style={{
              width: 40, padding: "0.35rem 0", borderRadius: 8, textAlign: "center",
              border: `1px solid ${x.tipo === "vocal" ? "rgba(217,184,102,0.5)" : "rgba(167,139,202,0.35)"}`,
              background: x.tipo === "vocal" ? "rgba(217,184,102,0.1)" : "rgba(167,139,202,0.08)",
            }}>
              <div style={{ fontFamily: "var(--font-cinzel,serif)", fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>{x.letra}</div>
              <div style={{ fontSize: "0.7rem", color: x.tipo === "vocal" ? GOLD : VIOLET, fontFamily: "var(--font-mono,monospace)" }}>{x.numero}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(90px,1fr))", gap: "0.5rem" }}>
          {chip("Vocales", String(L.matriz.sumaVocales))}
          {chip("Consonantes", String(L.matriz.sumaConsonantes))}
          {chip("Total", String(L.matriz.sumaTotal))}
        </div>
        <div style={{ marginTop: "0.7rem", fontSize: "0.85rem", lineHeight: 1.7, color: "#c6cbe6" }}>
          <p style={{ margin: 0 }}><b style={{ color: "#fff" }}>Dominantes:</b> {L.matriz.dominantes.join(", ") || "—"} · <b style={{ color: "#fff" }}>Ausentes:</b> {L.matriz.ausentes.join(", ") || "—"}</p>
          <p style={{ margin: "0.3rem 0 0" }}><b style={{ color: "#fff" }}>Maestros:</b> {L.matriz.maestros.join(", ") || "—"} · <b style={{ color: "#fff" }}>Kármicos:</b> {L.matriz.karmicos.join(", ") || "—"}</p>
        </div>
      </DeepSection>

      <DeepSection n={3} title="Camino álmico">
        <p style={{ margin: "0 0 0.6rem", fontFamily: "var(--font-mono,monospace)", fontSize: "0.8rem", color: GOLD_DEEP }}>
          {L.camino.sumaVisible} = {L.camino.total} → {L.camino.reduccion}{L.camino.maestro ? " · número maestro" : ""}
        </p>
        {paras(L.caminoTexto)}
      </DeepSection>
      <DeepSection n={4} title="Impulso del alma">{paras(L.alma)}</DeepSection>
      <DeepSection n={5} title="Presencia externa">{paras(L.presencia)}</DeepSection>
      <DeepSection n={6} title="Dirección de servicio">{paras(L.servicio)}</DeepSection>
      <DeepSection n={7} title="El verbo del nombre">{paras(L.verbo)}</DeepSection>
      <DeepSection n={8} title="Plano dominante">{paras(L.planoTexto)}</DeepSection>

      <DeepSection n={9} title="Casas internas de la matriz">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "0.6rem" }}>
          {L.casas.map((c) => (
            <div key={c.n} style={{ padding: "0.7rem 0.8rem", borderRadius: 10, border: "1px solid rgba(167,139,202,0.18)", background: "rgba(10,11,26,0.4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--font-cinzel,serif)", fontWeight: 700, fontSize: "0.9rem", color: "#fff" }}>Casa {c.n} · {c.nombre}</span>
                <span style={{ fontSize: "0.62rem", color: c.veces ? GOLD : "#5a5f80", fontFamily: "var(--font-mono,monospace)" }}>{c.veces ? `×${c.veces}` : "—"}</span>
              </div>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", lineHeight: 1.55, color: "#c6cbe6" }}>{c.texto}</p>
            </div>
          ))}
        </div>
      </DeepSection>

      <DeepSection n={10} title="Herida, medicina y linaje">{paras(L.heridaMedicina)}</DeepSection>
      {L.territorio && <DeepSection n={11} title="Territorio y misión">{paras(L.territorio)}</DeepSection>}

      <DeepSection n={12} title="Ciclo actual">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.5rem", marginBottom: "0.8rem" }}>
          {chip("Año personal", String(L.ciclo.anioPersonal))}
          {chip("Mes personal", String(L.ciclo.mesPersonal))}
          {chip("Día personal", String(L.ciclo.diaPersonal))}
        </div>
        {paras(L.ciclo.texto)}
        <p style={{ margin: "0.7rem 0 0", padding: "0.7rem 0.9rem", borderLeft: `2px solid ${GOLD}`, borderRadius: 8, background: "rgba(217,184,102,0.06)", fontSize: "0.92rem", lineHeight: 1.7, color: "#eef1fb" }}>
          <b style={{ color: GOLD }}>Acción del momento:</b> {L.ciclo.accion}
        </p>
      </DeepSection>

      <DeepSection n={13} title="Los cinco objetivos de Los 144.000">
        {paras(L.objetivos.texto)}
        <ol style={{ margin: "0.7rem 0 0", paddingLeft: "1.2rem", color: "#e6e9f7", fontSize: "0.9rem", lineHeight: 1.7 }}>
          {L.objetivos.lista.map((o, i) => (
            <li key={i} style={o.toLowerCase() === L.objetivos.inicio.toLowerCase() ? { color: GOLD, fontWeight: 600 } : undefined}>{o}</li>
          ))}
        </ol>
      </DeepSection>

      <DeepSection n={14} title="Acciones de integración">
        <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "#e6e9f7", fontSize: "0.92rem", lineHeight: 1.75 }}>
          {L.acciones.map((a, i) => <li key={i} style={{ marginBottom: "0.4rem" }}>{a}</li>)}
        </ul>
      </DeepSection>

      <DeepSection n={15} title="Frase de misión personal">
        <p style={{ margin: 0, fontFamily: "var(--font-cinzel,serif)", fontSize: "1.15rem", lineHeight: 1.5, fontStyle: "italic", color: GOLD }}>“{L.frase}”</p>
      </DeepSection>

      {/* 16. Botones finales */}
      <div style={{ marginTop: "1.8rem", display: "flex", flexWrap: "wrap", gap: "0.7rem" }}>
        <button type="button" onClick={() => { onGuardar(); setSavedNow(true) }} disabled={savedNow} style={{ ...primaryBtn, opacity: savedNow ? 0.6 : 1, cursor: savedNow ? "default" : "pointer" }}>
          {savedNow ? <><Check size={15} /> Guardado en tu bitácora</> : <><BookmarkPlus size={15} /> Guardar en Mi Gran Bitácora</>}
        </button>
        <button type="button" onClick={onPdf} style={ghostBtn}><FileDown size={14} /> Descargar informe PDF</button>
        <button type="button" onClick={() => { onActualizar(); setSavedNow(false) }} style={ghostBtn}><RefreshCw size={14} /> Actualizar con mi bitácora</button>
      </div>
      {isAdmin && (
        <p style={{ margin: "1rem 0 0", fontSize: "0.66rem", color: "#6a6f92", fontFamily: "var(--font-mono,monospace)", letterSpacing: "0.06em" }}>
          Modo admin · acceso de pruebas activo.
        </p>
      )}
    </div>
  )
}

// ── PDF de la Revelación Numerológica de Misión ──────────────────────────
function esc(s: string): string { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") }

function buildDeepReportHtml(r: NumerologiaResultado, L: LecturaProfunda, estado: string): string {
  const today = new Date().toLocaleDateString("es", { day: "2-digit", month: "long", year: "numeric" })
  const p = (t: string) => t.split("\n\n").map((x) => `<p>${esc(x)}</p>`).join("")
  const sec = (n: number, title: string, body: string) => `<section><h2>${n} · ${esc(title)}</h2>${body}</section>`
  const matrizCells = L.matriz.letras.map((x) =>
    `<span class="cell ${x.tipo}">${esc(x.letra)}<b>${x.numero}</b></span>`).join("")
  const casas = L.casas.map((c) =>
    `<div class="casa"><b>Casa ${c.n} · ${esc(c.nombre)}</b> ${c.veces ? `(×${c.veces})` : "(—)"}<br/>${esc(c.texto)}</div>`).join("")
  const acciones = L.acciones.map((a) => `<li>${esc(a)}</li>`).join("")
  const objetivos = L.objetivos.lista.map((o) => `<li>${esc(o)}</li>`).join("")

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"/>
<title>Revelación Numerológica de Misión — ${esc(r.nombre)}</title>
<style>
  @page { margin: 20mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Times New Roman", serif; color: #1a1a24; line-height: 1.65; margin: 0; }
  .cover { text-align: center; padding: 46px 0 26px; border-bottom: 2px solid #c9a86b; }
  .cover .glyph { font-size: 34px; color: #b8934a; }
  .cover h1 { font-size: 26px; letter-spacing: 1.5px; margin: 12px 0 4px; color: #2a2140; }
  .cover .who { font-size: 14px; color: #444; margin-top: 8px; }
  .cover .date { font-size: 11px; color: #888; margin-top: 12px; letter-spacing: 1px; text-transform: uppercase; }
  h2 { font-size: 15px; letter-spacing: 0.5px; color: #6d4a9b; border-left: 3px solid #c9a86b; padding-left: 10px; margin: 26px 0 10px; }
  section { page-break-inside: auto; }
  p { font-size: 13px; margin: 0 0 9px; }
  .matriz { margin: 6px 0 12px; }
  .cell { display: inline-block; min-width: 30px; text-align: center; padding: 4px 6px; margin: 2px; border: 1px solid #ccc; border-radius: 6px; font-size: 13px; }
  .cell b { display: block; font-size: 11px; color: #6d4a9b; }
  .cell.vocal { border-color: #c9a86b; background: #faf4e4; }
  .sums { font-size: 12px; color: #333; margin: 4px 0 6px; }
  .casa { font-size: 12px; margin: 0 0 8px; padding: 6px 8px; border: 1px solid #eee; border-radius: 6px; page-break-inside: avoid; }
  ul, ol { font-size: 13px; margin: 4px 0 10px; padding-left: 20px; }
  li { margin: 0 0 5px; }
  .frase { font-style: italic; font-size: 15px; color: #6d4a9b; border-left: 3px solid #c9a86b; padding-left: 12px; }
  .estado { font-size: 10px; color: #999; text-align: center; margin: 8px 0 16px; text-transform: uppercase; letter-spacing: 1px; }
</style></head>
<body>
  <div class="cover">
    <div class="glyph">✷</div>
    <h1>REVELACIÓN NUMEROLÓGICA DE MISIÓN</h1>
    <div style="font-size:12px;letter-spacing:3px;color:#b8934a;">LOS 144.000</div>
    <div class="who">${esc(r.nombre)} · ${esc(r.fecha.split("-").reverse().join("/"))}${r.ciudad ? " · " + esc(r.ciudad) : ""}${r.nombreCosmico ? " · " + esc(r.nombreCosmico) : ""}</div>
    <div class="date">Generado el ${esc(today)}</div>
  </div>
  <div class="estado">Estado: ${esc(estado)}</div>
  ${sec(1, "Mensaje principal de revelación", p(L.revelacion))}
  ${sec(2, "Matriz numerológica del nombre", `<div class="matriz">${matrizCells}</div><div class="sums">Vocales: ${L.matriz.sumaVocales} · Consonantes: ${L.matriz.sumaConsonantes} · Total: ${L.matriz.sumaTotal}<br/>Dominantes: ${L.matriz.dominantes.join(", ") || "—"} · Ausentes: ${L.matriz.ausentes.join(", ") || "—"} · Maestros: ${L.matriz.maestros.join(", ") || "—"} · Kármicos: ${L.matriz.karmicos.join(", ") || "—"}</div>`)}
  ${sec(3, "Camino álmico", `<p><b>${esc(L.camino.sumaVisible)} = ${L.camino.total} → ${L.camino.reduccion}${L.camino.maestro ? " (maestro)" : ""}</b></p>${p(L.caminoTexto)}`)}
  ${sec(4, "Impulso del alma", p(L.alma))}
  ${sec(5, "Presencia externa", p(L.presencia))}
  ${sec(6, "Dirección de servicio", p(L.servicio))}
  ${sec(7, "El verbo del nombre", p(L.verbo))}
  ${sec(8, "Plano dominante", p(L.planoTexto))}
  ${sec(9, "Casas internas de la matriz", casas)}
  ${sec(10, "Herida, medicina y linaje", p(L.heridaMedicina))}
  ${L.territorio ? sec(11, "Territorio y misión", p(L.territorio)) : ""}
  ${sec(12, "Ciclo actual", `<p>Año personal ${L.ciclo.anioPersonal} · Mes ${L.ciclo.mesPersonal} · Día ${L.ciclo.diaPersonal}</p>${p(L.ciclo.texto)}<p><b>Acción del momento:</b> ${esc(L.ciclo.accion)}</p>`)}
  ${sec(13, "Los cinco objetivos de Los 144.000", `${p(L.objetivos.texto)}<ol>${objetivos}</ol>`)}
  ${sec(14, "Acciones de integración", `<ul>${acciones}</ul>`)}
  ${sec(15, "Frase de misión personal", `<p class="frase">“${esc(L.frase)}”</p>`)}
  <script>window.onload=function(){setTimeout(function(){window.focus();window.print();},250);};</script>
</body></html>`
}
