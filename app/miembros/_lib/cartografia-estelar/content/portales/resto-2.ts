// CARTOGRAFÍA ESTELAR 144 — portales 21 a 30.
//
// CAPA B, salvo `astronomia`.
//
// Ofiuco: aquí se trata como constelación, sin entrar en la discusión
// comercial sobre el decimotercer signo.
// Perseo: no se hereda la mala fama tradicional de Algol. Ningún portal es
// favorable ni desfavorable.

import type { ContenidoPortal } from "../tipos"

export const PORTALES_RESTO_2: Record<string, ContenidoPortal> = {
  perseo: {
    id: "perseo",
    estado: "draft",
    astronomia:
      "Perseo es una constelación del hemisferio norte. Algol es una binaria eclipsante: cada 2.87 días una de sus estrellas pasa por delante de la otra y el brillo del conjunto desciende de forma visible a simple vista, lo que la convirtió en una de las primeras estrellas variables identificadas. Mirfak, la más brillante de la constelación, es una supergigante a unos 510 años luz.",
    esencia: "intermitencia · lo que aparece y se retira · ritmo propio",
    fraseUmbral: "No todo lo que se apaga se ha ido.",
    arquetipo:
      "Lo que funciona por ciclos en vez de por continuidad. Donde este portal aparece marcado suele haber un ritmo propio que no coincide con el que el entorno espera: periodos de mucha presencia y periodos de retirada, capacidad alta seguida de necesidad de desaparecer. Eso produce una intensidad real en las fases activas y un conocimiento poco común de los propios ciclos. El coste llega del desajuste: un entorno que espera regularidad lee la retirada como fallo, y quien la vive acaba interpretándola igual, cuando lo que hay no es inconstancia sino otra forma de constancia.",
    nucleo: "Reconocer el propio ritmo intermitente sin leerlo como un defecto de carácter.",
    potenciales: [
      "Rendir mucho en las fases activas, más de lo que permitiría un ritmo plano.",
      "Conocer los propios ciclos y planificar con ellos en vez de contra ellos.",
      "Retirarse a tiempo, antes del agotamiento.",
      "Aceptar el mismo ritmo en otros sin exigirles regularidad.",
    ],
    tensiones: [
      "Interpretar la fase baja como haber fallado.",
      "Comprometerse durante la fase alta a un nivel que la baja no sostiene.",
      "Desaparecer sin avisar, y que se lea como abandono.",
      "Forzar continuidad hasta que el ciclo se rompe de golpe.",
    ],
    cuandoIntegrado: [
      "Se avisa de la retirada en vez de desaparecer.",
      "Se compromete según el promedio, no según el pico.",
      "La fase baja se usa para recuperar, no para reprocharse.",
    ],
    cuandoSobrecargado: [
      "Se acepta todo en la fase alta y se incumple en la baja.",
      "Se desaparece de conversaciones sin explicación.",
      "Se fuerza la continuidad y se llega a un parón total.",
    ],
    patronesCotidianos: [
      "Semanas de mucha actividad seguidas de semanas sin contestar a nadie.",
      "Que te digan que apareces y desapareces.",
      "Saber, a mitad de una fase buena, que va a terminar.",
      "Planes hechos con entusiasmo que después no puedes sostener.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo mejora mucho al dejar de exigirse un rendimiento plano. Lo que falta suele ser registro del propio ciclo.",
      vinculos: "En los vínculos lo que hace daño no es la retirada, es que no se avise. Avisar cambia por completo cómo se recibe.",
      grupo: "En grupo se aporta mucho en rachas. Conviene que el grupo lo sepa de antemano.",
      servicio: "La aportación natural es la intensidad cuando se está. El límite es no prometer desde la fase alta.",
    },
    aprendizajeCentral: "Que un ritmo intermitente también es un ritmo, y que avisarlo lo convierte en fiable.",
    paradoja: "La misma intensidad que hace valiosas las fases activas es la que hace necesarias las retiradas.",
    preguntaUmbral: "¿Cuál es tu ritmo real, y a quién se lo has contado?",
    preguntas: [
      "¿A qué te comprometiste en una fase alta que no pudiste sostener?",
      "¿Cómo se ven tus retiradas desde fuera?",
      "¿Qué señales te avisan de que empieza una fase baja?",
      "¿Qué cambiaría si planificaras según tu promedio?",
    ],
    journalPrompts: [
      "Describe tu última fase alta y tu última fase baja. ¿Cuánto duraron?",
      "Escribe qué avisarías a alguien cercano sobre cómo funcionas.",
      "¿Qué haces durante las fases bajas, y qué te dices sobre ellas?",
    ],
    practicaBase: {
      titulo: "Registrar el ciclo",
      pasos: [
        "Durante siete días puntúa cada noche tu energía disponible del 1 al 5.",
        "Anota al lado qué hiciste ese día y qué te costó.",
        "No intentes mejorar la puntuación.",
        "Anota también cualquier compromiso que adquiriste ese día.",
      ],
      cierre: "Al final, mira si los compromisos aparecieron en los días de 4 y 5. Eso explica la mayor parte de los incumplimientos.",
    },
    framework144: {
      fisico: "Observa qué señales físicas preceden a tus fases bajas.",
      mental: "Observa qué te dices sobre ti durante una fase baja.",
      espiritual: "Observa si tu sentido de valía depende de estar siempre disponible.",
    },
  },

  casiopea: {
    id: "casiopea",
    estado: "draft",
    astronomia:
      "Casiopea es una constelación circumpolar del hemisferio norte, reconocible por la forma de W que dibujan sus cinco estrellas principales. Al no ponerse nunca bajo el horizonte desde latitudes medias del norte, permanece visible durante todo el año. Schedar es una gigante anaranjada a unos 228 años luz y Caph se encuentra a 54.",
    esencia: "presencia constante · forma reconocible · permanecer a la vista",
    fraseUmbral: "Estar siempre disponible tiene un precio que no se cobra de golpe.",
    arquetipo:
      "Lo que no se retira nunca. Donde este portal aparece marcado suele haber una presencia continua que otros dan por hecha: se está, se responde, se aparece, año tras año, sin que medie una decisión consciente de hacerlo. Eso construye confianza real, y una forma reconocible que los demás usan para orientarse. El coste se acumula despacio: la disponibilidad permanente deja de percibirse como generosidad y pasa a ser el estado natural de las cosas, de modo que faltar una sola vez se nota más que haber estado quinientas.",
    nucleo: "Sostener una presencia fiable sin que la disponibilidad permanente se convierta en obligación invisible.",
    potenciales: [
      "Ser alguien con quien se puede contar sin tener que preguntarlo.",
      "Sostener algo durante años sin dramatizar el esfuerzo.",
      "Dar estabilidad a personas que no la tienen en otro sitio.",
      "Mantener una forma propia reconocible en contextos cambiantes.",
    ],
    tensiones: [
      "Que la presencia se vuelva expectativa y deje de agradecerse.",
      "No saber retirarse, ni siquiera cuando hace falta.",
      "Que faltar una vez pese más que cientos de veces habiendo estado.",
      "Confundir ser fiable con no tener derecho a estar mal.",
    ],
    cuandoIntegrado: [
      "Se falta a algo sin justificarlo en exceso.",
      "Se distingue entre estar disponible y estar obligado.",
      "Se pide relevo antes de estar agotado.",
    ],
    cuandoSobrecargado: [
      "Se acude a algo estando enfermo, porque no ir parece impensable.",
      "Se responde al instante siempre, incluso de madrugada.",
      "Se acumula un cansancio que no se puede nombrar sin sentir que se falla.",
    ],
    patronesCotidianos: [
      "Que te escriban dando por hecho que vas a contestar.",
      "Ser quien siempre va, aunque nadie lo haya pedido explícitamente.",
      "Sentir culpa desproporcionada al cancelar algo.",
      "Que se note mucho cuando no estás.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo suele quedar sin horario propio. Recuperarla empieza por reservar tiempo que no se cede.",
      vinculos: "En los vínculos se da continuidad. Conviene comprobar de vez en cuando si sigue siendo mutua.",
      grupo: "En grupo se es el punto estable. La estabilidad, cuando es permanente, deja de verse.",
      servicio: "La aportación natural es la permanencia. El límite es que permanecer no obliga a estar siempre disponible.",
    },
    aprendizajeCentral: "Que la fiabilidad se sostiene mejor con límites que sin ellos.",
    paradoja: "Quien está siempre acaba siendo el único al que no se le pregunta si puede.",
    preguntaUmbral: "¿Cuándo fue la última vez que dijiste que no podías?",
    preguntas: [
      "¿Qué se espera de ti que nunca acordaste?",
      "¿Qué pasaría realmente si faltaras una vez?",
      "¿Quién te pregunta a ti cómo estás?",
      "¿Qué tiempo tuyo no cedes bajo ningún concepto?",
    ],
    journalPrompts: [
      "Haz una lista de todo a lo que acudes por costumbre. Marca lo que elegirías hoy.",
      "Escribe la última vez que cancelaste algo. ¿Qué sentiste?",
      "¿Qué te sostiene a ti?",
    ],
    practicaBase: {
      titulo: "Un no por semana",
      pasos: [
        "Durante los siete días, di que no a una cosa a la que normalmente dirías que sí.",
        "Que sea real: algo que te quitaría tiempo o energía.",
        "No des explicaciones largas. Un no y una alternativa si quieres.",
        "Anota qué dijiste, a quién y qué pasó después.",
      ],
      cierre: "Compara lo que temías que pasara con lo que pasó. Anota también cuánto tardaste en decidirte.",
    },
    framework144: {
      fisico: "Observa si acudes a compromisos estando cansado o enfermo, y con qué frecuencia.",
      mental: "Observa cuánto de tu semana está ocupado por cosas que nunca decidiste hacer.",
      espiritual: "Observa si tu sentido de pertenencia depende de estar siempre disponible.",
    },
  },

  cefeo: {
    id: "cefeo",
    estado: "draft",
    astronomia:
      "Cefeo es una constelación circumpolar del hemisferio norte, de estrellas menos brillantes que las de sus vecinas. Alderamin, la principal, está a unos 49 años luz y gira sobre sí misma a gran velocidad. Por el desplazamiento del eje terrestre, esta estrella ocupará la posición de referencia del polo norte celeste dentro de unos cinco mil quinientos años.",
    esencia: "lo que aún no llega · preparación · turno futuro",
    fraseUmbral: "Hay trabajo que no da fruto durante el tiempo de quien lo hace.",
    arquetipo:
      "Lo que se prepara para un momento que todavía no ha llegado. Donde este portal aparece marcado suele haber una orientación hacia plazos largos: se empieza algo cuyo sentido se verá dentro de años, se sostiene una posición que aún no es comprensible para el entorno, se trabaja sin la satisfacción del resultado. Eso da paciencia estructural y capacidad de invertir en lo que no rinde pronto. El coste es la falta de confirmación: cuando no hay señales durante mucho tiempo, cuesta distinguir entre estar adelantado y estar equivocado, y esa duda no se resuelve desde dentro.",
    nucleo: "Sostener algo cuyo momento no ha llegado, sin confundir paciencia con negarse a revisar.",
    potenciales: [
      "Empezar algo cuyo sentido tardará años en verse.",
      "Sostener una posición que el entorno aún no comprende.",
      "Trabajar sin necesitar confirmación frecuente.",
      "Preparar condiciones para otros que vendrán después.",
    ],
    tensiones: [
      "No poder distinguir entre ir por delante y estar equivocado.",
      "Aplazar la vida presente en función de un momento futuro.",
      "Aislamiento por sostener algo que nadie alrededor comparte.",
      "Usar el largo plazo como excusa para no comprobar nada.",
    ],
    cuandoIntegrado: [
      "Se busca una comprobación parcial aunque el resultado completo tarde.",
      "Se vive el presente sin descontarlo del futuro.",
      "Se revisa la apuesta sin abandonarla al primer intento.",
    ],
    cuandoSobrecargado: [
      "Se justifica cualquier falta de resultado apelando al tiempo.",
      "Se aplazan decisiones personales hasta que el proyecto funcione.",
      "Se deja de escuchar a quien no comparte la visión.",
    ],
    patronesCotidianos: [
      "Trabajar en algo que te cuesta explicar a tu familia.",
      "Sentir que llegas pronto a los sitios, no tarde.",
      "Que te pregunten cuándo vas a ver resultados.",
      "Empezar cosas pensando en cómo estarán dentro de diez años.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo necesita hitos intermedios, o el largo plazo se come el presente entero.",
      vinculos: "En los vínculos conviene no pedir al otro la fe que uno tiene en un proyecto propio.",
      grupo: "En grupo se aporta una dirección a plazo largo. Requiere traducirla a pasos, o no se sigue.",
      servicio: "La aportación natural es preparar lo que servirá a otros. El límite es no vivir solo en función de eso.",
    },
    aprendizajeCentral: "Que la paciencia necesita puntos de comprobación, o deja de ser paciencia y pasa a ser terquedad.",
    paradoja: "Lo que sostiene a largo plazo es lo que impide saber si se va bien.",
    preguntaUmbral: "¿Qué estás sosteniendo sin ninguna señal de que funcione?",
    preguntas: [
      "¿Qué estás aplazando de tu vida presente por un proyecto futuro?",
      "¿Qué comprobación parcial podrías buscar este mes?",
      "¿A quién has dejado de escuchar por no compartir tu visión?",
      "¿Cómo distinguirías ir adelantado de estar equivocado?",
    ],
    journalPrompts: [
      "Escribe qué estás construyendo a largo plazo y cuándo esperas ver algo.",
      "Haz una lista de lo que has aplazado por ello.",
      "¿Qué te haría revisar la apuesta?",
    ],
    practicaBase: {
      titulo: "Un hito comprobable",
      pasos: [
        "Elige el proyecto de largo plazo que más te ocupa.",
        "Define un solo indicador concreto que podrías comprobar dentro de treinta días.",
        "Durante los siete días, da un paso diario hacia ese indicador.",
        "Anota cada día qué hiciste, en una línea.",
      ],
      cierre: "Al final, comprueba si el indicador es realmente comprobable o si sigue siendo una intención.",
    },
    framework144: {
      fisico: "Observa si tu vida cotidiana está en pausa esperando algo.",
      mental: "Observa cuánto piensas en el futuro comparado con lo que tienes delante.",
      espiritual: "Observa si tu sentido se sostiene sin resultados visibles.",
    },
  },

  draco: {
    id: "draco",
    estado: "draft",
    astronomia:
      "Draco es una constelación larga que rodea el polo norte celeste. Thuban, designada como su estrella alfa, ocupó la posición de referencia del polo hace unos cuatro mil setecientos años, en la época de las grandes pirámides egipcias. Eltanin, más brillante en la actualidad, se encuentra a 154 años luz y se acerca a nosotros: dentro de un millón y medio de años será la estrella más brillante del cielo.",
    esencia: "lo que fue central · memoria larga · custodia",
    fraseUmbral: "Lo que hoy está en el margen ocupó el centro, y volverá a ocuparlo otra cosa.",
    arquetipo:
      "Lo que conserva algo que dejó de estar en el centro. Donde este portal aparece marcado suele haber una relación con lo antiguo que no es nostalgia sino custodia: se sostiene un oficio, una manera de hacer o una memoria que el entorno ya no considera principal, y se sostiene sin necesidad de que vuelva a serlo. Eso conserva cosas que de otro modo se perderían. El coste aparece cuando la custodia se confunde con el rechazo a lo nuevo, y lo que empezó siendo cuidado de algo valioso se convierte en desconfianza general hacia el presente.",
    nucleo: "Custodiar lo que dejó de ser central, sin convertir la custodia en desprecio de lo actual.",
    potenciales: [
      "Conservar un saber que el entorno está dejando caer.",
      "Dar perspectiva histórica a una discusión del momento.",
      "Sostener una práctica antigua con criterio, no por inercia.",
      "Reconocer lo que vale de algo que ya pasó de moda.",
    ],
    tensiones: [
      "Confundir custodiar con rechazar lo nuevo.",
      "Defender algo por antigüedad y no por valor.",
      "Amargura con un presente que no reconoce lo que se conserva.",
      "Quedarse con la memoria de algo y no con su uso.",
    ],
    cuandoIntegrado: [
      "Se transmite lo antiguo a quien puede usarlo hoy.",
      "Se distingue lo que merece conservarse de lo que solo es familiar.",
      "Se aprende algo nuevo sin vivirlo como traición.",
    ],
    cuandoSobrecargado: [
      "Se compara cualquier cosa actual con cómo se hacía antes.",
      "Se conserva sin transmitir, y el saber muere con quien lo guarda.",
      "Se desprecia lo nuevo sin haberlo examinado.",
    ],
    patronesCotidianos: [
      "Guardar objetos, papeles o métodos que ya nadie usa.",
      "Ser quien recuerda cómo se hacían las cosas en un sitio.",
      "Irritación con cambios que parecen no haber considerado lo anterior.",
      "Saber hacer algo a mano que ya se hace de otra manera.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo incluye una historia larga. Conviene revisar qué se conserva por valor y qué por costumbre.",
      vinculos: "En los vínculos se sostiene la memoria compartida. Es un regalo y a veces un peso para el otro.",
      grupo: "En grupo se es quien recuerda por qué se hacía algo así. Útil cuando se pregunta, pesado cuando no.",
      servicio: "La aportación natural es que algo no se pierda. El límite es que conservar sin transmitir no conserva nada.",
    },
    aprendizajeCentral: "Que lo que se custodia solo sobrevive si alguien más aprende a usarlo.",
    paradoja: "Guardar algo intacto es la forma más segura de que nadie vuelva a usarlo.",
    preguntaUmbral: "¿Qué sabes hacer que no le has enseñado a nadie?",
    preguntas: [
      "¿Qué conservas por valor y qué por costumbre?",
      "¿A quién podrías transmitir algo que se perderá contigo?",
      "¿Qué cosa nueva has rechazado sin examinarla?",
      "¿Qué echas de menos de cómo se hacían las cosas, y qué no?",
    ],
    journalPrompts: [
      "Escribe algo que sabes hacer y que casi nadie sabe ya.",
      "Haz una lista de lo que guardas. Marca lo que alguien usaría.",
      "¿Qué del presente te cuesta aceptar, y qué tendrías que soltar para mirarlo?",
    ],
    practicaBase: {
      titulo: "Transmitir una cosa",
      pasos: [
        "Elige algo concreto que sepas hacer y que estés conservando sin transmitir.",
        "Elige una persona a la que pudiera servirle.",
        "Durante los siete días enséñaselo, aunque sea en dos ratos cortos.",
        "Anota qué le costó a esa persona y qué tuviste que explicar que dabas por obvio.",
      ],
      cierre: "Al final, mira qué parte de lo que sabes no estaba en tus explicaciones.",
    },
    framework144: {
      fisico: "Observa qué gestos o rutinas antiguas conserva tu cuerpo.",
      mental: "Observa con qué frecuencia comparas algo actual con cómo era antes.",
      espiritual: "Observa qué sientes que tienes la obligación de que no se pierda.",
    },
  },

  ofiuco: {
    id: "ofiuco",
    estado: "draft",
    astronomia:
      "Ofiuco es una constelación ecuatorial extensa, representada tradicionalmente como una figura que sostiene una serpiente. El Sol atraviesa parte de ella a comienzos de diciembre, aunque no figura entre las doce constelaciones del zodiaco tradicional. Su estrella principal, Rasalhague, se encuentra a unos 48 años luz.",
    esencia: "lo que no encaja en la lista · el caso aparte · categoría propia",
    fraseUmbral: "Hay cosas que existen aunque no estén en la clasificación.",
    arquetipo:
      "Lo que queda fuera del reparto habitual. Donde este portal aparece marcado suele haber una experiencia repetida de no encajar en las categorías disponibles: ni de un grupo ni de otro, ni exactamente esto ni exactamente aquello, con la incomodidad permanente de tener que explicarse. Eso obliga a construir criterio propio en vez de heredarlo, y produce una mirada que no está capturada por las clasificaciones del entorno. El coste es el cansancio de la explicación continua, y la tentación de convertir el no encajar en una identidad, que es otra manera de quedarse fuera.",
    nucleo: "Sostener una posición que no está en las categorías disponibles, sin convertir el margen en identidad.",
    potenciales: [
      "Ver lo que las clasificaciones del entorno dejan fuera.",
      "Construir criterio propio por no poder heredarlo.",
      "Acoger a otros que tampoco encajan, sin pedirles que se definan.",
      "Proponer una tercera opción donde todos ven dos.",
    ],
    tensiones: [
      "Cansancio de tener que explicarse continuamente.",
      "Convertir el no encajar en una identidad, que es otra forma de quedarse fuera.",
      "Rechazar pertenecer antes de que te rechacen.",
      "Soledad atribuida a los demás cuando también se eligió.",
    ],
    cuandoIntegrado: [
      "Se pertenece a algo sin tener que encajar del todo.",
      "Se deja de explicar cuando no hace falta.",
      "El margen se usa para ver, no para defenderse.",
    ],
    cuandoSobrecargado: [
      "Se sale de un grupo antes de comprobar si había sitio.",
      "Se define uno por lo que no es.",
      "Se desconfía de cualquier categoría, incluidas las útiles.",
    ],
    patronesCotidianos: [
      "Que te pregunten a qué te dedicas y no sepas resumirlo.",
      "Sentirte a medias en varios grupos y del todo en ninguno.",
      "Que la gente te sitúe mal y tengas que corregir.",
      "Hacer algo que no existe como categoría todavía.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo se construye sin plantilla. Es más trabajo y sale más propia.",
      vinculos: "En los vínculos el riesgo es anticipar el rechazo y retirarse antes de comprobarlo.",
      grupo: "En grupo se aporta una mirada que no está dentro del marco compartido. Puede desordenar y puede abrir.",
      servicio: "La aportación natural es hacer sitio a lo que no lo tiene. El límite es no confundir eso con no querer sitio propio.",
    },
    aprendizajeCentral: "Que se puede pertenecer sin encajar, y que comprobarlo requiere quedarse el tiempo suficiente.",
    paradoja: "La distancia que da criterio propio es la que hace creer que no hay sitio.",
    preguntaUmbral: "¿Dónde te has ido antes de comprobar si había sitio para ti?",
    preguntas: [
      "¿Cuánto de tu identidad es lo que no eres?",
      "¿A qué grupo perteneces sin encajar del todo, y cómo va?",
      "¿Qué te cansa más: explicarte o que te sitúen mal?",
      "¿Qué categoría útil has rechazado por desconfianza general?",
    ],
    journalPrompts: [
      "Escribe cómo te describes cuando no puedes usar categorías conocidas.",
      "Describe un grupo donde te sientes a medias. ¿Qué haría falta para estar del todo?",
      "¿Cuándo decidiste que no encajabas?",
    ],
    practicaBase: {
      titulo: "Quedarse sin explicarse",
      pasos: [
        "Elige un grupo o entorno donde te sientas a medias.",
        "Durante los siete días, acude o participa sin explicar tu posición.",
        "No te justifiques, no aclares, no matices quién eres.",
        "Anota cada vez que sentiste el impulso de explicarte y no lo hiciste.",
      ],
      cierre: "Al final, mira si alguien te pidió realmente esa explicación.",
    },
    framework144: {
      fisico: "Observa qué hace tu cuerpo al entrar en un grupo donde no sabes si encajas.",
      mental: "Observa cuánto tiempo dedicas a formular cómo explicarte.",
      espiritual: "Observa si puedes formar parte de algo sin tener que definirte dentro de ello.",
    },
  },

  hercules: {
    id: "hercules",
    estado: "draft",
    astronomia:
      "Hércules es una constelación amplia del hemisferio norte. Rasalgethi es una supergigante roja variable situada a unos 360 años luz, y Kornephoros, pese a su designación secundaria, brilla más. En dirección a esta constelación se encuentra el punto hacia el que se desplaza el Sol dentro de la galaxia, llamado ápex solar.",
    esencia: "esfuerzo sostenido · carga asumida · fuerza sin público",
    fraseUmbral: "Cargar con algo no siempre significa que te corresponda.",
    arquetipo:
      "Lo que aguanta más de lo que le tocaba. Donde este portal aparece marcado suele haber una capacidad alta de esfuerzo sostenido y poca costumbre de medir si la carga es propia: se coge lo que hay que hacer, se hace, y la pregunta de a quién le correspondía no llega a formularse. Eso permite sacar adelante cosas que sin esa fuerza no saldrían. El coste es doble: el desgaste físico, que llega tarde y de golpe, y el desequilibrio que se instala alrededor, porque quien puede cargar acaba recibiendo siempre lo que otros no cogen.",
    nucleo: "Usar una capacidad alta de esfuerzo sin que se convierta en el criterio de reparto.",
    potenciales: [
      "Sacar adelante algo que requiere más aguante del habitual.",
      "Sostener a otros en un periodo duro sin descomponerse.",
      "Terminar lo que empieza a costar de verdad.",
      "Hacer el trabajo pesado sin convertirlo en mérito.",
    ],
    tensiones: [
      "Que la capacidad de cargar se convierta en el criterio de reparto.",
      "Desgaste que aparece tarde y de golpe.",
      "Dificultad para distinguir lo que corresponde de lo que simplemente se puede.",
      "Orgullo en el aguante, que impide pedir ayuda.",
    ],
    cuandoIntegrado: [
      "Se pregunta de quién es la carga antes de cogerla.",
      "Se para antes del agotamiento, no después.",
      "Se deja que otros carguen lo suyo, aunque tarden más.",
    ],
    cuandoSobrecargado: [
      "Se asume el trabajo que otro ha dejado sin decir nada.",
      "Se llega al límite físico antes de reconocer el cansancio.",
      "Se desprecia por dentro a quien no aguanta igual.",
    ],
    patronesCotidianos: [
      "Ser quien termina la parte que nadie hizo.",
      "Que te den lo difícil porque saben que lo sacas.",
      "No notar el cansancio hasta que ya es mucho.",
      "Que te cueste pedir ayuda incluso con cosas físicas.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo se organiza alrededor de lo que se puede aguantar. Lo que falta es el criterio de lo que corresponde.",
      vinculos: "En los vínculos se carga de más y se dice de menos. El otro puede no enterarse durante años.",
      grupo: "En grupo se absorbe lo que nadie coge. Sostiene al grupo y también le impide repartirse.",
      servicio: "La aportación natural es hacer lo pesado. El límite es que hacerlo siempre impide que se reparta.",
    },
    aprendizajeCentral: "Que poder con algo no lo convierte en tuyo.",
    paradoja: "La fuerza que permite sostener a los demás es la que impide que aprendan a sostenerse.",
    preguntaUmbral: "¿Qué estás cargando que no te corresponde?",
    preguntas: [
      "¿Qué has asumido porque nadie lo cogía?",
      "¿Cuándo notas el cansancio: al empezar o cuando ya no puedes?",
      "¿A quién le estás quitando la ocasión de cargar con lo suyo?",
      "¿Qué te impide pedir ayuda con algo concreto esta semana?",
    ],
    journalPrompts: [
      "Haz una lista de lo que estás cargando. Marca de quién es cada cosa.",
      "Escribe la última vez que pediste ayuda. ¿Cuánto tardaste?",
      "¿Qué te enseñaron sobre aguantar?",
    ],
    practicaBase: {
      titulo: "Devolver una carga",
      pasos: [
        "Identifica una cosa concreta que estés haciendo y que le corresponda a otra persona.",
        "Durante los siete días, no la hagas.",
        "Si hace falta, dilo una vez, sin reproche: esto lo llevas tú.",
        "Anota qué pasó cada día y qué sentiste al no hacerlo.",
      ],
      cierre: "Al final mira si se hizo, quién lo hizo, y cuánto te costó no intervenir.",
    },
    framework144: {
      fisico: "Observa en qué momento aparece el cansancio y qué haces cuando aparece.",
      mental: "Observa si consideras si algo te corresponde antes de hacerlo.",
      espiritual: "Observa si tu valor está ligado a cuánto puedes soportar.",
    },
  },

  pegaso: {
    id: "pegaso",
    estado: "draft",
    astronomia:
      "Pegaso es una constelación del hemisferio norte reconocible por el gran cuadrado que forman cuatro estrellas, una de las cuales, Alpheratz, se asigna hoy a Andrómeda. En dirección a esta constelación se descubrió en 1995 el primer planeta en órbita alrededor de una estrella parecida al Sol, un hallazgo que abrió el estudio sistemático de los sistemas planetarios.",
    esencia: "marco amplio · lo que se descubre mirando · apertura",
    fraseUmbral: "Lo que cambia todo suele aparecer donde ya habías mirado muchas veces.",
    arquetipo:
      "Lo que se abre al volver a mirar. Donde este portal aparece marcado suele haber una disposición a revisar lo dado por sabido: se vuelve sobre un territorio conocido y se encuentra algo que estaba ahí y no se había visto. Esa disposición produce hallazgos reales, porque la mayoría de lo importante no está escondido sino desatendido. El coste es la inquietud de fondo: cuando todo puede volver a examinarse, cuesta apoyarse en algo, y la revisión permanente puede impedir construir sobre nada durante años.",
    nucleo: "Revisar lo dado por sabido sin que la revisión impida apoyarse en algo.",
    potenciales: [
      "Encontrar lo que estaba a la vista y nadie miraba.",
      "Revisar un supuesto que el entorno da por cerrado.",
      "Sostener un marco amplio donde caben cosas que no se esperaban.",
      "Cambiar de opinión con datos nuevos sin drama.",
    ],
    tensiones: [
      "Revisar tanto que no queda nada firme sobre lo que construir.",
      "Confundir mantener abierto con no decidir.",
      "Inquietud permanente por lo que aún no se ha examinado.",
      "Desatender lo evidente por buscar siempre lo no visto.",
    ],
    cuandoIntegrado: [
      "Se cierra algo a propósito sabiendo que podría reabrirse.",
      "Se distingue entre un supuesto que conviene revisar y uno que conviene usar.",
      "El hallazgo se pone en práctica, no solo se registra.",
    ],
    cuandoSobrecargado: [
      "Se reabre una decisión ya tomada, otra vez.",
      "Se acumulan hallazgos sin que ninguno cambie nada.",
      "Se desconfía de cualquier conclusión, incluida la propia.",
    ],
    patronesCotidianos: [
      "Volver sobre un tema que creías sabido y encontrar algo nuevo.",
      "Que te cueste dar algo por cerrado.",
      "Leer sobre cosas fuera de tu campo.",
      "Notar lo que otros pasan por alto en un sitio muy transitado.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo admite revisión continua. Conviene fijar algunas cosas, o no hay desde dónde mirar.",
      vinculos: "En los vínculos la apertura se agradece y la revisión constante cansa. Hay acuerdos que conviene dar por firmes.",
      grupo: "En grupo se aporta la pregunta sobre lo que nadie cuestionaba. Muy valioso en dosis.",
      servicio: "La aportación natural es abrir lo cerrado. El límite es que alguien tiene que construir sobre lo abierto.",
    },
    aprendizajeCentral: "Que dar algo por firme es una decisión, no una renuncia a pensar.",
    paradoja: "La apertura que permite descubrir es la que impide asentarse en lo descubierto.",
    preguntaUmbral: "¿Qué has decidido dar por firme, y cuándo?",
    preguntas: [
      "¿Qué decisión has reabierto más de dos veces?",
      "¿Qué hallazgo tuyo no ha cambiado nada todavía?",
      "¿Qué supuesto de tu vida no has examinado nunca?",
      "¿Sobre qué podrías construir si dejaras de revisarlo?",
    ],
    journalPrompts: [
      "Escribe tres cosas que das por firmes. ¿Las elegiste?",
      "Describe algo que descubriste volviendo a mirar.",
      "¿Qué estás reabriendo ahora mismo que ya estaba decidido?",
    ],
    practicaBase: {
      titulo: "Dar algo por cerrado",
      pasos: [
        "Elige una decisión que hayas reabierto varias veces.",
        "Escribe una frase declarando que queda cerrada durante los siete días.",
        "Cada vez que la mente vuelva a ella, anota la hora y sigue.",
        "No la revises durante la semana, pase lo que pase.",
      ],
      cierre: "Al final, cuenta cuántas veces volvió, y mira si la semana fue distinta al no estar decidiendo.",
    },
    framework144: {
      fisico: "Observa si tu cuerpo descansa cuando algo está decidido o sigue igual.",
      mental: "Observa cuántas decisiones tienes abiertas ahora mismo.",
      espiritual: "Observa si puedes sostener una certeza sabiendo que podría revisarse.",
    },
  },

  crux: {
    id: "crux",
    estado: "draft",
    astronomia:
      "La Cruz del Sur es la constelación más pequeña del cielo y una de las más reconocibles del hemisferio sur. Sus cuatro estrellas principales sirven para localizar el polo sur celeste, que no cuenta con una estrella brillante que lo señale. Gacrux, la más cercana de ellas, es la gigante roja más próxima a nosotros, a unos 88 años luz.",
    esencia: "orientación sin señal · deducir el centro · pequeño y preciso",
    fraseUmbral: "A veces hay que deducir dónde está el norte porque nada lo indica.",
    arquetipo:
      "Lo que orienta por deducción cuando no hay referencia directa. Donde este portal aparece marcado suele haber una capacidad de situarse en contextos donde nadie ha marcado el camino: no hay norma clara, no hay precedente, no hay quien diga cómo se hace, y aun así se encuentra la dirección a partir de lo que sí hay. Eso permite funcionar donde otros se bloquean. El coste es que esa deducción se hace en solitario y sin confirmación, y quien la practica mucho puede acabar sin saber ya distinguir entre haber deducido bien y haberse acostumbrado a su propia deducción.",
    nucleo: "Orientarse donde no hay referencia, buscando después la comprobación que la deducción no da.",
    potenciales: [
      "Funcionar en contextos sin norma ni precedente.",
      "Deducir la dirección a partir de indicios parciales.",
      "Hacer mucho con pocos elementos.",
      "Mantener la calma cuando falta la información que otros consideran imprescindible.",
    ],
    tensiones: [
      "Deducir sin comprobar, durante años.",
      "Acostumbrarse a la propia deducción hasta confundirla con un hecho.",
      "No pedir la referencia que sí existía.",
      "Soledad en la orientación, por no consultarla nunca.",
    ],
    cuandoIntegrado: [
      "Se deduce y después se comprueba con alguien.",
      "Se distingue entre no haber referencia y no haberla buscado.",
      "Se explica el razonamiento en vez de dar solo la conclusión.",
    ],
    cuandoSobrecargado: [
      "Se decide con información insuficiente cuando había forma de conseguirla.",
      "Se da por cierta una deducción antigua sin revisarla.",
      "Se trabaja en solitario en algo que pedía consulta.",
    ],
    patronesCotidianos: [
      "Apañarte en sitios donde nadie te ha explicado nada.",
      "Deducir cómo funciona algo en vez de preguntar.",
      "Que te pongan en situaciones nuevas porque te desenvuelves.",
      "Darte cuenta tarde de que existía un manual.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo se sostiene en deducciones propias. Conviene contrastar las principales cada cierto tiempo.",
      vinculos: "En los vínculos se deduce lo que el otro siente en vez de preguntarlo. Ahí la deducción falla más de lo que parece.",
      grupo: "En grupo se aporta dirección donde no la había. Conviene mostrar el razonamiento, o parece arbitrario.",
      servicio: "La aportación natural es orientar en lo incierto. El límite es no convertir la incertidumbre en un sitio donde nadie más puede entrar.",
    },
    aprendizajeCentral: "Que deducir bien y comprobar son dos pasos, y saltarse el segundo convierte el primero en costumbre.",
    paradoja: "Quien mejor se orienta sin referencias es quien menos las busca cuando existen.",
    preguntaUmbral: "¿Qué has deducido sobre alguien y no le has preguntado nunca?",
    preguntas: [
      "¿Qué das por sabido sin haberlo comprobado?",
      "¿Dónde preferiste deducir antes que preguntar?",
      "¿Qué referencia existía y no buscaste?",
      "¿A quién le podrías explicar tu razonamiento en vez de tu conclusión?",
    ],
    journalPrompts: [
      "Escribe algo que crees sobre una persona cercana. ¿Se lo has preguntado?",
      "Describe una situación en la que te orientaste sin ayuda. ¿Qué usaste?",
      "¿Qué preguntarías si no te costara nada preguntar?",
    ],
    practicaBase: {
      titulo: "Preguntar en vez de deducir",
      pasos: [
        "Durante siete días, cada vez que deduzcas algo sobre lo que otra persona siente o quiere, no lo des por hecho.",
        "Pregúntaselo directamente, con una pregunta simple.",
        "Anota tu deducción antes de preguntar y la respuesta después.",
        "No corrijas la deducción anotada.",
      ],
      cierre: "Al final, cuenta en cuántos casos coincidieron. La proporción es el dato.",
    },
    framework144: {
      fisico: "Observa si tu cuerpo se tensa al pedir información que crees que deberías saber.",
      mental: "Observa cuántas de tus certezas sobre otros son deducciones.",
      espiritual: "Observa si puedes avanzar sabiendo que no tienes la dirección confirmada.",
    },
  },

  centaurus: {
    id: "centaurus",
    estado: "draft",
    astronomia:
      "Centauro es una constelación amplia del hemisferio sur que rodea parcialmente a la Cruz del Sur. Su estrella Hadar, también llamada Agena, es una gigante azul situada a unos 390 años luz y una de las más brillantes del cielo. Junto con Rigil Kentaurus forma el par de punteros que se utiliza para localizar la Cruz del Sur.",
    esencia: "doble naturaleza · instinto y criterio · convivencia interna",
    fraseUmbral: "Convivir contigo mismo no significa estar de acuerdo contigo.",
    arquetipo:
      "Lo que reúne dos naturalezas que no se llevan del todo. Donde este portal aparece marcado suele haber una convivencia interna entre lo que se quiere hacer y lo que se considera correcto hacer, entre impulso y criterio, y la sensación de que ambas partes son igual de propias. Eso da un conocimiento honesto de uno mismo, sin la comodidad de haber elegido un lado. El coste es el desgaste de la negociación permanente, y la tentación de resolverla silenciando una de las dos, que es la manera más rápida de que esa parte aparezca después, y peor.",
    nucleo: "Sostener dos partes propias que no se llevan bien, sin silenciar ninguna.",
    potenciales: [
      "Conocerse sin idealización.",
      "Reconocer un impulso sin tener que obedecerlo ni condenarlo.",
      "Entender a quien está dividido, porque se está.",
      "Decidir sabiendo qué parte queda sin atender.",
    ],
    tensiones: [
      "Silenciar una de las dos partes, que después vuelve peor.",
      "Desgaste por negociar internamente cada decisión.",
      "Juzgarse por tener un impulso, no por lo que se hace con él.",
      "Parálisis cuando ninguna de las dos cede.",
    ],
    cuandoIntegrado: [
      "Se reconoce el impulso sin actuarlo y sin castigarse por tenerlo.",
      "Se decide y se acepta que una parte queda insatisfecha.",
      "Las dos partes se usan: una para ver, otra para sostener.",
    ],
    cuandoSobrecargado: [
      "Se actúa un impulso que se estaba negando, de golpe.",
      "Se aplaza una decisión indefinidamente por no poder contentar a ambas partes.",
      "Se vive una parte de uno mismo como enemiga.",
    ],
    patronesCotidianos: [
      "Querer una cosa y creer que deberías querer otra.",
      "Discutir contigo mismo antes de decisiones pequeñas.",
      "Sorprenderte de algo que has hecho.",
      "Entender bien a gente contradictoria.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo es de convivencia, no de unidad. Aceptarlo reduce la mitad del desgaste.",
      vinculos: "En los vínculos puede aparecer una alternancia que al otro le desconcierta. Nombrarla ayuda mucho.",
      grupo: "En grupo se entiende a las posiciones contrarias a la vez. Útil para mediar, difícil para posicionarse.",
      servicio: "La aportación natural es no simplificar a la gente. El límite es que a veces hay que decidir igualmente.",
    },
    aprendizajeCentral: "Que tener un impulso y actuarlo son cosas distintas, y que juzgarse por el primero impide manejar el segundo.",
    paradoja: "Las dos partes que se desgastan mutuamente son las que juntas dan una mirada completa.",
    preguntaUmbral: "¿Qué parte de ti has silenciado, y desde cuándo?",
    preguntas: [
      "¿Qué quieres que crees que no deberías querer?",
      "¿Qué decisión llevas aplazada porque ninguna opción te deja entero?",
      "¿Qué impulso tuyo condenas en vez de manejar?",
      "¿Qué haría la parte de ti que menos escuchas?",
    ],
    journalPrompts: [
      "Escribe las dos posiciones que discuten dentro de ti sobre algo concreto. Dale voz entera a cada una.",
      "Describe algo que hiciste y te sorprendió.",
      "¿Qué parte de ti no le has mostrado a nadie?",
    ],
    practicaBase: {
      titulo: "Dar voz a las dos partes",
      pasos: [
        "Elige una decisión o tensión interna que lleve tiempo contigo.",
        "Durante siete días, dedica un día alterno a cada parte.",
        "Ese día escribe solo desde esa parte, sin corregirla ni matizarla.",
        "No busques conclusión durante la semana.",
      ],
      cierre: "Al séptimo día lee las dos series seguidas. Mira qué pide cada parte realmente, que suele no ser lo que decía.",
    },
    framework144: {
      fisico: "Observa dónde se nota físicamente la tensión entre lo que quieres y lo que crees que deberías.",
      mental: "Observa cuánto tiempo al día dedicas a discutir contigo.",
      espiritual: "Observa si puedes aceptar entera una parte de ti que no te gusta.",
    },
  },

  libra: {
    id: "libra",
    estado: "draft",
    astronomia:
      "Libra es una constelación zodiacal del hemisferio sur celeste. Sus dos estrellas principales, Zubenelgenubi y Zubeneschamali, conservan nombres árabes que significan pinza del sur y pinza del norte: en la Antigüedad se consideraban parte de la constelación de Escorpio, y solo después pasaron a formar una constelación propia.",
    esencia: "equilibrio activo · reparto · lo que se pesa cada vez",
    fraseUmbral: "El equilibrio no es un punto: es algo que se corrige continuamente.",
    arquetipo:
      "Lo que busca proporción entre partes que no la tienen sola. Donde este portal aparece marcado suele haber una atención constante al reparto: quién ha hablado, quién ha cedido, si lo dado y lo recibido se parecen. Esa atención produce entornos más justos y una percepción fina del desequilibrio antes de que estalle. El coste es que el equilibrio exige corregir sin parar, y quien se ocupa de corregirlo suele hacerlo también en su propia contra: se cede un poco de más para compensar, y ese poco repetido acaba siendo la mayor desproporción de todas.",
    nucleo: "Sostener el reparto justo sin que el propio lado sea siempre el que cede.",
    potenciales: [
      "Notar un desequilibrio antes de que se convierta en conflicto.",
      "Hacer que en una conversación quepan todos.",
      "Repartir sin que nadie sienta que perdió.",
      "Sostener dos versiones de un conflicto sin descartar ninguna.",
    ],
    tensiones: [
      "Ceder un poco de más para compensar, de forma repetida.",
      "Confundir equilibrio con que nadie se moleste.",
      "Aplazar la propia posición hasta que ya no haya sitio para ella.",
      "Cansancio de corregir continuamente un reparto que otros no miran.",
    ],
    cuandoIntegrado: [
      "Se incluye el propio lado en el reparto.",
      "Se acepta que una decisión justa puede molestar.",
      "Se deja un desequilibrio menor sin corregirlo.",
    ],
    cuandoSobrecargado: [
      "Se cede en algo propio para evitar tensión.",
      "Se media en un conflicto que no se pidió mediar.",
      "Se acumula una desproporción a favor de otros que nadie ve.",
    ],
    patronesCotidianos: [
      "Contar mentalmente quién ha hablado más en una reunión.",
      "Ceder el turno, la elección o el sitio casi siempre.",
      "Incomodidad física ante una injusticia pequeña.",
      "Que te toque repartir cuando hay algo que repartir.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo suele quedar fuera del reparto que se administra. Incluirse es el trabajo.",
      vinculos: "En los vínculos se busca reciprocidad. Conviene decirla en voz alta antes de que se acumule.",
      grupo: "En grupo se es quien equilibra. Función invisible y constante.",
      servicio: "La aportación natural es que las cosas sean proporcionadas. El límite es incluirse en la proporción.",
    },
    aprendizajeCentral: "Que un reparto que deja a uno fuera no es un reparto justo, aunque lo administre uno mismo.",
    paradoja: "Quien más atiende al equilibrio es quien más fácilmente queda descompensado.",
    preguntaUmbral: "¿Estás dentro del reparto que administras?",
    preguntas: [
      "¿Dónde has cedido de más esta semana?",
      "¿Qué desequilibrio llevas tiempo corrigiendo tú solo?",
      "¿Qué preferirías que no molestara a nadie y aun así hay que decir?",
      "¿Qué pedirías si supieras que no se rompe nada?",
    ],
    journalPrompts: [
      "Haz dos columnas sobre un vínculo importante: lo que das y lo que recibes.",
      "Escribe algo que cediste y no querías ceder.",
      "¿Qué pasaría si dejaras de corregir un desequilibrio pequeño?",
    ],
    practicaBase: {
      titulo: "Incluirse en el reparto",
      pasos: [
        "Durante siete días, en cada situación donde se reparta algo —tiempo, turno, elección—, cuenta también tu parte.",
        "Al menos una vez al día, elige tú primero.",
        "Anota qué elegiste y qué sentiste al hacerlo.",
        "Anota también si alguien lo notó.",
      ],
      cierre: "Al final, mira cuántos de los siete días conseguiste elegir primero, y qué te lo impidió los otros.",
    },
    framework144: {
      fisico: "Observa la reacción física ante una injusticia pequeña, propia o ajena.",
      mental: "Observa cuánto de tu atención mide continuamente el reparto.",
      espiritual: "Observa si mereces, en tu propio criterio, lo mismo que defiendes para otros.",
    },
  },
}
