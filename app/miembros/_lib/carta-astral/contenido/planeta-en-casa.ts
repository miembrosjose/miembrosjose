// ═══════════════════════════════════════════════════════════════════════════
//  CADA PLANETA EN CADA CASA · los 120 textos
// ═══════════════════════════════════════════════════════════════════════════
//
// «Venus en la casa 2» era la pregunta: de qué me sirve saberlo. Esto es la
// respuesta, ciento veinte veces.
//
// ── CÓMO ESTÁN ESCRITOS, Y POR QUÉ ASÍ ────────────────────────────────────
// Tres reglas, las mismas que en los textos de Cartografía Estelar:
//
//   1. SE DESCRIBE, NO SE PREDICE. «Tiendes a» y no «te pasará». Nadie puede
//      saber qué va a pasarle a nadie, y escribirlo como si sí es el motivo
//      de que mucha gente seria no se acerque a esto.
//
//   2. SE PUEDE RECONOCER O NO. Cada texto apunta a una conducta observable.
//      Si alguien lee el suyo y no se reconoce, debe poder decir «esto no soy
//      yo». Un texto tan vago que le vale a todo el mundo no dice nada.
//
//   3. CADA POSICIÓN DA Y QUITA. No hay casas buenas ni planetas malos. Lo
//      que facilita algo cuesta en otra parte, y eso se dice en la misma
//      frase.
//
// ── DE DÓNDE SALE ─────────────────────────────────────────────────────────
// Escrito para Los 144.000. No viene de ningún libro ni de ninguna librería:
// lo que hay publicado con interpretaciones está con derechos, y lo único
// libre son textos británicos de 1900 que además son fatalistas. Esto se
// escribió para no tener que elegir entre pagar y sonar a almanaque.

import type { PlanetaId } from "./vocabulario"

export const PLANETA_EN_CASA: Record<PlanetaId, Record<number, string>> = {
  // ── SOL ─────────────────────────────────────────────────────────────────
  sol: {
    1: "Te vuelves visible sin proponértelo: la presencia llega antes que las palabras. Da seguridad para entrar en cualquier sitio y dificulta pasar desapercibido cuando conviene. Se observa en que la gente te recuerda de reuniones en las que apenas hablaste.",
    2: "Construyes identidad a través de lo que posees y de lo que sabes hacer. Tiendes a medirte por lo que produces, lo que da una relación muy seria con el dinero y el riesgo de confundir tu valor con tu saldo.",
    3: "Te defines hablando, preguntando, explicando. La curiosidad es el motor y la palabra el instrumento. Da facilidad enorme para conectar con cualquiera, y una tendencia a dispersarte entre muchos temas sin terminar ninguno.",
    4: "Lo importante pasa en casa. La familia, el origen y el espacio propio son el eje de tu vida aunque por fuera parezca otra cosa. Da raíces firmes y dificulta salir cuando hay que salir.",
    5: "Necesitas crear algo que lleve tu nombre: una obra, un hijo, un proyecto. El disfrute no es un adorno, es una necesidad. Da magnetismo y capacidad de inspirar, y pide reconocimiento más de lo que te gustaría admitir.",
    6: "Te realizas en el oficio bien hecho, no en el aplauso. La rutina te ordena y el servicio te da sentido. Da una fiabilidad que todo el mundo aprovecha, y el riesgo de desaparecer dentro de la tarea.",
    7: "Te conoces a través de los demás. Las relaciones no son un capítulo de tu vida, son el escenario donde se decide. Da un talento real para el trato y la dificultad de saber qué quieres cuando no hay nadie delante.",
    8: "Lo tuyo son los procesos de fondo: lo que se termina, lo que se comparte, lo que nadie cuenta. Da una capacidad poco común para acompañar a otros en sus crisis, y una vida con más transformaciones de las que pediste.",
    9: "Te mueve entender. Los estudios, los viajes largos o una convicción fuerte marcan el rumbo. Da amplitud y capacidad de enseñar, y una impaciencia con lo cotidiano que puede dejar cosas sin atender en casa.",
    10: "Tu vida se juega a la vista. La profesión y el lugar que ocupas no son un medio para vivir, son parte de quién eres. Da ambición y constancia, y la dificultad de separar lo que haces de lo que vales.",
    11: "Te encuentras en el grupo: los amigos, la causa, la gente que va en tu dirección. Da capacidad de convocar y de sostener proyectos largos, y a veces una identidad tan mezclada con la del grupo que cuesta saber dónde acabas tú.",
    12: "Lo esencial ocurre fuera de la vista. Necesitas retiro, silencio y tiempo sin testigos para saber quién eres. Da una vida interior profunda y la dificultad de reclamar tu sitio cuando te corresponde.",
  },

  // ── LUNA ────────────────────────────────────────────────────────────────
  luna: {
    1: "Lo que sientes se te ve en la cara. Das una impresión cercana y cambiante, y el ánimo del día modifica cómo te perciben. Cuesta sostener una fachada cuando por dentro hay otra cosa.",
    2: "Necesitas seguridad material para estar en calma. Lo tangible te tranquiliza: la despensa llena, la cuenta con fondo, lo que se puede tocar. En desequilibrio, se compra para apaciguar algo que no era hambre.",
    3: "Piensas con el ánimo puesto. Las conversaciones te alimentan y los silencios te inquietan. Tienes memoria para lo que la gente dijo y para el tono en que lo dijo, que no siempre coincide con lo que quisieron decir.",
    4: "La casa es el centro de todo. Sin un sitio propio donde recogerte, nada funciona del todo. Da un instinto notable para cuidar y una dependencia del nido que puede retrasar salidas necesarias.",
    5: "El afecto te hace falta expresado, no supuesto. Juegas, creas y te enamoras con el cuerpo entero. Da calidez y espontaneidad, y una sensibilidad grande al desaire cuando no llega respuesta.",
    6: "Te calma el orden y la tarea concreta. Una lista hecha baja la ansiedad mejor que un consejo. El cuerpo avisa pronto de lo emocional: lo que no se dice se nota en el estómago o en el sueño.",
    7: "Necesitas a alguien enfrente para encontrarte. Sintonizas rápido con el estado de ánimo del otro, lo que te hace buena compañía y te deja sin saber si eso que sientes es tuyo o prestado.",
    8: "Vives lo íntimo con intensidad y sin medias tintas. Hay pocas superficies en tu vida afectiva. Da una percepción muy fina de lo que el otro esconde, y una dificultad para soltar cuando algo acaba.",
    9: "Te asientas cuando algo tiene sentido. Una creencia, un maestro o un lugar lejano pueden sentirse más casa que la casa. Da ánimo expansivo y una inquietud que vuelve cada cierto tiempo.",
    10: "Tu vida privada y tu vida pública no están separadas: lo que pasa en una se nota en la otra. Hay una necesidad real de ser reconocido por lo que haces, y una sensibilidad particular al juicio ajeno.",
    11: "El grupo es tu familia elegida. Entre los tuyos bajas la guardia como no la bajas en ningún sitio. Da una lealtad poco común, y el riesgo de poner al grupo por delante de lo que tú necesitas.",
    12: "Hay una parte de tu vida emocional que no sale a la superficie ni contigo mismo. Necesitas soledad como se necesita dormir. Da compasión y percepción, y una tendencia a tragar en vez de decir.",
  },

  // ── MERCURIO ────────────────────────────────────────────────────────────
  mercurio: {
    1: "Piensas en voz alta y te presentas con palabras. Reaccionas rápido, preguntas mucho y la gente te identifica con lo que dices. Da agilidad y a veces una respuesta antes de haber escuchado el final.",
    2: "La cabeza va al asunto práctico: cuánto cuesta, cómo se sostiene, qué rinde. Da buen criterio con el dinero y las decisiones concretas, y una dificultad para entusiasmarte con lo que no tiene uso claro.",
    3: "Es su terreno propio. Aprendes de todo, escribes fácil, preguntas sin vergüenza y conectas ideas que no se parecían. El riesgo es la dispersión: muchas puertas abiertas y pocas habitaciones recorridas.",
    4: "Piensas desde la memoria y desde lo familiar. Las conversaciones importantes pasan en casa, y lo que se habló en la infancia sigue ordenando cómo razonas hoy, incluso cuando ya no estás de acuerdo.",
    5: "La mente se te enciende jugando. Enseñas explicando con ejemplos, aprendes haciendo y se te da contar historias. Cuesta más el estudio árido que no tiene nada de divertido.",
    6: "Analizas lo que otros pasan por alto. Ves el detalle, el fallo, la mejora posible. Da una competencia enorme en el oficio, y una cabeza que a veces no para y pasa factura en el cuerpo.",
    7: "Piensas mejor con alguien enfrente. Necesitas contrastar para saber qué opinas. Da talento para negociar y entender al otro, y la costumbre de adoptar su argumento sin notarlo.",
    8: "Te interesa lo que está debajo. Investigas, indagas, no te conformas con la versión oficial. Da capacidad para los temas que a otros incomodan, y una tendencia a darle vueltas a lo que ya no tiene vuelta.",
    9: "La mente necesita horizonte: filosofía, idiomas, viajes, el porqué detrás del qué. Da capacidad de enseñar y de ver el conjunto, y a veces una teoría muy bien armada sobre algo que no se ha comprobado.",
    10: "Piensas en términos de objetivo y de estrategia. Se te escucha en lo profesional y tu palabra tiene peso público. Cuesta hablar sin calcular el efecto, incluso cuando no hace falta.",
    11: "Las ideas te llegan y se te ocurren en grupo. Piensas en redes, en sistemas, en lo que serviría a muchos. Da visión de futuro y una impaciencia con lo que solo sirve para uno.",
    12: "Hay pensamientos que no sueltas y una parte del razonamiento que trabaja sola, en segundo plano. Las mejores ideas llegan en silencio o medio dormido. Cuesta poner en palabras lo que sí sabes.",
  },

  // ── VENUS ───────────────────────────────────────────────────────────────
  venus: {
    1: "Agradas antes de hacer nada. Hay un cuidado natural de la forma, el trato y el aspecto. Da puertas abiertas, y la costumbre de suavizar para gustar incluso cuando convendría ser tajante.",
    2: "Lo que valoras y lo que posees están muy unidos. Disfrutas de lo bueno, sabes rodearte de cosas que duran y tiendes a asociar afecto con cuidado material. El riesgo es confundir lo que se quiere con lo que se compra, o medir el cariño en lo que se gasta.",
    3: "Hablas bonito y conciliando. Sirves para mediar, escribir y poner en palabras lo que otros no saben decir. Cuesta sostener un desacuerdo abierto con alguien cercano.",
    4: "El afecto se vive en casa, puertas adentro. Cuidas el espacio y a los tuyos, y necesitas que el hogar sea agradable para estar bien. Puede costar salir de un vínculo familiar que ya no nutre.",
    5: "Querer y crear son lo mismo. El enamoramiento, el arte y el juego te resultan naturales. Da encanto y capacidad de disfrutar, y una tendencia a buscar el momento alto más que el vínculo sostenido.",
    6: "El cariño lo demuestras haciendo: te ocupas, resuelves, estás. El trabajo tiene que tener algo de belleza o de sentido para que lo aguantes. Cuesta recibir sin sentir que debes algo.",
    7: "El vínculo de tú a tú es donde todo se juega. Hay talento real para la pareja y la sociedad, y una necesidad de acuerdo tan fuerte que puedes ceder lo tuyo por no romper la armonía.",
    8: "El afecto es profundo o no es. Buscas intimidad sin reservas y te incomoda lo superficial. Da una capacidad poco común para acompañar lo difícil, y asuntos de dinero compartido que piden claridad.",
    9: "Te atrae lo distinto: otra cultura, otro idioma, otra forma de ver. El amor y el aprendizaje van del brazo. Da apertura, y cierta dificultad con lo que se vuelve rutinario.",
    10: "Lo que te gusta y lo que haces para vivir tienden a juntarse. Caes bien en lo profesional y eso abre caminos. El riesgo es que la imagen pública pese más que el gusto propio.",
    11: "El afecto se reparte entre muchos: amigos, grupo, causa. Das compañía y recibes lealtad. Puede costar la exclusividad de uno a uno cuando siempre hay gente alrededor.",
    12: "Hay una parte del querer que guardas. Amores discretos, afectos no dichos, una sensibilidad estética que no enseñas. Da una ternura silenciosa, y el riesgo de idealizar a quien no está del todo disponible.",
  },

  // ── MARTE ───────────────────────────────────────────────────────────────
  marte: {
    1: "Arrancas rápido y se te nota. Hay empuje físico, iniciativa y poca paciencia con los preámbulos. Da capacidad para abrir camino, y choques que podrían haberse evitado esperando un minuto.",
    2: "Peleas por lo tuyo y por lo que vale. Hay energía para generar recursos y una defensa firme de lo propio. El dinero puede ser terreno de conflicto, y las decisiones de gasto, impulsivas.",
    3: "Discutes bien y con gusto. La palabra es tu arma y la usas afilada. Da capacidad de defender una idea, y conflictos con hermanos, vecinos o en el día a día por un tono más duro del que pretendías.",
    4: "La fuerza se gasta en casa. Hay empuje para construir un hogar y también tensiones familiares que vienen de lejos. Lo que no se pelea fuera se pelea dentro.",
    5: "Creas, compites y deseas con intensidad. Da iniciativa en lo amoroso y en lo creativo, valentía para exponerte. Puedes convertir en competencia lo que era un juego.",
    6: "La energía se vuelca en el trabajo diario. Rindes mucho y te exiges más. Da una capacidad de ejecución notable, y un cuerpo que paga la factura cuando no se para a tiempo.",
    7: "El otro te activa. Hay pasión en los vínculos y también enfrentamiento: atraes gente con carácter o lo sacas en quien no lo tenía. Da franqueza, y discusiones que llegan antes que el acuerdo.",
    8: "Intensidad en lo íntimo y resistencia en la crisis. No te asusta lo que a otros les da miedo mirar. Puede haber lucha por el control en lo compartido, y una dificultad para soltar una batalla.",
    9: "Defiendes lo que crees con convicción. Hay empuje para viajar, estudiar y lanzarte a lo desconocido. El riesgo es imponer la propia verdad como si fuera la única.",
    10: "Ambición que se nota y se ejerce. Hay capacidad de liderar y de abrirse paso en lo profesional. También enfrentamientos con la autoridad, o con quien te la recuerda.",
    11: "Mueves al grupo. Tomas la iniciativa en lo colectivo y defiendes la causa con energía. Puede haber choques dentro del equipo cuando el ritmo tuyo no es el de todos.",
    12: "La fuerza trabaja por debajo. Cuesta reconocer la propia rabia y por eso a veces sale tarde o torcida. Da una resistencia silenciosa enorme, y hace falta un sitio donde descargar sin testigos.",
  },

  // ── JÚPITER ─────────────────────────────────────────────────────────────
  jupiter: {
    1: "Se te asocia con la confianza y la buena disposición. Caes bien y la gente espera cosas de ti. El exceso es prometer más de lo que cabe en una agenda, y una tendencia a crecer también de cuerpo.",
    2: "Los recursos llegan y se gastan con la misma facilidad. Hay generosidad y una confianza grande en que no faltará. El exceso es el gasto hecho sin mirar y la sobreestimación de lo que entra.",
    3: "Aprendes rápido y con ganas, hablas con amplitud, abres conversación con cualquiera. El exceso es exagerar al contar y abarcar más temas de los que se pueden sostener.",
    4: "La casa es grande, literal o no: familia extensa, puertas abiertas, mesa larga. Hay apoyo del origen. El exceso es acomodarse en lo familiar y no terminar de irse.",
    5: "Disfrute abundante: crear, jugar, querer, enseñar. Da un talento natural con los niños y con el público. El exceso es el riesgo tomado a la ligera y la búsqueda constante del momento alto.",
    6: "El trabajo crece y el oficio se amplía solo. Hay oportunidades en lo cotidiano y buena disposición ante la tarea. El exceso es cargar con más de lo que el día tiene horas, y descuidar el cuerpo por confianza.",
    7: "Los vínculos aportan y abren mundo. Buen socio, buena pareja, gente que suma. El exceso es esperar demasiado del otro, o dar un margen que no siempre se devuelve.",
    8: "Lo compartido se mueve: dinero de otros, herencias, sociedades. Hay capacidad de atravesar crisis con una fe que a otros les falta. El exceso es asumir riesgos con recursos que no son propios.",
    9: "Es su terreno. Estudios, viajes, creencias, maestros: la vida se amplía por ahí. Da sentido y generosidad intelectual. El exceso es el dogmatismo con buena intención, que sigue siendo dogmatismo.",
    10: "La carrera crece y se reconoce. Hay autoridad natural y oportunidades que llegan por confianza ajena. El exceso es asumir cargos mayores de lo sostenible y prometer resultados en público.",
    11: "El grupo te abre puertas y tú se las abres a otros. Amistades que aportan de verdad y proyectos colectivos con futuro. El exceso es un círculo tan ancho que ninguno es hondo.",
    12: "La ayuda llega por caminos que no se ven, y tú la das sin contarlo. Hay una fe que sostiene en lo difícil. El exceso es la huida hacia lo espiritual cuando lo que toca es concreto.",
  },

  // ── SATURNO ─────────────────────────────────────────────────────────────
  saturno: {
    1: "Te tomas en serio desde joven y se te nota en el porte. Cuesta mostrarse ligero y hay una timidez de fondo que se lee como distancia. Lo que se construye aquí es una presencia que con los años pesa de verdad.",
    2: "La seguridad material se gana despacio y se cuida mucho. Hay un miedo de fondo a que falte, incluso cuando no falta. Lo que se construye es una solvencia real, hecha de constancia y no de suerte.",
    3: "Hablas poco y medido. Aprender costó más que a otros, y eso dejó un rigor que ahora es ventaja. Lo que se construye es una palabra que, cuando llega, nadie discute.",
    4: "El origen pesó: responsabilidad temprana, poco espacio para ser niño, o una ausencia que ordenó todo. Lo que se construye es una casa propia de verdad, levantada y no heredada.",
    5: "Cuesta soltarse: jugar, crear y mostrarse piden un permiso que no se da fácil. Lo que se construye es una obra seria, hecha con oficio, que dura más que la de quien lo tuvo fácil.",
    6: "El trabajo diario es exigente y el cuerpo pide disciplina. Hay tendencia a cargar con lo que nadie quiere. Lo que se construye es una competencia que convierte en imprescindible a quien la tiene.",
    7: "Los vínculos se toman en serio y llegan con responsabilidad, a veces tarde o con alguien mayor. Hay miedo a comprometerse y también una lealtad que no se rompe. Lo que se construye son relaciones largas.",
    8: "Lo compartido pide cuentas claras: deudas, herencias, acuerdos. Las crisis se atraviesan sin dramatismo y con una resistencia poco común. Lo que se construye es una madurez ganada en lo difícil.",
    9: "Las creencias no se adoptan, se examinan. Costó encontrar algo en qué creer y por eso lo que se cree está probado. Lo que se construye es un criterio propio que no se compra hecho.",
    10: "La carrera es lenta y cuesta arriba, y el reconocimiento llega después de los treinta y tantos. Hay una exigencia interior que no afloja. Lo que se construye es una autoridad que nadie puede retirarte.",
    11: "Pocos amigos y escogidos. Cuesta entrar en los grupos y, una vez dentro, se asume responsabilidad. Lo que se construye son lealtades de décadas y proyectos colectivos que sobreviven.",
    12: "Hay un peso que no se ve y que cuesta nombrar: soledad, culpa, una exigencia heredada. El trabajo es interior y nadie lo aplaude. Lo que se construye es una paz que no depende de nada de fuera.",
  },

  // ── URANO ───────────────────────────────────────────────────────────────
  urano: {
    1: "Hay algo tuyo que no encaja en el molde y se nota a la primera. Independencia desde joven y una resistencia a que te clasifiquen. Cuesta sostener una imagen estable, y tampoco la quieres.",
    2: "Los ingresos van a saltos y los valores propios no son los heredados. Capacidad de ganarse la vida de formas poco convencionales, y poca tolerancia a atarse por dinero.",
    3: "Mente rápida y fuera de carril: las ideas llegan de golpe y no siempre en orden. Aprendizaje a tu manera, mal avenido con el aula. Puede haber impaciencia con quien va despacio.",
    4: "La casa no fue estable: mudanzas, cambios, una familia poco común o una ruptura con el origen. Necesitas libertad dentro del hogar, lo que a otros les parece frialdad.",
    5: "Creas de forma original y amas sin manual. Hay atracción por lo inesperado y rechazo a la convención en lo afectivo. Lo que empieza con chispa puede costar sostenerlo.",
    6: "La rutina te asfixia. Necesitas trabajo con margen, horarios propios o un oficio poco ortodoxo. El cuerpo reacciona a la tensión de forma repentina más que progresiva.",
    7: "Los vínculos piden espacio. Atraes gente libre o poco convencional, y lo que no soportas es la asfixia. Puede haber encuentros y rupturas bruscas, y relaciones que funcionan sin el formato de siempre.",
    8: "Lo íntimo y lo compartido se viven sin seguir el guion. Hay lucidez para ver lo que otros no quieren mirar, y cambios de fondo que llegan sin aviso y reordenan todo.",
    9: "Las creencias se rompen y se rehacen. Nada de fe heredada: lo que se cree se ha puesto a prueba. Atracción por lo lejano y por las ideas que incomodan.",
    10: "La trayectoria no es lineal: giros, oficios que no existían, independencia antes que escalafón. Mala relación con la autoridad que no se ha ganado el puesto.",
    11: "Es su terreno. Visión de futuro, grupos poco convencionales, causas que van por delante. Aportas al colectivo lo que nadie había pensado, y te vas cuando el grupo se acomoda.",
    12: "Hay una libertad interior que no se enseña y rupturas que ocurren en silencio. Intuiciones que llegan de golpe. Cuesta explicar por qué, de pronto, algo tuvo que cambiar.",
  },

  // ── NEPTUNO ─────────────────────────────────────────────────────────────
  neptuno: {
    1: "Das una impresión difusa: cada uno ve en ti algo distinto. Hay sensibilidad y una capacidad camaleónica para adaptarte al ambiente. Cuesta tener contornos propios y que no te usen de pantalla.",
    2: "La relación con el dinero es poco nítida: entra y sale sin que esté claro cómo. Generosidad real y una dificultad con los números. Conviene mirar las cuentas más de lo que apetece.",
    3: "Piensas en imágenes más que en argumentos. Intuición en lo cotidiano y una memoria selectiva. Da talento poético y confusiones en los recados y los acuerdos de palabra.",
    4: "El origen tiene zonas borrosas: una historia familiar con silencios, idealizada o difícil de reconstruir. Necesidad de un hogar que sea refugio de verdad.",
    5: "La creatividad es un canal abierto: arte, música, imaginación. En el amor se idealiza, y a veces se quiere a alguien que no es exactamente quien está delante.",
    6: "El cuerpo es sensible y responde a lo emocional antes que a lo físico. Los síntomas pueden ser difusos y costar de diagnosticar. En el trabajo, vocación de servicio y poca defensa de los propios límites.",
    7: "Idealizas al otro y te entregas sin reservas. Capacidad grande de compasión en el vínculo, y riesgo de ver a la pareja como quisieras que fuera en vez de como es.",
    8: "Percepción muy fina de lo que no se dice. Atracción por lo invisible y por los procesos de transformación. En lo compartido conviene la letra clara: aquí se presta y se olvida.",
    9: "La fe es un territorio natural, con el riesgo de abrazarla sin examen. Atracción por lo místico, lo lejano y lo que no se demuestra. Las mejores comprensiones no llegan razonando.",
    10: "La vocación tiene algo de llamada más que de carrera. La imagen pública es difusa o se presta a malentendidos. Funciona bien en oficios de arte, cuidado o espiritualidad.",
    11: "Te mueven las causas y los ideales colectivos. Capacidad de soñar con otros. Riesgo de poner demasiado en un grupo que no devuelve lo mismo.",
    12: "Es su terreno. Vida interior ancha, intuición, necesidad real de silencio y de retiro. Hay compasión genuina, y también una tendencia a evadirse cuando lo de fuera aprieta.",
  },

  // ── PLUTÓN ──────────────────────────────────────────────────────────────
  pluton: {
    1: "Hay una intensidad que se percibe sin que digas nada: la gente reacciona fuerte a ti, a favor o en contra. Capacidad de reinventarte por completo más de una vez en la vida.",
    2: "La relación con los recursos es intensa: o mucho o nada, con ciclos de pérdida y recuperación. Debajo hay una pregunta profunda sobre el propio valor, que el dinero no responde.",
    3: "Hablas para llegar al fondo o no hablas. Palabra con poder, capacidad de investigar y de incomodar. Puede haber un tema con hermanos o con el entorno cercano que marcó.",
    4: "El origen tiene peso y secreto. Hay algo en la familia que se transformó o que se calló, y tú lo llevas. El trabajo es sanar la raíz, y hacerlo cambia todo lo demás.",
    5: "Creas con intensidad y amas con todo. Lo que sale de ti tiene fuerza y remueve. Puede haber control en lo afectivo o en la relación con los hijos, y ahí está el trabajo.",
    6: "El trabajo diario te transforma, o te consume si no lo miras. Capacidad para oficios que tocan lo difícil. El cuerpo expresa con claridad lo que la cabeza niega.",
    7: "Los vínculos son intensos y transformadores: te cambian. Puede haber lucha de poder, dependencia o relaciones que terminan y te dejan siendo otra persona.",
    8: "Es su terreno. Profundidad, resistencia y una capacidad poco común para acompañar lo que a otros les da miedo. Las crisis no te hunden: te reorganizan.",
    9: "Las creencias se derrumban y se reconstruyen desde el cimiento. Búsqueda de una verdad que no sea prestada. Riesgo de convertir la propia convicción en algo que se impone.",
    10: "Hay una vocación de peso y una relación intensa con el poder: ejercerlo, resistirlo o ambas. La trayectoria incluye al menos un derrumbe y una reconstrucción.",
    11: "Capacidad de transformar un grupo desde dentro. Amistades intensas y una cierta tendencia a los ciclos: el círculo se renueva por completo cada tanto.",
    12: "Lo más profundo trabaja a oscuras. Hay fuerza interior enorme y material antiguo que pide mirarse. Lo que se transforma aquí no se ve desde fuera y lo cambia todo desde dentro.",
  },
}

/**
 * El texto de un planeta en una casa.
 *
 * Devuelve `null` si no lo hay, en vez de una cadena vacía: la pantalla debe
 * poder distinguir «no hay texto» de «el texto está en blanco», y no pintar
 * un hueco sin explicación.
 */
export function textoEnCasa(planeta: PlanetaId, casa: number): string | null {
  return PLANETA_EN_CASA[planeta]?.[casa] ?? null
}
