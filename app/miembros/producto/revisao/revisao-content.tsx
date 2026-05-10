"use client"

// Conteúdo entregável da Revisión de Embudo. Mostra checklist do que o
// cliente deve enviar pelo WhatsApp + descrição do que ele recebe em troca.
// Acessado via /miembros/producto/revisao por quem comprou (PRODUCT_LINK_BY_NAME).

import { useEffect, useRef, useState } from "react"
import { CheckCircle2 } from "lucide-react"

const WHATSAPP_URL =
  "https://wa.me/5547996812781?text=Hola,%20soy%20miembro%20y%20ya%20tengo%20mi%20proyecto%20listo.%20Quiero%20enviar%20los%20materiales%20para%20la%20Revisi%C3%B3n%20de%20Embudo."

const REQUIRED_ITEMS = [
  {
    title: "El sitio web de tu proyecto",
    sub: "TOTALMENTE LISTO",
    body: "Tu embudo construido y funcionando — checkout, copy, audiovisual, todo conectado.",
  },
  {
    title: "El prompt del Agente Estratega",
    sub: "Personalización",
    body: "El prompt completo que utilizaste para construir la estrategia y narrativa de tu embudo.",
  },
  {
    title: "Las copys auditivas",
    sub: "Formato escrito",
    body: "Todas las copys de audio convertidas a texto — narrativa, ganchos, transiciones, CTA.",
  },
  {
    title: "Una breve explicación de tu producto",
    sub: "Contexto",
    body: "Qué es, para quién, cuál es el dolor que resuelve y cuál es la transformación prometida.",
  },
  {
    title: "El precio de tu producto",
    sub: "Posicionamiento",
    body: "El valor final del producto — front, bumps y upsells si aplica.",
  },
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
      { threshold },
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

export function RevisaoContent() {
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
      {/* HERO */}
      <section className="relative px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 md:pt-32 lg:px-12 lg:pb-40">
        <div className="mx-auto max-w-6xl">
          <div style={hero(0)} className="mb-10 flex items-center gap-4 sm:mb-14">
            <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#a0a0b0] [font-family:var(--font-mono)]">
              Servicio Premium
            </span>
            <span className="h-px flex-1 max-w-24 bg-[#1a1a24]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#c9a961] [font-family:var(--font-mono)]">
              Copy Film&apos;s
            </span>
          </div>

          <h1
            style={hero(120)}
            className="text-[clamp(3.25rem,12vw,11rem)] font-bold leading-[0.85] tracking-[-0.02em] text-[#f5f5f7] [font-family:var(--font-display)]"
          >
            Revisión
            <br />
            <span className="text-red-900">de Embudo.</span>
          </h1>

          <p
            style={hero(280)}
            className="mt-12 max-w-2xl text-lg leading-relaxed text-[#d4d4d8] [font-family:var(--font-body)] sm:text-xl md:text-2xl"
          >
            Análisis riguroso y profundo de toda la estructura de tu embudo.
            Estrategia, narrativa, lógica de conversión y puntos de fuga.
          </p>

          <div style={hero(440)} className="mt-12 h-[2px] w-24 bg-red-900" />
        </div>
      </section>

      {/* CHECKLIST DE ENVIO */}
      <section className="border-t border-[#1a1a24]">
        <div className="mx-auto max-w-6xl px-6 lg:px-12">
          <Reveal>
            <div className="flex items-baseline gap-6 py-12 md:py-16">
              <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#c9a961] [font-family:var(--font-mono)]">
                I.
              </span>
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c9a961] [font-family:var(--font-mono)]">
                Lo que tienes que enviar
              </h2>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="pb-10 md:pb-14">
              <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-[-0.01em] text-[#f5f5f7] [font-family:var(--font-display)]">
                Una vez que finalices tu proyecto, envíalo al WhatsApp.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#a0a0b0] [font-family:var(--font-body)] md:text-lg">
                Para que el análisis sea preciso y entregue valor real, necesitamos
                acceso completo al material listo. Sin atajos.
              </p>
            </div>
          </Reveal>

          <div className="border-t border-[#1a1a24]">
            {REQUIRED_ITEMS.map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <div className="grid grid-cols-12 gap-x-4 gap-y-3 border-b border-[#1a1a24] py-8 md:py-10">
                  <div className="col-span-12 flex items-center gap-3 md:col-span-1">
                    <CheckCircle2 size={20} className="text-red-900" strokeWidth={2} />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#6a6a7a] [font-family:var(--font-mono)] md:hidden">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <h3 className="text-xl font-bold text-[#f5f5f7] [font-family:var(--font-display)] md:text-2xl">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-red-900 [font-family:var(--font-mono)]">
                      {item.sub}
                    </p>
                  </div>
                  <p className="col-span-12 max-w-[60ch] text-base leading-relaxed text-[#a0a0b0] [font-family:var(--font-body)] md:col-span-7">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* O QUE VAI RECEBER */}
      <section className="border-t border-[#1a1a24] bg-[#12121a]">
        <div className="mx-auto max-w-6xl px-6 lg:px-12">
          <Reveal>
            <div className="flex items-baseline gap-6 py-12 md:py-16">
              <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#c9a961] [font-family:var(--font-mono)]">
                II.
              </span>
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c9a961] [font-family:var(--font-mono)]">
                Lo que vas a recibir
              </h2>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="pb-16 md:pb-20">
              <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-[-0.01em] text-[#f5f5f7] [font-family:var(--font-display)]">
                Análisis riguroso, ajustes precisos, recomendaciones estratégicas.
              </h2>
              <p className="mt-8 max-w-3xl text-base leading-relaxed text-[#a0a0b0] [font-family:var(--font-body)] md:text-lg">
                Con base en el material enviado, evaluamos toda la estructura del embudo:
                la estrategia, la narrativa, la lógica de conversión y los posibles puntos
                de fuga. A continuación recibirás orientaciones claras, ajustes precisos
                y recomendaciones estratégicas para elevar el rendimiento, la claridad
                y los resultados de tu proyecto.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA WHATSAPP */}
      <section className="relative border-t border-[#1a1a24] bg-[#12121a] py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-12">
          <Reveal>
            <div className="mb-12 flex items-baseline gap-6 md:mb-16">
              <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#c9a961] [font-family:var(--font-mono)]">
                III.
              </span>
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c9a961] [font-family:var(--font-mono)]">
                Enviar materiales
              </h2>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <p className="mb-12 max-w-2xl text-base leading-relaxed text-[#d4d4d8] [font-family:var(--font-body)] md:text-lg">
              Cuando tengas todo listo según el checklist arriba, mandalo todo por
              WhatsApp en un único mensaje. Comenzamos el análisis en cuanto el material
              llegue completo.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-4 border border-[#c9a961] bg-[#c9a961] px-8 py-5 text-[#0a0a0f] transition-colors duration-300 hover:border-red-900 hover:bg-red-900 hover:text-[#f5f5f7] sm:px-12 sm:py-6"
            >
              <span className="text-sm font-semibold uppercase tracking-[0.3em] [font-family:var(--font-mono)] sm:text-base">
                Enviar por WhatsApp
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
            <p className="mt-12 max-w-md text-xs leading-relaxed text-[#6a6a7a] [font-family:var(--font-body)] md:mt-16">
              Tiempo estimado de análisis: hasta 7 días hábiles desde la recepción
              del material completo.
            </p>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
