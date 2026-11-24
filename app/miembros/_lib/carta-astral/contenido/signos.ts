// ═══════════════════════════════════════════════════════════════════════════
//  LOS DOCE SIGNOS · atributos y conflictos
// ═══════════════════════════════════════════════════════════════════════════
//
// GENERADO desde «Camino Solar 2026.xlsx». No se edita a mano: si el texto
// cambia, cambia en el Excel y se vuelve a generar. Editarlo aquí deja el
// Excel y la plataforma diciendo cosas distintas.
//
// El texto es de José, palabra por palabra. No se ha reescrito ni resumido.


export type SignoId =
  | "capricornio"
  | "acuario"
  | "piscis"
  | "aries"
  | "tauro"
  | "geminis"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "escorpio"
  | "sagitario"

export type ContenidoSigno = {
  nombre: string
  atributos: string
  conflictos: string
}

export const SIGNOS: Record<SignoId, ContenidoSigno> = {
  capricornio: {
    nombre: "Capricornio",
    atributos: "Capricornio encarna la voluntad de superación constante. Es la conciencia que entiende que nada valioso se construye sin tiempo, esfuerzo y disciplina. Tiene una capacidad natural para asumir responsabilidad, incluso antes de estar listo, y avanzar aun cuando el cansancio aparece. Su motor interno lo lleva a salir una y otra vez de la zona de confort, a exigirse más de lo que otros se exigirían, y a sostener procesos largos sin abandonar. Representa el trabajo duro, la constancia silenciosa y la paciencia estratégica. Cuando se desequilibra, puede olvidar el descanso, endurecerse emocionalmente o medir su valor solo por lo que logra.",
    conflictos: "Cuando Capricornio entra en desequilibrio vive una insatisfacción permanente. Nada es suficiente, nada alcanza, nada termina de llenar. Se exige sin descanso y convierte el esfuerzo en una prisión. Cree que solo existe una forma válida de hacer las cosas: la suya, basada en el trabajo duro, el sacrificio y la resistencia. Se cierra mentalmente a nuevas posibilidades, no delega, no confía y se aísla emocionalmente. Puede volverse solitario, rígido y severo consigo mismo y con los demás. El descanso le genera culpa y la alegría le parece improductiva. Trabaja sin parar, pero nunca siente que llegó.",
  },
  acuario: {
    nombre: "Acuario",
    atributos: "Acuario es la libertad en estado puro. No puede ser contenido en estructuras rígidas ni en patrones cerrados de expresión. Su mente se mueve en ideas, filosofías, creencias y visiones colectivas; piensa en redes, sistemas y futuros posibles. Enseña el desapego de lo personal para abrirse a lo universal, y suele adelantarse a su tiempo. Es soñador, disruptivo, expansivo, y cuestiona todo aquello que limita la autenticidad. En su sombra, puede volverse distante, demandante o desconectado de lo emocional inmediato, refugiándose solo en la idea y no en el vínculo.",
    conflictos: "En sombra, Acuario vive en una innovación constante sin concreción. Todo lo empieza, poco lo termina. Tiene ideas brillantes, pero le cuesta sostener procesos, manifestar en la materia y comprometerse con una forma. Libera, abandona, se despega, y a veces cae en una indiferencia emocional que lo desconecta de la experiencia humana. Puede parecer que “todo le da igual”, cuando en realidad evita el peso de la responsabilidad. Se refugia en lo mental, en lo ideal o en lo colectivo, pero pierde anclaje con su propio sentir y con el impacto real de sus acciones.",
  },
  piscis: {
    nombre: "Piscis",
    atributos: "Piscis vive desde la sensibilidad profunda y la certeza de que todo está conectado. No separa, no juzga, no excluye. Se lanza a vivir el sueño, la utopía, el misterio, y percibe la vida como un flujo continuo donde nada está aislado. Es emoción, empatía y amor incondicional. Tiene la capacidad de disolverse en el otro, de sentir lo que otros no pueden nombrar, y de recordar que “todo es”. Cuando no hay límites claros, puede perderse, confundirse o cargar emociones que no le pertenecen, olvidando cuidarse a sí mismo.",
    conflictos: "Piscis en desequilibrio niega los límites y la realidad concreta. Puede creer en ideas, emociones o ideologías que no comprende del todo, y escapar de los conflictos en lugar de atravesarlos. Le cuesta asumir responsabilidad y buscar soluciones prácticas. Se dispersa, se diluye, se confunde. Todo se vuelve demasiado grande, demasiado abstracto. Al no diferenciar, pierde foco, dirección y objetivos claros. Vive en un mundo interno intenso, pero desconectado de la acción. La evasión, la fantasía o el victimismo pueden convertirse en refugio.",
  },
  aries: {
    nombre: "Aries",
    atributos: "Aries es la chispa de la creación, la voluntad que inicia. Representa al niño interior que da el primer paso sin saber exactamente a dónde va, pero confiando en su fuerza vital. Es impulso, coraje y comienzo. No analiza demasiado: actúa, se sorprende, aprende haciendo. Abre caminos donde antes no los había y despierta energía en los demás. Su desafío aparece cuando la impulsividad domina, cuando actúa sin medir consecuencias o se frustra rápidamente al no ver resultados inmediatos.",
    conflictos: "En sombra, Aries se manifiesta como ira, rabia y violencia, tanto externa como interna. Vive en constante conflicto, siempre listo para luchar, conquistar o imponerse. Se enamora de sí mismo y de su impulso, pero sin responsabilidad. Actúa como un niño herido que exige atención, se frustra rápido y descarga su enojo en los demás. Puede volverse egoísta, egocéntrico y poco consciente del impacto de sus actos. Vive el día a día sin visión de futuro, evita hacerse cargo y confunde fuerza con agresión.",
  },
  tauro: {
    nombre: "Tauro",
    atributos: "Tauro es el cuerpo de la Tierra. Representa el bienestar, la estabilidad y la capacidad de echar raíces. Aunque el alma sepa que el hogar es el universo, Tauro recuerda que el cuerpo necesita seguridad, placer y constancia. Construye, cuida y nutre. Donde se encuentra, hace crecer algo: un proyecto, una relación, un espacio. Tiene una profunda conexión con lo sensorial y con el valor de lo simple. En desequilibrio, puede aferrarse demasiado, resistirse al cambio o buscar seguridad solo en lo material.",
    conflictos: "Cuando Tauro se desequilibra se queda inmóvil. Duerme de más, se acomoda, se aferra. Se “casa” para siempre con personas, ideas, hábitos o situaciones que ya no nutren. Busca placer inmediato y seguridad en lo físico, en la comida, en el cuerpo, en lo material. Se resiste al cambio y teme soltar lo conocido, aunque ya no sea saludable. La comodidad se transforma en estancamiento y la estabilidad en rigidez.",
  },
  geminis: {
    nombre: "Geminis",
    atributos: "Géminis es la palabra en movimiento. Comunica, conecta, manifiesta ideas y crea puentes entre personas. No juzga: observa ambos lados, los nombra y los expresa. Entiende la dualidad sin necesidad de elegir una sola verdad. Habla, escribe, pregunta, enlaza. Es curioso, versátil y mentalmente ágil. Enseña que manifestar es avanzar. En su sombra, puede dispersarse, hablar sin profundidad o quedarse en lo superficial sin integrar lo que comunica.",
    conflictos: "En su sombra, Géminis pierde el centro. Al ser consciente de múltiples aspectos, se dispersa y no sabe desde dónde actuar. Se adapta a lo que aparece, pero no desde su identidad, sino desde la circunstancia. Le cuesta tomar postura, decidir y sostener una dirección. Puede hablar mucho sin decir nada esencial, cambiar de opinión constantemente y sentirse fragmentado. La dualidad, en lugar de enriquecer, lo confunde.",
  },
  cancer: {
    nombre: "Cáncer",
    atributos: "Cáncer representa el hogar emocional, la familia y el cuidado. Ama de forma incondicional, pero dentro de límites claros: protege lo que considera propio. Sus lágrimas no son debilidad, son información; a través de la emoción muestra dónde está la herida y también la solución. Tiene una capacidad natural de sanación, contención y memoria emocional. Cuando se desequilibra, puede cerrarse, vivir desde el pasado o proteger en exceso, dificultando el crecimiento propio y ajeno.",
    conflictos: "Cáncer en desequilibrio vive el amor de forma condicionada. Protege en exceso, se apega, controla desde el cuidado y teme profundamente soltar. Los cambios lo desestabilizan y los vive como amenaza. Llora, sufre, se encierra en el pasado y en la memoria emocional. Le cuesta aceptarse y aceptar que otros crezcan y se separen. El apego se convierte en dependencia y el cuidado en asfixia.",
  },
  leo: {
    nombre: "Leo",
    atributos: "Leo es el ejemplo vivo. Guía desde la experiencia, no desde la teoría. Su carisma nace de haber atravesado procesos y haber aprendido de ellos. Tiene la capacidad de amar y ser amado, de inspirar a otros simplemente siendo quien es. Representa el ego trabajado, consciente de su valor sin necesidad de imponerse. Cuando pierde equilibrio, puede buscar validación constante, confundiendo liderazgo con necesidad de reconocimiento.",
    conflictos: "En sombra, Leo se transforma en un dictador emocional. Busca brillar a toda costa, forzándose a ser una estrella. Actúa, exagera, se disfraza según el público y pierde autenticidad. Manipula emociones, seduce, convence y construye personajes para sostener su imagen. Necesita aprobación constante y teme profundamente no ser visto. El liderazgo se convierte en control y el carisma en manipulación.",
  },
  virgo: {
    nombre: "Virgo",
    atributos: "Virgo encarna el propósito en acción. Ordena, organiza, limpia y mejora procesos. Tiene una vocación profunda de servicio desde el alma y una capacidad extraordinaria para detectar lo que no está en coherencia. Trabaja con detalle, método y dedicación. Su mirada busca eficiencia y sentido. En sombra, puede caer en la autoexigencia extrema, la crítica excesiva o el perfeccionismo que paraliza.",
    conflictos: "Virgo desequilibrado se vuelve obsesivo, controlador y manipulador. Asume el rol de “la mamá” que todo lo sabe y todo lo corrige. Puede caer en la hipocondría, la compulsión, el miedo al error y la necesidad de tener todo bajo control. La crítica se vuelve constante, tanto hacia sí mismo como hacia los demás. El servicio se transforma en sacrificio y la coherencia en rigidez.",
  },
  libra: {
    nombre: "Libra",
    atributos: "Libra es el arte del equilibrio. Creador, estético y conciliador, busca armonía, justicia y belleza en todas las formas. Tiene la capacidad de ver múltiples perspectivas y encontrar la mejor opción posible para todos. Cuando está en balance, no juzga: ordena. Su desafío aparece cuando duda demasiado, evita el conflicto o posterga decisiones por miedo a romper la armonía.",
    conflictos: "En sombra, Libra disfraza la realidad. Adorna, tapa, maquilla lo que está mal para evitar el conflicto. Puede volverse profundamente indeciso, incapaz de tomar postura por miedo a romper la armonía. Juzga, califica y mide todo desde un falso equilibrio. No tolera la injusticia, pero muchas veces no actúa frente a ella. El deseo de paz externa oculta un conflicto interno no resuelto.",
  },
  escorpio: {
    nombre: "Escorpio",
    atributos: "Escorpio es el viaje a las profundidades del alma. Su misión es llevar luz a las sombras, revelar lo oculto y transformar lo que duele. Nos muestra dónde están los nutrientes para echar raíces profundas y elevarnos alto. Es medicina emocional y espiritual. Al sanar su propio pasado, sirve al colectivo. Cuando se desequilibra, puede quedarse atrapado en el control, el resentimiento o la intensidad emocional sin salida.",
    conflictos: "Escorpio es el lugar donde se acumulan las sombras. Recuerda todo, no olvida, guarda memoria emocional profunda. En desequilibrio se vuelve rencoroso, desconfiado y oscuro. Aprieta la herida, pone el dedo en la llaga, revive lo no resuelto. Puede usar el dolor propio o ajeno como arma. La intensidad se vuelve destructiva cuando no hay transformación consciente. La herida no sanada se convierte en veneno.",
  },
  sagitario: {
    nombre: "Sagitario",
    atributos: "Sagitario es expansión y sentido. Vive desde la alegría, la confianza y la certeza interior. Explora nuevos territorios físicos, culturales y espirituales. Aprende de cada lugar, persona y experiencia. Comparte sabiduría desde la vivencia, no desde el dogma. Su energía se expande como el calor del fuego, inspirando a otros a buscar su propia verdad. En sombra, puede dispersarse, exagerar o evitar compromisos profundos.",
    conflictos: "Sagitario en sombra confunde libertad con irresponsabilidad. Rechaza límites, leyes y compromisos. Se dispersa, se escabulle de los problemas y evita el enfrentamiento real. Desconoce el valor del liderazgo consciente (Leo) y huye cuando la situación exige presencia. El fuego se vuelve incontrolable, quemando sin dirección. Mucho entusiasmo, poca concreción.",
  },
}

/**
 * El orden del Camino Solar, tal como está en el Excel: empieza en
 * Capricornio.
 *
 * OJO: esto es para PRESENTAR. Para convertir grados en signo hace falta el
 * orden zodiacal (Aries = 0°), que es `ORDEN_ZODIACAL`. Usar este por error
 * correría la carta entera nueve signos.
 */
export const ORDEN_CAMINO: SignoId[] = [
  "capricornio",
  "acuario",
  "piscis",
  "aries",
  "tauro",
  "geminis",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "escorpio",
  "sagitario",
]

/**
 * El orden del cielo, que es el que manda en el cálculo: Aries empieza en el
 * grado 0 de la eclíptica y cada signo ocupa 30°.
 */
export const ORDEN_ZODIACAL: SignoId[] = [
  "aries", "tauro", "geminis", "cancer", "leo", "virgo",
  "libra", "escorpio", "sagitario", "capricornio", "acuario", "piscis",
]

/** De una longitud eclíptica (0–360°) al signo que le toca. */
export function signoDeGrado(longitud: number): SignoId {
  const g = ((longitud % 360) + 360) % 360
  return ORDEN_ZODIACAL[Math.floor(g / 30)]
}

/** Los grados DENTRO del signo (0–29,99…). */
export function gradoEnSigno(longitud: number): number {
  const g = ((longitud % 360) + 360) % 360
  return g - Math.floor(g / 30) * 30
}
