// CARTOGRAFÍA ESTELAR 144 — configuración del cálculo.
//
// TODOS los números del método viven aquí. Ninguno dentro del motor.
//
// ── QUÉ SON ESTOS NÚMEROS ──────────────────────────────────────────────────
// Son la METODOLOGÍA 144: una elección nuestra, editable y declarada. No son
// reglas universales de la astrología, ni de ninguna escuela concreta, ni hay
// nada que las haga correctas más allá de que las hemos elegido y las
// explicamos. La pantalla de metodología las muestra tal cual.
//
// Cambiar un número aquí cambia todos los resultados. Por eso están juntos,
// comentados y en un solo archivo: para que se pueda auditar la decisión.

import type { AspectoId, PuntoNatalId } from "../domain/types"

// ── Aspectos ────────────────────────────────────────────────────────────────

export type DefinicionAspecto = {
  id: AspectoId
  nombre: string
  /** Ángulo exacto entre las dos longitudes eclípticas. */
  angulo: number
  /** Cuánto puede desviarse del ángulo exacto y seguir contando. */
  orbe: number
  /** Cuánto aporta este aspecto frente a los demás. */
  peso: number
}

export const ASPECTOS: DefinicionAspecto[] = [
  { id: "conjuncion", nombre: "Conjunción", angulo: 0, orbe: 2.0, peso: 1.0 },
  { id: "oposicion", nombre: "Oposición", angulo: 180, orbe: 1.5, peso: 0.8 },
  { id: "trigono", nombre: "Trígono", angulo: 120, orbe: 1.25, peso: 0.7 },
  { id: "cuadratura", nombre: "Cuadratura", angulo: 90, orbe: 1.25, peso: 0.65 },
  { id: "sextil", nombre: "Sextil", angulo: 60, orbe: 1.0, peso: 0.55 },
]

export function aspectoPorId(id: AspectoId): DefinicionAspecto {
  const a = ASPECTOS.find((x) => x.id === id)
  if (!a) throw new Error(`Aspecto desconocido: ${id}`)
  return a
}

// ── Peso de cada punto natal ────────────────────────────────────────────────
//
// El Sol, la Luna y el Ascendente pesan lo mismo y lo máximo: son los tres
// ejes que en cualquier lectura se consideran estructurales. Los planetas
// lentos pesan menos porque se mueven despacio y su posición la comparten
// millones de personas nacidas el mismo año: un contacto con Plutón dice
// menos sobre alguien concreto que uno con la Luna.

export const PESO_PUNTO: Record<PuntoNatalId, number> = {
  sol: 1.0,
  luna: 1.0,
  ascendente: 1.0,
  medio_cielo: 0.95,
  nodo_norte: 0.9,
  nodo_sur: 0.8,
  mercurio: 0.8,
  venus: 0.8,
  marte: 0.8,
  jupiter: 0.65,
  saturno: 0.65,
  urano: 0.5,
  neptuno: 0.5,
  pluton: 0.5,
}

// ── Curva del orbe ──────────────────────────────────────────────────────────

/**
 * Exponente de la cercanía al aspecto exacto.
 *
 * Con 1.5, un contacto a mitad del orbe permitido no vale la mitad sino un
 * 35%. Es deliberado: un aspecto casi exacto debe destacar claramente sobre
 * uno que apenas entra.
 */
export const EXPONENTE_CERCANIA = 1.5

// ── Saturación ──────────────────────────────────────────────────────────────

/**
 * Escala de la curva saturante.
 *
 * Sumar contactos sin límite haría que un portal con diez contactos flojos
 * superara a otro con uno exacto al Sol, que es justo lo contrario de lo que
 * queremos. La curva `1 - exp(-total/escala)` hace que los primeros contactos
 * cuenten mucho y los siguientes cada vez menos.
 *
 * Con escala 1.2: una conjunción exacta al Sol (fuerza 1.0) da ~57. Dos
 * contactos fuertes rondan 80. Hace falta una acumulación real para pasar de
 * 90, y el 100 es inalcanzable por definición.
 */
export const ESCALA_SATURACION = 1.2

// ── Anclas múltiples del mismo portal ───────────────────────────────────────
//
// PROBLEMA QUE RESUELVE, encontrado al probar el motor:
// Las Pléyades abarcan aproximadamente un grado de cielo. Con un orbe de 2°,
// un solo planeta forma el mismo aspecto con las SIETE anclas a la vez. Sin
// corrección eso se contaba siete veces y el cúmulo ganaba casi siempre, no
// por resonar más sino por tener más estrellas en la lista.
//
// DECISIÓN: un punto natal que toca varias anclas del mismo portal aporta
// entero su contacto más fuerte, y los demás con este factor. Un aspecto de
// un planeta es UNA relación, aunque alcance a varias estrellas vecinas.
//
// Los contactos siguen MOSTRÁNDOSE todos: lo que cambia es cuánto suman.
export const ECO_MISMA_ANCLA = 0.15

// ── Límites de la escala ────────────────────────────────────────────────────

/**
 * Tope. La curva tiende a 100 sin llegar, pero en coma flotante la
 * exponencial desborda a cero y devuelve 100 exacto. Se acota a mano para
 * que la promesa de la escala se cumpla de verdad.
 */
export const TOPE_RESONANCIA = 99.9

/**
 * Suelo. Un contacto justo en el borde del orbe produce un total minúsculo
 * que redondearía a cero. Si hay contacto, se ve: mostrar "Resonancia 0"
 * con un contacto listado debajo se contradice solo.
 */
export const SUELO_RESONANCIA = 0.1

// ── Umbrales de lectura ─────────────────────────────────────────────────────
// Solo para agrupar en la interfaz. No afectan al cálculo.

export const UMBRAL_ALTA = 60
export const UMBRAL_MEDIA = 25

/** Un contacto se llama "exacto" por debajo de este orbe. */
export const ORBE_EXACTO = 0.5
