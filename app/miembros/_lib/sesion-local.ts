"use client"

// LO QUE GUARDA ESTE NAVEGADOR ES DE UNA PERSONA, NO DEL APARATO.
//
// ── EL PROBLEMA ────────────────────────────────────────────────────────────
// La plataforma guarda en el navegador el avance de capítulos, las insignias
// anunciadas, los datos de nacimiento de Código de Origen y Cartografía, la
// bitácora y las lecturas de Numerología. Todo con claves fijas:
// `app_episode_progress`, `los144k_...`. Fijas quiere decir del APARATO.
//
// Así que al entrar con otra cuenta en el mismo teléfono, esa persona veía el
// avance del anterior: capítulos marcados que no vio, insignias que no ganó,
// y hasta la fecha de nacimiento de otro en los módulos. Borrar el avance
// desde el servidor no arreglaba nada, porque la copia del aparato seguía ahí
// y volvía a pintarse.
//
// Se notaba al probar con dos cuentas, pero no es un problema de pruebas: un
// teléfono o un ordenador compartido en casa hace exactamente lo mismo, y ahí
// lo que se enseña son datos personales de otra persona.
//
// ── LA SOLUCIÓN ────────────────────────────────────────────────────────────
// El navegador recuerda de QUIÉN es lo que guarda. Cuando entra alguien
// distinto, lo anterior se borra: no es suyo.
//
// La primera vez no se borra nada, solo se apunta de quién es. Si no, todo el
// mundo perdería su copia local una única vez al desplegar esto, y quien
// hubiera avanzado sin conexión y aún no hubiera sincronizado perdería ese
// avance de verdad.
//
// Lo que vive en el servidor —capítulos, insignias, XP— vuelve solo en la
// siguiente sincronización. Lo que solo vivía aquí —la fecha de nacimiento de
// los módulos, la bitácora— desaparece, y debe: era de la otra persona.

/** De quién es lo que hay guardado en este navegador. */
const CLAVE_DUENO = "los144k_dueno"

/**
 * Prefijos que se borran al cambiar de persona.
 *
 * `los144k_dueno` se queda, evidentemente. `los144k_reset_applied` también:
 * marca qué reinicio pedido por administración ya se aplicó en este aparato y
 * borrarlo dispararía el reinicio otra vez, con su recarga, en bucle.
 */
const SE_BORRA = ["app_episode_progress", "app_unlocked_achievements", "los144k_"]
const SE_QUEDA = ["los144k_dueno", "los144k_reset_applied"]

/**
 * Comprueba de quién es lo guardado y lo limpia si ahora hay otra persona.
 *
 * Devuelve true si ha borrado algo, por si quien llama quiere recargar para
 * que las pantallas ya montadas no sigan enseñando lo anterior.
 */
export function limpiarSiCambioDePersona(userId: string | null | undefined): boolean {
  if (typeof window === "undefined" || !userId) return false

  let dueno: string | null = null
  try {
    dueno = localStorage.getItem(CLAVE_DUENO)
  } catch {
    // Almacenamiento bloqueado: no hay copia local que ensuciar.
    return false
  }

  if (dueno === userId) return false

  // Primera vez en este navegador: solo se apunta. Ver la nota de arriba.
  if (!dueno) {
    try { localStorage.setItem(CLAVE_DUENO, userId) } catch { /* cuota */ }
    return false
  }

  let borradas = 0
  try {
    for (const clave of Object.keys(localStorage)) {
      if (SE_QUEDA.includes(clave)) continue
      if (!SE_BORRA.some((p) => clave.startsWith(p))) continue
      localStorage.removeItem(clave)
      borradas++
    }
    localStorage.setItem(CLAVE_DUENO, userId)
  } catch { /* almacenamiento bloqueado a media limpieza */ }

  return borradas > 0
}
