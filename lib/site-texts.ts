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
  { key: "hero.title", default: "Entrenamiento", label: "Hero — Título", group: "Hero" },
  { key: "hero.description", default: "Continúa donde lo dejaste y avanza hacia el siguiente capítulo.", label: "Hero — Descripción", group: "Hero", multiline: true },

  // ── SEÇÕES ──
  { key: "section.seasons.subtitle", default: "Mi Biblioteca", label: "Sección Temporadas — Subtítulo", group: "Secciones" },
  { key: "section.seasons.title", default: "Temporadas", label: "Sección Temporadas — Título", group: "Secciones" },

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
  { key: "product.creativos.name", default: "Producto 1", label: "Producto 1 — Nombre", group: "Productos" },
  { key: "product.creativos.desc", default: "Descripción del Producto 1.", label: "Producto 1 — Descripción", group: "Productos", multiline: true },

  { key: "product.andromeda.name", default: "Producto 2", label: "Producto 2 — Nombre", group: "Productos" },
  { key: "product.andromeda.desc", default: "Descripción del Producto 2.", label: "Producto 2 — Descripción", group: "Productos", multiline: true },

  { key: "product.analytics.name", default: "Producto 3", label: "Producto 3 — Nombre", group: "Productos" },
  { key: "product.analytics.desc", default: "Descripción del Producto 3.", label: "Producto 3 — Descripción", group: "Productos", multiline: true },

  { key: "product.minivsl.name", default: "Upsell 1", label: "Upsell 1 — Nombre", group: "Productos" },
  { key: "product.minivsl.desc", default: "Descripción del Upsell 1.", label: "Upsell 1 — Descripción", group: "Productos", multiline: true },

  { key: "product.revisao.name", default: "Servicio Premium", label: "Servicio Premium — Nombre", group: "Productos" },
  { key: "product.revisao.desc", default: "Descripción del Servicio Premium.", label: "Servicio Premium — Descripción", group: "Productos", multiline: true },

  // ── TEMPORADAS ──
  { key: "season.1.name", default: "Temporada 1", label: "Temporada 1 — Nombre", group: "Temporadas" },
  { key: "season.2.name", default: "Temporada 2", label: "Temporada 2 — Nombre", group: "Temporadas" },
  { key: "season.3.name", default: "Temporada 3", label: "Temporada 3 — Nombre", group: "Temporadas" },
  { key: "season.4.name", default: "Temporada 4", label: "Temporada 4 — Nombre", group: "Temporadas" },
  { key: "season.5.name", default: "Comunidad", label: "Temporada 5 — Nombre", group: "Temporadas" },
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
