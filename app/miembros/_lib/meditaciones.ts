// Metadatos CLIENTE de las meditaciones por episodio — TODAS las temporadas.
//
// NO contiene el object key de R2 (eso vive solo en el servidor: lib/meditations.ts
// y la tabla `meditations` de Supabase). El audio se pide al endpoint seguro
// /api/meditations/<id>/audio, que valida sesión + membresía y, para las premium,
// el entitlement en meditation_purchases antes de servir el MP3.
//
// ── CÓMO AÑADIR LA PORTADA ──────────────────────────────────────────────────
// Las portadas viven en el bucket PÚBLICO de R2 (miembros), carpeta /meditaciones,
// y cada archivo se llama como el id de su meditación. Para cambiar una, basta
// con reemplazar el .jpg en R2 conservando el nombre — aquí no se toca nada.
// Si se deja vacío, el reproductor dibuja la portada cósmica de marcador.
//
// ── CÓMO AÑADIR EL AUDIO ────────────────────────────────────────────────────
// 1. Sube el MP3 al bucket privado los144000-media.
// 2. Inserta la fila en `meditations` con docs/sql/meditaciones_nuevas.sql
//    (ahí está el audio_object_key que espera cada id).
//
// TODAS las prácticas las guía JOSÉ — no los guías estelares de cada temporada.
// El reproductor muestra «José · Práctica guiada» / «José · Práctica premium».
//
// El precio de las premium lo decide SIEMPRE la base de datos (price_cents).
// El campo `price` de aquí es solo un texto de respaldo para la UI.

export type MeditationClient = {
  /** Debe coincidir con el id del catálogo servidor y de la tabla `meditations`. */
  id: string
  access: "included" | "premium"
  title: string
  subtitle?: string
  /** Quién guía la práctica. Por defecto José (las conduce él). */
  guia?: string
  /** Portada opcional (URL pública de imagen; el audio NUNCA es público). */
  image?: string
  /** Duración conocida en segundos (para mostrar en el estado bloqueado). */
  durationSec?: number
  /** Precio de respaldo para premium (ej. "4.99"). La DB manda. */
  price?: string
}

// ════════════════════════════════════════════════════════════════════════════
// TEMPORADA 1
// ════════════════════════════════════════════════════════════════════════════

// Ep. 5 · El Nombre que Olvidaste — ya en producción.
const S1E5: MeditationClient[] = [
  {
    id: "s1e5-nombre-included",
    access: "included",
    title: "Sintonía con el Nombre Cósmico",
    subtitle: "Aquieta la mente y abre el silencio interior para percibir tu vibración.",
    image: "https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev/meditaciones/s1e5-nombre-included.jpg",
  },
  {
    id: "s1e5-nombre-premium",
    access: "premium",
    title: "Activación del Nombre Cósmico",
    subtitle: "Práctica guiada completa: recibir, vocalizar y afinar tu nombre cósmico.",
    price: "4.99",
    image: "https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev/meditaciones/s1e5-nombre-premium.jpg",
  },
]

// Ep. 7 · Propósito y Discernimiento
const S1E7: MeditationClient[] = [
  {
    id: "s1e7-proposito-included",
    access: "included",
    title: "Reconocimiento del Propósito de Vida",
    subtitle: "Práctica de escucha para reconocer tu propósito y sellar el pacto de discernimiento.",
    image: "https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev/meditaciones/s1e7-proposito-included.jpg",
  },
  {
    id: "s1e7-nino-interior-included",
    access: "included",
    title: "Sanación del Niño Interior",
    subtitle: "Sana la herida temprana y abre la percepción a las señales del propósito de vida.",
    image: "https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev/meditaciones/s1e7-nino-interior-included.jpg",
  },
]

// ════════════════════════════════════════════════════════════════════════════
// TEMPORADA 2
// ════════════════════════════════════════════════════════════════════════════

const S2E1: MeditationClient[] = [
  {
    id: "s2e1-fuente-premium",
    access: "premium",
    title: "Conexión con la Fuente",
    subtitle: "Práctica guiada completa de encuentro con el Supremo Amor en el centro del origen.",
    price: "4.99",
    image: "https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev/meditaciones/s2e1-fuente-premium.jpg",
  },
]

const S2E3: MeditationClient[] = [
  {
    id: "s2e3-siete-cuerpos-included",
    access: "included",
    title: "Conexión con los Siete Cuerpos",
    subtitle: "Recorrido consciente por los siete vehículos, de la raíz a la corona.",
    image: "https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev/meditaciones/s2e3-siete-cuerpos-included.jpg",
  },
]

const S2E5: MeditationClient[] = [
  {
    id: "s2e5-siete-leyes-included",
    access: "included",
    title: "Repaso de las Siete Leyes Universales",
    subtitle: "Práctica de integración para reconocer las siete leyes actuando en tu experiencia.",
    image: "https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev/meditaciones/s2e5-siete-leyes-included.jpg",
  },
]

// ════════════════════════════════════════════════════════════════════════════
// TEMPORADA 3
// ════════════════════════════════════════════════════════════════════════════

const S3E2: MeditationClient[] = [
  {
    id: "s3e2-lemuria-included",
    access: "included",
    title: "Conexión con Lemuria",
    subtitle: "Regresa a la memoria del Pacífico: agua, sonido y consciencia sin separación.",
    image: "https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev/meditaciones/s3e2-lemuria-included.jpg",
  },
  {
    id: "s3e2-codigos-lemuria-premium",
    access: "premium",
    title: "Activación de los Códigos de Lemuria",
    subtitle: "Práctica guiada completa para activar los códigos lemurianos dormidos en tu memoria.",
    price: "4.99",
    image: "https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev/meditaciones/s3e2-codigos-lemuria-premium.jpg",
  },
]

const S3E3: MeditationClient[] = [
  {
    id: "s3e3-memorias-orion-included",
    access: "included",
    title: "Sanación de las Memorias de Orión",
    subtitle: "Libera memorias de guerra, control, persecución, abuso de poder y antiguas lealtades.",
    image: "https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev/meditaciones/s3e3-memorias-orion-included.jpg",
  },
]

const S3E4: MeditationClient[] = [
  {
    id: "s3e4-atlantida-included",
    access: "included",
    title: "Conexión con la Atlántida",
    subtitle: "Abre el recuerdo del mundo atlante y de lo que allí quedó pendiente.",
    image: "https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev/meditaciones/s3e4-atlantida-included.jpg",
  },
  {
    id: "s3e4-abuso-generacional-included",
    access: "included",
    title: "Sanación de Memorias de Abuso Generacional",
    subtitle: "Reconoce y libera el abuso de poder transmitido a través del linaje.",
    image: "https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev/meditaciones/s3e4-abuso-generacional-included.jpg",
  },
]

const S3E8: MeditationClient[] = [
  {
    id: "s3e8-caida-atlante-included",
    access: "included",
    title: "Integración y Trascendencia de la Atlántida",
    subtitle: "Cierra el ciclo de la caída atlante e integra su aprendizaje en el presente.",
    image: "https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev/meditaciones/s3e8-caida-atlante-included.jpg",
  },
]

// ════════════════════════════════════════════════════════════════════════════
// TEMPORADA 4
// ════════════════════════════════════════════════════════════════════════════

const S4E1: MeditationClient[] = [
  {
    id: "s4e1-am-on-included",
    access: "included",
    title: "Mantra AM-ON",
    subtitle: "Vocalización del mantra de activación que enlaza con la red de discos solares.",
    image: "https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev/meditaciones/s4e1-am-on-included.jpg",
  },
  {
    id: "s4e1-discos-solares-included",
    access: "included",
    title: "Conexión con los Discos Solares",
    subtitle: "Recorrido por los trece nodos de memoria, desde Ilumana hacia toda la red.",
    image: "https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev/meditaciones/s4e1-discos-solares-included.jpg",
  },
]

const S4E6: MeditationClient[] = [
  {
    id: "s4e6-perdon-included",
    access: "included",
    title: "La Llave del Perdón",
    subtitle: "Experiencia de perdón a la luz de Jesús: primero contigo, después con los demás.",
    image: "https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev/meditaciones/s4e6-perdon-included.jpg",
  },
]

// ════════════════════════════════════════════════════════════════════════════

/**
 * Meditaciones de un episodio. Se casa por temporada + número de episodio O por
 * palabras clave del título, igual que los archivos complementarios, para que
 * renumerar o retocar un título no deje las meditaciones sin renderizar.
 */
export function getMeditaciones(season: number, num: number, title: string): MeditationClient[] {
  const t = (title || "").toLowerCase()

  if (season === 1) {
    if (num === 5 || (/nombre/.test(t) && /olvid/.test(t))) return S1E5
    if (num === 7 || /prop[oó]sito/.test(t) || /discernimiento/.test(t)) return S1E7
    return []
  }

  if (season === 2) {
    if (num === 1 || /fuente/.test(t)) return S2E1
    if (num === 3 || /cuerpos/.test(t)) return S2E3
    if (num === 5 || /leyes/.test(t)) return S2E5
    return []
  }

  if (season === 3) {
    if (num === 2 || /lemuria|\bmu\b/.test(t)) return S3E2
    if (num === 3 || /ori[oó]n/.test(t)) return S3E3
    if (num === 4 || /atlantes|transgresi[oó]n/.test(t)) return S3E4
    if (num === 8 || /auge|ca[ií]da|espejo/.test(t)) return S3E8
    return []
  }

  if (season === 4) {
    if (num === 1 || /discos? solar/.test(t)) return S4E1
    if (num === 6 || /jes[uú]s/.test(t)) return S4E6
    return []
  }

  return []
}
