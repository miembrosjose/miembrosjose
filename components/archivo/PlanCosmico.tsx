'use client';

// TEMPORADA 3 · EPISODIO 1 — EL PLAN CÓSMICO
//
// Mapa general del experimento. La pieza fuerte es la partición 8 = 3 + 4 + 1:
// tres mundos destruidos, cuatro estancados y uno —la Tierra— donde el control
// se perdió y precisamente por eso quedó abierta otra posibilidad.
//
// La cronología del Plan es navegable: cada hito abre una línea de lectura.

import { useState } from 'react';
import ArchivoShell, { Reveal, Flow, KeyBox, TechNote, ModuleTitle } from './ArchivoShell';
import { ARCO_T3 } from './t3-arco';

const MUNDOS: { n: number; titulo: string; texto: string; tone: 'roto' | 'estancado' | 'tierra' }[] = [
  { n: 3, titulo: 'Destruidos', texto: 'El proceso terminó en destrucción.', tone: 'roto' },
  { n: 4, titulo: 'Estancados', texto: 'El exceso de protección y dependencia detuvo su evolución.', tone: 'estancado' },
  { n: 1, titulo: 'Tierra', texto: 'Los interventores perdieron progresivamente el control.', tone: 'tierra' },
];

const FASES = ['SEMBRADORES', 'GUARDIANES', 'VIGILANTES', 'INSTRUCTORES', 'HUMANIDAD'];

const CRONOLOGIA: [string, string][] = [
  ['Tierra seleccionada', 'Uno de los ocho mundos UR elegidos dentro de cuatro galaxias del Grupo Local.'],
  ['Desarrollo humano', 'La humanidad comienza su proceso dentro del escenario preparado para el experimento.'],
  ['Lemuria', 'Una civilización organizada alrededor de la conexión entre consciencia, naturaleza y planeta.'],
  ['Olvido', 'La memoria del origen deja de estar presente dentro de la experiencia cotidiana.'],
  ['Guardianes de Orión y Pléyades', 'Ambas civilizaciones son enviadas al proyecto como Guardianes y Vigilantes.'],
  ['Guerras de Orión', 'El desacuerdo entre libertad y control escala hasta el conflicto abierto.'],
  ['Transgresión pleyadiana', 'Un grupo de Vigilantes rompe la frontera de la no intervención sobre la humanidad.'],
  ['Atlántida', 'Del linaje mestizo surge una civilización con capacidad muy superior a su madurez.'],
  ['Caída', 'El poder crece más rápido que la responsabilidad y la civilización colapsa.'],
  ['144 instructores', 'Un cuerpo de instructores queda a cargo de sostener la enseñanza después de la caída.'],
  ['Hermandad Blanca', 'Se establece en Gobi una red interior destinada a preservar la memoria planetaria.'],
  ['Reconexión', 'Objetivo final: que la humanidad participe por sí misma en la futura sincronización.'],
];

export default function PlanCosmico() {
  const [hito, setHito] = useState<number | null>(null);

  return (
    <ArchivoShell
      guia="Antarel"
      arco={{ pasos: ARCO_T3, actual: 1 }}
      lead="El Plan Cósmico es un experimento evolutivo destinado a explorar si determinadas civilizaciones podían desarrollar consciencia, libertad y capacidades suficientes para participar activamente en la reconexión de diferentes niveles de realidad. La Tierra no habría sido el único escenario. Formaba parte de un sistema mucho mayor."
      registro="El Plan no necesitaba una especie perfectamente obediente; necesitaba una consciencia capaz de aprender dentro de la libertad y, después de equivocarse, elegir deliberadamente su propio regreso al equilibrio."
    >
      <ModuleTitle>Arquitectura del Plan</ModuleTitle>

      {/* Primer nivel — marcos temporales */}
      <div className="pc-level">
        <Flow steps={['REAL TIEMPO DEL UNIVERSO', 'INTERVENCIÓN', 'TIEMPO ALTERNATIVO']} />
        <p className="pc-levelNote">
          Los interventores ingresan en una realidad temporal diferente de aquella de la cual proceden.
        </p>
      </div>

      {/* Segundo nivel — 4 galaxias / 8 mundos */}
      <Reveal>
        <div className="pc-ur">
          <div className="pc-galaxies" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="pc-galaxy" style={{ animationDelay: `${i * 140}ms` }} />
            ))}
          </div>
          <p className="pc-urLabel">4 galaxias del Grupo Local</p>
          <span className="pc-drop" aria-hidden />
          <p className="pc-urBig">8</p>
          <p className="pc-urSub">Planetas UR</p>
          <p className="pc-urText">
            Ocho mundos fueron seleccionados dentro de cuatro galaxias del Grupo Local para participar de un
            mismo programa evolutivo.
          </p>
        </div>
      </Reveal>

      {/* La partición 8 = 3 + 4 + 1 */}
      <Reveal>
        <div className="pc-split">
          <p className="pc-splitFormula">
            8 <span className="pc-op">=</span> 3 <span className="pc-op">+</span> 4 <span className="pc-op">+</span> 1
          </p>
          <div className="pc-splitGrid">
            {MUNDOS.map((m) => (
              <div key={m.titulo} className={`pc-world is-${m.tone}`}>
                <p className="pc-worldNum">{m.n}</p>
                <p className="pc-worldTitle">{m.titulo}</p>
                <p className="pc-worldText">{m.texto}</p>
              </div>
            ))}
          </div>
          <p className="pc-paradox">
            Paradójicamente, el mundo menos controlado se convirtió en el mundo con mayor posibilidad de
            generar un resultado diferente.
          </p>
        </div>
      </Reveal>

      {/* Dos trayectorias */}
      <Reveal>
        <div className="pc-paths">
          <div className="pc-path is-closed">
            <p className="pc-pathLabel">Trayectoria cerrada</p>
            <span className="pc-pathNode">CONTROL</span>
            <span className="pc-pathArrow" aria-hidden>↓</span>
            <span className="pc-pathNode">DEPENDENCIA</span>
          </div>
          <div className="pc-path is-open">
            <p className="pc-pathLabel">Trayectoria abierta</p>
            <span className="pc-pathNode">LIBERTAD</span>
            <span className="pc-pathArrow" aria-hidden>↓</span>
            <span className="pc-pathNode">RIESGO</span>
            <span className="pc-pathArrow" aria-hidden>↓</span>
            <span className="pc-pathNode">APRENDIZAJE</span>
            <span className="pc-pathArrow" aria-hidden>↓</span>
            <span className="pc-pathNode">POTENCIAL</span>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <TechNote label="La paradoja del Plan">
          El éxito no podía consistir en fabricar una civilización obediente. Una humanidad completamente
          dirigida habría aprendido a depender; una humanidad completamente abandonada podía destruirse. El
          experimento necesitaba un tercer elemento: libertad consciente.
        </TechNote>
      </Reveal>

      {/* Fases de intervención */}
      <Reveal>
        <ModuleTitle>Fases de intervención</ModuleTitle>
        <div className="pc-fases">
          {FASES.map((f, i) => (
            <span key={f} className="pc-fase">
              {i > 0 && <span className="pc-faseArrow" aria-hidden>→</span>}
              <span className="pc-faseNode">{f}</span>
            </span>
          ))}
        </div>
        <p className="pc-faseNote">No es una escala de valor. Son funciones.</p>
      </Reveal>

      {/* Cronología navegable */}
      <Reveal>
        <ModuleTitle>Cronología del Plan</ModuleTitle>
        <div className="pc-timeline">
          {CRONOLOGIA.map(([titulo, texto], i) => {
            const on = hito === i;
            return (
              <div key={i} className={`pc-hito ${on ? 'is-on' : ''}`}>
                <button type="button" onClick={() => setHito(on ? null : i)} aria-expanded={on}>
                  <span className="pc-hitoDot" aria-hidden />
                  <span className="pc-hitoTitle">{titulo}</span>
                </button>
                {on && <p className="pc-hitoText">{texto}</p>}
              </div>
            );
          })}
        </div>
      </Reveal>

      <Reveal>
        <TechNote label="Objetivo final">
          No «salvar» a la Tierra: reconexión. La humanidad debía desarrollar por sí misma las capacidades
          necesarias para participar en la futura sincronización entre el Tiempo Alternativo y el Real Tiempo
          del Universo.
        </TechNote>
      </Reveal>

      <Reveal>
        <KeyBox
          title="Condición de reconexión"
          formula={
            <>
              EXPERIENCIA <span className="op">+</span> LIBRE ALBEDRÍO <span className="op">+</span> CONSCIENCIA
              <br />
              <span className="op">=</span>
              <br />
              CAPACIDAD DE RECONEXIÓN
            </>
          }
        />
      </Reveal>

      <style jsx global>{`
        .pc-level { margin: 0 0 1.6rem; }
        .pc-level .aa-flow { margin-bottom: 0.7rem; }
        .pc-levelNote { font-size: 0.94rem; line-height: 1.6; color: var(--aa-text-dim); text-align: center; margin: 0; }

        .pc-ur {
          margin: 0 0 1.6rem; padding: 1.5rem 1rem; text-align: center;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
        }
        .pc-galaxies { display: flex; justify-content: center; gap: 1.4rem; margin: 0 0 0.7rem; }
        .pc-galaxy {
          width: 14px; height: 14px; border: 1px solid var(--aa-violet-soft);
          border-radius: 999px !important; opacity: 0.85;
          animation: pcPulse 3.4s ease-in-out infinite;
        }
        @keyframes pcPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.95; } }
        .pc-urLabel {
          font-family: var(--aa-mono); font-size: 0.62rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-text-dim); margin: 0;
        }
        .pc-drop { display: block; width: 1px; height: 22px; margin: 0.6rem auto; background: var(--aa-gold-dim); }
        .pc-urBig {
          font-family: var(--aa-mono); font-weight: 700; font-size: 3.2rem; line-height: 1;
          color: var(--aa-gold-soft); margin: 0; text-shadow: 0 0 26px rgba(217, 184, 102, 0.35);
        }
        .pc-urSub {
          font-family: var(--aa-mono); font-size: 0.7rem; letter-spacing: 0.24em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0.35rem 0 0.9rem;
        }
        .pc-urText { font-size: 0.95rem; line-height: 1.62; color: var(--aa-text); margin: 0; max-width: 46ch; margin-inline: auto; }

        .pc-split { margin: 0 0 1.6rem; }
        .pc-splitFormula {
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.4rem;
          color: var(--aa-gold-soft); text-align: center; margin: 0 0 1rem; letter-spacing: 0.06em;
        }
        .pc-op { color: var(--aa-violet-soft); margin: 0 0.3em; }
        .pc-splitGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.55rem; margin: 0 0 1rem; }
        .pc-world {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-top: 2px solid var(--aa-violet-deep); padding: 0.9rem 0.75rem; text-align: center;
        }
        .pc-world.is-roto { opacity: 0.72; }
        .pc-world.is-tierra { border-top-color: var(--aa-gold); background: rgba(217, 184, 102, 0.05); }
        .pc-worldNum {
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.7rem; line-height: 1;
          color: var(--aa-violet-pale); margin: 0 0 0.35rem;
        }
        .pc-world.is-tierra .pc-worldNum { color: var(--aa-gold-soft); text-shadow: 0 0 16px rgba(217, 184, 102, 0.4); }
        .pc-worldTitle {
          font-family: var(--aa-mono); font-size: 0.64rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0 0 0.45rem;
        }
        .pc-worldText { font-size: 0.83rem; line-height: 1.45; color: var(--aa-text-dim); margin: 0; }
        .pc-paradox {
          font-size: 0.99rem; line-height: 1.66; color: var(--aa-text-soft);
          text-align: center; margin: 0; font-style: italic;
        }

        .pc-paths { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin: 0 0 1.6rem; }
        .pc-path {
          display: flex; flex-direction: column; align-items: center; gap: 0.2rem;
          padding: 1rem 0.8rem; background: var(--aa-inner-2); border: 1px solid var(--aa-line);
        }
        .pc-path.is-closed { border-top: 2px solid var(--aa-violet-deep); }
        .pc-path.is-open { border-top: 2px solid var(--aa-gold-dim); }
        .pc-pathLabel {
          font-family: var(--aa-mono); font-size: 0.58rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-text-dim); margin: 0 0 0.5rem;
        }
        .pc-pathNode {
          font-family: var(--aa-mono); font-size: 0.7rem; letter-spacing: 0.12em;
          color: var(--aa-violet-pale);
        }
        .pc-path.is-open .pc-pathNode { color: var(--aa-gold-soft); }
        .pc-pathArrow { font-family: var(--aa-mono); font-size: 0.75rem; color: var(--aa-gold-dim); }

        .pc-fases { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0.15rem; margin: 0 0 0.6rem; }
        .pc-fase { display: inline-flex; align-items: center; gap: 0.15rem; }
        .pc-faseArrow { font-family: var(--aa-mono); font-size: 0.72rem; color: var(--aa-gold-dim); }
        .pc-faseNode {
          font-family: var(--aa-mono); font-size: 0.62rem; letter-spacing: 0.1em;
          color: var(--aa-gold-soft); padding: 0.26rem 0.4rem;
        }
        .pc-faseNote {
          font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.14em;
          color: var(--aa-text-dim); text-align: center; margin: 0 0 1.7rem;
        }

        .pc-timeline {
          margin: 0 0 1.7rem; padding: 1rem 0.9rem;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
        }
        .pc-hito { position: relative; padding-left: 0.2rem; }
        .pc-hito button {
          display: flex; align-items: center; gap: 0.7rem; width: 100%;
          background: transparent; border: none; cursor: pointer;
          padding: 0.42rem 0; text-align: left;
        }
        .pc-hitoDot {
          flex: 0 0 auto; width: 8px; height: 8px; border-radius: 999px !important;
          border: 1px solid var(--aa-violet-soft); background: var(--aa-inner);
          transition: background 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
        }
        .pc-hito.is-on .pc-hitoDot {
          background: var(--aa-gold); border-color: var(--aa-gold);
          box-shadow: 0 0 10px rgba(217, 184, 102, 0.5);
        }
        .pc-hitoTitle {
          font-family: var(--aa-mono); font-size: 0.68rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--aa-text-dim);
          transition: color 220ms ease;
        }
        .pc-hito.is-on .pc-hitoTitle { color: var(--aa-gold-soft); }
        .pc-hito:not(:last-child)::before {
          content: ''; position: absolute; left: 4.2px; top: 1.5rem; bottom: -0.2rem;
          width: 1px; background: var(--aa-violet-deep); opacity: 0.55;
        }
        .pc-hitoText {
          font-size: 0.9rem; line-height: 1.55; color: var(--aa-text);
          margin: 0 0 0.55rem; padding-left: 1.4rem;
          animation: pcIn 340ms ease both;
        }
        @keyframes pcIn { from { opacity: 0; } to { opacity: 1; } }

        @media (max-width: 560px) {
          .pc-splitGrid { grid-template-columns: 1fr; }
          .pc-paths { grid-template-columns: 1fr; }
          .pc-urBig { font-size: 2.6rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pc-galaxy { animation: none !important; }
          .pc-hitoText { animation: none !important; }
          .pc-hitoDot, .pc-hitoTitle { transition: none !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
