"use client"

// NUMEROLOGÍA CÓSMICA — herramienta gratuita de la Biblioteca de Los 144.000.
// Panel visible → formulario → "Escáner de código personal" (7 bloques).
// Estética cósmica (violeta/oro), responsive, scroll interno, guarda en la
// Gran Bitácora. Sin dependencias externas.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { X, Sparkles, Lock, BookmarkPlus, RefreshCw, Check } from "lucide-react"
import {
  calcular, num, planoTexto, mensajeMision, resultadoATexto,
  saveLastReading, loadLastReading, bitacoraPrompt,
  type NumerologiaResultado,
} from "../_lib/numerologia"
import { upsertAnswer } from "../_lib/journal-store"

const GOLD = "#e6cf95"
const GOLD_DEEP = "#c9a86b"
const VIOLET = "#a78bca"

type Stage = "form" | "result"

export function NumerologiaCosmica() {
  const [open, setOpen] = useState(false)
  const [stage, setStage] = useState<Stage>("form")
  const [result, setResult] = useState<NumerologiaResultado | null>(null)
  const [hasSaved, setHasSaved] = useState(false)

  // form fields
  const [nombre, setNombre] = useState("")
  const [fecha, setFecha] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [cosmico, setCosmico] = useState("")

  const bodyRef = useRef<HTMLDivElement>(null)

  // Carga la última lectura guardada (para el botón del panel).
  useEffect(() => {
    const last = loadLastReading()
    if (last) setResult(last)
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

  return (
    <>
      <PanelCard onCalcular={openForm} onVer={result ? openResult : undefined} result={result} />
      {open && (
        <Overlay onClose={() => setOpen(false)}>
          <div
            ref={bodyRef}
            className="min-h-0 flex-1 overflow-y-auto"
            style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
          >
            <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(1.4rem,4vw,2.6rem) clamp(1.1rem,4vw,2rem) 4rem" }}>
              {stage === "form" ? (
                <FormView
                  nombre={nombre} setNombre={setNombre}
                  fecha={fecha} setFecha={setFecha}
                  ciudad={ciudad} setCiudad={setCiudad}
                  cosmico={cosmico} setCosmico={setCosmico}
                  canSubmit={canSubmit} onSubmit={submit}
                />
              ) : result ? (
                <ResultView
                  r={result}
                  hasSaved={hasSaved}
                  onGuardar={guardar}
                  onActualizar={() => { prefill(result); setStage("form") }}
                />
              ) : null}
            </div>
          </div>
        </Overlay>
      )}
    </>
  )
}

// ── Panel visible en la Biblioteca ──────────────────────────────────────
function PanelCard({ onCalcular, onVer, result }: {
  onCalcular: () => void; onVer?: () => void; result: NumerologiaResultado | null
}) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 20,
        border: "1px solid rgba(167,139,202,0.28)",
        background: "linear-gradient(155deg, rgba(40,30,72,0.55) 0%, rgba(16,14,34,0.72) 55%, rgba(8,9,20,0.78) 100%)",
        boxShadow: "0 26px 60px -30px rgba(90,60,160,0.6)",
        overflow: "hidden",
        padding: "clamp(1.4rem,4vw,2.2rem)",
      }}
    >
      {/* Glow decorativo */}
      <div aria-hidden style={{
        position: "absolute", top: -80, right: -60, width: 260, height: 260, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(167,139,202,0.35), transparent 70%)", pointerEvents: "none",
      }} />
      <div aria-hidden style={{
        position: "absolute", bottom: -90, left: -50, width: 220, height: 220, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(217,184,102,0.18), transparent 70%)", pointerEvents: "none",
      }} />

      <div style={{ position: "relative" }}>
        <p style={{ margin: 0, fontFamily: "var(--font-mono,monospace)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.34em", textTransform: "uppercase", color: GOLD }}>
          Herramienta viva · gratuita
        </p>
        <h3 style={{
          margin: "0.7rem 0 0", fontFamily: "var(--font-cinzel,serif)", fontWeight: 800,
          fontSize: "clamp(1.5rem,4.5vw,2.1rem)", lineHeight: 1.08, color: "#fff", letterSpacing: "0.02em",
        }}>
          Numerología Cósmica
        </h3>
        <p style={{ margin: "0.5rem 0 0", fontFamily: "var(--font-mono,monospace)", fontSize: "0.72rem", letterSpacing: "0.22em", textTransform: "uppercase", color: VIOLET }}>
          Nombre · Fecha · Alma · Misión
        </p>
        <p style={{ margin: "1.15rem 0 0", maxWidth: "60ch", fontSize: "clamp(0.92rem,1.5vw,1rem)", lineHeight: 1.78, color: "#c6cbe6" }}>
          Tu nombre y tu fecha de nacimiento guardan una arquitectura vibratoria. La Numerología Cósmica abre
          una primera lectura de tu código personal: la forma en que tu conciencia entra en la materia, expresa
          su energía y comienza a revelar su servicio dentro de la Red.
        </p>

        <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.7rem" }}>
          <button type="button" onClick={onCalcular} style={primaryBtn}>
            <Sparkles size={15} /> Calcular mi código personal
          </button>
          {onVer && (
            <button type="button" onClick={onVer} style={ghostBtn}>
              Ver mi última lectura
            </button>
          )}
        </div>
        {result && (
          <p style={{ margin: "0.9rem 0 0", fontSize: "0.72rem", color: "#8b90b4", fontFamily: "var(--font-mono,monospace)", letterSpacing: "0.08em" }}>
            Última lectura: {result.nombre} · Camino {result.caminoVida} · Alma {result.alma}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Overlay a pantalla completa ─────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[600] flex items-start justify-center sm:items-center"
      style={{
        background: "rgba(4,5,12,0.9)",
        backdropFilter: "blur(6px)",
        padding: "calc(env(safe-area-inset-top,0px) + 16px) 12px calc(env(safe-area-inset-bottom,0px) + 16px)",
        overscrollBehavior: "contain",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
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

// ── Formulario ──────────────────────────────────────────────────────────
function FormView(p: {
  nombre: string; setNombre: (v: string) => void
  fecha: string; setFecha: (v: string) => void
  ciudad: string; setCiudad: (v: string) => void
  cosmico: string; setCosmico: (v: string) => void
  canSubmit: boolean; onSubmit: (e?: React.FormEvent) => void
}) {
  return (
    <form onSubmit={p.onSubmit}>
      <p style={kickerStyle}>Escáner de código personal</p>
      <h2 style={titleStyle}>Ingresa tus datos</h2>
      <p style={{ margin: "0.9rem 0 1.6rem", fontSize: "0.95rem", lineHeight: 1.7, color: "#c6cbe6" }}>
        Escribe tu nombre tal como resuena en ti. La lectura se calcula al instante y puedes guardarla en tu
        bitácora.
      </p>

      <Field label="Nombre completo" required>
        <input value={p.nombre} onChange={(e) => p.setNombre(e.target.value)} placeholder="Tu nombre y apellidos" style={inputStyle} autoFocus />
      </Field>
      <Field label="Fecha de nacimiento" required>
        <input type="date" value={p.fecha} onChange={(e) => p.setFecha(e.target.value)} style={inputStyle} max="2099-12-31" />
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
function ResultView({ r, hasSaved, onGuardar, onActualizar }: {
  r: NumerologiaResultado; hasSaved: boolean; onGuardar: () => void; onActualizar: () => void
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

      {/* Cerraduras futuras */}
      <LockedCards />
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
