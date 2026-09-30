'use client';

// TEMPORADA 3 · EPISODIO 2 — LEMURIA
//
// La civilización-red del Pacífico: nodos insulares unidos por ondas, no un
// continente dibujado. El módulo no pretende reconstruir geografía: es una
// lectura de organización (red distribuida) frente a lo que vendrá después
// (centralización atlante).
//
// El cierre separa explícitamente tres capas: enseñanza, historia del concepto
// y geología moderna. Mauritia se nombra SIN presentarla como prueba.

import ArchivoShell, { Reveal, KeyBox, SourceBlock, ModuleTitle } from './ArchivoShell';
import { ARCO_T3 } from './t3-arco';

const CX = 170;
const CY = 150;

const ISLAS: { label: string; x: number; y: number }[] = [
  { label: 'ISLAS', x: 170, y: 46 },
  { label: 'AGUA', x: 255, y: 96 },
  { label: 'SONIDO', x: 255, y: 204 },
  { label: 'CONSCIENCIA', x: 170, y: 254 },
  { label: 'MEMORIA', x: 85, y: 204 },
  { label: 'NATURALEZA', x: 85, y: 96 },
];

const CLAVES: { k: string; sub: string; texto: string }[] = [
  { k: 'Agua', sub: 'Transmisión', texto: 'El agua es el medio simbólico y energético de conexión de toda la red.' },
  { k: 'Sonido', sub: 'Comunicación', texto: 'Aquella humanidad utilizaba sonidos y formas de comunicación distintas del lenguaje posterior.' },
  { k: 'Mente', sub: 'Conexión', texto: 'La comunicación entre individuos aparece asociada a una percepción mental más directa.' },
  { k: 'Naturaleza', sub: 'Integración', texto: 'La civilización no se concebía separada del organismo planetario.' },
  { k: 'Ciclo', sub: 'Transformación', texto: 'Lemuria ocupa una etapa anterior dentro de un proceso mayor de cambio planetario.' },
];

export default function LemuriaRed() {
  return (
    <ArchivoShell
      guia="Antarel"
      arco={{ pasos: ARCO_T3, actual: 2 }}
      lead="Antes de las grandes estructuras atlantes hubo otra forma de habitar la Tierra. Lemuria se organiza menos por la conquista del territorio y más por la conexión entre consciencia, naturaleza y planeta."
      registro="Una memoria antigua puede contener capas de historia, símbolo e interpretación; discernirlas no destruye el misterio, permite aproximarse a él con mayor profundidad."
    >
      <ModuleTitle>El Pacífico como red</ModuleTitle>

      <div className="lm-canvas">
        <svg viewBox="0 0 340 300" className="lm-svg" role="img" aria-label="Red de nodos insulares alrededor de Mu / Lemuria">
          {/* Ondas concéntricas — el agua como medio de conexión */}
          {[54, 82, 110].map((r, i) => (
            <circle
              key={r} cx={CX} cy={CY} r={r}
              fill="none" stroke="var(--aa-violet-deep)" strokeWidth={0.7}
              opacity={0.5} className="lm-wave" style={{ animationDelay: `${i * 1.1}s` }}
            />
          ))}

          {/* Enlaces entre nodos vecinos — red distribuida */}
          {ISLAS.map((p, i) => {
            const q = ISLAS[(i + 1) % ISLAS.length];
            return <line key={`e-${i}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="var(--aa-violet-deep)" strokeWidth={0.6} opacity={0.4} />;
          })}
          {ISLAS.map((p, i) => (
            <line key={`r-${i}`} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="var(--aa-gold-dim)" strokeWidth={0.7} opacity={0.6} />
          ))}

          {/* Centro */}
          <circle cx={CX} cy={CY} r={30} fill="rgba(217,184,102,0.07)" stroke="var(--aa-gold)" strokeWidth={1.1} />
          <text x={CX} y={CY - 2} className="lm-center">MU</text>
          <text x={CX} y={CY + 11} className="lm-center is-sub">LEMURIA</text>

          {ISLAS.map((p) => (
            <g key={p.label}>
              <circle cx={p.x} cy={p.y} r={7} fill="var(--aa-inner-2)" stroke="var(--aa-violet-pale)" strokeWidth={0.9} />
              <text x={p.x} y={p.y - 13} className="lm-node">{p.label}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Cinco claves */}
      <Reveal>
        <div className="lm-keys">
          {CLAVES.map((c) => (
            <div key={c.k} className="lm-key">
              <p className="lm-keyK">{c.k}</p>
              <p className="lm-keySub">{c.sub}</p>
              <p className="lm-keyText">{c.texto}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* De red a imperio */}
      <Reveal>
        <div className="lm-shift">
          <div className="lm-shiftSide">
            <p className="lm-shiftName">Lemuria / Mu</p>
            <p className="lm-shiftKind">red distribuida</p>
            <svg viewBox="0 0 90 60" className="lm-mini" aria-hidden>
              {[[20, 18], [70, 18], [45, 32], [20, 48], [70, 48]].map(([x, y], i, a) => (
                <g key={i}>
                  {a.slice(i + 1).map(([x2, y2], j) => (
                    <line key={j} x1={x} y1={y} x2={x2} y2={y2} stroke="var(--aa-violet-deep)" strokeWidth={0.5} opacity={0.6} />
                  ))}
                  <circle cx={x} cy={y} r={3.2} fill="var(--aa-violet-pale)" />
                </g>
              ))}
            </svg>
          </div>
          <span className="lm-shiftArrow" aria-hidden>→</span>
          <div className="lm-shiftSide">
            <p className="lm-shiftName is-gold">Atlántida</p>
            <p className="lm-shiftKind">centralización</p>
            <svg viewBox="0 0 90 60" className="lm-mini" aria-hidden>
              {[[20, 18], [70, 18], [20, 48], [70, 48]].map(([x, y], i) => (
                <line key={i} x1={45} y1={33} x2={x} y2={y} stroke="var(--aa-gold-dim)" strokeWidth={0.6} />
              ))}
              {[[20, 18], [70, 18], [20, 48], [70, 48]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={2.8} fill="var(--aa-violet-pale)" />
              ))}
              <circle cx={45} cy={33} r={5} fill="var(--aa-gold-soft)" />
            </svg>
          </div>
        </div>
      </Reveal>

      {/* Tres capas de lectura */}
      <Reveal>
        <ModuleTitle>Lemuria: tres capas de lectura</ModuleTitle>

        <SourceBlock tipo="plan">
          <p>
            <strong>1 — El Archivo.</strong> Lemuria/Mu es una antigua civilización del ámbito pacífico,
            ligada a las etapas tempranas del desarrollo humano.
          </p>
        </SourceBlock>

        <SourceBlock tipo="tradicion">
          <p>
            <strong>2 — Historia del concepto.</strong> El término «Lemuria» fue utilizado científicamente en
            el siglo XIX por Philip Sclater para proponer una antigua conexión terrestre que explicara la
            distribución de los lémures entre Madagascar e India.
          </p>
        </SourceBlock>

        <SourceBlock tipo="geologia">
          <p>
            <strong>3 — Geología moderna.</strong> La tectónica de placas volvió innecesaria aquella antigua
            hipótesis de Lemuria. Sin embargo, la geología moderna sí ha encontrado verdaderos fragmentos de
            corteza continental sumergida, como Mauritia.
          </p>
        </SourceBlock>
      </Reveal>

      <Reveal>
        <KeyBox
          tone="violet"
          title="Mauritia ≠ prueba de Lemuria"
          text="La existencia de fragmentos continentales sumergidos demuestra que la historia geológica del planeta puede conservar estructuras hoy ocultas bajo el océano, pero no confirma la civilización descrita por las tradiciones lemurianas."
        />
      </Reveal>

      <style jsx global>{`
        .lm-canvas {
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
          padding: 1rem 0.4rem; margin: 0 0 1.5rem;
        }
        .lm-svg { display: block; width: 100%; max-width: 340px; height: auto; margin: 0 auto; }
        .lm-wave { animation: lmWave 6s ease-in-out infinite; transform-origin: center; }
        @keyframes lmWave { 0%, 100% { opacity: 0.22; } 50% { opacity: 0.6; } }
        .lm-center {
          font-family: var(--aa-mono); font-size: 11px; letter-spacing: 0.2em;
          text-anchor: middle; fill: var(--aa-gold-soft);
        }
        .lm-center.is-sub { font-size: 7.5px; fill: var(--aa-gold); letter-spacing: 0.16em; }
        .lm-node {
          font-family: var(--aa-mono); font-size: 7.5px; letter-spacing: 0.14em;
          text-anchor: middle; fill: var(--aa-violet-pale);
        }

        .lm-keys { display: grid; grid-template-columns: 1fr 1fr; gap: 0.55rem; margin: 0 0 1.7rem; }
        .lm-key {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-violet-deep); padding: 0.8rem 0.85rem;
        }
        .lm-key:last-child { grid-column: 1 / -1; }
        .lm-keyK {
          font-family: var(--aa-mono); font-size: 0.74rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.12rem;
        }
        .lm-keySub {
          font-family: var(--aa-mono); font-size: 0.58rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-text-dim); margin: 0 0 0.5rem;
        }
        .lm-keyText { font-size: 0.88rem; line-height: 1.55; color: var(--aa-text); margin: 0; }

        .lm-shift {
          display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 0.7rem;
          margin: 0 0 1.7rem; padding: 1.1rem 0.8rem;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
        }
        .lm-shiftSide { text-align: center; }
        .lm-shiftName {
          font-family: var(--aa-mono); font-size: 0.7rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-violet-pale); margin: 0 0 0.15rem;
        }
        .lm-shiftName.is-gold { color: var(--aa-gold-soft); }
        .lm-shiftKind {
          font-family: var(--aa-mono); font-size: 0.56rem; letter-spacing: 0.14em;
          color: var(--aa-text-dim); margin: 0 0 0.5rem;
        }
        .lm-mini { width: 100%; max-width: 110px; height: auto; margin: 0 auto; display: block; }
        .lm-shiftArrow { font-family: var(--aa-mono); font-size: 1.1rem; color: var(--aa-gold-dim); }

        @media (max-width: 560px) {
          .lm-keys { grid-template-columns: 1fr; }
          .lm-shift { grid-template-columns: 1fr; }
          .lm-shiftArrow { transform: rotate(90deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lm-wave { animation: none !important; opacity: 0.4 !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
