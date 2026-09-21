'use client';

// TEMPORADA 3 · EPISODIO 7 — LAS 12 FAMILIAS
//
// Rueda de doce nodos con Atlántida en el centro. Los nombres van EXACTOS.
//
// REGLA RESPETADA: el contenido no especifica qué familia concreta corresponde
// a cada elemento, así que NO se asigna ninguna. Se muestra únicamente que el
// sistema se estructuraba en cuatro trinidades.

import { useState } from 'react';
import ArchivoShell, { Reveal, Flow, KeyBox, TechNote, ModuleTitle } from './ArchivoShell';
import { ARCO_T3 } from './t3-arco';

const FAMILIAS = [
  'MIFIS', 'AKAOSTIS', 'MEIEHIS', 'KHOMOBIS', 'KOYRIS', 'LLORIS',
  'KARIANIS', 'WARIANIS', 'ISTHIIS', 'BANIS', 'FIDHIS', 'GABENIS',
];

const PODERES: [string, string][] = [
  ['Militar', 'Gran Capitán'],
  ['Imperial', 'Emperador'],
  ['Gubernamental', 'Primer Ministro / Parlamento'],
  ['Espiritual', 'Sumo Sacerdote'],
];

const ELEMENTOS = ['Fuego', 'Agua', 'Aire', 'Tierra'];

const CX = 170;
const CY = 170;
const RING = 122;

export default function FamiliasAtlantes() {
  const [sel, setSel] = useState<number | null>(null);

  const nodos = FAMILIAS.map((f, i) => {
    const a = (Math.PI / 180) * (i * 30 - 90);
    return { f, i, x: CX + RING * Math.cos(a), y: CY + RING * Math.sin(a) };
  });

  return (
    <ArchivoShell
      guia="Antarel"
      arco={{ pasos: ARCO_T3, actual: 7 }}
      lead="El mundo atlante no se organizaba alrededor de un individuo sino de un sistema de familias. Doce linajes, agrupados en cuatro trinidades, sostenían la estructura política, militar y religiosa de la civilización y se replicaban después dentro de cada territorio que alcanzaban."
      registro="Cuando una estructura política sobrevive a quienes la fundaron, sus nombres pueden convertirse en símbolos, sus símbolos en dioses y sus antiguas funciones en mitologías que continúan organizando a pueblos que ya olvidaron su origen."
    >
      <ModuleTitle>La rueda de las doce familias</ModuleTitle>

      <div className="fa-canvas">
        <svg viewBox="0 0 340 340" className="fa-svg" role="img" aria-label="Doce familias atlantes alrededor de Atlántida">
          <circle cx={CX} cy={CY} r={RING} fill="none" stroke="var(--aa-violet-deep)" strokeWidth={0.7} opacity={0.6} />
          {nodos.map((n) => (
            <line
              key={`l-${n.i}`} x1={CX} y1={CY} x2={n.x} y2={n.y}
              stroke={sel === n.i ? 'var(--aa-gold)' : 'var(--aa-violet-deep)'}
              strokeWidth={sel === n.i ? 1.1 : 0.5}
              opacity={sel === n.i ? 0.9 : 0.35}
            />
          ))}
          <circle cx={CX} cy={CY} r={40} fill="rgba(217,184,102,0.07)" stroke="var(--aa-gold-dim)" strokeWidth={1} />
          <text x={CX} y={CY + 4} className="fa-center">ATLÁNTIDA</text>

          {nodos.map((n) => {
            const on = sel === n.i;
            return (
              <g key={n.i} className={`fa-node ${on ? 'is-on' : ''}`} onClick={() => setSel(on ? null : n.i)}
                 role="button" tabIndex={0}
                 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(on ? null : n.i); } }}
                 aria-label={n.f}>
                <circle cx={n.x} cy={n.y} r={15} fill={on ? 'rgba(217,184,102,0.16)' : 'var(--aa-inner-2)'} stroke={on ? 'var(--aa-gold)' : 'var(--aa-violet-deep)'} strokeWidth={on ? 1.4 : 0.8} />
                <text x={n.x} y={n.y + 3.5} className={`fa-nodeNum ${on ? 'is-on' : ''}`}>{n.i + 1}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="fa-name">
        {sel === null ? (
          <p className="fa-namePlaceholder">Toca un nodo para leer el nombre del linaje</p>
        ) : (
          <>
            <span className="fa-nameIdx">{String(sel + 1).padStart(2, '0')}</span>
            <span className="fa-nameText">{FAMILIAS[sel]}</span>
          </>
        )}
      </div>

      {/* Lista completa */}
      <div className="fa-list">
        {FAMILIAS.map((f, i) => (
          <button key={f} type="button" className={sel === i ? 'is-on' : ''} onClick={() => setSel(sel === i ? null : i)}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            {f}
          </button>
        ))}
      </div>

      {/* Estructura */}
      <Reveal>
        <KeyBox
          title="Estructura"
          formula={<>12 FAMILIAS <span className="op">·</span> 4 TRINIDADES <span className="op">·</span> 4 ELEMENTOS</>}
        />
        <div className="fa-trinities">
          {ELEMENTOS.map((e) => (
            <div key={e} className="fa-trinity">
              <p className="fa-trinityNum">3</p>
              <p className="fa-trinityName">{e}</p>
              <div className="fa-trinityDots" aria-hidden>
                <span /><span /><span />
              </div>
            </div>
          ))}
        </div>
        <p className="fa-trinityNote">
          El contenido del episodio no especifica qué linaje concreto corresponde a cada elemento: se
          conserva únicamente la estructura de cuatro trinidades.
        </p>
      </Reveal>

      {/* Los cuatro poderes */}
      <Reveal>
        <ModuleTitle>Los cuatro poderes</ModuleTitle>
        <div className="fa-powers">
          {PODERES.map(([campo, cargo]) => (
            <div key={campo} className="fa-power">
              <p className="fa-powerField">{campo}</p>
              <p className="fa-powerRole">{cargo}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <Flow steps={['12 FAMILIAS', '4 TRINIDADES', '4 CAMPOS DE PODER', '1 SISTEMA']} />
      </Reveal>

      {/* Clave lingüística */}
      <Reveal>
        <div className="fa-suffix">
          <p className="fa-suffixMark">-is</p>
          <p className="fa-suffixText">«pertenecientes a»</p>
          <p className="fa-suffixNote">Clave lingüística del sistema atlante.</p>
        </div>
      </Reveal>

      {/* Expansión celular */}
      <Reveal>
        <ModuleTitle>Expansión</ModuleTitle>
        <Flow steps={['ISLAS ATLANTES', 'COLONIAS', 'EGIPTO / SUDÁN', 'LEVANTE', 'OTROS TERRITORIOS']} />
        <div className="fa-cells">
          {[0, 1, 2].map((i) => (
            <span key={i} className="fa-cell" style={{ animationDelay: `${i * 260}ms` }}>
              12
            </span>
          ))}
        </div>
        <p className="fa-cellsText">
          El modelo familiar se replicaba dentro de nuevos territorios como una estructura celular de
          organización política y religiosa.
        </p>
      </Reveal>

      {/* Esfera de doce regiones */}
      <Reveal>
        <ModuleTitle>Doce regiones</ModuleTitle>
        <div className="fa-globe">
          <svg viewBox="0 0 220 220" className="fa-globeSvg" role="img" aria-label="Esfera dividida en doce regiones">
            <circle cx={110} cy={110} r={92} fill="none" stroke="var(--aa-gold-dim)" strokeWidth={1} />
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const a = (Math.PI / 180) * (i * 30);
              return (
                <ellipse key={i} cx={110} cy={110} rx={92 * Math.abs(Math.cos(a)) || 2} ry={92}
                  fill="none" stroke="var(--aa-violet-deep)" strokeWidth={0.6} opacity={0.55} />
              );
            })}
            {[-46, 0, 46].map((dy) => (
              <ellipse key={dy} cx={110} cy={110 + dy} rx={Math.sqrt(Math.max(92 * 92 - dy * dy, 1))} ry={13}
                fill="none" stroke="var(--aa-violet-deep)" strokeWidth={0.6} opacity={0.5} />
            ))}
            {Array.from({ length: 12 }, (_, i) => {
              const a = (Math.PI / 180) * (i * 30 - 90);
              return <circle key={i} cx={110 + 92 * Math.cos(a)} cy={110 + 92 * Math.sin(a)} r={3.4} fill="var(--aa-gold)" />;
            })}
          </svg>
          <p className="fa-globeNote">
            Malla inspirada en el dodecaedro y el icosaedro. Forma parte del modelo del episodio; no se
            presenta como una división históricamente demostrada.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <TechNote label="Del clan al arquetipo">
          Con el paso del tiempo, las familias dejan de funcionar solamente como linajes y empiezan a
          convertirse en símbolos, dioses, tribus, constelaciones y arquetipos.
        </TechNote>
      </Reveal>

      <style jsx global>{`
        .fa-canvas {
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
          padding: 1rem 0.4rem; margin: 0 0 0.9rem;
        }
        .fa-svg { display: block; width: 100%; max-width: 340px; height: auto; margin: 0 auto; }
        .fa-node { cursor: pointer; }
        .fa-node circle { transition: fill 220ms ease, stroke 220ms ease; }
        .fa-center {
          font-family: var(--aa-mono); font-size: 10px; letter-spacing: 0.16em;
          text-anchor: middle; fill: var(--aa-gold-soft); pointer-events: none;
        }
        .fa-nodeNum {
          font-family: var(--aa-mono); font-size: 9px; text-anchor: middle;
          fill: var(--aa-violet-pale); pointer-events: none;
        }
        .fa-nodeNum.is-on { fill: var(--aa-gold-soft); font-weight: 700; }

        .fa-name {
          display: flex; align-items: baseline; justify-content: center; gap: 0.7rem;
          min-height: 2.1rem; margin: 0 0 0.9rem;
        }
        .fa-nameIdx { font-family: var(--aa-mono); font-size: 0.7rem; color: var(--aa-text-dim); }
        .fa-nameText {
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.25rem;
          letter-spacing: 0.22em; color: var(--aa-gold-soft);
        }
        .fa-namePlaceholder {
          font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-text-dim); margin: 0;
        }

        .fa-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.3rem; margin: 0 0 1.8rem; }
        .fa-list button {
          display: flex; align-items: baseline; gap: 0.4rem;
          font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.1em;
          color: var(--aa-violet-pale); background: var(--aa-inner-2);
          border: 1px solid var(--aa-line); padding: 0.36rem 0.45rem; cursor: pointer;
          transition: color 200ms ease, border-color 200ms ease;
        }
        .fa-list button span { color: var(--aa-text-dim); font-size: 0.52rem; }
        .fa-list button.is-on { color: var(--aa-gold-soft); border-color: var(--aa-gold-dim); }

        .fa-trinities { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.45rem; margin: 0 0 0.8rem; }
        .fa-trinity {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-top: 2px solid var(--aa-violet-deep); padding: 0.75rem 0.5rem; text-align: center;
        }
        .fa-trinityNum {
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.35rem;
          color: var(--aa-gold-soft); margin: 0 0 0.15rem; line-height: 1;
        }
        .fa-trinityName {
          font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0 0 0.45rem;
        }
        .fa-trinityDots { display: flex; justify-content: center; gap: 4px; }
        .fa-trinityDots span {
          width: 5px; height: 5px; border-radius: 999px !important;
          background: var(--aa-violet-pale); opacity: 0.8;
        }
        .fa-trinityNote {
          font-size: 0.85rem; line-height: 1.55; color: var(--aa-text-dim);
          margin: 0 0 1.7rem; text-align: center;
        }

        .fa-powers { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 0 0 1.7rem; }
        .fa-power {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-gold-dim); padding: 0.75rem 0.85rem;
        }
        .fa-powerField {
          font-family: var(--aa-mono); font-size: 0.64rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.25rem;
        }
        .fa-powerRole { font-size: 0.88rem; line-height: 1.45; color: var(--aa-text); margin: 0; }

        .fa-suffix {
          text-align: center; margin: 0 0 1.7rem; padding: 1.2rem 1rem;
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
        }
        .fa-suffixMark {
          font-family: var(--aa-mono); font-weight: 700; font-size: 2rem;
          color: var(--aa-gold-soft); margin: 0 0 0.3rem; line-height: 1;
        }
        .fa-suffixText { font-size: 1rem; color: var(--aa-text); margin: 0 0 0.4rem; font-style: italic; }
        .fa-suffixNote {
          font-family: var(--aa-mono); font-size: 0.56rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-text-dim); margin: 0;
        }

        .fa-cells { display: flex; align-items: center; justify-content: center; gap: 1.6rem; margin: 0 0 0.8rem; }
        .fa-cell {
          width: 52px; height: 52px; display: flex; align-items: center; justify-content: center;
          font-family: var(--aa-mono); font-weight: 700; font-size: 1rem;
          color: var(--aa-gold-soft); border: 1px solid var(--aa-gold-dim);
          border-radius: 999px !important; background: rgba(217, 184, 102, 0.05);
          animation: faCell 3.6s ease-in-out infinite;
        }
        @keyframes faCell { 0%, 100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.06); opacity: 1; } }
        .fa-cellsText { font-size: 0.95rem; line-height: 1.62; color: var(--aa-text); margin: 0 0 1.7rem; }

        .fa-globe {
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
          padding: 1.1rem 0.6rem; margin: 0 0 1.7rem;
        }
        .fa-globeSvg { display: block; width: 100%; max-width: 220px; height: auto; margin: 0 auto 0.7rem; }
        .fa-globeNote {
          font-size: 0.85rem; line-height: 1.55; color: var(--aa-text-dim);
          text-align: center; margin: 0;
        }

        @media (max-width: 560px) {
          .fa-list { grid-template-columns: repeat(2, 1fr); }
          .fa-trinities { grid-template-columns: repeat(2, 1fr); }
          .fa-powers { grid-template-columns: 1fr; }
          .fa-cells { gap: 0.9rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fa-cell { animation: none !important; opacity: 1 !important; }
          .fa-node circle { transition: none !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
