'use client';

// TEMPORADA 2 · EPISODIO 4 — JERARQUÍA GALÁCTICA
//
// No es una pirámide de rangos: es un mapa de FUNCIONES y responsabilidad.
// La Fuente queda deliberadamente FUERA del organigrama (origen, no cargo).
// Los dos consejos se muestran EN PARALELO —ninguno encima del otro—: son
// estructuras distintas, con ámbitos propios, que no se suman entre sí.

import { useState } from 'react';
import ArchivoShell, { Reveal, KeyBox, ModuleTitle } from './ArchivoShell';

// Nombres de los consejos. Se muestran como estructura colectiva: no se
// asignan funciones individuales, porque el material no las establece.
const ANCIANOS_24 = [
  'Amchall', 'Ankalara', 'Anko Bal', 'Archer', 'Asaraniel', 'Bropkol',
  'Chermot', 'Gresidas', 'Ilrusi', 'Ilsalani', 'Inmalam', 'Kimrasi',
  'Lembo', 'Lubieses', 'Oxil Kem', 'Preto', 'Ramanes', 'Sorcet',
  'Ulkuyumi', 'Umi Tamil', 'Urlasa', 'Yansiremo', 'Yemiasa', 'Yesolma',
];

const NUEVE = [
  'Alcim', 'Gonamar', 'Leteon', 'Olmax', 'Oracel',
  'Ralbot', 'Sagñac', 'Sullantes', 'Sumesla',
];

const MORLEN_12 = [
  'Joaquín', 'Soloviar', 'Omiton', 'Seneral', 'Asint', 'Jrovel',
  'Anur', 'Anumi', 'Oxmuz', 'Irimon', 'Onirin', 'Leron',
];

const FUNCIONES: { titulo: string; texto: string }[] = [
  { titulo: 'Mayores / Mentores', texto: 'Campo de orientación de alta consciencia.' },
  { titulo: 'Sembradores / Ingenieros', texto: 'Diseño y establecimiento de condiciones para procesos de vida.' },
  { titulo: 'Guardianes / Vigilantes', texto: 'Seguimiento, protección y observación.' },
  { titulo: 'Instructores / Guías', texto: 'Acompañamiento, enseñanza y contacto.' },
];

export default function MapaJerarquia() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <ArchivoShell
      lead="Jerarquía significa organización de funciones. A medida que una consciencia puede percibir y sostener estructuras mayores, también aumenta la responsabilidad de sus decisiones sobre aquello que acompaña."
      registro="La verdadera jerarquía aumenta responsabilidad mucho antes que privilegio."
    >
      <ModuleTitle>Mapa de responsabilidad cósmica</ModuleTitle>

      <div className="jg-map">
        {/* Origen — fuera del organigrama */}
        <div className="jg-origin">
          <span className="jg-originDot" aria-hidden />
          <p className="jg-originName">Fuente / Profundo</p>
          <p className="jg-originTag">Origen — no es un cargo dentro de la estructura</p>
        </div>

        <span className="jg-drop" aria-hidden />

        {/* Dos consejos en paralelo */}
        <div className="jg-councils">
          <div className="jg-council">
            <p className="jg-councilNum">24</p>
            <p className="jg-councilName">Ancianos de la galaxia</p>
            <p className="jg-councilField">Ámbito · Vía Láctea</p>
            <p className="jg-councilFn">Consejo de la Confederación de Mundos</p>
          </div>
          <div className="jg-councilLink" aria-hidden>
            <span />
          </div>
          <div className="jg-council">
            <p className="jg-councilNum">9</p>
            <p className="jg-councilName">Consejo de los Nueve</p>
            <p className="jg-councilField">Ámbito · Andrómeda / Grupo Local</p>
            <p className="jg-councilFn">Coordinación de estructuras galácticas mayores</p>
          </div>
        </div>

        <p className="jg-councilsNote">
          Son consejos diferentes, con ámbitos y funciones propias. No se suman ni se subordinan entre sí.
        </p>

        <span className="jg-drop" aria-hidden />

        {/* Confederación */}
        <div className="jg-conf">
          <p className="jg-confName">Confederación de Mundos</p>
          <p className="jg-confText">Red de planetas y civilizaciones conscientes.</p>
        </div>

        <span className="jg-drop" aria-hidden />

        {/* Funciones */}
        <div className="jg-funcs">
          {FUNCIONES.map((f, i) => {
            const on = open === i;
            return (
              <button
                key={i}
                type="button"
                className={`jg-func ${on ? 'is-on' : ''}`}
                onClick={() => setOpen(on ? null : i)}
                aria-expanded={on}
              >
                <span className="jg-funcIdx">{String(i + 1).padStart(2, '0')}</span>
                <span className="jg-funcTitle">{f.titulo}</span>
                {on && <span className="jg-funcText">{f.texto}</span>}
              </button>
            );
          })}
        </div>

        <span className="jg-drop" aria-hidden />

        <div className="jg-worlds">
          <p className="jg-worldsName">Mundos en evolución</p>
          <p className="jg-worldsText">Civilizaciones desarrollando consciencia y autonomía.</p>
        </div>

        {/* Escala lateral */}
        <div className="jg-scale" aria-label="Escala de responsabilidad">
          <span className="jg-scaleArrow" aria-hidden>↑</span>
          <span className="jg-scaleItem">Percepción</span>
          <span className="jg-scaleArrow" aria-hidden>↑</span>
          <span className="jg-scaleItem">Responsabilidad</span>
          <span className="jg-scaleArrow" aria-hidden>↑</span>
          <span className="jg-scaleItem">Servicio</span>
        </div>
      </div>

      {/* Composición de los consejos */}
      <Reveal>
        <ModuleTitle>Composición de los consejos</ModuleTitle>

        <details className="jg-roster">
          <summary>
            <span className="jg-rosterNum">24</span>
            <span className="jg-rosterName">Ancianos de la Galaxia</span>
            <span className="jg-rosterScope">Consejo de la Confederación</span>
          </summary>
          <div className="jg-names">
            {ANCIANOS_24.map((nm, i) => (
              <span key={nm} className="jg-name">
                <i>{String(i + 1).padStart(2, '0')}</i>
                {nm}
              </span>
            ))}
          </div>
        </details>

        <details className="jg-roster">
          <summary>
            <span className="jg-rosterNum">9</span>
            <span className="jg-rosterName">Consejo de los Nueve</span>
            <span className="jg-rosterScope">Andrómeda / Grupo Local</span>
          </summary>
          <p className="jg-rosterText">
            Coordina una escala superior, vinculada con las nueve galaxias del Universo Local.
          </p>
          <div className="jg-nine">
            {NUEVE.map((nm, i) => {
              const a = (Math.PI / 180) * (i * 40 - 90);
              return (
                <span key={nm} className="jg-nineNode" style={{ left: `${50 + 38 * Math.cos(a)}%`, top: `${50 + 38 * Math.sin(a)}%` }}>
                  {nm}
                </span>
              );
            })}
            <span className="jg-nineCore" aria-hidden>9</span>
          </div>
        </details>

        <details className="jg-roster is-local">
          <summary>
            <span className="jg-rosterNum">12</span>
            <span className="jg-rosterName">Menores de Morlen</span>
            <span className="jg-rosterScope">Consejo local</span>
          </summary>
          <p className="jg-rosterText">
            Coordinación vinculada con la evolución de la colonia de Morlen.
          </p>
          <div className="jg-names">
            {MORLEN_12.map((nm, i) => (
              <span key={nm} className="jg-name">
                <i>{String(i + 1).padStart(2, '0')}</i>
                {nm}
              </span>
            ))}
          </div>
        </details>
      </Reveal>

      <Reveal>
        <KeyBox
          title="Equivalencia"
          formula={
            <>
              MAYOR CAMPO DE CONSCIENCIA
              <br />
              <span className="op">=</span>
              <br />
              MAYOR CAMPO DE RESPONSABILIDAD
            </>
          }
        />
      </Reveal>

      <Reveal>
        <div className="jg-negation">
          <div className="jg-negRow">
            <span className="jg-negK">JERARQUÍA</span>
            <span className="jg-negOp is-no">≠</span>
            <span className="jg-negV is-no">VALOR DEL SER</span>
          </div>
          <div className="jg-negRow">
            <span className="jg-negK">JERARQUÍA</span>
            <span className="jg-negOp">=</span>
            <span className="jg-negV">FUNCIÓN DENTRO DEL SISTEMA</span>
          </div>
        </div>
      </Reveal>

      <style jsx global>{`
        .jg-map {
          position: relative;
          margin: 0 0 1.8rem; padding: 1.4rem 1rem;
          background: var(--aa-inner);
          border-top: 1px solid var(--aa-gold-dim);
          border-bottom: 1px solid var(--aa-gold-dim);
        }
        .jg-drop { display: block; width: 1px; height: 18px; margin: 0.5rem auto; background: var(--aa-gold-dim); }

        .jg-origin { text-align: center; padding: 0.4rem 0 0.6rem; }
        .jg-originDot {
          display: block; width: 9px; height: 9px; margin: 0 auto 0.6rem;
          background: var(--aa-gold-soft); border-radius: 999px !important;
          box-shadow: 0 0 14px rgba(217, 184, 102, 0.6);
        }
        .jg-originName {
          font-family: var(--aa-mono); font-size: 0.8rem; letter-spacing: 0.22em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0 0 0.3rem;
        }
        .jg-originTag { font-family: var(--aa-mono); font-size: 0.6rem; letter-spacing: 0.1em; color: var(--aa-text-dim); margin: 0; }

        .jg-councils { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 0.5rem; }
        .jg-council {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-top: 2px solid var(--aa-violet-deep); padding: 0.9rem 0.85rem; text-align: center;
        }
        .jg-councilNum {
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.6rem;
          color: var(--aa-gold-soft); margin: 0 0 0.25rem; line-height: 1;
        }
        .jg-councilName {
          font-family: var(--aa-mono); font-size: 0.68rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--aa-gold); margin: 0 0 0.45rem;
        }
        .jg-councilField {
          font-family: var(--aa-mono); font-size: 0.58rem; letter-spacing: 0.12em;
          color: var(--aa-text-dim); margin: 0 0 0.35rem;
        }
        .jg-councilFn { font-size: 0.86rem; line-height: 1.45; color: var(--aa-text); margin: 0; }
        .jg-councilLink { display: flex; align-items: center; justify-content: center; }
        .jg-councilLink span { display: block; width: 26px; height: 1px; background: var(--aa-gold-dim); }


        .jg-councilsNote {
          font-size: 0.86rem; line-height: 1.5; color: var(--aa-text-dim);
          text-align: center; margin: 0.9rem 0 0;
        }

        /* Consejos desplegables — la lista completa sin saturar el mapa. */
        .jg-roster {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-gold-dim); margin: 0 0 0.5rem;
        }
        .jg-roster.is-local { border-left-color: var(--aa-violet-deep); }
        .jg-roster summary {
          display: flex; align-items: baseline; gap: 0.7rem; flex-wrap: wrap;
          padding: 0.75rem 0.9rem; cursor: pointer; list-style: none;
        }
        .jg-roster summary::-webkit-details-marker { display: none; }
        .jg-rosterNum {
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.25rem;
          color: var(--aa-gold-soft); line-height: 1;
        }
        .jg-rosterName {
          font-family: var(--aa-mono); font-size: 0.72rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--aa-gold);
        }
        .jg-rosterScope {
          font-family: var(--aa-mono); font-size: 0.56rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--aa-text-dim); margin-left: auto;
        }
        .jg-rosterText {
          font-size: 0.9rem; line-height: 1.55; color: var(--aa-text);
          margin: 0 0 0.7rem; padding: 0 0.9rem;
        }
        .jg-names {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.3rem;
          padding: 0 0.9rem 0.9rem;
        }
        .jg-name {
          display: flex; align-items: baseline; gap: 0.35rem;
          font-family: var(--aa-mono); font-size: 0.62rem; letter-spacing: 0.06em;
          color: var(--aa-violet-pale);
        }
        .jg-name i { font-style: normal; font-size: 0.5rem; color: var(--aa-text-dim); }

        /* Los Nueve, dispuestos como nodos alrededor de un centro. */
        .jg-nine {
          position: relative; width: 100%; max-width: 280px; aspect-ratio: 1;
          margin: 0 auto 0.9rem;
        }
        .jg-nineNode {
          position: absolute; transform: translate(-50%, -50%);
          font-family: var(--aa-mono); font-size: 0.58rem; letter-spacing: 0.08em;
          color: var(--aa-gold-soft); border: 1px solid var(--aa-gold-dim);
          background: var(--aa-inner); padding: 0.26rem 0.45rem;
          border-radius: 999px !important; white-space: nowrap;
        }
        .jg-nineCore {
          position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
          font-family: var(--aa-mono); font-weight: 700; font-size: 1.6rem;
          color: var(--aa-gold); opacity: 0.55;
        }

        .jg-conf, .jg-worlds {
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          border-left: 2px solid var(--aa-gold-dim); padding: 0.85rem 0.95rem; text-align: center;
        }
        .jg-confName, .jg-worldsName {
          font-family: var(--aa-mono); font-size: 0.74rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--aa-gold-soft); margin: 0 0 0.35rem;
        }
        .jg-worlds { border-left-color: var(--aa-violet-deep); }
        .jg-worldsName { color: var(--aa-violet-pale); }
        .jg-confText, .jg-worldsText { font-size: 0.9rem; line-height: 1.5; color: var(--aa-text); margin: 0; }

        .jg-funcs { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        .jg-func {
          display: flex; flex-direction: column; gap: 0.3rem; text-align: left;
          background: var(--aa-inner-2); border: 1px solid var(--aa-line);
          padding: 0.7rem 0.8rem; cursor: pointer;
          transition: border-color 200ms ease, background 200ms ease;
        }
        .jg-func.is-on { border-color: var(--aa-gold-dim); background: #0d0d16; }
        .jg-funcIdx { font-family: var(--aa-mono); font-size: 0.58rem; color: var(--aa-text-dim); }
        .jg-funcTitle {
          font-family: var(--aa-mono); font-size: 0.68rem; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--aa-gold-soft); line-height: 1.35;
        }
        .jg-funcText { font-size: 0.86rem; line-height: 1.5; color: var(--aa-text); animation: jgIn 320ms ease both; }
        @keyframes jgIn { from { opacity: 0; } to { opacity: 1; } }

        .jg-scale {
          display: flex; align-items: center; justify-content: center;
          flex-wrap: wrap; gap: 0.5rem; margin-top: 1.3rem;
          padding-top: 1rem; border-top: 1px solid var(--aa-line);
        }
        .jg-scaleItem {
          font-family: var(--aa-mono); font-size: 0.64rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--aa-violet-pale);
        }
        .jg-scaleArrow { font-family: var(--aa-mono); font-size: 0.8rem; color: var(--aa-gold-dim); }

        .jg-negation {
          margin: 0 0 1.8rem; padding: 1.2rem 1rem;
          border-top: 1px solid var(--aa-line); border-bottom: 1px solid var(--aa-line);
          display: flex; flex-direction: column; gap: 0.75rem;
        }
        .jg-negRow {
          display: flex; align-items: center; justify-content: center; gap: 0.7rem;
          font-family: var(--aa-mono); font-size: 0.72rem; letter-spacing: 0.14em; flex-wrap: wrap;
        }
        .jg-negK { color: var(--aa-gold-soft); }
        .jg-negOp { color: var(--aa-violet-soft); font-size: 0.95rem; }
        .jg-negOp.is-no { color: #7c8088; }
        .jg-negV { color: var(--aa-violet-pale); }
        .jg-negV.is-no { color: var(--aa-text-dim); text-decoration: line-through; text-decoration-color: rgba(124,128,136,0.5); }

        @media (max-width: 560px) {
          .jg-map { padding: 1.1rem 0.7rem; }
          .jg-councils { grid-template-columns: 1fr; gap: 0.7rem; }
          .jg-councilLink span { width: 1px; height: 18px; margin: 0 auto; }
          .jg-funcs { grid-template-columns: 1fr; }
          .jg-names { grid-template-columns: repeat(2, 1fr); }
          .jg-rosterScope { margin-left: 0; width: 100%; }
          .jg-nineNode { font-size: 0.5rem; padding: 0.2rem 0.32rem; }
          .jg-negRow { flex-direction: column; gap: 0.15rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .jg-funcText { animation: none !important; }
          .jg-func { transition: none !important; }
        }
      `}</style>
    </ArchivoShell>
  );
}
