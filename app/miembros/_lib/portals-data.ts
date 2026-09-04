// Portales de Integración del camino Los 144.000.
// No son videos ni episodios: son procesos de integración profunda que hacen
// bajar la memoria de cada temporada a la vida humana (personal, linaje,
// territorio) mediante Revelación → 3 Espejos → Acción Alquímica → Sello.
//
// Todo lo que la persona escribe se guarda PRIVADO en Mi Gran Bitácora
// (journal-store). Nada íntimo se comparte automáticamente al foro.

import type { SealId } from "./seals"
import type { JournalCategory } from "./journal-store"

export type IntegrationLaw = {
  n: number
  name: string
  pregunta: string
  profundizacion: string[]
  accion: string
}

export type IntegrationAction = {
  key: string           // id para la bitácora
  name: string
  instruction: string[] // párrafos de instrucción
  fields?: string[]     // campos a completar (cada uno se guarda en bitácora)
  freeText?: boolean    // además de/ en vez de campos, un texto libre
  closing?: string      // texto de cierre
  category: JournalCategory
}

export type IntegrationPortalDef = {
  id: 1 | 2 | 3 | 4
  /** Temporada/portal al que avanza el botón final. 5 = Objetivos. */
  nextSeason: number
  /** id base para las entradas de bitácora. */
  source: string
  kicker: string
  name: string
  subtitle: string
  frase: string[]
  revelacion: string[]
  caution?: string
  espejoPersonal: string[]
  espejoLinaje: string[]
  espejoTerritorio?: string[]
  laws?: IntegrationLaw[]
  acciones: IntegrationAction[]
  sealId: SealId
  buttonLabel: string
  /** Título EXACTO del tema del foro (coincide con el SQL sembrado). */
  forumTitle: string
}

// Títulos EXACTOS de los temas del foro (coinciden con docs/sql/foro_temario_144000.sql).
export const FORUM_TITLES = {
  ingreso: "Portal de Ingreso — ¿Por qué llegaste a este camino?",
  objetivos: "Objetivos de Los 144.000 — De la memoria a la misión",
  territorio: "Misión Territorial — La historia sagrada de tu lugar",
  nodos: "Nodos 144.000 — Formar comunidad de base",
} as const

export const INTEGRATION_PORTALS: IntegrationPortalDef[] = [
  // ══════════════════════════════════════════════════════════════════════
  // T1 → T2 · PORTAL DEL COMPROMISO
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 1,
    nextSeason: 2,
    source: "t1_compromiso",
    kicker: "Integración · Temporada 1 → 2",
    name: "PORTAL DEL COMPROMISO",
    subtitle: "Del llamado a la memoria del corazón",
    frase: ["RECORDAR NO ES SABER MÁS.", "RECORDAR ES VOLVER A PASAR POR EL CORAZÓN."],
    revelacion: [
      "La Temporada 1 abrió el Llamado de Los 144.000: frecuencia, responsabilidad, semilla estelar, olvido, nombre cósmico, misión de la Tierra, propósito y discernimiento.",
      "Recordar no significa acumular información espiritual.",
      "Recordar es traer de nuevo al corazón aquello que el alma ya conocía, pero que quedó cubierto por el olvido, la adaptación, el miedo, la infancia, la herida de no pertenencia y la necesidad de sobrevivir en la Tierra.",
      "Esta integración no busca que digas si te gustó la temporada. Busca que mires qué parte de tu vida comenzó a despertar.",
    ],
    espejoPersonal: [
      "¿Qué despertó en mí esta temporada?",
      "¿Me he sentido alguna vez fuera de lugar en la Tierra?",
      "¿Cuándo apareció por primera vez en mi vida la sensación de no pertenecer?",
      "¿Qué herida de abandono, olvido o soledad reconozco en mi historia?",
      "¿Qué parte de mí aprendió a esconder su sensibilidad para poder sobrevivir?",
      "¿Qué sentí al trabajar con la idea del nombre cósmico?",
      "Si recibí una sílaba, sonido, nombre o intuición, ¿qué se movió en mí?",
      "¿Qué parte de mi niño interior necesita volver a sentirse feliz, amado y acompañado?",
      "¿Estoy viviendo desde mi propósito o desde la expectativa de otros?",
      "¿Qué me impide escuchar la felicidad real de mi alma?",
    ],
    espejoLinaje: [
      "En mi familia, ¿se permitió la sensibilidad o se castigó?",
      "¿Qué historias de abandono, migración, separación o desarraigo existen en mi árbol familiar?",
      "¿Qué creencia heredé sobre ser diferente?",
      "¿Qué parte de mi linaje tuvo que callar su verdad para sobrevivir?",
      "¿Qué patrón de tristeza, sacrificio o desconexión se repite en mi familia?",
    ],
    espejoTerritorio: [
      "¿Qué relación tengo con el lugar donde nací?",
      "¿Siento raíz, rechazo, nostalgia, dolor o pertenencia hacia mi tierra de origen?",
      "¿Qué historia de mi país, ciudad o familia me hizo sentir separado de mi lugar?",
      "¿Qué territorio de mi vida necesita volver a ser sentido como hogar?",
    ],
    acciones: [
      {
        key: "carta_alma_olvido",
        name: "CARTA AL ALMA QUE OLVIDÓ",
        category: "acciones",
        instruction: [
          "Escribe una carta íntima a la parte de ti que se sintió abandonada, diferente, perdida o fuera de lugar.",
          "No escribas desde la mente. Escribe como si tu alma adulta pudiera hablarle al niño, joven o ser interior que alguna vez sintió que no pertenecía.",
        ],
        fields: [
          "Te vi cuando…",
          "Te abandoné cuando…",
          "Te pido perdón por…",
          "Hoy quiero recordarte que…",
          "A partir de ahora me comprometo a…",
        ],
      },
    ],
    sealId: "corazon",
    buttonLabel: "Entrar a la Temporada 2",
    forumTitle: "Portal del Compromiso (T1 → T2) — Tu declaración de intención",
  },

  // ══════════════════════════════════════════════════════════════════════
  // T2 → T3 · PORTAL DE LA DESPROGRAMACIÓN CÓSMICA
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 2,
    nextSeason: 3,
    source: "t2_desprogramacion",
    kicker: "Integración · Temporada 2 → 3",
    name: "PORTAL DE LA DESPROGRAMACIÓN CÓSMICA",
    subtitle: "Las leyes como espejo de los patrones heredados",
    frase: ["QUIEN CONOCE LA ESTRUCTURA,", "PUEDE RECONOCER QUÉ DEBE ORDENAR DENTRO DE SÍ."],
    revelacion: [
      "La Temporada 2 reveló la estructura del cosmos: la Fuente, los universos, las dimensiones, los cuerpos, la jerarquía galáctica, las leyes universales y la Confederación.",
      "Pero esta estructura no debe quedarse como conocimiento cósmico. Cada ley universal también actúa como espejo de la vida humana.",
      "La mente que crea, los ciclos que se repiten, las causas que generamos, las polaridades que rechazamos y la realidad que manifestamos muchas veces no nacen solo en nosotros.",
      "Vienen de nuestro árbol. De frases escuchadas en la infancia. De miedos heredados. De programas familiares. De pactos inconscientes con la escasez, la culpa, el sacrificio o el no merecimiento.",
      "Esta integración abre el trabajo de desprogramación.",
    ],
    espejoPersonal: [
      "¿Qué estructura de mi vida necesita orden en este momento?",
      "¿Qué pensamiento dominante crea mi realidad todos los días?",
      "¿Qué emoción baja mi vibración con más frecuencia?",
      "¿Qué ciclo repito aunque sé que me limita?",
      "¿Qué realidad sigo generando desde miedo, escasez o no merecimiento?",
      "¿Qué parte de mí cree que no puede cambiar?",
      "¿Qué parte de mí sigue obedeciendo una programación antigua?",
    ],
    espejoLinaje: [
      "¿Qué creencia heredé de mi familia sobre el dinero?",
      "¿Qué creencia heredé sobre el amor?",
      "¿Qué creencia heredé sobre el cuerpo?",
      "¿Qué creencia heredé sobre la espiritualidad?",
      "¿Qué creencia heredé sobre el merecimiento?",
      "¿Qué patrón veo repetirse en mi árbol familiar?",
      "¿Qué frase familiar todavía vive dentro de mi mente?",
      "¿Qué miedo no empezó conmigo, pero sigue actuando en mí?",
      "¿Qué historia de mis padres o abuelos sigo repitiendo sin darme cuenta?",
    ],
    laws: [
      {
        n: 1, name: "MENTALISMO",
        pregunta: "¿Qué pensamiento heredado sigue creando mi realidad?",
        profundizacion: [
          "¿Qué frase escuché en mi infancia que todavía dirige mis decisiones?",
          "¿Qué idea sobre mí mismo acepté como verdad, aunque solo era una programación?",
        ],
        accion: "Identifica una frase heredada y escribe una nueva instrucción consciente.",
      },
      {
        n: 2, name: "CORRESPONDENCIA",
        pregunta: "¿Qué situación externa refleja algo que no he ordenado dentro?",
        profundizacion: [
          "¿Qué conflicto se repite afuera porque aún vive dentro de mí?",
          "¿Qué persona o situación me está mostrando una parte no reconocida?",
        ],
        accion: "Escribe qué espejo estás viendo y qué parte de ti necesita ser atendida.",
      },
      {
        n: 3, name: "VIBRACIÓN",
        pregunta: "¿Qué emoción cargo todos los días y qué frecuencia sostiene?",
        profundizacion: [
          "¿Esa emoción me pertenece o la heredé?",
          "¿De quién aprendí a vivir en miedo, culpa, tristeza, enojo, escasez o vigilancia?",
        ],
        accion: "Durante siete días registra la emoción dominante del día y qué la activó.",
      },
      {
        n: 4, name: "RITMO",
        pregunta: "¿Qué ciclo personal o familiar sigo repitiendo?",
        profundizacion: [
          "¿Se repite abandono, pérdida, deuda, enfermedad, sacrificio, silencio, ruptura, dependencia o fracaso?",
          "¿Qué edad, fecha, situación o vínculo parece repetirse en mi historia?",
        ],
        accion: "Nombra el ciclo y escribe una decisión concreta para no alimentarlo esta semana.",
      },
      {
        n: 5, name: "CAUSA Y EFECTO",
        pregunta: "¿Qué decisión mía sigue produciendo el mismo resultado?",
        profundizacion: [
          "¿Qué hago, permito o evito que mantiene viva esta realidad?",
          "¿Qué consecuencia estoy viviendo que necesita responsabilidad y no culpa?",
        ],
        accion: "Elige una acción pequeña que produzca un efecto nuevo en los próximos siete días.",
      },
      {
        n: 6, name: "POLARIDAD",
        pregunta: "¿Qué parte de mí rechazo porque mi historia también la rechazó?",
        profundizacion: [
          "¿Qué polaridad necesito integrar: fuerza/sensibilidad, masculino/femenino, dar/recibir, acción/reposo, hablar/callar, controlar/confiar?",
          "¿Qué parte de mí juzgo porque fue juzgada en mi familia?",
        ],
        accion: "Escribe una reconciliación entre dos partes opuestas de ti.",
      },
      {
        n: 7, name: "GENERACIÓN",
        pregunta: "¿Qué nueva realidad puedo empezar a crear desde una decisión consciente?",
        profundizacion: [
          "¿Qué quiero generar que mi árbol no pudo sostener?",
          "¿Qué patrón termina conmigo? ¿Qué nueva frecuencia empieza a través de mí?",
        ],
        accion: "Escribe una declaración de nueva generación: “En mi linaje termina… En mi vida comienza…”.",
      },
    ],
    acciones: [
      {
        key: "mapa_patron_heredado",
        name: "MAPA DEL PATRÓN HEREDADO",
        category: "linaje",
        instruction: ["Completa el mapa del patrón que reconoces y la nueva decisión que eliges."],
        fields: [
          "Patrón que reconozco:",
          "De quién o de dónde creo que viene:",
          "Cómo se expresa en mi vida:",
          "Qué emoción lo sostiene:",
          "Qué ley universal lo está mostrando:",
          "Qué decisión nueva voy a tomar:",
          "Qué acción concreta haré en siete días:",
        ],
      },
    ],
    sealId: "desprogramacion",
    buttonLabel: "Entrar a la Temporada 3",
    forumTitle: "Portal del Mapa Cósmico (T2 → T3) — Elige una de las 7 leyes universales",
  },

  // ══════════════════════════════════════════════════════════════════════
  // T3 → T4 · PORTAL DE LA MEMORIA Y LA DIGNIDAD
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 3,
    nextSeason: 4,
    source: "t3_dignidad",
    kicker: "Integración · Temporada 3 → 4",
    name: "PORTAL DE LA MEMORIA Y LA DIGNIDAD",
    subtitle: "Sanar las memorias de abuso, poder y caída",
    frase: ["LAS GUERRAS ANTIGUAS NO TERMINAN", "HASTA QUE SUS MEMORIAS SON SANADAS EN NOSOTROS."],
    revelacion: [
      "La Temporada 3 abrió los orígenes ocultos de la Tierra: las primeras humanidades, Lemuria, las Guerras de Orión, la transgresión pleyadiana, el nacimiento atlante, los linajes, la caída y la Hermandad Blanca de la Tierra.",
      "Esta integración no pregunta con qué raza o civilización te sientes afín. Ese no es el centro.",
      "El centro es reconocer que las memorias antiguas de abuso, dominio, invasión, control, manipulación y ruptura de la dignidad siguen actuando en la humanidad.",
      "Siguen actuando en los cuerpos. En las familias. En los vínculos. En la sexualidad. En el uso del poder. En el silencio. En la culpa. En el miedo. En los territorios.",
      "La memoria atlante y la herida de la transgresión no se integran mirando hacia las estrellas. Se integran recuperando cuerpo, voz, límites, dignidad y voluntad.",
    ],
    caution:
      "Esta integración puede tocar heridas profundas. Avanza a tu ritmo. Nada de lo que escribas aquí se comparte: todo lo relacionado con abuso, violencia, trauma o heridas familiares queda privado por defecto. Si una memoria se vuelve demasiado intensa, detente y considera buscar acompañamiento profesional.",
    espejoPersonal: [
      "¿Dónde en mi historia sentí abuso, control, manipulación o invasión de límites?",
      "¿Qué parte de mi cuerpo aprendió a cerrarse, defenderse o desconectarse?",
      "¿Qué parte de mi voz fue silenciada?",
      "¿Qué parte de mi voluntad fue quebrada o entregada?",
      "¿Qué relación tengo con el poder: lo temo, lo rechazo, lo entrego, lo abuso o lo pongo al servicio?",
      "¿Qué situaciones me hicieron perder dignidad?",
      "¿Qué vínculo me enseñó a confundir amor con sometimiento?",
      "¿Qué límite necesito recuperar?",
      "¿Qué verdad necesito reconocer aunque todavía duela?",
    ],
    espejoLinaje: [
      "¿Qué abusos, silencios o secretos existen en mi árbol familiar?",
      "¿Qué patrones de control, violencia, sometimiento o invasión se repiten?",
      "¿Qué mujeres, hombres, niños o cuerpos de mi linaje no fueron escuchados?",
      "¿Qué historia familiar se oculta bajo vergüenza, culpa o miedo?",
      "¿Qué patrón de poder se repite: autoritarismo, sumisión, manipulación, dependencia, abandono o abuso?",
      "¿Qué parte de mi linaje necesita recuperar dignidad?",
      "¿Qué silencio familiar estoy listo para dejar de cargar?",
    ],
    espejoTerritorio: [
      "¿Qué heridas colectivas existen en el lugar donde vivo?",
      "¿Qué pueblos fueron invadidos, desplazados, abusados o silenciados?",
      "¿Qué memorias de conquista, violencia, explotación o destrucción permanecen en este territorio?",
      "¿Qué abuso contra la Tierra se repite todavía: agua contaminada, cerros destruidos, templos olvidados, pueblos invisibilizados?",
      "¿Qué lugar cercano siento que necesita ser recordado, honrado o escuchado?",
    ],
    acciones: [
      {
        key: "recuperar_mi_voz",
        name: "RECUPERAR MI VOZ",
        category: "acciones",
        instruction: [
          "Escribe una verdad que alguna vez no pudiste decir.",
          "No necesitas enviarla. No necesitas publicarla. No necesitas confrontar a nadie. Solo permite que exista en tu bitácora.",
        ],
        fields: [
          "Lo que no pude decir fue…",
          "Callé porque…",
          "Mi cuerpo sintió…",
          "Hoy reconozco que…",
          "Mi voz vuelve a mí para…",
        ],
      },
      {
        key: "devolver_veneno_tierra",
        name: "DEVOLVER EL VENENO A LA TIERRA",
        category: "acciones",
        instruction: [
          "Esta es una acción simbólica. Escribe una memoria, patrón o herida que ya no quieres seguir cargando como veneno: control, abuso, miedo, culpa, vergüenza, silencio, sometimiento o pérdida de poder.",
          "Luego elige una forma segura de transformación: romper el papel, quemarlo con cuidado, enterrarlo simbólicamente, colocarlo bajo una piedra y luego retirarlo, o guardarlo como testimonio de conciencia.",
        ],
        fields: [
          "El veneno que devuelvo es…",
          "La forma de transformación que elijo es…",
        ],
        closing:
          "El veneno no desaparece cuando se niega. Se transforma cuando la conciencia lo reconoce y deja de alimentarlo.",
      },
      {
        key: "primera_herida_territorio",
        name: "PRIMERA HERIDA DEL TERRITORIO",
        category: "territorio",
        instruction: [
          "Investiga una herida colectiva del territorio donde vives: pueblos originarios, conquista, violencia, destrucción de lugares sagrados, contaminación del agua, abuso de la tierra, desplazamiento, silenciamiento cultural, memoria femenina, guerra o explotación.",
        ],
        fields: [
          "Territorio:",
          "Herida investigada:",
          "Quiénes fueron afectados:",
          "Qué memoria sigue viva:",
          "Qué acto de honra puedo realizar:",
        ],
      },
    ],
    sealId: "dignidad",
    buttonLabel: "Entrar a la Temporada 4",
    forumTitle: "Portal de la Memoria Terrestre (T3 → T4) — Sueños y señales (7 días)",
  },

  // ══════════════════════════════════════════════════════════════════════
  // TRAS T4 · PORTAL DE LA ALQUIMIA SOLAR
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 4,
    nextSeason: 5, // 5 = abrir Objetivos de Los 144.000
    source: "t4_alquimia_solar",
    kicker: "Integración · tras la Temporada 4",
    name: "PORTAL DE LA ALQUIMIA SOLAR",
    subtitle: "Del perdón personal a la misión planetaria",
    frase: ["EL AMOR ABRIÓ LA PUERTA.", "EL PERDÓN TRANSFORMA EL VENENO EN MEDICINA."],
    revelacion: [
      "La Temporada 4 abrió los Archivos del Sol: los Discos Solares, Sumeria, Egipto, Abraham, Moisés, los Esenios, Jesús y el Mensaje Primordial.",
      "Con Jesús, toda la memoria recibida llega a una llave central: el amor como fuerza mayor del universo y el perdón como su manifestación más alta.",
      "Pero el perdón no es negar la historia. No es justificar el daño. No es permitir que el abuso continúe. No es borrar la responsabilidad.",
      "El perdón es una alquimia. Toma el veneno de la herida y lo convierte en medicina. Toma el dolor que gobierna y lo transforma en conciencia. Toma la memoria que encadena y la convierte en servicio.",
      "Antes de entrar a los Objetivos de Los 144.000, mira qué necesitas perdonar, qué necesitas reparar y qué herida puede convertirse en misión.",
    ],
    caution:
      "Esta integración es un acto interior y simbólico. No sugiere ni requiere contacto directo con personas que hayan causado daño, sobre todo si puede ser inseguro. Todo queda privado por defecto; tú decides, con calma, qué compartir.",
    espejoPersonal: [
      "¿Qué parte de la historia de Jesús me confrontó más profundamente?",
      "¿Qué necesito perdonarme a mí mismo?",
      "¿A quién sigo atando desde el dolor, la culpa o el resentimiento?",
      "¿Qué daño recibido todavía gobierna una parte de mi vida?",
      "¿Qué daño causado necesito reconocer con humildad?",
      "¿Qué parte de mí usa la herida como identidad?",
      "¿Qué parte de mí está lista para dejar de repetir una historia antigua?",
      "¿Qué significa para mí perdonar sin justificar?",
      "¿Qué veneno emocional estoy listo para transformar en medicina?",
    ],
    espejoLinaje: [
      "¿Qué herida de mi familia necesita perdón?",
      "¿Qué patrón de mi linaje necesita ser honrado, no repetido y transformado?",
      "¿A quién de mi árbol familiar sigo juzgando sin comprender su dolor?",
      "¿Qué daño heredado sigo cargando como si fuera mío?",
      "¿Qué historia familiar necesita una oración, una carta o un acto de reparación simbólica?",
      "¿Qué patrón termina conmigo?",
    ],
    espejoTerritorio: [
      "¿Qué parte de mi territorio necesita perdón, honra o reparación?",
      "¿Qué pueblos, memorias, aguas, montañas o linajes fueron heridos?",
      "¿Qué historia de mi ciudad, país o tierra todavía pide ser mirada con amor y verdad?",
      "¿Qué acto de custodia puedo hacer como respuesta?",
    ],
    acciones: [
      {
        key: "carta_perdon_consciente",
        name: "CARTA DE PERDÓN CONSCIENTE",
        category: "acciones",
        instruction: [
          "Escribe una carta de perdón. Puede ser hacia ti mismo, alguien que te dañó, alguien a quien dañaste, tu madre o padre, tu linaje, tu territorio, una memoria antigua o una versión pasada de ti.",
        ],
        fields: [
          "Reconozco que…",
          "Me dolió que…",
          "Me perdono por…",
          "Te libero de…",
          "Me libero de…",
          "La lección que recupero es…",
          "La medicina que nace de esta herida es…",
          "A partir de hoy elijo…",
        ],
      },
      {
        key: "acto_de_reparacion",
        name: "EL ACTO DE REPARACIÓN",
        category: "acciones",
        instruction: [
          "Elige una acción concreta para no repetir el patrón: poner un límite, pedir perdón de forma sana, reparar una conducta, ordenar una conversación pendiente, dejar de alimentar una dependencia, cuidar tu cuerpo, honrar a un ancestro, limpiar un lugar, visitar un punto de tu territorio, sembrar una intención o hacer una oración por una línea familiar.",
        ],
        fields: [
          "Patrón que no quiero repetir:",
          "Daño que reconozco:",
          "Nueva acción que elijo:",
          "Primer paso concreto:",
          "Fecha en que lo realizaré:",
        ],
      },
      {
        key: "mi_herida_como_medicina",
        name: "MI HERIDA COMO MEDICINA",
        category: "revelaciones",
        instruction: ["Completa esta síntesis: aquí tu historia personal se convierte en el inicio de tu misión."],
        fields: [
          "Lo que vine a sanar en mí es…",
          "Lo que mi linaje me mostró es…",
          "Lo que mi territorio refleja es…",
          "La medicina que puedo ofrecer a la Red es…",
          "Mi servicio comienza cuando…",
        ],
      },
    ],
    sealId: "perdon_solar",
    buttonLabel: "Continuar a los Objetivos",
    forumTitle: "Objetivos de Los 144.000 — De la memoria a la misión",
  },
]

export function getIntegrationPortal(id: number): IntegrationPortalDef | undefined {
  return INTEGRATION_PORTALS.find((p) => p.id === id)
}
