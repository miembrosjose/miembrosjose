// ═══════════════════════════════════════════════════════════════════════════
//  EL LOGO, EN GRANDE Y EN LAS DOS FORMAS
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run logo
//
// Saca los archivos que hacen falta fuera de la plataforma: una portada de
// Telegram, una imagen para un anuncio, una presentación.
//
// ── DOS FORMAS, Y NO ES LO MISMO ───────────────────────────────────────────
//   icono      El cuadrado redondeado con su fondo. Es lo que va en la
//              pantalla de inicio de un teléfono y en una tienda. Tiene fondo
//              propio, así que se ve igual contra cualquier color.
//
//   emblema    Solo el dibujo —la corona, el disco y el 144— sobre
//              transparente. Es lo que va encima de una foto, de un vídeo o
//              de un fondo que no sea el nuestro.
//
// Usar el icono donde tocaba el emblema deja un cuadrado oscuro pegado en
// medio de la imagen. Es el error más común con un logo, y por eso salen los
// dos de aquí.
//
// ── LA FUENTE ES EL SVG ────────────────────────────────────────────────────
// `app/icon.svg` no tiene resolución: es un dibujo, no una fotografía. Para
// una valla publicitaria se usa ese archivo directamente y no hay tamaño que
// se quede corto. Estos PNG son para los sitios que no aceptan vectores, que
// son casi todos los de internet.

import sharp from "sharp"
import fs from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = join(aqui, "..")
const svg = fs.readFileSync(join(raiz, "app", "icon.svg"), "utf8")

const carpeta = join(raiz, "docs", "marca")
fs.mkdirSync(carpeta, { recursive: true })

/**
 * El mismo dibujo sin su fondo.
 *
 * El cuadrado redondeado es una sola línea del SVG; quitarla deja la corona y
 * el disco sobre transparente. Se hace aquí y no en un segundo archivo para
 * que no haya dos dibujos que mantener: el día que cambie el emblema, cambia
 * en los dos.
 */
const sinFondo = svg.replace(/\s*<rect width="64" height="64"[^>]*\/>/, "")

if (sinFondo === svg) {
  console.error("No se encontró el fondo en app/icon.svg. ¿Cambió el dibujo?")
  process.exit(1)
}

/** Densidad alta al rasterizar: el dibujo mide 64 y los destinos llegan a 2048. */
const densidad = (lado) => Math.ceil((lado / 64) * 72)

async function sacar(fuente, lado, nombre) {
  const destino = join(carpeta, nombre)
  await sharp(Buffer.from(fuente), { density: densidad(lado) })
    .resize(lado, lado)
    .png({ compressionLevel: 9 })
    .toFile(destino)

  const { size } = fs.statSync(destino)
  console.log(`  ${nombre.padEnd(34)} ${lado}×${lado}   ${(size / 1024).toFixed(0)} KB`)
}

console.log("\nEn docs/marca/:\n")

await sacar(svg, 2048, "los144000-icono-2048.png")
await sacar(svg, 1024, "los144000-icono-1024.png")
await sacar(svg, 512, "los144000-icono-512.png")

await sacar(sinFondo, 2048, "los144000-emblema-2048.png")
await sacar(sinFondo, 1024, "los144000-emblema-1024.png")

// El vectorial, copiado tal cual: es el único sin límite de tamaño.
fs.writeFileSync(join(carpeta, "los144000.svg"), svg)
console.log(`  ${"los144000.svg".padEnd(34)} sin límite de tamaño`)

console.log("\nIcono = con fondo, para pantallas de inicio y tiendas.")
console.log("Emblema = sobre transparente, para poner encima de una foto.\n")
