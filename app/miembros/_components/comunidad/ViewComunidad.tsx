"use client"

// CENTRO DE COMUNIDAD — la puerta.
//
// ── QUÉ ES Y QUÉ NO ────────────────────────────────────────────────────────
// No es una lista de categorías con un contador al lado. Es el sitio donde el
// recorrido de cada quien se encuentra con el de los demás, y por eso lo
// primero que se ve no son los espacios: es DÓNDE VA esta persona.
//
// Dos dimensiones que conviven sin parecer dos sistemas:
//   · TU RECORRIDO      · las cuatro temporadas, con las que aún no ha abierto
//                         visibles pero cerradas. Se sabe que existen; no lo
//                         que dicen.
//   · ESPACIOS DE LA RED · los seis permanentes, cada uno con la frase que lo
//                         distingue de su vecino: «Lo que viví» frente a
//                         «Cómo me preparo».
//
// ── POR QUÉ NO TODO ES UNA TARJETA ─────────────────────────────────────────
// Veinte rectángulos flotando no son jerarquía, son ruido. Aquí solo son
// tarjetas los espacios, que es donde la tarjeta aporta —nombre, distinción y
// pulso juntos—. El recorrido es una fila de peldaños y la actividad es una
// lista: eso se lee de un vistazo y no compite con nada.

import { useCallback, useEffect, useState } from "react"
import {
  ArrowRight, Compass, Globe2, HelpCircle, Lock, MessageCircle,
  Sparkles, Target, Users,
} from "lucide-react"
import type { ForumPost as THilo } from "../../_lib/types"
import { HiloResumen } from "./HiloResumen"
import s from "./comunidad.module.css"

export type EspacioResumen = {
  id: string
  slug: string
  name: string
  kicker: string
  description: string
  tipo: "global" | "season" | "hito"
  season_num: number | null
  desbloquea_con: number | null
  icono: string
  abierto: boolean
  conversaciones: number | null
  ultima_actividad: string | null
}

type Datos = {
  espacios: EspacioResumen[]
  recorrido: { temporada_actual: number | null; abiertas: number[] }
  destacadas: THilo[]
  recientes: THilo[]
  puedo: { moderar: boolean; estructurar: boolean }
}

/** El icono de cada espacio. Por slug: no depende de lo que haya en la base. */
const ICONOS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  presentaciones: Users,
  "experiencias-contacto": Sparkles,
  "preguntas-144000": HelpCircle,
  "umbral-contacto": Compass,
  "objetivos-144000": Target,
  "mision-tierra": Globe2,
}

export function ViewComunidad({ onAbrirEspacio, onAbrirHilo }: {
  onAbrirEspacio: (slug: string) => void
  /** Abre el espacio de esa conversación y la deja desplegada. */
  onAbrirHilo: (slug: string, hiloId: string) => void
}) {
  const [datos, setDatos] = useState<Datos | null>(null)
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    try {
      const r = await fetch("/api/comunidad", { credentials: "include" })
      if (!r.ok) { setDatos(null); return }
      setDatos((await r.json()) as Datos)
    } catch {
      setDatos(null)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { void cargar() }, [cargar])

  if (cargando) return <div className={s.cargando} aria-hidden />

  if (!datos) {
    return (
      <div className={s.vacio}>
        <p className={s.vacioTitulo}>No pudimos cargar la comunidad</p>
        <p className={s.vacioTexto}>Revisa tu conexión y vuelve a entrar.</p>
      </div>
    )
  }

  // El recorrido es el camino COMPLETO, en orden: las cuatro temporadas, los
  // portales que hay entre ellas, el Umbral, los Objetivos y la Misión. Antes
  // solo estaban las temporadas y lo demás vivía suelto entre los espacios
  // permanentes, como si el final del camino fuera un tema más.
  const camino = datos.espacios.filter((e) => e.tipo === "season" || e.tipo === "hito")
  const globales = datos.espacios.filter((e) => e.tipo === "global")
  const actual =
    camino.find((t) => t.tipo === "season" && t.season_num === datos.recorrido.temporada_actual) ?? null

  return (
    <div className={s.comunidad}>
      {/* ── Bienvenida ──────────────────────────────────────────────────── */}
      <header className={s.cabecera}>
        <p className={s.kicker}>Comunidad</p>
        <h1 className={s.titulo}>Donde tu recorrido se encuentra con el de los demás</h1>
        <p className={s.lead}>
          Lo que aprendes te lo llevas solo. Lo que vives, se comparte. Aquí están las
          conversaciones de quienes caminan esto contigo.
        </p>
      </header>

      {/* ── Tu recorrido ────────────────────────────────────────────────── */}
      {actual && (
        <section className={s.seccion}>
          <p className={s.seccionKicker}>Tu recorrido</p>
          <button
            type="button"
            className={s.recorridoCard}
            onClick={() => onAbrirEspacio(actual.slug)}
          >
            <span className={s.recorridoNum}>{actual.season_num}</span>
            <span className={s.recorridoTextos}>
              <span className={s.recorridoTitulo}>{actual.name} · {actual.kicker}</span>
              <span className={s.recorridoSub}>
                Explora las conversaciones de quienes están atravesando esta misma etapa.
              </span>
            </span>
            <ArrowRight size={16} aria-hidden className={s.recorridoFlecha} />
          </button>

          {/* EL CAMINO, ENTERO Y EN ORDEN.
              Una lista y no una fila de pastillas: son diez pasos, no cuatro,
              y una fila que se desplaza a lo ancho esconde justo el final —los
              Objetivos y la Misión—, que es a donde lleva todo esto.

              Las temporadas se numeran; los pasos de en medio no, porque no
              son etapas sino puertas entre ellas. */}
          <ol className={s.camino}>
            {camino.map((paso) => {
              const esActual = paso.tipo === "season" && paso.season_num === actual.season_num
              return (
                <li key={paso.slug}>
                  <button
                    type="button"
                    className={
                      esActual ? s.pasoActual : paso.abierto ? s.paso : s.pasoCerrado
                    }
                    onClick={() => paso.abierto && onAbrirEspacio(paso.slug)}
                    disabled={!paso.abierto}
                    title={paso.abierto ? paso.name : "Continúa tu recorrido para entrar"}
                  >
                    <span className={paso.tipo === "season" ? s.pasoNum : s.pasoPunto}>
                      {paso.tipo === "season" ? paso.season_num : ""}
                    </span>
                    <span className={s.pasoTextos}>
                      <span className={s.pasoNombre}>{paso.name}</span>
                      <span className={s.pasoKicker}>{paso.kicker}</span>
                    </span>
                    {!paso.abierto && <Lock size={12} aria-hidden className={s.pasoCandado} />}
                  </button>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {/* ── Destacadas ──────────────────────────────────────────────────── */}
      {datos.destacadas.length > 0 && (
        <section className={s.seccion}>
          <p className={s.seccionKicker}>Destacadas</p>
          <div className={s.lista}>
            {datos.destacadas.map((h) => (
              <HiloResumen
                key={h.id}
                hilo={h}
                espacios={datos.espacios}
                onAbrirEspacio={onAbrirEspacio}
                onAbrir={(x) => abrirDonde(x, datos.espacios, onAbrirHilo)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Espacios de la Red ──────────────────────────────────────────── */}
      <section className={s.seccion}>
        <p className={s.seccionKicker}>Espacios de la Red</p>
        <div className={s.espacios}>
          {globales.map((e) => {
            const Icono = ICONOS[e.slug] ?? MessageCircle
            return (
              <button
                key={e.slug}
                type="button"
                className={s.espacioCard}
                onClick={() => onAbrirEspacio(e.slug)}
              >
                <span className={s.espacioIcono}><Icono size={17} /></span>
                <span className={s.espacioNombre}>{e.name}</span>
                {/* La frase que lo distingue de su vecino. Es lo que evita que
                    alguien publique «lo que viví» donde se habla de «cómo me
                    preparo». */}
                <span className={s.espacioKicker}>{e.kicker}</span>
                <span className={s.espacioDesc}>{e.description}</span>
                <span className={s.espacioPie}>
                  {e.conversaciones === 0
                    ? "Sin conversaciones todavía"
                    : `${e.conversaciones} ${e.conversaciones === 1 ? "conversación" : "conversaciones"}`}
                  {e.ultima_actividad && ` · ${hace(e.ultima_actividad)}`}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Lo que acaba de moverse ─────────────────────────────────────── */}
      <section className={s.seccion}>
        <p className={s.seccionKicker}>Actividad reciente</p>
        {datos.recientes.length === 0 ? (
          <div className={s.vacio}>
            <p className={s.vacioTitulo}>Todavía no hay conversación</p>
            <p className={s.vacioTexto}>
              Elige un espacio de arriba y abre la primera. Lo que escribas queda aquí
              para quien llegue después.
            </p>
          </div>
        ) : (
          <div className={s.lista}>
            {datos.recientes.map((h) => (
              <HiloResumen
                key={h.id}
                hilo={h}
                espacios={datos.espacios}
                onAbrirEspacio={onAbrirEspacio}
                onAbrir={(x) => abrirDonde(x, datos.espacios, onAbrirHilo)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/**
 * Lleva a una conversación desde una lista que cruza espacios.
 *
 * La portada enseña conversaciones de sitios distintos, así que abrirla es
 * primero ir a su espacio. Si por lo que sea no se sabe de cuál es, no se
 * hace nada: mejor un clic sin efecto que mandar a alguien a un sitio que no
 * es el suyo.
 */
function abrirDonde(
  hilo: { id: string; space_id?: string | null },
  espacios: EspacioResumen[],
  ir: (slug: string, hiloId: string) => void,
) {
  const espacio = espacios.find((e) => e.id === hilo.space_id)
  if (espacio?.abierto) ir(espacio.slug, hilo.id)
}

/** «hace 12 min». Corto, porque va dentro de una línea ya cargada. */
export function hace(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return ""
  const min = Math.floor(ms / 60000)
  if (min < 1) return "ahora mismo"
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d === 1) return "ayer"
  if (d < 30) return `hace ${d} días`
  const meses = Math.floor(d / 30)
  return meses === 1 ? "hace un mes" : `hace ${meses} meses`
}
