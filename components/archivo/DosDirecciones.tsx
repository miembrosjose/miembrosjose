'use client';

// TEMPORADA 3 · EPISODIO 6 — ARCTURIANOS Y PLEYADIANOS
//
// Dos direcciones de evolución que se cruzan: Pléyades va de dentro hacia
// fuera; Arcturus de fuera hacia dentro. En el centro, integración.
// En móvil el módulo se convierte en selector de dirección.

import { useState } from 'react';
import ArchivoShell, { Reveal, KeyBox, TechNote, SourceBlock, Chips, ModuleTitle } from './ArchivoShell';
import { ARCO_T3 } from './t3-arco';

type Dir = 'pleyades' | 'arcturus';

const DATA: Record<Dir, { nombre: string; de: string; a: string; cadena: string[]; claves: string[]; texto: string }> = {
  pleyades: {
    nombre: 'Pleyadianos',
    de: 'DENTRO', a: 'FUERA',
    cadena: ['PROPÓSITO', 'CONSCIENCIA', 'MANIFESTACIÓN'],
    claves: ['interioridad', 'espiritualidad', 'propósito', 'armonización', 'intuición', 'sentido'],
    texto: 'La función pleyadiana aparece asociada con comprender primero el propósito y la estructura interior, para después intentar manifestarlos dentro de la experiencia.',
  },
  arcturus: {
    nombre: 'Arcturianos',
    de: 'FUERA', a: 'DENTRO',
    cadena: ['MATERIA', 'HERRAMIENTA', 'CONSCIENCIA'],
    claves: ['ciencia', 'medicina', 'alquimia', 'estructura', 'geometría', 'tecnología'],
    texto: 'La función arcturiana aparece asociada con el uso consciente de la materia y de herramientas externas como vehículos para comprender estructuras internas.',
  },
};

export default function DosDirecciones() {
  const [dir, setDir] = useState<Dir>('pleyades');
  const d = DATA[dir];

  return (
    <ArchivoShell
      guia="Antarel"
      arco={{ pasos: ARCO_T3, actual: 6 }}
      lead="Pléyades y Arcturus son dos movimientos complementarios: uno nace dentro y busca manifestarse afuera; el otro usa la materia para volver a la consciencia."
      registro="Una civilización madura cuando aquello que comprende interiormente puede convertirse en forma, y aquello que construye externamente puede conducirla nuevamente hacia una comprensión mayor."
    >
      <ModuleTitle>Dos direcciones</ModuleTitle>

      {/* La cruz */}
      <div className="dd-cross">
        <svg viewBox="0 0 320 200" className="dd-svg" role="img" aria-label="Dos direcciones que se cruzan en la integración">
          <line x1={30} y1={62} x2={290} y2={62} stroke="var(--aa-gold-dim)" strokeWidth={1} />
          <line x1={290} y1={138} x2={30} y2={138} stroke="var(--aa-violet-soft)" strokeWidth={1} opacity={0.75} />
          <polygon points="290,62 282,58 282,66" fill="var(--aa-gold)" />
          <polygon points="30,138 38,134 38,142" fill="var(--aa-violet-soft)" />
          <text x={30} y={52} className="dd-cap is-start">INTERIOR</text>
          <text x={290} y={52} className="dd-cap is-end">EXTERIOR</text>
          <text x={290} y={158} className="dd-cap is-end">EXTERIOR</text>
          <text x={30} y={158} className="dd-cap is-start">INTERIOR</text>
          <text x={160} y={46} className="dd-who is-gold">PLÉYADES</text>
          <text x={160} y={170} className="dd-who">ARCTURUS</text>
          <circle cx={160} cy={100} r={26} fill="rgba(217,184,102,0.08)" stroke="var(--aa-gold)" strokeWidth={1.1} />
          <text x={160} y={98} className="dd-core">INTE-</text>
          <text x={160} y={109} className="dd-core">GRACIÓN</text>
        </svg>
      </div>

      {/* Selector + ficha */}
      <div className="dd-picker" role="tablist" aria-label="Dirección">
        {(Object.keys(DATA) as Dir[]).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={dir === k} className={dir === k ? 'is-on' : ''} onClick={() => setDir(k)}>
            {DATA[k].nombre}
          </button>
        ))}
      </div>

      <div className="dd-card" key={dir}>
        <p className="dd-cardName">{d.nombre}</p>
        <p className="dd-cardDir">
          {d.de} <span className="dd-cardArrow" aria-hidden>↓</span> {d.a}
        </p>
        <div className="dd-chain">
          {d.cadena.map((c, i) => (
            <span key={c} className="dd-chainItem">
              {i > 0 && <span className="dd-chainArrow" aria-hidden>↓</span>}
              <span className="dd-chainNode">{c}</span>
            </span>
          ))}
        </div>
        <Chips label="Claves" items={d.claves} />
        <p className="dd-cardText">{d.texto}</p>
      </div>

      <Reveal>
        <TechNote label="El puente completo">
          Consciencia sin herramienta puede quedar sin manifestación. Herramienta sin consciencia puede
          perder dirección.
        </TechNote>
      </Reveal>

      <Reveal>
        <KeyBox
          title="Creación consciente"
          formula={
            <>
              PROPÓSITO <span className="op">+</span> HERRAMIENTA
              <br />
              <span className="op">=</span>
              <br />
              CREACIÓN CONSCIENTE
            </>
          }
        />
      </Reveal>

      <Reveal>
        <SourceBlock tipo="plan">
          <p>
            Ambas funciones influyen después en los procesos que estructuran la civilización atlante.
          </p>
          <p>
            Son funciones dentro del Plan, no afirmaciones sobre los sistemas estelares físicos.
          </p>
        </SourceBlock>
      </Reveal>

      <style jsx global>{`
        .dd-cross {
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
          padding: 1rem 0.4rem; margin: 0 0 1.2rem;
        }
        .dd-svg { display: block; width: 100%; max-width: 330px; height: auto; margin: 0 auto; }
        .dd-cap { font-family: var(--aa-mono); font-size: 7.5px; letter-spacing: 0.16em; fill: var(--aa-text-dim); }
        .dd-cap.is-start { text-anchor: start; }
        .dd-cap.is-end { text-anchor: end; }
        .dd-who {
          font-family: var(--aa-mono); font-size: 9px; letter-spacing: 0.2em;
          text-anchor: middle; fill: var(--aa-violet-pale);
        }
        .dd-who.is-gold { fill: var(--aa-gold); }
        .dd-core {
          font-family: var(--aa-mono); font-size: 8px; letter-spacing: 0.14em;
          text-anchor: middle; fill: var(--aa-gold-soft);
        }

        .dd-picker { display: flex; justify-content: center; gap: 0.4rem; margin: 0 0 0.9rem; }
        .dd-picker button {
          font-family: var(--aa-mono); font-size: 0.62rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-text-dim); background: transparent;
          border: 1px solid var(--aa-line); padding: 0.36rem 0.8rem;
          cursor: pointer; border-radius: 999px !important;
          transition: color 200ms ease, border-color 200ms ease, background 200ms ease;
        }
        .dd-picker button.is-on {
          color: var(--aa-gold-soft); border-color: var(--aa-gold-dim); background: var(--aa-gold-ghost);
        }

        .dd-card {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-gold); padding: 1.15rem 1.2rem; margin: 0 0 1.7rem;
          animation: ddIn 420ms ease both;
        }
        @keyframes ddIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .dd-cardName {
          font-family: var(--aa-mono); font-size: 0.86rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.3rem;
        }
        .dd-cardDir {
          font-family: var(--aa-mono); font-size: 0.64rem; letter-spacing: 0.18em;
          color: var(--aa-violet-pale); margin: 0 0 0.9rem;
        }
        .dd-cardArrow { color: var(--aa-gold-dim); margin: 0 0.4em; }
        .dd-chain {
          display: flex; flex-direction: column; align-items: center; gap: 0.1rem;
          padding: 0.9rem 0; margin: 0 0 0.8rem;
          border-top: 1px solid var(--aa-line); border-bottom: 1px solid var(--aa-line);
        }
        .dd-chainItem { display: flex; flex-direction: column; align-items: center; gap: 0.1rem; }
        .dd-chainArrow { font-family: var(--aa-mono); font-size: 0.78rem; color: var(--aa-gold-dim); }
        .dd-chainNode {
          font-family: var(--aa-mono); font-size: 0.7rem; letter-spacing: 0.16em;
          color: var(--aa-gold-soft);
        }
        .dd-cardText { font-size: 0.95rem; line-height: 1.62; color: var(--aa-text); margin: 0; }

        @media (prefers-reduced-motion: reduce) {
          .dd-card { animation: none !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
