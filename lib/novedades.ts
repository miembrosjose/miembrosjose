// ═══════════════════════════════════════════════════════════════════════════
//  LOS CAMPOS DE UNA NOVEDAD
// ═══════════════════════════════════════════════════════════════════════════
//
// Vive aparte porque publicar y editar validan LO MISMO. Con una copia en
// cada ruta, basta con relajar un límite en una para que la otra acepte lo
// que la primera rechaza, y eso no se nota hasta que alguien edita.

export const MAX_TITULO = 140
export const MAX_CUERPO = 4000
export const MAX_CTA_TEXTO = 40

export type Campos = {
  titulo: string
  cuerpo: string
  eventoAt: string | null
  eventoZona: string | null
  ctaTexto: string | null
  ctaUrl: string | null
  caducaAt: string | null
}

/**
 * Lee y comprueba lo que manda el panel.
 *
 * `exigirTexto` distingue publicar de editar: al crear hacen falta título y
 * cuerpo; al editar solo se toca lo que se manda.
 */
export function camposDeNovedad(
  body: Record<string, unknown>,
  opciones?: { exigirTexto?: boolean },
): Campos | { error: string } {
  const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "")

  const titulo = texto(body.titulo)
  const cuerpo = texto(body.cuerpo)

  if (opciones?.exigirTexto) {
    if (!titulo) return { error: "Ponle un título." }
    if (!cuerpo) return { error: "Escribe el aviso." }
  }
  if (titulo.length > MAX_TITULO) {
    return { error: `El título no puede pasar de ${MAX_TITULO} caracteres.` }
  }
  if (cuerpo.length > MAX_CUERPO) {
    return { error: `El aviso no puede pasar de ${MAX_CUERPO} caracteres.` }
  }

  const eventoAt = momento(body.eventoAt)
  if (eventoAt === "invalido") return { error: "La fecha del encuentro no se entiende." }

  const caducaAt = momento(body.caducaAt)
  if (caducaAt === "invalido") return { error: "La fecha de retirada no se entiende." }

  const ctaTexto = texto(body.ctaTexto)
  if (ctaTexto.length > MAX_CTA_TEXTO) {
    return { error: `El texto del botón no puede pasar de ${MAX_CTA_TEXTO} caracteres.` }
  }

  const ctaUrl = texto(body.ctaUrl)
  if (ctaUrl && !enlaceAceptable(ctaUrl)) {
    return {
      error:
        "El enlace del botón tiene que empezar por https:// o ser una ruta de " +
        "la plataforma, como /miembros/red#encuentros.",
    }
  }
  // Un botón sin destino es un botón que no hace nada, y uno sin texto no se
  // puede pulsar a sabiendas. O los dos, o ninguno.
  if ((ctaTexto && !ctaUrl) || (ctaUrl && !ctaTexto)) {
    return { error: "El botón necesita texto Y enlace: pon los dos, o ninguno." }
  }

  return {
    titulo,
    cuerpo,
    eventoAt,
    eventoZona: texto(body.eventoZona) || null,
    ctaTexto: ctaTexto || null,
    ctaUrl: ctaUrl || null,
    caducaAt,
  }
}

/**
 * Una hora en formato de base, null si no se mandó, "invalido" si es basura.
 *
 * Se distingue «no mandó nada» de «mandó algo que no es una fecha» porque lo
 * primero es normal —una novedad puede no tener acto ni caducidad— y lo
 * segundo hay que decírselo a quien escribe.
 */
function momento(v: unknown): string | null | "invalido" {
  if (v === undefined || v === null || v === "") return null
  if (typeof v !== "string") return "invalido"
  const d = new Date(v)
  if (!Number.isFinite(d.getTime())) return "invalido"
  return d.toISOString()
}

/**
 * ¿Se puede poner ese enlace en el botón?
 *
 * Solo https y rutas de la propia plataforma. Se descarta `javascript:` —que
 * ejecutaría código al pulsar— y también `//otro-sitio.example`, que empieza
 * por barra y parece de aquí, pero el navegador lo lee como dominio ajeno.
 *
 * Esto lo escribe administración, no cualquiera; pero un enlace mal pegado en
 * un aviso que ve toda la Red merece una comprobación de dos líneas.
 */
function enlaceAceptable(url: string): boolean {
  if (url.startsWith("//")) return false
  if (url.startsWith("/")) return !url.includes("\\")
  return url.startsWith("https://")
}
