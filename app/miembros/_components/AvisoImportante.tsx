"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  EL AVISO QUE INTERRUMPE · una vez, y nunca más
// ═══════════════════════════════════════════════════════════════════════════
//
// Enseña la primera comunicación interna marcada como `modal_once` que esta
// persona no haya cerrado todavía. Hoy se usa para el canal de Telegram, pero
// no sabe nada de Telegram: enseña lo que administración haya escrito.
//
// ── POR QUÉ NO ES «EL MODAL DE TELEGRAM» ──────────────────────────────────
// Porque dentro de tres meses habrá otro aviso que no se puede pasar por
// alto, y un componente que supiera de Telegram obligaría a escribir el
// segundo desde cero. Lo que no cambia es la mecánica —interrumpir, poder
// cerrar, no volver— y eso es lo que está aquí.
//
// ── POR QUÉ EL ESTADO NO VIVE EN EL NAVEGADOR ─────────────────────────────
// `localStorage` es de ESTE navegador. Quien entre desde el móvil, desde otro
// ordenador o después de limpiar los datos volvería a verlo, y un aviso que
// reaparece deja de leerse: se cierra de memoria. La marca se guarda en el
// servidor, contra la cuenta.
//
// ── SIEMPRE SE PUEDE CERRAR ────────────────────────────────────────────────
// Bloquea lo de detrás, no la salida. Hay equis, hay «cerrar» y responde a
// Escape. Lo que no hace es cerrarse al tocar fuera: eso se pulsa sin querer,
// y entonces el aviso se habría «visto» sin que nadie lo leyera.

import { useCallback, useEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import { marcarBloqueo } from "../_lib/bloqueo"
import { pedirTelegram } from "../_lib/abrir-telegram"
import s from "./aviso-importante.module.css"

type Aviso = {
  id: string
  titulo: string
  cuerpo: string
  imagen_url: string | null
  cta_text: string | null
  cta_url: string | null
  /**
   * Qué hace el botón, cuando no es ir a una dirección.
   *
   * ── POR QUÉ NO BASTA CON UNA URL ────────────────────────────────────────
   * Para Telegram no hay ninguna que se pueda escribir: la del grupo es
   * personal, se fabrica a nombre de quien la pide y caduca. Una fija
   * saltaría la comprobación de suscripción, y una personal no cabe en una
   * comunicación que leen setenta personas distintas.
   *
   * Así que el aviso no lleva a ningún sitio: pide que se abra lo que ya
   * sabe abrirse.
   */
  cta_accion: "telegram" | null
}

/** Lo que la vista previa de administración pasa a mano, sin tocar la base. */
export type AvisoDePrueba = Aviso & { deMentira: true }

export function AvisoImportante({ prueba }: { prueba?: AvisoDePrueba | null }) {
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [cerrando, setCerrando] = useState(false)
  const cerrarRef = useRef<HTMLButtonElement | null>(null)

  // En vista previa no se pregunta al servidor: se enseña lo que llega.
  const esPrueba = !!prueba

  useEffect(() => {
    if (prueba) { setAviso(prueba); return }

    let vivo = true
    void (async () => {
      try {
        const r = await fetch("/api/comunicaciones/mias", { credentials: "include" })
        if (!r.ok) return
        const j = await r.json()
        if (vivo && j?.bloqueante) setAviso(j.bloqueante as Aviso)
      } catch {
        // Sin conexión no se interrumpe a nadie. El aviso sigue pendiente en
        // el servidor y saldrá la próxima vez.
      }
    })()
    return () => { vivo = false }
  }, [prueba])

  // ── ABRIR UNA CONCRETA, DESDE LA CAMPANA ───────────────────────────────
  //
  // En la campana solo caben el titular y dos líneas. Una comunicación con
  // texto largo o con botón ahí no se puede usar: hay que poder abrirla.
  //
  // Se reutiliza esta misma ventana en vez de escribir un lector aparte,
  // porque ya sabe hacer todo lo que haría ese lector —pintar el cuerpo,
  // el botón, la acción de Telegram, marcar como leída— y dos componentes
  // que enseñan lo mismo acaban enseñándolo distinto.
  //
  // La única diferencia: esta no bloquea nada. Se abre porque alguien la
  // pidió, así que cerrarla tocando fuera es lo que se espera.
  useEffect(() => {
    if (prueba) return
    const oyente = async (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      if (!id) return
      try {
        const r = await fetch("/api/comunicaciones/mias", { credentials: "include" })
        if (!r.ok) return
        const j = await r.json()
        const uno = (j.lista as Aviso[] | undefined)?.find((c) => c.id === id)
        if (uno) setAviso(uno)
      } catch { /* silencioso: se queda en la campana */ }
    }
    window.addEventListener("los144k:ver-comunicacion", oyente)
    return () => window.removeEventListener("los144k:ver-comunicacion", oyente)
  }, [prueba])

  // ── MARCAR Y CERRAR ──────────────────────────────────────────────────────
  // Se cierra en cuanto la persona lo pide, sin esperar al servidor. Si la
  // petición falla, el aviso volverá la próxima vez: es molesto, pero es
  // mucho mejor que una ventana que se queda clavada porque la red va mal.
  const cerrar = useCallback(async (via: "cerrada" | "cta") => {
    if (!aviso || cerrando) return
    setCerrando(true)
    setAviso(null)

    if (esPrueba) return   // una vista previa no marca nada

    try {
      await fetch(`/api/comunicaciones/${aviso.id}/leida`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ via }),
      })
    } catch { /* volverá a salir; no se pierde nada */ }
  }, [aviso, cerrando, esPrueba])

  // ── EL FOCO Y EL TECLADO ────────────────────────────────────────────────
  // Al abrirse, el foco va al botón de cerrar: quien navega con teclado tiene
  // la salida en la primera pulsación, no después de recorrer la ventana.
  useEffect(() => {
    if (!aviso) return
    cerrarRef.current?.focus()

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); void cerrar("cerrada") }
    }
    document.addEventListener("keydown", alTeclear)

    // Se bloquea el desplazamiento de detrás. Sin esto, en el móvil se
    // arrastra la página entera por debajo de la ventana.
    const antes = document.body.style.overflow
    document.body.style.overflow = "hidden"

    // Y se avisa al resto. La invitación a instalar sale a los treinta
    // segundos: sin esto, quien se quede leyendo el aviso se encuentra las
    // dos ventanas una encima de otra.
    marcarBloqueo(true)

    return () => {
      document.removeEventListener("keydown", alTeclear)
      document.body.style.overflow = antes
      marcarBloqueo(false)
    }
  }, [aviso, cerrar])

  if (!aviso) return null

  const hayEnlace = !!(aviso.cta_text && aviso.cta_url)
  const hayAccion = !!(aviso.cta_text && aviso.cta_accion)

  return (
    <div
      className={s.fondo}
      role="dialog"
      aria-modal="true"
      aria-labelledby="aviso-titulo"
      // Sin `onClick` de cierre a propósito: tocar fuera no cuenta como
      // haberlo leído.
    >
      <div className={s.ventana}>
        <button
          ref={cerrarRef}
          type="button"
          onClick={() => void cerrar("cerrada")}
          aria-label="Cerrar el aviso"
          className={s.equis}
        >
          <X size={18} />
        </button>

        {esPrueba && <p className={s.prueba}>Vista previa · no se marca como leído</p>}

        <p className={s.kicker}>Importante</p>
        <h2 id="aviso-titulo" className={s.titulo}>{aviso.titulo}</h2>

        {aviso.imagen_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={aviso.imagen_url} alt="" className={s.imagen} />
        )}

        {/* El cuerpo llega como texto, no como HTML: lo escribe
            administración y se pinta tal cual, respetando los saltos de
            línea. Nada de `dangerouslySetInnerHTML` en una ventana que ve
            todo el mundo. */}
        <div className={s.cuerpo}>
          {aviso.cuerpo.split(/\n{2,}/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className={s.botones}>
          {/* ── EL BOTÓN QUE HACE ALGO AQUÍ DENTRO ────────────────────────
              La petición sale ANTES de marcar nada. El botón flotante abre
              una pestaña antes de ir a buscar el enlace, y una pestaña
              abierta después de un `await` ya no cuenta como respuesta a un
              clic: el navegador la bloquea. Marcar primero metería esa
              espera por medio y el grupo se abriría en unos navegadores y en
              otros no. */}
          {hayAccion && (
            <button
              type="button"
              onClick={() => {
                if (aviso.cta_accion === "telegram") pedirTelegram()
                void cerrar("cta")
              }}
              className={s.principal}
            >
              {aviso.cta_text}
            </button>
          )}

          {hayEnlace && !hayAccion && (
            <a
              href={aviso.cta_url!}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => void cerrar("cta")}
              className={s.principal}
            >
              {aviso.cta_text}
            </a>
          )}
          <button
            type="button"
            onClick={() => void cerrar("cerrada")}
            className={s.secundario}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
