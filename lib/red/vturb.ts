// ═══════════════════════════════════════════════════════════════════════════
//  LEER EL CÓDIGO QUE DA VTURB
// ═══════════════════════════════════════════════════════════════════════════
//
// En el panel de VTurb se copia un bloque de HTML con un <script> dentro. De
// ese bloque solo hacen falta dos datos: la cuenta y el reproductor. Con esos
// dos se arma todo lo demás —el reproductor y la miniatura— sin depender de
// cómo venga escrito el resto.
//
// ── POR QUÉ NO SE INYECTA LO PEGADO ───────────────────────────────────────
// La tentación es meter el bloque en la página con innerHTML y que VTurb se
// encargue. Aquí no se hace: se SACAN los identificadores, se comprueba que
// son de converteai, y el reproductor se construye desde cero con ellos.
//
// Así, el peor pegote posible —un bloque copiado de donde no debía, un script
// de otro sitio colado en medio— no puede ejecutar nada: de todo el texto solo
// sobreviven dos identificadores que, además, tienen que encajar en un patrón.
// Pega administración, sí, pero una credencial de administración robada no
// debería servir para ejecutar JavaScript en la sesión de cada miembro.
//
// ── DOS FORMATOS, PORQUE VTURB TIENE DOS ──────────────────────────────────
// El moderno trae un <vturb-smartplayer>; el clásico, un <div> con la
// miniatura dentro y un <script> al lado. Los dos llevan la misma dirección
// de script, y es de ahí de donde se saca todo.

/** Lo que VTurb entrega, ya entendido. */
export type Grabacion = {
  /** El bloque original, sin tocar. Se guarda por si el formato cambia. */
  embed: string
  cuentaId: string
  playerId: string
  /** La versión del reproductor que venía en el código: v4, v5… */
  version: string
  /**
   * La imagen de previsualización. Sale del propio bloque si venía dentro;
   * si no, se deduce. En los dos casos hay que COMPROBARLA antes de darla por
   * buena: ver `miniaturaExiste`.
   */
  miniatura: string
  /** Si la miniatura venía escrita en el bloque en vez de deducirse. */
  miniaturaDelCodigo: boolean
  /** Dirección del reproductor dentro de un iframe. */
  iframe: string
  /** Dirección del script del reproductor nativo. */
  script: string
  /** Identificador del elemento del reproductor moderno, si es de ese tipo. */
  elementoId: string | null
}

export type Lectura =
  | { ok: true; grabacion: Grabacion }
  | { ok: false; motivo: string }

/**
 * La dirección del script es el único sitio donde VTurb pone siempre la
 * cuenta y el reproductor juntos, en los dos formatos.
 *
 * La versión se CAPTURA en vez de escribirse a fuego. Estaba fijada en «v4»,
 * y el día que VTurb publique una v5 eso no daría un error claro: daría
 * «no encuentro el código de VTurb aquí dentro» sobre un código perfectamente
 * válido, y a nadie se le ocurriría que el problema es un número.
 */
const DIRECCION_SCRIPT =
  /scripts\.converteai\.net\/([a-z0-9-]{8,})\/players\/([a-z0-9-]{8,})\/(v\d+)\/(?:player|embed)/i

/** Una miniatura ya escrita dentro del bloque. */
const MINIATURA_EN_EL_CODIGO =
  /https:\/\/images\.converteai\.net\/[a-z0-9/._-]+\.(?:jpg|jpeg|png|webp)/i

/** El identificador del reproductor moderno: id="vid-xxxxx". */
const ELEMENTO_MODERNO = /id=["'](vid-[a-z0-9]+)["']/i

/**
 * Entiende lo que se haya pegado.
 *
 * Acepta el bloque completo de cualquiera de los dos formatos, y también una
 * dirección de script a secas, que es lo que queda cuando alguien copia solo
 * media línea. Lo que no acepta es una dirección de la página de VTurb donde
 * se ve el vídeo: esa no sirve para incrustarlo, y decirlo es más útil que
 * guardarla y que luego no se vea nada.
 */
export function leerVturb(bruto: string): Lectura {
  const texto = (bruto || "").trim()
  if (!texto) {
    return { ok: false, motivo: "No has pegado nada." }
  }

  const m = DIRECCION_SCRIPT.exec(texto)
  if (!m) {
    // El error más probable, y conviene nombrarlo: pegar la dirección de la
    // página de VTurb en vez del código de incrustar.
    if (/vturb\.com|app\.vturb/i.test(texto)) {
      return {
        ok: false,
        motivo:
          "Eso es la dirección de la página de VTurb, no el código para incrustar. " +
          "En VTurb, en el vídeo, está el icono </> — ese código es el que hay que pegar aquí.",
      }
    }
    return {
      ok: false,
      motivo:
        "No encuentro el código de VTurb aquí dentro. Tiene que incluir una dirección " +
        "de scripts.converteai.net; cópialo otra vez completo desde el icono </>.",
    }
  }

  const cuentaId = m[1]
  const playerId = m[2]
  const version = m[3]

  const enElCodigo = MINIATURA_EN_EL_CODIGO.exec(texto)
  const miniatura = enElCodigo
    ? enElCodigo[0]
    : `https://images.converteai.net/${cuentaId}/players/${playerId}/thumbnail.jpg`

  const base = `https://scripts.converteai.net/${cuentaId}/players/${playerId}/${version}`

  return {
    ok: true,
    grabacion: {
      embed: texto,
      cuentaId,
      playerId,
      version,
      miniatura,
      miniaturaDelCodigo: !!enElCodigo,
      iframe: `${base}/embed.html`,
      script: `${base}/player.js`,
      elementoId: ELEMENTO_MODERNO.exec(texto)?.[1] ?? null,
    },
  }
}

/**
 * ¿Existe de verdad esa miniatura?
 *
 * ── POR QUÉ SE COMPRUEBA EN VEZ DE CONFIAR ────────────────────────────────
 * Cuando la miniatura no venía dentro del código, su dirección está DEDUCIDA
 * de un patrón. Un patrón deducido acierta hasta el día que VTurb lo cambia,
 * y entonces cada tarjeta del archivo enseña el icono de imagen rota y nadie
 * sabe por qué.
 *
 * Una petición de un byte al guardar evita eso para siempre: o la miniatura
 * está y se guarda, o no está y se guarda nula, y la tarjeta se dibuja
 * entera sin imagen. Lo que no pasa nunca es dejar una dirección que falla.
 *
 * Se pide un solo byte —no la imagen entera— porque lo único que interesa es
 * si el servidor contesta que existe.
 */
export async function miniaturaExiste(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      redirect: "follow",
    })
    // 200 (sin rangos) y 206 (con rango) son las dos respuestas buenas.
    if (!r.ok && r.status !== 206) return false
    const tipo = r.headers.get("content-type") || ""
    // Un 200 con una página de error HTML dentro no es una miniatura.
    return tipo.startsWith("image/")
  } catch {
    // Sin red o con el servidor de VTurb caído no se puede afirmar que falte.
    // Se responde que no para no guardar una dirección sin comprobar: es
    // reversible —se vuelve a guardar y se comprueba otra vez— mientras que
    // una imagen rota en el archivo se queda ahí hasta que alguien la vea.
    return false
  }
}
