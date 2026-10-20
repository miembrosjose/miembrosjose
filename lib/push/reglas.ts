// ═══════════════════════════════════════════════════════════════════════════
//  QUÉ MERECE SONAR EN EL BOLSILLO
// ═══════════════════════════════════════════════════════════════════════════
//
// ── EL PROBLEMA QUE RESUELVE ───────────────────────────────────────────────
// La plataforma concede insignias constantemente: una por capítulo visto, una
// por días seguidos, una por cada aportación. Dentro de la aplicación eso está
// bien — se mira cuando se quiere y celebra el avance.
//
// En el teléfono es otra cosa. Un aviso interrumpe: saca a alguien de lo que
// esté haciendo. Si eso pasa catorce veces mientras ve una temporada, lo que
// aprende no es que avanza, es a silenciar la aplicación. Y cuando llegue el
// aviso que sí importaba —un mensaje, un encuentro— ya no lo verá.
//
// Así que esto es deliberadamente restrictivo. La pregunta no es «¿es un
// logro?», es «¿vale la pena interrumpir a alguien por esto?».
//
// ── LAS REGLAS ─────────────────────────────────────────────────────────────
//
//   SÍ suena:
//     · Subir de grado en el Camino. Es la escalera principal, y son pocos.
//     · Las insignias de nivel `topo` y `diamond`. Son contadas —siete en
//       todo el catálogo— y marcan hitos de verdad.
//     · Completar una temporada, y terminar la formación entera.
//
//   NO suena:
//     · Todo lo demás. Insignias de progresión corriente, llamas de tiempo,
//       patentes de comunidad, compras. Siguen apareciendo en la campana,
//       que es donde les corresponde.
//
//   Y NUNCA suena:
//     · Una recuperación. Cuando el servidor se pone al día con insignias
//       que ya se tenían —tabla limpiada, dispositivo nuevo— no ha pasado
//       nada hoy. Avisar de seis cosas viejas a la vez es ruido puro.
//
// ── POR QUÉ ESTÁ EN SU PROPIO ARCHIVO ──────────────────────────────────────
// Para que la regla se pueda leer entera de una vez y discutirse sin abrir
// la lógica de insignias. Cuando haya que ajustar qué interrumpe y qué no
// —y lo habrá— se ajusta aquí.

import { esGradoDelCamino, type Achievement } from "@/lib/achievements"

/**
 * Lo que NUNCA suena, aunque la regla de abajo diga que sí.
 *
 * El Sello de Admin es `diamond` y cae en el nivel alto, pero no es un logro:
 * va con el cargo. Avisar al teléfono de alguien de que es administrador es
 * contarle algo que ya sabía.
 */
const NUNCA = new Set(["admin_seal"])

/** Los niveles que justifican interrumpir a alguien. */
const NIVELES_QUE_SUENAN = new Set(["topo", "diamond"])

/** Hitos del recorrido, por id exacto. */
const HITOS = new Set([
  "season_1_complete",
  "season_2_complete",
  "season_3_complete",
  "season_4_complete",
  "training_complete",
])

/**
 * ¿Esta insignia merece un aviso en el móvil?
 *
 * @param recuperando `true` cuando el servidor está poniéndose al día con
 *        insignias ya ganadas. En ese caso NUNCA suena: no es un logro de
 *        hoy, y suelen caer varias de golpe.
 */
export function laInsigniaMereceMovil(ach: Achievement, recuperando: boolean): boolean {
  if (recuperando) return false
  // Una insignia retirada del catálogo no se anuncia ni en pantalla.
  if (ach.retirada) return false
  if (NUNCA.has(ach.id)) return false

  if (esGradoDelCamino(ach.id)) return true
  if (HITOS.has(ach.id)) return true
  if (NIVELES_QUE_SUENAN.has(ach.tier)) return true

  return false
}

/**
 * ¿Quiere esta persona avisos de logros en su móvil?
 *
 * Se lee de sus preferencias. Ante la duda —cuenta antigua sin la sección,
 * metadatos ilegibles— se asume que sí: es el valor por defecto, y quien no
 * los quiera tiene una forma más contundente de decirlo, que es no dar el
 * permiso del sistema.
 */
export function quiereLogrosEnElMovil(userMetadata: unknown): boolean {
  const prefs = (userMetadata as { notification_prefs?: { push?: { logros?: boolean } } } | null)
    ?.notification_prefs
  return prefs?.push?.logros !== false
}
