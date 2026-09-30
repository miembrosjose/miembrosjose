'use client';

// TEMPORADA 4 · EPISODIO 5 — MOISÉS / EL LEGADO ESENIO
//
// El puente de la temporada: de la promesa a la ley y de la ley a la comunidad
// que prepara. La continuidad mosaísmo → esenismo se presenta declaradamente
// como LECTURA DE CONTINUIDAD ESPIRITUAL, no como cadena histórica probada.

import { useState } from 'react';
import ArchivoShell, { Reveal, TechNote, SourceBlock, ModuleTitle } from './ArchivoShell';
import { ARCO_T4 } from './t4-arco';

type Paso = { titulo: string; sub: string; texto: string };

const PUENTE: Paso[] = [
  { titulo: 'Abraham', sub: 'promesa', texto: 'El pacto nace como relación personal: una voz que llama y alguien que responde.' },
  { titulo: 'Jacob / Israel', sub: 'linaje', texto: 'La promesa se vuelve estirpe: lo recibido por uno empieza a sostenerse entre muchos.' },
  { titulo: 'Esclavitud en Egipto', sub: 'prueba', texto: 'El linaje se forma bajo presión. La memoria sobrevive donde la libertad falta.' },
  { titulo: 'Moisés', sub: 'llamado', texto: 'Alguien formado en el palacio y en el desierto recibe el encargo de conducir la salida.' },
  { titulo: 'Éxodo', sub: 'liberación', texto: 'El movimiento hacia afuera: dejar la casa de servidumbre antes de saber adónde se llega.' },
  { titulo: 'Desierto', sub: 'purificación', texto: 'La travesía larga donde se aprende a depender de lo esencial.' },
  { titulo: 'Ley', sub: 'estructura', texto: 'La memoria se organiza: lo que era promesa se vuelve norma capaz de sostener a un pueblo.' },
  { titulo: 'Comunidad', sub: 'preparación', texto: 'La ley encuentra su forma viva en un cuerpo colectivo que la practica y la transmite.' },
];

const ESENIOS = ['pureza', 'servicio', 'comunidad', 'espera', 'disciplina', 'estudio', 'iniciación'];

export default function PuenteMoisesEsenio() {
  const [sel, setSel] = useState(3);
  const p = PUENTE[sel];

  return (
    <ArchivoShell
      guia="Ivika"
      voz="Memoria abierta"
      arco={{ pasos: ARCO_T4, actual: 5 }}
      lead="Si Abraham inaugura el pacto, Moisés organiza un pueblo para sostenerlo: la memoria se convierte en ley, travesía y estructura."
      registro="La ley fue un puente: primero sostuvo a un pueblo desde afuera, para que más adelante la humanidad pudiera descubrir la necesidad de escribir esa misma ley en lo profundo del ser."
    >
      <ModuleTitle>Del pacto a la ley</ModuleTitle>

      <div className="pm-bridge">
        {PUENTE.map((s, i) => {
          const on = sel === i;
          return (
            <div key={s.titulo} className={`pm-step ${on ? 'is-on' : ''}`}>
              {i > 0 && <span className="pm-drop" aria-hidden>↓</span>}
              <button type="button" onClick={() => setSel(i)} aria-expanded={on}>
                <span className="pm-title">{s.titulo}</span>
                <span className="pm-sub">{s.sub}</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="pm-card" key={sel}>
        <p className="pm-cardTitle">{p.titulo}</p>
        <p className="pm-cardSub">{p.sub}</p>
        <p className="pm-cardText">{p.texto}</p>
      </div>

      {/* Continuidad */}
      <Reveal>
        <ModuleTitle>Del mosaísmo al esenismo</ModuleTitle>
        <SourceBlock tipo="simbolica">
          <p>
            Se presenta como <strong>lectura de continuidad espiritual</strong>, no como cadena histórica
            demostrada.
          </p>
        </SourceBlock>
      </Reveal>

      <Reveal>
        <div className="pm-essene">
          <p className="pm-esseneTitle">Los esenios como preparación</p>
          <div className="pm-esseneGrid">
            {ESENIOS.map((e) => (
              <span key={e} className="pm-esseneItem">{e}</span>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal>
        <TechNote label="La idea central">
          Moisés organiza externamente lo que más adelante deberá ser interiorizado. La estructura no es el
          destino: es el andamio que permite construir lo que vendrá.
        </TechNote>
      </Reveal>

      <style jsx global>{`
        .pm-bridge {
          margin: 0 0 1.1rem; padding: 1.1rem 0.9rem;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
          display: flex; flex-direction: column; align-items: center;
        }
        .pm-step { display: flex; flex-direction: column; align-items: center; width: 100%; }
        .pm-drop { font-family: var(--aa-mono); font-size: 0.8rem; color: var(--aa-gold-dim); line-height: 1; padding: 0.18rem 0; }
        .pm-step button {
          display: flex; flex-direction: column; align-items: center; gap: 0.12rem;
          width: 100%; max-width: 260px; background: var(--aa-inner-2);
          border: 1px solid var(--aa-line); padding: 0.5rem 0.7rem; cursor: pointer;
          transition: border-color 220ms ease, background 220ms ease;
        }
        .pm-step.is-on button { border-color: var(--aa-gold-dim); background: #0d0d16; }
        .pm-title {
          font-family: var(--aa-mono); font-size: 0.7rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-violet-pale);
        }
        .pm-step.is-on .pm-title { color: var(--aa-gold-soft); }
        .pm-sub {
          font-family: var(--aa-mono); font-size: 0.55rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-text-dim);
        }

        .pm-card {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-gold); padding: 1.05rem 1.15rem; margin: 0 0 1.7rem;
          animation: pmIn 400ms ease both;
        }
        @keyframes pmIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        .pm-cardTitle {
          font-family: var(--aa-mono); font-size: 0.82rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.15rem;
        }
        .pm-cardSub {
          font-family: var(--aa-mono); font-size: 0.58rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-text-dim); margin: 0 0 0.55rem;
        }
        .pm-cardText { font-size: 0.95rem; line-height: 1.64; color: var(--aa-text); margin: 0; }


        .pm-essene {
          margin: 0 0 1.7rem; padding: 1.2rem 1rem;
          background: rgba(217, 184, 102, 0.04); border: 1px solid var(--aa-gold-dim);
        }
        .pm-esseneTitle {
          font-family: var(--aa-mono); font-size: 0.68rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-gold); text-align: center; margin: 0 0 0.8rem;
        }
        .pm-esseneGrid { display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: center; }
        .pm-esseneItem {
          font-family: var(--aa-mono); font-size: 0.66rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-gold-soft);
          border: 1px solid var(--aa-gold-dim); padding: 0.36rem 0.7rem;
          border-radius: 999px !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .pm-card { animation: none !important; }
          .pm-step button { transition: none !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
