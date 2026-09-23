// Pruebas de la escalera de grados del Camino.
//
// ── POR QUÉ EXISTE ESTE ARCHIVO ────────────────────────────────────────────
// Los grados del Camino son una escalera: quien completa la Temporada 4 pasó
// antes por semilla estelar y por las tres anteriores, y conserva las cinco
// insignias. La Red los trataba como cualidades sueltas, así que una sola
// persona se contaba una vez por cada grado y las pastillas de "Explorar la
// Red" hacían parecer que había cuatro miembros donde había uno. Al filtrar
// por "semilla estelar" salía también quien ya era arquitecto cósmico.
//
// Lo que se protege aquí:
//   1. Solo cuenta el grado más alto; el resto de insignias cuentan todas.
//   2. Filtrar por un grado devuelve a quien SE QUEDÓ ahí, no a quien pasó.
//   3. Una insignia que no es grado nunca se confunde con uno.

import { test } from "node:test"
import assert from "node:assert/strict"

import {
  ESCALERA_CAMINO,
  esGradoDelCamino,
  rangoMasAlto,
  insigniasParaContar,
} from "../lib/achievements"

test("la escalera va de menor a mayor y no tiene repetidos", () => {
  assert.equal(new Set(ESCALERA_CAMINO).size, ESCALERA_CAMINO.length)
  assert.equal(ESCALERA_CAMINO[0], "semilla_estelar")
  assert.equal(ESCALERA_CAMINO[ESCALERA_CAMINO.length - 1], "season_4_complete")
})

test("solo los grados del Camino se reconocen como grados", () => {
  for (const g of ESCALERA_CAMINO) assert.equal(esGradoDelCamino(g), true)
  for (const otra of ["welcome", "admin_seal", "activador_red", "season_5_complete"]) {
    assert.equal(esGradoDelCamino(otra), false)
  }
})

test("el rango más alto es el último peldaño alcanzado", () => {
  assert.equal(
    rangoMasAlto(["semilla_estelar", "season_1_complete", "season_2_complete"]),
    "season_2_complete",
  )
  // El orden en que llegan no importa: no se fía de la fila de la base.
  assert.equal(
    rangoMasAlto(["season_4_complete", "semilla_estelar", "season_1_complete"]),
    "season_4_complete",
  )
  assert.equal(rangoMasAlto(["semilla_estelar"]), "semilla_estelar")
})

test("sin ningún grado no hay rango", () => {
  assert.equal(rangoMasAlto([]), null)
  assert.equal(rangoMasAlto(["welcome", "admin_seal"]), null)
})

test("al contar, los grados valen uno y las demás insignias valen todas", () => {
  const suyas = [
    "welcome",
    "semilla_estelar",
    "season_1_complete",
    "season_2_complete",
    "season_3_complete",
    "season_4_complete",
    "admin_seal",
  ]
  const contadas = insigniasParaContar(suyas)

  // Este es el fallo original: seis grados contados como seis miembros.
  assert.equal(contadas.filter((x) => esGradoDelCamino(x)).length, 1)
  assert.equal(contadas.includes("season_4_complete"), true)
  assert.equal(contadas.includes("semilla_estelar"), false)

  // Las que no son grados no se tocan.
  assert.equal(contadas.includes("welcome"), true)
  assert.equal(contadas.includes("admin_seal"), true)
  assert.equal(contadas.length, 3)
})

test("quien no tiene grados conserva sus insignias al contarlas", () => {
  assert.deepEqual(insigniasParaContar(["welcome"]), ["welcome"])
  assert.deepEqual(insigniasParaContar([]), [])
})

test("filtrar por un grado devuelve a quien se quedó ahí, no a quien pasó", () => {
  // La misma regla que aplican /api/red/mapa y /api/red/miembros.
  const padron = new Map<string, string[]>([
    ["ana", ["semilla_estelar"]],
    ["jose", ["semilla_estelar", "season_1_complete", "season_2_complete",
              "season_3_complete", "season_4_complete"]],
    ["luz", ["semilla_estelar", "season_1_complete"]],
  ])
  const conGrado = (grado: string) =>
    [...padron.entries()].filter(([, g]) => rangoMasAlto(g) === grado).map(([id]) => id)

  assert.deepEqual(conGrado("semilla_estelar"), ["ana"])
  assert.deepEqual(conGrado("season_1_complete"), ["luz"])
  assert.deepEqual(conGrado("season_4_complete"), ["jose"])
  // Y nadie aparece dos veces: cada miembro sale bajo un único grado.
  const total = ESCALERA_CAMINO.flatMap((g) => conGrado(g))
  assert.equal(total.length, new Set(total).size)
  assert.equal(total.length, padron.size)
})
