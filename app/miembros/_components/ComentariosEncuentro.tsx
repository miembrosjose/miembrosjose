"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  LO QUE SE DICE BAJO UNA GRABACIÓN
// ═══════════════════════════════════════════════════════════════════════════
//
// ── UN NIVEL, Y SE DICE A QUIÉN SE RESPONDE ───────────────────────────────
// Responder a una respuesta no abre otra rama: cuelga del comentario de
// arriba y se menciona a quien se contesta. Una conversación que se anida sin
// fin es ilegible en un teléfono —a la cuarta respuesta el texto cabe en tres
// palabras por línea—, y aquí la mayoría entra desde el móvil.
//
// Eso lo impone el SERVIDOR. Esta pantalla solo lo dibuja.
//
// ── EL «ME GUSTA» SE PINTA ANTES DE QUE CONTESTE EL SERVIDOR ──────────────
// Pulsar y esperar medio segundo a que el corazón cambie hace dudar de si se
// pulsó. Se cambia en el acto y, si el servidor dice otra cosa, se corrige
// con lo que él diga. El número final siempre lo manda él: lo lleva un
// disparador de la base, no una suma hecha aquí.

import { useCallback, useEffect, useState } from "react"
import { Heart, Loader2, MessageCircle, Send, Trash2, X } from "lucide-react"
import { useAuth } from "../_lib/auth-context"
import { timeAgoEs } from "../_lib/format"
import { Avatar } from "./Avatar"
import s from "./comentarios-encuentro.module.css"

type Comentario = {
  id: string
  user_id: string
  parent_id: string | null
  author_name: string
  author_username: string | null
  author_avatar: string
  author_avatar_url: string | null
  author_badge_id: string | null
  author_is_admin: boolean
  body: string
  likes_count: number
  created_at: string
}

const MAX = 1000

export function ComentariosEncuentro({ grabacionId }: { grabacionId: number }) {
  const { user } = useAuth()
  const [lista, setLista] = useState<Comentario[] | null>(null)
  const [mios, setMios] = useState<Set<string>>(new Set())
  const [puedoModerar, setPuedoModerar] = useState(false)
  const [sinTabla, setSinTabla] = useState(false)
  const [texto, setTexto] = useState("")
  const [respondiendoA, setRespondiendoA] = useState<Comentario | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const r = await fetch(`/api/red/grabaciones/${grabacionId}/comentarios`, {
        credentials: "include",
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || "No se pudo cargar.")
      setLista(j.comentarios ?? [])
      setMios(new Set<string>(j.mios ?? []))
      setPuedoModerar(!!j.puedoModerar)
      setSinTabla(!!j.sinTabla)
    } catch {
      setLista([])
    }
  }, [grabacionId])

  useEffect(() => { void cargar() }, [cargar])

  async function enviar() {
    const limpio = texto.trim()
    if (!limpio || enviando) return
    setEnviando(true)
    setError(null)
    try {
      const r = await fetch(`/api/red/grabaciones/${grabacionId}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ texto: limpio, responderA: respondiendoA?.id ?? null }),
      })
      const j = await r.json()
      if (!r.ok) { setError(j.error || "No se pudo publicar."); return }
      // Se añade al final en vez de recargar el hilo entero: recargar hace
      // parpadear lo que ya estaba leyendo quien escribe.
      setLista((prev) => [...(prev ?? []), j.comentario as Comentario])
      setTexto("")
      setRespondiendoA(null)
    } catch {
      setError("No se pudo publicar.")
    } finally {
      setEnviando(false)
    }
  }

  async function alternarGusta(c: Comentario) {
    const teniaGusta = mios.has(c.id)
    // Optimista: el corazón cambia ya.
    setMios((prev) => {
      const n = new Set(prev)
      if (teniaGusta) n.delete(c.id); else n.add(c.id)
      return n
    })
    setLista((prev) => (prev ?? []).map((x) =>
      x.id === c.id
        ? { ...x, likes_count: Math.max(0, x.likes_count + (teniaGusta ? -1 : 1)) }
        : x))

    try {
      const r = await fetch(`/api/red/comentarios/${c.id}/like`, {
        method: "POST", credentials: "include",
      })
      const j = await r.json()
      if (!r.ok) throw new Error()
      // Lo que diga el servidor manda.
      setMios((prev) => {
        const n = new Set(prev)
        if (j.miGusta) n.add(c.id); else n.delete(c.id)
        return n
      })
      setLista((prev) => (prev ?? []).map((x) =>
        x.id === c.id ? { ...x, likes_count: j.cuantos as number } : x))
    } catch {
      // Se deshace lo pintado: dejarlo marcado cuando no se guardó es peor
      // que no marcarlo, porque se cree que quedó hecho.
      setMios((prev) => {
        const n = new Set(prev)
        if (teniaGusta) n.add(c.id); else n.delete(c.id)
        return n
      })
      setLista((prev) => (prev ?? []).map((x) =>
        x.id === c.id
          ? { ...x, likes_count: Math.max(0, x.likes_count + (teniaGusta ? 1 : -1)) }
          : x))
    }
  }

  async function borrar(c: Comentario) {
    const hijas = (lista ?? []).filter((x) => x.parent_id === c.id).length
    if (!confirm(
      hijas > 0
        ? `¿Borrar este comentario?\n\nSe van también sus ${hijas} respuesta(s).`
        : "¿Borrar este comentario?",
    )) return
    try {
      const r = await fetch(`/api/red/comentarios/${c.id}`, {
        method: "DELETE", credentials: "include",
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        setError(j.error || "No se pudo borrar.")
        return
      }
      setLista((prev) => (prev ?? []).filter((x) => x.id !== c.id && x.parent_id !== c.id))
    } catch {
      setError("No se pudo borrar.")
    }
  }

  const raices = (lista ?? []).filter((c) => !c.parent_id)
  const hijasDe = (id: string) => (lista ?? []).filter((c) => c.parent_id === id)
  const total = lista?.length ?? 0

  return (
    <section className={s.bloque} aria-labelledby="comentarios-titulo">
      <h2 id="comentarios-titulo" className={s.titulo}>
        <MessageCircle size={15} aria-hidden />
        {total === 0 ? "Comentarios" : total === 1 ? "1 comentario" : `${total} comentarios`}
      </h2>

      {sinTabla && (
        <p className={s.aviso}>
          Falta correr <code>docs/sql/encuentros_comentarios.sql</code> en Supabase.
        </p>
      )}

      {/* ── ESCRIBIR VA ARRIBA ───────────────────────────────────────────
          Debajo de un hilo de cuarenta comentarios, la caja de escribir no
          existe: hay que recorrerlo entero para encontrarla. */}
      <div className={s.escribir}>
        {respondiendoA && (
          <p className={s.respondiendoA}>
            Respondiendo a <strong>{respondiendoA.author_name}</strong>
            <button type="button" onClick={() => setRespondiendoA(null)} aria-label="Cancelar la respuesta">
              <X size={13} />
            </button>
          </p>
        )}
        <div className={s.cajaEscribir}>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={MAX}
            rows={respondiendoA || texto ? 3 : 1}
            placeholder={respondiendoA ? "Tu respuesta…" : "Escribe un comentario…"}
            className={s.campo}
            onKeyDown={(e) => {
              // Enviar con Ctrl/⌘+Enter. Enter a secas hace un salto de
              // línea: un comentario de varias líneas es normal, y perderlo
              // por pulsar Enter enfada más de lo que ahorra.
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void enviar()
            }}
          />
          <button
            type="button"
            onClick={() => void enviar()}
            disabled={!texto.trim() || enviando}
            className={s.enviar}
            aria-label="Publicar"
          >
            {enviando ? <Loader2 size={15} className={s.gira} /> : <Send size={15} />}
          </button>
        </div>
        {texto.length > MAX - 100 && (
          <p className={s.cuenta}>{MAX - texto.length} caracteres</p>
        )}
      </div>

      {error && <p className={s.error} role="status">{error}</p>}

      {lista === null ? (
        <p className={s.cargando}><Loader2 size={14} className={s.gira} aria-hidden /> Cargando…</p>
      ) : raices.length === 0 ? (
        <p className={s.vacio}>
          Todavía no hay comentarios. El primero es el que abre la conversación.
        </p>
      ) : (
        <ul className={s.hilo}>
          {raices.map((c) => (
            <li key={c.id}>
              <Uno
                c={c}
                miGusta={mios.has(c.id)}
                puedoBorrar={puedoModerar || c.user_id === user?.id}
                onGusta={() => void alternarGusta(c)}
                onResponder={() => setRespondiendoA(c)}
                onBorrar={() => void borrar(c)}
              />
              {hijasDe(c.id).length > 0 && (
                <ul className={s.respuestas}>
                  {hijasDe(c.id).map((h) => (
                    <li key={h.id}>
                      <Uno
                        c={h}
                        anidado
                        miGusta={mios.has(h.id)}
                        puedoBorrar={puedoModerar || h.user_id === user?.id}
                        onGusta={() => void alternarGusta(h)}
                        // Responder a una respuesta sigue colgando del raíz;
                        // el servidor lo garantiza. Aquí se prepara con el
                        // nombre de quien se contesta.
                        onResponder={() => setRespondiendoA(h)}
                        onBorrar={() => void borrar(h)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Uno({
  c, anidado, miGusta, puedoBorrar, onGusta, onResponder, onBorrar,
}: {
  c: Comentario
  anidado?: boolean
  miGusta: boolean
  puedoBorrar: boolean
  onGusta: () => void
  onResponder: () => void
  onBorrar: () => void
}) {
  return (
    <article className={`${s.comentario} ${anidado ? s.anidado : ""}`}>
      {/* `enlaceReal` porque esto NO es la pantalla única: sin eso, el avatar
          cancela el clic y no lleva a ninguna parte. */}
      <Avatar
        enlaceReal
        author={{
          user_id: c.user_id,
          author_name: c.author_name,
          author_username: c.author_username,
          author_avatar: c.author_avatar || c.author_name.slice(0, 2).toUpperCase(),
          author_avatar_url: c.author_avatar_url,
          author_badge_id: c.author_badge_id,
          author_is_admin: c.author_is_admin,
        }}
        className={s.avatar}
      />

      <div className={s.cuerpo}>
        <p className={s.cabecera}>
          <a href={`/miembros/u/${c.user_id}`} className={s.nombre}>
            {c.author_name}
          </a>
          {c.author_is_admin && <span className={s.sello}>Admin</span>}
          <time className={s.cuando} dateTime={c.created_at} suppressHydrationWarning>
            {timeAgoEs(c.created_at)}
          </time>
        </p>

        <p className={s.texto}>{c.body}</p>

        <div className={s.acciones}>
          <button
            type="button"
            onClick={onGusta}
            className={`${s.accion} ${miGusta ? s.gustado : ""}`}
            aria-pressed={miGusta}
            aria-label={miGusta ? "Quitar me gusta" : "Me gusta"}
          >
            <Heart size={13} fill={miGusta ? "currentColor" : "none"} aria-hidden />
            {c.likes_count > 0 && <span>{c.likes_count}</span>}
          </button>

          <button type="button" onClick={onResponder} className={s.accion}>
            Responder
          </button>

          {puedoBorrar && (
            <button
              type="button"
              onClick={onBorrar}
              className={`${s.accion} ${s.borrar}`}
              aria-label="Borrar este comentario"
            >
              <Trash2 size={12} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
