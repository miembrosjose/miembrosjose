'use client';

// TEMPORADA 3 · EPISODIO 3 — LAS GUERRAS DE ORIÓN
//
// Archivo de conflicto. La bifurcación es lo central: no «buenos contra malos»,
// sino dos modelos de evolución incompatibles —orden sin libertad frente a
// libertad con riesgo—. El bloque "No todo Orión" es obligatorio: la enseñanza
// distingue entre los grupos que siguieron la rebelión y el resto.

import ArchivoShell, { Reveal, KeyBox, TechNote, ModuleTitle } from './ArchivoShell';
import { ARCO_T3 } from './t3-arco';

const ESCALADA = ['DESACUERDO', 'DISIDENCIA', 'CONFLICTO', 'GUERRA', 'DERROTA', 'DEPORTACIÓN'];

export default function ConflictoOrion() {
  return (
    <ArchivoShell
      guia="Antarel"
      arco={{ pasos: ARCO_T3, actual: 3 }}
      lead="Orión y Pléyades llegaron como Guardianes del proceso humano. El conflicto no empieza con una invasión, sino con un desacuerdo: cuánta libertad aguantaba una humanidad en formación."
      registro="Cuánto orden puede imponerse antes de que aquello que se protege pierda justo la libertad que tenía que aprender a usar. La pregunta sigue abierta."
    >
      <ModuleTitle>El punto de ruptura</ModuleTitle>

      {/* Origen común */}
      <div className="co-origin">
        <p className="co-originLabel">Guardianes del proyecto</p>
        <div className="co-originPair">
          <span>ORIÓN</span>
          <span className="co-plus" aria-hidden>+</span>
          <span>PLÉYADES</span>
        </div>
        <span className="co-drop" aria-hidden />
        <p className="co-originTarget">TIERRA</p>
      </div>

      {/* Bifurcación */}
      <Reveal>
        <div className="co-fork">
          <div className="co-branch is-plan">
            <p className="co-branchTag">Continúa en el Plan</p>
            <p className="co-branchName">Orión</p>
            <p className="co-branchText">Una parte de Orión permanece dentro del programa evolutivo.</p>
          </div>
          <div className="co-branch is-break">
            <p className="co-branchTag">Ruptura</p>
            <p className="co-branchName">Satanel</p>
            <p className="co-branchText">
              Satanel interpreta la imprevisibilidad humana como un riesgo para el orden del proyecto.
            </p>
            <span className="co-branchArrow" aria-hidden>↓</span>
            <p className="co-branchEnd">CONTROL</p>
          </div>
        </div>
      </Reveal>

      {/* Dos posiciones */}
      <Reveal>
        <div className="co-positions">
          <div className="co-pos">
            <p className="co-posTag">Posición A</p>
            <p className="co-posName">Libertad</p>
            <p className="co-posText">La humanidad debe atravesar su propio proceso.</p>
          </div>
          <div className="co-vs">
            <span className="co-vsLine" aria-hidden />
            <span className="co-vsWord">el conflicto</span>
            <span className="co-vsLine" aria-hidden />
          </div>
          <div className="co-pos">
            <p className="co-posTag">Posición B</p>
            <p className="co-posName">Control</p>
            <p className="co-posText">Una humanidad impredecible debe ser dirigida o neutralizada.</p>
          </div>
        </div>
        <p className="co-thesis">
          ORDEN SIN LIBERTAD <span className="co-thesisVs">vs</span> LIBERTAD CON RIESGO
        </p>
      </Reveal>

      {/* Escalada */}
      <Reveal>
        <ModuleTitle>Escalada</ModuleTitle>
        <div className="co-escalada">
          {ESCALADA.map((e, i) => (
            <div key={e} className="co-step" style={{ opacity: 1 - i * 0.045 }}>
              <span className="co-stepIdx">{String(i + 1).padStart(2, '0')}</span>
              <span className="co-stepName">{e}</span>
              <span className="co-stepBar" style={{ width: `${25 + i * 15}%` }} aria-hidden />
            </div>
          ))}
        </div>
        <div className="co-outcome">
          <p><span className="co-oK">CONFEDERACIÓN</span> <span className="co-oArrow" aria-hidden>→</span> derrota de los disidentes</p>
          <p><span className="co-oK">DISIDENTES DE ORIÓN</span> <span className="co-oArrow" aria-hidden>→</span> Tierra</p>
        </div>
      </Reveal>

      <Reveal>
        <KeyBox
          tone="violet"
          title="No todo Orión"
          text="Orión reúne diferentes sistemas, pueblos y civilizaciones. La rebelión correspondió a Satanael y a los grupos que lo siguieron; el resto permaneció dentro del Plan."
        />
      </Reveal>

      {/* Cambio de guardia */}
      <Reveal>
        <ModuleTitle>Cambio de guardia</ModuleTitle>
        <div className="co-guard">
          <div className="co-guardOut">
            <p className="co-guardName">Orión</p>
            <p className="co-guardState">parcialmente retirado</p>
          </div>
          <span className="co-guardArrow" aria-hidden>→</span>
          <div className="co-guardIn">
            <p className="co-guardName is-gold">Sirio</p>
            <p className="co-guardState">entra en funciones</p>
          </div>
          <span className="co-guardPlus" aria-hidden>+</span>
          <div className="co-guardIn">
            <p className="co-guardName is-gold">Pléyades</p>
            <p className="co-guardState">continúa</p>
          </div>
        </div>
      </Reveal>

      {/* La revelación */}
      <Reveal>
        <div className="co-reveal">
          <p className="co-revealTag">El error que viaja</p>
          <p className="co-revealText">
            Los disidentes son enviados precisamente al mundo cuya evolución habían querido controlar.
          </p>
          <p className="co-revealBig">
            El conflicto cósmico terminó dentro del experimento humano.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <TechNote label="Lectura">
          No es un conflicto entre bandos, sino entre dos modelos de evolución: uno que confía en el orden
          impuesto y otro que acepta el riesgo como precio del aprendizaje. El mismo pulso se repite dentro
          de cada uno, cada vez que el miedo pide control.
        </TechNote>
      </Reveal>

      <style jsx global>{`
        .co-origin {
          text-align: center; margin: 0 0 1.5rem; padding: 1.2rem 1rem;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
        }
        .co-originLabel {
          font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.22em;
          text-transform: uppercase; color: var(--aa-text-dim); margin: 0 0 0.7rem;
        }
        .co-originPair {
          display: flex; align-items: center; justify-content: center; gap: 0.7rem;
          font-family: var(--aa-mono); font-size: 0.95rem; letter-spacing: 0.14em;
          color: var(--aa-gold-soft);
        }
        .co-plus { color: var(--aa-violet-soft); }
        .co-drop { display: block; width: 1px; height: 20px; margin: 0.7rem auto; background: var(--aa-gold-dim); }
        .co-originTarget {
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.05rem;
          letter-spacing: 0.22em; color: var(--aa-gold); margin: 0;
        }

        .co-fork { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; margin: 0 0 1.6rem; }
        .co-branch {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          padding: 0.95rem 0.9rem; text-align: center;
        }
        .co-branch.is-plan { border-top: 2px solid var(--aa-gold-dim); }
        .co-branch.is-break { border-top: 2px solid var(--aa-violet-soft); }
        .co-branchTag {
          font-family: var(--aa-mono); font-size: 0.56rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-text-dim); margin: 0 0 0.4rem;
        }
        .co-branchName {
          font-family: var(--aa-mono); font-size: 0.85rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.5rem;
        }
        .co-branchText { font-size: 0.87rem; line-height: 1.5; color: var(--aa-text); margin: 0; }
        .co-branchArrow { display: block; font-family: var(--aa-mono); color: var(--aa-violet-soft); margin: 0.45rem 0 0.2rem; }
        .co-branchEnd {
          font-family: var(--aa-mono); font-size: 0.72rem; letter-spacing: 0.2em;
          color: var(--aa-violet-pale); margin: 0;
        }

        .co-positions { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 0.6rem; margin: 0 0 1rem; }
        .co-pos { background: var(--aa-inner-2); border: 1px solid var(--aa-line); padding: 0.95rem 0.9rem; }
        .co-posTag {
          font-family: var(--aa-mono); font-size: 0.56rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-text-dim); margin: 0 0 0.35rem;
        }
        .co-posName {
          font-family: var(--aa-mono); font-size: 0.82rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.45rem;
        }
        .co-posText { font-size: 0.87rem; line-height: 1.5; color: var(--aa-text); margin: 0; }
        .co-vs { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; }
        .co-vsLine { display: block; width: 1px; height: 22px; background: var(--aa-gold-dim); }
        .co-vsWord {
          font-family: var(--aa-mono); font-size: 0.54rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-gold); writing-mode: vertical-rl;
        }
        .co-thesis {
          font-family: var(--aa-mono); font-size: 0.72rem; letter-spacing: 0.14em;
          text-align: center; color: var(--aa-gold-soft); margin: 0 0 1.7rem;
        }
        .co-thesisVs { color: var(--aa-violet-soft); margin: 0 0.6em; }

        .co-escalada { margin: 0 0 1rem; }
        .co-step {
          display: flex; align-items: center; gap: 0.65rem;
          padding: 0.42rem 0; border-bottom: 1px solid var(--aa-line);
        }
        .co-stepIdx { font-family: var(--aa-mono); font-size: 0.56rem; color: var(--aa-text-dim); }
        .co-stepName {
          font-family: var(--aa-mono); font-size: 0.68rem; letter-spacing: 0.16em;
          color: var(--aa-gold-soft); min-width: 108px;
        }
        .co-stepBar { height: 2px; background: linear-gradient(90deg, var(--aa-violet-deep), var(--aa-gold-dim)); }

        .co-outcome { margin: 0 0 1.7rem; }
        .co-outcome p {
          font-size: 0.92rem; line-height: 1.6; color: var(--aa-text); margin: 0 0 0.3rem;
        }
        .co-oK { font-family: var(--aa-mono); font-size: 0.68rem; letter-spacing: 0.14em; color: var(--aa-gold-soft); }
        .co-oArrow { color: var(--aa-violet-soft); margin: 0 0.35em; }

        .co-guard {
          display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0.7rem;
          margin: 0 0 1.7rem; padding: 1.1rem 0.8rem;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
        }
        .co-guardOut, .co-guardIn { text-align: center; }
        .co-guardOut { opacity: 0.6; }
        .co-guardName {
          font-family: var(--aa-mono); font-size: 0.78rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-violet-pale); margin: 0 0 0.2rem;
        }
        .co-guardName.is-gold { color: var(--aa-gold-soft); }
        .co-guardState { font-family: var(--aa-mono); font-size: 0.56rem; letter-spacing: 0.12em; color: var(--aa-text-dim); margin: 0; }
        .co-guardArrow, .co-guardPlus { font-family: var(--aa-mono); font-size: 0.9rem; color: var(--aa-gold-dim); }

        .co-reveal {
          margin: 0 0 1.7rem; padding: 1.4rem 1.1rem; text-align: center;
          background: rgba(217, 184, 102, 0.045);
          border: 1px solid var(--aa-gold-dim);
        }
        .co-revealTag {
          font-family: var(--aa-mono); font-size: 0.58rem; letter-spacing: 0.24em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0 0 0.7rem;
        }
        .co-revealText { font-size: 0.96rem; line-height: 1.6; color: var(--aa-text); margin: 0 0 0.9rem; }
        .co-revealBig {
          font-family: var(--aa-mono); font-size: clamp(0.8rem, 3.2vw, 1rem);
          letter-spacing: 0.1em; line-height: 1.6; text-transform: uppercase;
          color: var(--aa-gold-soft); margin: 0;
        }


        @media (max-width: 560px) {
          .co-fork { grid-template-columns: 1fr; }
          .co-positions { grid-template-columns: 1fr; }
          .co-vs { flex-direction: row; }
          .co-vsLine { width: 22px; height: 1px; }
          .co-vsWord { writing-mode: horizontal-tb; }
          .co-stepName { min-width: 88px; font-size: 0.62rem; }
        }
      `}</style>
    </ArchivoShell>
  );
}
