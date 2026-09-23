// CARTOGRAFÍA ESTELAR 144 — punto de entrada.
//
// Una función. Entra un nacimiento, sale la cartografía completa.
//
// Determinista de principio a fin: el mismo nacimiento da siempre exactamente
// el mismo resultado, en cualquier dispositivo y a cualquier hora. No hay
// azar, ni lectura del reloj, ni llamadas a red.
//
// Los datos de nacimiento NO salen del dispositivo: todo esto corre en el
// navegador de quien mira.

import { aTiempoUniversal } from "../astronomy/tiempo"
import { calcularPuntos } from "../astronomy/efemerides"
import { portalesActivos, TOTAL_PORTALES } from "../catalog/portales"
import { resonanciaDe } from "../resonancia/puntuacion"
import { ORBE_EXACTO } from "../resonancia/config"
import type {
  AspectoId, Cartografia, Nacimiento, PuntoNatalId, ResonanciaPortal,
} from "./types"

export function construirCartografia(nacimiento: Nacimiento): Cartografia {
  const instante = aTiempoUniversal(nacimiento)
  const puntos = calcularPuntos(
    instante.utcMs,
    nacimiento.lugar.latitud,
    nacimiento.lugar.longitud,
  )

  const resonancias: ResonanciaPortal[] = []
  const sinContacto: string[] = []

  for (const portal of portalesActivos()) {
    const r = resonanciaDe(portal, puntos, instante.utcMs)
    if (r) resonancias.push(r)
    else sinContacto.push(portal.id)
  }

  // De mayor a menor. El desempate va por identificador para que el orden sea
  // estable: dos portales con la misma resonancia no deben intercambiarse
  // entre dos cálculos idénticos.
  resonancias.sort((a, b) =>
    b.resonancia !== a.resonancia
      ? b.resonancia - a.resonancia
      : a.portalId.localeCompare(b.portalId),
  )

  return {
    nacimiento,
    instante,
    puntos,
    resonancias,
    sinContacto,
    resumen: construirResumen(resonancias),
  }
}

function construirResumen(resonancias: ResonanciaPortal[]): Cartografia["resumen"] {
  const todos = resonancias.flatMap((r) => r.contactos)

  const porPunto = new Map<PuntoNatalId, number>()
  const porAspecto = new Map<AspectoId, number>()
  for (const c of todos) {
    porPunto.set(c.punto, (porPunto.get(c.punto) ?? 0) + 1)
    porAspecto.set(c.aspecto, (porAspecto.get(c.aspecto) ?? 0) + 1)
  }

  // El desempate por nombre mantiene el resultado estable entre cálculos.
  const masFrecuente = <T extends string>(m: Map<T, number>): T | null => {
    let mejor: T | null = null
    let max = 0
    for (const [k, v] of [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      if (v > max) { max = v; mejor = k }
    }
    return mejor
  }

  return {
    contactosExactos: todos.filter((c) => c.orbe < ORBE_EXACTO).length,
    portalesActivos: resonancias.length,
    portalesTotales: TOTAL_PORTALES,
    portalMayor: resonancias[0]?.portalId ?? null,
    puntoMasImplicado: masFrecuente(porPunto),
    aspectoMasRepetido: masFrecuente(porAspecto),
  }
}
