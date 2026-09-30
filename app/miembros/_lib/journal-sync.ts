"use client"

// SINCRONIZAR LA BITÁCORA CON EL SERVIDOR.
//
// ── QUÉ ERA ESTO ANTES ─────────────────────────────────────────────────────
// La bitácora vivía SOLO en `localStorage`. Nadie perdía nada mientras no
// cambiara de dispositivo ni limpiara el navegador, y el día que lo hacía la
// perdía entera y sin aviso. Con lo que se pide escribir ahí —heridas,
// linaje, sueños, el material de la revelación de misión— eso no se puede
// sostener.
//
// ── POR QUÉ SIGUE HABIENDO localStorage ────────────────────────────────────
// Porque escribir tiene que ser instantáneo. Si cada tecla esperara al
// servidor, escribir un párrafo largo sería doloroso y una mala conexión
// haría perder lo que se está escribiendo.
//
// Así que el navegador manda mientras se escribe, y el servidor es la copia
// que sobrevive al dispositivo. Se juntan al arrancar.
//
// ── CÓMO SE RESUELVE UN CONFLICTO ──────────────────────────────────────────
// Gana la versión con `updatedAt` más reciente. Es lo correcto aquí: las
// entradas son de UNA sola persona, y lo último que escribió es lo que
// quiere. No hay dos autores compitiendo, hay dos dispositivos del mismo.
//
// ── POR QUÉ HACEN FALTA LAS LÁPIDAS ────────────────────────────────────────
// Si al borrar una entrada solo se quitara del navegador, la siguiente
// sincronización la vería en el servidor, no la vería en local, y la
// devolvería. Lo borrado reaparecería solo. Por eso los ids borrados se
// apuntan y viajan hasta que el servidor confirma.

import {
  loadEntries,
  reemplazarEntradas,
  alGuardarBitacora,
  lapidas as leerLapidas,
  guardarLapidas,
  type JournalEntry,
} from "./journal-store"

/** Se espera a que pare de escribir antes de mandar nada. */
const ESPERA_MS = 1500

let pendiente: ReturnType<typeof setTimeout> | null = null
let sincronizando = false

function masReciente(a: JournalEntry, b: JournalEntry): JournalEntry {
  return Date.parse(b.updatedAt || "") > Date.parse(a.updatedAt || "") ? b : a
}

/**
 * Junta lo de aquí con lo del servidor y deja las dos partes iguales.
 *
 * Se llama al abrir la bitácora. No lanza: si el servidor no contesta, la
 * bitácora sigue funcionando con la copia local, que es justo como funcionaba
 * antes de que esto existiera.
 */
export async function sincronizarBitacora(): Promise<void> {
  if (typeof window === "undefined" || sincronizando) return
  sincronizando = true

  try {
    const res = await fetch("/api/journal", { credentials: "include" })
    if (!res.ok) return

    const { entries: remotas } = (await res.json()) as { entries: JournalEntry[] }
    const locales = loadEntries()
    const borradas = new Set(leerLapidas())

    const unidas = new Map<string, JournalEntry>()
    for (const e of remotas) {
      // Lo que se borró aquí no vuelve a entrar por la puerta de atrás.
      if (!borradas.has(e.id)) unidas.set(e.id, e)
    }
    for (const e of locales) {
      if (borradas.has(e.id)) continue
      const ya = unidas.get(e.id)
      unidas.set(e.id, ya ? masReciente(ya, e) : e)
    }

    const resultado = [...unidas.values()]
    reemplazarEntradas(resultado)

    // Y ahora al revés: lo que aquí es más nuevo, o no estaba, sube.
    await enviar(resultado, [...borradas])
  } catch {
    /* Sin conexión se sigue trabajando en local. Se reintenta al volver. */
  } finally {
    sincronizando = false
  }
}

async function enviar(entradas: JournalEntry[], borradas: string[]): Promise<void> {
  if (borradas.length) {
    const res = await fetch("/api/journal", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: borradas }),
    })
    // Solo se olvidan las lápidas cuando el servidor confirma. Si falla, se
    // vuelven a mandar la próxima vez: una entrada que reaparece es peor que
    // una lista de ids que sobrevive un rato de más.
    if (res.ok) guardarLapidas([])
  }

  if (entradas.length) {
    await fetch("/api/journal", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: entradas }),
    })
  }
}

/**
 * Sube lo que haya, poco después de dejar de escribir.
 *
 * Se llama en cada guardado. La espera evita mandar una petición por tecla:
 * los campos de la bitácora guardan solos mientras se escribe.
 */
export function programarEnvio(): void {
  if (typeof window === "undefined") return
  if (pendiente) clearTimeout(pendiente)
  pendiente = setTimeout(() => {
    pendiente = null
    void enviar(loadEntries(), leerLapidas()).catch(() => { /* se reintenta */ })
  }, ESPERA_MS)
}

/**
 * Deja la sincronización enganchada al almacén.
 *
 * A partir de aquí, cada guardado en la bitácora programa una subida. Se
 * llama una sola vez, al abrir la bitácora, junto con la sincronización
 * inicial.
 */
export function engancharSincronizacion(): void {
  alGuardarBitacora(programarEnvio)
}
