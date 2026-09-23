// CARTOGRAFÍA ESTELAR 144 — portales 11 a 20.
//
// CAPA B, salvo `astronomia`. Esencias creadas desde cero a partir del nombre,
// el tipo de objeto y metáforas humanas observables. No proceden de ninguna
// tradición astrológica ni de tabla comercial alguna.
//
// Nota sobre Perseo: Algol arrastra siglos de mala fama en la astrología
// tradicional. Aquí no se hereda ese juicio. Ningún portal es favorable ni
// desfavorable.

import type { ContenidoPortal } from "../tipos"

export const PORTALES_RESTO_1: Record<string, ContenidoPortal> = {
  aldebaran: {
    id: "aldebaran",
    estado: "reviewed",
    astronomia:
      "Aldebarán es una estrella gigante anaranjada en dirección a la constelación de Tauro, a unos 65 años luz. Visualmente aparece dentro del cúmulo de las Híades, pero no forma parte de él: está a menos de la mitad de distancia y solo coincide en la línea de visión. Ain, en cambio, sí es una estrella del cúmulo.",
    esencia: "integridad · dirección · lo que se elige sostener",
    fraseUmbral: "Lo que haces cuando nadie comprueba es lo que realmente sostienes.",
    arquetipo:
      "La coherencia entre lo que se dice y lo que se hace. Donde este portal aparece marcado suele haber una exigencia de integridad que no viene de una norma externa sino de una incomodidad propia: cuando la conducta cotidiana no coincide con lo declarado, algo no deja estar tranquilo. Eso produce una fiabilidad real, de la que otros se sostienen sin decirlo. También produce rigidez: la misma exigencia aplicada sin matiz convierte cualquier inconsistencia en un asunto de carácter, y deja poco margen para cambiar de opinión sin sentir que se traiciona algo.",
    nucleo: "Sostener en los hechos lo que se declara, sin que la coherencia se vuelva incapacidad de cambiar.",
    potenciales: [
      "Ser alguien en cuya palabra se puede construir.",
      "Sostener un compromiso cuando dejó de ser cómodo.",
      "Detectar rápido la distancia entre lo que alguien dice y lo que hace.",
      "Rectificar en público sin que eso cueste autoridad.",
    ],
    tensiones: [
      "Convertir cualquier inconsistencia ajena en un juicio sobre la persona.",
      "Sostener una posición por coherencia mucho después de dejar de creerla.",
      "Exigirse una rectitud que no se concede a nadie más.",
      "Confundir firmeza con no poder revisar.",
    ],
    cuandoIntegrado: [
      "Se cambia de opinión y se dice, sin vivirlo como una caída.",
      "Se distingue entre una incoherencia puntual y una falta de fondo.",
      "La exigencia propia deja de traducirse en exigencia sobre otros.",
    ],
    cuandoSobrecargado: [
      "Se recuerda una promesa ajena con más precisión de la que la situación merece.",
      "Se sostiene un compromiso que ya hace daño, por no querer ser alguien que se echa atrás.",
      "Se evita comprometerse a nada, para no tener que sostenerlo todo.",
    ],
    patronesCotidianos: [
      "Que te moleste desproporcionadamente que alguien llegue tarde sin avisar.",
      "Cumplir algo que prometiste aunque ya no le importe a nadie.",
      "Revisar mentalmente si lo que dijiste ayer era exacto.",
      "Que te pidan que medies porque confían en que no tomarás partido.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo funciona como un contrato. Lo que falta no suele ser rigor, sino permiso para revisarlo.",
      vinculos: "En los vínculos la fiabilidad es el gran aporte, y la exigencia el gran coste. El otro puede sentirse evaluado sin que nadie lo haya dicho.",
      grupo: "En grupo se ocupa el lugar de quien no se desdice. Es valioso, y convierte en escándalo cualquier cambio de posición propio.",
      servicio: "La aportación natural es dar algo sobre lo que otros pueden apoyarse. El límite es que apoyarse no se convierta en no moverse.",
    },
    aprendizajeCentral: "Que la coherencia se mide en la dirección, no en la ausencia de cambios.",
    paradoja: "La firmeza que hace fiable a alguien es la que le impide corregirse a tiempo.",
    preguntaUmbral: "¿Estás viviendo de una manera coherente con aquello que dices que es importante para ti?",
    preguntas: [
      "¿Qué sostienes por no querer ser alguien que abandona?",
      "¿Qué opinión has dejado de revisar por haberla defendido demasiado?",
      "¿Qué le exiges a otros que no les has dicho que les exiges?",
      "¿Qué harías distinto si nadie recordara lo que dijiste el año pasado?",
    ],
    journalPrompts: [
      "Escribe tres cosas que dices que son importantes para ti. Al lado, qué hiciste esta semana sobre cada una.",
      "Describe un compromiso que mantienes y ya no quieres.",
      "¿Cuándo fue la última vez que cambiaste de opinión en voz alta?",
    ],
    practicaBase: {
      titulo: "Declarado y hecho",
      pasos: [
        "Escribe tres cosas que consideras importantes en tu vida.",
        "Durante siete días, anota cada noche qué hiciste ese día sobre cada una. Si no hiciste nada, escribe nada.",
        "No cambies tu agenda para mejorar el registro.",
        "Anota también el tiempo aproximado dedicado a cada una.",
      ],
      cierre: "Al final, compara las tres listas. El desajuste entre lo declarado y el tiempo real es el dato.",
    },
    framework144: {
      fisico: "Observa qué hace tu cuerpo cuando haces algo que no cuadra con lo que dices creer.",
      mental: "Observa con cuánta frecuencia revisas mentalmente si fuiste exacto en algo que dijiste.",
      espiritual: "Observa si tu sentido de integridad depende de que alguien lo verifique.",
    },
  },

  fomalhaut: {
    id: "fomalhaut",
    estado: "reviewed",
    astronomia:
      "Fomalhaut es una estrella blanca en dirección a la constelación del Pez Austral, a unos 25 años luz. Destaca por encontrarse en una región del cielo pobre en estrellas brillantes, lo que la hace visible en solitario. A su alrededor se ha observado un extenso disco de polvo y escombros, material sobrante de la formación del sistema.",
    esencia: "claridad solitaria · destilación · propósito",
    fraseUmbral: "Hay claridad que solo aparece cuando no hay nadie más opinando.",
    arquetipo:
      "Lo que se decanta en soledad. Donde este portal aparece marcado suele haber una necesidad de retirarse para saber qué se piensa de verdad: en compañía la propia posición se difumina, y solo al quedarse a solas vuelve a aparecer con contorno. Eso produce una claridad poco negociada y una capacidad de ir al fondo de un asunto sin distraerse. El coste es que la soledad, repetida, puede dejar de ser un método y convertirse en un lugar: se destila tanto que se acaba con una posición muy limpia que ya no ha sido confrontada por nadie.",
    nucleo: "Retirarse lo suficiente para saber qué se piensa, sin que la retirada sustituya al contraste.",
    potenciales: [
      "Distinguir lo esencial de lo accesorio cuando otros ven todo del mismo tamaño.",
      "Sostener una conclusión impopular si se ha llegado a ella con cuidado.",
      "Trabajar largos periodos sin necesitar compañía ni estímulo externo.",
      "Reducir algo complejo a lo que realmente importa.",
    ],
    tensiones: [
      "Que la soledad deje de ser método y se vuelva domicilio.",
      "Llegar a conclusiones muy limpias que nadie ha podido discutir.",
      "Interpretar el desacuerdo como ruido y no como información.",
      "Retirarse justo cuando la situación pedía quedarse.",
    ],
    cuandoIntegrado: [
      "Se sale de la retirada con algo concreto y se somete al contraste.",
      "Se distingue entre necesitar silencio y estar evitando a alguien.",
      "La claridad propia admite ser corregida sin derrumbarse.",
    ],
    cuandoSobrecargado: [
      "Se aplaza una conversación necesaria por preferir pensarlo a solas otra vez.",
      "Se reduce a otros a posiciones simples para no tener que escucharlas enteras.",
      "Se acumulan conclusiones que nunca llegan a ponerse a prueba.",
    ],
    patronesCotidianos: [
      "Necesitar un rato solo después de cualquier reunión larga.",
      "Pensar mejor caminando o conduciendo que hablando.",
      "Que te cueste opinar en caliente y tengas claridad tres horas después.",
      "Preferir escribir algo antes que discutirlo.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo es el terreno más fértil y también el más cerrado. Lo que falta suele ser interlocutor, no tiempo.",
      vinculos: "En los vínculos la retirada puede leerse como distancia afectiva. El trabajo está en avisar, no en dejar de retirarse.",
      grupo: "En grupo se aporta la síntesis que nadie había hecho, casi siempre con retraso respecto a la conversación.",
      servicio: "La aportación natural es reducir el ruido y dejar lo que importa. El límite es que reducir sin consultar puede dejar fuera lo que a otros les importaba.",
    },
    aprendizajeCentral: "Que una conclusión no contrastada es solo una opinión muy pulida.",
    paradoja: "El silencio que da claridad es el que impide comprobar si esa claridad sirve fuera.",
    preguntaUmbral: "¿Qué conclusión tuya no has puesto nunca a prueba con nadie?",
    preguntas: [
      "¿Qué conversación llevas aplazando por preferir pensarla a solas?",
      "¿Cuándo tu necesidad de silencio fue método y cuándo fue evitación?",
      "¿Quién puede llevarte la contraria sin que dejes de escuchar?",
      "¿Qué has destilado tanto que ya no se parece a la vida de nadie?",
    ],
    journalPrompts: [
      "Escribe una conclusión firme que tengas. Después escribe qué diría alguien que la conociera bien y no estuviera de acuerdo.",
      "Describe la última vez que te retiraste. ¿Qué evitabas y qué buscabas?",
      "¿Con quién piensas mejor en voz alta?",
    ],
    practicaBase: {
      titulo: "Someter una conclusión",
      pasos: [
        "Elige una conclusión tuya que lleves tiempo sosteniendo y que no hayas discutido con nadie.",
        "Durante los siete días, cuéntasela a tres personas distintas.",
        "Pide que te digan dónde falla, no si están de acuerdo.",
        "Anota literalmente la objeción de cada una, sin responderla en el momento.",
      ],
      cierre: "Al final lee las tres objeciones juntas. Mira si alguna coincide.",
    },
    framework144: {
      fisico: "Observa cuánto tiempo a solas necesita tu cuerpo para volver a estar disponible, y si ese tiempo ha ido creciendo.",
      mental: "Observa si tus mejores ideas aparecen en soledad o en conversación, y con qué frecuencia compruebas cada una.",
      espiritual: "Observa si tu sentido de dirección se sostiene en compañía o solo cuando estás solo.",
    },
  },

  spica: {
    id: "spica",
    estado: "reviewed",
    astronomia:
      "Spica es la estrella más brillante de la constelación de Virgo, a unos 250 años luz. Es en realidad un sistema binario muy cerrado: dos estrellas azules que se orbitan en apenas cuatro días, tan próximas que la atracción mutua las deforma. Se encuentra muy cerca de la eclíptica, por lo que la Luna y los planetas pasan con frecuencia junto a ella.",
    esencia: "precisión · oficio · fruto del trabajo fino",
    fraseUmbral: "Hay diferencias que solo nota quien ha hecho la cosa mil veces.",
    arquetipo:
      "Lo que distingue el trabajo bien hecho del trabajo terminado. Donde este portal aparece marcado suele haber una sensibilidad al detalle que no es manía sino criterio: se percibe la diferencia entre lo que está bien y lo que está casi bien, y esa diferencia importa aunque nadie más la vea. De ahí sale una competencia que se construye despacio y se nota al instante. El coste es que ese mismo criterio, sin freno, convierte cualquier trabajo en interminable, y puede hacer que se retenga algo bueno esperando a que sea impecable.",
    nucleo: "Sostener un criterio de calidad propio sin que impida terminar y entregar.",
    potenciales: [
      "Notar lo que falta cuando algo ya parece acabado.",
      "Construir una destreza real por acumulación de repeticiones.",
      "Corregir sin destruir el trabajo de otro.",
      "Hacer algo que dure porque está bien hecho por dentro.",
    ],
    tensiones: [
      "Retener algo bueno esperando a que sea impecable.",
      "Aplicar a lo irrelevante el mismo criterio que a lo importante.",
      "Ver primero el fallo y solo después el conjunto.",
      "Una autocrítica que no distingue entre un error y una identidad.",
    ],
    cuandoIntegrado: [
      "Se decide a propósito qué merece acabado fino y qué merece solo estar hecho.",
      "Se entrega algo imperfecto sabiendo que lo es.",
      "El ojo para el detalle se usa para mejorar, no para señalar.",
    ],
    cuandoSobrecargado: [
      "Se rehace algo que ya estaba bien y se pierde el plazo.",
      "Se menciona el único fallo de un trabajo que estaba muy logrado.",
      "Se evita empezar algo por anticipar que no saldrá a la altura.",
    ],
    patronesCotidianos: [
      "Ver la errata antes que el texto.",
      "Que te cueste dar por terminado algo tuyo.",
      "Notar cuando algo está mal hecho aunque no sepas explicar por qué.",
      "Rehacer una tarea doméstica que alguien ya había hecho.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo tiende a ser una revisión continua. Lo que falta no es exigencia, es proporción.",
      vinculos: "En los vínculos la precisión puede llegar como corrección permanente, aunque la intención fuera ayudar.",
      grupo: "En grupo se es quien eleva el nivel de lo que se acepta. Agota si no viene acompañado de reconocimiento de lo que sí está bien.",
      servicio: "La aportación natural es dejar cosas bien hechas que otros usarán sin saber cuánto costaron. El límite es que nadie lo va a notar, y hay que estar en paz con eso.",
    },
    aprendizajeCentral: "Que terminar es parte del oficio, y que lo entregado imperfecto enseña más que lo retenido impecable.",
    paradoja: "El criterio que hace bueno el trabajo es el que impide considerarlo bueno.",
    preguntaUmbral: "¿Qué tienes hecho y sin entregar esperando a que esté perfecto?",
    preguntas: [
      "¿Qué estás rehaciendo que ya estaba suficientemente bien?",
      "¿Dónde aplicas un criterio alto a algo que no lo merece?",
      "¿Cuándo fue la última vez que dijiste que algo tuyo estaba bien?",
      "¿Qué no has empezado por miedo a que no salga a la altura?",
    ],
    journalPrompts: [
      "Escribe algo tuyo que consideras bien hecho. Sin añadir peros.",
      "Haz una lista de lo que tienes sin terminar. Marca lo que está esperando calidad y lo que está esperando decisión.",
      "¿De quién aprendiste que las cosas tenían que estar impecables?",
    ],
    practicaBase: {
      titulo: "Entregar al ochenta por ciento",
      pasos: [
        "Elige una tarea concreta de esta semana que normalmente pulirías hasta el final.",
        "Trabájala hasta que esté bien, no impecable, y entrégala.",
        "Anota qué sentiste al entregarla y qué querías seguir arreglando.",
        "Anota después qué dijo quien la recibió, si dijo algo.",
      ],
      cierre: "Compara lo que temías que se notara con lo que alguien mencionó realmente.",
    },
    framework144: {
      fisico: "Observa la tensión física mientras revisas algo por tercera vez.",
      mental: "Observa cuánto tiempo dedicas al último cinco por ciento de una tarea frente al primer noventa.",
      espiritual: "Observa si puedes considerar valioso algo imperfecto, incluido lo tuyo.",
    },
  },

  altair: {
    id: "altair",
    estado: "reviewed",
    astronomia:
      "Altair es la estrella más brillante de la constelación del Águila, a 16.7 años luz, una de las más cercanas visibles a simple vista. Gira sobre sí misma a gran velocidad —completa una rotación en unas nueve horas frente a los veinticinco días del Sol—, lo que la deforma hasta hacerla sensiblemente más ancha por el ecuador que por los polos.",
    esencia: "agilidad · respuesta rápida · alcance corto",
    fraseUmbral: "Responder rápido y responder bien no siempre son lo mismo.",
    arquetipo:
      "Lo que reacciona antes que los demás. Donde este portal aparece marcado suele haber una velocidad de respuesta poco común: se capta la situación, se decide y se actúa mientras otros todavía están evaluando. Esa rapidez resuelve cosas que la lentitud habría perdido, y da una presencia útil en urgencias reales. El coste aparece en el terreno contrario: lo que requiere maduración se resiente, porque la misma velocidad que sirve para responder impide esperar, y hay decisiones que solo se vuelven claras después de haber estado un tiempo sin resolverse.",
    nucleo: "Responder rápido cuando hace falta, y reconocer lo que solo madura con tiempo.",
    potenciales: [
      "Actuar con acierto en situaciones donde no hay tiempo de deliberar.",
      "Captar lo esencial de una situación en pocos segundos.",
      "Improvisar una salida cuando el plan se cae.",
      "Cambiar de rumbo sin dramatizarlo.",
    ],
    tensiones: [
      "Resolver rápido algo que habría necesitado reposo.",
      "Confundir estar en marcha con estar avanzando.",
      "Impaciencia con procesos que no admiten aceleración.",
      "Responder antes de haber entendido del todo lo que se pedía.",
    ],
    cuandoIntegrado: [
      "Se distingue una urgencia real de una impaciencia propia.",
      "Se aguanta una decisión abierta cuando conviene.",
      "La rapidez se reserva para donde aporta.",
    ],
    cuandoSobrecargado: [
      "Se contesta un mensaje difícil en caliente.",
      "Se empieza algo nuevo antes de cerrar lo anterior, y se acumulan cabos.",
      "Se interpreta la calma ajena como falta de interés.",
    ],
    patronesCotidianos: [
      "Ser el primero en responder en un grupo.",
      "Terminar las frases de otros.",
      "Que te agote una reunión lenta más que una jornada intensa.",
      "Resolver en cinco minutos algo que llevaba semanas parado.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo se lleva bien con el movimiento y mal con la espera. Lo que falta suele ser tolerancia a lo no resuelto.",
      vinculos: "En los vínculos la rapidez puede atropellar. El otro necesita a veces terminar de hablar antes de recibir la solución.",
      grupo: "En grupo se desbloquea lo parado. También se decide por los demás sin haberlo pedido.",
      servicio: "La aportación natural es que las cosas se muevan. El límite es que no todo lo que se mueve va a algún sitio.",
    },
    aprendizajeCentral: "Que hay problemas que solo se resuelven dejándolos sin resolver un tiempo.",
    paradoja: "La velocidad que salva situaciones urgentes es la que impide que maduren las importantes.",
    preguntaUmbral: "¿Qué resolviste rápido que habría necesitado esperar?",
    preguntas: [
      "¿Qué decisión tomaste esta semana antes de tener toda la información?",
      "¿Dónde confundes movimiento con avance?",
      "¿Qué llevas sin terminar porque empezaste otra cosa?",
      "¿Qué pasaría si esperaras tres días antes de responder lo difícil?",
    ],
    journalPrompts: [
      "Escribe una decisión rápida que salió bien y otra que salió mal. ¿Qué las diferenciaba?",
      "Haz una lista de lo que tienes empezado. ¿Cuántas cosas hay?",
      "¿Qué te pasa por dentro cuando algo queda sin resolver?",
    ],
    practicaBase: {
      titulo: "Tres días de espera",
      pasos: [
        "Durante siete días, cada vez que quieras responder a algo que te remueve, espera tres días antes de hacerlo.",
        "Escribe la respuesta que habrías dado inmediatamente, pero no la envíes.",
        "A los tres días escribe la respuesta que darías ahora.",
        "Envía la segunda si sigue haciendo falta enviar algo.",
      ],
      cierre: "Al final compara los pares de respuestas. Mira cuántas veces la segunda era distinta y en qué.",
    },
    framework144: {
      fisico: "Observa la inquietud física cuando algo queda pendiente y no puedes actuar.",
      mental: "Observa cuánto tiempo pasa entre que entiendes una situación y que ya has decidido qué hacer.",
      espiritual: "Observa si puedes estar en un proceso sin acelerarlo.",
    },
  },

  deneb: {
    id: "deneb",
    estado: "reviewed",
    astronomia:
      "Deneb es una supergigante blanca en la constelación del Cisne y una de las estrellas más luminosas conocidas. Su distancia es incierta, estimada entre mil quinientos y dos mil seiscientos años luz: pese a estar tan lejos, figura entre las más brillantes del cielo. En la misma constelación se encuentra Albireo, una pareja de estrellas de colores contrastados visible con un telescopio pequeño.",
    esencia: "alcance · lo que llega lejos · señal a distancia",
    fraseUmbral: "Algunas cosas se notan mucho más lejos de donde se hicieron.",
    arquetipo:
      "Lo que tiene efecto a distancia. Donde este portal aparece marcado suele haber una desproporción entre el esfuerzo percibido y su alcance real: algo que se hizo sin darle importancia llega a sitios que nunca se pensaron, y personas que no se conocen reciben algo de ello. Eso da una capacidad natural de comunicar más allá del círculo inmediato. El coste es que el alcance no se ve desde dentro: se puede trabajar años sin señal de retorno, y también se puede afectar a gente sin enterarse, porque el efecto ocurre donde uno no está.",
    nucleo: "Hacer algo cuyo efecto ocurre lejos, sin saber si llega y sin dejar de responder por ello.",
    potenciales: [
      "Llegar a personas que nunca se conocerán.",
      "Sostener un trabajo sin retorno inmediato.",
      "Decir algo de manera que se pueda transportar sin que se deforme.",
      "Dejar algo que sigue funcionando cuando uno ya no está delante.",
    ],
    tensiones: [
      "Trabajar durante años sin señal, y confundir el silencio con fracaso.",
      "Afectar a gente sin enterarse, y por tanto sin poder corregir.",
      "Pensar en el alcance antes que en lo que se está haciendo.",
      "Descuidar lo cercano porque lo lejano parece más grande.",
    ],
    cuandoIntegrado: [
      "Se trabaja bien sin depender de la respuesta.",
      "Se atiende a lo cercano sabiendo que es donde se comprueba lo que se hace.",
      "Se acepta responsabilidad por un efecto que no se vio.",
    ],
    cuandoSobrecargado: [
      "Se mide el valor de lo hecho por cuánta gente lo recibió.",
      "Se descuida a quien está delante mientras se piensa en quien está lejos.",
      "Se deja de hacer algo por no saber si sirvió.",
    ],
    patronesCotidianos: [
      "Que alguien te diga que algo que dijiste hace años le cambió algo, y tú no lo recuerdes.",
      "Trabajar en algo que no verás usar.",
      "Sentir el vacío que deja terminar algo que nadie ha comentado.",
      "Que te lleguen noticias de tu trabajo por vías inesperadas.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo necesita un criterio interno de valor, porque el externo llega tarde o no llega.",
      vinculos: "En los vínculos hay que cuidar la escala corta: es la que da información real y la que se descuida primero.",
      grupo: "En grupo se aporta algo que trasciende al grupo mismo. Puede no reconocerse dentro y sí fuera.",
      servicio: "La aportación natural es alcanzar a quien no está en la sala. El límite es no dejar de atender a quien sí lo está.",
    },
    aprendizajeCentral: "Que el efecto que no se ve sigue siendo efecto, y que eso obliga tanto como el que se ve.",
    paradoja: "Lo que más lejos llega es lo que menos retorno da a quien lo hizo.",
    preguntaUmbral: "¿Qué has hecho cuyo efecto no has visto nunca?",
    preguntas: [
      "¿Qué sostienes sin ninguna señal de que sirva?",
      "¿A quién tienes cerca mientras piensas en quien está lejos?",
      "¿Qué medida usas para saber si algo tuyo valió la pena?",
      "¿Qué dirías distinto si supieras que alguien lo va a repetir sin ti delante?",
    ],
    journalPrompts: [
      "Escribe algo que hiciste y del que te enteraste después de que hubiera llegado lejos.",
      "¿Qué estás haciendo ahora sin saber si sirve? Escribe por qué sigues.",
      "¿A quién de cerca has descuidado este mes?",
    ],
    practicaBase: {
      titulo: "La escala corta",
      pasos: [
        "Durante siete días elige cada día a una persona de tu entorno inmediato.",
        "Haz con ella algo concreto y pequeño: una conversación entera sin móvil, una ayuda práctica, una pregunta real.",
        "No lo anuncies ni lo publiques.",
        "Anota cada día qué hiciste y con quién.",
      ],
      cierre: "Al final, mira si la semana se sintió distinta, y en qué.",
    },
    framework144: {
      fisico: "Observa si tu energía depende de recibir respuesta por lo que haces.",
      mental: "Observa cuánto piensas en quién recibirá algo mientras lo estás haciendo.",
      espiritual: "Observa si puedes dar algo sin necesidad de saber dónde cae.",
    },
  },

  polaris: {
    id: "polaris",
    estado: "reviewed",
    astronomia:
      "Polaris es la estrella más brillante de la Osa Menor, a unos 433 años luz. Actualmente se encuentra a menos de un grado del polo norte celeste, por lo que apenas se desplaza en el cielo durante la noche y sirve de referencia de orientación. Esa posición no es permanente: el eje terrestre describe un círculo de unos veintiséis mil años y otras estrellas ocuparán ese lugar.",
    esencia: "referencia · orientación · punto fijo provisional",
    fraseUmbral: "Toda referencia fija lo es durante un tiempo.",
    arquetipo:
      "Aquello por lo que alguien se orienta. Donde este portal aparece marcado suele haber una relación consciente con los propios criterios: hay algo —un principio, una persona, una decisión tomada hace años— que funciona como referencia y desde el cual se mide todo lo demás. Tener eso da una estabilidad poco común y permite decidir sin rehacer el razonamiento cada vez. El punto delicado es que las referencias se adoptan antes de examinarse y luego dejan de revisarse; y una referencia que ya no corresponde sigue orientando igual de bien, solo que hacia otro sitio.",
    nucleo: "Sostener una referencia que permita decidir, y revisarla antes de que deje de corresponder.",
    potenciales: [
      "Decidir con criterio estable en medio del ruido.",
      "Ser punto de referencia para otros en momentos confusos.",
      "Sostener una dirección durante años sin reevaluarla cada semana.",
      "Reconocer cuándo una referencia propia ha caducado.",
    ],
    tensiones: [
      "Orientar la vida entera por algo que se adoptó sin examinar.",
      "Confundir estabilidad con no haber revisado.",
      "Que otros dependan de la propia firmeza más de lo que conviene a nadie.",
      "Miedo a revisar, porque revisar la referencia desordena todo lo demás.",
    ],
    cuandoIntegrado: [
      "Se revisa la referencia sin que eso derrumbe la orientación.",
      "Se acepta ser referencia de otros sin fomentarlo.",
      "Se distingue entre un criterio propio y una costumbre heredada.",
    ],
    cuandoSobrecargado: [
      "Se responde con una convicción antigua a una situación nueva.",
      "Se sostiene el papel de persona firme cuando por dentro ya no lo es.",
      "Se evita una conversación que pondría en cuestión algo central.",
    ],
    patronesCotidianos: [
      "Que la gente te pregunte qué harías tú, y lo use.",
      "Tomar decisiones rápido porque ya sabes desde dónde las mides.",
      "Notar incomodidad cuando alguien cuestiona algo que dabas por resuelto.",
      "Repetir una frase que te dijeron hace veinte años.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo descansa en unos pocos principios. Conviene saber cuáles se eligieron y cuáles se heredaron.",
      vinculos: "En los vínculos se ofrece estabilidad. El riesgo es que el otro deje de desarrollar su propio criterio.",
      grupo: "En grupo se es el punto que no se mueve. Útil en la crisis y limitante cuando el grupo necesita cambiar.",
      servicio: "La aportación natural es dar orientación en momentos confusos. El límite es que orientar no es decidir por otro.",
    },
    aprendizajeCentral: "Que una referencia se elige, y elegirla incluye revisarla.",
    paradoja: "Lo que permite no perder el rumbo es lo que impide notar que el rumbo cambió.",
    preguntaUmbral: "¿Cuál es tu referencia, y cuándo la examinaste por última vez?",
    preguntas: [
      "¿Qué principio tuyo no has revisado nunca?",
      "¿Quién depende de tu firmeza más de lo que le conviene?",
      "¿Qué criterio heredaste y sigues usando como propio?",
      "¿Qué se desordenaría si revisaras algo central?",
    ],
    journalPrompts: [
      "Escribe los tres principios por los que decides. Al lado, de dónde salió cada uno.",
      "Describe una decisión reciente. ¿Desde qué referencia la tomaste?",
      "¿Qué referencia tuya ya no corresponde a tu vida actual?",
    ],
    practicaBase: {
      titulo: "El origen de la referencia",
      pasos: [
        "Escribe tres principios que usas para decidir.",
        "Durante siete días dedica un día a cada uno de los tres primeros.",
        "Ese día, escribe de dónde salió: quién te lo dio, cuándo, en qué circunstancia.",
        "Escribe también si lo elegirías hoy, sabiendo lo que sabes.",
      ],
      cierre: "Al final mira cuántos de los tres elegirías de nuevo, y qué harías con los que no.",
    },
    framework144: {
      fisico: "Observa qué pasa en tu cuerpo cuando alguien cuestiona algo que dabas por firme.",
      mental: "Observa cuántas de tus decisiones se apoyan en el mismo principio.",
      espiritual: "Observa si tu orientación de fondo se eligió o se recibió.",
    },
  },

  capella: {
    id: "capella",
    estado: "reviewed",
    astronomia:
      "Capella es la estrella más brillante de la constelación del Cochero, a unos 43 años luz. Lo que a simple vista parece una sola estrella son en realidad cuatro: dos gigantes amarillas que se orbitan muy próximas y un segundo par de enanas rojas mucho más tenues. Su nombre procede del latín y significa cabrita.",
    esencia: "sustento · cuidado práctico · lo que alimenta",
    fraseUmbral: "Alguien hace que las cosas sigan funcionando, y casi nunca se nota.",
    arquetipo:
      "Lo que sostiene la vida diaria de otros. Donde este portal aparece marcado suele haber una atención constante a lo que hace falta para que las cosas sigan en pie: quién ha comido, qué se ha quedado sin resolver, qué necesita alguien y no ha pedido. Esa atención produce entornos donde se puede vivir, y una fiabilidad que otros dan por supuesta. El coste es exactamente ese: lo que funciona bien deja de verse. Quien sostiene suele acabar sosteniendo también el hecho de que nadie lo mencione, y eso se acumula en silencio durante años.",
    nucleo: "Sostener lo cotidiano de otros sin desaparecer dentro de esa función.",
    potenciales: [
      "Crear entornos donde otros pueden funcionar sin preocuparse.",
      "Anticipar una necesidad antes de que se convierta en problema.",
      "Sostener una rutina que beneficia a varios durante años.",
      "Cuidar sin que se note, que es la forma más difícil de cuidar.",
    ],
    tensiones: [
      "Que el cuidado se vuelva invisible y después obligatorio.",
      "Resentimiento acumulado por un reconocimiento que nunca se pidió.",
      "Adelantarse tanto a las necesidades de otros que les quita margen.",
      "No saber pedir, por llevar años en el lado del que da.",
    ],
    cuandoIntegrado: [
      "Se pide lo que se necesita, con la misma claridad con que se ofrece.",
      "Se distingue entre cuidar y hacerse cargo de la vida de otro.",
      "Se deja que otro resuelva lo suyo, aunque salga peor.",
    ],
    cuandoSobrecargado: [
      "Se hace algo por alguien que podía hacerlo, y se hace en silencio.",
      "Se acumula cansancio que no se atribuye a nada concreto.",
      "Se espera que alguien note, sin decirlo, y se interpreta el silencio.",
    ],
    patronesCotidianos: [
      "Darte cuenta de que falta algo en casa antes que nadie.",
      "Que te pregunten cómo estás y responder sobre otra persona.",
      "Hacer la parte aburrida de un proyecto de grupo.",
      "Cansancio los domingos sin causa clara.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo suele quedar la última. Recuperarla empieza por atender una necesidad propia antes que una ajena, una vez al día.",
      vinculos: "En los vínculos el cuidado es la forma principal de expresar afecto, y también lo que hace difícil recibirlo.",
      grupo: "En grupo se es la infraestructura. Se nota cuando falta y no cuando está.",
      servicio: "La aportación natural es hacer posible lo que otros hacen. El límite es pedir de vez en cuando que se nombre.",
    },
    aprendizajeCentral: "Que pedir no anula lo dado, y que esperar a que lo noten es una forma de no pedir.",
    paradoja: "El cuidado mejor hecho es el que resulta invisible, y por eso quien lo hace acaba invisible también.",
    preguntaUmbral: "¿Qué necesitas que no has pedido porque deberían haberlo notado?",
    preguntas: [
      "¿A quién cuidas de más, y qué le estás quitando al hacerlo?",
      "¿Cuándo fue la última vez que pediste algo directamente?",
      "¿Qué cansancio llevas encima que no sabes de dónde sale?",
      "¿Qué pasaría si dejaras de hacer una de esas cosas invisibles?",
    ],
    journalPrompts: [
      "Haz una lista de lo que sostienes que nadie ve. Sin quejarte, solo la lista.",
      "Escribe una necesidad tuya de esta semana. ¿Se la dijiste a alguien?",
      "¿De quién aprendiste que cuidar era tu sitio?",
    ],
    practicaBase: {
      titulo: "Pedir en voz alta",
      pasos: [
        "Durante siete días, pide cada día una cosa concreta a alguien.",
        "Que sea algo real que te venga bien, no simbólico.",
        "Pídelo directamente, sin justificarlo y sin ofrecer nada a cambio.",
        "Anota qué pediste, a quién y qué pasó.",
      ],
      cierre: "Al final mira cuántas veces te costó más pedir que hacerlo tú, y qué dice eso.",
    },
    framework144: {
      fisico: "Observa si atiendes tus necesidades básicas —comer, dormir, parar— con el mismo cuidado con que atiendes las ajenas.",
      mental: "Observa cuánto de tu atención diaria está ocupada por lo que otros necesitan.",
      espiritual: "Observa si tu sentido de valor depende de ser necesario.",
    },
  },

  canopus: {
    id: "canopus",
    estado: "reviewed",
    astronomia:
      "Canopus es la segunda estrella más brillante del cielo nocturno, en la constelación de la Quilla, a unos 310 años luz. Visible sobre todo desde el hemisferio sur, ha sido durante siglos una referencia de navegación marítima, y las sondas espaciales la han utilizado como punto de calibración para orientarse fuera de la Tierra.",
    esencia: "rumbo · el segundo lugar · referencia para otros",
    fraseUmbral: "No hace falta ser el primero para servir de guía.",
    arquetipo:
      "Lo que orienta sin ocupar el centro. Donde este portal aparece marcado suele haber una capacidad de dar dirección a otros sin necesitar el puesto principal: se aconseja bien, se ve el rumbo con claridad, y no hace falta estar al mando para que eso sirva. Esa posición es cómoda y honesta, y evita muchos de los costes del protagonismo. La tensión aparece cuando el segundo lugar deja de ser elección: cuando se renuncia al puesto no por preferencia sino por evitar la exposición, y se acaba orientando a gente que hace lo que uno mismo no se permitió intentar.",
    nucleo: "Dar rumbo desde un segundo lugar elegido, no desde un segundo lugar por evitación.",
    potenciales: [
      "Aconsejar con claridad sin intereses de por medio.",
      "Sostener a alguien que está al frente sin competir.",
      "Ver el rumbo cuando quien dirige está demasiado dentro.",
      "Trabajar bien sin necesidad de firma.",
    ],
    tensiones: [
      "Elegir el segundo lugar para no exponerse.",
      "Aconsejar lo que uno no se atreve a hacer.",
      "Que la propia dirección quede sin desarrollar por atender la de otros.",
      "Resentimiento con quien ocupa el sitio que se dejó libre.",
    ],
    cuandoIntegrado: [
      "Se elige el papel a propósito, y se puede cambiar.",
      "Se hace lo que se aconseja, al menos una vez.",
      "El consejo se da sin necesidad de que se siga.",
    ],
    cuandoSobrecargado: [
      "Se invierte toda la energía en el proyecto de otro.",
      "Se critica por dentro una decisión que no se quiso tomar.",
      "Se acumulan planes propios que nunca se empiezan.",
    ],
    patronesCotidianos: [
      "Que te pidan opinión antes de decisiones importantes que no son tuyas.",
      "Ver con claridad lo que otro debería hacer con su vida.",
      "Postergar un proyecto propio mientras ayudas con el de alguien.",
      "Sentirte más cómodo apoyando que proponiendo.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo puede quedar aplazada mientras haya alguien a quien orientar. Lo que falta suele ser un proyecto propio en marcha.",
      vinculos: "En los vínculos se ofrece criterio y estabilidad. El riesgo es construir la relación entera sobre esa función.",
      grupo: "En grupo se es quien sostiene al que está al frente. Es una posición de poder real y poco reconocida.",
      servicio: "La aportación natural es dar dirección sin apropiarse del camino. El límite es no usar el camino ajeno para no recorrer el propio.",
    },
    aprendizajeCentral: "Que aconsejar bien y vivir lo aconsejado son dos cosas distintas, y la segunda es la que enseña.",
    paradoja: "Quien mejor ve el rumbo ajeno puede ser quien menos ha navegado el suyo.",
    preguntaUmbral: "¿Qué aconsejas a otros que no te has aplicado?",
    preguntas: [
      "¿Qué proyecto tuyo llevas aplazado mientras ayudas con los de otros?",
      "¿Elegiste el segundo lugar o te quedaste en él?",
      "¿A quién le has dado un consejo que tú no seguirías?",
      "¿Qué tendrías que exponer para hacer algo tuyo?",
    ],
    journalPrompts: [
      "Escribe el mejor consejo que has dado este año. ¿Te lo aplicas?",
      "Describe un proyecto tuyo parado. ¿Qué haría falta para empezarlo esta semana?",
      "¿Qué te da más miedo: fallar en lo tuyo o que se note que era tuyo?",
    ],
    practicaBase: {
      titulo: "Aplicarse el consejo",
      pasos: [
        "Escribe un consejo que hayas dado a alguien en los últimos meses y que consideres bueno.",
        "Durante siete días aplícatelo a ti, en algo concreto de tu vida.",
        "Anota cada día qué hiciste al respecto.",
        "Anota también qué resultó más difícil de lo que parecía al darlo.",
      ],
      cierre: "Al final, mira si seguirías dando ese consejo igual, y qué le añadirías.",
    },
    framework144: {
      fisico: "Observa tu energía cuando trabajas en algo tuyo frente a cuando ayudas con algo ajeno.",
      mental: "Observa cuánta claridad tienes sobre la vida de otros comparada con la tuya.",
      espiritual: "Observa si contribuir requiere para ti permanecer en segundo plano.",
    },
  },

  achernar: {
    id: "achernar",
    estado: "reviewed",
    astronomia:
      "Achernar es la estrella más brillante de la constelación de Erídano, a unos 139 años luz, visible desde el hemisferio sur. Es la estrella brillante que gira más rápido sobre sí misma de las conocidas: la fuerza centrífuga la deforma hasta hacerla más de un cincuenta por ciento más ancha por el ecuador que por los polos. Su nombre procede del árabe y significa el fin del río.",
    esencia: "desenlace · cierre · el final del recorrido",
    fraseUmbral: "Terminar algo es una habilidad distinta de empezarlo.",
    arquetipo:
      "Lo que ocurre en el final. Donde este portal aparece marcado suele haber una relación particular con los cierres: se percibe cuándo algo ha terminado antes de que sea evidente, y se sabe estar en los desenlaces sin necesidad de suavizarlos. Esa capacidad permite cerrar lo que otros arrastran durante años y ahorra mucho desgaste. La tensión aparece por dos vías opuestas y ambas frecuentes: cerrar demasiado pronto, cuando la situación solo estaba incómoda, o no cerrar nunca, porque quien ve el final con claridad puede aplazarlo indefinidamente para no ser quien lo provoque.",
    nucleo: "Reconocer cuándo algo ha terminado y sostener el cierre sin adelantarlo ni eternizarlo.",
    potenciales: [
      "Terminar limpiamente lo que ya no tiene recorrido.",
      "Estar presente en un desenlace sin necesidad de suavizarlo.",
      "Reconocer un final antes de que sea evidente para todos.",
      "Soltar sin tener que romper.",
    ],
    tensiones: [
      "Cerrar algo que solo estaba incómodo.",
      "Aplazar un final para no ser quien lo nombra.",
      "Interpretar toda dificultad como señal de que algo terminó.",
      "Quedarse con la función de cerrar lo que otros abrieron.",
    ],
    cuandoIntegrado: [
      "Se distingue un final real de una fase difícil.",
      "Se cierra diciéndolo, no desapareciendo.",
      "Se sostiene lo que sigue vivo aunque incomode.",
    ],
    cuandoSobrecargado: [
      "Se abandona algo a las primeras dificultades.",
      "Se alarga una situación acabada durante meses.",
      "Se acaba siendo quien da las malas noticias, siempre.",
    ],
    patronesCotidianos: [
      "Saber antes que nadie que una relación o un trabajo se ha terminado.",
      "Que te toque a ti decir lo que nadie quiere decir.",
      "Costarte empezar algo nuevo por saber cómo terminan las cosas.",
      "Hacer limpieza de golpe: objetos, contactos, proyectos.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo incluye una lucidez sobre los ciclos propios. Lo que falta suele ser paciencia con lo que todavía no ha terminado.",
      vinculos: "En los vínculos la claridad sobre el final puede llegar antes que la del otro, y eso deja a uno solo dentro de la relación.",
      grupo: "En grupo se es quien nombra lo acabado. Es un servicio y un desgaste, y rara vez se agradece en el momento.",
      servicio: "La aportación natural es permitir cierres limpios. El límite es no convertirse en quien siempre tiene que ejecutarlos.",
    },
    aprendizajeCentral: "Que un final bien hecho es una forma de cuidado, y que adelantarlo no lo es.",
    paradoja: "Quien mejor reconoce los finales es quien más difícil tiene empezar sin verlos ya.",
    preguntaUmbral: "¿Qué ha terminado en tu vida y todavía no has dicho en voz alta?",
    preguntas: [
      "¿Qué estás sosteniendo que ya acabó?",
      "¿Qué cerraste demasiado pronto y sigues pensando?",
      "¿Cuántas veces has sido tú quien tuvo que decirlo?",
      "¿Qué empezarías si no anticiparas el final?",
    ],
    journalPrompts: [
      "Escribe algo que ha terminado y sigues manteniendo. ¿Qué te impide cerrarlo?",
      "Describe un cierre tuyo que se hizo bien. ¿Qué lo hizo distinto?",
      "¿Qué te ocurre cuando algo empieza?",
    ],
    practicaBase: {
      titulo: "Un cierre pendiente",
      pasos: [
        "Elige una sola cosa terminada que sigas manteniendo: un objeto, una suscripción, un compromiso, una conversación sin cerrar.",
        "Durante siete días escribe cada día una frase sobre qué te impide cerrarla.",
        "El séptimo día ciérrala, diciéndolo, no desapareciendo.",
        "Anota qué pasó realmente al cerrarla.",
      ],
      cierre: "Compara las siete frases con lo que ocurrió. Casi siempre difieren.",
    },
    framework144: {
      fisico: "Observa qué hace tu cuerpo cuando algo termina: si se alivia, si se vacía, si tarda en registrarlo.",
      mental: "Observa cuánto tiempo dedicas a repasar cosas ya cerradas.",
      espiritual: "Observa si puedes considerar completo algo que terminó mal.",
    },
  },

  geminis: {
    id: "geminis",
    estado: "reviewed",
    astronomia:
      "Cástor y Pólux son las dos estrellas más brillantes de la constelación de Géminis. Pese a aparecer juntas en el cielo, no están relacionadas: Pólux es una gigante anaranjada a 34 años luz con un planeta confirmado, mientras que Cástor es un sistema de seis estrellas situado a 51. Pólux brilla más que Cástor, aunque la nomenclatura tradicional asigna la primera letra a esta última.",
    esencia: "dos a la vez · complementariedad · alternancia",
    fraseUmbral: "Hay quien funciona bien en dos registros y no acaba de creerse ninguno.",
    arquetipo:
      "Lo que existe en dos versiones. Donde este portal aparece marcado suele haber dos modos de funcionar bien diferenciados, que se alternan según el contexto y que la persona vive con cierta extrañeza: ninguno se siente del todo falso ni del todo propio. Eso da una flexibilidad real, capacidad de moverse entre mundos que no se hablan y de traducir de uno a otro. El coste es la pregunta de fondo sobre cuál es el verdadero, que en realidad está mal planteada: la alternancia no es una máscara sobre una identidad, es la forma que tiene esa identidad.",
    nucleo: "Sostener dos modos propios sin exigirse elegir cuál es el auténtico.",
    potenciales: [
      "Moverse entre ambientes que no se comunican entre sí.",
      "Traducir de un lenguaje a otro sin perder lo importante.",
      "Adaptarse sin dejar de tener criterio.",
      "Ver una situación desde dos posiciones a la vez.",
    ],
    tensiones: [
      "La sospecha de estar fingiendo en alguna de las dos versiones.",
      "Que nadie te conozca entero, porque cada uno conoce una mitad.",
      "Cansancio por sostener dos registros sin reconocerlo como esfuerzo.",
      "Decidir por agotamiento cuál se abandona.",
    ],
    cuandoIntegrado: [
      "Se reconocen los dos modos como propios y se usan a propósito.",
      "Existe al menos una persona ante la que aparecen ambos.",
      "Se deja de buscar cuál es el verdadero.",
    ],
    cuandoSobrecargado: [
      "Se evita juntar a grupos distintos de la propia vida.",
      "Se siente extrañeza al oírse hablar en uno de los dos registros.",
      "Se abandona una de las dos versiones y se echa de menos sin nombrarlo.",
    ],
    patronesCotidianos: [
      "Que te digan que en el trabajo eres otra persona.",
      "Incomodidad al mezclar amigos de ámbitos distintos.",
      "Cambiar de tono de voz sin darte cuenta según con quién hables.",
      "Tener dos intereses de fondo que no se parecen en nada.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo mejora al dejar de buscar una única versión coherente. Lo que falta no es unidad: es permiso.",
      vinculos: "En los vínculos puede aparecer la sensación de no ser conocido del todo. Suele resolverse mostrando lo otro a una sola persona.",
      grupo: "En grupo se puede conectar con subgrupos que no se hablan. Es una función valiosa y solitaria.",
      servicio: "La aportación natural es unir mundos. El límite es no quedarse siempre en la frontera.",
    },
    aprendizajeCentral: "Que tener dos modos no es una falta de identidad; exigirse uno solo, sí lo es.",
    paradoja: "La flexibilidad que permite estar en todas partes es la que hace difícil sentirse de alguna.",
    preguntaUmbral: "¿Ante quién apareces entero?",
    preguntas: [
      "¿Cuáles son tus dos versiones, y qué las dispara?",
      "¿Qué grupos de tu vida no has juntado nunca, y por qué?",
      "¿Cuál de tus dos modos has abandonado?",
      "¿Qué pasaría si alguien de un lado te viera en el otro?",
    ],
    journalPrompts: [
      "Describe tus dos modos. Escribe qué te gusta de cada uno.",
      "¿Ante quién eres más tú, y qué tiene esa persona?",
      "¿Qué interés tuyo no encaja con el resto de tu vida?",
    ],
    practicaBase: {
      titulo: "Juntar los dos lados",
      pasos: [
        "Identifica tus dos registros y en qué contextos aparece cada uno.",
        "Durante siete días, lleva una cosa pequeña de un contexto al otro: un tema de conversación, una manera de vestir, una opinión.",
        "Anota cada día qué llevaste y qué pasó.",
        "No fuerces una mezcla grande. Que sea pequeña y real.",
      ],
      cierre: "Al final, mira si alguien lo notó, y qué temías que pasara.",
    },
    framework144: {
      fisico: "Observa si tu cuerpo se coloca distinto en cada uno de los dos contextos.",
      mental: "Observa si piensas con vocabularios distintos según dónde estés.",
      espiritual: "Observa si tu sentido de quién eres necesita ser uno solo.",
    },
  },
}
