"use client"

// Editor de blocos de texto livres de um episodio.
// Posições: acima do vídeo / abaixo do vídeo. Ordem livre dentro de cada
// posição. Cada bloco é um <textarea> editável; salva no blur (debounce).
// Botões: adicionar bloco em cada zona, mover up/down, deletar.

import { useEffect, useState } from "react"
import { Check, Loader2, MoveDown, MoveUp, Plus, Save, Trash2 } from "lucide-react"
import { useEpisodeBlocks, type DbBlock, type BlockPosition } from "../_lib/use-episode-blocks"
import { RichTextEditor } from "./RichTextEditor"

type Props = {
  episodeId: string
}

export function BlocksEditor({ episodeId }: Props) {
  const { aboveVideo, belowVideo, createBlock, updateBlock, deleteBlock, loading } = useEpisodeBlocks(episodeId)
  const [err, setErr] = useState<string | null>(null)

  async function handleAdd(position: BlockPosition) {
    setErr(null)
    try {
      const list = position === "above_video" ? aboveVideo : belowVideo
      const next = list.length > 0 ? Math.max(...list.map((b) => b.sort_order)) + 10 : 10
      await createBlock(position, "", next)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao adicionar")
    }
  }

  async function handleMove(block: DbBlock, direction: "up" | "down") {
    setErr(null)
    const list = block.position === "above_video" ? aboveVideo : belowVideo
    const idx = list.findIndex((b) => b.id === block.id)
    const swapWith = direction === "up" ? list[idx - 1] : list[idx + 1]
    if (!swapWith) return
    try {
      await Promise.all([
        updateBlock(block.id, { sort_order: swapWith.sort_order }),
        updateBlock(swapWith.id, { sort_order: block.sort_order }),
      ])
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao mover")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este bloque?")) return
    setErr(null)
    try {
      await deleteBlock(id)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao remover")
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a78bca] [font-family:var(--font-mono)]">
        Bloques de texto
      </div>

      {err && (
        <div
          className="border border-[#6D4A9B]/60 bg-[#6D4A9B]/10 px-4 py-3 text-sm text-[#a78bca] [font-family:var(--font-geist-sans)]"
          style={{ borderRadius: 8 }}
        >
          {err}
        </div>
      )}

      {loading && (
        <p className="text-center text-xs text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
          Cargando bloques...
        </p>
      )}

      {/* ZONA ACIMA DO VÍDEO */}
      <BlocksZone
        label="Arriba del video"
        position="above_video"
        blocks={aboveVideo}
        onAdd={() => handleAdd("above_video")}
        onSave={(id, content) => updateBlock(id, { content })}
        onMoveUp={(b) => handleMove(b, "up")}
        onMoveDown={(b) => handleMove(b, "down")}
        onDelete={handleDelete}
      />

      {/* Placeholder do vídeo (referência visual) */}
      <div
        className="border border-[#6D4A9B]/40 bg-[#6D4A9B]/5 p-3 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a78bca] [font-family:var(--font-mono)]"
        style={{ borderRadius: 8 }}
      >
        ▶ Video (definido arriba)
      </div>

      {/* ZONA ABAIXO DO VÍDEO */}
      <BlocksZone
        label="Debajo del video"
        position="below_video"
        blocks={belowVideo}
        onAdd={() => handleAdd("below_video")}
        onSave={(id, content) => updateBlock(id, { content })}
        onMoveUp={(b) => handleMove(b, "up")}
        onMoveDown={(b) => handleMove(b, "down")}
        onDelete={handleDelete}
      />
    </div>
  )
}

function BlocksZone({
  label,
  blocks,
  onAdd,
  onSave,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  label: string
  position: BlockPosition
  blocks: DbBlock[]
  onAdd: () => void
  onSave: (id: string, content: string) => Promise<void>
  onMoveUp: (b: DbBlock) => void
  onMoveDown: (b: DbBlock) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a8a8c0] [font-family:var(--font-mono)]">
          {label}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 border border-[#6D4A9B]/50 bg-[#6D4A9B]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a78bca] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/25 [font-family:var(--font-mono)]"
          style={{ borderRadius: 6 }}
        >
          <Plus size={10} /> Bloque
        </button>
      </div>

      {blocks.length === 0 ? (
        <p className="text-[10px] italic text-[#6a6a85] [font-family:var(--font-mono)]">
          Sin bloques aquí
        </p>
      ) : (
        <ul className="space-y-2">
          {blocks.map((b, idx) => (
            <BlockRow
              key={b.id}
              block={b}
              canUp={idx > 0}
              canDown={idx < blocks.length - 1}
              onSave={(c) => onSave(b.id, c)}
              onMoveUp={() => onMoveUp(b)}
              onMoveDown={() => onMoveDown(b)}
              onDelete={() => onDelete(b.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function BlockRow({
  block,
  canUp,
  canDown,
  onSave,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  block: DbBlock
  canUp: boolean
  canDown: boolean
  onSave: (content: string) => Promise<void>
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
}) {
  const [content, setContent] = useState(block.content)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  // Quando o block vem atualizado de fora (refresh do hook), sincroniza
  // se o usuário não está com mudanças pendentes
  useEffect(() => {
    if (content === block.content) return
    // Se o conteúdo externo mudou E coincide com o que o user editou,
    // apenas resincroniza sem perder estado.
    if (block.content !== content && content === "" /* primeiro mount */) {
      setContent(block.content)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.content])

  const isDirty = content !== block.content

  async function handleSave() {
    if (!isDirty || saving) return
    setSaving(true)
    try {
      await onSave(content)
      setSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }

  return (
    <li
      className="flex items-stretch gap-2 border border-[#251f30] bg-[#14142a]/40 p-2"
      style={{
        borderRadius: 8,
        borderColor: isDirty ? "rgba(109,74,155,0.5)" : "#251f30",
      }}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Escribe el contenido del bloque..."
        />
        {/* Status + Salvar dentro do próprio bloco (visível só quando dirty) */}
        {(isDirty || (savedAt && Date.now() - savedAt < 3000)) && (
          <div className="flex items-center justify-end gap-2 px-1">
            {isDirty ? (
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#a78bca] [font-family:var(--font-mono)]">
                Cambios sin guardar
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] text-[#6D4A9B] [font-family:var(--font-mono)]">
                <Check size={10} /> Guardado
              </span>
            )}
            <button
              type="button"
              disabled={!isDirty || saving}
              onClick={handleSave}
              className="flex items-center gap-1 bg-[#6D4A9B] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#F3F6FA] transition-colors hover:bg-[#8a63b8] disabled:cursor-not-allowed disabled:opacity-40 [font-family:var(--font-mono)]"
              style={{ borderRadius: 4 }}
              title="Guardar bloque"
            >
              {saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
              Guardar
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canUp}
          className="flex h-7 w-7 items-center justify-center border border-[#251f30] text-[#a8a8c0] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/20 hover:text-[#F3F6FA] disabled:opacity-30 disabled:hover:bg-transparent"
          style={{ borderRadius: 6 }}
          title="Mover arriba"
        >
          <MoveUp size={12} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canDown}
          className="flex h-7 w-7 items-center justify-center border border-[#251f30] text-[#a8a8c0] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/20 hover:text-[#F3F6FA] disabled:opacity-30 disabled:hover:bg-transparent"
          style={{ borderRadius: 6 }}
          title="Mover abajo"
        >
          <MoveDown size={12} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-7 w-7 items-center justify-center border border-[#251f30] text-[#a8a8c0] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/20 hover:text-[#F3F6FA]"
          style={{ borderRadius: 6 }}
          title="Remover bloque"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </li>
  )
}
