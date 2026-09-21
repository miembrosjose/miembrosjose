'use client';

// TEMPORADA 4 · EPISODIO 6 — JESÚS / LA LLAVE DEL AMOR
//
// Mandala solar: núcleo de amor, perdón y servicio; anillo de doce leído como
// código de totalidad; cuatro nodos simbólicos alrededor (tres días, cruz, sol,
// resurrección). El 12 se presenta como lectura simbólica, no como doctrina.

import { useState } from 'react';
import ArchivoShell, { Reveal, Flow, TechNote, SourceBlock, ModuleTitle } from './ArchivoShell';
import { ARCO_T4 } from './t4-arco';

type Nodo = { k: string; titulo: string; lineas: string[]; a: number };

const NODOS: Nodo[] = [
  { k: 'dias', titulo: '3 días', lineas: ['muerte', 'tránsito', 'resurrección'], a: -90 },
  { k: 'cruz', titulo: 'Cruz', lineas: ['cielo ↔ tierra', 'materia ↔ espíritu', 'tiempo ↔ eternidad'], a: 0 },
  { k: 'sol', titulo: 'Sol', lineas: ['luz', 'renacimiento', 'consciencia crística', 'irradiación'], a: 90 },
  { k: 'resu', titulo: 'Resurrección', lineas: ['triunfo del espíritu', 'continuidad de la vida', 'nueva posibilidad humana'], a: 180 },
];

const LLAVE: [string, string][] = [
  ['amar', 'sin apropiación'],
  ['servir', 'sin superioridad'],
  ['perdonar', 'sin cálculo'],
  ['entregarse', 'sin perder la verdad'],
];

const CX = 170, CY = 170, R12 = 92, RN = 142;

export default function CodigoJesus() {
  const [sel, setSel] = useState(0);
  const n = NODOS[sel];

  return (
    <ArchivoShell
      guia="Ivika"
      voz="Memoria abierta"
      arco={{ pasos: ARCO_T4, actual: 6 }}
      lead="Jesús representa una apertura decisiva en la historia espiritual de la humanidad. En él convergen linaje, pacto, ley, iniciación, compasión y una revelación superior: el amor como fuerza de transformación y el perdón como su manifestación más alta."
      registro="Jesús no vino únicamente a fundar una creencia, sino a mostrar que el ser humano puede elevar su condición cuando el amor deja de ser emoción pasajera y se convierte en una fuerza consciente de transformación."
    >
      <ModuleTitle>El código de Jesús</ModuleTitle>

      <div className="cj-canvas">
        <svg viewBox="0 0 340 340" className="cj-svg" role="img" aria-label="Mandala del código: amor, perdón y servicio en el centro">
          <defs>
            <radialGradient id="cjCore">
              <stop offset="0%" stopColor="rgba(230,207,149,0.30)" />
              <stop offset="100%" stopColor="rgba(217,184,102,0.04)" />
            </radialGradient>
          </defs>

          {/* Rayos solares */}
          {Array.from({ length: 24 }, (_, i) => {
            const a = (Math.PI / 180) * (i * 15);
            return (
              <line key={i}
                x1={CX + 58 * Math.cos(a)} y1={CY + 58 * Math.sin(a)}
                x2={CX + (i % 2 ? 70 : 78) * Math.cos(a)} y2={CY + (i % 2 ? 70 : 78) * Math.sin(a)}
                stroke="var(--aa-gold-dim)" strokeWidth={0.7} opacity={0.6} />
            );
          })}

          {/* Anillo de 12 */}
          <circle cx={CX} cy={CY} r={R12} fill="none" stroke="var(--aa-violet-deep)" strokeWidth={0.6} opacity={0.6} />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (Math.PI / 180) * (i * 30 - 90);
            return (
              <g key={i}>
                <circle cx={CX + R12 * Math.cos(a)} cy={CY + R12 * Math.sin(a)} r={5}
                  fill="var(--aa-inner-2)" stroke="var(--aa-violet-pale)" strokeWidth={0.8} />
                <text x={CX + R12 * Math.cos(a)} y={CY + R12 * Math.sin(a) + 2.6} className="cj-twelve">{i + 1}</text>
              </g>
            );
          })}

          {/* Núcleo */}
          <circle cx={CX} cy={CY} r={56} fill="url(#cjCore)" stroke="var(--aa-gold)" strokeWidth={1.2} className="cj-core" />
          <text x={CX} y={CY - 10} className="cj-coreWord">AMOR</text>
          <text x={CX} y={CY + 3} className="cj-coreWord">PERDÓN</text>
          <text x={CX} y={CY + 16} className="cj-coreWord">SERVICIO</text>

          {/* Cuatro nodos simbólicos */}
          {NODOS.map((nd, i) => {
            const a = (Math.PI / 180) * nd.a;
            const x = CX + RN * Math.cos(a);
            const y = CY + RN * Math.sin(a);
            const on = sel === i;
            return (
              <g key={nd.k} className={`cj-node ${on ? 'is-on' : ''}`} onClick={() => setSel(i)}
                 role="button" tabIndex={0}
                 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(i); } }}
                 aria-label={nd.titulo}>
                <circle cx={x} cy={y} r={on ? 18 : 15}
                  fill={on ? 'rgba(217,184,102,0.16)' : 'var(--aa-inner-2)'}
                  stroke={on ? 'var(--aa-gold)' : 'var(--aa-violet-deep)'} strokeWidth={on ? 1.4 : 0.9} />
                <text x={x} y={y + 3} className={`cj-nodeLabel ${on ? 'is-on' : ''}`}>
                  {nd.k === 'dias' ? '3' : nd.k === 'cruz' ? '✛' : nd.k === 'sol' ? '☉' : '↑'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="cj-card" key={sel}>
        <p className="cj-cardTitle">{n.titulo}</p>
        <div className="cj-cardLines">
          {n.lineas.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>

      <Reveal>
        <SourceBlock tipo="simbolica">
          <p>
            El anillo de doce se lee aquí como <strong>código de totalidad, orden y manifestación</strong> —
            apóstoles, signos, portales del camino humano—. Es lectura simbólica, no doctrina oficial.
          </p>
        </SourceBlock>
      </Reveal>

      {/* La llave */}
      <Reveal>
        <ModuleTitle>Jesús como llave</ModuleTitle>
        <p className="cj-keyIntro">No vino solamente a enseñar. Vino a encarnar un código.</p>
        <div className="cj-keys">
          {LLAVE.map(([verbo, limite]) => (
            <div key={verbo} className="cj-key">
              <span className="cj-keyVerb">{verbo}</span>
              <span className="cj-keyLimit">{limite}</span>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="cj-door">
          <p className="cj-doorText">
            El amor abre la puerta; el perdón es la llave viva que lo vuelve operativo dentro de la materia.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <Flow label="Del maestro al camino" steps={['ADMIRAR', 'COMPRENDER', 'PRACTICAR', 'ENCARNAR']} />
      </Reveal>

      <Reveal>
        <TechNote label="La diferencia">
          Un maestro admirado permanece afuera. Un camino comprendido se recorre. Jesús se ofrece como
          camino, no como estatua.
        </TechNote>
      </Reveal>

      <style jsx global>{`
        .cj-canvas {
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
          padding: 1rem 0.4rem; margin: 0 0 1.1rem;
        }
        .cj-svg { display: block; width: 100%; max-width: 340px; height: auto; margin: 0 auto; }
        .cj-core { filter: drop-shadow(0 0 18px rgba(217, 184, 102, 0.28)); }
        .cj-coreWord {
          font-family: var(--aa-mono); font-size: 10px; letter-spacing: 0.2em;
          text-anchor: middle; fill: var(--aa-gold-soft); pointer-events: none;
        }
        .cj-twelve {
          font-family: var(--aa-mono); font-size: 6.5px; text-anchor: middle;
          fill: var(--aa-violet-pale); pointer-events: none;
        }
        .cj-node { cursor: pointer; }
        .cj-node circle { transition: fill 240ms ease, stroke 240ms ease, r 240ms ease; }
        .cj-nodeLabel {
          font-family: var(--aa-mono); font-size: 11px; text-anchor: middle;
          fill: var(--aa-violet-pale); pointer-events: none;
        }
        .cj-nodeLabel.is-on { fill: var(--aa-gold-soft); }

        .cj-card {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-gold); padding: 1rem 1.15rem; margin: 0 0 1.7rem;
          animation: cjIn 400ms ease both;
        }
        @keyframes cjIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        .cj-cardTitle {
          font-family: var(--aa-mono); font-size: 0.82rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.6rem;
        }
        .cj-cardLines { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .cj-cardLines span {
          font-family: var(--aa-mono); font-size: 0.64rem; letter-spacing: 0.1em;
          color: #cbb9e6; background: var(--aa-violet-ghost);
          border: 1px solid var(--aa-violet-deep); padding: 0.3rem 0.62rem;
          border-radius: 999px !important;
        }

        .cj-keyIntro {
          font-size: 0.97rem; line-height: 1.6; color: var(--aa-text-soft);
          text-align: center; margin: -0.5rem 0 1rem;
        }
        .cj-keys { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 0 0 1.6rem; }
        .cj-key {
          display: flex; flex-direction: column; gap: 0.2rem; text-align: center;
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-top: 2px solid var(--aa-gold-dim); padding: 0.85rem 0.7rem;
        }
        .cj-keyVerb {
          font-family: var(--aa-mono); font-size: 0.76rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-gold-soft);
        }
        .cj-keyLimit { font-size: 0.86rem; color: var(--aa-text-dim); font-style: italic; }

        .cj-door {
          margin: 0 0 1.6rem; padding: 1.4rem 1.1rem; text-align: center;
          background: rgba(217, 184, 102, 0.05); border: 1px solid var(--aa-gold-dim);
        }
        .cj-doorText {
          font-family: var(--aa-eb-garamond), Georgia, serif; font-style: italic;
          font-size: clamp(1.02rem, 4vw, 1.2rem); line-height: 1.58;
          color: var(--aa-gold-soft); margin: 0;
        }

        @media (max-width: 560px) {
          .cj-keys { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cj-card { animation: none !important; }
          .cj-node circle { transition: none !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
