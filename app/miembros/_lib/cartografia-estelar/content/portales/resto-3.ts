// CARTOGRAFÍA ESTELAR 144 — portales 31 a 40.
//
// CAPA B, salvo `astronomia`.
//
// El tipo de objeto cambia el registro. Una nebulosa es una región donde las
// estrellas se forman o se deshacen: se escribe en clave de gestación y
// transición, no de carácter. Una galaxia se escribe en clave de escala.

import type { ContenidoPortal } from "../tipos"

export const PORTALES_RESTO_3: Record<string, ContenidoPortal> = {
  hydra: {
    id: "hydra",
    estado: "reviewed",
    astronomia:
      "Hidra es la constelación más extensa del cielo: se despliega a lo largo de más de cien grados, de modo que sus extremos nunca resultan visibles a la vez desde un mismo lugar y momento. Su única estrella brillante, Alphard, es una gigante anaranjada situada a unos 177 años luz en una región del cielo notablemente vacía, lo que le valió un nombre árabe que significa la solitaria.",
    esencia: "extensión · lo que no se abarca de una vez · continuidad larga",
    fraseUmbral: "Hay cosas tuyas que no puedes ver enteras desde ningún sitio.",
    arquetipo:
      "Lo que se extiende más allá de lo que cabe en una mirada. Donde este portal aparece marcado suele haber un proceso vital largo que no se deja resumir: algo que atraviesa décadas, que cambia de forma por el camino y del que solo se ve un tramo cada vez. Eso da constancia y una relación poco ansiosa con el tiempo. El coste es la dificultad para evaluarse: sin poder ver el conjunto, se juzga el todo por el tramo presente, y un tramo malo se confunde con un fracaso general cuando solo es una parte de algo mucho más largo.",
    nucleo: "Sostener un proceso largo sin juzgar el conjunto por el tramo que se está atravesando.",
    potenciales: [
      "Sostener algo durante décadas sin necesitar resultados por temporada.",
      "Reconocer que un mal momento no define un proceso entero.",
      "Aceptar que algo cambie de forma por el camino.",
      "Construir sobre lo que se hizo hace mucho.",
    ],
    tensiones: [
      "Juzgar la vida entera por el tramo actual.",
      "No poder explicar a otros en qué consiste lo que haces.",
      "Perder de vista el principio y dudar de si sigue siendo lo mismo.",
      "Confundir continuidad con no haber decidido nunca.",
    ],
    cuandoIntegrado: [
      "Se mira hacia atrás con regularidad para recuperar el conjunto.",
      "Se acepta un tramo difícil sin revisar la dirección entera.",
      "Se explica lo que se hace por el tramo actual, sin exigirse resumirlo todo.",
    ],
    cuandoSobrecargado: [
      "Se concluye que nada ha servido a partir de unos meses malos.",
      "Se abandona un proceso largo en su peor tramo.",
      "Se sigue por inercia sin comprobar si sigue siendo lo mismo.",
    ],
    patronesCotidianos: [
      "Que te cueste responder a en qué estás trabajando.",
      "Reconocer en algo actual una decisión de hace quince años.",
      "Sentir que llevas toda la vida en lo mismo con formas distintas.",
      "Encontrar notas antiguas y ver la misma pregunta.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo mejora al mirar el tramo largo. Lo que falta suele ser registro, no perspectiva.",
      vinculos: "En los vínculos conviene no pedir al otro que vea el conjunto que tú tampoco ves.",
      grupo: "En grupo se aporta continuidad. Puede parecer lentitud a quien mide por trimestres.",
      servicio: "La aportación natural es sostener algo más allá de los ciclos cortos. El límite es comprobar de vez en cuando que sigue vivo.",
    },
    aprendizajeCentral: "Que un proceso largo necesita memoria propia, porque nadie más lleva el registro.",
    paradoja: "Lo que da sentido al conjunto solo se ve desde fuera, y de tu vida no puedes salir.",
    preguntaUmbral: "¿Qué llevas haciendo, con formas distintas, desde hace más años de los que crees?",
    preguntas: [
      "¿Qué tramo estás atravesando y qué estás concluyendo de él?",
      "¿Qué decisión antigua sigue operando en tu vida ahora?",
      "¿Cómo sabrías si esto sigue siendo lo mismo o ya es otra cosa?",
      "¿Qué registro llevas de tu propio recorrido?",
    ],
    journalPrompts: [
      "Escribe qué hacías hace diez años. ¿Qué se parece a lo de ahora?",
      "Describe el tramo actual. ¿Es el proceso o es el tramo?",
      "¿Qué pregunta llevas repitiendo desde siempre?",
    ],
    practicaBase: {
      titulo: "Recuperar el conjunto",
      pasos: [
        "Durante siete días, dedica cada día diez minutos a un año distinto de tu vida, de los últimos siete.",
        "Escribe en tres líneas qué hacías y qué te importaba ese año.",
        "No valores si fue bueno o malo.",
        "El séptimo día lee los siete seguidos.",
      ],
      cierre: "Mira qué aparece en más de cuatro de los siete años. Eso es el proceso largo.",
    },
    framework144: {
      fisico: "Observa qué hábitos tuyos llevan más de diez años contigo.",
      mental: "Observa si juzgas tu vida entera por cómo va este mes.",
      espiritual: "Observa si puedes confiar en una dirección que no ves entera.",
    },
  },

  corvus: {
    id: "corvus",
    estado: "reviewed",
    astronomia:
      "Cuervo es una constelación pequeña del hemisferio sur celeste, formada por cuatro estrellas que dibujan un cuadrilátero compacto y fácilmente reconocible pese a su tamaño modesto. Gienah, la más brillante, se encuentra a unos 154 años luz, y Algorab es un sistema doble.",
    esencia: "señal breve · mensaje que llega · lo que se dice y se va",
    fraseUmbral: "Una frase corta puede quedarse años en alguien.",
    arquetipo:
      "Lo que comunica en poco espacio. Donde este portal aparece marcado suele haber una capacidad de decir algo exacto y breve, en el momento en que se puede oír: una observación que ordena una situación entera, un comentario que alguien recuerda años después. Eso tiene un efecto desproporcionado respecto al esfuerzo. El coste es el mismo mecanismo en negativo: una frase corta dicha en mal momento se clava igual de hondo, y quien tiene esa puntería rara vez mide el alcance de lo que suelta, porque a él le pareció un comentario.",
    nucleo: "Decir poco y exacto, midiendo que lo mismo que ordena también puede herir.",
    potenciales: [
      "Nombrar en una frase lo que otros no lograban explicar.",
      "Decir algo en el momento en que puede ser oído.",
      "Sintetizar sin perder lo esencial.",
      "Dar una devolución honesta que sirva de verdad.",
    ],
    tensiones: [
      "No medir el alcance de un comentario que a uno le pareció menor.",
      "La exactitud sin cuidado del momento.",
      "Usar la puntería verbal cuando se está herido.",
      "Que la gente recuerde algo que dijiste y ya no piensas.",
    ],
    cuandoIntegrado: [
      "Se elige el momento además del contenido.",
      "Se pregunta si lo que se va a decir sirve a quien lo escucha.",
      "Se repara lo dicho cuando cayó mal, sin desdecirse de lo cierto.",
    ],
    cuandoSobrecargado: [
      "Se suelta una verdad exacta en el peor momento.",
      "Se responde con ironía a algo que dolía.",
      "Se corrige a alguien en público por precisión.",
    ],
    patronesCotidianos: [
      "Que alguien te cite una frase tuya de hace años.",
      "Cerrar una discusión con una sola observación.",
      "Que te digan que a veces eres muy directo.",
      "Notar rápido el punto débil de un argumento.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo puede tener el mismo filo. Conviene comprobar cómo te hablas cuando fallas.",
      vinculos: "En los vínculos la franqueza se agradece y el momento importa más que el contenido.",
      grupo: "En grupo se aporta claridad. Conviene reservar la puntería para cuando ayuda.",
      servicio: "La aportación natural es nombrar lo que estaba difuso. El límite es que nombrar tiene consecuencias en quien escucha.",
    },
    aprendizajeCentral: "Que la verdad dicha en mal momento hace el trabajo de una mentira.",
    paradoja: "La puntería que ordena una situación es la que más daño hace cuando falla el momento.",
    preguntaUmbral: "¿Qué dijiste que alguien sigue recordando?",
    preguntas: [
      "¿Qué comentario tuyo cayó peor de lo que esperabas?",
      "¿Qué verdad estás guardando por no encontrar el momento?",
      "¿Cómo te hablas a ti cuando te equivocas?",
      "¿Qué dirías si tuvieras que decirlo cuidando a quien escucha?",
    ],
    journalPrompts: [
      "Escribe algo cierto que dijiste y salió mal. ¿Qué habría cambiado el momento?",
      "Describe algo que alguien te dijo en una frase y te cambió.",
      "¿Qué llevas sin decir y pesa?",
    ],
    practicaBase: {
      titulo: "Elegir el momento",
      pasos: [
        "Durante siete días, antes de decir algo directo, espera hasta el final de la conversación.",
        "Comprueba entonces si sigue haciendo falta decirlo.",
        "Si hace falta, dilo. Si no, anótalo.",
        "Registra cada día cuántas veces lo dijiste y cuántas no.",
      ],
      cierre: "Al final, mira cuántas de las que no dijiste seguían pareciéndote necesarias al día siguiente.",
    },
    framework144: {
      fisico: "Observa el impulso físico de responder rápido cuando algo te parece impreciso.",
      mental: "Observa cuánto tardas en detectar el fallo de un argumento.",
      espiritual: "Observa si puedes callar algo cierto por cuidado y no por miedo.",
    },
  },

  phoenix: {
    id: "phoenix",
    estado: "reviewed",
    astronomia:
      "Fénix es una constelación del hemisferio sur, una de las que los navegantes neerlandeses cartografiaron a finales del siglo XVI: no procede de la tradición antigua, sino de la exploración de cielos que en Europa no se habían registrado. Su estrella principal, Ankaa, es una gigante anaranjada a unos 85 años luz.",
    esencia: "recomenzar · lo que se rehace distinto · después de la pérdida",
    fraseUmbral: "Volver a empezar no es volver al principio.",
    arquetipo:
      "Lo que se reconstruye después de perderse. Donde este portal aparece marcado suele haber al menos una interrupción de fondo —algo que se acabó, se rompió o se tuvo que dejar— y la experiencia de haber construido después sobre ese terreno. Eso deja un conocimiento práctico poco común: se sabe que se puede rehacer, y eso quita miedo a decisiones que a otros los paralizan. El coste es la tentación de convertir el reinicio en método: cuando rehacer resulta más familiar que sostener, se empieza a preferir romper antes que atravesar lo difícil.",
    nucleo: "Saber que se puede recomenzar, sin que recomenzar se convierta en la salida habitual.",
    potenciales: [
      "Volver a levantar algo después de una pérdida.",
      "Decidir sin el miedo que paraliza a quien no ha perdido nada.",
      "Acompañar a otros en una ruptura sin minimizarla.",
      "Rehacer distinto, no igual.",
    ],
    tensiones: [
      "Preferir romper a atravesar lo difícil.",
      "Confundir cambiar de escenario con haber cambiado algo.",
      "Que la historia de lo perdido ocupe el sitio de lo que hay ahora.",
      "No dejar que nada se asiente, por si acaso.",
    ],
    cuandoIntegrado: [
      "Se distingue entre algo que hay que terminar y algo que hay que atravesar.",
      "Se construye sobre lo anterior en vez de borrarlo.",
      "Se sostiene algo largo sin necesitar el reinicio.",
    ],
    cuandoSobrecargado: [
      "Se abandona algo bueno al primer tramo difícil.",
      "Se empieza de cero otra vez, en otro sitio, con el mismo patrón.",
      "Se cuenta lo perdido más de lo que se vive lo presente.",
    ],
    patronesCotidianos: [
      "Haber cambiado de ciudad, trabajo o vida más veces que la mayoría.",
      "Saber montar algo desde nada.",
      "Que la gente te vea fuerte por lo que pasaste.",
      "Costarte que algo dure sin que te inquiete.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo incluye una parte que sabe sobrevivir. Conviene que no sea la única disponible.",
      vinculos: "En los vínculos el riesgo es cortar antes que reparar. Reparar es la destreza que falta desarrollar.",
      grupo: "En grupo se aporta la certeza de que se puede rehacer. Estabiliza en las crisis.",
      servicio: "La aportación natural es acompañar a quien ha perdido algo. El límite es no convertir la pérdida en identidad compartida.",
    },
    aprendizajeCentral: "Que reparar es más difícil que rehacer, y que casi siempre es lo que hacía falta.",
    paradoja: "Saber que puedes recomenzar es lo que te permite decidir sin miedo, y lo que hace que no te quedes.",
    preguntaUmbral: "¿Qué estás a punto de romper en lugar de reparar?",
    preguntas: [
      "¿Cuántas veces has empezado de cero, y qué se repitió?",
      "¿Qué has reparado alguna vez en lugar de dejarlo?",
      "¿Qué te inquieta de que algo dure?",
      "¿Qué parte de lo anterior te llevaste, y cuál dejaste a propósito?",
    ],
    journalPrompts: [
      "Escribe lo que perdiste y lo que construiste después. ¿Qué es distinto y qué se repitió?",
      "Describe algo que reparaste en vez de abandonar.",
      "¿Qué estás sosteniendo ahora que te pide aguantar en lugar de cambiar?",
    ],
    practicaBase: {
      titulo: "Reparar en vez de rehacer",
      pasos: [
        "Elige una cosa que estés considerando dejar: un proyecto, una rutina, una conversación pendiente.",
        "Durante siete días trabaja en repararla, no en sustituirla.",
        "Anota cada día un arreglo concreto que hiciste, por pequeño que sea.",
        "No tomes ninguna decisión de abandono durante la semana.",
      ],
      cierre: "Al final, decide con la información de los siete días, no con la de antes de empezar.",
    },
    framework144: {
      fisico: "Observa qué hace tu cuerpo cuando algo se vuelve difícil y aparece la opción de irte.",
      mental: "Observa cuánto piensas en empezar algo nuevo mientras estás en algo actual.",
      espiritual: "Observa si tu sentido de fuerza necesita haber perdido algo para sostenerse.",
    },
  },

  grus: {
    id: "grus",
    estado: "reviewed",
    astronomia:
      "Grulla es una constelación del hemisferio sur, cartografiada también por los navegantes neerlandeses del siglo XVI a partir de estrellas que antes se asignaban al Pez Austral. Su estrella principal, Alnair, es una estrella azul situada a unos 101 años luz.",
    esencia: "migración · dejar un sitio a tiempo · lectura de la estación",
    fraseUmbral: "Irse a tiempo y huir se parecen solo desde fuera.",
    arquetipo:
      "Lo que sabe cuándo cambiar de sitio. Donde este portal aparece marcado suele haber una sensibilidad a los cambios de ciclo: se nota cuándo un entorno ha dejado de dar lo que daba, cuándo una etapa se ha agotado, cuándo conviene moverse antes de que la situación obligue. Eso evita muchos desgastes largos. El coste es que la misma señal puede dispararse por incomodidad pasajera, y entonces lo que era buena lectura del momento se convierte en no haber llegado a ningún sitio del todo, porque irse siempre a tiempo también es irse siempre.",
    nucleo: "Leer cuándo una etapa ha terminado, distinguiendo esa señal de la incomodidad pasajera.",
    potenciales: [
      "Dejar un sitio antes de que el desgaste sea grande.",
      "Reconocer el final de una etapa sin dramatizarlo.",
      "Moverse con lo necesario y sin arrastrar.",
      "Empezar en un sitio nuevo sin tardar meses en estar.",
    ],
    tensiones: [
      "Confundir incomodidad pasajera con fin de ciclo.",
      "No llegar a estar del todo en ningún sitio.",
      "Dejar relaciones a medias por haberse movido a tiempo.",
      "Movimiento como respuesta automática a cualquier fricción.",
    ],
    cuandoIntegrado: [
      "Se distingue una señal de ciclo de una reacción del momento.",
      "Se cierra bien lo que se deja, incluidas las personas.",
      "Se elige quedarse alguna vez, a propósito.",
    ],
    cuandoSobrecargado: [
      "Se empieza a mirar la salida a la primera dificultad.",
      "Se acumulan sitios y vínculos dejados sin cerrar.",
      "Se justifica cada marcha con una lectura de ciclo.",
    ],
    patronesCotidianos: [
      "Notar meses antes que vas a dejar algo.",
      "Que te cueste tener cosas pesadas o compromisos largos.",
      "Irte de sitios sin despedidas largas.",
      "Sentirte cómodo empezando en lugares nuevos.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo viaja bien. Conviene comprobar qué se deja atrás cada vez.",
      vinculos: "En los vínculos lo que falta suele ser cierre, no continuidad. Cerrar bien permite volver.",
      grupo: "En grupo se aporta la lectura de que algo terminó. Incómoda y útil.",
      servicio: "La aportación natural es detectar el momento de cambiar. El límite es no estar el tiempo suficiente para verificarlo.",
    },
    aprendizajeCentral: "Que quedarse también es una lectura del momento, y la más difícil de hacer.",
    paradoja: "Quien lee bien cuándo irse puede no aprender nunca qué pasa si se queda.",
    preguntaUmbral: "¿Qué dejaste sin cerrar al irte?",
    preguntas: [
      "¿Qué te hace saber que una etapa terminó, y cuántas veces has acertado?",
      "¿Qué relación quedó a medias porque te moviste?",
      "¿Qué ocurriría si te quedaras un año más donde estás?",
      "¿Qué es incomodidad y qué es señal, en lo que sientes ahora?",
    ],
    journalPrompts: [
      "Haz una lista de los sitios que dejaste. Marca los que cerraste bien.",
      "Escribe qué señales notas antes de querer irte.",
      "¿Qué tendrías que aguantar para comprobar si esto funciona?",
    ],
    practicaBase: {
      titulo: "Cerrar algo abierto",
      pasos: [
        "Elige una relación o un sitio que dejaste sin cerrar.",
        "Durante los siete días, escribe qué quedó pendiente ahí.",
        "El quinto día, cierra lo que dependa de ti: un mensaje, una llamada, una devolución.",
        "Anota qué pasó y qué sentiste.",
      ],
      cierre: "Al final, mira si cerrar cambió algo en tu manera de estar en lo actual.",
    },
    framework144: {
      fisico: "Observa qué señales físicas preceden a tu decisión de irte.",
      mental: "Observa cuántas veces al mes piensas en cambiar de situación.",
      espiritual: "Observa si puedes echar raíz sin sentir que pierdes libertad.",
    },
  },

  aquarius: {
    id: "aquarius",
    estado: "reviewed",
    astronomia:
      "Acuario es una constelación zodiacal de estrellas poco brillantes. Esa apariencia tenue es engañosa: sus dos principales, Sadalsuud y Sadalmelik, son supergigantes muy luminosas que se encuentran a más de quinientos años luz, de modo que su débil brillo aparente se debe únicamente a la distancia.",
    esencia: "lo que se aporta sin verse · distancia · brillo no evidente",
    fraseUmbral: "Lo que parece poco a veces solo está lejos.",
    arquetipo:
      "Lo que vale más de lo que aparenta desde donde se mira. Donde este portal aparece marcado suele haber una desproporción entre el efecto real y el reconocimiento recibido: se aporta algo sustancial que desde fuera se lee como menor, bien por la distancia con quien lo evalúa, bien porque la forma no coincide con lo que el entorno considera valioso. Eso enseña a trabajar sin depender del juicio ajeno. El coste es que la falta de devolución termina calando, y se puede acabar aceptando como propia una valoración que solo describía la distancia del observador.",
    nucleo: "Sostener el propio valor cuando el entorno no lo registra, sin renunciar a que se vea.",
    potenciales: [
      "Trabajar bien sin depender del reconocimiento del entorno.",
      "Valorar en otros lo que el grupo no está mirando.",
      "Aportar de una forma que no encaja con lo esperado y sostenerla.",
      "Saber que la evaluación ajena dice tanto del que mira como de lo mirado.",
    ],
    tensiones: [
      "Que la falta de devolución acabe calando como valoración propia.",
      "Renunciar a mostrar lo que se hace, y confirmar el malentendido.",
      "Resentimiento silencioso con quien no ve.",
      "Confundir no ser visto con no valer.",
    ],
    cuandoIntegrado: [
      "Se busca a quien sí puede ver lo que se hace.",
      "Se muestra el trabajo sin pedir permiso.",
      "El criterio propio de valor es explícito y no depende del eco.",
    ],
    cuandoSobrecargado: [
      "Se deja de mostrar lo que se hace, y después se lamenta que nadie lo conozca.",
      "Se acumula agravio con un entorno al que nunca se le dijo nada.",
      "Se baja la propia estimación hasta el nivel del reconocimiento recibido.",
    ],
    patronesCotidianos: [
      "Que te valoren por algo secundario y no por lo que haces mejor.",
      "Hacer un trabajo de fondo que nadie sabe que existe.",
      "Que alguien de fuera vea enseguida lo que los de cerca no ven.",
      "Costarte hablar de lo que haces.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo necesita un criterio propio de valor escrito, o lo ocupa el ajeno.",
      vinculos: "En los vínculos conviene decir lo que se hace, aunque parezca innecesario. Nadie lo deduce.",
      grupo: "En grupo se aporta algo que el grupo puede no saber nombrar. Nombrarlo uno mismo ayuda.",
      servicio: "La aportación natural es la que no busca eco. El límite es que sin eco tampoco se puede corregir.",
    },
    aprendizajeCentral: "Que mostrar lo que haces no es pedir aprobación: es dar la información que falta.",
    paradoja: "La independencia del reconocimiento es lo que permite hacerlo bien y lo que hace que no se sepa.",
    preguntaUmbral: "¿Qué haces que nadie sabe que haces?",
    preguntas: [
      "¿Quién ve lo que realmente aportas?",
      "¿Qué has dejado de mostrar y después has echado en falta que se conociera?",
      "¿Cuál es tu criterio propio de valor, dicho en una frase?",
      "¿A quién no le has contado en qué trabajas de verdad?",
    ],
    journalPrompts: [
      "Escribe lo que aportas y que no se ve. Sin quejarte.",
      "Describe a alguien que sí vio algo tuyo. ¿Qué tenía?",
      "¿Qué te dirías si evaluaras tu trabajo tú mismo?",
    ],
    practicaBase: {
      titulo: "Decir lo que haces",
      pasos: [
        "Durante siete días, cuenta a una persona distinta cada día algo concreto que estés haciendo.",
        "Sin adornarlo y sin restarle importancia.",
        "No pidas opinión ni esperes reacción.",
        "Anota a quién se lo contaste y qué te costó.",
      ],
      cierre: "Al final, mira cuántas de esas personas no tenían ni idea, y qué dice eso.",
    },
    framework144: {
      fisico: "Observa qué hace tu cuerpo al hablar de tu propio trabajo.",
      mental: "Observa cuánto de tu valoración sobre ti depende de lo recibido este mes.",
      espiritual: "Observa si puedes considerar valioso algo que nadie confirma.",
    },
  },

  capricornus: {
    id: "capricornus",
    estado: "reviewed",
    astronomia:
      "Capricornio es una de las constelaciones zodiacales de menor tamaño y brillo. Su estrella más destacada, Deneb Algedi, se encuentra a unos 39 años luz y es un sistema binario eclipsante: sus componentes se ocultan mutuamente de forma periódica, produciendo una leve variación de brillo.",
    esencia: "ascenso lento · terreno firme · paso a paso",
    fraseUmbral: "Subir despacio también es subir, y además se sostiene.",
    arquetipo:
      "Lo que avanza por acumulación y no por salto. Donde este portal aparece marcado suele haber una relación con el esfuerzo que no busca atajos: se construye paso a paso, se comprueba cada apoyo antes de cargar el peso, y se llega tarde a sitios donde otros llegaron rápido y se cayeron. Eso produce resultados que aguantan. El coste es el tiempo y la comparación: durante años el avance no se ve desde fuera, y quien avanza así puede interpretar como fracaso una lentitud que en realidad es el método funcionando.",
    nucleo: "Avanzar por acumulación sin interpretar la lentitud como fracaso.",
    potenciales: [
      "Construir algo que aguanta porque está bien apoyado.",
      "Sostener un esfuerzo largo sin necesitar recompensa frecuente.",
      "Comprobar cada paso antes de cargar sobre él.",
      "Llegar tarde y quedarse.",
    ],
    tensiones: [
      "Interpretar como fracaso una lentitud que es el método.",
      "Compararse con quien va rápido por otro camino.",
      "Rigidez: no aprovechar una oportunidad por no estar en el plan.",
      "Aplazar el disfrute hasta un punto de llegada que se mueve.",
    ],
    cuandoIntegrado: [
      "Se reconoce el avance aunque no se vea desde fuera.",
      "Se toma un atajo cuando existe de verdad.",
      "Se disfruta el tramo, no solo la llegada.",
    ],
    cuandoSobrecargado: [
      "Se aplaza cualquier descanso hasta terminar algo que no termina.",
      "Se rechaza una oportunidad por no encajar en el plan.",
      "Se mide el propio valor por lo conseguido.",
    ],
    patronesCotidianos: [
      "Conseguir cosas que llevaban años en marcha y no celebrarlas.",
      "Desconfiar de lo que llega fácil.",
      "Tener un plan a varios años y cumplirlo.",
      "Costarte parar cuando todavía falta.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo se mide por logros. Conviene añadir otra medida, o nunca es suficiente.",
      vinculos: "En los vínculos la constancia es el aporte. El riesgo es aplazar lo afectivo hasta tener tiempo.",
      grupo: "En grupo se es quien sostiene el plan. Puede resultar rígido cuando la situación cambia.",
      servicio: "La aportación natural es construir cosas duraderas. El límite es no vivir siempre en la obra.",
    },
    aprendizajeCentral: "Que el punto de llegada se mueve siempre, y que si el disfrute espera a llegar, no llega.",
    paradoja: "La paciencia que permite construir algo sólido es la que aplaza indefinidamente habitarlo.",
    preguntaUmbral: "¿Qué estás aplazando hasta que termines algo que no va a terminar?",
    preguntas: [
      "¿Qué has conseguido y no has celebrado?",
      "¿Qué oportunidad rechazaste por no estar en el plan?",
      "¿Con quién te comparas, y va por tu mismo camino?",
      "¿Qué disfrutarías esta semana sin haberlo ganado?",
    ],
    journalPrompts: [
      "Haz una lista de lo que has conseguido en cinco años. Sin minimizar.",
      "Escribe qué estás esperando para permitirte algo.",
      "¿Qué te enseñaron sobre merecer?",
    ],
    practicaBase: {
      titulo: "Reconocer el avance",
      pasos: [
        "Durante siete días, anota cada noche una cosa que avanzó ese día, por pequeña que sea.",
        "No anotes lo que falta.",
        "El cuarto día, haz algo que disfrutes sin haberlo ganado.",
        "Anota qué sentiste al hacerlo.",
      ],
      cierre: "Al séptimo día lee las siete anotaciones seguidas. Mira si el avance era visible día a día.",
    },
    framework144: {
      fisico: "Observa si descansas antes de terminar o solo después.",
      mental: "Observa cuánto de tu atención está en lo que falta frente a lo hecho.",
      espiritual: "Observa si tu valor depende de lo conseguido.",
    },
  },

  sagittarius: {
    id: "sagittarius",
    estado: "reviewed",
    astronomia:
      "Sagitario es una constelación zodiacal del hemisferio sur celeste. En su dirección se encuentra el centro de la Vía Láctea, lo que la convierte en la región del cielo con mayor densidad de estrellas y nubes interestelares. Kaus Australis, su estrella más brillante, está a unos 143 años luz, y Nunki a 228.",
    esencia: "dirección elegida · apuntar lejos · abundancia de opciones",
    fraseUmbral: "Cuando hay demasiado hacia donde mirar, elegir se vuelve el trabajo.",
    arquetipo:
      "Lo que tiene que elegir dirección entre muchas posibles. Donde este portal aparece marcado suele haber una abundancia real de intereses, capacidades o caminos abiertos, y la dificultad correspondiente: no la falta de opciones sino su exceso. Eso da amplitud y capacidad de moverse en territorios distintos. El coste es que apuntar a todas partes equivale a no apuntar, y que la abundancia puede convertirse en una forma cómoda de no decidir, porque mientras todo sigue abierto nada puede fallar del todo.",
    nucleo: "Elegir una dirección entre muchas posibles, sabiendo que la elección cierra las demás.",
    potenciales: [
      "Moverse con soltura en territorios distintos.",
      "Ver posibilidades donde otros ven un solo camino.",
      "Apuntar a algo lejano y sostener la puntería años.",
      "Transmitir entusiasmo por algo que aún no existe.",
    ],
    tensiones: [
      "Apuntar a todas partes, que equivale a no apuntar.",
      "Usar la abundancia de opciones para no decidir.",
      "Empezar muchas cosas y desarrollar pocas.",
      "Que el entusiasmo prometa lo que la constancia no sostiene.",
    ],
    cuandoIntegrado: [
      "Se elige una dirección y se aceptan las que quedan fuera.",
      "Se desarrolla algo hasta el fondo, no solo hasta que es interesante.",
      "Se promete lo que se puede sostener.",
    ],
    cuandoSobrecargado: [
      "Se abren tres proyectos nuevos y ninguno avanza.",
      "Se cambia de dirección justo cuando empieza el trabajo aburrido.",
      "Se compromete uno en caliente y se retira en frío.",
    ],
    patronesCotidianos: [
      "Tener más ideas que tiempo.",
      "Entusiasmarte con algo y perderlo al tercer mes.",
      "Que te cueste responder a qué te quieres dedicar.",
      "Que la gente se anime contigo y después te siga sola.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo se llena de posibilidades. Lo que falta es la renuncia, que es lo que da forma.",
      vinculos: "En los vínculos el entusiasmo abre y la falta de continuidad desgasta. Conviene prometer menos.",
      grupo: "En grupo se aporta horizonte. Conviene que alguien más sostenga el detalle.",
      servicio: "La aportación natural es mostrar lo que es posible. El límite es que lo posible no se hace solo.",
    },
    aprendizajeCentral: "Que elegir es renunciar, y que quien no renuncia no elige: solo pospone.",
    paradoja: "La abundancia de caminos es lo que enriquece la vida y lo que impide recorrer ninguno entero.",
    preguntaUmbral: "¿Qué tendrías que soltar para hacer bien una sola cosa?",
    preguntas: [
      "¿Cuántas cosas tienes abiertas, y cuántas avanzan?",
      "¿Qué abandonas siempre en el mismo punto?",
      "¿A qué te has comprometido con entusiasmo y no has sostenido?",
      "¿Qué elegirías si solo pudieras elegir una?",
    ],
    journalPrompts: [
      "Haz una lista de todo lo que tienes empezado. Cuéntalo.",
      "Escribe en qué punto sueles abandonar. ¿Qué tienen en común esos puntos?",
      "¿Qué renuncia te daría una dirección clara?",
    ],
    practicaBase: {
      titulo: "Una sola dirección",
      pasos: [
        "Elige uno solo de tus proyectos abiertos.",
        "Durante siete días trabaja únicamente en ese, aunque sea media hora al día.",
        "No abras nada nuevo durante la semana.",
        "Anota cada día el impulso de cambiar a otra cosa y qué lo disparó.",
      ],
      cierre: "Al final, mira cuánto avanzó ese proyecto en siete días, y compáralo con los meses anteriores.",
    },
    framework144: {
      fisico: "Observa la inquietud física cuando te obligas a seguir en una sola cosa.",
      mental: "Observa cuántas ideas nuevas aparecen cuando una actual se vuelve difícil.",
      espiritual: "Observa si puedes encontrar sentido en profundizar y no solo en abrir.",
    },
  },

  sculptor: {
    id: "sculptor",
    estado: "reviewed",
    astronomia:
      "Escultor es una constelación tenue del hemisferio sur, nombrada en el siglo XVIII. En su dirección se encuentra el polo sur galáctico: mirar hacia allí es mirar perpendicularmente al plano de nuestra galaxia, fuera de su disco de estrellas y polvo, por lo que es una de las ventanas más despejadas hacia las galaxias lejanas.",
    esencia: "dar forma · quitar lo que sobra · trabajo paciente sobre lo propio",
    fraseUmbral: "Dar forma a algo consiste sobre todo en quitar.",
    arquetipo:
      "Lo que se hace quitando. Donde este portal aparece marcado suele haber un trabajo sostenido sobre uno mismo o sobre una obra que no consiste en añadir sino en retirar: menos actividades, menos explicaciones, menos adorno, hasta que queda lo que de verdad sostiene. Eso produce claridad y una forma propia reconocible. El coste es que quitar no tiene fin natural: sin un criterio de cuándo parar, la depuración sigue hasta dejar la vida sin margen, y lo que empezó siendo esencial se vuelve escaso.",
    nucleo: "Quitar lo que sobra hasta encontrar la forma, con un criterio de cuándo dejar de quitar.",
    potenciales: [
      "Llegar a lo esencial de algo, incluido uno mismo.",
      "Renunciar a lo accesorio sin sentir pérdida.",
      "Dar forma reconocible a algo difuso.",
      "Sostener un trabajo de depuración durante años.",
    ],
    tensiones: [
      "Quitar sin criterio de cuándo parar.",
      "Confundir austeridad con no permitirse nada.",
      "Retirar tanto que quede sin margen ni holgura.",
      "Exigir a otros la misma depuración.",
    ],
    cuandoIntegrado: [
      "Se sabe cuándo la forma ya está y se deja de tocar.",
      "Se distingue lo accesorio de lo que da holgura.",
      "Se permite algo superfluo a propósito.",
    ],
    cuandoSobrecargado: [
      "Se elimina algo que daba margen y después falta.",
      "Se juzga la vida de otros por su exceso.",
      "Se sigue puliendo algo que ya estaba terminado.",
    ],
    patronesCotidianos: [
      "Reducir compromisos, objetos o gastos periódicamente.",
      "Incomodidad con el exceso, propio o ajeno.",
      "Que te cueste permitirte algo que no sea necesario.",
      "Reescribir algo hasta dejarlo en la mitad.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo tiende a la austeridad. Conviene comprobar que queda margen para vivir.",
      vinculos: "En los vínculos la depuración puede leerse como frialdad. Lo accesorio a veces es lo afectivo.",
      grupo: "En grupo se aporta claridad quitando ruido. Conviene preguntar antes de quitar lo de otros.",
      servicio: "La aportación natural es dejar lo esencial a la vista. El límite es que la vida necesita holgura.",
    },
    aprendizajeCentral: "Que la holgura no es exceso, y que quitarla es quitar la posibilidad de moverse.",
    paradoja: "El criterio que encuentra la forma es el que no sabe cuándo dejar de aplicarse.",
    preguntaUmbral: "¿Qué has quitado de tu vida que ahora echas en falta?",
    preguntas: [
      "¿Qué estás puliendo que ya estaba terminado?",
      "¿Qué margen te queda para lo imprevisto?",
      "¿Qué te permites que no sea necesario?",
      "¿Qué le exiges a otros en términos de sobriedad?",
    ],
    journalPrompts: [
      "Escribe lo que has retirado de tu vida este año. Marca lo que fue acierto.",
      "Describe algo superfluo que te gustaría permitirte.",
      "¿Cuándo sabes que algo está terminado?",
    ],
    practicaBase: {
      titulo: "Añadir algo innecesario",
      pasos: [
        "Durante siete días, añade cada día una cosa que no sea necesaria y te guste.",
        "Que sea pequeña y sin utilidad: un rodeo al volver, una comida que no toca, media hora perdida.",
        "No la justifiques ni la conviertas en hábito útil.",
        "Anota qué añadiste y qué te costó.",
      ],
      cierre: "Al final, mira cuántos días lo hiciste y qué argumento usaste los días que no.",
    },
    framework144: {
      fisico: "Observa si tu vida cotidiana tiene margen físico o está ajustada al límite.",
      mental: "Observa el impulso de reducir cuando algo se complica.",
      espiritual: "Observa si lo esencial, para ti, excluye lo gratuito.",
    },
  },

  m31: {
    id: "m31",
    estado: "reviewed",
    astronomia:
      "Messier 31 es la Galaxia de Andrómeda, la galaxia espiral grande más próxima a la Vía Láctea, situada a unos dos millones y medio de años luz. Es el objeto más lejano que puede verse a simple vista. A diferencia de la mayoría de las galaxias, se acerca a nosotros: dentro de varios miles de millones de años ambas interactuarán.",
    esencia: "escala · lo que se ve entero desde lejos · otro sistema completo",
    fraseUmbral: "Hay vidas enteras funcionando a la vez que la tuya, con sus propias razones.",
    arquetipo:
      "La conciencia de que existen sistemas completos fuera del propio. Este portal no describe un rasgo: describe una relación con la escala. Donde aparece marcado suele haber una capacidad poco común de reconocer que la lógica de otro es completa por dentro, aunque desde fuera parezca incomprensible, y de situar la propia vida como uno entre muchos sistemas igual de reales. Eso quita centralidad y reduce mucho el juicio. El coste es que esa misma perspectiva puede diluir: si todo es relativo a su sistema, cuesta sostener una posición propia sin sentir que se está imponiendo.",
    nucleo: "Reconocer que existen sistemas completos distintos del propio, sin que eso disuelva la propia posición.",
    potenciales: [
      "Entender la lógica de alguien muy distinto sin necesitar compartirla.",
      "Situar un conflicto propio en una escala que lo hace manejable.",
      "Juzgar poco, porque se reconoce que falta contexto.",
      "Sostener varias versiones de una situación a la vez.",
    ],
    tensiones: [
      "Relativizar hasta no poder sostener una posición propia.",
      "Confundir comprender con aceptar cualquier cosa.",
      "Que la escala grande quite peso a lo que sí importaba.",
      "Sensación de que nada es del todo tuyo.",
    ],
    cuandoIntegrado: [
      "Se sostiene una posición propia sabiendo que hay otras completas.",
      "Se usa la escala para aliviar, no para invalidar.",
      "Se entiende a otro y aun así se dice que no.",
    ],
    cuandoSobrecargado: [
      "Se justifica algo que hacía daño porque tenía su lógica.",
      "Se minimiza un dolor propio comparándolo con otros mayores.",
      "Se evita tomar partido para no imponer.",
    ],
    patronesCotidianos: [
      "Entender demasiado bien a quien te hizo daño.",
      "Que te cueste enfadarte porque ves el motivo del otro.",
      "Sentir alivio al pensar en escalas muy grandes.",
      "Ver una discusión desde fuera mientras estás dentro.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo puede quedar sin centro por exceso de perspectiva. Conviene fijar qué es innegociable.",
      vinculos: "En los vínculos entender al otro no exime de decir lo propio. Comprender no es ceder.",
      grupo: "En grupo se aporta la posibilidad de que nadie sea el equivocado. Útil hasta que hay que decidir.",
      servicio: "La aportación natural es quitar juicio de una situación. El límite es que quitar juicio no es quitar criterio.",
    },
    aprendizajeCentral: "Que comprender la lógica de otro y sostener la propia son compatibles, y hacen falta las dos.",
    paradoja: "La perspectiva que evita juzgar injustamente es la que dificulta juzgar cuando hace falta.",
    preguntaUmbral: "¿Qué posición tuya has dejado de sostener por entender demasiado bien la contraria?",
    preguntas: [
      "¿Qué es innegociable para ti, dicho concretamente?",
      "¿A quién has justificado que te hizo daño?",
      "¿Qué dolor propio has minimizado comparándolo?",
      "¿Dónde hace falta que tomes partido?",
    ],
    journalPrompts: [
      "Escribe tres cosas innegociables para ti.",
      "Describe una situación donde entendiste tanto al otro que no dijiste lo tuyo.",
      "¿Qué te permites sentir sin compararlo con nada?",
    ],
    practicaBase: {
      titulo: "Sostener lo propio",
      pasos: [
        "Escribe tres cosas innegociables para ti.",
        "Durante siete días, en cada situación relevante, di lo tuyo antes de explicar el punto de vista del otro.",
        "No dejes de entenderlo: solo cambia el orden.",
        "Anota cada día si lo conseguiste.",
      ],
      cierre: "Al final, mira cuántas veces el orden cambió lo que pasó en la conversación.",
    },
    framework144: {
      fisico: "Observa si tu cuerpo registra el enfado antes de que tu mente lo relativice.",
      mental: "Observa cuánto tardas en encontrar la razón del otro.",
      espiritual: "Observa si la escala grande te devuelve a lo tuyo o te aparta de ello.",
    },
  },

  m42: {
    id: "m42",
    estado: "reviewed",
    astronomia:
      "Messier 42, la Nebulosa de Orión, es una región de formación estelar situada a unos mil trescientos años luz, visible a simple vista como una mancha difusa en la espada de Orión. En su interior el gas se está condensando en estrellas nuevas: es uno de los lugares más cercanos donde puede observarse ese proceso en curso.",
    esencia: "gestación · lo que aún no tiene forma · proceso en curso",
    fraseUmbral: "Hay etapas en las que no se ve nada porque todavía se está formando.",
    arquetipo:
      "Lo que está tomando forma y aún no la tiene. Este portal no describe un rasgo estable: describe un estado. Donde aparece marcado suele haber algo en proceso que no admite todavía ser nombrado —una dirección que se intuye sin poder explicarse, un trabajo que no tiene aún resultado que enseñar, un cambio que ocurre por dentro antes de aparecer fuera—. Eso pide una tolerancia poco común a lo informe. El coste es que en esa etapa no hay nada que mostrar, y la presión por presentar resultados puede hacer que se cierre la forma antes de tiempo, congelando algo que aún necesitaba seguir moviéndose.",
    nucleo: "Sostener lo que aún no tiene forma sin cerrarlo antes de tiempo ni dejarlo indefinidamente abierto.",
    potenciales: [
      "Soportar largos periodos sin resultado visible.",
      "Reconocer algo que empieza antes de que se pueda nombrar.",
      "No cerrar una dirección antes de que haya cuajado.",
      "Acompañar a otros en etapas sin forma.",
    ],
    tensiones: [
      "Cerrar la forma antes de tiempo por presión de mostrar algo.",
      "Confundir estar gestando con no estar haciendo nada.",
      "Dejarlo abierto indefinidamente, sin que llegue a tomar forma.",
      "Dificultad para explicar a otros en qué se está.",
    ],
    cuandoIntegrado: [
      "Se distingue una gestación real de una postergación.",
      "Se pone un plazo sin cerrar la forma antes.",
      "Se explica que se está en proceso sin justificarse.",
    ],
    cuandoSobrecargado: [
      "Se presenta algo a medias solo por tener algo que presentar.",
      "Se mantiene todo abierto durante años.",
      "Se vive la etapa sin forma como fracaso.",
    ],
    patronesCotidianos: [
      "Estar trabajando en algo que no puedes explicar todavía.",
      "Que te pregunten qué estás haciendo y no sepas responder.",
      "Notar un cambio en ti antes de que se vea fuera.",
      "Guardar cosas sin terminar durante mucho tiempo.",
    ],
    relaciones: {
      consigo: "La relación con uno mismo pide paciencia con lo que no está claro. Conviene un plazo, no una prisa.",
      vinculos: "En los vínculos conviene decir que se está en proceso, en vez de desaparecer o de fingir claridad.",
      grupo: "En grupo cuesta aportar en esta etapa. Es legítimo decirlo.",
      servicio: "La aportación natural es dar sitio a lo que todavía no tiene forma, propio o de otros.",
    },
    aprendizajeCentral: "Que hay etapas sin resultado que no son etapas perdidas, y que distinguirlas de la postergación requiere un plazo.",
    paradoja: "Lo que necesita tiempo sin forma es justo lo que más presión recibe para tenerla.",
    preguntaUmbral: "¿Qué llevas dentro que todavía no puedes explicar?",
    preguntas: [
      "¿Qué está en proceso en ti que aún no se ve fuera?",
      "¿Qué has cerrado antes de tiempo por tener que mostrarlo?",
      "¿Qué plazo te darías antes de decidir si esto cuaja?",
      "¿Qué diferencia una gestación de una postergación, en tu caso?",
    ],
    journalPrompts: [
      "Escribe lo que está tomando forma en ti, aunque salga confuso.",
      "Describe algo que cerraste antes de tiempo.",
      "¿Cuánto tiempo estás dispuesto a estar sin saber?",
    ],
    practicaBase: {
      titulo: "Dejarlo sin forma, con plazo",
      pasos: [
        "Identifica algo tuyo que está en proceso y todavía no puedes nombrar.",
        "Ponle un plazo concreto: treinta, sesenta o noventa días.",
        "Durante los siete días, escribe cada día tres líneas sobre ello, sin intentar concluir.",
        "No se lo expliques a nadie durante la semana.",
      ],
      cierre: "Al séptimo día lee las siete entradas. Mira si algo se repite. No decidas todavía.",
    },
    framework144: {
      fisico: "Observa si tu cuerpo registra el cambio antes que tu forma de explicarlo.",
      mental: "Observa cuánta presión te pones para poder nombrar lo que haces.",
      espiritual: "Observa si puedes sostener una dirección que aún no tiene nombre.",
    },
  },
}
