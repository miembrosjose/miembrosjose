"use client"

// Shell client-side da área de membros — comportamento de aplicativo.
// 1 ROTA SÓ (/miembros). Troca de tela via state, sem reload.

import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { Navbar } from "./Navbar"
import { Hero } from "./Hero"
import { ForumFeed } from "./ForumFeed"
import { Leaderboard } from "./Leaderboard"
import { SeasonsCarousel } from "./SeasonsCarousel"
import { TiendaCarousel } from "./TiendaCarousel"
import { getIntegrationPortal } from "../_lib/portals-data"
import { setForumTarget } from "../_lib/forum-nav"
import { OPEN_JOURNAL_EVENT } from "../_lib/journal-registry"
import { unlockSeal } from "../_lib/seals"
import { GrandJournal } from "./GrandJournal"
import { useSeasons } from "../_lib/use-seasons"
import { useSeasonAccess } from "../_lib/use-season-access"
import { OwnedProducts, LockedProducts, useOwnedProducts, hasLockedProducts } from "./Products"
import { ALL_BONUSES, type OwnedProduct } from "../_lib/products"
import { checkWelcome, syncUnlockedAchievementsFromServer } from "../_lib/achievements-unlock"
import { useView } from "../_lib/view-context"
import { useAuth } from "../_lib/auth-context"
import { isProfileComplete } from "@/lib/profile-completeness"

// Code-splitting: cada modal/overlay/view condicional vira chunk separado.
// O bundle inicial só carrega o que aparece above-the-fold na home (Hero,
// SeasonsCarousel, Products, etc). Modais só baixam quando o user abre,
// views condicionais (perfil/admin/producto/user) só baixam quando navega.
const Intro = dynamic(() => import("./Intro").then((m) => m.Intro), { ssr: false })
const SeriesInfoModal = dynamic(
  () => import("./SeriesInfoModal").then((m) => m.SeriesInfoModal),
  { ssr: false },
)
const EpisodesDrawer = dynamic(
  () => import("./EpisodesDrawer").then((m) => m.EpisodesDrawer),
  { ssr: false },
)
const Season5Portal = dynamic(
  () => import("./Season5Portal").then((m) => m.Season5Portal),
  { ssr: false },
)
const PortalIngreso = dynamic(
  () => import("./PortalIngreso").then((m) => m.PortalIngreso),
  { ssr: false },
)
const UmbralPortal = dynamic(
  () => import("./UmbralPortal").then((m) => m.UmbralPortal),
  { ssr: false },
)
const IntegrationPortal = dynamic(
  () => import("./IntegrationPortal").then((m) => m.IntegrationPortal),
  { ssr: false },
)
const ProductPurchaseModal = dynamic(
  () => import("./ProductModals").then((m) => m.ProductPurchaseModal),
  { ssr: false },
)
const AdminFeed = dynamic(() => import("./AdminFeed").then((m) => m.AdminFeed), { ssr: false })
const ViewPerfil = dynamic(() => import("./ViewPerfil").then((m) => m.ViewPerfil), { ssr: false })
const ViewAdmin = dynamic(() => import("./ViewAdmin").then((m) => m.ViewAdmin), { ssr: false })
const ViewProducto = dynamic(
  () => import("./ViewProducto").then((m) => m.ViewProducto),
  { ssr: false },
)
const ViewUserProfile = dynamic(
  () => import("./ViewUserProfile").then((m) => m.ViewUserProfile),
  { ssr: false },
)
const LevelUpOverlay = dynamic(
  () => import("./LevelUpOverlay").then((m) => m.LevelUpOverlay),
  { ssr: false },
)
const TopoOverlay = dynamic(
  () => import("./TopoOverlay").then((m) => m.TopoOverlay),
  { ssr: false },
)
const EstudioOverlay = dynamic(
  () => import("./EstudioOverlay").then((m) => m.EstudioOverlay),
  { ssr: false },
)
const EternoOverlay = dynamic(
  () => import("./EternoOverlay").then((m) => m.EternoOverlay),
  { ssr: false },
)
const LeyendaOverlay = dynamic(
  () => import("./LeyendaOverlay").then((m) => m.LeyendaOverlay),
  { ssr: false },
)
const AchievementToast = dynamic(
  () => import("./AchievementToast").then((m) => m.AchievementToast),
  { ssr: false },
)
const ProfileOnboardingModal = dynamic(
  () => import("./ProfileOnboardingModal").then((m) => m.ProfileOnboardingModal),
  { ssr: false },
)
const SeasonsManagerModal = dynamic(
  () => import("./SeasonsManagerModal").then((m) => m.SeasonsManagerModal),
  { ssr: false },
)
const ProductsManagerModal = dynamic(
  () => import("./ProductsManagerModal").then((m) => m.ProductsManagerModal),
  { ssr: false },
)
// OnlineMembers usa Supabase Realtime Presence — só faz sentido client-side e
// só aparece na home, então dynamic + ssr:false reduz o bundle inicial.
const OnlineMembers = dynamic(
  () => import("./OnlineMembers").then((m) => m.OnlineMembers),
  { ssr: false },
)
const ViewMessages = dynamic(
  () => import("./ViewMessages").then((m) => m.ViewMessages),
  { ssr: false },
)
const ViewMiembrosLista = dynamic(
  () => import("./ViewMiembrosLista").then((m) => m.ViewMiembrosLista),
  { ssr: false },
)
import {
  SEASONS,
  computeResumePoint,
  computeOverallProgressPct,
  syncProgressFromServer,
  type Season,
} from "../_lib/seasons"
import type { PremiumProduct } from "../_lib/products"
import styles from "./views.module.css"

export function SpaHomeShellInner() {
  // introDone = Hero/views podem aparecer. Setado SÍNCRONO no click Saltar
  // (pra Hero aparecer atrás enquanto Intro faz fade-out por cima).
  // introMounted = Intro continua no DOM (fade-out anima 1.5s antes de remover).
  const [introDone, setIntroDone] = useState(false)
  const [introMounted, setIntroMounted] = useState(true)
  const [seriesInfoOpen, setSeriesInfoOpen] = useState(false)
  const [openSeason, setOpenSeason] = useState<Season | null>(null)
  // Temporada 5 = Portal de Misión (overlay propio, no drawer de episodios).
  const [portalOpen, setPortalOpen] = useState(false)
  const [umbralOpen, setUmbralOpen] = useState(false)
  // Camino iniciático: Portal de Ingreso + Portales de Integración (1|2|3).
  const [ingresoOpen, setIngresoOpen] = useState(false)
  const [integrationId, setIntegrationId] = useState<1 | 2 | 3 | 4 | null>(null)
  // Mi Gran Bitácora (se abre desde el navbar / portales vía evento global).
  const [journalOpen, setJournalOpen] = useState(false)
  useEffect(() => {
    const open = () => setJournalOpen(true)
    window.addEventListener(OPEN_JOURNAL_EVENT, open)
    return () => window.removeEventListener(OPEN_JOURNAL_EVENT, open)
  }, [])
  // Episodio a abrir automáticamente al entrar a la temporada (solo "Continuar
  // viendo" → reanuda el último episodio). null = abrir la lista normal.
  const [continueTo, setContinueTo] = useState<number | null>(null)
  const [salespageProduct, setSalespageProduct] = useState<PremiumProduct | null>(null)
  const { view, setView } = useView()
  const { user } = useAuth()
  const { seasons: dbSeasons } = useSeasons()
  const { hasAccess } = useSeasonAccess()

  // Decide se abre a temporada ou redireciona pro checkout (quando admin
  // marcou is_locked=true e user não tem acesso). Procura a season real
  // pelo num no banco; se não achar, abre o fallback estático.
  function tryOpenSeasonByNum(num: number, fallback: Season) {
    const fromDb = dbSeasons.find((s) => s.num === num)
    const target = fromDb ?? fallback
    if (fromDb?.is_locked && !hasAccess(fromDb.id) && fromDb.checkout_url) {
      window.open(fromDb.checkout_url, "_blank", "noopener")
      return
    }
    setOpenSeason(target)
  }
  // Abre una temporada por número (usado por los portales del camino).
  function openSeasonByNum(num: number) {
    const fallback = SEASONS.find((s) => s.num === num) ?? SEASONS[0]
    tryOpenSeasonByNum(num, fallback)
  }
  // Entra directamente a los episodios de la temporada (las integraciones YA NO
  // interceptan la navegación: son accesos propios en el carrusel).
  function enterSeason(season: Season) {
    setContinueTo(null)
    if (season.num === 5) { openObjetivos(); return }
    setOpenSeason(season)
  }
  // Objetivos abre directamente su página (no la integración de la T4).
  function openObjetivos() {
    setPortalOpen(true)
  }
  // Lleva al foro (opcionalmente a un tema concreto por título).
  function goToForo(title?: string) {
    // Cierra cualquier overlay de portal abierto ANTES de ir al foro, si no
    // el portal (fixed, z alto) queda tapando la vista de comunidad.
    setIngresoOpen(false)
    setIntegrationId(null)
    setPortalOpen(false)
    setForumTarget(title ?? null)
    setView("comunidad")
  }
  const { owned } = useOwnedProducts()

  // Gate de onboarding obrigatorio — user precisa preencher foto, nome,
  // username, nicho e instagram (bio opcional) antes de acessar o estudio.
  // Vale pra novos users no 1o login E pra users existentes que ainda
  // nao completaram o perfil.
  const profileMeta = (user?.user_metadata as Record<string, unknown> | undefined) || null

  // Reset de avance solicitado por admin: preguntamos al servidor (marca fresca,
  // no el JWT que puede estar viejo). Si hay una marca nueva sin aplicar en este
  // dispositivo, limpiamos el avance local, re-borramos el avance propio en el
  // servidor (por si una sync lo repobló) y recargamos una vez → todo en cero.
  useEffect(() => {
    if (typeof window === "undefined") return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/profile/reset-status", { credentials: "include", cache: "no-store" })
        if (!res.ok) return
        const data = await res.json().catch(() => null) as { reset_at?: string } | null
        const resetAt = data?.reset_at
        if (!resetAt) return
        if (localStorage.getItem("los144k_reset_applied") === resetAt) return
        Object.keys(localStorage)
          .filter((k) => k.startsWith("app_episode_progress") || k.startsWith("los144k_"))
          .forEach((k) => { if (k !== "los144k_reset_applied") localStorage.removeItem(k) })
        await fetch("/api/profile/reset-progress", { method: "POST", credentials: "include" }).catch(() => {})
        localStorage.setItem("los144k_reset_applied", resetAt)
        if (!cancelled) window.location.reload()
      } catch { /* modo privado / sin red */ }
    })()
    return () => { cancelled = true }
  }, [])
  const profileOk = !user || isProfileComplete(profileMeta)

  // Onde o user vai retomar — recalcula sempre que volta pra view inicio (caso
  // tenha assistido um ep e voltado pra home, o Hero atualiza progresso).
  const [resume, setResume] = useState({ season: 1, episode: 1, hasStarted: false })
  const [overallPct, setOverallPct] = useState(0)
  useEffect(() => {
    if (view !== "inicio") return
    setResume(computeResumePoint(dbSeasons))
    setOverallPct(computeOverallProgressPct(dbSeasons))
  }, [view, openSeason, dbSeasons])

  // Ref do <video> do Hero — usado pra disparar play+unmute SÍNCRONO no click
  // do botão "Saltar Intro" (gesture válido permite áudio com autoplay).
  const heroVideoRef = useRef<HTMLVideoElement | null>(null)

  // Fundido de volume do áudio do banner. Rampa v.volume até `to` em `ms`.
  // Cancela qualquer fundido anterior em curso. `pauseAtEnd` pausa o vídeo ao
  // terminar (usado no fade-out ao entrar numa temporada).
  const audioFadeRafRef = useRef<number | null>(null)
  const fadeHeroAudio = useCallback(
    (to: number, ms: number, opts?: { pauseAtEnd?: boolean }) => {
      const v = heroVideoRef.current
      if (!v) return
      if (audioFadeRafRef.current != null) {
        cancelAnimationFrame(audioFadeRafRef.current)
        audioFadeRafRef.current = null
      }
      const clamp = (x: number) => Math.max(0, Math.min(1, x))
      const from = v.volume
      const start = performance.now()
      const step = (now: number) => {
        const t = ms <= 0 ? 1 : Math.min(1, (now - start) / ms)
        v.volume = clamp(from + (to - from) * t)
        if (t < 1) {
          audioFadeRafRef.current = requestAnimationFrame(step)
        } else {
          audioFadeRafRef.current = null
          if (opts?.pauseAtEnd) v.pause()
        }
      }
      audioFadeRafRef.current = requestAnimationFrame(step)
    },
    [],
  )

  // Áudio do banner principal (biblioteca cósmica). Regra: SÓ toca quando o
  // usuário está realmente na home (view inicio) e NENHUM overlay/janela está
  // aberto. Ao abrir qualquer coisa (temporada, bitácora, portais, umbral,
  // integração, ficha da série, checkout) ou sair de Inicio → fade-out e pausa.
  // Ao voltar à home sem nada aberto → fade-in.
  const anyOverlayOpen =
    !!openSeason || ingresoOpen || portalOpen || umbralOpen || journalOpen ||
    integrationId != null || seriesInfoOpen || !!salespageProduct
  useEffect(() => {
    const v = heroVideoRef.current
    if (!v) return
    const shouldPlay = introDone && view === "inicio" && !anyOverlayOpen
    if (!shouldPlay) {
      // fade-out rápido → pausa (deja de sonar al abrir cualquier ventana)
      fadeHeroAudio(0, 600, { pauseAtEnd: true })
    } else if (v.muted) {
      // Áudio ainda travado (sem gesture do usuário) → só toca em mudo.
      v.play().catch(() => {})
    } else {
      // Reanuda com fade-in 1s.
      v.volume = 0
      v.play()
        .then(() => fadeHeroAudio(1, 1000))
        .catch(() => {})
    }
  }, [anyOverlayOpen, introDone, view, fadeHeroAudio])

  // Boot: ping login (incrementa unique_login_days 1×/dia) + welcome achievement
  // (idempotente — só desbloqueia primeira vez) + hidrata window.NOTIF_PREFS
  // pro sounds.ts/broadcast/level-up respeitarem prefs sem precisar abrir modal.
  // Equivalente a pingLogin + unlockAchievement('welcome') do prototipo (11879+).
  useEffect(() => {
    fetch("/api/profile/login-ping", { method: "POST", credentials: "include" }).catch(() => {})
    checkWelcome()
    fetch("/api/profile/notification-prefs", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((prefs) => {
        if (prefs && typeof window !== "undefined") {
          ;(window as unknown as { NOTIF_PREFS?: unknown }).NOTIF_PREFS = prefs
        }
      })
      .catch(() => {})
    // Sincroniza progresso de episódios entre devices via Supabase.
    // localStorage continua como cache local (UI rápida) — banco é fonte de verdade.
    syncProgressFromServer()
      .then(() => {
        // Recalcula resume + progress pct após sync (caso server tinha eps que
        // localStorage local não tinha — comum em login num device novo).
        // El efecto keyed en dbSeasons lo recalcula de nuevo al cargar temporadas.
        setResume(computeResumePoint(dbSeasons))
        setOverallPct(computeOverallProgressPct(dbSeasons))
      })
      .catch(() => {})
    // Sincroniza lista de insignias desbloqueadas entre devices.
    // Mesma lógica do progresso de episódios — banco é fonte de verdade.
    syncUnlockedAchievementsFromServer().catch(() => {})

    // Pré-fetch dos chunks dynamic mais prováveis de abrir (modais que user
    // tipicamente clica nos primeiros segundos da home). Browser baixa quando
    // ocioso — modal abre instantâneo no 1º clique em vez de delay de 100-300ms.
    type IdleWin = Window & {
      requestIdleCallback?: (cb: () => void) => number
    }
    const w = window as IdleWin
    const prefetchModals = () => {
      // Não bloqueia, falha silenciosa
      import("./EpisodesDrawer").catch(() => {})
      import("./SeriesInfoModal").catch(() => {})
      import("./ProductModals").catch(() => {})
    }
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(prefetchModals)
    } else {
      // Safari iOS: setTimeout 2s simula idle suficiente pra não competir com
      // o first paint
      setTimeout(prefetchModals, 2000)
    }
  }, [])

  function handleIntroSkip() {
    // SÍNCRONO no click handler do Saltar Intro — gesture válido neste tick.
    const video = heroVideoRef.current
    if (video) {
      try {
        video.currentTime = 0
      } catch {
        // ignora
      }
      // APARIÇÃO progressiva do áudio em 1s: começa em volume 0 e sobe até 1.
      video.muted = false
      video.volume = 0
      video
        .play()
        .then(() => fadeHeroAudio(1, 1000))
        .catch(() => {
          // Fallback: se browser ainda bloqueia, tenta muted (sem áudio mas vídeo roda)
          video.muted = true
          video.play().catch(() => {})
        })
    }
    // Hero aparece imediatamente — Intro continua por cima animando fade-out
    setIntroDone(true)
  }

  function handleIntroComplete() {
    // Chamado pela Intro: ou após fade-out (1.5s), ou imediato se já viu nessa
    // sessão. Garante ambos os states (idempotente).
    setIntroDone(true)
    setIntroMounted(false)
  }

  // Gate de onboarding: bloqueia tudo se perfil incompleto. Quando user
  // preenche e salva, profileOk vira true (refreshAuth atualiza user_metadata)
  // e o shell normal renderiza.
  if (!profileOk && user) {
    const meta = (user.user_metadata || {}) as {
      full_name?: string
      avatar_url?: string
      username?: string
      bio?: string
      instagram?: string
    }
    return (
      <ProfileOnboardingModal
        initialName={meta.full_name || ""}
        initialAvatar={meta.avatar_url || null}
        initialUsername={meta.username || ""}
        initialBio={meta.bio || ""}
        initialInstagram={meta.instagram || ""}
      />
    )
  }

  return (
    <>
      <EpisodesDrawer
        season={openSeason}
        initialEpisodeNum={continueTo}
        onClose={() => { setOpenSeason(null); setContinueTo(null) }}
        onAdvanceSeason={(next) => { enterSeason(next) }}
        onOpenCheckout={(p) => setSalespageProduct(p)}
        ownedProductNames={owned.map((o) => o.name)}
      />
      {/* Portal de Misión "Objetivos de los 144.000" (tras la Temporada 4) */}
      <Season5Portal
        open={portalOpen}
        onClose={() => setPortalOpen(false)}
        onGoToForo={(title) => goToForo(title)}
        onOpenUmbral={() => setUmbralOpen(true)}
      />
      {/* Camino iniciático — Portal de Ingreso (antes de la Temporada 1) */}
      <PortalIngreso
        open={ingresoOpen}
        onClose={() => setIngresoOpen(false)}
        onEnterT1={() => { unlockSeal("ingreso"); setIngresoOpen(false); openSeasonByNum(1) }}
        onGoToForo={(title) => goToForo(title)}
      />
      {/* Camino iniciático — El Umbral del Contacto (tras la Temporada 4) */}
      <UmbralPortal
        open={umbralOpen}
        onClose={() => setUmbralOpen(false)}
        onGoToForo={(title) => goToForo(title)}
      />
      {/* Camino iniciático — Portales de Integración (antes de entrar a T2/T3/T4) */}
      <IntegrationPortal
        portal={integrationId ? getIntegrationPortal(integrationId) ?? null : null}
        onClose={() => setIntegrationId(null)}
        onAdvance={(num) => { setIntegrationId(null); if (num >= 5) setPortalOpen(true); else openSeasonByNum(num) }}
        onGoToForo={(title) => goToForo(title)}
      />
      {/* Mi Gran Bitácora — archivo personal (privado) */}
      <GrandJournal open={journalOpen} onClose={() => setJournalOpen(false)} />
      {introMounted && <Intro onSkip={handleIntroSkip} onComplete={handleIntroComplete} />}

      {/* Hero PERSISTENTE — sempre renderizado pra ref do vídeo existir antes
          do click "Saltar Intro" (que dispara play SÍNCRONO). Visível só em
          view=inicio + introDone. CSS display:none preserva state do vídeo
          entre views (currentTime, último frame). */}
      <Hero
        ref={heroVideoRef}
        progressLabel={`Temporada ${resume.season} · Episodio ${resume.episode}`}
        progressPct={overallPct}
        continueLabel={resume.hasStarted ? "Continuar Viendo" : "Asistir"}
        onContinue={() => {
          // Reanuda: abre la temporada del punto de avance Y el episodio exacto
          // donde quedó (primer episodio no completado). Si la temporada está
          // bloqueada y sin acceso, tryOpenSeasonByNum redirige al checkout.
          const fallback = SEASONS.find((s) => s.num === resume.season)
          setContinueTo(resume.episode)
          if (fallback) tryOpenSeasonByNum(resume.season, fallback)
        }}
        onMoreInfo={() => setSeriesInfoOpen(true)}
        visible={introDone && view === "inicio"}
      />

      {introDone && (
        <>
          <Navbar />

          <div className={`${styles.viewWrap} ${view !== "inicio" ? styles.viewTopOffset : ""}`}>
            {view === "inicio" && (
              <ViewInicio
                onOpenSeason={(s) => enterSeason(s)}
                onOpenSalespage={(p) => setSalespageProduct(p)}
                onOpenIngreso={() => setIngresoOpen(true)}
                onOpenObjetivos={openObjetivos}
                onOpenUmbral={() => setUmbralOpen(true)}
                onOpenIntegration={(id) => setIntegrationId(id as 1 | 2 | 3 | 4)}
                seasons={dbSeasons}
                hasSeasonAccess={hasAccess}
                owned={owned}
              />
            )}
            {view === "comunidad" && <ViewComunidad />}
            {view === "feed" && <ViewFeed />}
            {view === "perfil" && <ViewPerfil />}
            {view === "admin" && <ViewAdmin />}
            {view === "user" && <ViewUserProfile />}
            {view === "producto" && <ViewProducto />}
            {view === "messages" && <ViewMessages />}
            {view === "miembros_lista" && <ViewMiembrosLista />}
          </div>

          <SeriesInfoModal
            open={seriesInfoOpen}
            onClose={() => setSeriesInfoOpen(false)}
            onContinue={(seasonNum) => {
              // Abre EpisodesDrawer da temporada certa. O drawer detecta o
              // primeiro ep não-assistido e mostra "Continuar" no botão dele.
              // Se a temporada está bloqueada e o user não tem acesso, redireciona
              // pro checkout configurado pelo admin.
              const fallback = SEASONS.find((s) => s.num === seasonNum)
              if (fallback) tryOpenSeasonByNum(seasonNum, fallback)
            }}
          />

          {/* Modal de compra: salespage fullscreen pra produtos com salesPagePath
              (Creativos.AI / Andrómeda / Analytics) ou checkout compacto inline
              pra produtos com inlineCheckoutPath (Mini VSL / Revisión).
              Decisão automática baseada no product. Internamente o checkout
              foi substituído por 1-click + fallback Stripe Elements. */}
          <ProductPurchaseModal
            product={salespageProduct}
            onClose={() => setSalespageProduct(null)}
          />

          {/* Level-up animation overlay — escuta eventos "app:level-up" do XpBadge
              e anima sequencialmente (flash + card + partículas + som). */}
          <LevelUpOverlay />

          {/* EL TOPO conquistado — fullscreen igual level up mas tema vermelho.
              Escuta evento "app:topo-conquista" disparado pelo BroadcastProvider
              quando notif type=public_insignia_self do EL TOPO chega. */}
          <TopoOverlay />

          {/* EL ESTUDIO conquistado — espelho do TopoOverlay com paleta red+gold
              (premium cinematográfico). Escuta "app:estudio-conquista". */}
          <EstudioOverlay />

          {/* ETERNO conquistado (90 días únicos) — fullscreen com música antiga
              Shahiera. Escuta "app:eterno-conquista". */}
          <EternoOverlay />

          {/* LEYENDA conquistado (500+ posts) — fullscreen com música antiga
              Shahiera. Escuta "app:leyenda-conquista". */}
          <LeyendaOverlay />

          {/* Toast de insignia desbloqueada — escuta "app:achievement-unlock"
              despachado por unlockAchievement (em _lib/achievements-unlock.ts). */}
          <AchievementToast />
        </>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// VIEW: INICIO (Hero é renderizado fora — Mi Biblioteca + Otros + Tienda + Servicios)
// ─────────────────────────────────────────────────────────────────────────

function ViewInicio({
  onOpenSeason,
  onOpenSalespage,
  onOpenIngreso,
  onOpenObjetivos,
  onOpenUmbral,
  onOpenIntegration,
  seasons,
  hasSeasonAccess,
  owned,
}: {
  onOpenSeason: (s: Season) => void
  onOpenSalespage: (p: PremiumProduct) => void
  onOpenIngreso: () => void
  onOpenObjetivos: () => void
  onOpenUmbral: () => void
  onOpenIntegration: (id: number) => void
  seasons: Season[]
  hasSeasonAccess: (id?: string | null) => boolean
  owned: OwnedProduct[]
}) {
  const { isAdmin } = useAuth()
  const [seasonsManagerOpen, setSeasonsManagerOpen] = useState(false)
  const [productsManagerOpen, setProductsManagerOpen] = useState(false)
  // Qué sección gestiona el modal de productos ("biblioteca" | "tienda").
  const [productsManagerCategory, setProductsManagerCategory] = useState("biblioteca")
  const ownedNames = new Set(owned.map((o) => o.name.trim().toLowerCase()))
  const lockedBonuses = ALL_BONUSES.filter((b) => !ownedNames.has(b.name.trim().toLowerCase()))

  return (
    <div className={styles.view}>
      {/* Hero é renderizado no shell (persistente, antes do viewWrap) — não
          renderizamos aqui pra não duplicar. Ele ocupa 100vh natural acima. */}

      {/* MIEMBROS ONLINE — widget realtime (Supabase Presence) */}
      <OnlineMembers />

      {/* MI BIBLIOTECA — Temporadas + camino iniciático (portales intercalados) */}
      <section id="cursos" className={styles.section}>
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Camino iniciático</p>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionDivider} />
              <span className={styles.sectionTitleAccent}>Los 144000</span> — Temporadas
            </h2>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setSeasonsManagerOpen(true)}
              aria-label="Gestionar temporadas"
              title="Gestionar temporadas"
              className="inline-flex items-center justify-center border border-[#6D4A9B]/50 bg-[#6D4A9B]/10 px-3 py-2 text-[#a78bca] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/25 hover:text-[#F3F6FA]"
              style={{ borderRadius: 8 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.2em] [font-family:var(--font-mono)]">Gestionar</span>
            </button>
          )}
        </header>
        <SeasonsCarousel
          seasons={seasons}
          hasAccess={hasSeasonAccess}
          isAdmin={isAdmin}
          onOpenSeason={onOpenSeason}
          onOpenIngreso={onOpenIngreso}
          onOpenObjetivos={onOpenObjetivos}
          onOpenUmbral={onOpenUmbral}
          onOpenIntegration={onOpenIntegration}
          onLockedInfo={(msg) => { if (typeof window !== "undefined") window.alert(msg) }}
          onLockedClick={(s) => {
            if (typeof window !== "undefined") {
              window.alert(
                `Completa la Temporada ${s.num - 1} para desbloquear esta temporada.`,
              )
            }
          }}
        />
      </section>

      {/* TU BIBLIOTECA — Otros Productos (só renderiza se tem comprados; bonus desbloqueado aparece aqui) */}
      {owned.length > 0 && (
        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionKicker}>Tu Biblioteca</p>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionDivider} />
                Otros Productos
              </h2>
            </div>
          </header>
          <OwnedProducts owned={owned} />
        </section>
      )}

      {/* BIBLIOTECA — productos categoría "biblioteca" */}
      <section id="biblioteca" className={styles.section}>
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Desbloquea Más</p>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionDivider} />
              Biblioteca de los 144000
            </h2>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => { setProductsManagerCategory("biblioteca"); setProductsManagerOpen(true) }}
              aria-label="Gestionar productos"
              title="Gestionar productos"
              className="inline-flex items-center justify-center border border-[#6D4A9B]/50 bg-[#6D4A9B]/10 px-3 py-2 text-[#a78bca] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/25 hover:text-[#F3F6FA]"
              style={{ borderRadius: 8 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.2em] [font-family:var(--font-mono)]">Gestionar</span>
            </button>
          )}
        </header>
        <TiendaCarousel category="biblioteca" />
      </section>

      {/* TIENDA — sección aparte, estilo dorado (diferenciado de Biblioteca) */}
      <section id="tienda" className={styles.section}>
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker} style={{ color: "#c9a86b" }}>Adquiere</p>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionDivider} style={{ background: "#d9b866" }} />
              Tienda
            </h2>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => { setProductsManagerCategory("tienda"); setProductsManagerOpen(true) }}
              aria-label="Gestionar productos"
              title="Gestionar productos"
              className="inline-flex items-center justify-center border border-[#c9a86b]/50 bg-[#c9a86b]/10 px-3 py-2 text-[#e6cf95] transition-colors hover:border-[#c9a86b] hover:bg-[#c9a86b]/20 hover:text-[#F3F6FA]"
              style={{ borderRadius: 8 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.2em] [font-family:var(--font-mono)]">Gestionar</span>
            </button>
          )}
        </header>
        <TiendaCarousel category="tienda" variant="tienda" />
      </section>

      {/* Modal de gestão de temporadas — só admin renderiza */}
      {isAdmin && (
        <SeasonsManagerModal
          open={seasonsManagerOpen}
          onClose={() => setSeasonsManagerOpen(false)}
        />
      )}
      {/* Modal de gestão de produtos — só admin renderiza */}
      {isAdmin && (
        <ProductsManagerModal
          open={productsManagerOpen}
          onClose={() => setProductsManagerOpen(false)}
          category={productsManagerCategory}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// VIEW: COMUNIDAD (Foro + Leaderboard sidebar)
// ─────────────────────────────────────────────────────────────────────────

function ViewComunidad() {
  const { setView } = useView()
  return (
    <div className={styles.view}>
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Foro · parte del recorrido</p>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionDivider} />
              Foro de la Red
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setView("inicio", "cursos")}
            className="inline-flex items-center gap-2 border border-[#6D4A9B]/50 bg-[#6D4A9B]/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a78bca] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/25 hover:text-[#F3F6FA] [font-family:var(--font-mono)]"
            style={{ borderRadius: 8 }}
          >
            ← Volver al recorrido
          </button>
        </header>
        <div className={styles.comunidadGrid}>
          <Leaderboard />
          <div style={{ minWidth: 0 }}>
            <ForumFeed />
          </div>
        </div>
      </section>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// VIEW: FEED (AdminFeed do Estudio)
// ─────────────────────────────────────────────────────────────────────────

function ViewFeed() {
  return (
    <div className={styles.view}>
      <section className={styles.section} style={{ maxWidth: 880 }}>
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Anuncios &amp; Novedades</p>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionDivider} />
              Feed del Creador
            </h2>
          </div>
        </header>
        <AdminFeed />
      </section>
    </div>
  )
}

