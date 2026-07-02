'use client';

// Aviso iniciático — "compuerta" antes del contenido del Episodio 2.
// Estética de los bloques del ep2: fondo oscuro, dorado, cósmico, bordes finos.
// Usa las fuentes ya cargadas en app/layout.tsx (--font-marcellus / -eb-garamond
// / -space-mono) con fallbacks. Sin <Reveal> (divs planos) para que styled-jsx
// aplique los estilos sin problemas de scoping.

export default function AvisoIniciatico({ onContinue }: { onContinue?: () => void }) {
  return (
    <div className="av-stage">
      <div className="av-content">
        <p className="av-kicker">✦ ANTES DE CONTINUAR TU VIAJE ✦</p>

        <div className="av-block">
          <span className="corner-tr" />
          <span className="corner-bl" />
          <div className="av-head">
            <span className="av-num">1</span>
            <h3 className="av-subtitle">Avanza con calma y permítete integrar.</h3>
          </div>
          <p>Este recorrido no fue diseñado para completarlo rápidamente.</p>
          <p>
            Cada episodio contiene enseñanzas, ejercicios y experiencias que buscan despertar
            recuerdos, comprensiones y nuevas preguntas dentro de ti. Algunas ideas las
            comprenderás de inmediato y otras continuarán revelándose con el paso de los días.
          </p>
          <p>
            Date el tiempo necesario. Escucha nuevamente un capítulo si así lo sientes. Toma
            notas. Reflexiona. Observa cómo cada enseñanza dialoga con tu propia vida.
          </p>
          <p>La conciencia se expande cuando el conocimiento se convierte en experiencia.</p>
          <p>Cuando sientas que has integrado lo aprendido, continúa con el siguiente episodio.</p>
        </div>

        <div className="av-sep">✦</div>

        <div className="av-block">
          <span className="corner-tr" />
          <span className="corner-bl" />
          <div className="av-head">
            <span className="av-num">2</span>
            <h3 className="av-subtitle">Realiza las meditaciones y activaciones.</h3>
          </div>
          <p>
            A lo largo de este viaje encontrarás meditaciones, ejercicios y activaciones de
            conciencia especialmente diseñados para acompañar tu proceso de recordación.
          </p>
          <p>Te invito a vivir cada uno de ellos.</p>
          <p>La información organiza la mente, pero la experiencia transforma la conciencia.</p>
          <p>
            Muchas de las respuestas que estás buscando surgirán en los momentos de silencio,
            durante una meditación, en una reflexión inesperada o en la profundidad de una
            experiencia interior.
          </p>
          <p>Permítete vivir este proceso con presencia, paciencia y constancia.</p>
          <p>
            No conviertas este viaje en una carrera. Convierte este viaje en una experiencia de
            transformación.
          </p>
        </div>

        <div className="av-closing">
          <p className="av-closing-title">✦ CONFÍA EN TU PROPIO RITMO ✦</p>
          <p>Cada conciencia recuerda a su propio tiempo.</p>
          <p>Cada alma tiene una manera única de recorrer el camino de la recordación.</p>
          <p>
            Permítete sentir. Permítete descubrir. Permítete cambiar. Y, sobre todo, permítete
            recordar.
          </p>
          <p className="av-sign">
            Con cariño,
            <br />
            José
            <span>@ufocamping ✨</span>
          </p>
        </div>

        <button type="button" className="av-cta" onClick={onContinue}>
          Continuar al Episodio 2
        </button>
      </div>

      <style jsx>{`
        .av-stage {
          position: relative;
          background:
            radial-gradient(ellipse at 50% -10%, #221c3a 0%, transparent 55%), #07070a;
          overflow: hidden;
          padding: 3rem 0 3.5rem;
        }
        .av-content {
          position: relative;
          z-index: 1;
          max-width: 720px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        .av-kicker {
          text-align: center;
          font-family: var(--font-space-mono, 'Courier New'), monospace;
          font-size: 0.8rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #6D4A9B;
          margin: 0 0 2.2rem;
        }
        .av-block {
          position: relative;
          background: #0e0f18;
          border: 1px solid #1b1c2a;
          padding: 2.2rem 1.8rem;
          margin-bottom: 2rem;
          font-family: var(--font-eb-garamond, Georgia), serif;
          color: #e8e3d5;
        }
        .av-block p {
          font-size: 1.06rem;
          line-height: 1.75;
          margin: 0 0 1rem;
        }
        .av-block p:last-child {
          margin-bottom: 0;
        }
        .corner-tr,
        .corner-bl {
          position: absolute;
          width: 14px;
          height: 14px;
          border: 1px solid #4A3170;
        }
        .corner-tr {
          top: -1px;
          right: -1px;
          border-left: none;
          border-bottom: none;
        }
        .corner-bl {
          bottom: -1px;
          left: -1px;
          border-right: none;
          border-top: none;
        }
        .av-head {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          margin-bottom: 1.1rem;
        }
        .av-num {
          flex: 0 0 auto;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #4A3170;
          background: rgba(109, 74, 155, 0.08);
          color: #6D4A9B;
          font-family: var(--font-space-mono, 'Courier New'), monospace;
          font-size: 0.95rem;
          font-weight: 700;
        }
        .av-subtitle {
          margin: 0;
          font-family: var(--font-space-mono, 'Courier New'), monospace;
          font-size: 0.82rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #e8e3d5;
          line-height: 1.4;
        }
        .av-sep {
          text-align: center;
          color: #4A3170;
          font-size: 0.9rem;
          margin: 0 0 2rem;
        }
        .av-closing {
          text-align: center;
          font-family: var(--font-eb-garamond, Georgia), serif;
          color: #cfc9ba;
          margin-top: 0.5rem;
        }
        .av-closing p {
          font-size: 1.06rem;
          line-height: 1.75;
          margin: 0 0 0.9rem;
        }
        .av-closing-title {
          font-family: var(--font-space-mono, 'Courier New'), monospace;
          font-size: 0.85rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #6D4A9B;
          margin: 0 0 1.4rem;
        }
        .av-sign {
          font-style: italic;
          color: #9a9484;
          margin-top: 1.6rem;
        }
        .av-sign span {
          display: block;
          font-style: normal;
          font-family: var(--font-space-mono, 'Courier New'), monospace;
          font-size: 0.7rem;
          letter-spacing: 0.18em;
          color: #4A3170;
          margin-top: 0.5rem;
        }
        .av-cta {
          display: block;
          margin: 2.6rem auto 0;
          padding: 0.95rem 2.4rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-family: var(--font-space-mono, 'Courier New'), monospace;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #F3F6FA;
          background: linear-gradient(180deg, #8a63b8 0%, #6D4A9B 100%);
          box-shadow: 0 8px 28px -10px rgba(109, 74, 155, 0.6);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .av-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 32px -8px rgba(109, 74, 155, 0.7);
        }
        .av-cta:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
