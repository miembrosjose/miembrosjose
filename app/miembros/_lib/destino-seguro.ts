// ═══════════════════════════════════════════════════════════════════════════
//  A DÓNDE SE PUEDE VOLVER DESPUÉS DE ENTRAR
// ═══════════════════════════════════════════════════════════════════════════
//
// Cuando alguien abre una dirección de la plataforma sin sesión —el enlace de
// una grabación puesto en el grupo de Telegram, por ejemplo—, se le manda a la
// pantalla de acceso con esa dirección apuntada, para devolverlo ahí al
// entrar. Esta función decide qué direcciones son de fiar.
//
// ── POR QUÉ NO VALE ACEPTAR LO QUE VENGA ──────────────────────────────────
// Ese valor viaja en la barra de direcciones y acaba convertido en una
// redirección. Si se aceptara cualquier cosa, bastaría con repartir
//
//     los144000.com/miembros/login?redirectTo=https://sitio-de-otro.example
//
// para que la plataforma mandara a la gente fuera JUSTO DESPUÉS de haber
// entrado, con toda la confianza de venir de aquí. Es el truco con el que se
// copia una pantalla de acceso y se pide la contraseña una segunda vez: la
// víctima ya escribió sus datos una vez en el sitio bueno y no sospecha.
//
// ── LA TRAMPA DE LAS DOS BARRAS ───────────────────────────────────────────
// «Que empiece por barra» parece comprobación suficiente, y no lo es:
// `//sitio-de-otro.example` empieza por barra y el navegador lo entiende como
// un dominio ajeno —es una dirección sin protocolo, hereda el de la página—.
// Por eso se exige `/miembros/` y se rechaza el doble comienzo aparte.
//
// ── UNA SOLA, NO DOS ──────────────────────────────────────────────────────
// La usan el servidor (al mandar a la pantalla de acceso) y el navegador (al
// volver tras entrar). Con una copia en cada sitio, el día que alguien
// relajara una de las dos, la otra seguiría pareciendo correcta y nadie
// notaría que la puerta quedó abierta.

/**
 * Devuelve la ruta si es una de aquí dentro, o null si no es de fiar.
 *
 * Solo se admiten rutas que empiecen por `/miembros/`. Eso descarta las
 * direcciones completas (`https://…`, `javascript:…`) y las que empiezan por
 * doble barra.
 */
export function destinoSeguro(valor: string | null | undefined): string | null {
  if (!valor) return null
  const limpio = valor.trim()
  if (limpio.startsWith("//")) return null
  if (!limpio.startsWith("/miembros/")) return null
  // Una barra invertida también sirve para escapar a otro dominio en algunos
  // navegadores (`/\otro-sitio.example`), así que no se deja pasar ninguna.
  if (limpio.includes("\\")) return null
  return limpio
}

/** La pantalla de acceso, recordando a dónde se iba. */
export function accesoVolviendoA(volverA?: string | null): string {
  const destino = destinoSeguro(volverA)
  return destino
    ? `/miembros/login?redirectTo=${encodeURIComponent(destino)}`
    : "/miembros/login"
}
