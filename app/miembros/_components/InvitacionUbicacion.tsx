"use client"

// Invitación contextual para completar la ubicación.
//
// Los miembros que ya existían no tienen país ni ciudad, y no se les va a pedir
// que se registren otra vez. Esto aparece una sola vez, se completa en el sitio
// sin salir de la página, y se puede posponer.
//
// Se oculta solo si: ya hay ubicación, el miembro la guarda aquí, o la descarta
// (se recuerda en localStorage, que es un dato de conveniencia de este
// navegador y no información que deba viajar al servidor).

import { useEffect, useState } from "react"
import { MapPin, X } from "lucide-react"
import { UbicacionRed } from "./UbicacionRed"

const DESCARTADA = "red:ubicacion-invitacion-descartada"

const inputCls =
  "block w-full border border-[#1a1a24] bg-[#12121a]/60 px-4 py-3 text-base text-[#F3F6FA] placeholder:text-[#6a6a7a] transition-colors focus:border-[#4A3170] focus:bg-[#000000] focus:outline-none focus:ring-1 focus:ring-[#6D4A9B]/40 disabled:opacity-50 [font-family:var(--font-geist-sans)]"
const labelCls =
  "block text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a0a0b0] [font-family:var(--font-geist-sans)] mb-2"
const btnCls =
  "inline-flex items-center justify-center gap-2 border border-[#d9b866] bg-[#d9b866] px-6 py-3 text-[#0a0a12] text-xs font-semibold uppercase tracking-[0.3em] transition-colors hover:bg-[#e6cf95] disabled:cursor-wait disabled:opacity-60 [font-family:var(--font-geist-sans)]"

export function InvitacionUbicacion() {
  const [estado, setEstado] = useState<"cargando" | "oculta" | "cerrada" | "abierta" | "lista">("cargando")

  useEffect(() => {
    let vivo = true
    try {
      if (localStorage.getItem(DESCARTADA) === "1") { setEstado("oculta"); return }
    } catch { /* navegador sin storage: se muestra igual */ }

    fetch("/api/red/ubicacion", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!vivo) return
        // Ya tiene ubicación → no hay nada que pedir.
        setEstado(d?.location ? "oculta" : "cerrada")
      })
      .catch(() => { if (vivo) setEstado("oculta") })

    return () => { vivo = false }
  }, [])

  function descartar() {
    try { localStorage.setItem(DESCARTADA, "1") } catch { /* da igual */ }
    setEstado("oculta")
  }

  if (estado === "cargando" || estado === "oculta") return null

  if (estado === "lista") {
    return (
      <div className="mx-auto mb-6 flex max-w-[720px] items-center gap-3 border border-[#d9b866]/40 bg-[#d9b866]/[0.06] px-5 py-4">
        <MapPin size={16} className="shrink-0 text-[#d9b866]" />
        <p className="text-sm text-[#e6cf95] [font-family:var(--font-geist-sans)]">
          Listo. Ya formas parte del mapa de la Red.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto mb-6 max-w-[720px] border border-[#d9b866]/40 bg-[#0e0f18]">
      <div className="flex items-start gap-3 px-5 py-4">
        <MapPin size={18} className="mt-0.5 shrink-0 text-[#d9b866]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#e6cf95] [font-family:var(--font-geist-sans)]">
            Completa tu ubicación para descubrir miembros de 144 mil cerca de ti
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
            Solo país y ciudad. Tú decides si tu ciudad es visible para el resto.
          </p>

          {estado === "cerrada" && (
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setEstado("abierta")}
                className="border border-[#d9b866] bg-transparent px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d9b866] transition-colors hover:bg-[#d9b866] hover:text-[#0a0a12] [font-family:var(--font-geist-sans)]"
              >
                Completar ahora
              </button>
              <button
                type="button"
                onClick={descartar}
                className="text-[10px] uppercase tracking-[0.25em] text-[#6a6a7a] transition-colors hover:text-[#a0a0b0] [font-family:var(--font-geist-sans)]"
              >
                Ahora no
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={descartar}
          aria-label="Cerrar"
          className="shrink-0 text-[#6a6a7a] transition-colors hover:text-[#F3F6FA]"
        >
          <X size={16} />
        </button>
      </div>

      {estado === "abierta" && (
        <div className="border-t border-[#1a1a24] px-5 py-5">
          <UbicacionRed
            compact
            inputCls={inputCls}
            labelCls={labelCls}
            btnCls={btnCls}
            onSaved={() => setEstado("lista")}
          />
        </div>
      )}
    </div>
  )
}
