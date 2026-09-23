// CARTOGRAFÍA ESTELAR 144 — la lectura de conjunto.
//
// CAPA B compuesta sobre CAPA A. Determinista.
//
// Lo que produce este archivo es lo que NO se ve mirando los portales uno a
// uno: la secuencia que forman los tres más marcados, la polaridad que hay
// entre ellos, las capacidades que varios sostienen a la vez, y la pregunta
// que atraviesa el conjunto.
//
// Todo se deriva de los contactos reales. Nada se afirma sin que la interfaz
// pueda mostrar debajo de qué contactos sale.

import { portalPorId } from "../../catalog/portales"
import { contenidoPortal } from "../../content/portales"
import { PUNTOS } from "../../content/puntos.content"
import { EJES, POLO_DE_PORTAL } from "../../content/ejes.content"
import {
  CAPACIDADES, CAPACIDADES_DE_PORTAL, ZONAS, type ZonaIntegracion,
} from "../../content/capacidades.content"
import type { CapacidadId, EjeId } from "../../content/tipos"
import type { Cartografia, PuntoNatalId, ResonanciaPortal } from "../types"
import type { Practica } from "../../content/tipos"

// ── Verbos de la tríada ─────────────────────────────────────────────────────
//
// Un verbo por portal: qué operación hace ese tema. Es lo que permite leer
// los tres primeros como una secuencia y no como tres etiquetas sueltas.

export const VERBO_PORTAL: Record<string, string> = {
  pleyades: "percibir", sirio: "servir", arcturus: "ordenar",
  lyra: "crear", orion: "discernir", andromeda: "ampliar",
  alfa_centauri: "encarnar", antares: "atravesar", regulus: "sostener",
  centro_galactico: "orientar",
  aldebaran: "responder", fomalhaut: "destilar", spica: "afinar",
  altair: "reaccionar", deneb: "alcanzar", polaris: "referir",
  capella: "sustentar", canopus: "guiar", achernar: "cerrar",
  geminis: "alternar",
  perseo: "alternar el ritmo", casiopea: "permanecer", cefeo: "preparar",
  draco: "custodiar", ofiuco: "quedar aparte", hercules: "cargar",
  pegaso: "revisar", crux: "deducir", centaurus: "convivir",
  libra: "repartir",
  hydra: "continuar", corvus: "nombrar", phoenix: "recomenzar",
  grus: "migrar", aquarius: "aportar sin eco", capricornus: "acumular",
  sagittarius: "apuntar", sculptor: "quitar", m31: "relativizar",
  m42: "gestar",
  m1: "quedar después", m57: "desprenderse", omega_centauri: "heredar",
  m13: "emitir", virgo_m87: "gravitar", gran_atractor: "ser llevado",
  shapley: "desproporcionar", procyon: "anticipar", tau_ceti: "reconocer",
  epsilon_eridani: "formarse",
}

// ── Tríada ──────────────────────────────────────────────────────────────────

export type Triada = {
  portales: Array<{ id: string; nombre: string; verbo: string; resonancia: number }>
  /** "PERCIBIR → ORDENAR → SERVIR" */
  secuencia: string
  texto: string
}

/**
 * Los tres portales más marcados leídos como una secuencia.
 *
 * Devuelve null con menos de tres: con dos no hay secuencia, y fabricar una
 * sería inventar.
 */
export function construirTriada(carto: Cartografia): Triada | null {
  const top = carto.resonancias.slice(0, 3)
  if (top.length < 3) return null

  const portales = top.map((r) => ({
    id: r.portalId,
    nombre: portalPorId(r.portalId)?.nombre ?? r.portalId,
    verbo: VERBO_PORTAL[r.portalId] ?? "sostener",
    resonancia: r.resonancia,
  }))

  const secuencia = portales.map((p) => p.verbo.toUpperCase()).join(" → ")

  const descripciones = portales.map((p) => {
    const c = contenidoPortal(p.id)
    return c ? `${c.esencia.split(" · ")[0]}` : p.nombre
  })

  const texto =
    `No aparecen aquí como tres temas independientes. Una parte de tu mapa enfatiza ${descripciones[0]}. ` +
    `Otra enfatiza ${descripciones[1]}. La tercera enfatiza ${descripciones[2]}. ` +
    `Leídos en orden describen un recorrido —${secuencia.toLowerCase()}— que probablemente reconozcas en cómo abordas las cosas: ` +
    `por dónde empiezas, qué haces después y dónde suele quedarse lo que emprendes. ` +
    `El orden no es una jerarquía de importancia: es el orden en que estos tres temas están marcados en tu configuración.`

  return { portales, secuencia, texto }
}

// ── Eje de integración ──────────────────────────────────────────────────────

export type EjeDetectado = {
  ejeId: string
  nombre: string
  polos: [string, string]
  descripcion: string
  comoReconocerlo: string
  pregunta: string
  /** Qué portales de la cartografía empujan desde cada polo. */
  desde: Array<{ portalId: string; nombre: string; polo: 0 | 1; resonancia: number }>
}

/**
 * La polaridad real más marcada de una cartografía.
 *
 * Busca dos portales activos que empujen desde polos opuestos del mismo eje
 * y se queda con el par de mayor resonancia combinada. Si no hay ninguno,
 * devuelve null: no se fuerza un eje que no está.
 */
export function detectarEje(carto: Cartografia): EjeDetectado | null {
  const activos = carto.resonancias
    .map((r) => ({ r, polo: POLO_DE_PORTAL[r.portalId] }))
    .filter((x): x is { r: ResonanciaPortal; polo: { eje: EjeId; polo: 0 | 1 } } =>
      x.polo !== undefined)

  let mejor: { ejeId: string; suma: number; miembros: typeof activos } | null = null

  const porEje = new Map<string, typeof activos>()
  for (const a of activos) {
    const lista = porEje.get(a.polo.eje) ?? []
    lista.push(a)
    porEje.set(a.polo.eje, lista)
  }

  // Orden estable por identificador: dos ejes con la misma suma no deben
  // intercambiarse entre dos cálculos idénticos.
  for (const ejeId of [...porEje.keys()].sort()) {
    const miembros = porEje.get(ejeId)!
    const tiene0 = miembros.some((m) => m.polo.polo === 0)
    const tiene1 = miembros.some((m) => m.polo.polo === 1)
    if (!tiene0 || !tiene1) continue

    const suma = miembros.reduce((a, m) => a + m.r.resonancia, 0)
    if (!mejor || suma > mejor.suma) mejor = { ejeId, suma, miembros }
  }

  if (!mejor) return null

  const eje = EJES[mejor.ejeId as EjeId]
  return {
    ejeId: mejor.ejeId,
    nombre: eje.nombre,
    polos: eje.polos,
    descripcion: eje.descripcion,
    comoReconocerlo: eje.comoReconocerlo,
    pregunta: eje.pregunta,
    // Agrupados por polo, y dentro de cada polo de mayor a menor: así la
    // interfaz puede enfrentar los dos lados sin reordenar nada.
    desde: mejor.miembros
      .sort((a, b) =>
        a.polo.polo !== b.polo.polo
          ? a.polo.polo - b.polo.polo
          : b.r.resonancia - a.r.resonancia,
      )
      .map((m) => ({
        portalId: m.r.portalId,
        nombre: portalPorId(m.r.portalId)?.nombre ?? m.r.portalId,
        polo: m.polo.polo,
        resonancia: m.r.resonancia,
      })),
  }
}

// ── Mapa de capacidades ─────────────────────────────────────────────────────

export type CapacidadDetectada = {
  id: CapacidadId
  nombre: string
  descripcion: string
  puntoCiego: string
  /** Peso acumulado. Solo ordena: no se muestra como puntuación. */
  peso: number
  /** Qué portales y contactos la sustentan. Siempre se muestran. */
  sostenidaPor: Array<{
    portalId: string
    nombre: string
    resonancia: number
    puntos: string[]
  }>
}

/**
 * Las capacidades que sostienen los portales activos.
 *
 * Nunca se propone una capacidad sin los contactos que la sustentan: la
 * interfaz los muestra debajo. Entre cuatro y seis, que es lo que se puede
 * leer sin que se conviertan en una lista de halagos.
 */
export function mapaCapacidades(carto: Cartografia): CapacidadDetectada[] {
  const acum = new Map<CapacidadId, CapacidadDetectada>()

  for (const r of carto.resonancias) {
    const caps = CAPACIDADES_DE_PORTAL[r.portalId]
    if (!caps) continue
    const portal = portalPorId(r.portalId)
    const puntos = [...new Set(r.contactos.map((c) => PUNTOS[c.punto].nombre))]

    for (const id of caps) {
      const ya = acum.get(id)
      const entrada = {
        portalId: r.portalId,
        nombre: portal?.nombre ?? r.portalId,
        resonancia: r.resonancia,
        puntos,
      }
      if (ya) {
        ya.peso += r.resonancia
        ya.sostenidaPor.push(entrada)
      } else {
        const c = CAPACIDADES[id]
        acum.set(id, {
          id,
          nombre: c.nombre,
          descripcion: c.descripcion,
          puntoCiego: c.puntoCiego,
          peso: r.resonancia,
          sostenidaPor: [entrada],
        })
      }
    }
  }

  return [...acum.values()]
    .sort((a, b) => (b.peso !== a.peso ? b.peso - a.peso : a.id.localeCompare(b.id)))
    .slice(0, 6)
    .map((c) => ({
      ...c,
      sostenidaPor: c.sostenidaPor.sort((a, b) => b.resonancia - a.resonancia),
    }))
}

// ── Zonas de integración ────────────────────────────────────────────────────

/**
 * Como mucho tres. Se derivan de aspectos tensos y de la polaridad detectada.
 * Más de tres dejan de orientar y se convierten en una lista.
 */
export function zonasIntegracion(carto: Cartografia): ZonaIntegracion[] {
  const zonas: ZonaIntegracion[] = []
  const añadir = (z: ZonaIntegracion) => {
    if (zonas.length < 3 && !zonas.some((x) => x.nombre === z.nombre)) zonas.push(z)
  }

  const eje = detectarEje(carto)
  if (eje) {
    const porEje: Record<string, string> = {
      pertenencia_soberania: "pertenencia_con_criterio",
      servicio_limite: "servicio_sin_sacrificio",
      libertad_estructura: "estructura_con_holgura",
      sensibilidad_discernimiento: "claridad_con_cuidado",
      vision_encarnacion: "vision_con_encarnacion",
      poder_responsabilidad: "autonomia_sin_aislamiento",
      conocimiento_experiencia: "vision_con_encarnacion",
      movimiento_raiz: "movimiento_con_cierre",
      expansion_foco: "estructura_con_holgura",
    }
    const z = ZONAS[porEje[eje.ejeId]]
    if (z) añadir(z)
  }

  // Muchos contactos tensos sobre puntos de vínculo → sobrecarga en el vínculo.
  const tensos = carto.resonancias.flatMap((r) =>
    r.contactos.filter((c) => c.aspecto === "cuadratura" || c.aspecto === "oposicion"),
  )
  const puntosVinculo: PuntoNatalId[] = ["luna", "venus", "ascendente"]
  if (tensos.filter((c) => puntosVinculo.includes(c.punto)).length >= 2) {
    añadir(ZONAS.vinculo_sin_sobrecarga)
  }
  const puntosAccion: PuntoNatalId[] = ["marte", "saturno", "pluton"]
  if (tensos.filter((c) => puntosAccion.includes(c.punto)).length >= 2) {
    añadir(ZONAS.intensidad_con_tregua)
  }
  if (tensos.length >= 3) añadir(ZONAS.autonomia_sin_aislamiento)

  return zonas
}

// ── Pregunta central ────────────────────────────────────────────────────────

export type PreguntaCentral = {
  pregunta: string
  /** De dónde sale. Se muestra siempre: la pregunta no cae del cielo. */
  origen: string
}

/**
 * Una sola pregunta para toda la cartografía.
 *
 * Se deriva del portal principal, del punto natal más implicado, del aspecto
 * más repetido y de la polaridad detectada. Si hay eje, la pregunta del eje
 * gana: una polaridad real dice más que un portal aislado.
 */
export function preguntaCentral(carto: Cartografia): PreguntaCentral | null {
  const principal = carto.resonancias[0]
  if (!principal) return null

  const eje = detectarEje(carto)
  const contenido = contenidoPortal(principal.portalId)
  const puntoTop = carto.resumen.puntoMasImplicado

  if (eje) {
    // Uno de CADA polo. Tomar los dos de mayor resonancia daría dos portales
    // del mismo lado y la frase afirmaría una polaridad que no es tal.
    const a = eje.desde.find((d) => d.polo === 0)
    const b = eje.desde.find((d) => d.polo === 1)
    const nombres = a && b ? `${a.nombre} y ${b.nombre}` : eje.nombre
    return {
      pregunta: eje.pregunta,
      origen:
        `Sale de la polaridad entre ${nombres}, que en tu cartografía empujan desde extremos opuestos del mismo eje` +
        (puntoTop ? `, y del hecho de que ${PUNTOS[puntoTop].nombre} es el punto que aparece en más contactos.` : "."),
    }
  }

  if (contenido) {
    const portal = portalPorId(principal.portalId)
    return {
      pregunta: contenido.preguntaUmbral,
      origen:
        `Sale de ${portal?.nombre ?? principal.portalId}, el portal más marcado de tu cartografía` +
        (puntoTop ? `, y de ${PUNTOS[puntoTop].nombre}, que es el punto que aparece en más contactos.` : "."),
    }
  }

  return null
}

// ── Práctica principal ──────────────────────────────────────────────────────

export type PracticaAsignada = {
  practica: Practica
  portalId: string
  portalNombre: string
  origen: string
}

/** Una sola práctica: la del portal más marcado. */
export function practicaPrincipal(carto: Cartografia): PracticaAsignada | null {
  const principal = carto.resonancias[0]
  if (!principal) return null
  const contenido = contenidoPortal(principal.portalId)
  const portal = portalPorId(principal.portalId)
  if (!contenido || !portal) return null

  return {
    practica: contenido.practicaBase,
    portalId: principal.portalId,
    portalNombre: portal.nombre,
    origen: `Corresponde a ${portal.nombre}, el portal más marcado de tu cartografía. Es observable: no pide creer nada, solo registrar.`,
  }
}

// ── Diario de siete días ────────────────────────────────────────────────────

export const DIARIO_CARTOGRAFIA = [
  { dia: 1, pregunta: "¿Qué reconocí?" },
  { dia: 2, pregunta: "¿Qué rechacé?" },
  { dia: 3, pregunta: "¿Qué se repite?" },
  { dia: 4, pregunta: "¿Dónde aparece en mis vínculos?" },
  { dia: 5, pregunta: "¿Dónde aparece en mis decisiones?" },
  { dia: 6, pregunta: "¿Qué parece pedir integración?" },
  { dia: 7, pregunta: "¿Qué acción concreta puedo probar?" },
] as const
