// ═══════════════════════════════════════════════════════════════════════════
//  LOS ASPECTOS, EXPLICADOS
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ NO HAY 325 TEXTOS ─────────────────────────────────────────────
// Cinco aspectos por sesenta y cinco parejas son trescientos veinticinco
// textos. Escribirlos uno a uno garantiza dos cosas: que se tarden meses y
// que acaben repitiéndose entre sí, porque «Venus trígono Marte» y «Venus
// sextil Marte» dicen casi lo mismo.
//
// Se parte en dos piezas que se combinan:
//
//   · LA PAREJA dice de qué va el asunto. Venus y Marte son siempre el deseo
//     y el acuerdo: cómo convive lo que quieres con lo que te gusta.
//   · EL ASPECTO dice en qué términos. Un trígono lo resuelve solo; una
//     cuadratura obliga a elegir.
//
// Sesenta y cinco más cinco, y la lectura sale igual de concreta.
//
// ── LAS PAREJAS SE GUARDAN ORDENADAS ──────────────────────────────────────
// La clave es la de los dos identificadores ordenados alfabéticamente y
// unidos por una barra. Así «Sol con Luna» y «Luna con Sol» caen en la misma
// entrada, y no hay forma de escribir una y olvidar la otra.

import type { PuntoId } from "../motor/carta"
import type { AspectoId } from "../motor/aspectos"

/** Cómo se comporta cada aspecto, sea cual sea la pareja. */
export const COMO_ACTUA: Record<AspectoId, { titulo: string; texto: string }> = {
  conjuncion: {
    titulo: "Van juntos",
    texto: "Los dos actúan a la vez y cuesta distinguirlos: no se turnan, se mezclan. Da mucha fuerza en ese terreno y poca distancia para verlo con objetividad.",
  },
  oposicion: {
    titulo: "Se tiran de los extremos",
    texto: "Dos necesidades reales que piden cosas contrarias. Se suele vivir primero como un conflicto con alguien de fuera, hasta que se reconoce que las dos partes son tuyas. Cuando se equilibran, dan una amplitud que no tiene quien no las sufrió.",
  },
  trigono: {
    titulo: "Fluye solo",
    texto: "Funciona sin esfuerzo y por eso pasa desapercibido: es un talento que no se nota porque nunca costó. El riesgo es no usarlo, precisamente por fácil.",
  },
  cuadratura: {
    titulo: "Obliga a elegir",
    texto: "Dos fuerzas que se estorban y no admiten las dos a la vez. Produce tensión y movimiento: es el aspecto que más incomoda y el que más construye, porque no deja quedarse quieto.",
  },
  sextil: {
    titulo: "Está disponible",
    texto: "Una facilidad que hay que activar. No actúa sola como el trígono: se ofrece, y funciona si se toma. Es la oportunidad que pasa por delante.",
  },
}

/**
 * De qué va cada pareja. Ordenadas alfabéticamente por sus identificadores.
 */
export const PAREJAS: Record<string, string> = {
  // ── Sol ──
  "luna|sol": "Entre lo que vienes a ser y lo que necesitas para estar bien. Si van de acuerdo, hay una coherencia interna que se nota; si no, se vive una contradicción entre el deber y las ganas.",
  "mercurio|sol": "Entre quien eres y cómo lo piensas y lo dices. Siempre están cerca, así que lo que cambia es si la palabra acompaña a la identidad o se le adelanta.",
  "sol|venus": "Entre tu identidad y lo que valoras. Toca el gusto, el afecto y la relación con lo propio: cuánto de quien eres cabe en lo que eliges querer.",
  "marte|sol": "Entre quien eres y cómo actúas. Es el asunto de la voluntad: si tu empuje va hacia donde tú vas, o se gasta en otra dirección.",
  "jupiter|sol": "Entre tu identidad y cómo creces. Toca la confianza en uno mismo: si sostiene o si se infla.",
  "saturno|sol": "Entre quien eres y lo que te exiges. Es el asunto de la autoridad: la que ejerces y la que te formó. Suele doler pronto y dar solidez tarde.",
  "sol|urano": "Entre tu identidad y tu necesidad de romper el molde. Cuánto de ti cabe en lo que se espera de ti.",
  "neptuno|sol": "Entre quien eres y lo que te disuelve. Toca la inspiración y también la dificultad de saber dónde acabas tú.",
  "pluton|sol": "Entre tu identidad y lo que te transforma. Es el asunto del poder: ejercerlo, resistirlo, o reconstruirse después de perderlo.",

  // ── Luna ──
  "luna|mercurio": "Entre lo que sientes y cómo lo piensas. Si hablas lo que te pasa, o si lo analizas para no sentirlo.",
  "luna|venus": "Entre lo que necesitas y lo que te gusta. Afecto, cuidado y la relación con el propio cuerpo.",
  "luna|marte": "Entre la necesidad y el impulso. Cómo llevas el enfado y qué haces cuando algo tuyo se toca.",
  "jupiter|luna": "Entre lo que te calma y lo que te expande. Generosidad emocional, y la tentación de llenar un hueco agrandando.",
  "luna|saturno": "Entre la necesidad y el límite. Suele hablar de un afecto que costó o de una madurez emocional adelantada.",
  "luna|urano": "Entre lo que necesitas y tu necesidad de libertad. Altibajos, independencia emocional, dificultad con la rutina afectiva.",
  "luna|neptuno": "Entre la necesidad y la niebla. Sensibilidad muy abierta, y poros donde debería haber bordes.",
  "luna|pluton": "Entre lo que necesitas y lo que te transforma. Intensidad emocional, apego profundo, y lo heredado por vía materna.",

  // ── Mercurio ──
  "mercurio|venus": "Entre cómo piensas y qué valoras. La palabra puesta al servicio del acuerdo y de lo bello.",
  "marte|mercurio": "Entre el pensamiento y la acción. Agudeza, capacidad de discutir, y a veces una lengua más rápida que la prudencia.",
  "jupiter|mercurio": "Entre el detalle y el conjunto. Capacidad de enseñar y de narrar, con riesgo de exagerar al contar.",
  "mercurio|saturno": "Entre la palabra y la estructura. Pensamiento riguroso, lento de arranque y difícil de rebatir.",
  "mercurio|urano": "Entre el pensamiento y lo que lo rompe. Intuiciones súbitas, originalidad, y poca paciencia con el ritmo ajeno.",
  "mercurio|neptuno": "Entre la palabra y la imagen. Imaginación y poesía, con dificultad para la precisión.",
  "mercurio|pluton": "Entre el pensamiento y lo profundo. Capacidad de investigar y de ver lo que no se dice.",

  // ── Venus ──
  "marte|venus": "Entre lo que quieres y lo que te gusta. Es el eje del deseo: cómo convive el impulso con el acuerdo.",
  "jupiter|venus": "Entre el afecto y la abundancia. Generosidad, gusto por lo bueno, y la tentación del exceso.",
  "saturno|venus": "Entre el afecto y el límite. Vínculos serios y duraderos, con dificultad para la expresión espontánea.",
  "urano|venus": "Entre el vínculo y la libertad. Atracción por lo inesperado y resistencia al formato de siempre.",
  "neptuno|venus": "Entre el amor y la idealización. Ternura sin condiciones, y el riesgo de querer a quien no está del todo.",
  "pluton|venus": "Entre el afecto y la intensidad. Vínculos que transforman, con control o entrega total.",

  // ── Marte ──
  "jupiter|marte": "Entre la acción y la expansión. Empuje con confianza, y riesgo de lanzarse sin medir.",
  "marte|saturno": "Entre el impulso y el freno. Esfuerzo sostenido y capacidad de aguante; también frustración cuando no se avanza.",
  "marte|urano": "Entre la acción y la ruptura. Reflejos rápidos, valentía, y movimientos bruscos.",
  "marte|neptuno": "Entre la acción y la niebla. Energía que se escapa, y una fuerza que aparece entera cuando se trata de otro.",
  "marte|pluton": "Entre la fuerza y la transformación. Resistencia enorme y una intensidad que conviene dirigir.",

  // ── Lentos entre sí ──
  "jupiter|saturno": "Entre crecer y consolidar. El pulso entre la oportunidad y la prudencia, que toda una generación comparte.",
  "jupiter|urano": "Entre la expansión y la ruptura. Oportunidades repentinas y golpes de suerte poco ortodoxos.",
  "jupiter|neptuno": "Entre la fe y el sueño. Idealismo amplio, con poco sentido del límite.",
  "jupiter|pluton": "Entre el crecimiento y el poder. Ambición de fondo y capacidad de mover grandes cosas.",
  "saturno|urano": "Entre la estructura y lo que la rompe. El pulso entre conservar y cambiar.",
  "neptuno|saturno": "Entre el límite y la disolución. Realismo y sueño peleándose; cuando se entienden, dan una espiritualidad con los pies en el suelo.",
  "pluton|saturno": "Entre la estructura y lo que la derriba. Procesos largos de reconstrucción, en lo personal y en lo colectivo.",
  "neptuno|urano": "Entre la ruptura y el sueño colectivo. Es de generación: marca una época, no a una persona.",
  "pluton|urano": "Entre la ruptura y la transformación profunda. De generación: las épocas en que todo se reordena.",
  "neptuno|pluton": "Entre lo que se disuelve y lo que se transforma. De generación, y de las lentas: marca siglos, no vidas.",

  // ── Con el Ascendente ──
  "ascendente|sol": "Entre quien eres y cómo apareces. Si lo que se ve de ti coincide con lo que hay dentro.",
  "ascendente|luna": "Entre lo que necesitas y cómo te presentas. Lo emocional se transparenta en el gesto.",
  "ascendente|mercurio": "Entre tu presencia y tu palabra. Te presentas hablando y se te identifica con lo que dices.",
  "ascendente|venus": "Entre cómo apareces y lo que valoras. Trato agradable y cuidado de la forma.",
  "ascendente|marte": "Entre tu presencia y tu empuje. Se te nota la iniciativa antes de que digas nada.",
  "ascendente|jupiter": "Entre cómo apareces y cómo creces. Das confianza y se espera mucho de ti.",
  "ascendente|saturno": "Entre tu presencia y el peso que cargas. Seriedad temprana y una reserva que se lee como distancia.",
  "ascendente|urano": "Entre cómo apareces y lo que no encaja. Hay algo tuyo que no se deja clasificar.",
  "ascendente|neptuno": "Entre tu presencia y lo difuso. Cada uno ve en ti algo distinto.",
  "ascendente|pluton": "Entre tu presencia y la intensidad. La gente reacciona fuerte a ti, a favor o en contra.",

  // ── Con el Medio Cielo ──
  "medio_cielo|sol": "Entre quien eres y tu lugar en el mundo. Si la profesión expresa la identidad o la tapa.",
  "luna|medio_cielo": "Entre lo que necesitas y lo que se espera de ti en público. Lo privado y lo visible se tocan.",
  "medio_cielo|mercurio": "Entre tu palabra y tu figura pública. Se te escucha en lo profesional.",
  "medio_cielo|venus": "Entre lo que valoras y tu vocación. El gusto y el oficio tienden a juntarse.",
  "marte|medio_cielo": "Entre tu empuje y tu carrera. Ambición visible y choques con la autoridad.",
  "jupiter|medio_cielo": "Entre tu crecimiento y tu lugar público. Oportunidades que llegan por confianza ajena.",
  "medio_cielo|saturno": "Entre la carrera y la exigencia. Reconocimiento lento y autoridad que nadie puede retirarte.",
  "medio_cielo|urano": "Entre tu lugar público y tu independencia. Trayectoria con giros y poco escalafón.",
  "medio_cielo|neptuno": "Entre la vocación y la llamada. La imagen pública es difusa o se presta a malentendidos.",
  "medio_cielo|pluton": "Entre tu lugar público y el poder. Al menos un derrumbe y una reconstrucción.",
}

/** La clave de una pareja, en el orden que la tabla guarda. */
export function clavePareja(a: PuntoId, b: PuntoId): string {
  return [a, b].sort().join("|")
}

/** De qué va la pareja, o `null` si no está escrita. */
export function textoPareja(a: PuntoId, b: PuntoId): string | null {
  return PAREJAS[clavePareja(a, b)] ?? null
}
