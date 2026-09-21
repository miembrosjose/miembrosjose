'use client';

// TEMPORADA 1 · EPISODIO 1 — INICIO A TU VIAJE / BIENVENIDOS
//
// El mapa de navegación de toda la plataforma. Dos capas: el camino central
// (bienvenida → temporadas → integración → bitácora → misión → servicio) y los
// recursos que lo acompañan sin ser pasos obligatorios.
//
// La bitácora recorre el mapa entero, no aparece solo al final: es la que
// alimenta después la revelación de misión.

import { useState } from 'react';
import ArchivoShell, { Reveal, Flow, TechNote, ModuleTitle } from './ArchivoShell';

const TEMPORADAS: { n: number; nombre: string; foco: string; guia: string }[] = [
  { n: 1, nombre: 'Temporada 1', foco: 'Recordar quién eres', guia: 'Sergel' },
  { n: 2, nombre: 'Temporada 2', foco: 'Comprender la arquitectura', guia: 'Alina' },
  { n: 3, nombre: 'Temporada 3', foco: 'Recuperar la historia', guia: 'Antarel' },
  { n: 4, nombre: 'Temporada 4', foco: 'Recibir la memoria solar', guia: 'Ivika' },
];

const CICLO: { n: number; titulo: string; texto: string }[] = [
  { n: 1, titulo: 'Ver el video', texto: 'La transmisión del episodio. Es el punto de partida, no la meta.' },
  { n: 2, titulo: 'Explorar el archivo', texto: 'El mapa, el sistema o el código que convierte lo escuchado en estructura visible.' },
  { n: 3, titulo: 'Responder / reflexionar', texto: 'Dejar que la información toque tu propia experiencia.' },
  { n: 4, titulo: 'Realizar la meditación', texto: 'Cuando el episodio la tiene: convierte el conocimiento en vivencia.' },
  { n: 5, titulo: 'Actualizar la bitácora', texto: 'Registrar lo que se movió. Sin registro, la experiencia se dispersa.' },
  { n: 6, titulo: 'Integrar', texto: 'Dar tiempo. Después, el siguiente episodio.' },
];

const RECURSOS: { k: string; texto: string }[] = [
  { k: 'Biblioteca', texto: 'Profundiza conceptos cuando necesites ampliar información.' },
  { k: 'Archivos complementarios', texto: 'Convierten cada episodio en mapa, sistema, código o arquitectura visual.' },
  { k: 'Transmisiones · Archivo vivo', texto: 'Amplían preguntas y revelaciones fuera del currículo de temporadas.' },
  { k: 'Mapa cósmico', texto: 'Explora lugares, nodos, retiros, discos solares y puntos de contacto.' },
  { k: 'Meditaciones', texto: 'Transforman conocimiento intelectual en experiencia interior.' },
  { k: 'Bitácora', texto: 'Une todo el recorrido personal.' },
];

const SEGUNDA_ETAPA = [
  'Objetivos de Los 144.000',
  'Revelación de misión',
  'Coordinación interna',
  'Transmisiones en vivo',
  'Preparación para contacto',
  'Grupos de afinidad',
  'Nodos locales / territoriales',
  'Protocolos de contacto',
  'Servicio planetario',
];

const INSUMOS_MISION = ['Bitácora', 'Proceso', 'Capacidades', 'Experiencias', 'Territorio', 'Afinidades'];
const INSUMOS_CONTACTO = ['Preparación interior', 'Discernimiento', 'Coherencia', 'Grupo', 'Territorio', 'Protocolo'];

export default function MapaDelViaje() {
  const [paso, setPaso] = useState(0);

  return (
    <ArchivoShell
      guia="Sergel"
      lead="Acabas de entrar. Antes de avanzar conviene ver el recorrido completo: qué hacer, en qué orden, qué recursos te acompañan y hacia dónde conduce todo. Recordar es el inicio. Integrar, registrar y actuar son los que convierten la memoria en misión."
      registro="Tu recorrido por Los 144.000 no termina cuando comprendes quién eres. Comienza realmente cuando descubres qué hacer con aquello que has recordado."
    >
      <ModuleTitle>Tu mapa de viaje</ModuleTitle>

      {/* FASE 01 */}
      <div className="mv-phase">
        <span className="mv-phaseNum">01</span>
        <div>
          <p className="mv-phaseVerb">Entrar</p>
          <p className="mv-phaseName">Bienvenida</p>
          <p className="mv-phaseText">
            Comprende primero qué es Los 144.000, por qué estás aquí y cuál será la dinámica del proceso.
          </p>
        </div>
      </div>

      <span className="mv-drop" aria-hidden />

      {/* FASE 02 — las cuatro temporadas */}
      <div className="mv-phase">
        <span className="mv-phaseNum">02</span>
        <div>
          <p className="mv-phaseVerb">Recorrer</p>
          <p className="mv-phaseName">Temporadas 1 — 4</p>
        </div>
      </div>

      <div className="mv-seasons">
        {TEMPORADAS.map((t) => (
          <div key={t.n} className="mv-season">
            <p className="mv-seasonNum">{t.n}</p>
            <p className="mv-seasonName">{t.nombre}</p>
            <p className="mv-seasonFoco">{t.foco}</p>
            <p className="mv-seasonGuia">{t.guia}</p>
          </div>
        ))}
      </div>

      {/* El ciclo de cada episodio */}
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
          <div className="mv-warnFlow">
            {['INFORMACIÓN', 'EXPERIENCIA', 'REFLEXIÓN', 'REGISTRO', 'INTEGRACIÓN'].map((s, i) => (
              <span key={s} className="mv-warnItem">
                {i > 0 && <span className="mv-warnArrow" aria-hidden>→</span>}
                <span className="mv-warnNode">{s}</span>
              </span>
            ))}
          </div>
        </div>

        <TechNote label="No es una carrera">
          Puedes volver a los videos, las meditaciones y los archivos tantas veces como necesites.
        </TechNote>
      </Reveal>

      {/* La bitácora recorre todo */}
      <Reveal>
        <ModuleTitle>La bitácora acompaña todo el camino</ModuleTitle>
        <div className="mv-log">
          {[1, 2, 3].map((n) => (
            <div key={n} className="mv-logUnit">
              <span className="mv-logEp">Episodio</span>
              <span className="mv-logArrow" aria-hidden>↓</span>
              <span className="mv-logEx">Experiencia</span>
              <span className="mv-logArrow" aria-hidden>↓</span>
              <span className="mv-logBit">Bitácora</span>
            </div>
          ))}
        </div>
        <div className="mv-logSum">
          <span className="mv-logSumNode is-gold">Bitácora acumulada</span>
          <span className="mv-logArrow" aria-hidden>↓</span>
          <span className="mv-logSumNode">Patrones</span>
          <span className="mv-logArrow" aria-hidden>↓</span>
          <span className="mv-logSumNode is-gold">Revelación de misión</span>
        </div>
        <p className="mv-logText">
          La bitácora es el archivo vivo de tu proceso. Cuanto más conscientemente registres experiencias,
          sueños, sincronicidades, preguntas, memorias, capacidades, procesos familiares, lugares, contactos
          y cambios internos, mayor información habrá disponible cuando llegue el momento de revelar tu
          misión dentro de la red.
        </p>
      </Reveal>

      {/* CAPA 2 — recursos */}
      <Reveal>
        <ModuleTitle>Recursos que orbitan el camino</ModuleTitle>
        <p className="mv-orbitNote">No son pasos obligatorios. Están disponibles durante todo el viaje.</p>
        <div className="mv-orbit">
          {RECURSOS.map((r) => (
            <div key={r.k} className="mv-res">
              <p className="mv-resK">{r.k}</p>
              <p className="mv-resText">{r.texto}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* La gran puerta */}
      <Reveal>
        <div className="mv-gate">
          <p className="mv-gateStep">4 temporadas completadas</p>
          <span className="mv-gateArrow" aria-hidden>↓</span>
          <p className="mv-gateStep">Memoria integrada</p>
          <span className="mv-gateArrow" aria-hidden>↓</span>
          <p className="mv-gateBig">Segunda etapa</p>
        </div>
        <div className="mv-stage2">
          {SEGUNDA_ETAPA.map((s, i) => (
            <div key={s} className="mv-stage2Item">
              {i > 0 && <span className="mv-stage2Arrow" aria-hidden>↓</span>}
              <span className="mv-stage2Node">{s}</span>
            </div>
          ))}
        </div>
      </Reveal>

      {/* La revelación de misión */}
      <Reveal>
        <ModuleTitle>La misión no aparece de la nada</ModuleTitle>
        <div className="mv-inputs">
          {INSUMOS_MISION.map((s) => (
            <span key={s} className="mv-input">{s}</span>
          ))}
        </div>
        <span className="mv-inputArrow" aria-hidden>↓</span>
        <p className="mv-outcome">Revelación de misión</p>
        <span className="mv-inputArrow" aria-hidden>↓</span>
        <p className="mv-outcome is-sub">Función dentro de la red</p>
        <p className="mv-inputsNote">
          Se construye leyendo la información acumulada durante todo el recorrido.
        </p>
      </Reveal>

      {/* Protocolo de contacto */}
      <Reveal>
        <ModuleTitle>El contacto es una consecuencia</ModuleTitle>
        <div className="mv-inputs">
          {INSUMOS_CONTACTO.map((s) => (
            <span key={s} className="mv-input is-violet">{s}</span>
          ))}
        </div>
        <span className="mv-inputArrow" aria-hidden>↓</span>
        <p className="mv-outcome">Contacto</p>
        <p className="mv-inputsNote">
          No es un premio ni un espectáculo: aparece como resultado de preparación y responsabilidad.
        </p>
      </Reveal>

      {/* Gran cierre */}
      <Reveal>
        <Flow steps={['RECORDAR', 'INTEGRAR', 'REGISTRAR', 'DESCUBRIR', 'PREPARARSE', 'SERVIR']} />
      </Reveal>

      <style jsx global>{`
        .mv-phase {
          display: flex; align-items: flex-start; gap: 0.9rem;
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-gold); padding: 1rem 1.1rem;
        }
        .mv-phaseNum {
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.3rem;
          color: var(--aa-gold-soft); line-height: 1;
        }
        .mv-phaseVerb {
          font-family: var(--aa-mono); font-size: 0.58rem; letter-spacing: 0.24em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0 0 0.25rem;
        }
        .mv-phaseName {
          font-family: var(--aa-mono); font-size: 0.82rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.4rem;
        }
        .mv-phaseText { font-size: 0.93rem; line-height: 1.58; color: var(--aa-text); margin: 0; }
        .mv-drop { display: block; width: 1px; height: 20px; margin: 0 auto; background: var(--aa-gold-dim); }

        .mv-seasons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem; margin: 0.7rem 0 1.7rem; }
        .mv-season {
          background: var(--aa-inner); border: 1px solid var(--aa-line);
          border-top: 2px solid var(--aa-violet-deep); padding: 0.8rem 0.55rem; text-align: center;
        }
        .mv-seasonNum {
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.5rem; line-height: 1;
          color: var(--aa-gold-soft); margin: 0 0 0.3rem;
        }
        .mv-seasonName {
          font-family: var(--aa-mono); font-size: 0.52rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-text-dim); margin: 0 0 0.3rem;
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
        .mv-warnFlow { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0.15rem; }
        .mv-warnItem { display: inline-flex; align-items: center; gap: 0.15rem; }
        .mv-warnArrow { font-family: var(--aa-mono); font-size: 0.7rem; color: var(--aa-gold-dim); }
        .mv-warnNode {
          font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.1em;
          color: var(--aa-violet-pale); padding: 0.22rem 0.35rem;
        }

        .mv-log { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin: 0 0 0.7rem; }
        .mv-logUnit {
          display: flex; flex-direction: column; align-items: center; gap: 0.12rem;
          background: var(--aa-inner-2); border: 1px solid var(--aa-line); padding: 0.75rem 0.4rem;
        }
        .mv-logEp, .mv-logEx {
          font-family: var(--aa-mono); font-size: 0.56rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--aa-violet-pale);
        }
        .mv-logBit {
          font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-gold-soft); font-weight: 700;
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
        .mv-orbit { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 0 0 1.7rem; }
        .mv-res {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-violet-deep); padding: 0.75rem 0.85rem;
        }
        .mv-resK {
          font-family: var(--aa-mono); font-size: 0.64rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.3rem;
        }
        .mv-resText { font-size: 0.86rem; line-height: 1.5; color: var(--aa-text); margin: 0; }

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
        .mv-stage2 {
          display: flex; flex-direction: column; align-items: center; gap: 0.1rem;
          margin: 0 0 1.7rem; padding: 1.2rem 0.9rem;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
        }
        .mv-stage2Item { display: flex; flex-direction: column; align-items: center; gap: 0.1rem; }
        .mv-stage2Arrow { font-family: var(--aa-mono); font-size: 0.78rem; color: var(--aa-gold-dim); }
        .mv-stage2Node {
          font-family: var(--aa-mono); font-size: 0.65rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-gold-soft); text-align: center;
        }

        .mv-inputs { display: flex; flex-wrap: wrap; gap: 0.35rem; justify-content: center; margin: 0 0 0.5rem; }
        .mv-input {
          font-family: var(--aa-mono); font-size: 0.62rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--aa-gold-soft);
          border: 1px solid var(--aa-gold-dim); background: var(--aa-gold-ghost);
          padding: 0.34rem 0.65rem; border-radius: 999px !important;
        }
        .mv-input.is-violet {
          color: #cbb9e6; border-color: var(--aa-violet-deep); background: var(--aa-violet-ghost);
        }
        .mv-inputArrow {
          display: block; font-family: var(--aa-mono); font-size: 0.9rem;
          color: var(--aa-gold-dim); text-align: center; line-height: 1.6;
        }
        .mv-outcome {
          font-family: var(--aa-mono); font-weight: 700; font-size: 0.92rem;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--aa-gold-soft);
          text-align: center; margin: 0;
        }
        .mv-outcome.is-sub { font-weight: 400; font-size: 0.72rem; color: var(--aa-violet-pale); }
        .mv-inputsNote {
          font-size: 0.9rem; line-height: 1.55; color: var(--aa-text-dim);
          text-align: center; margin: 0.9rem 0 1.7rem;
        }

        @media (max-width: 560px) {
          .mv-seasons { grid-template-columns: repeat(2, 1fr); }
          .mv-log { grid-template-columns: 1fr; }
          .mv-orbit { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mv-step { transition: none !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
