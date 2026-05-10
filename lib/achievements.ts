// Sistema de insignias (achievements) — extraído do public/proyecto base
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
// public/proyecto base (array ACHIEVEMENTS) ou vice-versa.
// (TODO refactor: prototipo importar dessa lib via build step.)

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "topo"
export type AchievementCategory = "progression" | "products" | "agents" | "community" | "time" | "exclusive"

export type Achievement = {
  id: string
  tier: AchievementTier
  category: AchievementCategory
  name: string
  desc: string
  svg: string
  productKey?: string
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    // Insignia EXCLUSIVA pra clientes que contrataram o serviço "¿Quieres un
    // área de miembros igual a esta?" (servicio premium, top da hierarquia
    // junto com El Topo). SVG cinematográfico vermelho com claquete (símbolo de
    // estúdio). Reusa o mesmo glow do el_topo (topoBadgeGlow) — diferencia só
    // pelo símbolo central.
    id: "el_estudio",
    tier: "topo",
    category: "exclusive",
    name: "El Estudio",
    desc: "Insignia exclusiva — Tu propio Estudio (servicio premium [BRAND_NAME])",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="estudio-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fca5a5"/><stop offset="20%" stop-color="#ef4444"/><stop offset="50%" stop-color="#b91c1c"/><stop offset="80%" stop-color="#7f1d1d"/><stop offset="100%" stop-color="#3f0a0a"/></linearGradient><linearGradient id="estudio-shield" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#991b1b"/><stop offset="50%" stop-color="#7f1d1d"/><stop offset="100%" stop-color="#3f0a0a"/></linearGradient><radialGradient id="estudio-spark" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fef2f2" stop-opacity="1"/><stop offset="40%" stop-color="#fca5a5" stop-opacity="0.85"/><stop offset="100%" stop-color="#ef4444" stop-opacity="0"/></radialGradient><radialGradient id="estudio-glow" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#fca5a5" stop-opacity="0.4"/><stop offset="50%" stop-color="#ef4444" stop-opacity="0.15"/><stop offset="100%" stop-color="#7f1d1d" stop-opacity="0"/></radialGradient></defs><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="url(#estudio-shield)" stroke="url(#estudio-grad)" stroke-width="2" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="#ef4444" stroke-width="0.7" opacity="0.6"/><circle cx="32" cy="36" r="22" fill="url(#estudio-glow)"/><g transform="translate(0, 6)"><rect x="18" y="18" width="28" height="6" fill="url(#estudio-grad)" stroke="#fca5a5" stroke-width="0.8" stroke-linejoin="round" rx="0.5"/><polygon points="18,18 22,14 26,18" fill="#fef2f2" stroke="#ef4444" stroke-width="0.6" stroke-linejoin="round"/><polygon points="26,18 30,14 34,18" fill="#7f1d1d" stroke="#fca5a5" stroke-width="0.6" stroke-linejoin="round"/><polygon points="34,18 38,14 42,18" fill="#fef2f2" stroke="#ef4444" stroke-width="0.6" stroke-linejoin="round"/><polygon points="42,18 46,14 50,18 46,18" fill="#7f1d1d" stroke="#fca5a5" stroke-width="0.6" stroke-linejoin="round"/><rect x="20" y="26" width="24" height="20" fill="url(#estudio-shield)" stroke="#ef4444" stroke-width="0.8" stroke-linejoin="round"/><circle cx="32" cy="36" r="6" fill="none" stroke="#fca5a5" stroke-width="1.2"/><circle cx="32" cy="36" r="2.5" fill="url(#estudio-grad)" stroke="#fef2f2" stroke-width="0.5"/><line x1="32" y1="30" x2="32" y2="42" stroke="#fca5a5" stroke-width="0.5" opacity="0.7"/><line x1="26" y1="36" x2="38" y2="36" stroke="#fca5a5" stroke-width="0.5" opacity="0.7"/><circle cx="14" cy="22" r="1.6" fill="url(#estudio-spark)"/><circle cx="50" cy="22" r="1.8" fill="url(#estudio-spark)"/><circle cx="16" cy="46" r="1.4" fill="url(#estudio-spark)"/><circle cx="48" cy="46" r="1.4" fill="url(#estudio-spark)"/><circle cx="32" cy="52" r="1.7" fill="url(#estudio-spark)"/><line x1="12" y1="14" x2="16" y2="18" stroke="#fca5a5" stroke-width="0.6" opacity="0.5"/><line x1="52" y1="14" x2="48" y2="18" stroke="#fca5a5" stroke-width="0.6" opacity="0.5"/></g></svg>`,
  },
  {
    // Insignia EXCLUSIVA pra clientes pra quem a [BRAND_NAME] construiu o embudo
    // (serviço premium, top da hierarquia). SVG cinematográfico vermelho da marca
    // com coroa, picos de montanha e estrela radiante. CSS aplica glow vermelho
    // animado (topoBadgeGlow). Sem fundo/border — só o SVG com brilho próprio.
    id: "el_topo",
    tier: "topo",
    category: "exclusive",
    name: "El Topo",
    desc: "Insignia exclusiva — [BRAND_NAME] construyó tu embudo (servicio premium [BRAND_NAME])",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="topo-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#dc2626"/><stop offset="35%" stop-color="#7f1d1d"/><stop offset="65%" stop-color="#450a0a"/><stop offset="100%" stop-color="#1a0202"/></linearGradient><linearGradient id="topo-shield" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#7f1d1d"/><stop offset="50%" stop-color="#450a0a"/><stop offset="100%" stop-color="#1a0202"/></linearGradient><radialGradient id="topo-spark" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fca5a5" stop-opacity="1"/><stop offset="50%" stop-color="#dc2626" stop-opacity="0.6"/><stop offset="100%" stop-color="#7f1d1d" stop-opacity="0"/></radialGradient><radialGradient id="topo-star" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fef2f2"/><stop offset="40%" stop-color="#fca5a5"/><stop offset="100%" stop-color="#dc2626"/></radialGradient></defs><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="url(#topo-shield)" stroke="url(#topo-grad)" stroke-width="1.8" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="#dc2626" stroke-width="0.6" opacity="0.5"/><g transform="translate(0, 8)"><path d="M 26 4 L 28 8 L 32 6 L 36 8 L 38 4 L 38 10 L 26 10 Z" fill="url(#topo-grad)" stroke="#fca5a5" stroke-width="0.6" stroke-linejoin="round"/><circle cx="28" cy="6" r="0.8" fill="#fca5a5"/><circle cx="32" cy="4" r="1" fill="#fca5a5"/><circle cx="36" cy="6" r="0.8" fill="#fca5a5"/><path d="M 14 38 L 22 22 L 28 32 L 32 18 L 36 32 L 42 22 L 50 38 Z" fill="url(#topo-grad)" stroke="#7f1d1d" stroke-width="0.8" stroke-linejoin="round" opacity="0.95"/><path d="M 16 38 L 22 24 L 28 32" fill="none" stroke="#fca5a5" stroke-width="0.6" opacity="0.5" stroke-linejoin="round"/><path d="M 32 19 L 36 31" fill="none" stroke="#fca5a5" stroke-width="0.6" opacity="0.5"/><path d="M 32 18 L 33.5 23 L 38.5 23 L 34.5 26 L 36 31 L 32 28 L 28 31 L 29.5 26 L 25.5 23 L 30.5 23 Z" fill="url(#topo-star)" stroke="#fef2f2" stroke-width="0.5" stroke-linejoin="round"/><circle cx="32" cy="24" r="1.2" fill="#fef2f2"/><circle cx="18" cy="20" r="1.4" fill="url(#topo-spark)"/><circle cx="46" cy="20" r="1.6" fill="url(#topo-spark)"/><circle cx="20" cy="44" r="1.2" fill="url(#topo-spark)"/><circle cx="44" cy="44" r="1.2" fill="url(#topo-spark)"/><circle cx="32" cy="50" r="1.5" fill="url(#topo-spark)"/><line x1="14" y1="14" x2="18" y2="18" stroke="#fca5a5" stroke-width="0.5" opacity="0.4"/><line x1="50" y1="14" x2="46" y2="18" stroke="#fca5a5" stroke-width="0.5" opacity="0.4"/></g></svg>`,
  },
  {
    // Insignia EXCLUSIVA do administrador. Filtrada pra só aparecer pra is_admin=true
    // (selectable). Quando admin posta, aparece pra todos via author_badge_id.
    // SVG usa gradient + sparkles; CSS no prototipo aplica glow animado pelo id.
    id: "admin_seal",
    tier: "diamond",
    category: "exclusive",
    name: "Sello del Director",
    desc: "Insignia exclusiva del administrador del Estudio",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="adm-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#b9f2ff"/><stop offset="35%" stop-color="#ffffff"/><stop offset="65%" stop-color="#c9a961"/><stop offset="100%" stop-color="#b9f2ff"/></linearGradient><radialGradient id="adm-spark" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffffff" stop-opacity="1"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="url(#adm-grad)" stroke="#fff" stroke-width="1.5" stroke-linejoin="round" opacity="0.95"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.6"/><g transform="translate(0, 8)"><path d="M 32 16 L 35.5 27 L 47 27 L 37.5 33.5 L 41 44.5 L 32 38 L 23 44.5 L 26.5 33.5 L 17 27 L 28.5 27 Z" fill="#fff" stroke="#c9a961" stroke-width="0.6" stroke-linejoin="round"/><circle cx="32" cy="30" r="2.2" fill="#b9f2ff" stroke="#fff" stroke-width="0.5"/><circle cx="20" cy="20" r="1.4" fill="url(#adm-spark)"/><circle cx="44" cy="20" r="1.6" fill="url(#adm-spark)"/><circle cx="46" cy="42" r="1.2" fill="url(#adm-spark)"/><circle cx="18" cy="42" r="1.2" fill="url(#adm-spark)"/><circle cx="32" cy="50" r="1.5" fill="url(#adm-spark)"/></g></svg>`,
  },
  {
    id: "welcome",
    tier: "bronze",
    category: "progression",
    name: "Bienvenido al Estudio",
    desc: "Has entrado en la plataforma",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.5"/><g transform="translate(0, 8)"><path d="M 32 18 L 35 28 L 45 28 L 37 34 L 40 44 L 32 38 L 24 44 L 27 34 L 19 28 L 29 28 Z" fill="currentColor" opacity="0.85"/><line x1="32" y1="14" x2="32" y2="10" stroke="currentColor" stroke-width="1.2" opacity="0.6"/><line x1="20" y1="20" x2="16" y2="16" stroke="currentColor" stroke-width="1" opacity="0.5"/><line x1="44" y1="20" x2="48" y2="16" stroke="currentColor" stroke-width="1" opacity="0.5"/><path d="M 18 50 L 32 56 L 46 50" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7"/></g></svg>`,
  },
  {
    id: "first_lesson",
    tier: "bronze",
    category: "progression",
    name: "Primer Plano",
    desc: "Concluiste tu primera clase",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.5"/><g transform="translate(0, 8)"><rect x="20" y="22" width="24" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><polygon points="28,26 28,34 36,30" fill="currentColor"/><path d="M 20 22 L 22 18 L 26 18 L 24 22 M 28 22 L 30 18 L 34 18 L 32 22 M 36 22 L 38 18 L 42 18 L 40 22" stroke="currentColor" stroke-width="1" fill="none" stroke-linejoin="round" opacity="0.8"/><path d="M 14 38 Q 18 44 18 50" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/><path d="M 50 38 Q 46 44 46 50" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/></g></svg>`,
  },
  {
    id: "agent_estratega",
    tier: "bronze",
    category: "progression",
    name: "Agente Estratega",
    desc: "Concluiste la clase del Agente Estratega",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.5"/><g transform="translate(0, 8)"><path d="M 20 28 L 22 18 L 26 24 L 32 14 L 38 24 L 42 18 L 44 28 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="22" cy="18" r="1.2" fill="currentColor"/><circle cx="32" cy="14" r="1.5" fill="currentColor"/><circle cx="42" cy="18" r="1.2" fill="currentColor"/><rect x="20" y="29" width="24" height="2" fill="currentColor"/><circle cx="32" cy="40" r="3" fill="currentColor"/></g></svg>`,
  },
  {
    id: "agent_minivsl",
    tier: "bronze",
    category: "progression",
    name: "Agente Mini VSL",
    desc: "Concluiste la clase del Mini VSL",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.5"/><g transform="translate(0, 8)"><rect x="18" y="22" width="22" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="26" cy="29" r="4" fill="none" stroke="currentColor" stroke-width="1.2"/><polygon points="24,27 24,31 28,29" fill="currentColor"/><rect x="40" y="24" width="6" height="4" fill="currentColor" opacity="0.7"/><rect x="18" y="18" width="22" height="3" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.6"/><line x1="22" y1="18" x2="22" y2="21" stroke="currentColor" stroke-width="0.4" opacity="0.5"/><line x1="26" y1="18" x2="26" y2="21" stroke="currentColor" stroke-width="0.4" opacity="0.5"/><line x1="30" y1="18" x2="30" y2="21" stroke="currentColor" stroke-width="0.4" opacity="0.5"/><line x1="34" y1="18" x2="34" y2="21" stroke="currentColor" stroke-width="0.4" opacity="0.5"/></g></svg>`,
  },
  {
    id: "agent_copywriter",
    tier: "bronze",
    category: "progression",
    name: "Agente Copywriter",
    desc: "Concluiste la clase del Copywriter",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.5"/><g transform="translate(0, 8)"><path d="M 20 38 L 42 16 L 46 12 L 44 16 L 22 40 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><line x1="24" y1="34" x2="42" y2="16" stroke="currentColor" stroke-width="0.5" opacity="0.4"/><line x1="26" y1="36" x2="44" y2="18" stroke="currentColor" stroke-width="0.5" opacity="0.4"/><circle cx="22" cy="40" r="2" fill="currentColor"/><line x1="18" y1="44" x2="42" y2="44" stroke="currentColor" stroke-width="0.8" stroke-dasharray="3,2" opacity="0.5"/><line x1="18" y1="48" x2="36" y2="48" stroke="currentColor" stroke-width="0.8" stroke-dasharray="3,2" opacity="0.4"/></g></svg>`,
  },
  {
    id: "agent_constructor",
    tier: "bronze",
    category: "progression",
    name: "Agente Constructor",
    desc: "Concluiste la clase del Constructor",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.5"/><g transform="translate(0, 8)"><line x1="32" y1="14" x2="22" y2="36" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="32" y1="14" x2="42" y2="36" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="32" cy="14" r="2" fill="currentColor"/><circle cx="22" cy="36" r="1.4" fill="currentColor"/><circle cx="42" cy="36" r="1.4" fill="currentColor"/><line x1="18" y1="30" x2="46" y2="30" stroke="currentColor" stroke-width="1" opacity="0.7"/><line x1="22" y1="30" x2="22" y2="33" stroke="currentColor" stroke-width="0.6" opacity="0.5"/><line x1="28" y1="30" x2="28" y2="33" stroke="currentColor" stroke-width="0.6" opacity="0.5"/><line x1="32" y1="30" x2="32" y2="33" stroke="currentColor" stroke-width="0.6" opacity="0.5"/><line x1="36" y1="30" x2="36" y2="33" stroke="currentColor" stroke-width="0.6" opacity="0.5"/><line x1="42" y1="30" x2="42" y2="33" stroke="currentColor" stroke-width="0.6" opacity="0.5"/></g></svg>`,
  },
  {
    id: "season_1_complete",
    tier: "bronze",
    category: "progression",
    name: "Acto I — La Materia Prima",
    desc: "Dominaste los Agentes GPT",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.5"/><g transform="translate(0, 8)"><path d="M 20 26 L 22 18 L 26 24 L 32 14 L 38 24 L 42 18 L 44 26 L 20 26 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="22" cy="18" r="1.2" fill="currentColor"/><circle cx="32" cy="14" r="1.5" fill="currentColor"/><circle cx="42" cy="18" r="1.2" fill="currentColor"/><rect x="18" y="28" width="28" height="3" fill="currentColor" opacity="0.85"/><line x1="22" y1="54" x2="42" y2="54" stroke="currentColor" stroke-width="0.8" opacity="0.6"/></g></svg>`,
  },
  {
    id: "season_2_complete",
    tier: "bronze",
    category: "progression",
    name: "Acto II — La Forja",
    desc: "Construiste tu estructura",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.5"/><g transform="translate(0, 8)"><line x1="32" y1="16" x2="22" y2="36" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="32" y1="16" x2="42" y2="36" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="32" cy="16" r="2" fill="currentColor"/><circle cx="22" cy="36" r="1.5" fill="currentColor"/><circle cx="42" cy="36" r="1.5" fill="currentColor"/><line x1="18" y1="30" x2="46" y2="30" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><line x1="20" y1="58" x2="44" y2="58" stroke="currentColor" stroke-width="0.8" opacity="0.6"/></g></svg>`,
  },
  {
    id: "season_3_complete",
    tier: "bronze",
    category: "progression",
    name: "Acto III — El Lente",
    desc: "Dominaste la creación audiovisual",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.5"/><g transform="translate(0, 8)"><circle cx="32" cy="28" r="11" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="32" cy="28" r="7" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/><circle cx="32" cy="28" r="3" fill="currentColor"/><circle cx="29" cy="25" r="1.5" fill="currentColor" opacity="0.4"/><line x1="20" y1="58" x2="44" y2="58" stroke="currentColor" stroke-width="0.8" opacity="0.6"/></g></svg>`,
  },
  {
    id: "season_4_complete",
    tier: "bronze",
    category: "progression",
    name: "Acto IV — La Activación",
    desc: "Implementaste la estructura",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.5"/><g transform="translate(0, 8)"><circle cx="32" cy="28" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="32" cy="28" r="6" fill="none" stroke="currentColor" stroke-width="1" opacity="0.7"/><line x1="32" y1="14" x2="32" y2="20" stroke="currentColor" stroke-width="1.5"/><line x1="32" y1="36" x2="32" y2="42" stroke="currentColor" stroke-width="1.5"/><line x1="18" y1="28" x2="24" y2="28" stroke="currentColor" stroke-width="1.5"/><line x1="40" y1="28" x2="46" y2="28" stroke="currentColor" stroke-width="1.5"/><rect x="30" y="26" width="4" height="4" fill="currentColor"/></g></svg>`,
  },
  {
    id: "vip_community",
    tier: "silver",
    category: "progression",
    name: "Círculo VIP",
    desc: "Entraste a la comunidad privada",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.6"/><path d="M 14 12 L 50 12 L 50 36 Q 50 50 32 58 Q 14 50 14 36 Z" fill="none" stroke="currentColor" stroke-width="0.4" opacity="0.4"/><g transform="translate(0, 8)"><path d="M 18 24 Q 22 20 26 24 Q 22 28 18 24" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M 46 24 Q 42 20 38 24 Q 42 28 46 24" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M 16 32 Q 20 28 24 32 Q 20 36 16 32" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M 48 32 Q 44 28 40 32 Q 44 36 48 32" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M 26 22 L 32 38 L 38 22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M 32 14 L 33.5 17 L 36.5 17 L 34 19 L 35 22 L 32 20 L 29 22 L 30 19 L 27.5 17 L 30.5 17 Z" fill="currentColor" opacity="0.9"/></g></svg>`,
  },
  {
    // Insignia rara — só desbloqueia quando user assiste TODOS os episódios
    // de TODAS as temporadas (T1-T4). Tier gold = aparece como FOMO
    // pra outros users (silver+ broadcast).
    id: "training_complete",
    tier: "gold",
    category: "progression",
    name: "Entrenamiento Completo",
    desc: "Concluiste todas las clases de todas las temporadas",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.6"/><path d="M 14 12 L 50 12 L 50 36 Q 50 50 32 58 Q 14 50 14 36 Z" fill="none" stroke="currentColor" stroke-width="0.4" opacity="0.35"/><g transform="translate(0, 8)"><path d="M 32 14 L 35.5 26 L 47 26 L 37.5 33 L 41 45 L 32 38 L 23 45 L 26.5 33 L 17 26 L 28.5 26 Z" fill="currentColor" opacity="0.95"/><circle cx="32" cy="29" r="2.2" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.7"/><circle cx="20" cy="20" r="1" fill="currentColor" opacity="0.7"/><circle cx="44" cy="20" r="1" fill="currentColor" opacity="0.7"/><circle cx="18" cy="38" r="1" fill="currentColor" opacity="0.6"/><circle cx="46" cy="38" r="1" fill="currentColor" opacity="0.6"/><line x1="14" y1="14" x2="17" y2="17" stroke="currentColor" stroke-width="0.8" opacity="0.5"/><line x1="50" y1="14" x2="47" y2="17" stroke="currentColor" stroke-width="0.8" opacity="0.5"/><path d="M 22 50 L 32 54 L 42 50" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`,
  },
  {
    // Pack de Ganchos Neuronales — bonus desbloqueado via comentário em
    // post da comunidade com tag BONO. Tier silver (mais baixo que produtos
    // pagos gold) pra refletir que é gratuito. SVG com gancho/cérebro.
    // Posicionado logo após training_complete e antes dos products pagos
    // pra ser a "primeira insignia de produto" da hierarquia.
    id: "product_bonus_ganchos",
    tier: "silver",
    category: "products",
    productKey: "Pack de Ganchos Neuronales™",
    name: "Hooks Neuronales",
    desc: "Desbloqueaste el Pack de Ganchos Neuronales",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="hook-shield" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#d1d5db"/><stop offset="50%" stop-color="#9ca3af"/><stop offset="100%" stop-color="#4b5563"/></linearGradient><linearGradient id="hook-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f3f4f6"/><stop offset="50%" stop-color="#d1d5db"/><stop offset="100%" stop-color="#9ca3af"/></linearGradient></defs><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="url(#hook-shield)" stroke="url(#hook-grad)" stroke-width="1.8" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="#f3f4f6" stroke-width="0.6" opacity="0.5"/><g transform="translate(0, 8)"><path d="M 32 14 Q 26 16 24 22 Q 22 28 26 32 Q 30 36 36 34 Q 40 32 40 28" fill="none" stroke="#f9fafb" stroke-width="2.2" stroke-linecap="round"/><circle cx="40" cy="28" r="2.5" fill="#f9fafb"/><circle cx="20" cy="20" r="1.4" fill="#f3f4f6" opacity="0.85"/><circle cx="44" cy="20" r="1.4" fill="#f3f4f6" opacity="0.85"/><circle cx="22" cy="40" r="1.2" fill="#f3f4f6" opacity="0.7"/><circle cx="42" cy="40" r="1.2" fill="#f3f4f6" opacity="0.7"/><line x1="22" y1="22" x2="20" y2="20" stroke="#f9fafb" stroke-width="0.5" opacity="0.6"/><line x1="42" y1="22" x2="44" y2="20" stroke="#f9fafb" stroke-width="0.5" opacity="0.6"/></g></svg>`,
  },
  {
    id: "product_creativos",
    tier: "gold",
    category: "products",
    productKey: "Creativos.AI",
    name: "Creativos Master",
    desc: "Adquiriste Creativos.AI",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="creat-shield" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#c9a961"/><stop offset="50%" stop-color="#8a7236"/><stop offset="100%" stop-color="#4a3d1c"/></linearGradient><linearGradient id="creat-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fde68a"/><stop offset="50%" stop-color="#c9a961"/><stop offset="100%" stop-color="#8a7236"/></linearGradient></defs><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="url(#creat-shield)" stroke="url(#creat-grad)" stroke-width="1.8" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="#fde68a" stroke-width="0.6" opacity="0.5"/><g transform="translate(0, 8)"><rect x="20" y="22" width="24" height="18" rx="1" fill="rgba(254,230,138,0.18)" stroke="#fde68a" stroke-width="1.4"/><line x1="20" y1="28" x2="44" y2="28" stroke="#fde68a" stroke-width="0.8" opacity="0.7"/><circle cx="24" cy="25" r="0.8" fill="#fde68a"/><circle cx="27" cy="25" r="0.8" fill="#fde68a"/><circle cx="30" cy="25" r="0.8" fill="#fde68a"/><path d="M 24 33 L 28 31 L 32 35 L 36 32 L 40 36" stroke="#fde68a" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M 28 14 L 30 10 L 32 14 L 36 16 L 32 18 L 30 22 L 28 18 L 24 16 Z" fill="#fef2f2" opacity="0.95"/></g></svg>`,
  },
  {
    id: "product_andromeda",
    tier: "gold",
    category: "products",
    productKey: "Andrómeda.ADS",
    name: "Estratega Andrómeda",
    desc: "Adquiriste Andrómeda.ADS",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="andr-shield" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#c9a961"/><stop offset="50%" stop-color="#8a7236"/><stop offset="100%" stop-color="#4a3d1c"/></linearGradient><linearGradient id="andr-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fde68a"/><stop offset="50%" stop-color="#c9a961"/><stop offset="100%" stop-color="#8a7236"/></linearGradient></defs><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="url(#andr-shield)" stroke="url(#andr-grad)" stroke-width="1.8" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="#fde68a" stroke-width="0.6" opacity="0.5"/><g transform="translate(0, 8)"><line x1="32" y1="28" x2="22" y2="22" stroke="#fde68a" stroke-width="0.6" opacity="0.6"/><line x1="32" y1="28" x2="42" y2="22" stroke="#fde68a" stroke-width="0.6" opacity="0.6"/><line x1="32" y1="28" x2="20" y2="34" stroke="#fde68a" stroke-width="0.6" opacity="0.6"/><line x1="32" y1="28" x2="44" y2="34" stroke="#fde68a" stroke-width="0.6" opacity="0.6"/><line x1="32" y1="28" x2="32" y2="18" stroke="#fde68a" stroke-width="0.6" opacity="0.6"/><line x1="32" y1="28" x2="32" y2="40" stroke="#fde68a" stroke-width="0.6" opacity="0.6"/><circle cx="32" cy="28" r="2.5" fill="#fef2f2"/><circle cx="22" cy="22" r="1.4" fill="#fde68a"/><circle cx="42" cy="22" r="1.4" fill="#fde68a"/><circle cx="20" cy="34" r="1.2" fill="#fde68a" opacity="0.85"/><circle cx="44" cy="34" r="1.2" fill="#fde68a" opacity="0.85"/><circle cx="32" cy="18" r="1.2" fill="#fde68a" opacity="0.85"/><circle cx="32" cy="40" r="1.2" fill="#fde68a" opacity="0.85"/></g></svg>`,
  },
  {
    id: "product_analytics",
    tier: "gold",
    category: "products",
    productKey: "Analytics.KPI",
    name: "Analista KPI",
    desc: "Adquiriste Analytics.KPI",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="anal-shield" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#c9a961"/><stop offset="50%" stop-color="#8a7236"/><stop offset="100%" stop-color="#4a3d1c"/></linearGradient><linearGradient id="anal-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fde68a"/><stop offset="50%" stop-color="#c9a961"/><stop offset="100%" stop-color="#8a7236"/></linearGradient></defs><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="url(#anal-shield)" stroke="url(#anal-grad)" stroke-width="1.8" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="#fde68a" stroke-width="0.6" opacity="0.5"/><g transform="translate(0, 8)"><line x1="20" y1="38" x2="44" y2="38" stroke="#fde68a" stroke-width="1" opacity="0.8"/><line x1="20" y1="14" x2="20" y2="38" stroke="#fde68a" stroke-width="1" opacity="0.8"/><rect x="22" y="30" width="3" height="8" fill="#fde68a" opacity="0.9"/><rect x="27" y="24" width="3" height="14" fill="#fde68a" opacity="0.9"/><rect x="32" y="20" width="3" height="18" fill="#fef2f2" opacity="0.95"/><rect x="37" y="16" width="3" height="22" fill="#fef2f2"/><path d="M 22 32 L 28 26 L 33 22 L 38 18" stroke="#fef2f2" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="38" cy="18" r="1.8" fill="#fef2f2"/></g></svg>`,
  },
  {
    id: "product_minivsl",
    tier: "gold",
    category: "products",
    productKey: "Agente Copy Mini VSL's",
    name: "Director de VSLs",
    desc: "Adquiriste el Agente Mini VSL",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="vsl-shield" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#c9a961"/><stop offset="50%" stop-color="#8a7236"/><stop offset="100%" stop-color="#4a3d1c"/></linearGradient><linearGradient id="vsl-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fde68a"/><stop offset="50%" stop-color="#c9a961"/><stop offset="100%" stop-color="#8a7236"/></linearGradient></defs><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="url(#vsl-shield)" stroke="url(#vsl-grad)" stroke-width="1.8" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="#fde68a" stroke-width="0.6" opacity="0.5"/><g transform="translate(0, 8)"><rect x="18" y="22" width="28" height="18" rx="2" fill="rgba(254,230,138,0.15)" stroke="#fde68a" stroke-width="1.5"/><polygon points="28,28 28,38 38,33" fill="#fef2f2"/><rect x="14" y="20" width="4" height="22" fill="rgba(254,230,138,0.1)" stroke="#fde68a" stroke-width="0.8" opacity="0.8"/><rect x="46" y="20" width="4" height="22" fill="rgba(254,230,138,0.1)" stroke="#fde68a" stroke-width="0.8" opacity="0.8"/><line x1="14" y1="24" x2="18" y2="24" stroke="#fde68a" stroke-width="0.6" opacity="0.7"/><line x1="14" y1="30" x2="18" y2="30" stroke="#fde68a" stroke-width="0.6" opacity="0.7"/><line x1="14" y1="36" x2="18" y2="36" stroke="#fde68a" stroke-width="0.6" opacity="0.7"/><line x1="46" y1="24" x2="50" y2="24" stroke="#fde68a" stroke-width="0.6" opacity="0.7"/><line x1="46" y1="30" x2="50" y2="30" stroke="#fde68a" stroke-width="0.6" opacity="0.7"/><line x1="46" y1="36" x2="50" y2="36" stroke="#fde68a" stroke-width="0.6" opacity="0.7"/></g></svg>`,
  },
  {
    // Embudo Revisado — produto premium (tratamento exclusive: glow dourado
    // animado + sem fundo, igual admin_seal e el_topo). Posicionado depois
    // dos outros products pra ser visualmente o "topo" da hierarquia
    // de produtos.
    id: "product_revisao",
    tier: "gold",
    category: "products",
    productKey: "Revisión de Tu Embudo",
    name: "Embudo Revisado",
    desc: "Adquiriste la Revisión de Embudo",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="revi-shield" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#c9a961"/><stop offset="50%" stop-color="#8a7236"/><stop offset="100%" stop-color="#4a3d1c"/></linearGradient><linearGradient id="revi-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fde68a"/><stop offset="50%" stop-color="#c9a961"/><stop offset="100%" stop-color="#8a7236"/></linearGradient></defs><path d="M 8 6 L 56 6 L 56 36 Q 56 56 32 66 Q 8 56 8 36 Z" fill="url(#revi-shield)" stroke="url(#revi-grad)" stroke-width="1.8" stroke-linejoin="round"/><path d="M 12 10 L 52 10 L 52 36 Q 52 52 32 60 Q 12 52 12 36 Z" fill="none" stroke="#fde68a" stroke-width="0.6" opacity="0.5"/><g transform="translate(0, 8)"><circle cx="28" cy="26" r="9" fill="rgba(254,230,138,0.15)" stroke="#fef2f2" stroke-width="1.8"/><line x1="34" y1="32" x2="42" y2="40" stroke="#fef2f2" stroke-width="2.2" stroke-linecap="round"/><line x1="24" y1="26" x2="32" y2="26" stroke="#fde68a" stroke-width="0.9" opacity="0.85"/><line x1="24" y1="23" x2="29" y2="23" stroke="#fde68a" stroke-width="0.9" opacity="0.85"/><line x1="24" y1="29" x2="30" y2="29" stroke="#fde68a" stroke-width="0.9" opacity="0.85"/></g></svg>`,
  },

  // ─── COMUNIDAD (rank por número de posts no fórum) ─────────────────────
  // Sistema de rank "Agente": Civil (0) → Recluta → Agente → Operador →
  // Estratega → Capo → Padrino → Leyenda. Civil não tem insignia.
  {
    id: "rank_recluta",
    tier: "bronze",
    category: "community",
    name: "Recluta",
    desc: "1+ post",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><path d="M 32 8 L 38 30 L 60 36 L 38 42 L 32 64 L 26 42 L 4 36 L 26 30 Z" fill="currentColor" stroke="currentColor" stroke-width="0.5" stroke-linejoin="round"/></svg>`,
  },
  {
    id: "rank_agente",
    tier: "bronze",
    category: "community",
    name: "Agente",
    desc: "10+ posts",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><path d="M 32 6 L 39 28 L 62 28 L 43 42 L 50 64 L 32 50 L 14 64 L 21 42 L 2 28 L 25 28 Z" fill="currentColor" stroke="currentColor" stroke-width="0.5" stroke-linejoin="round"/></svg>`,
  },
  {
    id: "rank_operador",
    tier: "silver",
    category: "community",
    name: "Operador",
    desc: "50+ posts",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><path d="M 32 4 L 42 20 L 62 20 L 52 36 L 62 52 L 42 52 L 32 68 L 22 52 L 2 52 L 12 36 L 2 20 L 22 20 Z" fill="currentColor" stroke="currentColor" stroke-width="0.4" stroke-linejoin="round"/></svg>`,
  },
  {
    id: "rank_estratega",
    tier: "silver",
    category: "community",
    name: "Estratega",
    desc: "100+ posts",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><path d="M 32 4 L 36 32 L 64 36 L 36 40 L 32 68 L 28 40 L 0 36 L 28 32 Z" fill="currentColor" stroke="currentColor" stroke-width="0.4" stroke-linejoin="round"/><line x1="14" y1="18" x2="28" y2="32" stroke="currentColor" stroke-width="1.5" opacity="0.5" stroke-linecap="round"/><line x1="50" y1="18" x2="36" y2="32" stroke="currentColor" stroke-width="1.5" opacity="0.5" stroke-linecap="round"/><line x1="14" y1="54" x2="28" y2="40" stroke="currentColor" stroke-width="1.5" opacity="0.5" stroke-linecap="round"/><line x1="50" y1="54" x2="36" y2="40" stroke="currentColor" stroke-width="1.5" opacity="0.5" stroke-linecap="round"/></svg>`,
  },
  {
    id: "rank_capo",
    tier: "gold",
    category: "community",
    name: "Capo",
    desc: "200+ posts",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><path d="M 32 4 L 36 26 L 56 14 L 44 34 L 64 36 L 44 38 L 56 58 L 36 46 L 32 68 L 28 46 L 8 58 L 20 38 L 0 36 L 20 34 L 8 14 L 28 26 Z" fill="currentColor" stroke="currentColor" stroke-width="0.4" stroke-linejoin="round"/><circle cx="32" cy="36" r="3" fill="rgba(0,0,0,0.4)"/></svg>`,
  },
  {
    id: "rank_padrino",
    tier: "gold",
    category: "community",
    name: "Padrino",
    desc: "300+ posts",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor" stroke="currentColor" stroke-width="0.4" stroke-linejoin="round"><path d="M 32 4 L 34 32 L 32 36 L 30 32 Z"/><path d="M 60 36 L 36 34 L 32 36 L 36 38 Z"/><path d="M 32 68 L 30 40 L 32 36 L 34 40 Z"/><path d="M 4 36 L 28 38 L 32 36 L 28 34 Z"/><path d="M 52 16 L 36 32 L 32 36 L 36 32 Z" opacity="0.85"/><path d="M 52 56 L 36 40 L 32 36 L 36 40 Z" opacity="0.85"/><path d="M 12 56 L 28 40 L 32 36 L 28 40 Z" opacity="0.85"/><path d="M 12 16 L 28 32 L 32 36 L 28 32 Z" opacity="0.85"/></g><circle cx="32" cy="36" r="4" fill="currentColor"/></svg>`,
  },
  {
    id: "rank_leyenda",
    tier: "topo",
    category: "community",
    name: "Leyenda",
    desc: "500+ posts",
    // Tier topo (vermelho da marca) + glow animado igual EL TOPO — estrela
    // suprema da comunidad. Renderização aplica topoBadgeGlow.
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="leyenda-star" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fef2f2"/><stop offset="40%" stop-color="#fca5a5"/><stop offset="80%" stop-color="#dc2626"/><stop offset="100%" stop-color="#7f1d1d"/></radialGradient></defs><circle cx="32" cy="36" r="30" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.5"/><circle cx="32" cy="36" r="22" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.4"/><path d="M 32 8 L 39 28 L 60 28 L 43 41 L 50 62 L 32 49 L 14 62 L 21 41 L 4 28 L 25 28 Z" fill="url(#leyenda-star)" stroke="currentColor" stroke-width="0.5" stroke-linejoin="round"/><circle cx="32" cy="36" r="3" fill="#fef2f2"/></svg>`,
  },

  // ─── TIEMPO (dias únicos de acceso à plataforma) ────────────────────────
  {
    id: "time_devoto",
    tier: "bronze",
    category: "time",
    name: "Devoto",
    desc: "7 días únicos",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><path d="M 32 8 Q 22 24 22 40 Q 22 58 32 62 Q 42 58 42 40 Q 42 24 32 8 Z" fill="currentColor" stroke="currentColor" stroke-width="0.4" stroke-linejoin="round"/><path d="M 32 24 Q 27 32 27 42 Q 27 50 32 52 Q 37 50 37 42 Q 37 32 32 24 Z" fill="rgba(255,255,255,0.4)"/></svg>`,
  },
  {
    id: "time_habitue",
    tier: "silver",
    category: "time",
    name: "Habitué",
    desc: "30 días únicos",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><rect x="22" y="42" width="20" height="22" fill="currentColor" opacity="0.85"/><line x1="22" y1="46" x2="42" y2="46" stroke="rgba(0,0,0,0.3)" stroke-width="0.8"/><path d="M 32 6 Q 20 18 20 30 Q 20 42 32 46 Q 44 42 44 30 Q 44 18 32 6 Z" fill="currentColor" stroke="currentColor" stroke-width="0.4" stroke-linejoin="round"/><path d="M 32 16 Q 26 24 26 32 Q 26 38 32 40 Q 38 38 38 32 Q 38 24 32 16 Z" fill="rgba(255,255,255,0.5)"/></svg>`,
  },
  {
    id: "time_veterano",
    tier: "gold",
    category: "time",
    name: "Veterano",
    desc: "60 días únicos",
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><path d="M 6 60 L 58 60 L 52 66 L 12 66 Z" fill="currentColor" opacity="0.7"/><line x1="14" y1="62" x2="50" y2="55" stroke="currentColor" stroke-width="2" opacity="0.6"/><line x1="50" y1="62" x2="14" y2="55" stroke="currentColor" stroke-width="2" opacity="0.6"/><path d="M 32 6 Q 18 18 18 38 Q 18 52 32 58 Q 46 52 46 38 Q 46 18 32 6 Z" fill="currentColor" stroke="currentColor" stroke-width="0.4"/><path d="M 32 18 Q 24 28 24 40 Q 24 50 32 54 Q 40 50 40 40 Q 40 28 32 18 Z" fill="rgba(255,255,255,0.5)"/><path d="M 14 36 Q 8 44 8 50 Q 8 56 14 58 Q 20 56 20 50 Q 20 44 14 36 Z" fill="currentColor" opacity="0.7"/><path d="M 50 36 Q 44 44 44 50 Q 44 56 50 58 Q 56 56 56 50 Q 56 44 50 36 Z" fill="currentColor" opacity="0.7"/></svg>`,
  },
  {
    id: "time_eterno",
    tier: "topo",
    category: "time",
    name: "Eterno",
    desc: "90 días únicos",
    // Tier topo (vermelho da marca) + glow animado igual EL TOPO — chama
    // suprema do tempo. Renderização aplica topoBadgeGlow nos componentes.
    svg: `<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="eterno-flame" cx="50%" cy="55%" r="50%"><stop offset="0%" stop-color="#fef2f2"/><stop offset="40%" stop-color="#fca5a5"/><stop offset="80%" stop-color="#dc2626"/><stop offset="100%" stop-color="#7f1d1d"/></radialGradient></defs><circle cx="32" cy="36" r="30" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.5"/><circle cx="32" cy="36" r="22" fill="none" stroke="currentColor" stroke-width="0.4" opacity="0.4"/><path d="M 32 6 Q 16 18 16 40 Q 16 56 32 62 Q 48 56 48 40 Q 48 18 32 6 Z" fill="url(#eterno-flame)" stroke="currentColor" stroke-width="0.4"/><path d="M 32 18 Q 22 30 22 42 Q 22 52 32 56 Q 42 52 42 42 Q 42 30 32 18 Z" fill="rgba(254,242,242,0.6)"/><circle cx="32" cy="46" r="3" fill="#fef2f2"/><circle cx="6" cy="14" r="1.4" fill="currentColor"/><circle cx="58" cy="14" r="1.4" fill="currentColor"/><circle cx="6" cy="56" r="1.2" fill="currentColor" opacity="0.7"/><circle cx="58" cy="56" r="1.2" fill="currentColor" opacity="0.7"/></svg>`,
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
  { min: 1,    label: "Recluta",   tier: "bronze",    badge_id: "rank_recluta" },
  { min: 10,   label: "Agente",    tier: "bronze",    badge_id: "rank_agente" },
  { min: 50,   label: "Operador",  tier: "silver",    badge_id: "rank_operador" },
  { min: 100,  label: "Estratega", tier: "silver",    badge_id: "rank_estratega" },
  { min: 200,  label: "Capo",      tier: "gold",      badge_id: "rank_capo" },
  { min: 300,  label: "Padrino",   tier: "gold",      badge_id: "rank_padrino" },
  { min: 500,  label: "Leyenda",   tier: "topo",      badge_id: "rank_leyenda" },
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
    badgeId === "product_revisao"
  )
}

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id)
}

export function getTierColor(tier: AchievementTier): string {
  return TIER_COLORS[tier]
}
