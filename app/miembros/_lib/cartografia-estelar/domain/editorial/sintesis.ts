// CARTOGRAFÍA ESTELAR 144 — síntesis de contactos múltiples.
//
// CAPA B. Aquí vive la parte que distingue esta herramienta de una lista de
// datos: qué ocurre cuando varios contactos del mismo portal se leen juntos.
//
// ── POR QUÉ NO SE INTERPRETA CONTACTO A CONTACTO ───────────────────────────
// Tres contactos leídos por separado dan tres frases sueltas. Leídos juntos
// dicen algo que ninguno decía solo: que el tema atraviesa varias funciones
// a la vez, o que entra por lo conocido y por lo que falta aprender, o que
// aparece a la vez como recurso y como fricción.
//
// Las reglas están ordenadas por especificidad: primero las configuraciones
// concretas, y solo si ninguna se cumple, las generales. Todas son
// deterministas: la misma cartografía produce siempre el mismo texto.

import { PUNTOS } from "../../content/puntos.content"
import { POLO_DE_PORTAL, EJES } from "../../content/ejes.content"
import { contenidoPortal } from "../../content/portales"
import { ORBE_EXACTO } from "../../resonancia/config"
import type { Cartografia, Contacto, PuntoNatalId, ResonanciaPortal } from "../types"
import type { ContenidoPortal } from "../../content/tipos"

const TENSOS: ReadonlySet<string> = new Set(["cuadratura", "oposicion"])
const FLUIDOS: ReadonlySet<string> = new Set(["trigono", "sextil"])

function nombre(p: PuntoNatalId): string {
  return PUNTOS[p].nombre
}

/** Une una lista en castellano: "A, B y C". */
function enumerar(xs: string[]): string {
  if (xs.length === 0) return ""
  if (xs.length === 1) return xs[0]
  return `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`
}

/** El núcleo del portal, en minúscula inicial, para encajarlo en una frase. */
function nucleoEnFrase(c: ContenidoPortal): string {
  const n = c.nucleo
  return n.charAt(0).toLowerCase() + n.slice(1).replace(/\.$/, "")
}

function puntosUnicos(contactos: Contacto[]): PuntoNatalId[] {
  const vistos: PuntoNatalId[] = []
  for (const c of contactos) if (!vistos.includes(c.punto)) vistos.push(c.punto)
  return vistos
}

/**
 * Lo que une todos los contactos de un portal.
 *
 * Devuelve null con un solo contacto: con uno no hay nada que unir, y
 * fabricar una síntesis ahí sería inventar.
 */
export function sintetizarContactos(
  r: ResonanciaPortal,
  contenido: ContenidoPortal,
): string | null {
  const cs = r.contactos
  if (cs.length < 2) return null

  const puntos = puntosUnicos(cs)
  const tiene = (p: PuntoNatalId) => puntos.includes(p)
  const tema = nucleoEnFrase(contenido)

  const tensos = cs.filter((c) => TENSOS.has(c.aspecto))
  const fluidos = cs.filter((c) => FLUIDOS.has(c.aspecto))

  // ── Regla 1: el eje nodal completo ──
  // Los dos nodos a la vez es la configuración más informativa que puede
  // darse en un portal: el tema toca lo ya practicado y lo que falta por
  // practicar al mismo tiempo.
  if (tiene("nodo_norte") && tiene("nodo_sur")) {
    const otros = puntos.filter((p) => p !== "nodo_norte" && p !== "nodo_sur")
    const extra = otros.length
      ? ` Además aparece en ${enumerar(otros.map(nombre))}, de modo que el tema no se queda en una cuestión de dirección vital: toca también ${otros.length === 1 ? "esa función concreta" : "esas funciones"} en el día a día.`
      : ""
    return `Este portal aparece conectado con los dos extremos de tu eje nodal a la vez. Uno señala lo que ya tienes practicado y el otro la dirección que cuesta más, y aquí ambos apuntan al mismo asunto: ${tema}. Eso hace que el tema no quede limitado a una sola parte de tu experiencia, sino que aparezca tanto en lo que te sale solo como en lo que llevas tiempo posponiendo.${extra}`
  }

  // ── Regla 2: Sol y Luna ──
  if (tiene("sol") && tiene("luna")) {
    return `Este portal toca a la vez tu Sol y tu Luna: aquello con lo que te identificas conscientemente y aquello que responde antes de que pienses. Cuando un mismo tema —${tema}— aparece en las dos, deja de ser algo que haces en ciertas situaciones y pasa a estar tanto en lo que eliges como en lo que te sale sin elegirlo. Suele ser difícil de ver precisamente por eso: no hay una parte de ti desde la que observarlo.`
  }

  // ── Regla 3: el Ascendente con un punto de fondo ──
  if (tiene("ascendente") && puntos.length >= 2) {
    const otros = puntos.filter((p) => p !== "ascendente")
    return `El Ascendente está implicado junto con ${enumerar(otros.map(nombre))}. Eso conecta la manera en que entras en las situaciones con algo que opera más al fondo: lo que muestras primero y lo que sostiene ese gesto apuntan al mismo asunto, ${tema}. Cuando coinciden así, lo que otros ven de entrada no es una fachada sobre otra cosa; es la misma cosa vista desde la puerta.`
  }

  // ── Regla 4: Medio Cielo con otra función ──
  if (tiene("medio_cielo") && puntos.length >= 2) {
    const otros = puntos.filter((p) => p !== "medio_cielo")
    return `El Medio Cielo aparece junto con ${enumerar(otros.map(nombre))}. Lo que se ve de ti desde fuera y lo que ocurre en ${otros.length === 1 ? "esa función" : "esas funciones"} están tocando el mismo tema: ${tema}. Cuando coinciden, aquello por lo que te reconocen tiende a coincidir con algo que de verdad te ocupa, lo cual es menos frecuente de lo que parece y conviene no desaprovechar.`
  }

  // ── Regla 5: el mismo punto natal por varias anclas ──
  const repetido = puntos.find(
    (p) => cs.filter((c) => c.punto === p).length > 1,
  )
  if (repetido && puntos.length === 1) {
    const n = cs.filter((c) => c.punto === repetido).length
    return `${nombre(repetido)} forma contacto con ${n} de las anclas de este portal. Astronómicamente eso ocurre porque esas estrellas están próximas entre sí en el cielo, de modo que un mismo aspecto las alcanza a todas: por eso el cálculo cuenta entero el contacto más fuerte y atenúa los demás. En la lectura significa que el tema entra por una sola vía —${nombre(repetido).toLowerCase()}— pero lo hace de forma concentrada, sin repartirse por otras funciones.`
  }

  // ── Regla 6: tensión y fluidez a la vez ──
  if (tensos.length > 0 && fluidos.length > 0) {
    const nt = enumerar(puntosUnicos(tensos).map(nombre))
    const nf = enumerar(puntosUnicos(fluidos).map(nombre))
    return `El mismo tema aparece aquí de dos maneras opuestas. Por ${nt} llega con fricción: no se ajusta solo y pide decidir cada vez. Por ${nf} llega con facilidad, tanta que probablemente no lo consideres un recurso. Es una combinación útil: lo que fluye por un lado es exactamente lo que puede aliviar la fricción del otro, y suele estar sin usar porque nadie relaciona las dos cosas.`
  }

  // ── Regla 7: todo tenso ──
  if (tensos.length === cs.length) {
    const ns = enumerar(puntos.map(nombre))
    return `Todos los contactos de este portal son de fricción, y llegan por ${ns}. Eso no significa que el tema vaya mal: significa que no se integra solo. ${tema.charAt(0).toUpperCase()}${tema.slice(1)} es aquí algo que pide una respuesta deliberada en cada ocasión concreta, y no un recurso disponible por defecto. Los territorios así suelen ser donde alguien acaba desarrollando verdadera destreza, precisamente porque hay que resolverlos muchas veces.`
  }

  // ── Regla 8: todo fluido ──
  if (fluidos.length === cs.length) {
    const ns = enumerar(puntos.map(nombre))
    return `Todos los contactos de este portal son de los que fluyen, por ${ns}. Suele traducirse en que el tema —${tema}— se expresa con naturalidad y no se percibe como una capacidad: se da por hecho que todo el mundo funciona así. Lo que conviene mirar aquí no es una dificultad sino un desaprovechamiento: algo que haces bien sin esfuerzo y por tanto sin darle uso.`
  }

  // ── Regla 9: general ──
  const ns = enumerar(puntos.map(nombre))
  return `Un mismo tema aparece en ${ns}. Cuando algo se repite por vías distintas deja de poder atribuirse a una circunstancia concreta: es más probable reconocerlo en situaciones que no se parecen entre sí. El asunto común es ${tema}`
}

/**
 * Lo que tal vez no habías visto.
 *
 * Obligatorio en toda lectura. Busca deliberadamente lo MENOS evidente: no
 * repite el contacto principal ni resume lo ya dicho. Las reglas van de lo
 * más específico a lo más general, y todas producen algo concreto.
 */
export function loQueNoHabiasVisto(
  carto: Cartografia,
  r: ResonanciaPortal,
  contenido: ContenidoPortal,
): string {
  const cs = r.contactos
  const puntos = puntosUnicos(cs)
  const tiene = (p: PuntoNatalId) => puntos.includes(p)

  // ── Regla 1: eje nodal completo ──
  // Con ambos nodos, lo no evidente casi nunca es elegir bien: es el criterio
  // con el que se decide qué sigue formando parte de la propia vida.
  if (tiene("nodo_norte") && tiene("nodo_sur")) {
    return `Podrías pensar que aquí el tema principal es elegir correctamente entre lo que ya sabes hacer y lo que te falta. Sin embargo, la presencia simultánea de ambos nodos sugiere otra pregunta, menos cómoda: qué criterio utilizas para decidir qué merece seguir formando parte de tu vida y qué ya cumplió su función. No se trata de abandonar lo conocido ni de forzar lo nuevo, sino de comprobar si tienes un criterio propio para esa decisión o si la vienes tomando por acumulación.`
  }

  // ── Regla 2: un contacto exacto que NO es el más fuerte ──
  // El más fuerte se lleva toda la atención; un contacto muy ajustado en un
  // punto de menos peso pasa desapercibido y suele ser el más específico.
  const exactoSecundario = cs
    .slice(1)
    .find((c) => c.orbe < ORBE_EXACTO)
  if (exactoSecundario) {
    const p = PUNTOS[exactoSecundario.punto]
    return `La atención se va al contacto más marcado, pero hay otro que conviene mirar: el de ${p.nombre}, que es de los más ajustados de tu cartografía aunque pese menos en la cifra. Los contactos así suelen describir algo muy concreto en lugar de algo general. Aquí apunta a ${p.seReconoceEn.charAt(0).toLowerCase()}${p.seReconoceEn.slice(1)} Si el tema de este portal te resulta reconocible, es probable que sea ahí donde se ve con más nitidez, y no en lo más llamativo.`
  }

  // ── Regla 3: el punto dominante se repite en otro portal activo ──
  const puntoPrincipal = cs[0]?.punto
  if (puntoPrincipal) {
    const otroPortal = carto.resonancias.find(
      (x) =>
        x.portalId !== r.portalId &&
        x.contactos.some((c) => c.punto === puntoPrincipal),
    )
    if (otroPortal) {
      const otroContenido = contenidoPortal(otroPortal.portalId)
      if (otroContenido) {
        const p = PUNTOS[puntoPrincipal]
        return `${p.nombre} no aparece solo aquí: también forma contacto en otro portal de tu cartografía, cuyo tema es ${nucleoEnFrase(otroContenido)} Eso significa que esa misma función tuya está atendiendo dos asuntos que no se parecen, y que probablemente los estés viviendo como si fueran uno. Separarlos suele aclarar más que profundizar en cualquiera de los dos por separado: son dos demandas distintas sobre ${p.lente.split(" · ")[0]}.`
      }
    }
  }

  // ── Regla 4: contradicción con otro portal activo del mismo eje ──
  const miPolo = POLO_DE_PORTAL[r.portalId]
  if (miPolo) {
    const opuesto = carto.resonancias.find((x) => {
      const otro = POLO_DE_PORTAL[x.portalId]
      return otro && otro.eje === miPolo.eje && otro.polo !== miPolo.polo
    })
    if (opuesto) {
      const eje = EJES[miPolo.eje]
      const mio = eje.polos[miPolo.polo]
      const suyo = eje.polos[miPolo.polo === 0 ? 1 : 0]
      return `Este portal empuja hacia ${mio.toLowerCase()}, y hay otro activo en tu cartografía que empuja hacia ${suyo.toLowerCase()}. No es un error del cálculo ni una contradicción que haya que resolver: es una tensión real entre dos cosas que te importan y que no se satisfacen a la vez. ${eje.comoReconocerlo} Lo que suele pasar desapercibido es que cada vez que atiendes a una estás decidiendo sobre la otra, aunque no lo formules así.`
    }
  }

  // ── Regla 5: un solo contacto, y es fluido ──
  if (cs.length === 1 && FLUIDOS.has(cs[0].aspecto)) {
    const p = PUNTOS[cs[0].punto]
    return `Hay un solo contacto aquí, y es de los que fluyen. Eso hace fácil pasarlo por alto: lo que no cuesta no se nota. Conviene mirarlo al revés de lo habitual y preguntarse no qué te falta sino qué haces con tanta naturalidad por la vía de ${p.nombre.toLowerCase()} que has dejado de considerarlo algo. ${contenido.paradoja}`
  }

  // ── Regla 6: la paradoja del portal aplicada al punto dominante ──
  const p = puntoPrincipal ? PUNTOS[puntoPrincipal] : null
  if (p) {
    return `Lo menos evidente de este portal no está en lo que aporta sino en su reverso: ${contenido.paradoja.charAt(0).toLowerCase()}${contenido.paradoja.slice(1)} Al entrar por ${p.nombre.toLowerCase()}, esa contradicción se juega en ${p.seReconoceEn.charAt(0).toLowerCase()}${p.seReconoceEn.slice(1)} Es el sitio donde conviene mirar cuando el tema parezca resuelto.`
  }

  return contenido.paradoja
}
