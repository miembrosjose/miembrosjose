'use client';

// TEMPORADA 2 · EPISODIO 1 — LA FUENTE / DE DÓNDE VIENE TODO
//
// Módulo central: Flor de la Vida construida con SVG (sin imagen externa),
// desplegada en cinco estados conforme el módulo atraviesa el viewport:
//   0 · centro          1 · 9 + 9          2 · Flor completa (19)
//   3 · dos cubos       4 · 12 Elohim
//
// La lectura del modelo: 1 centro + 9 campos de luz + 9 campos de oscuridad = 19.
// Los 9 de cada familia son, en la enseñanza, 8 vértices + 1 centro de un cubo;
// las 6 caras de cada cubo dan 6 + 6 = 12 Elohim.
//
// "Oscuridad" se representa por TRATAMIENTO (trazo tenue, relleno frío), nunca
// con iconografía de maldad: son dos funciones, no dos bandos.

import { useState } from 'react';
import ArchivoShell, { Reveal, Flow, KeyBox, TechNote, ModuleTitle, useScrollStage } from './ArchivoShell';

// ── Geometría de la Flor de la Vida ─────────────────────────────────────────
const CX = 200;
const CY = 200;
const R = 46;

type Sphere = { x: number; y: number; family: 'centro' | 'luz' | 'sombra' };

function buildSpheres(): Sphere[] {
  const out: Sphere[] = [{ x: CX, y: CY, family: 'centro' }];
  const ring: { x: number; y: number }[] = [];

  // Anillo 1 — 6 esferas a distancia R
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i);
    ring.push({ x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) });
  }
  // Anillo 2 — 6 a distancia R·√3 (vértices intermedios) + 6 a distancia 2R
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i + 30);
    ring.push({ x: CX + R * Math.sqrt(3) * Math.cos(a), y: CY + R * Math.sqrt(3) * Math.sin(a) });
  }
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i);
    ring.push({ x: CX + 2 * R * Math.cos(a), y: CY + 2 * R * Math.sin(a) });
  }

  // 18 campos alternados → 9 de luz y 9 de oscuridad, entrelazados.
  ring.forEach((p, i) => out.push({ ...p, family: i % 2 === 0 ? 'luz' : 'sombra' }));
  return out;
}

const SPHERES = buildSpheres();

// ── Geometría de los cubos (proyección isométrica) ──────────────────────────
function isoCube(ox: number, oy: number, s: number) {
  const pts: { x: number; y: number }[] = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    pts.push({
      x: ox + (x - z) * s * 0.866,
      y: oy + (x + z) * s * 0.5 - y * s,
    });
  }
  return pts;
}

// Aristas por índice (orden de isoCube: x,y,z ∈ {-1,1} en ese anidamiento).
const EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3],
  [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7],
];

// Seis caras, cada una por sus cuatro vértices.
const FACES: number[][] = [
  [0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4],
  [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5],
];

function CubeGroup({
  ox, oy, s, tone, showFaces,
}: { ox: number; oy: number; s: number; tone: 'luz' | 'sombra'; showFaces: boolean }) {
  const p = isoCube(ox, oy, s);
  const stroke = tone === 'luz' ? 'var(--aa-gold)' : 'var(--aa-violet-soft)';
  const faceFill = tone === 'luz' ? 'rgba(217,184,102,0.10)' : 'rgba(109,74,155,0.14)';

  return (
    <g>
      {showFaces &&
        FACES.map((f, i) => (
          <polygon
            key={i}
            points={f.map((k) => `${p[k].x},${p[k].y}`).join(' ')}
            fill={faceFill}
            stroke={stroke}
            strokeWidth={0.6}
            opacity={0.9}
            className="fl-face"
            style={{ animationDelay: `${i * 90}ms` }}
          />
        ))}
      {EDGES.map(([a, b], i) => (
        <line key={i} x1={p[a].x} y1={p[a].y} x2={p[b].x} y2={p[b].y} stroke={stroke} strokeWidth={0.9} opacity={0.75} />
      ))}
      {p.map((v, i) => (
        <circle key={i} cx={v.x} cy={v.y} r={3.2} fill={stroke} />
      ))}
      <circle cx={ox} cy={oy} r={4.6} fill="var(--aa-gold-soft)" />
      <circle cx={ox} cy={oy} r={9} fill="none" stroke="var(--aa-gold-dim)" strokeWidth={0.8} />
    </g>
  );
}

export default function FlorDeLaVida() {
  const { ref, stage } = useScrollStage(5);
  const [view, setView] = useState<'auto' | 'flor' | 'cubos'>('auto');

  // Qué se ve: el scroll manda salvo que el usuario haya elegido explícitamente.
  const showCubes = view === 'cubos' || (view === 'auto' && stage >= 3);
  const showFaces = view === 'cubos' ? true : stage >= 4;
  const visibleCount = stage === 0 ? 1 : stage === 1 ? SPHERES.length : SPHERES.length;
  const dimNonCenter = stage === 0;

  return (
    <ArchivoShell
      lead="Antes de los mundos existe una arquitectura de relación: la unidad se diferencia, genera polaridad y usa esa diferencia para producir experiencia. La Flor de la Vida dibuja una parte de ese orden."
      registro="La unidad puede multiplicar sus perspectivas sin fragmentar su origen; cada experiencia amplía aquello que finalmente puede regresar al centro."
    >
      <ModuleTitle>Flor de la Vida — Arquitectura de manifestación</ModuleTitle>

      <div className="fl-module" ref={ref}>
        {/* Selector Flor / Cubos */}
        <div className="fl-toggle" role="group" aria-label="Vista del módulo">
          <button type="button" className={!showCubes ? 'is-on' : ''} onClick={() => setView('flor')}>
            Flor
          </button>
          <span className="fl-toggleSep" aria-hidden>→</span>
          <button type="button" className={showCubes ? 'is-on' : ''} onClick={() => setView('cubos')}>
            Cubos
          </button>
        </div>

        <div className="fl-canvas">
          <svg viewBox="0 0 400 400" className="fl-svg" role="img" aria-label="Flor de la Vida: un centro, nueve campos de luz y nueve campos de oscuridad">
            {/* ── Flor ── */}
            <g className={`fl-layer ${showCubes ? 'is-hidden' : ''}`}>
              {SPHERES.slice(0, visibleCount).map((s, i) => {
                const isCenter = s.family === 'centro';
                const shown = isCenter || !dimNonCenter;
                const stroke = isCenter
                  ? 'var(--aa-gold)'
                  : s.family === 'luz'
                    ? 'var(--aa-gold-dim)'
                    : 'var(--aa-violet-soft)';
                return (
                  <circle
                    key={i}
                    cx={s.x}
                    cy={s.y}
                    r={R}
                    fill={isCenter ? 'rgba(217,184,102,0.07)' : s.family === 'luz' ? 'rgba(217,184,102,0.035)' : 'rgba(109,74,155,0.05)'}
                    stroke={stroke}
                    strokeWidth={isCenter ? 1.6 : 0.85}
                    className="fl-circle"
                    style={{
                      opacity: shown ? 1 : 0,
                      transitionDelay: `${isCenter ? 0 : 120 + i * 55}ms`,
                    }}
                  />
                );
              })}
              {/* Centro siempre dorado y por encima */}
              <circle cx={CX} cy={CY} r={5.5} fill="var(--aa-gold-soft)" className="fl-core" />
              <circle cx={CX} cy={CY} r={13} fill="none" stroke="var(--aa-gold)" strokeWidth={0.7} opacity={0.6} />
            </g>

            {/* ── Cubos ── */}
            <g className={`fl-layer ${showCubes ? '' : 'is-hidden'}`}>
              <CubeGroup ox={118} oy={200} s={52} tone="luz" showFaces={showFaces} />
              <CubeGroup ox={282} oy={200} s={52} tone="sombra" showFaces={showFaces} />
              <text x="118" y="312" className="fl-cubeLabel">CUBO A</text>
              <text x="282" y="312" className="fl-cubeLabel">CUBO B</text>
              <text x="118" y="330" className="fl-cubeSub">8 VÉRTICES + 1 CENTRO</text>
              <text x="282" y="330" className="fl-cubeSub">8 VÉRTICES + 1 CENTRO</text>
              <text x="118" y="348" className="fl-cubeNum">9 ESFERAS</text>
              <text x="282" y="348" className="fl-cubeNum">9 ESFERAS</text>
            </g>
          </svg>

          {/* Pie de estado — cambia con el scroll */}
          <div className="fl-state">
            {!showCubes && stage === 0 && (
              <>
                <p className="fl-stateTitle">La Fuente</p>
                <p className="fl-stateLines">Unidad · Origen · Potencial</p>
              </>
            )}
            {!showCubes && stage === 1 && (
              <div className="fl-families">
                <div>
                  <p className="fl-famNum">9</p>
                  <p className="fl-famTitle is-luz">Esferas de luz</p>
                  <p className="fl-famText">Orden · integración · equilibrio · retorno al centro</p>
                </div>
                <div>
                  <p className="fl-famNum is-violet">9</p>
                  <p className="fl-famTitle is-sombra">Esferas de oscuridad</p>
                  <p className="fl-famText">Creación · transformación · destrucción · regeneración</p>
                </div>
              </div>
            )}
            {!showCubes && stage >= 2 && (
              <>
                <p className="fl-stateTitle">19 círculos · Flor de la Vida</p>
                <p className="fl-stateLines">El centro permanece</p>
              </>
            )}
            {showCubes && !showFaces && (
              <>
                <p className="fl-stateTitle">Dualidad</p>
                <p className="fl-stateLines">Dos campos · dos funciones · una arquitectura</p>
              </>
            )}
            {showCubes && showFaces && (
              <>
                <p className="fl-stateTitle">6 + 6 = 12 · Elohim</p>
                <p className="fl-stateLines">Esferas de construcción · sexta dimensión</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Lectura técnica ── */}
      <Reveal>
        <KeyBox
          title="Orden de manifestación"
          formula={
            <>
              1 <span className="dim">CENTRO</span>
              <span className="op">+</span>9 <span className="dim">CAMPOS DE LUZ</span>
              <span className="op">+</span>9 <span className="dim">CAMPOS DE OSCURIDAD</span>
              <span className="op">=</span>19 <span className="dim">ESFERAS</span>
            </>
          }
          text="No es una fórmula científica: es el orden con el que se despliega la manifestación."
        />
      </Reveal>

      <Reveal>
        <KeyBox
          title="12 Elohim"
          formula={<>6 <span className="op">+</span> 6 <span className="op">=</span> 12</>}
          lines={['ESFERAS DE CONSTRUCCIÓN', 'SEXTA DIMENSIÓN']}
          text="Las doce expresiones de los Elohim son funciones constructoras mediante las cuales una idea o un propósito adquiere estructura dentro de la realidad."
        />
      </Reveal>

      <Reveal>
        <KeyBox
          tone="violet"
          title="18 órdenes"
          formula={<>9 <span className="op">+</span> 9</>}
          lines={['PROPÓSITO / EXPERIENCIA']}
          text="Unas funciones producen el escenario; otras orientan el desarrollo de la experiencia dentro de él."
        />
      </Reveal>

      <Reveal>
        <Flow label="Orden de despliegue" steps={['PROPÓSITO', 'ARQUITECTURA', 'FORMA', 'EXPERIENCIA']} />
      </Reveal>

      <Reveal>
        <TechNote label="Lo trascendental">
          La polaridad aparece aquí como una tecnología de creación. El contraste permite movimiento; el
          movimiento genera experiencia; la experiencia produce consciencia; y la consciencia puede regresar
          al centro con nueva comprensión.
        </TechNote>
      </Reveal>

      <style jsx global>{`
        .fl-module { margin: 0 0 1.9rem; }

        .fl-toggle {
          display: flex; align-items: center; justify-content: center; gap: 0.55rem;
          margin: 0 0 0.9rem;
        }
        .fl-toggle button {
          font-family: var(--aa-mono);
          font-size: 0.64rem; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--aa-text-dim); background: transparent;
          border: 1px solid var(--aa-line); padding: 0.34rem 0.85rem;
          border-radius: 999px !important; cursor: pointer;
          transition: color 200ms ease, border-color 200ms ease, background 200ms ease;
        }
        .fl-toggle button.is-on {
          color: var(--aa-gold-soft); border-color: var(--aa-gold-dim); background: var(--aa-gold-ghost);
        }
        .fl-toggleSep { font-family: var(--aa-mono); font-size: 0.7rem; color: var(--aa-gold-dim); }

        .fl-canvas {
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim);
          border-bottom: 1px solid var(--aa-gold-dim);
          padding: 1.2rem 0.6rem 1.4rem;
        }
        .fl-svg { display: block; width: 100%; max-width: 380px; height: auto; margin: 0 auto; }

        .fl-layer { transition: opacity 900ms ease; }
        .fl-layer.is-hidden { opacity: 0; pointer-events: none; }

        .fl-circle { transition: opacity 900ms ease; }
        .fl-core { filter: drop-shadow(0 0 6px rgba(217, 184, 102, 0.75)); }

        .fl-face { animation: flFace 900ms ease both; }
        @keyframes flFace { from { opacity: 0; } to { opacity: 0.9; } }

        .fl-cubeLabel, .fl-cubeSub, .fl-cubeNum {
          font-family: var(--aa-mono); text-anchor: middle;
        }
        .fl-cubeLabel { font-size: 11px; letter-spacing: 0.2em; fill: var(--aa-gold); }
        .fl-cubeSub { font-size: 8px; letter-spacing: 0.12em; fill: var(--aa-text-dim); }
        .fl-cubeNum { font-size: 9px; letter-spacing: 0.16em; fill: var(--aa-violet-pale); }

        .fl-state { text-align: center; margin-top: 0.9rem; min-height: 78px; }
        .fl-stateTitle {
          font-family: var(--aa-mono); font-size: 0.8rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.4rem;
        }
        .fl-stateLines {
          font-family: var(--aa-mono); font-size: 0.66rem; letter-spacing: 0.14em;
          color: var(--aa-text-dim); margin: 0;
        }

        .fl-families { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 0 0.5rem; }
        .fl-famNum {
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.5rem;
          color: var(--aa-gold-soft); margin: 0 0 0.1rem; line-height: 1;
        }
        .fl-famNum.is-violet { color: var(--aa-violet-pale); }
        .fl-famTitle {
          font-family: var(--aa-mono); font-size: 0.64rem; letter-spacing: 0.16em;
          text-transform: uppercase; margin: 0 0 0.35rem;
        }
        .fl-famTitle.is-luz { color: var(--aa-gold); }
        .fl-famTitle.is-sombra { color: var(--aa-violet-soft); }
        .fl-famText { font-size: 0.82rem; line-height: 1.5; color: var(--aa-text-dim); margin: 0; }

        @media (max-width: 560px) {
          .fl-canvas { padding: 1rem 0.3rem 1.2rem; }
          .fl-families { grid-template-columns: 1fr; gap: 0.9rem; }
          .fl-state { min-height: 96px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fl-circle, .fl-layer { transition: none !important; }
          .fl-face { animation: none !important; opacity: 0.9 !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
