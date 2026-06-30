"use client"

// Modal de gestão de episódios — abre a partir do SeasonsManagerModal
// (botão "Episodios" em cada season row). Admin pode:
//   - Listar episódios da temporada
//   - Adicionar/remover episódio
//   - Editar título, descrição, URL do vídeo
//   - Gerenciar blocos de texto (acima/abaixo do vídeo) — abre BlocksEditor
//
// Visualização do membro fica em outro componente (EpisodesDrawer refatorado).

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, Check, Image as ImageIcon, Loader2, MoveDown, MoveUp, Plus, Save, Trash2, Upload, X } from "lucide-react"
import { useEpisodes, type DbEpisode } from "../_lib/use-episodes"
import { type ManagedSeason } from "../_lib/use-seasons"
import { BlocksEditor } from "./BlocksEditor"
import { uploadMedia } from "../_lib/media-upload"

type Props = {
  open: boolean
  season: ManagedSeason | null
  onClose: () => void
}

export function EpisodesManagerModal({ open, season, onClose }: Props) {
  const seasonId = season?.id ?? null
  const { episodes, loading, createEpisode, updateEpisode, deleteEpisode } = useEpisodes(seasonId)
  const [editingEpisode, setEditingEpisode] = useState<DbEpisode | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const o = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = o
    }
  }, [open])

  if (!open || !season) return null

  async function handleCreate(payload: { num: number; title: string }) {
    setErr(null)
    try {
      await createEpisode({ ...payload, sort_order: payload.num })
      setAddOpen(false)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao criar")
    }
  }

  async function handleDelete(ep: DbEpisode) {
    if (!confirm(`Remover episódio "${ep.title}"?`)) return
    setBusy(ep.id)
    setErr(null)
    try {
      await deleteEpisode(ep.id)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao remover")
    } finally {
      setBusy(null)
    }
  }

  // Mover episódio ↑ ou ↓: troca sort_order com o vizinho (idêntico ao BlocksEditor)
  async function handleMove(ep: DbEpisode, direction: "up" | "down") {
    const idx = episodes.findIndex((e) => e.id === ep.id)
    const swapWith = direction === "up" ? episodes[idx - 1] : episodes[idx + 1]
    if (!swapWith) return
    setBusy(ep.id)
    setErr(null)
    try {
      await Promise.all([
        updateEpisode(ep.id, { sort_order: swapWith.sort_order }),
        updateEpisode(swapWith.id, { sort_order: ep.sort_order }),
      ])
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao mover")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-[#050510]/85 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relative flex max-h-[90vh] w-[min(1100px,94vw)] flex-col overflow-hidden border border-[#251f30] bg-[#0a0a18] shadow-[0_30px_80px_-10px_rgba(0,0,0,0.85)]"
        style={{ borderRadius: 18 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#251f30] px-6 py-4">
          <div className="flex items-center gap-3">
            {editingEpisode && (
              <button
                type="button"
                onClick={() => setEditingEpisode(null)}
                className="rounded p-2 text-[#a8a8c0] transition-colors hover:bg-[#251f30] hover:text-[#F3F6FA]"
                aria-label="Voltar"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="font-bold text-[#F3F6FA] text-lg [font-family:var(--font-cinzel)]">
                {editingEpisode ? `Edit · ${editingEpisode.title}` : season.name}
              </h2>
              <p className="text-xs text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
                {editingEpisode
                  ? "Editar episodio + bloques de texto"
                  : `${episodes.length} episodio${episodes.length === 1 ? "" : "s"} · solo admin`}
              </p>
            </div>
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
          {err && (
            <div
              className="mb-4 border border-[#6D4A9B]/60 bg-[#6D4A9B]/10 px-4 py-3 text-sm text-[#a78bca] [font-family:var(--font-geist-sans)]"
              style={{ borderRadius: 8 }}
            >
              {err}
            </div>
          )}

          {/* Editando UM episódio */}
          {editingEpisode && (
            <EpisodeEditor
              episode={editingEpisode}
              onChange={async (patch) => {
                try {
                  await updateEpisode(editingEpisode.id, patch)
                  setEditingEpisode({ ...editingEpisode, ...patch })
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Erro")
                }
              }}
            />
          )}

          {/* Lista de episódios */}
          {!editingEpisode && (
            <>
              {loading && (
                <p className="text-center text-sm text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
                  Cargando episodios...
                </p>
              )}
              {!loading && episodes.length === 0 && (
                <p className="text-center text-sm text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
                  No hay episodios todavía.
                </p>
              )}
              <ul className="space-y-2">
                {episodes.map((ep, idx) => (
                  <li
                    key={ep.id}
                    className="flex items-center gap-3 border border-[#251f30] bg-[#14142a]/50 p-3"
                    style={{ borderRadius: 12 }}
                  >
                    {/* Setas mover */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0 || busy === ep.id}
                        onClick={() => handleMove(ep, "up")}
                        className="flex h-5 w-6 items-center justify-center border border-[#251f30] text-[#a8a8c0] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/20 hover:text-[#F3F6FA] disabled:opacity-30 disabled:hover:bg-transparent"
                        style={{ borderRadius: 4 }}
                        title="Mover arriba"
                      >
                        <MoveUp size={10} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === episodes.length - 1 || busy === ep.id}
                        onClick={() => handleMove(ep, "down")}
                        className="flex h-5 w-6 items-center justify-center border border-[#251f30] text-[#a8a8c0] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/20 hover:text-[#F3F6FA] disabled:opacity-30 disabled:hover:bg-transparent"
                        style={{ borderRadius: 4 }}
                        title="Mover abajo"
                      >
                        <MoveDown size={10} />
                      </button>
                    </div>

                    <div
                      className="relative flex h-12 w-20 flex-shrink-0 items-center justify-center overflow-hidden bg-[#6D4A9B]/20 text-base font-bold text-[#a78bca] [font-family:var(--font-mono)]"
                      style={{ borderRadius: 8 }}
                    >
                      {ep.thumb_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ep.thumb_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        String(ep.num).padStart(2, "0")
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold text-[#F3F6FA] truncate [font-family:var(--font-cinzel)]">
                        {ep.title}
                      </div>
                      {ep.description && (
                        <div className="text-xs text-[#a8a8c0] truncate [font-family:var(--font-geist-sans)]">
                          {ep.description}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingEpisode(ep)}
                      className="border border-[#6D4A9B]/50 bg-[#6D4A9B]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#a78bca] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/25 [font-family:var(--font-mono)]"
                      style={{ borderRadius: 8 }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={busy === ep.id}
                      onClick={() => handleDelete(ep)}
                      className="flex items-center justify-center border border-[#251f30] p-2 text-[#a8a8c0] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/20 hover:text-[#F3F6FA] disabled:opacity-50"
                      style={{ borderRadius: 8 }}
                      title="Remover"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>

              {/* Add form */}
              {addOpen ? (
                <AddEpisodeForm
                  nextNum={episodes.length > 0 ? Math.max(...episodes.map((e) => e.num)) + 1 : 1}
                  onCancel={() => setAddOpen(false)}
                  onCreate={handleCreate}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="mt-4 flex w-full items-center justify-center gap-2 border border-dashed border-[#6D4A9B]/60 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#a78bca] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/10 [font-family:var(--font-mono)]"
                  style={{ borderRadius: 10 }}
                >
                  <Plus size={14} /> Adicionar episodio
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Editor de UM episódio ────────────────────────────────────────────

function EpisodeEditor({
  episode,
  onChange,
}: {
  episode: DbEpisode
  onChange: (patch: Partial<DbEpisode>) => Promise<void>
}) {
  const [title, setTitle] = useState(episode.title)
  const [description, setDescription] = useState(episode.description ?? "")
  const [videoUrl, setVideoUrl] = useState(episode.video_url ?? "")
  const [thumbUrl, setThumbUrl] = useState(episode.thumb_url ?? "")
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [thumbErr, setThumbErr] = useState<string | null>(null)
  const thumbFileRef = useRef<HTMLInputElement>(null)

  // Track dirty state — compara o que está no form vs último salvo
  const isDirty = useMemo(
    () =>
      title !== episode.title ||
      description !== (episode.description ?? "") ||
      videoUrl !== (episode.video_url ?? ""),
    [title, description, videoUrl, episode],
  )

  async function handleSave() {
    if (!isDirty || saving) return
    setSaving(true)
    try {
      await onChange({
        title: title.trim() || episode.title,
        description: description || null,
        video_url: videoUrl || null,
      })
      setSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }

  // Atalho Ctrl+S salva também
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, saving, title, description, videoUrl])

  async function handleThumbUpload(file: File) {
    setUploadingThumb(true)
    setThumbErr(null)
    try {
      const { url } = await uploadMedia(file, "seasons") // mesmo kind pra simplicidade (vai pra /seasons/)
      setThumbUrl(url)
      await onChange({ thumb_url: url })
    } catch (e) {
      setThumbErr(e instanceof Error ? e.message : "Erro no upload")
    } finally {
      setUploadingThumb(false)
    }
  }

  async function handleThumbRemove() {
    if (!confirm("Remover miniatura?")) return
    setThumbErr(null)
    try {
      setThumbUrl("")
      await onChange({ thumb_url: null })
    } catch (e) {
      setThumbErr(e instanceof Error ? e.message : "Erro ao remover")
    }
  }

  return (
    <div className="space-y-5">
      {/* Miniatura do episódio */}
      <div>
        <label className="block mb-2 text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">
          Miniatura del episodio
        </label>
        <div className="flex items-center gap-3">
          {/* Preview */}
          <div
            className="flex h-20 w-32 flex-shrink-0 items-center justify-center overflow-hidden border border-[#251f30] bg-[#050510]"
            style={{ borderRadius: 8 }}
          >
            {thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbUrl} alt="Miniatura" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon size={28} className="text-[#6a6a85]" />
            )}
          </div>
          {/* Ações */}
          <div className="flex flex-col gap-2">
            <input
              ref={thumbFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleThumbUpload(f)
                e.target.value = ""
              }}
            />
            <button
              type="button"
              disabled={uploadingThumb}
              onClick={() => thumbFileRef.current?.click()}
              className="flex items-center gap-2 border border-[#6D4A9B]/50 bg-[#6D4A9B]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a78bca] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/25 disabled:cursor-wait disabled:opacity-50 [font-family:var(--font-mono)]"
              style={{ borderRadius: 8 }}
              title="Subir imagen (será convertida a WebP)"
            >
              {uploadingThumb ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {thumbUrl ? "Cambiar" : "Subir"} miniatura
            </button>
            {thumbUrl && (
              <button
                type="button"
                onClick={handleThumbRemove}
                className="flex items-center gap-2 border border-[#251f30] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a8a8c0] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/20 hover:text-[#F3F6FA] [font-family:var(--font-mono)]"
                style={{ borderRadius: 8 }}
              >
                <Trash2 size={14} />
                Remover
              </button>
            )}
          </div>
        </div>
        {thumbErr && (
          <p className="mt-2 text-xs text-[#a78bca] [font-family:var(--font-geist-sans)]">
            {thumbErr}
          </p>
        )}
        <p className="mt-2 text-[10px] text-[#6a6a85] [font-family:var(--font-mono)]">
          Recomendado: 16:9 (1280×720+). Será convertida a WebP automáticamente.
        </p>
      </div>

      <div>
        <label className="block mb-1 text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">
          Título
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-[#251f30] bg-[#050510] px-3 py-2 text-base text-[#F3F6FA] outline-none focus:border-[#6D4A9B]"
          style={{ borderRadius: 6 }}
        />
      </div>
      <div>
        <label className="block mb-1 text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">
          Descripción corta
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Aparece debajo del título en la lista"
          className="w-full border border-[#251f30] bg-[#050510] px-3 py-2 text-sm text-[#F3F6FA] outline-none focus:border-[#6D4A9B] placeholder:text-[#6a6a85]"
          style={{ borderRadius: 6 }}
        />
      </div>
      <div>
        <label className="block mb-1 text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">
          URL del video (.mp4, embed, Stream, etc)
        </label>
        <input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://..."
          className="w-full border border-[#251f30] bg-[#050510] px-3 py-2 text-sm text-[#F3F6FA] outline-none focus:border-[#6D4A9B] placeholder:text-[#6a6a85] [font-family:var(--font-mono)]"
          style={{ borderRadius: 6 }}
        />
      </div>

      {/* Barra sticky de Salvar — só aparece quando há mudanças pendentes
          ou logo após salvar com sucesso (feedback). */}
      <div
        className="sticky bottom-0 z-10 -mx-6 flex items-center justify-end gap-3 border-t border-[#251f30] bg-[#0a0a18]/95 px-6 py-3 backdrop-blur-sm"
        style={{ marginLeft: "-1.5rem", marginRight: "-1.5rem" }}
      >
        {isDirty && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#a78bca] [font-family:var(--font-mono)]">
            Cambios sin guardar
          </span>
        )}
        {!isDirty && savedAt && Date.now() - savedAt < 4000 && (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-[#6D4A9B] [font-family:var(--font-mono)]">
            <Check size={12} /> Guardado
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="flex items-center gap-2 bg-[#6D4A9B] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#F3F6FA] transition-colors hover:bg-[#8a63b8] disabled:cursor-not-allowed disabled:opacity-40 [font-family:var(--font-mono)]"
          style={{ borderRadius: 6 }}
          title="Guardar cambios (Ctrl+S)"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Guardar
        </button>
      </div>

      {/* Bloques de texto editáveis */}
      <div className="border-t border-[#251f30] pt-5">
        <BlocksEditor episodeId={episode.id} />
      </div>
    </div>
  )
}

// ─── Form de adicionar episódio ───────────────────────────────────────

function AddEpisodeForm({
  nextNum,
  onCancel,
  onCreate,
}: {
  nextNum: number
  onCancel: () => void
  onCreate: (payload: { num: number; title: string }) => Promise<void>
}) {
  const [num, setNum] = useState(nextNum)
  const [title, setTitle] = useState(`Episodio ${nextNum}`)
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!title.trim()) return
    setSubmitting(true)
    try {
      await onCreate({ num, title: title.trim() })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="mt-4 border border-[#6D4A9B]/60 bg-[#6D4A9B]/5 p-4 space-y-3"
      style={{ borderRadius: 10 }}
    >
      <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a78bca] [font-family:var(--font-mono)]">
        Nuevo episodio
      </h3>
      <div className="grid grid-cols-[80px_1fr] gap-3">
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
          <label className="block mb-1 text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
          disabled={submitting || !title.trim()}
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
