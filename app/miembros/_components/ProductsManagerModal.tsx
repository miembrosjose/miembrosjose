"use client"

// Modal de gestão de produtos da Tienda Premium — só admin abre.
// Funcionalidades:
//   - Lista todos os produtos (do banco)
//   - "+ Adicionar produto" com formulário inline
//   - Em cada card: Upload mídia + toggle Bloqueada/Liberada com URL + Remover + Mover ↑↓
//   - Imagem convertida pra WebP no browser antes do upload; vídeo sobe bruto

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, Check, Upload, Trash2, Plus, Save, X, Loader2, MoveUp, MoveDown, Lock, Unlock, Image as ImageIcon } from "lucide-react"
import { useProducts, type DbProduct } from "../_lib/use-products"
import { useProductModules, type DbModule } from "../_lib/use-product-modules"
import { uploadMedia } from "../_lib/media-upload"
import { ProductBlocksEditor } from "./ProductBlocksEditor"

type Props = {
  open: boolean
  onClose: () => void
}

export function ProductsManagerModal({ open, onClose }: Props) {
  const { products, loading, refresh, createProduct, updateProduct, deleteProduct } = useProducts()
  const [addingOpen, setAddingOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null)
  const [editingModule, setEditingModule] = useState<DbModule | null>(null)

  useEffect(() => {
    if (!open) return
    const o = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = o }
  }, [open])

  if (!open) return null

  async function handleUpload(product: DbProduct, file: File) {
    setBusyId(product.id)
    setErr(null)
    try {
      const { url } = await uploadMedia(file, "feed")
      await updateProduct(product.id, { media_url: url })
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro no upload")
    } finally {
      setBusyId(null)
    }
  }

  async function handleRemove(product: DbProduct) {
    if (!confirm(`Remover ${product.name}?`)) return
    setBusyId(product.id)
    setErr(null)
    try {
      await deleteProduct(product.id)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao remover")
    } finally {
      setBusyId(null)
    }
  }

  async function handleMove(product: DbProduct, direction: "up" | "down") {
    const idx = products.findIndex((p) => p.id === product.id)
    const swapWith = direction === "up" ? products[idx - 1] : products[idx + 1]
    if (!swapWith) return
    setBusyId(product.id)
    setErr(null)
    try {
      await Promise.all([
        updateProduct(product.id, { sort_order: swapWith.sort_order }),
        updateProduct(swapWith.id, { sort_order: product.sort_order }),
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative flex max-h-[90vh] w-[min(900px,92vw)] flex-col overflow-hidden border border-[#251f30] bg-[#0a0a18] shadow-[0_30px_80px_-10px_rgba(0,0,0,0.85)]"
        style={{ borderRadius: 18 }}
      >
        <div className="flex items-center justify-between border-b border-[#251f30] px-6 py-4">
          <div className="flex items-center gap-3">
            {(editingProduct || editingModule) && (
              <button
                type="button"
                onClick={() => {
                  if (editingModule) setEditingModule(null)
                  else setEditingProduct(null)
                }}
                className="rounded p-2 text-[#a8a8c0] transition-colors hover:bg-[#251f30] hover:text-[#F3F6FA]"
                aria-label="Voltar"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="font-bold text-[#F3F6FA] text-lg [font-family:var(--font-cinzel)]">
                {editingModule
                  ? `Edit módulo · ${editingModule.title}`
                  : editingProduct
                  ? `Edit · ${editingProduct.name}`
                  : "Gestionar Productos"}
              </h2>
              <p className="text-xs text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
                {editingModule
                  ? "Editar módulo + video + bloques de texto"
                  : editingProduct
                  ? "Editar producto + lista de módulos"
                  : `${products.length} producto${products.length === 1 ? "" : "s"} · solo admin`}
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

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {err && (
            <div className="mb-4 flex items-start gap-3 border border-[#6D4A9B]/60 bg-[#6D4A9B]/10 px-4 py-3 text-sm text-[#a78bca] [font-family:var(--font-geist-sans)]"
                 style={{ borderRadius: 8 }}>
              <span className="flex-1">{err}</span>
              <button type="button" onClick={() => setErr(null)}
                      className="flex-shrink-0 rounded p-1 text-[#a78bca] transition-colors hover:bg-[#6D4A9B]/20 hover:text-[#F3F6FA]"
                      aria-label="Dispensar">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Editor de UM MÓDULO (3º nível) */}
          {editingModule && (
            <ModuleEditor
              mod={editingModule}
              onChange={async (patch) => {
                try {
                  // Atualiza via fetch direto (updateModule do hook precisaria
                  // do productId; aqui usamos PATCH em /modules/[id] direto).
                  const res = await fetch(`/api/admin/modules/${editingModule.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(patch),
                  })
                  if (!res.ok) {
                    const d = await res.json().catch(() => ({}))
                    throw new Error(d.error || `HTTP ${res.status}`)
                  }
                  setEditingModule({ ...editingModule, ...patch })
                  // Notifica outras instâncias (lista do ProductEditor) pra refetch
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("app:product-modules-changed"))
                  }
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Erro")
                }
              }}
            />
          )}

          {/* Editor de UM PRODUTO — lista de módulos (2º nível) */}
          {!editingModule && editingProduct && (
            <ProductEditor
              product={editingProduct}
              onChange={async (patch) => {
                try {
                  await updateProduct(editingProduct.id, patch)
                  setEditingProduct({ ...editingProduct, ...patch })
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Erro")
                }
              }}
              onEditModule={(m) => setEditingModule(m)}
            />
          )}

          {/* Lista de produtos (1º nível) */}
          {!editingProduct && !editingModule && (
            <>
              {loading && (
                <p className="text-center text-sm text-[#a8a8c0] [font-family:var(--font-geist-sans)]">Cargando productos...</p>
              )}

              {!loading && products.length === 0 && (
                <p className="text-center text-sm text-[#a8a8c0] [font-family:var(--font-geist-sans)]">No hay productos todavía.</p>
              )}

              <ul className="space-y-3">
                {products.map((p, idx) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    busy={busyId === p.id}
                    canUp={idx > 0}
                    canDown={idx < products.length - 1}
                    onMoveUp={() => handleMove(p, "up")}
                    onMoveDown={() => handleMove(p, "down")}
                    onEdit={() => setEditingProduct(p)}
                    onUpload={(file) => handleUpload(p, file)}
                    onRemove={() => handleRemove(p)}
                    onRename={(name) => updateProduct(p.id, { name })}
                    onToggleLocked={(locked, checkoutUrl) =>
                      updateProduct(p.id, {
                        is_locked: locked,
                        checkout_url: locked ? checkoutUrl : null,
                      })
                    }
                  />
                ))}
              </ul>

              {addingOpen ? (
                <AddProductForm
                  nextNum={products.length > 0 ? Math.max(...products.map((p) => p.num)) + 1 : 1}
                  onCancel={() => setAddingOpen(false)}
                  onCreate={async (payload) => {
                    try {
                      await createProduct(payload)
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
                  <Plus size={16} /> Adicionar producto
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end border-t border-[#251f30] px-6 py-3">
          <button
            type="button"
            onClick={refresh}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a8a8c0] transition-colors hover:text-[#F3F6FA] [font-family:var(--font-mono)]"
          >
            Recargar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Row de UM produto ────────────────────────────────────────────────

function ProductRow({
  product,
  busy,
  canUp,
  canDown,
  onMoveUp,
  onMoveDown,
  onEdit,
  onUpload,
  onRemove,
  onRename,
  onToggleLocked,
}: {
  product: DbProduct
  busy: boolean
  canUp: boolean
  canDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onEdit: () => void
  onUpload: (file: File) => void
  onRemove: () => void
  onRename: (name: string) => void
  onToggleLocked: (locked: boolean, checkoutUrl: string) => Promise<void> | void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(product.name)
  const [editing, setEditing] = useState(false)
  const [editingLock, setEditingLock] = useState(false)
  const [lockUrl, setLockUrl] = useState(product.checkout_url ?? "")
  const isLocked = !!product.is_locked

  function commit() {
    const trimmed = name.trim()
    if (trimmed && trimmed !== product.name) onRename(trimmed)
    else setName(product.name)
    setEditing(false)
  }

  return (
    <li
      className="flex flex-wrap items-center gap-4 border border-[#251f30] bg-[#14142a]/50 p-3"
      style={{ borderRadius: 12 }}
    >
      {/* Setas mover */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        <button
          type="button"
          disabled={!canUp || busy}
          onClick={onMoveUp}
          className="flex h-6 w-6 items-center justify-center border border-[#251f30] text-[#a8a8c0] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/20 hover:text-[#F3F6FA] disabled:opacity-30 disabled:hover:bg-transparent"
          style={{ borderRadius: 4 }} title="Mover arriba"
        >
          <MoveUp size={12} />
        </button>
        <button
          type="button"
          disabled={!canDown || busy}
          onClick={onMoveDown}
          className="flex h-6 w-6 items-center justify-center border border-[#251f30] text-[#a8a8c0] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/20 hover:text-[#F3F6FA] disabled:opacity-30 disabled:hover:bg-transparent"
          style={{ borderRadius: 4 }} title="Mover abajo"
        >
          <MoveDown size={12} />
        </button>
      </div>

      {/* Preview */}
      <div
        className="flex h-20 w-32 flex-shrink-0 items-center justify-center overflow-hidden bg-[#050510]"
        style={{ borderRadius: 8 }}
      >
        {product.media_url ? (
          /\.(mp4|webm|mov)(\?|$)/i.test(product.media_url) ? (
            <video src={product.media_url} className="h-full w-full object-cover" muted playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.media_url} alt="" className="h-full w-full object-cover" />
          )
        ) : (
          <span className="text-3xl opacity-50">{product.emoji}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a78bca] [font-family:var(--font-mono)]">
          P{String(product.num).padStart(2, "0")}
        </div>
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit()
              if (e.key === "Escape") { setName(product.name); setEditing(false) }
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
            {product.name}
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
            e.target.value = ""
          }}
        />
        <button
          type="button"
          onClick={onEdit}
          className="border border-[#6D4A9B]/50 bg-[#6D4A9B]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#a78bca] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/25 [font-family:var(--font-mono)]"
          style={{ borderRadius: 8 }}
        >
          Editar
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 border border-[#6D4A9B]/50 bg-[#6D4A9B]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a78bca] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/25 disabled:cursor-wait disabled:opacity-50 [font-family:var(--font-mono)]"
          style={{ borderRadius: 8 }} title="Upload imagem/vídeo (banner do card)"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Mídia
        </button>

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
          title={isLocked ? "Bloqueado (click para configurar)" : "Liberado"}
        >
          {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
          {isLocked ? "Bloqueado" : "Liberado"}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={onRemove}
          className="flex items-center justify-center border border-[#251f30] bg-transparent p-2 text-[#a8a8c0] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/20 hover:text-[#F3F6FA] disabled:cursor-wait disabled:opacity-50"
          style={{ borderRadius: 8 }} title="Remover producto"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Painel inline de lock */}
      {editingLock && (
        <div className="basis-full mt-3 flex flex-col gap-2 border-t border-[#251f30] pt-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs text-[#F3F6FA] [font-family:var(--font-mono)]">
              <input
                type="radio"
                name={`lock-${product.id}`}
                checked={!isLocked}
                onChange={() => onToggleLocked(false, "")}
              />
              <Unlock size={12} className="text-[#6D4A9B]" />
              Liberado para todos los miembros
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-[#F3F6FA] [font-family:var(--font-mono)]">
              <input
                type="radio"
                name={`lock-${product.id}`}
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
              Bloqueado (requiere checkout)
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
                if (isLocked && url && url !== (product.checkout_url ?? "")) {
                  await onToggleLocked(true, url)
                }
              }}
              placeholder="https://tu-checkout.com/producto-X"
              className="flex-1 border border-[#251f30] bg-[#050510] px-2 py-1.5 text-xs text-[#F3F6FA] outline-none focus:border-[#6D4A9B] placeholder:text-[#6a6a85] [font-family:var(--font-mono)]"
              style={{ borderRadius: 6 }}
            />
          </div>
          {isLocked && !product.checkout_url && (
            <p className="text-[10px] text-amber-400 [font-family:var(--font-mono)]">
              ⚠ Este producto está marcado como bloqueado pero sin URL de checkout configurada.
            </p>
          )}
        </div>
      )}
    </li>
  )
}

// ─── Form de adicionar produto novo ────────────────────────────────────

// ─── Editor de UM produto: agora mostra lista de MÓDULOS ──────────────

function ProductEditor({
  product,
  onChange,
  onEditModule,
}: {
  product: DbProduct
  onChange: (patch: Partial<DbProduct>) => Promise<void>
  onEditModule: (mod: DbModule) => void
}) {
  const { modules, createModule, updateModule, deleteModule, loading } = useProductModules(product.id)
  const [name, setName] = useState(product.name)
  const [description, setDescription] = useState(product.description ?? "")
  const [availableFrom, setAvailableFrom] = useState(product.available_from ?? "")
  const [thumbUrl, setThumbUrl] = useState(product.thumb_url ?? "")
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [addingModule, setAddingModule] = useState(false)
  const [busyModuleId, setBusyModuleId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const thumbFileRef = useRef<HTMLInputElement>(null)

  const isDirty = useMemo(
    () =>
      name !== product.name ||
      description !== (product.description ?? "") ||
      availableFrom !== (product.available_from ?? ""),
    [name, description, availableFrom, product],
  )

  async function handleSave() {
    if (!isDirty || saving) return
    setSaving(true)
    try {
      await onChange({
        name: name.trim() || product.name,
        description: description || null,
        available_from: availableFrom.trim() || null,
      })
      setSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }

  async function handleThumbUpload(file: File) {
    setUploadingThumb(true)
    try {
      const { url } = await uploadMedia(file, "feed")
      setThumbUrl(url)
      await onChange({ thumb_url: url })
    } catch (e) {
      alert(`Erro: ${e instanceof Error ? e.message : "desconhecido"}`)
    } finally {
      setUploadingThumb(false)
    }
  }

  async function handleCreateModule(payload: { num: number; title: string }) {
    setErr(null)
    try {
      await createModule({ ...payload, sort_order: payload.num })
      setAddingModule(false)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao criar módulo")
    }
  }

  async function handleDeleteModule(mod: DbModule) {
    if (!confirm(`Remover módulo "${mod.title}"?`)) return
    setBusyModuleId(mod.id)
    try { await deleteModule(mod.id) }
    catch (e) { setErr(e instanceof Error ? e.message : "Erro ao remover") }
    finally { setBusyModuleId(null) }
  }

  async function handleMoveModule(mod: DbModule, direction: "up" | "down") {
    const idx = modules.findIndex((m) => m.id === mod.id)
    const swap = direction === "up" ? modules[idx - 1] : modules[idx + 1]
    if (!swap) return
    setBusyModuleId(mod.id)
    try {
      await Promise.all([
        updateModule(mod.id, { sort_order: swap.sort_order }),
        updateModule(swap.id, { sort_order: mod.sort_order }),
      ])
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao mover")
    } finally {
      setBusyModuleId(null)
    }
  }

  return (
    <div className="space-y-5">
      {err && (
        <div className="border border-[#6D4A9B]/60 bg-[#6D4A9B]/10 px-4 py-3 text-sm text-[#a78bca]"
             style={{ borderRadius: 8 }}>{err}</div>
      )}

      {/* Info básica do produto (nome + descrição + thumb pequena pro card) */}
      <div className="space-y-3 border border-[#251f30] bg-[#0a0a18]/40 p-4" style={{ borderRadius: 10 }}>
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#a78bca] [font-family:var(--font-mono)]">
          Información del producto
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-20 w-32 flex-shrink-0 items-center justify-center overflow-hidden border border-[#251f30] bg-[#050510]"
               style={{ borderRadius: 8 }}>
            {thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon size={24} className="text-[#6a6a85]" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input ref={thumbFileRef} type="file" accept="image/*" className="hidden"
                   onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbUpload(f); e.target.value = "" }} />
            <button type="button" disabled={uploadingThumb} onClick={() => thumbFileRef.current?.click()}
                    className="flex items-center gap-2 border border-[#6D4A9B]/50 bg-[#6D4A9B]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a78bca] [font-family:var(--font-mono)]"
                    style={{ borderRadius: 6 }}>
              {uploadingThumb ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              {thumbUrl ? "Cambiar" : "Subir"} thumb
            </button>
          </div>
        </div>
        <div>
          <label className="block mb-1 text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
                 className="w-full border border-[#251f30] bg-[#050510] px-3 py-2 text-base text-[#F3F6FA] outline-none focus:border-[#6D4A9B]"
                 style={{ borderRadius: 6 }} />
        </div>
        <div>
          <label className="block mb-1 text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">Descripción</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)}
                 placeholder="Aparece debajo del título"
                 className="w-full border border-[#251f30] bg-[#050510] px-3 py-2 text-sm text-[#F3F6FA] outline-none focus:border-[#6D4A9B] placeholder:text-[#6a6a85]"
                 style={{ borderRadius: 6 }} />
        </div>
        <div>
          <label className="block mb-1 text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">Disponible a partir de</label>
          <input value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)}
                 placeholder="Ej: Diciembre 2026 (vacío = disponible ya)"
                 className="w-full border border-[#251f30] bg-[#050510] px-3 py-2 text-sm text-[#F3F6FA] outline-none focus:border-[#6D4A9B] placeholder:text-[#6a6a85]"
                 style={{ borderRadius: 6 }} />
          <p className="mt-1 text-[10px] text-[#6a6a85] [font-family:var(--font-mono)]">
            Si escribes una fecha, el producto se muestra como “Próximamente · Disponible a partir de …” y no es comprable aún.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2">
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
          <button type="button" onClick={handleSave} disabled={!isDirty || saving}
                  className="flex items-center gap-2 bg-[#6D4A9B] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#F3F6FA] disabled:cursor-not-allowed disabled:opacity-40 [font-family:var(--font-mono)]"
                  style={{ borderRadius: 6 }}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Guardar
          </button>
        </div>
      </div>

      {/* Lista de módulos */}
      <div className="space-y-3">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#a78bca] [font-family:var(--font-mono)]">
          Módulos del producto · {modules.length}
        </div>

        {loading && (
          <p className="text-center text-xs text-[#a8a8c0] [font-family:var(--font-mono)]">Cargando módulos...</p>
        )}
        {!loading && modules.length === 0 && (
          <p className="text-center text-xs text-[#a8a8c0] [font-family:var(--font-mono)]">No hay módulos todavía.</p>
        )}

        <ul className="space-y-2">
          {modules.map((m, idx) => (
            <li key={m.id} className="flex items-center gap-3 border border-[#251f30] bg-[#14142a]/50 p-3"
                style={{ borderRadius: 12 }}>
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button type="button" disabled={idx === 0 || busyModuleId === m.id}
                        onClick={() => handleMoveModule(m, "up")}
                        className="flex h-5 w-6 items-center justify-center border border-[#251f30] text-[#a8a8c0] hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/20 hover:text-[#F3F6FA] disabled:opacity-30"
                        style={{ borderRadius: 4 }} title="Mover arriba">
                  <MoveUp size={10} />
                </button>
                <button type="button" disabled={idx === modules.length - 1 || busyModuleId === m.id}
                        onClick={() => handleMoveModule(m, "down")}
                        className="flex h-5 w-6 items-center justify-center border border-[#251f30] text-[#a8a8c0] hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/20 hover:text-[#F3F6FA] disabled:opacity-30"
                        style={{ borderRadius: 4 }} title="Mover abajo">
                  <MoveDown size={10} />
                </button>
              </div>
              <div className="flex h-12 w-20 flex-shrink-0 items-center justify-center overflow-hidden bg-[#6D4A9B]/20 text-base font-bold text-[#a78bca] [font-family:var(--font-mono)]"
                   style={{ borderRadius: 8 }}>
                {m.thumb_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.thumb_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  String(m.num).padStart(2, "0")
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-[#F3F6FA] truncate [font-family:var(--font-cinzel)]">{m.title}</div>
                {m.description && (
                  <div className="text-xs text-[#a8a8c0] truncate [font-family:var(--font-geist-sans)]">{m.description}</div>
                )}
              </div>
              <button type="button" onClick={() => onEditModule(m)}
                      className="border border-[#6D4A9B]/50 bg-[#6D4A9B]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#a78bca] [font-family:var(--font-mono)]"
                      style={{ borderRadius: 8 }}>
                Editar
              </button>
              <button type="button" disabled={busyModuleId === m.id} onClick={() => handleDeleteModule(m)}
                      className="flex items-center justify-center border border-[#251f30] p-2 text-[#a8a8c0] hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/20 hover:text-[#F3F6FA] disabled:opacity-50"
                      style={{ borderRadius: 8 }} title="Remover">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>

        {addingModule ? (
          <AddModuleForm
            nextNum={modules.length > 0 ? Math.max(...modules.map((m) => m.num)) + 1 : 1}
            onCancel={() => setAddingModule(false)}
            onCreate={handleCreateModule}
          />
        ) : (
          <button type="button" onClick={() => setAddingModule(true)}
                  className="mt-2 flex w-full items-center justify-center gap-2 border border-dashed border-[#6D4A9B]/60 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#a78bca] hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/10 [font-family:var(--font-mono)]"
                  style={{ borderRadius: 10 }}>
            <Plus size={14} /> Adicionar módulo
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Editor de UM módulo (thumb + título + desc + URL vídeo + blocos) ──

function ModuleEditor({
  mod,
  onChange,
}: {
  mod: DbModule
  onChange: (patch: Partial<DbModule>) => Promise<void>
}) {
  const [title, setTitle] = useState(mod.title)
  const [description, setDescription] = useState(mod.description ?? "")
  const [videoUrl, setVideoUrl] = useState(mod.video_url ?? "")
  const [thumbUrl, setThumbUrl] = useState(mod.thumb_url ?? "")
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [thumbErr, setThumbErr] = useState<string | null>(null)
  const thumbFileRef = useRef<HTMLInputElement>(null)

  const isDirty = useMemo(
    () =>
      title !== mod.title ||
      description !== (mod.description ?? "") ||
      videoUrl !== (mod.video_url ?? ""),
    [title, description, videoUrl, mod],
  )

  async function handleSave() {
    if (!isDirty || saving) return
    setSaving(true)
    try {
      await onChange({
        title: title.trim() || mod.title,
        description: description || null,
        video_url: videoUrl || null,
      })
      setSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }

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
      const { url } = await uploadMedia(file, "feed")
      setThumbUrl(url)
      await onChange({ thumb_url: url })
    } catch (e) {
      setThumbErr(e instanceof Error ? e.message : "Erro no upload")
    } finally {
      setUploadingThumb(false)
    }
  }

  async function handleThumbRemove() {
    if (!confirm("Remover thumbnail?")) return
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
      <div>
        <label className="block mb-2 text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">
          Thumbnail del módulo
        </label>
        <div className="flex items-center gap-3">
          <div
            className="flex h-20 w-32 flex-shrink-0 items-center justify-center overflow-hidden border border-[#251f30] bg-[#050510]"
            style={{ borderRadius: 8 }}
          >
            {thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbUrl} alt="Thumb" className="h-full w-full object-cover" />
            ) : (
              <Upload size={28} className="text-[#6a6a85]" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input ref={thumbFileRef} type="file" accept="image/*" className="hidden"
                   onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbUpload(f); e.target.value = "" }} />
            <button type="button" disabled={uploadingThumb} onClick={() => thumbFileRef.current?.click()}
                    className="flex items-center gap-2 border border-[#6D4A9B]/50 bg-[#6D4A9B]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a78bca] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/25 disabled:cursor-wait disabled:opacity-50 [font-family:var(--font-mono)]"
                    style={{ borderRadius: 8 }}>
              {uploadingThumb ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {thumbUrl ? "Cambiar" : "Subir"} thumb
            </button>
            {thumbUrl && (
              <button type="button" onClick={handleThumbRemove}
                      className="flex items-center gap-2 border border-[#251f30] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a8a8c0] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/20 hover:text-[#F3F6FA] [font-family:var(--font-mono)]"
                      style={{ borderRadius: 8 }}>
                <Trash2 size={14} /> Remover
              </button>
            )}
          </div>
        </div>
        {thumbErr && (
          <p className="mt-2 text-xs text-[#a78bca] [font-family:var(--font-geist-sans)]">{thumbErr}</p>
        )}
      </div>

      <div>
        <label className="block mb-1 text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">Título del módulo</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
               className="w-full border border-[#251f30] bg-[#050510] px-3 py-2 text-base text-[#F3F6FA] outline-none focus:border-[#6D4A9B]"
               style={{ borderRadius: 6 }} />
      </div>

      <div>
        <label className="block mb-1 text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">Descripción corta</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)}
               placeholder="Aparece debajo del título en la lista"
               className="w-full border border-[#251f30] bg-[#050510] px-3 py-2 text-sm text-[#F3F6FA] outline-none focus:border-[#6D4A9B] placeholder:text-[#6a6a85]"
               style={{ borderRadius: 6 }} />
      </div>

      <div>
        <label className="block mb-1 text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">URL del video (.mp4, embed, etc)</label>
        <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
               placeholder="https://..."
               className="w-full border border-[#251f30] bg-[#050510] px-3 py-2 text-sm text-[#F3F6FA] outline-none focus:border-[#6D4A9B] placeholder:text-[#6a6a85] [font-family:var(--font-mono)]"
               style={{ borderRadius: 6 }} />
      </div>

      {/* Sticky Save bar */}
      <div className="sticky bottom-0 z-10 -mx-6 flex items-center justify-end gap-3 border-t border-[#251f30] bg-[#0a0a18]/95 px-6 py-3 backdrop-blur-sm"
           style={{ marginLeft: "-1.5rem", marginRight: "-1.5rem" }}>
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
        <button type="button" onClick={handleSave} disabled={!isDirty || saving}
                className="flex items-center gap-2 bg-[#6D4A9B] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#F3F6FA] transition-colors hover:bg-[#8a63b8] disabled:cursor-not-allowed disabled:opacity-40 [font-family:var(--font-mono)]"
                style={{ borderRadius: 6 }} title="Guardar cambios (Ctrl+S)">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Guardar
        </button>
      </div>

      {/* Bloques de texto */}
      <div className="border-t border-[#251f30] pt-5">
        <ProductBlocksEditor moduleId={mod.id} />
      </div>
    </div>
  )
}

// ─── Form de adicionar módulo novo ─────────────────────────────────────

function AddModuleForm({
  nextNum,
  onCancel,
  onCreate,
}: {
  nextNum: number
  onCancel: () => void
  onCreate: (payload: { num: number; title: string }) => Promise<void>
}) {
  const [num, setNum] = useState(nextNum)
  const [title, setTitle] = useState(`Módulo ${nextNum}`)
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!title.trim()) return
    setSubmitting(true)
    try { await onCreate({ num, title: title.trim() }) }
    finally { setSubmitting(false) }
  }

  return (
    <div className="mt-2 border border-[#6D4A9B]/60 bg-[#6D4A9B]/5 p-4 space-y-3" style={{ borderRadius: 10 }}>
      <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a78bca] [font-family:var(--font-mono)]">Nuevo módulo</h3>
      <div className="grid grid-cols-[80px_1fr] gap-3">
        <div>
          <label className="block mb-1 text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">Núm</label>
          <input type="number" min={1} value={num} onChange={(e) => setNum(Number(e.target.value))}
                 className="w-full border border-[#251f30] bg-[#050510] px-2 py-2 text-sm text-[#F3F6FA] outline-none focus:border-[#6D4A9B]"
                 style={{ borderRadius: 6 }} />
        </div>
        <div>
          <label className="block mb-1 text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">Título</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
                 className="w-full border border-[#251f30] bg-[#050510] px-2 py-2 text-sm text-[#F3F6FA] outline-none focus:border-[#6D4A9B]"
                 style={{ borderRadius: 6 }} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel}
                className="border border-[#251f30] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]"
                style={{ borderRadius: 6 }}>
          Cancelar
        </button>
        <button type="button" disabled={submitting || !title.trim()} onClick={submit}
                className="flex items-center gap-2 bg-[#6D4A9B] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#F3F6FA] disabled:opacity-60 [font-family:var(--font-mono)]"
                style={{ borderRadius: 6 }}>
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Crear
        </button>
      </div>
    </div>
  )
}

function AddProductForm({
  nextNum,
  onCreate,
  onCancel,
}: {
  nextNum: number
  onCreate: (payload: { num: number; name: string; sort_order: number; available_from: string | null }) => Promise<void>
  onCancel: () => void
}) {
  const [num, setNum] = useState(nextNum)
  const [name, setName] = useState(`Producto ${nextNum}`)
  const [availableFrom, setAvailableFrom] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await onCreate({
        num,
        name: name.trim(),
        sort_order: num,
        available_from: availableFrom.trim() || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-5 border border-[#6D4A9B]/60 bg-[#6D4A9B]/5 p-4 space-y-3" style={{ borderRadius: 10 }}>
      <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a78bca] [font-family:var(--font-mono)]">Nuevo producto</h3>
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
          <label className="block mb-1 text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Producto N"
            className="w-full border border-[#251f30] bg-[#050510] px-2 py-2 text-sm text-[#F3F6FA] outline-none focus:border-[#6D4A9B]"
            style={{ borderRadius: 6 }}
          />
        </div>
      </div>
      <div>
        <label className="block mb-1 text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">Disponible a partir de (opcional)</label>
        <input
          value={availableFrom}
          onChange={(e) => setAvailableFrom(e.target.value)}
          placeholder="Ej: Diciembre 2026 (vacío = disponible ya)"
          className="w-full border border-[#251f30] bg-[#050510] px-2 py-2 text-sm text-[#F3F6FA] outline-none focus:border-[#6D4A9B] placeholder:text-[#6a6a85]"
          style={{ borderRadius: 6 }}
        />
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
