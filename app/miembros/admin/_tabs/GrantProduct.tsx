"use client"

import { useState, useTransition } from "react"
import { PRODUCT_OPTIONS, btnCls, inputCls, labelCls } from "./_shared"

export function GrantProduct() {
  return (
    <div className="space-y-10">
      <GrantMembership />
      <div className="border-t border-[#1a1a24]" />
      <GrantProductSection />
    </div>
  )
}

// Seção pra liberar acesso à membership manualmente (vendas via Wise/PIX/manuais).
// Insere stripe_sales sale_type='front' + cria invite + manda email Resend.
function GrantMembership() {
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
        const res = await fetch("/api/admin/grant-membership", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            send_email: true,
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
            : ""
        setSuccess(`Acesso liberado pra ${email}${emailMsg}`)
        setEmail("")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro")
      }
    })
  }

  return (
    <form onSubmit={submit} className="border border-[#6D4A9B]/40 bg-[#12121a]/40 p-6 sm:p-8 space-y-5">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[#6D4A9B] [font-family:var(--font-geist-sans)]">
          Liberar acesso à membership
        </h2>
        <p className="mt-2 text-xs text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
          Insere o cliente como membro + cria invite com link único + manda email pro cliente criar a senha. Idempotente — se a conta já existe, cliente loga normal.
        </p>
      </div>

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
              ? "border-[#6D4A9B] bg-[#6D4A9B]/10 text-[#6D4A9B]"
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
          <h2 className={`text-sm font-semibold uppercase tracking-[0.25em] [font-family:var(--font-geist-sans)] ${isRevoke ? "text-red-400" : "text-[#6D4A9B]"}`}>
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
                      ? (isRevoke ? "border-red-500 bg-red-500/10 text-[#F3F6FA]" : "border-[#6D4A9B] bg-[#6D4A9B]/10 text-[#F3F6FA]")
                      : "border-[#1a1a24] bg-[#000000]/50 text-[#a0a0b0] hover:border-[#2a2a35]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-base ${selected ? (isRevoke ? "text-red-400" : "text-[#6D4A9B]") : "text-[#3a3a45]"}`}>
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
                <span className="text-sm text-[#F3F6FA] [font-family:var(--font-geist-sans)]">
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
            ? "inline-flex items-center justify-center gap-2 border border-red-500 bg-red-500 px-6 py-3 text-[#000000] text-xs font-semibold uppercase tracking-[0.3em] transition-colors hover:bg-red-600 hover:border-red-600 hover:text-[#F3F6FA] disabled:cursor-wait disabled:opacity-60 [font-family:var(--font-geist-sans)]"
            : btnCls
          }
        >
          {isPending ? (isRevoke ? "Revogando..." : "Liberando...") : (isRevoke ? "Revogar acesso" : "Liberar acesso")}
        </button>
      </form>
    </div>
  )
}
