"use client"

import { useEffect, useState } from "react"

type Section = { id: string; label: string; phase?: string }

const SECTIONS: Section[] = [
  { id: "vision",       label: "Visión general" },
  { id: "fase-1-1",     label: "Fase 1.1 · Configuración de la Campaña", phase: "FASE 1" },
  { id: "abo-cbo",      label: "1.1 ABO o CBO" },
  { id: "presupuesto",  label: "1.2 Presupuesto Total" },
  { id: "fase-1-2",     label: "Fase 1.2 · Conjunto de Anuncios", phase: "FASE 1" },
  { id: "publico",      label: "2.1 Público (Advantage+)" },
  { id: "posicionamientos", label: "2.2 Posicionamientos" },
  { id: "fase-1-3",     label: "Fase 1.3 · Anuncios de Prueba", phase: "FASE 1" },
  { id: "marketing-raiz", label: "3.1 Marketing de Raíz" },
  { id: "anuncios-prueba", label: "3.2 Regla 1-1-X" },
  { id: "fase-2",       label: "Fase 2 · Validación de Creativos", phase: "FASE 2" },
  { id: "pausar",       label: "2.1 Para pausar" },
  { id: "validar",      label: "2.2 Para validar" },
  { id: "aislamiento",  label: "2.3 Aislamiento Inteligente" },
  { id: "escalado",     label: "Escalado progresivo" },
]

export function AndromedaContent() {
  const [active, setActive] = useState<string>("vision")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id)
        })
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative w-full overflow-hidden">
      {/* Background — gradiente radial dourado sutil + ruído sutil pra
          quebrar o preto chapado e dar profundidade cinematográfica. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 1200px 800px at 70% -10%, rgba(201,169,97,0.06), transparent 60%), " +
            "radial-gradient(ellipse 900px 600px at 0% 100%, rgba(127,29,29,0.05), transparent 55%), " +
            "linear-gradient(180deg, #0a0a0f 0%, #0c0c12 50%, #0a0a0f 100%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
        <a
          href="/"
          aria-label="Cerrar"
          className="fixed right-4 top-16 z-50 flex h-9 w-9 items-center justify-center border border-[#2a2a36] bg-[#12121a]/90 text-[#a0a0b0] backdrop-blur-md transition-colors hover:border-red-900 hover:bg-red-900 hover:text-[#f5f5f7] sm:right-6 sm:top-16 sm:h-10 sm:w-10"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
          </svg>
        </a>

        {/* Header — moldura cinematográfica com gradiente vermelho-dourado */}
        <header
          className="relative mb-20 overflow-hidden border border-[#2a2a36] bg-gradient-to-br from-[#12121a] via-[#0f0f17] to-[#12121a] px-6 py-12 sm:px-12 sm:py-16"
          style={{ boxShadow: "0 30px 80px -40px rgba(127,29,29,0.4), inset 0 1px 0 rgba(201,169,97,0.08)" }}
        >
          {/* Cantos decorativos dourados */}
          <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-[#c9a961]" />
          <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-[#c9a961]" />
          <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-[#c9a961]" />
          <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-[#c9a961]" />
          {/* Glow lateral dourado */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(201,169,97,0.25), transparent 70%)" }}
          />

          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#c9a961]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
                Producto · Estrategia Premium
              </p>
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-[0.95] tracking-tight text-[#f5f5f7] [font-family:var(--font-cinzel)] sm:text-6xl">
              Andrómeda<span className="text-red-900">.ADS</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#d4d4d8] [font-family:var(--font-geist-sans)] sm:text-lg">
              El método completo para operar Meta Ads en la era de la IA. Eliminar el desperdicio de
              presupuesto, validar creativos com criterio matemático y escalar com seguridad.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.3em] [font-family:var(--font-geist-sans)]">
              <span className="border border-[#c9a961] bg-gradient-to-br from-[#c9a961]/15 to-transparent px-4 py-2 text-[#c9a961] shadow-[0_0_20px_-10px_rgba(201,169,97,0.6)]">
                Probar com inteligencia
              </span>
              <span className="border border-[#3a3a4a] bg-[#1a1a24]/60 px-4 py-2 text-[#d4d4d8]">
                Validar com criterio
              </span>
              <span className="border border-[#3a3a4a] bg-[#1a1a24]/60 px-4 py-2 text-[#d4d4d8]">
                Escalar com seguridad
              </span>
            </div>
          </div>
        </header>

      <div className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Sidebar nav */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1 text-sm">
            {SECTIONS.map((s) => {
              const isActive = active === s.id
              const isPhase = !!s.phase
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`block border-l-2 px-3 py-1.5 transition-colors [font-family:var(--font-geist-sans)] ${
                    isActive
                      ? "border-red-900 bg-red-900/10 text-[#f5f5f7]"
                      : isPhase
                      ? "mt-4 border-[#c9a961] text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c9a961]"
                      : "border-[#1a1a24] text-[11px] text-[#a0a0b0] hover:border-[#3a3a45] hover:text-[#f5f5f7]"
                  }`}
                >
                  {s.label}
                </a>
              )
            })}
          </nav>
        </aside>

        <main className="space-y-12 text-[15px] leading-[1.85] text-[#d4d4d8] [font-family:var(--font-geist-sans)] sm:space-y-16">
          {/* === VISIÓN GENERAL === */}
          <Section id="vision" title="Visión general del método">
            <P>
              Este método fue desarrollado con un único objetivo:{" "}
              <Strong>eliminar el desperdicio de presupuesto publicitario</Strong> y acelerar al
              máximo el proceso de encontrar creativos ganadores que realmente conviertan. Está
              construido sobre tres pilares fundamentales —{" "}
              <Highlight>probar com inteligencia, validar com criterio y escalar com seguridad</Highlight>.
            </P>
            <P>
              Toda la estructura gira en torno a un principio simple: dejar que el algoritmo de
              Facebook trabaje de la forma más libre y eficiente posible, mientras tú, como gestor,
              tomas decisiones basadas en <Strong>datos reales — no en suposiciones</Strong>.
            </P>
          </Section>

          {/* === FASE 1.1 === */}
          <PhaseHeader number="Fase 1.1" title="Configuración de la Campaña de Pruebas" id="fase-1-1" />

          {/* 1.1 ABO o CBO */}
          <Section id="abo-cbo" title="1.1 ¿Uso ABO o CBO en mis campañas?" subtitle="La famosa pregunta…">
            <P>Para contextualizar, por si aún no lo sabes:</P>
            <P>
              <Strong>ABO</Strong> significa asignar el presupuesto a nivel de conjunto de anuncios,
              mientras que <Strong>CBO</Strong> significa asignar el presupuesto a nivel de campaña.
            </P>
            <P>Dicho de otra forma:</P>
            <ul className="space-y-2 pl-1">
              <li className="flex gap-2">
                <span className="text-red-500">●</span>
                <span><Strong>ABO:</Strong> es decir &quot;quiero forzar que el presupuesto se gaste en conjuntos específicos&quot;.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-500">●</span>
                <span><Strong>CBO:</Strong> es decir &quot;quiero dejar que el algoritmo decida en qué conjuntos asignar el presupuesto&quot;.</span>
              </li>
            </ul>
            <P>
              Hasta hace algunos años yo era un gran defensor del <Strong>ABO</Strong>. Principalmente
              para probar nuevos públicos o creativos. Y aún más cuando hacíamos remarketing.
            </P>
            <P>
              El problema es que las cosas <Strong>ya no funcionan así</Strong>. Y desde hace tiempo.
            </P>
            <P>
              Desde <Strong>2018</Strong> el algoritmo de Facebook cambió profundamente. Y sigue
              evolucionando y volviéndose cada vez más inteligente, gracias a su{" "}
              <Strong>IA (Inteligencia Artificial)</Strong>, al <Strong>machine learning</Strong> y a
              miles de millones de datos acumulados.
            </P>
            <P>
              Hoy en día, <Strong>ya no existe espacio para usar ABO</Strong> al ejecutar campañas en
              Meta Ads. Estamos en la era de la IA.
            </P>
            <Conclusion>
              A partir de ahora, utiliza <Strong>solo CBO</Strong> en cualquier campaña que ejecutes. 🚀
            </Conclusion>
          </Section>

          {/* 1.2 Presupuesto Total */}
          <Section
            id="presupuesto"
            title="1.2 Presupuesto Total"
            subtitle="+ Eficiencia · − Desperdicio · + Rentabilidad"
          >
            <P>
              La elección del <Strong>presupuesto total</Strong> (en lugar del presupuesto diario) no
              es aleatoria — es una decisión estratégica que cambia completamente cómo Facebook
              distribuye tu dinero.
            </P>
            <Box tone="red">
              <Strong className="text-red-400">Presupuesto diario:</Strong> Fuerzas al algoritmo a
              gastar una cantidad fija todos los días, independientemente de las condiciones de la
              subasta, del comportamiento del público o del día de la semana.
            </Box>
            <Box tone="green">
              <Strong className="text-green-400">Presupuesto total:</Strong> Le dices a Facebook:
              &quot;aquí tienes X cantidad para 30 días — úsala con inteligencia&quot;.
            </Box>
            <P>
              El algoritmo pasa a identificar <Strong>patrones de rendimiento</Strong>: mapea los días
              y horarios exactos en los que tu público más convierte y entiende cuándo la subasta
              está más cara. Distribuye el presupuesto estratégicamente en esas ventanas de
              oportunidad.
            </P>
            <FormulaCard
              title="Fórmula del presupuesto total"
              formula="[ Inversión diaria deseada ] × [ 30 días ] = [ Presupuesto total ]"
              note="Define siempre tu presupuesto para 30 días en tu conjunto de anuncios."
              example="$ 100/día × 30 = $ 3.000 de presupuesto total"
            />
            <Conclusion>
              A partir de ahora, utiliza <Strong>solo Presupuesto Total</Strong> en cualquier campaña
              que ejecutes. 🚀
            </Conclusion>
          </Section>

          {/* === FASE 1.2 === */}
          <PhaseHeader number="Fase 1.2" title="Configuración del Conjunto de Anuncios" id="fase-1-2" />

          {/* 2.1 Público */}
          <Section id="publico" title="2.1 Público" subtitle="¿Cuál es el mejor público en Meta Ads?">
            <P>
              La respuesta es la más simple posible. Tan poética como directa:{" "}
              <Highlight>Ninguno.</Highlight>
            </P>
            <P>
              No utilizas <Strong>ningún</Strong> público. Punto final. Se estima que cerca del{" "}
              <Strong>33 %</Strong> de los usuarios dentro de un &quot;público de intereses&quot; están ahí
              por error. Y aunque un usuario tenga &quot;interés&quot; en un tema, eso no equivale a tener
              intención de compra.
            </P>
            <ConsciousnessChart />
            <P>
              <Strong>1. Totalmente Inconsciente:</Strong> El cliente no sabe que tiene un problema.
              La comunicación debe despertar curiosidad sin intentar vender.
            </P>
            <P>
              <Strong>2. Consciente del Problema:</Strong> Siente el dolor, pero no conoce la
              solución. El enfoque es mostrar empatía y ayudar a identificar la causa.
            </P>
            <P>
              <Strong>3. Consciente de la Solución:</Strong> Sabe que existen soluciones, pero no
              conoce tu producto. El enfoque es educar sobre tu método.
            </P>
            <P>
              <Strong>4. Consciente del Producto:</Strong> Conoce tu producto, pero tiene dudas o
              compara con otros. El enfoque es probar la calidad y eliminar objeciones.
            </P>
            <P>
              <Strong>5. Totalmente Consciente:</Strong> Ya quiere comprar, solo necesita un
              incentivo. El enfoque es hacer una oferta directa y facilitar el pago.
            </P>
            <P>
              En realidad, la mayoría está &quot;dormida&quot;, alrededor de <Strong>60 % en promedio</Strong>.
              Y aun las personas conscientes pueden no ser clasificadas correctamente por el
              algoritmo obsoleto.
            </P>
            <SubHeading>¿Y los públicos personalizados (remarketing)?</SubHeading>
            <P>
              Hoy ya no necesitas hacer remarketing manualmente creando campañas separadas para eso
              dentro de Meta. Una campaña que corre sin &quot;forzar&quot; una segmentación específica{" "}
              <Strong>ya está haciendo remarketing automático</Strong>.
            </P>
            <Box tone="gold">
              <Strong className="text-[#c9a961]">¿Dudas?</Strong> Mira la columna &quot;Frecuencia&quot; en
              tu Administrador de Anuncios: si el número es mayor que 1, entonces la campaña ya está
              haciendo remarketing automáticamente.
            </Box>
            <SubHeading>Lo que SÍ debes segmentar</SubHeading>
            <ul className="space-y-2 pl-1">
              <li className="flex items-center gap-2">
                <Check /> <span>Edad</span>
              </li>
              <li className="flex items-center gap-2">
                <Check /> <span>Género</span>
              </li>
              <li className="flex items-center gap-2">
                <Check /> <span>Ubicación</span>
              </li>
            </ul>
            <P>
              <Strong>Listo.</Strong> Eso es todo lo que necesitas segmentar. A esto se le llama{" "}
              <Strong>Público Advantage+</Strong>. Hoy en día, es el mejor público en Facebook Ads.
              Punto.
            </P>
          </Section>

          {/* 2.2 Posicionamientos */}
          <Section id="posicionamientos" title="2.2 Posicionamientos">
            <P>
              ¿Dónde deben aparecer tus anuncios? ¿Feed, Stories, Reels? ¿En qué dispositivos?
              ¿Solo Wi-Fi? La respuesta es brutalmente simple: <Strong>no toques nada</Strong>.
            </P>
            <P>
              Deja los <Strong>Posicionamientos Advantage+</Strong> activados y deja que la IA se
              encargue de eso. El algoritmo de Meta sabe exactamente dónde y cuándo mostrar tu
              creativo para extraer el máximo de conversiones.
            </P>
            <ManagerComparison />
            <Conclusion>
              A partir de ahora, utiliza <Strong>solo Público y Posicionamientos Advantage+</Strong>{" "}
              en cualquier conjunto de anuncios que ejecutes. 🚀
            </Conclusion>
          </Section>

          {/* === FASE 1.3 === */}
          <PhaseHeader number="Fase 1.3" title="Configuración de los Anuncios de Prueba" id="fase-1-3" />

          {/* 3.1 Marketing de Raíz */}
          <Section id="marketing-raiz" title="3.1 Esto es Marketing de Raíz">
            <P>Un fenómeno interesante está ocurriendo en el marketing a nivel mundial:</P>
            <P>
              Estamos siendo prácticamente <Strong>forzados a volver al marketing de raíz</Strong>.
              ¿Y qué es el marketing de raíz?
            </P>
            <P>
              Piensa en cómo se hacía marketing originalmente, en el siglo pasado. La serie{" "}
              <em>Mad Men</em> explica muy bien este proceso. Ejecutivos de grandes agencias tomando
              whisky y pensando profundamente en cómo crear:
            </P>
            <ul className="space-y-1 pl-4 italic text-[#a0a0b0]">
              <li>· un mensaje,</li>
              <li>· un ángulo,</li>
              <li>· un posicionamiento que impulsara las ventas de sus clientes.</li>
            </ul>
            <P>
              Iban directo al corazón del problema: <Strong>la copy</Strong>. El copywriting es
              marketing de raíz. Es el 80/20 que hace que los resultados sucedan (Principio de
              Pareto).
            </P>
            <SubHeading>Distracciones que NO mueven la aguja</SubHeading>
            <BoxList
              tone="red"
              items={[
                "ABO vs CBO",
                "Públicos por intereses",
                "Públicos LaL",
                "Públicos personalizados",
                "Posicionamientos manuales",
                "Wi-Fi activado o desactivado",
                "Móvil vs desktop",
                "Límites de costo / Límites de puja",
                "Diferentes métodos de escalado",
                "Duplicación de conjuntos",
                "Forzar que anuncios específicos gasten presupuesto",
              ]}
            />
            <SubHeading>Donde debes invertir el 90 % de tu tiempo</SubHeading>
            <BoxList
              tone="green"
              items={[
                "Probar diferentes ganchos",
                "Probar diferentes ángulos de venta",
                "Probar distintos niveles de conciencia del mercado",
                "Probar distintos niveles de sofisticación",
                "Probar diferentes tipos y formatos de creativos",
                "Probar diferentes headlines y disparadores en la landing",
                "Probar diferentes ofertas",
                "Probar diferentes embudos de venta",
              ]}
            />
          </Section>

          {/* 3.2 Anuncios de Prueba */}
          <Section id="anuncios-prueba" title="3.2 Los Anuncios de Prueba" subtitle="La regla 1-1-X">
            <P>
              Dentro del único conjunto de anuncios, subes todos los creativos que deseas probar. La
              regla de oro aquí es la <Strong>constancia del copy</Strong>:
            </P>
            <ul className="space-y-2 pl-1">
              <li className="flex items-start gap-2">
                <Check />
                <span>
                  <Strong>Mantienes todo igual:</Strong> Texto principal, título, descripción, CTA,
                  URL de destino, etc.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check />
                <span>
                  <Strong>Varías solo:</Strong> El creativo en sí. Imágenes estáticas, videos y
                  carruseles pueden ser mezclados.
                </span>
              </li>
            </ul>
            <P className="italic">
              Este aislamiento de variable es el corazón del método. Si cambias el copy junto con el
              creativo, nunca sabrás qué causó el resultado.
            </P>
            <Conclusion>
              <span className="block text-base">La Regla de la Estructura</span>
              <span className="mt-2 block text-3xl font-bold tracking-wider text-[#c9a961] [font-family:var(--font-cinzel)]">
                [ 1 · 1 · X ]
              </span>
              <span className="mt-3 block text-sm text-[#d4d4d8]">
                1 Campaña · 1 Conjunto · X Anuncios
              </span>
            </Conclusion>
            <CampaignTable />
            <ConjuntoTable />
            <AnunciosTable />
          </Section>

          {/* === FASE 2 === */}
          <PhaseHeader number="Fase 2" title="Validación de Creativos" id="fase-2" />

          {/* Intro Fase 2 */}
          <Section id="fase-2-intro" title="La métrica que importa: CPA">
            <P>
              Aquí es la etapa donde vas a acompañar las métricas, pero con una diferencia
              fundamental: <Strong>no estás analizando números por curiosidad, estás analizando
              para tomar decisiones que generan dinero</Strong>.
            </P>
            <P>
              Puedes tener un CTR alto, un CPC bajo y un CPM excelente y aun así estar operando con
              pérdidas. Lo que realmente valida un creativo es su capacidad de{" "}
              <Strong>generar ventas y el costo de esas ventas</Strong>.
            </P>
            <P>
              Por eso, la métrica central que debe guiar todas tus decisiones es el{" "}
              <Strong>CPA — Costo por Adquisición</Strong>.
            </P>
          </Section>

          {/* 2.1 Pausar */}
          <Section id="pausar" title="2.1 Para pausar un creativo">
            <P>
              El criterio es simple: si ya alcanzó un costo por adquisición{" "}
              <Strong>igual o mayor que el valor del ticket</Strong> de tu producto principal, debe
              ser detenido. (No se consideran order bumps, upsells ni ningún otro valor adicional
              del embudo). <em>Solo el front.</em>
            </P>
            <Box tone="red">
              Si alcanzó el CPA del ticket, ese creativo ya demostró que no es sostenible.{" "}
              <Strong>Debe pausarse sin apego, sin justificaciones y sin expectativas de mejora.</Strong>
            </Box>
          </Section>

          {/* 2.2 Validar */}
          <Section id="validar" title="2.2 Para validar un creativo">
            <P>
              Cuando alcanza al menos <Strong>3 ventas</Strong> y mantiene un CPA por debajo del
              valor del ticket, existe evidencia suficiente de que funciona. En ese momento deja de
              ser una prueba y pasa a ser un <Strong>activo</Strong>.
            </P>
          </Section>

          {/* 2.3 Aislamiento */}
          <Section id="aislamiento" title="2.3 Aislamiento Inteligente" subtitle="Tres pasos consecutivos">
            <Step number="2.3.1" title="Pausa los demás anuncios">
              Cuando un creativo alcanza el criterio mínimo de validación, pausa <Strong>todos los
              demás anuncios</Strong> del conjunto y mantén únicamente el creativo validado activo.
              Esto garantiza que todo el presupuesto restante se concentre en lo que ya está
              generando resultados.
            </Step>
            <ValidationTable />
            <Step number="2.3.2" title="Duplica la campaña">
              Duplica toda la campaña, creando un nuevo entorno de prueba con las{" "}
              <Strong>mismas configuraciones, misma estructura y mismo presupuesto total</Strong>,
              cambiando únicamente la fecha para los próximos 30 días. No se modifica nada, solo se
              replica.
            </Step>
            <Step number="2.3.3" title="Elimina el creativo validado de la duplicada">
              En la campaña duplicada, elimina el creativo que acabas de validar. Esto mantiene el
              entorno limpio para que los demás creativos sigan siendo testeados sin interferencia.
            </Step>
            <DuplicatedTable />
            <P className="italic">
              Con esto, pasas a operar con <Strong className="not-italic">dos entornos paralelos</Strong>:
              la campaña original escala el creativo ganador, mientras la duplicada continúa
              probando nuevos creativos.
            </P>
          </Section>

          {/* Escalado */}
          <Section id="escalado" title="Escalado progresivo del presupuesto">
            <P>
              Si el creativo aislado sigue funcionando bien, <Strong>aumenta el presupuesto</Strong>.
              Sin apegarte a reglas rígidas ni fórmulas inventadas. Si la campaña estaba con $3.000
              para 30 días, puedes subir a $5.000, luego $8.000, y así sucesivamente.
            </P>
            <Box tone="gold">
              <Strong className="text-[#c9a961]">📌 Importante al aumentar:</Strong> Suma el nuevo
              monto al ya gastado y ajusta la fecha de finalización para mantener la estructura de
              30 días.
            </Box>
            <FormulaCard
              title="Ejemplo práctico"
              formula="$3.000 (gastó $500 en 5 días) → quieres aumentar a $6.000 ($200/día)"
              note="Debes extender la campaña hasta el día 5 del próximo mes, con presupuesto de $6.500."
              example=""
            />
            <SubHeading>Cuándo proteger las ganancias</SubHeading>
            <P>
              Si tu creativo empezó vendiendo bien, pero perdió fuerza y el CPA comenzó a subir,
              debes actuar antes de que alcance el límite del ticket. Si ya está cerca del 80 % del
              valor de tu producto principal, es señal de alerta. <Strong>La decisión correcta es
              pausar.</Strong>
            </P>
            <Conclusion>
              <span className="block text-lg">La lógica es simple:</span>
              <span className="mt-2 block text-2xl font-bold text-[#c9a961] [font-family:var(--font-cinzel)]">
                Repetir el proceso constantemente
              </span>
              <span className="mt-3 block text-sm text-[#d4d4d8]">
                Siempre probando nuevos creativos y aumentando el volumen de campañas validadas.
              </span>
            </Conclusion>
          </Section>

          {/* Footer */}
          <footer
            className="relative mt-16 overflow-hidden border border-[#2a2a36] bg-gradient-to-r from-[#12121a] via-[#0f0f17] to-[#12121a] px-6 py-8 text-center"
            style={{ boxShadow: "inset 0 1px 0 rgba(201,169,97,0.06)" }}
          >
            <span className="pointer-events-none absolute left-0 top-0 h-2 w-2 border-l-2 border-t-2 border-[#c9a961]" />
            <span className="pointer-events-none absolute right-0 top-0 h-2 w-2 border-r-2 border-t-2 border-[#c9a961]" />
            <span className="pointer-events-none absolute bottom-0 left-0 h-2 w-2 border-b-2 border-l-2 border-[#c9a961]" />
            <span className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 border-b-2 border-r-2 border-[#c9a961]" />
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
              Andrómeda<span className="text-red-900">.ADS</span> · Copy Film&apos;s
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
              Estrategia validada en producción
            </p>
          </footer>
        </main>
      </div>
      </div>
    </div>
  )
}

// ─── COMPONENTES INTERNOS ──────────────────────────────────────────────────

function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={className}>{children}</p>
}

function Strong({ children, className }: { children: React.ReactNode; className?: string }) {
  return <strong className={`font-semibold text-[#f5f5f7] ${className || ""}`}>{children}</strong>
}

function Highlight({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-[#c9a961]">{children}</span>
}

function Check() {
  return (
    <span className="mt-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-400">
      <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
        <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.25em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
      {children}
    </h3>
  )
}

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 px-1 py-4 sm:px-2 sm:py-6"
    >
      <div className="mb-6 flex items-start gap-4 border-b border-[#1f1f2c] pb-5">
        {/* Marca lateral vermelha cinematográfica */}
        <span className="mt-1 h-7 w-1 flex-shrink-0 bg-gradient-to-b from-red-700 to-red-950" />
        <div>
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-[#f5f5f7] [font-family:var(--font-cinzel)] sm:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-sm italic text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function PhaseHeader({ number, title, id }: { number: string; title: string; id: string }) {
  return (
    <div
      id={id}
      className="relative scroll-mt-24 overflow-hidden px-2 py-8 sm:px-4 sm:py-12"
    >
      {/* Glow dourado sutil no canto */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(201,169,97,0.3), transparent 70%)" }}
      />
      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-[#c9a961]" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.5em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
            {number}
          </p>
        </div>
        <h2 className="mt-4 text-3xl font-bold leading-[1.05] tracking-tight text-[#f5f5f7] [font-family:var(--font-cinzel)] sm:text-5xl">
          {title}
        </h2>
      </div>
    </div>
  )
}

function Conclusion({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative my-8 overflow-hidden border border-[#c9a961]/40 bg-gradient-to-br from-[#c9a961]/10 via-[#12121a]/80 to-[#1a1320]/60 px-6 py-7 sm:px-10 sm:py-9"
      style={{ boxShadow: "0 12px 40px -16px rgba(201,169,97,0.25), inset 0 1px 0 rgba(201,169,97,0.1)" }}
    >
      {/* Cantos decorativos dourados */}
      <span className="pointer-events-none absolute left-0 top-0 h-2 w-2 border-l-2 border-t-2 border-[#c9a961]" />
      <span className="pointer-events-none absolute right-0 top-0 h-2 w-2 border-r-2 border-t-2 border-[#c9a961]" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-2 w-2 border-b-2 border-l-2 border-[#c9a961]" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 border-b-2 border-r-2 border-[#c9a961]" />

      <div className="flex items-center gap-3">
        <span className="h-px w-6 bg-[#c9a961]" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
          Conclusión
        </p>
        <span className="h-px flex-1 bg-gradient-to-r from-[#c9a961]/40 to-transparent" />
      </div>
      <div className="mt-4 text-center text-lg leading-relaxed text-[#f5f5f7] [font-family:var(--font-cinzel)] sm:text-xl">
        {children}
      </div>
    </div>
  )
}

function Box({ tone, children }: { tone: "red" | "green" | "gold"; children: React.ReactNode }) {
  const colors = {
    red:   "border-red-500/30 bg-red-500/5",
    green: "border-green-500/30 bg-green-500/5",
    gold:  "border-[#c9a961]/30 bg-[#c9a961]/5",
  }
  return <div className={`border ${colors[tone]} px-5 py-4 text-sm`}>{children}</div>
}

function BoxList({ tone, items }: { tone: "red" | "green"; items: string[] }) {
  const isRed = tone === "red"
  return (
    <div className={`border ${isRed ? "border-red-500/20 bg-red-500/[0.03]" : "border-green-500/20 bg-green-500/[0.03]"} px-5 py-4`}>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm">
            <span className={isRed ? "text-red-500" : "text-green-500"}>{isRed ? "✕" : "→"}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FormulaCard({ title, formula, note, example }: { title: string; formula: string; note: string; example: string }) {
  return (
    <div className="border border-[#1a1a24] bg-[#0a0a0f] px-6 py-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
        {title}
      </p>
      <p className="mt-3 text-base font-semibold text-[#f5f5f7] [font-family:var(--font-cinzel)]">
        {formula}
      </p>
      {note && <p className="mt-3 text-sm italic text-[#a0a0b0]">{note}</p>}
      {example && (
        <p className="mt-3 border-t border-[#1a1a24] pt-3 text-sm text-[#d4d4d8]">
          <Strong>Ejemplo:</Strong> {example}
        </p>
      )}
    </div>
  )
}

function Step({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-[#c9a961] pl-5">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
        {number} · {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[#d4d4d8]">{children}</p>
    </div>
  )
}

// ─── ILUSTRACIONES SVG ─────────────────────────────────────────────────────

function ConsciousnessChart() {
  const stages = [
    { num: "1", label: "Totalmente Inconsciente", desc: "No sabe que tiene un problema", color: "#9ca3af" },
    { num: "2", label: "Consciente del Problema", desc: "Conoce el dolor, pero no la solución", color: "#f97316" },
    { num: "3", label: "Consciente de la Solución", desc: "Conoce opciones, pero no tu producto", color: "#eab308" },
    { num: "4", label: "Consciente del Producto", desc: "Conoce tu oferta, pero tiene dudas", color: "#22c55e" },
    { num: "5", label: "Totalmente Consciente", desc: "¡Listo para comprar!", color: "#15803d" },
  ]
  return (
    <div className="border border-[#1a1a24] bg-[#0a0a0f] p-6">
      <p className="mb-5 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
        Niveles de consciencia del cliente
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        {stages.map((s, i) => (
          <div key={s.num} className="flex flex-col items-center text-center">
            <div
              className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border-2 text-lg font-bold [font-family:var(--font-cinzel)]"
              style={{ borderColor: s.color, color: s.color, background: `${s.color}10` }}
            >
              {s.num}
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#f5f5f7] [font-family:var(--font-geist-sans)]">
              {s.label}
            </p>
            <p className="mt-1 text-[10px] text-[#a0a0b0]">{s.desc}</p>
            {i < 4 && (
              <div className="mt-2 hidden h-px w-full bg-gradient-to-r from-transparent via-[#3a3a45] to-transparent sm:block" />
            )}
          </div>
        ))}
      </div>
      <p className="mt-5 border-t border-[#1a1a24] pt-3 text-center text-[10px] uppercase tracking-[0.3em] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
        Viaje del cliente hacia la compra →
      </p>
    </div>
  )
}

function ManagerComparison() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="border border-red-500/20 bg-red-500/[0.03] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-400 [font-family:var(--font-geist-sans)]">
          Gestor Tradicional Complicado
        </p>
        <ul className="mt-3 space-y-1.5 text-xs text-[#d4d4d8]">
          <li>· Nomenclaturas largas y elaboradas</li>
          <li>· Intenta segmentar mejor que Google</li>
          <li>· Solo rastrea CPA, no entiende ROAS</li>
          <li>· Prueba los mismos creativos malos</li>
          <li>· Ni sabe qué es un LaL</li>
          <li className="pt-2 font-semibold text-red-400">→ ROAS de 2,31</li>
        </ul>
      </div>
      <div className="border border-green-500/20 bg-green-500/[0.03] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-green-400 [font-family:var(--font-geist-sans)]">
          Gestor IA — Aberto da Máquina
        </p>
        <ul className="mt-3 space-y-1.5 text-xs text-[#d4d4d8]">
          <li>· 18+ País, nada más</li>
          <li>· Deja que los creativos segmenten</li>
          <li>· Sus creativos intimidan a la competencia</li>
          <li>· Solo rastrea la métrica que importa: CPA</li>
          <li>· Pasa semanas sin mirar la campaña</li>
          <li className="pt-2 font-semibold text-green-400">→ ROAS de 4,37</li>
        </ul>
      </div>
    </div>
  )
}

// Mock-table dos screenshots do Ads Manager
function AdsManagerTable({
  title,
  level,
  rows,
}: {
  title: string
  level: "Campaña" | "Conjunto" | "Anuncios"
  rows: Array<{ name: string; result?: string; reach?: string; check?: "ok" | "x" | "win" }>
}) {
  return (
    <div className="border border-[#1a1a24] bg-[#0a0a0f] overflow-hidden">
      <div className="border-b border-[#1a1a24] bg-[#12121a] px-4 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
          {title}
        </p>
      </div>
      <div className="grid grid-cols-[1fr_120px_60px] border-b border-[#1a1a24] bg-[#0a0a0f] px-4 py-2 text-[10px] uppercase tracking-wider text-[#6a6a7a]">
        <span>{level}</span>
        <span className="text-right">Resultados</span>
        <span className="text-right">Alcance</span>
      </div>
      {rows.map((r, i) => (
        <div
          key={i}
          className={`grid grid-cols-[1fr_120px_60px] items-center border-b border-[#1a1a24]/50 px-4 py-2.5 text-xs ${
            r.check === "win" ? "bg-green-500/5" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            {r.check === "ok" && <span className="text-green-500">●</span>}
            {r.check === "x" && <span className="text-red-500/70">○</span>}
            {r.check === "win" && <span className="text-green-400">✓</span>}
            <span className={r.check === "x" ? "text-[#6a6a7a] line-through" : "text-[#d4d4d8]"}>
              {r.name}
            </span>
          </div>
          <span className="text-right font-mono text-[11px] text-[#a0a0b0]">{r.result || "—"}</span>
          <span className="text-right font-mono text-[11px] text-[#a0a0b0]">{r.reach || "—"}</span>
        </div>
      ))}
    </div>
  )
}

function CampaignTable() {
  return (
    <AdsManagerTable
      title="Campañas"
      level="Campaña"
      rows={[{ name: "12/03/2026 OTT VOLUME [LATAM]", result: "Compras", reach: "—", check: "ok" }]}
    />
  )
}
function ConjuntoTable() {
  return (
    <AdsManagerTable
      title="Conjuntos de anuncios — 1 campaña"
      level="Conjunto"
      rows={[{ name: "LATAM (18+ Advantage+)", result: "Compras", reach: "—", check: "ok" }]}
    />
  )
}
function AnunciosTable() {
  return (
    <AdsManagerTable
      title="Anuncios — 1 conjunto"
      level="Anuncios"
      rows={[
        { name: "Balé",       result: "—", reach: "—", check: "ok" },
        { name: "Mirage",     result: "—", reach: "—", check: "ok" },
        { name: "Carrossel1", result: "—", reach: "—", check: "ok" },
        { name: "Chamada",    result: "—", reach: "—", check: "ok" },
        { name: "Nuke",       result: "—", reach: "—", check: "ok" },
      ]}
    />
  )
}
function ValidationTable() {
  return (
    <AdsManagerTable
      title="Aislamiento — pasa el creativo ganador"
      level="Anuncios"
      rows={[
        { name: "Carrossel2", result: "7 ventas",  reach: "4.215", check: "win" },
        { name: "Dormindo",   result: "0",         reach: "1.444", check: "x" },
        { name: "Palhaço",    result: "0",         reach: "473",   check: "x" },
        { name: "Praia",      result: "0",         reach: "828",   check: "x" },
        { name: "Mulheres",   result: "0",         reach: "292",   check: "x" },
      ]}
    />
  )
}
function DuplicatedTable() {
  return (
    <AdsManagerTable
      title="Campaña duplicada — sin el ganador"
      level="Anuncios"
      rows={[
        { name: "Dormindo",   result: "—", reach: "1.444", check: "ok" },
        { name: "Palhaço",    result: "—", reach: "473",   check: "ok" },
        { name: "Praia",      result: "—", reach: "828",   check: "ok" },
        { name: "Mulheres",   result: "—", reach: "292",   check: "ok" },
      ]}
    />
  )
}
