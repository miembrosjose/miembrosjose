'use client';

// TEMPORADA 2 · EPISODIO 5 — LAS SIETE LEYES UNIVERSALES
//
// Módulo central: rueda de siete nodos orbitando CONSCIENCIA. Seleccionar un
// nodo abre su ficha (clave, descripción, trabajo asociado). En móvil la rueda
// se mantiene —escala bien— y funciona como selector de la tarjeta activa.
//
// Cierre: la rueda leída como secuencia cíclica, para mostrar que no son siete
// reglas aisladas sino un sistema que vuelve sobre sí mismo.

import { useState } from 'react';
import ArchivoShell, { Reveal, KeyBox, ModuleTitle } from './ArchivoShell';

type Ley = { n: string; nombre: string; clave: string; desc: string; trabajo: string[] };

const LEYES: Ley[] = [
  {
    n: '01', nombre: 'Mentalismo', clave: 'CREENCIA → DIRECCIÓN',
    desc: 'La mente orienta percepción, intención y acción. Aquello que sostenemos internamente modifica la manera en que participamos de la realidad.',
    trabajo: ['concentración', 'voluntad', 'sabiduría'],
  },
  {
    n: '02', nombre: 'Correspondencia', clave: 'PARTE ↔ TOTALIDAD',
    desc: 'Los patrones pueden repetirse entre diferentes escalas. Comprender una estructura local puede ayudarnos a reconocer relaciones presentes en sistemas mayores.',
    trabajo: ['consciencia', 'discernimiento', 'intuición'],
  },
  {
    n: '03', nombre: 'Vibración', clave: 'ESTADO → EXPRESIÓN',
    desc: 'Toda expresión transmite la cualidad del estado que la origina. Palabra, emoción y conducta producen efectos dentro de la red con la que interactúan.',
    trabajo: ['respiración', 'inteligencia', 'pureza'],
  },
  {
    n: '04', nombre: 'Polaridad', clave: 'CONTRASTE → INTEGRACIÓN',
    desc: 'La polaridad permite distinguir extremos, generar tensión y encontrar nuevas posibilidades de síntesis.',
    trabajo: ['perseverancia', 'tolerancia', 'convicción'],
  },
  {
    n: '05', nombre: 'Ritmo', clave: 'CICLO → EQUILIBRIO',
    desc: 'Los procesos atraviesan expansión, pausa, contracción y reorganización. Reconocer el ciclo evita confundir una fase con el proceso completo.',
    trabajo: ['fe', 'paciencia', 'esperanza'],
  },
  {
    n: '06', nombre: 'Causa y efecto', clave: 'ELECCIÓN → CONSECUENCIA',
    desc: 'Cada pensamiento, palabra y acción introduce información dentro de una red de consecuencias.',
    trabajo: ['servicio', 'discernimiento', 'bondad', 'decisión'],
  },
  {
    n: '07', nombre: 'Generación', clave: 'RELACIÓN → CREACIÓN',
    desc: 'La creación surge mediante interacción y complementariedad. La relación entre diferencias puede producir algo que ninguna de las partes generaría aisladamente.',
    trabajo: ['comprensión', 'tolerancia', 'respeto', 'amor'],
  },
];

const SECUENCIA = ['MENTE', 'EXPRESIÓN', 'CONTRASTE', 'RITMO', 'CONSECUENCIA', 'NUEVA CREACIÓN'];

const CX = 160;
const CY = 160;
const RING = 112;

export default function RuedaLeyes() {
  const [sel, setSel] = useState(0);
  const ley = LEYES[sel];

  const nodes = LEYES.map((l, i) => {
    const a = (Math.PI / 180) * (i * (360 / 7) - 90);
    return { ...l, i, x: CX + RING * Math.cos(a), y: CY + RING * Math.sin(a) };
  });

  return (
    <ArchivoShell
      lead="Las siete leyes describen relaciones que se repiten en toda experiencia. Importan cuando empiezas a reconocerlas actuando a la vez en tus decisiones y tus vínculos."
      registro="Cuando una ley se comprende profundamente, aquello que antes parecía azar comienza a revelar nuestra participación."
    >
      <ModuleTitle>Rueda de las siete leyes</ModuleTitle>

      <div className="rl-canvas">
        <svg viewBox="0 0 320 320" className="rl-svg" role="img" aria-label="Siete leyes universales orbitando la consciencia">
          <circle cx={CX} cy={CY} r={RING} fill="none" stroke="var(--aa-violet-deep)" strokeWidth={0.8} opacity={0.65} />

          {nodes.map((n) => (
            <line
              key={`l-${n.i}`}
              x1={CX} y1={CY} x2={n.x} y2={n.y}
              stroke={sel === n.i ? 'var(--aa-gold)' : 'var(--aa-violet-deep)'}
              strokeWidth={sel === n.i ? 1.2 : 0.6}
              opacity={sel === n.i ? 0.9 : 0.4}
              className="rl-spoke"
            />
          ))}

          {/* Centro */}
          <circle cx={CX} cy={CY} r={40} fill="rgba(217,184,102,0.06)" stroke="var(--aa-gold-dim)" strokeWidth={1} />
          <text x={CX} y={CY - 2} className="rl-centerLabel">CONS-</text>
          <text x={CX} y={CY + 11} className="rl-centerLabel">CIENCIA</text>

          {nodes.map((n) => {
            const on = sel === n.i;
            return (
              <g
                key={n.i}
                className={`rl-node ${on ? 'is-on' : ''}`}
                onClick={() => setSel(n.i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(n.i); } }}
                aria-label={n.nombre}
              >
                <circle cx={n.x} cy={n.y} r={21} fill={on ? 'rgba(217,184,102,0.14)' : 'var(--aa-inner-2)'} stroke={on ? 'var(--aa-gold)' : 'var(--aa-violet-deep)'} strokeWidth={on ? 1.5 : 0.9} />
                <text x={n.x} y={n.y + 4} className={`rl-nodeNum ${on ? 'is-on' : ''}`}>{n.n}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Ficha de la ley activa */}
      <div className="rl-card" key={sel}>
        <div className="rl-cardHead">
          <span className="rl-cardNum">{ley.n}</span>
          <span className="rl-cardName">{ley.nombre}</span>
        </div>
        <p className="rl-cardClave">{ley.clave}</p>
        <p className="rl-cardDesc">{ley.desc}</p>
        <p className="rl-workLabel">Trabajo</p>
        <div className="rl-work">
          {ley.trabajo.map((t, i) => (
            <span key={i} className="rl-workChip">{t}</span>
          ))}
        </div>
      </div>

      {/* Selector lineal — accesible y cómodo en móvil */}
      <div className="rl-picker" role="tablist" aria-label="Seleccionar ley">
        {LEYES.map((l, i) => (
          <button key={i} type="button" role="tab" aria-selected={sel === i} className={sel === i ? 'is-on' : ''} onClick={() => setSel(i)}>
            {l.n}
          </button>
        ))}
      </div>

      {/* La rueda leída como secuencia */}
      <Reveal>
        <div className="rl-seq">
          <p className="rl-seqLabel">La rueda como secuencia</p>
          <div className="rl-seqRow">
            {SECUENCIA.map((s, i) => (
              <span key={i} className="rl-seqItem">
                {i > 0 && <span className="rl-seqArrow" aria-hidden>→</span>}
                <span className="rl-seqNode">{s}</span>
              </span>
            ))}
            <span className="rl-seqItem">
              <span className="rl-seqArrow is-loop" aria-hidden>↺</span>
              <span className="rl-seqNode is-loop">MENTE</span>
            </span>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <KeyBox
          title="Lectura del conjunto"
          formula={<>NO SON 7 REGLAS AISLADAS</>}
          lines={['SON UN SISTEMA']}
        />
      </Reveal>

      <style jsx global>{`
        .rl-canvas {
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim);
          border-bottom: 1px solid var(--aa-gold-dim);
          padding: 1rem 0.5rem; margin: 0 0 1.2rem;
        }
        .rl-svg { display: block; width: 100%; max-width: 320px; height: auto; margin: 0 auto; }
        .rl-node { cursor: pointer; }
        .rl-node circle { transition: fill 240ms ease, stroke 240ms ease, stroke-width 240ms ease; }
        .rl-node:focus-visible circle { stroke-dasharray: 3 2; }
        .rl-spoke { transition: stroke 240ms ease, opacity 240ms ease; }
        .rl-nodeNum {
          font-family: var(--aa-mono); font-weight: 700; font-size: 11px;
          text-anchor: middle; fill: var(--aa-violet-pale); pointer-events: none;
        }
        .rl-nodeNum.is-on { fill: var(--aa-gold-soft); }
        .rl-centerLabel {
          font-family: var(--aa-mono); font-size: 9.5px; letter-spacing: 0.16em;
          text-anchor: middle; fill: var(--aa-gold); pointer-events: none;
        }

        .rl-card {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-gold); padding: 1.15rem 1.2rem;
          margin: 0 0 0.9rem; animation: rlIn 420ms ease both;
        }
        @keyframes rlIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .rl-cardHead { display: flex; align-items: baseline; gap: 0.7rem; margin: 0 0 0.5rem; }
        .rl-cardNum { font-family: var(--aa-mono); font-weight: 700; font-size: 1.3rem; color: var(--aa-gold-soft); }
        .rl-cardName {
          font-family: var(--aa-mono); font-size: 0.82rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-gold);
        }
        .rl-cardClave {
          font-family: var(--aa-mono); font-size: 0.68rem; letter-spacing: 0.12em;
          color: var(--aa-violet-pale); margin: 0 0 0.8rem;
        }
        .rl-cardDesc { font-size: 0.98rem; line-height: 1.65; color: var(--aa-text); margin: 0 0 0.9rem; }
        .rl-workLabel {
          font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-text-dim); margin: 0 0 0.45rem;
        }
        .rl-work { display: flex; flex-wrap: wrap; gap: 0.35rem; }
        .rl-workChip {
          font-family: var(--aa-mono); font-size: 0.62rem; letter-spacing: 0.08em;
          color: #cbb9e6; background: var(--aa-violet-ghost);
          border: 1px solid var(--aa-violet-deep); padding: 0.28rem 0.6rem;
          border-radius: 999px !important;
        }

        .rl-picker { display: flex; justify-content: center; gap: 0.3rem; flex-wrap: wrap; margin: 0 0 1.8rem; }
        .rl-picker button {
          font-family: var(--aa-mono); font-size: 0.62rem; letter-spacing: 0.1em;
          color: var(--aa-text-dim); background: transparent;
          border: 1px solid var(--aa-line); padding: 0.3rem 0.55rem;
          cursor: pointer; border-radius: 999px !important;
          transition: color 200ms ease, border-color 200ms ease;
        }
        .rl-picker button.is-on { color: var(--aa-gold-soft); border-color: var(--aa-gold-dim); }

        .rl-seq {
          margin: 0 0 1.8rem; padding: 1.2rem 0.8rem;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
        }
        .rl-seqLabel {
          font-family: var(--aa-mono); font-size: 0.64rem; letter-spacing: 0.22em;
          text-transform: uppercase; color: var(--aa-text-dim); text-align: center; margin: 0 0 0.9rem;
        }
        .rl-seqRow { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0.2rem; }
        .rl-seqItem { display: inline-flex; align-items: center; gap: 0.2rem; }
        .rl-seqArrow { font-family: var(--aa-mono); font-size: 0.75rem; color: var(--aa-gold-dim); }
        .rl-seqArrow.is-loop { color: var(--aa-gold); }
        .rl-seqNode {
          font-family: var(--aa-mono); font-size: 0.64rem; letter-spacing: 0.1em;
          color: var(--aa-gold-soft); padding: 0.26rem 0.45rem;
        }
        .rl-seqNode.is-loop { color: var(--aa-violet-pale); }

        @media (max-width: 560px) {
          .rl-canvas { padding: 0.8rem 0.2rem; }
          .rl-card { padding: 1rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .rl-card { animation: none !important; }
          .rl-node circle, .rl-spoke { transition: none !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
