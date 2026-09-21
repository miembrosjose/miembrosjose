'use client';

// TEMPORADA 4 · EPISODIO 3 — EGIPTO
//
// El Nilo dibujado como columna vertebral: el río baja por el lienzo con los
// nodos en su orden geográfico real, del Delta (norte, arriba) a Nubia (sur,
// abajo). Es un cuerpo iniciático, no un mapa turístico.

import { useState } from 'react';
import ArchivoShell, { Reveal, Flow, TechNote, ModuleTitle } from './ArchivoShell';
import { ARCO_T4 } from './t4-arco';

type Nodo = { nombre: string; sentido: string; y: number; lado: 'i' | 'd' };

// Orden norte → sur, como corre la lectura del lienzo.
const NODOS: Nodo[] = [
  { nombre: 'Delta / Bajo Egipto', sentido: 'Apertura al mundo: donde el río se abre y la civilización toca el mar.', y: 40, lado: 'd' },
  { nombre: 'Giza', sentido: 'Alineación, proporción, estrellas, resguardo y conocimiento matemático-simbólico.', y: 92, lado: 'i' },
  { nombre: 'Saqqara', sentido: 'Primeras grandes codificaciones arquitectónicas de ascensión y tránsito.', y: 140, lado: 'd' },
  { nombre: 'Menfis', sentido: 'Fundación, administración del poder y anclaje de una civilización centralizada.', y: 188, lado: 'i' },
  { nombre: 'Abydos', sentido: 'Memoria de linaje, realeza sagrada y tránsito espiritual.', y: 248, lado: 'd' },
  { nombre: 'Valle de los Reyes', sentido: 'Preparación del alma para el pasaje y continuidad de la consciencia.', y: 300, lado: 'i' },
  { nombre: 'Luxor / Tebas', sentido: 'Templo vivo de iniciación, columna vertebral ritual de Egipto.', y: 344, lado: 'd' },
  { nombre: 'Asuán', sentido: 'Umbral del sur: piedra, frontera y puerta de la cantera sagrada.', y: 404, lado: 'i' },
  { nombre: 'Nubia / Sudán', sentido: 'Raíz meridional del linaje y continuidad de la memoria más allá de la frontera.', y: 450, lado: 'd' },
];

const CUERPO: [string, string][] = [
  ['Nilo', 'columna de vida'],
  ['Templos', 'centros de activación'],
  ['Pirámides', 'tecnología simbólica de ascenso'],
  ['Momificación', 'pedagogía de inmortalidad'],
  ['Dioses', 'fuerzas arquetípicas'],
];

const W = 300;
const H = 490;
const RX = W / 2;

export default function NiloIniciatico() {
  const [sel, setSel] = useState(1);
  const n = NODOS[sel];

  // Cauce sinuoso del río.
  const cauce = `M${RX},20 C${RX - 26},80 ${RX + 26},130 ${RX},180
                 C${RX - 24},240 ${RX + 24},300 ${RX},350
                 C${RX - 20},400 ${RX + 18},440 ${RX},470`;

  return (
    <ArchivoShell
      guia="Ivika"
      voz="Memoria abierta"
      arco={{ pasos: ARCO_T4, actual: 3 }}
      lead="Si Sumeria tradujo memoria en ciudad y escritura, Egipto tradujo memoria en símbolo, piedra, alineación y trascendencia. Egipto aparece como un gran cuerpo iniciático recorrido por el Nilo, donde la vida, la muerte, el cielo y el alma quedaron inscritos en una arquitectura de eternidad."
      registro="Egipto no solo construyó monumentos; construyó un lenguaje para enseñar que la vida visible no agota el destino del ser."
    >
      <ModuleTitle>El Nilo — columna de memoria</ModuleTitle>

      <div className="ni-canvas">
        <svg viewBox={`0 0 ${W} ${H}`} className="ni-svg" role="img" aria-label="El Nilo con sus nodos iniciáticos, del Delta a Nubia">
          <defs>
            <linearGradient id="niRiver" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d9b866" stopOpacity="0.85" />
              <stop offset="55%" stopColor="#8a63b8" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#4a3170" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          <text x={RX} y={12} className="ni-cardinal">NORTE · DELTA</text>
          <text x={RX} y={H - 3} className="ni-cardinal">SUR · NUBIA</text>

          <path d={cauce} fill="none" stroke="url(#niRiver)" strokeWidth={5} strokeLinecap="round" opacity={0.55} />
          <path d={cauce} fill="none" stroke="var(--aa-gold)" strokeWidth={1} strokeLinecap="round" opacity={0.5} className="ni-flow" />

          {NODOS.map((nd, i) => {
            const on = sel === i;
            const x = nd.lado === 'i' ? RX - 46 : RX + 46;
            const tx = nd.lado === 'i' ? x - 12 : x + 12;
            return (
              <g key={nd.nombre} className={`ni-node ${on ? 'is-on' : ''}`} onClick={() => setSel(i)}
                 role="button" tabIndex={0}
                 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(i); } }}
                 aria-label={nd.nombre}>
                <line x1={RX} y1={nd.y} x2={x} y2={nd.y} stroke={on ? 'var(--aa-gold)' : 'var(--aa-violet-deep)'} strokeWidth={on ? 1 : 0.6} opacity={on ? 0.9 : 0.5} />
                <circle cx={x} cy={nd.y} r={on ? 6 : 4.2} fill={on ? 'var(--aa-gold-soft)' : 'var(--aa-violet-pale)'} />
                <text x={tx} y={nd.y + 3} className={`ni-label ${on ? 'is-on' : ''} ${nd.lado === 'i' ? 'is-r' : 'is-l'}`}>
                  {nd.nombre}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="ni-card" key={sel}>
        <p className="ni-cardName">{n.nombre}</p>
        <p className="ni-cardText">{n.sentido}</p>
      </div>

      {/* Cuerpo de iniciación */}
      <Reveal>
        <ModuleTitle>Egipto como cuerpo de iniciación</ModuleTitle>
        <div className="ni-body">
          {CUERPO.map(([k, v]) => (
            <div key={k} className="ni-bodyRow">
              <span className="ni-bodyK">{k}</span>
              <span className="ni-bodyEq" aria-hidden>=</span>
              <span className="ni-bodyV">{v}</span>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <Flow label="Del alma al sol" steps={['CUERPO', 'ALMA', 'JUICIO', 'RENACIMIENTO', 'SOLARIZACIÓN']} />
      </Reveal>

      {/* Heredero */}
      <Reveal>
        <ModuleTitle>Egipto como heredero</ModuleTitle>
        <div className="ni-heirs">
          {['herencia atlante', 'preservación sacerdotal', 'memoria solar', 'conocimiento bajo velo'].map((h) => (
            <span key={h} className="ni-heir">{h}</span>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <TechNote label="La clave del velo">
          Lo que se enseña abiertamente puede perderse con una civilización; lo que se inscribe en símbolo,
          proporción y rito puede atravesar milenios esperando a quien sepa leerlo.
        </TechNote>
      </Reveal>

      <style jsx global>{`
        .ni-canvas {
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
          padding: 0.9rem 0.3rem; margin: 0 0 1.1rem;
        }
        .ni-svg { display: block; width: 100%; max-width: 300px; height: auto; margin: 0 auto; }
        .ni-cardinal {
          font-family: var(--aa-mono); font-size: 6.5px; letter-spacing: 0.22em;
          text-anchor: middle; fill: var(--aa-text-dim);
        }
        .ni-flow { stroke-dasharray: 5 7; animation: niFlow 9s linear infinite; }
        @keyframes niFlow { to { stroke-dashoffset: -120; } }
        .ni-node { cursor: pointer; }
        .ni-node circle { transition: fill 220ms ease, r 220ms ease; }
        .ni-label {
          font-family: var(--aa-mono); font-size: 7px; letter-spacing: 0.1em;
          fill: var(--aa-violet-pale); pointer-events: none;
        }
        .ni-label.is-on { fill: var(--aa-gold-soft); }
        .ni-label.is-r { text-anchor: end; }
        .ni-label.is-l { text-anchor: start; }

        .ni-card {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-gold); padding: 1rem 1.15rem; margin: 0 0 1.7rem;
          animation: niIn 400ms ease both;
        }
        @keyframes niIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        .ni-cardName {
          font-family: var(--aa-mono); font-size: 0.8rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.5rem;
        }
        .ni-cardText { font-size: 0.95rem; line-height: 1.62; color: var(--aa-text); margin: 0; }

        .ni-body {
          display: flex; flex-direction: column; gap: 0.5rem; margin: 0 0 1.7rem;
          padding: 1.1rem 0.9rem; background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
        }
        .ni-bodyRow { display: flex; align-items: baseline; gap: 0.6rem; justify-content: center; flex-wrap: wrap; }
        .ni-bodyK {
          font-family: var(--aa-mono); font-size: 0.7rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-gold-soft); min-width: 112px; text-align: right;
        }
        .ni-bodyEq { color: var(--aa-violet-soft); font-family: var(--aa-mono); }
        .ni-bodyV { font-size: 0.92rem; color: var(--aa-text); flex: 1; }

        .ni-heirs { display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: center; margin: 0 0 1.6rem; }
        .ni-heir {
          font-family: var(--aa-mono); font-size: 0.64rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--aa-gold-soft);
          border: 1px solid var(--aa-gold-dim); background: var(--aa-gold-ghost);
          padding: 0.38rem 0.7rem; border-radius: 999px !important;
        }

        @media (max-width: 560px) {
          .ni-label { font-size: 6px; }
          .ni-bodyRow { flex-direction: column; gap: 0.1rem; align-items: center; }
          .ni-bodyK { min-width: 0; text-align: center; }
          .ni-bodyEq { display: none; }
          .ni-bodyV { flex: none; text-align: center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ni-card { animation: none !important; }
          .ni-flow { animation: none !important; }
          .ni-node circle { transition: none !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
