// ═══════════════════════════════════════════════════════════════════════════
//  QUÉ ES CADA CASA Y QUÉ ES CADA PLANETA
// ═══════════════════════════════════════════════════════════════════════════
//
// Antes de decir «Venus en la casa 2» hay que haber dicho qué es Venus y qué
// es la casa 2. Si no, la frase suena a jerga y quien la lee se queda igual.
//
// ── CÓMO ESTÁN ESCRITOS ───────────────────────────────────────────────────
// En la voz de los textos de Cartografía Estelar: concretos, observables, sin
// predecir nada. Un planeta en una casa no anuncia lo que va a pasar — dice
// dónde se nota un asunto y en qué se traduce en el día a día.
//
// Nada de «sufrirás pérdidas por causa de una mujer». Eso es la astrología de
// 1912, que además es lo único que está libre de derechos, y por eso no se
// ha usado: sale gratis y sale mal.
//
// ── ESTO NO ES DE NINGÚN LIBRO ────────────────────────────────────────────
// Escrito para Los 144.000. No se ha copiado de ninguna fuente con derechos,
// que era justo el problema que había que evitar.

export type PlanetaId =
  | "sol" | "luna" | "mercurio" | "venus" | "marte"
  | "jupiter" | "saturno" | "urano" | "neptuno" | "pluton"

export type Significado = {
  nombre: string
  /** Una línea. Lo que cabe en una tarjeta. */
  breve: string
  /** El párrafo, para quien abre. */
  largo: string
}

/**
 * Las doce casas: los doce terrenos de una vida.
 *
 * El signo dice CÓMO; la casa dice DÓNDE. El mismo Marte se nota en el
 * trabajo o en la pareja según en qué casa caiga, y esa es la diferencia que
 * más cuesta explicar y más aclara cuando se entiende.
 */
export const CASAS: Record<number, Significado> = {
  1: {
    nombre: "La puerta",
    breve: "Cómo apareces antes de haber dicho nada.",
    largo: "La casa 1 es la entrada: el cuerpo, el gesto, lo primero que los demás registran de ti. No es lo que eres, es por dónde se llega a ti. Lo que cae aquí se nota en los diez primeros segundos y marca el tono de todo lo que viene después. Se observa en cómo entras en un sitio donde no conoces a nadie.",
  },
  2: {
    nombre: "Lo que sostiene",
    breve: "Tus recursos y lo que crees que vales.",
    largo: "La casa 2 es lo que te sostiene: el dinero, los bienes, el cuerpo como herramienta, y por debajo de todo eso, lo que consideras que mereces. Las dos cosas van juntas más de lo que parece — lo que alguien cobra suele parecerse a lo que cree valer. Se observa en cómo pones un precio a tu trabajo, y en qué haces con lo que llega.",
  },
  3: {
    nombre: "El entorno cercano",
    breve: "Cómo hablas, aprendes y te mueves cerca.",
    largo: "La casa 3 es el trato diario: hermanos, vecinos, el barrio, los recados, la forma de preguntar y de explicar. Es la inteligencia práctica, la que sirve para moverse por el mundo inmediato. Se observa en cómo pides una información que no tienes, y en si te resulta fácil o costoso iniciar una conversación con alguien del día a día.",
  },
  4: {
    nombre: "La raíz",
    breve: "De dónde vienes y dónde te recoges.",
    largo: "La casa 4 es el suelo: la familia de origen, la casa, el linaje, el sitio al que uno vuelve cuando se acaba el día. Es la parte de ti que nadie ve en público y que explica casi todo lo demás. Se observa en qué haces al llegar a casa, y en qué parte de tu historia familiar repites sin haberlo elegido.",
  },
  5: {
    nombre: "Lo que sale de ti",
    breve: "Crear, jugar, querer sin cálculo.",
    largo: "La casa 5 es la expresión: lo que haces porque sí, los hijos, el juego, el enamoramiento, lo que creas sin que nadie lo encargue. Es donde se ve si te permites disfrutar o si todo tiene que justificarse. Se observa en qué haces cuando tienes una tarde libre y nadie te mira.",
  },
  6: {
    nombre: "El oficio y el cuerpo",
    breve: "La rutina, el servicio y la salud.",
    largo: "La casa 6 es el trabajo de cada día — no la vocación, sino la tarea: los horarios, los hábitos, la gente con la que compartes labor, y el cuerpo que lo aguanta. Aquí se ve cómo tratas lo repetido y lo que el cuerpo hace cuando se le exige de más. Se observa en tu relación con las rutinas que no elegiste.",
  },
  7: {
    nombre: "El otro",
    breve: "Pareja, socios y adversarios.",
    largo: "La casa 7 es el encuentro de tú a tú: la pareja, los socios, también quien se te enfrenta. Describe qué buscas en otro y qué le entregas sin darte cuenta. Lo que está aquí suele vivirse como si viniera de fuera, en la gente que atraes. Se observa en qué tipo de persona se repite en tu vida, y en qué sueles ceder para que algo no se rompa.",
  },
  8: {
    nombre: "Lo que se transforma",
    breve: "Lo compartido, lo íntimo y lo que termina.",
    largo: "La casa 8 es lo que no se enseña: la intimidad profunda, el dinero que se comparte, las deudas, las herencias, las crisis que cambian a alguien de sitio. Es donde se muere algo para que nazca otra cosa. Se observa en cómo llevas depender de alguien, y en qué haces cuando algo se acaba de verdad.",
  },
  9: {
    nombre: "Lo que amplía",
    breve: "Creencias, viajes largos, sentido.",
    largo: "La casa 9 es lo que te saca del barrio: los estudios que cambian la cabeza, los viajes largos, la fe, la filosofía, lo extranjero. Es donde buscas un sentido que no cabe en lo cotidiano. Se observa en qué temas te hacen perder la noción del tiempo, y en cuánto necesitas creer en algo más grande que tú.",
  },
  10: {
    nombre: "Lo visible",
    breve: "Tu lugar en el mundo y lo que se espera de ti.",
    largo: "La casa 10 es tu figura pública: la profesión, la reputación, lo que la gente dice de ti cuando no estás. También la autoridad — la que ejerces y la que te formó. Es el punto más alto de la carta, lo que se ve desde lejos. Se observa en cómo respondes a «¿y tú a qué te dedicas?».",
  },
  11: {
    nombre: "Los tuyos",
    breve: "Amigos, grupos y lo que esperas del futuro.",
    largo: "La casa 11 es lo colectivo elegido: los amigos, el grupo, la causa, la gente con la que compartes una dirección. También los proyectos a largo plazo y la esperanza que los sostiene. Se observa en cómo te comportas dentro de un grupo, y en si tus planes de futuro los haces solo o con otros.",
  },
  12: {
    nombre: "Lo que no se ve",
    breve: "El retiro, lo inconsciente, lo que se suelta.",
    largo: "La casa 12 es lo que ocurre a puerta cerrada: el retiro, el silencio, lo que haces sin testigos, y lo que arrastras sin haberlo nombrado. Es la casa de lo que se disuelve, y también la del descanso verdadero. Se observa en qué necesitas hacer a solas para volver a ti, y en qué sueles postergar hasta que te alcanza.",
  },
}

/**
 * Los diez planetas: diez funciones, no diez personajes.
 *
 * Cada uno es una capacidad en funcionamiento. Verlos como personajes con
 * intenciones es lo que convierte la astrología en superstición.
 */
export const PLANETAS: Record<PlanetaId, Significado> = {
  sol: {
    nombre: "Sol",
    breve: "Lo que vienes a ser.",
    largo: "El Sol es el centro: la identidad en construcción, aquello hacia lo que una vida tiende cuando no la empujan. No es lo que ya eres, es lo que se te pide llegar a ser. Donde está el Sol hay vitalidad, y también la exigencia de brillar ahí aunque cueste.",
  },
  luna: {
    nombre: "Luna",
    breve: "Lo que necesitas para estar bien.",
    largo: "La Luna es la necesidad básica: lo que te calma, lo que te altera, el hábito al que vuelves sin pensarlo. Es la parte más antigua de ti, la que se formó antes de que tuvieras palabras. Donde está la Luna, reaccionas antes de decidir.",
  },
  mercurio: {
    nombre: "Mercurio",
    breve: "Cómo piensas y cómo lo dices.",
    largo: "Mercurio es el modo de procesar: cómo aprendes, cómo ordenas lo que te llega, con qué palabras lo devuelves. No mide inteligencia, describe un estilo. Donde está Mercurio, hablas más y entiendes más rápido.",
  },
  venus: {
    nombre: "Venus",
    breve: "Qué valoras y cómo te vinculas.",
    largo: "Venus es el criterio del gusto y del afecto: qué te parece hermoso, qué te parece justo, cómo te acercas a lo que quieres y qué pides a cambio. También cómo manejas el dinero, que es otra forma de decir qué valoras. Donde está Venus, buscas acuerdo y belleza.",
  },
  marte: {
    nombre: "Marte",
    breve: "Cómo actúas y cómo peleas.",
    largo: "Marte es la fuerza aplicada: cómo empiezas algo, cómo defiendes lo tuyo, qué haces con la rabia. Es el planeta del deseo que se convierte en movimiento. Donde está Marte, hay energía disponible y también el punto donde más fácilmente se enciende un conflicto.",
  },
  jupiter: {
    nombre: "Júpiter",
    breve: "Por dónde creces y dónde te pasas.",
    largo: "Júpiter amplía lo que toca. Es la confianza, la oportunidad, la generosidad y el sentido de que hay más. Su lado difícil es el exceso: donde está Júpiter, se tiende a agrandar, a prometer de más y a dar por hecho que saldrá bien.",
  },
  saturno: {
    nombre: "Saturno",
    breve: "Dónde cuesta, y dónde se construye de verdad.",
    largo: "Saturno es el límite y la estructura. Señala el terreno donde las cosas no se regalan, donde hace falta tiempo, repetición y aguante. Es el planeta que peor fama tiene y el que más construye: lo que se levanta ahí, se queda. Donde está Saturno, maduras tarde y maduras bien.",
  },
  urano: {
    nombre: "Urano",
    breve: "Dónde rompes el molde.",
    largo: "Urano es el corte: lo que no admite seguir igual. Trae lucidez repentina, independencia y una incomodidad con lo establecido. Donde está Urano, nada termina de asentarse, y ahí está tanto la libertad como la dificultad para sostener una forma.",
  },
  neptuno: {
    nombre: "Neptuno",
    breve: "Dónde se disuelven los bordes.",
    largo: "Neptuno quita contornos. Da sensibilidad, inspiración y compasión, y también confusión y ganas de no mirar. Donde está Neptuno, cuesta distinguir lo que es de lo que se desea que sea, y ahí viven tanto el arte como el autoengaño.",
  },
  pluton: {
    nombre: "Plutón",
    breve: "Dónde se juega el poder y la transformación.",
    largo: "Plutón trabaja en profundidad y sin prisa. Señala lo que tiene que morir para que otra cosa pueda existir, y el terreno donde se juegan el control, la intensidad y la verdad que no se dice. Donde está Plutón, nada se queda en la superficie.",
  },
}

/**
 * Por qué Plutón, Urano y Neptuno dicen menos de ti que el resto.
 *
 * Tardan entre siete y veinte años en cambiar de signo: toda una generación
 * los tiene igual. Por eso en esta herramienta pesan 1 y el Sol pesa 3 — y
 * por eso conviene decirlo en pantalla, antes de que alguien lea su Plutón
 * como si fuera un rasgo personal.
 */
export const AVISO_GENERACIONALES =
  "Urano, Neptuno y Plutón tardan años en cambiar de signo: en ese signo están " +
  "todos los nacidos en tu época, no solo tú. Lo que sí es tuyo es la CASA en " +
  "la que caen, que depende de tu hora y tu lugar de nacimiento."

/**
 * Lo que esta herramienta es y lo que no.
 *
 * Va en pantalla, no escondido en un desplegable. Mismo criterio que el aviso
 * de dos capas de la Cartografía Estelar.
 */
export const AVISO_DOS_CAPAS =
  "Las posiciones son astronomía: se calculan en tu dispositivo con la misma " +
  "precisión que usa un observatorio, y se pueden comprobar. La lectura es otra " +
  "cosa: es simbólica, es nuestra, y no es un diagnóstico de nada. Si algo del " +
  "cuerpo te preocupa, eso se consulta con quien sabe de cuerpos."
