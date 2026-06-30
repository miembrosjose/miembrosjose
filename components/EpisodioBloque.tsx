'use client';

/**
 * EpisodioBloque
 * =====================================================================
 * Componente para Los 144.000 — bloque informativo de episodio.
 * Bloque superior = voz de José (antes de la transmisión).
 * Bloque inferior = voz de Sergel (archivo / arquitectura numérica).
 *
 * USO BÁSICO (con los textos de ejemplo del episodio "Frecuencia y
 * Responsabilidad"):
 *
 *   import EpisodioBloque from '@/components/EpisodioBloque';
 *   <EpisodioBloque />
 *
 * USO PERSONALIZADO (otro episodio, con o sin ecuación):
 *
 *   <EpisodioBloque
 *     kicker="EPISODIO · 02"
 *     title="La Herida del Olvido"
 *     joseParagraphs={[
 *       "Primer párrafo...",
 *       "Segundo párrafo...",
 *     ]}
 *     videoEmbed={<iframe src="https://..." />}
 *     sergelIntro="Texto de apertura de Sergel..."
 *     equation={null}              // null = no muestra panel de ecuación
 *     sergelQuote={null}           // null = no muestra la firma final
 *   />
 * =====================================================================
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface DecodeItem {
  term: string;
  description: string;
}

interface Equation {
  freq: string;        // ej. "432"
  unit: string;        // ej. "Hz"
  multiplier: string;  // ej. "333.333..."
  result: string;      // ej. "144.000"
  caption?: string;    // ej. "Ecuación de cierre"
}

interface EpisodioBloqueProps {
  kicker?: string;
  title?: string;
  joseParagraphs?: string[];
  videoEmbed?: ReactNode;
  sergelIntro?: string;
  equation?: Equation | null;
  decodeItems?: DecodeItem[];
  sergelQuote?: string | null;
  /**
   * 'full'   = encabezado + José + (video) + Sergel (default).
   * 'jose'   = encabezado + bloque de José (para ir ARRIBA del video).
   * 'sergel' = solo el bloque de Sergel (para ir ABAJO del video).
   * Útil cuando el video ya lo renderiza otra parte (p.ej. el player) y
   * solo se quieren los bloques de texto alrededor.
   */
  part?: 'full' | 'jose' | 'sergel';
}

const DEFAULT_JOSE = [
  'Vas a escuchar un número que se repite desde hace siglos en textos, profecías y arquitecturas sagradas. No lo tomes como una cifra de población ni como una promesa de elegidos.',
  '144.000 es una frecuencia — un umbral vibratorio que un grupo de conciencias puede sostener cuando decide recordar antes que creer. Lo que sigue no es información. Es una llave.',
];

const DEFAULT_DECODE: DecodeItem[] = [
  { term: '432', description: 'La afinación que distintas tradiciones reconocen como natural — el punto donde el sonido deja de imponerse y empieza a sostener.' },
  { term: '333.333...', description: 'El tres que no termina de repetirse: el patrón activo, la cifra que nunca cierra del todo porque siempre está en movimiento.' },
  { term: '144.000', description: 'El lugar donde ambos colapsan. No una cantidad — un código de cierre: el punto exacto donde la frecuencia individual deja de ser propia y se vuelve responsabilidad colectiva.' },
];

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.unobserve(node);
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${className} reveal ${visible ? 'is-visible' : ''}`}>
      {children}
    </div>
  );
}

export default function EpisodioBloque({
  kicker = 'EPISODIO · 144 · 000',
  title = 'Frecuencia y Responsabilidad',
  joseParagraphs = DEFAULT_JOSE,
  videoEmbed,
  sergelIntro = 'Detrás de cada número hay una arquitectura. Esta es la que sostiene a 144.000.',
  equation = { freq: '432', unit: 'Hz', multiplier: '333.333...', result: '144.000', caption: 'Ecuación de cierre' },
  decodeItems = DEFAULT_DECODE,
  sergelQuote = '"Los números no mienten. Solo esperan a quien sepa leerlos."',
  part = 'full',
}: EpisodioBloqueProps) {
  const [stars, setStars] = useState<
    { left: number; top: number; size: number; duration: number; delay: number }[]
  >([]);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReducedMotion(reduce);
    const count = window.innerWidth < 600 ? 50 : 90;
    setStars(
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 1.6 + 0.6,
        duration: 3 + Math.random() * 5,
        delay: Math.random() * 5,
      }))
    );
  }, []);

  return (
    <div className="ep-stage">
      <div className="ep-starfield">
        {stars.map((s, i) => (
          <span
            key={i}
            className="ep-star"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animation: reducedMotion ? 'none' : `ep-twinkle ${s.duration}s ease-in-out infinite`,
              animationDelay: `${s.delay}s`,
              opacity: reducedMotion ? 0.3 : undefined,
            }}
          />
        ))}
      </div>

      <div className="ep-content">
        {part !== 'sergel' && (<>
        <Reveal className="ep-header">
          <p className="ep-kicker">{kicker}</p>
          <h2 className="ep-title">{title}</h2>
          <div className="ep-rule" />
        </Reveal>

        <Reveal className="ep-block ep-block--jose">
          <span className="corner-tr" />
          <span className="corner-bl" />
          <p className="block-eyebrow">
            José <span className="voice">— Antes de la transmisión</span>
          </p>
          {joseParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </Reveal>
        </>)}

        {part === 'full' && videoEmbed && <Reveal className="ep-video">{videoEmbed}</Reveal>}

        {part !== 'jose' && (
        <Reveal className="ep-block ep-block--sergel">
          <span className="corner-tr" />
          <span className="corner-bl" />
          <p className="block-eyebrow">
            Sergel <span className="voice">— Archivo abierto</span>
          </p>
          <p>{sergelIntro}</p>

          {equation && (
            <div className="equation-panel">
              <div className="equation">
                {equation.freq}
                <span className="op">{equation.unit}</span>
                <span className="op">×</span>
                {equation.multiplier}
                <span className="op">=</span>
                {equation.result}
              </div>
              {equation.caption && <p className="equation-caption">{equation.caption}</p>}
            </div>
          )}

          {decodeItems && decodeItems.length > 0 && (
            <div className="decode">
              <dl>
                {decodeItems.map((d, i) => (
                  <div className="decode-row" key={i}>
                    <dt>{d.term}</dt>
                    <dd>{d.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {sergelQuote && (
            <p className="voice-signature">
              {sergelQuote}
              <span>SERGEL — CUSTODIO DEL ARCHIVO</span>
            </p>
          )}
        </Reveal>
        )}
      </div>

      <style jsx>{`
        .ep-stage {
          position: relative;
          background: #07070a;
          overflow: hidden;
          padding: 4rem 0;
        }
        .ep-starfield {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: radial-gradient(ellipse at 50% -10%, #221c3a 0%, transparent 55%), #07070a;
        }
        :global(.ep-star) {
          position: absolute;
          border-radius: 50%;
          background: #e8e3d5;
          opacity: 0.35;
        }
        @keyframes ep-twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.65; }
        }
        .ep-content {
          position: relative;
          z-index: 1;
          max-width: 720px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        :global(.reveal) {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.9s ease, transform 0.9s ease;
        }
        :global(.reveal.is-visible) {
          opacity: 1;
          transform: translateY(0);
        }
        .ep-header {
          text-align: center;
          margin-bottom: 3.5rem;
        }
        .ep-kicker {
          font-family: var(--font-space-mono), monospace;
          font-size: 0.8rem;
          letter-spacing: 0.35em;
          color: #c9a227;
          margin: 0 0 1rem;
        }
        .ep-title {
          font-family: var(--font-marcellus), serif;
          font-weight: 400;
          font-size: clamp(1.7rem, 5vw, 2.6rem);
          letter-spacing: 0.04em;
          line-height: 1.25;
          margin: 0 0 1.4rem;
          color: #e8e3d5;
        }
        .ep-rule {
          width: 120px;
          height: 1px;
          margin: 0 auto;
          background: linear-gradient(90deg, transparent, #c9a227, transparent);
        }
        .ep-block {
          position: relative;
          background: #0e0f18;
          border: 1px solid #1b1c2a;
          padding: 2.2rem 1.8rem;
          margin-bottom: 3rem;
          font-family: var(--font-eb-garamond), serif;
          color: #e8e3d5;
        }
        .ep-block :global(p) {
          font-size: 1.08rem;
          line-height: 1.75;
          margin: 0 0 1rem;
        }
        .ep-block :global(p:last-child) {
          margin-bottom: 0;
        }
        .ep-block :global(.corner-tr),
        .ep-block :global(.corner-bl) {
          position: absolute;
          width: 14px;
          height: 14px;
          border: 1px solid #6e5c1c;
        }
        .ep-block :global(.corner-tr) {
          top: -1px;
          right: -1px;
          border-left: none;
          border-bottom: none;
        }
        .ep-block :global(.corner-bl) {
          bottom: -1px;
          left: -1px;
          border-right: none;
          border-top: none;
        }
        .ep-block :global(.block-eyebrow) {
          font-family: var(--font-space-mono), monospace;
          font-size: 0.72rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #c9a227;
          margin: 0 0 1.1rem;
        }
        .ep-block :global(.voice) {
          color: #7c8088;
          letter-spacing: 0.2em;
        }
        .ep-video {
          margin-bottom: 3rem;
        }
        .ep-video :global(iframe),
        .ep-video :global(video) {
          width: 100%;
          aspect-ratio: 16 / 9;
          display: block;
          border: none;
        }
        .equation-panel {
          margin: 1.6rem 0;
          padding: 1.6rem 1rem;
          background: #07070a;
          border-top: 1px solid #6e5c1c;
          border-bottom: 1px solid #6e5c1c;
          text-align: center;
        }
        .equation {
          font-family: var(--font-space-mono), monospace;
          font-weight: 700;
          font-size: clamp(1.1rem, 4.2vw, 1.6rem);
          letter-spacing: 0.04em;
          color: #c9a227;
        }
        .equation :global(.op) {
          color: #7c8088;
          margin: 0 0.35em;
        }
        .equation-caption {
          font-family: var(--font-space-mono), monospace;
          font-size: 0.68rem;
          letter-spacing: 0.2em;
          color: #7c8088;
          margin-top: 0.8rem;
          text-transform: uppercase;
        }
        .decode {
          margin-top: 1.6rem;
          padding-top: 1.4rem;
          border-top: 1px solid #1b1c2a;
        }
        .decode-row {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.55rem 1rem;
          margin-bottom: 0.55rem;
        }
        .decode-row :global(dt) {
          font-family: var(--font-space-mono), monospace;
          font-size: 0.9rem;
          color: #c9a227;
          white-space: nowrap;
        }
        .decode-row :global(dd) {
          margin: 0;
          font-size: 0.98rem;
          line-height: 1.6;
          color: #e8e3d5;
        }
        .voice-signature {
          margin-top: 1.8rem;
          font-family: var(--font-eb-garamond), serif;
          font-style: italic;
          font-size: 0.98rem;
          color: #7c8088;
          text-align: right;
        }
        .voice-signature :global(span) {
          display: block;
          font-family: var(--font-space-mono), monospace;
          font-style: normal;
          font-size: 0.68rem;
          letter-spacing: 0.2em;
          color: #6e5c1c;
          margin-top: 0.4rem;
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.reveal) {
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
