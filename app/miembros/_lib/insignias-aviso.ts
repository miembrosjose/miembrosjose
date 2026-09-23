"use client"

// ANUNCIAR UNA INSIGNIA QUE EL SERVIDOR ACABA DE CONCEDER.
//
// Vive aparte de achievements-unlock.ts para no crear un círculo: aquel
// importa de seasons.ts, y seasons.ts necesita esto para avisar de lo que
// llega al guardar un capítulo.
//
// La diferencia con `unlockAchievement` es de quién manda: allí el navegador
// DECIDE que se ha ganado algo y se lo cuenta al servidor; aquí el servidor ya
// lo ha comprobado y concedido, y esto solo lo pone en pantalla. Por eso no
// hay ninguna petición de vuelta.

const CLAVE = "app_unlocked_achievements"

type Mapa = Record<string, { unlockedAt: string }>

function leer(): Mapa {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(CLAVE)
    return raw ? (JSON.parse(raw) as Mapa) : {}
  } catch { return {} }
}

/**
 * Enseña el aviso de cada insignia que sea nueva PARA ESTE NAVEGADOR.
 *
 * La copia local es solo para no repetir el aviso: si el navegador ya la
 * anunció —porque lo adivinó antes de que respondiera el servidor—, no se
 * vuelve a anunciar. Quien manda sobre si la insignia existe es el servidor.
 */
export function anunciarInsignias(ids: string[]) {
  if (typeof window === "undefined" || ids.length === 0) return

  const mapa = leer()
  const nuevas = ids.filter((id) => !mapa[id])
  if (nuevas.length === 0) return

  for (const id of nuevas) mapa[id] = { unlockedAt: new Date().toISOString() }
  try {
    localStorage.setItem(CLAVE, JSON.stringify(mapa))
  } catch { /* cuota o modo privado: el aviso sale igual */ }

  for (const id of nuevas) {
    window.dispatchEvent(new CustomEvent("app:achievement-unlock", { detail: { id } }))
  }

  // Que el contador de XP vuelva a preguntar: puede haber subido de nivel.
  window.dispatchEvent(new CustomEvent("app:xp-force-sync"))

  // Y que la sesión se entere de la insignia destacada.
  //
  // Al conceder una, el servidor la pone como destacada en user_metadata. Pero
  // el navegador guarda su copia dentro del token: hasta que no se pide uno
  // nuevo, el avatar del menú y el perfil siguen enseñando la de antes, y
  // parecía que la insignia no se había puesto. Esto avisa a la sesión de que
  // vuelva a preguntar.
  window.dispatchEvent(new CustomEvent("app:sesion-desactualizada"))
}
