// Catálogo de textos editáveis pelo admin.
//
// Cada entrada tem:
//   key:      identificador estável usado no banco e no DOM (data-edit)
//   default:  texto padrão (fallback se admin não editou)
//   label:    rótulo no painel admin (UX)
//   group:    grupo lógico ("Hero", "Productos", "Temporadas"...)
//   multiline: textarea em vez de input simples
//
// Pra adicionar nova chave editável:
//   1) Adicione um item aqui
//   2) No HTML/render, use `data-edit="<key>"` no elemento alvo
//   3) Pronto — admin já pode editar

export type SiteTextEntry = {
  key: string
  default: string
  label: string
  group: string
  multiline?: boolean
}

export const SITE_TEXTS: SiteTextEntry[] = [
  // ── HERO PRINCIPAL ──
  { key: "hero.badge", default: "EN DESTACADO", label: "Hero — Etiqueta superior", group: "Hero" },
  { key: "hero.title", default: "[BRAND_NAME] Entrenamiento", label: "Hero — Título", group: "Hero" },
  { key: "hero.description", default: "El método cinematográfico para crear embudos que convierten. Continúa donde lo dejaste y avanza hacia el siguiente capítulo.", label: "Hero — Descripción", group: "Hero", multiline: true },

  // ── SEÇÕES ──
  { key: "section.seasons.subtitle", default: "Mi Biblioteca", label: "Sección Temporadas — Subtítulo", group: "Secciones" },
  { key: "section.seasons.title", default: "[BRAND_NAME] — Temporadas", label: "Sección Temporadas — Título", group: "Secciones" },

  { key: "section.owned.subtitle", default: "Tu Biblioteca", label: "Sección Otros Productos — Subtítulo", group: "Secciones" },
  { key: "section.owned.title", default: "Otros Productos", label: "Sección Otros Productos — Título", group: "Secciones" },

  { key: "section.tienda.subtitle", default: "Desbloquea Más", label: "Sección Tienda — Subtítulo", group: "Secciones" },
  { key: "section.tienda.title", default: "Tienda Premium", label: "Sección Tienda — Título", group: "Secciones" },

  { key: "section.feed.subtitle", default: "Anuncios & novedades", label: "Sección Feed — Subtítulo", group: "Secciones" },
  { key: "section.feed.title", default: "Feed del Creador", label: "Sección Feed — Título", group: "Secciones" },

  { key: "section.stats.subtitle", default: "Tu actividad", label: "Sección Estadísticas — Subtítulo", group: "Secciones" },
  { key: "section.stats.title", default: "Estadísticas", label: "Sección Estadísticas — Título", group: "Secciones" },

  { key: "section.achievements.subtitle", default: "Logros desbloqueados", label: "Sección Insignias — Subtítulo", group: "Secciones" },
  { key: "section.achievements.title", default: "Insignias", label: "Sección Insignias — Título", group: "Secciones" },

  // ── PRODUTOS (Tienda Premium) ──
  { key: "product.creativos.name", default: "Creativos.AI", label: "Creativos.AI — Nombre", group: "Productos" },
  { key: "product.creativos.desc", default: "Genera creativos publicitarios en minutos con IA entrenada para conversión.", label: "Creativos.AI — Descripción", group: "Productos", multiline: true },

  { key: "product.andromeda.name", default: "Andrómeda.ADS", label: "Andrómeda.ADS — Nombre", group: "Productos" },
  { key: "product.andromeda.desc", default: "Estrategias avanzadas para Meta Ads que maximizan tu ROAS.", label: "Andrómeda.ADS — Descripción", group: "Productos", multiline: true },

  { key: "product.analytics.name", default: "Analytics.KPI", label: "Analytics.KPI — Nombre", group: "Productos" },
  { key: "product.analytics.desc", default: "Domina las métricas que importan. Análisis profundo de KPIs y dashboards prácticos.", label: "Analytics.KPI — Descripción", group: "Productos", multiline: true },

  { key: "product.minivsl.name", default: "Agente Copy Mini VSL's", label: "Mini VSL — Nombre", group: "Productos" },
  { key: "product.minivsl.desc", default: "Agente de IA entrenado para generar guiones de mini VSLs en menos de 5 minutos.", label: "Mini VSL — Descripción", group: "Productos", multiline: true },

  { key: "product.revisao.name", default: "Revisión de Tu Embudo", label: "Revisión — Nombre", group: "Productos" },
  { key: "product.revisao.desc", default: "Una revisión personalizada de tu embudo actual con recomendaciones cinematográficas.", label: "Revisión — Descripción", group: "Productos", multiline: true },

  // ── TEMPORADAS ──
  { key: "season.1.name", default: "Agentes GPT's", label: "Temporada 1 — Nombre", group: "Temporadas" },
  { key: "season.2.name", default: "Construyendo Tu Estructura", label: "Temporada 2 — Nombre", group: "Temporadas" },
  { key: "season.3.name", default: "Creación Audiovisual", label: "Temporada 3 — Nombre", group: "Temporadas" },
  { key: "season.4.name", default: "Implementación de la Estructura", label: "Temporada 4 — Nombre", group: "Temporadas" },
  { key: "season.5.name", default: "Comunidad [BRAND_NAME]", label: "Temporada 5 — Nombre", group: "Temporadas" },
]

export function getSiteTextDefault(key: string): string {
  const entry = SITE_TEXTS.find((e) => e.key === key)
  return entry?.default || ""
}

// Aplica overrides recebidos do servidor sobre o catálogo default.
// Retorna { [key]: finalValue }.
export function mergeOverrides(overrides: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const entry of SITE_TEXTS) {
    result[entry.key] = overrides[entry.key] ?? entry.default
  }
  return result
}
