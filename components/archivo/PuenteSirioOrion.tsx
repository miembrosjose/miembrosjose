'use client';

// TEMPORADA 3 · EPISODIO 5 — SIRIO Y ORIÓN
//
// Mapa de dos puentes: funciones complementarias, no repetición del conflicto.
// Sirio = semilla (cielo → forma). Orión = portal (mundo ↔ umbral ↔ otro nivel).
//
// Incluye la precisión astronómica obligatoria: Orión es una constelación, un
// agrupamiento visual desde la Tierra de estrellas físicamente muy separadas.

import ArchivoShell, { Reveal, Flow, KeyBox, SourceBlock, Chips, ModuleTitle } from './ArchivoShell';
import { ARCO_T3 } from './t3-arco';

export default function PuenteSirioOrion() {
  return (
    <ArchivoShell
      guia="Antarel"
      arco={{ pasos: ARCO_T3, actual: 5 }}
      lead="Sirio y Orión vuelven una y otra vez en las tradiciones del cielo, y cumplen funciones complementarias: una siembra y organiza mundos; la otra custodia rutas, tiempos y portales."
      registro="Una civilización puede aprender a construir caminos y otra a custodiar sus umbrales; el problema comienza cuando custodiar se confunde con controlar quién tiene derecho a recorrerlos."
    >
      <ModuleTitle>Dos sistemas · dos funciones</ModuleTitle>

      <div className="so-pair">
        <div className="so-side is-sirio">
          <p className="so-name">Sirio</p>
          <p className="so-role">Semilla</p>
          <div className="so-diagram">
            <span className="so-dNode">CIELO</span>
            <span className="so-dArrow" aria-hidden>↓</span>
            <span className="so-dNode is-gold">FORMA</span>
          </div>
          <Chips items={['arquitectura', 'organización', 'siembra', 'materia', 'mundo']} />
          <p className="so-text">
            Sirio es el principio que estructura y organiza la información para que pueda manifestarse dentro de
            mundos físicos.
          </p>
        </div>

        <div className="so-side is-orion">
          <p className="so-name">Orión</p>
          <p className="so-role">Portal</p>
          <div className="so-diagram">
            <span className="so-dNode">MUNDO</span>
            <span className="so-dArrow" aria-hidden>↔</span>
            <span className="so-dNode is-gold">PORTAL</span>
            <span className="so-dArrow" aria-hidden>↔</span>
            <span className="so-dNode">OTRO NIVEL</span>
          </div>
          <Chips items={['tiempo', 'rutas', 'custodia', 'dirección', 'transición']} />
          <p className="so-text">
            Orión cumple funciones de guardianía y conecta las diferentes rutas del proceso.
          </p>
        </div>
      </div>

      {/* Lectura simbólica madre / padre */}
      <Reveal>
        <SourceBlock tipo="simbolica">
          <p>
            <strong>Sirio — madre simbólica.</strong> <strong>Orión — padre simbólico.</strong>
          </p>
          <p>
            No se trata de sexo biológico: es una lectura simbólica de funciones complementarias dentro del
            modelo.
          </p>
        </SourceBlock>
      </Reveal>

      {/* El vecindario */}
      <Reveal>
        <ModuleTitle>El vecindario</ModuleTitle>
        <div className="so-hood">
          <span className="so-hoodNode is-gold">SOL</span>
          <span className="so-hoodLink" aria-hidden>↔</span>
          <span className="so-hoodNode">SIRIO</span>
          <span className="so-hoodLink" aria-hidden>↔</span>
          <span className="so-hoodNode">ORIÓN</span>
        </div>
        <p className="so-hoodNote">Relación de funciones, no de distancias astronómicas.</p>
      </Reveal>

      <Reveal>
        <SourceBlock tipo="astronomia">
          <p>
            Orión es una <strong>constelación</strong>: desde la Tierra agrupa visualmente estrellas
            físicamente muy separadas entre sí.
          </p>
          <p>
            «Orión» es un nombre terrestre: designa diferentes sistemas asociados culturalmente con esa región
            del cielo.
          </p>
        </SourceBlock>
      </Reveal>

      <Reveal>
        <KeyBox
          title="Las dos funciones"
          formula={
            <>
              SIRIO <span className="dim">construye el puente</span>
              <br />
              ORIÓN <span className="dim">custodia el umbral</span>
            </>
          }
        />
      </Reveal>

      <Reveal>
        <Flow label="Del cielo al mundo" steps={['INFORMACIÓN', 'ESTRUCTURA', 'FORMA', 'MUNDO']} />
      </Reveal>

      <style jsx global>{`
        .so-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin: 0 0 1.7rem; }
        .so-side {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          padding: 1.1rem 0.95rem; text-align: center;
        }
        .so-side.is-sirio { border-top: 2px solid var(--aa-gold-dim); }
        .so-side.is-orion { border-top: 2px solid var(--aa-violet-soft); }
        .so-name {
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.05rem;
          letter-spacing: 0.22em; text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.2rem;
        }
        .so-role {
          font-family: var(--aa-mono); font-size: 0.62rem; letter-spacing: 0.24em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0 0 0.9rem;
        }
        .so-diagram {
          display: flex; flex-direction: column; align-items: center; gap: 0.15rem;
          padding: 0.8rem 0; margin: 0 0 0.8rem;
          border-top: 1px solid var(--aa-line); border-bottom: 1px solid var(--aa-line);
        }
        .so-dNode {
          font-family: var(--aa-mono); font-size: 0.66rem; letter-spacing: 0.14em;
          color: var(--aa-violet-pale);
        }
        .so-dNode.is-gold { color: var(--aa-gold-soft); }
        .so-dArrow { font-family: var(--aa-mono); font-size: 0.8rem; color: var(--aa-gold-dim); }
        .so-side .aa-chipsBlock { margin-bottom: 0.8rem; }
        .so-text { font-size: 0.89rem; line-height: 1.55; color: var(--aa-text); margin: 0; text-align: left; }

        .so-hood {
          display: flex; align-items: center; justify-content: center; gap: 0.8rem; flex-wrap: wrap;
          padding: 1.2rem 0.8rem; background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
        }
        .so-hoodNode {
          font-family: var(--aa-mono); font-size: 0.8rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-violet-pale);
        }
        .so-hoodNode.is-gold { color: var(--aa-gold-soft); }
        .so-hoodLink { font-family: var(--aa-mono); color: var(--aa-gold-dim); }
        .so-hoodNote {
          font-family: var(--aa-mono); font-size: 0.56rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-text-dim); text-align: center; margin: 0.6rem 0 1.6rem;
        }

        @media (max-width: 560px) {
          .so-pair { grid-template-columns: 1fr; }
        }
      `}</style>
    </ArchivoShell>
  );
}
