'use client';

// TEMPORADA 2 · EPISODIO 6 — LA CONFEDERACIÓN GALÁCTICA
//
// Módulo central: red distribuida (parlamento), no cadena de mando. Los mundos
// se conectan al centro Y entre sí: la forma comunica que nadie manda sobre
// nadie. La Tierra es el nodo dorado, con su nombre Anglusahá.

import { useState } from 'react';
import ArchivoShell, { Reveal, Flow, KeyBox, ModuleTitle } from './ArchivoShell';

const CX = 170;
const CY = 165;
const RING = 112;

const NODOS = ['MUNDO', 'MUNDO', 'MUNDO', 'MUNDO', 'MUNDO', 'MUNDO', 'TIERRA'];

const CLAVES: { titulo: string; texto: string }[] = [
  { titulo: 'Identidad', texto: 'Cada civilización conserva su historia, cultura y perspectiva.' },
  { titulo: 'Resonancia', texto: 'Los mundos capaces de reconocerse como parte de una estructura mayor pueden relacionarse dentro de una misma red.' },
  { titulo: 'Coordinación', texto: 'Las decisiones que afectan varios mundos requieren espacios donde múltiples perspectivas puedan encontrarse.' },
];

const FUNCIONES: [string, string][] = [
  ['Observar', 'comprender procesos evolutivos'],
  ['Coordinar', 'relacionar funciones y mundos'],
  ['Preservar', 'sostener condiciones para la evolución'],
  ['Orientar', 'compartir conocimiento cuando corresponde'],
  ['Conectar', 'crear puentes entre civilizaciones'],
  ['Acompañar', 'favorecer autonomía en lugar de dependencia'],
];

export default function RedConfederacion() {
  const [sel, setSel] = useState<number | null>(6); // Tierra abierta por defecto

  const puntos = NODOS.map((label, i) => {
    const a = (Math.PI / 180) * (i * (360 / NODOS.length) - 90);
    return { label, i, x: CX + RING * Math.cos(a), y: CY + RING * Math.sin(a), tierra: label === 'TIERRA' };
  });

  return (
    <ArchivoShell
      lead="La Confederación Galáctica es una red de civilizaciones, mundos y consciencias capaces de participar de una estructura común de coordinación sin perder la identidad de cada planeta. Su arquitectura permite que civilizaciones diferentes participen de decisiones comunes sin perder aquello que las hace distintas."
      registro="El contacto entre civilizaciones comienza cuando la identidad deja de ser una frontera y se convierte en una contribución a la red."
    >
      <ModuleTitle>Parlamento de mundos</ModuleTitle>

      <div className="rc-canvas">
        <svg viewBox="0 0 340 330" className="rc-svg" role="img" aria-label="Red distribuida de mundos alrededor de la Confederación">
          {/* Malla entre vecinos — la red no es sólo radial */}
          {puntos.map((p, i) => {
            const q = puntos[(i + 1) % puntos.length];
            return <line key={`m-${i}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="var(--aa-violet-deep)" strokeWidth={0.6} opacity={0.45} />;
          })}
          {/* Radios al centro */}
          {puntos.map((p) => (
            <line
              key={`r-${p.i}`}
              x1={CX} y1={CY} x2={p.x} y2={p.y}
              stroke={p.tierra ? 'var(--aa-gold)' : 'var(--aa-violet-deep)'}
              strokeWidth={p.tierra ? 1.2 : 0.7}
              opacity={p.tierra ? 0.85 : 0.5}
            />
          ))}

          {/* Centro */}
          <circle cx={CX} cy={CY} r={38} fill="rgba(217,184,102,0.06)" stroke="var(--aa-gold-dim)" strokeWidth={1} />
          <text x={CX} y={CY - 2} className="rc-centerLabel">CONFEDE-</text>
          <text x={CX} y={CY + 10} className="rc-centerLabel">RACIÓN</text>

          {puntos.map((p) => {
            const on = sel === p.i;
            return (
              <g
                key={p.i}
                className={`rc-node ${on ? 'is-on' : ''}`}
                onClick={() => setSel(on ? null : p.i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(on ? null : p.i); } }}
                aria-label={p.tierra ? 'Tierra — Anglusahá' : `Mundo ${p.i + 1}`}
              >
                <circle
                  cx={p.x} cy={p.y} r={p.tierra ? 22 : 17}
                  fill={p.tierra ? 'rgba(217,184,102,0.16)' : on ? 'rgba(109,74,155,0.2)' : 'var(--aa-inner-2)'}
                  stroke={p.tierra ? 'var(--aa-gold)' : on ? 'var(--aa-violet-pale)' : 'var(--aa-violet-deep)'}
                  strokeWidth={p.tierra ? 1.5 : 0.9}
                  className={p.tierra ? 'rc-earth' : undefined}
                />
                <text x={p.x} y={p.y + 3.5} className={`rc-nodeLabel ${p.tierra ? 'is-earth' : ''}`}>
                  {p.tierra ? 'TIERRA' : '◦'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Nodo destacado: Tierra */}
      {sel === 6 && (
        <div className="rc-earthCard">
          <p className="rc-earthName">Tierra</p>
          <p className="rc-earthAlt">Anglusahá</p>
          <p className="rc-earthTag">La perla azul</p>
          <p className="rc-earthText">
            Anglusahá es uno de los nombres con los que las civilizaciones vinculadas a su proceso se refieren a
            la Tierra.
          </p>
        </div>
      )}
      {sel !== null && sel !== 6 && (
        <div className="rc-worldCard">
          <p className="rc-worldName">Mundo participante</p>
          <p className="rc-worldText">
            Cada nodo de la red conserva su identidad propia. La pertenencia no exige renunciar a la historia,
            la cultura ni la perspectiva de la civilización que participa.
          </p>
        </div>
      )}

      {/* Tres claves */}
      <Reveal>
        <div className="rc-keys">
          {CLAVES.map((c, i) => (
            <div key={i} className="rc-key">
              <p className="rc-keyTitle">{c.titulo}</p>
              <p className="rc-keyText">{c.texto}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <KeyBox
          title="Principio de organización"
          formula={<>UNIDAD <span className="op">≠</span> UNIFORMIDAD</>}
          text="La Confederación puede contener desacuerdo. Su principio de organización consiste en permitir que la diferencia aporte información al conjunto sin convertirse automáticamente en enemistad."
        />
      </Reveal>

      {/* Seis funciones */}
      <Reveal>
        <ModuleTitle>Seis funciones</ModuleTitle>
        <div className="rc-funcs">
          {FUNCIONES.map(([k, v], i) => (
            <div key={i} className="rc-func">
              <span className="rc-funcIdx">{String(i + 1).padStart(2, '0')}</span>
              <span className="rc-funcK">{k}</span>
              <span className="rc-funcV">{v}</span>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <Flow
          label="El umbral de la humanidad"
          steps={['SUPERVIVENCIA', 'CONSCIENCIA PLANETARIA', 'IDENTIDAD COMÚN', 'PARTICIPACIÓN GALÁCTICA']}
        />
        <p className="rc-umbralText">
          Una especie comienza a estar preparada para estructuras mayores cuando puede reconocerse como
          humanidad antes que únicamente como grupos enfrentados dentro de un mismo mundo.
        </p>
      </Reveal>

      <style jsx global>{`
        .rc-canvas {
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim);
          border-bottom: 1px solid var(--aa-gold-dim);
          padding: 1rem 0.4rem; margin: 0 0 1.2rem;
        }
        .rc-svg { display: block; width: 100%; max-width: 340px; height: auto; margin: 0 auto; }
        .rc-node { cursor: pointer; }
        .rc-node circle { transition: fill 240ms ease, stroke 240ms ease; }
        .rc-node:focus-visible circle { stroke-dasharray: 3 2; }
        .rc-earth { filter: drop-shadow(0 0 10px rgba(217, 184, 102, 0.4)); }
        .rc-centerLabel {
          font-family: var(--aa-mono); font-size: 9px; letter-spacing: 0.14em;
          text-anchor: middle; fill: var(--aa-gold); pointer-events: none;
        }
        .rc-nodeLabel {
          font-family: var(--aa-mono); font-size: 8px; letter-spacing: 0.12em;
          text-anchor: middle; fill: var(--aa-violet-pale); pointer-events: none;
        }
        .rc-nodeLabel.is-earth { fill: var(--aa-gold-soft); font-size: 8.5px; }

        .rc-earthCard, .rc-worldCard {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          padding: 1.1rem 1.2rem; margin: 0 0 1.6rem;
          animation: rcIn 420ms ease both;
        }
        @keyframes rcIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .rc-earthCard { border-left: 2px solid var(--aa-gold); }
        .rc-worldCard { border-left: 2px solid var(--aa-violet-deep); }
        .rc-earthName {
          font-family: var(--aa-mono); font-size: 0.8rem; letter-spacing: 0.22em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0 0 0.2rem;
        }
        .rc-earthAlt {
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.25rem;
          letter-spacing: 0.1em; color: var(--aa-gold-soft); margin: 0 0 0.2rem;
        }
        .rc-earthTag {
          font-family: var(--aa-mono); font-size: 0.62rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-violet-pale); margin: 0 0 0.75rem;
        }
        .rc-earthText, .rc-worldText { font-size: 0.96rem; line-height: 1.65; color: var(--aa-text); margin: 0; }
        .rc-worldName {
          font-family: var(--aa-mono); font-size: 0.7rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-violet-pale); margin: 0 0 0.5rem;
        }

        .rc-keys { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; margin: 0 0 1.8rem; }
        .rc-key {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-top: 2px solid var(--aa-gold-dim); padding: 0.85rem 0.8rem;
        }
        .rc-keyTitle {
          font-family: var(--aa-mono); font-size: 0.66rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.45rem;
        }
        .rc-keyText { font-size: 0.87rem; line-height: 1.5; color: var(--aa-text); margin: 0; }

        .rc-funcs { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 0 0 1.8rem; }
        .rc-func {
          display: flex; flex-direction: column; gap: 0.2rem;
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-violet-deep); padding: 0.65rem 0.75rem;
        }
        .rc-funcIdx { font-family: var(--aa-mono); font-size: 0.56rem; color: var(--aa-text-dim); }
        .rc-funcK {
          font-family: var(--aa-mono); font-size: 0.7rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-gold-soft);
        }
        .rc-funcV { font-size: 0.85rem; line-height: 1.45; color: var(--aa-text); }

        .rc-umbralText { font-size: 0.96rem; line-height: 1.65; color: var(--aa-text); margin: -0.4rem 0 1.6rem; }

        @media (max-width: 560px) {
          .rc-keys { grid-template-columns: 1fr; }
          .rc-funcs { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .rc-earthCard, .rc-worldCard { animation: none !important; }
          .rc-node circle { transition: none !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
