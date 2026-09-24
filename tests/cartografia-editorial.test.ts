// Pruebas de la capa editorial de Cartografía Estelar 144.
//
// Las pruebas astronómicas viven en cartografia-estelar.test.ts y no se tocan.
// Aquí se protege lo que puede romperse al escribir contenido:
//
//   1. COBERTURA. Los cincuenta portales del catálogo tienen lectura completa.
//   2. NADA A MEDIAS DE CARA A NADIE. Ningún portal activo enseña una sección
//      vacía, ni la palabra "semilla", ni "undefined".
//   3. COMPOSICIÓN. Los cuarenta portales sin cruce manual componen texto
//      válido para cualquier punto y cualquier aspecto.
//   4. SELECCIÓN COMPARTIDA. Mapa y lista operan sobre el mismo estado.
//   5. DETERMINISMO. La misma cartografía produce siempre lo mismo, incluidas
//      las posiciones del mapa 3D.

import { test } from "node:test"
import assert from "node:assert/strict"

import { PORTALES, portalesActivos } from "../app/miembros/_lib/cartografia-estelar/catalog/portales.ts"
import { construirCartografia } from "../app/miembros/_lib/cartografia-estelar/domain/construir.ts"
import { calcularPuntos } from "../app/miembros/_lib/cartografia-estelar/astronomy/efemerides.ts"
import {
  PORTALES_CONTENIDO, PORTALES_CON_CRUCES_MANUALES,
} from "../app/miembros/_lib/cartografia-estelar/content/portales/index.ts"
import { CRUCES_MANUALES, cruceManual } from "../app/miembros/_lib/cartografia-estelar/content/cruces-4.ts"
import { PUNTOS, ORDEN_PUNTOS } from "../app/miembros/_lib/cartografia-estelar/content/puntos.content.ts"
import { ASPECTOS_CONTENIDO, clasificarDensidad, clasificarExactitud } from "../app/miembros/_lib/cartografia-estelar/content/aspectos.content.ts"
import { POLO_DE_PORTAL, EJES } from "../app/miembros/_lib/cartografia-estelar/content/ejes.content.ts"
import { CAPACIDADES, CAPACIDADES_DE_PORTAL } from "../app/miembros/_lib/cartografia-estelar/content/capacidades.content.ts"
import { leerPortal } from "../app/miembros/_lib/cartografia-estelar/domain/editorial/lectura-portal.ts"
import { explicarScore } from "../app/miembros/_lib/cartografia-estelar/domain/editorial/explicacion-score.ts"
import {
  construirTriada, detectarEje, mapaCapacidades, practicaPrincipal,
  preguntaCentral, zonasIntegracion, VERBO_PORTAL,
} from "../app/miembros/_lib/cartografia-estelar/domain/editorial/sintesis-global.ts"
import { proyectarPortales, proyectarPuntos, fondoEstrellas, direccion } from "../app/miembros/_lib/cartografia-estelar/proyeccion/esfera.ts"
import type { Nacimiento, PuntoNatalId } from "../app/miembros/_lib/cartografia-estelar/domain/types.ts"

const QUITO = { nombre: "Quito", latitud: -0.2299, longitud: -78.525, zonaHoraria: "America/Guayaquil" }
const MADRID = { nombre: "Madrid", latitud: 40.4168, longitud: -3.7038, zonaHoraria: "Europe/Madrid" }
const TOKIO = { nombre: "Tokio", latitud: 35.6762, longitud: 139.6503, zonaHoraria: "Asia/Tokyo" }

/** Varias cartas distintas: un fallo que solo aparece en una configuración
    concreta no se caza con un único caso. */
const CARTAS: Nacimiento[] = [
  { anio: 1988, mes: 12, dia: 27, hora: 14, minuto: 30, lugar: QUITO },
  { anio: 1975, mes: 6, dia: 3, hora: 4, minuto: 5, lugar: MADRID },
  { anio: 2001, mes: 9, dia: 18, hora: 23, minuto: 45, lugar: TOKIO },
  { anio: 1960, mes: 1, dia: 1, hora: 12, minuto: 0, lugar: MADRID },
  { anio: 1994, mes: 4, dia: 22, hora: 8, minuto: 17, lugar: QUITO },
]

// ── 1 · Cobertura ───────────────────────────────────────────────────────────

test("los cincuenta portales del catálogo tienen contenido", () => {
  const ids = PORTALES.map((p) => p.id)
  for (const id of ids) {
    assert.ok(PORTALES_CONTENIDO[id], `sin contenido: ${id}`)
  }
  assert.equal(Object.keys(PORTALES_CONTENIDO).length, ids.length)
})

test("no hay contenido huérfano sin portal en el catálogo", () => {
  const ids = new Set(PORTALES.map((p) => p.id))
  for (const id of Object.keys(PORTALES_CONTENIDO)) {
    assert.ok(ids.has(id), `contenido sin portal: ${id}`)
  }
})

test("ningún campo obligatorio de un portal queda vacío", () => {
  const TEXTOS = [
    "astronomia", "esencia", "fraseUmbral", "arquetipo", "nucleo",
    "aprendizajeCentral", "paradoja", "preguntaUmbral",
  ] as const
  const LISTAS = [
    "potenciales", "tensiones", "cuandoIntegrado", "cuandoSobrecargado",
    "patronesCotidianos", "preguntas", "journalPrompts",
  ] as const

  for (const [id, c] of Object.entries(PORTALES_CONTENIDO)) {
    for (const f of TEXTOS) {
      assert.ok(c[f] && String(c[f]).trim().length > 0, `${id}.${f} vacío`)
    }
    for (const f of LISTAS) {
      assert.ok(Array.isArray(c[f]) && c[f].length > 0, `${id}.${f} vacío`)
    }
    for (const f of ["consigo", "vinculos", "grupo", "servicio"] as const) {
      assert.ok(c.relaciones[f]?.trim(), `${id}.relaciones.${f} vacío`)
    }
    for (const f of ["fisico", "mental", "espiritual"] as const) {
      assert.ok(c.framework144[f]?.trim(), `${id}.framework144.${f} vacío`)
    }
    assert.ok(c.practicaBase.titulo.trim(), `${id} sin título de práctica`)
    assert.ok(c.practicaBase.pasos.length >= 3, `${id} con práctica de menos de 3 pasos`)
    assert.ok(c.practicaBase.cierre.trim(), `${id} sin cierre de práctica`)
  }
})

test("los arquetipos cumplen la extensión mínima", () => {
  for (const [id, c] of Object.entries(PORTALES_CONTENIDO)) {
    assert.ok(c.arquetipo.length >= 400, `${id}: arquetipo de ${c.arquetipo.length} caracteres`)
  }
})

test("cada portal tiene un verbo para la tríada y una capacidad asociada", () => {
  for (const p of PORTALES) {
    assert.ok(VERBO_PORTAL[p.id], `${p.id} sin verbo`)
    assert.ok(CAPACIDADES_DE_PORTAL[p.id]?.length, `${p.id} sin capacidades`)
    for (const cap of CAPACIDADES_DE_PORTAL[p.id]) {
      assert.ok(CAPACIDADES[cap], `${p.id} apunta a capacidad inexistente: ${cap}`)
    }
  }
})

test("el mapa de polos solo nombra portales reales y ejes reales", () => {
  const ids = new Set(PORTALES.map((p) => p.id))
  for (const [id, v] of Object.entries(POLO_DE_PORTAL)) {
    assert.ok(ids.has(id), `POLO_DE_PORTAL nombra un portal inexistente: ${id}`)
    assert.ok(EJES[v.eje], `${id} apunta a un eje inexistente: ${v.eje}`)
  }
})

// ── 2 · Nada a medias de cara a quien lee ───────────────────────────────────

test("ningún portal activo entrega una lectura incompleta", () => {
  for (const n of CARTAS) {
    const carto = construirCartografia(n)
    for (const r of carto.resonancias) {
      const L = leerPortal(carto, r.portalId)
      assert.ok(L, `${r.portalId} sin lectura`)
      assert.ok(L!.astronomia.trim(), `${r.portalId} sin descripción astronómica`)
      assert.ok(L!.mensajePrincipal.trim(), `${r.portalId} sin mensaje`)
      assert.ok(L!.loQueNoHabiasVisto.trim(), `${r.portalId} sin "lo que no habías visto"`)
      assert.ok(L!.preguntaCentral.trim(), `${r.portalId} sin pregunta central`)
      assert.ok(L!.practica.pasos.length > 0, `${r.portalId} sin práctica`)
      assert.ok(L!.contactos.length > 0, `${r.portalId} activo sin contactos`)
    }
  }
})

test("ninguna lectura contiene undefined, null ni marcas internas de estado", () => {
  // "fase semilla", "pendiente" y "draft" son controles internos de redacción.
  // Que aparezcan en pantalla sería decirle a alguien que su lectura está a
  // medias, que es justo lo que no se hace.
  const PROHIBIDO = /undefined|null|\[object Object\]|fase semilla|todavía no se ha escrito|lectura pendiente/i

  for (const n of CARTAS) {
    const carto = construirCartografia(n)
    for (const r of carto.resonancias) {
      const L = leerPortal(carto, r.portalId)!
      const textos = [
        L.astronomia, L.mensajePrincipal, L.loQueNoHabiasVisto, L.preguntaCentral,
        L.sintesis ?? "", L.aprendizajeCentral, L.paradoja,
        ...L.contactos.map((c) => c.mensaje),
        ...L.potenciales, ...L.tensiones, ...L.patronesCotidianos,
        ...L.preguntas, ...L.journalPrompts, ...L.practica.pasos,
      ]
      for (const t of textos) {
        assert.ok(!PROHIBIDO.test(t), `${r.portalId}: texto con marca prohibida → ${t.slice(0, 90)}`)
      }
    }
  }
})

test("el estado de redacción nunca se expone en la lectura", () => {
  const carto = construirCartografia(CARTAS[0])
  const L = leerPortal(carto, carto.resonancias[0].portalId)!
  // `contenido.estado` existe para uso interno, pero ninguna sección de texto
  // lo menciona.
  assert.ok(["seed", "draft", "reviewed"].includes(L.contenido.estado))
  const todo = JSON.stringify([
    L.astronomia, L.mensajePrincipal, L.loQueNoHabiasVisto, L.sintesis,
  ])
  assert.ok(!/\bseed\b|\bdraft\b|\breviewed\b/i.test(todo))
})

// ── 3 · Composición ─────────────────────────────────────────────────────────

test("los diez portales principales tienen los catorce cruces escritos", () => {
  for (const id of PORTALES_CON_CRUCES_MANUALES) {
    const cruces = CRUCES_MANUALES[id]
    assert.ok(cruces, `${id} sin cruces manuales`)
    for (const punto of ORDEN_PUNTOS) {
      const t = cruces[punto]
      assert.ok(t && t.trim().length > 0, `${id} × ${punto} vacío`)
      assert.ok(t.length >= 350, `${id} × ${punto}: ${t.length} caracteres, por debajo del mínimo de 350`)
      assert.ok(t.length <= 650, `${id} × ${punto}: ${t.length} caracteres, por encima del máximo de 650`)
    }
  }
  assert.equal(PORTALES_CON_CRUCES_MANUALES.length * ORDEN_PUNTOS.length, 140)
})

test("los cruces manuales no afirman procedencia ni predicen", () => {
  // La regla editorial que más fácil se rompe al escribir mucho.
  const PROHIBIDO = [
    /\bvienes de\b/i, /\beres de (sirio|las pléyades|arcturus|lyra|orión)\b/i,
    /\btu alma nació\b/i, /\bperteneces a (esta|esa) raza\b/i,
    /\bdemuestra tu origen\b/i, /\bpleyadiano\b/i, /\bsiriano\b/i,
    /\bvas a (conocer|encontrar|recibir)\b/i, /\beste año traerá\b/i,
  ]
  for (const [id, cruces] of Object.entries(CRUCES_MANUALES)) {
    for (const [punto, texto] of Object.entries(cruces)) {
      for (const re of PROHIBIDO) {
        assert.ok(!re.test(texto), `${id} × ${punto} incumple una regla editorial: ${re}`)
      }
    }
  }
})

test("los cuarenta portales restantes componen mensaje para cualquier punto", () => {
  // La composición debe producir texto válido aunque no haya cruce manual.
  const sinManual = PORTALES.map((p) => p.id).filter((id) => !cruceManual(id, "sol"))
  assert.equal(sinManual.length, 40)

  for (const n of CARTAS) {
    const carto = construirCartografia(n)
    for (const r of carto.resonancias) {
      if (!sinManual.includes(r.portalId)) continue
      const L = leerPortal(carto, r.portalId)!
      for (const c of L.contactos) {
        assert.equal(c.mensajeEsManual, false)
        assert.ok(c.mensaje.length > 200, `${r.portalId} × ${c.contacto.punto}: mensaje demasiado corto`)
        assert.ok(!/undefined/.test(c.mensaje))
      }
    }
  }
})

test("cada punto natal y cada aspecto tienen texto", () => {
  for (const p of ORDEN_PUNTOS) {
    const c = PUNTOS[p as PuntoNatalId]
    assert.ok(c.nombre && c.lente && c.funcion && c.cuandoEsTocado && c.seReconoceEn && c.pregunta, `punto ${p} incompleto`)
  }
  for (const a of ["conjuncion", "oposicion", "trigono", "cuadratura", "sextil"] as const) {
    const c = ASPECTOS_CONTENIDO[a]
    assert.ok(c.nombre && c.angulo && c.cualidad && c.comoSeExperimenta && c.queAporta, `aspecto ${a} incompleto`)
    // Ningún aspecto se describe como bueno ni como malo.
    const todo = `${c.cualidad} ${c.comoSeExperimenta} ${c.queAporta}`
    assert.ok(!/\b(favorable|desfavorable|maléfic|benéfic|afortunad)/i.test(todo), `aspecto ${a} usa lenguaje de valor`)
  }
})

// ── 4 · Portales activos, mapa y lista ──────────────────────────────────────

test("un portal sin contacto no entrega lectura y uno con contacto sí", () => {
  const carto = construirCartografia(CARTAS[0])
  assert.ok(carto.sinContacto.length > 0, "el caso de prueba debería tener portales sin contacto")

  for (const id of carto.sinContacto) {
    assert.equal(leerPortal(carto, id), null, `${id} no tiene contacto y aun así abre`)
  }
  for (const r of carto.resonancias) {
    assert.ok(leerPortal(carto, r.portalId), `${r.portalId} tiene contacto y no abre`)
  }
})

test("activos y sin contacto suman exactamente el catálogo, sin solaparse", () => {
  for (const n of CARTAS) {
    const carto = construirCartografia(n)
    const activos = carto.resonancias.map((r) => r.portalId)
    const inactivos = carto.sinContacto
    assert.equal(activos.length + inactivos.length, PORTALES.length)
    assert.equal(new Set([...activos, ...inactivos]).size, PORTALES.length)
    for (const r of carto.resonancias) {
      assert.ok(r.contactos.length > 0, "un portal activo debe tener al menos un contacto")
    }
  }
})

test("mapa y lista ven el mismo conjunto de portales activos", () => {
  // El mapa proyecta los cincuenta y marca cuáles son activos; la lista parte
  // de las resonancias. Si se separaran, el usuario vería dos realidades.
  for (const n of CARTAS) {
    const carto = construirCartografia(n)
    const enMapa = proyectarPortales(carto).filter((p) => p.activo).map((p) => p.id).sort()
    const enLista = carto.resonancias.map((r) => r.portalId).sort()
    assert.deepEqual(enMapa, enLista)
  }
})

test("el mapa refleja la misma resonancia y el mismo número de contactos que la lista", () => {
  const carto = construirCartografia(CARTAS[0])
  const proy = proyectarPortales(carto)
  for (const r of carto.resonancias) {
    const p = proy.find((x) => x.id === r.portalId)!
    assert.equal(p.resonancia, r.resonancia)
    assert.equal(p.contactos, r.contactos.length)
  }
})

// ── 5 · Determinismo y geometría del mapa ───────────────────────────────────

test("las posiciones del mapa 3D son deterministas", () => {
  const a = proyectarPortales(construirCartografia(CARTAS[0]))
  const b = proyectarPortales(construirCartografia(CARTAS[0]))
  assert.deepEqual(a, b)

  const f1 = fondoEstrellas(200)
  const f2 = fondoEstrellas(200)
  assert.deepEqual(Array.from(f1), Array.from(f2))
})

test("todos los portales caen sobre la esfera, ninguno en el centro ni fuera", () => {
  const carto = construirCartografia(CARTAS[0])
  for (const p of proyectarPortales(carto)) {
    const r = Math.hypot(p.pos.x, p.pos.y, p.pos.z)
    assert.ok(Math.abs(r - 10) < 1e-6, `${p.id} a radio ${r}, debería estar sobre la esfera`)
    for (const a of p.anclas) {
      const ra = Math.hypot(a.pos.x, a.pos.y, a.pos.z)
      assert.ok(Math.abs(ra - 10) < 1e-6, `ancla ${a.id} fuera de la esfera`)
    }
  }
})

test("la proyección respeta la dirección real: el polo norte celeste queda arriba", () => {
  // Declinación +90 debe apuntar al eje vertical de la escena.
  const polo = direccion(0, 90)
  assert.ok(Math.abs(polo.y - 1) < 1e-9, `polo norte en y=${polo.y}`)
  assert.ok(Math.abs(polo.x) < 1e-9 && Math.abs(polo.z) < 1e-9)

  // Y dos objetos separados en el cielo no pueden proyectarse al mismo sitio.
  const carto = construirCartografia(CARTAS[0])
  const ps = proyectarPortales(carto)
  for (let i = 0; i < ps.length; i++) {
    for (let j = i + 1; j < ps.length; j++) {
      const d = Math.hypot(
        ps[i].pos.x - ps[j].pos.x,
        ps[i].pos.y - ps[j].pos.y,
        ps[i].pos.z - ps[j].pos.z,
      )
      assert.ok(d > 1e-6, `${ps[i].id} y ${ps[j].id} se proyectan al mismo punto`)
    }
  }
})

test("los puntos natales se proyectan dentro de la esfera y sin NaN", () => {
  const carto = construirCartografia(CARTAS[0])
  const ps = proyectarPuntos(carto)
  assert.equal(ps.length, 14)
  for (const p of ps) {
    assert.ok(Number.isFinite(p.pos.x) && Number.isFinite(p.pos.y) && Number.isFinite(p.pos.z))
    const r = Math.hypot(p.pos.x, p.pos.y, p.pos.z)
    assert.ok(r < 10, "los puntos natales van por dentro de la esfera de portales")
  }
})

// ── 6 · Síntesis global ─────────────────────────────────────────────────────

test("la síntesis global nunca produce undefined y es determinista", () => {
  for (const n of CARTAS) {
    const c1 = construirCartografia(n)
    const c2 = construirCartografia(n)

    assert.deepEqual(construirTriada(c1), construirTriada(c2))
    assert.deepEqual(detectarEje(c1), detectarEje(c2))
    assert.deepEqual(mapaCapacidades(c1), mapaCapacidades(c2))
    assert.deepEqual(preguntaCentral(c1), preguntaCentral(c2))

    const t = construirTriada(c1)
    if (t) {
      assert.ok(!/undefined/.test(t.parrafos.join(" ") + t.secuencia))
      assert.ok(t.parrafos.length > 0 && t.parrafos.every((p) => p.trim().length > 0))
      assert.equal(t.portales.length, 3)
    }
    const q = preguntaCentral(c1)
    if (q) assert.ok(!/undefined/.test(q.pregunta + q.origen))

    const caps = mapaCapacidades(c1)
    assert.ok(caps.length <= 6, "como mucho seis capacidades")
    for (const cap of caps) {
      assert.ok(cap.sostenidaPor.length > 0, `${cap.id} propuesta sin nada que la sostenga`)
    }
    assert.ok(zonasIntegracion(c1).length <= 3, "como mucho tres zonas")
  }
})

test("el eje detectado siempre tiene portales en los dos polos", () => {
  for (const n of CARTAS) {
    const eje = detectarEje(construirCartografia(n))
    if (!eje) continue
    assert.ok(eje.desde.some((d) => d.polo === 0), `${eje.ejeId} sin portales en el primer polo`)
    assert.ok(eje.desde.some((d) => d.polo === 1), `${eje.ejeId} sin portales en el segundo polo`)
  }
})

test("la práctica principal corresponde al portal más marcado", () => {
  for (const n of CARTAS) {
    const carto = construirCartografia(n)
    const p = practicaPrincipal(carto)
    if (!p) continue
    assert.equal(p.portalId, carto.resonancias[0].portalId)
    assert.ok(p.practica.pasos.length >= 3)
  }
})

// ── 7 · Explicación de la puntuación ────────────────────────────────────────

test("la explicación del score reproduce exactamente la cifra mostrada", () => {
  // Si la reconstrucción y el motor se separaran, la pantalla "¿Por qué 48.9?"
  // estaría mintiendo. Esta prueba es la que lo impide.
  for (const n of CARTAS) {
    const carto = construirCartografia(n)
    for (const r of carto.resonancias) {
      const e = explicarScore(r)
      assert.equal(e.final, r.resonancia, `${r.portalId}: explicación ${e.final} vs motor ${r.resonancia}`)
      assert.equal(e.lineas.length, r.contactos.length)
      for (const l of e.lineas) {
        assert.ok(l.cercania >= 0 && l.cercania <= 1)
        assert.ok(l.aporte >= 0)
        assert.ok(Number.isFinite(l.fuerza))
        // El aporte de un eco es exactamente la fuerza por el factor.
        if (l.esEco) {
          assert.ok(Math.abs(l.aporte - l.fuerza * e.constantes.ecoMismaAncla) < 1e-12)
        } else {
          assert.ok(Math.abs(l.aporte - l.fuerza) < 1e-12)
        }
      }
    }
  }
})

test("la clasificación de exactitud y densidad cubre los bordes", () => {
  assert.equal(clasificarExactitud(0, 2), "exacto")
  assert.equal(clasificarExactitud(0.5, 2), "exacto")     // justo en 25%
  assert.equal(clasificarExactitud(0.51, 2), "cercano")
  assert.equal(clasificarExactitud(1.2, 2), "cercano")    // justo en 60%
  assert.equal(clasificarExactitud(1.21, 2), "amplio")
  assert.equal(clasificarExactitud(2, 2), "amplio")
  assert.equal(clasificarExactitud(1, 0), "amplio")       // sin orbe permitido

  assert.equal(clasificarDensidad(1), "contacto")
  assert.equal(clasificarDensidad(2), "patron")
  assert.equal(clasificarDensidad(3), "eje")
  assert.equal(clasificarDensidad(9), "eje")
})

// ── 8 · Regresión del nodo lunar ────────────────────────────────────────────

test("el nodo lunar se mueve de forma continua, sin escalones", () => {
  // La implementación anterior devolvía la longitud de la Luna en el cruce por
  // la eclíptica más cercano, de modo que todos los nacidos en una misma
  // ventana de 27 días recibían el mismo nodo, con saltos de hasta 2.28° —más
  // que el orbe entero de la conjunción—. Ver docs/CARTOGRAFIA_BUG_NODOS.md.
  const base = Date.UTC(1988, 11, 27, 19, 30)
  const DIA = 86400000

  let previo: number | null = null
  let saltoMaximo = 0
  let desplazamientoTotal = 0

  for (let d = 0; d < 40; d++) {
    const puntos = calcularPuntos(base + d * DIA, -0.23, -78.5)
    const nn = puntos.find((p) => p.id === "nodo_norte")!.longitud
    assert.ok(Number.isFinite(nn))

    if (previo !== null) {
      let salto = nn - previo
      if (salto > 180) salto -= 360
      if (salto < -180) salto += 360
      saltoMaximo = Math.max(saltoMaximo, Math.abs(salto))
      desplazamientoTotal += salto
    }
    previo = nn
  }

  // Día a día el nodo verdadero no se mueve más de ~0.16°.
  assert.ok(saltoMaximo < 0.25, `salto máximo de ${saltoMaximo.toFixed(4)}° entre días consecutivos`)
  // Y nunca se queda quieto: una escalera plana también sería un fallo.
  assert.ok(saltoMaximo > 0.01, "el nodo no se mueve: parece congelado")
  // Deriva retrógrada de ~0.053°/día, el período nodal de 18.6 años.
  const porDia = desplazamientoTotal / 39
  assert.ok(porDia < 0, "el nodo debe ser retrógrado")
  assert.ok(Math.abs(porDia + 0.053) < 0.02, `deriva de ${porDia.toFixed(4)}°/día`)
})

test("los nodos siguen exactamente opuestos tras la corrección", () => {
  for (const n of CARTAS) {
    const carto = construirCartografia(n)
    const nn = carto.puntos.find((p) => p.id === "nodo_norte")!.longitud
    const ns = carto.puntos.find((p) => p.id === "nodo_sur")!.longitud
    let d = Math.abs(nn - ns)
    if (d > 180) d = 360 - d
    assert.ok(Math.abs(d - 180) < 1e-9, `nodos separados ${d}°`)
  }
})

// ── 9 · Cobertura de todo el catálogo en uso real ───────────────────────────

test("barrido de fechas: toda lectura de todo portal activo es válida", () => {
  // Un fallo de composición puede esconderse en una combinación concreta de
  // portal, punto y aspecto que no aparece en las cinco cartas de arriba.
  const vistos = new Set<string>()
  let lecturas = 0

  for (let anio = 1950; anio <= 2010; anio += 5) {
    for (const mes of [2, 7, 11]) {
      const carto = construirCartografia({
        anio, mes, dia: 14, hora: 9, minuto: 20, lugar: MADRID,
      })
      for (const r of carto.resonancias) {
        const L = leerPortal(carto, r.portalId)
        assert.ok(L, `${anio}-${mes}: ${r.portalId} sin lectura`)
        assert.ok(L!.mensajePrincipal.length > 100)
        assert.ok(!/undefined/.test(L!.mensajePrincipal + L!.loQueNoHabiasVisto + (L!.sintesis ?? "")))
        vistos.add(r.portalId)
        lecturas++
      }
    }
  }

  assert.ok(lecturas > 300, `solo ${lecturas} lecturas comprobadas`)
  // El barrido debe tocar buena parte del catálogo, no cuatro portales.
  assert.ok(vistos.size >= 40, `el barrido solo alcanzó ${vistos.size} portales distintos`)
})

test("portalesActivos no incluye portales sin datos", () => {
  for (const p of portalesActivos()) {
    assert.ok(!p.pendingData)
    assert.ok(p.anclas.length > 0)
  }
  assert.equal(portalesActivos().length, PORTALES.length)
})

// ── 10 · Hermandad cósmica ──────────────────────────────────────────────────

test("los cincuenta portales tienen su lectura de hermandad", async () => {
  const { HERMANDAD } = await import("../app/miembros/_lib/cartografia-estelar/content/hermandad.content.ts")
  for (const p of PORTALES) {
    const h = HERMANDAD[p.id]
    assert.ok(h, `${p.id} sin hermandad`)
    assert.ok(h.familia.trim(), `${p.id} sin nombre de familia`)
    assert.ok(h.vinculo.length >= 120, `${p.id}: vínculo de ${h.vinculo.length} caracteres`)
    assert.ok(h.disposicion.length >= 60, `${p.id}: disposición de ${h.disposicion.length} caracteres`)
  }
  assert.equal(Object.keys(HERMANDAD).length, PORTALES.length)
})

test("la hermandad nunca afirma procedencia ni pertenencia como hecho", async () => {
  // Es la capa más explícitamente espiritual y la más fácil de que se le
  // escape una afirmación de origen. Estas son las fórmulas prohibidas desde
  // el primer día del proyecto.
  const { HERMANDAD } = await import("../app/miembros/_lib/cartografia-estelar/content/hermandad.content.ts")
  const PROHIBIDO = [
    /\bvienes de\b/i,
    /\beres (de |un |una )?(pleyadian|siriano|arcturian|lyrano)/i,
    /\btu alma (nació|proviene|viene)\b/i,
    /\bperteneces a\b/i,
    /\bdemuestra (tu|el) origen\b/i,
    /\btu origen (estelar|cósmico) es\b/i,
    /\bfuiste (creado|enviado)\b/i,
    /\ben tu vida pasada\b/i,
    /\bvas a (recibir|contactar|despertar)\b/i,
  ]
  for (const [id, h] of Object.entries(HERMANDAD)) {
    const todo = `${h.familia} ${h.vinculo} ${h.disposicion}`
    for (const re of PROHIBIDO) {
      assert.ok(!re.test(todo), `${id} incumple la regla de no afirmar procedencia: ${re}`)
    }
  }
})

test("la hermandad se declara siempre como marco contemplativo o invitación", async () => {
  // Cada texto debe enmarcarse explícitamente. Sin el marco, una afinidad
  // simbólica se lee como una afirmación sobre la persona.
  const { HERMANDAD } = await import("../app/miembros/_lib/cartografia-estelar/content/hermandad.content.ts")
  const MARCO = /marco contemplativo|marco de Los 144|dentro de este marco|se asocia aquí|simbólicamente/i
  const INVITA = /puede invitar a observar|si lo reconoces|puede aparecer/i
  for (const [id, h] of Object.entries(HERMANDAD)) {
    assert.ok(MARCO.test(h.vinculo), `${id}: el vínculo no declara el marco`)
    assert.ok(INVITA.test(h.disposicion), `${id}: la disposición no invita, afirma`)
  }
})

// ── 11 · Signos y constelaciones ────────────────────────────────────────────

test("el signo se calcula bien en los bordes de la rueda", async () => {
  const { signoDe } = await import("../app/miembros/_lib/cartografia-estelar/domain/editorial/signos.ts")
  assert.equal(signoDe(0).nombre, "Aries")
  assert.equal(signoDe(29.99).nombre, "Aries")
  assert.equal(signoDe(30).nombre, "Tauro")
  assert.equal(signoDe(276.03).nombre, "Capricornio")
  assert.equal(Math.round(signoDe(276.03).grado), 6)
  assert.equal(signoDe(359.99).nombre, "Piscis")
  // La envolvente: 360 es 0, y los negativos se normalizan.
  assert.equal(signoDe(360).nombre, "Aries")
  assert.equal(signoDe(-1).nombre, "Piscis")
})

test("la explicación del signo funciona para cualquier carta y no inventa", async () => {
  const { explicarSigno, estrellaMasCercanaA } =
    await import("../app/miembros/_lib/cartografia-estelar/domain/editorial/signos.ts")

  for (const n of CARTAS) {
    const carto = construirCartografia(n)
    const e = explicarSigno(carto, "sol")
    assert.ok(e, "toda carta debe poder explicar su signo solar")
    assert.ok(SIGNOS_VALIDOS.includes(e!.signo), `signo desconocido: ${e!.signo}`)
    assert.ok(e!.grado >= 0 && e!.grado < 30)

    // Siempre hay una estrella más cercana: el catálogo no está vacío.
    assert.ok(e!.estrella, "debería encontrar la estrella más cercana")
    assert.ok(e!.estrella!.separacion >= 0 && e!.estrella!.separacion <= 180)

    // Y esa estrella es realmente la más cercana, no una cualquiera.
    const directa = estrellaMasCercanaA(carto, "sol")
    assert.equal(directa!.anclaNombre, e!.estrella!.anclaNombre)
  }
})

const SIGNOS_VALIDOS = [
  "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
]

test("el caso real: Sol en Capricornio apuntando a estrellas de Sagitario", async () => {
  // Es el ejemplo que motivó toda la explicación, y conviene que no se rompa
  // en silencio si algún día cambian las coordenadas del catálogo.
  const { explicarSigno } = await import("../app/miembros/_lib/cartografia-estelar/domain/editorial/signos.ts")
  const carto = construirCartografia({
    anio: 1988, mes: 12, dia: 27, hora: 8, minuto: 40,
    lugar: QUITO,
  })
  const e = explicarSigno(carto, "sol")!
  assert.equal(e.signo, "Capricornio")
  // La estrella más cercana a ese Sol es de la constelación de Sagitario.
  assert.match(e.estrella!.portalNombre, /Sagitario/i)
  assert.ok(e.desajuste, "el signo y la constelación no coinciden, y debe detectarse")
})
