"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  INSTALAR LA PLATAFORMA EN EL TELÉFONO · la invitación
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ HACE FALTA INVITAR ─────────────────────────────────────────────
// En iPhone, las notificaciones web NO funcionan desde una pestaña de Safari.
// Punto. Apple solo las entrega a una web añadida a la pantalla de inicio. Así
// que para buena parte de La Red, «activar los avisos» empieza por un paso que
// nadie va a descubrir solo, porque está escondido detrás del botón de
// compartir.
//
// En Android no es obligatorio, pero instalada se abre a pantalla completa y
// los avisos llegan con el icono de la plataforma en vez del de Chrome.
//
// ── LO QUE ESTO NO HACE, Y NO VA A HACER ───────────────────────────────────
// No bloquea nada. No es un muro, no tapa la pantalla, no exige instalar para
// seguir. Quien use la plataforma desde el navegador del ordenador tiene que
// poder seguir haciéndolo exactamente igual, hoy y siempre: es una tarjeta en
// una esquina con una equis.
//
// ── CUÁNDO APARECE ─────────────────────────────────────────────────────────
// No en la primera visita. Alguien que acaba de entrar por primera vez está
// mirando qué es esto, no decidiendo si lo quiere en su pantalla de inicio, y
// una invitación ahí es una interrupción antes de haber dado nada.
//
// A partir de la segunda, y después de medio minuto dentro: el tiempo es la
// señal de que de verdad está usando la plataforma y no se equivocó de
// pestaña.
//
// ── Y CUÁNDO DEJA DE APARECER ──────────────────────────────────────────────
// «Ahora no» la calla un mes. La equis, también. No hay una forma de decir
// «nunca» porque tampoco hace falta: un mes es tiempo de sobra para que deje
// de ser molesta, y quien la vea trece veces es porque entra cada día desde el
// navegador, que es precisamente a quien le compensa instalarla.
//
// Nada de esto viaja al servidor: es una preferencia de ESTE teléfono, y el
// mismo dispositivo es el que sabe si está instalada o no.

import { useEffect, useState } from "react"
import { Download, Plus, Share, X } from "lucide-react"
import { estaInstalada, esIOS } from "../_lib/push-cliente"
import estilos from "./InvitarAInstalar.module.css"

const CLAVE_SILENCIO = "los144k_instalar_silencio"
const CLAVE_VISITAS = "los144k_visitas"

/** Lo que calla la invitación cuando alguien dice «ahora no». */
const UN_MES = 30 * 24 * 60 * 60 * 1000

/** Lo que se espera dentro antes de ofrecerla. */
const ESPERA_MS = 30_000

/**
 * El evento que Chrome lanza cuando la web se puede instalar.
 *
 * No está en los tipos del DOM porque no es estándar: solo lo implementan los
 * navegadores basados en Chromium. En iPhone no existe y nunca existirá, que
 * es justo por lo que ahí hay que explicar los pasos a mano.
 */
type EventoInstalacion = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function silenciada(): boolean {
  try {
    const hasta = Number(localStorage.getItem(CLAVE_SILENCIO) || 0)
    return Number.isFinite(hasta) && hasta > Date.now()
  } catch {
    // Sin almacenamiento —ventana privada, cookies bloqueadas— se asume que
    // no está silenciada. Es menos malo enseñarla de más que no poder
    // enseñarla nunca a quien sí la necesita.
    return false
  }
}

function silenciar() {
  try { localStorage.setItem(CLAVE_SILENCIO, String(Date.now() + UN_MES)) } catch { /* da igual */ }
}

/** Cuenta esta visita y devuelve cuántas van. */
function contarVisita(): number {
  try {
    const n = Number(localStorage.getItem(CLAVE_VISITAS) || 0) + 1
    localStorage.setItem(CLAVE_VISITAS, String(n))
    return n
  } catch {
    // Sin almacenamiento no se puede contar. Se devuelve 1 —como si fuera la
    // primera— para pecar de discreto.
    return 1
  }
}

export function InvitarAInstalar() {
  const [visible, setVisible] = useState(false)
  const [evento, setEvento] = useState<EventoInstalacion | null>(null)
  const [iphone, setIphone] = useState(false)

  useEffect(() => {
    // Ya instalada: no hay nada que ofrecer. Es la comprobación más barata y
    // va primera.
    if (estaInstalada()) return
    if (silenciada()) return

    const visitas = contarVisita()
    if (visitas < 2) return

    const enIOS = esIOS()
    setIphone(enIOS)

    // ── ANDROID: SE ESPERA AL NAVEGADOR ───────────────────────────────────
    // `beforeinstallprompt` es la única forma honesta de saber que el botón
    // de instalar va a hacer algo. Si el navegador no lo lanza —ya está
    // instalada, no cumple los requisitos, o es un navegador que no lo
    // soporta— no se enseña ningún botón, porque no habría nada detrás.
    const alPoderInstalar = (e: Event) => {
      // Sin esto, Chrome enseña ADEMÁS su propia barra, y salen dos
      // invitaciones a la vez diciendo lo mismo.
      e.preventDefault()
      setEvento(e as EventoInstalacion)
    }
    window.addEventListener("beforeinstallprompt", alPoderInstalar)

    const reloj = window.setTimeout(() => setVisible(true), ESPERA_MS)

    // Si la instalan —por aquí o por el menú del navegador— la tarjeta sobra.
    const alInstalar = () => { setVisible(false); silenciar() }
    window.addEventListener("appinstalled", alInstalar)

    return () => {
      window.removeEventListener("beforeinstallprompt", alPoderInstalar)
      window.removeEventListener("appinstalled", alInstalar)
      window.clearTimeout(reloj)
    }
  }, [])

  // En iPhone se explican los pasos. Fuera de iPhone solo se ofrece si el
  // navegador ha dicho que se puede: un botón de instalar que no instala es
  // peor que no tener botón.
  if (!visible) return null
  if (!iphone && !evento) return null

  const cerrar = () => { setVisible(false); silenciar() }

  const instalar = async () => {
    if (!evento) return
    setVisible(false)
    try {
      await evento.prompt()
      // Se mire lo que se mire, el evento solo sirve una vez: el navegador no
      // lo vuelve a lanzar hasta que se den de nuevo las condiciones.
      await evento.userChoice
    } catch {
      /* si el navegador se niega, se queda como estaba */
    }
    silenciar()
    setEvento(null)
  }

  return (
    <div className={estilos.caja} role="complementary" aria-label="Instalar la plataforma">
      <div className={estilos.cabecera}>
        <Download size={15} color="#a78bca" />
        <span className={estilos.titulo}>Tenla a mano</span>
        <button type="button" onClick={cerrar} className={estilos.cerrar} aria-label="Cerrar">
          <X size={14} />
        </button>
      </div>

      {iphone ? (
        <>
          <p className={estilos.texto}>
            Añade <strong>Los 144.000</strong> a tu pantalla de inicio: se abre como una
            aplicación y es la única forma de que el iPhone te deje recibir los avisos.
          </p>
          <ol className={estilos.pasos}>
            <li>
              Toca <Share size={12} style={{ verticalAlign: "-2px" }} />{" "}
              <strong>Compartir</strong>, abajo
            </li>
            <li>
              Baja y elige <Plus size={12} style={{ verticalAlign: "-2px" }} />{" "}
              <strong>Añadir a pantalla de inicio</strong>
            </li>
          </ol>
          <div className={estilos.acciones}>
            <button type="button" onClick={cerrar} className={estilos.ahoraNo}>
              Ahora no
            </button>
          </div>
        </>
      ) : (
        <>
          <p className={estilos.texto}>
            Instálala en este dispositivo y se abrirá a pantalla completa, con su propio
            icono. Sigue siendo la misma plataforma: no ocupa casi nada.
          </p>
          <div className={estilos.acciones}>
            <button type="button" onClick={instalar} className={estilos.boton}>
              <Download size={13} /> Instalar
            </button>
            <button type="button" onClick={cerrar} className={estilos.ahoraNo}>
              Ahora no
            </button>
          </div>
        </>
      )}
    </div>
  )
}
