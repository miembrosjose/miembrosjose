'use client';

// TEMPORADA 4 · EPISODIO 7 — EL MENSAJE PRIMORDIAL
//
// Cierre de temporada y bisagra hacia la segunda etapa de la plataforma.
// El módulo central es la alquimia de la perla: la herida no se niega, se
// envuelve y se transforma. El cierre conecta con bitácora, misión y objetivos.

import { useState } from 'react';
import ArchivoShell, { Reveal, Flow, KeyBox, TechNote, ModuleTitle } from './ArchivoShell';
import { ARCO_T4 } from './t4-arco';

const CLAVES: { k: string; texto: string }[] = [
  { k: 'Recordar', texto: 'Reconocer de dónde vienes y qué has venido a hacer.' },
  { k: 'Perdonar', texto: 'Transmutar la herida y disolver los velos de separación.' },
  { k: 'Servir', texto: 'Poner tu consciencia al servicio de la vida y de la red.' },
  { k: 'Preparar el nuevo tiempo', texto: 'Participar activamente en la construcción de una nueva humanidad.' },
];

const ETAPAS = ['MEMORIA', 'BITÁCORA', 'REVELACIÓN DE MISIÓN', 'OBJETIVOS DE LOS 144.000', 'PREPARACIÓN', 'PROTOCOLOS DE CONTACTO'];

// Capas de la perla: de la herida al nácar.
const CAPAS = [
  { r: 14, label: 'Herida' },
  { r: 26, label: 'Presencia' },
  { r: 38, label: 'Alquimia' },
  { r: 52, label: 'Perla' },
];

export default function MensajePrimordial() {
  const [capa, setCapa] = useState(3);

  return (
    <ArchivoShell
      guia="Ivika"
      voz="Memoria abierta"
      arco={{ pasos: ARCO_T4, actual: 7 }}
      lead="Después de recorrer memoria solar, civilizaciones, pactos, ley, iniciación y amor, todo se resume en una clave viva: el perdón. No como gesto superficial, sino como alquimia profunda capaz de transformar herida en consciencia y separación en servicio."
      registro="El verdadero mensaje primordial no consiste solamente en recordar una historia superior, sino en permitir que esa memoria transforme la forma en que te relacionas contigo, con los demás, con tu linaje, con tu territorio y con la vida misma. Allí comienza la misión."
    >
      <ModuleTitle>Alquimia del perdón</ModuleTitle>

      <div className="mp-canvas">
        <svg viewBox="0 0 220 220" className="mp-svg" role="img" aria-label="La perla: de la herida al nácar">
          <defs>
            <radialGradient id="mpPearl">
              <stop offset="0%" stopColor="rgba(230,207,149,0.10)" />
              <stop offset="70%" stopColor="rgba(230,207,149,0.22)" />
              <stop offset="100%" stopColor="rgba(217,184,102,0.06)" />
            </radialGradient>
          </defs>

          {[...CAPAS].reverse().map((c, ri) => {
            const i = CAPAS.length - 1 - ri;
            const on = capa === i;
            return (
              <g key={c.label} className={`mp-layer ${on ? 'is-on' : ''}`} onClick={() => setCapa(i)}
                 role="button" tabIndex={0}
                 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCapa(i); } }}
                 aria-label={c.label}>
                <circle cx={110} cy={110} r={c.r}
                  fill={i === 3 ? 'url(#mpPearl)' : i === 0 ? 'rgba(109,74,155,0.18)' : 'transparent'}
                  stroke={on ? 'var(--aa-gold)' : i === 0 ? 'var(--aa-violet-soft)' : 'var(--aa-gold-dim)'}
                  strokeWidth={on ? 1.5 : 0.8} />
              </g>
            );
          })}
          <circle cx={110} cy={110} r={5} fill="var(--aa-violet-pale)" />
          <circle cx={110} cy={110} r={66} fill="none" stroke="var(--aa-gold-dim)" strokeWidth={0.5} opacity={0.5} className="mp-glow" />
        </svg>

        <div className="mp-layers">
          {CAPAS.map((c, i) => (
            <button key={c.label} type="button" className={capa === i ? 'is-on' : ''} onClick={() => setCapa(i)}>
              {i > 0 && <span className="mp-layerArrow" aria-hidden>↓</span>}
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <Reveal>
        <p className="mp-pearlText">
          Así como una perla nace cuando una herida es envuelta, trabajada y transformada hasta convertirse en
          belleza, el perdón toma aquello que dolió, no para negarlo, sino para transmutarlo.
        </p>
      </Reveal>

      <Reveal>
        <KeyBox
          title="Lo que hace el perdón"
          formula={
            <>
              EL PERDÓN NO BORRA LA HISTORIA
              <br />
              <span className="op">·</span>
              <br />
              REORGANIZA SU ENERGÍA
            </>
          }
        />
      </Reveal>

      {/* Las cuatro claves */}
      <Reveal>
        <ModuleTitle>Las cuatro claves del mensaje primordial</ModuleTitle>
        <div className="mp-keys">
          {CLAVES.map((c, i) => (
            <div key={c.k} className="mp-key">
              <span className="mp-keyIdx">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <p className="mp-keyName">{c.k}</p>
                <p className="mp-keyText">{c.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* De la memoria a la misión */}
      <Reveal>
        <ModuleTitle>De la memoria a la misión</ModuleTitle>
        <div className="mp-mission">
          <p>
            La memoria no fue entregada para contemplarla pasivamente. Después de recordar, comienza la
            responsabilidad. Por eso el siguiente paso dentro de la plataforma es revelar la misión,
            profundizar la bitácora y prepararse para que lo sanado en uno pueda convertirse también en
            servicio para la red.
          </p>
          <ul className="mp-list">
            <li>Es muy importante <strong>actualizar la bitácora</strong>.</li>
            <li>Mientras más profunda y honesta sea la información registrada, más precisa podrá ser la revelación de la misión.</li>
            <li>Nada de lo que venimos a hacer afuera puede sostenerse si no comienza desde adentro.</li>
            <li>Primero se reconocen heridas, vínculos, linajes, memorias y procesos personales.</li>
            <li>Luego esa comprensión se lleva al territorio y a la red.</li>
            <li>Posteriormente se abren convocatorias y procesos de preparación para protocolos de contacto.</li>
          </ul>
        </div>
      </Reveal>

      {/* Segunda etapa */}
      <Reveal>
        <ModuleTitle>La segunda etapa</ModuleTitle>
        <div className="mp-stage">
          {ETAPAS.map((e, i) => (
            <div key={e} className="mp-stageItem">
              {i > 0 && <span className="mp-stageArrow" aria-hidden>↓</span>}
              <span className={`mp-stageNode ${i === 0 ? 'is-past' : ''} ${i === 1 ? 'is-now' : ''}`}>{e}</span>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <TechNote label="El cierre del camino">
          Todo este recorrido no fue entregado solo para recordar, sino para convertirse en una forma nueva de
          vivir y servir.
        </TechNote>
      </Reveal>

      <style jsx global>{`
        .mp-canvas {
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
          padding: 1.2rem 0.6rem; margin: 0 0 1.2rem;
          display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: center;
        }
        .mp-svg { display: block; width: 100%; max-width: 210px; height: auto; margin: 0 auto; }
        .mp-layer { cursor: pointer; }
        .mp-layer circle { transition: stroke 240ms ease, stroke-width 240ms ease; }
        .mp-glow { animation: mpGlow 5s ease-in-out infinite; }
        @keyframes mpGlow { 0%, 100% { opacity: 0.22; } 50% { opacity: 0.6; } }

        .mp-layers { display: flex; flex-direction: column; align-items: flex-start; gap: 0.1rem; }
        .mp-layers button {
          display: flex; flex-direction: column; align-items: flex-start; gap: 0.1rem;
          font-family: var(--aa-mono); font-size: 0.66rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-violet-pale);
          background: transparent; border: none; cursor: pointer; padding: 0.2rem 0;
          transition: color 200ms ease;
        }
        .mp-layers button.is-on { color: var(--aa-gold-soft); }
        .mp-layerArrow { font-size: 0.7rem; color: var(--aa-gold-dim); }

        .mp-pearlText {
          font-size: 0.98rem; line-height: 1.68; color: var(--aa-text); margin: 0 0 1.6rem;
        }

        .mp-keys { display: flex; flex-direction: column; gap: 0.5rem; margin: 0 0 1.7rem; }
        .mp-key {
          display: flex; align-items: flex-start; gap: 0.75rem;
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-gold-dim); padding: 0.8rem 0.9rem;
        }
        .mp-keyIdx { font-family: var(--aa-mono); font-size: 0.6rem; color: var(--aa-text-dim); padding-top: 0.2rem; }
        .mp-keyName {
          font-family: var(--aa-mono); font-size: 0.72rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.3rem;
        }
        .mp-keyText { font-size: 0.92rem; line-height: 1.55; color: var(--aa-text); margin: 0; }

        .mp-mission {
          margin: 0 0 1.7rem; padding: 1.2rem 1.1rem;
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-gold);
        }
        .mp-mission > p { font-size: 0.97rem; line-height: 1.68; color: var(--aa-text); margin: 0 0 0.9rem; }
        .mp-list { margin: 0; padding-left: 1.05rem; display: flex; flex-direction: column; gap: 0.42rem; }
        .mp-list li { font-size: 0.92rem; line-height: 1.55; color: var(--aa-text-soft); }
        .mp-list li::marker { color: var(--aa-gold-dim); }
        .mp-list strong { color: var(--aa-gold-soft); font-weight: 400; }

        .mp-stage {
          display: flex; flex-direction: column; align-items: center; gap: 0.15rem;
          margin: 0 0 1.7rem; padding: 1.3rem 0.9rem;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
        }
        .mp-stageItem { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; }
        .mp-stageArrow { font-family: var(--aa-mono); font-size: 0.85rem; color: var(--aa-gold-dim); }
        .mp-stageNode {
          font-family: var(--aa-mono); font-size: 0.68rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-gold-soft); text-align: center;
        }
        .mp-stageNode.is-past { color: var(--aa-violet-pale); opacity: 0.75; }
        .mp-stageNode.is-now {
          font-weight: 700; text-shadow: 0 0 14px rgba(217, 184, 102, 0.35);
        }

        @media (max-width: 560px) {
          .mp-canvas { grid-template-columns: 1fr; }
          .mp-layers { flex-direction: row; flex-wrap: wrap; justify-content: center; gap: 0.5rem; }
          .mp-layers button { flex-direction: row; align-items: center; gap: 0.3rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mp-glow { animation: none !important; opacity: 0.45 !important; }
          .mp-layer circle { transition: none !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
