// Predicados ligeros para identificar los productos-herramienta de la Biblioteca.
// Viven aquí (sin imports pesados) para que SpaHomeShell pueda usarlos sin
// arrastrar Numerología/Lugares (Stripe, Leaflet, globe.gl) al bundle del server.

function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

export function isNumerologiaToolProduct(p: { name: string }): boolean {
  const n = norm(p.name)
  return n.includes("numerolog") && !n.includes("profund")
}

export function isLugaresToolProduct(p: { name: string }): boolean {
  const n = norm(p.name)
  return n.includes("lugares") && n.includes("contacto")
}
