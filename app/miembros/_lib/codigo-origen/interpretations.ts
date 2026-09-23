// CÓDIGO DE ORIGEN — todos los textos de la lectura.
//
// Aquí y solo aquí. Cambiar una palabra de la interpretación no debería obligar
// a tocar el cálculo ni la interfaz.
//
// TONO — tres reglas que conviene no romper:
//   · Nunca se afirma lo que alguien ES. Se describe lo que una configuración
//     SUGIERE, con qué se RELACIONA y cómo PUEDE manifestarse.
//   · Nunca se predice. No hay futuro en estos textos.
//   · Lo menos presente no es una carencia ni un diagnóstico: es una dirección
//     que queda por recorrer.

import type { Arquetipo, ArquetipoId, Frecuencia, FrecuenciaId, Vector, VectorId } from "./types"

export const FRECUENCIAS: Record<FrecuenciaId, Frecuencia> = {
  expansion: {
    id: "expansion",
    nombre: "Expansión",
    frase: "Lo que crece hacia fuera y busca su forma.",
    descripcion:
      "Esta frecuencia se relaciona con el impulso de crecer, abrir camino y empezar cosas que todavía no tienen contorno. Donde hay Expansión hay movimiento hacia lo que aún no existe.",
    don: "Iniciar sin garantías. Ver el brote donde otros ven tierra vacía.",
    desequilibrio:
      "Puede manifestarse como dispersión: muchos comienzos abiertos y ninguno sostenido el tiempo suficiente.",
    integracion:
      "Te invita a observar qué necesita ser terminado antes de abrir lo siguiente.",
    enLaPractica:
      "Se reconoce en la cantidad de cosas que tienes empezadas a la vez, en el entusiasmo de los primeros días y en lo mucho que cuesta el tramo intermedio, cuando ya no hay novedad y todavía no hay resultado.",
    practica:
      "Elige algo que empezaste y no terminaste. No lo termines todavía: escribe en una línea por qué lo dejaste. Suele aparecer siempre la misma razón.",
    color: "#8fc46a",
  },
  activacion: {
    id: "activacion",
    nombre: "Activación",
    frase: "Lo que enciende y se hace visible.",
    descripcion:
      "Esta frecuencia se relaciona con la capacidad de encender: presencia, entusiasmo, calor que alcanza a otros. Donde hay Activación, algo deja de ser interno y se vuelve visible.",
    don: "Encender a los demás. Sostener presencia sin pedir permiso.",
    desequilibrio:
      "Puede manifestarse como consumo: dar tanta luz que no quede reserva para la propia noche.",
    integracion:
      "Te invita a observar cuánto de tu fuego se sostiene sin público.",
    enLaPractica:
      "Se reconoce en cómo cambia una sala cuando entras, en que la gente te busca para arrancar cosas, y en el cansancio particular que llega después de haber sostenido el ánimo de otros.",
    practica:
      "Durante una semana, observa una conversación al día sin aportar energía: solo escuchando. Fíjate en qué se mueve en ti cuando no eres tú quien enciende.",
    color: "#e0864a",
  },
  encarnacion: {
    id: "encarnacion",
    nombre: "Encarnación",
    frase: "Lo que se asienta y sostiene.",
    descripcion:
      "Esta frecuencia se relaciona con el cuerpo, el lugar y la permanencia. Donde hay Encarnación, lo que se recibe no se queda en idea: aterriza, se habita, se mantiene.",
    don: "Sostener. Ser el suelo firme sobre el que otros pueden apoyarse.",
    desequilibrio:
      "Puede manifestarse como rigidez: quedarse en lo conocido por no perder la estabilidad conseguida.",
    integracion:
      "Te invita a observar qué se ha vuelto inmóvil por costumbre y no por necesidad.",
    enLaPractica:
      "Se reconoce en que la gente te confía lo que no quiere que se caiga, en tu resistencia a improvisar y en que sueles ser el último en irte cuando algo aún no está resuelto.",
    practica:
      "Identifica algo que sostienes y que nadie te pidió sostener. Pregúntate qué pasaría si lo soltaras una semana. No hace falta soltarlo: basta con mirar la respuesta.",
    color: "#c9a86b",
  },
  claridad: {
    id: "claridad",
    nombre: "Claridad",
    frase: "Lo que separa, corta y define.",
    descripcion:
      "Esta frecuencia se relaciona con el discernimiento: distinguir lo esencial de lo accesorio y nombrarlo sin adorno. Donde hay Claridad, las cosas recuperan su contorno.",
    don: "Ver la estructura. Decir lo que es sin suavizarlo hasta volverlo inútil.",
    desequilibrio:
      "Puede manifestarse como dureza: cortar tan limpio que no quede espacio para lo que aún está formándose.",
    integracion:
      "Te invita a observar qué necesita tiempo antes de ser juzgado.",
    enLaPractica:
      "Se reconoce en la incomodidad física ante lo ambiguo, en tu necesidad de nombrar bien las cosas y en que ves el fallo de un razonamiento antes de poder explicar por qué.",
    practica:
      "Toma una decisión pequeña sin tener toda la información. Anota qué temías que pasara y qué pasó de verdad. Guárdalo: es tu propio contraejemplo.",
    color: "#c6cbe6",
  },
  profundidad: {
    id: "profundidad",
    nombre: "Profundidad",
    frase: "Lo que desciende y recuerda.",
    descripcion:
      "Esta frecuencia se relaciona con lo que ocurre bajo la superficie: memoria, intuición, silencio fértil. Donde hay Profundidad, la respuesta no llega por razonamiento sino por decantación.",
    don: "Escuchar lo que no se ha dicho. Sostener la pregunta sin cerrarla.",
    desequilibrio:
      "Puede manifestarse como retirada: habitar tanto el fondo que la superficie quede sin atender.",
    integracion:
      "Te invita a observar qué de lo que sabes por dentro aún no ha salido al mundo.",
    enLaPractica:
      "Se reconoce en que necesitas tiempo a solas después de estar con gente, en que entiendes a las personas antes de que se expliquen y en cuánto te cuesta decir lo que percibes sin poder demostrarlo.",
    practica:
      "Escribe una percepción que tuviste sobre alguien y que descartaste por no poder justificarla. Déjala escrita y con fecha. Revísala en un mes.",
    color: "#6fa8d6",
  },
}

export const VECTORES: Record<VectorId, Vector> = {
  proyeccion: {
    id: "proyeccion",
    nombre: "Proyección",
    descripcion:
      "Esta configuración sugiere una energía que se mueve hacia fuera: tiende a iniciar, a ofrecer y a ocupar espacio antes de que se lo pidan. El aprendizaje suele estar en la pausa.",
  },
  recepcion: {
    id: "recepcion",
    nombre: "Recepción",
    descripcion:
      "Esta configuración sugiere una energía que se mueve hacia dentro: tiende a escuchar, a esperar el momento y a responder más que a proponer. El aprendizaje suele estar en el gesto de avanzar primero.",
  },
}

export const ARQUETIPOS: Record<ArquetipoId, Arquetipo> = {
  resonancia: {
    id: "resonancia",
    nombre: "Resonancia",
    frase: "Se reconoce en lo semejante.",
    don: "Encontrar a los suyos y sostener el vínculo entre iguales.",
    tension: "Puede costar diferenciarse de aquello con lo que resuena.",
    integracion: "Te invita a observar dónde termina lo compartido y empieza lo propio.",
    enLaRed:
      "Suele encontrarse a gusto donde hay grupo: círculos de estudio, encuentros presenciales, acompañar a quien acaba de llegar.",
  },
  impulso: {
    id: "impulso",
    nombre: "Impulso",
    frase: "Lo que empuja cuando nada obliga a moverse.",
    don: "Poner en marcha lo que llevaba tiempo detenido, en uno y en otros.",
    tension: "Puede manifestarse como prisa, o como gastar fuerza en batallas que no eran.",
    integracion: "Te invita a observar hacia dónde apunta la fuerza antes de soltarla.",
    enLaRed:
      "Suele encontrarse a gusto moviendo lo detenido: convocar, abrir un encuentro, proponer lo que nadie propone.",
  },
  creacion: {
    id: "creacion",
    nombre: "Creación",
    frase: "Lo interno encuentra forma sin esfuerzo.",
    don: "Dar salida a lo que se lleva dentro de un modo que a otros les resulta natural recibir.",
    tension: "Puede manifestarse como dispersión: crear mucho y terminar poco.",
    integracion: "Te invita a observar qué de lo creado merece ser sostenido.",
    enLaRed:
      "Suele encontrarse a gusto dando forma: escribir, registrar, traducir a imagen o a palabra lo que otros aún no nombran.",
  },
  revelacion: {
    id: "revelacion",
    nombre: "Revelación",
    frase: "Lo que se expresa rompiendo la forma heredada.",
    don: "Nombrar lo que nadie nombra. Señalar la grieta en lo que parecía entero.",
    tension: "Puede manifestarse como choque: decir la verdad sin medir si el otro puede sostenerla.",
    integracion: "Te invita a observar cuándo revelar y cuándo esperar.",
    enLaRed:
      "Suele encontrarse a gusto señalando lo que falta: preguntar lo incómodo, revisar lo que se da por supuesto.",
  },
  materializacion: {
    id: "materializacion",
    nombre: "Materialización",
    frase: "Lo que se toma del mundo y se vuelve concreto.",
    don: "Convertir la oportunidad en algo tangible, y hacerlo con amplitud.",
    tension: "Puede manifestarse como acumulación sin propósito claro.",
    integracion: "Te invita a observar para qué es lo que reúnes.",
    enLaRed:
      "Suele encontrarse a gusto convirtiendo intención en hecho: organizar lo concreto, conseguir lo que hace falta.",
  },
  apertura: {
    id: "apertura",
    nombre: "Apertura",
    frase: "Lo que llega cuando se deja sitio.",
    don: "Sostener lo que se recibe con constancia, sin exigirle que crezca rápido.",
    tension: "Puede manifestarse como espera: dejar que la vida decida lo que uno no decide.",
    integracion: "Te invita a observar qué estás esperando que llegue solo.",
    enLaRed:
      "Suele encontrarse a gusto sosteniendo el espacio: estar disponible, recibir a quien llega, dejar sitio.",
  },
  orden: {
    id: "orden",
    nombre: "Orden",
    frase: "Lo que da marco y hace posible lo demás.",
    don: "Construir estructuras donde otros puedan moverse con seguridad.",
    tension: "Puede manifestarse como exigencia: confundir la norma con el fin.",
    integracion: "Te invita a observar qué estructura sigue en pie sin que nadie la necesite.",
    enLaRed:
      "Suele encontrarse a gusto dando marco: cuidar que las cosas tengan estructura y que lo empezado no se deshaga.",
  },
  iniciacion: {
    id: "iniciacion",
    nombre: "Iniciación",
    frase: "Lo que confronta y, al confrontar, forma.",
    don: "Atravesar lo difícil y salir con algo que antes no se tenía.",
    tension: "Puede manifestarse como dureza consigo mismo, o como buscar prueba donde no hace falta.",
    integracion: "Te invita a observar qué ya fue superado y sigue tratándose como amenaza.",
    enLaRed:
      "Suele encontrarse a gusto acompañando lo difícil: estar presente donde hay proceso y no hay respuesta rápida.",
  },
  sabiduria: {
    id: "sabiduria",
    nombre: "Sabiduría",
    frase: "Lo que nutre de forma directa y serena.",
    don: "Acompañar con lo aprendido, sin necesidad de demostrarlo.",
    tension: "Puede manifestarse como quedarse en el saber sin llevarlo a la práctica.",
    integracion: "Te invita a observar qué sabes y todavía no has hecho.",
    enLaRed:
      "Suele encontrarse a gusto transmitiendo: explicar sin bajar el nivel, acompañar con lo ya recorrido.",
  },
  vision_interior: {
    id: "vision_interior",
    nombre: "Visión Interior",
    frase: "Lo que nutre por caminos que no se ven.",
    don: "Comprender por vías que no pasan por la explicación.",
    tension: "Puede manifestarse como aislamiento, o como dudar de lo que se percibe con claridad.",
    integracion: "Te invita a observar qué percepciones vienes descartando por no poder justificarlas.",
    enLaRed:
      "Suele encontrarse a gusto en lo que no se explica: práctica silenciosa, percepción, trabajo interior sostenido.",
  },
}

// ── Plantillas de la síntesis ───────────────────────────────────────────────
// Se ensamblan con reglas deterministas en engine.ts. Sin IA y sin red: el
// resultado es idéntico cada vez que se abre, y no cuesta nada generarlo.

/** Cuando la raíz supera con claridad al resto. */
export const SINTESIS_RAIZ_MARCADA =
  "Tu configuración muestra una frecuencia claramente dominante. Eso suele traducirse en una forma de estar reconocible: quienes te rodean saben qué esperar de ti. La contrapartida es que lo demás queda a su sombra."

/** Cuando las dos primeras están muy igualadas. */
export const SINTESIS_RAIZ_COMPARTIDA =
  "Tus dos frecuencias principales están casi al mismo nivel. Esta configuración sugiere una forma de estar que alterna entre dos registros según el momento, y que puede sentirse como contradicción cuando en realidad es amplitud."

/** Cuando el reparto es muy parejo entre las cinco. */
export const SINTESIS_REPARTO_PAREJO =
  "Las cinco frecuencias aparecen repartidas de forma pareja. Esta configuración se relaciona con la adaptabilidad: menos intensidad en un solo registro, más capacidad de moverse entre todos."

/** Cierre, siempre presente. */
export const SINTESIS_CIERRE =
  "Nada de esto describe un límite. Es un punto de partida para observar, no una definición que haya que cumplir."

// ── Lecturas de combinación ─────────────────────────────────────────────────
// Aquí está lo que diferencia una lectura de otra: la raíz sola comparten
// muchas personas, el par raíz + apoyo ya son veinte caminos distintos.

export const COMBINACIONES: Record<string, string> = {
  "expansion-activacion":
    "Abrir y encender a la vez. Esta combinación se relaciona con la capacidad de arrancar cosas y de contagiar ganas mientras arrancan. El riesgo está en el momento en que el entusiasmo baja y todavía no hay nada terminado: ahí suele aparecer la tentación de empezar otra cosa en vez de atravesar el tramo aburrido.",
  "expansion-encarnacion":
    "Abrir con peso. Es una combinación poco frecuente y muy útil: el impulso de empezar viene acompañado de algo que sostiene. Suele traducirse en proyectos que sobreviven al primer entusiasmo. La tensión aparece hacia dentro, entre la parte que quiere moverse ya y la que pide asegurar el terreno.",
  "expansion-claridad":
    "Abrir y ordenar. El impulso de empezar llega acompañado de la necesidad de entender bien lo que se empieza. Puede dar comienzos lúcidos y bien planteados, y también parálisis: seguir afinando el plan como forma elegante de no arrancar.",
  "expansion-profundidad":
    "Abrir desde dentro. Lo que se inicia no suele venir de una decisión racional sino de algo que se percibió antes de poder explicarlo. La dificultad recurrente es justificar ante otros por qué este camino y no otro, cuando la razón real no cabe en un argumento.",
  "activacion-expansion":
    "Encender lo que aún no tiene forma. La presencia llega antes que el plan: se convoca, se entusiasma y sobre la marcha se decide hacia dónde. Funciona notablemente en los comienzos. Pide alguien cerca —o una parte propia— que se ocupe de lo que viene después.",
  "activacion-encarnacion":
    "Encender y sostener. Se relaciona con la capacidad de mover a otros y además quedarse hasta el final. Es una combinación de las que generan confianza. El precio suele ser el cansancio: se sostiene mucho, y pocas veces se pregunta quién sostiene a quien sostiene.",
  "activacion-claridad":
    "Encender con precisión. La presencia viene acompañada de criterio: no solo se anima, se sabe hacia dónde. Puede volverse exigente, contigo y con los demás, cuando el entusiasmo se condiciona a que las cosas se hagan bien.",
  "activacion-profundidad":
    "Encender desde lo que no se ve. Hacia fuera hay calor y presencia; por debajo corre una vida interior que casi nadie sospecha. La tensión está en la distancia entre las dos: cuanto más se enciende fuera, más sola puede sentirse la parte de dentro.",
  "encarnacion-expansion":
    "Sostener sin cerrarse. La base es firme, y aun así hay apertura a lo nuevo. Suele traducirse en una estabilidad que no se vuelve rigidez. La duda recurrente es cuándo cambiar algo que funciona pero ya no entusiasma.",
  "encarnacion-activacion":
    "Sostener y dar calor. Se relaciona con ser refugio para otros: el sitio al que se acude. El riesgo es que el papel se vuelva identidad, y pedir ayuda empiece a sentirse como fallarle a quien cuenta contigo.",
  "encarnacion-claridad":
    "Sostener con criterio. Estructura y discernimiento juntos: se construye bien y se distingue lo que merece construirse. La tensión aparece con lo ambiguo y lo desordenado, que cuestan más de lo que parece desde fuera.",
  "encarnacion-profundidad":
    "Sostener en silencio. Se sostiene mucho y se cuenta poco. Los demás notan que estás, sin dimensionar el trabajo interno que hay detrás. La invitación recurrente es a nombrar algo de eso, aunque no haga falta para seguir.",
  "claridad-expansion":
    "Entender para abrir. El pensamiento no se queda quieto: busca material nuevo, contrasta, prueba. Se relaciona con una mente viva. La dificultad está en detenerse el tiempo suficiente para que una sola idea termine de madurar.",
  "claridad-activacion":
    "Entender y transmitir. Lo comprendido busca salida: explicar, enseñar, poner en palabras lo que otros no logran ordenar. La tensión aparece cuando hay que hablar antes de tenerlo del todo claro, algo que cuesta bastante más de lo que parece.",
  "claridad-encarnacion":
    "Entender y asentar. Se piensa bien y además se ejecuta. Es una combinación fiable y de las que sostienen estructuras enteras. Su punto ciego es lo que no se deja analizar: emociones, intuiciones, todo lo que no viene con argumento.",
  "claridad-profundidad":
    "Entender hacia dentro. El discernimiento se aplica a la propia vida interior, con una honestidad poco común. También puede volverse contra ti: analizar lo que solo pedía ser sentido, y pedir pruebas a algo que no las da.",
  "profundidad-expansion":
    "Percibir y abrir camino. Lo intuido empuja hacia fuera y quiere volverse acción. Se relaciona con iniciativas que nacen de una percepción antes que de un cálculo. Cuesta explicar de dónde salen, y a veces conviene no explicarlo.",
  "profundidad-activacion":
    "Percibir y encender. Lo que se capta en silencio termina saliendo con fuerza cuando sale. Alterna recogimiento y presencia intensa, y puede parecer inconstante desde fuera. No lo es: son dos tiempos del mismo movimiento.",
  "profundidad-encarnacion":
    "Percibir y dar forma. Lo intuido encuentra un cuerpo donde asentarse: práctica sostenida, trabajo paciente. Es de las combinaciones más lentas y de las que menos se deshacen. Pide no confundir la lentitud con no estar avanzando.",
  "profundidad-claridad":
    "Percibir y nombrar. Se capta antes de entender, y luego se busca la palabra exacta. Cuando se consigue, otros reconocen en ella algo propio. El desgaste está en el intervalo: el tiempo entre percibir algo y poder decirlo sin traicionarlo.",
}

// Cómo matiza el vector a la frecuencia raíz: a veces empujan al mismo sitio
// y a veces no, y esa fricción es información.
export const MATIZ_DEL_VECTOR: Record<string, string> = {
  "proyeccion-expansion":
    "Tu vector refuerza la raíz: abrir hacia fuera es también tu movimiento natural. Poca fricción interna, y por eso mismo conviene mirar qué se queda sin terminar.",
  "proyeccion-activacion":
    "Vector y raíz apuntan al mismo sitio: encender y salir. Es una configuración de mucha presencia. La pausa no llega sola; hay que ponerla.",
  "proyeccion-encarnacion":
    "Vector y raíz tiran distinto: algo en ti empuja a salir y ofrecer, mientras la raíz pide asentar y sostener. Esa fricción suele vivirse como no llegar nunca a estar del todo quieto.",
  "proyeccion-claridad":
    "El vector empuja a decir; la raíz quiere estar segura antes. La mezcla produce afirmaciones firmes y, después, la revisión de si estaban bien planteadas.",
  "proyeccion-profundidad":
    "El vector empuja hacia fuera mientras la raíz pide recogimiento. Es una de las tensiones más habituales: mucha actividad exterior con una parte que no termina de acompañar.",
  "recepcion-expansion":
    "El vector pide esperar y la raíz quiere empezar. Suele notarse como tener muchas ganas de arrancar algo y dejar pasar el momento por no forzarlo.",
  "recepcion-activacion":
    "La raíz enciende, el vector espera a que se lo pidan. Cuando el permiso llega, la respuesta es rotunda. Sin permiso, la energía se queda dentro.",
  "recepcion-encarnacion":
    "Vector y raíz coinciden: recibir y sostener. Es de las configuraciones más estables. El aprendizaje suele estar en proponer primero, aunque nadie lo haya pedido.",
  "recepcion-claridad":
    "El vector escucha y la raíz discierne. Buena combinación para ver de verdad lo que hay. Lo que se ve tarda en decirse, y a veces no llega a decirse.",
  "recepcion-profundidad":
    "Vector y raíz apuntan hacia dentro. Mucha vida interior y poca necesidad de mostrarla. La invitación está en el gesto de sacar algo afuera, aunque salga imperfecto.",
}
