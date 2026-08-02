'use client';

// Bloque "La Jerarquía Galáctica" — se muestra debajo del video del episodio
// homónimo (Temporada 2). Mismo lenguaje visual del bloque de Sergel
// (EpisodioBloque): fondo oscuro cósmico, violeta, bordes finos, etiquetas en
// Space Mono, cuerpo en EB Garamond, panel de ecuación y filas de desglose.
// Usa las fuentes cargadas en app/layout.tsx (--font-eb-garamond / -space-mono).

import { useEffect, useState } from 'react';

const NUEVE = [
  'Alcim', 'Gonamar', 'Leteon', 'Olmax', 'Oracel',
  'Ralbot', 'Sagñac', 'Sullantes', 'Sumesla',
];

const ANCIANOS = [
  'Amchall', 'Ankalara', 'Anko Bal', 'Archer', 'Asaraniel', 'Bropkol',
  'Chermot', 'Gresidas', 'Ilrusi', 'Ilsalani', 'Inmalam', 'Kimrasi',
  'Lembo', 'Lubieses', 'Oxil Kem', 'Preto', 'Ramanes', 'Sorcet',
  'Ulkuyumi', 'Umi Tamil', 'Urlasa', 'Yansiremo', 'Yemiasa', 'Yesolma',
];

const ESTRUCTURA = [
  {
    term: 'Consejo de los Nueve de Andrómeda',
    desc: 'Representa una instancia de coordinación intergaláctica dentro del Universo Local.',
  },
  {
    term: '24 Ancianos de la Galaxia',
    desc: 'Sostienen la supervisión evolutiva de la Vía Láctea y de los mundos que avanzan hacia procesos de mayor conciencia.',
  },
  {
    term: 'Gran Hermandad Blanca de la Estrella',
    desc: 'Surge de la integración de ambos grupos: 9 + 24 = 33 inteligencias de coordinación cósmica.',
  },
];

export default function JerarquiaGalactica() {
  const [stars, setStars] = useState<{ left: number; top: number; size: number; duration: number; delay: number }[]>([]);
  const [rm, setRm] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setRm(reduce);
    const count = window.innerWidth < 600 ? 45 : 80;
    setStars(Array.from({ length: count }, () => ({
      left: Math.random() * 100, top: Math.random() * 100,
      size: Math.random() * 1.6 + 0.6,
      duration: 3 + Math.random() * 5, delay: Math.random() * 5,
    })));
  }, []);

  return (
    <div className="jg-stage">
      <div className="jg-starfield">
        {stars.map((s, i) => (
          <span key={i} className="jg-star" style={{
            left: `${s.left}%`, top: `${s.top}%`,
            width: `${s.size}px`, height: `${s.size}px`,
            animation: rm ? 'none' : `jg-twinkle ${s.duration}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`, opacity: rm ? 0.3 : undefined,
          }} />
        ))}
      </div>

      <div className="jg-content">
        <div className="jg-block">
          <span className="corner-tr" /><span className="corner-bl" />

          <p className="jg-eyebrow">La Jerarquía Galáctica</p>

          <p>
            Dentro de la estructura de coordinación evolutiva de nuestro Universo Local se
            mencionan dos grupos principales: el Consejo de los Nueve de Andrómeda y los 24
            Ancianos de la Galaxia.
          </p>
          <p>
            El Consejo de los Nueve participa en una escala intergaláctica, mientras que los 24
            Ancianos sostienen una función de supervisión evolutiva dentro de la Vía Láctea. La
            integración de ambos grupos conforma un concilio de 33 inteligencias, asociado a la
            Gran Hermandad Blanca de la Estrella.
          </p>

          <div className="jg-group">
            <p className="jg-label">Consejo de los Nueve de Andrómeda</p>
            <ul className="jg-names">
              {NUEVE.map((n) => (
                <li key={n}><span className="jg-mark">✦</span>{n}</li>
              ))}
            </ul>
          </div>

          <div className="jg-group">
            <p className="jg-label">Los 24 Ancianos de la Galaxia</p>
            <ul className="jg-names">
              {ANCIANOS.map((n) => (
                <li key={n}><span className="jg-mark">✦</span>{n}</li>
              ))}
            </ul>
          </div>

          <div className="jg-equation-panel">
            <div className="jg-equation">
              9<span className="op">+</span>24<span className="op">=</span>33
            </div>
            <p className="jg-equation-caption">Gran Hermandad Blanca de la Estrella</p>
          </div>

          <div className="jg-structure">
            <p className="jg-label">Estructura general</p>
            <dl>
              {ESTRUCTURA.map((e) => (
                <div className="jg-row" key={e.term}>
                  <dt>{e.term}</dt>
                  <dd>{e.desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <style jsx>{`
        .jg-stage {
          position: relative;
          /* Fondo transparente: se ve el starfield unificado del área de miembros.
             Antes tenía su propio fondo estelar opaco (#07070a + estrellas CSS). */
          background: transparent;
          overflow: hidden;
          padding: 4rem 0;
        }
        /* Starfield propio desactivado — usamos el canvas unificado detrás. */
        .jg-starfield {
          display: none;
        }
        .jg-star {
          position: absolute; border-radius: 50%; background: #e8e3d5; opacity: 0.35;
        }
        @keyframes jg-twinkle {
          0%, 100% { opacity: 0.15; } 50% { opacity: 0.65; }
        }
        .jg-content {
          position: relative; z-index: 1;
          max-width: 720px; margin: 0 auto; padding: 0 1.5rem;
        }
        .jg-block {
          position: relative; background: #0e0f18; border: 1px solid #1b1c2a;
          padding: 2.2rem 1.8rem;
          font-family: var(--font-eb-garamond), Georgia, serif;
          color: #e8e3d5;
        }
        .jg-block p { font-size: 1.08rem; line-height: 1.75; margin: 0 0 1rem; }
        .corner-tr, .corner-bl {
          position: absolute; width: 14px; height: 14px; border: 1px solid #4A3170;
        }
        .corner-tr { top: -1px; right: -1px; border-left: none; border-bottom: none; }
        .corner-bl { bottom: -1px; left: -1px; border-right: none; border-top: none; }

        .jg-eyebrow {
          font-family: var(--font-space-mono), 'Courier New', monospace;
          font-size: 0.8rem; letter-spacing: 0.25em; text-transform: uppercase;
          color: #6D4A9B; margin: 0 0 1.4rem !important;
        }
        .jg-label {
          font-family: var(--font-space-mono), 'Courier New', monospace;
          font-size: 0.72rem; letter-spacing: 0.25em; text-transform: uppercase;
          color: #6D4A9B; margin: 0 0 1rem !important;
        }

        .jg-group { margin-top: 1.8rem; padding-top: 1.4rem; border-top: 1px solid #1b1c2a; }
        .jg-names {
          list-style: none; margin: 0; padding: 0;
          display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 0.55rem 1.2rem;
        }
        .jg-names li {
          display: flex; align-items: baseline; gap: 0.5rem;
          font-size: 1.02rem; line-height: 1.4; color: #cfc9ba;
        }
        .jg-mark { color: #6D4A9B; font-size: 0.7rem; flex: none; }

        .jg-equation-panel {
          margin: 1.9rem 0; padding: 1.6rem 1rem; background: #07070a;
          border-top: 1px solid #4A3170; border-bottom: 1px solid #4A3170; text-align: center;
        }
        .jg-equation {
          font-family: var(--font-space-mono), 'Courier New', monospace;
          font-weight: 700; font-size: clamp(1.3rem, 6vw, 2rem);
          letter-spacing: 0.04em; color: #6D4A9B;
        }
        .jg-equation .op { color: #7c8088; margin: 0 0.4em; }
        .jg-equation-caption {
          font-family: var(--font-space-mono), 'Courier New', monospace;
          font-size: 0.68rem; letter-spacing: 0.2em; color: #7c8088;
          margin: 0.8rem 0 0 !important; text-transform: uppercase;
        }

        .jg-structure { margin-top: 1.8rem; padding-top: 1.4rem; border-top: 1px solid #1b1c2a; }
        .jg-structure dl { margin: 0; }
        .jg-row {
          display: grid; grid-template-columns: 1fr; gap: 0.3rem;
          margin-bottom: 1.2rem;
        }
        .jg-row:last-child { margin-bottom: 0; }
        .jg-row dt {
          font-family: var(--font-space-mono), 'Courier New', monospace;
          font-size: 0.82rem; letter-spacing: 0.06em; color: #a78bca;
          text-transform: uppercase;
        }
        .jg-row dd { margin: 0; font-size: 1.02rem; line-height: 1.6; color: #e8e3d5; }

        @media (max-width: 480px) {
          .jg-equation { font-size: 1.2rem; letter-spacing: 0.01em; }
          .jg-equation .op { margin: 0 0.25em; }
          .jg-names { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .jg-star { animation: none !important; opacity: 0.3 !important; }
        }
      `}</style>
    </div>
  );
}
