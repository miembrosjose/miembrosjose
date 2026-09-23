// Pruebas del motor de Código de Origen.
//
//   node --test tests/
//
// Lo que se comprueba, en orden de importancia:
//   1. DETERMINISMO: los mismos componentes dan siempre el mismo resultado.
//   2. FECHAS: medianoche, casi medianoche y 29 de febrero no se desplazan.
//   3. INVARIANTES: el reparto siempre tiene las cinco frecuencias, la raíz es
//      la de mayor peso y la de integración la de menor.
//   4. ESTANQUEIDAD: nada del motor de cálculo se filtra a los textos.

import { test } from "node:test"
import assert from "node:assert/strict"

import { calcularCodigoOrigen, validarNacimiento } from "../app/miembros/_lib/codigo-origen/engine.ts"
import type { FrecuenciaId, Nacimiento, VectorId } from "../app/miembros/_lib/codigo-origen/types.ts"
import { COMBINACIONES, MATIZ_DEL_VECTOR } from "../app/miembros/_lib/codigo-origen/interpretations.ts"

const CASOS: Array<{ nombre: string; n: Nacimiento }> = [
  { nombre: "fecha normal", n: { anio: 1988, mes: 12, dia: 27, hora: 14, minuto: 30 } },
  { nombre: "medianoche", n: { anio: 1995, mes: 6, dia: 15, hora: 0, minuto: 0 } },
  { nombre: "casi medianoche", n: { anio: 1995, mes: 6, dia: 15, hora: 23, minuto: 45 } },
  { nombre: "29 de febrero", n: { anio: 2000, mes: 2, dia: 29, hora: 9, minuto: 15 } },
  { nombre: "otro bisiesto", n: { anio: 1976, mes: 2, dia: 29, hora: 18, minuto: 5 } },
  { nombre: "década de 1950", n: { anio: 1954, mes: 3, dia: 8, hora: 7, minuto: 20 } },
  { nombre: "década de 1970", n: { anio: 1971, mes: 11, dia: 2, hora: 21, minuto: 0 } },
  { nombre: "década de 2010", n: { anio: 2016, mes: 8, dia: 21, hora: 12, minuto: 0 } },
]

test("el mismo nacimiento da siempre el mismo resultado", () => {
  for (const { nombre, n } of CASOS) {
    const a = calcularCodigoOrigen(n)
    const b = calcularCodigoOrigen({ ...n })
    assert.deepEqual(a, b, `${nombre}: dos cálculos difieren`)
  }
})

test("el reparto tiene siempre las cinco frecuencias", () => {
  for (const { nombre, n } of CASOS) {
    const r = calcularCodigoOrigen(n)
    assert.equal(r.reparto.length, 5, `${nombre}: no hay cinco frecuencias`)
    assert.equal(new Set(r.reparto.map((f) => f.id)).size, 5, `${nombre}: hay repetidas`)
  }
})

test("la raíz es la de mayor peso y la de integración la de menor", () => {
  for (const { nombre, n } of CASOS) {
    const r = calcularCodigoOrigen(n)
    const pesos = r.reparto.map((f) => f.peso)
    assert.equal(pesos[0], Math.max(...pesos), `${nombre}: la raíz no es la mayor`)
    assert.equal(pesos[pesos.length - 1], Math.min(...pesos), `${nombre}: la integración no es la menor`)
    assert.equal(r.raiz.id, r.reparto[0].id, `${nombre}: raíz descuadrada`)
    assert.equal(r.integracion.id, r.reparto[4].id, `${nombre}: integración descuadrada`)
  }
})

test("la hora cambia la lectura, y el corte del día está en las 23:00", () => {
  const medianoche = calcularCodigoOrigen({ anio: 1995, mes: 6, dia: 15, hora: 0, minuto: 0 })
  const tarde = calcularCodigoOrigen({ anio: 1995, mes: 6, dia: 15, hora: 14, minuto: 0 })
  const casiMedianoche = calcularCodigoOrigen({ anio: 1995, mes: 6, dia: 15, hora: 23, minuto: 45 })

  // Si la hora se ignorara, las tres coincidirían.
  assert.notDeepEqual(medianoche._debug.pilares, casiMedianoche._debug.pilares)

  // Dentro del mismo día civil y antes de las 23:00, la columna del día es la
  // misma: eso descarta que la fecha se esté desplazando por zona horaria.
  assert.equal(medianoche._debug.pilares[2], tarde._debug.pilares[2], "la fecha se desplazó")

  // A partir de las 23:00 la columna del día avanza. NO es un error de zona
  // horaria: en este sistema el día no empieza a medianoche sino a las 23:00,
  // y quien nace después recibe ya la columna del día siguiente. Se fija aquí
  // para que nadie lo "corrija" más adelante creyendo que es un fallo.
  assert.notEqual(
    casiMedianoche._debug.pilares[2],
    medianoche._debug.pilares[2],
    "el corte de las 23:00 dejó de aplicarse",
  )
})

test("el 29 de febrero se acepta en año bisiesto y se rechaza fuera", () => {
  assert.doesNotThrow(() => validarNacimiento({ anio: 2000, mes: 2, dia: 29, hora: 0, minuto: 0 }))
  assert.doesNotThrow(() => validarNacimiento({ anio: 2024, mes: 2, dia: 29, hora: 0, minuto: 0 }))
  assert.throws(() => validarNacimiento({ anio: 1900, mes: 2, dia: 29, hora: 0, minuto: 0 }), /Día inválido/)
  assert.throws(() => validarNacimiento({ anio: 2023, mes: 2, dia: 29, hora: 0, minuto: 0 }), /Día inválido/)
})

test("los porcentajes son coherentes", () => {
  for (const { nombre, n } of CASOS) {
    const r = calcularCodigoOrigen(n)
    const suma = r.reparto.reduce((a, f) => a + f.porcentaje, 0)
    // Exactamente 100, sin tolerancia. La versión anterior admitía ±3 y por eso
    // el fallo del redondeo pasó desapercibido: las sumas daban 97 o 102.
    assert.equal(suma, 100, `${nombre}: los porcentajes suman ${suma}, no 100`)
    for (const f of r.reparto) {
      assert.ok(f.porcentaje >= 0 && f.porcentaje <= 100, `${nombre}: porcentaje fuera de rango`)
    }
  }
})

test("ningún texto visible contiene terminología del motor", () => {
  // La prueba que protege la regla de producto: el motor es invisible.
  const prohibido = /[一-鿿]|bazi|four pillars|ten god|heavenly stem|earthly branch|day master|yin|yang/i

  for (const { nombre, n } of CASOS) {
    const r = calcularCodigoOrigen(n)
    const visible = JSON.stringify({
      reparto: r.reparto,
      raiz: r.raiz,
      apoyo: r.apoyo,
      integracion: r.integracion,
      vector: r.vector,
      arquetipo: r.arquetipo,
      configuracion: r.configuracion,
    })
    assert.equal(prohibido.test(visible), false, `${nombre}: se filtró terminología del motor`)
  }
})

test("los componentes inválidos se rechazan", () => {
  assert.throws(() => validarNacimiento({ anio: 1800, mes: 1, dia: 1, hora: 0, minuto: 0 }), /Año/)
  assert.throws(() => validarNacimiento({ anio: 2000, mes: 13, dia: 1, hora: 0, minuto: 0 }), /Mes/)
  assert.throws(() => validarNacimiento({ anio: 2000, mes: 4, dia: 31, hora: 0, minuto: 0 }), /Día/)
  assert.throws(() => validarNacimiento({ anio: 2000, mes: 1, dia: 1, hora: 24, minuto: 0 }), /Hora/)
  assert.throws(() => validarNacimiento({ anio: 2000, mes: 1, dia: 1, hora: 0, minuto: 60 }), /Minuto/)
})

test("las 20 combinaciones y los 10 matices existen, sin huecos", () => {
  // Protege el caso silencioso: si falta una clave, el motor devuelve "" y el
  // bloque desaparece de la lectura sin que nadie se entere.
  const frecuencias: FrecuenciaId[] = [
    "expansion", "activacion", "encarnacion", "claridad", "profundidad",
  ]
  const vectores: VectorId[] = ["proyeccion", "recepcion"]

  let combinaciones = 0
  for (const raiz of frecuencias) {
    for (const apoyo of frecuencias) {
      if (raiz === apoyo) continue
      const texto = COMBINACIONES[`${raiz}-${apoyo}`]
      assert.ok(texto && texto.length > 80, `falta o es pobre: ${raiz}-${apoyo}`)
      combinaciones++
    }
  }
  assert.equal(combinaciones, 20)

  for (const v of vectores) {
    for (const f of frecuencias) {
      const texto = MATIZ_DEL_VECTOR[`${v}-${f}`]
      assert.ok(texto && texto.length > 60, `falta matiz: ${v}-${f}`)
    }
  }
})

test("toda lectura trae combinación y matiz resueltos", () => {
  for (const { nombre, n } of CASOS) {
    const r = calcularCodigoOrigen(n)
    assert.ok(r.combinacion.length > 80, `${nombre}: sin combinación`)
    assert.ok(r.matizDelVector.length > 60, `${nombre}: sin matiz del vector`)
  }
})

test("los porcentajes suman 100 en miles de fechas, no solo en los casos elegidos", () => {
  // Barrido amplio y determinista: el fallo del redondeo aparecía en 3 de cada
  // 6 casos, así que seis ejemplos no bastan para dar esto por bueno.
  let comprobadas = 0
  const fallos: string[] = []

  for (let anio = 1940; anio <= 2020; anio += 2) {
    for (let mes = 1; mes <= 12; mes += 1) {
      for (const dia of [1, 13, 28]) {
        for (const hora of [0, 7, 14, 23]) {
          const r = calcularCodigoOrigen({ anio, mes, dia, hora, minuto: 30 })
          const suma = r.reparto.reduce((a, f) => a + f.porcentaje, 0)
          comprobadas++
          if (suma !== 100) fallos.push(`${anio}-${mes}-${dia} ${hora}h => ${suma}`)
        }
      }
    }
  }

  assert.ok(comprobadas > 5000, `solo se comprobaron ${comprobadas}`)
  assert.deepEqual(fallos.slice(0, 5), [], `${fallos.length} fechas no suman 100`)
})

test("ninguna frecuencia recibe un porcentaje negativo ni mayor que 100", () => {
  for (const { nombre, n } of CASOS) {
    for (const f of calcularCodigoOrigen(n).reparto) {
      assert.ok(Number.isInteger(f.porcentaje), `${nombre}: ${f.id} no es entero`)
      assert.ok(f.porcentaje >= 0 && f.porcentaje <= 100, `${nombre}: ${f.id} fuera de rango`)
    }
  }
})
