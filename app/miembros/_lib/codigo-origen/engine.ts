// CÓDIGO DE ORIGEN — el cálculo.
//
// Usa tyme4ts (MIT) como motor de efemérides. El motor es INVISIBLE: de él
// salen índices numéricos, y todo lo que se muestra pasa antes por mappings.ts
// e interpretations.ts. Ningún término del motor llega a la interfaz.
//
// ── FECHAS ────────────────────────────────────────────────────────────────
// El nacimiento viaja SIEMPRE en componentes explícitos (año, mes, día, hora,
// minuto). Nunca se construye con `new Date(cadena)`: eso interpreta la cadena
// en UTC o en la zona del navegador según el formato, y un nacimiento a las
// 00:30 podría saltar al día anterior. Aquí el día que se escribe es el día que
// se calcula, esté quien esté mirando y desde donde esté.
//
// ── DETERMINISMO ──────────────────────────────────────────────────────────
// No hay Math.random ni Date.now en ninguna rama. Los mismos componentes
// producen siempre el mismo resultado.

import { SolarTime } from "tyme4ts"
import {
  ARQUETIPO_POR_RELACION,
  FRECUENCIA_POR_INDICE,
  PESOS,
  VECTOR_POR_POLARIDAD,
} from "./mappings"
import {
  ARQUETIPOS,
  COMBINACIONES,
  FRECUENCIAS,
  MATIZ_DEL_VECTOR,
  SINTESIS_CIERRE,
  SINTESIS_RAIZ_COMPARTIDA,
  SINTESIS_RAIZ_MARCADA,
  SINTESIS_REPARTO_PAREJO,
  VECTORES,
} from "./interpretations"
import type {
  CodigoOrigenResultado,
  FrecuenciaId,
  Nacimiento,
  PesoFrecuencia,
} from "./types"

/** Valida que los componentes formen una fecha real. Lanza si no. */
export function validarNacimiento(n: Nacimiento): void {
  const { anio, mes, dia, hora, minuto } = n
  if (!Number.isInteger(anio) || anio < 1900 || anio > 2100) {
    throw new Error("Año fuera de rango")
  }
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) throw new Error("Mes inválido")
  if (!Number.isInteger(hora) || hora < 0 || hora > 23) throw new Error("Hora inválida")
  if (!Number.isInteger(minuto) || minuto < 0 || minuto > 59) throw new Error("Minuto inválido")

  // Días del mes, con año bisiesto calculado a mano para no depender de Date.
  const bisiesto = (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0
  const dias = [31, bisiesto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (!Number.isInteger(dia) || dia < 1 || dia > dias[mes - 1]) {
    throw new Error("Día inválido para ese mes")
  }
}

/**
 * Calcula el Código de Origen.
 *
 * El reparto de frecuencias se construye leyendo las cuatro columnas del
 * nacimiento. De cada una se toma su capa visible y las capas que contiene,
 * con los pesos fijos de mappings.ts.
 */
export function calcularCodigoOrigen(nacimiento: Nacimiento): CodigoOrigenResultado {
  validarNacimiento(nacimiento)
  const { anio, mes, dia, hora, minuto } = nacimiento

  const momento = SolarTime.fromYmdHms(anio, mes, dia, hora, minuto, 0)
  const carta = momento.getSixtyCycleHour().getEightChar()
  const columnas = [carta.getYear(), carta.getMonth(), carta.getDay(), carta.getHour()]

  // ── Reparto de frecuencias ──────────────────────────────────────────────
  const puntos = new Map<FrecuenciaId, number>()
  const sumar = (indiceElemento: number, peso: number) => {
    const id = FRECUENCIA_POR_INDICE[indiceElemento]
    if (!id) return
    puntos.set(id, (puntos.get(id) ?? 0) + peso)
  }

  for (const columna of columnas) {
    // Capa visible.
    sumar(columna.getHeavenStem().getElement().getIndex(), PESOS.visible)

    // Capas contenidas: la principal pesa más que las residuales.
    //
    // El peso se decide por el TIPO que declara cada capa, no por su posición
    // en el array. Hoy el motor las devuelve ordenadas (principal primero),
    // pero eso no está documentado: si algún día cambiara el orden, leer por
    // posición repartiría los pesos al revés sin que nada fallara.
    //   tipo 2 = principal · 1 = media · 0 = residual
    const PESO_POR_TIPO: Record<number, number> = {
      2: PESOS.contenidaPrincipal,
      1: PESOS.contenidaMedia,
      0: PESOS.contenidaResidual,
    }
    for (const oculto of columna.getEarthBranch().getHideHeavenStems()) {
      const peso = PESO_POR_TIPO[Number(oculto.getType())]
      if (peso === undefined) continue
      sumar(oculto.getHeavenStem().getElement().getIndex(), peso)
    }
  }

  const total = [...puntos.values()].reduce((a, b) => a + b, 0) || 1

  // Las cinco siempre presentes, aunque alguna valga cero. El orden de empate
  // lo decide el índice del motor, que es fijo: nunca cambia entre ejecuciones.
  const reparto: PesoFrecuencia[] = repartirPorcentajes(
    FRECUENCIA_POR_INDICE.map((id) => ({ id, peso: puntos.get(id) ?? 0 })),
    total,
  ).sort((a, b) => {
    if (b.peso !== a.peso) return b.peso - a.peso
    return FRECUENCIA_POR_INDICE.indexOf(a.id) - FRECUENCIA_POR_INDICE.indexOf(b.id)
  })

  const raiz = FRECUENCIAS[reparto[0].id]
  const apoyo = FRECUENCIAS[reparto[1].id]
  const integracion = FRECUENCIAS[reparto[reparto.length - 1].id]

  // ── Vector y arquetipo ──────────────────────────────────────────────────
  const columnaDia = columnas[2]
  const nucleo = columnaDia.getHeavenStem()
  const polaridad = Number(nucleo.getYinYang())
  const vector = VECTORES[VECTOR_POR_POLARIDAD[polaridad] ?? "recepcion"]

  // La relación entre la columna del día y la del año: entre quien se es y
  // aquello de lo que se viene.
  const relacion = nucleo.getTenStar(columnas[0].getHeavenStem()).getIndex()
  const arquetipo = ARQUETIPOS[ARQUETIPO_POR_RELACION[relacion] ?? "resonancia"]

  return {
    nacimiento,
    reparto,
    raiz,
    apoyo,
    integracion,
    vector,
    arquetipo,
    // El par raíz+apoyo tiene texto propio para las 20 combinaciones posibles.
    // Si alguna faltara, se degrada a cadena vacía y la interfaz oculta el
    // bloque: nunca se muestra un hueco ni un texto genérico de relleno.
    combinacion: COMBINACIONES[`${raiz.id}-${apoyo.id}`] ?? "",
    matizDelVector: MATIZ_DEL_VECTOR[`${vector.id}-${raiz.id}`] ?? "",
    configuracion: construirSintesis(reparto, raiz.nombre, apoyo.nombre, integracion.nombre),
    _debug: {
      pilares: columnas.map((c) => c.getName()),
      elementoDia: nucleo.getElement().getIndex(),
      polaridadDia: polaridad,
      relacionOrigen: relacion,
    },
  }
}

/**
 * Reparte 100 puntos porcentuales entre las frecuencias, sin perder ni inventar
 * ninguno. Es el método del resto mayor.
 *
 * Redondear cada porcentaje por su cuenta parece lo natural y está mal: los
 * restos se pierden o se duplican, y la suma acaba dando 97 o 102 en vez de
 * 100. Aquí se reparte la parte entera primero y los puntos que sobran van a
 * quienes tenían el resto más alto.
 *
 * Los empates se rompen por el orden fijo de las frecuencias, nunca por azar:
 * los mismos pesos dan siempre el mismo reparto.
 */
function repartirPorcentajes(
  entradas: ReadonlyArray<{ id: FrecuenciaId; peso: number }>,
  total: number,
): PesoFrecuencia[] {
  // Sin peso no hay nada que repartir. No debería ocurrir —la capa visible de
  // las cuatro columnas siempre suma— pero un 0 aquí daría NaN en pantalla.
  if (total <= 0) {
    return entradas.map(({ id, peso }) => ({ id, peso, porcentaje: 0 }))
  }

  const exactos = entradas.map(({ id, peso }) => {
    const valor = (peso / total) * 100
    const entero = Math.floor(valor)
    return { id, peso, entero, resto: valor - entero }
  })

  let repartidos = exactos.reduce((a, e) => a + e.entero, 0)

  // Los puntos que faltan para 100 van a los restos más altos. Son cuatro como
  // mucho: nunca se puede perder un punto por frecuencia.
  const porResto = [...exactos].sort((a, b) => {
    if (b.resto !== a.resto) return b.resto - a.resto
    return FRECUENCIA_POR_INDICE.indexOf(a.id) - FRECUENCIA_POR_INDICE.indexOf(b.id)
  })

  const extra = new Map<FrecuenciaId, number>()
  let i = 0
  while (repartidos < 100 && i < porResto.length) {
    extra.set(porResto[i].id, 1)
    repartidos++
    i++
  }

  return exactos.map(({ id, peso, entero }) => ({
    id,
    peso,
    porcentaje: entero + (extra.get(id) ?? 0),
  }))
}

/**
 * La síntesis, armada con reglas deterministas sobre plantillas propias.
 *
 * Sin IA y sin llamadas externas: se genera al instante, cuesta cero y da
 * siempre el mismo texto para los mismos datos.
 */
function construirSintesis(
  reparto: PesoFrecuencia[],
  raiz: string,
  apoyo: string,
  integracion: string,
): string[] {
  const parrafos: string[] = []

  const primero = reparto[0].porcentaje
  const segundo = reparto[1].porcentaje
  const ultimo = reparto[reparto.length - 1].porcentaje

  // Regla 1 — cómo se reparte el peso.
  if (primero - ultimo <= 12) {
    parrafos.push(SINTESIS_REPARTO_PAREJO)
  } else if (primero - segundo <= 4) {
    parrafos.push(SINTESIS_RAIZ_COMPARTIDA)
  } else {
    parrafos.push(SINTESIS_RAIZ_MARCADA)
  }

  // Regla 2 — el eje entre raíz y apoyo.
  parrafos.push(
    `${raiz} sostiene el centro de tu configuración y ${apoyo} la acompaña. ` +
      `Esta combinación se relaciona con una forma de estar en la que lo primero da el tono y lo segundo le da matiz.`,
  )

  // Regla 3 — lo menos presente, nombrado sin convertirlo en carencia.
  parrafos.push(
    `${integracion} es la frecuencia menos representada aquí. No es algo que falte: ` +
      `es la dirección que queda por recorrer, y suele ser también donde aparece lo que más enseña.`,
  )

  parrafos.push(SINTESIS_CIERRE)
  return parrafos
}
