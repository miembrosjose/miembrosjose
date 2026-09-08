// LUGARES DE CONTACTO — Mapa Cósmico de la Red.
// Modelo de datos + categorías (con color) + acceso a la API (/api/lugares) para
// los puntos, y almacén local para testimonios/guardados personales.
//
// Los PUNTOS ahora se guardan en Supabase (tabla contact_places) vía /api/lugares
// para que las solicitudes de la comunidad lleguen a la administración y puedan
// aprobarse/denegarse. Los testimonios y "guardados/visitados" personales siguen
// en localStorage (aislado: los144k_lugares_*) por ahora.

export type AuthorityLevel = "official" | "community" | "pending" | "featured"
export type PlaceStatus = "published" | "pending_review" | "rejected" | "hidden"

export type ContactPlace = {
  id: string
  name: string
  slug: string
  country: string
  region?: string
  city?: string
  latitude: number | null
  longitude: number | null
  category: string
  authorityLevel: AuthorityLevel
  status: PlaceStatus
  shortDescription: string
  longDescription?: string
  memoryType?: string
  contactRelation?: string
  visitRecommendations?: string
  suggestedPractice?: string
  tags: string[]
  images: string[]
  videos: string[]
  createdBy?: string
  createdAt: string
  updatedAt: string
  approvedBy?: string
  approvedAt?: string
  mine?: boolean
  // ── Mapa Cósmico (Fase 1) — campos ampliados (opcionales) ───────────
  tipoPrincipal?: string        // clave de TIPOS (disco_solar, contacto, chakra…)
  nombreEnergetico?: string     // p.ej. "Emanashi"
  capas?: string[]              // capas energéticas (Telos, Lemuria, ERKS…)
  nivelAutoridad?: string       // clave de NIVELES
  alias?: string[]              // escrituras alternativas
  relacionContacto?: string
  relacionDisco?: string
  relacionRetiro?: string
  relacionIntra?: string
  relacionHistorica?: string
  linajes?: string[]
  funcionEnergetica?: string
  recomendacionesVisita?: string
  fuentesNotas?: string
  chakra?: { continente: string; color: string; radioKm: number }
}

export type ContactPlaceTestimony = {
  id: string; placeId: string; userId?: string; title?: string
  testimony: string; date?: string; isPrivate: boolean; status: PlaceStatus; createdAt: string
}
export type SavedContactPlace = {
  id: string; placeId: string; status: "saved" | "visited" | "worked"; notes?: string; createdAt: string
}

// ── Categorías (con color propio para el mapa y las fichas) ─────────────
export const PLACE_CATEGORIES: { id: string; label: string; color: string }[] = [
  { id: "oficial_contacto", label: "Lugar oficial de contacto", color: "#e6cf95" },
  { id: "comunitario", label: "Punto comunitario", color: "#a78bca" },
  { id: "avistamiento", label: "Zona de avistamiento", color: "#67e8f9" },
  { id: "sagrado", label: "Lugar sagrado", color: "#f0abfc" },
  { id: "retiro", label: "Retiro interior", color: "#86efac" },
  { id: "disco_solar", label: "Disco solar", color: "#fbbf24" },
  { id: "nodo", label: "Nodo local", color: "#93c5fd" },
  { id: "activacion", label: "Activación territorial", color: "#fca5a5" },
  { id: "natural", label: "Cueva / montaña / laguna / desierto / templo", color: "#a3e635" },
  { id: "otro", label: "Otro", color: "#cbd5e1" },
]
export function categoryLabel(id: string): string { return PLACE_CATEGORIES.find((c) => c.id === id)?.label || "Otro" }
export function categoryColor(id: string): string { return PLACE_CATEGORIES.find((c) => c.id === id)?.color || "#cbd5e1" }

// ── MAPA CÓSMICO — taxonomía (tipos, capas, niveles) ────────────────────
export const TIPOS: { id: string; label: string; color: string }[] = [
  { id: "disco_solar", label: "Disco Solar", color: "#f0c419" },
  { id: "contacto", label: "Lugar de Contacto", color: "#4aa3ff" },
  { id: "retiro", label: "Retiro Interior", color: "#7c5cff" },
  { id: "ciudad_intraterrena", label: "Ciudad Intraterrena", color: "#d8c7ff" },
  { id: "chakra", label: "Chakra Planetario", color: "#c084fc" },
  { id: "sagrado_mayor", label: "Lugar Sagrado Mayor", color: "#eef1fb" },
  { id: "montana", label: "Montaña Sagrada", color: "#e0a86b" },
  { id: "volcan", label: "Volcán Sagrado", color: "#ef7d5a" },
  { id: "desierto", label: "Desierto de Contacto", color: "#f0b559" },
  { id: "cueva", label: "Cueva / Portal Interior", color: "#9fb0d6" },
  { id: "lago", label: "Lago / Portal Acuático", color: "#6fd0e0" },
  { id: "piramide", label: "Pirámide / Arquitectura Estelar", color: "#c9a86b" },
  { id: "aparicion", label: "Aparición Celeste", color: "#cfe0ff" },
  { id: "comunitario", label: "Nodo Comunitario", color: "#a78bca" },
  { id: "por_revisar", label: "Por revisar", color: "#7a7f9a" },
]
export function tipoLabel(id?: string): string { return TIPOS.find((t) => t.id === id)?.label || "Lugar" }
export function tipoColor(id?: string): string { return TIPOS.find((t) => t.id === id)?.color || "#a78bca" }

// Mapea la categoría antigua (aportes comunitarios) a un tipo del mapa.
const CAT_TO_TIPO: Record<string, string> = {
  disco_solar: "disco_solar", oficial_contacto: "contacto", avistamiento: "contacto",
  sagrado: "sagrado_mayor", retiro: "retiro", natural: "montana", activacion: "contacto",
  nodo: "comunitario", comunitario: "comunitario", otro: "comunitario",
}
export function placeTipo(p: ContactPlace): string {
  if (p.tipoPrincipal) return p.tipoPrincipal
  if (TIPOS.some((t) => t.id === p.category)) return p.category
  return CAT_TO_TIPO[p.category] || "comunitario"
}
export function placeColor(p: ContactPlace): string { return p.chakra?.color || tipoColor(placeTipo(p)) }

export const CAPAS = [
  "Disco Solar", "Lugar de Contacto", "Retiro Interior", "Intraterreno", "Ciudad Intraterrena",
  "Hermandad Blanca", "Lemuria", "Atlántida", "Sirio", "Orión", "Pléyades", "Arcturianos",
  "ERKS", "Telos", "Shambhala", "Paititi", "Portal Estelar", "Memoria Ancestral",
  "Memoria Andina", "Memoria Maya", "Memoria Atlante", "Memoria Lemuriana", "Aparición Mariana",
  "Montaña de Poder", "Desierto de Contacto", "Arquitectura Estelar", "Custodia del Territorio",
]
export const NIVELES: { id: string; label: string }[] = [
  { id: "oficial", label: "Oficial Los 144.000" },
  { id: "tradicion", label: "Tradición interna" },
  { id: "historico", label: "Histórico / arqueológico" },
  { id: "sagrado", label: "Sagrado reconocido" },
  { id: "relato", label: "Relato de contacto" },
  { id: "comunitario", label: "Aporte comunitario" },
  { id: "por_revisar", label: "Por revisar" },
]
export function nivelLabel(id?: string): string { return NIVELES.find((n) => n.id === id)?.label || "" }

// ── Contenido curado (Fase 1) — se muestra siempre; se fusiona con los ──
// aportes comunitarios del backend. Editable por código por ahora.
type Seed = Partial<ContactPlace> & { name: string; country: string; lat: number | null; lon: number | null; tipo: string }
function P(s: Seed): ContactPlace {
  const slug = s.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  return {
    id: `seed_${slug}`, name: s.name, slug, country: s.country, region: s.region, city: s.city,
    latitude: s.lat, longitude: s.lon, category: s.tipo, tipoPrincipal: s.tipo,
    authorityLevel: "official", status: "published",
    shortDescription: s.shortDescription || "", longDescription: s.longDescription,
    nombreEnergetico: s.nombreEnergetico, capas: s.capas || [], nivelAutoridad: s.nivelAutoridad || "oficial",
    alias: s.alias, relacionContacto: s.relacionContacto, relacionDisco: s.relacionDisco,
    relacionRetiro: s.relacionRetiro, relacionIntra: s.relacionIntra, relacionHistorica: s.relacionHistorica,
    linajes: s.linajes, funcionEnergetica: s.funcionEnergetica, recomendacionesVisita: s.recomendacionesVisita,
    fuentesNotas: s.fuentesNotas, chakra: s.chakra,
    tags: s.tags || [], images: [], videos: [], createdBy: "Administración",
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  }
}

const RESPETO = "Visita con respeto: sigue las normas locales, no invadas ni extraigas piedras, plantas u objetos, no dejes basura y honra a las comunidades y custodios del territorio."

// 13 Discos Solares de la Red Solar Planetaria
const DISCOS: ContactPlace[] = [
  P({ name: "Monte Shasta", nombreEnergetico: "Emanashi", country: "Estados Unidos", region: "California", lat: 41.409, lon: -122.194, tipo: "disco_solar",
    capas: ["Disco Solar", "Retiro Interior", "Ciudad Intraterrena", "Telos", "Lemuria", "Lugar de Contacto"], linajes: ["Lemuria"],
    shortDescription: "Disco Solar Emanashi: nodo de memoria lemuriana y retiro interior asociado a Telos.",
    longDescription: `Según la tradición del proyecto, el Monte Shasta guarda el Disco Solar Emanashi y se reconoce como uno de los grandes nodos de memoria lemuriana. Está vinculado a Telos, la ciudad intraterrena descrita dentro del archivo como refugio de una conciencia antigua que custodia el recuerdo de Lemuria. Es a la vez Disco Solar, retiro interior y lugar de contacto: un centro donde la reorganización espiritual de la humanidad encuentra un punto de apoyo. La montaña se asocia a la reconexión con el origen, la memoria estelar y la serenidad de quien recuerda de dónde viene. ${RESPETO}`,
    funcionEnergetica: "Ancla de memoria lemuriana y reorganización espiritual de la humanidad." }),
  P({ name: "Valle de Santiago / Siete Luminarias", nombreEnergetico: "Sipenbó", alias: ["Sipembó"], country: "México", region: "Guanajuato", lat: 20.39, lon: -100.88, tipo: "disco_solar",
    capas: ["Disco Solar", "Montaña de Poder", "Lugar de Contacto"],
    shortDescription: "Disco Solar Sipenbó: fuego interno, guerrero interior y acción ordenada.",
    longDescription: `El Valle de Santiago y su campo de volcanes —las Siete Luminarias— custodia, según la tradición del proyecto, el Disco Solar Sipenbó (también escrito Sipembó). Se asocia al fuego interno de la Tierra, al volcanismo y a la energía del guerrero interior: la fuerza masculina armonizada con el corazón, la protección consciente y la acción ordenada. Es un nodo que habla de coraje sereno, de poner la fuerza al servicio y de transformar el impulso en dirección. ${RESPETO}`,
    fuentesNotas: "Alias en revisión: Sipenbó / Sipembó.", funcionEnergetica: "Fuego interno, guerrero interior y acción ordenada." }),
  P({ name: "Ciudad Blanca", nombreEnergetico: "Aromané", alias: ["Aromane"], country: "Honduras", region: "La Mosquitia", lat: 15.15, lon: -84.9, tipo: "disco_solar",
    capas: ["Disco Solar", "Memoria Ancestral"],
    shortDescription: "Disco Solar Aromané: reconciliación de polaridades y equilibrio entre acción y entrega.",
    longDescription: `La llamada Ciudad Blanca, en la selva de La Mosquitia, custodia dentro del archivo del proyecto el Disco Solar Aromané. Se vincula con la memoria centroamericana y con la reconciliación de polaridades: el equilibrio entre firmeza y sensibilidad, entre acción y entrega. Es un nodo de integración, donde lo que parecía opuesto aprende a sostenerse en una misma frecuencia. ${RESPETO}`,
    fuentesNotas: "Alias en revisión: Aromané / Aromane.", funcionEnergetica: "Reconciliación de polaridades; firmeza y sensibilidad." }),
  P({ name: "Guatavita", nombreEnergetico: "Xemancó", country: "Colombia", region: "Cundinamarca", lat: 4.98, lon: -73.77, tipo: "disco_solar",
    capas: ["Disco Solar", "Lago / Portal Acuático", "Memoria Andina"], linajes: ["Memoria muisca"],
    shortDescription: "Disco Solar Xemancó: agua sagrada, fuego interior y unión de opuestos.",
    longDescription: `La laguna de Guatavita, corazón de la memoria muisca, custodia el Disco Solar Xemancó. Se asocia al agua sagrada y al fuego interior, y aparece dentro del archivo como nodo de equilibrio entre fuerza y sensibilidad, entre lo que se ofrece y lo que se guarda. El oro de la leyenda de El Dorado se lee aquí como símbolo de un tesoro interior: la unión de opuestos que se vuelve luz. ${RESPETO}`,
    funcionEnergetica: "Unión de opuestos; agua y fuego interior." }),
  P({ name: "Monte Roraima", nombreEnergetico: "Urinam", country: "Venezuela", region: "Gran Sabana", lat: 5.14, lon: -60.76, tipo: "disco_solar",
    capas: ["Disco Solar", "Montaña de Poder", "Memoria Ancestral"],
    shortDescription: "Disco Solar Urinam: visión superior, tercer ojo y memoria primordial.",
    longDescription: `El tepuy de Roraima, una de las formaciones más antiguas de la Tierra, custodia el Disco Solar Urinam. Se asocia a la visión superior, al tercer ojo y a la claridad que da la altura: mirar desde arriba, ver el conjunto. Es un nodo de memoria primordial, donde la Tierra guarda el recuerdo de sus primeros tiempos. ${RESPETO}`,
    funcionEnergetica: "Visión superior, altura y memoria primordial." }),
  P({ name: "Cueva de los Tayos", nombreEnergetico: "Jasintah", country: "Ecuador", region: "Morona Santiago", lat: -1.93, lon: -78.20, tipo: "disco_solar",
    capas: ["Disco Solar", "Cueva / Portal Interior", "Intraterreno", "Memoria Ancestral"],
    shortDescription: "Disco Solar Jasintah: archivos intraterrenos y puente Tierra-estrellas.",
    longDescription: `La Cueva de los Tayos custodia el Disco Solar Jasintah y se reconoce dentro del archivo como puerta a los archivos intraterrenos: registros antiguos, memorias ancestrales y un puente entre la Tierra y las estrellas. Se asocia a la sabiduría del cuerpo y a la memoria que se guarda en la profundidad, lejos del ruido. ${RESPETO}`,
    funcionEnergetica: "Archivos intraterrenos; puente Tierra-estrellas." }),
  P({ name: "Paititi", nombreEnergetico: "Ilumana", alias: ["Ilumanah"], country: "Perú", region: "Amazonía sur", lat: -12.9, lon: -71.4, tipo: "disco_solar",
    capas: ["Disco Solar", "Retiro Interior", "Intraterreno", "Memoria Andina"],
    shortDescription: "Gran Disco Solar Ilumana: selva intraterrena, renacimiento y red del tiempo.",
    longDescription: `Paititi, la ciudad-selva de la tradición amazónica, custodia el Gran Disco Solar Ilumana (también Ilumanah). Se describe dentro del archivo como selva intraterrena y nodo de renacimiento: transformación, inocencia original y una red del tiempo que enlaza pasado y futuro. Es un retiro interior mayor, oculto a la mirada ordinaria. ${RESPETO}`,
    fuentesNotas: "Alias en revisión: Ilumana / Ilumanah.", funcionEnergetica: "Renacimiento, inocencia original y red del tiempo." }),
  P({ name: "Lago Titicaca", nombreEnergetico: "Demayón", country: "Bolivia / Perú", lat: -15.92, lon: -69.33, tipo: "disco_solar",
    capas: ["Disco Solar", "Lago / Portal Acuático", "Sirio", "Memoria Andina"], linajes: ["Sirio"],
    shortDescription: "Disco Solar Demayón: agua primordial, memoria siriana y unidad masculino-femenino.",
    longDescription: `El Lago Titicaca custodia el Disco Solar Demayón y se reconoce como portal acuático de agua primordial. Dentro del archivo se vincula con la memoria siriana y con el origen: la unidad de lo masculino y lo femenino, el punto donde la vida vuelve a su fuente. Es uno de los grandes nodos andinos de la Red. ${RESPETO}`,
    funcionEnergetica: "Agua primordial, origen y unidad masculino-femenino." }),
  P({ name: "Volcán Licancabur", nombreEnergetico: "Ramayah", country: "Chile", region: "Atacama", lat: -22.83, lon: -67.88, tipo: "disco_solar",
    capas: ["Disco Solar", "Volcán Sagrado", "Desierto de Contacto"],
    shortDescription: "Disco Solar Ramayah: fuego consciente, verdad y llama interna.",
    longDescription: `El volcán Licancabur, sobre el desierto de Atacama, custodia el Disco Solar Ramayah. Se asocia al fuego consciente y a la verdad: la fuerza vital que arde sin destruir, la llama interna que sostiene la vigilia. Es un nodo de claridad seca, de cielo altísimo y silencio mineral. ${RESPETO}`,
    funcionEnergetica: "Fuego consciente, verdad y fuerza vital." }),
  P({ name: "Talampaya", nombreEnergetico: "Mitakunah", country: "Argentina", region: "La Rioja", lat: -29.8, lon: -67.85, tipo: "disco_solar",
    capas: ["Disco Solar", "Desierto de Contacto", "Montaña de Poder"],
    shortDescription: "Disco Solar Mitakunah: energía vital, kundalini y gozo de la materia.",
    longDescription: `El cañón de Talampaya custodia el Disco Solar Mitakunah. Se vincula con la energía vital y la kundalini de la Tierra: el cuerpo, la creatividad, el gozo y la activación de la vida desde la materia. Es un nodo de fuego rojo, de roca y sol, donde la existencia celebra su propia fuerza. ${RESPETO}`,
    funcionEnergetica: "Energía vital, kundalini y creatividad." }),
  P({ name: "Sierra del Roncador", nombreEnergetico: "Omsarah", country: "Brasil", region: "Mato Grosso", lat: -13.5, lon: -53.0, tipo: "disco_solar",
    capas: ["Disco Solar", "Retiro Interior", "Intraterreno"],
    shortDescription: "Disco Solar Omsarah: retiro interior, timo y verdad del pecho.",
    longDescription: `La Sierra del Roncador, en Mato Grosso, custodia el Disco Solar Omsarah y se reconoce como retiro interior y centro intraterreno. Se asocia al timo y al centro del pecho: la inocencia del alma, la verdad interior y la memoria que se guarda en el corazón. Es un nodo de recogimiento y honestidad profunda. ${RESPETO}`,
    funcionEnergetica: "Retiro interior; inocencia del alma y verdad del pecho." }),
  P({ name: "La Aurora", nombreEnergetico: "Ulimen", country: "Uruguay", region: "Canelones", lat: -34.4, lon: -56.5, tipo: "disco_solar",
    capas: ["Disco Solar", "Retiro Interior", "Lugar de Contacto", "Pléyades"], linajes: ["Pléyades"],
    shortDescription: "Disco Solar Ulimen: autosanación, descanso interior y relatos de naves.",
    longDescription: `La Aurora custodia el Disco Solar Ulimen y, según la tradición del proyecto, está asociada a relatos de contacto y al conocido sonido de naves registrado en ese territorio. Se vincula con la autosanación, el descanso interior, la raíz y la ligereza del cuerpo; en el archivo se relaciona además con una frecuencia pleyadiana/cetácea de cuidado y regeneración. ${RESPETO}`,
    relacionContacto: "Asociada a relatos de contacto y al sonido de naves según la tradición del proyecto.",
    funcionEnergetica: "Autosanación, descanso y regeneración." }),
  P({ name: "Antártida", nombreEnergetico: "Ion", country: "Chile / Argentina", lat: -75.0, lon: 0.0, tipo: "disco_solar",
    capas: ["Disco Solar", "Retiro Interior", "Hermandad Blanca"],
    shortDescription: "Disco Solar Ion: silencio, pureza y conciencia antigua de la Tierra.",
    longDescription: `La Antártida custodia el Disco Solar Ion, descrito dentro del archivo como punto de memoria primordial y conciencia antigua de la Tierra. Se asocia al silencio, al origen y a la pureza: la inmensidad blanca como umbral hacia lo más elevado. Es el nodo del recogimiento total, donde la Tierra guarda su recuerdo más limpio. ${RESPETO}`,
    funcionEnergetica: "Silencio, pureza y conciencia antigua." }),
]

// 7 Chakras Planetarios (halos continentales)
const CHAKRAS: ContactPlace[] = [
  P({ name: "Chakra Base · África", country: "África", lat: 0, lon: 21, tipo: "chakra",
    chakra: { continente: "África", color: "#c0392b", radioKm: 3200 }, capas: ["Memoria Ancestral"],
    shortDescription: "Chakra raíz de la Tierra: origen de la energía vital planetaria.",
    longDescription: "África representa el chakra raíz de la Tierra. Es el punto de origen de la energía vital planetaria, la base de la kundalini terrestre y el lugar donde la vida se ancla a la materia, al cuerpo, a la supervivencia y a la memoria ancestral." }),
  P({ name: "Chakra Sacro · Asia y Oceanía", country: "Asia / Oceanía", lat: -8, lon: 118, tipo: "chakra",
    chakra: { continente: "Asia y Oceanía", color: "#e67e22", radioKm: 3000 },
    shortDescription: "Segundo chakra: circulación, polaridad y procesamiento energético.",
    longDescription: "El segundo chakra se procesa y se divide entre Asia y Oceanía. Funciona como zona de circulación, polaridad y procesamiento energético, similar a unos riñones planetarios: la energía vital se mueve, se divide, se filtra y comienza a generar impulso creativo." }),
  P({ name: "Chakra Plexo Solar · Asia", country: "Asia", lat: 45, lon: 90, tipo: "chakra",
    chakra: { continente: "Asia", color: "#f1c40f", radioKm: 3200 },
    shortDescription: "Plexo solar de la Tierra: identidad, voluntad y poder interno.",
    longDescription: "Asia representa el plexo solar de la Tierra. Es el centro donde la energía comienza a reconocerse como ser: aparece la conciencia de identidad, la voluntad, el poder interno, la dirección y la estructura espiritual." }),
  P({ name: "Chakra Corazón · Europa", country: "Europa", lat: 50, lon: 15, tipo: "chakra",
    chakra: { continente: "Europa", color: "#2ecc71", radioKm: 2200 },
    shortDescription: "Corazón planetario: amor, cultura, cooperación y heridas colectivas.",
    longDescription: "Europa representa el cuarto chakra, el corazón planetario. Desde este centro se expande tanto lo luminoso como lo no tan luminoso: amor, cultura, cooperación, sensibilidad, conflicto, dominio y separación. Es el corazón en su aprendizaje completo: unir, dividir, sentir, tender puentes y atravesar heridas colectivas." }),
  P({ name: "Chakra Garganta · Norteamérica", country: "Norteamérica", lat: 45, lon: -100, tipo: "chakra",
    chakra: { continente: "Norteamérica", color: "#3498db", radioKm: 3000 },
    shortDescription: "Comunicación planetaria: palabra, tecnología y mensaje colectivo.",
    longDescription: "La energía asciende por el Polo hasta Norteamérica, que representa el quinto chakra: la comunicación planetaria. Desde aquí se proyecta palabra, tecnología, narrativa, influencia, información y mensaje colectivo hacia el mundo." }),
  P({ name: "Chakra Tercer Ojo · Sudamérica", country: "Sudamérica", lat: -15, lon: -60, tipo: "chakra",
    chakra: { continente: "Sudamérica", color: "#8e44ad", radioKm: 2800 },
    shortDescription: "Tercer ojo planetario: visión, intuición y memoria espiritual.",
    longDescription: "Sudamérica representa el sexto chakra de la Tierra, el tercer ojo planetario. Es el centro de visión, intuición, memoria espiritual, percepción profunda y despertar de una nueva mirada sobre la realidad." }),
  P({ name: "Chakra Corona · Antártida", country: "Antártida", lat: -82, lon: 0, tipo: "chakra",
    chakra: { continente: "Antártida", color: "#dcd0ff", radioKm: 2600 },
    shortDescription: "Coronario planetario: pureza, silencio y conciencia universal.",
    longDescription: "La Antártida representa el séptimo chakra, el coronario planetario. Es el punto de pureza, silencio, integración y conexión con lo más elevado. Su energía se expresa desde la quietud, la blancura, el aislamiento y la conciencia universal." }),
]

// Nodos principales de contacto y lugares sagrados mayores (Fase 1)
const LUGARES: ContactPlace[] = [
  P({ name: "Desierto de Chilca", country: "Perú", region: "Lima", lat: -12.52, lon: -76.73, tipo: "desierto",
    capas: ["Lugar de Contacto", "Desierto de Contacto"], nivelAutoridad: "tradicion",
    shortDescription: "Uno de los lugares fundadores del contacto moderno vinculado a la Misión Rama.",
    longDescription: `El desierto de Chilca se reconoce dentro del archivo como uno de los lugares fundamentales de los inicios del contacto moderno, vinculado a la Misión Rama. Es un desierto de apertura, silencio, cielo y entrenamiento interior: un punto clave de contacto en Perú donde el vacío se vuelve escucha. ${RESPETO}`,
    relacionContacto: "Punto fundacional del contacto vinculado a la Misión Rama." }),
  P({ name: "Cerro Uritorco / Capilla del Monte", country: "Argentina", region: "Córdoba", lat: -30.86, lon: -64.52, tipo: "contacto",
    capas: ["Lugar de Contacto", "Ciudad Intraterrena", "ERKS", "Retiro Interior", "Montaña de Poder"], nivelAutoridad: "tradicion",
    shortDescription: "Nodo principal: Cerro Uritorco, ERKS y ciudad intraterrena.",
    longDescription: `El Cerro Uritorco, en Capilla del Monte, es uno de los nodos principales del mapa. Se relaciona con ERKS y con una ciudad intraterrena, con relatos de contacto y con una energía de iniciación que la tradición del proyecto asocia al Santo Grial y al Bastón de Mando. Es a la vez lugar de contacto, retiro interior y montaña de poder. ${RESPETO}`,
    relacionIntra: "Asociado a ERKS y a una ciudad intraterrena.", relacionContacto: "Relatos de contacto e iniciación." }),
  P({ name: "Desierto de Atacama", country: "Chile", lat: -23.87, lon: -69.20, tipo: "desierto",
    capas: ["Lugar de Contacto", "Desierto de Contacto"], nivelAutoridad: "tradicion",
    shortDescription: "Gran desierto de contacto: cielo estelar, silencio y observación.",
    longDescription: `El desierto de Atacama es uno de los lugares principales del mapa: un gran desierto de contacto de cielo limpísimo, silencio y observación celeste. Su aridez extrema y su altura lo convierten en umbral de apertura a la memoria estelar. ${RESPETO}` }),
  P({ name: "Volcán Chimborazo", country: "Ecuador", lat: -1.47, lon: -78.82, tipo: "volcan",
    capas: ["Lugar de Contacto", "Intraterreno", "Montaña de Poder", "Memoria Andina"], nivelAutoridad: "tradicion",
    shortDescription: "Volcán sagrado de los Andes, asociado a bases intraterrenas y contacto.",
    longDescription: `El Chimborazo, el punto más alejado del centro de la Tierra, se presenta como volcán sagrado del Ecuador. Según la tradición del proyecto se asocia a bases intraterrenas y a presencia de contacto, y a la custodia planetaria de los Andes. ${RESPETO}` }),
  P({ name: "Parque Nacional Cajas", country: "Ecuador", region: "Azuay", lat: -2.85, lon: -79.22, tipo: "contacto",
    capas: ["Lugar de Contacto", "Lago / Portal Acuático", "Intraterreno", "Memoria Andina"], nivelAutoridad: "tradicion",
    shortDescription: "Nodo de lagunas andinas asociado a contacto y bases intraterrenas.",
    longDescription: `El Parque Nacional Cajas, con sus cientos de lagunas de altura, es un nodo importante del Ecuador. Silencio, agua, altitud y cielo abierto se combinan en un territorio que el archivo relaciona con bases intraterrenas y relatos de contacto. ${RESPETO}` }),
  P({ name: "Tepoztlán", country: "México", region: "Morelos", lat: 18.98, lon: -99.10, tipo: "contacto",
    capas: ["Lugar de Contacto", "Montaña de Poder"], nivelAutoridad: "tradicion",
    shortDescription: "Montaña sagrada y territorio de alta sensibilidad espiritual y memoria de contacto.",
    longDescription: `Tepoztlán se presenta como territorio de alta sensibilidad espiritual: montaña sagrada, tradición mística mexicana y memoria de contacto. Sus cerros y su templo en la altura lo hacen un nodo de apertura y percepción. ${RESPETO}` }),
  P({ name: "Zona del Silencio", country: "México", region: "Durango", lat: 26.69, lon: -103.75, tipo: "desierto",
    capas: ["Desierto de Contacto"], nivelAutoridad: "relato",
    shortDescription: "Desierto asociado a relatos de anomalías, magnetismo y fenómenos.",
    longDescription: `La Zona del Silencio es un desierto mexicano ampliamente asociado a relatos de anomalías, silencio, magnetismo y fenómenos extraños. Se incluye como zona de misterio y observación, sostenida por el relato popular más que por afirmaciones cerradas. ${RESPETO}` }),
  P({ name: "Popocatépetl e Iztaccíhuatl", country: "México", lat: 19.02, lon: -98.62, tipo: "volcan",
    capas: ["Volcán Sagrado", "Lugar de Contacto"], nivelAutoridad: "relato",
    shortDescription: "Volcanes sagrados asociados a relatos de luces y presencias.",
    longDescription: `El Popocatépetl y la Iztaccíhuatl son volcanes sagrados del centro de México, asociados a numerosos relatos de luces y presencias sobre sus cráteres. Se presentan como montañas de poder y puntos de observación, dentro del relato de contacto. ${RESPETO}` }),
  P({ name: "Sedona", country: "Estados Unidos", region: "Arizona", lat: 34.87, lon: -111.76, tipo: "contacto",
    capas: ["Lugar de Contacto", "Desierto de Contacto"], nivelAutoridad: "tradicion",
    shortDescription: "Centro de vórtices y percepción espiritual en el desierto rojo.",
    longDescription: `Sedona se presenta como un centro de vórtices y percepción espiritual, muy asociado a prácticas de sanación y búsqueda interior. Su desierto rojo y sus formaciones lo convierten en un lugar de poder para la escucha y la introspección. ${RESPETO}` }),
  P({ name: "Valle del Elqui", country: "Chile", lat: -30.0, lon: -70.5, tipo: "contacto",
    capas: ["Lugar de Contacto"], nivelAutoridad: "tradicion",
    shortDescription: "Corazón energético de Chile: cielo, observación y magnetismo.",
    longDescription: `El Valle del Elqui se presenta como corazón energético de Chile: territorio de observación, magnetismo, cielo limpio y búsquedas espirituales. Sus noches estrelladas lo hacen un punto natural de apertura. ${RESPETO}` }),
  P({ name: "Desierto de la Tatacoa", country: "Colombia", region: "Huila", lat: 3.23, lon: -75.16, tipo: "desierto",
    capas: ["Desierto de Contacto"], nivelAutoridad: "sagrado",
    shortDescription: "Zona de observación celeste por su cielo, desierto y silencio.",
    longDescription: `El Desierto de la Tatacoa se presenta como zona de observación y apertura por su cielo despejado, su desierto y su fuerza energética. Es un punto de escucha del cielo nocturno. ${RESPETO}` }),
  P({ name: "Desierto del Gobi", country: "Mongolia / China", lat: 42.5, lon: 105.0, tipo: "retiro",
    capas: ["Retiro Interior", "Shambhala", "Hermandad Blanca"], nivelAutoridad: "tradicion", linajes: ["Hermandad Blanca"],
    shortDescription: "Nodo mayor de retiro interior asociado a Shambhala y la Hermandad Blanca.",
    longDescription: `El desierto del Gobi es uno de los nodos principales de retiro interior del mapa. Dentro del archivo se vincula con Shambhala, con la Hermandad Blanca y con la memoria interna de la Tierra: un espacio de custodia espiritual en el corazón de Asia. ${RESPETO}` }),
  P({ name: "Montserrat", country: "España", region: "Cataluña", lat: 41.59, lon: 1.83, tipo: "sagrado_mayor",
    capas: ["Lugar de Contacto", "Montaña de Poder", "Aparición Mariana"], nivelAutoridad: "sagrado",
    shortDescription: "Montaña sagrada de Cataluña: corazón del dragón, Virgen Negra y eje telúrico.",
    longDescription: `Montserrat es un nodo importante de Europa: montaña sagrada de Cataluña, corazón del dragón, punto mariano y eje telúrico e iniciático. Sus formas de roca y su santuario la convierten en lugar de peregrinación y de fuerza. ${RESPETO}` }),
  P({ name: "Montségur", country: "Francia", lat: 42.88, lon: 1.83, tipo: "sagrado_mayor",
    capas: ["Custodia del Territorio", "Memoria Ancestral"], nivelAutoridad: "sagrado",
    shortDescription: "Montaña cátara vinculada al misterio del Santo Grial.",
    longDescription: `Montségur es el lugar de Francia vinculado al misterio del Santo Grial y a los cátaros. Se reconoce como montaña iniciática y de custodia espiritual, memoria de una entrega que atravesó el fuego. ${RESPETO}` }),
  P({ name: "Gizeh", country: "Egipto", lat: 29.98, lon: 31.13, tipo: "piramide",
    capas: ["Portal Estelar", "Arquitectura Estelar", "Orión", "Sirio", "Atlántida"], nivelAutoridad: "historico", linajes: ["Orión", "Sirio"],
    shortDescription: "Portal de Orión: pirámides como arquitectura estelar y escuela iniciática.",
    longDescription: `Egipto aparece como Portal de Orión. Las pirámides de Gizeh se describen como arquitectura estelar, escuela iniciática y punto de memoria atlante-siriana: un diálogo en piedra entre la Tierra, el tiempo y las estrellas. ${RESPETO}` }),
  P({ name: "Karnak / Luxor", country: "Egipto", lat: 25.72, lon: 32.66, tipo: "piramide",
    capas: ["Arquitectura Estelar", "Portal Estelar"], nivelAutoridad: "historico",
    shortDescription: "Templo solar e iniciático, eje ceremonial del antiguo Egipto.",
    longDescription: `Karnak y Luxor forman el gran eje ceremonial del antiguo Egipto: templo solar, escuela de iniciación y arquitectura alineada con el cielo. ${RESPETO}` }),
  P({ name: "Machu Picchu", country: "Perú", lat: -13.16, lon: -72.54, tipo: "sagrado_mayor",
    capas: ["Memoria Andina", "Montaña de Poder"], nivelAutoridad: "historico",
    shortDescription: "Ciudad sagrada andina: montaña, sol e iniciación inca.",
    longDescription: `Machu Picchu es ciudad sagrada andina: montaña, sol, linaje inca e iniciación. Su arquitectura sobre el abismo la convierte en uno de los grandes santuarios de Sudamérica. ${RESPETO}` }),
  P({ name: "Teotihuacán", country: "México", lat: 19.69, lon: -98.84, tipo: "piramide",
    capas: ["Arquitectura Estelar", "Memoria Maya"], nivelAutoridad: "historico",
    shortDescription: "Ciudad de los dioses: pirámides solar y lunar, eje ceremonial mesoamericano.",
    longDescription: `Teotihuacán, la Ciudad de los Dioses, articula sus pirámides del Sol y de la Luna sobre la Calzada de los Muertos: un eje ceremonial mesoamericano de memoria y observación celeste. ${RESPETO}` }),
  P({ name: "Chichén Itzá", country: "México", region: "Yucatán", lat: 20.68, lon: -88.57, tipo: "piramide",
    capas: ["Arquitectura Estelar", "Memoria Maya"], nivelAutoridad: "historico",
    shortDescription: "Pirámide de Kukulkán: calendario, serpiente solar y astronomía sagrada.",
    longDescription: `Chichén Itzá guarda la pirámide de Kukulkán, donde la serpiente solar desciende en los equinoccios. Es memoria maya, calendario y astronomía sagrada hecha piedra. ${RESPETO}` }),
  P({ name: "Rapa Nui / Isla de Pascua", country: "Chile", lat: -27.11, lon: -109.35, tipo: "sagrado_mayor",
    capas: ["Memoria Lemuriana", "Memoria Ancestral"], nivelAutoridad: "historico",
    shortDescription: "Moáis y memoria oceánica del linaje ancestral del Pacífico.",
    longDescription: `Rapa Nui, con sus moáis, guarda la memoria oceánica del Pacífico. Dentro del archivo se la relaciona con memorias lemurianas y con el linaje ancestral de la Tierra insular. ${RESPETO}` }),
  P({ name: "Stonehenge", country: "Inglaterra", lat: 51.18, lon: -1.83, tipo: "sagrado_mayor",
    capas: ["Arquitectura Estelar", "Memoria Ancestral"], nivelAutoridad: "historico",
    shortDescription: "Círculo megalítico de alineación solar y memoria ceremonial antigua.",
    longDescription: `Stonehenge es un círculo megalítico alineado con el sol, memoria ceremonial de un tiempo antiguo en que la piedra marcaba los ciclos del cielo. ${RESPETO}` }),
  P({ name: "Monte Kailash", country: "Tíbet", lat: 31.07, lon: 81.31, tipo: "montana",
    capas: ["Montaña de Poder", "Retiro Interior"], nivelAutoridad: "sagrado",
    shortDescription: "Montaña del eje del mundo, centro espiritual mayor de peregrinación.",
    longDescription: `El Monte Kailash es la montaña sagrada del eje del mundo: centro espiritual mayor de varias tradiciones y destino de peregrinación. Se reconoce como columna entre la Tierra y lo alto. ${RESPETO}` }),
  P({ name: "Uluru", country: "Australia", lat: -25.34, lon: 131.04, tipo: "sagrado_mayor",
    capas: ["Memoria Ancestral", "Montaña de Poder"], nivelAutoridad: "sagrado",
    shortDescription: "Monolito sagrado, corazón rojo y memoria ancestral aborigen.",
    longDescription: `Uluru es el corazón rojo de Australia: monolito sagrado y memoria ancestral aborigen. Es territorio ceremonial que se honra con respeto profundo a sus custodios. ${RESPETO}` }),
  P({ name: "Fátima", country: "Portugal", lat: 39.63, lon: -8.67, tipo: "aparicion",
    capas: ["Aparición Mariana"], nivelAutoridad: "sagrado",
    shortDescription: "Santuario mariano de apariciones, mensaje y peregrinación mundial.",
    longDescription: `Fátima es santuario mariano de apariciones y mensaje espiritual, destino de peregrinación mundial. Se incluye como lugar de devoción, contacto espiritual y memoria colectiva, sin lectura dogmática. ${RESPETO}` }),
  P({ name: "Tepeyac / Basílica de Guadalupe", country: "México", lat: 19.48, lon: -99.12, tipo: "aparicion",
    capas: ["Aparición Mariana"], nivelAutoridad: "sagrado",
    shortDescription: "Aparición guadalupana: corazón espiritual mariano de México.",
    longDescription: `El Tepeyac, con la Basílica de Guadalupe, guarda la aparición guadalupana: corazón espiritual de México y punto mayor de devoción, mensaje y memoria colectiva. ${RESPETO}` }),
  P({ name: "Monte Sinaí", country: "Egipto", lat: 28.54, lon: 33.97, tipo: "montana",
    capas: ["Montaña de Poder", "Memoria Ancestral"], nivelAutoridad: "sagrado",
    shortDescription: "Montaña de revelación, pacto y transmisión espiritual.",
    longDescription: `El Monte Sinaí es montaña de revelación y pacto: lugar de transmisión de la ley espiritual, ascenso y encuentro. ${RESPETO}` }),
]

export const ADMIN_SEED_POINTS: ContactPlace[] = [...DISCOS, ...LUGARES, ...CHAKRAS]

// ── API de puntos ────────────────────────────────────────────────────────
// Muestra SIEMPRE el contenido curado (Discos, Chakras, nodos) y le fusiona los
// aportes de la comunidad del backend (no oficiales), evitando duplicados.
const nrm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()
export async function fetchPlaces(): Promise<{ places: ContactPlace[]; isAdmin: boolean }> {
  try {
    const r = await fetch("/api/lugares", { credentials: "include" })
    if (!r.ok) throw new Error("bad")
    const d = await r.json()
    const db = Array.isArray(d.places) ? (d.places as ContactPlace[]) : []
    const curatedNames = new Set(ADMIN_SEED_POINTS.map((p) => nrm(p.name)))
    const community = db.filter((p) => p.authorityLevel !== "official" && !curatedNames.has(nrm(p.name)))
    return { places: [...ADMIN_SEED_POINTS, ...community], isAdmin: !!d.isAdmin }
  } catch {
    return { places: ADMIN_SEED_POINTS, isAdmin: false }
  }
}

export async function submitPlace(payload: {
  name: string; country: string; region?: string; city?: string
  latitude?: number | null; longitude?: number | null
  category: string; shortDescription: string; longDescription?: string
  memoryType?: string; visitRecommendations?: string; tags?: string[]
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await fetch("/api/lugares", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify(payload),
    })
    const d = await r.json().catch(() => ({}))
    return r.ok ? { ok: true } : { ok: false, error: d.error || "No se pudo enviar" }
  } catch { return { ok: false, error: "Error de conexión" } }
}

export async function moderatePlace(id: string, patch: Partial<Pick<ContactPlace, "status" | "authorityLevel" | "category" | "shortDescription" | "longDescription" | "visitRecommendations">>): Promise<boolean> {
  try {
    const r = await fetch(`/api/lugares/${encodeURIComponent(id)}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify(patch),
    })
    return r.ok
  } catch { return false }
}
export async function deletePlace(id: string): Promise<boolean> {
  try {
    const r = await fetch(`/api/lugares/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" })
    return r.ok
  } catch { return false }
}

// ── Geocodificación (proxy propio) ───────────────────────────────────────
export type GeoResult = { label: string; lat: number; lon: number; country: string; region: string; city: string }
export async function geocode(q: string): Promise<GeoResult[]> {
  if (q.trim().length < 3) return []
  try {
    const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { credentials: "include" })
    if (!r.ok) return []
    const d = await r.json()
    return Array.isArray(d.results) ? d.results : []
  } catch { return [] }
}

// ── Testimonios / guardados (local, personal) ───────────────────────────
const K_TESTIMONIES = "los144k_lugares_testimonies"
const K_SAVED = "los144k_lugares_saved"
export const LUGARES_CHANGED_EVENT = "app:lugares-changed"

function emit() { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(LUGARES_CHANGED_EVENT)) }
function read<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try { const raw = localStorage.getItem(key); const a = raw ? JSON.parse(raw) : []; return Array.isArray(a) ? a : [] } catch { return [] }
}
function writeLS<T>(key: string, val: T[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* quota */ }
}
function uid(p: string): string { return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}` }

export function loadTestimonies(placeId?: string): ContactPlaceTestimony[] {
  const all = read<ContactPlaceTestimony>(K_TESTIMONIES)
  return placeId ? all.filter((t) => t.placeId === placeId) : all
}
export function addTestimony(input: { placeId: string; testimony: string; title?: string; date?: string; isPrivate: boolean }): void {
  const t: ContactPlaceTestimony = {
    id: uid("ct"), placeId: input.placeId, title: input.title?.trim() || undefined,
    testimony: input.testimony.trim(), date: input.date || undefined,
    isPrivate: input.isPrivate, status: input.isPrivate ? "hidden" : "pending_review", createdAt: new Date().toISOString(),
  }
  const all = read<ContactPlaceTestimony>(K_TESTIMONIES); all.push(t); writeLS(K_TESTIMONIES, all); emit()
}
export function loadSaved(): SavedContactPlace[] { return read<SavedContactPlace>(K_SAVED) }
export function savedStatus(placeId: string): SavedContactPlace | undefined { return loadSaved().find((s) => s.placeId === placeId) }
export function setSaved(placeId: string, status: SavedContactPlace["status"]): void {
  const all = loadSaved()
  const i = all.findIndex((s) => s.placeId === placeId)
  if (i >= 0) { if (all[i].status === status) all.splice(i, 1); else all[i] = { ...all[i], status } }
  else all.push({ id: uid("sv"), placeId, status, createdAt: new Date().toISOString() })
  writeLS(K_SAVED, all); emit()
}

// ── Utilidades ────────────────────────────────────────────────────────────
export function project(lat: number, lon: number): { x: number; y: number } {
  return { x: ((lon + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 }
}
export function countTerritories(places: ContactPlace[]): number {
  const set = new Set<string>()
  for (const p of places) for (const c of p.country.split("/")) set.add(c.trim().toLowerCase())
  return set.size
}

// Lista de países (desplegable del formulario). Foco en América + principales.
export const COUNTRIES: string[] = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Cuba", "Ecuador",
  "El Salvador", "España", "Estados Unidos", "Guatemala", "Honduras", "México", "Nicaragua",
  "Panamá", "Paraguay", "Perú", "Puerto Rico", "República Dominicana", "Uruguay", "Venezuela",
  "Canadá", "Portugal", "Francia", "Italia", "Reino Unido", "Alemania", "Egipto", "India",
  "China", "Japón", "Australia", "Nueva Zelanda", "Sudáfrica", "Otro",
]
