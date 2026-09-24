// Volver arriba al cambiar de pantalla.
//
// ── POR QUÉ ESTO NECESITA UN ARCHIVO ───────────────────────────────────────
// `window.scrollTo({ top: 0 })` parece que basta y no basta. Al cambiar de
// vista pasan tres cosas seguidas, en este orden:
//
//   1. React pinta la pantalla nueva.
//   2. El navegador recorta el desplazamiento a lo que mide esa pantalla.
//   3. Llega lo que se estaba cargando —una lista, un mapa, unas imágenes— y
//      la pantalla CRECE.
//
// Si se manda el scroll antes del paso 3, el navegador lo aplica sobre una
// altura que todavía no es la definitiva y, al crecer el contenido, la vista
// se queda a media altura. Eso es exactamente lo que se veía: se abría otra
// parte y no se iba al tope.
//
// Por eso se insiste: ahora, después de pintar, y una vez más pasado un
// instante. Tres intentos baratos que cubren los tres momentos.
//
// ── Y POR QUÉ NO ES SUAVE ──────────────────────────────────────────────────
// Un desplazamiento suave desde el pie de una pantalla larga tarda casi un
// segundo, y cualquier cosa que llegue mientras tanto lo cancela a la mitad.
// Al cambiar de pantalla no hay nada que seguir con la vista: la de antes ya
// no está. Se empieza arriba, y se empieza de golpe.

/** Al tope, de verdad. Insiste hasta que el contenido termina de llegar. */
export function irAlTope() {
  if (typeof window === "undefined") return

  const subir = () => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
      // Algunos navegadores móviles ignoran `scrollTo` cuando el teclado se
      // está cerrando; escribir la propiedad directamente sí les llega.
      if (document.documentElement) document.documentElement.scrollTop = 0
      if (document.body) document.body.scrollTop = 0
    } catch { /* si no se puede, tampoco se rompe nada */ }
  }

  subir()
  requestAnimationFrame(() => { subir(); requestAnimationFrame(subir) })
  window.setTimeout(subir, 120)
}
