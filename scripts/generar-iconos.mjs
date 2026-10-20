// ═══════════════════════════════════════════════════════════════════════════
//  LOS ICONOS DE LA APLICACIÓN, DESDE UN SOLO DIBUJO
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run iconos
//
// ── POR QUÉ EXISTE ESTE ARCHIVO ────────────────────────────────────────────
// Los cuatro PNG se habían hecho a mano, y cuando el SVG cambió dejaron de
// corresponderse con él: el icono de la pantalla de inicio enseñaba un «144»
// descentrado que en el navegador se veía bien. Un icono que no se puede
// regenerar es un icono que se queda viejo en silencio.
//
// Aquí se dibujan los cuatro desde `app/icon.svg`, que es la única fuente.
//
// ── Y POR QUÉ ADEMÁS MIDE ──────────────────────────────────────────────────
// Porque el fallo original no se veía al mirar el código: el SVG era válido y
// ningún renderizador se quejaba. Solo se veía midiendo los píxeles.
//
// Así que después de dibujar, esto comprueba dónde cayó el número dentro del
// disco y falla si se ha ido más de un píxel y medio del centro. Si alguien
// toca la fuente, el tamaño o la posición y lo descuadra, se entera aquí y no
// tres semanas después en el teléfono de otro.
//
// ── LOS CUATRO, Y PARA QUÉ ES CADA UNO ─────────────────────────────────────
//   icon-192            Android, el tamaño que pide el manifiesto.
//   icon-512            Android, para pantallas densas y la pantalla de carga.
//   icon-maskable-512   Android recorta a la forma del sistema —círculo, gota,
//                       cuadrado— y se come las esquinas. Este lleva el
//                       emblema encogido dentro de un lienzo más grande para
//                       que ninguna forma le quite nada.
//   apple-touch-icon    iPhone y iPad. SIN transparencia a propósito: iOS
//                       rellena el alfa de negro, y un icono con esquinas
//                       transparentes sale con un marco negro alrededor del
//                       redondeo que ya trae el dibujo.

import sharp from "sharp"
import fs from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = join(aqui, "..")
const svg = fs.readFileSync(join(raiz, "app", "icon.svg"))

/** Densidad alta al rasterizar: el SVG mide 64 y los destinos hasta 512. */
const DENSIDAD = 512

const salida = (nombre) => join(raiz, "public", nombre)

async function plano(tamano, destino, { conAlfa = true } = {}) {
  let img = sharp(svg, { density: DENSIDAD }).resize(tamano, tamano)
  // iOS rellena de negro lo transparente. Mejor fundirlo aquí contra el mismo
  // negro del fondo del dibujo que dejar que lo haga el sistema contra otro.
  if (!conAlfa) img = img.flatten({ background: "#050510" })
  await img.png({ compressionLevel: 9 }).toFile(destino)
}

/**
 * El enmascarable: el mismo dibujo, encogido al 72 % y centrado.
 *
 * Android garantiza que el 80 % central sobrevive a cualquier recorte. Con el
 * emblema al 72 % queda margen de sobra incluso con la forma más agresiva, y
 * el anillo de marcas no pierde ni una punta.
 */
async function enmascarable(tamano, destino) {
  const dentro = Math.round(tamano * 0.72)
  const emblema = await sharp(svg, { density: DENSIDAD })
    .resize(dentro, dentro)
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: tamano, height: tamano, channels: 4,
      // El mismo negro azulado del borde del dibujo, para que el relleno y el
      // emblema no se noten como dos piezas distintas.
      background: { r: 5, g: 5, b: 16, alpha: 1 },
    },
  })
    .composite([{ input: emblema, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toFile(destino)
}

/**
 * ¿Dónde cayó el número dentro del disco?
 *
 * Se queda con lo claro que hay bien adentro del anillo —el fondo del disco es
 * casi negro y el número es violeta claro— y devuelve el centro de su caja.
 */
async function medirElNumero(ruta) {
  const N = 512
  const { data, info } = await sharp(ruta).resize(N, N).raw()
    .toBuffer({ resolveWithObject: true })

  const centro = N / 2
  const limite = (17.0 / 64) * N   // el anillo está en 19.5; se mira por dentro

  let minX = N, maxX = -1, minY = N, maxY = -1, cuenta = 0
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (Math.hypot(x - centro + 0.5, y - centro + 0.5) > limite) continue
      const i = (y * N + x) * info.channels
      if ((data[i] + data[i + 1] + data[i + 2]) / 3 < 110) continue
      cuenta++
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }

  if (cuenta === 0) return null
  return {
    dx: (minX + maxX) / 2 - centro,
    dy: (minY + maxY) / 2 - centro,
  }
}

// ── Manos a la obra ────────────────────────────────────────────────────────

await plano(192, salida("icon-192.png"))
await plano(512, salida("icon-512.png"))
await plano(180, salida("apple-touch-icon.png"), { conAlfa: false })
await enmascarable(512, salida("icon-maskable-512.png"))

console.log("Dibujados los cuatro desde app/icon.svg.")

const TOLERANCIA = 1.5   // píxeles sobre 512, o sea medio pelo
const medida = await medirElNumero(salida("icon-512.png"))

if (!medida) {
  console.error("\nNo se encontró el número dentro del disco. ¿Se rompió el dibujo?")
  process.exit(1)
}

const { dx, dy } = medida
console.log(`Centrado del 144: ${dx.toFixed(1)} px horizontal, ${dy.toFixed(1)} px vertical (sobre 512).`)

if (Math.abs(dx) > TOLERANCIA || Math.abs(dy) > TOLERANCIA) {
  console.error(
    "\nEl número no está centrado en el disco.\n" +
    "Ajusta `x` e `y` del <text> en app/icon.svg restando ese desvío\n" +
    "—en unidades del viewBox: píxeles ÷ 8— y vuelve a ejecutar esto.",
  )
  process.exit(1)
}

console.log("Centrado. Listo.")
