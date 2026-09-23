// CARTOGRAFÍA ESTELAR 144 — de hora local de nacimiento a tiempo universal.
//
// ── POR QUÉ ESTO MERECE SU PROPIO ARCHIVO ──────────────────────────────────
// Es el punto donde más herramientas de este tipo se equivocan, y el error es
// invisible: no da un fallo, da un resultado plausible y equivocado.
//
// Una hora de desfase son quince grados de Ascendente. Basta con eso para que
// una conjunción exacta desaparezca o para que aparezca una que no existe.
//
// ── LO QUE NO SE HACE ──────────────────────────────────────────────────────
// `new Date("1975-06-15T04:30")` interpreta la cadena en la zona de QUIEN
// MIRA, no en la de quien nació. La misma carta daría resultados distintos
// abierta desde Madrid o desde Quito. Aquí no se usa nunca.
//
// ── LO QUE SÍ ──────────────────────────────────────────────────────────────
// La zona horaria del LUGAR de nacimiento, resuelta con la base IANA que trae
// el propio motor de JavaScript a través de `Intl`. Esa base conoce el horario
// de verano histórico: Madrid en junio de 1975 era UTC+2, y en enero de 2026
// es UTC+1. Se comprobó ejecutándolo.

import type { InstanteNatal, Nacimiento } from "../domain/types"

/**
 * Desfase de una zona horaria, en minutos, para un instante dado.
 *
 * Se obtiene comparando cómo el motor formatea el mismo instante en UTC y en
 * la zona pedida. Es el método que no depende de tablas propias ni de
 * librerías extra, y hereda el horario de verano histórico de la base IANA.
 */
function desfaseEnMinutos(utcMs: number, zona: string): number {
  const fecha = new Date(utcMs)

  // `en-CA` da formato AAAA-MM-DD, que se parsea sin ambigüedad.
  const formato = new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  })

  const partes = formato.formatToParts(fecha)
  const v = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value ?? "0")

  // Algunas zonas formatean medianoche como la hora 24. Se normaliza.
  const hora = v("hour") % 24

  const comoUTC = Date.UTC(v("year"), v("month") - 1, v("day"), hora, v("minute"), v("second"))
  return Math.round((comoUTC - Math.floor(utcMs / 1000) * 1000) / 60000)
}

/** Valida que la zona exista antes de usarla. */
export function zonaValida(zona: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zona })
    return true
  } catch {
    return false
  }
}

/**
 * Convierte el nacimiento local a instante universal.
 *
 * El desfase depende del instante, y el instante depende del desfase: es
 * circular. Se resuelve iterando dos veces, que es lo que hacen las librerías
 * de zonas horarias. La segunda pasada corrige el caso en que la primera
 * estimación cae al otro lado de un cambio de horario.
 */
export function aTiempoUniversal(n: Nacimiento): InstanteNatal {
  validarNacimiento(n)
  const zona = n.lugar.zonaHoraria

  if (!zonaValida(zona)) {
    throw new Error(`Zona horaria desconocida: ${zona}`)
  }

  // Punto de partida: se trata la hora local como si fuera UTC.
  const comoSiFueraUTC = Date.UTC(n.anio, n.mes - 1, n.dia, n.hora, n.minuto, 0)

  let desfase = desfaseEnMinutos(comoSiFueraUTC, zona)
  let utcMs = comoSiFueraUTC - desfase * 60000

  // Segunda pasada: con el instante ya aproximado, el desfase puede cambiar
  // si la primera estimación cayó al otro lado de un cambio de hora.
  const desfase2 = desfaseEnMinutos(utcMs, zona)
  if (desfase2 !== desfase) {
    desfase = desfase2
    utcMs = comoSiFueraUTC - desfase * 60000
  }

  return { utcMs, desfaseMinutos: desfase, desfaseTexto: textoDesfase(desfase) }
}

function textoDesfase(minutos: number): string {
  const signo = minutos < 0 ? "−" : "+"
  const abs = Math.abs(minutos)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return m === 0 ? `UTC${signo}${h}` : `UTC${signo}${h}:${String(m).padStart(2, "0")}`
}

/** Comprueba que los componentes formen una fecha real. Bisiesto a mano. */
export function validarNacimiento(n: Nacimiento): void {
  const { anio, mes, dia, hora, minuto } = n
  // El rango de las efemérides que usamos. Fuera de él no respondemos.
  if (!Number.isInteger(anio) || anio < 1800 || anio > 2200) {
    throw new Error("Año fuera de rango")
  }
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) throw new Error("Mes inválido")
  if (!Number.isInteger(hora) || hora < 0 || hora > 23) throw new Error("Hora inválida")
  if (!Number.isInteger(minuto) || minuto < 0 || minuto > 59) throw new Error("Minuto inválido")

  const bisiesto = (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0
  const dias = [31, bisiesto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (!Number.isInteger(dia) || dia < 1 || dia > dias[mes - 1]) {
    throw new Error("Día inválido para ese mes")
  }

  const { latitud, longitud } = n.lugar
  if (!Number.isFinite(latitud) || latitud < -90 || latitud > 90) {
    throw new Error("Latitud fuera de rango")
  }
  if (!Number.isFinite(longitud) || longitud < -180 || longitud > 180) {
    throw new Error("Longitud fuera de rango")
  }
}
