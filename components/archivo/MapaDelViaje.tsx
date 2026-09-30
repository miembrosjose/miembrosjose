'use client';

// TEMPORADA 1 · EPISODIO 1 — INICIO A TU VIAJE / BIENVENIDOS
//
// El mapa de navegación de la plataforma.
//
// ── QUÉ SE QUITÓ Y POR QUÉ ─────────────────────────────────────────────────
// Esto llegó a tener nueve módulos y se hacía eterno justo donde peor sienta:
// en el primer episodio, cuando nadie ha decidido todavía si se queda.
//
// Fuera la fase «Entrar · Bienvenida», que explicaba qué es Los 144.000
// DENTRO del video que explica qué es Los 144.000.
//
// Fuera el diagrama «Episodio → Experiencia → Bitácora», que era el paso 5 del
// ciclo dibujado otra vez dos módulos más abajo.
//
// Fuera la frase de cada recurso. Eran seis descripciones genéricas —«profundiza
// conceptos cuando necesites ampliar información»— para cosas que están en el
// menú superior. Quedan los nombres: eso es lo único que hacía falta saber.
//
// Fuera la escalera de nueve puntos de la segunda etapa y las dos notas sobre
// misión y contacto. Nada de eso existe todavía para quien está aquí; era
// prometer el final en la primera página.
//
// Lo que se queda es lo que se usa: a dónde vas, qué haces con cada episodio,
// para qué sirve la bitácora y que hay algo después.

import { useState } from 'react';
import ArchivoShell, { Reveal, TechNote, ModuleTitle } from './ArchivoShell';

const TEMPORADAS: { n: number; nombre: string; foco: string; guia: string }[] = [
  { n: 1, nombre: 'Temporada 1', foco: 'Recordar quién eres', guia: 'Sergel' },
  { n: 2, nombre: 'Temporada 2', foco: 'Comprender la arquitectura', guia: 'Alina' },
  { n: 3, nombre: 'Temporada 3', foco: 'Recuperar la historia', guia: 'Antarel' },
  { n: 4, nombre: 'Temporada 4', foco: 'Recibir la memoria solar', guia: 'Ivika' },
];

const CICLO: { n: number; titulo: string; texto: string }[] = [
  { n: 1, titulo: 'Ver el video', texto: 'El punto de partida, no la meta.' },
  { n: 2, titulo: 'Explorar el archivo', texto: 'Convierte lo escuchado en estructura visible.' },
  { n: 3, titulo: 'Reflexionar', texto: 'Dejar que toque tu propia experiencia.' },
  { n: 4, titulo: 'Meditar', texto: 'Cuando el episodio la tiene: del conocimiento a la vivencia.' },
  { n: 5, titulo: 'Actualizar la bitácora', texto: 'Sin registro, la experiencia se dispersa.' },
  { n: 6, titulo: 'Integrar', texto: 'Dar tiempo. Después, el siguiente episodio.' },
];

const RECURSOS = [
  'Recursos',
  'Biblioteca',
  'Transmisiones',
  'Mapa cósmico',
  'Meditaciones',
  'Bitácora',
];

export default function MapaDelViaje() {
  const [paso, setPaso] = useState(0);

  return (
    <ArchivoShell
      guia="José María"
      voz="Archivo abierto"
      lead="Antes de avanzar, el recorrido completo: a dónde vas y qué se hace con cada episodio. Recordar es el inicio; registrar y actuar son lo que convierte la memoria en misión."
      registro="Esto no termina cuando comprendes quién eres. Empieza cuando descubres qué hacer con lo que recordaste."
    >
      <ModuleTitle>Las cuatro temporadas</ModuleTitle>

      <div className="mv-seasons">
        {TEMPORADAS.map((t) => (
          <div key={t.n} className="mv-season">
            <p className="mv-seasonNum">{t.n}</p>
            <p className="mv-seasonFoco">{t.foco}</p>
            <p className="mv-seasonGuia">{t.guia}</p>
          </div>
        ))}
      </div>

      {/* El ciclo de cada episodio — la parte operativa, la que se usa. */}
      <Reveal>
        <ModuleTitle>El ciclo de cada episodio</ModuleTitle>
        <div className="mv-cycle">
          {CICLO.map((c, i) => {
            const on = paso === i;
            return (
              <button key={c.n} type="button" className={`mv-step ${on ? 'is-on' : ''}`} onClick={() => setPaso(i)}>
                <span className="mv-stepNum">{c.n}</span>
                <span className="mv-stepBody">
                  <span className="mv-stepTitle">{c.titulo}</span>
                  {on && <span className="mv-stepText">{c.texto}</span>}
                </span>
              </button>
            );
          })}
          <span className="mv-loop" aria-hidden>↻ siguiente episodio</span>
        </div>

        <div className="mv-warn">
          <p className="mv-warnBig">Ver el video no es completar el episodio.</p>
        </div>

        <TechNote label="No es una carrera">
          Puedes volver a los videos, las meditaciones y los archivos tantas veces como necesites.
        </TechNote>
      </Reveal>

      {/* Para qué sirve registrar: lo único que no es evidente del ciclo. */}
      <Reveal>
        <ModuleTitle>Para qué sirve la bitácora</ModuleTitle>
        <div className="mv-logSum">
          <span className="mv-logSumNode is-gold">Bitácora acumulada</span>
          <span className="mv-logArrow" aria-hidden>↓</span>
          <span className="mv-logSumNode">Patrones</span>
          <span className="mv-logArrow" aria-hidden>↓</span>
          <span className="mv-logSumNode is-gold">Revelación de misión</span>
        </div>
        <p className="mv-logText">
          Cuanto más registres, más habrá que leer cuando llegue el momento de revelar tu misión.
        </p>
      </Reveal>

      {/* Lo que acompaña sin ser obligatorio. Solo los nombres. */}
      <Reveal>
        <p className="mv-orbitNote">Además, durante todo el viaje y sin orden obligatorio:</p>
        <div className="mv-orbit">
          {RECURSOS.map((r) => (
            <span key={r} className="mv-res">{r}</span>
          ))}
        </div>
      </Reveal>

      {/* Que hay algo después. Sin detallarlo: todavía no toca. */}
      <Reveal>
        <div className="mv-gate">
          <p className="mv-gateStep">4 temporadas completadas</p>
          <span className="mv-gateArrow" aria-hidden>↓</span>
          <p className="mv-gateBig">Segunda etapa</p>
          <p className="mv-gateNote">Misión, territorio, preparación y contacto.</p>
        </div>
      </Reveal>

      <style jsx global>{`
        .mv-phase {
          display: flex; align-items: flex-start; gap: 0.9rem;
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-gold); padding: 1rem 1.1rem;
        }

        .mv-seasons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem; margin: 0.7rem 0 1.7rem; }
        .mv-season {
          background: var(--aa-inner); border: 1px solid var(--aa-line);
          border-top: 2px solid var(--aa-violet-deep); padding: 0.8rem 0.55rem; text-align: center;
        }
        .mv-seasonNum {
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.5rem; line-height: 1;
          color: var(--aa-gold-soft); margin: 0 0 0.3rem;
        }
        .mv-seasonFoco { font-size: 0.78rem; line-height: 1.35; color: var(--aa-text); margin: 0 0 0.35rem; }
        .mv-seasonGuia {
          font-family: var(--aa-mono); font-size: 0.55rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0;
        }

        .mv-cycle {
          display: flex; flex-direction: column; gap: 0.32rem; margin: 0 0 1.1rem;
          padding: 1.1rem 0.9rem; background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
        }
        .mv-step {
          display: flex; align-items: flex-start; gap: 0.7rem; width: 100%; text-align: left;
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          padding: 0.55rem 0.75rem; cursor: pointer;
          transition: border-color 200ms ease, background 200ms ease;
        }
        .mv-step.is-on { border-color: var(--aa-gold-dim); background: #0d0d16; }
        .mv-stepNum {
          flex: 0 0 auto; width: 22px; height: 22px;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--aa-mono); font-weight: 700; font-size: 0.66rem;
          color: var(--aa-violet-pale); border: 1px solid var(--aa-violet-deep);
          border-radius: 999px !important;
        }
        .mv-step.is-on .mv-stepNum { color: var(--aa-gold-soft); border-color: var(--aa-gold); }
        .mv-stepBody { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }
        .mv-stepTitle {
          font-family: var(--aa-mono); font-size: 0.68rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--aa-gold-soft);
        }
        .mv-stepText { font-size: 0.88rem; line-height: 1.5; color: var(--aa-text); }
        .mv-loop {
          font-family: var(--aa-mono); font-size: 0.58rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-gold); text-align: center; padding-top: 0.3rem;
        }

        .mv-warn {
          margin: 0 0 1.1rem; padding: 1.2rem 1rem; text-align: center;
          background: rgba(217, 184, 102, 0.045); border: 1px solid var(--aa-gold-dim);
        }
        .mv-warnBig {
          font-family: var(--aa-mono); font-size: clamp(0.74rem, 3vw, 0.9rem);
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--aa-gold-soft); margin: 0 0 0.9rem;
        }

        .mv-logArrow { font-family: var(--aa-mono); font-size: 0.7rem; color: var(--aa-gold-dim); }
        .mv-logSum {
          display: flex; flex-direction: column; align-items: center; gap: 0.12rem;
          padding: 1.1rem 0.8rem; margin: 0 0 0.9rem;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
        }
        .mv-logSumNode {
          font-family: var(--aa-mono); font-size: 0.68rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-violet-pale);
        }
        .mv-logSumNode.is-gold {
          color: var(--aa-gold-soft); font-weight: 700;
          text-shadow: 0 0 14px rgba(217, 184, 102, 0.3);
        }
        .mv-logText { font-size: 0.95rem; line-height: 1.66; color: var(--aa-text); margin: 0 0 1.7rem; }

        .mv-orbitNote {
          font-family: var(--aa-mono); font-size: 0.58rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--aa-text-dim); text-align: center;
          margin: -0.5rem 0 0.9rem;
        }
        .mv-orbit {
          display: flex; flex-wrap: wrap; gap: 0.4rem;
          justify-content: center; margin: 0 0 1.7rem;
        }
        .mv-res {
          font-family: var(--aa-mono); font-size: 0.62rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: #cbb9e6;
          background: var(--aa-violet-ghost); border: 1px solid var(--aa-violet-deep);
          padding: 0.38rem 0.7rem; border-radius: 999px !important;
        }

        .mv-gate {
          display: flex; flex-direction: column; align-items: center; gap: 0.2rem;
          padding: 1.5rem 1rem; margin: 0 0 0.7rem;
          background: rgba(217, 184, 102, 0.05); border: 1px solid var(--aa-gold-dim);
        }
        .mv-gateStep {
          font-family: var(--aa-mono); font-size: 0.68rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-violet-pale); margin: 0;
        }
        .mv-gateArrow { font-family: var(--aa-mono); color: var(--aa-gold-dim); }
        .mv-gateBig {
          font-family: var(--aa-mono); font-weight: 700; font-size: clamp(1.1rem, 4.6vw, 1.5rem);
          letter-spacing: 0.24em; text-transform: uppercase; color: var(--aa-gold-soft);
          margin: 0.3rem 0 0; text-shadow: 0 0 22px rgba(217, 184, 102, 0.4);
        }
        .mv-gateNote {
          font-size: 0.88rem; line-height: 1.5; color: var(--aa-text-dim);
          text-align: center; margin: 0.6rem 0 0;
        }


        @media (max-width: 560px) {
          .mv-seasons { grid-template-columns: repeat(2, 1fr); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mv-step { transition: none !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
