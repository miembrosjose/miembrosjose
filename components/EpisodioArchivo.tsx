'use client';

// Archivo complementario de Sergel — Temporada 1, episodios 3 a 7.
//
// Reutiliza EXACTAMENTE el lenguaje visual del Episodio 2 (components/EpisodioBloque):
// caja central #0e0f18 con borde #1b1c2a y esquinas violeta #4A3170, eyebrow
// "Sergel — Archivo abierto" en Space Mono violeta, panel central tipo "fórmula/
// arquitectura", desarrollo en párrafos, "Registro de Sergel" en itálica y un
// cierre breve. Fondo transparente → se ve el starfield unificado detrás.
//
// El contenido llega como datos (ver app/miembros/_lib/season1-archivos.ts) para
// no duplicar estilos por episodio.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Marcellus, EB_Garamond, Space_Mono } from 'next/font/google';

const marcellus  = Marcellus({ subsets: ['latin'], weight: '400', variable: '--ea-marcellus' });
const ebGaramond = EB_Garamond({ subsets: ['latin'], weight: ['400', '500'], style: ['normal', 'italic'], variable: '--ea-eb-garamond' });
const spaceMono  = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--ea-space-mono' });

export type ArchivoBlock =
  | { type: 'p'; text: string }
  | { type: 'subheading'; text: string }
  | { type: 'antiphon'; lines: string[] };

export type ArchivoContent = {
  /** Frase inicial reveladora. */
  lead: string;
  /** Fórmula / arquitectura central (ej. "ORIGEN ESTELAR × ENCARNACIÓN = SERVICIO"). */
  formula: string;
  /** Subtítulo del panel (ej. "Proceso de germinación"). */
  formulaCaption: string;
  /** Desarrollo interno (párrafos, subtítulos y bloques antifonales). */
  blocks: ArchivoBlock[];
  /** Registro final de Sergel (se muestra en itálica). */
  registro: string;
  /** Cierre breve. */
  cierre: string;
};

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVisible(true); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setVisible(true); io.unobserve(node); } });
    }, { threshold: 0.15 });
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`${className} ea-reveal ${visible ? 'is-visible' : ''}`}>{children}</div>;
}

// Colorea los operadores de la fórmula (×, +, =, →, ·) en gris, dejando los
// términos en violeta — igual que la ecuación del Episodio 2.
const OP_RE = /^[×+=→·−-]$/;
function Formula({ formula }: { formula: string }) {
  const tokens = formula.trim().split(/\s+/);
  return (
    <div className="ea-formula">
      {tokens.map((tok, i) => (
        <span key={i}>
          {i > 0 ? ' ' : ''}
          {OP_RE.test(tok) ? <span className="op">{tok}</span> : tok}
        </span>
      ))}
    </div>
  );
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

          <div className="ea-formula-panel">
            <Formula formula={content.formula} />
            <p className="ea-formula-caption">{content.formulaCaption}</p>
          </div>

          {content.blocks.map((b, i) => {
            if (b.type === 'p') return <p key={i}>{b.text}</p>;
            if (b.type === 'subheading') return <p key={i} className="ea-subheading">{b.text}</p>;
            return (
              <div key={i} className="ea-antiphon">
                {b.lines.map((l, j) => <span key={j} className="ea-antiphon-line">{l}</span>)}
              </div>
            );
          })}

          <div className="ea-registro">
            <p className="registro-label">Registro de Sergel</p>
            <p className="registro-text">{content.registro}</p>
          </div>

          <div className="ea-cierre">
            <span className="ea-cierre-mark" aria-hidden />
            <p className="ea-cierre-text">{content.cierre}</p>
          </div>
        </Reveal>
      </div>

      <style jsx>{`
        /* Mismos tokens visuales que components/EpisodioBloque (Episodio 2). */
        .ea-stage {
          position: relative;
          background: transparent;
          overflow: hidden; padding: 4rem 0;
        }
        .ea-content {
          position: relative; z-index: 1;
          max-width: 720px; margin: 0 auto; padding: 0 1.5rem;
        }
        :global(.ea-reveal) {
          opacity: 0; transform: translateY(16px);
          transition: opacity 0.9s ease, transform 0.9s ease;
        }
        :global(.ea-reveal.is-visible) { opacity: 1; transform: translateY(0); }

        :global(.ea-block) {
          position: relative; background: #0e0f18; border: 1px solid #1b1c2a;
          padding: 2.2rem 1.8rem; margin-bottom: 0;
          font-family: var(--ea-eb-garamond), Georgia, serif;
          color: #e8e3d5;
        }
        :global(.ea-block p) { font-size: 1.08rem; line-height: 1.75; margin: 0 0 1.05rem; }
        :global(.ea-block p:last-child) { margin-bottom: 0; }

        :global(.ea-block .corner-tr),
        :global(.ea-block .corner-bl) {
          position: absolute; width: 14px; height: 14px; border: 1px solid #4A3170;
        }
        :global(.ea-block .corner-tr) { top:-1px; right:-1px; border-left:none; border-bottom:none; }
        :global(.ea-block .corner-bl) { bottom:-1px; left:-1px; border-right:none; border-top:none; }

        :global(.ea-block .block-eyebrow) {
          font-family: var(--ea-space-mono), 'Courier New', monospace;
          font-size: 0.72rem; letter-spacing: 0.25em; text-transform: uppercase;
          color: #6D4A9B; margin: 0 0 1.1rem;
        }
        :global(.ea-block .voice) { color: #7c8088; letter-spacing: 0.2em; }

        :global(.ea-block .ea-lead) {
          font-size: 1.22rem; line-height: 1.7; color: #f0ece0; margin-bottom: 0.4rem;
        }

        /* Panel central: fórmula / arquitectura (idéntico a la ecuación del Ep. 2) */
        :global(.ea-block .ea-formula-panel) {
          margin: 1.6rem 0; padding: 1.6rem 1rem; background: #07070a;
          border-top: 1px solid #4A3170; border-bottom: 1px solid #4A3170; text-align: center;
        }
        :global(.ea-block .ea-formula) {
          font-family: var(--ea-space-mono), 'Courier New', monospace;
          font-weight: 700; font-size: clamp(1rem, 3.4vw, 1.45rem);
          letter-spacing: 0.04em; color: #6D4A9B; line-height: 1.5;
        }
        :global(.ea-block .ea-formula .op) { color: #7c8088; margin: 0 0.35em; }
        :global(.ea-block .ea-formula-caption) {
          font-family: var(--ea-space-mono), 'Courier New', monospace;
          font-size: 0.68rem; letter-spacing: 0.2em; color: #7c8088;
          margin-top: 0.8rem !important; text-transform: uppercase;
        }

        /* Subtítulo interno (ej. "Trabajo con el Nombre Cósmico") */
        :global(.ea-block .ea-subheading) {
          font-family: var(--ea-space-mono), 'Courier New', monospace;
          font-size: 0.72rem; letter-spacing: 0.22em; text-transform: uppercase;
          color: #6D4A9B; margin: 1.9rem 0 1.1rem !important;
          padding-top: 1.4rem; border-top: 1px solid #1b1c2a;
        }

        /* Bloque antifonal (líneas centradas: lunar/solar, triadas, etc.) */
        :global(.ea-block .ea-antiphon) {
          margin: 1.5rem 0; padding: 1.3rem 1rem; text-align: center;
          border-top: 1px solid #1b1c2a; border-bottom: 1px solid #1b1c2a;
          display: flex; flex-direction: column; gap: 0.45rem;
        }
        :global(.ea-block .ea-antiphon-line) {
          font-family: var(--ea-space-mono), 'Courier New', monospace;
          font-size: 0.82rem; letter-spacing: 0.12em; color: #a48fce;
        }

        :global(.ea-block .ea-registro) {
          margin-top: 1.8rem; padding-top: 1.4rem; border-top: 1px solid #1b1c2a;
        }
        :global(.ea-block .registro-label) {
          font-family: var(--ea-space-mono), 'Courier New', monospace;
          font-size: 0.72rem; letter-spacing: 0.25em; text-transform: uppercase;
          color: #6D4A9B; margin: 0 0 0.9rem;
        }
        :global(.ea-block .registro-text) { font-style: italic; color: #cfc9ba; }

        /* Cierre breve, centrado, con una marca sutil arriba. */
        :global(.ea-block .ea-cierre) {
          margin-top: 1.8rem; text-align: center;
        }
        :global(.ea-block .ea-cierre-mark) {
          display: block; width: 34px; height: 1px; margin: 0 auto 1.1rem;
          background: #4A3170;
        }
        :global(.ea-block .ea-cierre-text) {
          font-style: italic; font-size: 1.08rem; color: #cbb9e6; margin: 0 !important;
        }

        @media (max-width: 480px) {
          :global(.ea-block .ea-formula) { font-size: 0.86rem; letter-spacing: 0.01em; }
          :global(.ea-block .ea-formula .op) { margin: 0 0.2em; }
          :global(.ea-block .ea-formula-panel) { padding: 1.4rem 0.6rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.ea-reveal) { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}
