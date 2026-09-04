"use client"

// Modal de gestão de temporadas — só admin abre.
// Funcionalidades:
//   - Lista todas as temporadas atuais (do banco)
//   - Botão "+ Adicionar temporada" com formulário inline
//   - Em cada card: botão "Upload mídia" (file picker) e "Remover"
//   - Imagem é convertida pra WebP antes do upload; vídeo sobe bruto.
//   - Persiste no Supabase via /api/admin/seasons.

import { useEffect, useRef, useState } from "react"
import { Upload, Trash2, Plus, X, Loader2, ListVideo, MoveUp, MoveDown, Lock, Unlock } from "lucide-react"
import { useSeasons, type ManagedSeason } from "../_lib/use-seasons"
import { uploadMedia } from "../_lib/media-upload"
import { EpisodesManagerModal } from "./EpisodesManagerModal"
import { PortalIngresoBannerManager } from "./PortalIngresoBannerManager"

type Props = {
  open: boolean
  onClose: () => void
}

export function SeasonsManagerModal({ open, onClose }: Props) {
  const { seasons, loading, refresh, createSeason, updateSeason, deleteSeason } = useSeasons()
  const [addingOpen, setAddingOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [episodesFor, setEpisodesFor] = useState<ManagedSeason | null>(null)

  // Trava scroll do body enquanto modal aberto
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  if (!open) return null

  async function handleUpload(season: ManagedSeason, file: File) {
    setBusyId(season.id)
    setErr(null)
    try {
      const { url } = await uploadMedia(file, "seasons")
      // Sobe e atualiza video_bg da temporada
      await updateSeason(season.id, { video_bg: url })
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro no upload")
    } finally {
      setBusyId(null)
    }
  }

  async function handleRemove(season: ManagedSeason) {
    if (!confirm(`Remover ${season.name}?`)) return
    setBusyId(season.id)
    setErr(null)
    try {
      await deleteSeason(season.id)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao remover")
    } finally {
      setBusyId(null)
    }
  }

  // Mover temporada ↑ ou ↓ trocando sort_order com o vizinho
  async function handleMove(season: ManagedSeason, direction: "up" | "down") {
    const idx = seasons.findIndex((s) => s.id === season.id)
    const swapWith = direction === "up" ? seasons[idx - 1] : seasons[idx + 1]
    if (!swapWith) return
    const currentOrder = (season as ManagedSeason & { sort_order?: number }).sort_order ?? season.num
    const otherOrder = (swapWith as ManagedSeason & { sort_order?: number }).sort_order ?? swapWith.num
    setBusyId(season.id)
    setErr(null)
    try {
      await Promise.all([
        updateSeason(season.id, { sort_order: otherOrder }),
        updateSeason(swapWith.id, { sort_order: currentOrder }),
      ])
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao mover")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050510]/85 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex max-h-[90vh] w-[min(900px,92vw)] flex-col overflow-hidden border border-[#251f30] bg-[#0a0a18] shadow-[0_30px_80px_-10px_rgba(0,0,0,0.85)]"
           style={{ borderRadius: 18 }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#251f30] px-6 py-4">
          <div>
            <h2 className="font-bold text-[#F3F6FA] text-lg [font-family:var(--font-cinzel)]">Gestionar Temporadas</h2>
            <p className="text-xs text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
              {seasons.length} temporada{seasons.length === 1 ? "" : "s"} · solo admin
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-[#a8a8c0] transition-colors hover:bg-[#251f30] hover:text-[#F3F6FA]"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Videos de fondo gestionables (upload): Portal de Ingreso y Objetivos */}
          <PortalIngresoBannerManager
            storeKey="portal.ingreso.video"
            title="Portal de Ingreso — Video de fondo"
            hint="Banner del “Antes del Llamado”. Loop, silenciado, con velo oscuro para legibilidad."
          />
          <PortalIngresoBannerManager
            storeKey="portal.objetivos.video"
            title="Objetivos de Los 144000 — Video de fondo"
            hint="Banner del portal de misión “Objetivos de Los 144000”. Loop, silenciado, con velo oscuro."
          />

          {err && (
            <div className="mb-4 border border-[#6D4A9B]/60 bg-[#6D4A9B]/10 px-4 py-3 text-sm text-[#a78bca] [font-family:var(--font-geist-sans)]"
                 style={{ borderRadius: 8 }}>
              {err}
            </div>
          )}

          {loading && (
            <p className="text-center text-sm text-[#a8a8c0] [font-family:var(--font-geist-sans)]">Cargando temporadas...</p>
          )}

          {!loading && seasons.length === 0 && (
            <p className="text-center text-sm text-[#a8a8c0] [font-family:var(--font-geist-sans)]">No hay temporadas todavía.</p>
          )}

          {/* Lista */}
          <ul className="space-y-3">
            {seasons.map((s, idx) => (
              <SeasonRow
                key={s.id}
                season={s}
                busy={busyId === s.id}
                canUp={idx > 0}
                canDown={idx < seasons.length - 1}
                onMoveUp={() => handleMove(s, "up")}
                onMoveDown={() => handleMove(s, "down")}
                onUpload={(file) => handleUpload(s, file)}
                onRemove={() => handleRemove(s)}
                onRename={(name) => updateSeason(s.id, { name })}
                onToggleLocked={(locked, checkoutUrl) =>
                  updateSeason(s.id, {
                    is_locked: locked,
                    checkout_url: locked ? checkoutUrl : null,
                  })
                }
                onOpenEpisodes={() => setEpisodesFor(s)}
              />
            ))}
          </ul>

          {/* Add form */}
          {addingOpen ? (
            <AddSeasonForm
              nextNum={seasons.length > 0 ? Math.max(...seasons.map((s) => s.num)) + 1 : 1}
              onCancel={() => setAddingOpen(false)}
              onCreate={async (payload) => {
                try {
                  await createSeason(payload)
                  setAddingOpen(false)
                  setErr(null)
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Erro ao criar")
                }
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAddingOpen(true)}
              className="mt-5 flex w-full items-center justify-center gap-2 border border-dashed border-[#6D4A9B]/60 px-4 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#a78bca] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/10 [font-family:var(--font-mono)]"
              style={{ borderRadius: 10 }}
            >
              <Plus size={16} /> Adicionar temporada
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[#251f30] px-6 py-3">
          <button
            type="button"
            onClick={() => {
              refresh()
            }}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a8a8c0] transition-colors hover:text-[#F3F6FA] [font-family:var(--font-mono)]"
          >
            Recargar
          </button>
        </div>
      </div>

      {/* Sub-modal de gestão de episódios da temporada selecionada */}
      <EpisodesManagerModal
        open={!!episodesFor}
        season={episodesFor}
        onClose={() => setEpisodesFor(null)}
      />
    </div>
  )
}

// ─── Row de uma temporada (preview + ações) ────────────────────────────

function SeasonRow({
  season,
  busy,
  canUp,
  canDown,
  onMoveUp,
  onMoveDown,
  onUpload,
  onRemove,
  onRename,
  onToggleLocked,
  onOpenEpisodes,
}: {
  season: ManagedSeason
  busy: boolean
  canUp: boolean
  canDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onUpload: (file: File) => void
  onRemove: () => void
  onRename: (name: string) => void
  onToggleLocked: (locked: boolean, checkoutUrl: string) => Promise<void> | void
  onOpenEpisodes: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(season.name)
  const [editingLock, setEditingLock] = useState(false)
  const [lockUrl, setLockUrl] = useState(season.checkout_url ?? "")
  const isLocked = !!season.is_locked
  const [editing, setEditing] = useState(false)

  function commit() {
    const trimmed = name.trim()
    if (trimmed && trimmed !== season.name) {
      onRename(trimmed)
    } else {
      setName(season.name)
    }
    setEditing(false)
  }

  return (
    <li className="flex flex-wrap items-center gap-4 border border-[#251f30] bg-[#14142a]/50 p-3"
        style={{ borderRadius: 12 }}>
      {/* Setas mover */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        <button
          type="button"
          disabled={!canUp || busy}
          onClick={onMoveUp}
          className="flex h-6 w-6 items-center justify-center border border-[#251f30] text-[#a8a8c0] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/20 hover:text-[#F3F6FA] disabled:opacity-30 disabled:hover:bg-transparent"
          style={{ borderRadius: 4 }}
          title="Mover arriba"
        >
          <MoveUp size={12} />
        </button>
        <button
          type="button"
          disabled={!canDown || busy}
          onClick={onMoveDown}
          className="flex h-6 w-6 items-center justify-center border border-[#251f30] text-[#a8a8c0] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/20 hover:text-[#F3F6FA] disabled:opacity-30 disabled:hover:bg-transparent"
          style={{ borderRadius: 4 }}
          title="Mover abajo"
        >
          <MoveDown size={12} />
        </button>
      </div>

      {/* Preview */}
      <div
        className="flex h-20 w-32 flex-shrink-0 items-center justify-center overflow-hidden bg-[#050510]"
        style={{ borderRadius: 8 }}
      >
        {season.videoBg ? (
          <video src={season.videoBg} className="h-full w-full object-cover" muted playsInline />
        ) : (
          <span className="text-3xl opacity-50">{season.emoji}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a78bca] [font-family:var(--font-mono)]">
          T{String(season.num).padStart(2, "0")} · {season.episodes} eps
        </div>
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit()
              if (e.key === "Escape") {
                setName(season.name)
                setEditing(false)
              }
            }}
            autoFocus
            className="mt-1 w-full border border-[#6D4A9B] bg-[#050510] px-2 py-1 text-base font-bold text-[#F3F6FA] outline-none [font-family:var(--font-cinzel)]"
            style={{ borderRadius: 4 }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-1 block w-full text-left text-base font-bold text-[#F3F6FA] transition-colors hover:text-[#a78bca] [font-family:var(--font-cinzel)]"
            title="Clica pra renomear"
          >
            {season.name}
          </button>
        )}
      </div>

      {/* Ações */}
      <div className="flex flex-shrink-0 items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onUpload(file)
            e.target.value = "" // reset pra permitir re-upload do mesmo arquivo
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={onOpenEpisodes}
          className="flex items-center gap-2 border border-[#6D4A9B]/50 bg-[#6D4A9B]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a78bca] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/25 disabled:cursor-wait disabled:opacity-50 [font-family:var(--font-mono)]"
          style={{ borderRadius: 8 }}
          title="Gestionar episodios"
        >
          <ListVideo size={14} />
          Episodios
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 border border-[#6D4A9B]/50 bg-[#6D4A9B]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a78bca] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/25 disabled:cursor-wait disabled:opacity-50 [font-family:var(--font-mono)]"
          style={{ borderRadius: 8 }}
          title="Upload imagem ou vídeo (banner do card)"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Banner
        </button>

        {/* Toggle Bloqueada / Liberada */}
        <button
          type="button"
          disabled={busy}
          onClick={() => setEditingLock((v) => !v)}
          className={`flex items-center gap-2 border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors disabled:cursor-wait disabled:opacity-50 [font-family:var(--font-mono)] ${
            isLocked
              ? "border-amber-500/60 bg-amber-500/10 text-amber-300 hover:border-amber-500 hover:bg-amber-500/25"
              : "border-[#6D4A9B]/50 bg-[#6D4A9B]/10 text-[#a78bca] hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/25"
          }`}
          style={{ borderRadius: 8 }}
          title={isLocked ? "Bloqueada (click para configurar)" : "Liberada (click para bloquear)"}
        >
          {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
          {isLocked ? "Bloqueada" : "Liberada"}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={onRemove}
          className="flex items-center justify-center border border-[#251f30] bg-transparent p-2 text-[#a8a8c0] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/20 hover:text-[#F3F6FA] disabled:cursor-wait disabled:opacity-50"
          style={{ borderRadius: 8 }}
          title="Remover temporada"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Painel inline de lock — só aparece quando admin clica Bloqueada/Liberada */}
      {editingLock && (
        <div
          className="basis-full mt-3 flex flex-col gap-2 border-t border-[#251f30] pt-3"
        >
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs text-[#F3F6FA] [font-family:var(--font-mono)]">
              <input
                type="radio"
                name={`lock-${season.id}`}
                checked={!isLocked}
                onChange={() => onToggleLocked(false, "")}
              />
              <Unlock size={12} className="text-[#6D4A9B]" />
              Liberada para todos los miembros
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-[#F3F6FA] [font-family:var(--font-mono)]">
              <input
                type="radio"
                name={`lock-${season.id}`}
                checked={isLocked}
                onChange={async () => {
                  const url = lockUrl.trim()
                  if (!url) {
                    alert("Defina la URL del checkout antes de bloquear.")
                    return
                  }
                  await onToggleLocked(true, url)
                }}
              />
              <Lock size={12} className="text-amber-400" />
              Bloqueada (requiere checkout)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">
              URL checkout:
            </span>
            <input
              value={lockUrl}
              onChange={(e) => setLockUrl(e.target.value)}
              onBlur={async () => {
                const url = lockUrl.trim()
                if (isLocked && url && url !== (season.checkout_url ?? "")) {
                  await onToggleLocked(true, url)
                }
              }}
              placeholder="https://tu-checkout.com/temporada-X"
              className="flex-1 border border-[#251f30] bg-[#050510] px-2 py-1.5 text-xs text-[#F3F6FA] outline-none focus:border-[#6D4A9B] placeholder:text-[#6a6a85] [font-family:var(--font-mono)]"
              style={{ borderRadius: 6 }}
            />
          </div>
          {isLocked && !season.checkout_url && (
            <p className="text-[10px] text-amber-400 [font-family:var(--font-mono)]">
              ⚠ Esta temporada está marcada como bloqueada pero sin URL de checkout configurada.
            </p>
          )}
        </div>
      )}
    </li>
  )
}

// ─── Form de adicionar temporada nova ─────────────────────────────────

function AddSeasonForm({
  nextNum,
  onCreate,
  onCancel,
}: {
  nextNum: number
  onCreate: (payload: { num: number; name: string; episodes: number; sort_order: number }) => Promise<void>
  onCancel: () => void
}) {
  const [num, setNum] = useState(nextNum)
  const [name, setName] = useState(`Temporada ${nextNum}`)
  const [episodes, setEpisodes] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await onCreate({
        num,
        name: name.trim(),
        episodes,
        sort_order: num,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-5 border border-[#6D4A9B]/60 bg-[#6D4A9B]/5 p-4 space-y-3"
         style={{ borderRadius: 10 }}>
      <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a78bca] [font-family:var(--font-mono)]">Nueva temporada</h3>
      <div className="grid grid-cols-[80px_1fr_80px] gap-3">
        <div>
          <label className="block mb-1 text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">Núm</label>
          <input
            type="number"
            min={1}
            value={num}
            onChange={(e) => setNum(Number(e.target.value))}
            className="w-full border border-[#251f30] bg-[#050510] px-2 py-2 text-sm text-[#F3F6FA] outline-none focus:border-[#6D4A9B]"
            style={{ borderRadius: 6 }}
          />
        </div>
        <div>
          <label className="block mb-1 text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Temporada N"
            className="w-full border border-[#251f30] bg-[#050510] px-2 py-2 text-sm text-[#F3F6FA] outline-none focus:border-[#6D4A9B]"
            style={{ borderRadius: 6 }}
          />
        </div>
        <div>
          <label className="block mb-1 text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">Eps</label>
          <input
            type="number"
            min={0}
            value={episodes}
            onChange={(e) => setEpisodes(Number(e.target.value))}
            className="w-full border border-[#251f30] bg-[#050510] px-2 py-2 text-sm text-[#F3F6FA] outline-none focus:border-[#6D4A9B]"
            style={{ borderRadius: 6 }}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="border border-[#251f30] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a8a8c0] transition-colors hover:text-[#F3F6FA] [font-family:var(--font-mono)]"
          style={{ borderRadius: 6 }}
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={submitting || !name.trim()}
          onClick={submit}
          className="flex items-center gap-2 bg-[#6D4A9B] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#F3F6FA] transition-colors hover:bg-[#8a63b8] disabled:cursor-wait disabled:opacity-60 [font-family:var(--font-mono)]"
          style={{ borderRadius: 6 }}
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Crear
        </button>
      </div>
    </div>
  )
}
