"use client"

// CENTRO DE COMUNIDAD — el contenedor.
//
// Decide qué se ve: la portada o un espacio abierto. No hay rutas nuevas ni
// recargas: La Red entera funciona así, con vistas que se cambian en el
// sitio, y romper ese patrón aquí haría que la comunidad se sintiera como
// otra aplicación.
//
// El espacio abierto se recuerda en la sesión del navegador —no en la base—
// para que volver de leer una conversación no devuelva al principio. Se olvida
// al cerrar la pestaña, que es exactamente lo que se espera.

import { useCallback, useEffect, useState } from "react"
import { ViewComunidad } from "./ViewComunidad"
import { EspacioComunidad } from "./EspacioComunidad"

const CLAVE = "los144k_comunidad_espacio"

export function CentroComunidad() {
  const [espacio, setEspacio] = useState<string | null>(null)

  useEffect(() => {
    try {
      const guardado = sessionStorage.getItem(CLAVE)
      if (guardado) setEspacio(guardado)
    } catch { /* almacenamiento bloqueado: se entra por la portada */ }
  }, [])

  const abrir = useCallback((slug: string) => {
    setEspacio(slug)
    try { sessionStorage.setItem(CLAVE, slug) } catch { /* da igual */ }
    // Al cambiar de pantalla se empieza por arriba, no por donde estaba la
    // anterior: si no, se entra a un espacio por la mitad de su lista.
    window.scrollTo({ top: 0, behavior: "auto" })
  }, [])

  const volver = useCallback(() => {
    setEspacio(null)
    try { sessionStorage.removeItem(CLAVE) } catch { /* da igual */ }
    window.scrollTo({ top: 0, behavior: "auto" })
  }, [])

  return espacio
    ? <EspacioComunidad slug={espacio} onVolver={volver} />
    : <ViewComunidad onAbrirEspacio={abrir} />
}
