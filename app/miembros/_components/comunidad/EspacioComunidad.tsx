"use client"

// CENTRO DE COMUNIDAD — un espacio por dentro.
//
// Lo mismo para los seis permanentes y para las cuatro temporadas: una sola
// arquitectura, no dos foros distintos. Lo único que cambia es que una
// temporada trae secciones —Conversación, Prácticas y experiencias,
// Preguntas— y un espacio permanente no las necesita.
//
// ── EL ORDEN DE LO QUE SE VE ───────────────────────────────────────────────
//   1. Dónde estás y qué se comparte aquí, en una frase.
//   2. El botón de abrir conversación, sin buscarlo.
//   3. Lo fijado por la casa, poco y arriba.
//   4. Todo lo demás, por actividad.
//
// Si el espacio está cerrado —una temporada que aún no se ha recorrido— el
// servidor no manda nada de dentro y aquí se dibuja el candado. No es que se
// oculten los títulos en pantalla: es que nunca llegan.

import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, Lock, MessageSquarePlus } from "lucide-react"
import type { ForumPost as THilo } from "../../_lib/types"
import { ForumPost } from "../ForumPost"
import { HiloResumen } from "./HiloResumen"
import { ComposerComunidad } from "./ComposerComunidad"
import s from "./comunidad.module.css"

type Categoria = { id: string; slug: string; name: string; description: string }

type Respuesta = {
  espacio: {
    id: string; slug: string; name: string; kicker: string
    description: string; tipo: "global" | "season"; season_num: number | null
  }
  categorias: Categoria[]
  categoria_activa: string | null
  fijadas: THilo[]
  hilos: THilo[]
  siguiente_cursor: string | null
  orden: string
  puedo: { moderar: boolean }
}

type Cerrado = { error: "cerrado"; espacio: { name: string; kicker: string }; mensaje: string }

const ORDENES: Array<{ id: string; etiqueta: string }> = [
  { id: "recientes", etiqueta: "Recientes" },
  { id: "sin_respuesta", etiqueta: "Sin respuesta" },
]

export function EspacioComunidad({ slug, onVolver }: { slug: string; onVolver: () => void }) {
  const [datos, setDatos] = useState<Respuesta | null>(null)
  const [cerrado, setCerrado] = useState<Cerrado | null>(null)
  const [cargando, setCargando] = useState(true)
  const [categoria, setCategoria] = useState<string | null>(null)
  const [orden, setOrden] = useState("recientes")
  const [abierto, setAbierto] = useState<THilo | null>(null)
  const [componiendo, setComponiendo] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const p = new URLSearchParams()
      if (categoria) p.set("categoria", categoria)
      if (orden !== "recientes") p.set("orden", orden)
      const qs = p.toString()
      const r = await fetch(`/api/comunidad/espacios/${slug}${qs ? `?${qs}` : ""}`, {
        credentials: "include",
      })
      const j = await r.json()
      if (r.status === 403 && j?.error === "cerrado") {
        setCerrado(j as Cerrado)
        setDatos(null)
        return
      }
      if (!r.ok) { setDatos(null); return }
      setCerrado(null)
      setDatos(j as Respuesta)
    } catch {
      setDatos(null)
    } finally {
      setCargando(false)
    }
  }, [slug, categoria, orden])

  useEffect(() => { void cargar() }, [cargar])

  // Al cambiar de espacio se vuelve arriba y se cierra lo que hubiera abierto.
  useEffect(() => { setAbierto(null); setCategoria(null) }, [slug])

  if (cargando && !datos && !cerrado) return <div className={s.cargando} aria-hidden />

  // ── Cerrado: se sabe que existe, no lo que dice ─────────────────────────
  if (cerrado) {
    return (
      <div className={s.espacio}>
        <button type="button" className={s.volver} onClick={onVolver}>
          <ArrowLeft size={14} aria-hidden /> Comunidad
        </button>
        <div className={s.cerrado}>
          <span className={s.cerradoIcono}><Lock size={22} /></span>
          <h2 className={s.cerradoTitulo}>{cerrado.espacio.name}</h2>
          <p className={s.cerradoKicker}>{cerrado.espacio.kicker}</p>
          <p className={s.cerradoTexto}>{cerrado.mensaje}</p>
        </div>
      </div>
    )
  }

  if (!datos) {
    return (
      <div className={s.espacio}>
        <button type="button" className={s.volver} onClick={onVolver}>
          <ArrowLeft size={14} aria-hidden /> Comunidad
        </button>
        <div className={s.vacio}>
          <p className={s.vacioTitulo}>No pudimos abrir este espacio</p>
          <p className={s.vacioTexto}>Vuelve a intentarlo en un momento.</p>
        </div>
      </div>
    )
  }

  // ── Una conversación abierta ────────────────────────────────────────────
  if (abierto) {
    return (
      <div className={s.espacio}>
        <button type="button" className={s.volver} onClick={() => setAbierto(null)}>
          <ArrowLeft size={14} aria-hidden /> {datos.espacio.name}
        </button>
        {abierto.is_locked && (
          <p className={s.avisoCerrada}>
            Esta conversación está cerrada. Se puede leer, pero ya no admite respuestas.
          </p>
        )}
        <ForumPost
          post={abierto}
          onEdit={() => {}}
          onReport={() => {}}
          onDelete={() => { setAbierto(null); void cargar() }}
          onDeleteAdmin={() => { setAbierto(null); void cargar() }}
          onEditReply={() => {}}
          onReportReply={() => {}}
        />
      </div>
    )
  }

  const sinNada = datos.fijadas.length === 0 && datos.hilos.length === 0

  return (
    <div className={s.espacio}>
      <button type="button" className={s.volver} onClick={onVolver}>
        <ArrowLeft size={14} aria-hidden /> Comunidad
      </button>

      <header className={s.espacioCabecera}>
        <p className={s.espacioCabeceraKicker}>{datos.espacio.kicker}</p>
        <h2 className={s.espacioCabeceraTitulo}>{datos.espacio.name}</h2>
        <p className={s.espacioCabeceraDesc}>{datos.espacio.description}</p>
      </header>

      <button type="button" className={s.abrirConversacion} onClick={() => setComponiendo(true)}>
        <MessageSquarePlus size={15} aria-hidden /> Iniciar conversación
      </button>

      {componiendo && (
        <ComposerComunidad
          espacio={datos.espacio}
          categorias={datos.categorias}
          categoriaPorDefecto={categoria}
          onCerrar={() => setComponiendo(false)}
          onCreada={() => { setComponiendo(false); void cargar() }}
        />
      )}

      {/* Las secciones, solo donde las hay. */}
      {datos.categorias.length > 0 && (
        <div className={s.secciones}>
          <button
            type="button"
            className={!categoria ? s.seccionChipOn : s.seccionChip}
            onClick={() => setCategoria(null)}
          >
            Todo
          </button>
          {datos.categorias.map((c) => (
            <button
              key={c.slug}
              type="button"
              className={categoria === c.slug ? s.seccionChipOn : s.seccionChip}
              onClick={() => setCategoria((v) => (v === c.slug ? null : c.slug))}
              title={c.description}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {datos.fijadas.length > 0 && (
        <section className={s.seccion}>
          <p className={s.seccionKicker}>Destacadas</p>
          <div className={s.lista}>
            {datos.fijadas.map((h) => (
              <HiloResumen key={h.id} hilo={h} onAbrir={setAbierto} />
            ))}
          </div>
        </section>
      )}

      <section className={s.seccion}>
        <div className={s.listaCabecera}>
          <p className={s.seccionKicker}>Conversaciones</p>
          <div className={s.ordenes}>
            {ORDENES.map((o) => (
              <button
                key={o.id}
                type="button"
                className={orden === o.id ? s.ordenChipOn : s.ordenChip}
                onClick={() => setOrden(o.id)}
              >
                {o.etiqueta}
              </button>
            ))}
          </div>
        </div>

        {sinNada ? (
          <div className={s.vacio}>
            <p className={s.vacioTitulo}>{vacioTitulo(datos.espacio.slug)}</p>
            <p className={s.vacioTexto}>Quizá la primera sea la tuya.</p>
            <button type="button" className={s.abrirConversacion} onClick={() => setComponiendo(true)}>
              <MessageSquarePlus size={15} aria-hidden /> {vacioBoton(datos.espacio.slug)}
            </button>
          </div>
        ) : datos.hilos.length === 0 ? (
          <p className={s.vacioTexto}>
            {orden === "sin_respuesta"
              ? "Aquí todas las conversaciones tienen respuesta."
              : "No hay más por ahora."}
          </p>
        ) : (
          <div className={s.lista}>
            {datos.hilos.map((h) => (
              <HiloResumen key={h.id} hilo={h} onAbrir={setAbierto} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/** El vacío habla como una persona, no como una base de datos. */
function vacioTitulo(slug: string): string {
  switch (slug) {
    case "experiencias-contacto": return "Todavía nadie ha compartido una experiencia aquí."
    case "preparacion-contacto": return "Todavía nadie ha preguntado cómo se prepara."
    case "presentaciones": return "Todavía nadie se ha presentado aquí."
    case "mision-tierra": return "Todavía nadie ha abierto esta conversación."
    case "objetivos-144000": return "Todavía nadie ha propuesto nada aquí."
    case "preguntas-144000": return "Todavía nadie ha preguntado aquí."
    default: return "Todavía no hay conversaciones en esta etapa."
  }
}

function vacioBoton(slug: string): string {
  switch (slug) {
    case "experiencias-contacto": return "Compartir una experiencia"
    case "presentaciones": return "Presentarme"
    case "preguntas-144000": return "Hacer una pregunta"
    default: return "Iniciar conversación"
  }
}
