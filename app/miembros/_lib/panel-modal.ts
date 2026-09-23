"use client"

// EL COMPORTAMIENTO COMÚN DE LOS PANELES A PANTALLA COMPLETA.
//
// Numerología Cósmica, Código de Origen, Cartografía Estelar y Lugares de
// Contacto abren todos lo mismo: una capa fija sobre la página con un panel
// dentro. Cada uno lo había resuelto por su cuenta, y cada copia arrastraba
// un fallo distinto. Esto lo unifica.
//
// ── LOS TRES FALLOS QUE ARREGLA ────────────────────────────────────────────
//
// 1 · EL FONDO CERRABA CUANDO NO DEBÍA.
//     La comprobación era `e.target === e.currentTarget` en el click. Parece
//     bastar, pero cuando al pulsar un botón la pantalla cambia entera —el
//     formulario da paso al resultado, por ejemplo— el elemento que recibió
//     el ratón desaparece antes de que el navegador termine el gesto, y el
//     click acaba atribuido al ancestro común: el fondo. El panel se cerraba
//     solo justo después de darle al botón principal.
//
//     Ahora hace falta que el gesto EMPIECE y TERMINE en el fondo. Un botón
//     que se desvanece a mitad de camino ya no cierra nada.
//
// 2 · EL BLOQUEO DEL FONDO SE MONTABA Y DESMONTABA SIN PARAR.
//     El efecto dependía de `onClose`, que en todos los casos llega como una
//     función escrita en el sitio: cambia de identidad en cada render del
//     componente de arriba. Cada vez, el efecto se deshacía y se rehacía, y
//     con él la posición de la página. De ahí la sensación de pantalla
//     entrecortada. Aquí `onClose` vive en una referencia y el efecto corre
//     UNA vez.
//
// 3 · EN iOS LA PÁGINA DE DETRÁS SE MOVÍA IGUAL.
//     `overflow: hidden` en el cuerpo no basta en Safari. Hay que fijarlo y
//     compensar el desplazamiento, y devolverlo al cerrar para no perder el
//     sitio donde estaba la persona. Lo hacía solo uno de los cuatro.
//
// 4 · EN EL MÓVIL, CERRAR EL TECLADO CERRABA EL PANEL.
//     Chrome en Android emite un `keydown` con la tecla Escape cuando se
//     oculta el teclado en pantalla, y ocultarlo es justo lo que pasa al
//     tocar un botón después de haber escrito en un campo. El panel entero
//     se cerraba en el momento de pulsar el botón principal, sin que nadie
//     hubiera tocado ninguna tecla.
//
//     Ahora Escape se comporta como en cualquier formulario: si el foco está
//     en un campo, la primera pulsación solo sale del campo; solo la segunda
//     —ya fuera— cierra el panel.

import { useCallback, useEffect, useRef, useState } from "react"

type PropsDelFondo = {
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void
}

/**
 * Solo el gesto del fondo, sin bloquear el cuerpo ni escuchar Escape.
 *
 * Para los paneles que se abren DENTRO de otro ya abierto: el de fuera ya
 * bloqueó la página y ya escucha la tecla. Volver a hacerlo aquí guardaría
 * "hidden" como estado anterior y dejaría la página sin desplazamiento al
 * cerrar, y una sola pulsación de Escape cerraría los dos a la vez.
 */
export function usePropsDelFondo(onClose: () => void): PropsDelFondo {
  const cerrar = useRef(onClose)
  useEffect(() => { cerrar.current = onClose })

  const empezoEnElFondo = useRef(false)

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    empezoEnElFondo.current = e.target === e.currentTarget
  }, [])

  const onClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const enElFondo = e.target === e.currentTarget && empezoEnElFondo.current
    empezoEnElFondo.current = false
    if (enElFondo) cerrar.current()
  }, [])

  return { onPointerDown, onClick }
}

export function usePanelAPantallaCompleta(onClose: () => void): {
  /** false en el primer render: createPortal necesita que exista el documento. */
  montado: boolean
  /** Se reparten sobre el div del fondo. */
  propsDelFondo: PropsDelFondo
} {
  // `onClose` cambia de identidad en cada render de quien nos usa. Guardarlo
  // en una referencia permite que el efecto de abajo no dependa de él.
  const cerrar = useRef(onClose)
  useEffect(() => { cerrar.current = onClose })

  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)

    const y = window.scrollY
    const previo = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    }
    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.top = `-${y}px`
    document.body.style.width = "100%"

    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (escapeEsDelTeclado(e)) {
        // Sale del campo y no cierra nada. Quien quiera cerrar de verdad
        // vuelve a pulsar Escape, ya sin el foco dentro del formulario.
        const el = document.activeElement
        if (el instanceof HTMLElement) el.blur()
        return
      }
      cerrar.current()
    }
    window.addEventListener("keydown", esc)

    return () => {
      document.body.style.overflow = previo.overflow
      document.body.style.position = previo.position
      document.body.style.top = previo.top
      document.body.style.width = previo.width
      window.scrollTo(0, y)
      window.removeEventListener("keydown", esc)
    }
  }, [])

  const empezoEnElFondo = useRef(false)

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    empezoEnElFondo.current = e.target === e.currentTarget
  }, [])

  const onClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const enElFondo = e.target === e.currentTarget && empezoEnElFondo.current
    empezoEnElFondo.current = false
    if (enElFondo) cerrar.current()
  }, [])

  return { montado, propsDelFondo: { onPointerDown, onClick } }
}

/**
 * ¿Este Escape lo escribió una persona, o lo emitió el teclado del móvil al
 * esconderse?
 *
 * No hay forma de preguntarlo directamente, pero sí de distinguir el caso que
 * importa: el teclado en pantalla solo está abierto cuando el foco está en un
 * campo de texto. Si el foco está ahí, se trata la pulsación como "salir del
 * campo", que es lo que hace cualquier formulario, y el panel no se cierra.
 *
 * El caso real que arregla: en Chrome de Android, tocar un botón después de
 * haber escrito en un campo esconde el teclado, y esconderlo emite un keydown
 * de Escape. El panel se cerraba justo al pulsar el botón principal.
 */
function escapeEsDelTeclado(e: KeyboardEvent): boolean {
  const destino = (e.target as HTMLElement | null) ?? document.activeElement
  if (!(destino instanceof HTMLElement)) return false
  if (destino.isContentEditable) return true
  const etiqueta = destino.tagName
  return etiqueta === "INPUT" || etiqueta === "TEXTAREA" || etiqueta === "SELECT"
}
