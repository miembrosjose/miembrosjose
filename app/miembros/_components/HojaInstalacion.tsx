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
// No bloquea, y no es una pantalla completa: queda margen por los cuatro
// lados y se ve lo que hay detrás. Se cierra tocando fuera, con la tecla de
// escape o con el «ahora no», que es texto subrayado y no un enlace
// escondido. Quien use la plataforma desde el navegador del ordenador tiene
// que poder seguir haciéndolo exactamente igual, hoy y siempre.
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
import { menuDe, queNavegador, type Navegador } from "../_lib/navegador"
import estilos from "./HojaInstalacion.module.css"

const VENTAJAS = [
  { icono: Home, texto: "Accede directamente desde tu pantalla de inicio." },
  { icono: BookOpen, texto: "Continúa tus enseñanzas y tu preparación." },
  { icono: Sparkles, texto: "Recibe avisos de nuevos recursos y contenidos." },
  { icono: Check, texto: "Mantente informado de las comunicaciones de la Red." },
]

/**
 * Los pasos, por aparato Y por navegador.
 *
 * ── POR QUÉ NO BASTA CON SABER QUÉ APARATO ES ──────────────────────────────
 * Porque el menú donde vive «añadir a pantalla de inicio» está en un sitio
 * distinto en cada navegador del MISMO iPhone. Las instrucciones decían
 * «toca ••• abajo, junto a la dirección», que es Safari; en Chrome para iOS
 * ese menú es ⋮ y está abajo a la derecha. Quien entraba desde Chrome miraba
 * donde no era.
 *
 * ── Y POR QUÉ A CHROME iOS NO SE LE MANDA A SAFARI ─────────────────────────
 * Porque no hace falta. Desde iOS 16.4 cualquier navegador puede añadir una
 * web a la pantalla de inicio: lo hace la hoja de compartir del sistema, no
 * el navegador. Mandarle a abrir Safari es un rodeo por nada, y además se
 * pierde por el camino la mitad de la gente.
 *
 * ── POR QUÉ NO SE ENSEÑAN TODAS A LA VEZ ───────────────────────────────────
 * Porque leer cinco juegos de instrucciones para encontrar el tuyo es trabajo
 * que puede hacer la plataforma. Y porque cuatro de los cinco van a estar mal
 * para quien mira.
 */
function Pasos({ aparato, navegador }: { aparato: Aparato; navegador: Navegador }) {
  const menu = menuDe(navegador)

  // ── iPHONE Y iPAD ────────────────────────────────────────────────────
  // El camino es el mismo en todos: el menú del navegador, compartir, y
  // añadir. Lo único que cambia es el símbolo del menú y dónde está — y eso
  // ya viene resuelto en `menuDe`.
  if (aparato === "iphone" || aparato === "ipad") {
    // En el iPad la barra es ancha y compartir sigue estando a la vista,
    // arriba a la derecha: no hay menú intermedio que atravesar.
    const directo = aparato === "ipad" && navegador === "safari"

    return (
      <>
        <ol className={estilos.pasos}>
          {directo ? (
            <li>
              Arriba a la derecha, toca <Share size={13} /> <strong>Compartir</strong>
            </li>
          ) : (
            <>
              <li>
                Toca <span className={estilos.tecla}>{menu.simbolo}</span> {menu.donde}
              </li>
              <li>
                Elige <Share size={13} /> <strong>Compartir</strong>
              </li>
            </>
          )}
          <li>
            Baja y elige <Plus size={13} /> <strong>Añadir a pantalla de inicio</strong>
          </li>
          <li>Confirma con <strong>Añadir</strong> y ábrela desde su nuevo icono.</li>
        </ol>
        {/* El nombre de esa opción cambia con el idioma y la versión del
            sistema. Decirlo evita que quien ve «Agregar a inicio» piense que
            no es lo mismo y se eche atrás. */}
        <p className={estilos.variante}>
          Según tu iPhone puede llamarse <strong>Agregar a inicio</strong>. Es lo mismo.
        </p>
      </>
    )
  }

  // ── ANDROID ──────────────────────────────────────────────────────────
  // Estos pasos solo se ven cuando el navegador NO ha ofrecido instalar por
  // su cuenta. Si lo ofreció, hay un botón de verdad y esto no aparece.
  if (aparato === "android") {
    if (navegador === "samsung") {
      return (
        <ol className={estilos.pasos}>
          <li>
            Toca <span className={estilos.tecla}>{menu.simbolo}</span> {menu.donde}
          </li>
          <li>
            Elige <strong>Agregar página a</strong> y luego{" "}
            <strong>Pantalla de inicio</strong>
          </li>
          <li>Confirma y ábrela desde su nuevo icono.</li>
        </ol>
      )
    }

    return (
      <ol className={estilos.pasos}>
        <li>
          Toca <span className={estilos.tecla}>{menu.simbolo}</span> {menu.donde}
        </li>
        <li>
          Elige <strong>Instalar aplicación</strong> o{" "}
          <strong>Añadir a pantalla de inicio</strong>, según cómo lo llame tu navegador.
        </li>
        <li>Confirma y ábrela desde su nuevo icono.</li>
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
      <li>Confirma y ábrela desde su nuevo icono.</li>
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
  // Se mira en el cliente: en el servidor no hay navegador que identificar.
  // Hasta que se sepa vale "otro", que da las instrucciones generales — y
  // eso dura un instante, porque la ventana no se abre en el primer dibujo.
  const [navegador, setNavegador] = useState<Navegador>("otro")
  useEffect(() => { setNavegador(queNavegador()) }, [])
  // En iPhone y iPad no hay instalador: los pasos se enseñan desde el
  // principio, porque esconderlos tras un botón sería un clic de adorno.
  const [verPasos, setVerPasos] = useState(aparato === "iphone" || aparato === "ipad")
  const [instalando, setInstalando] = useState(false)

  // Escape cierra. Es lo que espera cualquiera que haya usado una ventana así, y
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
      // Si dijo que no en el diálogo del navegador, la ventana se queda: puede
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
      <div className={estilos.ventana}>

        {/* El icono de verdad, el mismo que quedará en la pantalla de inicio.
            Enseñarlo no es decoración: es lo que va a buscar después entre sus
            aplicaciones, y reconocerlo aquí hace que lo encuentre luego. */}
        <img
          src="/icon-192.png"
          alt=""
          width={72}
          height={72}
          className={estilos.logo}
        />

        <p className={estilos.marca}>Los 144.000</p>
        <h2 className={estilos.titulo}>Instala la app de Los 144.000</h2>
        <p className={estilos.texto}>
          Añádela a tu pantalla de inicio para acceder fácilmente a tu preparación,
          explorar nuevos recursos y mantenerte conectado con la comunidad.
        </p>

        <ul className={estilos.ventajas}>
          {VENTAJAS.map((v) => (
            <li key={v.texto} className={estilos.ventaja}>
              <v.icono size={15} className={estilos.ventajaIcono} />
              <span>{v.texto}</span>
            </li>
          ))}
        </ul>

        {verPasos && <Pasos aparato={aparato} navegador={navegador} />}

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
            " Lo único que hace falta instalar es para recibir avisos: en iPhone y " +
            "iPad, Apple solo los entrega a la aplicación de la pantalla de inicio."}
        </p>
      </div>
    </div>
  )
}
