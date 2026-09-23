// CARTOGRAFÍA ESTELAR 144 — la lectura completa de un portal.
//
// CAPA B compuesta sobre CAPA A. Determinista: sin azar, sin reloj, sin red.
//
// ── LA REGLA QUE GOBIERNA ESTE ARCHIVO ─────────────────────────────────────
// Todo portal con contacto entrega lectura completa. No hay estados
// intermedios de cara a quien lee: ni "fase semilla", ni "pendiente", ni
// secciones vacías. Si algo faltara, la composición lo produce a partir de
// las piezas, y las pruebas comprueban que nunca sale undefined.
//
// ── CONTACTO, PATRÓN, EJE ──────────────────────────────────────────────────
// Un contacto es una puerta. Dos son un patrón. Tres o más, un eje
// estructural. Son términos editoriales nuestros para nombrar acumulación,
// no afirmaciones sobre el mundo.

import { portalPorId } from "../../catalog/portales"
import { aspectoPorId } from "../../resonancia/config"
import { contenidoPortal } from "../../content/portales"
import { PUNTOS } from "../../content/puntos.content"
import {
  ASPECTOS_CONTENIDO, DENSIDAD_TEXTO, EXACTITUD_TEXTO,
  clasificarDensidad, clasificarExactitud,
} from "../../content/aspectos.content"
import { cruceManual } from "../../content/cruces-4"
import { HERMANDAD, type Hermandad } from "../../content/hermandad.content"
import { explicarScore, type ExplicacionScore } from "./explicacion-score"
import { sintetizarContactos, loQueNoHabiasVisto } from "./sintesis"
import type { Cartografia, Contacto, PuntoNatalId, ResonanciaPortal } from "../types"
import type { ContenidoPortal, Practica } from "../../content/tipos"

/** Un contacto con todo lo necesario para mostrarlo y leerlo. */
export type ContactoLeido = {
  contacto: Contacto
  puntoNombre: string
  puntoLente: string
  puntoFuncion: string
  aspectoNombre: string
  aspectoAngulo: string
  aspectoCualidad: string
  aspectoComoSeExperimenta: string
  orbePermitido: number
  exactitudEtiqueta: string
  exactitudTexto: string
  /**
   * El tema del portal entrando por este punto.
   *
   * Para los diez portales con cruces manuales es un texto escrito a mano.
   * Para el resto se compone, y el resultado es igual de completo: cambia
   * quién lo escribió, no si hay lectura.
   */
  mensaje: string
  mensajeEsManual: boolean
}

export type LecturaPortal = {
  portalId: string
  nombre: string
  tipoEtiqueta: string
  resonancia: number
  contenido: ContenidoPortal

  // 1 — Qué es en el cielo (CAPA A)
  astronomia: string
  anclas: Array<{ nombre: string; designacion: string; magnitud?: number }>

  // 2, 3, 4 — Por qué está, cómo leerlo, qué toca
  contactos: ContactoLeido[]
  densidadEtiqueta: string
  densidadTexto: string

  // 5 — Lo que une todos tus contactos
  sintesis: string | null

  // 6 — Mensaje de tu configuración
  mensajePrincipal: string

  // 7, 8, 9
  potenciales: string[]
  tensiones: string[]
  patronesCotidianos: string[]
  cuandoIntegrado: string[]
  cuandoSobrecargado: string[]

  // 10 — Lo que tal vez no habías visto
  loQueNoHabiasVisto: string

  // 11, 12
  preguntaCentral: string
  preguntas: string[]
  journalPrompts: string[]

  // 13
  practica: Practica

  // Extras
  relaciones: ContenidoPortal["relaciones"]
  aprendizajeCentral: string
  paradoja: string
  framework144: ContenidoPortal["framework144"]

  /** Capa contemplativa: la afinidad leída como vínculo. */
  hermandad: Hermandad | null

  /** Para el desglose "¿Por qué esta cifra?" */
  explicacion: ExplicacionScore
}

const ETIQUETA_TIPO: Record<string, string> = {
  STAR_SYSTEM: "Sistema estelar",
  STAR_FAMILY: "Familia estelar",
  CONSTELLATION: "Constelación",
  CLUSTER: "Cúmulo",
  GALAXY: "Galaxia",
  NEBULA: "Nebulosa",
  COSMIC_REFERENCE: "Referencia cósmica",
}

export function etiquetaTipo(t: string): string {
  return ETIQUETA_TIPO[t] ?? t
}

/**
 * Compone el mensaje portal × punto para los cuarenta portales que no tienen
 * cruce escrito a mano.
 *
 * No es un relleno: combina el núcleo del portal, lo que significa que ese
 * punto concreto quede implicado y cómo tiende a experimentarse el aspecto.
 * El resultado es una lectura específica de esa combinación, no un texto
 * genérico repetido.
 */
function componerMensaje(
  contenido: ContenidoPortal,
  punto: PuntoNatalId,
  aspectoCualidad: string,
  aspectoComoSeExperimenta: string,
): string {
  const p = PUNTOS[punto]
  // La cualidad viene como "fluidez · recurso disponible": para incrustarla
  // en una frase se toma solo el primer término. Y `seReconoceEn` son varias
  // frases, así que va aparte y no dentro de otra.
  const cualidad = aspectoCualidad.split(" · ")[0]
  const nucleo = contenido.nucleo.charAt(0).toLowerCase() + contenido.nucleo.slice(1)

  return [
    p.cuandoEsTocado,
    `El tema de este portal es ${nucleo}`,
    `La relación entre ambos es de ${cualidad}: ${aspectoComoSeExperimenta}`,
    `Dónde observarlo: ${p.seReconoceEn}`,
  ].join(" ")
}

function leerContacto(c: Contacto, contenido: ContenidoPortal): ContactoLeido {
  const def = aspectoPorId(c.aspecto)
  const asp = ASPECTOS_CONTENIDO[c.aspecto]
  const p = PUNTOS[c.punto]
  const exactitud = clasificarExactitud(c.orbe, def.orbe)

  const manual = cruceManual(c.portalId, c.punto)

  return {
    contacto: c,
    puntoNombre: p.nombre,
    puntoLente: p.lente,
    puntoFuncion: p.funcion,
    aspectoNombre: asp.nombre,
    aspectoAngulo: asp.angulo,
    aspectoCualidad: asp.cualidad,
    aspectoComoSeExperimenta: asp.comoSeExperimenta,
    orbePermitido: def.orbe,
    exactitudEtiqueta: EXACTITUD_TEXTO[exactitud].etiqueta,
    exactitudTexto: EXACTITUD_TEXTO[exactitud].texto,
    mensaje: manual ?? componerMensaje(contenido, c.punto, asp.cualidad, asp.comoSeExperimenta),
    mensajeEsManual: manual !== null,
  }
}

/**
 * La lectura completa de un portal para una cartografía concreta.
 *
 * Devuelve null solo si el identificador no existe en el catálogo. Un portal
 * sin contacto no se abre: eso lo decide quien llama, no este archivo.
 */
export function leerPortal(
  carto: Cartografia,
  portalId: string,
): LecturaPortal | null {
  const portal = portalPorId(portalId)
  const contenido = contenidoPortal(portalId)
  if (!portal || !contenido) return null

  const r: ResonanciaPortal | undefined =
    carto.resonancias.find((x) => x.portalId === portalId)
  if (!r) return null

  const contactos = r.contactos.map((c) => leerContacto(c, contenido))
  const densidad = clasificarDensidad(r.contactos.length)

  return {
    portalId,
    nombre: portal.nombre,
    tipoEtiqueta: etiquetaTipo(portal.tipo),
    resonancia: r.resonancia,
    contenido,

    astronomia: contenido.astronomia,
    anclas: portal.anclas.map((a) => ({
      nombre: a.nombre,
      designacion: a.designacion,
      magnitud: a.magnitud,
    })),

    contactos,
    densidadEtiqueta: DENSIDAD_TEXTO[densidad].etiqueta,
    densidadTexto: DENSIDAD_TEXTO[densidad].texto,

    sintesis: sintetizarContactos(r, contenido),
    mensajePrincipal: contactos[0]?.mensaje ?? contenido.arquetipo,

    potenciales: contenido.potenciales,
    tensiones: contenido.tensiones,
    patronesCotidianos: contenido.patronesCotidianos,
    cuandoIntegrado: contenido.cuandoIntegrado,
    cuandoSobrecargado: contenido.cuandoSobrecargado,

    loQueNoHabiasVisto: loQueNoHabiasVisto(carto, r, contenido),

    preguntaCentral: contenido.preguntaUmbral,
    preguntas: contenido.preguntas,
    journalPrompts: contenido.journalPrompts,

    practica: contenido.practicaBase,

    relaciones: contenido.relaciones,
    aprendizajeCentral: contenido.aprendizajeCentral,
    paradoja: contenido.paradoja,
    framework144: contenido.framework144,

    hermandad: HERMANDAD[portalId] ?? null,
    explicacion: explicarScore(r),
  }
}
