"use client"

import { useState, useTransition } from "react"
import { PRODUCT_OPTIONS, btnCls, inputCls, labelCls } from "./_shared"

export function GrantProduct() {
  return (
    <div className="space-y-10">
      <GrantMembership />
      <div className="border-t border-[#1a1a24]" />
      <ResendInvite />
      <div className="border-t border-[#1a1a24]" />
      <GrantProductSection />
    </div>
  )
}

// Seção pra reenviar email de acesso pra cliente que não recebeu.
// Detecta automaticamente se manda invite (criar conta) ou login (já tem conta).
function ResendInvite() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setSuccess(null)
    if (!email.trim() || !email.includes("@")) {
      setError("Email inválido")
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/resend-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)

        const msg =
          data.type === "account_exists"
            ? `Email de login enviado pra ${email} (cliente já tem conta — manda fazer login)`
            : `Invite reenviado pra ${email} (resend_count: ${data.resend_count ?? 1})`
        setSuccess(msg)
        setEmail("")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro")
      }
    })
  }

  return (
    <form onSubmit={submit} className="border border-[#c9a961]/40 bg-[#12121a]/40 p-6 sm:p-8 space-y-5">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
          Reenviar email de acesso
        </h2>
        <p className="mt-2 text-xs text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
          Pra clientes que pagaram (Stripe ou Hotmart) e não receberam o email automático. Detecta se manda invite (criar conta) ou login (conta já existe). Idempotente — pode ser usado várias vezes sem duplicar conta.
        </p>
      </div>

      <div>
        <label htmlFor="ri-email" className={labelCls}>Email do cliente *</label>
        <input
          id="ri-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          className={inputCls}
          placeholder="cliente@email.com"
        />
      </div>

      {error && (
        <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 [font-family:var(--font-geist-sans)]">
          {error}
        </div>
      )}
      {success && (
        <div className="border border-[#009d68]/40 bg-[#009d68]/10 px-4 py-3 text-sm text-[#009d68] [font-family:var(--font-geist-sans)]">
          {success}
        </div>
      )}

      <button type="submit" disabled={isPending} className={btnCls}>
        {isPending ? "Enviando..." : "Reenviar email"}
      </button>
    </form>
  )
}

// Seção pra liberar acesso à membership manualmente (vendas via Wise/PIX/manuais).
// Insere stripe_sales sale_type='front' + cria invite + manda email Resend.
function GrantMembership() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [sendEmail, setSendEmail] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setSuccess(null)
    if (!email.trim() || !email.includes("@")) {
      setError("Email inválido")
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/grant-membership", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            name: name.trim() || undefined,
            phone: phone.trim() || undefined,
            send_email: sendEmail,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
        const emailMsg =
          data.email_status === "sent"
            ? " · Email enviado ✓"
            : data.email_status === "skipped_account_exists"
            ? " · Conta já existe (sem email — cliente loga normal)"
            : data.email_status === "error"
            ? ` · Email falhou: ${data.email_error}`
            : data.email_status === "not_requested"
            ? " · Email não enviado (opção desligada)"
            : ""
        setSuccess(`Acesso liberado pra ${email}${emailMsg}`)
        setEmail(""); setName(""); setPhone("")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro")
      }
    })
  }

  return (
    <form onSubmit={submit} className="border border-[#c9a961]/40 bg-[#12121a]/40 p-6 sm:p-8 space-y-5">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
          Liberar acesso à membership
        </h2>
        <p className="mt-2 text-xs text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
          Pra vendas via Wise/PIX/manuais. Insere a venda como front + cria invite com link único + manda email Resend pro cliente criar a senha. Idempotente — se a conta já existe, cliente loga normal.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="gm-email" className={labelCls}>Email do cliente *</label>
          <input
            id="gm-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            className={inputCls}
            placeholder="cliente@email.com"
          />
        </div>
        <div>
          <label htmlFor="gm-name" className={labelCls}>Nome (opcional)</label>
          <input
            id="gm-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            className={inputCls}
            placeholder="Nome completo"
          />
        </div>
      </div>

      <div>
        <label htmlFor="gm-phone" className={labelCls}>Telefone com DDI (opcional)</label>
        <input
          id="gm-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={isPending}
          className={inputCls}
          placeholder="5511999999999"
        />
      </div>

      <label className="flex items-start gap-3 text-xs text-[#a0a0b0] [font-family:var(--font-geist-sans)] cursor-pointer">
        <input
          type="checkbox"
          checked={sendEmail}
          onChange={(e) => setSendEmail(e.target.checked)}
          disabled={isPending}
          className="mt-0.5 accent-[#c9a961]"
        />
        <span>
          Enviar email <strong className="text-[#f5f5f7]">&quot;Tu acceso a [BRAND_NAME] está listo&quot;</strong> (cliente cria senha via link único, válido 7 dias)
        </span>
      </label>

      {error && (
        <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 [font-family:var(--font-geist-sans)]">
          {error}
        </div>
      )}
      {success && (
        <div className="border border-[#009d68]/40 bg-[#009d68]/10 px-4 py-3 text-sm text-[#009d68] [font-family:var(--font-geist-sans)]">
          {success}
        </div>
      )}

      <button type="submit" disabled={isPending} className={btnCls}>
        {isPending ? "Liberando..." : "Liberar membership"}
      </button>
    </form>
  )
}

function GrantProductSection() {
  const [mode, setMode] = useState<"grant" | "revoke">("grant")
  const [email, setEmail] = useState("")
  const [keys, setKeys] = useState<string[]>([])
  const [includeFront, setIncludeFront] = useState(false)
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleKey(k: string) {
    setKeys(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setSuccess(null)
    if (!email.trim() || !email.includes("@")) {
      setError("Email inválido")
      return
    }
    const allKeys = mode === "revoke" && includeFront ? [...keys, "front"] : keys
    if (allKeys.length === 0) {
      setError("Selecione ao menos um produto")
      return
    }
    startTransition(async () => {
      try {
        const endpoint = mode === "grant" ? "/api/admin/grant-product" : "/api/admin/revoke-product"
        const body: Record<string, unknown> = {
          email: email.trim().toLowerCase(),
          product_keys: allKeys,
        }
        if (mode === "revoke" && reason.trim()) body.notes = reason.trim()

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
        if (mode === "grant") {
          setSuccess(`Liberado pra ${email}: ${allKeys.join(", ")}`)
        } else {
          const fullMsg = data.full_access_revoked ? " · Acesso COMPLETO revogado" : ""
          setSuccess(`Revogado de ${email}: ${allKeys.join(", ")}${fullMsg}`)
        }
        setEmail(""); setKeys([]); setIncludeFront(false); setReason("")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro")
      }
    })
  }

  const isRevoke = mode === "revoke"

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setMode("grant"); setError(null); setSuccess(null) }}
          className={`border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] transition-colors [font-family:var(--font-geist-sans)] ${
            mode === "grant"
              ? "border-[#c9a961] bg-[#c9a961]/10 text-[#c9a961]"
              : "border-[#1a1a24] bg-[#12121a]/40 text-[#a0a0b0] hover:border-[#2a2a35]"
          }`}
        >
          Conceder
        </button>
        <button
          type="button"
          onClick={() => { setMode("revoke"); setError(null); setSuccess(null) }}
          className={`border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] transition-colors [font-family:var(--font-geist-sans)] ${
            mode === "revoke"
              ? "border-red-500 bg-red-500/10 text-red-400"
              : "border-[#1a1a24] bg-[#12121a]/40 text-[#a0a0b0] hover:border-[#2a2a35]"
          }`}
        >
          Revogar
        </button>
      </div>

      <form onSubmit={submit} className={`border bg-[#12121a]/40 p-6 sm:p-8 space-y-5 ${isRevoke ? "border-red-500/30" : "border-[#1a1a24]"}`}>
        <div>
          <h2 className={`text-sm font-semibold uppercase tracking-[0.25em] [font-family:var(--font-geist-sans)] ${isRevoke ? "text-red-400" : "text-[#c9a961]"}`}>
            {isRevoke ? "Revogar acesso a produto" : "Liberar produto manualmente"}
          </h2>
          <p className="mt-2 text-xs text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
            {isRevoke
              ? "Tira o acesso a produtos sem mexer na compra original. Pra 'front' marca também acesso COMPLETO revogado (middleware bloqueia login)."
              : "Sem cobrança. O usuário verá o produto na sua área na próxima vez que entrar."}
          </p>
        </div>

        <div>
          <label htmlFor="grant-email" className={labelCls}>Email do membro</label>
          <input
            id="grant-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isPending}
            className={inputCls}
            placeholder="cliente@email.com"
          />
        </div>

        <div>
          <label className={labelCls}>Produtos</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PRODUCT_OPTIONS.map(p => {
              const selected = keys.includes(p.key)
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => toggleKey(p.key)}
                  disabled={isPending}
                  className={`border px-4 py-3 text-left text-sm transition-colors [font-family:var(--font-geist-sans)] ${
                    selected
                      ? (isRevoke ? "border-red-500 bg-red-500/10 text-[#f5f5f7]" : "border-[#c9a961] bg-[#c9a961]/10 text-[#f5f5f7]")
                      : "border-[#1a1a24] bg-[#0a0a0f]/50 text-[#a0a0b0] hover:border-[#2a2a35]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-base ${selected ? (isRevoke ? "text-red-400" : "text-[#c9a961]") : "text-[#3a3a45]"}`}>
                      {selected ? "✓" : "○"}
                    </span>
                    <span className="font-semibold">{p.name}</span>
                  </div>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">
                    key: {p.key}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {isRevoke && (
          <>
            <div className="border border-red-500/30 bg-red-500/5 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeFront}
                  onChange={(e) => setIncludeFront(e.target.checked)}
                  disabled={isPending}
                  className="mt-1"
                />
                <span className="text-sm text-[#f5f5f7] [font-family:var(--font-geist-sans)]">
                  <strong className="text-red-400">Revogar acesso COMPLETO (front)</strong>
                  <span className="block text-xs text-[#a0a0b0] mt-1">
                    O usuário será expulso do Estudio imediatamente. Próxima tentativa de login redireciona com mensagem &quot;acesso revogado&quot;.
                  </span>
                </span>
              </label>
            </div>

            <div>
              <label htmlFor="revoke-reason" className={labelCls}>Motivo / nota (opcional)</label>
              <input
                id="revoke-reason"
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                disabled={isPending}
                className={inputCls}
                placeholder="Ex: chargeback, quebra de regras, etc."
              />
            </div>
          </>
        )}

        {error && <p className="text-xs text-red-500 [font-family:var(--font-geist-sans)]">{error}</p>}
        {success && <p className="text-xs text-[#009d68] [font-family:var(--font-geist-sans)]">{success}</p>}

        <button
          type="submit"
          disabled={isPending}
          className={isRevoke
            ? "inline-flex items-center justify-center gap-2 border border-red-500 bg-red-500 px-6 py-3 text-[#0a0a0f] text-xs font-semibold uppercase tracking-[0.3em] transition-colors hover:bg-red-600 hover:border-red-600 hover:text-[#f5f5f7] disabled:cursor-wait disabled:opacity-60 [font-family:var(--font-geist-sans)]"
            : btnCls
          }
        >
          {isPending ? (isRevoke ? "Revogando..." : "Liberando...") : (isRevoke ? "Revogar acesso" : "Liberar acesso")}
        </button>
      </form>
    </div>
  )
}
