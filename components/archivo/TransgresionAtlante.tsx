'use client';

// TEMPORADA 3 · EPISODIO 4 — LOS ATLANTES / LA GRAN TRANSGRESIÓN
//
// El origen atlante, NO la precesión (eso va en Auge y caída).
// Dos lecturas quedan separadas por etiqueta: lo que dice el Libro de Enoc
// (tradición) y cómo lo interpreta la cosmología del archivo. En ningún punto
// se afirma que Enoc «demuestre» nada.
//
// El archipiélago es conceptual: diez nodos, Undal como centro. No pretende
// ser un mapa geográfico.

import { useState } from 'react';
import ArchivoShell, { Reveal, KeyBox, TechNote, SourceBlock, ModuleTitle } from './ArchivoShell';
import { ARCO_T3 } from './t3-arco';

const CX = 165;
const CY = 150;

export default function TransgresionAtlante() {
  const [isla, setIsla] = useState<number | null>(0);

  // Diez nodos conceptuales; el 0 es Undal, centro de la tradición.
  const islas = Array.from({ length: 9 }, (_, i) => {
    const a = (Math.PI / 180) * (i * 40 - 90);
    return { x: CX + 104 * Math.cos(a), y: CY + 104 * Math.sin(a) };
  });

  return (
    <ArchivoShell
      guia="Antarel"
      arco={{ pasos: ARCO_T3, actual: 4 }}
      lead="Atlántida no comienza con una ciudad. Comienza con una transgresión: la ruptura de la frontera que separaba a quienes observaban el proceso de aquellos cuya evolución debían acompañar."
      registro="La gran transgresión no consistió únicamente en cruzar una frontera biológica; consistió en entregar capacidad antes de que existiera suficiente consciencia para gobernarla."
    >
      <ModuleTitle>La transgresión</ModuleTitle>

      {/* Cadena del descenso */}
      <div className="ta-chain">
        {[
          { t: 'Vigilantes pleyadianos', k: 'origen' },
          { t: '200', k: 'num' },
          { t: 'Monte Hermón', k: 'lugar' },
          { t: 'Pacto', k: 'acto' },
          { t: 'Humanidad', k: 'destino' },
        ].map((s, i) => (
          <div key={i} className={`ta-link is-${s.k}`}>
            {i > 0 && <span className="ta-linkArrow" aria-hidden>↓</span>}
            <span className="ta-linkNode">{s.t}</span>
          </div>
        ))}
      </div>

      <Reveal>
        <SourceBlock tipo="tradicion">
          <p>
            El Libro de Enoc describe un grupo de Vigilantes que desciende al monte Hermón y establece
            relaciones con mujeres humanas.
          </p>
        </SourceBlock>
      </Reveal>

      <Reveal>
        <SourceBlock tipo="plan">
          <p>
            Estos Vigilantes son miembros de una intervención pleyadiana dirigida por Semiasas.
          </p>
        </SourceBlock>
      </Reveal>

      {/* Linaje */}
      <Reveal>
        <div className="ta-lineage">
          <div className="ta-lineRow">
            <span className="ta-lineTerm">HUMANO</span>
            <span className="ta-lineOp" aria-hidden>+</span>
            <span className="ta-lineTerm">VIGILANTE</span>
          </div>
          <span className="ta-lineEq" aria-hidden>=</span>
          <p className="ta-lineResult">Linaje mestizo</p>
          <span className="ta-lineArrow" aria-hidden>↓</span>
          <p className="ta-lineFinal">ATLANTES</p>
        </div>
        <p className="ta-lineText">
          La transgresión representa una ruptura del principio de no intervención y produce una nueva
          humanidad mestiza que recibe conocimiento y capacidades para las que todavía debía desarrollar una
          estructura ética equivalente.
        </p>
      </Reveal>

      <Reveal>
        <KeyBox
          tone="violet"
          title="La transgresión no es sexual"
          text="Es una transgresión de responsabilidad: una civilización tecnológicamente superior interviene directamente sobre una humanidad en formación."
        />
      </Reveal>

      {/* El archipiélago */}
      <Reveal>
        <ModuleTitle>El archipiélago — diez islas</ModuleTitle>
        <div className="ta-canvas">
          <svg viewBox="0 0 330 300" className="ta-svg" role="img" aria-label="Diez islas atlantes con Undal en el centro">
            {islas.map((p, i) => (
              <line key={`l-${i}`} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="var(--aa-violet-deep)" strokeWidth={0.6} opacity={0.5} />
            ))}
            <circle cx={CX} cy={CY} r={26} fill="rgba(217,184,102,0.1)" stroke="var(--aa-gold)" strokeWidth={1.3}
              className={isla === 0 ? 'ta-isle is-on' : 'ta-isle'} onClick={() => setIsla(0)} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsla(0); } }} />
            <text x={CX} y={CY + 4} className="ta-center">UNDAL</text>
            {islas.map((p, i) => (
              <g key={i} className={`ta-isleG ${isla === i + 1 ? 'is-on' : ''}`} onClick={() => setIsla(i + 1)}
                 role="button" tabIndex={0}
                 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsla(i + 1); } }}
                 aria-label={`Isla ${i + 2}`}>
                <circle cx={p.x} cy={p.y} r={12} fill="var(--aa-inner-2)" stroke={isla === i + 1 ? 'var(--aa-gold)' : 'var(--aa-violet-pale)'} strokeWidth={0.9} />
                <text x={p.x} y={p.y + 3.5} className="ta-isleNum">{i + 2}</text>
              </g>
            ))}
          </svg>
          <p className="ta-canvasNote">Visualización conceptual — no es un mapa geográfico.</p>
        </div>

        <div className="ta-isleCard">
          {isla === 0 ? (
            <>
              <p className="ta-isleName">Undal</p>
              <p className="ta-isleText">Centro principal del mundo atlante.</p>
            </>
          ) : (
            <>
              <p className="ta-isleName is-violet">Isla {(isla ?? 0) + 1}</p>
              <p className="ta-isleText">
                Una de las diez islas del archipiélago. Poseidonis corresponde a etapas posteriores del mundo
                atlante.
              </p>
            </>
          )}
        </div>
      </Reveal>

      {/* El problema central */}
      <Reveal>
        <ModuleTitle>El problema central</ModuleTitle>
        <div className="ta-gap">
          <div className="ta-gapRow">
            <span className="ta-gapK">Capacidad</span>
            <span className="ta-gapBar is-fast" aria-hidden />
            <span className="ta-gapV">creció rápidamente</span>
          </div>
          <div className="ta-gapRow">
            <span className="ta-gapK">Consciencia</span>
            <span className="ta-gapBar is-slow" aria-hidden />
            <span className="ta-gapV">no creció al mismo ritmo</span>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <KeyBox
          title="Fórmula del riesgo"
          formula={
            <>
              TECNOLOGÍA <span className="op">&gt;</span> MADUREZ
              <br />
              <span className="op">=</span>
              <br />
              RIESGO CIVILIZATORIO
            </>
          }
        />
      </Reveal>

      <Reveal>
        <TechNote label="Continúa en">
          Este desequilibrio es la clave que explica el episodio siguiente sobre el auge y la caída del mundo
          atlante.
        </TechNote>
      </Reveal>

      <style jsx global>{`
        .ta-chain {
          display: flex; flex-direction: column; align-items: center; gap: 0.15rem;
          margin: 0 0 1.5rem; padding: 1.3rem 1rem;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
        }
        .ta-link { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; }
        .ta-linkArrow { font-family: var(--aa-mono); font-size: 0.85rem; color: var(--aa-gold-dim); }
        .ta-linkNode {
          font-family: var(--aa-mono); font-size: 0.74rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-gold-soft);
        }
        .ta-link.is-num .ta-linkNode {
          font-size: 1.9rem; font-weight: 700; letter-spacing: 0.04em;
          text-shadow: 0 0 20px rgba(217, 184, 102, 0.35);
        }

        .ta-lineage {
          display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
          margin: 0 0 0.9rem; padding: 1.2rem 1rem;
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-gold-dim);
        }
        .ta-lineRow { display: flex; align-items: center; gap: 0.7rem; }
        .ta-lineTerm {
          font-family: var(--aa-mono); font-size: 0.74rem; letter-spacing: 0.14em;
          color: var(--aa-violet-pale);
        }
        .ta-lineOp, .ta-lineEq, .ta-lineArrow { font-family: var(--aa-mono); color: var(--aa-violet-soft); }
        .ta-lineResult {
          font-family: var(--aa-mono); font-size: 0.8rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0;
        }
        .ta-lineFinal {
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.05rem;
          letter-spacing: 0.24em; color: var(--aa-gold); margin: 0;
        }
        .ta-lineText { font-size: 0.96rem; line-height: 1.66; color: var(--aa-text); margin: 0 0 1.6rem; }

        .ta-canvas {
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
          padding: 1rem 0.4rem 0.7rem; margin: 0 0 0.9rem;
        }
        .ta-svg { display: block; width: 100%; max-width: 330px; height: auto; margin: 0 auto; }
        .ta-isle, .ta-isleG { cursor: pointer; }
        .ta-isleG circle { transition: stroke 220ms ease; }
        .ta-center {
          font-family: var(--aa-mono); font-size: 10px; letter-spacing: 0.18em;
          text-anchor: middle; fill: var(--aa-gold-soft); pointer-events: none;
        }
        .ta-isleNum {
          font-family: var(--aa-mono); font-size: 8.5px; text-anchor: middle;
          fill: var(--aa-violet-pale); pointer-events: none;
        }
        .ta-canvasNote {
          font-family: var(--aa-mono); font-size: 0.56rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-text-dim); text-align: center; margin: 0.5rem 0 0;
        }
        .ta-isleCard {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-gold); padding: 0.95rem 1rem; margin: 0 0 1.7rem;
        }
        .ta-isleName {
          font-family: var(--aa-mono); font-size: 0.78rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.4rem;
        }
        .ta-isleName.is-violet { color: var(--aa-violet-pale); }
        .ta-isleText { font-size: 0.92rem; line-height: 1.58; color: var(--aa-text); margin: 0; }

        .ta-gap { margin: 0 0 1.7rem; display: flex; flex-direction: column; gap: 0.7rem; }
        .ta-gapRow { display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap; }
        .ta-gapK {
          font-family: var(--aa-mono); font-size: 0.68rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-gold-soft); min-width: 96px;
        }
        .ta-gapBar { height: 3px; border-radius: 999px !important; }
        .ta-gapBar.is-fast { width: 62%; background: linear-gradient(90deg, var(--aa-gold-dim), var(--aa-gold)); }
        .ta-gapBar.is-slow { width: 22%; background: var(--aa-violet-deep); }
        .ta-gapV { font-size: 0.86rem; color: var(--aa-text-dim); }

        @media (max-width: 560px) {
          .ta-gapK { min-width: 0; }
          .ta-gapBar.is-fast { width: 45%; }
          .ta-gapBar.is-slow { width: 16%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ta-isleG circle { transition: none !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
