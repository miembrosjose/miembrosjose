'use client';

// Aviso iniciático — "compuerta" antes del contenido del Episodio 2.
// Estética de los bloques del ep2: fondo oscuro, violeta, cósmico, bordes finos.
// Usa las fuentes ya cargadas en app/layout.tsx (--font-eb-garamond / -space-mono).

export default function AvisoIniciatico({ onContinue }: { onContinue?: () => void }) {
  return (
    <div className="av-stage">
      <div className="av-content">
        <p className="av-kicker">✦ ANTES DE CONTINUAR ✦</p>

        <div className="av-block">
          <span className="corner-tr" />
          <span className="corner-bl" />

          <p>Este recorrido no es una carrera.</p>
          <p>
            Tómate el tiempo para integrar cada episodio. Algunas enseñanzas se comprenden al
            escucharlas; otras se revelan después, en silencio, en la práctica o en la vida diaria.
          </p>
          <p>
            Si el episodio incluye meditación, ejercicio o activación, realízalo antes de avanzar.
            La información abre la mente, pero la experiencia transforma la conciencia.
          </p>

          <p className="av-highlight">Confía en tu propio ritmo.</p>

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
          margin: 0 0 2rem;
        }
        .av-block {
          position: relative;
          background: #0e0f18;
          border: 1px solid #1b1c2a;
          padding: 2.4rem 2rem;
          font-family: var(--font-eb-garamond, Georgia), serif;
          color: #e8e3d5;
        }
        .av-block p {
          font-size: 1.08rem;
          line-height: 1.8;
          margin: 0 0 1.2rem;
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
        .av-highlight {
          text-align: center;
          font-family: var(--font-space-mono, 'Courier New'), monospace;
          font-size: 0.85rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #8a63b8;
          margin: 2rem 0 0 !important;
          padding-top: 1.6rem;
          border-top: 1px solid #1b1c2a;
        }
        .av-sign {
          text-align: center;
          font-style: italic;
          color: #9a9484;
          margin-top: 1.8rem !important;
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
