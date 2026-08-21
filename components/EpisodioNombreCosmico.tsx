'use client';

// Capítulo 5 · Temporada 1 — "El Nombre que Olvidaste" (El Nombre Cósmico).
//
// Reutiliza EXACTAMENTE el sistema visual del Capítulo 2 (components/EpisodioBloque):
// mismas fuentes (Marcellus / EB Garamond / Space Mono), mismas tarjetas
// (#0e0f18 + borde #1b1c2a), esquinas moradas (#4A3170), eyebrows en Space Mono
// (#6D4A9B), panel tipo "ecuación", lista "decode" y cierre "registro" en
// itálica. El fondo va transparente para que se vea el starfield unificado.
//
// El contenido es propio de este episodio y complementa el video (no lo repite).

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Marcellus, EB_Garamond, Space_Mono } from 'next/font/google';

const marcellus  = Marcellus({ subsets: ['latin'], weight: '400', variable: '--nc-marcellus' });
const ebGaramond = EB_Garamond({ subsets: ['latin'], weight: ['400', '500'], style: ['normal', 'italic'], variable: '--nc-eb-garamond' });
const spaceMono  = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--nc-space-mono' });

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVisible(true); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setVisible(true); io.unobserve(node); } });
    }, { threshold: 0.15 });
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`${className} nc-reveal ${visible ? 'is-visible' : ''}`}>{children}</div>;
}

export default function EpisodioNombreCosmico() {
  const [practiceOpen, setPracticeOpen] = useState(false);
  const fontVars = `${marcellus.variable} ${ebGaramond.variable} ${spaceMono.variable}`;

  return (
    <div className={`nc-stage ${fontVars}`}>
      <div className="nc-content">

        {/* ── Bloque 1: transmisión de apertura ───────────────────── */}
        <Reveal className="nc-block">
          <span className="corner-tr" /><span className="corner-bl" />
          <p className="block-eyebrow">Sergel <span className="voice">— Transmisión abierta</span></p>

          <p className="nc-lead">Antes de tener un nombre humano, tu conciencia ya emitía una vibración.</p>

          <p>El Nombre Cósmico es la frecuencia original del alma. Una clave íntima que guarda memoria de origen, dirección espiritual y propósito. Al recordarlo, la conciencia vuelve a escuchar la nota profunda con la que fue individualizada dentro de la Creación.</p>
          <p>Esa vibración te acompaña desde antes de esta vida. Vive por debajo de tu historia, sostiene tu identidad más honda y ordena en silencio aquello que viniste a cumplir.</p>

          <div className="equation-panel">
            <div className="equation">
              MEMORIA<span className="op">×</span>PRESENCIA<span className="op">=</span>NOMBRE
            </div>
            <p className="equation-caption">Clave vibracional del alma</p>
          </div>
        </Reveal>

        {/* ── Bloque 2: la clave y sus dos vibraciones ────────────── */}
        <Reveal className="nc-block">
          <span className="corner-tr" /><span className="corner-bl" />
          <p className="block-eyebrow">La clave <span className="voice">— y sus dos vibraciones</span></p>

          <p>El Nombre Cósmico es personal e intransferible. Ninguna otra conciencia vibra exactamente en tu misma nota; por eso se recuerda desde dentro y madura contigo a lo largo del camino.</p>
          <p>En la travesía del alma, esta clave se despliega en dos vibraciones que se sostienen entre sí.</p>

          <div className="decode">
            <dl>
              <div className="decode-row">
                <dt>Primera vibración</dt>
                <dd>Corresponde al instante en que tu alma se individualiza dentro de la Creación. Es el tono raíz: la marca original con la que te distinguiste de la totalidad para iniciar tu viaje.</dd>
              </div>
              <div className="decode-row">
                <dt>Segunda vibración</dt>
                <dd>Se forma con el despertar espiritual que maduras a través de tus encarnaciones. Es el tono conquistado: la frecuencia que tu conciencia afina a medida que recuerda, elige y sirve.</dd>
              </div>
            </dl>
          </div>
        </Reveal>

        {/* ── Bloque 3: cómo llega y cómo se afina ────────────────── */}
        <Reveal className="nc-block">
          <span className="corner-tr" /><span className="corner-bl" />
          <p className="block-eyebrow">Cómo llega <span className="voice">— y cómo se afina</span></p>

          <p>El Nombre Cósmico se revela cuando la conciencia se aquieta. Llega en la meditación, en los sueños, en el silencio interior, en la intuición, en símbolos, en sonidos y en experiencias de contacto. Emerge cuando dejas de perseguirlo con la mente y comienzas a escucharlo con la presencia.</p>
          <p>Su práctica es sencilla y profunda. Al pronunciarlo desde la coherencia, actúa como un diapasón interior: cada repetición alinea tu conciencia con su frecuencia original, y lo disperso vuelve a ordenarse.</p>

          <div className="decode">
            <dl>
              <div className="decode-row">
                <dt>Recordar</dt>
                <dd>Trae el sonido a la memoria sin forzarlo. Deja que emerja del silencio, tal como reconoces algo que siempre estuvo contigo.</dd>
              </div>
              <div className="decode-row">
                <dt>Vocalizar</dt>
                <dd>Pronúncialo desde el centro del pecho, lento y sostenido. La voz se vuelve puente entre la memoria y el cuerpo.</dd>
              </div>
              <div className="decode-row">
                <dt>Afinar</dt>
                <dd>Permanece en la vibración. La conciencia se sintoniza con su nota de origen y el resto de ti se acomoda alrededor de ella.</dd>
              </div>
            </dl>
          </div>
        </Reveal>

        {/* ── Bloque 4: responsabilidad, propósito y servicio ─────── */}
        <Reveal className="nc-block">
          <span className="corner-tr" /><span className="corner-bl" />
          <p className="block-eyebrow">Responsabilidad <span className="voice">— propósito y servicio</span></p>

          <p>El Nombre Cósmico es una llave interior. La llave abre; el camino se recorre con voluntad, constancia, humildad y servicio. Recordarlo une identidad, memoria, propósito y servicio en una sola dirección.</p>
          <p>Al reconocer tu frecuencia, se abre una responsabilidad mayor con tu propio camino y con la vida que te rodea. La clave despierta a quien está dispuesto a sostenerla.</p>

          <div className="registro">
            <p className="registro-label">Registro de Sergel</p>
            <p className="registro-text">Quien recuerda su nombre deja de vivir a la deriva. La frecuencia que fuiste vuelve a sonar, y tu presencia comienza a servir a la totalidad de la que nunca te separaste.</p>
          </div>

          {/* Botón principal + práctica guiada (se revela sin salir de la página). */}
          <div className="nc-cta-wrap">
            <button
              type="button"
              className="nc-cta"
              aria-expanded={practiceOpen}
              onClick={() => setPracticeOpen((v) => !v)}
            >
              {practiceOpen ? 'Cerrar práctica' : 'Iniciar práctica del Nombre Cósmico'}
            </button>
          </div>

          {practiceOpen && (
            <div className="nc-practice">
              <p className="block-eyebrow">La práctica <span className="voice">— del Nombre Cósmico</span></p>
              <p>Abre un espacio interior para escuchar la vibración profunda de tu alma y permitir que el recuerdo de tu nombre comience a despertar desde el silencio.</p>
              <div className="decode">
                <dl>
                  <div className="decode-row"><dt>01</dt><dd>Respira hondo tres veces y suelta el ritmo del día. Deja que el silencio se haga espacio.</dd></div>
                  <div className="decode-row"><dt>02</dt><dd>Lleva la atención al centro del pecho y permite que emerja un sonido, una sílaba o una sensación. Reconócelo sin forzarlo.</dd></div>
                  <div className="decode-row"><dt>03</dt><dd>Repítelo con presencia. Cada repetición te afina; deja que su vibración ordene lo que en ti estaba disperso.</dd></div>
                </dl>
              </div>
            </div>
          )}
        </Reveal>

      </div>

      <style jsx>{`
        /* Mismos tokens visuales que components/EpisodioBloque (Capítulo 2). */
        .nc-stage {
          position: relative;
          background: transparent; /* se ve el starfield unificado detrás */
          overflow: hidden; padding: 4rem 0;
        }
        .nc-content {
          position: relative; z-index: 1;
          max-width: 720px; margin: 0 auto; padding: 0 1.5rem;
        }
        :global(.nc-reveal) {
          opacity: 0; transform: translateY(16px);
          transition: opacity 0.9s ease, transform 0.9s ease;
        }
        :global(.nc-reveal.is-visible) { opacity: 1; transform: translateY(0); }

        :global(.nc-block) {
          position: relative; background: #0e0f18; border: 1px solid #1b1c2a;
          padding: 2.2rem 1.8rem; margin-bottom: 3rem;
          font-family: var(--nc-eb-garamond), Georgia, serif;
          color: #e8e3d5;
        }
        :global(.nc-block p) { font-size: 1.08rem; line-height: 1.75; margin: 0 0 1rem; }
        :global(.nc-block p:last-child) { margin-bottom: 0; }
        :global(.nc-content > .nc-block:last-child) { margin-bottom: 0; }

        :global(.nc-block .nc-lead) {
          font-size: 1.22rem; line-height: 1.7; color: #f0ece0;
          margin-bottom: 1.4rem;
        }

        :global(.nc-block .corner-tr),
        :global(.nc-block .corner-bl) {
          position: absolute; width: 14px; height: 14px; border: 1px solid #4A3170;
        }
        :global(.nc-block .corner-tr) { top:-1px; right:-1px; border-left:none; border-bottom:none; }
        :global(.nc-block .corner-bl) { bottom:-1px; left:-1px; border-right:none; border-top:none; }

        :global(.nc-block .block-eyebrow) {
          font-family: var(--nc-space-mono), 'Courier New', monospace;
          font-size: 0.72rem; letter-spacing: 0.25em; text-transform: uppercase;
          color: #6D4A9B; margin: 0 0 1.1rem;
        }
        :global(.nc-block .voice) { color: #7c8088; letter-spacing: 0.2em; }

        :global(.nc-block .equation-panel) {
          margin: 1.6rem 0 0; padding: 1.6rem 1rem; background: #07070a;
          border-top: 1px solid #4A3170; border-bottom: 1px solid #4A3170; text-align: center;
        }
        :global(.nc-block .equation) {
          font-family: var(--nc-space-mono), 'Courier New', monospace;
          font-weight: 700; font-size: clamp(1.1rem, 4.2vw, 1.6rem);
          letter-spacing: 0.04em; color: #6D4A9B;
        }
        :global(.nc-block .equation .op) { color: #7c8088; margin: 0 0.35em; }
        :global(.nc-block .equation-caption) {
          font-family: var(--nc-space-mono), 'Courier New', monospace;
          font-size: 0.68rem; letter-spacing: 0.2em; color: #7c8088;
          margin-top: 0.8rem; text-transform: uppercase;
        }

        :global(.nc-block .decode) { margin-top: 1.6rem; padding-top: 1.4rem; border-top: 1px solid #1b1c2a; }
        :global(.nc-block .decode-row) { display: grid; grid-template-columns: auto 1fr; gap: 0.55rem 1rem; margin-bottom: 0.9rem; }
        :global(.nc-block .decode-row:last-child) { margin-bottom: 0; }
        :global(.nc-block .decode-row dt) {
          font-family: var(--nc-space-mono), 'Courier New', monospace;
          font-size: 0.9rem; color: #6D4A9B; white-space: nowrap;
        }
        :global(.nc-block .decode-row dd) { margin: 0; font-size: 0.98rem; line-height: 1.6; color: #e8e3d5; }

        :global(.nc-block .registro) {
          margin-top: 1.8rem; padding-top: 1.4rem; border-top: 1px solid #1b1c2a;
        }
        :global(.nc-block .registro-label) {
          font-family: var(--nc-space-mono), 'Courier New', monospace;
          font-size: 0.72rem; letter-spacing: 0.25em; text-transform: uppercase;
          color: #6D4A9B; margin: 0 0 0.9rem;
        }
        :global(.nc-block .registro-text) { font-style: italic; color: #cfc9ba; }

        /* Botón en el mismo lenguaje (Space Mono, borde morado #4A3170). */
        :global(.nc-block .nc-cta-wrap) { margin-top: 1.8rem; padding-top: 1.4rem; border-top: 1px solid #1b1c2a; }
        :global(.nc-block .nc-cta) {
          font-family: var(--nc-space-mono), 'Courier New', monospace;
          font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase;
          color: #cbb9e6; background: rgba(109, 74, 155, 0.08);
          border: 1px solid #4A3170; padding: 0.85rem 1.4rem; cursor: pointer;
          transition: background 0.25s ease, color 0.25s ease, border-color 0.25s ease;
        }
        :global(.nc-block .nc-cta:hover) {
          background: rgba(109, 74, 155, 0.18); color: #f0ece0; border-color: #6D4A9B;
        }

        :global(.nc-block .nc-practice) {
          margin-top: 1.4rem; padding-top: 1.4rem; border-top: 1px solid #1b1c2a;
          animation: nc-fade 0.5s ease;
        }
        @keyframes nc-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 480px) {
          :global(.nc-block .equation) { font-size: 0.82rem; letter-spacing: 0.01em; }
          :global(.nc-block .equation .op) { margin: 0 0.18em; }
          :global(.nc-block .equation-panel) { padding: 1.4rem 0.6rem; }
          :global(.nc-block .nc-cta) { width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.nc-reveal) { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}
