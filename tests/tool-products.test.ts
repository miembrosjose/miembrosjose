// Pruebas de identificación de las tarjetas-herramienta de la Biblioteca.
//
// ── POR QUÉ EXISTE ESTE ARCHIVO ────────────────────────────────────────────
// Estas tarjetas no son productos de venta: son módulos que toman su portada,
// su nombre y su descripción de un producto para poder gestionarse desde
// "Gestionar". La identificación mira primero el `num`.
//
// Eso reventó una vez: se eligieron los números 94 y 95 dando por hecho que
// estaban libres, y los ocupaban "Sanación Extraterrestre" y "Protocolo de
// Contacto". Resultado: cada tarjeta se quedó con el producto de la otra, esos
// dos productos desaparecieron del carrusel, y abrir Sanación llevaba a Código
// de Origen.
//
// Lo que se protege aquí:
//   1. Ningún predicado reclama un producto que no es suyo.
//   2. Los números reservados no pisan el catálogo numerado a mano.
//   3. El alta automática no siembra sobre un número ocupado.

import { test } from "node:test"
import assert from "node:assert/strict"

import {
  isNumerologiaToolProduct, isLugaresToolProduct,
  isCodigoOrigenToolProduct, isCartografiaToolProduct,
  isTransmisionesAccessProduct, numeroLibre,
  LUGARES_PRODUCT_NUM, TRANSMISIONES_ACCESS_PRODUCT_NUM,
  CODIGO_ORIGEN_PRODUCT_NUM, CARTOGRAFIA_PRODUCT_NUM, RANGO_HERRAMIENTAS,
} from "../app/miembros/_lib/tool-products.ts"

/** El catálogo tal como estaba cuando apareció el fallo. */
const CATALOGO: Array<{ name: string; num?: number }> = [
  { name: "Numerología Cósmica" },
  { name: "Lugares de Contacto", num: LUGARES_PRODUCT_NUM },
  { name: "Acceso a Transmisiones", num: TRANSMISIONES_ACCESS_PRODUCT_NUM },
  // Los dos que quedaron secuestrados. Sus números son los que provocaron todo.
  { name: "Sanación Extraterrestre", num: 94 },
  { name: "Protocolo de Contacto", num: 95 },
  // Productos normales de la tienda.
  { name: "Numerología Profunda", num: 40 },
  { name: "Meditación del Umbral", num: 41 },
]

const PREDICADOS = [
  ["numerologia", isNumerologiaToolProduct],
  ["lugares", isLugaresToolProduct],
  ["codigo-origen", isCodigoOrigenToolProduct],
  ["cartografia", isCartografiaToolProduct],
] as const

test("Sanación Extraterrestre y Protocolo de Contacto no los reclama nadie", () => {
  // Es el fallo concreto que hubo. Si vuelve, falla aquí y no en producción.
  for (const nombre of ["Sanación Extraterrestre", "Protocolo de Contacto"]) {
    const p = CATALOGO.find((x) => x.name === nombre)!
    for (const [id, predicado] of PREDICADOS) {
      assert.equal(predicado(p), false, `"${nombre}" (num ${p.num}) lo reclama ${id}`)
    }
  }
})

test("cada producto del catálogo lo reclama como mucho un predicado", () => {
  for (const p of CATALOGO) {
    const duenos = PREDICADOS.filter(([, f]) => f(p)).map(([id]) => id)
    assert.ok(duenos.length <= 1, `"${p.name}" lo reclaman: ${duenos.join(", ")}`)
  }
})

test("los números reservados no pisan el catálogo", () => {
  const ocupados = CATALOGO.map((p) => p.num).filter((n): n is number => n !== undefined)
  for (const [nombre, num] of [
    ["Código de Origen", CODIGO_ORIGEN_PRODUCT_NUM],
    ["Cartografía Estelar", CARTOGRAFIA_PRODUCT_NUM],
  ] as const) {
    assert.ok(!ocupados.includes(num), `${nombre} usa el num ${num}, que ya está ocupado`)
    assert.ok(num >= RANGO_HERRAMIENTAS, `${nombre} debería estar en el rango reservado`)
  }
  // Y los dos reservados no chocan entre sí.
  assert.notEqual(CODIGO_ORIGEN_PRODUCT_NUM, CARTOGRAFIA_PRODUCT_NUM)
})

test("el alta automática no siembra sobre un número ocupado", () => {
  assert.equal(numeroLibre(94, CATALOGO), false)
  assert.equal(numeroLibre(95, CATALOGO), false)
  assert.equal(numeroLibre(LUGARES_PRODUCT_NUM, CATALOGO), false)
  // Los reservados sí están libres en este catálogo.
  assert.equal(numeroLibre(CODIGO_ORIGEN_PRODUCT_NUM, CATALOGO), true)
  assert.equal(numeroLibre(CARTOGRAFIA_PRODUCT_NUM, CATALOGO), true)
  // Un producto sin num nunca bloquea.
  const sinNumero: Array<{ name: string; num?: number }> = [{ name: "Sin número" }]
  assert.equal(numeroLibre(999, sinNumero), true)
})

test("cada herramienta encuentra su producto por nombre y por número", () => {
  // Por nombre, aunque no tenga num.
  assert.ok(isCodigoOrigenToolProduct({ name: "Código de Origen" }))
  assert.ok(isCartografiaToolProduct({ name: "Cartografía Estelar 144" }))
  assert.ok(isNumerologiaToolProduct({ name: "Numerología Cósmica" }))
  assert.ok(isLugaresToolProduct({ name: "Lugares de Contacto" }))

  // Por número, aunque se renombre la tarjeta desde "Gestionar".
  assert.ok(isCodigoOrigenToolProduct({ name: "Mi Código", num: CODIGO_ORIGEN_PRODUCT_NUM }))
  assert.ok(isCartografiaToolProduct({ name: "Mi Mapa", num: CARTOGRAFIA_PRODUCT_NUM }))
})

test("las variantes de pago no se confunden con las herramientas gratuitas", () => {
  // "Numerología Profunda" es un producto de venta, no la herramienta.
  assert.equal(isNumerologiaToolProduct({ name: "Numerología Profunda", num: 40 }), false)
  assert.ok(isTransmisionesAccessProduct({ name: "Acceso a Transmisiones", num: TRANSMISIONES_ACCESS_PRODUCT_NUM }))
})
