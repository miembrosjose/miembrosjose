'use client';

// TEMPORADA 4 · EPISODIO 1 — LOS DISCOS SOLARES
//
// Mapa planetario interactivo de los trece nodos. Las posiciones se calculan
// desde latitud/longitud reales sobre una retícula (meridianos y paralelos):
// ni contornos de continentes dibujados a mano ni imagen externa.
//
// Cada disco trabaja un campo concreto y distinto. La ficha tiene cuatro
// campos: TRABAJA · MOVIMIENTO · CONEXIÓN · CLAVE.
// Ilumana (Paititi) es el Gran Disco Principal: lente y espejo dimensional.

import { useState } from 'react';
import ArchivoShell, { Reveal, Flow, TechNote, ModuleTitle } from './ArchivoShell';
import { ARCO_T4 } from './t4-arco';

type Disco = {
  lugar: string;
  pais: string;
  nombre: string;
  lat: number;
  lon: number;
  trabaja: string[];
  movimiento: string[];
  conexion: string;
  clave: string;
};

const DISCOS: Disco[] = [
  {
    lugar: 'Monte Shasta', pais: 'Estados Unidos', nombre: 'Emanashi', lat: 41.4, lon: -122.2,
    trabaja: ['memoria lemuriana', 'hipersensibilidad', 'sistema nervioso sutil', 'sensación de no pertenecer', 'memorias de persecución o silenciamiento', 'miedo a mostrar capacidades', 'memoria estelar', 'reconexión con origen y propósito'],
    movimiento: ['SENSIBILIDAD DESORDENADA', 'PERCEPCIÓN CONSCIENTE'],
    conexion: 'Emanashi funciona como una corona dentro de la red: recibe y distribuye información vinculada con la memoria de origen y las bibliotecas cósmicas. Memoria · ADN sutil · origen · misión.',
    clave: 'Dejar de esconder la luz que ya recuerdas.',
  },
  {
    lugar: 'Valle Siete Luminarias', pais: 'México', nombre: 'Sipenbó', lat: 20.4, lon: -101.2,
    trabaja: ['guerrero interior', 'protección', 'armadura emocional', 'hipervigilancia', 'rigidez', 'necesidad de control', 'masculino consciente', 'proteger sin agredir'],
    movimiento: ['ARMADURA', 'PRESENCIA', 'DUREZA', 'FORTALEZA CONSCIENTE'],
    conexion: 'Sipenbó enseña a mantener la fuerza sin cerrar el corazón.',
    clave: 'No necesitas endurecerte para ser fuerte.',
  },
  {
    lugar: 'Ciudad Blanca', pais: 'Honduras', nombre: 'Aromane', lat: 15.2, lon: -84.9,
    trabaja: ['integración masculino–femenino', 'polarización interna', 'autoexigencia', 'conflicto entre acción y sensibilidad', 'corazón', 'complementariedad', 'unión de fuerzas interiores'],
    movimiento: ['CONFLICTO', 'COMPLEMENTARIEDAD'],
    conexion: 'Aromane restaura el eje donde lo masculino y lo femenino dejan de competir y empiezan a crear juntos.',
    clave: 'Lo que parecía opuesto fue creado para complementarse.',
  },
  {
    lugar: 'Guatavita', pais: 'Colombia', nombre: 'Xemancó', lat: 4.9, lon: -73.8,
    trabaja: ['fertilidad', 'gestación', 'matriz creadora', 'unión fuego–agua', 'masculino–femenino', 'duelos de creación', 'bloqueos creativos', 'sostener lo que desea nacer'],
    movimiento: ['POTENCIAL', 'GESTACIÓN', 'CREACIÓN'],
    conexion: 'Xemancó activa el espacio interno donde una posibilidad puede adquirir forma. Su trabajo es energético, simbólico y de consciencia.',
    clave: 'Crear también significa aprender a sostener.',
  },
  {
    lugar: 'Roraima', pais: 'Venezuela', nombre: 'Urinam', lat: 5.1, lon: -60.7,
    trabaja: ['visión', 'tercer ojo', 'observación', 'juicio', 'perspectiva', 'patrones mentales', 'mirar desde un nivel superior'],
    movimiento: ['JUICIO', 'OBSERVACIÓN', 'COMPRENSIÓN'],
    conexion: 'Urinam eleva el punto de observación. No cambia necesariamente el acontecimiento: cambia desde dónde es comprendido.',
    clave: 'Cambia la altura desde la que estás mirando.',
  },
  {
    lugar: 'Cueva de los Tayos', pais: 'Ecuador', nombre: 'Jasintah', lat: -3.0, lon: -78.2,
    trabaja: ['memoria corporal', 'linaje', 'memorias ancestrales', 'culpas heredadas', 'abandono', 'traición', 'dolores transmitidos', 'dones heredados', 'potencial bloqueado en el árbol', 'puente Tierra–estrellas'],
    movimiento: ['HERENCIA INCONSCIENTE', 'RECONOCIMIENTO', 'POTENCIAL'],
    conexion: 'Jasintah permite entrar en capas antiguas de información que el cuerpo conserva aunque la mente no las recuerde.',
    clave: 'No todo lo que cargas comenzó contigo.',
  },
  {
    lugar: 'Paititi', pais: 'Perú', nombre: 'Ilumana', lat: -12.5, lon: -71.5,
    trabaja: ['transformación', 'renacimiento', 'carga emocional', 'miedo', 'culpa', 'traición', 'reorganización de la luz interior', 'sincronización de la red'],
    movimiento: ['COLAPSO', 'TRANSFORMACIÓN', 'RENACIMIENTO'],
    conexion: 'Ilumana es el corazón del corazón: lente y espejo dimensional. Su alineamiento produce resonancia sobre los otros doce discos — una reacción en cadena que alcanza la red planetaria entera.',
    clave: 'Cuando el corazón central recuerda su ritmo, la red entera puede responder.',
  },
  {
    lugar: 'Lago Titicaca', pais: 'Bolivia', nombre: 'Demayón', lat: -15.8, lon: -69.3,
    trabaja: ['frecuencia original', 'agua primordial', 'memoria de origen', 'unidad', 'memoria siriana', 'reconciliación masculino–femenino', 'pertenencia', 'retorno al punto anterior a la separación'],
    movimiento: ['FRAGMENTACIÓN', 'RECONOCIMIENTO', 'UNIDAD'],
    conexion: 'Demayón trabaja con la memoria de aquello que éramos antes de empezar a experimentarnos como partes separadas.',
    clave: 'Recordar el origen es recordar que las partes siguen perteneciendo al mismo ser.',
  },
  {
    lugar: 'Licancabur', pais: 'Chile', nombre: 'Ramayah', lat: -22.8, lon: -67.9,
    trabaja: ['fuego sagrado', 'ira', 'frustración', 'voluntad', 'verdad', 'capacidad de actuar', 'fuerza contenida', 'dirección'],
    movimiento: ['IRA', 'VOLUNTAD', 'FUEGO REACTIVO', 'FUEGO CONSCIENTE'],
    conexion: 'Ramayah enseña a utilizar la intensidad sin convertirse en destrucción.',
    clave: 'El mismo fuego que destruye puede convertirse en dirección.',
  },
  {
    lugar: 'Talampaya', pais: 'Argentina', nombre: 'Mitakunah', lat: -29.8, lon: -67.8,
    trabaja: ['kundalini', 'raíz', 'energía vital', 'deseo', 'placer', 'creatividad', 'vergüenza corporal', 'habitar plenamente la materia'],
    movimiento: ['ENERGÍA DETENIDA', 'MOVIMIENTO', 'CREACIÓN'],
    conexion: 'Mitakunah reactiva la corriente vital desde la base. La espiritualidad no exige abandonar el cuerpo: exige aprender a habitarlo conscientemente.',
    clave: 'La vida también asciende desde la raíz.',
  },
  {
    lugar: 'Sierra del Roncador', pais: 'Brasil', nombre: 'Omsarah', lat: -13.5, lon: -52.5,
    trabaja: ['inocencia', 'timo / centro del pecho', 'autoestima', 'ternura', 'verdad', 'belleza esencial', 'armaduras afectivas', 'recuperación de confianza'],
    movimiento: ['DEFENSA', 'TERNURA CONSCIENTE'],
    conexion: 'Omsarah ayuda a reconocer aquello que permanece verdadero debajo de las capas creadas para sobrevivir.',
    clave: 'Tu inocencia no es ingenuidad; es la parte de ti que todavía puede encontrarse con la vida sin armadura.',
  },
  {
    lugar: 'Aurora', pais: 'Uruguay', nombre: 'Ulimen', lat: -33.2, lon: -54.6,
    trabaja: ['autorreparación', 'sobrecarga', 'cansancio emocional', 'acumulación', 'autoexigencia', 'cuerpo', 'descarga', 'ligereza'],
    movimiento: ['ACUMULACIÓN', 'DESCARGA', 'ESPACIO'],
    conexion: 'Ulimen enseña al sistema a soltar aquello que continúa sosteniendo aunque ya no lo necesite.',
    clave: 'Soltar también es una forma de sanar el espacio interior.',
  },
  {
    lugar: 'Antártica', pais: 'Chile / Argentina', nombre: 'Ion', lat: -72.0, lon: -63.0,
    trabaja: ['memoria primordial', 'origen', 'miedo existencial', 'sensación antigua de amenaza', 'ansiedad profunda', 'urgencia', 'memorias anteriores a la historia personal', 'reinicio'],
    movimiento: ['AMENAZA ANTIGUA', 'ORIGEN', 'REINICIO'],
    conexion: 'Ion conduce hacia las capas más antiguas de la memoria. Su función no es explicar cada miedo: es llevar la consciencia hasta un punto anterior a la forma que ese miedo adquirió.',
    clave: 'Antes del miedo existía un punto de origen que todavía puedes recordar.',
  },
];

const PRINCIPAL = 6; // Ilumana

// Encuadre geográfico del lienzo.
const LON0 = -132, LON1 = -44;
const LAT0 = 50, LAT1 = -80;
const W = 300, H = 430;

const px = (lon: number) => ((lon - LON0) / (LON1 - LON0)) * W;
const py = (lat: number) => ((LAT0 - lat) / (LAT0 - LAT1)) * H;

export default function DiscosSolares() {
  const [sel, setSel] = useState(PRINCIPAL);
  const d = DISCOS[sel];

  return (
    <ArchivoShell
      guia="Ivika"
      voz="Memoria abierta"
      arco={{ pasos: ARCO_T4, actual: 1 }}
      lead="Los discos solares son archivos vivos de información y consciencia. No son objetos ni símbolos: son nodos de conexión con una red de memoria planetaria ligada a los retiros interiores, a la Hermandad Blanca y al proceso de reconexión entre la humanidad y su origen."
      registro="Los discos solares no fueron preservados para alimentar curiosidad, sino para sostener la memoria hasta que la humanidad desarrollara la madurez necesaria para volver a conectarse con ella."
    >
      {/* Arquitectura de la red */}
      <ModuleTitle>Arquitectura de la red</ModuleTitle>
      <div className="ds-arch">
        <div className="ds-archRow">
          <span className="ds-archSide">12</span>
          <span className="ds-archArrow" aria-hidden>→</span>
          <span className="ds-archCore">ILUMANA</span>
          <span className="ds-archArrow" aria-hidden>←</span>
          <span className="ds-archSide">12</span>
        </div>
        <p className="ds-archLabel">Gran Disco Principal · Paititi</p>
        <div className="ds-archFns">
          <span>Recibe</span><span>Refleja</span><span>Refracta</span><span>Sincroniza</span>
        </div>
        <p className="ds-archText">
          Ilumana es el corazón de la red: funciona como <strong>lente dimensional</strong> y{' '}
          <strong>espejo dimensional</strong>. Los otros doce discos son complementarios.
        </p>
      </div>

      <Reveal>
        <div className="ds-eq">
          <p className="ds-eqTitle">Qué es un disco solar</p>
          <p className="ds-eqFormula">
            ARCHIVO <span className="ds-op">+</span> ESPEJO <span className="ds-op">+</span> LLAVE{' '}
            <span className="ds-op">+</span> RESONADOR
          </p>
          <p className="ds-eqText">
            Los trece pueden resonar entre sí para localizar y estabilizar la puerta de reconexión con el
            Real Tiempo del Universo.
          </p>
        </div>
      </Reveal>

      {/* Mantra de activación */}
      <Reveal>
        <div className="ds-mantra">
          <p className="ds-mantraWord">
            AM <span className="ds-mantraDash" aria-hidden>—</span> ON
          </p>
          <p className="ds-mantraLabel">Mantra de activación</p>
          <div className="ds-mantraFlow">
            <span>onda sonora</span>
            <span className="ds-mantraArrow" aria-hidden>↓</span>
            <span>resonancia</span>
            <span className="ds-mantraArrow" aria-hidden>↓</span>
            <span>red</span>
          </div>
        </div>
      </Reveal>

      {/* Mapa */}
      <ModuleTitle>Red de discos solares</ModuleTitle>
      <p className="ds-sub">13 nodos de memoria, resguardo y activación distribuidos por el planeta.</p>

      <div className="ds-canvas">
        <svg viewBox={`0 0 ${W} ${H}`} className="ds-svg" role="img" aria-label="Mapa de los trece discos solares">
          {[40, 20, 0, -20, -40, -60].map((lat) => (
            <g key={lat}>
              <line x1={0} y1={py(lat)} x2={W} y2={py(lat)} stroke="var(--aa-violet-deep)" strokeWidth={0.5} opacity={lat === 0 ? 0.8 : 0.32} />
              <text x={3} y={py(lat) - 3} className="ds-grid">{lat === 0 ? 'ECUADOR' : `${Math.abs(lat)}°${lat > 0 ? 'N' : 'S'}`}</text>
            </g>
          ))}
          {[-120, -100, -80, -60].map((lon) => (
            <line key={lon} x1={px(lon)} y1={0} x2={px(lon)} y2={H} stroke="var(--aa-violet-deep)" strokeWidth={0.5} opacity={0.28} />
          ))}

          {/* Resonancia desde Ilumana */}
          {DISCOS.map((n, i) =>
            i === PRINCIPAL ? null : (
              <line key={`l-${i}`} x1={px(DISCOS[PRINCIPAL].lon)} y1={py(DISCOS[PRINCIPAL].lat)} x2={px(n.lon)} y2={py(n.lat)}
                stroke={sel === i ? 'var(--aa-gold)' : 'var(--aa-gold-dim)'}
                strokeWidth={sel === i ? 1 : 0.45}
                opacity={sel === i ? 0.9 : 0.3} />
            ),
          )}

          {DISCOS.map((n, i) => {
            const on = sel === i;
            const mayor = i === PRINCIPAL;
            return (
              <g key={n.nombre} className={`ds-node ${on ? 'is-on' : ''}`} onClick={() => setSel(i)}
                 role="button" tabIndex={0}
                 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(i); } }}
                 aria-label={`${n.lugar} — ${n.nombre}`}>
                {on && <circle cx={px(n.lon)} cy={py(n.lat)} r={11} fill="none" stroke="var(--aa-gold)" strokeWidth={0.8} className="ds-halo" />}
                <circle cx={px(n.lon)} cy={py(n.lat)} r={mayor ? 6 : on ? 5.5 : 4}
                  fill={mayor || on ? 'var(--aa-gold-soft)' : 'var(--aa-violet-pale)'}
                  className={mayor ? 'ds-mayor' : undefined} />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Ficha profunda */}
      <div className="ds-card" key={sel}>
        <div className="ds-cardHead">
          <span className="ds-cardIdx">{String(sel + 1).padStart(2, '0')}</span>
          <div>
            <p className="ds-cardDisc">
              {d.nombre}
              {sel === PRINCIPAL && <span className="ds-cardTag">Gran Disco Principal</span>}
            </p>
            <p className="ds-cardPlace">{d.lugar} · {d.pais}</p>
          </div>
        </div>

        <p className="ds-fLabel">Trabaja principalmente</p>
        <div className="ds-works">
          {d.trabaja.map((t) => (
            <span key={t} className="ds-work">{t}</span>
          ))}
        </div>

        <p className="ds-fLabel">Movimiento interior</p>
        <div className="ds-move">
          {d.movimiento.map((m, i) => (
            <span key={m} className="ds-moveItem">
              {i > 0 && <span className="ds-moveArrow" aria-hidden>→</span>}
              <span className="ds-moveNode">{m}</span>
            </span>
          ))}
        </div>

        <p className="ds-fLabel">Conexión</p>
        <p className="ds-conn">{d.conexion}</p>

        <p className="ds-fLabel">Clave</p>
        <p className="ds-clave">«{d.clave}»</p>
      </div>

      {/* Lista completa */}
      <div className="ds-list">
        {DISCOS.map((n, i) => (
          <button key={n.nombre} type="button" className={`${sel === i ? 'is-on' : ''} ${i === PRINCIPAL ? 'is-main' : ''}`} onClick={() => setSel(i)}>
            <span className="ds-listIdx">{String(i + 1).padStart(2, '0')}</span>
            <span className="ds-listName">{n.nombre}</span>
            <span className="ds-listPlace">{n.lugar}</span>
          </button>
        ))}
      </div>

      {/* Reacción en cadena */}
      <Reveal>
        <Flow label="Resonancia" steps={['ILUMANA', '12 DISCOS', 'RED PLANETARIA']} />
      </Reveal>

      {/* Cierre */}
      <Reveal>
        <ModuleTitle>Trece llaves, una red</ModuleTitle>
        <div className="ds-close">
          <p className="ds-closeFormula">
            13 FUNCIONES <span className="ds-op">↓</span> 13 LLAVES <span className="ds-op">↓</span> 1 RED
          </p>
          <p className="ds-closeClaim">Ningún disco está aislado.</p>
          <p className="ds-closeText">
            Cada uno trabaja una zona distinta del proceso. Pero cuando entran en resonancia —memoria,
            cuerpo, emoción, voluntad, origen y propósito— empiezan a funcionar como una sola red.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <div className="ds-axis">
          {['RETIROS INTERIORES', 'DISCOS SOLARES', 'HUMANIDAD', 'MISIÓN PLANETARIA'].map((n, i) => (
            <div key={n} className="ds-axisItem">
              {i > 0 && <span className="ds-axisArrow" aria-hidden>↕</span>}
              <span className={`ds-axisNode ${i === 1 ? 'is-gold' : ''}`}>{n}</span>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <TechNote label="Cómo aproximarse">
          Los discos no son lugares para consumir espiritualmente: son nodos de respeto, preparación y
          servicio.
        </TechNote>
      </Reveal>

      <style jsx global>{`
        /* Arquitectura: 12 → ILUMANA ← 12 */
        .ds-arch {
          margin: 0 0 1.5rem; padding: 1.4rem 1rem; text-align: center;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
        }
        .ds-archRow {
          display: flex; align-items: center; justify-content: center; gap: 0.6rem;
          flex-wrap: wrap; margin: 0 0 0.5rem;
        }
        .ds-archSide {
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.3rem;
          color: var(--aa-violet-pale);
        }
        .ds-archArrow { font-family: var(--aa-mono); color: var(--aa-gold-dim); }
        .ds-archCore {
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.15rem;
          letter-spacing: 0.22em; color: var(--aa-gold-soft);
          text-shadow: 0 0 20px rgba(217, 184, 102, 0.4);
        }
        .ds-archLabel {
          font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0 0 0.9rem;
        }
        .ds-archFns { display: flex; flex-wrap: wrap; gap: 0.35rem; justify-content: center; margin: 0 0 0.9rem; }
        .ds-archFns span {
          font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-gold-soft);
          border: 1px solid var(--aa-gold-dim); padding: 0.3rem 0.6rem;
          border-radius: 999px !important;
        }
        .ds-archText { font-size: 0.93rem; line-height: 1.6; color: var(--aa-text); margin: 0; }
        .ds-archText strong { color: var(--aa-gold-soft); font-weight: 400; }

        .ds-eq {
          margin: 0 0 1.5rem; padding: 1.2rem 1rem; text-align: center;
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-top: 2px solid var(--aa-gold-dim);
        }
        .ds-eqTitle {
          font-family: var(--aa-mono); font-size: 0.64rem; letter-spacing: 0.22em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0 0 0.7rem;
        }
        .ds-eqFormula {
          font-family: var(--aa-mono); font-weight: 700; font-size: clamp(0.8rem, 3vw, 1rem);
          letter-spacing: 0.08em; color: var(--aa-gold-soft); margin: 0 0 0.7rem; line-height: 1.7;
        }
        .ds-op { color: var(--aa-violet-soft); margin: 0 0.3em; }
        .ds-eqText { font-size: 0.92rem; line-height: 1.6; color: var(--aa-text); margin: 0; }

        /* AM — ON */
        .ds-mantra {
          margin: 0 0 1.6rem; padding: 1.4rem 1rem; text-align: center;
          background: rgba(217, 184, 102, 0.045); border: 1px solid var(--aa-gold-dim);
        }
        .ds-mantraWord {
          font-family: var(--aa-mono); font-weight: 700; font-size: 2.2rem;
          letter-spacing: 0.24em; color: var(--aa-gold-soft); margin: 0 0 0.3rem; line-height: 1;
          text-shadow: 0 0 24px rgba(217, 184, 102, 0.35);
        }
        .ds-mantraDash { color: var(--aa-violet-soft); }
        .ds-mantraLabel {
          font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.24em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0 0 0.9rem;
        }
        .ds-mantraFlow { display: flex; flex-direction: column; align-items: center; gap: 0.1rem; }
        .ds-mantraFlow > span {
          font-family: var(--aa-mono); font-size: 0.62rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-violet-pale);
        }
        .ds-mantraArrow { color: var(--aa-gold-dim) !important; }

        .ds-sub {
          font-family: var(--aa-mono); font-size: 0.62rem; letter-spacing: 0.14em;
          color: var(--aa-text-dim); text-align: center; margin: -0.6rem 0 1.1rem;
        }
        .ds-canvas {
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
          padding: 0.9rem 0.4rem; margin: 0 0 1.1rem;
        }
        .ds-svg { display: block; width: 100%; max-width: 300px; height: auto; margin: 0 auto; }
        .ds-grid { font-family: var(--aa-mono); font-size: 5.5px; letter-spacing: 0.12em; fill: var(--aa-text-dim); }
        .ds-node { cursor: pointer; }
        .ds-node circle { transition: fill 220ms ease, r 220ms ease; }
        .ds-mayor { filter: drop-shadow(0 0 8px rgba(217, 184, 102, 0.7)); }
        .ds-halo { animation: dsHalo 2.6s ease-in-out infinite; transform-origin: center; }
        @keyframes dsHalo { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.9; } }

        /* Ficha profunda */
        .ds-card {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-gold); padding: 1.15rem 1.2rem; margin: 0 0 0.9rem;
          animation: dsIn 420ms ease both;
        }
        @keyframes dsIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .ds-cardHead { display: flex; align-items: flex-start; gap: 0.8rem; margin: 0 0 1rem; }
        .ds-cardIdx { font-family: var(--aa-mono); font-size: 0.7rem; color: var(--aa-text-dim); padding-top: 0.25rem; }
        .ds-cardDisc {
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.05rem;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--aa-gold-soft);
          margin: 0 0 0.15rem; display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;
        }
        .ds-cardTag {
          font-family: var(--aa-mono); font-weight: 400; font-size: 0.52rem;
          letter-spacing: 0.16em; text-transform: uppercase; color: var(--aa-gold);
          border: 1px solid var(--aa-gold-dim); padding: 0.2rem 0.45rem;
          border-radius: 999px !important;
        }
        .ds-cardPlace {
          font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--aa-text-dim); margin: 0;
        }
        .ds-fLabel {
          font-family: var(--aa-mono); font-size: 0.56rem; letter-spacing: 0.22em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0 0 0.45rem;
          padding-top: 0.55rem; border-top: 1px solid var(--aa-line);
        }
        .ds-works { display: flex; flex-wrap: wrap; gap: 0.32rem; margin: 0 0 0.6rem; }
        .ds-work {
          font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.06em;
          color: #cbb9e6; background: var(--aa-violet-ghost);
          border: 1px solid var(--aa-violet-deep); padding: 0.26rem 0.55rem;
          border-radius: 999px !important;
        }
        .ds-move { display: flex; flex-wrap: wrap; align-items: center; gap: 0.15rem; margin: 0 0 0.6rem; }
        .ds-moveItem { display: inline-flex; align-items: center; gap: 0.15rem; }
        .ds-moveArrow { font-family: var(--aa-mono); font-size: 0.7rem; color: var(--aa-gold-dim); }
        .ds-moveNode {
          font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.1em;
          color: var(--aa-gold-soft); padding: 0.22rem 0.35rem;
        }
        .ds-conn { font-size: 0.93rem; line-height: 1.6; color: var(--aa-text); margin: 0 0 0.6rem; }
        .ds-clave {
          font-family: var(--aa-eb-garamond), Georgia, serif; font-style: italic;
          font-size: 1.02rem; line-height: 1.55; color: var(--aa-gold-soft); margin: 0;
          padding-left: 0.8rem; border-left: 1px solid var(--aa-gold-dim);
        }

        .ds-list { display: grid; grid-template-columns: 1fr 1fr; gap: 0.3rem; margin: 0 0 1.6rem; }
        .ds-list button {
          display: flex; align-items: baseline; gap: 0.4rem; text-align: left;
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          padding: 0.42rem 0.55rem; cursor: pointer;
          transition: border-color 200ms ease;
        }
        .ds-list button.is-main { border-left: 2px solid var(--aa-gold-dim); }
        .ds-list button.is-on { border-color: var(--aa-gold-dim); background: #0d0d16; }
        .ds-listIdx { font-family: var(--aa-mono); font-size: 0.52rem; color: var(--aa-text-dim); }
        .ds-listName {
          font-family: var(--aa-mono); font-size: 0.62rem; letter-spacing: 0.1em;
          color: var(--aa-gold-soft);
        }
        .ds-listPlace { font-size: 0.62rem; color: var(--aa-text-dim); margin-left: auto; }

        .ds-close {
          margin: 0 0 1.6rem; padding: 1.3rem 1rem; text-align: center;
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-top: 2px solid var(--aa-gold-dim);
        }
        .ds-closeFormula {
          font-family: var(--aa-mono); font-weight: 700; font-size: 0.86rem;
          letter-spacing: 0.1em; color: var(--aa-gold-soft); margin: 0 0 0.8rem;
        }
        .ds-closeClaim {
          font-family: var(--aa-mono); font-size: 0.72rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0 0 0.6rem;
        }
        .ds-closeText { font-size: 0.94rem; line-height: 1.62; color: var(--aa-text); margin: 0; }

        .ds-axis {
          display: flex; flex-direction: column; align-items: center; gap: 0.2rem;
          margin: 0 0 1.7rem; padding: 1.3rem 1rem;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim); border-bottom: 1px solid var(--aa-gold-dim);
        }
        .ds-axisItem { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
        .ds-axisArrow { font-family: var(--aa-mono); font-size: 0.9rem; color: var(--aa-gold-dim); }
        .ds-axisNode {
          font-family: var(--aa-mono); font-size: 0.7rem; letter-spacing: 0.16em;
          color: var(--aa-violet-pale);
        }
        .ds-axisNode.is-gold {
          color: var(--aa-gold-soft); font-weight: 700;
          text-shadow: 0 0 14px rgba(217, 184, 102, 0.3);
        }

        @media (max-width: 560px) {
          .ds-list { grid-template-columns: 1fr; }
          .ds-listPlace { display: none; }
          .ds-mantraWord { font-size: 1.8rem; }
          .ds-archSide { font-size: 1.1rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ds-card { animation: none !important; }
          .ds-halo { animation: none !important; opacity: 0.7 !important; }
          .ds-node circle { transition: none !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
