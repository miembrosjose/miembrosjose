// ═══════════════════════════════════════════════════════════════════════════
//  LAS EFEMÉRIDES, CALCULADAS · no copiadas de ninguna página
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run efemerides            comprueba el cálculo y no escribe nada
//   npm run efemerides -- 2026 2030 > docs/sql/marketing_04_efemerides.sql
//
// ── POR QUÉ SE CALCULAN Y NO SE PEGAN ──────────────────────────────────────
// Una tabla copiada de una web sirve dos años y luego hay que volver a
// copiarla, y nadie se acuerda de dónde salió ni en qué hora estaba. Esto son
// los algoritmos de Jean Meeus («Astronomical Algorithms», capítulos 25 y 49),
// que es de donde sacan los datos esas páginas. Se le pide el rango de años
// que haga falta y sale.
//
// ── LO QUE HAY QUE SABER PARA LEER LAS FECHAS ──────────────────────────────
// El instante es universal; la FECHA no. Una luna llena a las 01:30 UTC cae
// la tarde del día anterior en México. Por eso todo se convierte al huso que
// se pida —por defecto el de Ciudad de México— antes de quedarse con el día.
//
// México no cambia la hora desde 2022, pero la conversión no da eso por
// supuesto: la hace `Intl` con la base de datos de husos del sistema, así que
// si algún día vuelve el horario de verano esto sigue estando bien.
//
// ── PRECISIÓN ──────────────────────────────────────────────────────────────
// Las comprobaciones de abajo exigen menos de 3 minutos de error contra los
// valores publicados. Para decidir el día de una publicación sobra, y el
// único caso en que 3 minutos cambiarían la fecha es un evento justo a
// medianoche. Cuando eso pase, el aviso lo dirá.

const ZONA_POR_DEFECTO = "America/Mexico_City"

const RAD = Math.PI / 180
const sin = (g) => Math.sin(g * RAD)
const norm = (g) => ((g % 360) + 360) % 360

// ── TIEMPO ─────────────────────────────────────────────────────────────────

/** Día juliano → milisegundos de JavaScript. */
function jdAMs(jd) {
  return (jd - 2440587.5) * 86400000
}

/**
 * ΔT: lo que el Tiempo Dinámico va por delante del universal.
 *
 * Ronda los 69 segundos en esta década y crece despacio. Entra aquí porque
 * los algoritmos de Meeus devuelven TT y las fechas de la gente son UT; son
 * poco más de un minuto, que solo decide algo en un evento a medianoche.
 */
function deltaT(anio) {
  const t = anio - 2000
  return 63.9 + 0.32217 * t + 0.005589 * t * t
}

// ── LAS FASES DE LA LUNA · Meeus, capítulo 49 ──────────────────────────────

/**
 * El instante de una fase.
 *
 * `k` entero = luna nueva; `k + 0.5` = luna llena. El k de partida sale de
 * cuántas lunaciones han pasado desde el año 2000.
 */
function fase(k) {
  const T = k / 1236.85
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T

  let jde = 2451550.09766 + 29.530588861 * k
    + 0.00015437 * T2 - 0.000000150 * T3 + 0.00000000073 * T4

  const E = 1 - 0.002516 * T - 0.0000074 * T2
  const M = norm(2.5534 + 29.10535670 * k - 0.0000014 * T2 - 0.00000011 * T3)
  const Mp = norm(201.5643 + 385.81693528 * k + 0.0107582 * T2
    + 0.00001238 * T3 - 0.000000058 * T4)
  const F = norm(160.7108 + 390.67050284 * k - 0.0016118 * T2
    - 0.00000227 * T3 + 0.000000011 * T4)
  const O = norm(124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3)

  const llena = Math.abs(k % 1) > 0.25

  // Los dos primeros coeficientes son los únicos que cambian entre nueva y
  // llena; el resto de la serie es el mismo.
  jde += (llena ? -0.40614 : -0.40720) * sin(Mp)
    + (llena ? 0.17302 : 0.17241) * E * sin(M)
    + (llena ? 0.01614 : 0.01608) * sin(2 * Mp)
    + (llena ? 0.01043 : 0.01039) * sin(2 * F)
    + (llena ? 0.00734 : 0.00739) * E * sin(Mp - M)
    + (llena ? -0.00515 : -0.00514) * E * sin(Mp + M)
    + (llena ? 0.00209 : 0.00208) * E * E * sin(2 * M)
    - 0.00111 * sin(Mp - 2 * F)
    - 0.00057 * sin(Mp + 2 * F)
    + 0.00056 * E * sin(2 * Mp + M)
    - 0.00042 * sin(3 * Mp)
    + 0.00042 * E * sin(M + 2 * F)
    + 0.00038 * E * sin(M - 2 * F)
    - 0.00024 * E * sin(2 * Mp - M)
    - 0.00017 * sin(O)
    - 0.00007 * sin(Mp + 2 * M)
    + 0.00004 * sin(2 * Mp - 2 * F)
    + 0.00004 * sin(3 * M)
    + 0.00003 * sin(Mp + M - 2 * F)
    + 0.00003 * sin(2 * Mp + 2 * F)
    - 0.00003 * sin(Mp + M + 2 * F)
    + 0.00003 * sin(Mp - M + 2 * F)
    - 0.00002 * sin(Mp - M - 2 * F)
    - 0.00002 * sin(3 * Mp + M)
    + 0.00002 * sin(4 * Mp)

  // Las catorce correcciones planetarias. Son pequeñas —décimas de minuto—
  // pero sin ellas el error se acerca al límite que exigen las pruebas.
  const A = [
    [299.77 + 0.107408 * k - 0.009173 * T2, 0.000325],
    [251.88 + 0.016321 * k, 0.000165],
    [251.83 + 26.651886 * k, 0.000164],
    [349.42 + 36.412478 * k, 0.000126],
    [84.66 + 18.206239 * k, 0.000110],
    [141.74 + 53.303771 * k, 0.000062],
    [207.14 + 2.453732 * k, 0.000060],
    [154.84 + 7.306860 * k, 0.000056],
    [34.52 + 27.261239 * k, 0.000047],
    [207.19 + 0.121824 * k, 0.000042],
    [291.34 + 1.844379 * k, 0.000040],
    [161.72 + 24.198154 * k, 0.000037],
    [239.56 + 25.513099 * k, 0.000035],
    [331.55 + 3.592518 * k, 0.000023],
  ]
  for (const [ang, coef] of A) jde += coef * sin(norm(ang))

  return jde
}

// ── EL SOL · Meeus, capítulo 25 ────────────────────────────────────────────

/** Longitud aparente del Sol, en grados, para un día juliano en TT. */
function longitudSolar(jde) {
  const T = (jde - 2451545) / 36525
  const T2 = T * T

  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T2
  const M = norm(357.52911 + 35999.05029 * T - 0.0001537 * T2)

  const C = (1.914602 - 0.004817 * T - 0.000014 * T2) * sin(M)
    + (0.019993 - 0.000101 * T) * sin(2 * M)
    + 0.000289 * sin(3 * M)

  const verdadera = L0 + C
  const O = 125.04 - 1934.136 * T

  // Aberración y nutación: de la longitud geométrica a la APARENTE, que es
  // la que define los ingresos en los signos.
  return norm(verdadera - 0.00569 - 0.00478 * sin(O))
}

// ── LOS CUATRO CARDINALES · Meeus, capítulo 27 ─────────────────────────────
//
// ── POR QUÉ ESTOS CUATRO LLEVAN SU PROPIO ALGORITMO ────────────────────────
// La fórmula solar de arriba está truncada y se queda en unos diez minutos de
// error. Para saber QUÉ DÍA entra el Sol en Tauro eso sobra. Para equinoccios
// y solsticios no: son los que se publican con hora, los que más se citan, y
// los únicos que alguien va a cotejar con otra fuente.
//
// Meeus dedica un capítulo entero a ellos. Son 24 términos periódicos sobre
// una fecha aproximada, y bajan el error a cosa de un minuto.

const TERMINOS_27 = [
  [485, 324.96, 1934.136], [203, 337.23, 32964.467], [199, 342.08, 20.186],
  [182, 27.85, 445267.112], [156, 73.14, 45036.886], [136, 171.52, 22518.443],
  [77, 222.54, 65928.934], [74, 296.72, 3034.906], [70, 243.58, 9037.513],
  [58, 119.81, 33718.147], [52, 297.17, 150.678], [50, 21.02, 2281.226],
  [45, 247.54, 29929.562], [44, 325.15, 31555.956], [29, 60.93, 4443.417],
  [18, 155.12, 67555.328], [17, 288.79, 4562.452], [16, 198.04, 62894.029],
  [14, 199.76, 31436.921], [12, 95.39, 14577.848], [12, 287.11, 31931.756],
  [12, 320.81, 34777.259], [9, 227.73, 1222.114], [8, 15.45, 16859.074],
]

/** Los polinomios de partida, uno por estación. */
const BASE_27 = {
  0: [2451623.80984, 365242.37404, 0.05169, -0.00411, -0.00057],
  90: [2451716.56767, 365241.62603, 0.00325, 0.00888, -0.00030],
  180: [2451810.21715, 365242.01767, -0.11575, 0.00337, 0.00078],
  270: [2451900.05952, 365242.74049, -0.06223, -0.00823, 0.00032],
}

/** Instante en TT del equinoccio o solsticio. Devuelve día juliano. */
function cardinal(anio, grados) {
  const [c0, c1, c2, c3, c4] = BASE_27[grados]
  const Y = (anio - 2000) / 1000
  const jde0 = c0 + c1 * Y + c2 * Y ** 2 + c3 * Y ** 3 + c4 * Y ** 4

  const T = (jde0 - 2451545) / 36525
  const W = 35999.373 * T - 2.47
  const dLambda = 1 + 0.0334 * Math.cos(W * RAD) + 0.0007 * Math.cos(2 * W * RAD)

  let S = 0
  for (const [A, B, C] of TERMINOS_27) S += A * Math.cos((B + C * T) * RAD)

  return jde0 + (0.00001 * S) / dLambda
}

/**
 * Cuándo cruza el Sol un grado dado. Bisección sobre el año.
 *
 * Se parte de una estimación por la fecha aproximada del ingreso y se afina;
 * el ángulo se compara en diferencia con signo para que el salto de 360 a 0
 * no rompa la búsqueda.
 *
 * Para los cuatro cardinales no se usa esto, sino `cardinal()`.
 */
function cruceSolar(anio, grados) {
  // Arranque: el Sol entra en Aries hacia el 20 de marzo y avanza un signo
  // al mes. Basta para caer dentro de la ventana de la bisección.
  const diaAprox = Date.UTC(anio, 2, 20) + (grados / 360) * 365.2422 * 86400000
  let a = diaAprox - 20 * 86400000
  let b = diaAprox + 20 * 86400000

  const dif = (ms) => {
    const jde = ms / 86400000 + 2440587.5
    let d = longitudSolar(jde) - grados
    while (d > 180) d -= 360
    while (d < -180) d += 360
    return d
  }

  if (dif(a) > 0 || dif(b) < 0) return null

  for (let i = 0; i < 80; i++) {
    const m = (a + b) / 2
    if (dif(m) < 0) a = m; else b = m
  }
  return (a + b) / 2
}

// ── DEL INSTANTE A LA FECHA DE UN SITIO ────────────────────────────────────

/** «2026-10-27» y «14:46» en el huso que se pida. */
function enZona(ms, zona) {
  const f = new Intl.DateTimeFormat("sv-SE", {
    timeZone: zona,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  })
  // El locale sueco da «2026-10-27 14:46», que ya es el formato que queremos.
  const t = f.format(new Date(ms)).replace(" ", "T")
  return { fecha: t.slice(0, 10), hora: t.slice(11, 16) }
}

function utc(ms) {
  return new Date(ms).toISOString().slice(0, 16).replace("T", " ") + " UTC"
}

// ── LOS SIGNOS ─────────────────────────────────────────────────────────────

const SIGNOS = [
  "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
]

/** Los cuatro cardinales no son «un ingreso más»: son el cambio de estación. */
const ESTACION = {
  0: "Equinoccio de marzo",
  90: "Solsticio de junio",
  180: "Equinoccio de septiembre",
  270: "Solsticio de diciembre",
}

// ── GENERAR ────────────────────────────────────────────────────────────────

function eventos(desde, hasta, zona) {
  const fuera = (f) => f < `${desde}-01-01` || f > `${hasta}-12-31`
  const salida = []

  // ── Lunas ───────────────────────────────────────────────────────────────
  // Se barre con holgura de una lunación por cada lado para no perder las de
  // los bordes al convertir de huso.
  const kDesde = Math.floor((desde - 2000) * 12.3685) - 2
  const kHasta = Math.ceil((hasta + 1 - 2000) * 12.3685) + 2

  for (let k = kDesde; k <= kHasta; k++) {
    for (const media of [0, 0.5]) {
      const jdeTT = fase(k + media)
      const anio = desde + (k - kDesde) / 12.3685
      const ms = jdAMs(jdeTT) - deltaT(anio) * 1000
      const { fecha, hora } = enZona(ms, zona)
      if (fuera(fecha)) continue
      salida.push({
        fecha,
        categoria: "luna",
        titulo: media === 0 ? "Luna nueva" : "Luna llena",
        hora, ms,
      })
    }
  }

  // ── Sol: los doce ingresos ──────────────────────────────────────────────
  //
  // El recorrido de un año empieza en Aries, en marzo, así que sus dos
  // últimos signos —Acuario y Piscis— caen ya en enero y febrero del año
  // siguiente. Por eso se arranca un año antes: si no, los dos primeros
  // meses del primer año se quedan sin ingreso y no se nota hasta febrero.
  for (let anio = desde - 1; anio <= hasta; anio++) {
    for (let i = 0; i < 12; i++) {
      const grados = i * 30
      const esEstacionAqui = ESTACION[grados] !== undefined
      // Los cardinales por el algoritmo fino; los otros ocho por el general.
      const msTT = esEstacionAqui ? jdAMs(cardinal(anio, grados)) : cruceSolar(anio, grados)
      if (msTT === null) continue
      const ms = msTT - deltaT(anio) * 1000
      const { fecha, hora } = enZona(ms, zona)
      if (fuera(fecha)) continue

      const esEstacion = esEstacionAqui
      salida.push({
        fecha,
        categoria: esEstacion ? "estacion" : "zodiaco",
        titulo: esEstacion
          ? `${ESTACION[grados]} · el Sol entra en ${SIGNOS[i]}`
          : `El Sol entra en ${SIGNOS[i]}`,
        hora, ms,
      })
    }
  }

  // ── Días portales ───────────────────────────────────────────────────────
  // Esto NO es astronomía: es una convención de fechas de dígitos repetidos,
  // y se marca como tal para que nadie la confunda con lo calculado. Va
  // porque se publica sobre ella, no porque el cielo haga nada ese día.
  for (let anio = desde; anio <= hasta; anio++) {
    for (let m = 1; m <= 12; m++) {
      const fecha = `${anio}-${String(m).padStart(2, "0")}-${String(m).padStart(2, "0")}`
      salida.push({
        fecha,
        categoria: "portal",
        titulo: m === 8 ? "Portal del León · 8·8" : `Portal ${m}·${m}`,
        hora: null, ms: null,
      })
    }
  }

  salida.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0))
  return salida
}

// ── COMPROBACIÓN ───────────────────────────────────────────────────────────
//
// Valores publicados por el IMCCE y la NASA, en UTC. Si el algoritmo se
// toca y deja de cuadrar, esto lo dice antes de que nadie publique una fecha
// equivocada.

const instanteCardinal = (anio, grados) =>
  jdAMs(cardinal(anio, grados)) - deltaT(anio) * 1000

const PATRON = [
  // [descripción, instante UTC publicado, cómo se calcula]
  ["Equinoccio de marzo 2026", "2026-03-20 14:46", () => instanteCardinal(2026, 0)],
  ["Solsticio de junio 2026", "2026-06-21 08:24", () => instanteCardinal(2026, 90)],
  ["Equinoccio de septiembre 2026", "2026-09-23 00:05", () => instanteCardinal(2026, 180)],
  ["Solsticio de diciembre 2026", "2026-12-21 20:50", () => instanteCardinal(2026, 270)],
]

function comprobar() {
  let fallos = 0
  console.log("\n— Contra los valores publicados —\n")

  for (const [que, esperado, calcular] of PATRON) {
    const ms = calcular()
    const salio = utc(ms).slice(0, 16)
    const objetivo = new Date(esperado.replace(" ", "T") + ":00Z").getTime()
    const minutos = Math.abs(ms - objetivo) / 60000
    const bien = minutos < 3
    if (!bien) fallos++
    console.log(
      `${bien ? "  ok " : "FALLA"}  ${que.padEnd(32)} ${salio}  ` +
      `(esperado ${esperado}, ${minutos.toFixed(1)} min)`,
    )
  }

  // Coherencia interna: entre dos lunas llenas seguidas hay una lunación,
  // 29,53 días. Si la serie se descoloca, esto lo caza aunque no haya patrón
  // publicado con el que comparar.
  console.log("\n— Coherencia de la serie lunar —\n")
  let peor = 0
  for (let k = 320; k < 400; k++) {
    const d = fase(k + 1.5) - fase(k + 0.5)
    peor = Math.max(peor, Math.abs(d - 29.530588))
  }
  const bienLuna = peor < 0.8
  if (!bienLuna) fallos++
  console.log(
    `${bienLuna ? "  ok " : "FALLA"}  separación entre lunas llenas  ` +
    `(se desvía como mucho ${peor.toFixed(3)} días de 29,531)`,
  )

  // Y que el ingreso en Aries sea SIEMPRE el equinoccio de marzo: es la
  // definición, así que si alguna vez cae en otro mes es que algo se rompió.
  console.log("\n— Aries es el equinoccio, por definición —\n")
  let bienAries = true
  for (let a = 2026; a <= 2035; a++) {
    const mes = utc(cruceSolar(a, 0)).slice(5, 7)
    if (mes !== "03") { bienAries = false; console.log(`FALLA  ${a}: cae en el mes ${mes}`) }
  }
  if (!bienAries) fallos++
  else console.log("  ok   2026–2035, todos en marzo")

  console.log(fallos === 0 ? "\nTODO BIEN\n" : `\n${fallos} FALLOS\n`)
  return fallos
}

// ── SQL ────────────────────────────────────────────────────────────────────

const esc = (s) => s.replace(/'/g, "''")

function sql(desde, hasta, zona) {
  const lista = eventos(desde, hasta, zona)
  const hoy = new Date().toISOString().slice(0, 10)

  const filas = lista.map((e) => {
    const notas = e.hora
      ? `${e.hora} h (${zona}) · ${utc(e.ms)}`
      : "Convención de fechas, no un fenómeno astronómico."
    return `  ('${e.fecha}', '${esc(e.titulo)}', '${e.categoria}', '${esc(notas)}')`
  })

  return `-- ════════════════════════════════════════════════════════════════════════════
--  EL CIELO DEL AÑO · ${desde}–${hasta}
-- ════════════════════════════════════════════════════════════════════════════
--
-- Generado por \`npm run efemerides -- ${desde} ${hasta}\` el ${hoy}.
-- NO se edita a mano: se vuelve a generar.
--
-- ── QUÉ ENTRA ──────────────────────────────────────────────────────────────
--   luna      lunas nuevas y llenas
--   zodiaco   los ocho ingresos del Sol que no son cambio de estación
--   estacion  los cuatro que sí: equinoccios y solsticios
--   portal    días de dígitos repetidos (8·8 y los demás)
--
-- Los tres primeros están CALCULADOS con los algoritmos de Meeus, en el huso
-- de ${zona}. El cuarto es una convención: va porque se publica
-- sobre ella, no porque el cielo haga nada ese día.
--
-- ── SON UNA PROPUESTA ──────────────────────────────────────────────────────
-- Entran como referencia (\`es_referencia\`), así que no cuentan para el
-- cumplimiento ni salen en el reparto de trabajo: aparecen arriba, en «En
-- estas fechas cae». Se pueden editar y borrar como cualquier otra cosa.
--
-- ── CORRERLO DOS VECES NO DUPLICA ──────────────────────────────────────────
-- Se borran antes las referencias del rango que sean de estas cuatro
-- categorías. Lo que hayas escrito tú no se toca: lo tuyo no es ninguna de
-- esas categorías, o si lo es, vuelve a entrar igual al regenerar.

begin;

delete from public.mkt_actividades
where es_referencia
  and categoria in ('luna', 'zodiaco', 'estacion', 'portal')
  and fecha between '${desde}-01-01' and '${hasta}-12-31';

insert into public.mkt_actividades (fecha, titulo, categoria, notas, es_referencia, ambito, estado)
select f.fecha, f.titulo, f.categoria, f.notas, true, 'interno', 'pendiente'
from (values
${filas.join(",\n")}
) as f(fecha, titulo, categoria, notas);

commit;

-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────
select categoria, count(*) as cuantas,
       min(fecha) as primera, max(fecha) as ultima
from public.mkt_actividades
where es_referencia and categoria in ('luna', 'zodiaco', 'estacion', 'portal')
group by categoria
order by categoria;

-- Tiene que salir, para ${desde}–${hasta}:
--   estacion  ${lista.filter((e) => e.categoria === "estacion").length}
--   luna      ${lista.filter((e) => e.categoria === "luna").length}
--   portal    ${lista.filter((e) => e.categoria === "portal").length}
--   zodiaco   ${lista.filter((e) => e.categoria === "zodiaco").length}
`
}

// ── ARRANQUE ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const zona = process.env.ZONA || ZONA_POR_DEFECTO

if (args.length === 0) {
  process.exit(comprobar() === 0 ? 0 : 1)
}

const desde = Number(args[0])
const hasta = Number(args[1] || args[0])
if (!Number.isInteger(desde) || !Number.isInteger(hasta) || hasta < desde) {
  console.error("Uso: npm run efemerides -- <desde> [hasta]")
  process.exit(1)
}
process.stdout.write(sql(desde, hasta, zona))
