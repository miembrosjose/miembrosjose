"use client"

// BANDEJA DE SOLICITUDES — quién ha pedido sostener una función de la Red.
//
// Se monta dentro de la pestaña «Roles de La Red», encima del resto: si hay
// gente esperando respuesta, es lo primero que hay que atender.
//
// Aprobar concede la función por el mismo camino que el botón de conceder de
// abajo. No hay dos formas de dar un permiso.

import { useCallback, useEffect, useState } from "react"
import { Loader2, Check, X, Inbox } from "lucide-react"
import { AdminCard, AdminEmptyState, inputCls } from "./_shared"

const NOMBRE_ROL: Record<string, string> = {
  organizador: "Organizador de Encuentros",
  facilitador: "Facilitador de Círculo",
  embajador: "Embajador de 144 mil",
  colaborador: "Colaborador",
  cartografo: "Cartógrafo",
  guardian: "Guardián de Nodo",
  instructor: "Instructor de Los 144.000",
}

type Solicitud = {
  id: number
  user_id: string
  role_code: string
  mensaje: string
  estado: string
  created_at: string
  full_name: string
  username: string | null
  avatar_url: string | null
  lugar: string
}

function cuando(iso: string): string {
  return new Date(iso).toLocaleDateString("es-419", { day: "numeric", month: "long", year: "numeric" })
}

export function SolicitudesRed({ onCambio }: { onCambio?: () => void }) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [cargando, setCargando] = useState(true)
  const [decidiendo, setDecidiendo] = useState<number | null>(null)
  const [respuestas, setRespuestas] = useState<Record<number, string>>({})
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const r = await fetch("/api/admin/red/solicitudes", { credentials: "include" })
      if (!r.ok) throw new Error("bandeja")
      const d = await r.json()
      setSolicitudes(d.solicitudes || [])
    } catch {
      setSolicitudes([])
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const decidir = useCallback(
    async (s: Solicitud, decision: "aprobar" | "rechazar") => {
      setDecidiendo(s.id)
      setAviso(null)
      try {
        const r = await fetch("/api/admin/red/solicitudes", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: s.id, decision, respuesta: respuestas[s.id] || null }),
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d?.error || "No se pudo decidir")

        setSolicitudes((prev) => prev.filter((x) => x.id !== s.id))
        setAviso({
          tipo: "ok",
          texto: decision === "aprobar"
            ? `${s.full_name} ya puede ejercer como ${NOMBRE_ROL[s.role_code] ?? s.role_code}.`
            : `Se respondió a ${s.full_name}. Puede volver a pedirlo más adelante.`,
        })
        onCambio?.()
      } catch (e) {
        setAviso({ tipo: "error", texto: e instanceof Error ? e.message : "Error" })
      } finally {
        setDecidiendo(null)
      }
    },
    [respuestas, onCambio],
  )

  // La bandeja vacía no merece ocupar espacio: si no hay nada, no se dibuja.
  if (!cargando && solicitudes.length === 0 && !aviso) return null

  return (
    <AdminCard
      title={`Solicitudes pendientes${solicitudes.length ? ` · ${solicitudes.length}` : ""}`}
      description="Miembros que han pedido sostener una función. Aprobar se la concede; rechazar no deja marca y pueden volver a pedirla."
      accent="gold"
    >
      {aviso && (
        <p
          role="status"
          className={`mb-4 border px-4 py-3 text-xs [font-family:var(--font-geist-sans)] ${
            aviso.tipo === "ok"
              ? "border-emerald-700/40 bg-emerald-950/20 text-emerald-300"
              : "border-red-900/40 bg-red-950/20 text-red-300"
          }`}
        >
          {aviso.texto}
        </p>
      )}

      {cargando ? (
        <p className="flex items-center gap-2 text-xs text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
          <Loader2 size={13} className="animate-spin" /> Cargando…
        </p>
      ) : solicitudes.length === 0 ? (
        <AdminEmptyState icon={<Inbox size={22} />} title="Nada pendiente" />
      ) : (
        <div className="flex flex-col gap-3">
          {solicitudes.map((s) => (
            <div key={s.id} className="border border-[#1a1a24] bg-[#0f0f17]/60 p-4">
              <div className="flex items-center gap-3">
                {s.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#2a2a36] text-xs text-[#8b90b4]">
                    {s.full_name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#F3F6FA] [font-family:var(--font-geist-sans)]">
                    {s.full_name}
                  </p>
                  <p className="truncate text-xs text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
                    {s.username ? `@${s.username} · ` : ""}{s.lugar}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
                  {cuando(s.created_at)}
                </span>
              </div>

              <p className="mt-3 text-sm text-[#c4a8ff] [font-family:var(--font-geist-sans)]">
                Pide: <strong>{NOMBRE_ROL[s.role_code] ?? s.role_code}</strong>
              </p>

              {s.mensaje && (
                <p className="mt-2 whitespace-pre-wrap border-l-2 border-[#2a2a36] pl-3 text-sm leading-relaxed text-[#8b90b4] [font-family:var(--font-geist-sans)]">
                  {s.mensaje}
                </p>
              )}

              <input
                type="text"
                value={respuestas[s.id] || ""}
                onChange={(e) => setRespuestas((p) => ({ ...p, [s.id]: e.target.value }))}
                placeholder="Respuesta (opcional) — la leerá quien solicitó"
                className={`${inputCls} mt-3`}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={decidiendo === s.id}
                  onClick={() => decidir(s, "aprobar")}
                  className="inline-flex items-center gap-1.5 border border-emerald-700/60 bg-emerald-950/20 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300 transition-colors hover:bg-emerald-900/30 disabled:cursor-wait disabled:opacity-60 [font-family:var(--font-geist-sans)]"
                >
                  {decidiendo === s.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                  Aprobar
                </button>
                <button
                  type="button"
                  disabled={decidiendo === s.id}
                  onClick={() => decidir(s, "rechazar")}
                  className="inline-flex items-center gap-1.5 border border-[#2a2a36] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b90b4] transition-colors hover:border-red-900 hover:text-red-300 disabled:cursor-wait disabled:opacity-60 [font-family:var(--font-geist-sans)]"
                >
                  <X size={11} />
                  Ahora no
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminCard>
  )
}
