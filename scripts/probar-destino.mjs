// ═══════════════════════════════════════════════════════════════════════════
//  A DÓNDE SE VUELVE TRAS ENTRAR · la prueba de la puerta
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:destino
//
// POR QUÉ ESTA PRUEBA EXISTE
//   Desde que los enlaces de las grabaciones se reparten por Telegram, la
//   pantalla de acceso acepta un «vuelve aquí después» que viene en la barra
//   de direcciones. Eso es una redirección controlada desde fuera, y es el
//   sitio exacto por donde se cuela el engaño de la segunda contraseña:
//
//     los144000.com/miembros/login?redirectTo=https://sitio-de-otro.example
//
//   La víctima entra en el sitio bueno, escribe su contraseña, y acaba en una
//   copia que le pide «confirmar» los datos. Como viene de la plataforma de
//   verdad, no sospecha.
//
//   Un agujero así no se ve nunca usando la aplicación: todo funciona. Solo
//   aparece cuando alguien lo busca a propósito. Por eso se fija aquí.

import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const aqui = dirname(fileURLToPath(import.meta.url))
const { destinoSeguro, accesoVolviendoA } = await import(
  "file:///" +
  join(aqui, "..", "app", "miembros", "_lib", "destino-seguro.ts").replace(/\\/g, "/")
)

let fallos = 0
const comprobar = (titulo, real, esperado) => {
  const bien = real === esperado
  if (!bien) fallos++
  console.log(
    `${bien ? "  ok" : "FALLA"}  ${titulo}` +
    (bien ? "" : `\n        esperaba: ${esperado}\n        salió:    ${real}`),
  )
}

console.log("\n── Lo que SÍ se acepta ──────────────────────────────────────")
comprobar(
  "una grabación",
  destinoSeguro("/miembros/encuentro/12"),
  "/miembros/encuentro/12",
)
comprobar(
  "una transmisión",
  destinoSeguro("/miembros/feed/algo"),
  "/miembros/feed/algo",
)
comprobar(
  "con espacios alrededor",
  destinoSeguro("  /miembros/encuentro/3  "),
  "/miembros/encuentro/3",
)

console.log("\n── Lo que NO, y por qué ─────────────────────────────────────")
comprobar("vacío", destinoSeguro(""), null)
comprobar("nulo", destinoSeguro(null), null)
comprobar("indefinido", destinoSeguro(undefined), null)

// El caso evidente.
comprobar(
  "una dirección completa a otro sitio",
  destinoSeguro("https://sitio-de-otro.example/login"),
  null,
)

// ── EL QUE PARECE INOFENSIVO Y ES EL PELIGROSO ───────────────────────
// Empieza por barra, así que «que empiece por barra» lo deja pasar. Pero el
// navegador lo lee como un dominio ajeno: es una dirección sin protocolo, que
// hereda el de la página. Comprobar solo la primera barra NO basta.
comprobar(
  "doble barra: parece de aquí y es de fuera",
  destinoSeguro("//sitio-de-otro.example/login"),
  null,
)
comprobar(
  "doble barra con nuestro nombre delante para despistar",
  destinoSeguro("//los144000.com.sitio-de-otro.example/"),
  null,
)

// Algunos navegadores tratan la barra invertida como separador de dominio.
comprobar(
  "barra invertida",
  destinoSeguro("/\\sitio-de-otro.example"),
  null,
)

comprobar("javascript:", destinoSeguro("javascript:alert(1)"), null)
comprobar("una ruta de fuera de miembros", destinoSeguro("/soporte"), null)
comprobar("la raíz", destinoSeguro("/"), null)

console.log("\n── La dirección de acceso que se construye ──────────────────")
comprobar(
  "sin destino, la de siempre",
  accesoVolviendoA(null),
  "/miembros/login",
)
comprobar(
  "con destino, apuntado y escapado",
  accesoVolviendoA("/miembros/encuentro/12"),
  "/miembros/login?redirectTo=%2Fmiembros%2Fencuentro%2F12",
)
comprobar(
  "con un destino de fuera, se ignora en silencio",
  accesoVolviendoA("https://sitio-de-otro.example"),
  "/miembros/login",
)

console.log(
  fallos === 0
    ? "\n✓ La pantalla de acceso solo puede devolver a rutas de aquí dentro.\n"
    : `\n✗ ${fallos} comprobación(es) fallan.\n`,
)
process.exit(fallos === 0 ? 0 : 1)
