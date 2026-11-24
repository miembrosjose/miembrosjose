// ═══════════════════════════════════════════════════════════════════════════
//  LA CARTA ASTRAL · pruebas del motor
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:carta
//
// POR QUÉ ESTAS PRUEBAS EXISTEN
//   Un error en un cálculo astronómico no da error: da un número. La carta
//   sale, se ve bien, y está mal. Si los planetas se midieran desde el punto
//   vernal equivocado, todo saldría corrido medio grado y nadie lo notaría —
//   salvo quien tuviera un planeta a 29° de un signo y lo viera en el
//   siguiente.
//
// CÓMO SE COMPRUEBA SIN FIARSE DE NADIE
//   No se comparan los resultados con una tabla copiada de internet ni con lo
//   que yo recuerde. Se comprueban contra DEFINICIONES, que son verificables
//   solas:
//
//     · En el equinoccio de marzo el Sol está, por definición, a 0° de Aries.
//       La hora exacta del equinoccio la da el motor. Si el Sol no sale a 0°
//       ahí, el marco de referencia está mal.
//     · En el solsticio de junio, a 90°. En septiembre, 180°. En diciembre, 270°.
//     · Con el tiempo sideral local a 0 y latitud 0, el Medio Cielo vale 0° y
//       el Ascendente 90°. Eso sale de las fórmulas a mano, en papel.
//     · El nodo lunar retrocede 0,0529° al día: el ciclo de 18,6 años.
//
//   Si estas pasan, el marco es correcto. Lo demás son invariantes.

import "./_resolver-ts.mjs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import * as A from "astronomy-engine"

const aqui = dirname(fileURLToPath(import.meta.url))
const ruta = (...p) => "file:///" + join(aqui, "..", ...p).replace(/\\/g, "/")

const { calcularCarta } = await import(ruta("app", "miembros", "_lib", "carta-astral", "motor", "carta.ts"))
const { pesarSignos, PESOS, PESO_TOTAL } = await import(ruta("app", "miembros", "_lib", "carta-astral", "motor", "pesos.ts"))
const { casasSignosEnteros } = await import(ruta("app","miembros","_lib","carta-astral","motor","casas.ts"))
const { separacion } = await import(ruta("app","miembros","_lib","carta-astral","motor","aspectos.ts"))
const { textoEnCasa } = await import(ruta("app","miembros","_lib","carta-astral","contenido","planeta-en-casa.ts"))
const { CASAS, PLANETAS } = await import(ruta("app","miembros","_lib","carta-astral","contenido","vocabulario.ts"))
const { textoEnSigno } = await import(ruta("app","miembros","_lib","carta-astral","contenido","planeta-en-signo.ts"))
const { COMO_ACTUA, textoPareja } = await import(ruta("app","miembros","_lib","carta-astral","contenido","aspectos-texto.ts"))
const { textoAngulo } = await import(ruta("app","miembros","_lib","carta-astral","contenido","angulos-en-signo.ts"))
const { GUIA } = await import(ruta("app","miembros","_lib","carta-astral","contenido","guia.ts"))
const { SIGNOS, ORDEN_ZODIACAL, signoDeGrado, gradoEnSigno } = await import(ruta("app", "miembros", "_lib", "carta-astral", "contenido", "signos.ts"))
const { SISTEMAS, SISTEMAS_IDS } = await import(ruta("app", "miembros", "_lib", "carta-astral", "contenido", "sistemas.ts"))

let bien = 0, mal = 0
function ok(titulo, cond, detalle = "") {
  if (cond) { bien++; console.log(`  ok    ${titulo}`) }
  else { mal++; console.log(`  FALLA ${titulo}${detalle ? "  → " + detalle : ""}`) }
}
const cerca = (a, b, tol) => Math.abs(a - b) <= tol
/** Diferencia angular más corta, en grados. */
function dAng(a, b) {
  let d = ((a - b) % 360 + 360) % 360
  if (d > 180) d -= 360
  return Math.abs(d)
}

const lonDe = (carta, id) => carta.puntos.find((p) => p.id === id)?.longitud

console.log("\n═══ 1 · EL MARCO DE REFERENCIA (lo que de verdad importa) ═══\n")
// Las cuatro estaciones son las cuatro posiciones exactas del Sol. El motor
// nos dice CUÁNDO ocurren; nosotros comprobamos DÓNDE sale el Sol entonces.
for (const anio of [1950, 1975, 2000, 2026]) {
  const s = A.Seasons(anio)
  const casos = [
    ["equinoccio de marzo", s.mar_equinox, 0],
    ["solsticio de junio", s.jun_solstice, 90],
    ["equinoccio de septiembre", s.sep_equinox, 180],
    ["solsticio de diciembre", s.dec_solstice, 270],
  ]
  for (const [nombre, tiempo, esperado] of casos) {
    const c = calcularCarta(tiempo.date.getTime(), 0, 0)
    const sol = lonDe(c, "sol")
    // Una centésima de grado: 36 segundos de arco. El motor promete ±1 minuto.
    ok(`${anio} · ${nombre}: Sol a ${esperado}°`, dAng(sol, esperado) < 0.02,
      `salió ${sol?.toFixed(4)}° (desvío ${dAng(sol, esperado).toFixed(4)}°)`)
  }
}

console.log("\n═══ 2 · ASCENDENTE Y MEDIO CIELO, A MANO ═══\n")
{
  // Se busca el instante en que el tiempo sideral de Greenwich es 0 h. Con
  // longitud 0 el local también es 0, y entonces las fórmulas dan, en papel:
  //   MC  = atan2(0, cos ε) = 0°
  //   ASC = atan2(1, 0)     = 90°
  let t = A.MakeTime(new Date(Date.UTC(2000, 0, 1)))
  // El tiempo sideral avanza ~1.0027 veces el solar: se itera hasta clavarlo.
  for (let i = 0; i < 60; i++) {
    const st = A.SiderealTime(t)
    const err = st > 12 ? st - 24 : st
    if (Math.abs(err) < 1e-9) break
    t = A.MakeTime(new Date(t.date.getTime() - err * 3600e3 / 1.00273790935))
  }
  const st = A.SiderealTime(t)
  ok("se encontró el instante con tiempo sideral 0", Math.min(st, 24 - st) < 1e-6, `TSL = ${st}`)

  const c = calcularCarta(t.date.getTime(), 0, 0)
  ok("Medio Cielo = 0° (Aries 0)", dAng(lonDe(c, "medio_cielo"), 0) < 0.01, `${lonDe(c, "medio_cielo")?.toFixed(5)}°`)
  ok("Ascendente = 90° (Cáncer 0)", dAng(lonDe(c, "ascendente"), 90) < 0.01, `${lonDe(c, "ascendente")?.toFixed(5)}°`)
}
{
  // El Ascendente gira con el cielo: cuatro minutos de reloj ≈ 1° de media.
  const base = Date.UTC(1985, 5, 15, 10, 30)
  const a = calcularCarta(base, 40.4, -3.7)
  const b = calcularCarta(base + 4 * 60e3, 40.4, -3.7)
  const giro = dAng(lonDe(a, "ascendente"), lonDe(b, "ascendente"))
  ok("en 4 minutos el Ascendente se mueve entre 0,3° y 3°", giro > 0.3 && giro < 3, `${giro.toFixed(3)}°`)

  // Y la hora importa: media hora cambia la carta. Si no cambiara, la hora
  // de nacimiento no se estaría usando.
  const c = calcularCarta(base + 30 * 60e3, 40.4, -3.7)
  ok("media hora cambia el Ascendente", dAng(lonDe(a, "ascendente"), lonDe(c, "ascendente")) > 3)

  // El lugar también: Madrid y Buenos Aires a la misma hora dan Ascendentes
  // distintos. Si no, la latitud no se estaría usando.
  const bsas = calcularCarta(base, -34.6, -58.4)
  ok("el lugar cambia el Ascendente", dAng(lonDe(a, "ascendente"), lonDe(bsas, "ascendente")) > 1)
}

console.log("\n═══ 3 · LA ECLÍPTICA DE LA FECHA, NO J2000 ═══\n")
{
  const t = A.MakeTime(new Date(Date.UTC(1950, 0, 1, 12)))
  const vec = A.GeoVector(A.Body.Sun, t, true)
  const c = calcularCarta(t.date.getTime(), 0, 0)
  const nuestro = lonDe(c, "sol")

  // La eclíptica de J2000 DE VERDAD: hay que pedirla explícitamente con
  // Rotation_EQJ_ECL. La precesión son ~1,4°/siglo, así que para 1950 el
  // desvío tiene que rondar los 0,7°. Si saliera cero, estaríamos midiendo
  // desde el punto vernal del año 2000 y no del nacimiento, y los planetas en
  // frontera de signo caerían en el signo equivocado.
  const ecl2000 = A.RotateVector(A.Rotation_EQJ_ECL(), vec)
  const lonJ2000 = ((Math.atan2(ecl2000.y, ecl2000.x) * 180 / Math.PI) % 360 + 360) % 360
  const desvio = dAng(nuestro, lonJ2000)
  ok("1950 difiere de la eclíptica J2000 entre 0,5° y 1°", desvio > 0.5 && desvio < 1.0, `${desvio.toFixed(4)}°`)

  // Y el ancla de la equivalencia: `A.Ecliptic()` dice en su documentación que
  // devuelve «true ecliptic of date», o sea lo mismo que nuestra rotación
  // explícita. Esta prueba lo fija: si una versión futura de la librería
  // cambiara de marco, salta aquí y no en la carta de alguien.
  const porEcliptic = A.Ecliptic(vec).elon
  ok("A.Ecliptic() coincide con Rotation_EQJ_ECT (misma eclíptica de la fecha)",
    dAng(nuestro, porEcliptic) < 0.001, `difieren ${dAng(nuestro, porEcliptic).toFixed(6)}°`)
}

console.log("\n═══ 4 · RETRÓGRADOS ═══\n")
{
  const c = calcularCarta(Date.UTC(1990, 2, 20, 8, 15), 19.43, -99.13)
  ok("el Sol nunca es retrógrado", c.puntos.find((p) => p.id === "sol").retrogrado === false)
  ok("la Luna nunca es retrógrada", c.puntos.find((p) => p.id === "luna").retrogrado === false)
  ok("el Nodo Norte siempre es retrógrado", c.puntos.find((p) => p.id === "nodo_norte").retrogrado === true)
  ok("el Ascendente no es retrógrado", c.puntos.find((p) => p.id === "ascendente").retrogrado === false)
}
{
  // Mercurio retrograda unas tres veces al año, ~19 % del tiempo. Se muestrea
  // un año: si saliera 0 % o 50 %, la detección estaría mal.
  let retro = 0
  const total = 365
  for (let d = 0; d < total; d++) {
    const c = calcularCarta(Date.UTC(2020, 0, 1) + d * 86400e3, 0, 0)
    if (c.puntos.find((p) => p.id === "mercurio").retrogrado) retro++
  }
  const pct = (retro / total) * 100
  ok("Mercurio retrógrado entre el 12 % y el 26 % del año", pct > 12 && pct < 26, `${pct.toFixed(1)} %`)
}
{
  // El nodo retrocede 0,0529°/día. En 100 días, ~5,29°.
  const a = calcularCarta(Date.UTC(2010, 0, 1), 0, 0)
  const b = calcularCarta(Date.UTC(2010, 0, 1) + 100 * 86400e3, 0, 0)
  const corrido = dAng(lonDe(a, "nodo_norte"), lonDe(b, "nodo_norte"))
  ok("el nodo recorre ~5,3° en 100 días", cerca(corrido, 5.29, 0.6), `${corrido.toFixed(3)}°`)
}

console.log("\n═══ 5 · SIGNOS Y GRADOS ═══\n")
ok("0° es Aries", signoDeGrado(0) === "aries")
ok("29,9° sigue siendo Aries", signoDeGrado(29.9) === "aries")
ok("30° ya es Tauro", signoDeGrado(30) === "tauro")
ok("280° es Capricornio", signoDeGrado(280) === "capricornio")
ok("359,9° es Piscis", signoDeGrado(359.9) === "piscis")
ok("360° vuelve a Aries", signoDeGrado(360) === "aries")
ok("un grado negativo no rompe", signoDeGrado(-1) === "piscis")
ok("el grado dentro del signo de 35° es 5", cerca(gradoEnSigno(35), 5, 1e-9))
ok("hay doce signos en el orden zodiacal", ORDEN_ZODIACAL.length === 12)
ok("los doce son distintos", new Set(ORDEN_ZODIACAL).size === 12)

console.log("\n═══ 6 · LAS CASAS (PLACIDUS) ═══\n")
{
  const c = calcularCarta(Date.UTC(1975, 5, 10, 3, 45), 4.6, -74.08)
  ok("se usó Placidus en Bogotá", c.sistemaCasas === "placidus", c.sistemaCasas)
  ok("hay doce casas", c.casas.length === 12)
  ok("van numeradas de 1 a 12", c.casas.every((h, i) => h.numero === i + 1))

  const asc = c.puntos.find((p) => p.id === "ascendente")
  const mc = c.puntos.find((p) => p.id === "medio_cielo")
  ok("la cúspide 1 ES el Ascendente", cerca(c.casas[0].cuspide, asc.longitud, 1e-9))
  ok("la cúspide 10 ES el Medio Cielo", cerca(c.casas[9].cuspide, mc.longitud, 1e-9))

  // Las seis opuestas, exactas por construcción.
  for (const [a, b] of [[1, 7], [2, 8], [3, 9], [4, 10], [5, 11], [6, 12]]) {
    ok(`la casa ${a} y la ${b} están a 180°`,
      cerca(dAng(c.casas[a - 1].cuspide, c.casas[b - 1].cuspide), 180, 1e-6))
  }

  // Las cúspides van en orden alrededor de la rueda y suman 360°.
  let suma = 0
  for (let i = 0; i < 12; i++) {
    const ancho = ((c.casas[(i + 1) % 12].cuspide - c.casas[i].cuspide) % 360 + 360) % 360
    suma += ancho
  }
  ok("los doce tramos suman 360°", cerca(suma, 360, 1e-6), suma.toFixed(6))
  ok("ninguna casa tiene ancho cero o negativo",
    Array.from({ length: 12 }, (_, i) =>
      ((c.casas[(i + 1) % 12].cuspide - c.casas[i].cuspide) % 360 + 360) % 360).every((a) => a > 0.1))

  // En Placidus las casas NO miden 30°: si todas midieran lo mismo, no se
  // estaría calculando Placidus.
  const anchos = Array.from({ length: 12 }, (_, i) =>
    ((c.casas[(i + 1) % 12].cuspide - c.casas[i].cuspide) % 360 + 360) % 360)
  ok("las casas tienen anchos distintos (no es un sistema de 30°)",
    Math.max(...anchos) - Math.min(...anchos) > 1,
    `de ${Math.min(...anchos).toFixed(1)}° a ${Math.max(...anchos).toFixed(1)}°`)
}
{
  // En el ecuador la diferencia ascensional es cero, así que las cúspides
  // caen en las ascensiones rectas RAMC+30, +60, +120, +150 exactas. Es el
  // caso que se puede comprobar a mano.
  const c = calcularCarta(Date.UTC(1990, 3, 5, 14, 0), 0, 0)
  ok("en el ecuador también sale Placidus", c.sistemaCasas === "placidus")
  const anchos = Array.from({ length: 12 }, (_, i) =>
    ((c.casas[(i + 1) % 12].cuspide - c.casas[i].cuspide) % 360 + 360) % 360)
  ok("en el ecuador los doce tramos siguen sumando 360°",
    cerca(anchos.reduce((a, b) => a + b, 0), 360, 1e-6))
}
{
  // Por encima del círculo polar Placidus no existe: debe caer a signos
  // enteros Y DECIRLO, no devolver cualquier cosa.
  const c = calcularCarta(Date.UTC(1980, 0, 15, 6, 0), 69.65, 18.96) // Tromsø
  ok("en Tromsø cae a signos enteros", c.sistemaCasas === "signos_enteros", c.sistemaCasas)
  ok("y explica por qué", typeof c.motivoCasas === "string" && c.motivoCasas.length > 30)
  ok("aun así devuelve doce casas", c.casas.length === 12)
  // Reikiavik está justo por debajo del círculo polar: ahí sí debe salir.
  const r = calcularCarta(Date.UTC(1980, 0, 15, 6, 0), 64.13, -21.9)
  ok("en Reikiavik sí sale Placidus", r.sistemaCasas === "placidus", r.sistemaCasas)
}
{
  // Cada punto tiene que caer en una casa, y en la que le toca.
  const c = calcularCarta(Date.UTC(1975, 5, 10, 3, 45), 4.6, -74.08)
  ok("todos los puntos tienen casa entre 1 y 12",
    c.puntos.every((p) => p.casa >= 1 && p.casa <= 12))
  ok("el Ascendente está en la casa 1", c.puntos.find((p) => p.id === "ascendente").casa === 1)
  ok("el Medio Cielo está en la casa 10", c.puntos.find((p) => p.id === "medio_cielo").casa === 10)

  // Comprobación independiente: la casa de cada punto se recalcula mirando
  // si está entre su cúspide y la siguiente.
  const bienColocados = c.puntos.every((p) => {
    const h = c.casas[p.casa - 1]
    const siguiente = c.casas[p.casa % 12]
    const ancho = ((siguiente.cuspide - h.cuspide) % 360 + 360) % 360
    const dentro = ((p.longitud - h.cuspide) % 360 + 360) % 360
    return dentro < ancho
  })
  ok("cada punto está realmente entre su cúspide y la siguiente", bienColocados)
}

console.log("\n═══ 6b · SIGNOS ENTEROS, COMO ALTERNATIVA ═══\n")
{
  const c = calcularCarta(Date.UTC(1975, 5, 10, 3, 45), 4.6, -74.08)
  const enteras = casasSignosEnteros(c.puntos.find((p) => p.id === "ascendente").longitud)
  ok("doce casas", enteras.length === 12)
  ok("los doce signos sin repetir", new Set(enteras.map((h) => h.signo)).size === 12)
  ok("la casa 1 es el signo del Ascendente",
    enteras[0].signo === c.puntos.find((p) => p.id === "ascendente").signo)
  const i = ORDEN_ZODIACAL.indexOf(enteras[0].signo)
  ok("la casa 2 es el signo siguiente", enteras[1].signo === ORDEN_ZODIACAL[(i + 1) % 12])
  ok("todas empiezan en grado 0", enteras.every((h) => h.grado === 0))
}

console.log("\n═══ 6c · LOS ASPECTOS ═══\n")
{
  const c = calcularCarta(Date.UTC(1975, 5, 10, 3, 45), 4.6, -74.08)
  ok("salen aspectos", c.aspectos.length > 0, String(c.aspectos.length))
  ok("vienen del más exacto al menos",
    c.aspectos.every((a, i) => i === 0 || c.aspectos[i - 1].fuerza >= a.fuerza))
  ok("ninguno pasa de su orbe", c.aspectos.every((a) => a.fuerza >= 0 && a.fuerza <= 1))
  ok("el Nodo Norte no aspecta",
    c.aspectos.every((a) => a.a !== "nodo_norte" && a.b !== "nodo_norte"))
  ok("Ascendente y Medio Cielo no se aspectan entre sí",
    !c.aspectos.some((a) =>
      ["ascendente", "medio_cielo"].includes(a.a) && ["ascendente", "medio_cielo"].includes(a.b)))
  ok("ningún punto aspecta consigo mismo", c.aspectos.every((a) => a.a !== a.b))
  ok("ninguna pareja aparece dos veces",
    new Set(c.aspectos.map((a) => [a.a, a.b].sort().join("|"))).size === c.aspectos.length)

  // La separación declarada tiene que ser la real.
  const coherente = c.aspectos.every((a) => {
    const pa = c.puntos.find((p) => p.id === a.a)
    const pb = c.puntos.find((p) => p.id === a.b)
    return cerca(separacion(pa.longitud, pb.longitud), a.separacion, 1e-9)
  })
  ok("la separación declarada coincide con la real", coherente)

  // Sol y Luna en conjunción: una luna nueva. Se busca una de verdad con el
  // motor y se comprueba que el aspecto aparece.
  const nueva = A.SearchMoonPhase(0, A.MakeTime(new Date(Date.UTC(2021, 6, 1))), 40)
  const cn = calcularCarta(nueva.date.getTime(), 0, 0)
  const conj = cn.aspectos.find((a) =>
    [a.a, a.b].includes("sol") && [a.a, a.b].includes("luna"))
  ok("en luna nueva, Sol y Luna salen en conjunción", conj?.tipo === "conjuncion", conj?.tipo ?? "ninguno")
  ok("y casi exacta", conj !== undefined && conj.desviacion < 0.5, conj?.desviacion?.toFixed(3))

  // Luna llena: oposición.
  const llena = A.SearchMoonPhase(180, A.MakeTime(new Date(Date.UTC(2021, 6, 1))), 40)
  const cl = calcularCarta(llena.date.getTime(), 0, 0)
  const opo = cl.aspectos.find((a) => [a.a, a.b].includes("sol") && [a.a, a.b].includes("luna"))
  ok("en luna llena, Sol y Luna salen en oposición", opo?.tipo === "oposicion", opo?.tipo ?? "ninguno")
}

console.log("\n═══ 7 · LOS PESOS ═══\n")
{
  ok("los pesos suman 23", PESO_TOTAL === 23, String(PESO_TOTAL))
  ok("Sol, Luna y Ascendente pesan 3", PESOS.sol === 3 && PESOS.luna === 3 && PESOS.ascendente === 3)
  ok("Plutón pesa 1", PESOS.pluton === 1)
  ok("el Sol pesa más que Plutón", PESOS.sol > PESOS.pluton)

  const c = calcularCarta(Date.UTC(1975, 5, 10, 3, 45), 4.6, -74.08)
  const p = pesarSignos(c)
  ok("salen los doce signos, ausentes incluidos", p.length === 12)
  ok("los puntos suman el total de pesos", p.reduce((a, b) => a + b.puntos, 0) === PESO_TOTAL,
    String(p.reduce((a, b) => a + b.puntos, 0)))
  ok("vienen ordenados de más a menos", p.every((f, i) => i === 0 || p[i - 1].puntos >= f.puntos))
  ok("hay al menos un predominante", p.some((f) => f.estado === "predominante"))
  ok("un signo con 0 puntos está ausente", p.filter((f) => f.puntos === 0).every((f) => f.estado === "ausente"))
  ok("un signo con puntos NO está ausente", p.filter((f) => f.puntos > 0).every((f) => f.estado !== "ausente"))
  ok("los habitantes de cada signo vienen de mayor peso a menor",
    p.every((f) => f.habitantes.every((h, i) => i === 0 || f.habitantes[i - 1].peso >= h.peso)))
}
{
  // Nunca debe quedar una carta sin predominante, ni con todo ausente.
  let sinPredominante = 0
  for (let i = 0; i < 200; i++) {
    const c = calcularCarta(Date.UTC(1940, 0, 1) + i * 137 * 86400e3, 15 + (i % 60) - 30, (i * 17) % 360 - 180)
    const p = pesarSignos(c)
    if (!p.some((f) => f.estado === "predominante")) sinPredominante++
  }
  ok("en 200 cartas repartidas, ninguna se queda sin predominante", sinPredominante === 0, String(sinPredominante))
}

console.log("\n═══ 8 · EL CONTENIDO DE JOSÉ ESTÁ COMPLETO ═══\n")
{
  const signos = Object.keys(SIGNOS)
  ok("los doce signos tienen contenido", signos.length === 12, String(signos.length))
  ok("todos tienen atributos", signos.every((s) => SIGNOS[s].atributos.length > 100))
  ok("todos tienen conflictos", signos.every((s) => SIGNOS[s].conflictos.length > 100))
  ok("ningún texto está cortado a medias",
    signos.every((s) => /[.!?»"]$/.test(SIGNOS[s].atributos.trim())),
    signos.filter((s) => !/[.!?»"]$/.test(SIGNOS[s].atributos.trim())).join(", "))

  ok("hay doce sistemas orgánicos", SISTEMAS_IDS.length === 12, String(SISTEMAS_IDS.length))
  ok("todos tienen equilibrio", SISTEMAS_IDS.every((s) => SISTEMAS[s].equilibrio.length > 80))
  ok("todos tienen desequilibrio", SISTEMAS_IDS.every((s) => SISTEMAS[s].desequilibrio.length > 80))

  // Doce signos y doce sistemas: la correspondencia puede ser uno a uno.
  ok("doce signos y doce sistemas, uno por uno", signos.length === SISTEMAS_IDS.length)
}

console.log("\n═══ 8b · LOS 120 TEXTOS DE PLANETA EN CASA ═══\n")
{
  const PLANETAS_IDS = ["sol","luna","mercurio","venus","marte","jupiter","saturno","urano","neptuno","pluton"]
  let faltan = [], cortos = [], repetidos = []
  const vistos = new Map()

  for (const p of PLANETAS_IDS) {
    for (let h = 1; h <= 12; h++) {
      const t = textoEnCasa(p, h)
      if (!t) { faltan.push(`${p}/${h}`); continue }
      if (t.length < 120) cortos.push(`${p}/${h} (${t.length})`)
      // Un texto copiado y pegado entre dos posiciones es un error silencioso:
      // la carta sale, y dice lo mismo de dos cosas distintas.
      if (vistos.has(t)) repetidos.push(`${p}/${h} = ${vistos.get(t)}`)
      else vistos.set(t, `${p}/${h}`)
    }
  }

  ok("están los 120", faltan.length === 0, faltan.slice(0, 5).join(", "))
  ok("ninguno es demasiado corto", cortos.length === 0, cortos.slice(0, 5).join(", "))
  ok("ninguno está repetido en dos posiciones", repetidos.length === 0, repetidos.slice(0, 3).join(" · "))

  // Ninguno debe predecir. Son las palabras que convierten esto en adivinación.
  const PROHIBIDAS = /\b(ser[áé]s|tendr[áé]s|te pasar[áá]|ocurrir[áá]|sufrir[áá]s|predice|vaticina|destino inevitable)\b/i
  const adivinan = []
  for (const p of PLANETAS_IDS) {
    for (let h = 1; h <= 12; h++) {
      const t = textoEnCasa(p, h)
      if (t && PROHIBIDAS.test(t)) adivinan.push(`${p}/${h}`)
    }
  }
  ok("ninguno predice el futuro", adivinan.length === 0, adivinan.join(", "))

  ok("hay doce casas explicadas", Object.keys(CASAS).length === 12)
  ok("hay diez planetas explicados", Object.keys(PLANETAS).length === 10)
  ok("cada casa tiene nombre, breve y largo",
    Object.values(CASAS).every((c) => c.nombre && c.breve.length > 10 && c.largo.length > 100))
  ok("cada planeta tiene nombre, breve y largo",
    Object.values(PLANETAS).every((c) => c.nombre && c.breve.length > 10 && c.largo.length > 100))

  // La pieza que une todo: para una carta real, cada planeta debe encontrar
  // su texto. Si la casa saliera 0 o 13, esto lo caza.
  const c = calcularCarta(Date.UTC(1975, 5, 10, 3, 45), 4.6, -74.08)
  const planetas = c.puntos.filter((p) => PLANETAS_IDS.includes(p.id))
  ok("los diez planetas de una carta real encuentran su texto",
    planetas.length === 10 && planetas.every((p) => textoEnCasa(p.id, p.casa) !== null))
}

console.log("\n═══ 8c · LOS 120 TEXTOS DE PLANETA EN SIGNO ═══\n")
{
  const PLANETAS_IDS = ["sol","luna","mercurio","venus","marte","jupiter","saturno","urano","neptuno","pluton"]
  const faltan = [], repetidos = []
  const vistos = new Map()
  for (const p of PLANETAS_IDS) {
    for (const s of ORDEN_ZODIACAL) {
      const t = textoEnSigno(p, s)
      if (!t || t.length < 80) { faltan.push(`${p}/${s}`); continue }
      if (vistos.has(t)) repetidos.push(`${p}/${s} = ${vistos.get(t)}`)
      else vistos.set(t, `${p}/${s}`)
    }
  }
  ok("están los 120 de signo", faltan.length === 0, faltan.slice(0, 5).join(", "))
  ok("ninguno repetido", repetidos.length === 0, repetidos.slice(0, 3).join(" · "))

  // Los tres lentos deben decir que hablan de una generación, no de ti.
  const generacionales = ["urano", "neptuno", "pluton"]
  const honestos = generacionales.every((p) =>
    ORDEN_ZODIACAL.every((s) => /generaci[óo]n/i.test(textoEnSigno(p, s))))
  ok("Urano, Neptuno y Plutón dicen que hablan de una generación", honestos)

  // Y los personales NO deben hablar en plural generacional: si lo hicieran,
  // se estaría diluyendo lo que sí es de la persona.
  const personales = ["sol", "luna", "mercurio", "venus", "marte"]
  ok("los personales no se escudan en la generación",
    personales.every((p) => ORDEN_ZODIACAL.every((s) => !/tu generaci[óo]n/i.test(textoEnSigno(p, s)))))
}

console.log("\n═══ 8c-bis · EL ASCENDENTE Y EL MEDIO CIELO EN SIGNO ═══\n")
{
  // EL HUECO QUE ENCONTRÓ JOSÉ USÁNDOLO: la pantalla enseñaba «Ascendente:
  // Acuario» arriba del todo y no había una sola línea explicando qué era
  // eso. Los 120 textos de «planeta en signo» cubren planetas, y el
  // Ascendente no es un planeta.
  const faltan = []
  for (const s of ORDEN_ZODIACAL) {
    for (const id of ["ascendente", "medio_cielo"]) {
      const t = textoAngulo(id, s)
      if (!t || t.length < 100) faltan.push(`${id}/${s}`)
    }
  }
  ok("los 24 textos de Ascendente y Medio Cielo están", faltan.length === 0, faltan.slice(0, 5).join(", "))
  ok("no devuelve texto para algo que no es un ángulo", textoAngulo("venus", "leo") === null)

  // El Ascendente NO puede decir lo mismo que el Sol en ese signo: son cosas
  // distintas y repetirlas haría la lectura redundante justo donde más mira
  // la gente.
  const repiten = ORDEN_ZODIACAL.filter((s) => textoAngulo("ascendente", s) === textoEnSigno("sol", s))
  ok("el Ascendente no repite el texto del Sol", repiten.length === 0, repiten.join(", "))

  // Y para cualquier carta real, los tres grandes tienen texto. Era
  // exactamente lo que fallaba.
  const c = calcularCarta(Date.UTC(1975, 5, 10, 8, 45), 4.61, -74.08)
  const asc = c.puntos.find((p) => p.id === "ascendente")
  const mc = c.puntos.find((p) => p.id === "medio_cielo")
  ok("en una carta real, el Ascendente tiene lectura", !!textoAngulo("ascendente", asc.signo))
  ok("y el Medio Cielo también", !!textoAngulo("medio_cielo", mc.signo))
}

console.log("\n═══ 8d · LOS ASPECTOS, EXPLICADOS ═══\n")
{
  ok("los cinco aspectos están explicados", Object.keys(COMO_ACTUA).length === 5)
  ok("cada uno tiene título y texto",
    Object.values(COMO_ACTUA).every((a) => a.titulo.length > 3 && a.texto.length > 80))

  // LO QUE DE VERDAD IMPORTA: que NINGUNA pareja que el motor pueda producir
  // se quede sin texto. Se enumeran todas las combinaciones posibles, no las
  // de una carta de ejemplo: con cartas de ejemplo, el hueco aparece el día
  // que a alguien le salga esa pareja concreta.
  const PUNTOS = ["sol","luna","mercurio","venus","marte","jupiter","saturno",
                  "urano","neptuno","pluton","ascendente","medio_cielo"]
  const sinTexto = []
  for (let i = 0; i < PUNTOS.length; i++) {
    for (let j = i + 1; j < PUNTOS.length; j++) {
      const a = PUNTOS[i], b = PUNTOS[j]
      // Ascendente con Medio Cielo no aspecta: no necesita texto.
      if (["ascendente","medio_cielo"].includes(a) && ["ascendente","medio_cielo"].includes(b)) continue
      if (!textoPareja(a, b)) sinTexto.push(`${a}+${b}`)
    }
  }
  ok("las 65 parejas posibles tienen texto", sinTexto.length === 0,
    `faltan ${sinTexto.length}: ${sinTexto.slice(0, 6).join(", ")}`)

  ok("el orden de la pareja da igual",
    textoPareja("sol", "luna") === textoPareja("luna", "sol"))

  // Y sobre cartas reales: cada aspecto encontrado debe poder explicarse.
  let huecos = 0, total = 0
  for (let i = 0; i < 150; i++) {
    const c = calcularCarta(Date.UTC(1945, 0, 1) + i * 173 * 86400e3, (i % 100) - 50, (i * 23) % 360 - 180)
    for (const a of c.aspectos) {
      total++
      if (!textoPareja(a.a, a.b) || !COMO_ACTUA[a.tipo]) huecos++
    }
  }
  ok(`los ${total} aspectos de 150 cartas reales se explican todos`, huecos === 0, String(huecos))
}

console.log("\n═══ 9 · DETERMINISTA ═══\n")
{
  const args = [Date.UTC(1988, 10, 3, 17, 22), -12.04, -77.03]
  const a = JSON.stringify(calcularCarta(...args))
  const b = JSON.stringify(calcularCarta(...args))
  ok("la misma entrada da exactamente la misma carta", a === b)
}

console.log(`\n${"─".repeat(62)}`)
console.log(`  ${bien} bien · ${mal} mal`)
console.log(`${"─".repeat(62)}\n`)
process.exit(mal > 0 ? 1 : 0)
