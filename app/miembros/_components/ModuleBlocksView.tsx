"use client"

// Renderiza os blocks de texto de UM módulo numa zona (above/below_video).
// Read-only — view do membro.

import { useModuleBlocks, type BlockPosition } from "../_lib/use-module-blocks"

type Props = {
  moduleId: string
  position: BlockPosition
}

export function ModuleBlocksView({ moduleId, position }: Props) {
  const { aboveVideo, belowVideo } = useModuleBlocks(moduleId)
  const blocks = position === "above_video" ? aboveVideo : belowVideo

  if (blocks.length === 0) return null

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        padding: position === "above_video" ? "0 0 1.5rem" : "1.5rem 0 0",
      }}
    >
      {blocks.map((b) => (
        <div
          key={b.id}
          className="block-content"
          style={{
            padding: "1rem 1.25rem",
            background: "rgba(109, 74, 155, 0.06)",
            border: "1px solid rgba(109, 74, 155, 0.25)",
            borderRadius: 10,
            color: "#F3F6FA",
            fontSize: "0.95rem",
            lineHeight: 1.65,
            wordBreak: "break-word",
            fontFamily: "var(--font-geist-sans)",
          }}
          dangerouslySetInnerHTML={{ __html: b.content }}
        />
      ))}
      <style jsx global>{`
        .block-content h1 { font-family: var(--font-cinzel, serif); font-size: 1.75rem; font-weight: 700; line-height: 1.15; margin: 0.75rem 0 0.5rem; color: #F3F6FA; }
        .block-content h2 { font-family: var(--font-cinzel, serif); font-size: 1.4rem; font-weight: 700; line-height: 1.2; margin: 0.6rem 0 0.4rem; color: #F3F6FA; }
        .block-content h3 { font-family: var(--font-cinzel, serif); font-size: 1.15rem; font-weight: 600; line-height: 1.25; margin: 0.5rem 0 0.35rem; color: #F3F6FA; }
        .block-content p { margin: 0.4rem 0; }
        .block-content ul, .block-content ol { padding-left: 1.5rem; margin: 0.4rem 0; }
        .block-content li { margin: 0.2rem 0; }
        .block-content blockquote { border-left: 3px solid #6D4A9B; padding: 0.25rem 0 0.25rem 1rem; margin: 0.6rem 0; color: #a8a8c0; font-style: italic; }
        .block-content code { background: rgba(109, 74, 155, 0.18); color: #a78bca; padding: 0.1rem 0.35rem; border-radius: 4px; font-family: var(--font-mono, monospace); font-size: 0.85em; }
        .block-content pre { background: #0a0a18; border: 1px solid #251f30; border-radius: 6px; padding: 0.75rem 1rem; overflow-x: auto; font-family: var(--font-mono, monospace); font-size: 0.85em; }
        .block-content pre code { background: transparent; color: #F3F6FA; padding: 0; }
        .block-content hr { border: none; border-top: 1px solid #251f30; margin: 1rem 0; }
        .block-content a { color: #a78bca; text-decoration: underline; text-underline-offset: 2px; }
        .block-content mark { color: inherit; padding: 0 0.15rem; border-radius: 2px; }
        .block-content img { display: block; margin: 0.5rem 0; max-width: 100%; height: auto; border-radius: 8px; }
      `}</style>
    </div>
  )
}
