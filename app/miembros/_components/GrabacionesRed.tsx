"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  ENCUENTROS DE LA RED — el archivo de grabaciones
// ═══════════════════════════════════════════════════════════════════════════
//
// ── QUÉ ERA ESTA PESTAÑA Y QUÉ ES AHORA ───────────────────────────────────
// Era una pizarra de convocatorias: fecha futura, ciudad, cupo, quién asiste.
// Los anuncios se han ido al canal de Telegram, que es donde la gente ya
// mira y donde le llega un aviso sin abrir nada.
//
// Lo que queda aquí es lo contrario de un anuncio: las grabaciones. Un
// anuncio caduca; una grabación empieza a valer el día después de la reunión
// y sigue valiendo un año más tarde.
//
// Por eso esto es una REJILLA y no una lista con fechas en negrita. Lo que se
// busca en un archivo es «cuál de todas», y para eso lo que manda es la
// imagen, no el texto.
//
// ── EL REPRODUCTOR SE MONTA AL ABRIR, NO ANTES ────────────────────────────
// Cada reproductor de VTurb trae su script y empieza a hablar con sus
// servidores. Con cuarenta grabaciones en pantalla, montarlos todos para que
// se vea uno dejaría la pestaña inservible en el móvil. Aquí la rejilla son
// imágenes; el reproductor existe solo mientras hay una grabación abierta.

import { useState } from "react"
import dynamic from "next/dynamic"
import { Loader2, Play, Settings, Video, Film, CalendarDays } from "lucide-react"
import { useAuth } from "../_lib/auth-context"
import { useGrabaciones, type GrabacionVista } from "../_lib/use-grabaciones"
import { VturbPlayer } from "./VturbPlayer"
import { CompartirGrabacion } from "./CompartirGrabacion"
import { Modal } from "./Modal"
import styles from "./grabaciones-red.module.css"

// El panel solo lo abre administración: no tiene por qué entrar en lo que se
// descarga el resto de la gente.
const GrabacionesManagerModal = dynamic(
  () => import("./GrabacionesManagerModal").then((m) => m.GrabacionesManagerModal),
  { ssr: false },
)

export function GrabacionesRed() {
  const { isAdmin } = useAuth()
  const { grabaciones, total, hayMas, cargando, trayendoMas, error, sinTabla, cargarMas } =
    useGrabaciones()

  const [viendo, setViendo] = useState<GrabacionVista | null>(null)
  const [panelAbierto, setPanelAbierto] = useState(false)

  return (
    <div className={styles.wrap}>
      <div className={styles.cabecera}>
        <p className={styles.intro}>
          Las grabaciones de los encuentros, de la más reciente hacia atrás.
          Los próximos se anuncian en el canal de Telegram.
        </p>
        {isAdmin && (
          <button
            type="button"
            className={styles.gestionar}
            onClick={() => setPanelAbierto(true)}
          >
            <Settings size={13} aria-hidden /> Gestionar
          </button>
        )}
      </div>

      {error && (
        <p className={styles.error} role="status">
          {error}
        </p>
      )}

      {/* La tabla todavía no existe. Para la Red esto es un archivo vacío —y
          es verdad, no hay grabaciones—, así que el aviso es solo para quien
          puede arreglarlo. A los demás no se les cuenta una obra interna. */}
      {sinTabla && isAdmin && (
        <p className={styles.error} role="status">
          Falta correr <code>docs/sql/encuentros_grabaciones.sql</code> en
          Supabase. Hasta entonces esto se queda vacío.
        </p>
      )}

      {cargando ? (
        <p className={styles.cargando}>
          <Loader2 size={14} className={styles.spin} aria-hidden /> Cargando el archivo…
        </p>
      ) : grabaciones.length === 0 ? (
        <div className={styles.vacio}>
          <Film size={26} aria-hidden />
          <p>Todavía no hay ninguna grabación publicada.</p>
          <span>
            {isAdmin
              ? "Súbela a VTurb, copia su código con el icono </> y pégalo en «Gestionar»."
              : "Cuando se grabe el primer encuentro, aparecerá aquí."}
          </span>
        </div>
      ) : (
        <>
          <ul className={styles.rejilla}>
            {grabaciones.map((g) => (
              <li key={g.id} className={styles.tarjeta}>
                <button
                  type="button"
                  className={styles.abrir}
                  onClick={() => setViendo(g)}
                  aria-label={`Ver «${g.titulo}»`}
                >
                  {g.miniatura ? (
                    /* Imagen de otro dominio y de tamaño desconocido: va con
                       <img> normal, no con el componente de Next, que exigiría
                       declarar converteai.net en la configuración y romper el
                       despliegue el día que VTurb cambie de dominio. */
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={g.miniatura}
                      alt=""
                      className={styles.miniatura}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className={styles.sinMiniatura}>
                      <Video size={30} aria-hidden />
                    </span>
                  )}
                  <span className={styles.play}>
                    <span className={styles.playCirculo}>
                      <Play size={20} fill="currentColor" aria-hidden />
                    </span>
                  </span>
                </button>

                <div className={styles.cuerpo}>
                  <p className={styles.meta}>
                    <CalendarDays size={11} aria-hidden /> {fechaCorta(g.fecha)}
                    {g.borrador && (
                      <span className={styles.selloBorrador}>Borrador</span>
                    )}
                  </p>
                  <h3 className={styles.titulo}>{g.titulo}</h3>
                  {g.descripcion && <p className={styles.desc}>{g.descripcion}</p>}
                  {/* Copiar el enlace sin tener que abrir la grabación: es lo
                      que se hace cuando ya sabes cuál quieres mandar. */}
                  <div className={styles.pie}>
                    <CompartirGrabacion id={g.id} titulo={g.titulo} compacto />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {hayMas && (
            <div className={styles.masWrap}>
              <button
                type="button"
                className={styles.mas}
                onClick={() => void cargarMas()}
                disabled={trayendoMas}
              >
                {trayendoMas ? (
                  <>
                    <Loader2 size={13} className={styles.spin} aria-hidden /> Trayendo…
                  </>
                ) : (
                  "Ver más grabaciones"
                )}
              </button>
              <span className={styles.cuantas}>
                {grabaciones.length} de {total}
              </span>
            </div>
          )}
        </>
      )}

      {/* El modal existe siempre en el árbol, así que el reproductor se pinta
          solo cuando hay una grabación elegida. Si no, el script de VTurb se
          cargaría al entrar en la pestaña, sin que nadie haya pulsado nada. */}
      <Modal
        open={!!viendo}
        onClose={() => setViendo(null)}
        title={viendo?.titulo}
        maxWidth={1000}
      >
        {viendo && (
          <div>
            <p className={styles.vistaMeta}>
              <CalendarDays size={12} aria-hidden /> {fechaLarga(viendo.fecha)}
            </p>
            <VturbPlayer
              script={viendo.script}
              iframe={viendo.iframe}
              elementoId={viendo.elementoId}
              titulo={viendo.titulo}
            />
            {/* Compartir vive SOLO en la rejilla, antes de abrir nada. Aquí
                dentro competía con el vídeo: quien ya le dio al play viene a
                ver, no a repartir enlaces. */}
            {viendo.descripcion && (
              <p className={styles.vistaDesc}>{viendo.descripcion}</p>
            )}
          </div>
        )}
      </Modal>

      {isAdmin && panelAbierto && (
        <GrabacionesManagerModal
          open={panelAbierto}
          onClose={() => setPanelAbierto(false)}
        />
      )}
    </div>
  )
}

/**
 * Las fechas se pintan en el navegador, nunca en el servidor.
 *
 * El servidor vive en UTC. Una fecha formateada allí sale con el día de otro
 * huso para media América, y una grabación del día 15 aparece como del 14.
 * Solo el navegador sabe en qué huso está quien mira.
 */
function fechaCorta(iso: string): string {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("es-419", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

function fechaLarga(iso: string): string {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("es-419", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return iso
  }
}
