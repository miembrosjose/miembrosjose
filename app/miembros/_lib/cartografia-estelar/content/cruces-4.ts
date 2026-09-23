// CARTOGRAFÍA ESTELAR 144 — cruces portal × punto natal (4 de 4).
//
// CAPA B. Centro Galáctico, y ensamblado de los 140 cruces manuales.
//
// El Centro Galáctico no describe carácter: describe una relación con la
// escala y con la pregunta de fondo. Sus cruces se escriben en ese registro.

import type { PuntoNatalId } from "../domain/types"
import { CRUCES_1 } from "./cruces-1"
import { CRUCES_2 } from "./cruces-2"
import { CRUCES_3 } from "./cruces-3"

const CRUCES_CENTRO: Record<string, Record<PuntoNatalId, string>> = {
  centro_galactico: {
    sol: "La pregunta de fondo forma parte de aquello con lo que la persona se identifica. Suele traducirse en no poder sostener durante mucho tiempo algo que carece de sentido para uno, aunque funcione, aunque convenga y aunque nadie entienda por qué se deja. Da dirección y hace difíciles las etapas puramente prácticas, que son inevitables en cualquier vida. Se observa en qué has dejado que iba objetivamente bien y no significaba nada para ti.",
    luna: "La escala entra por la vía menos deliberada. Puede manifestarse como un alivio físico ante lo muy grande —el mar, el cielo abierto, la noche— y como una inquietud de fondo en las temporadas donde todo es cotidiano y nada excede lo inmediato. No pasa por el razonamiento: llega antes, y por eso no se resuelve pensando. Se observa en qué buscas cuando necesitas calmarte de verdad, y en si está dentro o fuera de casa.",
    mercurio: "El tema entra por la mente. Suele traducirse en volver, cada pocos años, exactamente a la misma pregunta formulada de otra manera, con la sensación incómoda de no haber avanzado cuando en realidad se ha profundizado. Aporta hondura y dificulta las conversaciones que se quedan en la superficie, que son la mayoría. Se observa en qué pregunta aparece en tus cuadernos de hace diez años y en los de ahora.",
    venus: "El valor se mide contra algo muy grande. Puede manifestarse como una exigencia de profundidad en los vínculos, que funciona muy bien con quien la comparte y resulta pesada con quien quería algo más simple y también legítimo. El riesgo es descartar relaciones buenas por no ser trascendentes. Se observa en cuántas relaciones has descartado por parecerte ligeras, y en si alguna de ellas seguía ahí años después.",
    marte: "La acción necesita un para qué. Suele traducirse en una energía muy alta cuando hay sentido y en una dificultad real para movilizarse cuando no lo hay, aunque la tarea sea sencilla y lleve quince minutos. No es pereza: sin la conexión con el motivo, el mecanismo no arranca. Se observa en qué llevas sin hacer que es fácil y no significa nada para ti, y en cuánto tiempo lleva ahí.",
    jupiter: "El sentido entra por la función del sentido. Puede manifestarse como una búsqueda amplia y sostenida, con estudios, viajes o prácticas que la alimentan durante décadas, y como el riesgo de que la búsqueda acabe sustituyendo a la vida que se estaba buscando. Buscar se convierte en la actividad, no en el camino hacia otra. Se observa en cuánto de tu tiempo se va en buscar frente a vivir lo ya encontrado.",
    saturno: "La pregunta de fondo se vuelve oficio. Suele traducirse en organizar una vida entera alrededor de una orientación sostenida durante décadas, con la coherencia que eso da y la rigidez que puede producir cuando la orientación deja de corresponder y aun así sigue mandando. Revisarla implicaría desmontar mucho. Se observa en qué decisión tomaste hace mucho y sigue gobernando tu vida sin haberla reexaminado.",
    urano: "El centro entra por la ruptura. Puede manifestarse como una revisión súbita de aquello que se daba por fundamental, que reordena todo lo demás en poco tiempo y desconcierta a quien te rodea. Produce cambios de vida grandes y suele llegar tras años de acumulación silenciosa, de modo que lo repentino es la salida, no el proceso. Se observa en qué certeza tuya se cayó de golpe y qué la había ido erosionando.",
    neptuno: "La escala entra por lo difuso. Suele traducirse en una relación con lo que excede el yo que se vive más como atmósfera que como idea, difícil de explicar sin sentir que se traiciona. Aparece dificultad para distinguir entre una orientación profunda y una huida hacia lo indefinido, porque ambas alejan de lo concreto y ambas se sienten como amplitud. Se observa en qué estás evitando mientras buscas.",
    pluton: "El origen se vuelve un asunto de fondo. Puede manifestarse como una necesidad de llegar a la raíz de lo que sostiene la propia vida, atravesando lo que haga falta y sin aceptar respuestas de circunstancia, ni siquiera las que funcionarían. Esa exigencia da hondura real y deja pocas zonas de descanso. Se observa en qué pregunta no te dejas responder con algo cómodo, y en cuántos años llevas con ella.",
    nodo_norte: "La dirección menos automática pasa por lo pequeño. Dentro de esta metodología señala que atender lo cotidiano sin exigirle sentido es el territorio que enseña. Suele parecer una pérdida de tiempo, y esa lectura aparece tan rápido que impide comprobar qué pasaría si se sostuviera unas semanas. Se observa en qué haces cada día que no necesita significar nada, y en si te permites hacerlo sin justificarlo.",
    nodo_sur: "El terreno practicado es la pregunta grande. Es un recurso real —se distingue muy rápido lo importante de lo accesorio, y eso orienta— y también el refugio: buscar el sentido de fondo es la manera conocida de aplazar las decisiones de delante, y además resulta admirable desde fuera, de modo que nadie lo señala. Se observa en qué decisión concreta llevas aplazando mientras piensas en lo esencial.",
    ascendente: "El tema está en la puerta. Suele traducirse en entrar en las situaciones preguntándose para qué, lo que da una presencia reflexiva y a veces distante en contextos que solo pedían participar sin más. Esa pausa inicial se percibe, y puede leerse como desinterés cuando es justo lo contrario. Se observa en cuánto tardas en implicarte en algo ligero, y en si llegas a implicarte del todo.",
    medio_cielo: "La contribución pública es recordar el para qué. Puede manifestarse en un papel donde lo que se aporta es la orientación de fondo cuando todos se han quedado en el procedimiento, función que resulta imprescindible de vez en cuando y agotadora si se ejerce siempre. El momento importa tanto como el contenido. Se observa en qué preguntas tú en las reuniones que nadie más hace, y en cómo se reciben.",
  },
}

/**
 * Los 140 cruces escritos a mano: diez portales por catorce puntos natales.
 *
 * Los otros cuarenta portales componen su lectura con el motor editorial,
 * que combina portal, punto, aspecto y exactitud. Esa composición también
 * produce texto completo: no hay portal sin lectura.
 */
export const CRUCES_MANUALES: Record<string, Record<PuntoNatalId, string>> = {
  ...CRUCES_1,
  ...CRUCES_2,
  ...CRUCES_3,
  ...CRUCES_CENTRO,
}

export function cruceManual(portalId: string, punto: PuntoNatalId): string | null {
  return CRUCES_MANUALES[portalId]?.[punto] ?? null
}
