"use client"

import { useEffect, useMemo, useState } from "react"
import { inputCls } from "./_shared"

type Member = {
  id: string
  email: string
  full_name: string
  username: string | null
  avatar_url: string | null
  member_since: string
  last_login_date: string | null
  unique_login_days: number
  level: number
  total_xp: number
  post_count: number
  products: string[]
  products_revoked: string[]
  front_expires_at: string | null
}

export function MembersTracker() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [polling, setPolling] = useState(true)
  const [openMemberId, setOpenMemberId] = useState<string | null>(null)

  async function load() {
    try {
      const res = await fetch(`/api/admin/members?limit=300&t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      })
      const data = await res.json()
      setMembers(Array.isArray(data.members) ? data.members : [])
    } catch {
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    if (!polling) return
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [polling])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return members
    return members.filter((m) =>
      m.email.toLowerCase().includes(q) ||
      m.full_name.toLowerCase().includes(q) ||
      (m.username || "").toLowerCase().includes(q)
    )
  }, [members, search])

  if (loading) {
    return <p className="text-xs text-[#6a6a7a] [font-family:var(--font-geist-sans)]">Carregando membros...</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, email, @username..."
          className={inputCls + " flex-1 min-w-[200px]"}
        />
        <button
          type="button"
          onClick={() => setPolling((p) => !p)}
          className="border border-[#1a1a24] bg-[#12121a]/40 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a0a0b0] hover:border-[#c9a961] hover:text-[#c9a961] [font-family:var(--font-geist-sans)]"
          title="Alternar atualização automática"
        >
          {polling ? "● Auto-refresh ON" : "○ Pausado"}
        </button>
        <span className="text-[11px] uppercase tracking-[0.25em] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
          {filtered.length} de {members.length}
        </span>
      </div>

      <div className="border border-[#1a1a24] bg-[#0a0a0f]/40 overflow-x-auto">
        <table className="w-full text-sm [font-family:var(--font-geist-sans)]">
          <thead className="border-b border-[#1a1a24]">
            <tr className="text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">
              <th className="px-3 py-3 text-left">Membro</th>
              <th className="px-3 py-3 text-left">Produtos</th>
              <th className="px-3 py-3 text-left">Desde</th>
              <th className="px-3 py-3 text-left">Último login</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr
                key={m.id}
                onClick={() => setOpenMemberId(m.id)}
                className="border-b border-[#1a1a24] hover:bg-[#12121a]/40 cursor-pointer"
                title="Click pra ver detalhe de atividade"
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-full border border-[#2a2a35] bg-[#12121a]">
                      {m.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.avatar_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-[#c9a961]">
                          {m.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[12px] text-[#f5f5f7]">{m.full_name}</div>
                      <div className="truncate text-[10px] text-[#6a6a7a]">
                        {m.username ? `@${m.username} · ` : ""}{m.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {m.products.map((p) => (
                      <span key={p} className="border border-[#1a1a24] bg-[#12121a]/40 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.15em] text-[#a0a0b0]">{p}</span>
                    ))}
                    {(m.products_revoked || []).map((p) => (
                      <span key={`r-${p}`} className="border border-red-500/30 bg-red-500/5 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.15em] text-red-400/70 line-through" title="Revogado">{p}</span>
                    ))}
                    {m.products.length === 0 && (m.products_revoked || []).length === 0 && <span className="text-[10px] text-[#3a3a45]">—</span>}
                  </div>
                </td>
                <td className="px-3 py-2 text-[11px] text-[#a0a0b0]">{new Date(m.member_since).toLocaleDateString("pt-BR")}</td>
                <td className="px-3 py-2 text-[11px] text-[#a0a0b0]">{m.last_login_date || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-6 text-center text-xs text-[#6a6a7a]">Nenhum membro encontrado.</p>
        )}
      </div>

      {openMemberId && (
        <MemberDetailModal memberId={openMemberId} onClose={() => setOpenMemberId(null)} />
      )}
    </div>
  )
}

type MemberDetail = {
  member: {
    id: string
    email: string
    full_name: string
    username: string | null
    avatar_url: string | null
    member_since: string
    last_login_date: string | null
    unique_login_days: number
  }
  purchases: {
    front: boolean
    front_revoked: boolean
    front_expires_at: string | null
    front_expired: boolean
    products: string[]
    products_revoked: string[]
    total_sales: number
    first_purchase_at: string | null
    last_purchase_at: string | null
  }
  insignias: Array<{
    id: string
    name: string
    desc: string | null
    tier: string | null
    category: string | null
    unlocked_at: string
  }>
  episode_comments: Array<{ season_num: number; episode_num: number; created_at: string }>
  activity: {
    posts: number
    replies: number
    funnels: number
    events_by_type: Record<string, number>
    total_events: number
  }
}

function MemberDetailModal({ memberId, onClose }: { memberId: string; onClose: () => void }) {
  const [data, setData] = useState<MemberDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [topoBusy, setTopoBusy] = useState(false)
  const [topoMsg, setTopoMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)
  const [estudioBusy, setEstudioBusy] = useState(false)
  const [estudioMsg, setEstudioMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)

  function reload() {
    fetch(`/api/admin/members/${memberId}`, { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData(d as MemberDetail))
      .catch(() => {})
  }

  async function grantTopo() {
    if (!confirm("Conceder a insígnia EL TOPO a este membro? Será notificada toda a comunidade.")) return
    setTopoBusy(true)
    setTopoMsg(null)
    try {
      const res = await fetch("/api/admin/grant-topo", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: memberId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erro desconhecido")
      setTopoMsg({ kind: "ok", text: json.already_had ? "Já tinha EL TOPO" : "EL TOPO concedida ✓" })
      reload()
    } catch (e) {
      setTopoMsg({ kind: "err", text: e instanceof Error ? e.message : "Erro" })
    } finally {
      setTopoBusy(false)
    }
  }

  async function revokeTopo() {
    if (!confirm("Tirar a insígnia EL TOPO? Esta ação é reversível (pode conceder de novo).")) return
    setTopoBusy(true)
    setTopoMsg(null)
    try {
      const res = await fetch("/api/admin/grant-topo", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: memberId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erro desconhecido")
      setTopoMsg({ kind: "ok", text: "EL TOPO revogada ✓" })
      reload()
    } catch (e) {
      setTopoMsg({ kind: "err", text: e instanceof Error ? e.message : "Erro" })
    } finally {
      setTopoBusy(false)
    }
  }

  async function grantEstudio() {
    if (!confirm("Conceder a insígnia EL ESTUDIO a este membro? Será notificada toda a comunidade.")) return
    setEstudioBusy(true)
    setEstudioMsg(null)
    try {
      const res = await fetch("/api/admin/grant-estudio", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: memberId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erro desconhecido")
      setEstudioMsg({ kind: "ok", text: json.already_had ? "Já tinha EL ESTUDIO" : "EL ESTUDIO concedida ✓" })
      reload()
    } catch (e) {
      setEstudioMsg({ kind: "err", text: e instanceof Error ? e.message : "Erro" })
    } finally {
      setEstudioBusy(false)
    }
  }

  async function revokeEstudio() {
    if (!confirm("Tirar a insígnia EL ESTUDIO? Esta ação é reversível (pode conceder de novo).")) return
    setEstudioBusy(true)
    setEstudioMsg(null)
    try {
      const res = await fetch("/api/admin/grant-estudio", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: memberId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erro desconhecido")
      setEstudioMsg({ kind: "ok", text: "EL ESTUDIO revogada ✓" })
      reload()
    } catch (e) {
      setEstudioMsg({ kind: "err", text: e instanceof Error ? e.message : "Erro" })
    } finally {
      setEstudioBusy(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/members/${memberId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setData(d as MemberDetail))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [memberId])

  // Extend access — adiciona N dias (default 365) ao expires_at do front
  const [extendBusy, setExtendBusy] = useState(false)
  const [extendMsg, setExtendMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)

  async function extendAccess(days: number) {
    if (!data?.member.email) return
    const label = days === 365 ? "1 ano" : `${days} dias`
    if (!confirm(`Estender acesso ao treinamento por ${label}?`)) return
    setExtendBusy(true)
    setExtendMsg(null)
    try {
      const res = await fetch("/api/admin/extend-access", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.member.email, days }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erro desconhecido")
      setExtendMsg({ kind: "ok", text: `+${label} ✓` })
      reload()
    } catch (e) {
      setExtendMsg({ kind: "err", text: e instanceof Error ? e.message : "Erro" })
    } finally {
      setExtendBusy(false)
    }
  }

  const hasTopo = !!data?.insignias.find((i) => i.id === "el_topo")
  const hasEstudio = !!data?.insignias.find((i) => i.id === "el_estudio")

  const aulas = data?.insignias.filter((i) => i.category === "progression") || []
  const raras = data?.insignias.filter((i) => ["community", "time", "agents", "products"].includes(i.category || "")) || []

  const episodesViewedSet = new Set<string>()
  ;(data?.episode_comments || []).forEach((c) => episodesViewedSet.add(`S${c.season_num}E${c.episode_num}`))
  const episodesViewed = Array.from(episodesViewedSet).sort()

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden border border-[#1a1a24] bg-[#0a0a0f]">
        <div className="flex items-center justify-between border-b border-[#1a1a24] px-5 py-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
            Detalhe do membro
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-2xl leading-none text-[#a0a0b0] hover:text-[#f5f5f7]"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading && <p className="text-xs text-[#6a6a7a]">Carregando…</p>}

          {!loading && !data && (
            <p className="text-xs text-red-400">Erro ao carregar detalhes do membro.</p>
          )}

          {!loading && data && (
            <>
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-[#2a2a35] bg-[#12121a]">
                  {data.member.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.member.avatar_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#c9a961] [font-family:var(--font-cinzel)]">
                      {data.member.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-[#f5f5f7] [font-family:var(--font-cinzel)]">
                    {data.member.full_name}
                  </h2>
                  <p className="text-xs text-[#a0a0b0] [font-family:var(--font-geist-sans)] truncate">{data.member.email}</p>
                  {data.member.username && (
                    <p className="text-[11px] text-[#c9a961]">@{data.member.username}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <DetailStat label="Aulas desbloqueadas" value={aulas.length} hint="completadas" />
                <DetailStat label="Episódios vistos" value={episodesViewed.length} hint="com comentário" />
                <DetailStat label="Dias ativos" value={data.member.unique_login_days} hint="logins únicos" />
                <DetailStat label="Insígnias raras" value={raras.length} hint="silver/gold/platinum" />
              </div>

              <section>
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
                  Aulas / módulos desbloqueados ({aulas.length})
                </h3>
                {aulas.length === 0 ? (
                  <p className="text-xs text-[#6a6a7a] italic">Não desbloqueou nenhuma aula. Conteúdo sem consumir.</p>
                ) : (
                  <div className="space-y-1.5">
                    {aulas.map((i) => (
                      <div key={i.id} className="flex items-center justify-between gap-2 border border-[#1a1a24] bg-[#12121a]/40 px-3 py-2">
                        <span className="text-xs text-[#f5f5f7]">{i.name}</span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">
                          {new Date(i.unlocked_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {episodesViewed.length > 0 && (
                <section>
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
                    Episódios onde deixou comentário
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {episodesViewed.map((ep) => (
                      <span key={ep} className="border border-[#1a1a24] bg-[#12121a]/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
                        {ep}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {raras.length > 0 && (
                <section>
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
                    Insígnias adicionais
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {raras.map((i) => (
                      <span key={i.id} className="border border-[#c9a961]/40 bg-[#c9a961]/5 px-2 py-0.5 text-[10px] text-[#c9a961] [font-family:var(--font-geist-sans)]">
                        {i.name}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section className="border-t border-[#1a1a24] pt-4">
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
                  Compras
                </h3>
                <p className="text-xs text-[#a0a0b0]">
                  {data.purchases.total_sales} {data.purchases.total_sales === 1 ? "venda" : "vendas"}
                  {data.purchases.first_purchase_at && (
                    <> · primeira em {new Date(data.purchases.first_purchase_at).toLocaleDateString("pt-BR")}</>
                  )}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data.purchases.front && (
                    <span className="border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-red-400 [font-family:var(--font-geist-sans)]">FRONT</span>
                  )}
                  {data.purchases.front_revoked && (
                    <span className="border border-red-500/30 bg-red-500/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-red-400/70 line-through [font-family:var(--font-geist-sans)]" title="Front revogado">FRONT</span>
                  )}
                  {data.purchases.products.map((p) => (
                    <span key={p} className="border border-[#1a1a24] bg-[#12121a]/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-[#a0a0b0] [font-family:var(--font-geist-sans)]">{p}</span>
                  ))}
                  {(data.purchases.products_revoked || []).map((p) => (
                    <span key={`r-${p}`} className="border border-red-500/30 bg-red-500/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-red-400/70 line-through [font-family:var(--font-geist-sans)]" title="Revogado (refund / chargeback / manual)">{p}</span>
                  ))}
                </div>
              </section>

              {/* ACCESO AL TREINAMENTO — controle de validade do front (1 año).
                * Mostra prazo + botão pra estender +1 año. */}
              <section className="border-t border-[#1a1a24] pt-4">
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
                  Acesso ao Treinamento
                </h3>
                {data.purchases.front_expires_at ? (
                  <div className="mb-3 space-y-1">
                    <p className="text-[11px] [font-family:var(--font-geist-sans)]">
                      <span className="text-[#a0a0b0]">Vence: </span>
                      <span className={data.purchases.front_expired ? "font-semibold text-red-400" : "font-semibold text-[#f5f5f7]"}>
                        {new Date(data.purchases.front_expires_at).toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" })}
                      </span>
                      {data.purchases.front_expired && (
                        <span className="ml-2 border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-red-400">
                          Vencido
                        </span>
                      )}
                    </p>
                    {!data.purchases.front_expired && (
                      <p className="text-[10px] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
                        {Math.ceil(
                          (new Date(data.purchases.front_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                        )}{" "}
                        dias restantes
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mb-3 text-[11px] text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
                    Sem data de vencimento (acesso permanente). Geralmente clientes
                    pré-migração. Estender adiciona prazo a partir de hoje.
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => extendAccess(365)}
                    disabled={extendBusy}
                    className="border border-[#c9a961] bg-[#c9a961]/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#fde68a] hover:bg-[#c9a961]/30 disabled:opacity-40 disabled:cursor-not-allowed [font-family:var(--font-geist-sans)]"
                  >
                    {extendBusy ? "..." : "Renovar +1 ano"}
                  </button>
                  <button
                    type="button"
                    onClick={() => extendAccess(30)}
                    disabled={extendBusy}
                    className="border border-[#1a1a24] bg-[#12121a]/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a0a0b0] hover:border-[#c9a961]/40 hover:text-[#c9a961] disabled:opacity-40 [font-family:var(--font-geist-sans)]"
                  >
                    {extendBusy ? "..." : "+30 dias"}
                  </button>
                  {extendMsg && (
                    <span className={`text-[10px] uppercase tracking-[0.2em] [font-family:var(--font-geist-sans)] ${extendMsg.kind === "ok" ? "text-[#009d68]" : "text-red-400"}`}>
                      {extendMsg.text}
                    </span>
                  )}
                </div>
              </section>

              {/* INSIGNIA EXCLUSIVA EL TOPO — concedida manualmente pra clientes
                * pra quem a [BRAND_NAME] construiu o embudo (serviço premium via Wise). */}
              <section className="border-t border-[#1a1a24] pt-4">
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#7f1d1d] [font-family:var(--font-geist-sans)]">
                  Insígnia exclusiva — El Topo
                </h3>
                <p className="mb-3 text-[11px] text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
                  {hasTopo ? (
                    <>Este membro JÁ tem a insígnia EL TOPO. Conceder de novo não faz nada.</>
                  ) : (
                    <>Conceder quando a Copy Film&apos;s construiu o embudo do cliente. Notifica toda a comunidade.</>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={grantTopo}
                    disabled={topoBusy || hasTopo}
                    className="border border-[#7f1d1d] bg-[#7f1d1d]/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#fca5a5] hover:bg-[#7f1d1d]/30 disabled:opacity-40 disabled:cursor-not-allowed [font-family:var(--font-geist-sans)]"
                  >
                    {topoBusy ? "..." : "Conceder EL TOPO"}
                  </button>
                  {hasTopo && (
                    <button
                      type="button"
                      onClick={revokeTopo}
                      disabled={topoBusy}
                      className="border border-[#1a1a24] bg-[#12121a]/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a0a0b0] hover:border-red-500/60 hover:text-red-400 disabled:opacity-40 [font-family:var(--font-geist-sans)]"
                    >
                      {topoBusy ? "..." : "Tirar EL TOPO"}
                    </button>
                  )}
                  {topoMsg && (
                    <span className={`text-[10px] uppercase tracking-[0.2em] [font-family:var(--font-geist-sans)] ${topoMsg.kind === "ok" ? "text-[#009d68]" : "text-red-400"}`}>
                      {topoMsg.text}
                    </span>
                  )}
                </div>
              </section>

              {/* INSIGNIA EXCLUSIVA EL ESTUDIO — concedida manualmente pra clientes
                * que contrataram o serviço "¿Quieres un área de miembros igual a esta?"
                * (vendido via Wise/contato direto). */}
              <section className="border-t border-[#1a1a24] pt-4">
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#fca5a5] [font-family:var(--font-geist-sans)]">
                  Insígnia exclusiva — El Estudio
                </h3>
                <p className="mb-3 text-[11px] text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
                  {hasEstudio ? (
                    <>Este membro JÁ tem a insígnia EL ESTUDIO. Conceder de novo não faz nada.</>
                  ) : (
                    <>Conceder quando o cliente contratou o serviço &quot;¿Quieres un área de miembros igual a esta?&quot;. Notifica toda a comunidade.</>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={grantEstudio}
                    disabled={estudioBusy || hasEstudio}
                    className="border border-[#ef4444] bg-[#ef4444]/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#fca5a5] hover:bg-[#ef4444]/30 disabled:opacity-40 disabled:cursor-not-allowed [font-family:var(--font-geist-sans)]"
                  >
                    {estudioBusy ? "..." : "Conceder EL ESTUDIO"}
                  </button>
                  {hasEstudio && (
                    <button
                      type="button"
                      onClick={revokeEstudio}
                      disabled={estudioBusy}
                      className="border border-[#1a1a24] bg-[#12121a]/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a0a0b0] hover:border-red-500/60 hover:text-red-400 disabled:opacity-40 [font-family:var(--font-geist-sans)]"
                    >
                      {estudioBusy ? "..." : "Tirar EL ESTUDIO"}
                    </button>
                  )}
                  {estudioMsg && (
                    <span className={`text-[10px] uppercase tracking-[0.2em] [font-family:var(--font-geist-sans)] ${estudioMsg.kind === "ok" ? "text-[#009d68]" : "text-red-400"}`}>
                      {estudioMsg.text}
                    </span>
                  )}
                </div>
              </section>

              <section className="border-t border-[#1a1a24] pt-4">
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
                  Atividade na comunidade
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <DetailStat label="Posts" value={data.activity.posts} />
                  <DetailStat label="Respostas" value={data.activity.replies} />
                  <DetailStat label="Funnels" value={data.activity.funnels} />
                </div>
              </section>

              <section className="border-t border-[#1a1a24] pt-4 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
                <p>Membro desde: {new Date(data.member.member_since).toLocaleDateString("pt-BR")}</p>
                <p>Último login: {data.member.last_login_date || "—"}</p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailStat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="border border-[#1a1a24] bg-[#12121a]/40 p-3 text-center">
      <p className="text-xl font-bold text-[#f5f5f7] [font-family:var(--font-cinzel)]">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-[#a0a0b0] [font-family:var(--font-geist-sans)]">{label}</p>
      {hint && <p className="text-[8px] text-[#6a6a7a]">{hint}</p>}
    </div>
  )
}
