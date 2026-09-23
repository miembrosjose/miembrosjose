// CARTOGRAFÍA ESTELAR 144 — los catorce puntos natales como lentes.
//
// CAPA B. Un contacto no dice lo mismo según por dónde entre: un portal que
// toca la Luna no es el mismo portal tocando Mercurio. Lo que cambia no es el
// portal, es la FUNCIÓN de la experiencia que queda implicada.
//
// Ninguno de estos textos afirma lo que alguien es. Describen una función y
// dónde puede observarse.

import type { ContenidoPunto } from "./tipos"
import type { PuntoNatalId } from "../domain/types"

export const PUNTOS: Record<PuntoNatalId, ContenidoPunto> = {
  sol: {
    nombre: "Sol",
    lente: "identidad consciente · centro · expresión",
    funcion:
      "El centro desde el que alguien se reconoce a sí mismo. No es el carácter entero: es la parte que se elige, la que se sostiene a propósito y la que se defiende cuando se pone en duda.",
    cuandoEsTocado:
      "El tema del portal no queda en un rincón de la experiencia: toca aquello con lo que la persona se identifica. Suele ser difícil de ver como algo separado de uno mismo, precisamente porque se vive como la propia manera de ser.",
    seReconoceEn:
      "Aquello que dirías si alguien te preguntara quién eres y no pudieras responder con tu profesión. También en lo que te ofende cuando lo niegan.",
    pregunta: "¿Qué parte de ti sostienes incluso cuando nadie la aplaude?",
  },

  luna: {
    nombre: "Luna",
    lente: "memoria · respuesta emocional · pertenencia",
    funcion:
      "La respuesta que aparece antes de pensar. Lo que hace sentir a salvo, lo que se busca al final del día, la manera automática de reaccionar cuando algo aprieta.",
    cuandoEsTocado:
      "El tema del portal entra por la vía menos deliberada. Aparece en el estado de ánimo, en lo que calma y en lo que inquieta, mucho antes de que haya una explicación disponible.",
    seReconoceEn:
      "Lo que haces sin decidirlo cuando estás cansado. A quién llamas cuando algo va mal. Qué ambiente te deja descansar de verdad.",
    pregunta: "¿Qué necesitas para sentirte a salvo, y cuándo aprendiste a necesitarlo?",
  },

  mercurio: {
    nombre: "Mercurio",
    lente: "mente · lenguaje · aprendizaje",
    funcion:
      "Cómo se recoge información, cómo se ordena y cómo se pasa a otros. No mide inteligencia: describe una manera de pensar y de hablar.",
    cuandoEsTocado:
      "El tema del portal se vuelve algo sobre lo que se piensa y se habla. Puede convertirse en un interés que vuelve, en una manera de explicar las cosas, o en el asunto que aparece siempre en las conversaciones largas.",
    seReconoceEn:
      "Los temas que buscas por tu cuenta sin que nadie te los pida. La forma de explicar algo cuando quieres que se entienda de verdad.",
    pregunta: "¿Sobre qué vuelves a leer, preguntar o hablar sin habértelo propuesto?",
  },

  venus: {
    nombre: "Venus",
    lente: "valor · vínculo · reciprocidad",
    funcion:
      "Qué se considera valioso y cómo se entra en relación con ello. Incluye el gusto, el afecto y también el criterio con que se decide qué merece tiempo.",
    cuandoEsTocado:
      "El tema del portal aparece en lo que atrae y en lo que se elige. Suele notarse en las relaciones, pero también en qué trabajos se aceptan, qué se compra y qué se conserva.",
    seReconoceEn:
      "Aquello a lo que dices que sí con facilidad. Lo que te cuesta cobrar. Con quién te resulta natural compartir y con quién no.",
    pregunta: "¿Qué das con facilidad y qué esperas a cambio sin haberlo pedido?",
  },

  marte: {
    nombre: "Marte",
    lente: "acción · deseo · capacidad de decir no",
    funcion:
      "Cómo se empieza algo y cómo se sostiene cuando aparece resistencia. También cómo se pone un límite, que es la misma función mirada al revés.",
    cuandoEsTocado:
      "El tema del portal se vuelve algo que se hace, no solo algo que se siente o se piensa. Puede aparecer como impulso claro o como fricción: las dos cosas son esta función trabajando.",
    seReconoceEn:
      "Qué te pone en marcha sin esfuerzo. Con qué discutes. Cuánto tardas en decir que no cuando ya sabes que quieres decirlo.",
    pregunta: "¿Qué estás evitando empezar, y qué es exactamente lo que te detiene?",
  },

  jupiter: {
    nombre: "Júpiter",
    lente: "expansión · sentido · confianza",
    funcion:
      "Dónde se busca más: más margen, más significado, más mundo. También el lugar donde se confía, a veces con razón y a veces demasiado pronto.",
    cuandoEsTocado:
      "El tema del portal aparece asociado a crecimiento y a sentido. Tiende a ser un territorio donde se es generoso y donde se corre el riesgo de prometer por encima de lo sostenible.",
    seReconoceEn:
      "En qué áreas te vienes arriba. Qué explicas a otros con entusiasmo. Dónde has dicho que sí antes de mirar el calendario.",
    pregunta: "¿Dónde estás tomando más de lo que puedes sostener, y por qué te cuesta reconocerlo?",
  },

  saturno: {
    nombre: "Saturno",
    lente: "estructura · límite · responsabilidad",
    funcion:
      "Lo que exige tiempo y no admite atajos. Donde algo se construye despacio, se equivoca, se corrige y acaba sosteniéndose. También donde aparece el miedo a no dar la talla.",
    cuandoEsTocado:
      "El tema del portal no llega regalado. Pide oficio, repetición y aguante. Lo que se consigue aquí suele ser lo más sólido que alguien tiene, y también lo que más le costó.",
    seReconoceEn:
      "Lo que haces bien y te sigue costando. Aquello en lo que te exiges más de lo que exigirías a otro. Lo que has repetido durante años.",
    pregunta: "¿Qué estás sosteniendo por responsabilidad y ya nadie te pidió que sostuvieras?",
  },

  urano: {
    nombre: "Urano",
    lente: "ruptura · diferencia · liberación",
    funcion:
      "Lo que no encaja del todo y por eso abre. Donde alguien hace las cosas de otra manera, a veces con coste y a veces con acierto.",
    cuandoEsTocado:
      "El tema del portal aparece ligado a lo que rompe una continuidad. Puede vivirse como libertad o como inestabilidad, y con frecuencia como las dos a la vez en distintos momentos.",
    seReconoceEn:
      "En qué te has sentido distinto desde siempre. Qué normas incumples sin dramatizarlo. Qué cambios has hecho de golpe.",
    pregunta: "¿Qué cambiarías mañana si no tuvieras que explicárselo a nadie?",
  },

  neptuno: {
    nombre: "Neptuno",
    lente: "sensibilidad · imaginación · permeabilidad",
    funcion:
      "Donde los bordes se vuelven finos. Permite imaginar, sentir lo que no se ha dicho y conectar con algo más amplio que uno mismo; también permite confundirse con facilidad.",
    cuandoEsTocado:
      "El tema del portal llega sin contorno claro. Se reconoce más por atmósfera que por hechos, y suele costar explicarlo sin sentir que se traiciona lo que se quería decir.",
    seReconoceEn:
      "Lo que te emociona sin motivo proporcionado. Dónde idealizas. En qué situaciones absorbes el estado de otros sin darte cuenta.",
    pregunta: "¿Qué estás sintiendo ahora mismo que en realidad no es tuyo?",
  },

  pluton: {
    nombre: "Plutón",
    lente: "intensidad · poder · transformación",
    funcion:
      "Lo que no admite término medio. Donde algo se vive a fondo, se pierde, se remueve y vuelve cambiado. También donde aparece el control, que es el intento de que eso no ocurra.",
    cuandoEsTocado:
      "El tema del portal no se toca a la ligera. Tiende a asociarse a procesos que no se eligen del todo y que dejan a la persona distinta de como entró.",
    seReconoceEn:
      "Lo que no cuentas. Dónde controlas más de lo necesario. Qué situaciones te remueven más de lo que parecería razonable.",
    pregunta: "¿Qué estás intentando controlar porque no soportas no saber cómo termina?",
  },

  nodo_norte: {
    nombre: "Nodo Norte",
    lente: "dirección de aprendizaje · lo menos automático",
    funcion:
      "Un territorio que no viene practicado. Dentro de esta metodología señala la dirección menos automática: aquello que, cuando se hace, cuesta más y enseña más.",
    cuandoEsTocado:
      "El tema del portal aparece como algo hacia lo que hay que moverse a propósito. No suele sentirse natural al principio, y esa incomodidad es parte de lo que lo señala.",
    seReconoceEn:
      "Lo que te atrae y te da pereza a la vez. Aquello que pospones aunque sabes que te haría bien. Lo que admiras en otros.",
    pregunta: "¿Qué llevas años posponiendo que no es urgente y sabes que te cambiaría?",
  },

  nodo_sur: {
    nombre: "Nodo Sur",
    lente: "patrón conocido · recurso ya desarrollado",
    funcion:
      "Lo que ya se sabe hacer. Dentro de esta metodología señala el terreno practicado: un recurso real, y también el sitio al que se vuelve cuando algo se pone difícil.",
    cuandoEsTocado:
      "El tema del portal aparece por la vía de lo ya conocido. Es una capacidad disponible, con el riesgo de que se use como refugio en vez de como herramienta.",
    seReconoceEn:
      "Aquello que te sale sin pensar y que otros te piden. También lo que haces cuando quieres evitar hacer otra cosa.",
    pregunta: "¿Qué haces tan bien que has dejado de preguntarte si hace falta hacerlo?",
  },

  ascendente: {
    nombre: "Ascendente",
    lente: "forma de entrar · primera respuesta",
    funcion:
      "Cómo se empieza. La primera reacción ante algo nuevo, la manera de aparecer en una sala, el gesto con que se entra en una situación antes de decidir nada.",
    cuandoEsTocado:
      "El tema del portal está en la puerta, no en el fondo. Se expresa en cómo la persona inicia, se presenta y responde de entrada, muchas veces sin haberlo elegido.",
    seReconoceEn:
      "Lo que otros dicen de ti al conocerte, aunque luego se corrija. Cómo entras en un sitio donde no conoces a nadie.",
    pregunta: "¿Qué muestras primero, y cuánto se parece a lo que hay debajo?",
  },

  medio_cielo: {
    nombre: "Medio Cielo",
    lente: "contribución · visibilidad · expresión pública",
    funcion:
      "Aquello por lo que alguien acaba siendo reconocido. No es el trabajo necesariamente: es la parte que se ve desde fuera y que deja algo en un entorno más amplio que el privado.",
    cuandoEsTocado:
      "El tema del portal tiende a salir al exterior. Puede convertirse en oficio, en aportación o en aquello que otros esperan de la persona, con lo bueno y lo pesado que eso tiene.",
    seReconoceEn:
      "Para qué te buscan. Qué se te reconoce aunque no lo hayas buscado. Qué te gustaría que quedara de lo que haces.",
    pregunta: "¿Lo que se ve de ti se parece a lo que más te importa?",
  },
}

/** Orden de lectura: estructurales primero, luego personales, luego lentos. */
export const ORDEN_PUNTOS: PuntoNatalId[] = [
  "sol", "luna", "ascendente", "medio_cielo",
  "mercurio", "venus", "marte",
  "jupiter", "saturno", "urano", "neptuno", "pluton",
  "nodo_norte", "nodo_sur",
]
