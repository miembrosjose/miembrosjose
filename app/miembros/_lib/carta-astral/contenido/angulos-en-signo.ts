// ═══════════════════════════════════════════════════════════════════════════
//  EL ASCENDENTE Y EL MEDIO CIELO EN CADA SIGNO
// ═══════════════════════════════════════════════════════════════════════════
//
// ── EL HUECO QUE HABÍA ────────────────────────────────────────────────────
// Los 120 textos de «planeta en signo» cubren los diez planetas. El
// Ascendente y el Medio Cielo NO son planetas, así que se quedaron fuera — y
// el Ascendente es uno de los tres puntos que la herramienta enseña arriba
// del todo, en grande.
//
// O sea que la pantalla decía «Ascendente: Acuario» y no había una sola línea
// explicando qué significa eso. Lo detectó José usándolo. Esto lo cierra.
//
// ── POR QUÉ NO VALE REUTILIZAR EL TEXTO DEL SOL ───────────────────────────
// Habría sido rápido: el Sol en Acuario y el Ascendente en Acuario comparten
// el signo. Pero dicen cosas distintas. El Sol es lo que vienes a ser; el
// Ascendente es cómo apareces antes de abrir la boca. Alguien puede tener un
// Sol en Capricornio reservado y un Ascendente en Leo que entra en las salas
// como si fueran suyas, y las dos cosas son verdad a la vez.
//
// El Medio Cielo es otra cosa más: el lugar público, la vocación, lo que la
// gente dice de ti cuando no estás.

import type { SignoId } from "./signos"

export const ASCENDENTE_EN_SIGNO: Record<SignoId, string> = {
  aries: "Llegas rápido y de frente. Lo primero que se percibe es energía e iniciativa: pareces alguien que va a hacer algo. Da una presencia que abre paso, y una tendencia a arrancar antes de haber mirado el terreno.",
  tauro: "Apareces con calma y sin prisa. Transmites solidez y una cierta quietud que tranquiliza a los demás. Cuesta que te muevan de donde estás, y eso se lee como firmeza o como terquedad según quién mire.",
  geminis: "Entras hablando y preguntando. Pareces accesible, curioso y rápido, y conectas con cualquiera en dos minutos. La contrapartida es una impresión de dispersión: se duda de dónde estás realmente.",
  cancer: "Apareces con cuidado y a cierta distancia hasta que te sientes seguro. Transmites cercanía y protección, y hay una cautela inicial que a algunos les parece reserva.",
  leo: "Entras y se nota. Hay calidez, presencia y algo de teatro en el buen sentido. Da facilidad para ocupar el centro, y dificultad para pasar desapercibido cuando convendría.",
  virgo: "Apareces discreto, atento y correcto. Observas antes de participar y se te percibe fiable. La contrapartida es una impresión de distancia o de estar evaluando, aunque por dentro solo te estés situando.",
  libra: "Apareces agradable y conciliador. Cuidas la forma, el trato y el aspecto, y eso abre puertas casi siempre. Cuesta mostrar desacuerdo en el primer encuentro.",
  escorpio: "Apareces contenido e intenso. Dices poco al principio y observas mucho, lo que genera reacciones fuertes: fascina o incomoda, rara vez deja indiferente.",
  sagitario: "Entras con franqueza y buen humor. Transmites apertura y ganas de que pase algo. La contrapartida es una espontaneidad que a veces dice más de lo que convenía.",
  capricornio: "Apareces serio y medido desde joven. Transmites responsabilidad y se te toma en serio antes de haber demostrado nada. Cuesta mostrarte ligero, y la reserva puede leerse como frialdad.",
  acuario: "Apareces como alguien que no termina de encajar en la categoría obvia, y eso se percibe enseguida. Hay cordialidad y a la vez distancia: tratas bien a todos y no te acercas del todo a nadie al principio. Da una independencia visible, y una dificultad con la intimidad rápida.",
  piscis: "Apareces suave y permeable, y cada persona percibe en ti algo distinto. Transmites sensibilidad y poca amenaza. La contrapartida es la falta de contorno: cuesta que se vea dónde están tus límites.",
}

export const MEDIO_CIELO_EN_SIGNO: Record<SignoId, string> = {
  aries: "Tu lugar público se gana abriendo camino. Funcionas donde haya que empezar algo o tomar la delantera, y se te reconoce por la iniciativa más que por la permanencia.",
  tauro: "Tu lugar público se construye despacio y se sostiene. Funcionas en lo que requiere constancia y criterio, y se te reconoce por la fiabilidad.",
  geminis: "Tu lugar público pasa por la palabra: comunicar, enseñar, conectar, moverte entre mundos. Se te reconoce por saber explicar.",
  cancer: "Tu lugar público tiene que ver con cuidar y sostener a otros. Funcionas donde haga falta crear un espacio seguro, y se te reconoce por la cercanía.",
  leo: "Tu lugar público pide visibilidad. Funcionas donde se te vea y se te atribuya lo tuyo, y se te reconoce por la presencia y la generosidad.",
  virgo: "Tu lugar público se gana con el oficio bien hecho. Funcionas donde importe el detalle y la mejora continua, y se te reconoce por la competencia.",
  libra: "Tu lugar público pasa por el trato y el acuerdo. Funcionas mediando, representando o cuidando la forma, y se te reconoce por el equilibrio.",
  escorpio: "Tu lugar público tiene que ver con lo profundo: investigar, acompañar crisis, manejar lo que otros no quieren tocar. Se te reconoce por la intensidad y la discreción.",
  sagitario: "Tu lugar público pasa por enseñar, viajar o difundir algo en lo que crees. Se te reconoce por la amplitud de miras.",
  capricornio: "Tu lugar público se gana con tiempo y responsabilidad. El reconocimiento llega tarde y llega firme, y se te reconoce por la autoridad.",
  acuario: "Tu lugar público no sigue el camino esperado: oficios nuevos, independencia, o una causa colectiva. Se te reconoce por hacerlo a tu manera.",
  piscis: "Tu lugar público tiene algo de llamada más que de carrera: arte, cuidado, espiritualidad. Se te reconoce por la sensibilidad, aunque cueste explicar a qué te dedicas.",
}

/** El texto del Ascendente o del Medio Cielo, o `null` si no es ninguno. */
export function textoAngulo(id: string, signo: SignoId): string | null {
  if (id === "ascendente") return ASCENDENTE_EN_SIGNO[signo] ?? null
  if (id === "medio_cielo") return MEDIO_CIELO_EN_SIGNO[signo] ?? null
  return null
}
