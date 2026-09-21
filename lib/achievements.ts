// Sistema de insignias (achievements)
// pra ser compartilhado entre prototipo (via JS injetado) e React (perfil/comments).
//
// Cada insignia tem:
//   id          — chave única, persistida em user_metadata.featured_badge_id
//                 e em episode_comments.author_badge_id
//   tier        — bronze | silver | gold | platinum (afeta cor no CSS)
//   category    — progression | products | agents
//   name        — label visível (ES)
//   desc        — descrição curta (ES)
//   svg         — string SVG inline (currentColor pra herdar cor do tier)
//   productKey  — só pra category=products: nome do produto pra match com OWNED_PRODUCTS
//
// IMPORTANT: ao adicionar/editar insignias aqui, replicar no
// el código original (array ACHIEVEMENTS) ou vice-versa.
// (TODO refactor: prototipo importar dessa lib via build step.)

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "topo"
export type AchievementCategory = "progression" | "products" | "agents" | "community" | "time" | "exclusive"

export type Achievement = {
  id: string
  /**
   * Retirada del catálogo visible. No se borra: el webhook de Stripe y las
   * rutas de admin conceden algunas de estas por id, y hay clientes que ya
   * las tienen. Borrarlas rompería esos flujos y haría desaparecer lo que
   * alguien compró. Se dejan de mostrar, que es lo que se quería.
   */
  retirada?: boolean
  tier: AchievementTier
  category: AchievementCategory
  name: string
  desc: string
  productKey?: string
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    // Insignia EXCLUSIVA pra clientes que contrataram o serviço "¿Quieres un
    // área de miembros igual a esta?" (servicio premium, top da hierarquia
    // junto com Servicio Premium B). SVG cinematográfico vermelho com claquete (símbolo de
    // estúdio). Reusa o mesmo glow do el_topo (topoBadgeGlow) — diferencia só
    // pelo símbolo central.
    id: "el_estudio",
    retirada: true,
    tier: "topo",
    category: "exclusive",
    name: "Servicio Premium A",
    desc: "Insignia exclusiva — Servicio Premium A",
  },
  {
    // Insignia EXCLUSIVA pra clientes pra quem a Los 144000 construiu o embudo
    // (serviço premium, top da hierarquia). SVG cinematográfico vermelho da marca
    // com coroa, picos de montanha e estrela radiante. CSS aplica glow vermelho
    // animado (topoBadgeGlow). Sem fundo/border — só o SVG com brilho próprio.
    id: "el_topo",
    retirada: true,
    tier: "topo",
    category: "exclusive",
    name: "Servicio Premium B",
    desc: "Insignia exclusiva — Servicio Premium B",
  },
  {
    // Insignia EXCLUSIVA do administrador. Filtrada pra só aparecer pra is_admin=true
    // (selectable). Quando admin posta, aparece pra todos via author_badge_id.
    // SVG usa gradient + sparkles; CSS no prototipo aplica glow animado pelo id.
    id: "admin_seal",
    tier: "diamond",
    category: "exclusive",
    name: "Admin",
    desc: "Insignia exclusiva del administrador",
  },
  {
    id: "welcome",
    retirada: true,
    tier: "bronze",
    category: "progression",
    name: "Bienvenida",
    desc: "Has entrado en la plataforma",
  },
  {
    id: "first_lesson",
    retirada: true,
    tier: "bronze",
    category: "progression",
    name: "Primera Clase",
    desc: "Concluiste tu primera clase",
  },
  {
    id: "agent_estratega",
    tier: "bronze",
    category: "progression",
    // Prueba: renombrada a "144". Se entrega al completar el capítulo 2 de la
    // Temporada 1 (ya cableado en AGENT_BY_EPISODE → ep:2 en achievements-unlock).
    name: "144",
    desc: "Completaste el capítulo 2 de la Temporada 1",
  },
  {
    id: "agent_minivsl",
    retirada: true,
    tier: "bronze",
    category: "progression",
    name: "Agente 2",
    desc: "Concluiste la clase del Agente 2",
  },
  {
    id: "agent_copywriter",
    retirada: true,
    tier: "bronze",
    category: "progression",
    name: "Agente 3",
    desc: "Concluiste la clase del Agente 3",
  },
  {
    id: "agent_constructor",
    retirada: true,
    tier: "bronze",
    category: "progression",
    name: "Agente 4",
    desc: "Concluiste la clase del Agente 4",
  },
  {
    // Primer grado del Camino: se concede al entrar en la Temporada 1, antes
    // de completarla. Marca a quien empezó, no a quien terminó.
    id: "semilla_estelar",
    retirada: true,
    tier: "bronze",
    category: "progression",
    name: "Semilla Estelar",
    desc: "Estás recorriendo la Temporada 1 del Camino",
  },
  {
    // EMBAJADOR GALÁCTICO — no se desbloquea con el avance. La concede el
    // administrador a mano, persona por persona, como representante de su país
    // dentro de la Red. Por eso lleva gradientes propios en vez de currentColor:
    // tiene identidad fija, como el Sello del Admin.
    id: "embajador_galactico",
    tier: "diamond",
    category: "exclusive",
    name: "Embajador Galáctico",
    desc: "Representa a la Red en su país",
  },
  {
    // La concede el administrador al APROBAR un lugar propuesto para el Mapa
    // Cósmico. No se pide: llega cuando la aportación entra en el mapa.
    id: "faro_territorio",
    tier: "gold",
    category: "exclusive",
    name: "Faro del Territorio",
    desc: "Tu aportación encendió un punto del Mapa Cósmico",
  },
  {
    // Se concede al adquirir las Transmisiones.
    id: "bibliotecario_cosmico",
    tier: "gold",
    category: "products",
    name: "Bibliotecario Cósmico",
    desc: "Tienes acceso al archivo de Transmisiones",
  },
  {
    // INSTRUCTOR DE LOS 144.000 — quien conduce la formación de un grupo de
    // contacto. Hexagrama abierto en dos mitades con una llama entre ellas:
    // lo que se recibe y lo que se entrega. Alrededor, doce puntos: los que
    // escuchan.
    id: "rol_instructor",
    tier: "diamond",
    category: "exclusive",
    name: "Instructor de Los 144.000",
    desc: "Conduce la formación de un grupo de contacto",
  },
  {
    // Las tres funciones de la Red también dejan marca. Se conceden y se
    // retiran junto con el rol: no son un premio aparte que haya que recordar
    // dar a mano.
    id: "rol_organizador",
    tier: "gold",
    category: "exclusive",
    name: "Organizador de Encuentros",
    desc: "Convoca a la Red en su ciudad",
  },
  {
    id: "rol_cartografo",
    tier: "gold",
    category: "exclusive",
    name: "Cartógrafo",
    desc: "Documenta los lugares del Mapa Cósmico",
  },
  {
    id: "rol_colaborador",
    tier: "gold",
    category: "exclusive",
    name: "Colaborador",
    desc: "Sostiene el Archivo por dentro",
  },
  {
    // Se concede al adquirir la PRIMERA práctica premium, cualquiera de ellas.
    // Una sola insignia para todas: una por meditación haría crecer el
    // catálogo cada vez que se publica una práctica nueva.
    id: "practica_profunda",
    tier: "gold",
    category: "products",
    name: "Práctica Profunda",
    desc: "Adquiriste una práctica premium",
  },
  {
    id: "season_1_complete",
    tier: "bronze",
    category: "progression",
    name: "Semilla Estelar",
    desc: "Completaste la Temporada 1 del Camino",
  },
  {
    id: "season_2_complete",
    tier: "silver",
    category: "progression",
    name: "Activador de la Red",
    desc: "Completaste la Temporada 2 del Camino",
  },
  {
    id: "season_3_complete",
    tier: "gold",
    category: "progression",
    name: "Guardián de la Red",
    desc: "Completaste la Temporada 3 del Camino",
  },
  {
    id: "season_4_complete",
    tier: "platinum",
    category: "progression",
    name: "Arquitecto Cósmico",
    desc: "Completaste la Temporada 4 del Camino",
  },
  {
    id: "vip_community",
    retirada: true,
    tier: "silver",
    category: "progression",
    name: "Círculo VIP",
    desc: "Entraste a la comunidad privada",
  },
  {
    // Insignia rara — só desbloqueia quando user assiste TODOS os episódios
    // de TODAS as temporadas (T1-T4). Tier gold = aparece como FOMO
    // pra outros users (silver+ broadcast).
    id: "training_complete",
    retirada: true,
    tier: "gold",
    category: "progression",
    name: "Entrenamiento Completo",
    desc: "Concluiste todas las clases de todas las temporadas",
  },
  {
    // Bonus 1 — desbloqueado via comentário em
    // post da comunidade com tag BONO. Tier silver (mais baixo que produtos
    // pagos gold) pra refletir que é gratuito. SVG com gancho/cérebro.
    // Posicionado logo após training_complete e antes dos products pagos
    // pra ser a "primeira insignia de produto" da hierarquia.
    id: "product_bonus_ganchos",
    retirada: true,
    tier: "silver",
    category: "products",
    productKey: "Bonus 1",
    name: "Bonus 1",
    desc: "Desbloqueaste el Bonus 1",
  },
  {
    id: "product_creativos",
    retirada: true,
    tier: "gold",
    category: "products",
    productKey: "Producto 1",
    name: "Producto 1",
    desc: "Adquiriste el Producto 1",
  },
  {
    id: "product_andromeda",
    retirada: true,
    tier: "gold",
    category: "products",
    productKey: "Producto 2",
    name: "Producto 2",
    desc: "Adquiriste el Producto 2",
  },
  {
    id: "product_analytics",
    retirada: true,
    tier: "gold",
    category: "products",
    productKey: "Producto 3",
    name: "Producto 3",
    desc: "Adquiriste el Producto 3",
  },
  {
    id: "product_minivsl",
    retirada: true,
    tier: "gold",
    category: "products",
    productKey: "Upsell 1",
    name: "Upsell 1",
    desc: "Adquiriste el Upsell 1",
  },
  {
    // Servicio Premium — produto premium (tratamento exclusive: glow dourado
    // animado + sem fundo, igual admin_seal e el_topo). Posicionado depois
    // dos outros products pra ser visualmente o "topo" da hierarquia
    // de produtos.
    id: "product_revisao",
    retirada: true,
    tier: "gold",
    category: "products",
    productKey: "Servicio Premium",
    name: "Servicio Premium",
    desc: "Adquiriste el Servicio Premium",
  },

  // ─── COMUNIDAD (rank por número de posts no fórum) ─────────────────────
  // Sistema de rank: Civil (0) → Rank 1 → Rank 2 → Rank 3 →
  // Rank 4 → Rank 5 → Rank 6 → Rank 7. Civil não tem insignia.
  {
    id: "rank_recluta",
    tier: "bronze",
    category: "community",
    name: "Mónada",
    desc: "El primer círculo. Has empezado a hablar. · 1+ publicaciones",
  },
  {
    id: "rank_agente",
    tier: "bronze",
    category: "community",
    name: "Vesica Piscis",
    desc: "Dos círculos se cruzan: ya no escribes solo. · 10+ publicaciones",
  },
  {
    id: "rank_operador",
    tier: "silver",
    category: "community",
    name: "Triqueta",
    desc: "Tres centros sostienen la conversación. · 50+ publicaciones",
  },
  {
    id: "rank_estratega",
    tier: "silver",
    category: "community",
    name: "Cuaternario",
    desc: "Cuatro círculos: la base ya es estable. · 100+ publicaciones",
  },
  {
    id: "rank_capo",
    tier: "gold",
    category: "community",
    name: "Pentada",
    desc: "Cinco. La forma empieza a girar. · 200+ publicaciones",
  },
  {
    id: "rank_padrino",
    tier: "gold",
    category: "community",
    name: "Semilla de la Vida",
    desc: "Seis alrededor de uno. El patrón está completo. · 300+ publicaciones",
  },
  {
    id: "rank_leyenda",
    tier: "topo",
    category: "community",
    name: "Flor de la Vida",
    desc: "Diecinueve círculos. La geometría entera. · 500+ publicaciones",
  },

  // ─── TIEMPO (dias únicos de acceso à plataforma) ────────────────────────
  {
    id: "time_devoto",
    tier: "bronze",
    category: "time",
    name: "Tetraedro",
    desc: "La primera forma. 7 días de presencia",
  },
  {
    id: "time_habitue",
    tier: "silver",
    category: "time",
    name: "Merkaba",
    desc: "Dos tetraedros girando. 30 días de presencia",
  },
  {
    id: "time_veterano",
    tier: "gold",
    category: "time",
    name: "Cubo de Metatrón",
    desc: "Todos los sólidos contenidos. 60 días de presencia",
  },
  {
    id: "time_eterno",
    tier: "topo",
    category: "time",
    name: "Toroide",
    desc: "El flujo que vuelve sobre sí. 90 días de presencia",
  },
]

// ──────────────────────────────────────────────────────────────────────────
// SISTEMA DE RANK — comunidad
// ──────────────────────────────────────────────────────────────────────────
//
// Calcula o rank do user baseado em quantos posts/replies ele já fez no fórum.
// Total = forum_posts.count + forum_replies.count

export type CommunityRank = {
  level: number              // 0..7
  label: string              // "Civil", "Recluta", ...
  tier: AchievementTier | null
  badge_id: string | null    // id da insignia de community correspondente (null pra Civil)
  next_threshold: number | null  // próximo nível ou null se já é Leyenda
}

const RANK_TIERS: Array<{ min: number; label: string; tier: AchievementTier | null; badge_id: string | null }> = [
  { min: 0,    label: "Civil",     tier: null,        badge_id: null },
  { min: 1,    label: "Rank 1",   tier: "bronze",    badge_id: "rank_recluta" },
  { min: 10,   label: "Rank 2",    tier: "bronze",    badge_id: "rank_agente" },
  { min: 50,   label: "Rank 3",  tier: "silver",    badge_id: "rank_operador" },
  { min: 100,  label: "Rank 4", tier: "silver",    badge_id: "rank_estratega" },
  { min: 200,  label: "Rank 5",      tier: "gold",      badge_id: "rank_capo" },
  { min: 300,  label: "Rank 6",   tier: "gold",      badge_id: "rank_padrino" },
  { min: 500,  label: "Rank 7",   tier: "topo",      badge_id: "rank_leyenda" },
]

export function computeCommunityRank(postCount: number): CommunityRank {
  let level = 0
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (postCount >= RANK_TIERS[i].min) { level = i; break }
  }
  const tier = RANK_TIERS[level]
  const next = RANK_TIERS[level + 1]
  return {
    level,
    label: tier.label,
    tier: tier.tier,
    badge_id: tier.badge_id,
    next_threshold: next ? next.min : null,
  }
}

/**
 * Override pra admin: sempre na última patente (Leyenda).
 * Aplicar nos callsites que sabem se o user é admin.
 */
export function applyAdminRankOverride(rank: CommunityRank, isAdmin: boolean): CommunityRank {
  if (!isAdmin) return rank
  const top = RANK_TIERS[RANK_TIERS.length - 1]
  return {
    level: RANK_TIERS.length - 1,
    label: top.label,
    tier: top.tier,
    badge_id: top.badge_id,
    next_threshold: null,
  }
}

// Tempo: rank por dias únicos de acesso
const TIME_TIERS: Array<{ min: number; badge_id: string }> = [
  { min: 7,   badge_id: "time_devoto" },
  { min: 30,  badge_id: "time_habitue" },
  { min: 60,  badge_id: "time_veterano" },
  { min: 90,  badge_id: "time_eterno" },
]

export function computeTimeBadges(uniqueDays: number): string[] {
  return TIME_TIERS.filter((t) => uniqueDays >= t.min).map((t) => t.badge_id)
}

// Cor por tier (matching .achievement.tier-X .badge-svg do prototipo)
export const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: "#b08456",
  silver: "#c0c0c0",
  gold: "#c9a961",
  platinum: "#e5e4e2",
  diamond: "#b9f2ff", // ciano-diamante; aplicar glow CSS pra brilho extra
  topo: "#7f1d1d",    // red-900 da marca; aplicar glow CSS vermelho intenso
}

/**
 * Insignias com tratamento visual especial — sem fundo/border/shadow,
 * só o SVG com glow animado próprio. Inclui admin_seal, el_topo,
 * el_estudio e product_revisao.
 */
export function isExclusiveSeal(badgeId: string | null | undefined): boolean {
  return (
    badgeId === "admin_seal" ||
    badgeId === "el_topo" ||
    badgeId === "el_estudio" ||
    badgeId === "product_revisao" ||
    badgeId === "embajador_galactico"
  )
}

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id)
}

export function getTierColor(tier: AchievementTier): string {
  return TIER_COLORS[tier]
}

// ═══════════════════════════════════════════════════════════════════════════
// AURAS DEL CAMINO
// ═══════════════════════════════════════════════════════════════════════════
// Cada grado del Camino tiene su propio color, y ese color no se queda en la
// insignia: rodea la foto de perfil, tiñe el punto en el Mapa de la Red y
// marca la tarjeta en el listado. Así se reconoce a alguien de un vistazo, sin
// tener que leer nada.
//
// Los grados son SEÑALES DE RECORRIDO, no rangos de autoridad. Quien llegó más
// lejos no manda sobre nadie: solo ha andado más camino.

export type Aura = {
  /** Color base del anillo y del halo. */
  color: string
  /** Segundo color, para el degradado del anillo. */
  color2: string
  /** Nombre corto para las pastillas de filtro. */
  corto: string
  /** El anillo late en vez de quedarse quieto. Solo los dos últimos grados. */
  vivo: boolean
}

export const AURAS: Record<string, Aura> = {
  // ── El Camino: una temporada, un grado ───────────────────────────────────
  season_1_complete: { color: "#8fc46a", color2: "#e8ffc4", corto: "Semilla",    vivo: false },
  season_2_complete: { color: "#8b6fd8", color2: "#7ee8fa", corto: "Activador",  vivo: false },
  season_3_complete: { color: "#d9b866", color2: "#ffeab8", corto: "Guardián",   vivo: true  },
  season_4_complete: { color: "#c9cbe0", color2: "#ffffff", corto: "Arquitecto", vivo: true  },

  // ── Concedidas a mano ────────────────────────────────────────────────────
  embajador_galactico: { color: "#3b82f6", color2: "#7ee8fa", corto: "Embajador", vivo: true },
  admin_seal:          { color: "#b9f2ff", color2: "#ffffff", corto: "Admin",     vivo: true },

  // ── Primera clase del Camino ─────────────────────────────────────────────
  agent_estratega:     { color: "#6D4A9B", color2: "#a78bca", corto: "144",       vivo: false },
  practica_profunda:   { color: "#8b8fe0", color2: "#ffd98a", corto: "Práctica",  vivo: false },

  // ── Funciones de la Red ──────────────────────────────────────────────────
  rol_organizador:     { color: "#d9873a", color2: "#ffd98a", corto: "Organizador", vivo: true },
  rol_cartografo:      { color: "#2f9a8a", color2: "#7fe8d0", corto: "Cartógrafo",  vivo: true },
  rol_colaborador:     { color: "#a05fd0", color2: "#e8b8ff", corto: "Colaborador", vivo: true },
  rol_instructor:      { color: "#2f8a7a", color2: "#9ff5e4", corto: "Instructor",  vivo: true },

  // ── Aportaciones ─────────────────────────────────────────────────────────
  faro_territorio:       { color: "#3f9fd0", color2: "#ffe9a8", corto: "Faro",          vivo: true },
  bibliotecario_cosmico: { color: "#b08bd8", color2: "#ffe0a8", corto: "Bibliotecario", vivo: true },

  // ── Estrellas: la Flor de la Vida, círculo a círculo ─────────────────────
  rank_recluta:   { color: "#2f6fa8", color2: "#8fd4ff", corto: "Mónada",   vivo: false },
  rank_agente:    { color: "#2f8a6a", color2: "#9be8d0", corto: "Vesica",   vivo: false },
  rank_operador:  { color: "#5f8a2f", color2: "#c9e88f", corto: "Triqueta", vivo: false },
  rank_estratega: { color: "#b08430", color2: "#ffe08a", corto: "Cuaternario", vivo: false },
  rank_capo:      { color: "#b05f30", color2: "#ffb88a", corto: "Pentada",  vivo: false },
  rank_padrino:   { color: "#7a3fb0", color2: "#e0a8ff", corto: "Semilla",  vivo: true  },
  rank_leyenda:   { color: "#d9b866", color2: "#ffffff", corto: "Flor",     vivo: true  },

  // ── Llamas: los sólidos del origen ───────────────────────────────────────
  time_devoto:    { color: "#b0662f", color2: "#ffd08a", corto: "Tetraedro", vivo: false },
  time_habitue:   { color: "#3f4fb0", color2: "#8fd4ff", corto: "Merkaba",   vivo: false },
  time_veterano:  { color: "#6a2fb0", color2: "#e0a8ff", corto: "Metatrón",  vivo: true  },
  time_eterno:    { color: "#d9b866", color2: "#ffffff", corto: "Toroide",   vivo: true  },
}

/**
 * Orden en que se muestran los filtros de La Red. El Embajador va primero
 * porque es la distinción que el administrador concede; luego el Camino, de
 * principio a fin.
 */
export const ORDEN_AURAS = [
  "embajador_galactico",
  "season_1_complete",
  "season_2_complete",
  "season_3_complete",
  "season_4_complete",
] as const

export function getAura(badgeId: string | null | undefined): Aura | undefined {
  return badgeId ? AURAS[badgeId] : undefined
}

/**
 * Los grados que forman el Camino, en orden. Sirve para saber cuál es el más
 * avanzado que alguien ha alcanzado.
 */
export const CAMINO = [
  "season_1_complete",
  "season_2_complete",
  "season_3_complete",
  "season_4_complete",
] as const

/** El grado más avanzado de una lista de insignias desbloqueadas. */
export function gradoMasAlto(desbloqueadas: string[]): string | null {
  const set = new Set(desbloqueadas)
  for (let i = CAMINO.length - 1; i >= 0; i--) {
    if (set.has(CAMINO[i])) return CAMINO[i]
  }
  return null
}

/** El catálogo que se muestra: todo menos lo retirado. */
export const ACHIEVEMENTS_VISIBLES = ACHIEVEMENTS.filter((a) => !a.retirada)
