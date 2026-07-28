"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ACHIEVEMENTS, getAchievementById, getTierColor, type Achievement } from "@/lib/achievements"
import { useAuth } from "../_lib/auth-context"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { LegalLinks } from "@/components/legal/legal-links"

const STORAGE_KEY_ACHIEVEMENTS = "app_unlocked_achievements"

// Le localStorage do prototipo (mesmo subdomínio miembros.SEU_DOMINIO.com)
// pra saber quais insignias o user já desbloqueou.
function getUnlockedAchievementIds(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACHIEVEMENTS)
    if (!raw) return new Set()
    const obj = JSON.parse(raw) as Record<string, unknown>
    return new Set(Object.keys(obj))
  } catch {
    return new Set()
  }
}

/**
 * Converte File de imagem (qualquer formato suportado pelo browser) pra
 * WebP via Canvas API. Tamanho final reduzido pra max 512x512 (avatar)
 * e qualidade 0.85.
 */
async function convertToWebp(file: File): Promise<File> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error("Failed to load image"))
    i.src = dataUrl
  })

  // Crop quadrado center + resize pra max 512px lado
  const size = Math.min(img.width, img.height)
  const cropX = (img.width - size) / 2
  const cropY = (img.height - size) / 2
  const targetSize = Math.min(512, size)

  const canvas = document.createElement("canvas")
  canvas.width = targetSize
  canvas.height = targetSize
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas not supported")
  ctx.drawImage(img, cropX, cropY, size, size, 0, 0, targetSize, targetSize)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/webp", 0.85)
  })
  if (!blob) throw new Error("WebP conversion failed")
  return new File([blob], "avatar.webp", { type: "image/webp" })
}

type State = { type: "idle" } | { type: "saving" } | { type: "success"; msg: string } | { type: "error"; msg: string }

export function ProfileForm({
  initialName,
  initialAvatar,
  initialFeaturedBadgeId,
  initialFeaturedStarId,
  initialFeaturedFlameId,
  initialUsername,
  initialBio,
  initialNiche,
  initialInstagram,
  initialInstagramUrl,
  isAdmin,
}: {
  initialName: string
  initialAvatar: string | null
  initialFeaturedBadgeId: string | null
  initialFeaturedStarId: string | null
  initialFeaturedFlameId: string | null
  initialUsername: string
  initialBio: string
  initialNiche: string
  initialInstagram: string
  initialInstagramUrl: string
  isAdmin: boolean
}) {
  const [name, setName] = useState(initialName)
  const [avatar, setAvatar] = useState(initialAvatar)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialAvatar)

  // Campos novos: username, bio, nicho, instagram (todos em user_metadata)
  // instagram = handle visual (@tucuenta) — só pra display
  // instagramUrl = link real pra abrir (instagram.com/X ou qualquer URL)
  const [username, setUsername] = useState(initialUsername)
  const [bio, setBio] = useState(initialBio)
  const [niche, setNiche] = useState(initialNiche)
  const [instagram, setInstagram] = useState(initialInstagram)
  const [instagramUrl, setInstagramUrl] = useState(initialInstagramUrl)
  const [aboutState, setAboutState] = useState<State>({ type: "idle" })
  const [isAboutPending, startAbout] = useTransition()

  const [currentPwd, setCurrentPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")

  const [featuredBadgeId, setFeaturedBadgeId] = useState<string | null>(initialFeaturedBadgeId)
  const [featuredStarId, setFeaturedStarId] = useState<string | null>(initialFeaturedStarId)
  const [featuredFlameId, setFeaturedFlameId] = useState<string | null>(initialFeaturedFlameId)
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())
  const { refresh: refreshAuth } = useAuth()

  const [nameState, setNameState] = useState<State>({ type: "idle" })
  const [avatarState, setAvatarState] = useState<State>({ type: "idle" })
  const [pwdState, setPwdState] = useState<State>({ type: "idle" })
  const [badgeState, setBadgeState] = useState<State>({ type: "idle" })
  const [starState, setStarState] = useState<State>({ type: "idle" })
  const [flameState, setFlameState] = useState<State>({ type: "idle" })

  const [isNamePending, startName] = useTransition()
  const [isAvatarPending, startAvatar] = useTransition()
  const [isPwdPending, startPwd] = useTransition()
  const [isBadgePending, startBadge] = useTransition()
  const [isStarPending, startStar] = useTransition()
  const [isFlamePending, startFlame] = useTransition()
  const [isSignOutPending, startSignOut] = useTransition()
  const [isPortalPending, startPortal] = useTransition()
  const [portalError, setPortalError] = useState<string | null>(null)

  const router = useRouter()

  // Abre el Stripe Billing Portal: pide una sesión única al servidor y redirige.
  function openBillingPortal() {
    setPortalError(null)
    startPortal(async () => {
      try {
        const res = await fetch("/api/stripe/customer-portal", { method: "POST" })
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string }
          if (data.error === "no_billing_account") {
            setPortalError("No encontramos una suscripción asociada a tu cuenta.")
          } else {
            setPortalError("No pudimos abrir el portal ahora. Intenta de nuevo en unos minutos.")
          }
          return
        }
        const data = (await res.json()) as { url?: string }
        if (data.url) {
          window.location.href = data.url
        } else {
          setPortalError("No pudimos abrir el portal. Intenta de nuevo.")
        }
      } catch {
        setPortalError("No pudimos abrir el portal. Revisa tu conexión e intenta de nuevo.")
      }
    })
  }

  // Cierra la sesión de Supabase y vuelve al login de la plataforma.
  function handleSignOut() {
    startSignOut(async () => {
      try {
        await getSupabaseBrowser().auth.signOut()
      } catch {
        /* ignora — igual redirigimos al login */
      }
      router.push("/miembros/login")
      router.refresh()
    })
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setUnlockedIds(getUnlockedAchievementIds())
  }, [])

  function selectStar(starId: string | null) {
    if (isStarPending) return
    const previous = featuredStarId
    setFeaturedStarId(starId)
    startStar(async () => {
      try {
        setStarState({ type: "saving" })
        const res = await fetch("/api/profile/featured-star", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id: starId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
        setStarState({ type: "success", msg: starId ? "Estrella destacada" : "Sin estrella" })
        refreshAuth().catch(() => {})
      } catch (e) {
        setFeaturedStarId(previous)
        setStarState({ type: "error", msg: e instanceof Error ? e.message : "Error" })
      }
    })
  }

  function selectFlame(flameId: string | null) {
    if (isFlamePending) return
    const previous = featuredFlameId
    setFeaturedFlameId(flameId)
    startFlame(async () => {
      try {
        setFlameState({ type: "saving" })
        const res = await fetch("/api/profile/featured-flame", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id: flameId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
        setFlameState({ type: "success", msg: flameId ? "Llama destacada" : "Sin llama" })
        refreshAuth().catch(() => {})
      } catch (e) {
        setFeaturedFlameId(previous)
        setFlameState({ type: "error", msg: e instanceof Error ? e.message : "Error" })
      }
    })
  }

  function selectBadge(badgeId: string | null) {
    if (isBadgePending) return
    const previous = featuredBadgeId
    setFeaturedBadgeId(badgeId)
    startBadge(async () => {
      try {
        setBadgeState({ type: "saving" })
        const res = await fetch("/api/profile/featured-badge", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ badge_id: badgeId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
        setBadgeState({ type: "success", msg: badgeId ? "Insignia destacada" : "Sin insignia" })
        // Atualiza user_metadata em todos consumidores do useAuth (Navbar, posts) sem F5
        refreshAuth().catch(() => {})
      } catch (e) {
        setFeaturedBadgeId(previous)
        setBadgeState({ type: "error", msg: e instanceof Error ? e.message : "Error" })
      }
    })
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!/^image\//.test(file.type)) {
      setAvatarState({ type: "error", msg: "Selecciona una imagen válida" })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setAvatarState({ type: "error", msg: "Imagen muy grande (max 10MB)" })
      return
    }
    setAvatarState({ type: "idle" })
    // Preview imediato
    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  function uploadAvatar() {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setAvatarState({ type: "error", msg: "Selecciona una imagen primero" })
      return
    }
    startAvatar(async () => {
      try {
        setAvatarState({ type: "saving" })
        const webp = await convertToWebp(file)
        const fd = new FormData()
        fd.append("file", webp)
        const res = await fetch("/api/profile/avatar", { method: "POST", body: fd, credentials: "include" })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
        setAvatar(data.avatar_url)
        setPreviewUrl(data.avatar_url)
        setAvatarState({ type: "success", msg: "Foto actualizada" })
      } catch (e) {
        setAvatarState({ type: "error", msg: e instanceof Error ? e.message : "Error" })
      }
    })
  }

  function saveName(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setNameState({ type: "error", msg: "Nombre muy corto" })
      return
    }
    startName(async () => {
      try {
        setNameState({ type: "saving" })
        const res = await fetch("/api/profile/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ full_name: trimmed }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
        setNameState({ type: "success", msg: "Nombre actualizado" })
      } catch (e) {
        setNameState({ type: "error", msg: e instanceof Error ? e.message : "Error" })
      }
    })
  }

  function saveAbout(e: React.FormEvent) {
    e.preventDefault()
    setAboutState({ type: "idle" })
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, "")
    const cleanInstagram = instagram.trim().replace(/^@/, "")
    const cleanInstagramUrl = instagramUrl.trim()

    // Validações cliente-side básicas (server faz validação completa)
    if (cleanUsername && (cleanUsername.length < 3 || cleanUsername.length > 30 || !/^[a-z0-9_.]+$/.test(cleanUsername))) {
      setAboutState({ type: "error", msg: "@username inválido (3-30, letras minúsculas, números, _ y .)" })
      return
    }
    if (cleanInstagram && (cleanInstagram.length > 30 || !/^[a-zA-Z0-9_.]+$/.test(cleanInstagram))) {
      setAboutState({ type: "error", msg: "@ inválido" })
      return
    }
    if (cleanInstagramUrl.length > 500) {
      setAboutState({ type: "error", msg: "Link máx 500 caracteres" })
      return
    }
    if (bio.length > 500) {
      setAboutState({ type: "error", msg: "Bio máx 500 caracteres" })
      return
    }

    startAbout(async () => {
      try {
        setAboutState({ type: "saving" })
        const res = await fetch("/api/profile/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            username: cleanUsername,
            bio: bio.trim(),
            niche: niche.trim(),
            instagram: cleanInstagram,
            instagram_url: cleanInstagramUrl,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
        // Sincroniza estado local com valores limpos (server pode ter normalizado URL)
        setUsername(cleanUsername)
        setInstagram(cleanInstagram)
        if (data.updated && typeof data.updated.instagram_url === "string") {
          setInstagramUrl(data.updated.instagram_url)
        }
        setAboutState({ type: "success", msg: "Perfil actualizado" })
      } catch (e) {
        setAboutState({ type: "error", msg: e instanceof Error ? e.message : "Error" })
      }
    })
  }

  function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPwd || !newPwd) {
      setPwdState({ type: "error", msg: "Completa ambos campos" })
      return
    }
    if (newPwd.length < 8) {
      setPwdState({ type: "error", msg: "Nueva contraseña debe tener mín. 8 caracteres" })
      return
    }
    if (newPwd !== confirmPwd) {
      setPwdState({ type: "error", msg: "Las contraseñas no coinciden" })
      return
    }
    startPwd(async () => {
      try {
        setPwdState({ type: "saving" })
        const res = await fetch("/api/profile/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
        setCurrentPwd(""); setNewPwd(""); setConfirmPwd("")
        setPwdState({ type: "success", msg: "Contraseña actualizada" })
      } catch (e) {
        setPwdState({ type: "error", msg: e instanceof Error ? e.message : "Error" })
      }
    })
  }

  const inputCls = "block w-full border border-[#1a1a24] bg-[#12121a]/60 px-4 py-3 text-base text-[#F3F6FA] placeholder:text-[#6a6a7a] transition-colors focus:border-red-900 focus:bg-[#000000] focus:outline-none focus:ring-1 focus:ring-red-900/40 disabled:opacity-50 [font-family:var(--font-geist-sans)]"
  const labelCls = "block text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a0a0b0] [font-family:var(--font-geist-sans)] mb-2"
  const sectionCls = "border border-[#1a1a24] bg-[#12121a]/40 p-6 sm:p-8"
  const sectionTitleCls = "text-sm font-semibold uppercase tracking-[0.25em] text-[#6D4A9B] [font-family:var(--font-geist-sans)] mb-6"
  const btnCls = "inline-flex items-center justify-center gap-2 border border-[#F3F6FA] bg-[#F3F6FA] px-6 py-3 text-[#000000] text-xs font-semibold uppercase tracking-[0.3em] transition-colors hover:border-red-900 hover:bg-red-900 hover:text-[#F3F6FA] disabled:cursor-wait disabled:opacity-60 disabled:hover:bg-[#F3F6FA] disabled:hover:text-[#000000] [font-family:var(--font-geist-sans)]"

  function StatusMsg({ s }: { s: State }) {
    if (s.type === "idle" || s.type === "saving") return null
    const isSuccess = s.type === "success"
    return (
      <p className={`mt-3 text-xs [font-family:var(--font-geist-sans)] ${isSuccess ? "text-[#009d68]" : "text-red-500"}`}>
        {s.msg}
      </p>
    )
  }

  return (
    <div className="space-y-8">
      {/* AVATAR */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>Foto de perfil</h2>
        <div className="flex items-start gap-6">
          <div className="relative h-24 w-24 flex-shrink-0">
            <div
              className="h-24 w-24 overflow-hidden rounded-full bg-[#1a1a24]"
              style={{
                // Border branca exclusiva pro admin (figura simbólica). Outros
                // users nao tem border colorida — feature removida.
                border: isAdmin
                  ? "3px solid #ffffff"
                  : "1px solid #2a2a35",
                boxShadow: isAdmin
                  ? "0 0 14px #ffffff66"
                  : undefined,
              }}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#6D4A9B] [font-family:var(--font-cinzel)]">
                  {(initialName || "?").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <AvatarBadgeOverlay badgeId={featuredBadgeId} />
            <AvatarStarOverlay starId={featuredStarId} />
            <AvatarFlameOverlay flameId={featuredFlameId} />
          </div>
          <div className="flex-1 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFilePick}
              disabled={isAvatarPending}
              className="block w-full text-sm text-[#a0a0b0] file:mr-4 file:border-0 file:bg-[#1a1a24] file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.2em] file:text-[#F3F6FA] hover:file:bg-[#2a2a35] [font-family:var(--font-geist-sans)]"
            />
            <p className="text-xs text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
              Se convertirá automáticamente a WebP (cuadrada, max 512×512).
            </p>
            <button type="button" onClick={uploadAvatar} disabled={isAvatarPending} className={btnCls}>
              {isAvatarPending ? "Subiendo..." : "Guardar foto"}
            </button>
            <StatusMsg s={avatarState} />
          </div>
        </div>
      </section>

      {/* INSIGNIA DESTACADA — só categorias não-community/non-time
       *  (community vai pra Estrella, time vai pra Llama). */}
      <BadgeSection
        title="Insignia destacada"
        subtitle="Aparece en la esquina inferior derecha de tu foto."
        achievements={
          isAdmin
            ? ACHIEVEMENTS.filter((a) => a.category !== "community" && a.category !== "time")
            : ACHIEVEMENTS.filter(
                (a) => a.id !== "admin_seal" && a.category !== "community" && a.category !== "time",
              )
        }
        unlockedIds={isAdmin ? new Set([...unlockedIds, "admin_seal"]) : unlockedIds}
        selectedId={featuredBadgeId}
        onSelect={selectBadge}
        disabled={isBadgePending}
        state={badgeState}
      />

      {/* ESTRELLA DESTACADA — só category=community (rank de posts).
       *  Aparece na esquina superior direita da foto. */}
      <BadgeSection
        title="Estrella destacada"
        subtitle="Aparece en la esquina superior derecha de tu foto."
        achievements={ACHIEVEMENTS.filter((a) => a.category === "community")}
        unlockedIds={unlockedIds}
        selectedId={featuredStarId}
        onSelect={selectStar}
        disabled={isStarPending}
        state={starState}
      />

      {/* LLAMA DESTACADA — só category=time (acceso unique days).
       *  Aparece na esquina superior esquerda da foto. */}
      <BadgeSection
        title="Llama destacada"
        subtitle="Aparece en la esquina superior izquierda de tu foto."
        achievements={ACHIEVEMENTS.filter((a) => a.category === "time")}
        unlockedIds={unlockedIds}
        selectedId={featuredFlameId}
        onSelect={selectFlame}
        disabled={isFlamePending}
        state={flameState}
      />

      {/* NOME */}
      <form onSubmit={saveName} className={sectionCls}>
        <h2 className={sectionTitleCls}>Nombre</h2>
        <label htmlFor="profile-name" className={labelCls}>Nombre completo</label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isNamePending}
          maxLength={60}
          className={inputCls}
          placeholder="Tu nombre"
        />
        <div className="mt-5">
          <button type="submit" disabled={isNamePending} className={btnCls}>
            {isNamePending ? "Guardando..." : "Guardar nombre"}
          </button>
          <StatusMsg s={nameState} />
        </div>
      </form>

      {/* SOBRE VOS — username, bio, nicho, instagram */}
      <form onSubmit={saveAbout} className={sectionCls}>
        <h2 className={sectionTitleCls}>Sobre vos</h2>
        <p className="mb-6 text-xs text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
          Estos datos aparecerán en tu perfil público y junto a tus publicaciones en la comunidad.
        </p>

        <div className="space-y-5">
          <div>
            <label htmlFor="profile-username" className={labelCls}>@Username (handle único)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6a7a] [font-family:var(--font-geist-sans)]">@</span>
              <input
                id="profile-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                disabled={isAboutPending}
                maxLength={30}
                className={`${inputCls} pl-8`}
                placeholder="tunombre"
                autoCapitalize="off"
                autoComplete="off"
              />
            </div>
            <p className="mt-1.5 text-[10px] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
              3-30 caracteres. Solo letras minúsculas, números, _ y .
            </p>
          </div>

          <div>
            <label htmlFor="profile-bio" className={labelCls}>Bio</label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={isAboutPending}
              maxLength={500}
              rows={3}
              className={inputCls}
              placeholder="Contá un poco sobre vos, qué hacés, qué te apasiona..."
            />
            <p className="mt-1.5 text-right text-[10px] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
              {bio.length}/500
            </p>
          </div>

          <div>
            <label htmlFor="profile-instagram-url" className={labelCls}>Link de Instagram</label>
            <input
              id="profile-instagram-url"
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              disabled={isAboutPending}
              maxLength={500}
              className={inputCls}
              placeholder="https://instagram.com/tucuenta"
              autoCapitalize="off"
              autoComplete="off"
            />
            <p className="mt-1.5 text-[10px] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
              URL completa. Es el link que se abrirá al hacer click.
            </p>
          </div>

          <div>
            <label htmlFor="profile-instagram" className={labelCls}>@ visual (opcional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6a7a] [font-family:var(--font-geist-sans)]">@</span>
              <input
                id="profile-instagram"
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value.replace(/[^a-zA-Z0-9_.]/g, ""))}
                disabled={isAboutPending}
                maxLength={30}
                className={`${inputCls} pl-8`}
                placeholder="tucuenta"
                autoCapitalize="off"
                autoComplete="off"
              />
            </div>
            <p className="mt-1.5 text-[10px] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
              Texto que aparecerá visible (ej: @tucuenta). Si lo dejás vacío y hay link, mostramos el link.
            </p>
            {(instagram || instagramUrl) && (
              <p className="mt-2 text-[10px] text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
                Preview:{" "}
                <a
                  href={instagramUrl || `https://instagram.com/${instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6D4A9B] underline hover:text-[#F3F6FA]"
                >
                  {instagram ? `@${instagram.replace(/^@/, "")}` : instagramUrl}
                </a>
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button type="submit" disabled={isAboutPending} className={btnCls}>
            {isAboutPending ? "Guardando..." : "Guardar perfil"}
          </button>
          <StatusMsg s={aboutState} />
        </div>
      </form>

      {/* SENHA */}
      <form onSubmit={changePassword} className={sectionCls}>
        <h2 className={sectionTitleCls}>Cambiar contraseña</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="current-pwd" className={labelCls}>Contraseña actual</label>
            <input
              id="current-pwd"
              type="password"
              autoComplete="current-password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              disabled={isPwdPending}
              className={inputCls}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="new-pwd" className={labelCls}>Nueva contraseña</label>
            <input
              id="new-pwd"
              type="password"
              autoComplete="new-password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              disabled={isPwdPending}
              className={inputCls}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label htmlFor="confirm-pwd" className={labelCls}>Confirmar nueva contraseña</label>
            <input
              id="confirm-pwd"
              type="password"
              autoComplete="new-password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              disabled={isPwdPending}
              className={inputCls}
              placeholder="••••••••"
            />
          </div>
        </div>
        <div className="mt-6">
          <button type="submit" disabled={isPwdPending} className={btnCls}>
            {isPwdPending ? "Actualizando..." : "Cambiar contraseña"}
          </button>
          <StatusMsg s={pwdState} />
        </div>
      </form>

      {/* MI MEMBRESÍA — Stripe Billing Portal */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls}>Mi membresía</h2>
        <p className="mb-5 text-sm leading-relaxed text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
          Gestiona tu suscripción, tu método de pago y tus facturas en el portal seguro de Stripe.
        </p>
        <button
          type="button"
          onClick={openBillingPortal}
          disabled={isPortalPending}
          className={btnCls}
        >
          {isPortalPending ? "Abriendo..." : "Gestionar membresía"}
        </button>
        {portalError && (
          <div
            role="alert"
            className="mt-4 border border-red-900/40 bg-red-900/10 px-4 py-3 text-sm text-red-300 [font-family:var(--font-geist-sans)]"
          >
            {portalError}
          </div>
        )}
      </div>

      {/* SESIÓN — cerrar sesión */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls}>Sesión</h2>
        <p className="mb-5 text-sm leading-relaxed text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
          Cierra tu sesión en este dispositivo. Tendrás que iniciar sesión de nuevo para volver a
          entrar.
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSignOutPending}
          className="inline-flex w-full items-center justify-center gap-2 border border-[#6D4A9B] bg-transparent px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#a78bca] transition-colors hover:border-red-900 hover:bg-red-900 hover:text-[#F3F6FA] disabled:cursor-wait disabled:opacity-60 sm:w-auto [font-family:var(--font-geist-sans)]"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {isSignOutPending ? "Cerrando sesión..." : "Cerrar sesión"}
        </button>
      </div>

      {/* Voltar */}
      <div className="pt-4">
        <a href="/" className="text-xs font-medium uppercase tracking-[0.25em] text-[#a0a0b0] transition-colors hover:text-[#6D4A9B] [font-family:var(--font-geist-sans)]">
          ← Volver al área
        </a>
      </div>

      <div className="pt-2">
        <LegalLinks align="start" />
      </div>
    </div>
  )
}

// Pequeno overlay da insignia destacada sobre o avatar (canto inferior direito).
// Só renderiza se o user tem uma insignia selecionada e ela existe no catálogo.
//
// Caso especial: admin_seal e el_topo não têm fundo/border/shadow — só o glow
// animado (admBadgeGlow / topoBadgeGlow em tokens.css). Essas exclusivas brilham
// sozinhas.
function AvatarBadgeOverlay({ badgeId }: { badgeId: string | null }) {
  if (!badgeId) return null
  const ach = getAchievementById(badgeId)
  if (!ach) return null
  const isAdminSeal = badgeId === "admin_seal"
  const isTopoSeal = badgeId === "el_topo"
  const isRevisaoSeal = badgeId === "product_revisao"
  const isExclusive = isAdminSeal || isTopoSeal || isRevisaoSeal
  return (
    <div
      className={
        isExclusive
          ? "absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center [&_svg]:h-full [&_svg]:w-full"
          : "absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border border-[#1a1a24] bg-[#000000] shadow-[0_0_12px_rgba(0,0,0,0.6)] [&_svg]:h-full [&_svg]:w-full"
      }
      style={{
        color: getTierColor(ach.tier),
        animation: isAdminSeal
          ? "admBadgeGlow 2.4s ease-in-out infinite"
          : isTopoSeal
          ? "topoBadgeGlow 2.4s ease-in-out infinite"
          : isRevisaoSeal
          ? "revisaoBadgeGlow 2.4s ease-in-out infinite"
          : undefined,
      }}
      title={ach.name}
      dangerouslySetInnerHTML={{ __html: ach.svg }}
    />
  )
}

// Overlay da estrella destacada (community/post badge) — top-right.
// Sem fundo/borda. Tier topo (Leyenda) recebe topoBadgeGlow vermelho.
function AvatarStarOverlay({ starId }: { starId: string | null }) {
  if (!starId) return null
  const ach = getAchievementById(starId)
  if (!ach || ach.category !== "community") return null
  return (
    <div
      className="absolute -top-1 -right-1 flex h-9 w-9 items-center justify-center [&_svg]:h-full [&_svg]:w-full"
      style={{
        color: getTierColor(ach.tier),
        animation: ach.tier === "topo"
          ? "topoBadgeGlow 2.4s ease-in-out infinite"
          : undefined,
      }}
      title={ach.name}
      dangerouslySetInnerHTML={{ __html: ach.svg }}
    />
  )
}

// Overlay da llama destacada (time/access badge) — top-left.
// Sem fundo/borda. Tier topo (Eterno) recebe topoBadgeGlow vermelho.
function AvatarFlameOverlay({ flameId }: { flameId: string | null }) {
  if (!flameId) return null
  const ach = getAchievementById(flameId)
  if (!ach || ach.category !== "time") return null
  return (
    <div
      className="absolute -top-1 -left-1 flex h-9 w-9 items-center justify-center [&_svg]:h-full [&_svg]:w-full"
      style={{
        color: getTierColor(ach.tier),
        animation: ach.tier === "topo"
          ? "topoBadgeGlow 2.4s ease-in-out infinite"
          : undefined,
      }}
      title={ach.name}
      dangerouslySetInnerHTML={{ __html: ach.svg }}
    />
  )
}

// Seção de seleção de insignia destacada.
// Mostra TODAS as insignias do catálogo, mas só as desbloqueadas (unlockedIds)
// são clicáveis. Outras aparecem em silhueta com opacity baixa e tooltip.
function BadgeSection({
  title = "Insignia destacada",
  subtitle = "Aparecerá al lado de tu foto en comentarios y la comunidad.",
  achievements,
  unlockedIds,
  selectedId,
  onSelect,
  disabled,
  state,
}: {
  title?: string
  subtitle?: string
  achievements: Achievement[]
  unlockedIds: Set<string>
  selectedId: string | null
  onSelect: (id: string | null) => void
  disabled: boolean
  state: State
}) {
  // Conta apenas as desbloqueadas DENTRO desta categoria (achievements passados)
  const unlockedCount = achievements.filter((a) => unlockedIds.has(a.id)).length

  return (
    <section className="border border-[#1a1a24] bg-[#12121a]/40 p-6 sm:p-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[#6D4A9B] [font-family:var(--font-geist-sans)]">
            {title}
          </h2>
          <p className="mt-2 text-xs text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
            {subtitle}
          </p>
        </div>
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
          {unlockedCount} desbloqueadas
        </p>
      </div>

      {/* Opção "sin insignia" */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        <button
          type="button"
          onClick={() => onSelect(null)}
          disabled={disabled}
          className={`group flex flex-col items-center justify-start gap-2 border bg-[#000000]/50 p-3 text-center transition-colors ${
            selectedId === null
              ? "border-[#6D4A9B] bg-[#6D4A9B]/10"
              : "border-[#1a1a24] hover:border-[#2a2a35]"
          } disabled:cursor-wait disabled:opacity-50`}
          title="Sin insignia"
        >
          <div className="flex h-14 w-14 items-center justify-center text-3xl text-[#6a6a7a]">∅</div>
          <div className="flex min-h-[3.5rem] flex-col items-center justify-start gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
              Ninguna
            </span>
            <span className="text-[10px] leading-snug text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
              Sin insignia destacada
            </span>
          </div>
        </button>

        {achievements.map((ach) => {
          const unlocked = unlockedIds.has(ach.id)
          const selected = selectedId === ach.id
          const color = unlocked ? getTierColor(ach.tier) : "#3a3a45"
          return (
            <button
              key={ach.id}
              type="button"
              onClick={() => unlocked && onSelect(ach.id)}
              disabled={disabled || !unlocked}
              className={`group flex flex-col items-center justify-start gap-2 border bg-[#000000]/50 p-3 text-center transition-colors ${
                selected
                  ? "border-[#6D4A9B] bg-[#6D4A9B]/10"
                  : unlocked
                    ? "border-[#1a1a24] hover:border-[#2a2a35]"
                    : "border-[#1a1a24]/50"
              } ${unlocked ? "cursor-pointer" : "cursor-not-allowed"} disabled:cursor-not-allowed`}
              title={unlocked ? `${ach.name} — ${ach.desc}` : `${ach.name} — bloqueada`}
            >
              <div
                className="h-14 w-14 [&_svg]:h-full [&_svg]:w-full"
                style={{ color, opacity: unlocked ? 1 : 0.25 }}
                dangerouslySetInnerHTML={{ __html: ach.svg }}
              />
              <div className="flex min-h-[3.5rem] flex-col items-center justify-start gap-1">
                <span
                  className={`text-[11px] font-semibold uppercase tracking-[0.18em] [font-family:var(--font-geist-sans)] ${
                    unlocked ? "text-[#F3F6FA]" : "text-[#3a3a45]"
                  }`}
                >
                  {ach.name}
                </span>
                <span
                  className={`text-[10px] leading-snug [font-family:var(--font-geist-sans)] ${
                    unlocked ? "text-[#a0a0b0]" : "text-[#3a3a45]"
                  }`}
                >
                  {ach.desc}
                </span>
                <span
                  className="mt-1 text-[9px] font-medium uppercase tracking-[0.25em] [font-family:var(--font-geist-sans)]"
                  style={{ color: unlocked ? color : "#3a3a45" }}
                >
                  {ach.tier}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {state.type === "saving" && (
        <p className="mt-3 text-xs text-[#6a6a7a] [font-family:var(--font-geist-sans)]">Guardando...</p>
      )}
      {state.type === "success" && (
        <p className="mt-3 text-xs text-[#009d68] [font-family:var(--font-geist-sans)]">{state.msg}</p>
      )}
      {state.type === "error" && (
        <p className="mt-3 text-xs text-red-500 [font-family:var(--font-geist-sans)]">{state.msg}</p>
      )}
    </section>
  )
}
