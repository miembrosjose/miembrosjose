"use client"

export function BonusGanchosContent() {
  return (
    <main
      style={{
        margin: "0 auto",
        width: "100%",
        maxWidth: 860,
        padding: "4rem 1.5rem 6rem",
        color: "var(--text-primary)",
      }}
    >
      {/* Header */}
      <header style={{ marginBottom: "3.5rem", textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            background: "rgba(201,169,97,0.12)",
            border: "1px solid rgba(201,169,97,0.35)",
            padding: "0.35rem 1rem",
            marginBottom: "1.25rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "var(--accent-gold)",
          }}
        >
          BONUS DESBLOQUEADO
        </div>
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            fontFamily: "var(--font-display)",
            color: "var(--text-primary)",
            marginBottom: "1rem",
          }}
        >
          Pack de Ganchos Neuronales™
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.65, maxWidth: 560, margin: "0 auto" }}>
          30+ Hooks estratégicos categorizados por nivel de conciencia — listos para usar en Reels, Headlines, Carruseles, UGC y Stories.
        </p>
      </header>

      {/* Cómo usar */}
      <section style={{ marginBottom: "3rem" }}>
        <SectionLabel>Cómo usar este material</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginTop: "1.25rem" }}>
          <InfoCard
            title="Desarrollo Estratégico"
            body="Cada hook fue desarrollado para un nivel específico del recorrido del cliente."
          />
          <InfoCard
            title="NO Mezcles Niveles"
            body="NO mezcles hooks de diferentes niveles en un mismo creativo."
            highlight
          />
          <InfoCard
            title="Ubicación del Público"
            body="Elige el hook según DÓNDE está tu público, no donde tú quieres que esté."
          />
        </div>
      </section>

      {/* Nivel 1 */}
      <LevelSection
        num={1}
        label="INCONSCIENTE"
        pct="40%"
        color="#e53e3e"
        objetivo="Despertar conciencia del problema sin vender."
        formato="Reels cortos (7-15s), Stories, Headlines indirectos."
        tono="Intrigante, provocador, misterioso."
        hooks={[
          {
            title: "PATRÓN DE INTERRUPCIÓN",
            template: "¿Recuerdas quién eras antes de [situación actual]?",
            example: "¿Recuerdas quién eras antes de rendirte con tu cuerpo?",
            why: "Nostalgia emocional sin mencionar el problema directamente.",
          },
          {
            title: "ESTADÍSTICA IMPACTANTE",
            template: "[X]% de las personas hacen [acción] sin saber que esto causa [consecuencia oculta].",
            example: "El 87% de las personas toma café al despertar sin saber que bloquea el metabolismo por 6 horas.",
          },
          {
            title: "REVELACIÓN SILENCIOSA",
            template: "Hay algo que nadie te cuenta sobre [área de la vida]…",
            example: "Hay algo que nadie te cuenta sobre ganar dinero online…",
          },
          {
            title: "COMPARACIÓN TEMPORAL",
            template: "[Área] era así hace 5 años. Hoy es completamente diferente. Y tú sigues atrapado en el pasado.",
          },
          {
            title: "PREGUNTA EXISTENCIAL",
            template: "Si pudieras volver [X años] atrás, ¿qué cambiarías?",
            example: "Si pudieras volver 10 años atrás, ¿qué cambiarías de tu cuerpo?",
          },
          {
            title: "OBSERVACIÓN SOCIAL",
            template: "Mira a las personas a tu alrededor. ¿Qué tienen en común?",
            example: "¿Cuántas están realmente felices con su propio cuerpo?",
          },
          {
            title: "INVERSIÓN DE REALIDAD",
            template: "¿Y si te dijera que [creencia común] es exactamente lo opuesto de lo que deberías hacer?",
            example: "¿Y si te dijera que comer menos es lo opuesto de lo que deberías hacer para bajar de peso?",
          },
        ]}
      />

      {/* Nivel 2 */}
      <LevelSection
        num={2}
        label="CONSCIENTE DEL PROBLEMA"
        pct="30%"
        color="#e53e3e"
        objetivo="Educar sobre la solución + desmontar creencias."
        formato="Carrusel educativo, Reels 15-30s, copy larga."
        tono="Educativo."
        hooks={[
          { title: "CAUSA OCULTA", template: "La verdadera causa de [problema] no es lo que piensas. Es [causa real]." },
          { title: "DESCONSTRUCCIÓN", template: "Por qué [solución antigua] ya no funciona (y qué hacer ahora)." },
          { title: "CICLO VICIOSO", template: "Intentas [acción], empeora [problema]. Intentas de nuevo y empeora más. El ciclo nunca termina." },
          { title: "REVELACIÓN PROGRESIVA", template: "3 señales de que [problema] está empeorando (aunque no lo notes)." },
          { title: "ERROR COMÚN", template: "El error que comete el 90% al intentar resolver [problema] (y cómo evitarlo)." },
          { title: "AUTO-DIAGNÓSTICO", template: "Haz este test: ¿tienes [problema específico]?" },
          { title: "LÍNEA DE TIEMPO", template: "Semana 1: [síntoma]. Semana 4: [empeora]. Mes 6: [colapso]. ¿Reconoces este patrón?" },
        ]}
      />

      {/* Nivel 3 */}
      <LevelSection
        num={3}
        label="CONSCIENTE DE LA SOLUCIÓN"
        pct="20%"
        color="#38a169"
        objetivo="Probar diferenciación."
        formato="Casos, comparaciones, UGC."
        tono="Confianza + evidencia."
        hooks={[
          { title: "DIFERENCIACIÓN DIRECTA", template: "La diferencia entre [solución genérica] y [tu solución]: [diferencial único]." },
          { title: "PRUEBA SOCIAL NUMÉRICA", template: "[Nombre] logró [resultado] en [tiempo]. Mira cómo." },
          { title: "OBJECIÓN ANTICIPADA", template: "'Pero [objeción común]' — y es exactamente por eso que funciona." },
          { title: "COMPARACIÓN LADO A LADO", template: "[Método A]: [resultado malo]. [Tu método]: [resultado bueno]. La decisión es tuya." },
          { title: "ANTES Y DESPUÉS EMOCIONAL", template: "Antes: [estado negativo]. Después: [transformación]. ¿Qué cambió?" },
          { title: "AUTORIDAD POR ASOCIACIÓN", template: "El mismo método usado por [autoridad]." },
          { title: "GARANTÍA INVERSA", template: "Si NO consigues [resultado] en [plazo], yo [compromiso extremo]." },
        ]}
      />

      {/* Nivel 4 */}
      <LevelSection
        num={4}
        label="CONSCIENTE DEL PRODUCTO"
        pct="8%"
        color="#d69e2e"
        objetivo="Urgencia + decisión."
        formato="Stories, Reels con CTA, carrusel de oferta."
        tono="Directo y urgente."
        hooks={[
          { title: "ESCASEZ REAL", template: "Quedan [número] cupos. Después, solo en [fecha]." },
          { title: "FACILIDAD EXTREMA", template: "3 clics. 2 minutos. Empiezas hoy." },
          { title: "COSTO DE OPORTUNIDAD", template: "Cada día que postergas = [pérdida concreta acumulada]." },
          { title: "BONUS CON PLAZO", template: "Entra hoy y recibe [bonus]. Mañana vuelve a la normalidad." },
          { title: "SIGUIENTE PASO OBVIO", template: "Ya sabes que lo necesitas. Ahora solo falta [acción simple]." },
          { title: "COMPARACIÓN DE INVERSIÓN", template: "[Precio] ÷ [días] = menos que [comparación]." },
          { title: "DEADLINE EMOCIONAL", template: "En [plazo], vas a estar en [estado futuro]. La pregunta es: ¿dónde?" },
        ]}
      />

      {/* Nivel 5 */}
      <LevelSection
        num={5}
        label="ULTRA CONSCIENTE"
        pct="2%"
        color="#e53e3e"
        objetivo="Conversión inmediata."
        formato="Stories con link, anuncio directo."
        tono="Ultra directo."
        hooks={[
          { title: "ACCESO INMEDIATO", template: "Haz clic. Paga. Empieza ahora." },
          { title: "DEMOSTRACIÓN EN TIEMPO REAL", template: "Míralo funcionando en 60 segundos [DEMO EN VIVO]." },
          { title: "LLAMADA DIRECTA", template: "Link en la bio. Haz clic ahora." },
          { title: "RESULTADO GARANTIZADO", template: "Empieza hoy. Resultados en [plazo]. O te devolvemos el dinero." },
        ]}
      />

      {/* Recordatorio crítico */}
      <section
        style={{
          marginTop: "2rem",
          padding: "1.5rem 2rem",
          border: "1px solid rgba(229,62,62,0.35)",
          background: "rgba(229,62,62,0.06)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#e53e3e",
            marginBottom: "0.75rem",
          }}
        >
          RECORDATORIO CRÍTICO
        </p>
        <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem", color: "var(--text-primary)" }}>
          NUNCA mezcles hooks de diferentes niveles en el mismo creativo.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div style={{ background: "rgba(127,29,29,0.25)", padding: "1rem 1.25rem", border: "1px solid rgba(127,29,29,0.4)" }}>
            <p style={{ fontWeight: 600, marginBottom: "0.4rem", color: "var(--text-primary)" }}>Regla de Oro</p>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Mezclar Nivel 1 con Nivel 5 = BLOQUEO INMEDIATO de Andromeda.
            </p>
          </div>
          <div style={{ background: "rgba(127,29,29,0.25)", padding: "1rem 1.25rem", border: "1px solid rgba(127,29,29,0.4)" }}>
            <p style={{ fontWeight: 600, marginBottom: "0.4rem", color: "var(--text-primary)" }}>Decisión Estratégica</p>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Elige el hook según dónde está tu público AHORA.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.65rem",
        fontWeight: 600,
        letterSpacing: "0.35em",
        textTransform: "uppercase",
        color: "var(--accent-gold)",
        marginBottom: "0.5rem",
      }}
    >
      {children}
    </p>
  )
}

function InfoCard({ title, body, highlight }: { title: string; body: string; highlight?: boolean }) {
  return (
    <div
      style={{
        padding: "1.25rem 1.5rem",
        background: highlight ? "rgba(127,29,29,0.2)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${highlight ? "rgba(127,29,29,0.45)" : "var(--border-subtle)"}`,
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-primary)" }}>{title}</p>
      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>{body}</p>
    </div>
  )
}

type HookItem = {
  title: string
  template: string
  example?: string
  why?: string
}

type LevelSectionProps = {
  num: number
  label: string
  pct: string
  color: string
  objetivo: string
  formato: string
  tono: string
  hooks: HookItem[]
}

function LevelSection({ num, label, pct, color, objetivo, formato, tono, hooks }: LevelSectionProps) {
  return (
    <section
      style={{
        marginBottom: "2.5rem",
        borderTop: `2px solid ${color}`,
        paddingTop: "2rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
            boxShadow: `0 0 8px ${color}80`,
          }}
        />
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.1rem, 3vw, 1.5rem)",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          NIVEL {num} — {label}{" "}
          <span style={{ fontSize: "0.75em", fontWeight: 400, color: "var(--text-muted)" }}>({pct} del público)</span>
        </h2>
      </div>
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "1.75rem", marginLeft: "1.5rem" }}>
        <Meta label="Objetivo" value={objetivo} />
        <Meta label="Formato" value={formato} />
        <Meta label="Tono" value={tono} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {hooks.map((h, i) => (
          <HookCard key={i} hook={h} accentColor={color} />
        ))}
      </div>
    </section>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <p style={{ margin: 0, fontSize: "0.825rem", color: "var(--text-secondary)" }}>
      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{label}:</span> {value}
    </p>
  )
}

function HookCard({ hook, accentColor }: { hook: HookItem; accentColor: string }) {
  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid var(--border-subtle)",
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.65rem",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: accentColor,
          marginBottom: "0.5rem",
        }}
      >
        {hook.title}
      </p>
      <p
        style={{
          fontSize: "0.925rem",
          color: "var(--text-primary)",
          fontStyle: "italic",
          marginBottom: hook.example || hook.why ? "0.5rem" : 0,
          lineHeight: 1.5,
        }}
      >
        "{hook.template}"
      </p>
      {hook.example && (
        <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginBottom: hook.why ? "0.35rem" : 0 }}>
          Ejemplo: "{hook.example}"
        </p>
      )}
      {hook.why && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Por qué funciona: {hook.why}
        </p>
      )}
    </div>
  )
}
