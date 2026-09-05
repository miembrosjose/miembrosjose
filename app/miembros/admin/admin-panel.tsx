"use client"

// Admin panel — sidebar agrupada + tabs lazy-loaded.
// Cada tab é um chunk separado via dynamic() — só baixa JS quando user
// clica naquela aba. Antes era 1 arquivo de 1357 linhas com tudo.

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import {
  Unlock,
  Users,
  FileText,
  Flag,
  ShieldOff,
  MessageSquare,
  Mail,
  CreditCard,
  ChevronRight,
  RotateCcw,
} from "lucide-react"

type Tab =
  | "grant"
  | "members"
  | "texts"
  | "reports"
  | "access"
  | "messages"
  | "subs"
  | "resetprogress"

const GrantProduct = dynamic(
  () => import("./_tabs/GrantProduct").then((m) => m.GrantProduct),
  { ssr: false },
)
const MembersTracker = dynamic(
  () => import("./_tabs/MembersTracker").then((m) => m.MembersTracker),
  { ssr: false },
)
const TextsEditor = dynamic(
  () => import("./_tabs/TextsEditor").then((m) => m.TextsEditor),
  { ssr: false },
)
const ReportsModeration = dynamic(
  () => import("./_tabs/ReportsModeration").then((m) => m.ReportsModeration),
  { ssr: false },
)
const RevokedAccess = dynamic(
  () => import("./_tabs/RevokedAccess").then((m) => m.RevokedAccess),
  { ssr: false },
)
const MessagesModeration = dynamic(
  () => import("./_tabs/MessagesModeration").then((m) => m.MessagesModeration),
  { ssr: false },
)
const Subscriptions = dynamic(
  () => import("./_tabs/Subscriptions").then((m) => m.Subscriptions),
  { ssr: false },
)
const ResetProgress = dynamic(
  () => import("./_tabs/ResetProgress").then((m) => m.ResetProgress),
  { ssr: false },
)

type TabConfig = {
  id: Tab
  label: string
  description: string
  icon: typeof Unlock
}

type TabGroup = {
  title: string
  tabs: TabConfig[]
}

const TAB_GROUPS: TabGroup[] = [
  {
    title: "Vendas & Acesso",
    tabs: [
      {
        id: "grant",
        label: "Liberar Produto",
        description: "Conceder produtos manualmente a clientes",
        icon: Unlock,
      },
      {
        id: "access",
        label: "Acessos Revogados",
        description: "Gerenciar acessos revogados (refunds, manuais)",
        icon: ShieldOff,
      },
    ],
  },
  {
    title: "Comunidade",
    tabs: [
      {
        id: "members",
        label: "Membros",
        description: "Lista completa de membros com detalhes",
        icon: Users,
      },
      {
        id: "reports",
        label: "Denúncias",
        description: "Denúncias de interações (posts, mensagens)",
        icon: Flag,
      },
      {
        id: "messages",
        label: "Mensagens Diretas",
        description: "Moderação de DMs entre membros",
        icon: MessageSquare,
      },
      {
        id: "resetprogress",
        label: "Reiniciar Avance",
        description: "Reiniciar el avance de un usuario (pruebas)",
        icon: RotateCcw,
      },
    ],
  },
  {
    title: "Suscripciones & Sistema",
    tabs: [
      {
        id: "subs",
        label: "Suscripciones",
        description: "Membresías, estado del sistema y métricas de lanzamiento",
        icon: CreditCard,
      },
      {
        id: "texts",
        label: "Textos do Site",
        description: "Editar textos e conteúdos do site",
        icon: FileText,
      },
    ],
  },
]

const ALL_TABS = TAB_GROUPS.flatMap((g) => g.tabs)

export function AdminPanel() {
  const [tab, setTab] = useState<Tab>("grant")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  // Badge de alerta: sincronizaciones fallidas sin resolver (member_sync_events).
  const [syncAlert, setSyncAlert] = useState(false)

  useEffect(() => {
    let alive = true
    fetch("/api/admin/subscriptions", { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d?.sync?.failed > 0) setSyncAlert(true)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const activeTab = ALL_TABS.find((t) => t.id === tab)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* SIDEBAR — desktop fixa, mobile colapsável */}
      <aside
        className={`relative ${
          mobileNavOpen ? "block" : "hidden lg:block"
        }`}
      >
        <div className="sticky top-4 space-y-6 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-2">
          {/* Header do painel */}
          <div className="border border-[#2a2a36] bg-gradient-to-br from-[#12121a] via-[#0f0f17] to-[#12121a] p-4">
            <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-[#6D4A9B] [font-family:var(--font-geist-sans)]">
              Los 144000
            </p>
            <h1 className="mt-1 text-lg font-bold tracking-tight text-[#F3F6FA] [font-family:var(--font-cinzel)]">
              Admin Panel
            </h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
              Controle central
            </p>
          </div>

          {/* Grupos de tabs */}
          {TAB_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.35em] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.tabs.map((t) => {
                  const Icon = t.icon
                  const isActive = tab === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTab(t.id)
                        setMobileNavOpen(false)
                      }}
                      className={`group relative flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left transition-colors [font-family:var(--font-geist-sans)] ${
                        isActive
                          ? "border-[#6D4A9B] bg-gradient-to-r from-[#6D4A9B]/10 to-transparent"
                          : "border-transparent hover:bg-[#12121a]/40"
                      }`}
                    >
                      <Icon
                        size={15}
                        className={
                          isActive ? "text-[#6D4A9B]" : "text-[#6a6a7a] group-hover:text-[#a0a0b0]"
                        }
                      />
                      <span
                        className={`flex-1 text-xs font-semibold ${
                          isActive ? "text-[#F3F6FA]" : "text-[#a0a0b0] group-hover:text-[#F3F6FA]"
                        }`}
                      >
                        {t.label}
                      </span>
                      {t.id === "subs" && syncAlert && (
                        <span
                          aria-label="Hay sincronizaciones fallidas"
                          title="Sincronizaciones fallidas sin resolver"
                          className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500"
                        />
                      )}
                      {isActive && (
                        <ChevronRight size={14} className="text-[#6D4A9B]" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Footer da sidebar */}
          <div className="border-t border-[#1a1a24] pt-4">
            <p className="px-2 text-[9px] uppercase tracking-[0.3em] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
              {ALL_TABS.length} módulos disponíveis
            </p>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="min-w-0 space-y-6">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileNavOpen((v) => !v)}
          className="flex w-full items-center justify-between border border-[#1a1a24] bg-[#12121a]/40 px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#a0a0b0] [font-family:var(--font-geist-sans)] lg:hidden"
        >
          <span>{mobileNavOpen ? "Fechar menu" : "Menu"}</span>
          <span className="text-[#6D4A9B]">{activeTab?.label || ""}</span>
        </button>

        {/* Header contextual da tab ativa */}
        {activeTab && (
          <div className="relative overflow-hidden border border-[#2a2a36] bg-gradient-to-br from-[#12121a] via-[#0f0f17] to-[#12121a] p-6 sm:p-8">
            {/* Cantos decorativos dourados */}
            <span className="pointer-events-none absolute left-0 top-0 h-2 w-2 border-l-2 border-t-2 border-[#6D4A9B]" />
            <span className="pointer-events-none absolute right-0 top-0 h-2 w-2 border-r-2 border-t-2 border-[#6D4A9B]" />
            <span className="pointer-events-none absolute bottom-0 left-0 h-2 w-2 border-b-2 border-l-2 border-[#6D4A9B]" />
            <span className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 border-b-2 border-r-2 border-[#6D4A9B]" />

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center border border-[#6D4A9B]/40 bg-[#6D4A9B]/10">
                <activeTab.icon size={20} className="text-[#6D4A9B]" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#6D4A9B] [font-family:var(--font-geist-sans)]">
                  {TAB_GROUPS.find((g) =>
                    g.tabs.some((t) => t.id === activeTab.id),
                  )?.title || ""}
                </p>
                <h2 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-[#F3F6FA] [font-family:var(--font-cinzel)] sm:text-3xl">
                  {activeTab.label}
                </h2>
                <p className="mt-2 text-xs text-[#a0a0b0] [font-family:var(--font-geist-sans)] sm:text-sm">
                  {activeTab.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Container do tab ativo */}
        <div className="border border-[#1a1a24] bg-[#000000]/40 p-4 sm:p-6">
          {tab === "grant" && <GrantProduct />}
          {tab === "subs" && <Subscriptions />}
          {tab === "members" && <MembersTracker />}
          {tab === "texts" && <TextsEditor />}
          {tab === "reports" && <ReportsModeration />}
          {tab === "access" && <RevokedAccess />}
          {tab === "messages" && <MessagesModeration />}
          {tab === "resetprogress" && <ResetProgress />}
        </div>
      </main>
    </div>
  )
}
