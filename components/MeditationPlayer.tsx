'use client';

// Reproductor de meditaciones + compuerta de compra premium.
//
// - AudioPlayer: experiencia inmersiva (play/pausa, barra interactiva, ±15s,
//   modo inmersivo, reanudar, completado). Sirve audio desde el endpoint privado
//   /api/meditations/<id>/audio (control de acceso server-side + Range).
// - PremiumGate: para meditaciones premium. Consulta estado (precio real desde
//   Supabase + si ya es propiedad). Si es propiedad → AudioPlayer. Si no →
//   estado bloqueado + compra 1-clic (on_session), 3DS (requires_action) y
//   fallback con Payment Element. El entitlement lo crea el servidor.

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Lock, Sparkles, AlertCircle, Check } from 'lucide-react';
import { loadStripe, type Stripe as StripeJs } from '@stripe/stripe-js';
import type { MeditationClient } from '@/app/miembros/_lib/season1-meditaciones';
import { StripeInlinePayment } from '@/app/miembros/_components/StripeInlinePayment';

// ── Stripe.js (para 3DS del 1-clic) ─────────────────────────────────────────
let cachedStripe: Promise<StripeJs | null> | null = null;
function getStripeJs(): Promise<StripeJs | null> {
  if (cachedStripe) return cachedStripe;
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return Promise.resolve(null);
  cachedStripe = loadStripe(key);
  return cachedStripe;
}

type Status = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'buffering' | 'completed' | 'error';

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
function money(cents: number, currency = 'usd'): string {
  const sym = currency.toLowerCase() === 'usd' ? 'US$' : currency.toUpperCase() + ' ';
  return `${sym} ${(cents / 100).toFixed(2)}`;
}

const SAVE_EVERY_MS = 10000;
const COMPLETE_TOLERANCE = 1.5;

// ════════════════════════════════════════════════════════════════════════════
// Reproductor de audio (incluida, o premium ya desbloqueada)
// ════════════════════════════════════════════════════════════════════════════
function AudioPlayer({ id, title, subtitle, image, badge, premium }: {
  id: string; title: string; subtitle?: string | null; image?: string; badge: string; premium?: boolean;
}) {
  const streamUrl = `/api/meditations/${encodeURIComponent(id)}/audio`;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [resumeAt, setResumeAt] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [immersive, setImmersive] = useState(false);

  const startedRef = useRef(false);
  const completedSentRef = useRef(false);
  const lastSaveRef = useRef(0);
  const latest = useRef({ current: 0, duration: 0 });
  latest.current = { current, duration };

  const saveProgress = useCallback((opts?: { completed?: boolean; keepalive?: boolean }) => {
    const dur = latest.current.duration;
    const pos = latest.current.current;
    const percent = dur > 0 ? Math.min(100, Math.round((pos / dur) * 100)) : 0;
    try {
      fetch('/api/profile/meditation-progress', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        keepalive: opts?.keepalive ?? false,
        body: JSON.stringify({
          meditation_id: id, position_seconds: Math.floor(pos), duration_seconds: Math.floor(dur),
          percent: opts?.completed ? 100 : percent, completed: !!opts?.completed,
        }),
      }).catch(() => {});
    } catch { /* ignora */ }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/profile/meditation-progress', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.progress) return;
        const row = (data.progress as Array<{ meditation_id: string; position_seconds: number; duration_seconds: number; completed: boolean }>)
          .find((p) => p.meditation_id === id);
        if (!row) return;
        if (row.completed) setCompleted(true);
        if (row.duration_seconds > 0) setDuration((d) => d || row.duration_seconds);
        if (!row.completed && row.position_seconds > 5 &&
            (!row.duration_seconds || row.position_seconds < row.duration_seconds - 5)) {
          setResumeAt(row.position_seconds);
        }
      }).catch(() => {});
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    const onHide = () => { if (startedRef.current && !completedSentRef.current) saveProgress({ keepalive: true }); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
      if (startedRef.current && !completedSentRef.current) saveProgress({ keepalive: true });
    };
  }, [saveProgress]);

  const markCompleted = useCallback(() => {
    if (completedSentRef.current) return;
    completedSentRef.current = true;
    setCompleted(true); setStatus('completed');
    saveProgress({ completed: true });
  }, [saveProgress]);

  const onLoadedMeta = () => {
    const a = audioRef.current; if (!a) return;
    if (Number.isFinite(a.duration)) setDuration(a.duration);
    setStatus((s) => (s === 'loading' || s === 'idle' ? 'ready' : s));
  };
  const onTimeUpdate = () => {
    const a = audioRef.current; if (!a) return;
    setCurrent(a.currentTime);
    if (a.duration > 0 && a.currentTime >= a.duration - COMPLETE_TOLERANCE) markCompleted();
    const now = Date.now();
    if (!a.paused && now - lastSaveRef.current > SAVE_EVERY_MS) { lastSaveRef.current = now; saveProgress(); }
  };
  const onPlay = () => setStatus('playing');
  const onPause = () => { setStatus((s) => (s === 'completed' ? s : 'paused')); if (startedRef.current && !completedSentRef.current) saveProgress(); };
  const onWaiting = () => setStatus((s) => (s === 'completed' ? s : 'buffering'));
  const onPlaying = () => setStatus('playing');
  const onEnded = () => markCompleted();
  const onError = () => setStatus('error');

  const togglePlay = () => {
    const a = audioRef.current; if (!a) return;
    if (a.paused) {
      if (!startedRef.current && resumeAt > 0) { try { a.currentTime = resumeAt; } catch { /* ignora */ } }
      startedRef.current = true;
      if (status === 'idle') setStatus('loading');
      a.play().catch(() => setStatus('error'));
    } else { a.pause(); }
  };
  const skip = (delta: number) => {
    const a = audioRef.current; if (!a) return;
    const d = a.duration || duration || 0;
    a.currentTime = Math.max(0, Math.min(d, a.currentTime + delta));
    setCurrent(a.currentTime);
  };
  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current; if (!a) return;
    const v = Number(e.target.value); a.currentTime = v; setCurrent(v);
  };
  const retry = () => {
    const a = audioRef.current; if (!a) return;
    setStatus('loading'); a.load(); a.play().catch(() => setStatus('error'));
  };

  const isPlaying = status === 'playing';
  const pct = duration > 0 ? (current / duration) * 100 : 0;
  const coverStyle = image ? { backgroundImage: `url(${image})` } : undefined;

  return (
    <>
      {immersive && <div className="mp-dim" aria-hidden onClick={() => setImmersive(false)} />}
      <div className={`mp-wrap ${premium ? 'mp-premium' : ''} ${immersive ? 'mp-immersive' : ''}`}>
        <audio ref={audioRef} src={streamUrl} preload="metadata"
          onLoadedMetadata={onLoadedMeta} onTimeUpdate={onTimeUpdate} onPlay={onPlay} onPause={onPause}
          onWaiting={onWaiting} onPlaying={onPlaying} onEnded={onEnded} onError={onError} />

        <div className={`mp-cover ${image ? '' : 'mp-cover--ph'} ${isPlaying ? 'mp-breathe' : ''}`} style={coverStyle}>
          <span className="mp-cosmic" aria-hidden />
          <span className="mp-chip">{completed ? 'Práctica completada' : badge}</span>
          <span className="mp-coverFade" aria-hidden />
        </div>

        <div className="mp-body">
          <p className="mp-kicker">Sergel · Práctica guiada</p>
          <h3 className="mp-title">{title}</h3>
          {subtitle && !immersive && <p className="mp-sub">{subtitle}</p>}

          {status === 'error' ? (
            <div className="mp-error">
              <AlertCircle size={16} /><span>No se pudo cargar la meditación.</span>
              <button type="button" className="mp-retry" onClick={retry}>Reintentar</button>
            </div>
          ) : (
            <>
              {!startedRef.current && resumeAt > 0 && !completed && (
                <button type="button" className="mp-resume" onClick={togglePlay}>Continuar desde {fmt(resumeAt)}</button>
              )}
              <div className="mp-controls">
                <button type="button" className="mp-skip" onClick={() => skip(-15)} aria-label="Retroceder 15 segundos"><RotateCcw size={20} /><span>15</span></button>
                <button type="button" className="mp-play" onClick={togglePlay} aria-label={isPlaying ? 'Pausar' : 'Reproducir'}>
                  {status === 'loading' || status === 'buffering' ? <span className="mp-spin" aria-hidden />
                    : isPlaying ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" />}
                </button>
                <button type="button" className="mp-skip" onClick={() => skip(15)} aria-label="Avanzar 15 segundos"><RotateCw size={20} /><span>15</span></button>
              </div>
              <div className="mp-progress">
                <input className="mp-range" type="range" min={0} max={duration || 0} step={0.1}
                  value={Math.min(current, duration || 0)} onChange={onSeek}
                  style={{ '--mp-pct': `${pct}%` } as CSSProperties} aria-label="Progreso de la meditación" />
                <div className="mp-times"><span>{fmt(current)}</span><span>{duration ? fmt(duration) : '--:--'}</span></div>
              </div>
              <button type="button" className={`mp-immersiveBtn ${immersive ? 'is-on' : ''}`} onClick={() => setImmersive((v) => !v)}>
                {immersive ? 'Salir del modo inmersivo' : 'Modo inmersivo'}
              </button>
            </>
          )}
        </div>
      </div>
      {styleTag}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Compuerta premium (bloqueado / compra / desbloqueado)
// ════════════════════════════════════════════════════════════════════════════
type GatePhase = 'loading' | 'locked' | 'processing' | 'needs_card' | 'unlocked' | 'error';

function PremiumGate({ meditation }: { meditation: MeditationClient }) {
  const id = meditation.id;
  const [phase, setPhase] = useState<GatePhase>('loading');
  const [priceCents, setPriceCents] = useState<number>(0);
  const [currency, setCurrency] = useState('usd');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [justUnlocked, setJustUnlocked] = useState(false);

  // Estado inicial (precio real + si ya es propiedad).
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/meditations/${encodeURIComponent(id)}/state`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) { if (!cancelled) setPhase('locked'); return; }
        setPriceCents(d.price_cents ?? 0);
        setCurrency(d.currency ?? 'usd');
        setPhase(d.owned ? 'unlocked' : 'locked');
      })
      .catch(() => { if (!cancelled) setPhase('locked'); });
    return () => { cancelled = true; };
  }, [id]);

  const goUnlocked = useCallback(() => {
    setJustUnlocked(true);
    setPhase('unlocked');
    setTimeout(() => setJustUnlocked(false), 1600);
  }, []);

  const confirmEntitlement = useCallback(async (paymentIntentId: string) => {
    try {
      const r = await fetch(`/api/meditations/${encodeURIComponent(id)}/confirm`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ payment_intent_id: paymentIntentId }),
      });
      const d = await r.json();
      if (d.status === 'unlocked') { goUnlocked(); return true; }
    } catch { /* cae a error */ }
    setPhase('error'); setErrorMsg('No pudimos confirmar el pago. Inténtalo nuevamente.');
    return false;
  }, [id, goUnlocked]);

  const handleUnlock = useCallback(async () => {
    setErrorMsg(null); setPhase('processing');
    try {
      const r = await fetch(`/api/meditations/${encodeURIComponent(id)}/unlock`, {
        method: 'POST', credentials: 'include',
      });
      const d = await r.json();

      if (d.status === 'unlocked' || d.status === 'already_owned') { goUnlocked(); return; }

      if (d.status === 'requires_action' && d.client_secret) {
        const stripe = await getStripeJs();
        if (!stripe) { setPhase('error'); setErrorMsg('No pudimos iniciar la confirmación de pago.'); return; }
        const { error, paymentIntent } = await stripe.handleNextAction({ clientSecret: d.client_secret });
        if (error || !paymentIntent || paymentIntent.status !== 'succeeded') {
          setPhase('error'); setErrorMsg('No pudimos completar el pago. Inténtalo nuevamente.'); return;
        }
        await confirmEntitlement(paymentIntent.id);
        return;
      }

      if (d.status === 'needs_payment_method') { setPhase('needs_card'); return; }

      setPhase('error'); setErrorMsg('No pudimos completar el pago. Inténtalo nuevamente.');
    } catch {
      setPhase('error'); setErrorMsg('No pudimos completar el pago. Inténtalo nuevamente.');
    }
  }, [id, goUnlocked, confirmEntitlement]);

  // Ya desbloqueada → reproductor (con breve transición "ACCESO DESBLOQUEADO").
  if (phase === 'unlocked') {
    if (justUnlocked) {
      return (
        <div className="mp-wrap mp-unlocking">
          <div className="mp-unlockedPanel"><Check size={30} /><span>Acceso desbloqueado</span></div>
          {styleTag}
        </div>
      );
    }
    return <AudioPlayer premium id={id} title={meditation.title} subtitle={meditation.subtitle} image={meditation.image} badge="Meditación premium · Desbloqueada" />;
  }

  const priceLabel = money(priceCents, currency);
  const coverStyle = meditation.image ? { backgroundImage: `url(${meditation.image})` } : undefined;

  return (
    <div className="mp-wrap mp-locked">
      <div className={`mp-cover mp-cover--paid ${meditation.image ? '' : 'mp-cover--ph'}`} style={coverStyle}>
        <span className="mp-cosmic" aria-hidden />
        <span className="mp-lockChip"><Lock size={12} /> Meditación especial</span>
        <span className="mp-coverFade" aria-hidden />
      </div>
      <div className="mp-body">
        <p className="mp-kicker mp-kicker--gold">Sergel · Práctica premium</p>
        <h3 className="mp-title">{meditation.title}</h3>
        {meditation.subtitle && <p className="mp-sub">{meditation.subtitle}</p>}

        {phase === 'needs_card' ? (
          <div className="mp-cardWrap">
            <p className="mp-lockNote"><Sparkles size={15} /><span>Confirma tu tarjeta para desbloquear.</span></p>
            <StripeInlinePayment
              currencyOptions={[{ currency, amount: priceCents / 100, label: 'Pagar', formatted: priceLabel }]}
              createPiEndpoint={`/api/meditations/${encodeURIComponent(id)}/create-pi`}
              onSuccess={(piId) => { confirmEntitlement(piId); }}
            />
          </div>
        ) : (
          <>
            <div className="mp-lockNote"><Sparkles size={15} /><span>Esta experiencia requiere acceso adicional.</span></div>
            <div className="mp-priceBox">
              <span className="mp-price">{priceLabel}</span>
              <span className="mp-priceNote">Pago único</span>
            </div>
            {errorMsg && <p className="mp-payError">{errorMsg}</p>}
            <button type="button" className="mp-cta mp-cta--gold" onClick={handleUnlock} disabled={phase === 'processing' || phase === 'loading'}>
              {phase === 'processing' ? 'Procesando…' : phase === 'loading' ? '…' : `Desbloquear · ${priceLabel}`}
            </button>
          </>
        )}
      </div>
      {styleTag}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function MeditationPlayer({ meditation }: { meditation: MeditationClient }) {
  if (meditation.access === 'premium') return <PremiumGate meditation={meditation} />;
  return <AudioPlayer id={meditation.id} title={meditation.title} subtitle={meditation.subtitle} image={meditation.image} badge="Meditación · Incluida" />;
}

// Estilos globales compartidos.
const styleTag = (
  <style jsx global>{`
    .mp-wrap { position: relative; background: #0d0d15; border: 1px solid #1b1c2a; border-radius: 14px; overflow: hidden; margin-top: 1.4rem; color: #e8e3d5; }
    .mp-locked { border-color: #3a2e18; }
    .mp-immersive { position: relative; z-index: 41; border-color: #4A3170; box-shadow: 0 24px 80px rgba(0,0,0,0.6); }
    .mp-dim { position: fixed; inset: 0; z-index: 40; background: rgba(4,4,10,0.78); backdrop-filter: blur(2px); animation: mpFade 0.5s ease; }

    .mp-cover { position: relative; width: 100%; aspect-ratio: 16 / 9; background-size: cover; background-position: center; }
    .mp-cover--ph { background: radial-gradient(circle at 30% 25%, rgba(109,74,155,0.35), transparent 55%), radial-gradient(circle at 75% 70%, rgba(74,49,112,0.4), transparent 55%), linear-gradient(135deg, #16102a 0%, #0a0812 100%); }
    .mp-cover--paid.mp-cover--ph { background: radial-gradient(circle at 30% 25%, rgba(201,168,107,0.26), transparent 55%), radial-gradient(circle at 75% 70%, rgba(109,74,155,0.35), transparent 55%), linear-gradient(135deg, #1a1330 0%, #0a0812 100%); }
    .mp-breathe { animation: mpBreathe 7s ease-in-out infinite; }
    .mp-coverFade { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, transparent 45%, rgba(13,13,21,0.85) 92%, #0d0d15 100%); }
    /* Velo cósmico sobre la foto: resplandor superior + estrellas dispersas.
       Sutil, para no tapar a Sergel. Violeta (incluida) / dorado (premium). */
    .mp-cosmic {
      position: absolute; inset: 0; pointer-events: none; z-index: 1;
      background:
        radial-gradient(circle at 50% 4%, rgba(138,99,184,0.28), transparent 42%),
        radial-gradient(1px 1px at 16% 22%, rgba(255,255,255,0.75), transparent),
        radial-gradient(1px 1px at 83% 15%, rgba(255,255,255,0.55), transparent),
        radial-gradient(1.4px 1.4px at 68% 28%, rgba(203,185,230,0.75), transparent),
        radial-gradient(1px 1px at 32% 40%, rgba(255,255,255,0.5), transparent),
        radial-gradient(1.2px 1.2px at 91% 46%, rgba(203,185,230,0.6), transparent),
        radial-gradient(1px 1px at 47% 18%, rgba(255,255,255,0.5), transparent);
    }
    .mp-premium .mp-cosmic, .mp-cover--paid .mp-cosmic {
      background:
        radial-gradient(circle at 50% 4%, rgba(217,184,102,0.26), transparent 42%),
        radial-gradient(1px 1px at 16% 22%, rgba(255,255,255,0.75), transparent),
        radial-gradient(1px 1px at 83% 15%, rgba(255,255,255,0.55), transparent),
        radial-gradient(1.4px 1.4px at 68% 28%, rgba(230,207,149,0.75), transparent),
        radial-gradient(1px 1px at 32% 40%, rgba(255,255,255,0.5), transparent),
        radial-gradient(1.2px 1.2px at 91% 46%, rgba(230,207,149,0.6), transparent),
        radial-gradient(1px 1px at 47% 18%, rgba(255,255,255,0.5), transparent);
    }
    .mp-chip, .mp-lockChip { position: absolute; top: 0.9rem; left: 0.9rem; z-index: 2; display: inline-flex; align-items: center; gap: 0.35rem; font-family: var(--font-mono, monospace); font-size: 0.6rem; letter-spacing: 0.16em; text-transform: uppercase; padding: 0.35rem 0.7rem; border-radius: 999px; background: rgba(10,8,18,0.72); border: 1px solid rgba(243,246,250,0.14); color: #cbb9e6; backdrop-filter: blur(4px); }
    .mp-lockChip { color: #e6cf95; border-color: rgba(201,168,107,0.4); }

    .mp-body { padding: 1.4rem 1.5rem 1.6rem; }
    .mp-kicker { font-family: var(--font-mono, monospace); font-size: 0.62rem; letter-spacing: 0.22em; text-transform: uppercase; color: #6D4A9B; margin: 0 0 0.6rem; }
    .mp-kicker--gold { color: #b79554; }
    .mp-title { font-family: var(--font-display, serif); font-size: clamp(1.3rem, 4.5vw, 1.6rem); line-height: 1.15; color: #f3f0e8; margin: 0 0 0.6rem; }
    .mp-sub { font-size: 0.98rem; line-height: 1.55; color: #a9a397; margin: 0 0 1.2rem; }

    .mp-controls { display: flex; align-items: center; justify-content: center; gap: 1.6rem; margin: 0.6rem 0 1.3rem; }
    .mp-play { width: 74px; height: 74px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 35%, #7c53ad, #4A3170); color: #f3f0e8; border: 1px solid #8a63b8; box-shadow: 0 0 0 6px rgba(109,74,155,0.12), 0 10px 30px rgba(74,49,112,0.45); transition: transform 0.15s ease, box-shadow 0.25s ease; }
    .mp-play:hover { transform: translateY(-1px); box-shadow: 0 0 0 8px rgba(109,74,155,0.16), 0 14px 36px rgba(74,49,112,0.55); }
    .mp-play:active { transform: scale(0.96); }
    .mp-skip { display: flex; flex-direction: column; align-items: center; gap: 0.1rem; background: none; border: none; cursor: pointer; color: #b9b3c6; font-family: var(--font-mono, monospace); font-size: 0.58rem; letter-spacing: 0.05em; transition: color 0.2s ease; }
    .mp-skip:hover { color: #e8e3d5; }
    .mp-spin { width: 26px; height: 26px; border: 2px solid rgba(243,240,232,0.3); border-top-color: #f3f0e8; border-radius: 50%; animation: mpSpin 0.8s linear infinite; }

    .mp-progress { margin-top: 0.2rem; }
    .mp-range { -webkit-appearance: none; appearance: none; width: 100%; height: 22px; background: transparent; cursor: pointer; display: block; }
    .mp-range::-webkit-slider-runnable-track { height: 4px; border-radius: 4px; background: linear-gradient(90deg, #8a63b8 0%, #8a63b8 var(--mp-pct, 0%), rgba(243,246,250,0.12) var(--mp-pct, 0%), rgba(243,246,250,0.12) 100%); }
    .mp-range::-moz-range-track { height: 4px; border-radius: 4px; background: rgba(243,246,250,0.12); }
    .mp-range::-moz-range-progress { height: 4px; border-radius: 4px; background: #8a63b8; }
    .mp-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; margin-top: -7px; width: 18px; height: 18px; border-radius: 50%; background: #f3f0e8; border: 3px solid #6D4A9B; box-shadow: 0 0 10px rgba(138,99,184,0.6); }
    .mp-range::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #f3f0e8; border: 3px solid #6D4A9B; }
    .mp-times { display: flex; justify-content: space-between; margin-top: 0.3rem; font-family: var(--font-mono, monospace); font-size: 0.72rem; color: #8a8598; }

    .mp-resume { display: block; width: 100%; margin-bottom: 1rem; padding: 0.7rem 1rem; font-family: var(--font-mono, monospace); font-size: 0.72rem; letter-spacing: 0.1em; color: #cbb9e6; background: rgba(109,74,155,0.1); border: 1px solid #4A3170; border-radius: 8px; cursor: pointer; transition: background 0.2s ease; }
    .mp-resume:hover { background: rgba(109,74,155,0.2); }
    .mp-immersiveBtn { display: block; margin: 1.2rem auto 0; padding: 0.5rem 1rem; font-family: var(--font-mono, monospace); font-size: 0.62rem; letter-spacing: 0.18em; text-transform: uppercase; color: #7c8088; background: none; border: 1px solid #1b1c2a; border-radius: 999px; cursor: pointer; transition: all 0.2s ease; }
    .mp-immersiveBtn:hover, .mp-immersiveBtn.is-on { color: #cbb9e6; border-color: #4A3170; }

    .mp-lockNote { display: flex; align-items: center; gap: 0.5rem; margin: 0.4rem 0 1.2rem; color: #b9b3a6; font-size: 0.95rem; }
    .mp-lockNote svg { color: #b79554; flex-shrink: 0; }
    .mp-priceBox { display: flex; align-items: baseline; gap: 0.8rem; flex-wrap: wrap; border: 1px solid #2a2418; background: #0a0a0f; padding: 1rem 1.2rem; border-radius: 10px; margin-bottom: 1.2rem; }
    .mp-price { font-family: var(--font-display, serif); font-size: 1.9rem; color: #d9b866; }
    .mp-priceNote { font-family: var(--font-mono, monospace); font-size: 0.62rem; letter-spacing: 0.15em; text-transform: uppercase; color: #7c8088; }
    .mp-payError { color: #d8a0a0; font-size: 0.9rem; margin: 0 0 1rem; }
    .mp-cta { display: block; width: 100%; text-align: center; cursor: pointer; font-family: var(--font-mono, monospace); font-size: 0.74rem; letter-spacing: 0.2em; text-transform: uppercase; padding: 1rem 1.2rem; border-radius: 10px; border: 1px solid transparent; }
    .mp-cta--gold { background: linear-gradient(180deg, #d9b866 0%, #c39f4e 100%); color: #221a08; font-weight: 700; border-color: #b79554; }
    .mp-cta--gold:hover { background: linear-gradient(180deg, #e6c574 0%, #cfa956 100%); }
    .mp-cta--gold:disabled { opacity: 0.6; cursor: default; }
    .mp-cardWrap { margin-top: 0.4rem; }

    .mp-unlocking { padding: 0; }
    .mp-unlockedPanel { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.6rem; padding: 3.2rem 1rem; color: #d9b866; font-family: var(--font-mono, monospace); font-size: 0.8rem; letter-spacing: 0.18em; text-transform: uppercase; animation: mpFade 0.4s ease; }

    .mp-error { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; color: #d8a0a0; font-size: 0.9rem; padding: 0.8rem 0; }
    .mp-retry { font-family: var(--font-mono, monospace); font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase; color: #cbb9e6; background: rgba(109,74,155,0.12); border: 1px solid #4A3170; border-radius: 8px; padding: 0.45rem 0.9rem; cursor: pointer; }

    /* ── Variante PREMIUM (dorada) — reproductor de una meditación comprada.
       Diferencia visualmente el contenido premium del incluido (violeta). ── */
    .mp-premium { border-color: #3a2e18; }
    .mp-premium .mp-cover--ph {
      background:
        radial-gradient(circle at 30% 25%, rgba(201,168,107,0.26), transparent 55%),
        radial-gradient(circle at 75% 70%, rgba(109,74,155,0.30), transparent 55%),
        linear-gradient(135deg, #1a1330 0%, #0a0812 100%);
    }
    .mp-premium .mp-chip { color: #e6cf95; border-color: rgba(201,168,107,0.4); }
    .mp-premium .mp-kicker { color: #b79554; }
    .mp-premium .mp-play {
      background: radial-gradient(circle at 50% 35%, #e6c574, #b8923f); color: #221a08; border-color: #d9b866;
      box-shadow: 0 0 0 6px rgba(201,168,107,0.14), 0 10px 30px rgba(160,120,40,0.4);
    }
    .mp-premium .mp-play:hover { box-shadow: 0 0 0 8px rgba(201,168,107,0.2), 0 14px 36px rgba(160,120,40,0.5); }
    .mp-premium .mp-range::-webkit-slider-runnable-track {
      background: linear-gradient(90deg, #d9b866 0%, #d9b866 var(--mp-pct, 0%), rgba(243,246,250,0.12) var(--mp-pct, 0%), rgba(243,246,250,0.12) 100%);
    }
    .mp-premium .mp-range::-moz-range-progress { background: #d9b866; }
    .mp-premium .mp-range::-webkit-slider-thumb { border-color: #c39f4e; box-shadow: 0 0 10px rgba(217,184,102,0.6); }
    .mp-premium .mp-range::-moz-range-thumb { border-color: #c39f4e; }
    .mp-premium .mp-resume { color: #e6cf95; background: rgba(201,168,107,0.1); border-color: #b79554; }
    .mp-premium .mp-resume:hover { background: rgba(201,168,107,0.2); }
    .mp-premium .mp-immersiveBtn:hover, .mp-premium .mp-immersiveBtn.is-on { color: #e6cf95; border-color: #b79554; }

    @keyframes mpSpin { to { transform: rotate(360deg); } }
    @keyframes mpFade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes mpBreathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.035); } }
    @media (max-width: 480px) { .mp-controls { gap: 1.15rem; } .mp-play { width: 66px; height: 66px; } }
    @media (prefers-reduced-motion: reduce) { .mp-breathe { animation: none; } }
  `}</style>
);
