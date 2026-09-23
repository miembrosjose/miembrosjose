// LA REVISIÓN DE LOS CINCUENTA PORTALES.
//
// ── QUÉ ES `estado` Y POR QUÉ HACÍA FALTA ESTE ARCHIVO ─────────────────────
// Cada portal lleva un campo `estado`: "seed" | "draft" | "reviewed". Es un
// control interno de redacción que la interfaz no enseña nunca. Los cincuenta
// llevaban meses en "draft" y ninguno llegó a "reviewed", porque no había
// escrito en ninguna parte QUÉ tenía que cumplir un portal para merecerlo.
// Una marca que no se puede ganar no informa de nada.
//
// Esto es esa definición, y es ejecutable. Un portal está revisado cuando:
//
//   1. Ningún campo suyo afirma procedencia extraterrestre como hecho, ni
//      predice, ni diagnostica. Es la regla que gobierna el módulo, aplicada
//      a TODOS los campos de los cincuenta. Las pruebas anteriores solo la
//      comprobaban sobre la lectura ya compuesta de los portales que resonaban
//      en cinco cartas de ejemplo: cobertura parcial por diseño.
//   2. No nombra ninguna de las fuentes vetadas.
//   3. Cada campo tiene sustancia: nada a medias, nada de relleno.
//   4. Lo que se presenta como pregunta es una pregunta.
//   5. Su texto es suyo: nada copiado de otro portal.
//
// Mientras este archivo pase, `estado: "reviewed"` significa algo concreto y
// comprobable. Si alguien reescribe un portal y rompe una regla, la prueba lo
// detiene antes de que llegue a nadie.

import { test } from "node:test"
import assert from "node:assert/strict"

import { PORTALES_CONTENIDO } from "../app/miembros/_lib/cartografia-estelar/content/portales/index.ts"
import { PORTALES } from "../app/miembros/_lib/cartografia-estelar/catalog/portales.ts"
import type { ContenidoPortal } from "../app/miembros/_lib/cartografia-estelar/content/tipos.ts"

const IDS = Object.keys(PORTALES_CONTENIDO)

/** Todo el texto de un portal, aplanado, con el nombre de su campo. */
function camposDe(p: ContenidoPortal): Array<[string, string]> {
  const fuera: Array<[string, string]> = []

  const sueltos: Array<keyof ContenidoPortal> = [
    "astronomia", "esencia", "fraseUmbral", "arquetipo", "nucleo",
    "aprendizajeCentral", "paradoja", "preguntaUmbral",
  ]
  for (const k of sueltos) fuera.push([String(k), String(p[k])])

  const listas: Array<keyof ContenidoPortal> = [
    "potenciales", "tensiones", "cuandoIntegrado", "cuandoSobrecargado",
    "patronesCotidianos", "preguntas", "journalPrompts",
  ]
  for (const k of listas) {
    const v = p[k] as string[]
    v.forEach((t, i) => fuera.push([`${String(k)}[${i}]`, t]))
  }

  for (const [k, v] of Object.entries(p.relaciones)) fuera.push([`relaciones.${k}`, v])
  for (const [k, v] of Object.entries(p.framework144)) fuera.push([`framework144.${k}`, v])
  fuera.push(["practicaBase.titulo", p.practicaBase.titulo])
  fuera.push(["practicaBase.cierre", p.practicaBase.cierre])
  p.practicaBase.pasos.forEach((t, i) => fuera.push([`practicaBase.pasos[${i}]`, t]))

  return fuera
}

// ── 1 · Lo que ningún texto puede decir ─────────────────────────────────────
//
// No es una lista de palabras feas: cada expresión convierte una observación
// en una afirmación sobre lo que alguien ES o sobre lo que le VA a pasar, que
// es justo lo que este módulo no hace.
const PROHIBIDO: Array<[RegExp, string]> = [
  // Procedencia como hecho
  [/\bvienes de\b/i, "afirma procedencia"],
  [/\beres (de |un |una )?(sirian|pleyadian|arcturian|lyran|orion)/i, "afirma procedencia"],
  [/\btu alma (nació|viene|procede)\b/i, "afirma procedencia"],
  [/\bperteneces a (esta|esa|la) (raza|estirpe|familia estelar)\b/i, "afirma procedencia"],
  [/\b(demuestra|confirma|prueba) tu origen\b/i, "afirma procedencia"],
  [/\btu (verdadero )?hogar (es|está) en\b/i, "afirma procedencia"],
  // Predicción
  [/\bvas a (conocer|encontrar|recibir|lograr|conseguir)\b/i, "predice"],
  [/\b(este|el próximo) (año|mes|ciclo) (traerá|será|te)\b/i, "predice"],
  [/\bte espera\b/i, "predice"],
  [/\bsucederá\b/i, "predice"],
  // Diagnóstico
  //
  // La regla apunta a lo que se le dice A QUIEN LEE, no a la palabra suelta.
  // Un patrón cotidiano puede describir perfectamente que alguien responde a
  // una queja con un diagnóstico: eso es una observación sobre una conducta,
  // no un diagnóstico sobre quien está leyendo. La primera versión de esta
  // lista marcaba esa frase de Arcturus, y la frase era correcta.
  [/\b(trastorno|patológic|síndrome)\b/i, "diagnostica"],
  [/\b(tu|tienes un) diagnóstico\b/i, "diagnostica"],
  [/\bte (han )?diagnostic/i, "diagnostica"],
  [/\btienes un problema\b/i, "diagnostica"],
  // Marcas de redacción a medias
  //
  // «pendiente» a secas NO vale: es una palabra corriente del castellano y
  // aparece con todo su sentido en siete portales —«una decisión pendiente»,
  // «algo que queda pendiente»—. Se buscan solo las formas que únicamente se
  // escriben cuando falta texto.
  [/\b(seed|draft|reviewed|lorem)\b/i, "marca de borrador"],
  [/pendiente de (escribir|redactar|revisi[óo]n|contenido)/i, "marca de borrador"],
  [/\b(por escribir|falta redactar|texto provisional|placeholder)\b/i, "marca de borrador"],
  [/\bfase semilla\b/i, "marca de borrador"],
  [/\bTODO\b/, "marca de borrador"],
]

/** Las fuentes que el módulo no usa ni cita, por encargo expreso. */
const FUENTES_VETADAS = [
  /\bgene keys\b/i, /\bhuman design\b/i, /\bley del uno\b/i, /\blaw of one\b/i,
  /\burantia\b/i, /\boahspe\b/i, /\bjulia balaz\b/i, /\bstarseed\b/i,
  /\bgalactic astro\b/i,
]

test("ningún campo de los cincuenta portales afirma, predice ni diagnostica", () => {
  const fallos: string[] = []
  for (const id of IDS) {
    for (const [campo, texto] of camposDe(PORTALES_CONTENIDO[id])) {
      for (const [re, motivo] of PROHIBIDO) {
        if (re.test(texto)) fallos.push(`${id}.${campo} ${motivo}: ${texto.slice(0, 80)}`)
      }
      for (const re of FUENTES_VETADAS) {
        if (re.test(texto)) fallos.push(`${id}.${campo} cita una fuente vetada: ${re}`)
      }
    }
  }
  assert.deepEqual(fallos.slice(0, 10), [])
})

// ── 2 · Sustancia ───────────────────────────────────────────────────────────
// Los mínimos no son arbitrarios: salen de medir el corpus entero y quedarse
// por debajo del más corto que hoy se considera bueno. Sirven para que un
// portal nuevo no entre con media frase, no para forzar a reescribir estos.
const MINIMOS: Record<string, number> = {
  astronomia: 180, esencia: 24, fraseUmbral: 28, arquetipo: 380,
  nucleo: 50, aprendizajeCentral: 40, paradoja: 45, preguntaUmbral: 24,
}
const LISTAS: Record<string, number> = {
  potenciales: 4, tensiones: 4, cuandoIntegrado: 3, cuandoSobrecargado: 3,
  patronesCotidianos: 4, preguntas: 4, journalPrompts: 3,
}

test("cada portal entrega todos sus campos con sustancia", () => {
  const fallos: string[] = []
  for (const id of IDS) {
    const bruto = PORTALES_CONTENIDO[id] as unknown as Record<string, unknown>

    for (const [campo, minimo] of Object.entries(MINIMOS)) {
      const v = String(bruto[campo] ?? "").trim()
      if (v.length < minimo) fallos.push(`${id}.${campo}: ${v.length} caracteres, mínimo ${minimo}`)
    }
    for (const [campo, cuantos] of Object.entries(LISTAS)) {
      const v = (bruto[campo] as string[]) ?? []
      if (v.length < cuantos) fallos.push(`${id}.${campo}: ${v.length} elementos, mínimo ${cuantos}`)
      v.forEach((t, i) => {
        if (t.trim().length < 20) fallos.push(`${id}.${campo}[${i}] demasiado corto`)
      })
    }

    const c = PORTALES_CONTENIDO[id]
    for (const [k, v] of Object.entries(c.relaciones)) {
      if (v.trim().length < 30) fallos.push(`${id}.relaciones.${k} demasiado corto`)
    }
    for (const [k, v] of Object.entries(c.framework144)) {
      if (v.trim().length < 30) fallos.push(`${id}.framework144.${k} demasiado corto`)
    }
    if (c.practicaBase.pasos.length < 2) fallos.push(`${id}: la práctica tiene menos de dos pasos`)
    if (c.practicaBase.cierre.trim().length < 20) fallos.push(`${id}: la práctica no cierra`)
  }
  assert.deepEqual(fallos.slice(0, 10), [])
})

// ── 3 · Las preguntas son preguntas ─────────────────────────────────────────
test("lo que se presenta como pregunta termina en interrogación", () => {
  const fallos: string[] = []
  for (const id of IDS) {
    const c = PORTALES_CONTENIDO[id]
    if (!c.preguntaUmbral.trim().endsWith("?")) fallos.push(`${id}.preguntaUmbral no es una pregunta`)
    c.preguntas.forEach((q, i) => {
      if (!q.trim().endsWith("?")) fallos.push(`${id}.preguntas[${i}] no es una pregunta`)
    })
  }
  assert.deepEqual(fallos.slice(0, 10), [])
})

// ── 4 · Nada copiado de otro portal ─────────────────────────────────────────
test("ningún portal repite el texto de otro", () => {
  const visto = new Map<string, string>()
  const fallos: string[] = []
  for (const id of IDS) {
    for (const [campo, texto] of camposDe(PORTALES_CONTENIDO[id])) {
      const clave = `${campo.replace(/\[\d+\]/, "")}::${texto.trim().toLowerCase()}`
      const antes = visto.get(clave)
      if (antes && antes !== id) fallos.push(`${id}.${campo} repite lo de ${antes}`)
      else visto.set(clave, id)
    }
  }
  assert.deepEqual(fallos.slice(0, 10), [])
})

// ── 5 · Cobertura y coherencia del catálogo ─────────────────────────────────
test("los cincuenta del catálogo tienen contenido y ninguno sobra", () => {
  const delCatalogo = new Set(PORTALES.map((p) => p.id))
  assert.equal(delCatalogo.size, 50)
  for (const id of delCatalogo) assert.ok(PORTALES_CONTENIDO[id], `${id} sin contenido`)
  for (const id of IDS) assert.ok(delCatalogo.has(id), `${id} tiene contenido pero no está en el catálogo`)
  for (const id of IDS) assert.equal(PORTALES_CONTENIDO[id].id, id, `${id} lleva otro id dentro`)
})

// ── 6 · La marca de estado ──────────────────────────────────────────────────
test("todo portal que pasa esta revisión está marcado como revisado", () => {
  // Esta es la prueba que le da sentido al campo. Si alguien añade un portal
  // nuevo en "draft", las de arriba dirán si le falta algo; esta dirá que
  // todavía no se ha marcado como revisado.
  const sinRevisar = IDS.filter((id) => PORTALES_CONTENIDO[id].estado !== "reviewed")
  assert.deepEqual(sinRevisar, [], `portales sin marcar como revisados: ${sinRevisar.join(", ")}`)
})
