"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  EL CORREO ESCRITO A MANO · el editor
// ═══════════════════════════════════════════════════════════════════════════
//
// Un recuadro de texto con números de línea, tabulador que tabula, y la lista
// de lo que no va a funcionar al lado.
//
// ── POR QUÉ NO ES CODEMIRROR NI MONACO ────────────────────────────────────
// Porque pesan entre 300 KB y 2 MB, y entrarían en el paquete que carga TODO
// el panel de administración —no solo esta pantalla— para que dos personas
// escriban HTML unas cuantas veces al año.
//
// Lo que de verdad hace falta de un editor de código aquí es: ver en qué
// línea estás cuando el aviso dice «línea 12», que el tabulador no te saque
// del campo, y que el texto no se parta a mitad de etiqueta. Las tres cosas
// caben en un textarea bien puesto.
//
// Lo que se pierde es el coloreado. A cambio, la pantalla sigue cargando en
// un segundo en un móvil con mala conexión, que es desde donde se revisa esto
// la mitad de las veces.

import { useMemo, useRef, useState } from "react"
import { AlertTriangle, ImagePlus, Info, Loader2 } from "lucide-react"
import { revisarHtmlCorreo } from "@/lib/comunicaciones/html-correo"

export function EditorCodigo({
  valor, onCambio, editable,
}: {
  valor: string
  onCambio: (v: string) => void
  editable: boolean
}) {
  const area = useRef<HTMLTextAreaElement | null>(null)
  const numeros = useRef<HTMLDivElement | null>(null)
  const archivo = useRef<HTMLInputElement | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [errorSubida, setErrorSubida] = useState<string | null>(null)

  const lineas = useMemo(() => valor.split("\n").length, [valor])

  // Los avisos se calculan aquí, en el navegador, con la MISMA función que
  // usa el servidor al dibujar. Si fueran dos listas distintas, la pantalla
  // diría una cosa y el correo haría otra.
  const avisos = useMemo(() => revisarHtmlCorreo(valor), [valor])

  // ── EL TABULADOR TABULA ─────────────────────────────────────────────────
  // Por defecto saca del campo, que escribiendo HTML anidado es insufrible:
  // cada nivel de indentación te manda al botón de al lado.
  const alTeclear = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Tab") return
    e.preventDefault()
    const el = e.currentTarget
    const { selectionStart: a, selectionEnd: b } = el
    const nuevo = valor.slice(0, a) + "  " + valor.slice(b)
    onCambio(nuevo)
    // El cursor se repone después de pintar: si se moviera antes, React
    // volvería a dibujar el campo y lo mandaría al final del texto.
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = a + 2
    })
  }

  // ── INSERTAR UNA IMAGEN SIN SALIR DE AQUÍ ───────────────────────────────
  //
  // Sin esto, meter una imagen en un correo escrito a mano es: salir del
  // editor, subirla en otra pantalla, copiar la dirección, volver, encontrar
  // el sitio y escribir la etiqueta a mano. Seis pasos para algo que se hace
  // cuatro veces por correo.
  //
  // Se sube por la MISMA ruta que usa el formulario. No hay un segundo
  // almacenamiento ni un segundo sitio donde buscar las imágenes luego.
  const insertarImagen = async (f: File) => {
    setSubiendo(true)
    setErrorSubida(null)
    try {
      const fd = new FormData()
      fd.append("file", f)
      const r = await fetch("/api/admin/upload", { method: "POST", credentials: "include", body: fd })
      const j = await r.json()
      if (!r.ok || !j?.url) throw new Error(j?.error || "No se pudo subir")

      // ── LA ETIQUETA QUE SE INSERTA, Y POR QUÉ ASÍ ──────────────────────
      //   width="600"        Outlook necesita el atributo, no basta el CSS.
      //   max-width:100%     para que en el móvil no se salga.
      //   display:block      quita el hueco de tres píxeles que algunos
      //                      clientes dejan debajo tratándola como texto.
      //   border="0"         sin esto, una imagen dentro de un enlace sale
      //                      con marco azul en Outlook.
      //   alt=""             vacío Y a la vista, para que se note que falta
      //                      escribirlo: muchos clientes no cargan imágenes.
      const etiqueta =
        `<img src="${j.url}" alt="" width="600" border="0" ` +
        `style="display:block;width:100%;max-width:600px;height:auto;">`

      const el = area.current
      // Se inserta donde está el cursor, no al final: el final de un correo
      // es el pie, y nadie quiere la imagen ahí.
      const a = el?.selectionStart ?? valor.length
      const b = el?.selectionEnd ?? valor.length
      onCambio(valor.slice(0, a) + etiqueta + valor.slice(b))
      requestAnimationFrame(() => {
        if (!el) return
        el.focus()
        el.selectionStart = el.selectionEnd = a + etiqueta.length
      })
    } catch (e) {
      setErrorSubida(e instanceof Error ? e.message : "No se pudo subir")
    } finally {
      setSubiendo(false)
      // Se limpia para que subir DOS VECES la misma imagen vuelva a disparar
      // el evento: sin esto, la segunda vez no pasa nada y parece que falla.
      if (archivo.current) archivo.current.value = ""
    }
  }

  // Los números siguen al texto al desplazarse. Es la única manera de que
  // sirvan: una columna fija deja de corresponder en cuanto se baja.
  const alDesplazar = () => {
    if (numeros.current && area.current) {
      numeros.current.scrollTop = area.current.scrollTop
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          ref={archivo}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void insertarImagen(f)
          }}
        />
        <button
          type="button"
          disabled={!editable || subiendo}
          onClick={() => archivo.current?.click()}
          className="inline-flex items-center gap-2 border border-[#2a2a3a] px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-[#8a8fa8] transition-colors hover:border-[#6D4A9B] hover:text-[#c3b2e0] disabled:opacity-40"
        >
          {subiendo
            ? <><Loader2 size={12} className="animate-spin" /> Subiendo…</>
            : <><ImagePlus size={12} /> Insertar imagen</>}
        </button>
        <span className="text-[10px] text-[#5a5a6a]">Se pega donde esté el cursor.</span>
      </div>

      {errorSubida && (
        <p className="border border-red-900 bg-red-950/20 px-3 py-2 text-[11px] text-red-300">
          {errorSubida}
        </p>
      )}

      <div className="flex overflow-hidden border border-[#1f1f2c] bg-[#08080f]">
        <div
          ref={numeros}
          aria-hidden
          className="shrink-0 select-none overflow-hidden border-r border-[#1f1f2c] bg-[#0b0b13] px-2 py-3 text-right text-[11px] leading-[1.6] text-[#4a4a5a] [font-family:var(--font-geist-mono,monospace)]"
          style={{ height: 420 }}
        >
          {Array.from({ length: lineas }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        <textarea
          ref={area}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          onKeyDown={alTeclear}
          onScroll={alDesplazar}
          disabled={!editable}
          spellCheck={false}
          // Sin autocorrección ni mayúsculas automáticas: en un móvil, el
          // teclado convertiría `<td>` en `<Td>` y pondría puntos donde no.
          autoCorrect="off"
          autoCapitalize="off"
          placeholder={'<table role="presentation" width="600">\n  <tr><td style="padding:24px;">\n    Tu diseño\n  </td></tr>\n</table>'}
          className="flex-1 resize-none bg-transparent px-3 py-3 text-[11px] leading-[1.6] text-[#d8d8e8] outline-none [font-family:var(--font-geist-mono,monospace)] placeholder:text-[#3a3a4a] disabled:opacity-60"
          style={{ height: 420, whiteSpace: "pre", overflowWrap: "normal" }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-[#5a5a6a]">
        <span>{lineas} {lineas === 1 ? "línea" : "líneas"} · {valor.length} caracteres</span>
        {/* Gmail corta el correo a 102 KB y enseña «[Mensaje recortado]» con
            un enlace. Pasado ese punto, el pie —y la baja— quedan fuera. */}
        {valor.length > 90_000 && (
          <span className="text-[#e6cf95]">Cerca del límite de Gmail (102 KB)</span>
        )}
      </div>

      {avisos.length > 0 && (
        <ul className="space-y-1.5 border border-[#2a2420] bg-[#15120d]/50 p-3">
          {avisos.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed">
              {a.nivel === "error" ? (
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-red-400" />
              ) : (
                <Info size={13} className="mt-0.5 shrink-0 text-[#e6cf95]" />
              )}
              <span className={a.nivel === "error" ? "text-red-300" : "text-[#c8bfa8]"}>
                {a.mensaje}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  DE DÓNDE PARTIR
// ═══════════════════════════════════════════════════════════════════════════
//
// Cinco, no veinte. Una biblioteca de plantillas que nadie poda acaba siendo
// un cajón donde no se encuentra la que sirve, y entonces todo el mundo
// empieza de cero igual.
//
// ── POR QUÉ ESTÁN EN EL CÓDIGO ────────────────────────────────────────────
// Son el punto de partida, no contenido: cambian cuando cambia el diseño de
// la marca, no cuando se escribe un correo. Guardarlas en la base obligaría a
// una pantalla para editarlas, que es un editor de plantillas dentro de un
// editor de correos.
//
// ── TODAS MAQUETADAS CON TABLAS ───────────────────────────────────────────
// Y con los estilos en cada etiqueta, no en una hoja. No es nostalgia: es que
// Outlook usa el motor de Word para dibujar, ignora las hojas de estilo a
// trozos y no entiende ni flex ni grid. Una tabla con `style=""` se ve igual
// en los seis clientes que importan.

const FONDO = "#07070f"
const PANEL = "#0e0e1b"
const TEXTO = "#e9ecf5"
const SUAVE = "#a6abc4"
const VIOLETA = "#6D4A9B"

const marco = (dentro: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${FONDO};">
<tr><td align="center" style="padding:0;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:${PANEL};">
${dentro}
</table>
</td></tr>
</table>`

export const PLANTILLAS: Array<{ id: string; nombre: string; que: string; html: string }> = [
  {
    id: "contenido",
    nombre: "Contenido nuevo",
    que: "Un episodio, un recurso. Titular, texto y un botón.",
    html: marco(`<tr><td style="padding:40px 32px 0;">
  <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${VIOLETA};">Nuevo</p>
  <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:28px;line-height:34px;color:${TEXTO};">El titular</h1>
  <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:25px;color:${SUAVE};">
    El texto. Un párrafo por idea.
  </p>
</td></tr>
<tr><td align="center" style="padding:16px 32px 44px;">
  <a href="https://los144000.com/miembros" style="display:inline-block;padding:14px 34px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${TEXTO};background-color:${VIOLETA};text-decoration:none;">Ver ahora</a>
</td></tr>`),
  },
  {
    id: "sesion",
    nombre: "Sesión en vivo",
    que: "La fecha primero, porque es la noticia.",
    html: marco(`<tr><td style="padding:40px 32px 0;">
  <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:28px;line-height:34px;color:${TEXTO};">Nos vemos en directo</h1>
</td></tr>
<tr><td style="padding:0 32px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#141427;border-left:3px solid ${VIOLETA};">
    <tr><td style="padding:18px 20px;font-family:Arial,Helvetica,sans-serif;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${VIOLETA};">Cuándo</p>
      <p style="margin:0;font-size:17px;color:${TEXTO};">Jueves 12 · 20:00</p>
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding:24px 32px 0;">
  <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:25px;color:${SUAVE};">De qué va.</p>
</td></tr>
<tr><td align="center" style="padding:16px 32px 44px;">
  <a href="https://los144000.com/miembros" style="display:inline-block;padding:14px 34px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${TEXTO};background-color:${VIOLETA};text-decoration:none;">Apuntarme</a>
</td></tr>`),
  },
  {
    id: "imagen",
    nombre: "Con imagen arriba",
    que: "Para cuando la imagen es el mensaje.",
    html: marco(`<tr><td style="padding:0;">
  <img src="https://los144000.com/og.png" alt="Describe la imagen: muchos clientes no la cargan" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
</td></tr>
<tr><td style="padding:32px;">
  <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:26px;line-height:32px;color:${TEXTO};">El titular</h1>
  <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:25px;color:${SUAVE};">El texto.</p>
</td></tr>`),
  },
  {
    id: "carta",
    nombre: "Carta",
    que: "Solo texto. Para cuando lo que importa es lo que se dice.",
    html: marco(`<tr><td style="padding:44px 36px;">
  <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:17px;line-height:28px;color:${TEXTO};">Hola,</p>
  <p style="margin:0 0 18px;font-family:Georgia,serif;font-size:16px;line-height:27px;color:${SUAVE};">
    Primer párrafo.
  </p>
  <p style="margin:0 0 18px;font-family:Georgia,serif;font-size:16px;line-height:27px;color:${SUAVE};">
    Segundo párrafo.
  </p>
  <p style="margin:28px 0 0;font-family:Georgia,serif;font-size:16px;line-height:27px;color:${TEXTO};">José María</p>
</td></tr>`),
  },
  {
    id: "vacio",
    nombre: "En blanco",
    que: "El marco y nada más.",
    html: marco(`<tr><td style="padding:40px 32px;">
  <!-- Tu diseño aquí. Maqueta con <table>, no con <div>: Outlook dibuja con
       el motor de Word y no entiende flex ni grid. -->
</td></tr>`),
  },
]
