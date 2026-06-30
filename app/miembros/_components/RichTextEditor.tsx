"use client"

// Editor rico baseado em TipTap. Toolbar com:
//   - Negrito, itálico, sublinhado, riscado
//   - Headings H1/H2/H3
//   - Listas ordenada/desordenada
//   - Alinhamento esquerda/centro/direita
//   - Cor de texto + highlight (cor de fundo)
//   - Link
//   - Imagem (upload pro R2 via /api/admin/upload)
//   - Quote, code block, divider
//
// Auto-save: notifica o pai via onChange com o HTML. O pai persiste com debounce.

import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import Placeholder from "@tiptap/extension-placeholder"
import Image from "@tiptap/extension-image"
import { useEffect, useRef, useState } from "react"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Quote,
  Code,
  Minus,
  Paintbrush,
  Highlighter,
  Loader2,
} from "lucide-react"
import { uploadMedia } from "../_lib/media-upload"

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Heading: deixa só H1/H2/H3 (sem H4-H6 pra não poluir)
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({
        placeholder: placeholder ?? "Escribe el contenido del bloque...",
      }),
      Image.configure({
        HTMLAttributes: { style: "max-width: 100%; height: auto; border-radius: 8px;" },
      }),
    ],
    content: value,
    immediatelyRender: false, // evita hydration mismatch no Next.js
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  // Sincroniza editor quando value externa muda (ex: troca de bloco)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (current !== value) {
      editor.commands.setContent(value || "", { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value])

  if (!editor) {
    return (
      <div
        style={{
          minHeight: 100,
          padding: "0.75rem",
          background: "#050510",
          border: "1px solid #251f30",
          borderRadius: 6,
          color: "#6a6a85",
          fontSize: "0.85rem",
        }}
      >
        Cargando editor...
      </div>
    )
  }

  return (
    <div
      style={{
        border: "1px solid #251f30",
        borderRadius: 8,
        background: "#050510",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="rich-editor-content"
        style={{ padding: "0.85rem 1rem", minHeight: 120, color: "#F3F6FA" }}
      />
      {/* Estilo do conteúdo dentro do editor */}
      <style jsx global>{`
        .rich-editor-content .ProseMirror {
          outline: none;
          min-height: 100px;
          font-family: var(--font-geist-sans, sans-serif);
          font-size: 0.95rem;
          line-height: 1.6;
        }
        .rich-editor-content .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #6a6a85;
          pointer-events: none;
          height: 0;
        }
        .rich-editor-content .ProseMirror h1 {
          font-family: var(--font-cinzel, serif);
          font-size: 1.75rem;
          font-weight: 700;
          line-height: 1.15;
          margin: 0.75rem 0 0.5rem;
          color: #F3F6FA;
        }
        .rich-editor-content .ProseMirror h2 {
          font-family: var(--font-cinzel, serif);
          font-size: 1.4rem;
          font-weight: 700;
          line-height: 1.2;
          margin: 0.6rem 0 0.4rem;
          color: #F3F6FA;
        }
        .rich-editor-content .ProseMirror h3 {
          font-family: var(--font-cinzel, serif);
          font-size: 1.15rem;
          font-weight: 600;
          line-height: 1.25;
          margin: 0.5rem 0 0.35rem;
          color: #F3F6FA;
        }
        .rich-editor-content .ProseMirror p { margin: 0.4rem 0; }
        .rich-editor-content .ProseMirror ul,
        .rich-editor-content .ProseMirror ol { padding-left: 1.5rem; margin: 0.4rem 0; }
        .rich-editor-content .ProseMirror li { margin: 0.2rem 0; }
        .rich-editor-content .ProseMirror blockquote {
          border-left: 3px solid #6D4A9B;
          padding: 0.25rem 0 0.25rem 1rem;
          margin: 0.6rem 0;
          color: #a8a8c0;
          font-style: italic;
        }
        .rich-editor-content .ProseMirror code {
          background: rgba(109, 74, 155, 0.18);
          color: #a78bca;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          font-family: var(--font-mono, monospace);
          font-size: 0.85em;
        }
        .rich-editor-content .ProseMirror pre {
          background: #0a0a18;
          border: 1px solid #251f30;
          border-radius: 6px;
          padding: 0.75rem 1rem;
          overflow-x: auto;
          font-family: var(--font-mono, monospace);
          font-size: 0.85em;
        }
        .rich-editor-content .ProseMirror pre code {
          background: transparent;
          color: #F3F6FA;
          padding: 0;
        }
        .rich-editor-content .ProseMirror hr {
          border: none;
          border-top: 1px solid #251f30;
          margin: 1rem 0;
        }
        .rich-editor-content .ProseMirror a {
          color: #a78bca;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .rich-editor-content .ProseMirror mark {
          background: rgba(109, 74, 155, 0.35);
          color: inherit;
          padding: 0 0.15rem;
          border-radius: 2px;
        }
        .rich-editor-content .ProseMirror img {
          display: block;
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  )
}

// ─── Toolbar ─────────────────────────────────────────────────────────

function Toolbar({ editor }: { editor: Editor }) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function setLink() {
    const previous = editor.getAttributes("link").href ?? ""
    const url = window.prompt("URL del enlace:", previous)
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  async function handleImageFile(file: File) {
    setUploading(true)
    try {
      const { url } = await uploadMedia(file, "feed")
      editor.chain().focus().setImage({ src: url, alt: file.name }).run()
    } catch (e) {
      alert(`Erro upload: ${e instanceof Error ? e.message : "desconhecido"}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        padding: "0.4rem 0.5rem",
        background: "#0a0a18",
        borderBottom: "1px solid #251f30",
      }}
    >
      <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita (Ctrl+B)"><Bold size={14} /></Btn>
      <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálica (Ctrl+I)"><Italic size={14} /></Btn>
      <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Subrayado (Ctrl+U)"><UnderlineIcon size={14} /></Btn>
      <Btn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado"><Strikethrough size={14} /></Btn>

      <Divider />

      <Btn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Título 1"><Heading1 size={14} /></Btn>
      <Btn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título 2"><Heading2 size={14} /></Btn>
      <Btn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Título 3"><Heading3 size={14} /></Btn>

      <Divider />

      <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista"><List size={14} /></Btn>
      <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada"><ListOrdered size={14} /></Btn>
      <Btn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Cita"><Quote size={14} /></Btn>
      <Btn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Bloque de código"><Code size={14} /></Btn>

      <Divider />

      <Btn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Alinear izquierda"><AlignLeft size={14} /></Btn>
      <Btn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Alinear centro"><AlignCenter size={14} /></Btn>
      <Btn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Alinear derecha"><AlignRight size={14} /></Btn>

      <Divider />

      {/* Cor de texto */}
      <label style={{ position: "relative" }} title="Color del texto">
        <BtnLabel>
          <Paintbrush size={14} />
        </BtnLabel>
        <input
          type="color"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
        />
      </label>

      {/* Cor de fundo (highlight) */}
      <label style={{ position: "relative" }} title="Color de fondo">
        <BtnLabel>
          <Highlighter size={14} />
        </BtnLabel>
        <input
          type="color"
          onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
        />
      </label>

      <Divider />

      <Btn active={editor.isActive("link")} onClick={setLink} title="Enlace"><LinkIcon size={14} /></Btn>

      <Btn
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        title="Subir imagen"
      >
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
      </Btn>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleImageFile(f)
          e.target.value = ""
        }}
      />

      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divisor"><Minus size={14} /></Btn>
    </div>
  )
}

function Btn({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        border: "1px solid transparent",
        background: active ? "#6D4A9B" : "transparent",
        color: active ? "#F3F6FA" : "#a8a8c0",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        borderRadius: 6,
        transition: "background 120ms, color 120ms",
      }}
      onMouseEnter={(e) => {
        if (active || disabled) return
        e.currentTarget.style.background = "rgba(109,74,155,0.18)"
        e.currentTarget.style.color = "#F3F6FA"
      }}
      onMouseLeave={(e) => {
        if (active || disabled) return
        e.currentTarget.style.background = "transparent"
        e.currentTarget.style.color = "#a8a8c0"
      }}
    >
      {children}
    </button>
  )
}

function BtnLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        background: "transparent",
        color: "#a8a8c0",
        borderRadius: 6,
        cursor: "pointer",
      }}
    >
      {children}
    </span>
  )
}

function Divider() {
  return (
    <span
      style={{
        width: 1,
        height: 22,
        background: "#251f30",
        margin: "3px 4px",
        alignSelf: "center",
      }}
    />
  )
}
