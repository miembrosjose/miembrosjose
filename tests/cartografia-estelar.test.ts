// Pruebas de Cartografía Estelar 144.
//
// Lo que se protege, en orden de importancia:
//   1. ASTRONOMÍA CORRECTA. Las coordenadas del catálogo producen las
//      longitudes eclípticas publicadas. Es lo que caza una cifra mal copiada.
//   2. TIEMPO. Zona horaria histórica, cambios de horario, medianoche.
//   3. GEOMETRÍA. La envolvente 359°/0°, la separación real, los bordes del orbe.
//   4. PUNTUACIÓN. Nada por encima de 100, nada negativo, nada NaN.
//   5. DETERMINISMO. La misma entrada da siempre lo mismo.

import { test } from "node:test"
import assert from "node:assert/strict"

import { aTiempoUniversal, validarNacimiento } from "../app/miembros/_lib/cartografia-estelar/astronomy/tiempo.ts"
import { calcularPuntos, anclaEnFecha } from "../app/miembros/_lib/cartografia-estelar/astronomy/efemerides.ts"
import { normalizar, separacionLongitud, separacionReal, aGradosMinutos } from "../app/miembros/_lib/cartografia-estelar/astronomy/angulos.ts"
import { PORTALES, TOTAL_PORTALES } from "../app/miembros/_lib/cartografia-estelar/catalog/portales.ts"
import { cercania, saturar } from "../app/miembros/_lib/cartografia-estelar/resonancia/puntuacion.ts"
import { ASPECTOS, PESO_PUNTO } from "../app/miembros/_lib/cartografia-estelar/resonancia/config.ts"
import { construirCartografia } from "../app/miembros/_lib/cartografia-estelar/domain/construir.ts"
import type { Nacimiento } from "../app/miembros/_lib/cartografia-estelar/domain/types.ts"

const QUITO = { nombre: "Quito", latitud: -0.2299, longitud: -78.525, zonaHoraria: "America/Guayaquil" }
const MADRID = { nombre: "Madrid", latitud: 40.4168, longitud: -3.7038, zonaHoraria: "Europe/Madrid" }
const GREENWICH = { nombre: "Greenwich", latitud: 51.4779, longitud: 0, zonaHoraria: "UTC" }

const CASOS: Array<{ nombre: string; n: Nacimiento }> = [
  { nombre: "normal", n: { anio: 1988, mes: 12, dia: 27, hora: 14, minuto: 30, lugar: QUITO } },
  { nombre: "antes de 1950", n: { anio: 1932, mes: 3, dia: 9, hora: 6, minuto: 15, lugar: MADRID } },
  { nombre: "medianoche", n: { anio: 1995, mes: 6, dia: 15, hora: 0, minuto: 0, lugar: GREENWICH } },
  { nombre: "23:59", n: { anio: 1995, mes: 6, dia: 15, hora: 23, minuto: 59, lugar: GREENWICH } },
  { nombre: "bisiesto", n: { anio: 2000, mes: 2, dia: 29, hora: 12, minuto: 0, lugar: MADRID } },
  { nombre: "latitud alta", n: { anio: 1980, mes: 7, dia: 4, hora: 3, minuto: 20, lugar: { nombre: "Tromsø", latitud: 69.65, longitud: 18.96, zonaHoraria: "Europe/Oslo" } } },
  { nombre: "longitud +180", n: { anio: 2010, mes: 11, dia: 2, hora: 17, minuto: 45, lugar: { nombre: "Suva", latitud: -18.14, longitud: 178.44, zonaHoraria: "Pacific/Fiji" } } },
  { nombre: "reciente", n: { anio: 2024, mes: 5, dia: 20, hora: 9, minuto: 5, lugar: QUITO } },
]

// ── 1. Astronomía ───────────────────────────────────────────────────────────

test("las coordenadas del catálogo dan las longitudes eclípticas publicadas", () => {
  // La comprobación que de verdad caza un dato mal copiado. Estas posiciones
  // para época 2000 llevan décadas publicadas en listados de estrellas fijas.
  // Grados absolutos de eclíptica. Solo se incluyen las anclas cuyo valor
  // publicado se conoce con precisión suficiente para que la comparación
  // signifique algo. Tres referencias que se probaron —Schedar, Gienah y
  // M31, Procyon— se descartaron: los desajustes venían del valor de
  // referencia, no de la coordenada. Ajustar la referencia para que cuadre
  // vaciaría de sentido la prueba, así que se retiran. "Gienah", además,
  // nombra a DOS estrellas distintas.
  const publicado: Record<string, number> = {
    alcyone: 59.99, sirius: 104.08, arcturus: 204.23, vega: 285.32,
    betelgeuse: 88.75, rigel: 76.83, alnilam: 83.47, alpheratz: 14.30,
    rigil: 239.50, antares: 249.77, regulus: 149.83, sgr_a: 266.85,
    aldebaran: 69.79, spica: 203.83, altair: 301.78, deneb: 335.33,
    polaris: 88.57, capella: 81.88, canopus: 104.97, achernar: 345.32,
    castor: 110.23, pollux: 113.22, algol: 56.17, mirfak: 62.07,
    fomalhaut: 333.87, alphard: 147.28, markab: 353.48, acrux: 221.87,
    hadar: 233.85, zubenelgenubi: 225.08, sadalsuud: 323.38,
    rasalhague: 262.45, scheat: 359.38, algenib: 9.15,
    nunki: 282.44,
  }

  const utc = Date.UTC(2000, 0, 1, 12)
  let comprobadas = 0
  for (const p of PORTALES) {
    for (const a of p.anclas) {
      const esperado = publicado[a.id]
      if (esperado === undefined) continue
      const r = anclaEnFecha(a.raJ2000, a.decJ2000, utc)
      const dif = Math.abs(r.longitud - esperado)
      // Cinco minutos de arco: las listas publicadas redondean.
      assert.ok(dif < 5 / 60, `${a.id}: ${r.longitud.toFixed(3)}° vs ${esperado}° publicado`)
      comprobadas++
    }
  }
  assert.equal(comprobadas, 35, `solo se comprobaron ${comprobadas} anclas`)
})

test("el Sol cae donde debe en una fecha conocida", () => {
  const { utcMs } = aTiempoUniversal({ anio: 2000, mes: 1, dia: 1, hora: 12, minuto: 0, lugar: GREENWICH })
  const sol = calcularPuntos(utcMs, 51.4779, 0).find((p) => p.id === "sol")!
  assert.ok(Math.abs(sol.longitud - 280.37) < 0.1, `Sol en ${sol.longitud}°, esperado ~280.37°`)
})

test("se calculan los catorce puntos natales, sin NaN", () => {
  for (const { nombre, n } of CASOS) {
    const { utcMs } = aTiempoUniversal(n)
    const puntos = calcularPuntos(utcMs, n.lugar.latitud, n.lugar.longitud)
    assert.equal(puntos.length, 14, `${nombre}: no son catorce puntos`)
    assert.equal(new Set(puntos.map((p) => p.id)).size, 14, `${nombre}: hay repetidos`)
    for (const p of puntos) {
      for (const [campo, v] of Object.entries({ lon: p.longitud, lat: p.latitud, ra: p.ascensionRecta, dec: p.declinacion })) {
        assert.ok(Number.isFinite(v), `${nombre}: ${p.id}.${campo} es ${v}`)
      }
      assert.ok(p.longitud >= 0 && p.longitud < 360, `${nombre}: ${p.id} fuera de rango`)
      assert.ok(p.declinacion >= -90 && p.declinacion <= 90, `${nombre}: ${p.id} declinación imposible`)
    }
  }
})

test("los nodos están siempre opuestos", () => {
  for (const { nombre, n } of CASOS) {
    const { utcMs } = aTiempoUniversal(n)
    const puntos = calcularPuntos(utcMs, n.lugar.latitud, n.lugar.longitud)
    const nn = puntos.find((p) => p.id === "nodo_norte")!
    const ns = puntos.find((p) => p.id === "nodo_sur")!
    assert.ok(Math.abs(separacionLongitud(nn.longitud, ns.longitud) - 180) < 0.001, `${nombre}: los nodos no están opuestos`)
  }
})

// ── 2. Tiempo ───────────────────────────────────────────────────────────────

test("el horario de verano histórico se aplica bien", () => {
  // Madrid en 1975: UTC+2 en junio, UTC+1 en enero. Es el caso que rompe las
  // herramientas que usan el desfase actual para cualquier fecha.
  const verano = aTiempoUniversal({ anio: 1975, mes: 6, dia: 15, hora: 4, minuto: 30, lugar: MADRID })
  assert.equal(verano.desfaseMinutos, 120, "junio de 1975 en Madrid debería ser UTC+2")

  const invierno = aTiempoUniversal({ anio: 1975, mes: 1, dia: 15, hora: 4, minuto: 30, lugar: MADRID })
  assert.equal(invierno.desfaseMinutos, 60, "enero de 1975 en Madrid debería ser UTC+1")
})

test("la hora local no se desplaza al convertir a universal", () => {
  // Quito es UTC−5 todo el año: 14:30 local son las 19:30 UTC, siempre.
  const r = aTiempoUniversal({ anio: 1988, mes: 12, dia: 27, hora: 14, minuto: 30, lugar: QUITO })
  const d = new Date(r.utcMs)
  assert.equal(d.getUTCHours(), 19)
  assert.equal(d.getUTCMinutes(), 30)
  assert.equal(r.desfaseTexto, "UTC−5")
})

test("las fechas imposibles se rechazan", () => {
  const base = { hora: 12, minuto: 0, lugar: QUITO }
  assert.throws(() => validarNacimiento({ ...base, anio: 1700, mes: 1, dia: 1 }), /Año/)
  assert.throws(() => validarNacimiento({ ...base, anio: 2000, mes: 13, dia: 1 }), /Mes/)
  assert.throws(() => validarNacimiento({ ...base, anio: 2023, mes: 2, dia: 29 }), /Día/)
  assert.doesNotThrow(() => validarNacimiento({ ...base, anio: 2024, mes: 2, dia: 29 }))
  assert.throws(() => validarNacimiento({ anio: 2000, mes: 1, dia: 1, hora: 24, minuto: 0, lugar: QUITO }), /Hora/)
  assert.throws(() => validarNacimiento({ ...base, anio: 2000, mes: 1, dia: 1, lugar: { ...QUITO, latitud: 91 } }), /Latitud/)
  assert.throws(() => validarNacimiento({ ...base, anio: 2000, mes: 1, dia: 1, lugar: { ...QUITO, longitud: 181 } }), /Longitud/)
})

// ── 3. Geometría ────────────────────────────────────────────────────────────

test("la envolvente de 359° a 0° no rompe la separación", () => {
  // El error clásico: restar sin más daría 358 en vez de 2.
  assert.equal(separacionLongitud(359, 1), 2)
  assert.equal(separacionLongitud(1, 359), 2)
  assert.equal(separacionLongitud(0, 180), 180)
  assert.equal(separacionLongitud(10, 350), 20)
  assert.ok(separacionLongitud(0, 181) <= 180, "nunca debe pasar de 180")

  assert.equal(normalizar(-10), 350)
  assert.equal(normalizar(370), 10)
  assert.equal(normalizar(720), 0)
})

test("la separación real en el cielo es correcta", () => {
  // Mismo punto: cero.
  assert.ok(separacionReal(100, 20, 100, 20) < 1e-9)
  // Polo a polo: 180.
  assert.ok(Math.abs(separacionReal(0, 90, 0, -90) - 180) < 1e-6)
  // Sobre el ecuador, una diferencia de ascensión recta es la separación.
  assert.ok(Math.abs(separacionReal(0, 0, 30, 0) - 30) < 1e-6)
  // Nunca negativa ni mayor que 180.
  for (const [a, b, c, d] of [[0, 0, 359, 0], [45, -60, 200, 70], [180, 0, 0, 0]]) {
    const s = separacionReal(a, b, c, d)
    assert.ok(s >= 0 && s <= 180.0001, `separación fuera de rango: ${s}`)
  }
})

test("los minutos de arco se redondean sin producir 60", () => {
  assert.equal(aGradosMinutos(1.0666), "1°04′")
  assert.equal(aGradosMinutos(0), "0°00′")
  // 0.999° son 59.94', que redondea a 60' y debe subir al grado.
  assert.equal(aGradosMinutos(0.999), "1°00′")
})

// ── 4. Puntuación ───────────────────────────────────────────────────────────

test("la cercanía al orbe se comporta en los bordes", () => {
  assert.equal(cercania(0, 2), 1, "orbe exacto debe valer 1")
  assert.equal(cercania(2, 2), 0, "justo en el límite debe valer 0")
  assert.equal(cercania(3, 2), 0, "fuera del orbe, 0")
  // A mitad de orbe, con exponente 1.5, vale 0.5^1.5 ≈ 0.354.
  assert.ok(Math.abs(cercania(1, 2) - Math.pow(0.5, 1.5)) < 1e-9)
  // Siempre entre 0 y 1.
  for (let o = 0; o <= 3; o += 0.1) {
    const c = cercania(o, 2)
    assert.ok(c >= 0 && c <= 1 && Number.isFinite(c), `cercanía inválida en orbe ${o}: ${c}`)
  }
})

test("la curva saturante nunca alcanza ni supera 100", () => {
  assert.equal(saturar(0), 0)
  assert.equal(saturar(-1), 0, "una suma negativa no debe producir puntuación")
  for (const t of [0.1, 1, 5, 20, 100, 1e6]) {
    const s = saturar(t)
    assert.ok(s >= 0 && s < 100, `saturar(${t}) = ${s}`)
    assert.ok(Number.isFinite(s), `saturar(${t}) no es finito`)
  }
  // Crece de forma monótona.
  assert.ok(saturar(2) > saturar(1))
  assert.ok(saturar(10) > saturar(5))
})

// ── 5. Catálogo ─────────────────────────────────────────────────────────────

test("el catálogo no tiene identificadores repetidos ni coordenadas imposibles", () => {
  const idsPortal = new Set<string>()
  const idsAncla = new Set<string>()

  for (const p of PORTALES) {
    assert.equal(idsPortal.has(p.id), false, `portal repetido: ${p.id}`)
    idsPortal.add(p.id)
    assert.ok(p.anclas.length > 0 || p.pendingData, `${p.id}: sin anclas y sin marcar pendiente`)

    for (const a of p.anclas) {
      assert.equal(idsAncla.has(a.id), false, `ancla repetida: ${a.id}`)
      idsAncla.add(a.id)
      assert.ok(a.raJ2000 >= 0 && a.raJ2000 < 360, `${a.id}: ascensión recta fuera de rango`)
      assert.ok(a.decJ2000 >= -90 && a.decJ2000 <= 90, `${a.id}: declinación fuera de rango`)
      // Procedencia obligatoria: sin designación no se puede contrastar.
      assert.ok(a.designacion.length > 3, `${a.id}: sin designación de catálogo`)
    }
  }
  assert.equal(idsPortal.size, TOTAL_PORTALES)
})

test("la configuración es coherente", () => {
  // Todo punto natal tiene peso, y está entre 0 y 1.
  for (const [id, peso] of Object.entries(PESO_PUNTO)) {
    assert.ok(peso > 0 && peso <= 1, `${id}: peso ${peso} fuera de rango`)
  }
  assert.equal(Object.keys(PESO_PUNTO).length, 14)

  // Los orbes son positivos y los ángulos válidos.
  for (const a of ASPECTOS) {
    assert.ok(a.orbe > 0 && a.orbe < 15, `${a.id}: orbe ${a.orbe} implausible`)
    assert.ok(a.angulo >= 0 && a.angulo <= 180, `${a.id}: ángulo fuera de rango`)
    assert.ok(a.peso > 0 && a.peso <= 1, `${a.id}: peso fuera de rango`)
  }
  assert.equal(new Set(ASPECTOS.map((a) => a.id)).size, ASPECTOS.length)
})

// ── 6. Cartografía completa ─────────────────────────────────────────────────

test("el mismo nacimiento da siempre la misma cartografía", () => {
  for (const { nombre, n } of CASOS) {
    const a = construirCartografia(n)
    const b = construirCartografia({ ...n, lugar: { ...n.lugar } })
    assert.deepEqual(a.resonancias, b.resonancias, `${nombre}: dos cálculos difieren`)
    assert.deepEqual(a.resumen, b.resumen, `${nombre}: resúmenes distintos`)
  }
})

test("ninguna resonancia se sale de rango, ningún orbe es negativo", () => {
  for (const { nombre, n } of CASOS) {
    const c = construirCartografia(n)
    for (const r of c.resonancias) {
      assert.ok(r.resonancia > 0 && r.resonancia < 100, `${nombre}/${r.portalId}: resonancia ${r.resonancia}`)
      assert.ok(Number.isFinite(r.resonancia), `${nombre}/${r.portalId}: resonancia no finita`)
      assert.ok(r.contactos.length > 0, `${nombre}/${r.portalId}: resonancia sin contactos`)

      for (const ct of r.contactos) {
        assert.ok(ct.orbe >= 0, `${nombre}: orbe negativo`)
        assert.ok(ct.separacionReal >= 0 && ct.separacionReal <= 180.0001, `${nombre}: separación real fuera de rango`)
        assert.ok(ct.fuerza > 0 && ct.fuerza <= 1, `${nombre}: fuerza ${ct.fuerza}`)
        // El orbe nunca puede superar el permitido para su aspecto.
        const asp = ASPECTOS.find((a) => a.id === ct.aspecto)!
        assert.ok(ct.orbe <= asp.orbe, `${nombre}: orbe ${ct.orbe} supera el permitido ${asp.orbe}`)
      }
    }
    // Las resonancias vienen ordenadas de mayor a menor.
    for (let i = 1; i < c.resonancias.length; i++) {
      assert.ok(c.resonancias[i - 1].resonancia >= c.resonancias[i].resonancia, `${nombre}: sin ordenar`)
    }
    // Activos + sin contacto suman el total declarado.
    assert.equal(
      c.resonancias.length + c.sinContacto.length,
      TOTAL_PORTALES,
      `${nombre}: las cuentas de portales no cuadran`,
    )
  }
})

test("la separación real y el orbe son cosas distintas, y se ve", () => {
  // El caso que justifica guardar dos distancias: las Pléyades están a 4° de
  // la eclíptica, así que una cuadratura exacta por longitud convive con una
  // separación real de casi 90 grados. Presentarlas como lo mismo sería falso.
  const c = construirCartografia(CASOS[0].n)
  const pleyades = c.resonancias.find((r) => r.portalId === "pleyades")
  assert.ok(pleyades, "el caso de prueba debería tocar las Pléyades")

  const ct = pleyades!.contactos[0]
  assert.ok(ct.orbe < 0.5, "el contacto debería ser casi exacto por longitud")
  assert.ok(ct.separacionReal > 45, "y estar lejísimos en el cielo real")
})
