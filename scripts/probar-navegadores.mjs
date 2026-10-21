// ═══════════════════════════════════════════════════════════════════════════
//  QUÉ NAVEGADOR CREE LA PLATAFORMA QUE ES · la prueba
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:navegadores
//
// ── POR QUÉ ESTO SE PUEDE PROBAR Y LO DEMÁS NO ─────────────────────────────
// La detección es una función pura sobre una cadena de texto. No hace falta
// un iPhone para comprobar que Chrome para iOS se reconoce: hace falta su
// identificación, y esas son públicas y estables.
//
// Lo que NO prueba esto —y sigue necesitando aparatos de verdad— es que el
// menú esté donde decimos, que el botón de instalar aparezca, y que el
// sistema acepte añadir a la pantalla de inicio.
//
// ── EL FALLO QUE JUSTIFICA LA PRUEBA ───────────────────────────────────────
// Todos estos navegadores mienten a propósito: Chrome para iOS dice ser
// Safari ADEMÁS de Chrome, y Samsung Internet y Edge dicen ser Chrome. Si el
// orden de las comprobaciones se tocara sin querer, Samsung Internet pasaría
// a responder «Chrome» y se llevaría unas instrucciones que no le valen —sin
// que nada falle ni se queje.

import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const aqui = dirname(fileURLToPath(import.meta.url))

// Identificaciones reales, recortadas a lo que importa.
const CASOS = [
  // ── iOS: todos son WebKit por dentro; cambia dónde está su menú ──────
  ["safari", "iPhone · Safari",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"],
  ["chrome-ios", "iPhone · Chrome",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0.6668.69 Mobile/15E148 Safari/604.1"],
  ["otro-ios", "iPhone · Firefox",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/131.0 Mobile/15E148 Safari/605.1.15"],
  ["otro-ios", "iPhone · Edge",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/127.0 Mobile/15E148 Safari/605.1.15"],
  ["safari", "iPad · Safari (dice ser iPad)",
    "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"],

  // ── Android ──────────────────────────────────────────────────────────
  ["chrome", "Android · Chrome",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36"],
  ["samsung", "Android · Samsung Internet",
    "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36"],
  ["edge", "Android · Edge",
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36 EdgA/129.0.0.0"],
  ["firefox", "Android · Firefox",
    "Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0"],

  // ── Escritorio ───────────────────────────────────────────────────────
  ["chrome", "Windows · Chrome",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"],
  ["edge", "Windows · Edge",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0"],
  ["otro", "macOS · Safari",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15"],
]

/** Un iPad moderno miente: dice ser un Mac, pero con pantalla táctil. */
const IPAD_DISFRAZADO = {
  ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  platform: "MacIntel",
  maxTouchPoints: 5,
}

let fallos = 0

/**
 * Pone un navegador fingido.
 *
 * Node trae el suyo propio y es de solo lectura, así que no vale asignarlo:
 * hay que redefinir la propiedad. Sin esto la prueba ni arranca.
 */
function montarNavegador(userAgent, platform = "", maxTouchPoints = 0) {
  Object.defineProperty(globalThis, "navigator", {
    value: { userAgent, platform, maxTouchPoints },
    configurable: true,
    writable: true,
  })
}

// El módulo lee `navigator` en cada llamada, no al importarse, así que basta
// con cambiarlo entre pruebas.
montarNavegador("")
const { queNavegador, menuDe } = await import(
  "file:///" + join(aqui, "..", "app", "miembros", "_lib", "navegador.ts").replace(/\\/g, "/")
)

console.log("")
for (const [esperado, nombre, ua] of CASOS) {
  montarNavegador(ua)
  const real = queNavegador()
  const bien = real === esperado
  if (!bien) fallos++
  console.log(`${bien ? "  ok" : "FALLA"}  ${nombre.padEnd(32)} → ${real}${bien ? "" : `  (esperaba ${esperado})`}`)
}

montarNavegador(IPAD_DISFRAZADO.ua, IPAD_DISFRAZADO.platform, IPAD_DISFRAZADO.maxTouchPoints)
{
  const real = queNavegador()
  const bien = real === "safari"
  if (!bien) fallos++
  console.log(`${bien ? "  ok" : "FALLA"}  ${"iPad disfrazado de Mac".padEnd(32)} → ${real}${bien ? "" : "  (esperaba safari)"}`)
}

// Sin identificación no se puede saber nada, y eso también tiene que
// responder algo utilizable en vez de romperse.
montarNavegador("")
{
  const real = queNavegador()
  const bien = real === "otro"
  if (!bien) fallos++
  console.log(`${bien ? "  ok" : "FALLA"}  ${"Sin identificación".padEnd(32)} → ${real}`)
}

console.log("\n— El menú de cada uno —")
for (const n of ["safari", "chrome-ios", "otro-ios", "samsung", "chrome", "edge", "firefox", "otro"]) {
  const m = menuDe(n)
  console.log(`  ${n.padEnd(12)} ${m.simbolo.padEnd(4)} ${m.donde}`)
}

console.log(fallos === 0 ? "\nTODO BIEN\n" : `\n${fallos} FALLOS\n`)
process.exit(fallos === 0 ? 0 : 1)
