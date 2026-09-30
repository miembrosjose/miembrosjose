'use client';

// TEMPORADA 2 · EPISODIO 2 — EL COSMOS / UNIVERSOS, DIMENSIONES Y ESCALA
//
// Módulo central: los tres universos como campos CONTENIDOS uno dentro de otro
// (no tres tarjetas sueltas). El anillo seleccionado abre su ficha debajo.
// Segundo módulo: mapa de escala con definiciones desplegables.

import { useState } from 'react';
import ArchivoShell, { Reveal, Flow, KeyBox, TechNote, Chips, ModuleTitle } from './ArchivoShell';

type UniverseId = 'espiritual' | 'mental' | 'material';

const UNIVERSES: Record<UniverseId, {
  name: string;
  dims: string;
  dimsLabel: string;
  funcion: string;
  relacion: string;
  claves: string[];
  tecnico: string;
  r: number;
  tone: 'gold' | 'violet' | 'pale';
}> = {
  espiritual: {
    name: 'Universo espiritual',
    dims: '10 — 12',
    dimsLabel: '3 dimensiones',
    funcion: 'Unidad',
    relacion: 'contiene / proyecta',
    claves: ['esencia', 'integración', 'origen', 'absoluto'],
    tecnico: 'Las dimensiones diez, once y doce forman el Universo Espiritual: el campo donde la consciencia se aproxima a la experiencia de unidad y origen. Tres dimensiones, tres atributos: Amor, Voluntad y Sabiduría.',
    r: 150,
    tone: 'gold',
  },
  mental: {
    name: 'Universo mental',
    dims: '8 — 9',
    dimsLabel: '2 dimensiones',
    funcion: 'Arquitectura',
    relacion: 'contiene / organiza',
    claves: ['idea', 'diseño', 'estructura', 'mente creadora'],
    tecnico: 'La octava superior introduce el campo mental, que ocupa las dimensiones ocho y nueve. Desde esta esfera operan inteligencias ultraterrestres vinculadas con la organización y creación de estructuras del universo material.',
    r: 104,
    tone: 'violet',
  },
  material: {
    name: 'Universo material',
    dims: '1 — 7',
    dimsLabel: '7 dimensiones',
    funcion: 'Manifestación',
    relacion: 'manifiesta / experimenta',
    claves: ['forma', 'experiencia', 'materia', 'energía', 'evolución'],
    tecnico: 'El universo material posee siete dimensiones. Los seres que participan plenamente de él disponen de siete vehículos de consciencia capaces de relacionarse con sus diferentes niveles.',
    r: 58,
    tone: 'pale',
  },
};

// Los tres atributos del Universo Espiritual, uno por dimensión.
const ATRIBUTOS: { n: number; nombre: string; texto: string }[] = [
  { n: 10, nombre: 'Amor', texto: 'Capacidad de integración y unión.' },
  { n: 11, nombre: 'Voluntad', texto: 'Dirección consciente de la fuerza creadora.' },
  { n: 12, nombre: 'Sabiduría', texto: 'Comprensión integradora de la experiencia.' },
];

const ORDER: UniverseId[] = ['espiritual', 'mental', 'material'];

const ESCALA: { label: string; def: string }[] = [
  { label: 'FUENTE', def: 'Origen desde el cual se despliega toda la arquitectura descrita.' },
  { label: 'UNIVERSOS', def: 'Grandes campos de manifestación: material, mental y espiritual.' },
  { label: 'GALAXIAS', def: 'Estructuras mayores que agrupan sistemas dentro de un mismo campo.' },
  { label: 'SISTEMAS ESTELARES', def: 'Conjuntos de mundos organizados alrededor de una estrella.' },
  { label: 'MUNDOS', def: 'Escenarios concretos donde una civilización desarrolla su proceso.' },
  { label: 'SERES', def: 'Consciencias individuales que participan de la experiencia de un mundo.' },
  { label: 'EXPERIENCIA LOCAL', def: 'El punto de vista inmediato desde el cual se vive y se aprende.' },
];

export default function ArquitecturaCosmica() {
  const [sel, setSel] = useState<UniverseId>('material');
  const [openScale, setOpenScale] = useState<number | null>(null);
  const u = UNIVERSES[sel];

  return (
    <ArchivoShell
      lead="Lo material es solo uno de los campos de la existencia. Hay tres universos contenidos unos en otros —Material, Mental y Espiritual—, y cada uno es una forma distinta de manifestarse la consciencia."
      registro="La escala cambia el campo de percepción; aquello que parece totalidad desde un nivel puede revelar que forma parte de una estructura mucho mayor."
    >
      <ModuleTitle>Los tres universos</ModuleTitle>

      <div className="cm-canvas">
        <svg viewBox="0 0 360 340" className="cm-svg" role="img" aria-label="Tres universos contenidos: espiritual, mental y material">
          {ORDER.map((id) => {
            const uu = UNIVERSES[id];
            const on = sel === id;
            const stroke = uu.tone === 'gold' ? 'var(--aa-gold)' : uu.tone === 'violet' ? 'var(--aa-violet-soft)' : 'var(--aa-violet-pale)';
            return (
              <g key={id} className={`cm-ring ${on ? 'is-on' : ''}`} onClick={() => setSel(id)} role="button" tabIndex={0}
                 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(id); } }}
                 aria-label={uu.name}>
                <circle
                  cx={180} cy={165} r={uu.r}
                  fill={on ? (uu.tone === 'gold' ? 'rgba(217,184,102,0.07)' : 'rgba(109,74,155,0.09)') : 'transparent'}
                  stroke={stroke}
                  strokeWidth={on ? 1.8 : 1}
                  opacity={on ? 1 : 0.55}
                />
                <text x={180} y={165 - uu.r + 17} className="cm-ringLabel" fill={stroke} opacity={on ? 1 : 0.7}>
                  {uu.name.replace('Universo ', '').toUpperCase()}
                </text>
                <text x={180} y={165 - uu.r + 31} className="cm-ringDims" opacity={on ? 1 : 0.55}>
                  {uu.dims}
                </text>
              </g>
            );
          })}
          <circle cx={180} cy={165} r={5} fill="var(--aa-gold-soft)" className="cm-core" />
          <text x={180} y={322} className="cm-hint">toca un campo para abrir su ficha</text>
        </svg>
      </div>

      {/* Ficha del universo seleccionado */}
      <div className="cm-detail" key={sel}>
        <p className="cm-detailName">{u.name}</p>
        <div className="cm-detailGrid">
          <div>
            <p className="cm-dLabel">Dimensiones</p>
            <p className="cm-dValue">{u.dims}</p>
          </div>
          <div>
            <p className="cm-dLabel">Función</p>
            <p className="cm-dValue is-violet">{u.funcion}</p>
          </div>
          <div>
            <p className="cm-dLabel">Relación</p>
            <p className="cm-dValue is-dim">{u.relacion}</p>
          </div>
        </div>
        <Chips label="Claves" items={u.claves} />
        <p className="cm-tecnico">{u.tecnico}</p>
      </div>

      {/* Los tres atributos del Universo Espiritual */}
      <Reveal>
        <ModuleTitle>Universo espiritual — tres atributos</ModuleTitle>
        <div className="cm-attrs">
          {ATRIBUTOS.map((a) => (
            <div key={a.n} className="cm-attr">
              <p className="cm-attrNum">{a.n}</p>
              <p className="cm-attrName">{a.nombre}</p>
              <p className="cm-attrText">{a.texto}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Reparto dimensional */}
      <Reveal>
        <div className="cm-split">
          {[
            ['Material', '1 — 7', '7'],
            ['Mental', '8 — 9', '2'],
            ['Espiritual', '10 — 12', '3'],
          ].map(([k, rango, total]) => (
            <div key={k} className="cm-splitRow">
              <span className="cm-splitK">{k}</span>
              <span className="cm-splitR">{rango}</span>
              <span className="cm-splitT">{total}</span>
            </div>
          ))}
          <p className="cm-splitTotal">12 dimensiones</p>
        </div>
      </Reveal>

      <Reveal>
        <div className="cm-twoWay">
          <Flow label="Manifestación" steps={['ESPIRITUAL', 'MENTAL', 'MATERIAL']} />
          <Flow label="Evolución" dir="up" steps={['ESPIRITUAL', 'COMPRENSIÓN', 'MENTAL', 'EXPERIENCIA', 'MATERIAL']} />
        </div>
      </Reveal>

      <Reveal>
        <div className="cm-relations">
          <p className="cm-relTitle">Tres formas de relación</p>
          <div className="cm-relGrid">
            <div><span className="cm-relK">MATERIAL</span><span className="cm-relV">sentir / experimentar</span></div>
            <div><span className="cm-relK">MENTAL</span><span className="cm-relV">pensar / organizar</span></div>
            <div><span className="cm-relK">ESPIRITUAL</span><span className="cm-relV">vivir / integrar</span></div>
          </div>
        </div>
      </Reveal>

      {/* Mapa de escala */}
      <Reveal>
        <ModuleTitle>Mapa de escala</ModuleTitle>
        <div className="cm-scale">
          {ESCALA.map((s, i) => {
            const open = openScale === i;
            return (
              <div key={i} className={`cm-scaleRow ${open ? 'is-open' : ''}`}>
                {i > 0 && <span className="cm-scaleArrow" aria-hidden>↓</span>}
                <button type="button" className="cm-scaleBtn" onClick={() => setOpenScale(open ? null : i)} aria-expanded={open}>
                  <span className="cm-scaleIdx">{String(i + 1).padStart(2, '0')}</span>
                  <span className="cm-scaleLabel">{s.label}</span>
                  <span className="cm-scalePlus" aria-hidden>{open ? '−' : '+'}</span>
                </button>
                {open && <p className="cm-scaleDef">{s.def}</p>}
              </div>
            );
          })}
        </div>
      </Reveal>

      <Reveal>
        <KeyBox
          tone="violet"
          title="Dimensión ≠ distancia"
          text="Una dimensión es un nivel de organización y experiencia de la realidad; la distancia pertenece a la relación espacial dentro de un campo."
        />
      </Reveal>

      <style jsx global>{`
        .cm-canvas {
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim);
          border-bottom: 1px solid var(--aa-gold-dim);
          padding: 1rem 0.5rem 0.6rem;
          margin: 0 0 1.4rem;
        }
        .cm-svg { display: block; width: 100%; max-width: 340px; height: auto; margin: 0 auto; }
        .cm-ring { cursor: pointer; }
        .cm-ring circle { transition: stroke-width 250ms ease, opacity 250ms ease, fill 250ms ease; }
        .cm-ring:focus-visible { outline: none; }
        .cm-ring:focus-visible circle { stroke-dasharray: 3 3; }
        .cm-ringLabel {
          font-family: var(--aa-mono); font-size: 9px; letter-spacing: 0.2em; text-anchor: middle;
        }
        .cm-ringDims {
          font-family: var(--aa-mono); font-size: 8px; letter-spacing: 0.12em;
          text-anchor: middle; fill: var(--aa-text-dim);
        }
        .cm-core { filter: drop-shadow(0 0 6px rgba(217, 184, 102, 0.7)); }
        .cm-hint {
          font-family: var(--aa-mono); font-size: 7.5px; letter-spacing: 0.16em;
          text-anchor: middle; fill: var(--aa-text-dim);
        }

        .cm-detail {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-gold-dim);
          padding: 1.15rem 1.2rem; margin: 0 0 1.6rem;
          animation: cmIn 500ms ease both;
        }
        @keyframes cmIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .cm-detailName {
          font-family: var(--aa-mono); font-size: 0.78rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.9rem;
        }
        .cm-detailGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8rem; margin: 0 0 1rem; }
        .cm-dLabel {
          font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-text-dim); margin: 0 0 0.3rem;
        }
        .cm-dValue {
          font-family: var(--aa-mono); font-weight: 700; font-size: 0.92rem;
          letter-spacing: 0.06em; color: var(--aa-gold-soft); margin: 0;
        }
        .cm-dValue.is-violet { color: var(--aa-violet-pale); font-weight: 400; }
        .cm-dValue.is-dim { color: var(--aa-text-dim); font-weight: 400; font-size: 0.8rem; }
        .cm-tecnico { font-size: 0.99rem; line-height: 1.68; color: var(--aa-text); margin: 0; }

        /* Tres atributos del Universo Espiritual — el dorado marca el techo. */
        .cm-attrs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin: 0 0 1.6rem; }
        .cm-attr {
          background: rgba(217, 184, 102, 0.05); border: 1px solid var(--aa-gold-dim);
          padding: 0.95rem 0.7rem; text-align: center;
        }
        .cm-attrNum {
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.75rem; line-height: 1;
          color: var(--aa-gold-soft); margin: 0 0 0.3rem;
          text-shadow: 0 0 16px rgba(217, 184, 102, 0.35);
        }
        .cm-attrName {
          font-family: var(--aa-mono); font-size: 0.68rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0 0 0.45rem;
        }
        .cm-attrText { font-size: 0.83rem; line-height: 1.45; color: var(--aa-text); margin: 0; }

        .cm-split {
          margin: 0 0 1.7rem; padding: 1.1rem 1rem;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
        }
        .cm-splitRow {
          display: grid; grid-template-columns: 1fr auto 2.2rem; gap: 0.7rem; align-items: baseline;
          padding: 0.38rem 0; border-bottom: 1px solid var(--aa-line);
        }
        .cm-splitK {
          font-family: var(--aa-mono); font-size: 0.68rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-violet-pale);
        }
        .cm-splitR { font-family: var(--aa-mono); font-size: 0.72rem; color: var(--aa-gold-soft); }
        .cm-splitT {
          font-family: var(--aa-mono); font-weight: 700; font-size: 0.9rem;
          color: var(--aa-gold); text-align: right;
        }
        .cm-splitTotal {
          font-family: var(--aa-mono); font-size: 0.64rem; letter-spacing: 0.22em;
          text-transform: uppercase; color: var(--aa-gold-soft); text-align: right;
          margin: 0.6rem 0 0;
        }

        .cm-twoWay { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
        .cm-twoWay .aa-flow { margin: 0; }

        .cm-relations {
          margin: 1.8rem 0; padding: 1.2rem 1rem;
          border-top: 1px solid var(--aa-line); border-bottom: 1px solid var(--aa-line);
        }
        .cm-relTitle {
          font-family: var(--aa-mono); font-size: 0.66rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-gold); text-align: center; margin: 0 0 0.9rem;
        }
        .cm-relGrid { display: flex; flex-direction: column; gap: 0.55rem; }
        .cm-relGrid > div { display: flex; align-items: baseline; gap: 0.8rem; justify-content: center; }
        .cm-relK {
          font-family: var(--aa-mono); font-size: 0.72rem; letter-spacing: 0.16em;
          color: var(--aa-gold-soft); min-width: 92px; text-align: right;
        }
        .cm-relV { font-size: 0.92rem; color: var(--aa-text); }

        .cm-scale { margin: 0 0 1.8rem; }
        .cm-scaleRow { display: flex; flex-direction: column; align-items: stretch; }
        .cm-scaleArrow {
          font-family: var(--aa-mono); font-size: 0.8rem; color: var(--aa-gold-dim);
          text-align: center; line-height: 1; padding: 0.22rem 0;
        }
        .cm-scaleBtn {
          display: flex; align-items: center; gap: 0.7rem; width: 100%;
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-violet-deep);
          padding: 0.6rem 0.8rem; cursor: pointer; text-align: left;
          transition: border-color 200ms ease, background 200ms ease;
        }
        .cm-scaleRow.is-open .cm-scaleBtn { border-left-color: var(--aa-gold); background: #0d0d16; }
        .cm-scaleIdx { font-family: var(--aa-mono); font-size: 0.62rem; color: var(--aa-text-dim); }
        .cm-scaleLabel {
          flex: 1; font-family: var(--aa-mono); font-size: 0.72rem;
          letter-spacing: 0.16em; color: var(--aa-gold-soft);
        }
        .cm-scalePlus { font-family: var(--aa-mono); font-size: 0.85rem; color: var(--aa-gold-dim); }
        .cm-scaleDef {
          font-size: 0.93rem; line-height: 1.6; color: var(--aa-text);
          margin: 0.5rem 0 0; padding: 0 0.8rem 0.2rem;
          animation: cmIn 350ms ease both;
        }

        @media (max-width: 560px) {
          .cm-detailGrid { grid-template-columns: 1fr 1fr; }
          .cm-attrs { grid-template-columns: 1fr; }
          .cm-twoWay { grid-template-columns: 1fr; }
          .cm-relGrid > div { flex-direction: column; gap: 0.1rem; align-items: center; }
          .cm-relK { min-width: 0; text-align: center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cm-detail, .cm-scaleDef { animation: none !important; }
          .cm-ring circle { transition: none !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
