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
export const CODIGO_ORIGEN_PRODUCT_NUM = 94
export const CARTOGRAFIA_PRODUCT_NUM = 95

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
