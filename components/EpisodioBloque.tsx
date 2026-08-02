'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Marcellus, EB_Garamond, Space_Mono } from 'next/font/google';

const marcellus  = Marcellus({ subsets: ['latin'], weight: '400', variable: '--ep-marcellus' });
const ebGaramond = EB_Garamond({ subsets: ['latin'], weight: ['400','500'], style: ['normal','italic'], variable: '--ep-eb-garamond' });
const spaceMono  = Space_Mono({ subsets: ['latin'], weight: ['400','700'], variable: '--ep-space-mono' });

interface DecodeItem { term: string; description: string; }
interface Equation { freq: string; unit: string; multiplier: string; result: string; caption?: string; }
interface EpisodioBloqueProps {
  joseParagraphs?: string[];
  videoEmbed?: ReactNode;
  sergelParagraphs?: string[];
  equation?: Equation | null;
  decodeItems?: DecodeItem[];
  sergelQuote?: string | null;
  /** 'full' = encabezado + José + (video) + Sergel · 'jose' = encabezado + José (arriba del video) · 'sergel' = solo Sergel (abajo). */
  part?: 'full' | 'jose' | 'sergel';
}

const DEFAULT_JOSE = [
  'Vas a escuchar un número que se repite desde hace siglos en textos, profecías y arquitecturas sagradas. No lo tomes como una cifra de población ni como una promesa de elegidos.',
  '144.000 es una frecuencia — un umbral vibratorio que un grupo de conciencias puede sostener cuando decide recordar antes que creer. Lo que sigue no es información. Es una llave.',
];

const DEFAULT_SERGEL = [
  'Detrás de toda frecuencia existe una arquitectura de conciencia.',
];

const DEFAULT_DECODE: DecodeItem[] = [
  { term: '432 Hz', description: 'Frecuencia de coherencia. La vibración alcanza orden y capacidad de integración.' },
  { term: '333.333...', description: 'Patrón de expansión continua. La conciencia se expresa simultáneamente a través de múltiples experiencias de sí misma.' },
  { term: '144.000', description: 'Estado de resonancia colectiva. La conciencia individual recuerda su pertenencia a una inteligencia mayor y comienza a actuar en servicio de la totalidad.' },
];

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
  return <div ref={ref} className={`${className} reveal ${visible ? 'is-visible' : ''}`}>{children}</div>;
}

export default function EpisodioBloque({
  joseParagraphs = DEFAULT_JOSE,
  videoEmbed,
  sergelParagraphs = DEFAULT_SERGEL,
  equation = { freq: '432', unit: 'Hz', multiplier: '333.333...', result: '144.000', caption: 'Patrón de resonancia' },
  decodeItems = DEFAULT_DECODE,
  sergelQuote = 'El 144.000 describe el momento en que el recuerdo se transforma en misión y la vibración se convierte en responsabilidad compartida.',
  part = 'full',
}: EpisodioBloqueProps) {
  const [stars, setStars] = useState<{ left:number; top:number; size:number; duration:number; delay:number }[]>([]);
  const [rm, setRm] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setRm(reduce);
    const count = window.innerWidth < 600 ? 50 : 90;
    setStars(Array.from({ length: count }, () => ({
      left: Math.random() * 100, top: Math.random() * 100,
      size: Math.random() * 1.6 + 0.6,
      duration: 3 + Math.random() * 5, delay: Math.random() * 5,
    })));
  }, []);

  const fontVars = `${marcellus.variable} ${ebGaramond.variable} ${spaceMono.variable}`;

  return (
    <div className={`ep-stage ${fontVars}`}>
      <div className="ep-starfield">
        {stars.map((s, i) => (
          <span key={i} className="ep-star" style={{
            left: `${s.left}%`, top: `${s.top}%`,
            width: `${s.size}px`, height: `${s.size}px`,
            animation: rm ? 'none' : `ep-twinkle ${s.duration}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`, opacity: rm ? 0.3 : undefined,
          }} />
        ))}
      </div>

      <div className="ep-content">
        {part !== 'sergel' && (
        <Reveal className="ep-block ep-block--jose">
          <span className="corner-tr" /><span className="corner-bl" />
          <p className="block-eyebrow">José <span className="voice">— Antes de la transmisión</span></p>
          {joseParagraphs.map((p, i) => <p key={i}>{p}</p>)}
        </Reveal>
        )}

        {part === 'full' && videoEmbed && <Reveal className="ep-video">{videoEmbed}</Reveal>}

        {part !== 'jose' && (
        <Reveal className="ep-block ep-block--sergel">
          <span className="corner-tr" /><span className="corner-bl" />
          <p className="block-eyebrow">Sergel <span className="voice">— Archivo abierto</span></p>
          {sergelParagraphs.map((p, i) => <p key={i}>{p}</p>)}

          {equation && (
            <div className="equation-panel">
              <div className="equation">
                {equation.freq}<span className="op">{equation.unit}</span>
                <span className="op">×</span>{equation.multiplier}
                <span className="op">=</span>{equation.result}
              </div>
              {equation.caption && <p className="equation-caption">{equation.caption}</p>}
            </div>
          )}

          {decodeItems && decodeItems.length > 0 && (
            <div className="decode">
              <dl>
                {decodeItems.map((d, i) => (
                  <div className="decode-row" key={i}><dt>{d.term}</dt><dd>{d.description}</dd></div>
                ))}
              </dl>
            </div>
          )}

          {sergelQuote && (
            <div className="registro">
              <p className="registro-label">Registro de Sergel</p>
              <p className="registro-text">{sergelQuote}</p>
            </div>
          )}
        </Reveal>
        )}
      </div>

      <style jsx>{`
        .ep-stage {
          position: relative;
          /* Transparente: se ve el starfield unificado (antes: fondo estelar propio). */
          background: transparent;
          overflow: hidden; padding: 4rem 0;
        }
        /* Starfield propio desactivado — usamos el canvas unificado detrás. */
        .ep-starfield {
          display: none;
        }
        :global(.ep-star) {
          position: absolute; border-radius: 50%; background: #e8e3d5; opacity: 0.35;
        }
        @keyframes ep-twinkle {
          0%, 100% { opacity: 0.15; } 50% { opacity: 0.65; }
        }
        .ep-content {
          position: relative; z-index: 1;
          max-width: 720px; margin: 0 auto; padding: 0 1.5rem;
        }
        :global(.reveal) {
          opacity: 0; transform: translateY(16px);
          transition: opacity 0.9s ease, transform 0.9s ease;
        }
        :global(.reveal.is-visible) { opacity: 1; transform: translateY(0); }

        /* Bloque (José / Sergel) — :global porque la clase va sobre <Reveal> */
        :global(.ep-block) {
          position: relative; background: #0e0f18; border: 1px solid #1b1c2a;
          padding: 2.2rem 1.8rem; margin-bottom: 3rem;
          font-family: var(--ep-eb-garamond), Georgia, serif;
          color: #e8e3d5;
        }
        :global(.ep-block p) { font-size: 1.08rem; line-height: 1.75; margin: 0 0 1rem; }
        :global(.ep-block p:last-child) { margin-bottom: 0; }
        /* Último bloque del stage sin margen inferior: así el espacio
           bloque→video queda igual al de video→bloque (solo el padding del stage). */
        :global(.ep-content > .ep-block:last-child) { margin-bottom: 0; }
        :global(.ep-block .corner-tr),
        :global(.ep-block .corner-bl) {
          position: absolute; width: 14px; height: 14px; border: 1px solid #4A3170;
        }
        :global(.ep-block .corner-tr) { top:-1px; right:-1px; border-left:none; border-bottom:none; }
        :global(.ep-block .corner-bl) { bottom:-1px; left:-1px; border-right:none; border-top:none; }
        :global(.ep-block .block-eyebrow) {
          font-family: var(--ep-space-mono), 'Courier New', monospace;
          font-size: 0.72rem; letter-spacing: 0.25em; text-transform: uppercase;
          color: #6D4A9B; margin: 0 0 1.1rem;
        }
        :global(.ep-block .voice) { color: #7c8088; letter-spacing: 0.2em; }

        :global(.ep-video) { margin-bottom: 3rem; }
        :global(.ep-video iframe), :global(.ep-video video) {
          width: 100%; aspect-ratio: 16/9; display: block; border: none;
        }

        :global(.ep-block .equation-panel) {
          margin: 1.6rem 0; padding: 1.6rem 1rem; background: #07070a;
          border-top: 1px solid #4A3170; border-bottom: 1px solid #4A3170; text-align: center;
        }
        :global(.ep-block .equation) {
          font-family: var(--ep-space-mono), 'Courier New', monospace;
          font-weight: 700; font-size: clamp(1.1rem, 4.2vw, 1.6rem);
          letter-spacing: 0.04em; color: #6D4A9B;
        }
        :global(.ep-block .equation .op) { color: #7c8088; margin: 0 0.35em; }
        :global(.ep-block .equation-caption) {
          font-family: var(--ep-space-mono), 'Courier New', monospace;
          font-size: 0.68rem; letter-spacing: 0.2em; color: #7c8088;
          margin-top: 0.8rem; text-transform: uppercase;
        }
        :global(.ep-block .decode) { margin-top: 1.6rem; padding-top: 1.4rem; border-top: 1px solid #1b1c2a; }
        :global(.ep-block .decode-row) { display: grid; grid-template-columns: auto 1fr; gap: 0.55rem 1rem; margin-bottom: 0.55rem; }
        :global(.ep-block .decode-row dt) {
          font-family: var(--ep-space-mono), 'Courier New', monospace;
          font-size: 0.9rem; color: #6D4A9B; white-space: nowrap;
        }
        :global(.ep-block .decode-row dd) { margin: 0; font-size: 0.98rem; line-height: 1.6; color: #e8e3d5; }
        :global(.ep-block .registro) {
          margin-top: 1.8rem; padding-top: 1.4rem; border-top: 1px solid #1b1c2a;
        }
        :global(.ep-block .registro-label) {
          font-family: var(--ep-space-mono), 'Courier New', monospace;
          font-size: 0.72rem; letter-spacing: 0.25em; text-transform: uppercase;
          color: #6D4A9B; margin: 0 0 0.9rem;
        }
        :global(.ep-block .registro-text) {
          font-style: italic; color: #cfc9ba;
        }
        /* Móvil: la ecuación no debe salirse del cuadro */
        @media (max-width: 480px) {
          :global(.ep-block .equation) { font-size: 0.82rem; letter-spacing: 0.01em; }
          :global(.ep-block .equation .op) { margin: 0 0.18em; }
          :global(.ep-block .equation-panel) { padding: 1.4rem 0.6rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.reveal) { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}
