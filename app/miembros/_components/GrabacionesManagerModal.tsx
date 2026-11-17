"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  GESTIONAR LAS GRABACIONES — solo administración
// ═══════════════════════════════════════════════════════════════════════════
//
// ── LO QUE NO SE PIDE ─────────────────────────────────────────────────────
// Imagen de portada. El vídeo ya vive en VTurb y VTurb genera su miniatura;
// pedir además una imagen sería trabajo para tener dos versiones de la misma
// cosa, que al mes siguiente ya no coinciden.
//
// ── LA PREVISUALIZACIÓN SE VE ANTES DE GUARDAR ────────────────────────────
// En cuanto se pega el código, aquí mismo aparece el fotograma. Eso no es
// adorno: es la única forma de saber que se pegó el código del vídeo QUE SE
// QUERÍA. Con cuarenta grabaciones en la cuenta de VTurb, dos códigos se
// distinguen en un identificador de veinticuatro caracteres —o se distinguen
// mirando la imagen.
//
// El navegador deduce la dirección de la miniatura para enseñarla ya. Al
// guardar, el servidor la COMPRUEBA de verdad y manda lo que encontró. Si no
// existe, se guarda sin imagen en vez de dejar un hueco roto.
//
// ── POR QUÉ NACE EN BORRADOR ──────────────────────────────────────────────
// Para que haya un momento entre pegar y que lo vea la Red. Se mira la
// miniatura, se abre el reproductor si hace falta, y se publica. Sin ese
// paso, cada pegote equivocado es visible mientras se corrige.

import { useMemo, useState } from "react"
import {
  X, Plus, Trash2, Loader2, Eye, EyeOff, Pin, PinOff, Pencil, Check,
  AlertTriangle, ImageOff, Film,
} from "lucide-react"
import { leerVturb } from "@/lib/red/vturb"
import { useGrabacionesAdmin, type GrabacionAdmin } from "../_lib/use-grabaciones"

type Props = { open: boolean; onClose: () => void }

export function GrabacionesManagerModal({ open, onClose }: Props) {
  const { grabaciones, cargando, error, sinTabla, crear, editar, borrar } =
    useGrabacionesAdmin()
  const [añadiendo, setAñadiendo] = useState(false)
  const [editando, setEditando] = useState<number | null>(null)
  const [ocupado, setOcupado] = useState<number | "nueva" | null>(null)
  const [fallo, setFallo] = useState<string | null>(null)

  if (!open) return null

  async function conFallo(clave: number | "nueva", accion: () => Promise<unknown>) {
    setOcupado(clave)
    setFallo(null)
    try {
      await accion()
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
        className="relative flex max-h-[92vh] w-[min(920px,96vw)] flex-col overflow-hidden border border-[#251f30] bg-[#0a0a18] shadow-[0_30px_80px_-10px_rgba(0,0,0,0.85)]"
        style={{ borderRadius: 18 }}
      >
        <div className="flex items-center justify-between border-b border-[#251f30] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#F3F6FA] [font-family:var(--font-cinzel)]">
              Grabaciones de los Encuentros
            </h2>
            <p className="text-xs text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
              {grabaciones.length}{" "}
              {grabaciones.length === 1 ? "grabación" : "grabaciones"} · solo admin
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded p-2 text-[#a8a8c0] transition-colors hover:bg-[#251f30] hover:text-[#F3F6FA]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Sin tabla no se puede guardar nada, así que se dice antes de que
              alguien rellene el formulario entero y pierda el texto. */}
          {sinTabla && (
            <p className="mb-4 flex items-start gap-2 border border-[#e0b06a]/40 bg-[#e0b06a]/10 px-3 py-2 text-[12px] leading-relaxed text-[#e0b06a] [font-family:var(--font-geist-sans)]">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                Primero hay que correr{" "}
                <code className="text-[#F3F6FA]">docs/sql/encuentros_grabaciones.sql</code>{" "}
                en Supabase → SQL Editor. Hasta entonces no se puede guardar
                ninguna grabación.
              </span>
            </p>
          )}

          {(fallo || error) && (
            <p className="mb-4 flex items-start gap-2 border border-[#8a5a5a]/40 bg-[#7f1d1d]/14 px-3 py-2 text-[12px] text-[#fca5a5] [font-family:var(--font-geist-sans)]">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
              {fallo || error}
            </p>
          )}

          {añadiendo ? (
            <Formulario
              guardando={ocupado === "nueva"}
              onCancelar={() => setAñadiendo(false)}
              onGuardar={async (datos) => {
                const ok = await conFallo("nueva", () => crear(datos))
                if (ok) setAñadiendo(false)
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => { setAñadiendo(true); setFallo(null) }}
              className="mb-5 inline-flex items-center gap-2 border border-[#6D4A9B]/60 bg-[#6D4A9B]/12 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c3b2e0] transition-colors hover:bg-[#6D4A9B]/28 [font-family:var(--font-mono)]"
              style={{ borderRadius: 8 }}
            >
              <Plus size={14} aria-hidden /> Añadir grabación
            </button>
          )}

          {cargando ? (
            <p className="flex items-center gap-2 py-6 text-[12px] text-[#8b90b4]">
              <Loader2 size={14} className="animate-spin" aria-hidden /> Cargando…
            </p>
          ) : grabaciones.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Film size={26} className="text-[#6D4A9B]" aria-hidden />
              <p className="text-[13px] text-[#a8a8c0]">Aún no has añadido ninguna.</p>
              <p className="max-w-[44ch] text-[11px] leading-relaxed text-[#6a6a7a]">
                En VTurb, sobre el vídeo, está el icono <code>&lt;/&gt;</code>. Ese
                código es el que se pega aquí.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {grabaciones.map((g) => (
                <li key={g.id}>
                  {editando === g.id ? (
                    <Formulario
                      inicial={g}
                      guardando={ocupado === g.id}
                      onCancelar={() => setEditando(null)}
                      onGuardar={async (datos) => {
                        const ok = await conFallo(g.id, () => editar(g.id, datos))
                        if (ok) setEditando(null)
                      }}
                    />
                  ) : (
                    <Fila
                      g={g}
                      ocupada={ocupado === g.id}
                      onEditar={() => { setEditando(g.id); setFallo(null) }}
                      onPublicar={() =>
                        void conFallo(g.id, () =>
                          editar(g.id, {
                            estado: g.estado === "publicado" ? "borrador" : "publicado",
                          }),
                        )
                      }
                      onFijar={() =>
                        void conFallo(g.id, () =>
                          editar(g.id, { sort_order: g.sort_order > 0 ? 0 : 1 }),
                        )
                      }
                      onBorrar={() => {
                        // El vídeo sigue en VTurb: esto solo lo quita de la Red.
                        // Se dice en la propia pregunta para que nadie crea que
                        // está destruyendo la grabación.
                        if (
                          !confirm(
                            `¿Quitar «${g.titulo}» del archivo?\n\n` +
                            "El vídeo NO se borra de VTurb: solo deja de verse en la Red.",
                          )
                        ) return
                        void conFallo(g.id, () => borrar(g.id))
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

// ═══════════════════════════════════════════════════════════════════════════
//  UNA FILA
// ═══════════════════════════════════════════════════════════════════════════

function Fila({
  g, ocupada, onEditar, onPublicar, onFijar, onBorrar,
}: {
  g: GrabacionAdmin
  ocupada: boolean
  onEditar: () => void
  onPublicar: () => void
  onFijar: () => void
  onBorrar: () => void
}) {
  const publicada = g.estado === "publicado"
  const fijada = g.sort_order > 0

  return (
    <div className="flex items-start gap-3 border border-[#251f30] bg-[#0d0d1a] p-3" style={{ borderRadius: 12 }}>
      <div className="relative h-[54px] w-[96px] shrink-0 overflow-hidden rounded bg-[#05050d]">
        {g.miniatura ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={g.miniatura} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="grid h-full w-full place-items-center text-[#3f3f55]">
            <ImageOff size={16} aria-hidden />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[13px] font-semibold text-[#F3F6FA] [font-family:var(--font-geist-sans)]">
            {g.titulo}
          </p>
          <span
            className={
              "shrink-0 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] [font-family:var(--font-mono)] " +
              (publicada
                ? "border border-emerald-800/60 bg-emerald-950/40 text-emerald-400"
                : "border border-[#6D4A9B]/50 bg-[#6D4A9B]/12 text-[#c3b2e0]")
            }
          >
            {publicada ? "Publicada" : "Borrador"}
          </span>
          {fijada && (
            <span className="shrink-0 text-[9px] uppercase tracking-[0.14em] text-[#e6cf95] [font-family:var(--font-mono)]">
              Fijada
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-[#8b90b4] [font-family:var(--font-mono)]">
          {g.fecha}
          {!g.miniatura && " · sin previsualización"}
        </p>
        {g.descripcion && (
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#6a6a7a]">
            {g.descripcion}
          </p>
        )}

        {/* ── LAS ACCIONES, CON SU NOMBRE ESCRITO ────────────────────────
            Esto eran cuatro iconos grises de trece píxeles, sin una palabra.
            El resultado previsible: «solo me permite subir nuevas
            grabaciones, no editar las anteriores». El botón estaba ahí; lo
            que no estaba era ninguna forma de saber que era un botón.

            Un icono vale cuando la acción se usa a diario y se reconoce de
            memoria. Estas se usan una vez por reunión. */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {ocupada && <Loader2 size={13} className="animate-spin text-[#8b90b4]" aria-hidden />}
          <Accion onClick={onEditar} disabled={ocupada} icono={<Pencil size={12} />}>
            Editar
          </Accion>
          <Accion onClick={onPublicar} disabled={ocupada}
            icono={publicada ? <EyeOff size={12} /> : <Eye size={12} />}>
            {publicada ? "Pasar a borrador" : "Publicar"}
          </Accion>
          <Accion onClick={onFijar} disabled={ocupada}
            icono={fijada ? <PinOff size={12} /> : <Pin size={12} />}>
            {fijada ? "Quitar de arriba" : "Fijar arriba"}
          </Accion>
          <Accion onClick={onBorrar} disabled={ocupada} peligro icono={<Trash2 size={12} />}>
            Quitar
          </Accion>
        </div>
      </div>
    </div>
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
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-[10px] " +
        "uppercase tracking-[0.12em] transition-colors disabled:opacity-40 " +
        "[font-family:var(--font-mono)] " +
        (peligro
          ? "border-[#8a5a5a]/40 text-[#a87a7a] hover:border-[#8a5a5a] hover:bg-[#7f1d1d]/20 hover:text-[#fca5a5]"
          : "border-[#2f2f42] text-[#a0a0b0] hover:border-[#6D4A9B] hover:text-[#F3F6FA]")
      }
    >
      {icono}
      {children}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  EL FORMULARIO
// ═══════════════════════════════════════════════════════════════════════════

type Datos = { titulo: string; descripcion: string; embed: string; fecha?: string }

function Formulario({
  inicial, guardando, onGuardar, onCancelar,
}: {
  inicial?: GrabacionAdmin
  guardando: boolean
  onGuardar: (d: Datos) => void | Promise<void>
  onCancelar: () => void
}) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? "")
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? "")
  const [fecha, setFecha] = useState(inicial?.fecha ?? hoy())
  const [embed, setEmbed] = useState(inicial?.embed ?? "")

  // Se interpreta mientras se escribe. `leerVturb` es una función pura: el
  // navegador puede usar la MISMA que el servidor, así que lo que se ve aquí
  // es exactamente lo que se va a guardar.
  const lectura = useMemo(() => (embed.trim() ? leerVturb(embed) : null), [embed])
  const [miniaturaFalla, setMiniaturaFalla] = useState(false)

  const puedeGuardar =
    !!titulo.trim() && !guardando && (inicial ? true : !!lectura?.ok)

  return (
    <form
      className="mb-5 flex flex-col gap-4 border border-[#6D4A9B]/35 bg-[#0d0d1a] p-4"
      style={{ borderRadius: 12 }}
      onSubmit={(e) => {
        e.preventDefault()
        if (!puedeGuardar) return
        void onGuardar({
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          embed: embed.trim(),
          fecha,
        })
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <Rotulo>Título</Rotulo>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Encuentro de la Red — noviembre"
            maxLength={160}
            className={CAMPO}
          />
        </div>
        <div>
          <Rotulo>Fecha del encuentro</Rotulo>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={CAMPO}
          />
        </div>
      </div>

      <div>
        <Rotulo>Descripción · opcional</Rotulo>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="De qué se habló. Aparece debajo del título."
          className={CAMPO + " resize-y"}
        />
      </div>

      <div>
        <Rotulo>Código de VTurb</Rotulo>
        <textarea
          value={embed}
          onChange={(e) => { setEmbed(e.target.value); setMiniaturaFalla(false) }}
          rows={4}
          placeholder="Pega aquí el código del icono </> de VTurb"
          spellCheck={false}
          className={CAMPO + " resize-y font-mono text-[11px] leading-relaxed"}
        />
        <p className="mt-1.5 text-[10px] leading-relaxed text-[#6a6a7a]">
          En VTurb, sobre el vídeo, el icono <code>&lt;/&gt;</code>. No la
          dirección de la página: el código entero.
        </p>
      </div>

      {/* ── LO QUE SE DETECTÓ ─────────────────────────────────────────── */}
      {lectura && !lectura.ok && (
        <p className="flex items-start gap-2 border border-[#8a5a5a]/40 bg-[#7f1d1d]/14 px-3 py-2 text-[11px] leading-relaxed text-[#fca5a5]">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden />
          {lectura.motivo}
        </p>
      )}

      {lectura?.ok && (
        <div className="flex items-start gap-3 border border-[#251f30] bg-[#07070f] p-3" style={{ borderRadius: 10 }}>
          <div className="relative h-[72px] w-[128px] shrink-0 overflow-hidden rounded bg-[#05050d]">
            {!miniaturaFalla ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lectura.grabacion.miniatura}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setMiniaturaFalla(true)}
              />
            ) : (
              <span className="grid h-full w-full place-items-center text-[#3f3f55]">
                <ImageOff size={18} aria-hidden />
              </span>
            )}
          </div>
          <div className="min-w-0 text-[11px] leading-relaxed [font-family:var(--font-geist-sans)]">
            <p className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <Check size={13} aria-hidden /> Reproductor detectado
            </p>
            {miniaturaFalla ? (
              <p className="mt-1 text-[#e0b06a]">
                No encontré la previsualización de este vídeo. Se puede guardar
                igual: la tarjeta saldrá sin imagen, con el título.
              </p>
            ) : (
              <p className="mt-1 text-[#8b90b4]">
                Esta imagen es la que verá la Red.{" "}
                <strong className="text-[#c3c6d8]">
                  Comprueba que es el vídeo que querías
                </strong>{" "}
                antes de guardar.
              </p>
            )}
            <p className="mt-1 truncate text-[10px] text-[#4a4a5a] [font-family:var(--font-mono)]">
              {lectura.grabacion.playerId}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!puedeGuardar}
          className="inline-flex items-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/18 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c3b2e0] transition-colors hover:bg-[#6D4A9B]/32 disabled:opacity-40 [font-family:var(--font-mono)]"
          style={{ borderRadius: 8 }}
        >
          {guardando && <Loader2 size={13} className="animate-spin" aria-hidden />}
          {inicial ? "Guardar cambios" : "Guardar en borrador"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] text-[#8b90b4] transition-colors hover:text-[#F3F6FA] [font-family:var(--font-mono)]"
        >
          Cancelar
        </button>
        {!inicial && (
          <span className="text-[10px] leading-snug text-[#6a6a7a]">
            Nace en borrador. Se publica con el ojo, cuando ya la has mirado.
          </span>
        )}
      </div>
    </form>
  )
}

const CAMPO =
  "w-full border border-[#2f2f42] bg-[#0a0a14] px-3 py-2.5 text-[13px] text-[#F3F6FA] " +
  "placeholder:text-[#4a4a5a] focus:border-[#6D4A9B] focus:outline-none [font-family:var(--font-geist-sans)]"

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">
      {children}
    </label>
  )
}

/** Hoy en formato de base, en el huso de quien mira. */
function hoy(): string {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, "0")
  const dia = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${mes}-${dia}`
}
