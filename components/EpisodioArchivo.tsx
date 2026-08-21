'use client';

// Archivo cósmico visual de Sergel — Temporada 1, episodios 3 a 7.
//
// Composición VISUAL (no artículo): sigue la estética del Episodio 2
// (components/EpisodioBloque) — caja central #0e0f18 con borde #1b1c2a y
// esquinas violeta #4A3170, panel interno #07070a con líneas violeta, eyebrow
// "SERGEL — ARCHIVO ABIERTO" y cierre "REGISTRO DE SERGEL". Sobre esa base añade
// primitivas visuales: arquitectura central con flechas, tarjetas-nodo
// conectadas, dos columnas, chips, cajas secundarias y pares antifonales.
//
// El contenido llega como datos (app/miembros/_lib/season1-archivos.ts).

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Marcellus, EB_Garamond, Space_Mono } from 'next/font/google';

const marcellus  = Marcellus({ subsets: ['latin'], weight: '400', variable: '--ea-marcellus' });
const ebGaramond = EB_Garamond({ subsets: ['latin'], weight: ['400', '500'], style: ['normal', 'italic'], variable: '--ea-eb-garamond' });
const spaceMono  = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--ea-space-mono' });

// ── Modelo de datos (secciones visuales) ────────────────────────────────────
type Col = { label: string; sublabel?: string; text?: string; lines?: string[]; chips?: string[] };

export type ArchivoSection =
  | { kind: 'arch'; stack: string[]; caption?: string }              // arquitectura central con flechas/operadores
  | { kind: 'nodes'; items: { label: string; text: string }[] }      // tarjetas-nodo conectadas
  | { kind: 'twoCol'; cols: Col[] }                                  // dos columnas
  | { kind: 'box'; title?: string; formula?: string; text?: string; lines?: string[] } // caja secundaria
  | { kind: 'chips'; label?: string; chips: string[] }               // etiquetas visuales
  | { kind: 'pairs'; rows: [string, string][] }                      // pares antifonales (lunar/solar)
  | { kind: 'triad'; lines: string[] }                               // triada centrada
  | { kind: 'note'; text: string };                                  // texto breve de apoyo

export type ArchivoContent = {
  lead: string;
  sections: ArchivoSection[];
  registro: string;
  /** Cierre breve opcional (algunos archivos terminan en el Registro). */
  cierre?: string;
};

const OP_RE = /^[×+=→↓·−-]$/;

function Formula({ text, className = 'ea-formula' }: { text: string; className?: string }) {
  const tokens = text.trim().split(/\s+/);
  return (
    <div className={className}>
      {tokens.map((tok, i) => (
        <span key={i}>
          {i > 0 ? ' ' : ''}
          {OP_RE.test(tok) ? <span className="op">{tok}</span> : tok}
        </span>
      ))}
    </div>
  );
}

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVisible(true); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setVisible(true); io.unobserve(node); } });
    }, { threshold: 0.12 });
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`${className} ea-reveal ${visible ? 'is-visible' : ''}`}>{children}</div>;
}

function renderSection(s: ArchivoSection, i: number) {
  switch (s.kind) {
    case 'arch':
      return (
        <div key={i} className="ea-archPanel">
          <div className="ea-archStack">
            {s.stack.map((tok, j) =>
              OP_RE.test(tok)
                ? <span key={j} className="ea-archSep">{tok}</span>
                : <span key={j} className="ea-archNode">{tok}</span>
            )}
          </div>
          {s.caption && <p className="ea-archCaption">{s.caption}</p>}
        </div>
      );
    case 'nodes':
      return (
        <div key={i} className="ea-nodes">
          {s.items.map((n, j) => (
            <div key={j}>
              {j > 0 && <span className="ea-nodeLink" aria-hidden />}
              <div className="ea-nodeCard">
                <p className="ea-nodeLabel">{n.label}</p>
                <p className="ea-nodeText">{n.text}</p>
              </div>
            </div>
          ))}
        </div>
      );
    case 'twoCol':
      return (
        <div key={i} className="ea-twoCol">
          {s.cols.map((c, j) => (
            <div key={j} className="ea-colCard">
              <p className="ea-colLabel">{c.label}</p>
              {c.sublabel && <p className="ea-colSub">{c.sublabel}</p>}
              {c.text && <p className="ea-colText">{c.text}</p>}
              {c.lines && (
                <div className="ea-colLines">
                  {c.lines.map((l, k) => <span key={k}>{l}</span>)}
                </div>
              )}
              {c.chips && (
                <div className="ea-chips ea-chips--inCol">
                  {c.chips.map((ch, k) => <span key={k} className="ea-chip">{ch}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    case 'box':
      return (
        <div key={i} className="ea-boxPanel">
          {s.title && <p className="ea-boxTitle">{s.title}</p>}
          {s.formula && <Formula text={s.formula} className="ea-boxFormula" />}
          {s.text && <p className="ea-boxText">{s.text}</p>}
          {s.lines && (
            <div className="ea-boxLines">
              {s.lines.map((l, k) => <span key={k}>{l}</span>)}
            </div>
          )}
        </div>
      );
    case 'chips':
      return (
        <div key={i} className="ea-chipsBlock">
          {s.label && <p className="ea-chipsLabel">{s.label}</p>}
          <div className="ea-chips">
            {s.chips.map((ch, k) => <span key={k} className="ea-chip">{ch}</span>)}
          </div>
        </div>
      );
    case 'pairs':
      return (
        <div key={i} className="ea-pairs">
          {s.rows.map((r, j) => (
            <div key={j} className="ea-pairRow">
              <span className="ea-pairL">{r[0]}</span>
              <span className="ea-pairSep" aria-hidden>·</span>
              <span className="ea-pairR">{r[1]}</span>
            </div>
          ))}
        </div>
      );
    case 'triad':
      return (
        <div key={i} className="ea-triad">
          {s.lines.map((l, k) => <span key={k}>{l}</span>)}
        </div>
      );
    case 'note':
      return <p key={i} className="ea-note">{s.text}</p>;
  }
}

export default function EpisodioArchivo({ content }: { content: ArchivoContent }) {
  const fontVars = `${marcellus.variable} ${ebGaramond.variable} ${spaceMono.variable}`;

  return (
    <div className={`ea-stage ${fontVars}`}>
      <div className="ea-content">
        <Reveal className="ea-block">
          <span className="corner-tr" /><span className="corner-bl" />
          <p className="block-eyebrow">Sergel <span className="voice">— Archivo abierto</span></p>

          <p className="ea-lead">{content.lead}</p>

          {content.sections.map((s, i) => renderSection(s, i))}

          <div className="ea-registro">
            <p className="registro-label">Registro de Sergel</p>
            <p className="registro-text">{content.registro}</p>
          </div>

          {content.cierre && (
            <div className="ea-cierre">
              <span className="ea-cierre-mark" aria-hidden />
              <p className="ea-cierre-text">{content.cierre}</p>
            </div>
          )}
        </Reveal>
      </div>

      <style jsx>{`
        .ea-stage { position: relative; background: transparent; overflow: hidden; padding: 4rem 0; }
        .ea-content { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; padding: 0 1.5rem; }

        :global(.ea-reveal) { opacity: 0; transform: translateY(16px); transition: opacity 0.9s ease, transform 0.9s ease; }
        :global(.ea-reveal.is-visible) { opacity: 1; transform: translateY(0); }

        /* Caja central (idéntica al Ep. 2) */
        :global(.ea-block) {
          position: relative; background: #0e0f18; border: 1px solid #1b1c2a;
          padding: 2.2rem 1.8rem;
          font-family: var(--ea-eb-garamond), Georgia, serif; color: #e8e3d5;
        }
        :global(.ea-block .corner-tr), :global(.ea-block .corner-bl) {
          position: absolute; width: 14px; height: 14px; border: 1px solid #4A3170;
        }
        :global(.ea-block .corner-tr) { top:-1px; right:-1px; border-left:none; border-bottom:none; }
        :global(.ea-block .corner-bl) { bottom:-1px; left:-1px; border-right:none; border-top:none; }

        :global(.ea-block .block-eyebrow) {
          font-family: var(--ea-space-mono), 'Courier New', monospace;
          font-size: 0.72rem; letter-spacing: 0.25em; text-transform: uppercase;
          color: #6D4A9B; margin: 0 0 1.2rem;
        }
        :global(.ea-block .voice) { color: #7c8088; letter-spacing: 0.2em; }

        /* Frase de apertura: breve y secundaria — NO titular. Mismo peso que un
           párrafo del Ep. 2, para que la fórmula central sea la protagonista. */
        :global(.ea-block .ea-lead) {
          font-size: 1.05rem; line-height: 1.6; color: #cfc9ba; margin: 0 0 1.6rem;
        }

        /* ── Arquitectura central (nodos + flechas/operadores) ─────────── */
        :global(.ea-block .ea-archPanel) {
          margin: 0 0 1.8rem; padding: 1.7rem 1rem; background: #07070a;
          border-top: 1px solid #4A3170; border-bottom: 1px solid #4A3170; text-align: center;
        }
        :global(.ea-block .ea-archStack) { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; }
        :global(.ea-block .ea-archNode) {
          font-family: var(--ea-space-mono), 'Courier New', monospace; font-weight: 700;
          font-size: clamp(0.95rem, 3.2vw, 1.28rem); letter-spacing: 0.06em; color: #8a63b8;
          line-height: 1.35;
        }
        :global(.ea-block .ea-archSep) {
          font-family: var(--ea-space-mono), 'Courier New', monospace;
          font-size: 1rem; color: #7c8088; line-height: 1;
        }
        :global(.ea-block .ea-archCaption) {
          font-family: var(--ea-space-mono), 'Courier New', monospace;
          font-size: 0.66rem; letter-spacing: 0.22em; color: #7c8088;
          margin: 1rem 0 0; text-transform: uppercase;
        }

        /* ── Tarjetas-nodo conectadas ──────────────────────────────────── */
        :global(.ea-block .ea-nodes) { margin: 0 0 1.8rem; }
        :global(.ea-block .ea-nodeLink) {
          display: block; width: 1px; height: 16px; margin: 0 auto; background: #4A3170; opacity: 0.7;
        }
        :global(.ea-block .ea-nodeCard) {
          background: #0b0b13; border: 1px solid #1b1c2a; border-left: 2px solid #4A3170;
          padding: 1rem 1.15rem;
        }
        :global(.ea-block .ea-nodeLabel) {
          font-family: var(--ea-space-mono), 'Courier New', monospace;
          font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: #6D4A9B;
          margin: 0 0 0.5rem;
        }
        :global(.ea-block .ea-nodeText) { font-size: 1rem; line-height: 1.65; color: #d8d3c6; margin: 0; }

        /* ── Dos columnas ──────────────────────────────────────────────── */
        :global(.ea-block .ea-twoCol) { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; margin: 0 0 1.8rem; }
        :global(.ea-block .ea-colCard) {
          background: #0b0b13; border: 1px solid #1b1c2a; padding: 1.1rem 1.15rem;
          display: flex; flex-direction: column;
        }
        :global(.ea-block .ea-colLabel) {
          font-family: var(--ea-space-mono), 'Courier New', monospace;
          font-size: 0.72rem; letter-spacing: 0.18em; text-transform: uppercase; color: #8a63b8;
          margin: 0 0 0.5rem;
        }
        :global(.ea-block .ea-colSub) {
          font-family: var(--ea-space-mono), 'Courier New', monospace;
          font-size: 0.64rem; letter-spacing: 0.14em; color: #7c8088; margin: 0 0 0.75rem;
        }
        :global(.ea-block .ea-colText) { font-size: 0.98rem; line-height: 1.6; color: #d8d3c6; margin: 0; }
        :global(.ea-block .ea-colLines) { display: flex; flex-direction: column; gap: 0.3rem; }
        :global(.ea-block .ea-colLines span) { font-size: 0.98rem; line-height: 1.5; color: #d8d3c6; }

        /* ── Chips / etiquetas visuales ────────────────────────────────── */
        :global(.ea-block .ea-chipsBlock) { margin: 0 0 1.8rem; text-align: center; }
        :global(.ea-block .ea-chipsLabel) {
          font-family: var(--ea-space-mono), 'Courier New', monospace;
          font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: #6D4A9B;
          margin: 0 0 0.9rem;
        }
        :global(.ea-block .ea-chips) { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
        :global(.ea-block .ea-chips--inCol) { justify-content: flex-start; margin-top: 0.2rem; }
        :global(.ea-block .ea-chip) {
          font-family: var(--ea-space-mono), 'Courier New', monospace;
          font-size: 0.68rem; letter-spacing: 0.08em; color: #cbb9e6;
          background: rgba(109, 74, 155, 0.1); border: 1px solid #4A3170;
          padding: 0.4rem 0.75rem; border-radius: 999px !important; white-space: nowrap;
        }

        /* ── Caja secundaria ───────────────────────────────────────────── */
        :global(.ea-block .ea-boxPanel) {
          margin: 0 0 1.8rem; padding: 1.4rem 1.3rem; background: #09090f;
          border: 1px solid #1b1c2a; border-top: 1px solid #4A3170;
        }
        :global(.ea-block .ea-boxTitle) {
          font-family: var(--ea-space-mono), 'Courier New', monospace;
          font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; color: #6D4A9B;
          text-align: center; margin: 0 0 0.9rem;
        }
        :global(.ea-block .ea-boxFormula) {
          font-family: var(--ea-space-mono), 'Courier New', monospace; font-weight: 700;
          font-size: clamp(0.95rem, 3vw, 1.2rem); letter-spacing: 0.05em; color: #8a63b8;
          text-align: center; margin: 0 0 0.9rem;
        }
        :global(.ea-block .ea-boxFormula .op) { color: #7c8088; margin: 0 0.3em; }
        :global(.ea-block .ea-boxText) { font-size: 1rem; line-height: 1.65; color: #d8d3c6; margin: 0; }
        :global(.ea-block .ea-boxLines) { display: flex; flex-direction: column; gap: 0.4rem; text-align: center; }
        :global(.ea-block .ea-boxLines span) { font-size: 0.98rem; line-height: 1.5; color: #cfc9ba; }

        /* ── Pares antifonales (lunar / solar) ─────────────────────────── */
        :global(.ea-block .ea-pairs) {
          margin: 0 0 1.8rem; padding: 1.2rem 1rem; text-align: center;
          border-top: 1px solid #1b1c2a; border-bottom: 1px solid #1b1c2a;
          display: flex; flex-direction: column; gap: 0.6rem;
        }
        :global(.ea-block .ea-pairRow) {
          display: flex; align-items: center; justify-content: center; gap: 0.7rem;
          font-family: var(--ea-space-mono), 'Courier New', monospace;
          font-size: 0.8rem; letter-spacing: 0.1em;
        }
        :global(.ea-block .ea-pairL) { color: #8a63b8; text-align: right; flex: 1; }
        :global(.ea-block .ea-pairR) { color: #a48fce; text-align: left; flex: 1; }
        :global(.ea-block .ea-pairSep) { color: #4A3170; }

        /* ── Triada centrada ───────────────────────────────────────────── */
        :global(.ea-block .ea-triad) {
          margin: 0 0 1.8rem; padding: 1.1rem 1rem; text-align: center;
          border-top: 1px solid #1b1c2a; border-bottom: 1px solid #1b1c2a;
          display: flex; flex-direction: column; gap: 0.4rem;
        }
        :global(.ea-block .ea-triad span) {
          font-family: var(--ea-space-mono), 'Courier New', monospace;
          font-size: 0.82rem; letter-spacing: 0.12em; color: #a48fce;
        }

        /* ── Nota breve ────────────────────────────────────────────────── */
        :global(.ea-block .ea-note) { font-size: 1rem; line-height: 1.7; color: #d8d3c6; margin: 0 0 1.8rem; }

        /* ── Registro + cierre (idénticos al Ep. 2) ────────────────────── */
        :global(.ea-block .ea-registro) { margin-top: 0.2rem; padding-top: 1.4rem; border-top: 1px solid #1b1c2a; }
        :global(.ea-block .registro-label) {
          font-family: var(--ea-space-mono), 'Courier New', monospace;
          font-size: 0.72rem; letter-spacing: 0.25em; text-transform: uppercase; color: #6D4A9B; margin: 0 0 0.9rem;
        }
        :global(.ea-block .registro-text) { font-style: italic; color: #cfc9ba; font-size: 1.05rem; line-height: 1.7; margin: 0; }

        :global(.ea-block .ea-cierre) { margin-top: 1.8rem; text-align: center; }
        :global(.ea-block .ea-cierre-mark) { display: block; width: 34px; height: 1px; margin: 0 auto 1.1rem; background: #4A3170; }
        :global(.ea-block .ea-cierre-text) { font-style: italic; font-size: 1.08rem; color: #cbb9e6; margin: 0; }

        @media (max-width: 560px) {
          :global(.ea-block) { padding: 1.8rem 1.15rem; }
          :global(.ea-block .ea-twoCol) { grid-template-columns: 1fr; }
          :global(.ea-block .ea-pairRow) { flex-direction: column; gap: 0.15rem; }
          :global(.ea-block .ea-pairL), :global(.ea-block .ea-pairR) { text-align: center; }
          :global(.ea-block .ea-pairSep) { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.ea-reveal) { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}
