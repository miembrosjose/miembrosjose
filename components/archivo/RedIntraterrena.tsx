'use client';

// TEMPORADA 3 · EPISODIO 9 — HERMANDAD BLANCA DE LA TIERRA
//
// Corte interior del planeta: Gobi como nodo originario y galerías que conectan
// con el resto de la red. Es un MAPA SIMBÓLICO y lo dice en pantalla — no
// pretende cartografiar túneles verificados.
//
// Las cuatro funciones de la red se presentan como fichas seleccionables y NO
// se asignan a nodos concretos: el contenido no establece esa correspondencia.
//
// El asiento 33 corresponde a la HUMANIDAD: 32 maestros + 1 puesto reservado.

import { useState } from 'react';
import ArchivoShell, { Reveal, Flow, KeyBox, TechNote, ModuleTitle } from './ArchivoShell';
import { ARCO_T3 } from './t3-arco';

const CX = 165;
const CY = 165;
const R = 130;

// Posiciones conceptuales dentro del corte — no son coordenadas geográficas.
const NODOS: { id: string; nombre: string; lugar: string; texto: string; a: number; r: number }[] = [
  { id: 'gobi', nombre: 'Gobi / Shambhala', lugar: 'Mongolia', texto: 'Nodo originario de toda la red interior.', a: -90, r: 0.86 },
  { id: 'paititi', nombre: 'Paititi', lugar: 'Perú', texto: 'Archivo asociado con la memoria andina y con el Disco Solar principal.', a: 152, r: 0.78 },
  { id: 'shasta', nombre: 'Monte Shasta', lugar: 'Estados Unidos', texto: 'Retiro asociado a tradiciones de mundo interior y contacto.', a: -152, r: 0.8 },
  { id: 'tayos', nombre: 'Cueva de los Tayos', lugar: 'Ecuador', texto: 'Nodo asociado a galerías, archivos y memoria terrestre.', a: 176, r: 0.62 },
  { id: 'erks', nombre: 'ERKS', lugar: 'Córdoba, Argentina', texto: 'Nodo asociado a Capilla del Monte y la red de retiros interiores.', a: 118, r: 0.86 },
  { id: 'aurora', nombre: 'Aurora', lugar: 'Uruguay', texto: 'Punto de contacto vinculado con retiros y activaciones.', a: 88, r: 0.8 },
  { id: 'isidris', nombre: 'Isidris', lugar: 'Mendoza, Argentina', texto: 'Asociado con Mendoza: Cerro Arco, El Challao y la Quebrada del Durazno.', a: 60, r: 0.86 },
];

// Maestros intraterrestres: custodios de cada nodo. Módulo distinto de los 32
// fundadores — no se identifican unos con otros.
const GUARDIANES: { nombre: string; lugar: string; funcion: string }[] = [
  { nombre: 'Alcir', lugar: 'Paititi', funcion: 'Regente y custodio de información en Paititi.' },
  { nombre: 'Cecea', lugar: 'Sudamérica', funcion: 'Regente femenina de los Retiros Interiores de Sudamérica.' },
  { nombre: 'Soriam', lugar: 'Lago Titicaca', funcion: 'Regente del Lago Titicaca.' },
  { nombre: 'Soromez', lugar: 'Titicaca', funcion: 'Maestro del Titicaca.' },
  { nombre: 'Azur-Mah', lugar: 'Hayumarca', funcion: 'Regente de Hayumarca.' },
  { nombre: 'Abudamir', lugar: 'Andes · Chile', funcion: 'Centro Magnético de los Andes.' },
  { nombre: 'Aminael', lugar: 'Gruta de Huagapo · Perú', funcion: 'Custodio asociado a este retiro interior.' },
  { nombre: 'Mulla', lugar: 'Sierra del Roncador · Mato Grosso · Brasil', funcion: 'Nodo asociado a la red de Retiros Interiores.' },
  { nombre: 'Etnakiel', lugar: 'Monte Sinaí · Egipto', funcion: 'Nodo vinculado al Sinaí.' },
  { nombre: 'Solmen', lugar: 'Monte Shasta · California', funcion: 'Nodo vinculado a Monte Shasta.' },
];

const FUNCIONES: { k: string; texto: string }[] = [
  { k: 'Archivo', texto: 'Custodia de información sobre la historia planetaria y el Plan Cósmico.' },
  { k: 'Retiro', texto: 'Espacios destinados a instrucción y preparación.' },
  { k: 'Portal', texto: 'Puntos asociados a interacción entre diferentes niveles de realidad.' },
  { k: 'Custodia', texto: 'Protección de conocimiento y herramientas hasta que puedan utilizarse responsablemente.' },
];

function pos(a: number, rr: number) {
  const rad = (Math.PI / 180) * a;
  return { x: CX + R * rr * Math.cos(rad), y: CY + R * rr * Math.sin(rad) };
}

export default function RedIntraterrena() {
  const [nodo, setNodo] = useState(0);
  const [fn, setFn] = useState(0);
  const [guard, setGuard] = useState(0);
  const sel = NODOS[nodo];
  const gobi = pos(NODOS[0].a, NODOS[0].r);

  return (
    <ArchivoShell
      guia="Antarel"
      arco={{ pasos: ARCO_T3, actual: 9 }}
      lead="Después de la caída atlante la memoria no desapareció: bajó al interior. Treinta y dos representantes de distintas civilizaciones llegaron a sostener esa red."
      registro="Bajó al interior porque una civilización había demostrado que tener conocimiento no es todavía saber usarlo. Los archivos vuelven cuando se puede recibirlos sin destruirlos."
    >
      {/* Origen */}
      <div className="ri-origin">
        <p className="ri-originNum">32</p>
        <p className="ri-originRole">Maestros / Instructores</p>
        <span className="ri-drop" aria-hidden />
        <p className="ri-originStep">32 civilizaciones</p>
        <span className="ri-drop" aria-hidden />
        <p className="ri-originStep">Gobi · Mongolia</p>
        <span className="ri-drop" aria-hidden />
        <p className="ri-originFinal">Hermandad Blanca de la Tierra</p>
      </div>

      {/* El asiento 33 */}
      <Reveal>
        <div className="ri-seat">
          <p className="ri-seatTitle">El asiento que faltaba</p>
          <div className="ri-seatSum">
            <div className="ri-seatTerm">
              <p className="ri-seatNum">32</p>
              <p className="ri-seatLabel">Maestros</p>
              <p className="ri-seatSub">de distintos mundos y civilizaciones</p>
            </div>
            <span className="ri-seatOp" aria-hidden>+</span>
            <div className="ri-seatTerm is-human">
              <p className="ri-seatNum">1</p>
              <p className="ri-seatLabel">Humanidad</p>
              <p className="ri-seatSub">el puesto reservado</p>
            </div>
            <span className="ri-seatOp" aria-hidden>=</span>
            <div className="ri-seatTerm is-total">
              <p className="ri-seatNum is-big">33</p>
              <p className="ri-seatLabel">Síntesis</p>
            </div>
          </div>
          <p className="ri-seatClaim">
            El asiento que faltaba no venía de las estrellas.
            <br />
            Debía ser ocupado por la Tierra.
          </p>
          <p className="ri-seatNote">
            La humanidad es el elemento llamado a completar esa síntesis. No es un lugar heredado: es un
            lugar que se ocupa cuando se desarrolla la responsabilidad necesaria.
          </p>
        </div>
      </Reveal>

      {/* Corte interior */}
      <ModuleTitle>Mapa simbólico de la red de retiros</ModuleTitle>
      <div className="ri-canvas">
        <svg viewBox="0 0 330 330" className="ri-svg" role="img" aria-label="Corte del planeta con la red interior de retiros">
          <defs>
            <radialGradient id="riCore">
              <stop offset="0%" stopColor="#12101c" />
              <stop offset="100%" stopColor="#06060c" />
            </radialGradient>
          </defs>

          <circle cx={CX} cy={CY} r={R} fill="url(#riCore)" stroke="var(--aa-gold-dim)" strokeWidth={1.1} />
          <circle cx={CX} cy={CY} r={R * 0.62} fill="none" stroke="var(--aa-violet-deep)" strokeWidth={0.6} opacity={0.5} />
          <circle cx={CX} cy={CY} r={R * 0.3} fill="none" stroke="var(--aa-violet-deep)" strokeWidth={0.6} opacity={0.4} />

          {/* Galerías desde Gobi */}
          {NODOS.slice(1).map((n, i) => {
            const p = pos(n.a, n.r);
            const mx = (gobi.x + p.x) / 2 + (CX - (gobi.x + p.x) / 2) * 0.55;
            const my = (gobi.y + p.y) / 2 + (CY - (gobi.y + p.y) / 2) * 0.55;
            return (
              <path
                key={i}
                d={`M${gobi.x},${gobi.y} Q${mx},${my} ${p.x},${p.y}`}
                fill="none"
                stroke={nodo === i + 1 ? 'var(--aa-gold)' : 'var(--aa-violet-deep)'}
                strokeWidth={nodo === i + 1 ? 1.2 : 0.65}
                opacity={nodo === i + 1 ? 0.95 : 0.55}
              />
            );
          })}

          {NODOS.map((n, i) => {
            const p = pos(n.a, n.r);
            const on = nodo === i;
            const isGobi = i === 0;
            return (
              <g key={n.id} className={`ri-node ${on ? 'is-on' : ''}`} onClick={() => setNodo(i)}
                 role="button" tabIndex={0}
                 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setNodo(i); } }}
                 aria-label={n.nombre}>
                <circle cx={p.x} cy={p.y} r={isGobi ? 8 : 6}
                  fill={isGobi || on ? 'var(--aa-gold-soft)' : 'var(--aa-violet-pale)'}
                  className={isGobi ? 'ri-gobi' : undefined} />
                {on && <circle cx={p.x} cy={p.y} r={13} fill="none" stroke="var(--aa-gold)" strokeWidth={0.8} />}
              </g>
            );
          })}
        </svg>
        <p className="ri-canvasNote">
          Representa una red planetaria de retiros, cámaras, archivos y puntos de conexión. No pretende
          cartografiar túneles físicamente verificados.
        </p>
      </div>

      {/* Ficha del nodo */}
      <div className="ri-card" key={sel.id}>
        <p className="ri-cardName">{sel.nombre}</p>
        <p className="ri-cardPlace">{sel.lugar}</p>
        <p className="ri-cardText">{sel.texto}</p>
      </div>

      <div className="ri-nodeList">
        {NODOS.map((n, i) => (
          <button key={n.id} type="button" className={nodo === i ? 'is-on' : ''} onClick={() => setNodo(i)}>
            {n.nombre}
          </button>
        ))}
      </div>

      {/* Funciones */}
      <Reveal>
        <ModuleTitle>Funciones de la red</ModuleTitle>
        <div className="ri-fns">
          {FUNCIONES.map((f, i) => (
            <button key={f.k} type="button" className={`ri-fn ${fn === i ? 'is-on' : ''}`} onClick={() => setFn(i)}>
              {f.k}
            </button>
          ))}
        </div>
        <p className="ri-fnText">{FUNCIONES[fn].texto}</p>
      </Reveal>

      {/* Guardianes de la verdad */}
      <Reveal>
        <ModuleTitle>Guardianes de la verdad — maestros intraterrestres</ModuleTitle>
        <p className="ri-guardIntro">
          Custodios de los retiros interiores. No son los treinta y dos fundadores: son quienes sostienen
          cada nodo de la red.
        </p>
        <div className="ri-guards">
          {GUARDIANES.map((g, i) => {
            const on = guard === i;
            return (
              <button key={g.nombre} type="button" className={`ri-guard ${on ? 'is-on' : ''}`} onClick={() => setGuard(on ? -1 : i)} aria-expanded={on}>
                <span className="ri-guardIdx">{String(i + 1).padStart(2, '0')}</span>
                <span className="ri-guardBody">
                  <span className="ri-guardName">{g.nombre}</span>
                  <span className="ri-guardPlace">{g.lugar}</span>
                  {on && <span className="ri-guardFn">{g.funcion}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* El libro */}
      <Reveal>
        <div className="ri-book">
          <div className="ri-bookMark" aria-hidden>
            <span /><span /><span />
          </div>
          <p className="ri-bookTitle">Libro de las Vestiduras Blancas</p>
          <p className="ri-bookSub">Anales ocultos de la historia planetaria</p>
          <p className="ri-bookText">
            El objetivo último de los archivos interiores no es ocultar
            conocimiento indefinidamente, sino conservarlo hasta que pudiera ser recibido sin volver a
            reproducir los errores de civilizaciones anteriores.
          </p>
        </div>
      </Reveal>

      {/* Discos solares */}
      <Reveal>
        <ModuleTitle>Red de discos solares</ModuleTitle>
        <div className="ri-discs">
          <svg viewBox="0 0 240 240" className="ri-discSvg" role="img" aria-label="Trece discos: uno central y doce conectados">
            {Array.from({ length: 12 }, (_, i) => {
              const a = (Math.PI / 180) * (i * 30 - 90);
              const x = 120 + 86 * Math.cos(a);
              const y = 120 + 86 * Math.sin(a);
              return (
                <g key={i}>
                  <line x1={120} y1={120} x2={x} y2={y} stroke="var(--aa-violet-deep)" strokeWidth={0.6} opacity={0.5} />
                  <circle cx={x} cy={y} r={6} fill="var(--aa-inner-2)" stroke="var(--aa-violet-pale)" strokeWidth={0.8} />
                </g>
              );
            })}
            <circle cx={120} cy={120} r={17} fill="rgba(217,184,102,0.12)" stroke="var(--aa-gold)" strokeWidth={1.2} />
            <text x={120} y={124} className="ri-discCenter">13</text>
          </svg>
          <p className="ri-discLabel">1 central + 12 conectados</p>
          <p className="ri-discText">
            <strong>Paititi</strong> es el nodo principal de la red.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <KeyBox
          title="Red planetaria de memoria"
          formula={<>ARCHIVOS <span className="op">+</span> RETIROS <span className="op">+</span> PORTALES <span className="op">+</span> DISCOS</>}
        />
      </Reveal>

      <Reveal>
        <Flow steps={['CONSERVAR', 'TRANSMITIR', 'PREPARAR', 'ENTREGAR']} />
      </Reveal>

      <Reveal>
        <TechNote label="La condición">
          El conocimiento se oculta cuando el poder supera a la consciencia. El conocimiento se entrega
          cuando la responsabilidad puede sostenerlo.
        </TechNote>
      </Reveal>

      <style jsx global>{`
        .ri-origin {
          text-align: center; margin: 0 0 1.6rem; padding: 1.4rem 1rem;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
        }
        .ri-originNum {
          font-family: var(--aa-mono); font-weight: 700; font-size: 3rem; line-height: 1;
          color: var(--aa-gold-soft); margin: 0; text-shadow: 0 0 24px rgba(217, 184, 102, 0.35);
        }
        .ri-originRole {
          font-family: var(--aa-mono); font-size: 0.66rem; letter-spacing: 0.22em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0.4rem 0 0;
        }
        .ri-drop { display: block; width: 1px; height: 18px; margin: 0.5rem auto; background: var(--aa-gold-dim); }
        .ri-originStep {
          font-family: var(--aa-mono); font-size: 0.7rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-violet-pale); margin: 0;
        }
        .ri-originFinal {
          font-family: var(--aa-mono); font-weight: 700; font-size: 0.82rem;
          letter-spacing: 0.18em; text-transform: uppercase; color: var(--aa-gold-soft); margin: 0;
        }


        /* El asiento 33 — 32 maestros + la humanidad. */
        .ri-seat {
          margin: 0 0 1.7rem; padding: 1.4rem 1rem;
          background: rgba(217, 184, 102, 0.045); border: 1px solid var(--aa-gold-dim);
        }
        .ri-seatTitle {
          font-family: var(--aa-mono); font-size: 0.66rem; letter-spacing: 0.24em;
          text-transform: uppercase; color: var(--aa-gold); text-align: center; margin: 0 0 1.1rem;
        }
        .ri-seatSum {
          display: flex; align-items: center; justify-content: center;
          gap: 0.7rem; flex-wrap: wrap; margin: 0 0 1.2rem;
        }
        .ri-seatTerm { text-align: center; min-width: 88px; }
        .ri-seatNum {
          font-family: var(--aa-mono); font-weight: 700; font-size: 2rem; line-height: 1;
          color: var(--aa-violet-pale); margin: 0 0 0.25rem;
        }
        .ri-seatTerm.is-human .ri-seatNum { color: var(--aa-gold-soft); }
        .ri-seatNum.is-big {
          font-size: 2.9rem; color: var(--aa-gold-soft);
          text-shadow: 0 0 22px rgba(217, 184, 102, 0.45);
        }
        .ri-seatLabel {
          font-family: var(--aa-mono); font-size: 0.62rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0 0 0.2rem;
        }
        .ri-seatSub {
          font-family: var(--aa-mono); font-size: 0.52rem; letter-spacing: 0.1em;
          color: var(--aa-text-dim); margin: 0;
        }
        .ri-seatOp { font-family: var(--aa-mono); font-size: 1.2rem; color: var(--aa-violet-soft); }
        .ri-seatClaim {
          font-family: var(--aa-eb-garamond), Georgia, serif; font-style: italic;
          font-size: clamp(1.02rem, 4vw, 1.22rem); line-height: 1.55;
          color: var(--aa-gold-soft); text-align: center; margin: 0 0 0.9rem;
        }
        .ri-seatNote { font-size: 0.93rem; line-height: 1.6; color: var(--aa-text); margin: 0; }

        /* Guardianes de la verdad */
        .ri-guardIntro {
          font-size: 0.93rem; line-height: 1.6; color: var(--aa-text-dim);
          text-align: center; margin: -0.5rem 0 0.9rem;
        }
        .ri-guards { display: flex; flex-direction: column; gap: 0.35rem; margin: 0 0 1.7rem; }
        .ri-guard {
          display: flex; align-items: flex-start; gap: 0.7rem; width: 100%; text-align: left;
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-violet-deep); padding: 0.62rem 0.8rem; cursor: pointer;
          transition: border-color 200ms ease, background 200ms ease;
        }
        .ri-guard.is-on { border-left-color: var(--aa-gold); background: #0d0d16; }
        .ri-guardIdx { font-family: var(--aa-mono); font-size: 0.55rem; color: var(--aa-text-dim); padding-top: 0.2rem; }
        .ri-guardBody { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
        .ri-guardName {
          font-family: var(--aa-mono); font-size: 0.74rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-gold-soft);
        }
        .ri-guardPlace {
          font-family: var(--aa-mono); font-size: 0.56rem; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--aa-text-dim);
        }
        .ri-guardFn {
          font-size: 0.88rem; line-height: 1.5; color: var(--aa-text); margin-top: 0.3rem;
          animation: riIn 320ms ease both;
        }

        .ri-canvas {
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
          padding: 1rem 0.4rem 0.8rem; margin: 0 0 1rem;
        }
        .ri-svg { display: block; width: 100%; max-width: 330px; height: auto; margin: 0 auto; }
        .ri-node { cursor: pointer; }
        .ri-node circle { transition: fill 220ms ease; }
        .ri-gobi { filter: drop-shadow(0 0 9px rgba(217, 184, 102, 0.7)); }
        .ri-canvasNote {
          font-size: 0.82rem; line-height: 1.5; color: var(--aa-text-dim);
          text-align: center; margin: 0.7rem auto 0; max-width: 44ch;
        }

        .ri-card {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-gold); padding: 1rem 1.1rem; margin: 0 0 0.7rem;
          animation: riIn 400ms ease both;
        }
        @keyframes riIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        .ri-cardName {
          font-family: var(--aa-mono); font-size: 0.8rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.15rem;
        }
        .ri-cardPlace {
          font-family: var(--aa-mono); font-size: 0.58rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-text-dim); margin: 0 0 0.55rem;
        }
        .ri-cardText { font-size: 0.93rem; line-height: 1.58; color: var(--aa-text); margin: 0; }

        .ri-nodeList { display: flex; flex-wrap: wrap; gap: 0.3rem; justify-content: center; margin: 0 0 1.7rem; }
        .ri-nodeList button {
          font-family: var(--aa-mono); font-size: 0.58rem; letter-spacing: 0.1em;
          color: var(--aa-text-dim); background: transparent; border: 1px solid var(--aa-line);
          padding: 0.3rem 0.55rem; cursor: pointer; border-radius: 999px !important;
          transition: color 200ms ease, border-color 200ms ease;
        }
        .ri-nodeList button.is-on { color: var(--aa-gold-soft); border-color: var(--aa-gold-dim); }

        .ri-fns { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.35rem; margin: 0 0 0.8rem; }
        .ri-fn {
          font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--aa-violet-pale);
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          padding: 0.5rem 0.3rem; cursor: pointer;
          transition: color 200ms ease, border-color 200ms ease, background 200ms ease;
        }
        .ri-fn.is-on { color: var(--aa-gold-soft); border-color: var(--aa-gold-dim); background: var(--aa-gold-ghost); }
        .ri-fnText { font-size: 0.95rem; line-height: 1.62; color: var(--aa-text); margin: 0 0 1.7rem; }

        .ri-book {
          margin: 0 0 1.7rem; padding: 1.4rem 1.1rem; text-align: center;
          background: #08080e; border: 1px solid var(--aa-gold-dim);
        }
        .ri-bookMark { display: flex; justify-content: center; gap: 4px; margin: 0 0 0.9rem; }
        .ri-bookMark span {
          display: block; width: 3px; height: 26px; background: var(--aa-gold-dim);
        }
        .ri-bookMark span:nth-child(2) { background: var(--aa-gold); height: 34px; }
        .ri-bookTitle {
          font-family: var(--aa-mono); font-size: 0.78rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.25rem;
        }
        .ri-bookSub {
          font-family: var(--aa-mono); font-size: 0.58rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-text-dim); margin: 0 0 0.85rem;
        }
        .ri-bookText { font-size: 0.93rem; line-height: 1.62; color: var(--aa-text); margin: 0; text-align: left; }

        .ri-discs {
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
          padding: 1.1rem 0.6rem; margin: 0 0 1.7rem; text-align: center;
        }
        .ri-discSvg { display: block; width: 100%; max-width: 230px; height: auto; margin: 0 auto 0.6rem; }
        .ri-discCenter {
          font-family: var(--aa-mono); font-weight: 700; font-size: 13px;
          text-anchor: middle; fill: var(--aa-gold-soft);
        }
        .ri-discLabel {
          font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0 0 0.6rem;
        }
        .ri-discText { font-size: 0.92rem; line-height: 1.55; color: var(--aa-text); margin: 0; }
        .ri-discText strong { color: var(--aa-gold-soft); font-weight: 400; }

        @media (max-width: 560px) {
          .ri-seatSum { gap: 0.4rem; }
          .ri-seatTerm { min-width: 74px; }
          .ri-seatNum { font-size: 1.6rem; }
          .ri-seatNum.is-big { font-size: 2.3rem; }
          .ri-fns { grid-template-columns: repeat(2, 1fr); }
          .ri-originNum { font-size: 2.5rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ri-card { animation: none !important; }
          .ri-node circle { transition: none !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
