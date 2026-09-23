// CARTOGRAFÍA ESTELAR 144 — ensamblado de los cincuenta portales.
//
// Los archivos están partidos por tamaño, no por jerarquía: `principales`
// reúne los diez que tienen además combinaciones manuales portal × punto.
// Todos los cincuenta entregan lectura completa.
//
// La prueba `tests/cartografia-estelar.test.ts` comprueba que los cincuenta
// identificadores del catálogo tienen entrada aquí y que ningún campo queda
// vacío. Si falta uno, las pruebas fallan antes de que llegue a nadie.

import type { ContenidoPortal } from "../tipos"
import { PORTALES_PRINCIPALES } from "./principales"
import { PORTALES_PRINCIPALES_B } from "./principales-b"
import { PORTALES_RESTO_1 } from "./resto-1"
import { PORTALES_RESTO_2 } from "./resto-2"
import { PORTALES_RESTO_3 } from "./resto-3"
import { PORTALES_RESTO_4 } from "./resto-4"

export const PORTALES_CONTENIDO: Record<string, ContenidoPortal> = {
  ...PORTALES_PRINCIPALES,
  ...PORTALES_PRINCIPALES_B,
  ...PORTALES_RESTO_1,
  ...PORTALES_RESTO_2,
  ...PORTALES_RESTO_3,
  ...PORTALES_RESTO_4,
}

/**
 * Los diez con combinaciones manuales portal × punto natal.
 *
 * No son "mejores" ni pesan más en el cálculo: son aquellos para los que se
 * ha escrito a mano cada uno de los catorce cruces. El resto compone su
 * lectura con las reglas del motor editorial, que también produce texto
 * completo.
 */
export const PORTALES_CON_CRUCES_MANUALES = [
  "pleyades", "sirio", "arcturus", "lyra", "orion",
  "andromeda", "alfa_centauri", "antares", "regulus", "centro_galactico",
] as const

export function contenidoPortal(id: string): ContenidoPortal | null {
  return PORTALES_CONTENIDO[id] ?? null
}
