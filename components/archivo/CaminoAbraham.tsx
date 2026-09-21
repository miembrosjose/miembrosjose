'use client';

// TEMPORADA 4 · EPISODIO 4 — ABRAHAM / EL PACTO
//
// Ruta doble: cada etapa geográfica del camino lleva pareada su etapa interior.
// La lectura horizontal (exterior ↔ interior) es el módulo entero: el viaje de
// Abraham y el viaje del alma ocupan la misma línea.

import { useState } from 'react';
import ArchivoShell, { Reveal, KeyBox, TechNote, ModuleTitle } from './ArchivoShell';
import { ARCO_T4 } from './t4-arco';

type Etapa = { fuera: string; dentro: string; texto: string };

const RUTA: Etapa[] = [
  { fuera: 'Ur', dentro: 'Salir', texto: 'Dejar la ciudad de origen: el primer movimiento no es geográfico, es la disposición a soltar lo conocido.' },
  { fuera: 'Harán', dentro: 'Confiar', texto: 'La parada intermedia, donde el camino deja de tener mapa y empieza a tener escucha.' },
  { fuera: 'Canaán', dentro: 'Recibir', texto: 'La tierra prometida aparece primero como palabra y solo después como territorio.' },
  { fuera: 'Altares', dentro: 'Pactar', texto: 'Cada altar marca un punto donde la relación se sella y se vuelve memoria en el camino.' },
  { fuera: 'Descendencia', dentro: 'Encarnar', texto: 'La promesa deja de ser individual: se convierte en corriente que atraviesa generaciones.' },
  { fuera: 'Promesa', dentro: 'Misión', texto: 'Lo recibido se transforma en encargo: la bendición existe para ser transmitida.' },
];

const CLAVES = ['escucha', 'obediencia consciente', 'ruptura con lo antiguo', 'linaje', 'bendición', 'responsabilidad'];

export default function CaminoAbraham() {
  const [sel, setSel] = useState(0);
  const e = RUTA[sel];

  return (
    <ArchivoShell
      guia="Ivika"
      voz="Memoria abierta"
      arco={{ pasos: ARCO_T4, actual: 4 }}
      lead="Abraham representa una transición decisiva. La memoria ya no se expresa únicamente en templos, ciudades o retiros, sino en una relación viva entre el ser humano y una promesa. Con Abraham comienza un camino de fidelidad, escucha y desplazamiento interior."
      registro="El pacto inaugura una forma nueva de memoria: ya no solo la que se preserva en piedra o escritura, sino la que se carga en el corazón de quienes aceptan caminar en fidelidad a un llamado."
    >
      <ModuleTitle>Mapa del pacto</ModuleTitle>

      <div className="ca-route">
        <div className="ca-heads">
          <span>Camino</span>
          <span className="is-gold">Interior</span>
        </div>
        {RUTA.map((r, i) => {
          const on = sel === i;
          return (
            <div key={r.fuera} className={`ca-step ${on ? 'is-on' : ''}`}>
              {i > 0 && <span className="ca-link" aria-hidden />}
              <button type="button" onClick={() => setSel(i)} aria-expanded={on}>
                <span className="ca-dot" aria-hidden />
                <span className="ca-fuera">{r.fuera}</span>
                <span className="ca-sep" aria-hidden>·</span>
                <span className="ca-dentro">{r.dentro}</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="ca-card" key={sel}>
        <p className="ca-cardHead">
          <span className="ca-cardOut">{e.fuera}</span>
          <span className="ca-cardArrow" aria-hidden>→</span>
          <span className="ca-cardIn">{e.dentro}</span>
        </p>
        <p className="ca-cardText">{e.texto}</p>
      </div>

      <Reveal>
        <ModuleTitle>Las claves del pacto</ModuleTitle>
        <div className="ca-keys">
          {CLAVES.map((c) => (
            <span key={c} className="ca-key">{c}</span>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <KeyBox
          title="La naturaleza del pacto"
          formula={
            <>
              EL PACTO NO ES POSESIÓN
              <br />
              <span className="op">=</span>
              <br />
              ES RESPONSABILIDAD
            </>
          }
          text="La promesa no es solo biológica ni territorial: es una corriente de consciencia que debe sostenerse."
        />
      </Reveal>

      <Reveal>
        <TechNote label="Abraham como bisagra">
          Egipto y Mesopotamia quedan detrás. Con Abraham surge una línea de interiorización y relación con
          un Dios vivo que llama, desplaza y orienta.
        </TechNote>
      </Reveal>

      <Reveal>
        <div className="ca-arch">
          <p className="ca-archText">
            Abraham no es solamente el padre de un pueblo: es el arquetipo del alma que responde a un llamado
            más grande que su comodidad.
          </p>
        </div>
      </Reveal>

      <style jsx global>{`
        .ca-route {
          margin: 0 0 1.1rem; padding: 1.1rem 0.9rem;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
        }
        .ca-heads {
          display: flex; justify-content: space-between; padding: 0 0.2rem 0.6rem;
          margin-bottom: 0.4rem; border-bottom: 1px solid var(--aa-line);
          font-family: var(--aa-mono); font-size: 0.56rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-text-dim);
        }
        .ca-heads .is-gold { color: var(--aa-gold); }
        .ca-step { display: flex; flex-direction: column; }
        .ca-link { display: block; width: 1px; height: 13px; margin-left: 4px; background: var(--aa-gold-dim); }
        .ca-step button {
          display: flex; align-items: center; gap: 0.6rem; width: 100%;
          background: transparent; border: none; cursor: pointer; padding: 0.4rem 0; text-align: left;
        }
        .ca-dot {
          flex: 0 0 auto; width: 9px; height: 9px; border-radius: 999px !important;
          border: 1px solid var(--aa-violet-soft); background: var(--aa-inner);
          transition: background 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
        }
        .ca-step.is-on .ca-dot {
          background: var(--aa-gold); border-color: var(--aa-gold);
          box-shadow: 0 0 10px rgba(217, 184, 102, 0.5);
        }
        .ca-fuera {
          font-family: var(--aa-mono); font-size: 0.7rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-violet-pale); flex: 1;
        }
        .ca-step.is-on .ca-fuera { color: var(--aa-gold-soft); }
        .ca-sep { color: var(--aa-gold-dim); }
        .ca-dentro {
          font-family: var(--aa-mono); font-size: 0.66rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--aa-text-dim); flex: 1; text-align: right;
        }
        .ca-step.is-on .ca-dentro { color: var(--aa-gold); }

        .ca-card {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-gold); padding: 1.05rem 1.15rem; margin: 0 0 1.7rem;
          animation: caIn 400ms ease both;
        }
        @keyframes caIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        .ca-cardHead { display: flex; align-items: baseline; gap: 0.6rem; margin: 0 0 0.55rem; flex-wrap: wrap; }
        .ca-cardOut {
          font-family: var(--aa-mono); font-size: 0.82rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-gold-soft);
        }
        .ca-cardArrow { color: var(--aa-violet-soft); }
        .ca-cardIn {
          font-family: var(--aa-mono); font-size: 0.7rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-violet-pale);
        }
        .ca-cardText { font-size: 0.95rem; line-height: 1.64; color: var(--aa-text); margin: 0; }

        .ca-keys { display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: center; margin: 0 0 1.7rem; }
        .ca-key {
          font-family: var(--aa-mono); font-size: 0.64rem; letter-spacing: 0.12em;
          color: #cbb9e6; background: var(--aa-violet-ghost);
          border: 1px solid var(--aa-violet-deep); padding: 0.38rem 0.7rem;
          border-radius: 999px !important;
        }

        .ca-arch {
          margin: 0 0 1.6rem; padding: 1.3rem 1.1rem; text-align: center;
          background: rgba(217, 184, 102, 0.045); border: 1px solid var(--aa-gold-dim);
        }
        .ca-archText {
          font-family: var(--aa-eb-garamond), Georgia, serif; font-style: italic;
          font-size: 1.06rem; line-height: 1.6; color: var(--aa-gold-soft); margin: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .ca-card { animation: none !important; }
          .ca-dot { transition: none !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
