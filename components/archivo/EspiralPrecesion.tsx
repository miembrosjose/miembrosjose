'use client';

// TEMPORADA 3 · EPISODIO 8 — AUGE Y CAÍDA / EL ESPEJO ATLANTE
//
// Módulo central: una HÉLICE, no un círculo. La idea entera del episodio es que
// el tiempo no regresa al mismo punto: puede regresar a una posición semejante
// en otro nivel de la espiral.
//
// Separación estricta de registros:
//   · DATO ASTRONÓMICO  → precesión real (≈25.772 años), sin interpretación.
//   · LECTURA SIMBÓLICA → la resonancia con Atlántida, marcada como tal.
//   · CONTEXTO GEOLÓGICO → Younger Dryas, con la negativa explícita a usarlo
//     como prueba de Atlántida.
// Nunca se escribe que la astronomía «demuestre» nada de la enseñanza.

import ArchivoShell, { Reveal, KeyBox, SourceBlock, ModuleTitle } from './ArchivoShell';
import { ARCO_T3 } from './t3-arco';

// Hélice vertical: 2,5 vueltas proyectadas en perspectiva.
const TURNS = 2.5;
const STEPS = 240;
const W = 300;
const H = 420;
const RX = 96;
const TOP = 40;

function helixPoint(t: number) {
  const ang = t * TURNS * Math.PI * 2;
  return {
    x: W / 2 + RX * Math.cos(ang - Math.PI / 2),
    y: TOP + t * (H - TOP * 2),
    front: Math.sin(ang - Math.PI / 2) > 0,
  };
}

const PTS = Array.from({ length: STEPS + 1 }, (_, i) => helixPoint(i / STEPS));

// Atlántida abajo (pasado), presente arriba (nivel superior), separados 180°.
const T_ATL = 0.28;
const T_NOW = T_ATL + 1 / TURNS / 2 + 0.34;

const ESPEJO: [string, string][] = [
  ['Tecnología', 'IA'],
  ['Poder', 'Biotecnología'],
  ['Red', 'Red global'],
  ['Conocimiento', 'Conocimiento'],
  ['Control', 'Automatización'],
  ['Manipulación', 'Poder tecnológico'],
  ['Centralización', 'Interdependencia'],
];

export default function EspiralPrecesion() {
  const atl = helixPoint(T_ATL);
  const now = helixPoint(T_NOW);
  const path = PTS.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <ArchivoShell
      guia="Antarel"
      arco={{ pasos: ARCO_T3, actual: 8 }}
      lead="La Atlántida alcanzó un poder enorme antes de poder sostenerlo. Su caída no es una catástrofe lejana: es una posición dentro de un ciclo que vuelve a abrirse."
      registro="El espejo del pasado no aparece cuando los hechos se repiten, sino cuando vuelve el mismo poder y hay que decidir otra vez qué se hace con él."
    >
      {/* Capa astronómica — sin interpretación */}
      <SourceBlock tipo="astronomia">
        <p>
          <strong>Precesión axial de la Tierra ≈ 25.771,5 años</strong> por vuelta completa.
        </p>
        <p>
          La orientación del eje terrestre cambia lentamente debido principalmente a la acción gravitatoria
          de la Luna y el Sol sobre el abultamiento ecuatorial terrestre.
        </p>
      </SourceBlock>

      <div className="ep-cycles">
        <div className="ep-cycle">
          <p className="ep-cycleNum">25.771,5</p>
          <p className="ep-cycleUnit">años · 360°</p>
          <p className="ep-cycleTag">Ciclo completo</p>
        </div>
        <div className="ep-cycle is-half">
          <p className="ep-cycleNum">12.885,75</p>
          <p className="ep-cycleUnit">años · 180°</p>
          <p className="ep-cycleTag">Medio ciclo</p>
        </div>
      </div>

      {/* La espiral */}
      <ModuleTitle>La espiral del tiempo</ModuleTitle>
      <div className="ep-canvas">
        <svg viewBox={`0 0 ${W} ${H}`} className="ep-svg" role="img" aria-label="Hélice temporal con Atlántida y el presente en niveles distintos">
          <defs>
            <linearGradient id="epGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#4a3170" />
              <stop offset="60%" stopColor="#8a63b8" />
              <stop offset="100%" stopColor="#d9b866" />
            </linearGradient>
          </defs>

          {/* Eje */}
          <line x1={W / 2} y1={TOP - 14} x2={W / 2} y2={H - TOP + 14} stroke="var(--aa-line)" strokeWidth={1} />

          {/* Hélice */}
          <path d={path} fill="none" stroke="url(#epGrad)" strokeWidth={1.6} className="ep-helix" />

          {/* Punto A — Atlántida */}
          <circle cx={atl.x} cy={atl.y} r={6} fill="var(--aa-violet-pale)" />
          <circle cx={atl.x} cy={atl.y} r={12} fill="none" stroke="var(--aa-violet-soft)" strokeWidth={0.7} opacity={0.7} />
          <text x={atl.x < W / 2 ? atl.x - 18 : atl.x + 18} y={atl.y - 2} className={`ep-mark ${atl.x < W / 2 ? 'is-r' : 'is-l'}`}>ATLÁNTIDA</text>
          <text x={atl.x < W / 2 ? atl.x - 18 : atl.x + 18} y={atl.y + 10} className={`ep-markSub ${atl.x < W / 2 ? 'is-r' : 'is-l'}`}>memoria del ciclo anterior</text>

          {/* Punto B — Presente */}
          <circle cx={now.x} cy={now.y} r={6.5} fill="var(--aa-gold-soft)" className="ep-now" />
          <circle cx={now.x} cy={now.y} r={13} fill="none" stroke="var(--aa-gold)" strokeWidth={0.9} />
          <text x={now.x < W / 2 ? now.x - 18 : now.x + 18} y={now.y - 2} className={`ep-mark is-gold ${now.x < W / 2 ? 'is-r' : 'is-l'}`}>PRESENTE</text>
          <text x={now.x < W / 2 ? now.x - 18 : now.x + 18} y={now.y + 10} className={`ep-markSub ${now.x < W / 2 ? 'is-r' : 'is-l'}`}>nuevo umbral tecnológico</text>

          {/* Separación */}
          <line x1={W / 2} y1={atl.y} x2={W / 2} y2={now.y} stroke="var(--aa-gold-dim)" strokeWidth={1} strokeDasharray="3 3" />
          <text x={W / 2 + 6} y={(atl.y + now.y) / 2} className="ep-gap">≈ 12.886 años</text>
        </svg>
      </div>

      <Reveal>
        <SourceBlock tipo="simbolica">
          <p>
            El medio ciclo de precesión coloca al presente en una posición de resonancia con dilemas semejantes
            a los que enfrentó la civilización atlante.
          </p>
        </SourceBlock>
      </Reveal>

      {/* El espejo */}
      <Reveal>
        <ModuleTitle>El espejo</ModuleTitle>
        <div className="ep-mirror">
          <div className="ep-mirrorHead">
            <span>Atlántida</span>
            <span className="is-gold">Presente</span>
          </div>
          {ESPEJO.map(([a, b], i) => (
            <div key={i} className="ep-mirrorRow">
              <span className="ep-mA">{a}</span>
              <span className="ep-mSep" aria-hidden>·</span>
              <span className="ep-mB">{b}</span>
            </div>
          ))}
        </div>
        <p className="ep-mirrorNote">No son exactamente iguales.</p>
      </Reveal>

      <Reveal>
        <div className="ep-question">
          <p className="ep-qSmall">Misma pregunta · nuevas herramientas</p>
          <p className="ep-qBig">
            ¿Crecerá la responsabilidad al mismo ritmo que el poder?
          </p>
        </div>
      </Reveal>

      <Reveal>
        <KeyBox
          tone="violet"
          title="Si la consciencia no acompaña"
          formula={<>CAPACIDAD ↑ <span className="op">·</span> CONSCIENCIA <span className="op">=</span> <span className="dim">igual</span> <span className="op">⇒</span> RIESGO ↑</>}
        />
        <KeyBox
          title="Si la consciencia acompaña"
          formula={<>CAPACIDAD ↑ <span className="op">+</span> CONSCIENCIA ↑ <span className="op">=</span> NUEVA POSIBILIDAD</>}
        />
      </Reveal>

      {/* Contexto paleoclimático */}
      <Reveal>
        <SourceBlock tipo="geologia">
          <p>
            <strong>Hace ≈12.800 años · Younger Dryas.</strong> La ciencia registra un período de cambio
            climático abrupto aproximadamente entre hace 12.800 y 11.600 años. También sabemos que el final
            de la última glaciación produjo importantes cambios del nivel del mar.
          </p>
        </SourceBlock>
        <div className="ep-warn">
          <p className="ep-warnTitle">Esto no demuestra Atlántida</p>
          <p className="ep-warnText">
            El dato únicamente muestra que la ventana temporal asociada por distintas tradiciones con grandes
            catástrofes coincide con una etapa real de profundos cambios climáticos y costeros.
          </p>
        </div>
      </Reveal>

      {/* La revelación */}
      <Reveal>
        <div className="ep-final">
          <div className="ep-finalPair">
            <div>
              <svg viewBox="0 0 60 60" className="ep-icon" aria-hidden>
                <circle cx={30} cy={30} r={22} fill="none" stroke="var(--aa-violet-soft)" strokeWidth={1.2} />
              </svg>
              <p className="ep-finalK">Círculo</p>
              <p className="ep-finalV">repetición</p>
            </div>
            <div>
              <svg viewBox="0 0 60 60" className="ep-icon" aria-hidden>
                <path d="M30,52 C14,52 14,38 30,38 C46,38 46,22 30,22 C16,22 16,10 30,10"
                  fill="none" stroke="var(--aa-gold)" strokeWidth={1.4} />
              </svg>
              <p className="ep-finalK is-gold">Espiral</p>
              <p className="ep-finalV">repetición + aprendizaje</p>
            </div>
          </div>
          <p className="ep-finalBig">
            No regresamos al mismo punto. Regresamos a una pregunta parecida con la posibilidad de responder
            diferente.
          </p>
        </div>
      </Reveal>

      <style jsx global>{`
        .ep-cycles { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin: 0 0 1.6rem; }
        .ep-cycle {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-top: 2px solid var(--aa-gold-dim); padding: 0.95rem 0.8rem; text-align: center;
        }
        .ep-cycle.is-half { border-top-color: var(--aa-violet-deep); }
        .ep-cycleNum {
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.28rem;
          color: var(--aa-gold-soft); margin: 0 0 0.2rem; letter-spacing: 0.02em;
        }
        .ep-cycle.is-half .ep-cycleNum { color: var(--aa-violet-pale); }
        .ep-cycleUnit {
          font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.14em;
          color: var(--aa-text-dim); margin: 0 0 0.35rem;
        }
        .ep-cycleTag {
          font-family: var(--aa-mono); font-size: 0.58rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0;
        }

        .ep-canvas {
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
          padding: 1rem 0.3rem; margin: 0 0 1.5rem;
        }
        .ep-svg { display: block; width: 100%; max-width: 300px; height: auto; margin: 0 auto; }
        .ep-helix { stroke-dasharray: 1400; stroke-dashoffset: 1400; animation: epDraw 3.2s ease-out forwards; }
        @keyframes epDraw { to { stroke-dashoffset: 0; } }
        .ep-now { filter: drop-shadow(0 0 9px rgba(217, 184, 102, 0.65)); }
        .ep-mark {
          font-family: var(--aa-mono); font-size: 8.5px; letter-spacing: 0.16em; fill: var(--aa-violet-pale);
        }
        .ep-mark.is-gold { fill: var(--aa-gold-soft); }
        .ep-markSub { font-family: var(--aa-mono); font-size: 6.5px; letter-spacing: 0.1em; fill: var(--aa-text-dim); }
        .ep-mark.is-r, .ep-markSub.is-r { text-anchor: end; }
        .ep-mark.is-l, .ep-markSub.is-l { text-anchor: start; }
        .ep-gap { font-family: var(--aa-mono); font-size: 7.5px; letter-spacing: 0.1em; fill: var(--aa-gold); }

        .ep-mirror {
          margin: 0 0 0.6rem; padding: 1rem 0.9rem;
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
        }
        .ep-mirrorHead {
          display: grid; grid-template-columns: 1fr auto 1fr; gap: 0.6rem;
          padding-bottom: 0.6rem; margin-bottom: 0.6rem; border-bottom: 1px solid var(--aa-line);
          font-family: var(--aa-mono); font-size: 0.62rem; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--aa-violet-pale);
        }
        .ep-mirrorHead span:first-child { text-align: right; }
        .ep-mirrorHead span:last-child { text-align: left; }
        .ep-mirrorHead .is-gold { color: var(--aa-gold-soft); }
        .ep-mirrorRow {
          display: grid; grid-template-columns: 1fr auto 1fr; gap: 0.6rem; align-items: center;
          padding: 0.28rem 0;
        }
        .ep-mA, .ep-mB { font-family: var(--aa-mono); font-size: 0.66rem; letter-spacing: 0.1em; }
        .ep-mA { text-align: right; color: var(--aa-violet-pale); }
        .ep-mB { text-align: left; color: var(--aa-gold-soft); }
        .ep-mSep { color: var(--aa-gold-dim); }
        .ep-mirrorNote {
          font-family: var(--aa-mono); font-size: 0.58rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-text-dim); text-align: center; margin: 0 0 1.6rem;
        }

        .ep-question {
          margin: 0 0 1.6rem; padding: 1.5rem 1.1rem; text-align: center;
          background: rgba(217, 184, 102, 0.045); border: 1px solid var(--aa-gold-dim);
        }
        .ep-qSmall {
          font-family: var(--aa-mono); font-size: 0.58rem; letter-spacing: 0.24em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0 0 0.8rem;
        }
        .ep-qBig {
          font-family: var(--aa-eb-garamond), Georgia, serif; font-style: italic;
          font-size: clamp(1.05rem, 4.4vw, 1.35rem); line-height: 1.5;
          color: var(--aa-gold-soft); margin: 0;
        }

        .ep-warn {
          margin: 0 0 1.6rem; padding: 0.95rem 1rem;
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid #2a3a52;
        }
        .ep-warnTitle {
          font-family: var(--aa-mono); font-size: 0.66rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: #9db4cf; margin: 0 0 0.45rem;
        }
        .ep-warnText { font-size: 0.93rem; line-height: 1.6; color: var(--aa-text); margin: 0; }

        .ep-final {
          margin: 0 0 1.6rem; padding: 1.4rem 1rem;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
        }
        .ep-finalPair { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; text-align: center; margin: 0 0 1.2rem; }
        .ep-icon { width: 56px; height: 56px; display: block; margin: 0 auto 0.5rem; }
        .ep-finalK {
          font-family: var(--aa-mono); font-size: 0.7rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-violet-pale); margin: 0 0 0.2rem;
        }
        .ep-finalK.is-gold { color: var(--aa-gold-soft); }
        .ep-finalV { font-family: var(--aa-mono); font-size: 0.58rem; letter-spacing: 0.1em; color: var(--aa-text-dim); margin: 0; }
        .ep-finalBig {
          font-family: var(--aa-eb-garamond), Georgia, serif;
          font-size: clamp(1.05rem, 4.2vw, 1.3rem); line-height: 1.55;
          color: var(--aa-gold-soft); text-align: center; margin: 0;
        }

        @media (max-width: 560px) {
          .ep-cycles { grid-template-columns: 1fr; }
          .ep-mA, .ep-mB { font-size: 0.6rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ep-helix { animation: none !important; stroke-dashoffset: 0 !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
