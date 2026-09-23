// CARTOGRAFÍA ESTELAR 144 — los diez portales principales.
//
// CAPA B, salvo el campo `astronomia`, que es factual y se muestra aparte.
//
// Escrito desde cero para Los 144.000. Las diez `esencia` estaban fijadas de
// antes y no se han tocado: el resto se ha desarrollado alrededor de ellas.
//
// ── CÓMO ESTÁ ESCRITO ──────────────────────────────────────────────────────
// Ningún texto dice lo que alguien es, ni de dónde viene, ni qué le va a
// pasar. Todos describen una dinámica observable y ofrecen dónde mirarla.
// La tensión nunca es un defecto: es la misma capacidad sin contrapeso.

import type { ContenidoPortal } from "../tipos"

export const PORTALES_PRINCIPALES: Record<string, ContenidoPortal> = {
  // ────────────────────────────────────────────────────────────────────────
  pleyades: {
    id: "pleyades",
    estado: "draft",
    astronomia:
      "Las Pléyades son un cúmulo abierto de estrellas situado en dirección a la constelación de Tauro, a unos 444 años luz. Contiene varios centenares de estrellas nacidas del mismo material hace aproximadamente cien millones de años, de las cuales seis o siete resultan visibles a simple vista. A diferencia de una constelación, sus estrellas sí están físicamente relacionadas entre sí.",
    esencia: "memoria del vínculo · pertenencia · sensibilidad colectiva",
    fraseUmbral:
      "Hay quien entra en una habitación y sabe cómo está antes de que nadie hable.",
    arquetipo:
      "Lo que se recuerda en grupo. Donde este portal aparece marcado suele haber una sensibilidad que no distingue del todo entre lo propio y lo ajeno: se percibe el estado de una sala al entrar, se nota la tensión que dos personas no han nombrado, se carga con lo que otros no dicen. Esa percepción no se elige ni se apaga, y por eso raramente se vive como una capacidad. Se vive como el modo normal de estar en el mundo, hasta que alguien señala que no todos funcionan así. El tema aquí no es aprender a sentir, que ya ocurre: es aprender a saber de quién es lo que se siente.",
    nucleo:
      "Sentir lo colectivo antes de que se diga, y necesitar aprender a distinguir qué parte de eso es propio.",
    potenciales: [
      "Sostener el tejido de un grupo sin necesidad de dirigirlo.",
      "Notar lo que falta en una sala antes de que alguien lo pida en voz alta.",
      "Crear espacios donde la gente baja la guardia sin saber exactamente por qué.",
      "Recordar lo que un grupo ha vivido junto, y devolvérselo cuando lo ha olvidado.",
    ],
    tensiones: [
      "Dificultad para distinguir qué emoción es propia y cuál se recogió de otro.",
      "La pertenencia se vuelve dependencia cuando estar solo se confunde con estar excluido.",
      "Ajustar lo que se quiere al tono del grupo, tan rápido que no queda registro de haber querido otra cosa.",
      "Agotamiento que no se explica por lo que se ha hecho, sino por lo que se ha absorbido.",
    ],
    cuandoIntegrado: [
      "Se percibe el estado de un grupo y se decide qué hacer con esa información, en vez de reaccionar a ella.",
      "Se puede estar en desacuerdo sin sentir que se rompe el vínculo.",
      "La soledad deja de ser una amenaza y pasa a ser un lugar donde se recupera el propio tono.",
    ],
    cuandoSobrecargado: [
      "Se llega a casa sin saber qué se siente, solo que se siente mucho.",
      "Se evita a personas concretas no por lo que hacen, sino por lo que dejan encima.",
      "Se consulta a otros antes de saber la propia opinión, y después ya no aparece.",
    ],
    patronesCotidianos: [
      "Saber que alguien está mal por cómo ha escrito un mensaje de tres palabras.",
      "Salir de una reunión agotado sin haber hablado apenas.",
      "Ser la persona a la que se le cuentan las cosas, incluso gente que apenas se conoce.",
      "Cambiar de plan al notar que a otro no le apetecía, sin que lo haya dicho.",
    ],
    relaciones: {
      consigo:
        "La relación con uno mismo suele construirse tarde, porque durante años la atención estuvo puesta fuera. Recuperarla empieza por una pregunta simple y difícil: qué quiero yo, preguntado cuando no hay nadie delante.",
      vinculos:
        "Los vínculos tienden a ser intensos y porosos. Se entra rápido y hondo. El trabajo no es cerrarse, sino aprender a sostener un vínculo sin disolverse en él.",
      grupo:
        "En grupo aparece una función casi automática: sostener el ambiente. Puede ser una aportación valiosa o un puesto que nadie asignó y del que no se sale nunca.",
      servicio:
        "La aportación natural es hacer que un espacio sea habitable. El límite es que ese trabajo casi nunca se ve, y quien lo hace puede acabar esperando un reconocimiento que no va a llegar por sí solo.",
    },
    aprendizajeCentral:
      "Distinguir entre sentir con alguien y sentir por alguien. Lo primero acompaña; lo segundo sustituye, y a la larga deja a ambos más solos.",
    paradoja:
      "La misma sensibilidad que permite pertenecer profundamente es la que dificulta saber quién se es cuando no hay nadie alrededor.",
    preguntaUmbral: "¿Qué estás sintiendo ahora mismo que en realidad no es tuyo?",
    preguntas: [
      "¿A qué grupo perteneces por elección y a cuál por costumbre?",
      "¿Cuándo fue la última vez que estuviste solo sin que te pesara?",
      "¿Qué opinión tuya has ajustado esta semana para no romper el tono de una conversación?",
      "¿Quién te cuenta cosas que no le has preguntado, y desde cuándo?",
    ],
    journalPrompts: [
      "Describe una sala en la que entraste y supiste al instante cómo estaba. ¿Qué percibiste exactamente?",
      "Escribe una opinión que no has dicho en voz alta por no incomodar.",
      "¿De quién aprendiste que estar solo era algo que había que evitar?",
    ],
    practicaBase: {
      titulo: "Separar lo propio de lo recogido",
      pasos: [
        "Durante siete días, al final de cada jornada anota los tres estados de ánimo más fuertes que hayas tenido.",
        "Al lado de cada uno, escribe con quién estabas justo antes de que apareciera.",
        "Marca cada estado con P si sabrías explicar de dónde sale en tu propia vida, o con R si apareció al estar con alguien y no tiene causa propia clara.",
        "No cambies nada de tu comportamiento durante la semana. Solo registra.",
      ],
      cierre:
        "Al séptimo día cuenta cuántas P y cuántas R hay. La proporción, no cada caso concreto, es lo que dice algo.",
    },
    framework144: {
      fisico:
        "Observa el cuerpo al salir de un grupo: dónde se tensa, cuánto tardas en soltar, si necesitas silencio físico antes de poder hablar con alguien de confianza.",
      mental:
        "Observa cuánto de lo que piensas sobre un tema cambia según con quién lo hayas hablado por última vez.",
      espiritual:
        "Observa si tu sentido de formar parte de algo mayor depende de que haya otros presentes, o si sostiene también en soledad.",
    },
  },

  // ────────────────────────────────────────────────────────────────────────
  sirio: {
    id: "sirio",
    estado: "draft",
    astronomia:
      "Sirio es la estrella más brillante del cielo nocturno, en dirección a la constelación del Can Mayor, a 8.6 años luz. Es un sistema doble: Sirio A, una estrella blanca de la secuencia principal, y Sirio B, una enana blanca del tamaño aproximado de la Tierra pero con una masa comparable a la del Sol. Su salida heliaca marcaba el año en el antiguo Egipto.",
    esencia: "servicio consciente · disciplina · transmisión",
    fraseUmbral:
      "Hay trabajos que solo se sostienen cuando ya no queda entusiasmo.",
    arquetipo:
      "Lo que se sostiene por oficio y no por impulso. Donde este portal aparece marcado suele haber una relación seria con la propia tarea: se termina lo empezado, se enseña lo aprendido, se cumple sin que nadie tenga que vigilar. La capacidad no está en empezar con fuerza, que es común, sino en seguir cuando la novedad se ha gastado y nadie está mirando. Esa continuidad construye una competencia difícil de improvisar, y también una identidad que puede volverse frágil: si el valor propio queda atado a la utilidad prestada, dejar de ser útil se parece demasiado a dejar de valer.",
    nucleo:
      "Sostener una práctica en el tiempo hasta convertirla en algo transmisible, sin que la utilidad acabe sustituyendo a la identidad.",
    potenciales: [
      "Convertir lo aprendido en algo que otro pueda usar sin haberlo vivido.",
      "Sostener una práctica durante años sin que la falta de reconocimiento la detenga.",
      "Ser la persona en quien se confía cuando algo tiene que salir bien de verdad.",
      "Terminar. Que es menos común de lo que parece.",
    ],
    tensiones: [
      "Una exigencia que no descansa y que se aplica solo hacia dentro.",
      "Confundir el valor propio con la utilidad prestada.",
      "Dificultad para recibir ayuda, porque el sitio conocido es el del que la presta.",
      "Seguir sosteniendo algo mucho después de que haya dejado de tener sentido, por no saber soltarlo.",
    ],
    cuandoIntegrado: [
      "Se distingue entre lo que hay que terminar y lo que hay que abandonar, y se abandona sin culpa.",
      "Se enseña sin necesidad de seguir siendo indispensable.",
      "Se descansa sin tener que justificarlo con haber trabajado bastante.",
    ],
    cuandoSobrecargado: [
      "Se asume una tarea más sabiendo que no cabe, porque decir que no parece un fallo de carácter.",
      "Se corrige el trabajo de otros en vez de enseñarles a corregirlo.",
      "El descanso solo aparece cuando el cuerpo lo impone.",
    ],
    patronesCotidianos: [
      "Ser el último en irse de un proyecto que ya nadie sostiene.",
      "Rehacer algo que estaba suficientemente bien.",
      "Que te pidan cosas porque saben que las vas a hacer, no porque te correspondan.",
      "No saber qué hacer un domingo sin nada pendiente.",
    ],
    relaciones: {
      consigo:
        "La relación con uno mismo suele estar organizada como una supervisión. Aflojarla no es volverse indulgente: es dejar de evaluar continuamente y empezar a habitar.",
      vinculos:
        "En los vínculos es fácil ocupar el lugar del que sostiene. Funciona durante años y después pesa, porque el otro se acostumbra y uno también.",
      grupo:
        "En grupo suele aparecer como el punto fiable. Es una posición útil y aislada: se confía en esa persona, pero rara vez se le pregunta cómo está.",
      servicio:
        "La aportación natural es la continuidad: estar cuando el entusiasmo del principio ya pasó. El límite es no confundir servir con desaparecer.",
    },
    aprendizajeCentral:
      "Que la utilidad es una manera de estar en el mundo, no una condición para merecer estarlo.",
    paradoja:
      "La misma disciplina que permite sostener algo valioso durante años es la que dificulta reconocer cuándo ese algo ya terminó.",
    preguntaUmbral: "¿Quién eres cuando no estás siendo útil?",
    preguntas: [
      "¿Qué sostienes por deber y ya no por sentido?",
      "¿Qué has aprendido que todavía no has transmitido a nadie?",
      "¿Cuándo fue la última vez que pediste ayuda antes de estar desbordado?",
      "¿Qué pasaría, concretamente, si dejaras de hacer una de las cosas que haces por costumbre?",
    ],
    journalPrompts: [
      "Haz una lista de todo lo que sostienes ahora mismo. Marca lo que nadie te pidió.",
      "Escribe qué harías con una semana entera sin obligaciones. Si no se te ocurre nada, escribe eso.",
      "¿A quién le debes que sigas haciendo algo que ya no quieres hacer?",
    ],
    practicaBase: {
      titulo: "Distinguir lo que te corresponde",
      pasos: [
        "Durante siete días registra cada vez que alguien exprese una necesidad delante de ti.",
        "Clasifica cada caso: A, me corresponde actuar; B, puedo acompañar sin resolver; C, no me corresponde intervenir.",
        "Anota también qué hiciste realmente, que puede no coincidir con la categoría.",
        "No cambies tu respuesta durante la semana. Solo clasifica y registra.",
      ],
      cierre:
        "Al final, mira dos cosas: qué categoría apareció más, y cuántas veces actuaste en un caso que habías clasificado como B o C.",
    },
    framework144: {
      fisico:
        "Observa en qué momento del día aparece el cansancio y qué haces con él: si lo atiendes o lo pospones hasta que ya no admite posponerse.",
      mental:
        "Observa el criterio con que decides que algo está terminado. Si no encuentras uno, observa qué usas en su lugar.",
      espiritual:
        "Observa si tu sentido de contribuir necesita que el resultado se vea, o si sostiene también cuando nadie lo atribuye a ti.",
    },
  },

  // ────────────────────────────────────────────────────────────────────────
  arcturus: {
    id: "arcturus",
    estado: "draft",
    astronomia:
      "Arcturus es una estrella gigante roja en dirección a la constelación del Boyero, a unos 37 años luz. Es la estrella más brillante del hemisferio norte celeste y la cuarta del cielo entero. Se mueve por el espacio en una dirección muy distinta a la de las estrellas de su entorno, lo que indica que probablemente procede de otra población estelar de la galaxia.",
    esencia: "arquitectura · patrones · inteligencia sistémica",
    fraseUmbral:
      "Hay quien no puede ver un problema sin ver también el sistema que lo produce.",
    arquetipo:
      "Lo que ve la estructura debajo de los hechos. Donde este portal aparece marcado suele haber una mente que no se queda en el caso concreto: busca la regla que lo genera, y se incomoda hasta encontrarla. Esa manera de mirar resuelve problemas de raíz que otros tratan uno a uno durante años, y produce una claridad real. También produce distancia: entender tan bien el mecanismo que se olvide que dentro hay personas, y confundir haber comprendido una situación con haberla atendido. La comprensión llega antes que el cuidado, y no lo sustituye.",
    nucleo:
      "Reconocer la estructura que produce los hechos, sin que entenderla sustituya al trato con quienes están dentro.",
    potenciales: [
      "Diseñar sistemas que sostienen a otros sin que haga falta explicarlos cada vez.",
      "Ver el fallo de raíz donde los demás ven una serie de accidentes.",
      "Anticipar consecuencias a dos o tres pasos de distancia.",
      "Hacer comprensible algo complejo sin simplificarlo hasta falsearlo.",
    ],
    tensiones: [
      "Explicar el mecanismo a alguien que lo que necesitaba era compañía.",
      "Impaciencia con procesos que no avanzan a la velocidad del entendimiento.",
      "Quedarse en el diseño porque ejecutar obliga a aceptar que saldrá imperfecto.",
      "Ver con claridad un patrón propio y seguir repitiéndolo, como si entenderlo bastara.",
    ],
    cuandoIntegrado: [
      "Se distingue entre un problema que pide solución y una persona que pide presencia.",
      "Se acepta poner en marcha algo incompleto y corregirlo con el uso.",
      "Se explica solo cuando alguien lo ha pedido.",
    ],
    cuandoSobrecargado: [
      "Se analiza una relación en vez de estar en ella.",
      "Se rediseña un sistema que funcionaba, porque podía funcionar mejor.",
      "Se responde a una queja con un diagnóstico.",
    ],
    patronesCotidianos: [
      "Reorganizar algo de casa o del trabajo que nadie había pedido reorganizar.",
      "Saber cómo va a terminar una conversación a los dos minutos de empezarla.",
      "Frustrarse cuando se repite un error que ya habías explicado.",
      "Leer sobre un tema hasta entender su estructura, y perder el interés justo ahí.",
    ],
    relaciones: {
      consigo:
        "La relación con uno mismo tiende a plantearse como un problema de diseño. El límite aparece cuando algo propio no se resuelve entendiéndolo, que es la mayoría de lo importante.",
      vinculos:
        "En los vínculos aparece la tentación de mejorar al otro. Se hace con buena intención y se recibe como una corrección permanente.",
      grupo:
        "En grupo suele ser quien ve antes el fallo de organización. Decirlo demasiado pronto y demasiadas veces gasta la credibilidad que esa mirada merecía.",
      servicio:
        "La aportación natural es dejar estructuras que sigan sirviendo sin su autor. El límite es recordar que una estructura se usa, no solo se admira.",
    },
    aprendizajeCentral:
      "Que comprender un patrón y salir de él son dos operaciones distintas, y la segunda no se deduce de la primera.",
    paradoja:
      "La mirada que ve con más claridad los patrones ajenos es la que más tarda en aplicarse a sí misma, porque desde dentro no hay distancia.",
    preguntaUmbral: "¿Qué patrón de tu vida ves con claridad y sigues repitiendo?",
    preguntas: [
      "¿Dónde estás resolviendo el síntoma en vez de la causa?",
      "¿A quién has explicado un sistema cuando lo que necesitaba era compañía?",
      "¿Qué proyecto tienes diseñado y sin empezar, y qué te detiene exactamente?",
      "¿Qué cosa que entiendes perfectamente sigues haciendo mal?",
    ],
    journalPrompts: [
      "Describe un patrón tuyo que ves con total claridad. Escribe después por qué sigue ahí.",
      "Escribe una conversación reciente donde diste una solución. ¿Qué te habían pedido en realidad?",
      "¿Qué tendrías que aceptar como imperfecto para poder empezar algo esta semana?",
    ],
    practicaBase: {
      titulo: "Escuchar sin resolver",
      pasos: [
        "Durante siete días, en cada conversación donde alguien te cuente una dificultad, no propongas ninguna solución.",
        "Limítate a preguntar y a escuchar hasta el final.",
        "Al terminar cada una, anota cuántas veces estuviste a punto de dar una solución y no la diste.",
        "Anota también cómo terminó la conversación.",
      ],
      cierre:
        "Al séptimo día compara: en cuántas de esas conversaciones la persona llegó sola a algo, y cuánto te costó a ti no intervenir.",
    },
    framework144: {
      fisico:
        "Observa qué hace tu cuerpo mientras piensas: si te detienes, si te mueves, si dejas de comer o de dormir cuando hay algo sin resolver.",
      mental:
        "Observa cuánto tiempo pasa entre que entiendes algo y que pierdes el interés por ello.",
      espiritual:
        "Observa si necesitas que el conjunto tenga sentido para poder participar en él, o si puedes contribuir a algo cuya lógica completa no ves.",
    },
  },

  // ────────────────────────────────────────────────────────────────────────
  lyra: {
    id: "lyra",
    estado: "draft",
    astronomia:
      "Lyra es una constelación pequeña del hemisferio norte dominada por Vega, a 25 años luz, la quinta estrella más brillante del cielo. Vega fue la primera estrella fotografiada y sirvió durante décadas como referencia de magnitud cero. Por el movimiento del eje terrestre, fue estrella polar hace unos catorce mil años y volverá a serlo dentro de otros doce mil.",
    esencia: "soberanía · creación · individualidad",
    fraseUmbral:
      "Hay decisiones que solo se pueden tomar sin permiso.",
    arquetipo:
      "Lo que se sostiene por cuenta propia. Donde este portal aparece marcado suele haber una relación temprana con la autonomía: la sensación, a veces desde muy pronto, de que ciertas decisiones no pueden delegarse. De ahí sale una capacidad real de crear algo que no existía y de sostenerlo sin respaldo, pero también una dificultad concreta: pedir. La autonomía practicada durante años se convierte en el único modo disponible, y entonces recibir ayuda deja de ser una opción y pasa a sentirse como una pérdida de terreno. El tema aquí no es aprender a ser independiente, que ya se sabe, sino descubrir que depender a veces también es una elección.",
    nucleo:
      "Sostener lo propio sin permiso, y aprender que aceptar ayuda no lo devuelve.",
    potenciales: [
      "Empezar algo que no existía, sin esperar a que alguien lo valide.",
      "Mantener un criterio propio cuando el entorno entero opina distinto.",
      "Dar forma a una idea hasta que otros puedan verla.",
      "Reconocer rápido cuándo una situación pide marcharse.",
    ],
    tensiones: [
      "Confundir pedir ayuda con perder autonomía.",
      "Marcharse antes de que la situación obligue a negociar.",
      "Defender la propia posición incluso cuando ya no se está seguro de ella.",
      "Una soledad que se eligió tantas veces que dejó de sentirse como una elección.",
    ],
    cuandoIntegrado: [
      "Se pide ayuda sin que eso ponga en cuestión la propia capacidad.",
      "Se distingue entre una situación que hay que abandonar y una que hay que atravesar.",
      "Se sostiene un criterio propio sin necesidad de que el otro lo adopte.",
    ],
    cuandoSobrecargado: [
      "Se hace solo algo que habría salido mejor con dos personas.",
      "Se discute por el principio, mucho después de que el asunto dejara de importar.",
      "Se corta un vínculo entero para no tener que revisar una parte.",
    ],
    patronesCotidianos: [
      "Montar algo desde cero antes que adaptarse a algo que ya existe.",
      "No decir que algo te ha costado hasta que ya está resuelto.",
      "Irte de un sitio en el que ya no estabas cómodo sin dar demasiadas explicaciones.",
      "Que te digan que eres difícil de ayudar.",
    ],
    relaciones: {
      consigo:
        "La relación con uno mismo suele ser leal y exigente a la vez. Se sabe lo que se quiere; lo que cuesta es admitir cuándo no se llega solo.",
      vinculos:
        "En los vínculos aparece pronto la pregunta de cuánto se cede. Funciona bien con quien no pide renuncia y se tensa rápido con quien sí.",
      grupo:
        "En grupo se ocupa con facilidad el papel de quien no sigue la corriente. Aporta criterio y cansa cuando se convierte en posición permanente.",
      servicio:
        "La aportación natural es abrir camino donde no lo había. El límite es que abrir camino en solitario deja un camino que nadie más sabe recorrer.",
    },
    aprendizajeCentral:
      "Que la autonomía no se pierde al recibir. Se pierde al no poder elegir entre recibir y no hacerlo.",
    paradoja:
      "La independencia que permite sostener lo propio frente a todos es la que impide construir con alguien.",
    preguntaUmbral: "¿Qué estás haciendo solo que se haría mejor con alguien?",
    preguntas: [
      "¿Cuándo fue la última vez que pediste ayuda antes de necesitarla de verdad?",
      "¿De qué te has ido por no tener que negociar?",
      "¿Qué opinión defiendes aunque ya no estés seguro de sostenerla?",
      "¿Qué has creado que no existiría si hubieras esperado permiso?",
    ],
    journalPrompts: [
      "Escribe la última vez que te fuiste de algo. ¿Qué habría hecho falta para quedarte?",
      "Haz una lista de lo que estás haciendo solo ahora mismo. Marca lo que podrías compartir.",
      "¿Quién te enseñó que había que arreglárselas por cuenta propia?",
    ],
    practicaBase: {
      titulo: "Pedir antes del límite",
      pasos: [
        "Durante siete días, identifica cada mañana una cosa concreta de ese día en la que podrías pedir ayuda.",
        "Pídela, aunque puedas hacerla solo. Que sea real, no simbólica.",
        "Anota a quién se la pediste, qué te contestó y qué sentiste al pedirla.",
        "Si algún día no la pides, anota qué te lo impidió.",
      ],
      cierre:
        "Al final, mira los días en que no pediste. Lo que los tres o cuatro tengan en común dice más que los días en que sí.",
    },
    framework144: {
      fisico:
        "Observa qué hace tu cuerpo cuando alguien te ofrece ayuda: si se tensa, si se aparta, si responde que no antes de que termines de escuchar.",
      mental:
        "Observa qué te dices exactamente en el momento de decidir hacer algo solo. Anota la frase, no la conclusión.",
      espiritual:
        "Observa si formar parte de algo mayor te resulta expansivo o amenazante, y en qué condiciones cambia una cosa por la otra.",
    },
  },

  // ────────────────────────────────────────────────────────────────────────
  orion: {
    id: "orion",
    estado: "draft",
    astronomia:
      "Orión es una constelación ecuatorial visible desde casi toda la Tierra. Sus estrellas principales no forman un sistema físico: Betelgeuse, una supergigante roja, está a unos 550 años luz, mientras que Rigel, una supergigante azul, se encuentra a unos 860. Las tres estrellas del cinturón —Alnitak, Alnilam y Mintaka— sí comparten origen aproximado dentro de la misma región de formación estelar.",
    esencia: "polaridad · discernimiento · integración del conflicto",
    fraseUmbral:
      "Hay elecciones que no se resuelven eligiendo el lado bueno.",
    arquetipo:
      "Lo que obliga a elegir sin que haya un lado limpio. Donde este portal aparece marcado suele haber una familiaridad temprana con el conflicto: situaciones en las que dos cosas legítimas se excluían, y no había manera de atender a una sin desatender la otra. De ahí sale una capacidad poco común de sostener tensión sin huir ni resolverla antes de tiempo, y un criterio afilado para distinguir lo importante de lo urgente. También sale una tendencia a convertir cualquier cosa en una disyuntiva, y a desconfiar de las situaciones donde no hay nada que decidir.",
    nucleo:
      "Sostener dos cosas legítimas que se excluyen, sin simplificar la tensión ni instalarse en ella.",
    potenciales: [
      "Mantener la calma dentro de un conflicto que a otros los desborda.",
      "Distinguir lo importante de lo urgente cuando todo parece urgente.",
      "Tomar una decisión difícil sin necesitar convencerse de que era la única.",
      "Ver las dos posiciones de una discusión sin perder la propia.",
    ],
    tensiones: [
      "Convertir en disyuntiva algo que admitía las dos cosas.",
      "Buscar conflicto donde no lo hay, porque la calma resulta poco fiable.",
      "Cargar con la decisión que otros evitan, y después con el reproche.",
      "Decidir rápido para dejar de estar en la incomodidad de no haber decidido.",
    ],
    cuandoIntegrado: [
      "Se distingue una tensión que pide decisión de una que solo pide tiempo.",
      "Se puede estar en desacuerdo sin convertirlo en un asunto de fondo.",
      "Se acepta una decisión propia sin tener que demostrar después que fue la correcta.",
    ],
    cuandoSobrecargado: [
      "Se discute el planteamiento en vez del asunto.",
      "Se anticipa un enfrentamiento que aún no ha ocurrido y se responde a él.",
      "Se decide por agotamiento y se llama criterio.",
    ],
    patronesCotidianos: [
      "Ser quien acaba diciendo en voz alta lo que el grupo evitaba.",
      "Sentirse más despierto en una situación tensa que en una tranquila.",
      "Darle vueltas a una decisión ya tomada.",
      "Que te busquen para mediar y después te reprochen el resultado.",
    ],
    relaciones: {
      consigo:
        "La relación con uno mismo tiende a organizarse como un juicio con dos partes. Aflojarla empieza por admitir que algunas contradicciones propias no se van a resolver.",
      vinculos:
        "En los vínculos la claridad puede sentirse como dureza. El contenido suele ser preciso; el momento y el tono, casi nunca.",
      grupo:
        "En grupo se ocupa a menudo el lugar de quien nombra lo incómodo. Es una función necesaria y agotadora, y rara vez se agradece en el momento.",
      servicio:
        "La aportación natural es sostener una decisión difícil sin descargarla en otros. El límite es no convertirse en el depósito de todas las decisiones que nadie quiere firmar.",
    },
    aprendizajeCentral:
      "Que hay tensiones que no se resuelven, se habitan; y que saber cuáles son las que sí piden decisión es el discernimiento entero.",
    paradoja:
      "La capacidad de sostener el conflicto sin romperse es la que hace que uno acabe siempre dentro de él.",
    preguntaUmbral: "¿Qué decisión llevas tiempo tomando y no terminas de firmar?",
    preguntas: [
      "¿Qué tensión de tu vida no necesita resolverse y llevas años tratando de cerrar?",
      "¿En qué conversación tenías razón y aun así salió mal?",
      "¿Qué decisión tomaste por agotamiento y sigues defendiendo como criterio?",
      "¿Dónde estás viendo dos opciones y hay tres?",
    ],
    journalPrompts: [
      "Escribe una decisión que te cuesta. Anota qué pierdes en cada opción, sin buscar cuál gana.",
      "Describe una discusión reciente. ¿Qué querías: tener razón, ser entendido, o cambiar algo?",
      "¿Qué contradicción tuya has dejado de intentar resolver, y qué pasó cuando dejaste de intentarlo?",
    ],
    practicaBase: {
      titulo: "Nombrar lo que se pierde",
      pasos: [
        "Elige una decisión pendiente que lleve semanas o meses contigo.",
        "Durante siete días, cada día escribe una sola frase: qué pierdes si eliges A.",
        "Otra frase: qué pierdes si eliges B.",
        "No escribas ventajas. Solo pérdidas. Y no decidas durante la semana.",
      ],
      cierre:
        "Al séptimo día lee las catorce frases seguidas. Mira cuál de las dos pérdidas se repite formulada de maneras distintas.",
    },
    framework144: {
      fisico:
        "Observa dónde se instala la tensión física cuando hay algo sin decidir, y si desaparece al decidir o solo cambia de sitio.",
      mental:
        "Observa cuántas veces al día planteas algo como una disyuntiva. Cuenta cuántas de esas admitían las dos cosas.",
      espiritual:
        "Observa si necesitas que una decisión sea la correcta para poder sostenerla, o si puedes sostener una sabiendo que no lo sabrás nunca.",
    },
  },
}
