'use client';

// Tarjeta de meditación complementaria — se muestra DEBAJO del archivo de un
// episodio. Dos variantes:
//   - 'free': acceso libre → botón "Reproducir meditación" (reproductor inline).
//   - 'paid': de pago → caja de precio + botón que abre el enlace de compra.
//
// Estructura inspirada en la tarjeta de producto (imagen arriba, título, texto,
// caja de precio, CTA), adaptada a la estética cósmica de la área de miembros.
// Los enlaces (media / compra) llegan como props y se completan cuando el
// creador los envía; sin enlace, el botón queda en estado "Disponible pronto".

import { useState } from 'react';
import { Marcellus, EB_Garamond, Space_Mono } from 'next/font/google';

const marcellus  = Marcellus({ subsets: ['latin'], weight: '400', variable: '--mc-marcellus' });
const ebGaramond = EB_Garamond({ subsets: ['latin'], weight: ['400', '500'], variable: '--mc-eb-garamond' });
const spaceMono  = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--mc-space-mono' });

export type MeditacionData = {
  variant: 'free' | 'paid';
  title: string;
  description: string;
  /** Imagen de portada (URL). Sin imagen se usa un degradado cósmico. */
  image?: string;
  /** Precio para la variante 'paid' (ej. "4.99"). */
  price?: string;
  /** Enlace del audio/video de la meditación (variante 'free' reproduce inline). */
  mediaUrl?: string;
  /** Enlace de compra (Stripe Payment Link) para la variante 'paid'. */
  checkoutUrl?: string;
};

function isAudio(url: string) {
  return /\.(mp3|wav|m4a|aac|ogg|oga|flac)(\?|#|$)/i.test(url);
}

export default function MeditacionCard({ data }: { data: MeditacionData }) {
  const [playing, setPlaying] = useState(false);
  const fontVars = `${marcellus.variable} ${ebGaramond.variable} ${spaceMono.variable}`;
  const isPaid = data.variant === 'paid';

  const coverStyle = data.image
    ? { backgroundImage: `url(${data.image})` }
    : undefined;

  return (
    <div className={`mc-card ${fontVars} ${isPaid ? 'mc-paid' : 'mc-free'}`}>
      <div className={`mc-cover ${data.image ? '' : 'mc-cover--placeholder'}`} style={coverStyle}>
        <span className="mc-badge">{isPaid ? 'Meditación premium' : 'Meditación · Acceso libre'}</span>
        <span className="mc-coverFade" aria-hidden />
      </div>

      <div className="mc-body">
        <p className="mc-kicker">Sergel · Práctica guiada</p>
        <h3 className="mc-title">{data.title}</h3>
        <p className="mc-desc">{data.description}</p>

        {isPaid && (
          <div className="mc-priceBox">
            <span className="mc-price">US$ {data.price ?? '4.99'}</span>
            <span className="mc-priceNote">Acceso permanente</span>
          </div>
        )}

        {/* Reproductor inline (variante gratuita ya reproduciéndose) */}
        {!isPaid && playing && data.mediaUrl && (
          <div className="mc-player">
            {isAudio(data.mediaUrl)
              ? <audio src={data.mediaUrl} controls autoPlay style={{ width: '100%' }} />
              : <video src={data.mediaUrl} controls autoPlay playsInline style={{ width: '100%', display: 'block' }} />}
          </div>
        )}

        {/* CTA */}
        {!isPaid && (
          data.mediaUrl ? (
            !playing && (
              <button type="button" className="mc-cta mc-cta--free" onClick={() => setPlaying(true)}>
                Reproducir meditación
              </button>
            )
          ) : (
            <button type="button" className="mc-cta mc-cta--soon" disabled>
              Disponible pronto
            </button>
          )
        )}

        {isPaid && (
          data.checkoutUrl ? (
            <a
              className="mc-cta mc-cta--paid"
              href={data.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Desbloquear meditación
            </a>
          ) : (
            <button type="button" className="mc-cta mc-cta--soon" disabled>
              Disponible pronto
            </button>
          )
        )}
      </div>

      <style jsx>{`
        .mc-card {
          background: #0d0d15; border: 1px solid #1b1c2a; overflow: hidden;
          border-radius: 14px; color: #e8e3d5; margin-top: 1.4rem;
        }
        .mc-paid { border-color: #3a2e18; }

        .mc-cover {
          position: relative; width: 100%; aspect-ratio: 16 / 9;
          background-size: cover; background-position: center;
        }
        .mc-cover--placeholder {
          background:
            radial-gradient(circle at 30% 25%, rgba(109,74,155,0.35), transparent 55%),
            radial-gradient(circle at 75% 70%, rgba(74,49,112,0.4), transparent 55%),
            linear-gradient(135deg, #16102a 0%, #0a0812 100%);
        }
        .mc-paid .mc-cover--placeholder {
          background:
            radial-gradient(circle at 30% 25%, rgba(201,168,107,0.28), transparent 55%),
            radial-gradient(circle at 75% 70%, rgba(109,74,155,0.35), transparent 55%),
            linear-gradient(135deg, #1a1330 0%, #0a0812 100%);
        }
        .mc-coverFade {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(180deg, transparent 45%, rgba(13,13,21,0.85) 92%, #0d0d15 100%);
        }
        .mc-badge {
          position: absolute; top: 0.9rem; left: 0.9rem; z-index: 2;
          font-family: var(--mc-space-mono), monospace;
          font-size: 0.6rem; letter-spacing: 0.18em; text-transform: uppercase;
          padding: 0.35rem 0.7rem; border-radius: 999px;
          background: rgba(10,8,18,0.72); border: 1px solid rgba(243,246,250,0.14);
          color: #cbb9e6; backdrop-filter: blur(4px);
        }
        .mc-paid .mc-badge { color: #e6cf95; border-color: rgba(201,168,107,0.4); }

        .mc-body { padding: 1.5rem 1.6rem 1.7rem; }
        .mc-kicker {
          font-family: var(--mc-space-mono), monospace;
          font-size: 0.64rem; letter-spacing: 0.22em; text-transform: uppercase;
          color: #6D4A9B; margin: 0 0 0.7rem;
        }
        .mc-paid .mc-kicker { color: #b79554; }
        .mc-title {
          font-family: var(--mc-marcellus), Georgia, serif;
          font-size: clamp(1.35rem, 4.5vw, 1.7rem); line-height: 1.15; letter-spacing: 0.01em;
          color: #f3f0e8; margin: 0 0 0.85rem;
        }
        .mc-desc {
          font-family: var(--mc-eb-garamond), Georgia, serif;
          font-size: 1.02rem; line-height: 1.6; color: #b9b3a6; margin: 0 0 1.3rem;
        }

        .mc-priceBox {
          display: flex; align-items: baseline; gap: 0.8rem; flex-wrap: wrap;
          border: 1px solid #2a2418; background: #0a0a0f;
          padding: 1rem 1.2rem; border-radius: 10px; margin-bottom: 1.2rem;
        }
        .mc-price {
          font-family: var(--mc-marcellus), Georgia, serif;
          font-size: 1.9rem; color: #d9b866; letter-spacing: 0.01em;
        }
        .mc-priceNote {
          font-family: var(--mc-space-mono), monospace;
          font-size: 0.62rem; letter-spacing: 0.15em; text-transform: uppercase; color: #7c8088;
        }

        .mc-player { margin-bottom: 1.2rem; border-radius: 10px; overflow: hidden; background: #000; }

        .mc-cta {
          display: block; width: 100%; text-align: center; cursor: pointer;
          font-family: var(--mc-space-mono), monospace;
          font-size: 0.75rem; letter-spacing: 0.22em; text-transform: uppercase;
          padding: 1rem 1.2rem; border-radius: 10px; border: 1px solid transparent;
          transition: background 0.25s ease, color 0.25s ease, border-color 0.25s ease;
          text-decoration: none;
        }
        .mc-cta--free {
          background: rgba(109,74,155,0.12); border-color: #4A3170; color: #cbb9e6;
        }
        .mc-cta--free:hover { background: rgba(109,74,155,0.22); color: #f0ece0; border-color: #6D4A9B; }
        .mc-cta--paid {
          background: linear-gradient(180deg, #d9b866 0%, #c39f4e 100%); color: #221a08;
          font-weight: 700; border-color: #b79554;
        }
        .mc-cta--paid:hover { background: linear-gradient(180deg, #e6c574 0%, #cfa956 100%); }
        .mc-cta--soon {
          background: rgba(243,246,250,0.04); border-color: #1b1c2a; color: #6a6a85; cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
