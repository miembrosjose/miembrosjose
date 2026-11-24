// ═══════════════════════════════════════════════════════════════════════════
//  LA SOMBRA DE UN SIGNO, PASANDO POR UN PUNTO DE TU CARTA
// ═══════════════════════════════════════════════════════════════════════════
//
// ── DE DÓNDE SALE ESTO ────────────────────────────────────────────────────
// José lo pidió con un ejemplo que lo explica mejor que cualquier definición:
//
//   «Si yo veo que estoy en desequilibrio en Sagitario, y Sagitario lo tengo
//    en Venus, me debería salir: puede manifestarse como discusiones con la
//    pareja que no se concretan, que no se cierran.»
//
// Yo había montado un enlace con una descripción genérica —«qué valoras y
// cómo te vinculas»— y eso no es el cruce: eso es un índice. Él lo vio
// enseguida: «ese cruce que te acabo de pedir, no lo veo».
//
// Esto es el cruce.
//
// ── POR QUÉ 156 Y NO 1.440 ────────────────────────────────────────────────
// Signo por planeta por casa serían mil cuatrocientos cuarenta textos, y la
// mitad dirían lo mismo con otras palabras. La casa ya está cubierta: sale
// nombrada junto al enlace y su lectura completa está a un toque.
//
// Lo que faltaba de verdad es SIGNO × PUNTO: la sombra de Sagitario a través
// de Venus no se parece a la sombra de Sagitario a través de Saturno. Doce
// signos por trece puntos, y cada uno dice una conducta concreta.
//
// ── CÓMO ESTÁN ESCRITOS ───────────────────────────────────────────────────
// Cada frase sale del CONFLICTO que José escribió para ese signo, aplicado a
// la función de ese punto. Sagitario en sombra «rechaza límites, leyes y
// compromisos, se dispersa y evita el enfrentamiento real» — eso, puesto en
// Venus, es exactamente lo que él describió sin haber leído esta tabla.
//
// Se describe, no se predice. Van en condicional —«puede manifestarse»— y la
// pantalla solo las enseña cuando alguien ha abierto ese signo, no de entrada.

import type { SignoId } from "./signos"
import type { PuntoId } from "../motor/carta"

export const SOMBRA_EN_PUNTO: Record<SignoId, Partial<Record<PuntoId, string>>> = {
  // ── CAPRICORNIO · insatisfacción, exigencia sin descanso, rigidez ───────
  capricornio: {
    sol: "Medirte solo por lo que logras, y que ningún logro alcance. Trabajar sin parar sin sentir nunca que llegaste.",
    luna: "No permitirte necesitar nada. Resolver en vez de apoyarte, y que el descanso te genere culpa.",
    mercurio: "Pensar solo en términos de utilidad. Descartar lo que no sirve para algo y volverte seco al hablar.",
    venus: "Exigir al afecto que rinda. Demostrar cuidado trabajando, y que lo que se da por gusto te parezca tiempo perdido.",
    marte: "Empujar hasta romperte. Confundir constancia con no parar, y seguir cuando el cuerpo ya dijo basta.",
    jupiter: "Negarte lo que ya ganaste. Austeridad que no viene de la falta sino del miedo a aflojar.",
    saturno: "Dureza contigo mismo que nadie te pidió. Una exigencia que no afloja ni cuando el resultado llega.",
    urano: "Rigidez disfrazada de criterio. Rechazar lo nuevo por principio y llamarlo prudencia.",
    neptuno: "Desconfiar de todo lo que no se mide. Cerrar la puerta a lo que no cabe en un plan.",
    pluton: "Controlar para no sentirte frágil. Cargar solo con todo antes que mostrar que algo te puede.",
    nodo_norte: "Creer que el camino es resistir más. Avanzar por aguante en vez de por dirección.",
    ascendente: "Aparecer tan serio que nadie se acerque. Una gravedad que protege y aísla a partes iguales.",
    medio_cielo: "Que el trabajo se coma tu identidad. No saber quién eres cuando no estás produciendo.",
  },

  // ── ACUARIO · innovación sin concretar, despegue, indiferencia ──────────
  acuario: {
    sol: "Empezarlo todo y terminar poco. Ideas brillantes que no bajan a la materia.",
    luna: "Mirar tus emociones desde fuera. Analizar lo que sientes para no tener que sentirlo.",
    mercurio: "Aferrarte a una idea por ser tuya. Brillantez que no escucha porque ya se adelantó.",
    venus: "Querer con distancia. Ofrecer libertad donde el otro pedía presencia, y llamarlo respeto.",
    marte: "Energía a ráfagas. Arrancar con todo, desaparecer, y volver cuando ya no sirve.",
    jupiter: "Teoría por delante de la vida. Un plan para el mundo y ninguno para el martes.",
    saturno: "No pertenecer a ningún sitio y sufrirlo. Rechazar el grupo y echarlo de menos a la vez.",
    urano: "Romper por costumbre. Cambiar no porque haga falta, sino porque quedarse te ahoga.",
    neptuno: "Un ideal que te evita lo concreto. Soñar lo colectivo y no aparecer en lo cercano.",
    pluton: "Desapego que es defensa. Soltar antes de que te suelten.",
    nodo_norte: "Creer que el camino es alejarte más. Independencia que acaba siendo soledad.",
    ascendente: "Caer bien a todos y no acercarte a nadie. Cordialidad que funciona como muro.",
    medio_cielo: "Cambiar de rumbo antes de que algo cuaje. Muchos comienzos y ninguna obra.",
  },

  // ── PISCIS · niega límites, escapa, se dispersa, victimismo ─────────────
  piscis: {
    sol: "Diluirte en lo que te rodea. No saber dónde acabas tú y empieza lo que absorbiste.",
    luna: "Cargar emociones que no son tuyas. Llorar lo ajeno y no reconocer lo propio.",
    mercurio: "Confundir lo que es con lo que te gustaría. Explicaciones que suenan bien y no se sostienen.",
    venus: "Querer a quien no está del todo. Idealizar, perdonar de más y llamar amor a la espera.",
    marte: "Fuerza que se escapa. Enfadarte por dentro, no decirlo, y actuar tarde y torcido.",
    jupiter: "Fe sin examen. Creer en lo que te alivia y no mirar las cuentas.",
    saturno: "No decir que no. Entregarte hasta vaciarte y llamarlo compasión.",
    urano: "Huir en vez de cortar. Desaparecer sin decir nada y dejar lo abierto abierto.",
    neptuno: "Niebla donde debería haber bordes. Evadirte justo cuando lo de fuera aprieta.",
    pluton: "Dejar que te arrastre lo que no miras. Fuerza antigua moviéndose sin nombre.",
    nodo_norte: "Creer que el camino es desaparecer. Disolverte donde tocaba aparecer.",
    ascendente: "Que cada uno vea en ti lo que quiera. Sin contorno propio, te usan de pantalla.",
    medio_cielo: "Una vocación que no termina de decirse. Difícil de explicar y difícil de cobrar.",
  },

  // ── ARIES · ira, conflicto constante, impulso sin responsabilidad ───────
  aries: {
    sol: "Vivir en pelea. Necesitar un adversario para saber quién eres.",
    luna: "Estallar y que se te pase. Dejar heridas que para ti ya no existen.",
    mercurio: "Responder antes de escuchar el final. Discutir para ganar, no para entender.",
    venus: "Enamorarte del impulso. Querer con intensidad y aburrirte cuando toca sostener.",
    marte: "Ir de frente contra todo. Gastar en conquistar lo que no ibas a cuidar después.",
    jupiter: "Lanzarte sin mirar. Confiar en el arranque y no en la preparación.",
    saturno: "Rabia contra el límite. Pelearte con las reglas en vez de con el problema.",
    urano: "Arranques bruscos. Decisiones tomadas en caliente que no se pueden deshacer.",
    neptuno: "Furia que no sabes de dónde viene. Pelear sin que haya nadie enfrente.",
    pluton: "Intensidad que destruye. No medir el daño porque la fuerza te parece razón.",
    nodo_norte: "Creer que el camino es empujar más fuerte. Avanzar a golpes contra lo que cede solo.",
    ascendente: "Llegar como una embestida. Que la gente se tense antes de que digas nada.",
    medio_cielo: "Chocar con toda autoridad. Quemar puentes profesionales por no bajar el tono.",
  },

  // ── TAURO · inmovilidad, aferrarse, placer inmediato ────────────────────
  tauro: {
    sol: "Quedarte donde estás sabiendo que ya no nutre. Comodidad que se parece a la paz.",
    luna: "Calmar con el cuerpo lo que era del ánimo. Comer, dormir o comprar para apaciguar algo que no era hambre.",
    mercurio: "No cambiar de opinión ni con argumentos buenos. Lentitud que deja de ser prudencia.",
    venus: "Aferrarte a un vínculo agotado. Confundir permanencia con amor.",
    marte: "Resistirte en vez de moverte. Terquedad sostenida durante años.",
    jupiter: "Acumular de más. Rodearte de cosas buenas y no disfrutar ninguna.",
    saturno: "Miedo a que falte, aun cuando no falta. Retener por si acaso.",
    urano: "Pánico al cambio. Que lo nuevo te descoloque el cuerpo antes que la cabeza.",
    neptuno: "Idealizar lo material. Creer que con lo de fuera se resuelve lo de dentro.",
    pluton: "Control a través de lo que posees. Que soltar un objeto se sienta como perder un trozo.",
    nodo_norte: "Creer que el camino es asegurar más. Construir muros donde tocaba abrir puertas.",
    ascendente: "Una presencia tan quieta que parece cerrada. Cuesta que entre lo nuevo.",
    medio_cielo: "Quedarte en un puesto que te quedó pequeño porque moverte da más miedo que aburrirte.",
  },

  // ── GÉMINIS · pierde el centro, se dispersa, habla sin decir ────────────
  geminis: {
    sol: "Ser uno distinto con cada persona. Adaptarte tanto que se te olvida desde dónde.",
    luna: "Hablar de lo que sientes para no sentirlo. Contarlo bien y no tocarlo.",
    mercurio: "Saber un poco de todo y nada a fondo. Muchas puertas abiertas, ninguna habitación recorrida.",
    venus: "Vínculos ligeros que no profundizan. Irte cuando la conversación se pone seria.",
    marte: "Energía repartida en diez frentes. Empezar mucho y rematar poco.",
    jupiter: "Abarcar más de lo que cabe en un día. Decir que sí a todo y quedar mal con todos.",
    saturno: "Que te cueste sostener una postura. Cambiar de idea y que dejen de tomarte en serio.",
    urano: "Mente que no para. Ideas a toda velocidad y ninguna aterrizada.",
    neptuno: "Confusión en lo que dices. Acuerdos de palabra que cada uno entendió distinto.",
    pluton: "Usar la palabra para manejar a otros. Convencer en vez de decir la verdad.",
    nodo_norte: "Creer que el camino es saber más. Acumular información en vez de elegir una dirección.",
    ascendente: "Dar una impresión de ligereza que te resta peso. Que no te tomen en serio.",
    medio_cielo: "Saltar de oficio en oficio. Currículum ancho y ninguna experiencia honda.",
  },

  // ── CÁNCER · apego, protección excesiva, control desde el cuidado ───────
  cancer: {
    sol: "Definirte por a quién cuidas. No saber quién eres cuando nadie te necesita.",
    luna: "Memoria emocional que no suelta. Revivir lo que dolió como si acabara de pasar.",
    mercurio: "Razonar desde la herida. No poder ser imparcial sobre lo tuyo.",
    venus: "Cuidar para que no se vayan. Afecto que pide algo a cambio sin decirlo.",
    marte: "Enfado indirecto. Retirarte y que el otro adivine, en vez de decirlo.",
    jupiter: "Sobreproteger. Quitarle al otro el problema y con él la oportunidad de crecer.",
    saturno: "Cerrarte emocionalmente. Haberte endurecido tan pronto que ya parece carácter.",
    urano: "Que el cambio te desestabilice entero. Vivirlo como amenaza y no como movimiento.",
    neptuno: "Idealizar la familia o el pasado. Añorar algo que quizá no fue así.",
    pluton: "Control desde el cuidado. Hacerte imprescindible para que nadie pueda irse.",
    nodo_norte: "Creer que el camino es volver atrás. Buscar en el nido lo que estaba fuera.",
    ascendente: "Una cautela inicial que se lee como frialdad. Te cuesta dejar entrar.",
    medio_cielo: "Sensibilidad al juicio ajeno. Que una crítica pública te tumbe el día.",
  },

  // ── LEO · dictador emocional, brillar a toda costa, necesita aprobación ─
  leo: {
    sol: "Necesitar que te vean para existir. Que el aplauso deje de ser premio y pase a ser condición.",
    luna: "Herirte con el desaire. Que la falta de respuesta te duela más de lo que admites.",
    mercurio: "No poder rectificar en público. Defender una opinión por orgullo y no por convicción.",
    venus: "Querer con exigencia de escenario. Necesitar que el afecto se demuestre y se note.",
    marte: "Pelear por orgullo. Sostener una batalla que ya no vale la pena por no retirarte.",
    jupiter: "Agrandarlo todo. Prometer en público lo que después toca cumplir en privado.",
    saturno: "No permitirte brillar. Pedir permiso para ocupar un sitio que ya era tuyo.",
    urano: "Buscar ser distinto a toda costa. Originalidad que es otra forma de llamar la atención.",
    neptuno: "Construir un personaje. Disfrazarte según el público y perder de vista quién eras.",
    pluton: "Convertir el carisma en control. Que la gente te siga y no sepa por qué.",
    nodo_norte: "Creer que el camino es destacar más. Buscar el reconocimiento en vez de la obra.",
    ascendente: "Ocupar tanto espacio al entrar que los demás se encojan.",
    medio_cielo: "Que la imagen pública pese más que el trabajo. Cuidar cómo se ve y no cómo está.",
  },

  // ── VIRGO · obsesión, control, miedo al error, crítica ──────────────────
  virgo: {
    sol: "Exigirte una perfección que nadie te pidió. Que lo bien hecho nunca esté bastante bien.",
    luna: "Calmarte ordenando. Que la ansiedad se vuelva lista de tareas y nunca se mire de frente.",
    mercurio: "Corregir lo que nadie pidió. Ver el fallo antes que la persona.",
    venus: "Criticar justo a quien más quieres. Demostrar afecto señalando lo mejorable.",
    marte: "Desgastarte por autoexigencia más que por trabajo. Repetir lo que ya estaba bien.",
    jupiter: "Detalle llevado hasta donde ya no aporta. Pulir una semana lo que servía el lunes.",
    saturno: "Parálisis por perfeccionismo. No empezar por no poder garantizar el resultado.",
    urano: "Rigidez con las rutinas. Que un cambio pequeño te descomponga el día entero.",
    neptuno: "Hipocondría o alarma difusa. Síntomas que crecen cuanto más se miran.",
    pluton: "Control disfrazado de ayuda. Asumir el papel de quien todo lo sabe y todo lo corrige.",
    nodo_norte: "Creer que el camino es afinar más. Perfeccionar el instrumento y no tocar nunca.",
    ascendente: "Una distancia que parece evaluación. Que la gente sienta que la estás midiendo.",
    medio_cielo: "Cargar con lo que nadie quiere hacer. Volverte imprescindible y no reconocido.",
  },

  // ── LIBRA · disfraza, tapa, indeciso, evita el conflicto ────────────────
  libra: {
    sol: "No saber qué quieres cuando no hay nadie enfrente. Definirte por el acuerdo.",
    luna: "Que el conflicto te descomponga físicamente. Callar para que no haya mal ambiente.",
    mercurio: "Ver los dos lados y no poder decidir. Honestidad que acaba en parálisis.",
    venus: "Ceder lo tuyo para que no se rompa. Una relación sostenida sobre lo que no dijiste.",
    marte: "Rabia acumulada por no sacarla a tiempo. Estallar por algo pequeño tres meses después.",
    jupiter: "Complacer para no perder el favor de nadie. Decir que sí y resentirlo.",
    saturno: "Compromisos que pesan como condena. Quedarte por deber y no por elección.",
    urano: "Romper de golpe lo que llevabas años aguantando en silencio.",
    neptuno: "Maquillar la realidad. Tapar lo que está mal hasta que ya no se puede tapar.",
    pluton: "Manipular desde la amabilidad. Conseguir sin pedir y sin que se note.",
    nodo_norte: "Creer que el camino es agradar más. Buscar armonía donde tocaba tomar partido.",
    ascendente: "Un trato tan agradable que nadie sabe qué piensas de verdad.",
    medio_cielo: "No defender tu posición profesional. Que te pasen por encima con buenas maneras.",
  },

  // ── ESCORPIO · rencor, desconfianza, no olvida, aprieta la herida ───────
  escorpio: {
    sol: "Guardarlo todo. Una vida interior intensa que nadie ve y que pesa sola.",
    luna: "No soltar lo que dolió. Memoria emocional que revive intacta años después.",
    mercurio: "Dar vueltas a lo que ya está cerrado. Investigar una herida hasta reabrirla.",
    venus: "Celos y control en el vínculo. Confundir intensidad con amor.",
    marte: "Esperar el momento para devolver el golpe. Estrategia donde cabía una conversación.",
    jupiter: "Riesgo con lo que no es tuyo. Mover recursos ajenos con una confianza que no toca.",
    saturno: "Desconfianza que se vuelve estructura. No depender de nadie, nunca, por principio.",
    urano: "Cortes radicales. Desaparecer de una vida sin explicación y sin vuelta.",
    neptuno: "Sospechar de todo. Ver intenciones ocultas donde no las hay.",
    pluton: "Lucha de poder en lo íntimo. Que ganar le gane a estar bien.",
    nodo_norte: "Creer que el camino es controlar más. Apretar justo lo que había que soltar.",
    ascendente: "Una intensidad que la gente nota y no sabe nombrar. Fascinas o incomodas.",
    medio_cielo: "Manejar lo que otros no quieren tocar, y que eso te deje marcado en público.",
  },

  // ── SAGITARIO · rechaza límites, se dispersa, evita el enfrentamiento ───
  sagitario: {
    sol: "Confundir libertad con no comprometerte. Empezar caminos y no recorrer ninguno entero.",
    luna: "Irte cuando la cosa se pone pesada. Buscar aire justo cuando tocaba quedarse.",
    mercurio: "Teorías bien armadas sobre lo que no has mirado de cerca. Generalizar y llamarlo visión.",
    venus: "Discusiones con la pareja que no se concretan ni se cierran. Prometer sin aterrizar, y marcharte antes de resolver.",
    marte: "Entusiasmo que arranca y no remata. Empezar más de lo que terminas.",
    jupiter: "Prometer de más. Agrandar lo que vas a hacer y quedarte corto en lo que haces.",
    saturno: "Rechazar límites, leyes y compromisos. Que cada estructura se sienta cárcel.",
    urano: "Largarte sin aviso. Cambiarlo todo de golpe para no tener que explicar nada.",
    neptuno: "Fe que te evita lo concreto. Confiar en que se resolverá para no resolverlo.",
    pluton: "Imponer tu verdad como si fuera la única. Convencer con fuerza en vez de escuchar.",
    nodo_norte: "Creer que el camino es irte más lejos. Buscar fuera lo que pedía quedarse.",
    ascendente: "Una franqueza que dice de más. Sinceridad que llega antes que el tacto.",
    medio_cielo: "Dispersarte profesionalmente. Muchos horizontes y ninguna casa construida.",
  },
}

/**
 * Cómo se manifiesta la sombra de un signo a través de un punto concreto.
 *
 * Devuelve `null` si no hay texto, en vez de una cadena vacía: la pantalla
 * debe poder distinguir «no hay nada escrito» de «hay algo y está en blanco»,
 * y no pintar un hueco sin explicación.
 */
export function sombraEn(signo: SignoId, punto: PuntoId): string | null {
  return SOMBRA_EN_PUNTO[signo]?.[punto] ?? null
}
