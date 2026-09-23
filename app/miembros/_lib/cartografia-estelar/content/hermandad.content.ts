// CARTOGRAFÍA ESTELAR 144 — hermandad cósmica.
//
// CAPA B, y la más explícitamente contemplativa de todas.
//
// ── LA REGLA QUE NO SE ROMPE AQUÍ ──────────────────────────────────────────
// Este archivo habla de familia estelar, de afinidad y de disposición al
// contacto, que es el corazón del marco de Los 144.000. Y lo hace SIN afirmar
// procedencia como hecho, porque esa fue la primera regla que nos dimos.
//
// Nunca se escribe:
//   "vienes de Sirio" · "eres pleyadiano" · "tu alma nació en Arcturus"
//   "perteneces a esta raza" · "esto demuestra tu origen estelar"
//
// Sí se escribe:
//   "dentro del marco contemplativo de Los 144.000…"
//   "esta configuración se relaciona simbólicamente con…"
//   "puede invitar a observar…" · "si lo reconoces en tu vida…"
//
// La diferencia no es cosmética. Decir "eres de las Pléyades" cierra: convierte
// una invitación en una etiqueta y deja a la persona sin nada que hacer salvo
// creérselo. Decir "esta afinidad puede invitarte a observar" abre, y deja el
// reconocimiento en manos de quien lee, que es donde tiene que estar.
//
// `disposicion` es siempre observable. Un vínculo que no se puede reconocer en
// la propia vida no es un vínculo: es un halago.

export type Hermandad = {
  /** El nombre de la familia dentro del marco 144. Dos o tres palabras. */
  familia: string
  /** El vínculo, leído como afinidad. 2–4 frases. */
  vinculo: string
  /** Qué podría observar quien reconoce esa afinidad. Concreto. */
  disposicion: string
}

export const HERMANDAD: Record<string, Hermandad> = {
  // ── Los diez principales ────────────────────────────────────────────────
  pleyades: {
    familia: "La familia del vínculo",
    vinculo:
      "Dentro del marco contemplativo de Los 144.000, las Pléyades se asocian a la memoria de lo compartido: aquello que un grupo sabe sin que nadie lo haya enseñado. Una afinidad marcada con este portal se lee aquí como disposición a sostener el tejido entre personas, y como una sensibilidad que llega antes que la información.",
    disposicion:
      "Si lo reconoces en tu vida, puede aparecer como una facilidad para entrar en sintonía con un grupo en minutos, y como la sensación de haber estado ya en conversaciones que ocurren por primera vez.",
  },
  sirio: {
    familia: "La familia del servicio",
    vinculo:
      "Sirio se relaciona simbólicamente, dentro de este marco, con el linaje de quienes transmiten: los que reciben algo y lo entregan trabajado. No es una jerarquía ni un rango. Es una manera de estar en el mundo donde la enseñanza y el oficio se viven como una misma cosa.",
    disposicion:
      "Puede invitar a observar si llevas años sosteniendo una práctica que nadie te pidió, y si lo que te ordena por dentro no es el entusiasmo sino haber dado tu palabra.",
  },
  arcturus: {
    familia: "La familia de los arquitectos",
    vinculo:
      "En el marco contemplativo de Los 144.000, Arcturus se asocia a quienes ven la estructura antes que los hechos, y a la disposición a dejar sistemas que sigan sosteniendo cuando su autor ya no esté delante. El vínculo se lee como afinidad con el orden, no con el control.",
    disposicion:
      "Si lo reconoces, puede aparecer como una incomodidad física ante lo que funciona mal por dentro aunque por fuera se vea bien, y como la costumbre de arreglar cosas que nadie te había encargado.",
  },
  lyra: {
    familia: "La familia de los primeros",
    vinculo:
      "Lyra se relaciona simbólicamente con lo que empieza sin permiso: la chispa de crear algo donde antes no había nada. Dentro de este marco se asocia a una disposición a la soberanía, entendida no como aislamiento sino como capacidad de sostener lo propio sin necesitar que nadie lo apruebe primero.",
    disposicion:
      "Puede invitar a observar cuántas cosas de tu vida existen porque tú las empezaste, y cuánto te cuesta todavía dejar que alguien te ayude con ellas.",
  },
  orion: {
    familia: "La familia del discernimiento",
    vinculo:
      "Orión se asocia, dentro del marco de Los 144.000, a quienes atraviesan la polaridad sin quedarse en un bando. El vínculo se lee como disposición a sostener dos verdades que no encajan, y a decidir igualmente cuando no hay una opción limpia.",
    disposicion:
      "Si lo reconoces en tu vida, puede aparecer como la costumbre de acabar siendo quien dice en voz alta lo que el grupo evitaba, con el coste que eso trae y sin poder dejar de hacerlo.",
  },
  andromeda: {
    familia: "La familia de los libres",
    vinculo:
      "Andrómeda se relaciona simbólicamente con la perspectiva que solo aparece a cierta distancia, y con el linaje de quienes traen a un lugar cerrado una referencia que estaba fuera de su horizonte. Dentro de este marco, la afinidad se lee como amor por el margen, no como huida.",
    disposicion:
      "Puede invitar a observar qué necesitas exactamente cuando pides espacio, y si lo que buscas es aire para volver o una puerta para no quedarte.",
  },
  alfa_centauri: {
    familia: "La familia del umbral",
    vinculo:
      "Por ser el sistema estelar más próximo, Alfa Centauri se asocia dentro de este marco a la idea de puente: lo que conecta lo grande con lo cotidiano. La afinidad se lee como disposición a encarnar, es decir, a que las cosas lleguen a ocurrir de verdad y no solo a pensarse.",
    disposicion:
      "Si lo reconoces, puede aparecer como la función silenciosa de ser quien hace que un plan ajeno se vuelva real, y como la desconfianza hacia todo lo que no se puede tocar.",
  },
  antares: {
    familia: "La familia del fuego",
    vinculo:
      "Antares se relaciona simbólicamente con quienes atraviesan procesos que a otros los detienen. Dentro del marco contemplativo de Los 144.000, la afinidad se lee como una disposición a la transformación sin atajos, y como una honestidad que resulta difícil de simular.",
    disposicion:
      "Puede invitar a observar si la gente acude a ti cuando algo se ha roto de verdad, y si te cuesta sostener las situaciones donde no hay nada en juego.",
  },
  regulus: {
    familia: "La familia del corazón",
    vinculo:
      "Regulus se asocia, dentro de este marco, a quienes ocupan un lugar de referencia y responden por lo que ese lugar produce. El vínculo no se lee como autoridad sino como cobertura: hacer sitio para que otros puedan.",
    disposicion:
      "Si lo reconoces en tu vida, puede aparecer en el silencio que se hace cuando das una opinión, y en la cantidad de gente que ajusta algo suyo según lo que tú decides sin que nadie lo haya acordado.",
  },
  centro_galactico: {
    familia: "El eje",
    vinculo:
      "El Centro Galáctico no se asocia aquí a una familia sino a una orientación: aquello alrededor de lo cual gira todo lo demás, incluido nuestro propio Sol. Dentro del marco de Los 144.000 se relaciona simbólicamente con la pregunta de fondo que ordena una vida entera sin poder responderse del todo.",
    disposicion:
      "Puede invitar a observar qué pregunta vuelve a ti cada pocos años con otras palabras, y cuánto de lo que has dejado atrás lo dejaste porque no significaba nada.",
  },

  // ── Los cuarenta restantes ──────────────────────────────────────────────
  aldebaran: {
    familia: "Los guardianes de la palabra",
    vinculo:
      "Aldebarán se relaciona simbólicamente, dentro de este marco, con la coherencia entre lo declarado y lo vivido, y con quienes sostienen un compromiso cuando ya nadie lo está mirando.",
    disposicion:
      "Si lo reconoces, puede aparecer como una incomodidad propia —no ajena— cuando tu conducta de un día no cuadra con lo que dices que importa.",
  },
  fomalhaut: {
    familia: "Los solitarios fértiles",
    vinculo:
      "Por ser una estrella brillante en una región vacía del cielo, Fomalhaut se asocia aquí a la claridad que se destila en soledad, y a quienes necesitan retirarse para saber qué piensan de verdad.",
    disposicion:
      "Puede invitar a observar cuántas de tus conclusiones más firmes no has puesto nunca a prueba con otra persona.",
  },
  spica: {
    familia: "Los del oficio fino",
    vinculo:
      "Spica se relaciona simbólicamente con el trabajo bien hecho por dentro, el que solo distingue quien ha hecho la cosa mil veces. Dentro de este marco, la afinidad se lee como cuidado, no como perfeccionismo.",
    disposicion:
      "Si lo reconoces, puede aparecer en lo que tienes terminado y sin entregar porque todavía no está a la altura.",
  },
  altair: {
    familia: "Los mensajeros rápidos",
    vinculo:
      "Altair se asocia dentro de este marco a la respuesta veloz: quienes actúan mientras otros evalúan. El vínculo se lee como agilidad, con la contrapartida de lo que solo madura con tiempo.",
    disposicion:
      "Puede invitar a observar qué resolviste rápido que habría necesitado esperar tres días.",
  },
  deneb: {
    familia: "Los que alcanzan lejos",
    vinculo:
      "Por su enorme luminosidad pese a la distancia, Deneb se relaciona simbólicamente con lo que llega mucho más allá de donde se hizo, y con quienes trabajan sin ver nunca dónde cae lo que dan.",
    disposicion:
      "Si lo reconoces, puede aparecer cuando alguien te cuenta que algo tuyo le cambió algo, y tú ni siquiera lo recordabas.",
  },
  polaris: {
    familia: "Los puntos de referencia",
    vinculo:
      "Polaris se asocia aquí a quienes sirven de orientación a otros en momentos confusos, y a la responsabilidad de revisar la propia referencia antes de que deje de corresponder.",
    disposicion:
      "Puede invitar a observar cuánta gente te pregunta qué harías tú, y cuándo examinaste por última vez el principio desde el que respondes.",
  },
  capella: {
    familia: "Los que sostienen",
    vinculo:
      "Capella se relaciona simbólicamente, dentro de este marco, con el cuidado que hace habitable la vida de otros y que deja de verse precisamente por funcionar bien.",
    disposicion:
      "Si lo reconoces, puede aparecer en un cansancio de domingo que no sabes atribuir a nada concreto.",
  },
  canopus: {
    familia: "Los que guían sin mandar",
    vinculo:
      "Usada durante siglos para navegar, Canopus se asocia aquí a quienes dan rumbo desde un segundo lugar elegido, sin necesitar el puesto principal.",
    disposicion:
      "Puede invitar a observar qué consejo has dado este año que tú mismo no te has aplicado.",
  },
  achernar: {
    familia: "Los que cierran",
    vinculo:
      "Por su nombre —el fin del río— Achernar se relaciona simbólicamente con el arte de terminar bien, que dentro de este marco se considera una forma de cuidado y no un fracaso.",
    disposicion:
      "Si lo reconoces, puede aparecer como saber antes que nadie que algo se ha acabado, y en que te toque a ti decirlo.",
  },
  geminis: {
    familia: "Los dobles",
    vinculo:
      "Cástor y Pólux se asocian aquí, dentro de este marco, a quienes viven en dos registros propios y auténticos a la vez, y a la disposición a traducir entre mundos que no se hablan.",
    disposicion:
      "Puede invitar a observar ante quién apareces entero, y qué grupos de tu vida no has juntado nunca.",
  },
  perseo: {
    familia: "Los de ritmo propio",
    vinculo:
      "Por Algol, que cambia de brillo cada tres días, Perseo se relaciona simbólicamente con quienes funcionan por ciclos y no por continuidad, y con el derecho a retirarse sin que eso sea un fallo.",
    disposicion:
      "Si lo reconoces, puede aparecer en semanas muy intensas seguidas de semanas en que no contestas a nadie.",
  },
  casiopea: {
    familia: "Los que permanecen",
    vinculo:
      "Al no ponerse nunca bajo el horizonte, Casiopea se asocia aquí a la presencia constante: quienes están siempre y por eso acaban dándose por hechos.",
    disposicion:
      "Puede invitar a observar cuándo dijiste por última vez que no podías, y qué temiste que pasara.",
  },
  cefeo: {
    familia: "Los que preparan",
    vinculo:
      "Por ser la futura estrella polar, Cefeo se relaciona simbólicamente con lo que aún no ha llegado y con quienes trabajan para un momento que quizá no vean.",
    disposicion:
      "Si lo reconoces, puede aparecer en algo que sostienes desde hace años sin ninguna señal externa de que funcione.",
  },
  draco: {
    familia: "Los custodios",
    vinculo:
      "Por Thuban, que fue polar en la época de las pirámides, Draco se asocia aquí a la memoria larga: quienes conservan un saber que el presente ha dejado de considerar central.",
    disposicion:
      "Puede invitar a observar qué sabes hacer que no le has enseñado a nadie todavía.",
  },
  ofiuco: {
    familia: "Los que no encajan",
    vinculo:
      "Ofiuco se relaciona simbólicamente con lo que existe aunque no esté en la lista, y con quienes han tenido que construir criterio propio por no poder heredarlo.",
    disposicion:
      "Si lo reconoces, puede aparecer en el cansancio de tener que explicarte, y en los sitios de los que te fuiste antes de comprobar si había sitio.",
  },
  hercules: {
    familia: "Los que cargan",
    vinculo:
      "Hércules se asocia dentro de este marco a la capacidad de esfuerzo sostenido, y a la pregunta que suele faltar: de quién era la carga antes de que la cogieras.",
    disposicion:
      "Puede invitar a observar qué estás sosteniendo ahora mismo que en realidad le corresponde a otra persona.",
  },
  pegaso: {
    familia: "Los que vuelven a mirar",
    vinculo:
      "Por ser la dirección donde se halló el primer planeta fuera del sistema solar, Pegaso se relaciona simbólicamente con lo que aparece al revisar lo que ya se daba por sabido.",
    disposicion:
      "Si lo reconoces, puede aparecer en la dificultad para dar algo por cerrado, incluso cuando ya lo decidiste.",
  },
  crux: {
    familia: "Los orientadores",
    vinculo:
      "Al señalar un polo sur celeste que no tiene estrella propia, la Cruz del Sur se asocia aquí a quienes deducen la dirección donde nadie la ha marcado.",
    disposicion:
      "Puede invitar a observar cuántas de tus certezas sobre otras personas son en realidad deducciones que nunca preguntaste.",
  },
  centaurus: {
    familia: "Los de doble naturaleza",
    vinculo:
      "Centauro se relaciona simbólicamente con la convivencia interna entre impulso y criterio, y con la disposición a no silenciar ninguna de las dos partes.",
    disposicion:
      "Si lo reconoces, puede aparecer en decisiones pequeñas que discutes contigo mismo más de lo que su tamaño justifica.",
  },
  libra: {
    familia: "Los que reparten",
    vinculo:
      "Libra se asocia aquí a la atención constante al equilibrio entre partes, y al riesgo de que quien administra el reparto se deje siempre fuera de él.",
    disposicion:
      "Puede invitar a observar dónde cediste de más esta semana sin que nadie te lo pidiera.",
  },
  hydra: {
    familia: "Los de recorrido largo",
    vinculo:
      "Por ser la constelación más extensa del cielo, Hidra se relaciona simbólicamente con procesos que duran décadas y que no se dejan ver enteros desde ningún punto.",
    disposicion:
      "Si lo reconoces, puede aparecer al encontrar notas tuyas de hace diez años con la misma pregunta de ahora.",
  },
  corvus: {
    familia: "Los mensajeros",
    vinculo:
      "Corvus se asocia dentro de este marco a la palabra breve y exacta: la frase corta que ordena una situación entera, y que por eso mismo puede herir si llega en mal momento.",
    disposicion:
      "Puede invitar a observar qué dijiste alguna vez que alguien sigue recordando años después.",
  },
  phoenix: {
    familia: "Los que recomienzan",
    vinculo:
      "Fénix se relaciona simbólicamente con reconstruir después de una pérdida, y con el conocimiento práctico —no teórico— de que se puede volver a empezar.",
    disposicion:
      "Si lo reconoces, puede aparecer en la facilidad para romper y en la dificultad para reparar.",
  },
  grus: {
    familia: "Los migrantes",
    vinculo:
      "Grulla se asocia aquí a la lectura del momento: saber cuándo un lugar ha dejado de dar lo que daba, con el riesgo de irse siempre a tiempo y no llegar nunca del todo.",
    disposicion:
      "Puede invitar a observar qué dejaste sin cerrar la última vez que te marchaste.",
  },
  aquarius: {
    familia: "Los que brillan lejos",
    vinculo:
      "Porque sus estrellas son enormes y parecen tenues solo por la distancia, Acuario se relaciona simbólicamente con quienes aportan mucho más de lo que su entorno registra.",
    disposicion:
      "Si lo reconoces, puede aparecer al comprobar que la gente cercana no sabe en qué trabajas de verdad.",
  },
  capricornus: {
    familia: "Los que suben despacio",
    vinculo:
      "Capricornio se asocia dentro de este marco al avance por acumulación, sin atajos, y a la dificultad de reconocer el propio progreso mientras ocurre.",
    disposicion:
      "Puede invitar a observar qué has conseguido en cinco años y no has llegado a celebrar.",
  },
  sagittarius: {
    familia: "Los que apuntan lejos",
    vinculo:
      "Por ser la dirección hacia el corazón de nuestra galaxia, Sagitario se relaciona simbólicamente con la abundancia de caminos posibles y con la necesidad de elegir uno.",
    disposicion:
      "Si lo reconoces, puede aparecer en la cantidad de cosas que tienes abiertas frente a las que realmente avanzan.",
  },
  sculptor: {
    familia: "Los que quitan",
    vinculo:
      "Mirando hacia el polo sur galáctico, fuera del disco de nuestra propia galaxia, Escultor se asocia aquí a dar forma retirando lo que sobra. Dentro de este marco, la afinidad se relaciona simbólicamente con quienes llegan a lo esencial quitando, y con el punto delicado de saber cuándo dejar de quitar.",
    disposicion:
      "Puede invitar a observar qué has eliminado de tu vida que ahora echas en falta.",
  },
  m31: {
    familia: "Los de otra escala",
    vinculo:
      "Por ser otra galaxia entera, visible a simple vista, M31 se relaciona simbólicamente con reconocer que existen sistemas completos fuera del propio, con su lógica intacta.",
    disposicion:
      "Si lo reconoces, puede aparecer en lo mucho que te cuesta enfadarte porque entiendes demasiado bien el motivo del otro.",
  },
  m42: {
    familia: "Los que están naciendo",
    vinculo:
      "Al ser una región donde las estrellas se están formando ahora mismo, M42 se asocia dentro de este marco a lo que todavía no tiene forma y no admite ser nombrado.",
    disposicion:
      "Puede invitar a observar qué llevas dentro que aún no puedes explicarle a nadie.",
  },
  m1: {
    familia: "Los que quedaron después",
    vinculo:
      "Resto de una estrella que estalló y se vio desde la Tierra en 1054, M1 se relaciona simbólicamente con lo que sigue funcionando después de una ruptura, y con construir usando ese material.",
    disposicion:
      "Si lo reconoces, puede aparecer en cuánto de lo que cuentas sobre ti sigue girando alrededor de aquello.",
  },
  m57: {
    familia: "Los que se desprenden",
    vinculo:
      "Siendo las capas que una estrella soltó al final de su vida, M57 se asocia aquí a retirar lo que fue necesario y dejó de serlo, hasta que queda a la vista lo que de verdad sostenía.",
    disposicion:
      "Puede invitar a observar qué papel tuyo ya no corresponde y sigues sosteniendo por costumbre.",
  },
  omega_centauri: {
    familia: "Los herederos",
    vinculo:
      "Posible núcleo de una galaxia absorbida hace muchísimo, Omega Centauri se relaciona simbólicamente con lo recibido antes de poder opinar: familia, lengua, época, todo lo que ya estaba puesto.",
    disposicion:
      "Si lo reconoces, puede aparecer al rastrear una creencia firme tuya hasta una persona concreta.",
  },
  m13: {
    familia: "Los que emiten sin respuesta",
    vinculo:
      "Destino del mensaje de radio enviado desde Arecibo en 1974, M13 se asocia dentro de este marco a dar sin garantía de que llegue, y a sostener eso durante años.",
    disposicion:
      "Puede invitar a observar a quién le sigues hablando que ya dejó de escuchar.",
  },
  virgo_m87: {
    familia: "Los centros silenciosos",
    vinculo:
      "En el corazón de su cúmulo de galaxias, M87 se relaciona simbólicamente con quienes organizan un entorno entero sin hacer ruido y sin notarlo.",
    disposicion:
      "Si lo reconoces, puede aparecer en lo que se descoloca en tu grupo cuando tú no estás.",
  },
  gran_atractor: {
    familia: "Lo que nos lleva",
    vinculo:
      "Masa hacia la que se desplaza toda nuestra galaxia y que no podemos ver de frente, el Gran Atractor se asocia aquí a las direcciones de fondo que no se eligieron y operan igual.",
    disposicion:
      "Puede invitar a observar qué se repite en tu vida con personas y contextos que no se parecen en nada.",
  },
  shapley: {
    familia: "La escala mayor",
    vinculo:
      "La mayor concentración de galaxias del universo cercano se relaciona simbólicamente, dentro de este marco, con una proporción que alivia y marea a la vez.",
    disposicion:
      "Si lo reconoces, puede aparecer en lo que has minimizado diciéndote que no era para tanto y luego volvió.",
  },
  procyon: {
    familia: "Los que llegan antes",
    vinculo:
      "Por salir sobre el horizonte poco antes que Sirio, Procyon se asocia aquí a quienes preparan el terreno y avisan, y cuyo trabajo rara vez se contabiliza.",
    disposicion:
      "Puede invitar a observar cuándo disfrutaste por última vez de algo que tú mismo habías organizado.",
  },
  tau_ceti: {
    familia: "Los semejantes",
    vinculo:
      "Una de las dos primeras estrellas a las que se escuchó buscando señales, Tau Ceti se relaciona simbólicamente con lo que se parece mucho sin ser lo mismo, y con los malentendidos que nacen justo de ese parecido.",
    disposicion:
      "Si lo reconoces, puede aparecer en que discutes más con quien más se te parece.",
  },
  epsilon_eridani: {
    familia: "Los que aún se forman",
    vinculo:
      "Sistema joven, con material todavía asentándose, Epsilon Eridani se asocia dentro de este marco a las etapas que no han cuajado y que desde fuera parecen desorden.",
    disposicion:
      "Puede invitar a observar qué área de tu vida lleva años sin asentarse, y qué has aprendido de cada intento.",
  },
}

/** Aviso que acompaña siempre a esta capa. Es la más fácil de malinterpretar. */
export const AVISO_HERMANDAD =
  "Esto pertenece por completo al marco contemplativo de Los 144.000. No afirma que provengas de ningún sitio ni que pertenezcas a ninguna estirpe: describe una afinidad simbólica y te invita a comprobar si la reconoces en tu vida. Si no la reconoces, no hace falta que te encaje."
