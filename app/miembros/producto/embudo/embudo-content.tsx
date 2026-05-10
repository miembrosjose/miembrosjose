"use client"

import { useEffect, useRef, useState } from "react"

const WHATSAPP_URL =
  "https://wa.me/5547996812781?text=Hola,%20soy%20miembro%20de%20la%20comunidad%20y%20quiero%20delegar%20la%20creaci%C3%B3n%20de%20mi%20embudo%20gamificado%20al%20equipo%20de%20Copy%20Films.%20%C2%BFPodemos%20hablar%20sobre%20c%C3%B3mo%20funciona?"

const DELIVERABLES = [
  {
    n: "01",
    title: "Avatar",
    eyebrow: "Identidad",
    body:
      "Persona estratégica que actúa como rostro y firma del proyecto. Identificación, confianza y autoridad construidas por diseño, no por casualidad.",
  },
  {
    n: "02",
    title: "Copy",
    eyebrow: "Narrativa",
    body:
      "Guion completo del embudo. Cada frase calibrada para llevar al lead del primer impacto a la decisión, sin rodeos ni adornos.",
  },
  {
    n: "03",
    title: "Audiovisual",
    eyebrow: "Producción",
    body:
      "Producción y edición desde cero, alineadas al branding. Estética cinematográfica, ritmo de retención, foco quirúrgico en conversión.",
  },
  {
    n: "04",
    title: "Landing",
    eyebrow: "Cierre",
    body:
      "Página exclusiva, escrita y construida a la medida. Coherencia total con la narrativa, claridad absoluta en el momento de la decisión.",
  },
]

const BONUS_ITEMS = [
  { title: "Seguimiento Avanzado", sub: "GTM + Meta Ads", body: "Estructura de eventos optimizada para Meta Ads. Datos limpios para el píxel, menor costo por adquisición." },
  { title: "Métricas Avanzadas", sub: "KPIs + Webhooks", body: "Integración directa a Meta Ads y pasarela de pagos. Datos precisos para decisiones basadas en ganancia real." },
  { title: "Dashboard Rayos X", sub: "Mapas de calor + Grabaciones", body: "Sesiones reales, fricciones identificadas, oportunidades visibles en tiempo real." },
  { title: "Optimización Activa", sub: "Primeros 30 días", body: "Acompañamiento estratégico con ajustes basados en datos reales del embudo en funcionamiento." },
  { title: "Recuperación de Ventas", sub: "WhatsApp + Email", body: "Sistema que captura, almacena y reactiva leads automáticamente. Carritos abandonados convertidos en ventas." },
  { title: "Hosting Premium", sub: "Velocidad y Seguridad", body: "Carga ultrarrápida y estabilidad máxima. Una experiencia fluida es una venta más." },
  { title: "Transferencia del Proyecto", sub: "Tu Propiedad", body: "Control total. Edición, evolución y escala continúan en tus manos." },
]

function useFadeIn(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useFadeIn()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  )
}

export function EmbudoServiceContent() {
  const [heroVisible, setHeroVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  const hero = (delay: number) => ({
    opacity: heroVisible ? 1 : 0,
    transform: heroVisible ? "translateY(0)" : "translateY(16px)",
    transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 1s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  })

  return (
    <main className="overflow-x-hidden bg-[#0a0a0f]">
      <a
        href="/"
        aria-label="Cerrar"
        className="fixed right-4 top-16 z-50 flex h-9 w-9 items-center justify-center border border-[#1a1a24] bg-[#0a0a0f]/95 text-[#a0a0b0] backdrop-blur-sm transition-colors hover:border-red-900 hover:bg-red-900 hover:text-[#f5f5f7] sm:right-6 sm:top-16 sm:h-10 sm:w-10"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        </svg>
      </a>

      {/* HERO */}
      <section className="relative px-6 pt-20 pb-32 sm:pt-28 sm:pb-40 md:pt-32 lg:px-12 lg:pb-48">
        <div className="mx-auto max-w-6xl">
          <div style={hero(0)} className="mb-10 flex items-center gap-4 sm:mb-14">
            <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
              Servicio
            </span>
            <span className="h-px flex-1 max-w-24 bg-[#1a1a24]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
              [BRAND_NAME]
            </span>
          </div>

          <h1
            style={hero(120)}
            className="text-[clamp(3.25rem,12vw,11rem)] font-bold leading-[0.85] tracking-[-0.02em] text-[#f5f5f7] [font-family:var(--font-cinzel)]"
          >
            Embudo
            <br />
            <span className="text-red-900">Gamificado.</span>
          </h1>

          <p
            style={hero(280)}
            className="mt-12 max-w-2xl text-lg leading-relaxed text-[#d4d4d8] [font-family:var(--font-geist-sans)] sm:text-xl md:text-2xl"
          >
            Producción completa del embudo de tu producto. Diseño, copy, audiovisual,
            tracking y la máquina de escala lista para correr.
          </p>

          <div style={hero(440)} className="mt-16 h-[2px] w-24 bg-red-900" />

          <p
            style={hero(560)}
            className="mt-6 max-w-md text-sm leading-relaxed text-[#6a6a7a] [font-family:var(--font-geist-sans)]"
          >
            Servicio cerrado. Cupos por mes contados. Para operadores que ya saben
            que delegar la producción es lo que mueve la aguja.
          </p>
        </div>
      </section>

      {/* DELIVERABLES */}
      <section className="border-t border-[#1a1a24]">
        <div className="mx-auto max-w-6xl px-6 lg:px-12">
          <Reveal>
            <div className="flex items-baseline gap-6 py-12 md:py-16">
              <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
                I.
              </span>
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
                Lo que se entrega
              </h2>
            </div>
          </Reveal>

          <div>
            {DELIVERABLES.map((item, i) => (
              <Reveal key={item.n} delay={i * 80}>
                <article className="grid grid-cols-12 gap-x-4 gap-y-6 border-t border-[#1a1a24] py-12 md:py-16 lg:py-20">
                  <div className="col-span-12 md:col-span-4 lg:col-span-3">
                    <span className="block text-[clamp(4rem,10vw,7.5rem)] font-bold leading-[0.85] text-red-900/90 [font-family:var(--font-cinzel)]">
                      {item.n}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-8 lg:col-span-9 lg:max-w-2xl">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
                      {item.eyebrow}
                    </p>
                    <h3 className="mb-5 text-3xl font-bold leading-tight text-[#f5f5f7] [font-family:var(--font-cinzel)] sm:text-4xl md:text-5xl">
                      {item.title}
                    </h3>
                    <p className="max-w-[65ch] text-base leading-relaxed text-[#a0a0b0] [font-family:var(--font-geist-sans)] sm:text-lg">
                      {item.body}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* MÁQUINA DE ESCALA */}
      <section className="border-t border-[#1a1a24] bg-[#12121a]">
        <div className="mx-auto max-w-6xl px-6 lg:px-12">
          <Reveal>
            <div className="flex items-baseline gap-6 py-12 md:py-16">
              <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
                II.
              </span>
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
                Incluido en el proyecto
              </h2>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="pb-16 md:pb-20">
              <h2 className="text-[clamp(2.5rem,7vw,6rem)] font-bold leading-[0.9] tracking-[-0.01em] text-[#f5f5f7] [font-family:var(--font-cinzel)]">
                La <span className="text-red-900">máquina</span>
                <br />
                de escala.
              </h2>
              <p className="mt-8 max-w-xl text-base leading-relaxed text-[#a0a0b0] [font-family:var(--font-geist-sans)] md:text-lg">
                No es solo un embudo. Es toda la infraestructura de backend lista,
                medida y preparada para que escalar sea una decisión, no un
                proyecto nuevo.
              </p>
            </div>
          </Reveal>

          <div className="border-t border-[#1a1a24]">
            {BONUS_ITEMS.map((item, i) => (
              <Reveal key={item.title} delay={i * 50}>
                <div className="grid grid-cols-12 gap-x-4 gap-y-3 border-b border-[#1a1a24] py-8 md:py-10">
                  <div className="col-span-12 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#6a6a7a] [font-family:var(--font-geist-sans)] md:col-span-1">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <h3 className="text-xl font-bold text-[#f5f5f7] [font-family:var(--font-cinzel)] md:text-2xl">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-red-900 [font-family:var(--font-geist-sans)]">
                      {item.sub}
                    </p>
                  </div>
                  <p className="col-span-12 max-w-[65ch] text-base leading-relaxed text-[#a0a0b0] [font-family:var(--font-geist-sans)] md:col-span-7">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={BONUS_ITEMS.length * 50}>
            <div className="grid grid-cols-12 gap-4 py-16 md:py-24">
              <div className="col-span-12 text-[10px] font-semibold uppercase tracking-[0.4em] text-[#c9a961] [font-family:var(--font-geist-sans)] md:col-span-4">
                Entrega completa
              </div>
              <div className="col-span-12 flex items-baseline gap-6 md:col-span-8">
                <span className="text-[clamp(5rem,15vw,11rem)] font-bold leading-[0.85] text-[#f5f5f7] [font-family:var(--font-cinzel)]">
                  30
                </span>
                <span className="text-2xl font-bold text-red-900 [font-family:var(--font-cinzel)] md:text-3xl">
                  días.
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* INVERSIÓN + CTA */}
      <section className="relative border-t border-[#1a1a24] bg-[#12121a] py-24 md:py-36">
        <div className="mx-auto max-w-6xl px-6 lg:px-12">
          <Reveal>
            <div className="mb-12 flex items-baseline gap-6 md:mb-16">
              <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
                III.
              </span>
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
                Inversión
              </h2>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="mb-16 md:mb-20">
              <div className="flex items-baseline gap-3 sm:gap-5">
                <span className="text-3xl font-bold text-[#a0a0b0] [font-family:var(--font-cinzel)] sm:text-4xl md:text-5xl">
                  US$
                </span>
                <span className="text-[clamp(5rem,18vw,14rem)] font-bold leading-[0.85] tracking-[-0.03em] text-[#f5f5f7] [font-family:var(--font-cinzel)]">
                  2.999
                </span>
              </div>
              <p className="mt-8 max-w-md text-sm leading-relaxed text-[#a0a0b0] [font-family:var(--font-geist-sans)] md:text-base">
                Pago anticipado tras confirmación del pedido. Asegura el cupo en la
                agenda de producción del mes.
              </p>
            </div>
          </Reveal>

          <Reveal delay={240}>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-4 border border-[#c9a961] bg-[#c9a961] px-8 py-5 text-[#0a0a0f] transition-colors duration-300 hover:border-red-900 hover:bg-red-900 hover:text-[#f5f5f7] sm:px-12 sm:py-6"
            >
              <span className="text-sm font-semibold uppercase tracking-[0.3em] [font-family:var(--font-geist-sans)] sm:text-base">
                Hablar por WhatsApp
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-1"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
              </svg>
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#25D366] shadow-[0_0_8px_rgba(37,211,102,0.6)]" />
            </a>
          </Reveal>

          <Reveal delay={400}>
            <p className="mt-16 max-w-md text-xs leading-relaxed text-[#6a6a7a] [font-family:var(--font-geist-sans)] md:mt-24">
              Conversación directa con el equipo. Si encaja, avanzamos. Si no, te
              decimos derecho.
            </p>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
