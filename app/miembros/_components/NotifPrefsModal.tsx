"use client"

// Modal de configuração de notificações. Equivalente a #notifPrefsOverlay
// + openNotifPrefsModal/saveNotifPrefsFromModal.
//.
//
// Toggles granulares:
//  - sound (master) → silencia TODOS os sons via window.NOTIF_PREFS.sound
//  - own.* → notifs sobre o próprio user (level_up, replies, likes, follows, etc)
//  - others.* → broadcasts de outros users (welcome, level_up, insignia, etc)
//
// Storage server-side em user_metadata.notification_prefs via
// /api/profile/notification-prefs. Hidrata window.NOTIF_PREFS no save pra
// surtir efeito imediato (sounds.ts checa via isMuted()).

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { api } from "../_lib/api"
import styles from "./notif-prefs-modal.module.css"

type NotificationPrefs = {
  own: {
    level_up: boolean
    forum_replies: boolean
    forum_likes: boolean
    follows: boolean
    feed_posts: boolean
    funnel_xp: boolean
  }
  others: {
    welcome: boolean
    level_up: boolean
    insignia: boolean
    streak: boolean
    funnel_hot: boolean
    funnel_new: boolean
    top3: boolean
  }
  sound: boolean
}

const DEFAULT_PREFS: NotificationPrefs = {
  own: {
    level_up: true,
    forum_replies: true,
    forum_likes: true,
    follows: true,
    feed_posts: true,
    funnel_xp: true,
  },
  others: {
    welcome: true,
    level_up: true,
    insignia: true,
    streak: true,
    funnel_hot: true,
    funnel_new: true,
    top3: true,
  },
  sound: true,
}

type OwnRow = { key: keyof NotificationPrefs["own"]; title: string; desc: string }
type OtherRow = { key: keyof NotificationPrefs["others"]; title: string; desc: string }

const OWN_ROWS: OwnRow[] = [
  { key: "level_up",      title: "Subiste de nivel",         desc: "Cuando ganas un level nuevo" },
  { key: "forum_replies", title: "Respuestas a tus discusiones", desc: "Alguien respondió un post o comentario tuyo" },
  { key: "forum_likes",   title: "Likes recibidos",          desc: "Alguien le dio like a tu contenido" },
  { key: "follows",       title: "Nuevos seguidores",        desc: "Alguien empezó a seguirte" },
  { key: "feed_posts",    title: "Posts del feed",           desc: "Avisos en el feed" },
  { key: "funnel_xp",     title: "Ganaste experiencia",      desc: "Cuando una acción tuya suma puntos" },
]

const OTHERS_ROWS: OtherRow[] = [
  { key: "welcome",     title: "Nuevos miembros",            desc: "Pop-up cuando alguien entra a la plataforma" },
  { key: "level_up",    title: "Subidas de nivel ajenas",    desc: "Cuando otros llegan a LV 10+" },
  { key: "insignia",    title: "Insignias raras",            desc: "Cuando otros desbloquean insignia silver/gold/platinum" },
  { key: "streak",      title: "Streaks (30/90/365 días)",   desc: "Cuando otros completan marcas de constancia" },
  { key: "funnel_hot",  title: "Conversaciones que arden",   desc: "Cuando algo de la comunidad se llena de respuestas" },
  { key: "funnel_new",  title: "Conversaciones nuevas",      desc: "Cuando alguien abre una conversación en la Red" },
  { key: "top3",        title: "Cambios en el TOP 3",        desc: "Cuando alguien entra al top 3 del ranking de XP" },
]

type Props = {
  open: boolean
  onClose: () => void
}

// ── LAS DEL CORREO SON OTRA COSA ──────────────────────────────────────────
// Las de arriba gobiernan la CAMPANA de dentro de la plataforma. Estas deciden
// si a alguien se le ESCRIBE, y viven en su propia tabla porque hay que poder
// contarlas del lado del servidor —«¿a cuántos les llegaría esto?»— antes de
// mandar nada. Se enseñan juntas porque para quien mira son lo mismo: «qué me
// avisáis y por dónde».
//
// Lo que NO apaga ninguno de estos interruptores: el enlace de acceso, la
// recuperación de cuenta y el aviso de un pago fallido. Eso no es publicidad,
// es el funcionamiento de su cuenta.
type PrefsCorreo = {
  novedades: boolean
  contenidos: boolean
  sesiones: boolean
  red: boolean
  unsubscribed_all: boolean
}

const CORREO_POR_DEFECTO: PrefsCorreo = {
  novedades: true, contenidos: true, sesiones: true, red: true, unsubscribed_all: false,
}

const FILAS_CORREO: Array<{ key: keyof Omit<PrefsCorreo, "unsubscribed_all">; title: string; desc: string }> = [
  { key: "novedades", title: "Novedades importantes", desc: "Anuncios y comunicaciones especiales" },
  { key: "contenidos", title: "Nuevos contenidos", desc: "Episodios, módulos y transmisiones" },
  { key: "sesiones", title: "Sesiones en vivo", desc: "Directos, activaciones y sus recordatorios" },
  { key: "red", title: "Encuentros y La Red", desc: "Encuentros y actividad de la comunidad" },
]

export function NotifPrefsModal({ open, onClose }: Props) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS)
  const [correo, setCorreo] = useState<PrefsCorreo>(CORREO_POR_DEFECTO)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Esc fecha + trava scroll
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  // Fetch ao abrir
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    api<NotificationPrefs>("/api/profile/notification-prefs")
      .then((data) => {
        if (cancelled) return
        setPrefs({
          own: { ...DEFAULT_PREFS.own, ...(data?.own || {}) },
          others: { ...DEFAULT_PREFS.others, ...(data?.others || {}) },
          sound: typeof data?.sound === "boolean" ? data.sound : true,
        })
      })
      .catch(() => {
        // Mantém defaults
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    // Las del correo van por su ruta. Si falla, se quedan los valores por
    // defecto —todo encendido— que es lo que de verdad ocurre en el servidor
    // cuando alguien no tiene fila.
    api<{ prefs?: Partial<PrefsCorreo> }>("/api/profile/email-prefs")
      .then((d) => { if (!cancelled) setCorreo({ ...CORREO_POR_DEFECTO, ...(d?.prefs || {}) }) })
      .catch(() => { /* se quedan los de por defecto */ })

    return () => {
      cancelled = true
    }
  }, [open])

  function toggleOwn(key: keyof NotificationPrefs["own"]) {
    setPrefs((p) => ({ ...p, own: { ...p.own, [key]: !p.own[key] } }))
  }
  function toggleOthers(key: keyof NotificationPrefs["others"]) {
    setPrefs((p) => ({ ...p, others: { ...p.others, [key]: !p.others[key] } }))
  }
  function toggleSound() {
    setPrefs((p) => ({ ...p, sound: !p.sound }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api("/api/profile/notification-prefs", {
        method: "POST",
        body: prefs,
      })
      // Hidrata window.NOTIF_PREFS pra surtir efeito imediato em sounds.ts
      // e nas filas de level-up / broadcasts (sem precisar reload)
      ;(window as unknown as { NOTIF_PREFS?: NotificationPrefs }).NOTIF_PREFS = prefs

      // Las del correo se guardan aparte porque son otra tabla y otra ruta.
      // Si esta falla, las de la campana ya quedaron guardadas: es mejor que
      // se guarde la mitad a que no se guarde nada.
      await api("/api/profile/email-prefs", { method: "POST", body: correo })

      onClose()
    } catch {
      // Silencioso — botão volta ao normal
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-label="Configurar notificaciones"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2 className={styles.headerTitle}>Configurar notificaciones</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </header>

        <div className={styles.body}>
          {/* Master — Sonidos */}
          <section className={styles.section}>
            <div className={`${styles.row} ${styles.rowMaster}`}>
              <div className={styles.rowText}>
                <div className={styles.rowTitle}>Sonidos</div>
                <div className={styles.rowDesc}>
                  Reproducir sonidos en clics, likes y notificaciones
                </div>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={prefs.sound}
                  onChange={toggleSound}
                  disabled={loading}
                />
                <span className={styles.slider} />
              </label>
            </div>
          </section>

          {/* Tuyas */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Tuyas</h3>
            <p className={styles.sectionDesc}>Cosas que pasan en tu cuenta</p>
            {OWN_ROWS.map((r) => (
              <div key={r.key} className={styles.row}>
                <div className={styles.rowText}>
                  <div className={styles.rowTitle}>{r.title}</div>
                  <div className={styles.rowDesc}>{r.desc}</div>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={prefs.own[r.key]}
                    onChange={() => toggleOwn(r.key)}
                    disabled={loading}
                  />
                  <span className={styles.slider} />
                </label>
              </div>
            ))}
          </section>

          {/* De otros miembros */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>De otros miembros</h3>
            <p className={styles.sectionDesc}>Lo que la comunidad logra</p>
            {OTHERS_ROWS.map((r) => (
              <div key={r.key} className={styles.row}>
                <div className={styles.rowText}>
                  <div className={styles.rowTitle}>{r.title}</div>
                  <div className={styles.rowDesc}>{r.desc}</div>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={prefs.others[r.key]}
                    onChange={() => toggleOthers(r.key)}
                    disabled={loading}
                  />
                  <span className={styles.slider} />
                </label>
              </div>
            ))}
          </section>

          {/* ── Por correo ───────────────────────────────────────────────
              Lo de arriba es la campana de dentro. Esto decide si te
              escribimos. Se enseñan juntas porque para quien mira son la
              misma pregunta: qué me avisáis, y por dónde. */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Por correo</h3>
            <p className={styles.sectionDesc}>Qué te enviamos a tu bandeja de entrada</p>

            {FILAS_CORREO.map((r) => (
              <div key={r.key} className={styles.row}>
                <div className={styles.rowText}>
                  <div className={styles.rowTitle}>{r.title}</div>
                  <div className={styles.rowDesc}>{r.desc}</div>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={!correo.unsubscribed_all && correo[r.key]}
                    onChange={() => setCorreo((c) => ({ ...c, [r.key]: !c[r.key] }))}
                    disabled={loading || correo.unsubscribed_all}
                  />
                  <span className={styles.slider} />
                </label>
              </div>
            ))}

            {/* La baja global. Gana sobre las cuatro de arriba, y por eso las
                deja apagadas en pantalla: enseñar «novedades: sí» a quien se
                dio de baja de todo sería mentirle. */}
            <div className={`${styles.row} ${styles.rowMaster}`}>
              <div className={styles.rowText}>
                <div className={styles.rowTitle}>No enviarme ningún correo</div>
                <div className={styles.rowDesc}>
                  Seguirás recibiendo lo imprescindible de tu cuenta: el acceso y
                  la recuperación de contraseña.
                </div>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={correo.unsubscribed_all}
                  onChange={() => setCorreo((c) => ({ ...c, unsubscribed_all: !c.unsubscribed_all }))}
                  disabled={loading}
                />
                <span className={styles.slider} />
              </label>
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </footer>
      </div>
    </div>
  )
}
