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
import { useView } from "../../_lib/view-context"
import { irAlTope } from "../../_lib/ir-al-tope"
import { ViewComunidad } from "./ViewComunidad"
import { EspacioComunidad } from "./EspacioComunidad"

const CLAVE = "los144k_comunidad_espacio"

export function CentroComunidad() {
  const { params } = useView()
  const [espacio, setEspacio] = useState<string | null>(null)
  // Conversación que hay que abrir nada más entrar, si se llegó pidiendo una.
  const [hiloPedido, setHiloPedido] = useState<string | null>(null)

  useEffect(() => {
    try {
      const guardado = sessionStorage.getItem(CLAVE)
      if (guardado) setEspacio(guardado)
    } catch { /* almacenamiento bloqueado: se entra por la portada */ }
  }, [])

  // ── Llegar a un tema concreto ──────────────────────────────────────────
  // Un portal del Camino dice «Compartir en el foro» y nombra un tema. El
  // título por sí solo ya no basta —hay diez espacios—, así que se le pregunta
  // al servidor dónde vive y se abre ahí. Si no lo encuentra, o si vive en una
  // temporada cerrada, se queda en la portada: nunca se lleva a nadie a un
  // sitio donde no puede entrar.
  useEffect(() => {
    const tema = params.comunidadTema
    if (!tema) return
    let vivo = true
    fetch(`/api/comunidad/buscar-hilo?titulo=${encodeURIComponent(tema)}`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { encontrado?: boolean; espacio?: string; hilo_id?: string } | null) => {
        if (!vivo || !d?.encontrado || !d.espacio) return
        setEspacio(d.espacio)
        setHiloPedido(d.hilo_id ?? null)
        try { sessionStorage.setItem(CLAVE, d.espacio) } catch { /* da igual */ }
      })
      .catch(() => { /* se queda en la portada */ })
    return () => { vivo = false }
  }, [params.comunidadTema])

  const abrir = useCallback((slug: string) => {
    setEspacio(slug)
    setHiloPedido(null)
    try { sessionStorage.setItem(CLAVE, slug) } catch { /* da igual */ }
    // Al cambiar de pantalla se empieza por arriba, no por donde estaba la
    // anterior: si no, se entra a un espacio por la mitad de su lista.
    irAlTope()
  }, [])

  // Desde la portada: ir a un espacio y dejar abierta esa conversación.
  const abrirHilo = useCallback((slug: string, hiloId: string) => {
    setEspacio(slug)
    setHiloPedido(hiloId)
    try { sessionStorage.setItem(CLAVE, slug) } catch { /* da igual */ }
    irAlTope()
  }, [])

  const volver = useCallback(() => {
    setEspacio(null)
    setHiloPedido(null)
    try { sessionStorage.removeItem(CLAVE) } catch { /* da igual */ }
    irAlTope()
  }, [])

  // La `key` es deliberada: al pasar de un espacio a otro no se reaprovecha la
  // pantalla anterior. Sin ella, React conservaba el estado —y por un
  // fotograma se veía la lista del espacio del que se venía— antes de que
  // llegara la del nuevo.
  return espacio
    ? <EspacioComunidad key={espacio} slug={espacio} abrirHiloId={hiloPedido} onVolver={volver} />
    : <ViewComunidad onAbrirEspacio={abrir} onAbrirHilo={abrirHilo} />
}
