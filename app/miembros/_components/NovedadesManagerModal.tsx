"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  GESTIONAR LAS NOVEDADES — solo administración
// ═══════════════════════════════════════════════════════════════════════════
//
// ── EL PROBLEMA QUE RESUELVE ──────────────────────────────────────────────
// Publicar un aviso de dos líneas exigía pegar SQL en Supabase. O sea que
// dependía de que hubiera alguien delante para hacerlo, y un aviso que hay
// que pedir no se publica: se deja para luego.
//
// ── Y EL QUE EVITA ────────────────────────────────────────────────────────
// Que se queden puestos. «El domingo 15 nos vemos en vivo» siguió en la
// portada días después de la reunión. Retirar a mano exige acordarse, y nadie
// se acuerda de algo que solo molesta a quien entra, no a quien lo escribió.
//
// Por eso la caducidad NO es un campo opcional escondido al final: se elige
// al escribir, con botones de días, y viene puesta en tres días por defecto.
// Lo normal debe ser lo fácil; quedarse para siempre es lo que hay que pedir
// a propósito.

import { useEffect, useMemo, useState } from "react"
import {
  X, Plus, Trash2, Loader2, Pencil, AlertTriangle, EyeOff, Megaphone, Check,
} from "lucide-react"

type Novedad = {
  id: string
  titulo: string
  cuerpo: string
  creada: string
  eventoAt: string | null
  eventoZona: string | null
  ctaTexto: string | null
  ctaUrl: string | null
  respuestas: number
  caducaAt: string | null
  retirada: boolean
}

type Props = { open: boolean; onClose: () => void }

export function NovedadesManagerModal({ open, onClose }: Props) {
  const [novedades, setNovedades] = useState<Novedad[]>([])
  const [cargando, setCargando] = useState(true)
  const [sinCaducidad, setSinCaducidad] = useState(false)
  const [sinEspacio, setSinEspacio] = useState(false)
  const [fallo, setFallo] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [escribiendo, setEscribiendo] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)

  async function refrescar() {
    setCargando(true)
    try {
      const r = await fetch("/api/admin/novedades", { credentials: "include" })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`)
      setNovedades(j.novedades ?? [])
      setSinCaducidad(!!j.sinCaducidad)
      setSinEspacio(!!j.sinEspacio)
    } catch (e) {
      setFallo(e instanceof Error ? e.message : "No se pudo cargar.")
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { if (open) void refrescar() }, [open])

  if (!open) return null

  async function accion(clave: string, fn: () => Promise<Response>) {
    setOcupado(clave)
    setFallo(null)
    try {
      const r = await fn()
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`)
      if (j.aviso) setFallo(j.aviso)
      await refrescar()
      // Avisa a la portada para que se recargue sin tener que refrescar.
      window.dispatchEvent(new CustomEvent("app:novedades-cambiadas"))
      return true
    } catch (e) {
      setFallo(e instanceof Error ? e.message : "No se pudo guardar.")
      return false
    } finally {
      setOcupado(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050510]/85 p-3 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative flex max-h-[92vh] w-[min(900px,96vw)] flex-col overflow-hidden border border-[#251f30] bg-[#0a0a18]"
        style={{ borderRadius: 18 }}
      >
        <div className="flex items-center justify-between border-b border-[#251f30] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#F3F6FA] [font-family:var(--font-cinzel)]">
              Novedades de Los 144.000
            </h2>
            <p className="text-xs text-[#a8a8c0]">
              {novedades.length} {novedades.length === 1 ? "aviso" : "avisos"} · solo admin
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar"
            className="rounded p-2 text-[#a8a8c0] hover:bg-[#251f30] hover:text-[#F3F6FA]">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {sinEspacio && (
            <Aviso>
              Falta correr <code>docs/sql/novedades_01_espacio.sql</code> en Supabase.
            </Aviso>
          )}
          {sinCaducidad && (
            <Aviso>
              Falta correr <code>docs/sql/novedades_02_caducidad.sql</code>. Hasta
              entonces los avisos se publican <strong>sin fecha de retirada</strong> y
              hay que quitarlos a mano.
            </Aviso>
          )}
          {fallo && <Aviso rojo>{fallo}</Aviso>}

          {escribiendo ? (
            <Formulario
              guardando={ocupado === "nueva"}
              onCancelar={() => setEscribiendo(false)}
              onGuardar={async (datos) => {
                const ok = await accion("nueva", () =>
                  fetch("/api/admin/novedades", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(datos),
                  }))
                if (ok) setEscribiendo(false)
              }}
            />
          ) : (
            <button type="button" onClick={() => { setEscribiendo(true); setFallo(null) }}
              className="mb-5 inline-flex items-center gap-2 border border-[#6D4A9B]/60 bg-[#6D4A9B]/12 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c3b2e0] hover:bg-[#6D4A9B]/28 [font-family:var(--font-mono)]"
              style={{ borderRadius: 8 }}>
              <Plus size={14} aria-hidden /> Publicar una novedad
            </button>
          )}

          {cargando ? (
            <p className="flex items-center gap-2 py-6 text-[12px] text-[#8b90b4]">
              <Loader2 size={14} className="animate-spin" aria-hidden /> Cargando…
            </p>
          ) : novedades.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Megaphone size={26} className="text-[#6D4A9B]" aria-hidden />
              <p className="text-[13px] text-[#a8a8c0]">No hay ninguna novedad.</p>
              <p className="max-w-[46ch] text-[11px] leading-relaxed text-[#6a6a7a]">
                Mientras no haya ninguna visible, la sección no se dibuja en la
                portada. Nadie ve un hueco vacío.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {novedades.map((n) => (
                <li key={n.id}>
                  {editando === n.id ? (
                    <Formulario
                      inicial={n}
                      guardando={ocupado === n.id}
                      onCancelar={() => setEditando(null)}
                      onGuardar={async (datos) => {
                        const ok = await accion(n.id, () =>
                          fetch(`/api/admin/novedades/${n.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify(datos),
                          }))
                        if (ok) setEditando(null)
                      }}
                    />
                  ) : (
                    <Fila
                      n={n}
                      ocupada={ocupado === n.id}
                      onEditar={() => { setEditando(n.id); setFallo(null) }}
                      onRetirar={() => void accion(n.id, () =>
                        fetch(`/api/admin/novedades/${n.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          // Un minuto atrás: ya caducada, sin depender de que
                          // los relojes del navegador y del servidor coincidan.
                          body: JSON.stringify({
                            caducaAt: new Date(Date.now() - 60_000).toISOString(),
                          }),
                        }))}
                      onBorrar={() => {
                        if (!confirm(
                          `¿Borrar «${n.titulo}» del todo?\n\n` +
                          (n.respuestas > 0
                            ? `Se van también sus ${n.respuestas} respuesta(s). `
                            : "") +
                          "Si solo quieres que deje de salir en la portada, usa Retirar.",
                        )) return
                        void accion(n.id, () =>
                          fetch(`/api/admin/novedades/${n.id}`, {
                            method: "DELETE", credentials: "include",
                          }))
                      }}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function Aviso({ children, rojo }: { children: React.ReactNode; rojo?: boolean }) {
  return (
    <p className={
      "mb-4 flex items-start gap-2 border px-3 py-2 text-[12px] leading-relaxed " +
      (rojo
        ? "border-[#8a5a5a]/40 bg-[#7f1d1d]/14 text-[#fca5a5]"
        : "border-[#e0b06a]/40 bg-[#e0b06a]/10 text-[#e0b06a]")
    }>
      <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  UNA FILA
// ═══════════════════════════════════════════════════════════════════════════

function Fila({
  n, ocupada, onEditar, onRetirar, onBorrar,
}: {
  n: Novedad
  ocupada: boolean
  onEditar: () => void
  onRetirar: () => void
  onBorrar: () => void
}) {
  const actoPasado = !!n.eventoAt && new Date(n.eventoAt).getTime() < Date.now()
  // El caso que trajo todo esto: la reunión ya fue y el aviso sigue en la
  // portada porque nadie le puso fecha de retirada.
  const colgada = actoPasado && !n.caducaAt

  return (
    <div className="border border-[#251f30] bg-[#0d0d1a] p-3" style={{ borderRadius: 12 }}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#F3F6FA]">
          {n.titulo}
        </p>
        {n.retirada ? (
          <Etiqueta tono="gris"><EyeOff size={10} /> Retirada</Etiqueta>
        ) : (
          <Etiqueta tono="verde">En la portada</Etiqueta>
        )}
      </div>

      <p className="mt-1 text-[11px] text-[#8b90b4] [font-family:var(--font-mono)]">
        {n.eventoAt ? <>Acto: {fecha(n.eventoAt)} · </> : null}
        {n.caducaAt
          ? <>Se retira: {fecha(n.caducaAt)}</>
          : <>Sin fecha de retirada</>}
        {n.respuestas > 0 && <> · {n.respuestas} respuesta(s)</>}
      </p>

      {colgada && !n.retirada && (
        <p className="mt-2 border-l-2 border-[#e0b06a] pl-2 text-[11px] leading-relaxed text-[#e0b06a]">
          Ese encuentro ya pasó y este aviso no caduca, así que sigue en la
          portada. Pulsa <strong>Retirar</strong>.
        </p>
      )}

      <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-[#6a6a7a]">
        {n.cuerpo}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {ocupada && <Loader2 size={13} className="animate-spin text-[#8b90b4]" aria-hidden />}
        <Accion onClick={onEditar} disabled={ocupada} icono={<Pencil size={12} />}>
          Editar
        </Accion>
        {!n.retirada && (
          <Accion onClick={onRetirar} disabled={ocupada} icono={<EyeOff size={12} />}>
            Retirar de la portada
          </Accion>
        )}
        <Accion onClick={onBorrar} disabled={ocupada} peligro icono={<Trash2 size={12} />}>
          Borrar
        </Accion>
      </div>
    </div>
  )
}

function Etiqueta({ children, tono }: { children: React.ReactNode; tono: "verde" | "gris" }) {
  return (
    <span className={
      "inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] " +
      "uppercase tracking-[0.14em] [font-family:var(--font-mono)] " +
      (tono === "verde"
        ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-400"
        : "border-[#2f2f42] text-[#6a6a7a]")
    }>
      {children}
    </span>
  )
}

function Accion({
  children, icono, onClick, disabled, peligro,
}: {
  children: React.ReactNode
  icono: React.ReactNode
  onClick: () => void
  disabled?: boolean
  peligro?: boolean
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={
        "inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-[10px] " +
        "uppercase tracking-[0.12em] disabled:opacity-40 [font-family:var(--font-mono)] " +
        (peligro
          ? "border-[#8a5a5a]/40 text-[#a87a7a] hover:border-[#8a5a5a] hover:text-[#fca5a5]"
          : "border-[#2f2f42] text-[#a0a0b0] hover:border-[#6D4A9B] hover:text-[#F3F6FA]")
      }>
      {icono}{children}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  EL FORMULARIO
// ═══════════════════════════════════════════════════════════════════════════

type Datos = {
  titulo: string
  cuerpo: string
  eventoAt: string | null
  ctaTexto: string | null
  ctaUrl: string | null
  caducaAt: string | null
}

function Formulario({
  inicial, guardando, onGuardar, onCancelar,
}: {
  inicial?: Novedad
  guardando: boolean
  onGuardar: (d: Datos) => void | Promise<void>
  onCancelar: () => void
}) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? "")
  const [cuerpo, setCuerpo] = useState(inicial?.cuerpo ?? "")
  const [evento, setEvento] = useState(paraCampo(inicial?.eventoAt))
  const [ctaTexto, setCtaTexto] = useState(inicial?.ctaTexto ?? "")
  const [ctaUrl, setCtaUrl] = useState(inicial?.ctaUrl ?? "")
  // ── TRES DÍAS POR DEFECTO ──────────────────────────────────────────
  // Lo normal es que un aviso dure unos días. Si la opción por defecto fuera
  // «no caduca», todos se quedarían puestos, que es exactamente el problema
  // que trajo esta pantalla.
  const [caduca, setCaduca] = useState(
    inicial ? paraCampo(inicial.caducaAt) : paraCampo(enDias(3)),
  )

  const diasPuestos = useMemo(() => {
    if (!caduca) return null
    const faltan = (new Date(caduca).getTime() - Date.now()) / 86_400_000
    return Math.max(0, Math.round(faltan))
  }, [caduca])

  return (
    <form
      className="mb-5 flex flex-col gap-4 border border-[#6D4A9B]/35 bg-[#0d0d1a] p-4"
      style={{ borderRadius: 12 }}
      onSubmit={(e) => {
        e.preventDefault()
        if (!titulo.trim() || !cuerpo.trim() || guardando) return
        void onGuardar({
          titulo: titulo.trim(),
          cuerpo: cuerpo.trim(),
          eventoAt: evento ? new Date(evento).toISOString() : null,
          ctaTexto: ctaTexto.trim() || null,
          ctaUrl: ctaUrl.trim() || null,
          caducaAt: caduca ? new Date(caduca).toISOString() : null,
        })
      }}
    >
      <div>
        <Rotulo>Título</Rotulo>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={140}
          placeholder="Ya está la grabación del primer encuentro" className={CAMPO} />
      </div>

      <div>
        <Rotulo>El aviso</Rotulo>
        <textarea value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} rows={4}
          maxLength={4000}
          placeholder="Dos o tres líneas. Esto es lo que se lee al desplegar."
          className={CAMPO + " resize-y"} />
      </div>

      {/* ── CUÁNDO SE RETIRA: ARRIBA Y CON BOTONES ─────────────────────
          No es un campo más al final. Es la decisión que evita que la
          portada acabe llena de avisos de cosas que ya pasaron. */}
      <div className="border border-[#2f2f42] bg-[#0a0a14] p-3" style={{ borderRadius: 10 }}>
        <Rotulo>Cuánto dura en la portada</Rotulo>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {[1, 3, 7, 14].map((d) => (
            <button key={d} type="button" onClick={() => setCaduca(paraCampo(enDias(d)))}
              className={
                "rounded border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] " +
                "[font-family:var(--font-mono)] " +
                (diasPuestos === d
                  ? "border-[#6D4A9B] bg-[#6D4A9B]/20 text-[#c3b2e0]"
                  : "border-[#2f2f42] text-[#a0a0b0] hover:border-[#6D4A9B]")
              }>
              {d} {d === 1 ? "día" : "días"}
            </button>
          ))}
          <button type="button" onClick={() => setCaduca("")}
            className={
              "rounded border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] " +
              "[font-family:var(--font-mono)] " +
              (!caduca
                ? "border-[#e0b06a] bg-[#e0b06a]/15 text-[#e0b06a]"
                : "border-[#2f2f42] text-[#a0a0b0] hover:border-[#e0b06a]")
            }>
            No caduca
          </button>
        </div>
        <input type="datetime-local" value={caduca}
          onChange={(e) => setCaduca(e.target.value)} className={CAMPO} />
        <p className="mt-1.5 text-[10px] leading-relaxed text-[#6a6a7a]">
          {caduca
            ? <>Dejará de verse en la portada automáticamente. No se borra: queda en Novedades con sus respuestas.</>
            : <><strong className="text-[#e0b06a]">Se quedará puesta hasta que la quites a mano.</strong> Úsalo solo para algo que no caduca nunca.</>}
        </p>
      </div>

      <div>
        <Rotulo>Fecha del encuentro · opcional</Rotulo>
        <input type="datetime-local" value={evento}
          onChange={(e) => setEvento(e.target.value)} className={CAMPO} />
        <p className="mt-1 text-[10px] text-[#6a6a7a]">
          Solo si el aviso es una cita. Es lo que hace que la portada diga
          «mañana · 11:00» y pinte el punto de color.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Rotulo>Texto del botón · opcional</Rotulo>
          <input value={ctaTexto} onChange={(e) => setCtaTexto(e.target.value)} maxLength={40}
            placeholder="Ver la grabación" className={CAMPO} />
        </div>
        <div>
          <Rotulo>Enlace del botón</Rotulo>
          <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)}
            placeholder="/miembros/encuentro/1" className={CAMPO} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={guardando || !titulo.trim() || !cuerpo.trim()}
          className="inline-flex items-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/18 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c3b2e0] hover:bg-[#6D4A9B]/32 disabled:opacity-40 [font-family:var(--font-mono)]"
          style={{ borderRadius: 8 }}>
          {guardando ? <Loader2 size={13} className="animate-spin" aria-hidden /> : <Check size={13} />}
          {inicial ? "Guardar cambios" : "Publicar"}
        </button>
        <button type="button" onClick={onCancelar}
          className="px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] text-[#8b90b4] hover:text-[#F3F6FA] [font-family:var(--font-mono)]">
          Cancelar
        </button>
      </div>
    </form>
  )
}

const CAMPO =
  "w-full border border-[#2f2f42] bg-[#0a0a14] px-3 py-2.5 text-[13px] text-[#F3F6FA] " +
  "placeholder:text-[#4a4a5a] focus:border-[#6D4A9B] focus:outline-none"

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">
      {children}
    </label>
  )
}

function enDias(d: number): string {
  return new Date(Date.now() + d * 86_400_000).toISOString()
}

/** ISO → el formato que entiende <input type="datetime-local">, en hora local. */
function paraCampo(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ""
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function fecha(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-419", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    })
  } catch { return iso }
}
