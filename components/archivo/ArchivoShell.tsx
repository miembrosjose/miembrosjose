'use client';

// Envoltura compartida de los ARCHIVOS COMPLEMENTARIOS — Temporada 2 (Alina).
//
// Reutiliza la identidad ya aprobada en la Temporada 1 (components/EpisodioArchivo):
// caja central #0e0f18 con borde #1b1c2a, esquinas de acento, eyebrow
// "<GUÍA> — ARCHIVO ABIERTO", frase de apertura, módulo central y cierre
// "REGISTRO DE <GUÍA>". Mismas tipografías (Marcellus / EB Garamond / Space Mono),
// mismos espaciados y el mismo Reveal por IntersectionObserver.
//
// Diferencia con la T1: aquí el módulo central es un COMPONENTE (SVG/estado),
// no una sección de datos. Por eso la envoltura acepta children.
//
// Paleta: violeta = campos, registros, información secundaria y conexiones.
//         dorado  = centros, números, niveles principales y revelaciones.
// El dorado es el EXACTO de la identidad (app/miembros/_styles/tokens.css).

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Marcellus, EB_Garamond, Space_Mono } from 'next/font/google';

const marcellus = Marcellus({ subsets: ['latin'], weight: '400', variable: '--aa-marcellus' });
const ebGaramond = EB_Garamond({ subsets: ['latin'], weight: ['400', '500'], style: ['normal', 'italic'], variable: '--aa-eb-garamond' });
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--aa-space-mono' });

export const archivoFontVars = `${marcellus.variable} ${ebGaramond.variable} ${spaceMono.variable}`;

/** Aparición al entrar en viewport. Respeta prefers-reduced-motion. */
export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    // ── POR QUÉ ESTOS DOS VALORES, Y NO LOS DE ANTES ────────────────────
    // Antes: threshold 0.12 y sin margen. Eso exige que el 12% del bloque
    // esté DENTRO de la pantalla para que aparezca, y estos bloques son
    // altos. En un teléfono, con el vídeo ocupando lo que ocupa, el archivo
    // que va justo debajo nunca llegaba a ese 12%: se quedaba en opacidad
    // cero y bajo el vídeo no se veía nada. Solo al deslizar aparecía.
    //
    // Ahora basta con que asome UN píxel (threshold 0) y además se cuenta
    // como visible lo que está hasta media pantalla por debajo del borde
    // (rootMargin). Así lo que va justo debajo del vídeo se revela solo, al
    // entrar en el episodio, sin tocar nada.
    //
    // La aparición suave se conserva: lo que estaba bien era el efecto, no
    // que hubiera que deslizar para desencadenarlo. Y lo que queda mucho más
    // abajo sigue apareciendo al acercarse, que es lo que le da vida.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            io.unobserve(node);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px 50% 0px' },
    );
    io.observe(node);

    // Red de seguridad: si por lo que sea el observador no dispara —un
    // contenedor con scroll propio, un navegador que calcula mal al rotar—,
    // el contenido aparece igual al segundo. Nunca se queda invisible.
    const red = window.setTimeout(() => setVisible(true), 1000);

    return () => { io.disconnect(); window.clearTimeout(red); };
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} aa-reveal ${visible ? 'is-visible' : ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/**
 * Hook de progreso por scroll: devuelve el índice de etapa (0..steps-1) según
 * cuánto del elemento ha atravesado el viewport. Sirve para los módulos que se
 * construyen progresivamente (Flor de la Vida). Sin librerías externas.
 */
export function useScrollStage(steps: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStage(steps - 1);
      return;
    }
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = node.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        // 0 cuando el módulo entra por abajo; 1 cuando su centro sube al tercio alto.
        const p = (vh * 0.85 - r.top) / (vh * 0.75 + r.height * 0.35);
        const clamped = Math.min(1, Math.max(0, p));
        setStage(Math.min(steps - 1, Math.floor(clamped * steps)));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [steps]);

  return { ref, stage };
}

// ── Primitivas compartidas entre los seis archivos ──────────────────────────

/** Secuencia vertical con flechas: CENTRO → POLARIDAD → EXPERIENCIA … */
export function Flow({ steps, label, dir = 'down' }: { steps: string[]; label?: string; dir?: 'down' | 'up' }) {
  return (
    <div className="aa-flow">
      {label && <p className="aa-flowLabel">{label}</p>}
      <div className="aa-flowStack">
        {steps.map((s, i) => (
          <div key={i} className="aa-flowItem">
            {i > 0 && <span className="aa-flowArrow" aria-hidden>{dir === 'down' ? '↓' : '↑'}</span>}
            <span className="aa-flowNode">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Caja de revelación: título en dorado + fórmula/versos. */
export function KeyBox({
  title,
  formula,
  text,
  lines,
  tone = 'gold',
}: {
  title?: string;
  formula?: ReactNode;
  text?: string;
  lines?: string[];
  tone?: 'gold' | 'violet';
}) {
  return (
    <div className={`aa-keyBox ${tone === 'violet' ? 'is-violet' : ''}`}>
      {title && <p className="aa-keyTitle">{title}</p>}
      {formula && <div className="aa-keyFormula">{formula}</div>}
      {lines && (
        <div className="aa-keyLines">
          {lines.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}
      {text && <p className="aa-keyText">{text}</p>}
    </div>
  );
}

/** Nota técnica: párrafo corto de apoyo, tono documento. */
export function TechNote({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="aa-techNote">
      {label && <p className="aa-techLabel">{label}</p>}
      <p className="aa-techText">{children}</p>
    </div>
  );
}

/** Etiquetas compactas (claves, funciones). */
export function Chips({ items, label }: { items: string[]; label?: string }) {
  return (
    <div className="aa-chipsBlock">
      {label && <p className="aa-chipsLabel">{label}</p>}
      <div className="aa-chips">
        {items.map((c, i) => (
          <span key={i} className="aa-chip">
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Título de sección dentro del archivo. */
export function ModuleTitle({ children }: { children: ReactNode }) {
  return <p className="aa-moduleTitle">{children}</p>;
}

/**
 * Microetiqueta de procedencia. Obligatoria en la Temporada 3, donde conviven
 * la enseñanza del archivo, las tradiciones antiguas y los datos verificables:
 * el lector debe poder distinguir SIEMPRE de qué tipo de fuente viene una
 * afirmación. No se mezclan registros.
 */
export type Fuente = 'plan' | 'tradicion' | 'astronomia' | 'geologia' | 'simbolica';

const FUENTE_LABEL: Record<Fuente, string> = {
  plan: 'Archivo del Plan',
  tradicion: 'Tradición',
  astronomia: 'Dato astronómico',
  geologia: 'Contexto geológico',
  simbolica: 'Lectura simbólica',
};

export function SourceTag({ tipo }: { tipo: Fuente }) {
  return <span className={`aa-source is-${tipo}`}>{FUENTE_LABEL[tipo]}</span>;
}

/** Bloque con procedencia declarada: etiqueta + contenido. */
export function SourceBlock({ tipo, children }: { tipo: Fuente; children: ReactNode }) {
  return (
    <div className={`aa-sourceBlock is-${tipo}`}>
      <SourceTag tipo={tipo} />
      <div className="aa-sourceBody">{children}</div>
    </div>
  );
}

/**
 * Arco de la temporada: línea discreta de progreso de memoria. No es un menú
 * de navegación — solo sitúa el archivo abierto dentro de la secuencia.
 */
export function ArcoMemoria({ pasos, actual }: { pasos: string[]; actual: number }) {
  return (
    <div className="aa-arco" aria-label={`Archivo ${actual} de ${pasos.length}`}>
      <div className="aa-arcoTrack">
        {pasos.map((p, i) => (
          <span key={i} className={`aa-arcoDot ${i + 1 === actual ? 'is-on' : ''} ${i + 1 < actual ? 'is-past' : ''}`} title={p} />
        ))}
      </div>
      <p className="aa-arcoLabel">
        <span className="aa-arcoNum">{String(actual).padStart(2, '0')}</span>
        {pasos[actual - 1]}
      </p>
    </div>
  );
}

// ── Envoltura ───────────────────────────────────────────────────────────────

export default function ArchivoShell({
  guia = 'Alina',
  voz = 'Archivo abierto',
  lead,
  registro,
  arco,
  children,
}: {
  guia?: string;
  /** Sufijo del eyebrow. Alina y Antarel abren «archivo»; Ivika, «memoria». */
  voz?: string;
  lead: string;
  registro: string;
  /** Línea de progreso de la temporada (T3, T4). Opcional. */
  arco?: { pasos: string[]; actual: number };
  children: ReactNode;
}) {
  return (
    <div className={`aa-stage ${archivoFontVars}`}>
      <div className="aa-content">
        <Reveal className="aa-block">
          <span className="aa-corner-tr" />
          <span className="aa-corner-bl" />

          <p className="aa-eyebrow">
            {guia} <span className="aa-voice">— {voz}</span>
          </p>

          {arco && <ArcoMemoria pasos={arco.pasos} actual={arco.actual} />}

          <p className="aa-lead">{lead}</p>

          {children}

          <div className="aa-registro">
            <p className="aa-registroLabel">Registro de {guia}</p>
            <p className="aa-registroText">{registro}</p>
          </div>
        </Reveal>
      </div>

      <style jsx global>{`
        .aa-stage {
          position: relative;
          background: transparent;
          overflow: hidden;
          padding: 4rem 0;

          /* Dorado EXACTO de la identidad (tokens.css --gold / --gold-soft). */
          --aa-gold: #d9b866;
          --aa-gold-soft: #e6cf95;
          --aa-gold-dim: rgba(217, 184, 102, 0.42);
          --aa-gold-ghost: rgba(217, 184, 102, 0.12);

          --aa-violet: #6d4a9b;
          --aa-violet-soft: #8a63b8;
          --aa-violet-pale: #a48fce;
          --aa-violet-deep: #4a3170;
          --aa-violet-ghost: rgba(109, 74, 155, 0.12);

          --aa-line: #1b1c2a;
          --aa-panel: #0e0f18;
          --aa-inner: #07070a;
          --aa-inner-2: #0b0b13;
          --aa-text: #d8d3c6;
          --aa-text-soft: #cfc9ba;
          --aa-text-dim: #7c8088;
          --aa-mono: var(--aa-space-mono), 'Courier New', monospace;
        }

        .aa-content {
          position: relative;
          z-index: 1;
          max-width: 720px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .aa-reveal {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.9s ease, transform 0.9s ease;
        }
        .aa-reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .aa-block {
          position: relative;
          background: var(--aa-panel);
          border: 1px solid var(--aa-line);
          padding: 2.2rem 1.8rem;
          font-family: var(--aa-eb-garamond), Georgia, serif;
          color: #e8e3d5;
        }
        .aa-corner-tr,
        .aa-corner-bl {
          position: absolute;
          width: 14px;
          height: 14px;
          border: 1px solid var(--aa-gold-dim);
        }
        .aa-corner-tr { top: -1px; right: -1px; border-left: none; border-bottom: none; }
        .aa-corner-bl { bottom: -1px; left: -1px; border-right: none; border-top: none; }

        .aa-eyebrow {
          font-family: var(--aa-mono);
          font-size: 0.72rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--aa-gold);
          margin: 0 0 1.2rem;
        }
        .aa-voice { color: var(--aa-text-dim); letter-spacing: 0.2em; }

        .aa-lead {
          font-size: 1.05rem;
          line-height: 1.68;
          color: var(--aa-text-soft);
          margin: 0 0 1.9rem;
        }

        .aa-moduleTitle {
          font-family: var(--aa-mono);
          font-size: 0.7rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--aa-gold);
          text-align: center;
          margin: 0 0 1.1rem;
        }

        /* ── Flow ─────────────────────────────────────────────────────── */
        .aa-flow {
          margin: 0 0 1.8rem;
          padding: 1.4rem 1rem;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim);
          border-bottom: 1px solid var(--aa-gold-dim);
          text-align: center;
        }
        .aa-flowLabel {
          font-family: var(--aa-mono);
          font-size: 0.64rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--aa-text-dim);
          margin: 0 0 0.9rem;
        }
        .aa-flowStack { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
        .aa-flowItem { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
        .aa-flowArrow { font-family: var(--aa-mono); font-size: 0.9rem; color: var(--aa-gold-dim); line-height: 1; }
        .aa-flowNode {
          font-family: var(--aa-mono);
          font-weight: 700;
          font-size: clamp(0.85rem, 2.9vw, 1.1rem);
          letter-spacing: 0.06em;
          color: var(--aa-gold-soft);
          line-height: 1.35;
        }

        /* ── KeyBox ───────────────────────────────────────────────────── */
        .aa-keyBox {
          margin: 0 0 1.8rem;
          padding: 1.4rem 1.3rem;
          background: #09090f;
          border: 1px solid var(--aa-line);
          border-top: 1px solid var(--aa-gold-dim);
        }
        .aa-keyBox.is-violet { border-top-color: var(--aa-violet-deep); }
        .aa-keyTitle {
          font-family: var(--aa-mono);
          font-size: 0.72rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--aa-gold);
          text-align: center;
          margin: 0 0 0.9rem;
        }
        .aa-keyBox.is-violet .aa-keyTitle { color: var(--aa-violet-soft); }
        .aa-keyFormula {
          font-family: var(--aa-mono);
          font-weight: 700;
          font-size: clamp(0.95rem, 3vw, 1.2rem);
          letter-spacing: 0.05em;
          color: var(--aa-gold-soft);
          text-align: center;
          margin: 0 0 0.9rem;
          line-height: 1.7;
        }
        .aa-keyFormula .op { color: var(--aa-violet-soft); margin: 0 0.35em; }
        .aa-keyFormula .dim { color: var(--aa-text-dim); }
        .aa-keyLines { display: flex; flex-direction: column; gap: 0.35rem; text-align: center; margin: 0 0 0.9rem; }
        .aa-keyLines span { font-family: var(--aa-mono); font-size: 0.78rem; letter-spacing: 0.12em; color: var(--aa-violet-pale); }
        .aa-keyText { font-size: 1rem; line-height: 1.68; color: var(--aa-text); margin: 0; }

        /* ── TechNote ─────────────────────────────────────────────────── */
        .aa-techNote {
          margin: 0 0 1.6rem;
          padding-left: 0.95rem;
          border-left: 2px solid var(--aa-violet-deep);
        }
        .aa-techLabel {
          font-family: var(--aa-mono);
          font-size: 0.64rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--aa-violet-soft);
          margin: 0 0 0.45rem;
        }
        .aa-techText { font-size: 0.99rem; line-height: 1.68; color: var(--aa-text); margin: 0; }

        /* ── Chips ────────────────────────────────────────────────────── */
        .aa-chipsBlock { margin: 0 0 1.6rem; text-align: center; }
        .aa-chipsLabel {
          font-family: var(--aa-mono);
          font-size: 0.66rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--aa-violet-soft);
          margin: 0 0 0.75rem;
        }
        .aa-chips { display: flex; flex-wrap: wrap; gap: 0.45rem; justify-content: center; }
        .aa-chip {
          font-family: var(--aa-mono);
          font-size: 0.66rem;
          letter-spacing: 0.08em;
          color: #cbb9e6;
          background: var(--aa-violet-ghost);
          border: 1px solid var(--aa-violet-deep);
          padding: 0.38rem 0.7rem;
          border-radius: 999px !important;
          white-space: nowrap;
        }

        /* ── Microetiquetas de procedencia ────────────────────────────── */
        .aa-source {
          display: inline-block;
          font-family: var(--aa-mono);
          font-size: 0.56rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 0.22rem 0.5rem;
          border-radius: 999px !important;
          border: 1px solid var(--aa-violet-deep);
          background: var(--aa-violet-ghost);
          color: #cbb9e6;
          white-space: nowrap;
        }
        /* La enseñanza del archivo va en dorado; todo lo verificable, en frío. */
        .aa-source.is-plan { border-color: var(--aa-gold-dim); background: var(--aa-gold-ghost); color: var(--aa-gold-soft); }
        .aa-source.is-simbolica { border-color: var(--aa-gold-dim); color: var(--aa-gold); background: transparent; }
        .aa-source.is-astronomia,
        .aa-source.is-geologia {
          border-color: #2a3a52; background: rgba(90, 130, 180, 0.08); color: #9db4cf;
        }

        .aa-sourceBlock {
          margin: 0 0 1.6rem; padding: 0.95rem 1rem;
          background: var(--aa-inner-2);
          border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-violet-deep);
        }
        .aa-sourceBlock.is-plan { border-left-color: var(--aa-gold-dim); }
        .aa-sourceBlock.is-simbolica { border-left-color: var(--aa-gold); }
        .aa-sourceBlock.is-astronomia,
        .aa-sourceBlock.is-geologia { border-left-color: #2a3a52; }
        .aa-sourceBody { margin-top: 0.6rem; }
        .aa-sourceBody p { font-size: 0.96rem; line-height: 1.66; color: var(--aa-text); margin: 0 0 0.6rem; }
        .aa-sourceBody p:last-child { margin-bottom: 0; }
        .aa-sourceBody strong { color: var(--aa-gold-soft); font-weight: 400; }

        /* ── Arco de temporada ────────────────────────────────────────── */
        .aa-arco { margin: 0 0 1.5rem; }
        .aa-arcoTrack { display: flex; align-items: center; gap: 5px; margin: 0 0 0.5rem; }
        .aa-arcoDot {
          flex: 1; height: 2px; background: var(--aa-line); border-radius: 999px !important;
          transition: background 400ms ease;
        }
        .aa-arcoDot.is-past { background: var(--aa-violet-deep); }
        .aa-arcoDot.is-on { background: var(--aa-gold); box-shadow: 0 0 8px rgba(217, 184, 102, 0.45); }
        .aa-arcoLabel {
          font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-text-dim); margin: 0;
          display: flex; align-items: baseline; gap: 0.5rem;
        }
        .aa-arcoNum { color: var(--aa-gold); font-weight: 700; }

        /* ── Registro ─────────────────────────────────────────────────── */
        .aa-registro { margin-top: 0.4rem; padding-top: 1.4rem; border-top: 1px solid var(--aa-line); }
        .aa-registroLabel {
          font-family: var(--aa-mono);
          font-size: 0.72rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--aa-gold);
          margin: 0 0 0.9rem;
        }
        .aa-registroText {
          font-style: italic;
          color: var(--aa-text-soft);
          font-size: 1.05rem;
          line-height: 1.72;
          margin: 0;
        }

        /* ── Scroller horizontal reutilizable (tablas/diagramas anchos) ── */
        .aa-scrollX { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }

        @media (max-width: 560px) {
          .aa-stage { padding: 2.6rem 0; }
          .aa-block { padding: 1.8rem 1.15rem; }
          .aa-lead { font-size: 1rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .aa-reveal { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}
