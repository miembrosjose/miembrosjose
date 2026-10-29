// ═══════════════════════════════════════════════════════════════════════════
//  ¿HAY ALGO BLOQUEANDO LA PANTALLA?
// ═══════════════════════════════════════════════════════════════════════════
//
// Una sola pregunta, para que dos componentes que no se conocen no se pisen.
//
// ── EL PROBLEMA QUE RESUELVE ───────────────────────────────────────────────
// El aviso que interrumpe sale al entrar. La invitación a instalar sale a los
// treinta segundos. Casi nunca coinciden, pero «casi nunca» en producción es
// «un martes cualquiera»: alguien deja la pestaña abierta leyendo el aviso,
// pasan los treinta segundos, y se encuentra dos ventanas superpuestas.
//
// ── POR QUÉ NO ES UN CONTEXTO DE REACT ─────────────────────────────────────
// Porque haría falta envolver el árbol en otro proveedor para contestar un
// booleano, y porque quien pregunta lo hace DENTRO de un efecto, no al
// pintar. Un módulo con una bandera y un evento resuelve lo mismo sin añadir
// una capa al layout, que ya tiene siete.

let bloqueado = false

const EVENTO = "los144k:bloqueo"

/** Lo llama quien abre o cierra algo que tapa la pantalla entera. */
export function marcarBloqueo(activo: boolean): void {
  if (bloqueado === activo) return
  bloqueado = activo
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENTO, { detail: activo }))
  }
}

/** Para preguntarlo de una vez, dentro de un efecto. */
export function hayBloqueo(): boolean {
  return bloqueado
}

/**
 * Para enterarse de los cambios.
 *
 * Avisa una vez con el estado actual nada más suscribirse: quien se monta
 * tarde necesita saber que ya había algo abierto, no solo lo que pase a
 * partir de ahora.
 */
export function alCambiarBloqueo(fn: (activo: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {}
  fn(bloqueado)
  const oyente = (e: Event) => fn((e as CustomEvent<boolean>).detail)
  window.addEventListener(EVENTO, oyente)
  return () => window.removeEventListener(EVENTO, oyente)
}
