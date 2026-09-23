// Predicados ligeros para identificar los productos-herramienta de la Biblioteca.
// Viven aquí (sin imports pesados) para que SpaHomeShell pueda usarlos sin
// arrastrar Numerología/Lugares (Stripe, Leaflet, globe.gl) al bundle del server.

function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

// `num` estable de cada herramienta (así el vínculo sobrevive al renombrado).
export const LUGARES_PRODUCT_NUM = 92
// Acceso completo a Transmisiones (paywall de categorías). Producto único $9.99.
export const TRANSMISIONES_ACCESS_PRODUCT_NUM = 93

export function isTransmisionesAccessProduct(p: { name: string; num?: number }): boolean {
  if (p.num === TRANSMISIONES_ACCESS_PRODUCT_NUM) return true
  const n = norm(p.name)
  return n.includes("transmision") && n.includes("acceso")
}

export function isNumerologiaToolProduct(p: { name: string; num?: number }): boolean {
  const n = norm(p.name)
  return n.includes("numerolog") && !n.includes("profund")
}

// Coincide por num estable (92) o, en su defecto, por nombre.
export function isLugaresToolProduct(p: { name: string; num?: number }): boolean {
  if (p.num === LUGARES_PRODUCT_NUM) return true
  const n = norm(p.name)
  return n.includes("lugares") && n.includes("contacto")
}

// Código de Origen y Cartografía Estelar se gestionan igual que Numerología y
// Lugares: un producto de la Biblioteca cuya portada, nombre y descripción se
// editan desde "Gestionar". El `num` estable mantiene el vínculo aunque se
// renombre la tarjeta.
//
// ── POR QUÉ 901 Y 902, Y NO 94 Y 95 ────────────────────────────────────────
// Al principio se eligieron 94 y 95 dando por hecho que seguían al 92 y 93 y
// estaban libres. NO lo estaban: los ocupaban "Sanación Extraterrestre" y
// "Protocolo de Contacto". Como la identificación mira el num antes que el
// nombre, cada tarjeta se quedó con el producto de la otra y abrir Sanación
// llevaba a Código de Origen.
//
// El catálogo se numera a mano y de forma correlativa, así que cualquier
// número cercano puede acabar ocupado. Estas dos no son productos de venta:
// viven en un rango aparte, muy por encima, donde no se cruzan con nada.
export const CODIGO_ORIGEN_PRODUCT_NUM = 901
export const CARTOGRAFIA_PRODUCT_NUM = 902

/** Primer número del rango reservado a tarjetas-herramienta. */
export const RANGO_HERRAMIENTAS = 900

/**
 * ¿Ese número puede sembrarse sin pisar nada?
 *
 * Antes de dar de alta una tarjeta-herramienta hay que comprobar que su
 * número no lo tenga ya otro producto. Es la salvaguarda que faltaba.
 */
export function numeroLibre(num: number, productos: Array<{ num?: number }>): boolean {
  return !productos.some((p) => p.num === num)
}

export function isCodigoOrigenToolProduct(p: { name: string; num?: number }): boolean {
  if (p.num === CODIGO_ORIGEN_PRODUCT_NUM) return true
  const n = norm(p.name)
  return n.includes("codigo") && n.includes("origen")
}

export function isCartografiaToolProduct(p: { name: string; num?: number }): boolean {
  if (p.num === CARTOGRAFIA_PRODUCT_NUM) return true
  const n = norm(p.name)
  return n.includes("cartografia") && n.includes("estelar")
}
