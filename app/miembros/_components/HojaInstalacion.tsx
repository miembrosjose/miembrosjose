"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  INSTALAR LOS 144.000 EN EL TELÉFONO · la invitación
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ HACE FALTA INVITAR ─────────────────────────────────────────────
// En iPhone y iPad, las notificaciones web NO funcionan desde una pestaña de
// Safari. Apple solo las entrega a una web añadida a la pantalla de inicio.
// Así que para buena parte de La Red, «activar los avisos» empieza por un
// paso escondido detrás del botón de compartir, que nadie va a descubrir solo.
//
// En Android no es obligatorio, pero instalada se abre a pantalla completa y
// los avisos llegan con el icono de la plataforma en vez del del navegador.
//
// ── LO QUE ESTO NO HACE, Y NO VA A HACER ───────────────────────────────────
// No bloquea. Se cierra tocando fuera, con la tecla de escape o con el «ahora
// no», que es texto subrayado y no un enlace escondido. Quien use la
// plataforma desde el navegador del ordenador tiene que poder seguir
// haciéndolo exactamente igual, hoy y siempre.
//
// ── POR QUÉ NO HAY BOTÓN DE INSTALAR EN IPHONE ─────────────────────────────
// Porque esa capacidad no existe. iOS no tiene nada parecido a
// `beforeinstallprompt`, y un botón que dijera «Instalar» y abriera unas
// instrucciones es prometer algo que no ocurre. Allí el botón dice lo que
// hace: «Ver cómo instalar».

import { useEffect, useState } from "react"
import { ArrowUpFromLine, BookOpen, Check, Home, Plus, Share, Sparkles } from "lucide-react"
import { usePwa } from "../_lib/pwa-contexto"
import type { Aparato } from "../_lib/push-cliente"
import estilos from "./HojaInstalacion.module.css"

const VENTAJAS = [
  { icono: Home, texto: "Accede directamente desde tu pantalla de inicio." },
  { icono: BookOpen, texto: "Continúa tus enseñanzas y tu preparación." },
  { icono: Sparkles, texto: "Recibe avisos de nuevos recursos y contenidos." },
  { icono: Check, texto: "Mantente informado de las comunicaciones de la Red." },
]

/**
 * Los pasos, uno por aparato.
 *
 * ── POR QUÉ NO SE ENSEÑAN LOS TRES ─────────────────────────────────────────
 * Porque leer instrucciones de iPhone, iPad y Android para encontrar la tuya
 * es trabajo que puede hacer la plataforma. Y porque dos de las tres van a
 * estar mal para quien mira.
 *
 * ── Y POR QUÉ EL IPAD TIENE LAS SUYAS ──────────────────────────────────────
 * Porque el botón de compartir está en otro sitio: abajo en el centro en el
 * iPhone, arriba a la derecha en el iPad. Decirle a alguien que mire abajo
 * cuando está arriba es dejarlo buscando y concluir que esto no funciona.
 */
function Pasos({ aparato }: { aparato: Aparato }) {
  if (aparato === "iphone") {
    return (
      <ol className={estilos.pasos}>
        <li>Abre esta página en <strong>Safari</strong>, si no lo estás ya.</li>
        <li>
          Toca <Share size={13} style={{ verticalAlign: "-2px" }} /> <strong>Compartir</strong>,
          abajo en el centro.
        </li>
        <li>Baja y elige <Plus size={13} style={{ verticalAlign: "-2px" }} /> <strong>Añadir a pantalla de inicio</strong>.</li>
        <li>Si aparece <strong>Abrir como app web</strong>, déjalo activado.</li>
        <li>Confirma con <strong>Añadir</strong>.</li>
        <li>Abre Los 144.000 desde su nuevo icono.</li>
      </ol>
    )
  }

  if (aparato === "ipad") {
    return (
      <ol className={estilos.pasos}>
        <li>Abre esta página en <strong>Safari</strong>, si no lo estás ya.</li>
        <li>
          Toca <Share size={13} style={{ verticalAlign: "-2px" }} /> <strong>Compartir</strong>,
          arriba a la derecha.
        </li>
        <li>Elige <Plus size={13} style={{ verticalAlign: "-2px" }} /> <strong>Añadir a pantalla de inicio</strong>.</li>
        <li>Confirma con <strong>Añadir</strong>.</li>
        <li>Abre Los 144.000 desde su nuevo icono.</li>
      </ol>
    )
  }

  if (aparato === "android") {
    return (
      <ol className={estilos.pasos}>
        <li>Abre el <strong>menú</strong> de tu navegador, arriba a la derecha.</li>
        <li>Elige <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong>.</li>
        <li>Confirma.</li>
        <li>Abre Los 144.000 desde su nuevo icono.</li>
      </ol>
    )
  }

  // ── CUANDO NO SE SABE QUÉ APARATO ES ──────────────────────────────────
  // Unas instrucciones equivocadas son peores que unas generales: quien lee
  // «toca Compartir abajo» donde eso no existe concluye que la plataforma
  // está rota. Esto no acierta el sitio exacto, pero nunca miente.
  return (
    <ol className={estilos.pasos}>
      <li>Abre el <strong>menú</strong> de tu navegador.</li>
      <li>
        Busca <strong>Instalar aplicación</strong>, <strong>Añadir a pantalla de inicio</strong> o
        algo parecido: cada navegador lo llama distinto.
      </li>
      <li>Confirma y abre Los 144.000 desde su nuevo icono.</li>
    </ol>
  )
}

export function HojaInstalacion({
  onCerrar, onInstalada,
}: {
  /** «Ahora no», tocar fuera o Escape. Quien llama decide cuánto callarla. */
  onCerrar: () => void
  /** Aceptó el instalador del navegador. Solo ocurre en Android. */
  onInstalada?: () => void
}) {
  const { aparato, puedeInstalarSola, instalar } = usePwa()
  // En iPhone y iPad no hay instalador: los pasos se enseñan desde el
  // principio, porque esconderlos tras un botón sería un clic de adorno.
  const [verPasos, setVerPasos] = useState(aparato === "iphone" || aparato === "ipad")
  const [instalando, setInstalando] = useState(false)

  // Escape cierra. Es lo que espera cualquiera que haya usado una hoja así, y
  // es también la salida de quien navega con teclado.
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar() }
    window.addEventListener("keydown", alPulsar)
    return () => window.removeEventListener("keydown", alPulsar)
  }, [onCerrar])

  const pulsarPrincipal = async () => {
    if (puedeInstalarSola) {
      setInstalando(true)
      const acepto = await instalar()
      setInstalando(false)
      if (acepto) onInstalada?.()
      // Si dijo que no en el diálogo del navegador, la hoja se queda: puede
      // que quiera leer los pasos. Cerrarla sería decidir por él.
      else setVerPasos(true)
      return
    }
    setVerPasos(true)
  }

  return (
    <div
      className={estilos.fondo}
      role="dialog"
      aria-modal="true"
      aria-label="Instalar Los 144.000"
      // Tocar fuera cierra. El clic se comprueba contra el fondo mismo para
      // que arrastrar desde dentro hasta fuera no la cierre sin querer.
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div className={estilos.hoja}>
        <div className={estilos.asidero} />

        <p className={estilos.marca}>Los 144.000</p>
        <h2 className={estilos.titulo}>Lleva la Red contigo.</h2>
        <p className={estilos.texto}>
          Instala Los 144.000 en tu teléfono para acceder fácilmente a tu preparación,
          explorar nuevos recursos y mantenerte conectado con nuestra comunidad.
        </p>

        <ul className={estilos.ventajas}>
          {VENTAJAS.map((v) => (
            <li key={v.texto} className={estilos.ventaja}>
              <v.icono size={15} className={estilos.ventajaIcono} />
              <span>{v.texto}</span>
            </li>
          ))}
        </ul>

        {verPasos && <Pasos aparato={aparato} />}

        <div className={estilos.acciones}>
          {/* El botón dice lo que hace. Donde el navegador sabe instalar,
              instala; donde hay que explicarlo, lo explica. Nunca «Instalar»
              para después enseñar unos pasos. */}
          {!verPasos || puedeInstalarSola ? (
            <button type="button" onClick={pulsarPrincipal} disabled={instalando} className={estilos.principal}>
              {puedeInstalarSola
                ? <><ArrowUpFromLine size={14} /> {instalando ? "Instalando…" : "Instalar aplicación"}</>
                : <><Share size={14} /> Ver cómo instalar</>}
            </button>
          ) : null}

          <button type="button" onClick={onCerrar} className={estilos.secundaria}>
            Ahora no, continuar a la plataforma
          </button>
        </div>

        <p className={estilos.nota}>
          No pierdes nada por no instalarla: todo funciona igual desde el navegador.
          {(aparato === "iphone" || aparato === "ipad") &&
            " Lo único que necesita la aplicación son los avisos en el teléfono."}
        </p>
      </div>
    </div>
  )
}
