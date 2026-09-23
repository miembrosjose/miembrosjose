// LECTURA PROFUNDA DE NUMEROLOGÍA CÓSMICA — "Revelación Numerológica de Misión".
// Generación local, determinística e interpretativa (no repite datos crudos,
// no suena a calculadora ni a horóscopo). Lenguaje propio de Los 144.000.
// Sin dependencias externas. Usa el resultado gratuito + contexto de bitácora.

import {
  type NumerologiaResultado, num, planoTexto,
  normalizeName, letterValue, isVowel, reduceKeepMasters, sumDigits,
  MASTER_NUMBERS, planoDeNumero,
} from "./numerologia"
import { OBJETIVOS_5 } from "./objetivos-data"

export type BitacoraContexto = {
  historia: boolean
  linaje: boolean
  territorio: boolean
  acciones: boolean
  revelaciones: boolean
}

export type MatrizLetra = { letra: string; numero: number; tipo: "vocal" | "consonante" }
export type MatrizData = {
  letras: MatrizLetra[]
  sumaVocales: number
  sumaConsonantes: number
  sumaTotal: number
  conteo: Record<number, number>   // cuántas veces aparece cada número 1-9
  dominantes: number[]
  ausentes: number[]
  maestros: number[]
  karmicos: number[]
}
export type Casa = { n: number; nombre: string; tema: string; veces: number; texto: string }
export type CaminoDetalle = {
  fecha: string; sumaVisible: string; total: number; reduccion: number; maestro: boolean
}
export type CicloActual = {
  anioPersonal: number; mesPersonal: number; diaPersonal: number
  texto: string; accion: string
}
export type LecturaProfunda = {
  revelacion: string
  matriz: MatrizData
  camino: CaminoDetalle
  caminoTexto: string
  alma: string
  presencia: string
  servicio: string
  verbo: string
  planoTexto: string
  casas: Casa[]
  heridaMedicina: string
  territorio: string
  ciclo: CicloActual
  objetivos: { inicio: string; texto: string; lista: string[] }
  acciones: string[]
  frase: string
  generadoEn: string
}

// ── Bancos interpretativos (lenguaje propio) ────────────────────────────
const DESEO: Record<number, string> = {
  1: "afirmarte, iniciar y sostener tu propia voluntad sin pedir permiso",
  2: "amar, unirte y sentir armonía dentro del vínculo",
  3: "crear, expresarte y compartir tu alegría con el mundo",
  4: "construir algo sólido y pertenecer a una estructura con sentido",
  5: "vivir en libertad, experimentar y no quedar atado a nada",
  6: "cuidar, sanar y tejer belleza y hogar a tu alrededor",
  7: "comprender el fondo de la existencia y encontrar la verdad",
  8: "manifestar, prosperar y ejercer un poder que sea justo",
  9: "servir, abrazar lo humano y entregar tu amor al todo",
}
const PRESENCIA: Record<number, string> = {
  1: "una persona autónoma y directa, con iniciativa propia",
  2: "alguien sensible, amable y conciliador",
  3: "una presencia luminosa y expresiva que contagia vida",
  4: "alguien confiable, firme y de palabra sostenida",
  5: "una energía magnética, cambiante y libre",
  6: "una figura protectora, cálida y responsable",
  7: "alguien reservado y profundo, con un aura de misterio",
  8: "una presencia de autoridad, capaz y organizada",
  9: "alguien noble y comprensivo, de mirada amplia",
}
const SERVICIO: Record<number, string> = {
  1: "abrir caminos y liderar procesos que otros aún no ven",
  2: "tejer alianzas, mediar y sostener lo que une",
  3: "comunicar, inspirar y dar palabra a lo que la Red necesita nombrar",
  4: "construir estructuras y sostener el trabajo que hace posible lo colectivo",
  5: "mover, conectar y llevar a otros la experiencia del cambio",
  6: "cuidar, armonizar comunidades y sanar los vínculos",
  7: "investigar, comprender y custodiar el conocimiento profundo",
  8: "gestionar recursos y poner la abundancia al servicio del todo",
  9: "acompañar cierres, abrazar lo humano y servir sin fronteras",
}
const CASAS_META: { nombre: string; tema: string }[] = [
  { nombre: "Identidad", tema: "voluntad, afirmación y la figura del padre" },
  { nombre: "Emoción", tema: "receptividad, vínculo y la figura de la madre" },
  { nombre: "Expresión", tema: "creatividad, hermanos y niño interior" },
  { nombre: "Raíz", tema: "cuerpo, trabajo, estructura y territorio" },
  { nombre: "Movimiento", tema: "cambio, libertad y energía vital / masculino interno" },
  { nombre: "Amor", tema: "hogar, belleza, cuidado y femenino interno" },
  { nombre: "Silencio", tema: "espiritualidad, introspección y herencia cultural" },
  { nombre: "Poder", tema: "estrategia, prosperidad y talentos" },
  { nombre: "Conciencia", tema: "cosmos, inconsciente y servicio universal" },
]
const KARMICO_TXT: Record<number, string> = {
  13: "el 13, que pide constancia y honestidad en el esfuerzo: lo que se construye sin atajos, se sostiene",
  14: "el 14, que aprende la medida dentro de la libertad: habitar los sentidos sin dispersión ni exceso",
  16: "el 16, que invita a soltar lo que el ego levantó para reconstruir sobre lo verdadero",
  19: "el 19, que aprende a recibir y a estar con otros sin depender ni imponerse",
}
const ANIO_PERSONAL: Record<number, { tema: string; accion: string }> = {
  1: { tema: "un año de inicios: se abre un ciclo nuevo de nueve años", accion: "Planta la semilla de lo que quieres ver crecer y da el primer paso, aunque sea pequeño." },
  2: { tema: "un año de vínculos, paciencia y maduración", accion: "Cultiva alianzas y deja madurar los procesos; coopera en vez de forzar." },
  3: { tema: "un año de expresión, creatividad y encuentro", accion: "Muestra tu voz, crea y comparte: el gozo abrirá puertas este ciclo." },
  4: { tema: "un año de trabajo, orden y cimientos", accion: "Ordena tu base material y tu cuerpo; construye con método y disciplina amorosa." },
  5: { tema: "un año de cambio, movimiento y libertad", accion: "Permite lo nuevo y suelta lo que ata, pero fluye sin dispersarte." },
  6: { tema: "un año de hogar, amor y responsabilidad", accion: "Cuida tus vínculos y tu casa; armoniza aquello que amas." },
  7: { tema: "un año de introspección, estudio y sabiduría", accion: "Retírate a escuchar tu interior: menos afuera, más adentro." },
  8: { tema: "un año de manifestación, poder y cosecha material", accion: "Toma responsabilidad, gestiona tus recursos y recoge lo sembrado." },
  9: { tema: "un año de cierre, entrega y limpieza", accion: "Suelta lo que cumplió su ciclo; perdona, ordena y despídete para renacer." },
}

function reduce9(n: number): number { let x = n; while (x > 9) x = String(x).split("").reduce((a, d) => a + Number(d), 0); return x }
/**
 * Busca la entrada de un número en una tabla de contenido.
 *
 * El 0 merece mención aparte: aparece cuando el nombre no tiene ninguna
 * vocal —"Ng", "Mtz", o cualquier cosa que al normalizar se quede sin
 * ellas—. Ningún número de la numerología es 0, así que ninguna tabla lo
 * tiene, y el resultado era la palabra "undefined" en mitad de la lectura.
 *
 * Aquí no se inventa un número: quien pregunte por el 0 se lleva null y es
 * cosa de quien llama decir la verdad —que no hay vocales que leer— en vez
 * de rellenar el hueco con la ficha de otro.
 */
function bank<T>(m: Record<number, T>, n: number): T | null {
  if (n === 0) return null
  return m[n] ?? m[reduce9(n)] ?? null
}
function joinNums(ns: number[]): string {
  if (ns.length === 0) return ""
  if (ns.length === 1) return `${ns[0]}`
  return `${ns.slice(0, -1).join(", ")} y ${ns[ns.length - 1]}`
}

export function generarLecturaProfunda(
  r: NumerologiaResultado,
  ctx: BitacoraContexto,
  now: Date = new Date(),
): LecturaProfunda {
  const clean = normalizeName(r.nombre)
  const letras: MatrizLetra[] = clean.split("").map((ch) => ({
    letra: ch, numero: letterValue(ch), tipo: isVowel(ch) ? "vocal" : "consonante",
  }))
  const vocales = letras.filter((l) => l.tipo === "vocal")
  const consonantes = letras.filter((l) => l.tipo === "consonante")
  const sumaVocales = vocales.reduce((a, l) => a + l.numero, 0)
  const sumaConsonantes = consonantes.reduce((a, l) => a + l.numero, 0)
  const sumaTotal = sumaVocales + sumaConsonantes

  const conteo: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }
  for (const l of letras) if (l.numero) conteo[l.numero]++
  const maxVeces = Math.max(...Object.values(conteo))
  const dominantes = Object.keys(conteo).map(Number).filter((k) => conteo[k] === maxVeces && maxVeces > 0)
  const ausentes = Object.keys(conteo).map(Number).filter((k) => conteo[k] === 0)

  const maestros = MASTER_NUMBERS.filter((m) =>
    [r.caminoVida, r.alma, r.personalidad, r.expresion].includes(m))
  // Números kármicos: aparecen cuando la suma ANTES de reducir es 13/14/16/19.
  const karmicSet = new Set<number>()
  for (const raw of [sumDigits(r.fecha), sumaVocales, sumaConsonantes, sumaTotal]) {
    if ([13, 14, 16, 19].includes(raw)) karmicSet.add(raw)
  }
  const karmicos = Array.from(karmicSet).sort((a, b) => a - b)

  const matriz: MatrizData = {
    letras, sumaVocales, sumaConsonantes, sumaTotal, conteo, dominantes, ausentes, maestros, karmicos,
  }

  // ── 3. Camino álmico (detalle del cálculo) ────────────────────────────
  const dig = r.fecha.replace(/\D/g, "")
  const total = sumDigits(dig)
  const reduccion = reduceKeepMasters(total)
  const camino: CaminoDetalle = {
    fecha: r.fecha.split("-").reverse().join("/"),
    sumaVisible: dig.split("").join(" + "),
    total,
    reduccion,
    maestro: MASTER_NUMBERS.includes(reduccion),
  }
  const cN = num(reduccion)
  const caminoTexto =
    `Tu camino álmico ${reduccion}${camino.maestro ? " (número maestro)" : ""} es la frecuencia con la que tu ` +
    `conciencia entró en la materia. Encarnas como ${cN.titulo}: una vida que aprende a ${cN.esencia}. ` +
    cN.lectura + (camino.maestro
      ? " Al ser un número maestro, esta frecuencia trae una exigencia mayor: no se cumple en lo pequeño, sino cuando la pones al servicio de algo más grande que tú."
      : "")

  // ── 4-6. Alma / Presencia / Servicio ──────────────────────────────────
  // Sin vocales en el nombre no hay número de alma. Se dice, en vez de
  // fabricar una lectura que no se sostiene.
  const deseo = bank(DESEO, r.alma)
  const alma = deseo === null
    ? `El número del alma sale de las vocales de tu nombre, y el que escribiste no tiene ninguna. ` +
      `No es un fallo ni te falta nada: simplemente aquí no hay nada que leer. ` +
      `Si tu nombre completo lleva vocales y no las pusiste, escríbelo entero y vuelve a generar la lectura.`
    : `Tus vocales suman la vibración ${r.alma} · ${num(r.alma).titulo}. En lo secreto, tu alma desea ${deseo}. ` +
      `Esta es la necesidad interna que rara vez nombras en voz alta, y también tu búsqueda espiritual más honda. ` +
      `${num(r.alma).lectura} Cuando esa energía deja de mirarse a sí misma, se eleva y se convierte en servicio.`
  const presencia =
    `Tus consonantes suman la vibración ${r.personalidad} · ${num(r.personalidad).titulo}. Ante el mundo apareces como ${bank(PRESENCIA, r.personalidad)}. ` +
    `Esa es la forma que otros perciben antes de conocer tu interior: una presencia que proyecta ${num(r.personalidad).esencia}. ` +
    (r.alma === 0
      ? `Conviene que esta máscara no se endurezca: su tarea es armonizar con lo que sientes por dentro, para que dentro y fuera hablen el mismo idioma.`
      : `Conviene que esta máscara no se endurezca; su tarea es armonizar con lo que tu alma (${r.alma}) siente por dentro, para que dentro y fuera hablen el mismo idioma.`)
  const servicio =
    `Tu nombre completo vibra en ${r.expresion} · ${num(r.expresion).titulo}. Tu dirección de servicio apunta a ${bank(SERVICIO, r.expresion)}. ` +
    `No es un destino fijo ni una obligación: es la corriente natural por la que tu aporte a la Red fluye con menos esfuerzo y más verdad. ` +
    `${num(r.expresion).lectura}`

  // ── 7. El verbo del nombre ─────────────────────────────────────────────
  const gd = num(r.grupoDominante.numero)
  const pv = r.primeraVocal
  const verbo =
    `La primera vocal de tu nombre es la ${pv.letra || "—"}${pv.numero ? ` (vibración ${pv.numero}, de ${num(pv.numero).esencia})` : ""}: ` +
    `marca el tono con que tu energía entra en cada escena antes de que digas una palabra. ` +
    `El número que más se repite —el ${r.grupoDominante.numero}, ${gd.titulo}— es el verbo que tu vida conjuga una y otra vez: ${gd.esencia}. ` +
    (ausentes.length
      ? `Las vibraciones ausentes en tu nombre (${joinNums(ausentes)}) señalan cualidades que no vienen dadas: no son carencias, son el terreno que esta vida te invita a cultivar conscientemente. `
      : `Tu nombre reparte su fuerza entre todas las vibraciones: una arquitectura equilibrada, sin grandes vacíos. `) +
    `Así, tu nombre funciona como emisión y como campo: una palabra que, al pronunciarse, orienta.`

  // ── 8. Plano dominante ─────────────────────────────────────────────────
  const otrosPlanos: Record<string, string> = {
    mental: "sueles reaccionar desde la idea y la voluntad", físico: "sueles reaccionar desde la acción y el cuerpo",
    emocional: "sueles reaccionar desde el sentir y el vínculo", intuitivo: "sueles reaccionar desde la percepción y el silencio",
  }
  const planoIntegrar: Record<string, string> = {
    mental: "el plano emocional: bajar la idea al cuerpo y al vínculo", físico: "el plano intuitivo: hacer sitio al silencio antes de actuar",
    emocional: "el plano mental: dar estructura y dirección a lo que sientes", intuitivo: "el plano físico: aterrizar la visión en actos concretos",
  }
  const planoDeepTexto =
    `${planoTexto(r.plano)} Desde ahí procesas tu misión: es tu puerta natural. Bajo presión, ${otrosPlanos[r.plano]}. ` +
    `El plano que esta vida te pide integrar es ${planoIntegrar[r.plano]}.`

  // ── 9. Casas internas ──────────────────────────────────────────────────
  const casas: Casa[] = CASAS_META.map((meta, i) => {
    const n = i + 1
    const veces = conteo[n]
    const e = num(n).esencia
    let texto: string
    if (veces === 0) {
      texto = `Sin letras en esta casa: el campo de ${meta.tema} no viene resuelto de fábrica. Es una invitación abierta a desarrollar ${e} de forma consciente.`
    } else if (veces === 1) {
      texto = `Presencia justa: el campo de ${meta.tema} está sostenido con equilibrio por la vibración de ${e}.`
    } else {
      texto = `Casa acentuada (×${veces}): mucha energía concentrada en ${meta.tema}. Un talento fuerte en ${e} que, si se satura, conviene repartir hacia otras casas.`
    }
    return { n, nombre: meta.nombre, tema: meta.tema, veces, texto }
  })

  // ── 10. Herida, medicina y linaje ──────────────────────────────────────
  const heridaMedicina =
    `Tu combinación de alma ${r.alma} y presencia ${r.personalidad} puede señalar una tensión entre lo que sientes por dentro y lo que muestras afuera: ` +
    `esa distancia, cuando se observa con cariño, suele ser la puerta de tu medicina. La frecuencia de ${num(r.alma).titulo} sugiere que ` +
    `aquello que aprendiste a callar es, precisamente, lo que vienes a ofrecer sanado. ` +
    (ctx.linaje
      ? "Tu bitácora de linaje ya guarda registros: conviene releerlos con esta lectura al lado, porque ahí es donde el patrón familiar pide orden."
      : "Aún no has trabajado tu linaje en la bitácora; hacerlo afinaría mucho esta parte, porque la energía familiar que busca orden se vuelve visible al escribirla.") +
    ` Lo que ordenes en ti —sin inventar culpables ni heridas que no recuerdas— libera también a quienes vinieron antes, y esa reparación se transforma en servicio.`

  // ── 11. Territorio y misión ────────────────────────────────────────────
  const territorioAccion: Record<string, string> = {
    mental: "estudio, memoria y transmisión de la historia sagrada del lugar",
    físico: "custodia concreta: limpieza, cuidado y presencia en la tierra que habitas",
    emocional: "comunidad y sanación de los vínculos del territorio",
    intuitivo: "escucha del lugar, registro de señales y memoria sutil",
  }
  const territorio = r.ciudad
    ? `Habitas hoy ${r.ciudad}. Tu código no llegó ahí por azar: la relación simbólica entre tu frecuencia ${reduccion} y ese campo sugiere que tu servicio territorial ` +
      `se inclina hacia ${territorioAccion[r.plano]}. No se trata de la historia del lugar —eso lo descubres tú—, sino de cómo tu energía puede servirle: ` +
      `escuchando primero, actuando después.`
    : ""

  // ── 12. Ciclo actual ───────────────────────────────────────────────────
  const day = parseInt(r.fecha.split("-")[2] || "0", 10)
  const month = parseInt(r.fecha.split("-")[1] || "0", 10)
  const curY = now.getFullYear(), curM = now.getMonth() + 1, curD = now.getDate()
  const anioPersonal = reduceKeepMasters(sumDigits(`${day}${month}${curY}`))
  const mesPersonal = reduceKeepMasters(reduce9(anioPersonal) + curM)
  const diaPersonal = reduceKeepMasters(reduce9(mesPersonal) + curD)
  // El año personal suma los dígitos de una fecha, así que nunca puede ser 0
  // y `bank` siempre encuentra entrada. El respaldo está para no obligar al
  // tipo a fiarse de ese razonamiento.
  const ap = bank(ANIO_PERSONAL, anioPersonal) ?? ANIO_PERSONAL[1]
  const ciclo: CicloActual = {
    anioPersonal, mesPersonal, diaPersonal,
    texto: `Ahora mismo transitas un Año Personal ${anioPersonal}: ${ap.tema}. Dentro de él, el Mes Personal ${mesPersonal} matiza el momento, y el Día Personal ${diaPersonal} marca el tono de hoy.`,
    accion: ap.accion,
  }

  // ── 13. Los cinco objetivos ────────────────────────────────────────────
  const inicioPorPlano: Record<string, string> = {
    emocional: "comunidad", intuitivo: "irradiar", físico: "territorio", mental: "catastrofe",
  }
  const inicioId = inicioPorPlano[r.plano] || "comunidad"
  const inicioObj = OBJETIVOS_5.find((o) => o.id === inicioId) || OBJETIVOS_5[0]
  const objetivos = {
    inicio: inicioObj.title,
    texto:
      `Los cinco objetivos de Los 144.000 son colectivos: todos los sostenemos juntos, ninguno te pertenece en exclusiva. ` +
      `Tu código no te asigna una única tarea, pero sí indica una puerta de entrada: por tu plano ${r.plano}, tu servicio suele empezar a ordenarse desde «${inicioObj.title.charAt(0) + inicioObj.title.slice(1).toLowerCase()}». ` +
      `Desde ahí, con el tiempo, tu frecuencia se derrama hacia los otros cuatro.`,
    lista: OBJETIVOS_5.map((o) => o.title.charAt(0) + o.title.slice(1).toLowerCase()),
  }

  // ── 14. Acciones de integración ────────────────────────────────────────
  const acciones: string[] = []
  if (!ctx.historia) acciones.push("Completa tu Historia Personal en la bitácora: sin ese mapa, la medicina de tu lectura no puede afinarse.")
  if (!ctx.linaje) acciones.push("Escribe una carta a tu linaje: nombra una creencia heredada que quieras transformar y quémala o guárdala como acto simbólico.")
  if (!ctx.territorio) acciones.push("Investiga una memoria o una herida del territorio que habitas hoy y regístrala en tu bitácora de territorio.")
  const porPlano: Record<string, string> = {
    intuitivo: "Activa una práctica semanal de silencio de veinte minutos: escucha la señal antes de actuar y anota lo que llega.",
    mental: "Antes de una decisión importante, escribe la idea y déjala reposar un día: separa la voluntad del impulso.",
    emocional: "Registra tus sueños y las emociones al despertar durante una semana; busca el patrón que se repite.",
    físico: "Da forma concreta a una intención con un acto simbólico en tu territorio: un objeto, un lugar, un gesto.",
  }
  acciones.push(porPlano[r.plano])
  acciones.push("Crea o busca un pequeño nodo de comunidad: invita a una persona a caminar contigo un tramo del proceso.")
  const accionesFinal = acciones.slice(0, 5)

  // ── 15. Frase de misión ────────────────────────────────────────────────
  const frase =
    `Mi servicio comienza cuando pongo mi ${num(r.alma).esencia.split(",")[0]} al servicio de la Red, y dejo que mi ${num(r.expresion).esencia.split(",")[0]} se vuelva camino para otros.`

  // ── 1. Mensaje principal de revelación (se compone al final) ───────────
  const revelacion = componerRevelacion(r, matriz, reduccion, ctx)

  return {
    revelacion, matriz, camino, caminoTexto, alma, presencia, servicio, verbo,
    planoTexto: planoDeepTexto, casas, heridaMedicina, territorio, ciclo, objetivos,
    acciones: accionesFinal, frase, generadoEn: now.toISOString(),
  }
}

function componerRevelacion(r: NumerologiaResultado, m: MatrizData, camino: number, ctx: BitacoraContexto): string {
  const c = num(camino), a = num(r.alma), pe = num(r.personalidad), ex = num(r.expresion)
  const nombreCorto = r.nombre.split(" ")[0]
  const p1 =
    `${nombreCorto}, tu nombre y tu fecha no son etiquetas: son una partitura. ` +
    `Encarnaste con la frecuencia del ${camino}, ${c.titulo}, lo que significa que tu conciencia vino a aprender a ${c.esencia}. ` +
    (bank(DESEO, r.alma) === null
      ? `Tu nombre no trae vocales, así que esta lectura se apoya solo en lo que muestras: la energía del ${r.personalidad}, ${pe.titulo}. `
      : `Bajo esa nota principal, tu alma late en el ${r.alma} —desea ${bank(DESEO, r.alma)}— mientras ante el mundo apareces con la energía del ${r.personalidad}, ${pe.titulo}. `) +
    `Esa diferencia entre lo que sientes y lo que muestras no es contradicción: es el espacio donde ocurre tu trabajo.`
  const p2 =
    `Tu expresión completa apunta al ${r.expresion}, ${ex.titulo}: la corriente por la que tu vida quiere volverse útil${bank(SERVICIO, r.expresion) ? `, hacia ${bank(SERVICIO, r.expresion)}` : ""}. ` +
    (m.dominantes.length
      ? `En tu nombre insiste con fuerza la vibración ${joinNums(m.dominantes)} —el patrón que repites hasta convertirlo en maestría—. `
      : ``) +
    (m.ausentes.length
      ? `Y guardan silencio las vibraciones ${joinNums(m.ausentes)}: no son fallas, son la tierra que viniste a labrar de forma consciente. `
      : `Ninguna vibración falta en tu nombre: traes un instrumento completo. `) +
    (m.maestros.length ? `Portas número(s) maestro(s) (${joinNums(m.maestros)}): una exigencia mayor que solo se cumple al servicio de algo más grande que tú. ` : ``) +
    (m.karmicos.length ? `Aparece también una deuda kármica: ${m.karmicos.map((k) => KARMICO_TXT[k]).join("; ")}. ` : ``)
  const p3 =
    (r.nombreCosmico ? `El nombre cósmico que reconoces —${r.nombreCosmico}— añade una capa de intención elegida sobre la heredada: es la dirección que tu alma ya sabe. ` : ``) +
    (r.ciudad ? `Que habites hoy ${r.ciudad} no es casual dentro de tu mapa: tu frecuencia tiene algo que ofrecer a ese campo. ` : ``) +
    (ctx.historia || ctx.linaje || ctx.territorio
      ? `Y como ya has escrito en tu Gran Bitácora, esta lectura no cae en el vacío: se apoya en el trabajo que vienes haciendo. `
      : `Cuando empieces a escribir tu historia en la Gran Bitácora, esta lectura se volverá aún más precisa. `) +
    `Esto es apenas el umbral: tu plano ${r.plano} marca desde dónde procesas la misión, y a partir de aquí la revelación se despliega paso a paso.`
  return [p1, p2, p3].join("\n\n")
}

// ── Exportación a texto (para bitácora / PDF) ───────────────────────────
export function lecturaProfundaATexto(r: NumerologiaResultado, L: LecturaProfunda): string {
  const nl = "\n"
  const sec = (t: string, body: string) => `\n\n## ${t}\n${body}`
  const matrizLine = L.matriz.letras.map((x) => `${x.letra}=${x.numero}`).join("  ")
  return [
    `REVELACIÓN NUMEROLÓGICA DE MISIÓN`,
    `${r.nombre} · ${r.fecha.split("-").reverse().join("/")}${r.ciudad ? ` · ${r.ciudad}` : ""}${r.nombreCosmico ? ` · ${r.nombreCosmico}` : ""}`,
    sec("1 · Mensaje principal de revelación", L.revelacion),
    sec("2 · Matriz numerológica del nombre",
      `${matrizLine}${nl}Vocales: ${L.matriz.sumaVocales} · Consonantes: ${L.matriz.sumaConsonantes} · Total: ${L.matriz.sumaTotal}` +
      `${nl}Dominantes: ${joinNums(L.matriz.dominantes) || "—"} · Ausentes: ${joinNums(L.matriz.ausentes) || "—"}` +
      `${nl}Maestros: ${joinNums(L.matriz.maestros) || "—"} · Kármicos: ${joinNums(L.matriz.karmicos) || "—"}`),
    sec("3 · Camino álmico", `${L.camino.sumaVisible} = ${L.camino.total} → ${L.camino.reduccion}${L.camino.maestro ? " (maestro)" : ""}${nl}${L.caminoTexto}`),
    sec("4 · Impulso del alma", L.alma),
    sec("5 · Presencia externa", L.presencia),
    sec("6 · Dirección de servicio", L.servicio),
    sec("7 · El verbo del nombre", L.verbo),
    sec("8 · Plano dominante", L.planoTexto),
    sec("9 · Casas internas de la matriz", L.casas.map((c) => `Casa ${c.n} — ${c.nombre} (${c.tema}): ${c.texto}`).join(nl)),
    sec("10 · Herida, medicina y linaje", L.heridaMedicina),
    L.territorio ? sec("11 · Territorio y misión", L.territorio) : "",
    sec("12 · Ciclo actual", `Año personal ${L.ciclo.anioPersonal} · Mes ${L.ciclo.mesPersonal} · Día ${L.ciclo.diaPersonal}${nl}${L.ciclo.texto}${nl}Acción: ${L.ciclo.accion}`),
    sec("13 · Los cinco objetivos", `${L.objetivos.texto}${nl}${L.objetivos.lista.map((o, i) => `${i + 1}. ${o}`).join(nl)}`),
    sec("14 · Acciones de integración", L.acciones.map((a, i) => `${i + 1}. ${a}`).join(nl)),
    sec("15 · Frase de misión", L.frase),
  ].filter(Boolean).join("")
}
