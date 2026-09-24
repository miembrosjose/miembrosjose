// Lo que ya se ha visto, se vuelve a ver al instante.
//
// ── EL PROBLEMA ────────────────────────────────────────────────────────────
// Cada vez que se entraba a un espacio o se volvía a la portada, la pantalla
// se quedaba en blanco esperando al servidor. Ir y venir entre la Temporada 3
// y la portada —que es lo que hace cualquiera— eran dos esperas seguidas por
// contenido que ya se había traído hacía diez segundos. Se sentía como
// refrescar la página entera, y era justo lo contrario de lo que debe sentirse
// dentro de una sola pantalla.
//
// ── LA REGLA ───────────────────────────────────────────────────────────────
// Se pinta AL INSTANTE lo último que se sabe, y a la vez se pregunta de nuevo
// por detrás. Cuando llega lo nuevo, se sustituye sin parpadeo. Nunca se
// enseña una pantalla en blanco de algo que ya se tenía.
//
// Vive solo en memoria, no en el almacenamiento del navegador: el permiso de
// lectura de cada quien se decide en el servidor en cada petición, y guardar
// conversaciones en el disco de un móvil compartido no aporta nada. Al
// recargar la página se empieza limpio, que es lo correcto.
//
// ── CUÁNDO SE OLVIDA ───────────────────────────────────────────────────────
// Al escribir —abrir una conversación, responder, borrar— lo guardado deja de
// ser cierto. Quien escribe llama a `olvidarComunidad()` y la siguiente
// pantalla vuelve a preguntar. Más vale una espera después de publicar que ver
// una lista donde no está lo que acabas de escribir.

type Entrada = { valor: unknown; cuando: number }

const memoria = new Map<string, Entrada>()

/** Pasado este tiempo, lo guardado se considera viejo y ya no se pinta. */
const VIDA_MS = 5 * 60 * 1000

export function leerComunidad<T>(clave: string): T | null {
  const e = memoria.get(clave)
  if (!e) return null
  if (Date.now() - e.cuando > VIDA_MS) {
    memoria.delete(clave)
    return null
  }
  return e.valor as T
}

export function guardarComunidad(clave: string, valor: unknown) {
  memoria.set(clave, { valor, cuando: Date.now() })
}

/** Todo lo guardado deja de valer. Se llama al escribir algo. */
export function olvidarComunidad() {
  memoria.clear()
}
