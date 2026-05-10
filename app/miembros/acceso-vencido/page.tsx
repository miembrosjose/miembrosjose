// Tela mostrada quando user logado tem acesso ao treinamento expirado.
// Bloqueia área de membros principal (Lecciones, Comunidad, Funnels, etc)
// mas mantém acesso aos produtos premium comprados (Andrómeda, Analytics,
// Mini VSL, Creativos, Revisión, Bonus) — esses não vencem.

import Link from "next/link"
import { requireMiembrosAuth } from "../_lib/auth-server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

const WHATSAPP_URL =
  "https://wa.me/5547996812781?text=Hola,%20mi%20acceso%20al%20treinamento%20de%20Copy%20Films%20vencio.%20Quiero%20renovar."

async function getOwnedProductsForUser(userId: string): Promise<string[]> {
  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from("stripe_sales")
    .select("items")
    .eq("user_id", userId)
    .eq("status", "paid")
  if (!data) return []
  const PRODUCT_KEYS = new Set(["creativos", "andromeda", "analytics", "revisao", "minivsl"])
  const owned = new Set<string>()
  for (const row of data) {
    const items = (row.items as Array<{ key?: string }>) || []
    for (const it of items) {
      if (!it?.key) continue
      const clean = it.key.replace(/__downsell$/, "")
      if (PRODUCT_KEYS.has(clean)) owned.add(clean)
    }
  }
  return Array.from(owned)
}

export default async function AccesoVencidoPage() {
  const { user } = await requireMiembrosAuth()
  const ownedProducts = user ? await getOwnedProductsForUser(user.id) : []

  return (
    <main className="min-h-dvh bg-[#0a0a0f] text-[#f5f5f7]">
      {/* Background gradient sutil */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 1200px 800px at 70% -10%, rgba(127,29,29,0.12), transparent 60%), " +
            "radial-gradient(ellipse 900px 600px at 0% 100%, rgba(201,169,97,0.06), transparent 55%), " +
            "linear-gradient(180deg, #0a0a0f 0%, #0c0c12 50%, #0a0a0f 100%)",
        }}
      />

      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-6 py-16">
        <div
          className="relative w-full overflow-hidden border border-[#2a2a36] bg-gradient-to-br from-[#12121a] via-[#0f0f17] to-[#12121a] px-6 py-10 sm:px-12 sm:py-14"
          style={{ boxShadow: "0 30px 80px -40px rgba(127,29,29,0.4), inset 0 1px 0 rgba(201,169,97,0.08)" }}
        >
          {/* Cantos decorativos vermelhos */}
          <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-red-900" />
          <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-red-900" />
          <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-red-900" />
          <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-red-900" />

          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-red-900 [font-family:var(--font-geist-sans)]">
              Acceso al treinamento
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-[#f5f5f7] [font-family:var(--font-cinzel)] sm:text-5xl">
              Tu acceso ha <span className="text-red-900">vencido.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#d4d4d8] [font-family:var(--font-geist-sans)]">
              El acceso al área de membros principal (Inicio, Lecciones, Comunidad, Funnels)
              tiene validez de 1 año desde la compra. Para continuar accediendo, renueva
              hablando con nuestro equipo.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center gap-3 border border-[#c9a961] bg-[#c9a961] px-8 py-4 text-[#0a0a0f] transition-colors duration-300 hover:border-red-900 hover:bg-red-900 hover:text-[#f5f5f7]"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.3em] [font-family:var(--font-geist-sans)]">
                  Renovar por WhatsApp
                </span>
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#25D366] shadow-[0_0_8px_rgba(37,211,102,0.6)]" />
              </a>
            </div>
          </div>
        </div>

        {/* Produtos premium que continuam acessíveis */}
        {ownedProducts.length > 0 && (
          <div className="mt-12 w-full">
            <p className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.4em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
              Tus productos premium siguen disponibles
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {ownedProducts.map((key) => {
                const link = PRODUCT_LINKS[key]
                if (!link) return null
                return (
                  <Link
                    key={key}
                    href={link.url}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className="group flex items-center justify-between border border-[#1a1a24] bg-[#12121a]/40 px-5 py-4 transition-colors hover:border-[#c9a961]/40 hover:bg-[#1a1320]/40"
                  >
                    <span className="text-sm text-[#f5f5f7] [font-family:var(--font-geist-sans)]">
                      {link.name}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
                      {link.cta} →
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Logout */}
        <form action="/api/auth/signout" method="post" className="mt-10">
          <button
            type="submit"
            className="text-[10px] uppercase tracking-[0.3em] text-[#6a6a7a] hover:text-[#f5f5f7] [font-family:var(--font-geist-sans)]"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  )
}

const PRODUCT_LINKS: Record<string, { name: string; url: string; cta: string; external: boolean }> = {
  creativos: { name: "Creativos.AI", url: "https://chatgpt.com/g/SEU_GPT_CREATIVOS_ID", cta: "Abrir GPT", external: true },
  minivsl: { name: "Agente Mini VSL's", url: "https://chatgpt.com/g/SEU_GPT_MINIVSL_ID", cta: "Abrir GPT", external: true },
  andromeda: { name: "Andrómeda.ADS", url: "/miembros/producto/andromeda", cta: "Acceder", external: false },
  analytics: { name: "Analytics.KPI", url: "/miembros/producto/analytics", cta: "Acceder", external: false },
  revisao: { name: "Revisión de Embudo", url: "/miembros/producto/revisao", cta: "Acceder", external: false },
}
