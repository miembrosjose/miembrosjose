// ═══════════════════════════════════════════════════════════════════════════
//  CADA PLANETA EN CADA SIGNO · los otros 120 textos
// ═══════════════════════════════════════════════════════════════════════════
//
// ── LA DIFERENCIA CON «PLANETA EN CASA», QUE ES LA QUE MÁS CUESTA ─────────
// El signo dice CÓMO. La casa dice DÓNDE.
//
//   Marte en Aries   → cómo actúas: de frente, rápido, sin preámbulo.
//   Marte en casa 7  → dónde se gasta esa fuerza: en los vínculos.
//
// Son dos frases sobre la misma cosa y no sobrantes. Por eso los textos de
// aquí hablan de MANERA —estilo, tono, ritmo— y los de casa hablan de
// TERRENO. Si los dos dijeran lo mismo con otras palabras, uno de los dos
// sobraría, y la lectura sonaría a relleno.
//
// ── URANO, NEPTUNO Y PLUTÓN HABLAN DE UNA GENERACIÓN ──────────────────────
// Tardan entre siete y veinte años en cambiar de signo. Todos los nacidos en
// esos años los tienen igual, así que su signo NO dice nada personal, y
// escribirlo como si sí sería engañar.
//
// Sus textos están redactados en plural y nombran a la generación. Lo
// personal de esos tres es la CASA, que depende de la hora y el lugar de
// nacimiento. Esto va dicho también en pantalla.
//
// ── DE DÓNDE SALE ─────────────────────────────────────────────────────────
// Escrito para Los 144.000. Ni copiado ni traducido de ninguna fuente con
// derechos. Mismas tres reglas que en los textos de casa: se describe y no se
// predice, se puede reconocer o no, y cada posición da y quita.

import type { SignoId } from "./signos"
import type { PlanetaId } from "./vocabulario"

export const PLANETA_EN_SIGNO: Record<PlanetaId, Record<SignoId, string>> = {
  // ── SOL · cómo brillas ──────────────────────────────────────────────────
  sol: {
    aries: "Te realizas empezando. Necesitas que algo dependa de tu iniciativa para sentirte vivo, y el arranque se te da mejor que el remate. Valentía de sobra, paciencia justa.",
    tauro: "Te realizas construyendo algo que dure y se pueda tocar. Vas despacio y no te mueve la urgencia ajena. Das una estabilidad en la que otros se apoyan, y te cuesta cambiar cuando toca.",
    geminis: "Te realizas conociendo y comunicando. Necesitas variedad como otros necesitan descanso. Mente viva y trato fácil, con dificultad para quedarte quieto en una sola cosa.",
    cancer: "Te realizas cuidando y perteneciendo. Lo tuyo es crear un lugar donde la gente esté a salvo. Da una sensibilidad que protege a otros, y una memoria larga para lo que dolió.",
    leo: "Te realizas creando y siendo visto en lo que creas. Hay generosidad y calor, y una necesidad real de que lo tuyo se reconozca. El punto difícil es cuando el aplauso se vuelve condición.",
    virgo: "Te realizas perfeccionando y sirviendo. Ves el fallo y el arreglo antes que nadie. Da una competencia enorme, y una exigencia hacia ti mismo que pocos sospechan.",
    libra: "Te realizas vinculando y equilibrando. Buscas el acuerdo y lo encuentras donde otros solo ven enfrentamiento. Cuesta sostener una posición propia cuando rompe la armonía.",
    escorpio: "Te realizas yendo al fondo. No te sirve la versión fácil de nada. Da una fuerza poco común para atravesar lo difícil, y una tendencia a guardar más de lo que convendría.",
    sagitario: "Te realizas ampliando: viajar, estudiar, creer, enseñar. Necesitas horizonte y aire. Da entusiasmo contagioso, y una impaciencia con lo pequeño y lo repetido.",
    capricornio: "Te realizas construyendo con tiempo y responsabilidad. Maduras pronto y aflojas tarde. Da una solidez que no se improvisa, y una dificultad para permitirte el descanso.",
    acuario: "Te realizas pensando distinto y perteneciendo a algo mayor que tú. Independencia de criterio y visión de futuro. Cuesta la cercanía cuando pide renunciar a la libertad.",
    piscis: "Te realizas disolviendo los bordes: arte, compasión, entrega. Captas lo que no se dice. Da una sensibilidad rara, y dificultad para marcar dónde acabas tú y empieza el otro.",
  },

  // ── LUNA · cómo necesitas ───────────────────────────────────────────────
  luna: {
    aries: "Reaccionas rápido y se te pasa igual de rápido. Necesitas movimiento para estar bien y la espera te pone de mal humor. Lo que sientes sale en el momento, sin filtro.",
    tauro: "Necesitas calma, constancia y lo que se toca: comida buena, cama propia, rutinas que no cambien. Tardas en alterarte y tardas más en volver si algo te movió el suelo.",
    geminis: "Necesitas hablar lo que sientes para saber qué sientes. El ánimo cambia con la conversación. Da adaptabilidad, y una dificultad para quedarte en una emoción el tiempo suficiente.",
    cancer: "Necesitas pertenecer y cuidar. La casa y los tuyos son el ancla. Memoria emocional muy larga: recuerdas el tono con el que te hablaron hace años.",
    leo: "Necesitas que tu afecto se vea y se devuelva. Das calor sin medida y te duele el desaire más de lo que admites. El cariño tiene que ser dicho, no supuesto.",
    virgo: "Necesitas orden para estar tranquilo. Una tarea resuelta te calma más que una conversación. Tiendes a procesar lo emocional analizándolo, y el cuerpo avisa cuando eso no basta.",
    libra: "Necesitas armonía y compañía. El conflicto te descoloca físicamente. Da un talento para sintonizar con el otro, y la costumbre de callar lo propio para que no haya mal ambiente.",
    escorpio: "Sientes en profundidad y sin medias tintas. Nada es tibio. Da una percepción muy fina de lo que el otro oculta, y una dificultad real para soltar lo que dolió.",
    sagitario: "Necesitas libertad y sentido para estar bien. El encierro te apaga. Ánimo optimista y de recuperación rápida, con tendencia a irte antes de que la cosa se ponga pesada.",
    capricornio: "Necesitas control y responsabilidad para sentirte seguro. Te cuesta pedir y te sale antes ocuparte que apoyarte. Hay una reserva emocional que se lee como fortaleza y a veces es defensa.",
    acuario: "Necesitas espacio e independencia incluso de quien quieres. Miras lo emocional desde cierta distancia, lo que ayuda en la crisis y enfría en lo cotidiano.",
    piscis: "Absorbes el ambiente sin querer: entras en una habitación y te llevas lo que hay. Da compasión y una sensibilidad enorme, con la dificultad de distinguir qué sentimiento es tuyo.",
  },

  // ── MERCURIO · cómo piensas ─────────────────────────────────────────────
  mercurio: {
    aries: "Piensas rápido y dices lo que piensas. Decides antes de tener todos los datos y aciertas más de lo esperable. Te pierdes los matices por querer ir al grano.",
    tauro: "Piensas despacio y bien. Necesitas tiempo para procesar y, una vez entendido, no se te olvida. Cuesta cambiar de opinión aunque lleguen argumentos buenos.",
    geminis: "Mente ágil, curiosa y muy verbal. Conectas ideas que no se parecían y aprendes de cualquier cosa. El riesgo es saber un poco de todo y profundizar en nada.",
    cancer: "Piensas con la memoria y el ánimo puestos. Recuerdas lo que te importó y razonas desde ahí. Da intuición en el trato, y dificultad para ser imparcial sobre lo propio.",
    leo: "Hablas con convicción y te escuchan. Piensas en grande y expones bien. Cuesta rectificar en público, porque la opinión se vive como parte de uno.",
    virgo: "Precisión, método y ojo para el detalle. Es donde Mercurio mejor funciona. Da una capacidad de análisis poco común, y una tendencia a corregir lo que nadie pidió que corrigieras.",
    libra: "Piensas comparando y buscando el punto medio. Ves los dos lados con honestidad. Eso mismo hace que decidir te cueste más de lo normal.",
    escorpio: "Mente investigadora: no te conformas con lo que te dicen. Capacidad de leer entre líneas y de guardar un secreto. Puedes quedarte dando vueltas a algo cerrado.",
    sagitario: "Piensas en grande: principios, sentido, el conjunto. Buen narrador y buen maestro. El riesgo es la generalización — la teoría elegante sobre lo que no se ha mirado de cerca.",
    capricornio: "Pensamiento estructurado y práctico. Piensas en objetivos y en pasos. Da criterio serio y una dificultad para el juego mental sin utilidad.",
    acuario: "Piensas por tu cuenta y en sistemas. Se te ocurren cosas que a nadie del grupo. Puedes aferrarte a una idea propia precisamente por ser propia.",
    piscis: "Piensas en imágenes y por asociación. Intuición antes que lógica, y una capacidad poética poco común. Cuesta la precisión y los detalles concretos.",
  },

  // ── VENUS · cómo vinculas y valoras ─────────────────────────────────────
  venus: {
    aries: "Quieres con impulso y vas de frente. Te enamoras rápido y te aburres si no hay chispa. Da franqueza en el afecto, y poca paciencia para lo que se construye lento.",
    tauro: "Quieres con constancia y lo demuestras con presencia y cuidado. Disfrutas de lo sensorial sin culpa. Cuesta soltar un vínculo aunque ya no nutra.",
    geminis: "Te vinculas hablando. Necesitas que el otro te interese mentalmente o no hay nada. Da ligereza y buen trato, con dificultad para la profundidad sostenida.",
    cancer: "Quieres cuidando y pides que te cuiden. El afecto va unido a la casa y a la memoria. Da ternura real, y una tendencia a aferrarte por miedo a perder.",
    leo: "Quieres con generosidad y en grande. El amor tiene que tener algo de celebración. Da calor y lealtad, y necesita un reconocimiento que no siempre llega.",
    virgo: "Demuestras el afecto haciendo cosas por el otro, no diciéndolas. Da fiabilidad enorme. Cuesta recibir, y a veces se critica justo a quien más se quiere.",
    libra: "El vínculo es tu terreno. Hay encanto, trato fácil y una búsqueda sincera del acuerdo. El riesgo es ceder tanto que la relación se sostenga sobre lo que tú no dijiste.",
    escorpio: "Quieres con intensidad y exclusividad. No hay término medio ni interés por lo superficial. Da una entrega total, con celos o control cuando el miedo manda.",
    sagitario: "Necesitas libertad dentro del afecto y alguien que te amplíe el mundo. Da alegría y honestidad, con dificultad para el compromiso que se siente como cerco.",
    capricornio: "Quieres con seriedad y a largo plazo. El afecto se demuestra con hechos y con permanencia. Cuesta la expresión espontánea, y el cariño puede parecer frío sin serlo.",
    acuario: "Quieres con libertad y fuera del formato esperado. Buena amistad dentro de la pareja. Cuesta la intimidad que pide fusión.",
    piscis: "Quieres sin condiciones y a veces sin bordes. Capacidad de amar de verdad y de perdonar. El riesgo es idealizar y quedarse donde ya no hay nadie esperando.",
  },

  // ── MARTE · cómo actúas ─────────────────────────────────────────────────
  marte: {
    aries: "Actúas de frente y en el momento. Arranque inmediato, valentía física, nada de rodeos. Lo que falta es el aguante largo y la segunda vuelta.",
    tauro: "Actúas despacio y no paras. Fuerza de resistencia más que de arranque. Cuesta enfadarte, y cuando pasa, tarda mucho en bajar.",
    geminis: "Actúas con palabras y con varias cosas a la vez. Peleas discutiendo, y bien. Da versatilidad y una energía que se dispersa si no se encauza.",
    cancer: "Actúas protegiendo. La fuerza se activa cuando algo tuyo está en juego. El enfado sale indirecto más que de frente, y eso enreda más de lo que resuelve.",
    leo: "Actúas con presencia y te gusta que se note. Valentía para exponerte y para liderar. El orgullo puede sostener una batalla que ya no vale la pena.",
    virgo: "Actúas con método y precisión. Energía aplicada al detalle y al oficio. El desgaste viene de la autoexigencia más que del trabajo.",
    libra: "Actúas negociando. Te cuesta el enfrentamiento directo y buscas el acuerdo antes. La rabia se acumula por no sacarla a tiempo.",
    escorpio: "Actúas con estrategia y a fondo. Resistencia enorme y capacidad de esperar el momento. Puede haber control, y una memoria larga para las afrentas.",
    sagitario: "Actúas lanzándote y confiando. Energía entusiasta y movimiento constante. Falta el remate: empiezas más de lo que terminas.",
    capricornio: "Actúas con disciplina y hacia un objetivo. Es donde Marte mejor rinde: esfuerzo sostenido durante años. Cuesta la espontaneidad y el descanso.",
    acuario: "Actúas de forma inesperada y por una causa. Energía a ráfagas, no continua. Resistencia a que te digan cómo hacerlo.",
    piscis: "Actúas indirectamente y por sensibilidad más que por plan. Cuesta sostener el empuje y defender lo propio. La fuerza aparece entera cuando se trata de otro.",
  },

  // ── JÚPITER · por dónde creces ──────────────────────────────────────────
  jupiter: {
    aries: "Creces atreviéndote. La suerte llega cuando tomas la iniciativa, no cuando esperas. El exceso es lanzarte sin mirar.",
    tauro: "Creces acumulando con paciencia. Buen olfato para lo que vale y dura. El exceso es la comodidad y el gusto por lo bueno llevado lejos.",
    geminis: "Creces aprendiendo y relacionando. Las oportunidades llegan por una conversación. El exceso es abarcar más de lo que se puede atender.",
    cancer: "Creces cuidando y echando raíces. La familia y el hogar son fuente de abundancia. El exceso es la sobreprotección.",
    leo: "Creces mostrándote y creando. Generosidad grande y talento para el escenario. El exceso es la grandilocuencia y la necesidad de ser el centro.",
    virgo: "Creces perfeccionando y sirviendo. La abundancia viene del oficio bien hecho. El exceso es el detalle llevado hasta donde ya no aporta.",
    libra: "Creces vinculando. Las oportunidades llegan por la gente y por el acuerdo. El exceso es complacer para no perder el favor de nadie.",
    escorpio: "Creces transformando. Capacidad de regenerarse tras una pérdida y de manejar recursos ajenos. El exceso es la intensidad llevada a todo.",
    sagitario: "Es su terreno. Creces viajando, estudiando, creyendo y enseñando. Optimismo de fondo. El exceso es la promesa fácil y el dogma con buena intención.",
    capricornio: "Creces con disciplina y a largo plazo. La abundancia es lenta y real. El exceso, aquí, es la austeridad: cuesta permitirse lo que ya se ganó.",
    acuario: "Creces con el grupo y con las ideas nuevas. Oportunidades por la red y por lo colectivo. El exceso es la teoría por delante de la vida concreta.",
    piscis: "Creces entregando y confiando. Fe genuina y compasión amplia. El exceso es dar sin medida y no mirar las cuentas.",
  },

  // ── SATURNO · dónde se construye ────────────────────────────────────────
  saturno: {
    aries: "La lección es la paciencia y el momento oportuno. Cuesta arrancar o se arranca y se abandona. Lo que se construye es una iniciativa que ya no se dispersa.",
    tauro: "La lección es la seguridad: cuesta sentir que hay suficiente. Lo que se construye es una base material y un valor propio que no dependen de nadie.",
    geminis: "La lección es la palabra: hablar costó, o costó que te escucharan. Lo que se construye es un pensamiento riguroso y una voz con peso.",
    cancer: "La lección está en el afecto y la raíz: hubo poco nido o demasiada responsabilidad temprana. Lo que se construye es una casa emocional propia.",
    leo: "La lección es mostrarse: cuesta brillar sin pedir permiso. Lo que se construye es una autoridad creativa que no necesita aplauso para sostenerse.",
    virgo: "La lección es el límite de la exigencia. El perfeccionismo paraliza antes de ayudar. Lo que se construye es una competencia serena, sin latigazo.",
    libra: "La lección está en el vínculo: compromiso, responsabilidad, o la soledad que enseña. Lo que se construye son relaciones de verdad, elegidas y no sufridas.",
    escorpio: "La lección es el control y la confianza. Cuesta soltar y cuesta depender. Lo que se construye es una fuerza interior que ya no necesita dominar nada.",
    sagitario: "La lección es la fe: la heredada no sirvió y hubo que buscar. Lo que se construye es un criterio propio, probado y no prestado.",
    capricornio: "Es su terreno, y aprieta. Responsabilidad temprana y exigencia alta. Lo que se construye es una autoridad real, ganada con años y sin atajos.",
    acuario: "La lección es la pertenencia: cuesta el grupo y cuesta la libertad dentro de él. Lo que se construye es un lugar propio en lo colectivo, sin disolverse.",
    piscis: "La lección es el límite de lo que se entrega. Cuesta decir que no y cuesta distinguir compasión de entrega sin fin. Lo que se construye es una fe con los pies en el suelo.",
  },

  // ── URANO · generacional ────────────────────────────────────────────────
  urano: {
    aries: "Tu generación rompió empezando: nuevas formas de iniciativa e independencia individual. Lo tuyo propio es la casa donde esa ruptura te toca.",
    tauro: "Tu generación cambió la relación con el dinero, la tierra y lo material. Lo tuyo propio es la casa donde eso se te nota.",
    geminis: "Tu generación transformó la comunicación y el modo de aprender. Lo tuyo propio es la casa donde ese cambio actúa en tu vida.",
    cancer: "Tu generación cambió la idea de familia y de hogar. Lo tuyo propio es la casa donde esa ruptura aparece.",
    leo: "Tu generación redefinió la expresión personal y la fama. Lo tuyo propio es la casa en la que eso se juega para ti.",
    virgo: "Tu generación cambió el trabajo, la salud y la técnica de lo cotidiano. Lo tuyo propio es la casa donde eso se manifiesta.",
    libra: "Tu generación transformó las relaciones y el matrimonio. Lo tuyo propio es la casa donde ese cambio te alcanza.",
    escorpio: "Tu generación removió lo íntimo, lo oculto y lo tabú. Lo tuyo propio es la casa donde eso se remueve en ti.",
    sagitario: "Tu generación rompió con las creencias heredadas y abrió fronteras. Lo tuyo propio es la casa donde esa apertura actúa.",
    capricornio: "Tu generación sacudió las estructuras y las instituciones. Lo tuyo propio es la casa donde esa sacudida te toca.",
    acuario: "Tu generación reinventó lo colectivo y la tecnología. Lo tuyo propio es la casa donde eso se expresa en tu vida.",
    piscis: "Tu generación transformó lo espiritual y lo artístico. Lo tuyo propio es la casa donde esa corriente pasa por ti.",
  },

  // ── NEPTUNO · generacional ──────────────────────────────────────────────
  neptuno: {
    aries: "Tu generación soñó con el héroe y la acción redentora. Lo tuyo propio es la casa donde esa niebla y esa inspiración te tocan.",
    tauro: "Tu generación idealizó lo material y la naturaleza. Lo tuyo propio es la casa donde eso se vuelve concreto en tu vida.",
    geminis: "Tu generación idealizó la palabra y la información. Lo tuyo propio es la casa donde esa confusión o esa inspiración aparecen.",
    cancer: "Tu generación idealizó el hogar y la madre. Lo tuyo propio es la casa donde ese anhelo se activa.",
    leo: "Tu generación idealizó el brillo y la creación personal. Lo tuyo propio es la casa donde eso se expresa.",
    virgo: "Tu generación idealizó el servicio, la salud y la pureza. Lo tuyo propio es la casa donde eso se vive.",
    libra: "Tu generación idealizó el amor y la pareja. Lo tuyo propio es la casa donde esa idealización actúa.",
    escorpio: "Tu generación disolvió los límites de lo íntimo y lo prohibido. Lo tuyo propio es la casa donde eso se nota.",
    sagitario: "Tu generación idealizó la libertad y la búsqueda espiritual. Lo tuyo propio es la casa donde esa búsqueda ocurre.",
    capricornio: "Tu generación vio disolverse las certezas y las instituciones. Lo tuyo propio es la casa donde eso te alcanza.",
    acuario: "Tu generación soñó con lo colectivo y lo tecnológico sin fronteras. Lo tuyo propio es la casa donde eso se concreta.",
    piscis: "Es su propio signo: tu generación lleva una sensibilidad espiritual especialmente abierta. Lo tuyo propio es la casa donde se manifiesta.",
  },

  // ── PLUTÓN · generacional ───────────────────────────────────────────────
  pluton: {
    aries: "Tu generación transformó por la fuerza y la iniciativa. Lo tuyo propio es la casa donde ese poder se juega en tu vida.",
    tauro: "Tu generación transforma la relación con los recursos y la tierra. Lo tuyo propio es la casa donde eso te toca.",
    geminis: "Tu generación transformó la comunicación y el pensamiento. Lo tuyo propio es la casa donde eso actúa.",
    cancer: "Tu generación removió la familia y la pertenencia desde la raíz. Lo tuyo propio es la casa donde se remueve.",
    leo: "Tu generación transformó la idea de individuo y de poder personal. Lo tuyo propio es la casa donde eso aparece.",
    virgo: "Tu generación transformó el trabajo, la salud y lo cotidiano. Lo tuyo propio es la casa donde se concreta.",
    libra: "Tu generación transformó las relaciones y la idea de igualdad. Lo tuyo propio es la casa donde eso se juega.",
    escorpio: "Es su propio signo: tu generación lleva una intensidad regeneradora especialmente marcada. Lo tuyo propio es la casa donde se expresa.",
    sagitario: "Tu generación transforma creencias y fronteras. Lo tuyo propio es la casa donde esa transformación ocurre.",
    capricornio: "Tu generación derriba y rehace las estructuras del poder. Lo tuyo propio es la casa donde eso te alcanza.",
    acuario: "Tu generación transforma lo colectivo y la tecnología desde el fondo. Lo tuyo propio es la casa donde se manifiesta.",
    piscis: "Tu generación transforma lo espiritual y lo invisible. Lo tuyo propio es la casa donde eso pasa por ti.",
  },
}

/** Los tres que describen a una generación entera, no a una persona. */
export const GENERACIONALES: PlanetaId[] = ["urano", "neptuno", "pluton"]

/** El texto de un planeta en un signo, o `null` si no lo hay. */
export function textoEnSigno(planeta: PlanetaId, signo: SignoId): string | null {
  return PLANETA_EN_SIGNO[planeta]?.[signo] ?? null
}
