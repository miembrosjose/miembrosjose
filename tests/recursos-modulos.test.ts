// AUDITORÍA DE LOS MÓDULOS DE RECURSOS.
//
// ── POR QUÉ EXISTE ESTE ARCHIVO ────────────────────────────────────────────
// Cartografía Estelar y Código de Origen ya tenían pruebas propias; Numerología
// Cósmica, que es la más usada de las cuatro, no tenía ninguna. Se pidió
// asegurarse de que todos los recursos funcionan, y «funcionar» aquí significa
// dos cosas concretas:
//
//   1. Que el cálculo no reviente ni devuelva huecos con datos reales, sean
//      cuales sean el nombre y la fecha. Un nombre con tildes, con eñe, de una
//      sola letra o con un apellido compuesto no puede dejar la pantalla a
//      medias.
//   2. Que no aparezca nunca "undefined", "NaN" ni una sección en blanco en el
//      texto que lee la persona. Eso es lo que se ve cuando falta una entrada
//      en una tabla de contenido.

import { test } from "node:test"
import assert from "node:assert/strict"

import {
  calcular, num, mensajeMision, resultadoATexto, bitacoraPrompt,
  normalizeName, MASTER_NUMBERS,
} from "../app/miembros/_lib/numerologia.ts"
import {
  generarLecturaProfunda, lecturaProfundaATexto,
} from "../app/miembros/_lib/numerologia-profunda.ts"

const NOMBRES = [
  "José María Bacigalupo",
  "Ana",
  "Ñuño Peña Ibáñez",
  "María José de la Cruz Hernández",
  "X Æ",
  "Jean-Luc O'Connor",
  "Luz",
  "ANDRÉS FELIPE GÓMEZ RESTREPO",
]

const FECHAS = [
  "1970-01-01", "1988-12-27", "1991-11-29", "2000-02-29",
  "1999-09-09", "2011-11-11", "1963-07-04", "2024-10-31",
]

/** Lo que NUNCA puede salir en pantalla. */
function textoSano(t: string, donde: string): string[] {
  const malos: string[] = []
  if (/undefined/i.test(t)) malos.push(`${donde}: dice "undefined"`)
  if (/\bNaN\b/.test(t)) malos.push(`${donde}: dice "NaN"`)
  if (/\[object Object\]/.test(t)) malos.push(`${donde}: dice "[object Object]"`)
  if (t.trim().length === 0) malos.push(`${donde}: vacío`)
  return malos
}

test("Numerología Cósmica calcula sin huecos para cualquier nombre y fecha", () => {
  const fallos: string[] = []
  for (const nombre of NOMBRES) {
    for (const fecha of FECHAS) {
      const etiqueta = `${nombre} / ${fecha}`
      let r
      try {
        r = calcular({ nombre, fecha, ciudad: "Quito", nombreCosmico: "" })
      } catch (e) {
        fallos.push(`${etiqueta}: calcular lanza — ${(e as Error).message}`)
        continue
      }

      // Los números centrales tienen que ser números de verdad.
      for (const [clave, valor] of Object.entries(r)) {
        if (typeof valor === "number" && !Number.isFinite(valor)) {
          fallos.push(`${etiqueta}: ${clave} no es un número`)
        }
      }

      // Y cada uno tiene que tener su ficha en la tabla de contenido: es lo
      // que se pinta en pantalla, y sin ella salía la tarjeta en blanco.
      for (const n of [r.caminoVida, r.alma, r.personalidad, r.expresion]) {
        const ficha = num(n)
        if (!ficha) { fallos.push(`${etiqueta}: no hay ficha para el ${n}`); continue }
        fallos.push(...textoSano(String(ficha.titulo ?? ""), `${etiqueta} · ficha ${n} título`))
      }

      fallos.push(...textoSano(mensajeMision(r), `${etiqueta} · misión`))
      fallos.push(...textoSano(resultadoATexto(r), `${etiqueta} · texto completo`))
      fallos.push(...textoSano(bitacoraPrompt(r), `${etiqueta} · bitácora`))
    }
  }
  assert.deepEqual(fallos.slice(0, 12), [])
})

test("la lectura profunda se genera entera, con y sin bitácora", () => {
  const fallos: string[] = []
  // Una fecha fija: la lectura profunda depende del día de hoy y sin fijarlo
  // la prueba fallaría o pasaría según cuándo se ejecute.
  const hoy = new Date("2026-09-23T12:00:00Z")

  for (const nombre of NOMBRES) {
    for (const fecha of FECHAS.slice(0, 4)) {
      const etiqueta = `${nombre} / ${fecha}`
      const r = calcular({ nombre, fecha, ciudad: "Quito", nombreCosmico: "" })

      for (const ctx of [{}, { proposito: "Servir", sombra: "El miedo" }]) {
        let L
        try {
          L = generarLecturaProfunda(r, ctx as never, hoy)
        } catch (e) {
          fallos.push(`${etiqueta}: lectura profunda lanza — ${(e as Error).message}`)
          continue
        }
        fallos.push(...textoSano(lecturaProfundaATexto(r, L), `${etiqueta} · profunda`))
      }
    }
  }
  assert.deepEqual(fallos.slice(0, 12), [])
})

test("un nombre sin letras utilizables no revienta el módulo", () => {
  // Alguien escribe números, o solo espacios, y pulsa. No puede caerse.
  for (const nombre of ["123", "   ", "!!!", "-"]) {
    const r = calcular({ nombre, fecha: "1990-05-05" })
    assert.equal(Number.isFinite(r.caminoVida), true, `caminoVida con "${nombre}"`)
    assert.doesNotThrow(() => resultadoATexto(r))
  }
})

test("normalizeName deja solo letras y conserva las acentuadas como base", () => {
  assert.equal(normalizeName("José María"), "JOSEMARIA")
  assert.equal(normalizeName("Ñuño"), "NUNO")
  assert.equal(normalizeName("Jean-Luc O'Connor"), "JEANLUCOCONNOR")
})

test("los números maestros no se reducen por el camino", () => {
  // 27/12/1988 → 2+7+1+2+1+9+8+8 = 38 → 11. Si se redujera hasta un dígito
  // saldría 2 y se perdería el maestro, que es justo lo que el módulo promete
  // no hacer.
  const r = calcular({ nombre: "Prueba", fecha: "1988-12-27" })
  assert.equal(MASTER_NUMBERS.includes(r.caminoVida) || r.caminoVida < 10, true)
  assert.equal(r.caminoVida, 11)
})

test("un nombre sin vocales lo dice, en vez de atribuir la ficha del 9", () => {
  // "Ng" es un apellido real y no tiene vocales latinas. Antes salía
  // "0 · El Servidor" en la lectura gratuita y "undefined" en la profunda.
  const r = calcular({ nombre: "Ng", fecha: "1990-05-05" })
  assert.equal(r.alma, 0)
  assert.equal(num(0).titulo, "Sin vocales")
  assert.equal(/El Servidor/.test(num(0).lectura), false)

  const texto = resultadoATexto(r)
  assert.equal(/undefined/i.test(texto), false)
  assert.equal(/0 · El Servidor/.test(texto), false)

  const L = generarLecturaProfunda(r, {} as never, new Date("2026-09-23T12:00:00Z"))
  const profunda = lecturaProfundaATexto(r, L)
  assert.equal(/undefined/i.test(profunda), false)
  assert.equal(/tu alma desea\s*$/m.test(profunda), false)
})
