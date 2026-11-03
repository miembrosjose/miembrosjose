"use client"

// Modal fullscreen bloqueante — força o user a preencher campos do perfil
// antes de acessar a área de membros. Renderizado em SpaHomeShell quando
// isProfileComplete(user_metadata) === false.
//
// Campos obligatorios: foto, nombre y @usuario.
// La bio, el Instagram y la ubicación son opcionales.

import { useEffect, useRef, useState, useTransition } from "react"
import { useAuth } from "../_lib/auth-context"
import { UbicacionRed } from "./UbicacionRed"
import { avatarCuadrado } from "../_lib/image-upload"

type State = { type: "idle" } | { type: "saving" } | { type: "error"; msg: string }

const MAX_AVATAR_SIZE = 10 * 1024 * 1024 // 10 MB

// ── EL RECORTE DE LA FOTO VIVE EN _lib/image-upload ───────────────────────
// Aquí había una copia propia que rechazaba con el Event del navegador en vez
// de con un Error. El `catch` de abajo comprueba `instanceof Error`, así que
// el motivo se perdía y quedaba «Error al guardar perfil» — una frase que no
// dice nada y que además mentía: lo que falló fue la foto, no el perfil.

/**
 * Lo que dijo el servidor, o algo que se pueda leer.
 *
 * ── POR QUÉ NO VALE `(await r.json()).error` ──────────────────────────────
 * Porque una respuesta sin cuerpo —un 405, un 502, un Worker que se cae antes
 * de escribir nada— hace que `json()` lance «Unexpected end of JSON input», y
 * ese mensaje habla del formato de la respuesta en vez de del problema.
 */
async function motivoDe(r: Response, reserva: string): Promise<string> {
  let texto = ""
  try { texto = await r.text() } catch { /* ni eso */ }
  if (texto.trim()) {
    try {
      const j = JSON.parse(texto) as { error?: string }
      if (j?.error) return j.error
    } catch { /* no era JSON */ }
  }
  return `${reserva} (el servidor respondió ${r.status})`
}

export function ProfileOnboardingModal({
  initialName,
  initialAvatar,
  initialUsername,
  initialBio,
  initialInstagram,
}: {
  initialName: string
  initialAvatar: string | null
  initialUsername: string
  initialBio: string
  initialInstagram: string
}) {
  const { refresh: refreshAuth } = useAuth()

  const [name, setName] = useState(initialName)
  const [username, setUsername] = useState(initialUsername)
  const [bio, setBio] = useState(initialBio)
  const [instagram, setInstagram] = useState(initialInstagram)
  const [avatar, setAvatar] = useState(initialAvatar)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialAvatar)
  const [state, setState] = useState<State>({ type: "idle" })
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  // La ubicación elegida abajo. Se guarda con «Continuar», no con un botón
  // aparte: dos botones de guardar en la misma pantalla hacían que quien
  // pulsaba el grande perdiera lo de arriba sin enterarse.
  const [ubicacion, setUbicacion] = useState<{
    country_code: string
    city_id: number | null
    show_city: boolean
  } | null>(null)

  // Trava scroll do body enquanto modal aberto
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!/^image\//.test(file.type)) {
      setState({ type: "error", msg: "Selecciona una imagen válida" })
      return
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setState({ type: "error", msg: "Imagen muy grande (max 10MB)" })
      return
    }
    setState({ type: "idle" })
    setPendingFile(file)
    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function uploadPendingAvatar(): Promise<string | null> {
    if (!pendingFile) return avatar
    const preparada = await avatarCuadrado(pendingFile)
    const fd = new FormData()
    fd.append("file", preparada)
    const res = await fetch("/api/profile/avatar", {
      method: "POST",
      body: fd,
      credentials: "include",
    })
    if (!res.ok) throw new Error(await motivoDe(res, "No se pudo subir la foto"))
    const data = (await res.json()) as { avatar_url?: string }
    return data.avatar_url ?? null
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState({ type: "idle" })

    const cleanName = name.trim()
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, "")
    const cleanInstagram = instagram.trim().replace(/^@/, "")
    const cleanBio = bio.trim()

    // Validações
    if (cleanName.length < 2) {
      setState({ type: "error", msg: "Nombre demasiado corto" })
      return
    }
    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 30 || !/^[a-z0-9_.]+$/.test(cleanUsername)) {
      setState({ type: "error", msg: "@username inválido (3-30, letras minúsculas, números, _ y .)" })
      return
    }
    // Opcional: solo se comprueba si escribió algo. Antes bloqueaba el alta
    // de quien no tiene Instagram o no quiere darlo.
    if (cleanInstagram && (cleanInstagram.length > 30 || !/^[a-zA-Z0-9_.]+$/.test(cleanInstagram))) {
      setState({ type: "error", msg: "Instagram inválido (sin @, letras, números, _ y .)" })
      return
    }
    if (cleanBio.length > 500) {
      setState({ type: "error", msg: "Bio máx 500 caracteres" })
      return
    }
    if (!previewUrl && !pendingFile && !avatar) {
      setState({ type: "error", msg: "Subí una foto de perfil" })
      return
    }

    // ── EN QUÉ PASO VA ────────────────────────────────────────────────
    // Esto son tres peticiones seguidas y antes todas fallaban con la misma
    // frase. Saber cuál de las tres murió es la diferencia entre arreglarlo y
    // adivinar: la vez que pasó de verdad, el fallo estaba en la foto y el
    // mensaje hablaba del perfil.
    let paso = "la foto"

    startTransition(async () => {
      try {
        setState({ type: "saving" })

        // 1) Upload avatar se tem novo file pendente
        const finalAvatarUrl = await uploadPendingAvatar()
        if (finalAvatarUrl) setAvatar(finalAvatarUrl)

        // 2) Update name (endpoint específico)
        paso = "el nombre"
        const resName = await fetch("/api/profile/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ full_name: cleanName }),
        })
        if (!resName.ok) throw new Error(await motivoDe(resName, "No se pudo guardar el nombre"))

        // 3) Update about (username, bio, instagram)
        paso = "el @usuario"
        const resAbout = await fetch("/api/profile/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            username: cleanUsername,
            bio: cleanBio,
            instagram: cleanInstagram,
          }),
        })
        if (!resAbout.ok) throw new Error(await motivoDe(resAbout, "No se pudo guardar el perfil"))

        // 3b) La ubicación, si eligió alguna. Va con el mismo botón que todo
        // lo demás. Si falla, NO se corta el alta: la persona entra igual y
        // puede ponerla luego desde su perfil.
        if (ubicacion?.country_code) {
          await fetch("/api/red/ubicacion", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(ubicacion),
          }).catch(() => null)
        }

        // 4) Refresh auth — gate fecha sozinho quando isProfileComplete passa
        await refreshAuth()
      } catch (err) {
        // ── LO QUE SEA QUE HAYA LLEGADO, DICHO ──────────────────────────
        // Lo que no es un Error ya no se traga en silencio: se enseña su
        // forma. Un texto raro delante de alguien es feo; un texto que no
        // dice nada deja a esa persona sin poder entrar y a nosotros sin
        // saber por qué.
        const detalle =
          err instanceof Error
            ? err.message
            : typeof err === "string"
              ? err
              : `fallo inesperado (${Object.prototype.toString.call(err)})`

        setState({ type: "error", msg: `${detalle} — falló ${paso}.` })
        console.error("[alta de perfil] falló", paso, err)
      }
    })
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(10, 10, 15, 0.97)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 540,
          maxHeight: "92vh",
          overflowY: "auto",
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "2.5rem 2rem",
        }}
      >
        <header style={{ marginBottom: "1.75rem" }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--accent-gold, #6D4A9B)",
              marginBottom: "0.5rem",
            }}
          >
            Bienvenido al Estudio
          </p>
          <h1
            style={{
              fontFamily: "var(--font-cinzel, serif)",
              fontSize: "1.65rem",
              fontWeight: 700,
              color: "#F3F6FA",
              lineHeight: 1.15,
              marginBottom: "0.75rem",
            }}
          >
            Completá tu perfil para empezar
          </h1>
          <p
            style={{
              fontFamily: "var(--font-geist-sans)",
              fontSize: "0.85rem",
              color: "#a0a0b0",
              lineHeight: 1.5,
            }}
          >
            Necesitamos algunos datos para personalizar tu experiencia y
            mostrarte a la comunidad.
          </p>
        </header>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* AVATAR */}
          <div>
            <Label>Foto de perfil *</Label>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: "#1d1d35",
                  border: "1px solid #2a2a35",
                  flexShrink: 0,
                }}
              >
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-cinzel, serif)",
                      fontSize: "2rem",
                      color: "#6D4A9B",
                    }}
                  >
                    {(name || "?").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* El input nativo se oculta y se dispara desde un botón.
                  Dejarlo a la vista pintaba el texto del sistema —"Seleccionar
                  archivo · Sin archivos seleccionados"— que no se puede
                  traducir ni acortar, y en pantallas estrechas se desbordaba
                  encima del texto de al lado. */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFilePick}
                disabled={isPending}
                style={{ display: "none" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                  style={{
                    fontFamily: "var(--font-geist-sans)",
                    fontSize: "0.72rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#c3b2e0",
                    background: "rgba(109, 74, 155, 0.14)",
                    border: "1px solid rgba(109, 74, 155, 0.5)",
                    padding: "0.55rem 0.9rem",
                    cursor: isPending ? "default" : "pointer",
                    opacity: isPending ? 0.5 : 1,
                    width: "100%",
                  }}
                >
                  {previewUrl ? "Cambiar foto" : "Elegir una foto"}
                </button>
                {pendingFile && (
                  <p
                    style={{
                      margin: "0.4rem 0 0",
                      fontFamily: "var(--font-geist-sans)",
                      fontSize: "0.68rem",
                      color: "#6a6a7a",
                      // Un nombre de archivo largo se recorta en vez de
                      // ensanchar la columna y descuadrar el formulario.
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {pendingFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Field
            label="Nombre completo *"
            value={name}
            onChange={setName}
            placeholder="Tu nombre"
            disabled={isPending}
            maxLength={60}
          />

          <Field
            label="@username *"
            value={username}
            onChange={(v) => setUsername(v.toLowerCase().replace(/^@/, ""))}
            placeholder="tu_usuario"
            disabled={isPending}
            maxLength={30}
            prefix="@"
          />

          <Field
            label="Instagram (opcional)"
            value={instagram}
            onChange={(v) => setInstagram(v.replace(/^@/, ""))}
            placeholder="tu_instagram"
            disabled={isPending}
            maxLength={30}
            prefix="@"
          />

          <div>
            <Label>Bio (opcional)</Label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={isPending}
              maxLength={500}
              rows={3}
              placeholder="Algo sobre ti..."
              style={{
                width: "100%",
                background: "#12121a",
                border: "1px solid #2a2a35",
                color: "#F3F6FA",
                padding: "0.75rem",
                fontSize: "0.875rem",
                fontFamily: "var(--font-geist-sans)",
                resize: "vertical",
                minHeight: 70,
              }}
            />
          </div>

          {/* ── Tu lugar en la Red ──────────────────────────────────────
              Opcional, y se dice. Va aquí porque es el momento en que alguien
              está rellenando su ficha: pedirlo después, desde la portada,
              interrumpía a quien solo venía a leer.

              Guarda por su cuenta, con su propio botón. No bloquea el
              "Continuar": quien no quiera marcarse en el mapa entra igual. */}
          <div
            style={{
              borderTop: "1px solid #1a1a24",
              paddingTop: "1.4rem",
              marginTop: "0.3rem",
            }}
          >
            <Label>Tu lugar en la Red (opcional)</Label>
            <p
              style={{
                margin: "0 0 1rem",
                fontFamily: "var(--font-geist-sans)",
                fontSize: "0.72rem",
                lineHeight: 1.65,
                color: "#a0a0b0",
              }}
            >
              Si eliges tu país y tu ciudad podrás encontrar a miembros de 144 mil cerca de ti.
              Tú decides si tu ciudad se muestra o no: puedes formar parte de la Red sin que
              nadie sepa dónde estás, y puedes cambiarlo cuando quieras desde tu perfil.
            </p>
            <UbicacionRed
              compact
              integrado
              onCambio={setUbicacion}
              inputCls="block w-full border border-[#1a1a24] bg-[#12121a]/60 px-4 py-3 text-base text-[#F3F6FA] placeholder:text-[#6a6a7a] transition-colors focus:border-red-900 focus:bg-[#000000] focus:outline-none focus:ring-1 focus:ring-red-900/40 disabled:opacity-50 [font-family:var(--font-geist-sans)]"
              labelCls="block text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a0a0b0] [font-family:var(--font-geist-sans)] mb-2"
              btnCls="inline-flex items-center justify-center gap-2 border border-[#F3F6FA] bg-[#F3F6FA] px-6 py-3 text-[#000000] text-xs font-semibold uppercase tracking-[0.3em] transition-colors hover:border-red-900 hover:bg-red-900 hover:text-[#F3F6FA] disabled:cursor-wait disabled:opacity-60 [font-family:var(--font-geist-sans)]"
            />
          </div>

          {state.type === "error" && (
            <div
              role="alert"
              style={{
                border: "1px solid rgba(239,68,68,0.4)",
                background: "rgba(239,68,68,0.1)",
                padding: "0.75rem 1rem",
                fontSize: "0.85rem",
                color: "#fca5a5",
                fontFamily: "var(--font-geist-sans)",
              }}
            >
              {state.msg}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            style={{
              width: "100%",
              padding: "0.95rem",
              background: "var(--accent-red, #6D4A9B)",
              color: "#fff",
              border: "1px solid var(--accent-red-deep, #450a0a)",
              fontFamily: "var(--font-cinzel, serif)",
              fontWeight: 600,
              fontSize: "0.85rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: isPending ? "wait" : "pointer",
              opacity: isPending ? 0.7 : 1,
              marginTop: "0.5rem",
            }}
          >
            {isPending ? "Guardando..." : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontFamily: "var(--font-geist-sans)",
        fontSize: "0.7rem",
        fontWeight: 600,
        color: "#a0a0b0",
        textTransform: "uppercase",
        letterSpacing: "0.2em",
        marginBottom: "0.45rem",
      }}
    >
      {children}
    </label>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  maxLength,
  prefix,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  prefix?: string
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "#12121a",
          border: "1px solid #2a2a35",
        }}
      >
        {prefix && (
          <span
            style={{
              padding: "0 0.5rem 0 0.75rem",
              color: "#6a6a7a",
              fontFamily: "var(--font-geist-sans)",
              fontSize: "0.875rem",
            }}
          >
            {prefix}
          </span>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          maxLength={maxLength}
          placeholder={placeholder}
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            color: "#F3F6FA",
            padding: "0.75rem",
            paddingLeft: prefix ? 0 : "0.75rem",
            fontSize: "0.875rem",
            fontFamily: "var(--font-geist-sans)",
            outline: "none",
          }}
        />
      </div>
    </div>
  )
}
