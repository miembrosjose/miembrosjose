// ═══════════════════════════════════════════════════════════════════════════
//  LA GUÍA · para quien nunca ha leído una carta
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ EXISTE ────────────────────────────────────────────────────────
// La herramienta decía «Ascendente: Acuario» y daba por hecho que eso
// significaba algo para quien lo leía. Para casi nadie lo significa.
//
// Una carta tiene cuatro ideas y ninguna es difícil: hay DIEZ PLANETAS que
// son diez capacidades, DOCE SIGNOS que dicen cómo funciona cada una, DOCE
// CASAS que dicen en qué terreno de la vida se nota, y unas DISTANCIAS entre
// planetas que dicen si se llevan bien o se estorban.
//
// Explicado así cabe en un minuto. Sin explicarlo, la herramienta solo vale
// para quien ya sabía.
//
// ── EL TONO ───────────────────────────────────────────────────────────────
// Se explica, no se vende ni se mistifica. Quien pregunta «¿y esto para qué
// sirve?» merece una respuesta directa, incluso cuando la respuesta honesta
// es «para mirarte, no para saber qué va a pasar».

export type EntradaGuia = {
  id: string
  pregunta: string
  respuesta: string
}

export const GUIA: EntradaGuia[] = [
  {
    id: "que-es",
    pregunta: "¿Qué es una carta astral?",
    respuesta:
      "Un mapa del cielo en el minuto y el lugar exactos en que naciste: dónde estaba cada planeta visto desde ahí. Eso es astronomía y se puede comprobar. Lo que esta herramienta hace después —leerlo como un retrato— ya es simbólico. Las dos cosas son distintas y conviene no confundirlas.",
  },
  {
    id: "tres-piezas",
    pregunta: "¿Cómo se lee? Las tres piezas",
    respuesta:
      "Un planeta es una capacidad: el Sol es la identidad, Venus es cómo te vinculas, Marte es cómo actúas. El signo en que está dice CÓMO funciona esa capacidad. La casa dice DÓNDE se nota, en qué terreno de tu vida. Marte en Aries es actuar de frente; Marte en la casa 7 es gastar esa fuerza en los vínculos. Juntas las tres y tienes una frase completa.",
  },
  {
    id: "sol",
    pregunta: "¿Qué es el Sol?",
    respuesta:
      "Lo que vienes a ser. No lo que ya eres: la dirección hacia la que una vida tiende cuando nadie la empuja. Es lo que casi todo el mundo llama «su signo», porque es lo único que sale en las revistas — y es solo una de trece piezas.",
  },
  {
    id: "luna",
    pregunta: "¿Qué es la Luna?",
    respuesta:
      "Lo que necesitas para estar bien. Lo que te calma, lo que te altera, aquello a lo que vuelves sin pensarlo. Es la parte más antigua de ti, la que se formó antes de que tuvieras palabras. Por eso reaccionas desde la Luna antes de decidir desde el Sol.",
  },
  {
    id: "ascendente",
    pregunta: "¿Qué es el Ascendente?",
    respuesta:
      "El signo que estaba asomando por el horizonte este en el momento exacto de tu nacimiento. Es cómo apareces: el gesto, el cuerpo, lo primero que los demás registran de ti antes de que hables. Cambia cada cuatro minutos, así que es lo más personal de la carta — y lo primero que se pierde si la hora de nacimiento no es exacta.",
  },
  {
    id: "medio-cielo",
    pregunta: "¿Qué es el Medio Cielo?",
    respuesta:
      "El punto más alto de tu carta, lo que se ve desde lejos: tu lugar público, la vocación, lo que la gente dice de ti cuando no estás. Si el Ascendente es cómo entras en una sala, el Medio Cielo es a qué te dedicas.",
  },
  {
    id: "casas",
    pregunta: "¿Qué son las casas?",
    respuesta:
      "Doce terrenos de una vida: el cuerpo, el dinero, los hermanos, la casa, los hijos, el trabajo, la pareja, lo compartido, las creencias, la profesión, los amigos y lo que no se ve. Dependen de tu hora y tu lugar de nacimiento, no solo de la fecha. Por eso dos personas del mismo día pueden tener cartas muy distintas.",
  },
  {
    id: "aspectos",
    pregunta: "¿Qué son los aspectos?",
    respuesta:
      "Distancias concretas entre dos planetas. Si están juntos, actúan mezclados. A 90° se estorban y obligan a elegir. A 120° se ayudan sin esfuerzo. A 180° tiran cada uno de un extremo. No son buenos ni malos: los fáciles dan talento que no se nota, y los difíciles dan el empuje que construye.",
  },
  {
    id: "retrogrado",
    pregunta: "¿Qué quiere decir la R?",
    respuesta:
      "Retrógrado: visto desde la Tierra, ese planeta parecía ir hacia atrás ese día. Es un efecto de perspectiva, no una avería del cielo. En la lectura se entiende como una capacidad que funciona más hacia dentro que hacia fuera, y que suele madurar más tarde.",
  },
  {
    id: "generacionales",
    pregunta: "¿Por qué Plutón dice poco de mí?",
    respuesta:
      "Porque tarda hasta veinte años en cambiar de signo: todos los nacidos en tu época lo tienen igual. Lo mismo con Urano y Neptuno. Su signo describe a una generación entera, no a ti. Lo que sí es tuyo es la CASA en la que caen, que depende de tu hora exacta.",
  },
  {
    id: "camino-solar",
    pregunta: "¿Y el Camino Solar?",
    respuesta:
      "Es la lectura propia de Los 144.000. Los doce signos del zodiaco están alineados uno a uno con los doce sistemas orgánicos: Capricornio con el esqueleto, Acuario con el nervioso, y así los doce. La herramienta mira cuánto aparece cada signo en tu carta y te enseña, de cada uno, el arquetipo y su sombra, y su sistema orgánico en equilibrio y en desequilibrio. Y una advertencia que importa: que un signo aparezca poco NO significa que ese sistema esté en desequilibrio. Presencia y estado son dos cosas distintas. La carta dice cuánto hay; el estado lo sabes tú.",
  },
  {
    id: "no-es",
    pregunta: "¿Esto predice el futuro?",
    respuesta:
      "No, y no está escrito para eso. Aquí no vas a encontrar «te pasará» en ninguna parte: todo está en presente y describe tendencias que puedes reconocer o no. Si lees algo y no te suenas, no eres tú — y está bien decirlo. Tampoco es un diagnóstico: si algo del cuerpo te preocupa, eso se consulta con quien sabe de cuerpos.",
  },
]

/** Las que se enseñan junto a los tres grandes, en ese orden. */
export const GUIA_RAPIDA = ["sol", "luna", "ascendente"]
