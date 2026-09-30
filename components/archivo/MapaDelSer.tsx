'use client';

// TEMPORADA 2 · EPISODIO 3 — LOS SIETE CUERPOS
//
// Módulo central: eje vertical de siete vehículos, tratado como lectura de
// sistema (capas / escáner), no como ilustración new age. Cada nivel abre su
// ficha, con el mantra de su chakra en dorado.
//
// Los tres primeros niveles quedan marcados como activos en la humanidad
// terrestre — la clave 3:3 del final del archivo.

import { useState } from 'react';
import ArchivoShell, { Reveal, Flow, KeyBox, ModuleTitle } from './ArchivoShell';

type Nivel = {
  n: number;
  nombre: string;
  chakra: string;
  /** Mantra del chakra correspondiente. */
  mantra: string;
  funcion: string[];
  definicion: string;
};

// De arriba (7) hacia abajo (1) — orden de manifestación.
const NIVELES: Nivel[] = [
  {
    n: 7, nombre: 'Esencia', chakra: 'Corona', mantra: 'AUM',
    funcion: ['identidad esencial', 'origen', 'vínculo con la divinidad'],
    definicion: 'Es el nivel más profundo del ser dentro de esta arquitectura y representa su naturaleza esencial.',
  },
  {
    n: 6, nombre: 'Espíritu', chakra: 'Tercer ojo', mantra: 'OM',
    funcion: ['consciencia acumulada', 'visión', 'integración'],
    definicion: 'Representa la consciencia desarrollada a lo largo del proceso del ser.',
  },
  {
    n: 5, nombre: 'Alma', chakra: 'Laríngeo', mantra: 'HAM',
    funcion: ['memoria evolutiva', 'aprendizaje', 'misión', 'identidad profunda'],
    definicion: 'Es descrita como la «catedral del espíritu»: el campo donde se acumula la experiencia adquirida a través del proceso evolutivo.',
  },
  {
    n: 4, nombre: 'Mental superior', chakra: 'Corazón', mantra: 'YAM',
    funcion: ['intuición', 'percepción ampliada', 'síntesis', 'discernimiento'],
    definicion: 'Constituye el nivel asociado con las facultades psíquicas, la intuición y una comprensión que supera la lectura inmediata de la personalidad.',
  },
  {
    n: 3, nombre: 'Mental inferior / Ego', chakra: 'Plexo solar', mantra: 'RAM',
    funcion: ['personalidad', 'carácter', 'interpretación', 'identidad individual'],
    definicion: 'Organiza la personalidad mediante la cual interpretamos y respondemos a la experiencia cotidiana.',
  },
  {
    n: 2, nombre: 'Astral', chakra: 'Sacro', mantra: 'VAM',
    funcion: ['emoción', 'deseo', 'sensibilidad', 'movimiento afectivo'],
    definicion: 'Es el cuerpo relacionado con emociones y deseos y permanece vinculado al físico durante la experiencia encarnada.',
  },
  {
    n: 1, nombre: 'Físico', chakra: 'Raíz', mantra: 'LAM',
    funcion: ['materia', 'acción', 'supervivencia', 'sentidos', 'encarnación'],
    definicion: 'Es el vehículo biológico mediante el cual la experiencia adquiere acción directa dentro de la materia.',
  },
];

export default function MapaDelSer() {
  const [sel, setSel] = useState<number>(1);

  return (
    <ArchivoShell
      lead="Dentro del Universo Material de siete dimensiones, el ser humano es una estructura de siete vehículos: cada uno deja operar a la consciencia desde un nivel distinto."
      registro="Evolucionar significa aumentar la cantidad de nuestra propia estructura que podemos habitar conscientemente."
    >
      <ModuleTitle>Mapa del ser — siete vehículos</ModuleTitle>

      <div className="ms-axis">
        {NIVELES.map((lv, i) => {
          const on = sel === lv.n;
          const activo = lv.n <= 3; // vehículos predominantes en la humanidad terrestre
          return (
            <div key={lv.n} className={`ms-row ${on ? 'is-on' : ''} ${activo ? 'is-active3' : ''}`}>
              {i > 0 && <span className="ms-link" aria-hidden />}
              <button
                type="button"
                className="ms-node"
                onClick={() => setSel(on ? -1 : lv.n)}
                aria-expanded={on}
              >
                <span className="ms-num">{lv.n}</span>
                <span className="ms-body">
                  <span className="ms-name">{lv.nombre}</span>
                  <span className="ms-chakra">{lv.chakra}</span>
                </span>
                <span className="ms-mantra" aria-label={`Mantra ${lv.mantra}`}>
                  <span className="ms-mantraWave" aria-hidden>
                    <i /><i /><i />
                  </span>
                  {lv.mantra}
                </span>
                <span className="ms-mark" aria-hidden>{on ? '−' : '+'}</span>
              </button>

              {on && (
                <div className="ms-detail">
                  <div className="ms-funcs">
                    {lv.funcion.map((f, k) => (
                      <span key={k} className="ms-func">{f}</span>
                    ))}
                  </div>
                  <p className="ms-def">{lv.definicion}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Reveal>
        <div className="ms-twoWay">
          <Flow
            label="Manifestación"
            steps={['ESENCIA', 'ESPÍRITU', 'ALMA', 'MENTAL SUPERIOR', 'MENTAL INFERIOR', 'ASTRAL', 'FÍSICO']}
          />
          <Flow
            label="Evolución"
            dir="up"
            steps={['CONSCIENCIA', 'INTEGRACIÓN', 'APRENDIZAJE', 'EXPERIENCIA', 'FÍSICO']}
          />
        </div>
      </Reveal>

      <Reveal>
        <KeyBox
          title="Clave 3 : 3"
          formula={<>3 <span className="op">:</span> 3</>}
          lines={['TIERRA', '3ª DIMENSIÓN · 3 CUERPOS ACTIVOS PRINCIPALES', 'FÍSICO · ASTRAL · MENTAL INFERIOR']}
          text="La humanidad terrestre es una consciencia 3:3: tercera dimensión física y desarrollo predominante de los tres primeros vehículos."
        />
      </Reveal>

      <style jsx global>{`
        .ms-axis {
          margin: 0 0 1.8rem; padding: 1.2rem 0.9rem;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim);
          border-bottom: 1px solid var(--aa-gold-dim);
        }
        .ms-row { display: flex; flex-direction: column; }
        .ms-link {
          display: block; width: 1px; height: 14px; margin: 0 auto 0 25px;
          background: var(--aa-gold-dim);
        }
        .ms-node {
          display: flex; align-items: center; gap: 0.85rem; width: 100%;
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          padding: 0.65rem 0.8rem; cursor: pointer; text-align: left;
          transition: border-color 220ms ease, background 220ms ease;
        }
        .ms-row.is-on .ms-node { border-color: var(--aa-gold-dim); background: #0d0d16; }
        .ms-num {
          flex: 0 0 auto; width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--aa-mono); font-weight: 700; font-size: 0.86rem;
          color: var(--aa-violet-pale); border: 1px solid var(--aa-violet-deep);
          border-radius: 999px !important;
          transition: color 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
        }
        .ms-row.is-on .ms-num,
        .ms-row.is-active3 .ms-num {
          color: var(--aa-gold-soft); border-color: var(--aa-gold);
        }
        .ms-row.is-on .ms-num { box-shadow: 0 0 10px rgba(217, 184, 102, 0.28); }
        .ms-body { flex: 1; display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
        .ms-name {
          font-family: var(--aa-mono); font-size: 0.78rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--aa-gold-soft);
        }
        .ms-chakra {
          font-family: var(--aa-mono); font-size: 0.62rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-text-dim);
        }
        /* Mantra del chakra — dorado, con una onda de tres barras que pulsa. */
        .ms-mantra {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-family: var(--aa-mono); font-weight: 700; font-size: 0.72rem;
          letter-spacing: 0.22em; color: var(--aa-gold-soft);
          padding: 0.22rem 0.5rem; border: 1px solid var(--aa-gold-dim);
          background: var(--aa-gold-ghost); border-radius: 999px !important;
          white-space: nowrap;
        }
        .ms-mantraWave { display: inline-flex; align-items: center; gap: 2px; height: 11px; }
        .ms-mantraWave i {
          display: block; width: 2px; height: 4px; background: var(--aa-gold);
          border-radius: 999px !important; animation: msWave 1.5s ease-in-out infinite;
        }
        .ms-mantraWave i:nth-child(2) { animation-delay: 0.22s; }
        .ms-mantraWave i:nth-child(3) { animation-delay: 0.44s; }
        @keyframes msWave { 0%, 100% { height: 4px; opacity: 0.55; } 50% { height: 11px; opacity: 1; } }

        .ms-mark { font-family: var(--aa-mono); font-size: 0.9rem; color: var(--aa-gold-dim); }

        .ms-detail {
          padding: 0.85rem 0.9rem 0.3rem 3.4rem;
          animation: msIn 380ms ease both;
        }
        @keyframes msIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
        .ms-funcs { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0 0 0.6rem; }
        .ms-func {
          font-family: var(--aa-mono); font-size: 0.62rem; letter-spacing: 0.08em;
          color: #cbb9e6; background: var(--aa-violet-ghost);
          border: 1px solid var(--aa-violet-deep);
          padding: 0.28rem 0.6rem; border-radius: 999px !important;
        }
        .ms-def { font-size: 0.95rem; line-height: 1.62; color: var(--aa-text); margin: 0; }

        .ms-twoWay { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
        .ms-twoWay .aa-flow { margin: 0; }
        .ms-twoWay .aa-flowNode { font-size: clamp(0.7rem, 2.4vw, 0.9rem); }

        @media (max-width: 560px) {
          .ms-axis { padding: 1rem 0.6rem; }
          .ms-detail { padding-left: 1rem; }
          .ms-mantra { font-size: 0.6rem; letter-spacing: 0.14em; padding: 0.18rem 0.38rem; }
          .ms-mantraWave { display: none; }
          .ms-twoWay { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ms-detail { animation: none !important; }
          .ms-mantraWave i { animation: none !important; height: 7px !important; opacity: 0.9 !important; }
          .ms-node, .ms-num { transition: none !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
