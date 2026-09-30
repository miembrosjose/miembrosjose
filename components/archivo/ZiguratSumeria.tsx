'use client';

// TEMPORADA 4 · EPISODIO 2 — SUMERIA
//
// Zigurat del conocimiento: cuatro niveles escalonados, seleccionables. Se lee
// de abajo arriba (tierra → orden → transmisión → instructores), que es también
// el orden en que la memoria desciende a la civilización.
//
// Enki y Enlil NO se presentan como bueno y malo: son dos principios en tensión.

import { useState } from 'react';
import ArchivoShell, { Reveal, Flow, KeyBox, TechNote, SourceBlock, ModuleTitle } from './ArchivoShell';
import { ARCO_T4 } from './t4-arco';

type Nivel = { n: number; titulo: string; claves: string[]; texto: string };

// Índice 0 = nivel superior (se dibuja arriba).
const NIVELES: Nivel[] = [
  {
    n: 4, titulo: 'Genetistas / dioses civilizadores',
    claves: ['Enki', 'Enlil', 'Anu', 'Ninhursag'],
    texto: 'Aquí están las figuras civilizadoras: quienes entregan técnica, norma y linaje a un mundo que empieza a organizarse.',
  },
  {
    n: 3, titulo: 'Transmisión',
    claves: ['escritura', 'tablillas', 'registro', 'memoria codificada'],
    texto: 'La escritura es el descenso de la memoria a la materia: lo que antes se sostenía en la voz pasa a sostenerse en la arcilla.',
  },
  {
    n: 2, titulo: 'Orden',
    claves: ['calendario', 'organización', 'ley', 'templo'],
    texto: 'El templo funciona como eje entre cielo y tierra; el calendario y la ley convierten el tiempo y la conducta en estructura compartida.',
  },
  {
    n: 1, titulo: 'Tierra',
    claves: ['agricultura', 'agua', 'asentamiento', 'ciudad'],
    texto: 'Todo comienza en el suelo: el agua conducida, la siembra, el asentamiento. La ciudad aparece como una geometría de poder.',
  },
];

const W = 320;
const LEVEL_H = 46;

export default function ZiguratSumeria() {
  const [sel, setSel] = useState(3); // base
  const lv = NIVELES[sel];

  return (
    <ArchivoShell
      guia="Ivika"
      voz="Memoria abierta"
      arco={{ pasos: ARCO_T4, actual: 2 }}
      lead="Parte del conocimiento guardado en los retiros vuelve a la historia visible por Sumeria, donde cielo, genética, poder, ciudad y escritura quedan anudados."
      registro="En Sumeria la memoria comenzó a escribirse, pero al mismo tiempo el poder aprendió a custodiar el conocimiento y a decidir quién podía acceder a él."
    >
      <ModuleTitle>Zigurat del conocimiento</ModuleTitle>

      <div className="zs-canvas">
        <svg viewBox={`0 0 ${W} ${LEVEL_H * 4 + 40}`} className="zs-svg" role="img" aria-label="Zigurat de cuatro niveles del conocimiento sumerio">
          {NIVELES.map((n, i) => {
            const on = sel === i;
            const y = 20 + i * LEVEL_H;
            const inset = 34 + (3 - i) * 26;
            const insetTop = 34 + (3 - i) * 26 + 26;
            return (
              <g key={n.n} className={`zs-level ${on ? 'is-on' : ''}`} onClick={() => setSel(i)}
                 role="button" tabIndex={0}
                 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(i); } }}
                 aria-label={n.titulo}>
                <polygon
                  points={`${insetTop},${y} ${W - insetTop},${y} ${W - inset},${y + LEVEL_H - 4} ${inset},${y + LEVEL_H - 4}`}
                  fill={on ? 'rgba(217,184,102,0.13)' : 'rgba(109,74,155,0.07)'}
                  stroke={on ? 'var(--aa-gold)' : 'var(--aa-violet-deep)'}
                  strokeWidth={on ? 1.4 : 0.8}
                />
                <text x={W / 2} y={y + LEVEL_H / 2 + 1} className={`zs-levelLabel ${on ? 'is-on' : ''}`}>
                  {n.titulo.toUpperCase()}
                </text>
                <text x={inset - 8} y={y + LEVEL_H / 2 + 1} className="zs-levelNum">{n.n}</text>
              </g>
            );
          })}
          {/* Rayo del templo */}
          <line x1={W / 2} y1={4} x2={W / 2} y2={20} stroke="var(--aa-gold)" strokeWidth={1} opacity={0.7} />
          <circle cx={W / 2} cy={5} r={3} fill="var(--aa-gold-soft)" className="zs-star" />
        </svg>
      </div>

      <div className="zs-card" key={sel}>
        <p className="zs-cardTitle">{lv.titulo}</p>
        <div className="zs-chips">
          {lv.claves.map((c) => (
            <span key={c} className="zs-chip">{c}</span>
          ))}
        </div>
        <p className="zs-cardText">{lv.texto}</p>
      </div>

      <Reveal>
        <SourceBlock tipo="tradicion">
          <p>
            Los nombres del nivel superior provienen del registro sumerio y de la memoria del Archivo.
          </p>
        </SourceBlock>
      </Reveal>

      {/* Nodo de transición */}
      <Reveal>
        <ModuleTitle>Sumeria como nodo de transición</ModuleTitle>
        <div className="zs-transit">
          <span className="zs-transitFrom">memoria mítica</span>
          <span className="zs-transitArrow" aria-hidden>→</span>
          <span className="zs-transitTo">civilización organizada</span>
        </div>
        <div className="zs-reads">
          {[
            ['La escritura', 'descenso de la memoria a la materia'],
            ['La ciudad', 'geometría de poder'],
            ['El templo', 'eje entre cielo y tierra'],
          ].map(([k, v]) => (
            <div key={k} className="zs-read">
              <span className="zs-readK">{k}</span>
              <span className="zs-readV">{v}</span>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Enki / Enlil */}
      <Reveal>
        <ModuleTitle>Dos principios en tensión</ModuleTitle>
        <div className="zs-pair">
          <div className="zs-principle is-enki">
            <p className="zs-pName">Enki</p>
            <div className="zs-pList">
              <span>conocimiento</span><span>adaptación</span><span>ingeniería</span><span>descenso al mundo</span>
            </div>
          </div>
          <span className="zs-pTension" aria-hidden>↔</span>
          <div className="zs-principle is-enlil">
            <p className="zs-pName">Enlil</p>
            <div className="zs-pList">
              <span>orden</span><span>jerarquía</span><span>autoridad</span><span>estructura</span>
            </div>
          </div>
        </div>
        <p className="zs-pairNote">No son bandos. Son fuerzas que toda civilización debe equilibrar.</p>
      </Reveal>

      <Reveal>
        <KeyBox
          tone="violet"
          title="El riesgo sumerio"
          text="Conocimiento entregado antes de suficiente consciencia puede traducirse en civilización, pero también en dominación."
        />
      </Reveal>

      <Reveal>
        <TechNote label="Lo que queda sembrado">
          Aquí nace algo que atravesará toda la historia: quien guarda el conocimiento también decide quién
          puede recibirlo.
        </TechNote>
      </Reveal>

      <style jsx global>{`
        .zs-canvas {
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
          padding: 1rem 0.4rem; margin: 0 0 1.1rem;
        }
        .zs-svg { display: block; width: 100%; max-width: 320px; height: auto; margin: 0 auto; }
        .zs-level { cursor: pointer; }
        .zs-level polygon { transition: fill 240ms ease, stroke 240ms ease; }
        .zs-levelLabel {
          font-family: var(--aa-mono); font-size: 7.5px; letter-spacing: 0.16em;
          text-anchor: middle; fill: var(--aa-violet-pale); pointer-events: none;
        }
        .zs-levelLabel.is-on { fill: var(--aa-gold-soft); }
        .zs-levelNum {
          font-family: var(--aa-mono); font-size: 8px; text-anchor: end;
          fill: var(--aa-text-dim); pointer-events: none;
        }
        .zs-star { filter: drop-shadow(0 0 6px rgba(217, 184, 102, 0.8)); }

        .zs-card {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-gold); padding: 1.05rem 1.15rem; margin: 0 0 1.6rem;
          animation: zsIn 400ms ease both;
        }
        @keyframes zsIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        .zs-cardTitle {
          font-family: var(--aa-mono); font-size: 0.78rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.65rem;
        }
        .zs-chips { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0 0 0.7rem; }
        .zs-chip {
          font-family: var(--aa-mono); font-size: 0.62rem; letter-spacing: 0.08em;
          color: #cbb9e6; background: var(--aa-violet-ghost);
          border: 1px solid var(--aa-violet-deep); padding: 0.28rem 0.6rem;
          border-radius: 999px !important;
        }
        .zs-cardText { font-size: 0.95rem; line-height: 1.62; color: var(--aa-text); margin: 0; }

        .zs-transit {
          display: flex; align-items: center; justify-content: center; gap: 0.8rem; flex-wrap: wrap;
          padding: 1rem 0.8rem; margin: 0 0 0.9rem;
          border-top: 1px solid var(--aa-line); border-bottom: 1px solid var(--aa-line);
        }
        .zs-transitFrom, .zs-transitTo {
          font-family: var(--aa-mono); font-size: 0.68rem; letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .zs-transitFrom { color: var(--aa-violet-pale); }
        .zs-transitTo { color: var(--aa-gold-soft); }
        .zs-transitArrow { font-family: var(--aa-mono); color: var(--aa-gold-dim); }

        .zs-reads { display: flex; flex-direction: column; gap: 0.5rem; margin: 0 0 1.7rem; }
        .zs-read { display: flex; align-items: baseline; gap: 0.8rem; flex-wrap: wrap; }
        .zs-readK {
          font-family: var(--aa-mono); font-size: 0.68rem; letter-spacing: 0.14em;
          color: var(--aa-gold-soft); min-width: 104px;
        }
        .zs-readV { font-size: 0.93rem; color: var(--aa-text); }

        .zs-pair { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 0.6rem; margin: 0 0 0.7rem; }
        .zs-principle {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          padding: 0.95rem 0.85rem; text-align: center;
        }
        .zs-principle.is-enki { border-top: 2px solid var(--aa-gold-dim); }
        .zs-principle.is-enlil { border-top: 2px solid var(--aa-violet-soft); }
        .zs-pName {
          font-family: var(--aa-mono); font-weight: 700; font-size: 0.95rem;
          letter-spacing: 0.22em; text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.6rem;
        }
        .zs-pList { display: flex; flex-direction: column; gap: 0.22rem; }
        .zs-pList span {
          font-family: var(--aa-mono); font-size: 0.62rem; letter-spacing: 0.1em;
          color: var(--aa-violet-pale);
        }
        .zs-pTension { font-family: var(--aa-mono); font-size: 1.1rem; color: var(--aa-gold-dim); }
        .zs-pairNote {
          font-family: var(--aa-mono); font-size: 0.58rem; letter-spacing: 0.14em;
          color: var(--aa-text-dim); text-align: center; margin: 0 0 1.7rem;
        }

        @media (max-width: 560px) {
          .zs-pair { grid-template-columns: 1fr; }
          .zs-pTension { transform: rotate(90deg); }
          .zs-readK { min-width: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .zs-card { animation: none !important; }
          .zs-level polygon { transition: none !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
