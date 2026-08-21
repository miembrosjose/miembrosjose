// Contenido de los "Archivos de Sergel" — Temporada 1, episodios 3 a 7.
// Se renderiza con <EpisodioArchivo> como una COMPOSICIÓN VISUAL (arquitecturas
// con flechas, tarjetas-nodo, columnas, chips, cajas) en la estética del Ep. 2.
//
// Los episodios 1 y 2 NO se tocan (el 2 usa components/EpisodioBloque).
// La selección es por nº de episodio + palabras clave del título.

import type { ArchivoContent } from "@/components/EpisodioArchivo"

const EP3_SEMILLA_ESTELAR: ArchivoContent = {
  lead: "Toda semilla trae memoria del lugar donde fue originada, y revela su propósito cuando acepta germinar en la tierra que la recibe.",
  sections: [
    { kind: "arch", caption: "Proceso de germinación", stack: [
      "MEMORIA ESTELAR", "↓", "ENCARNACIÓN HUMANA", "↓", "SERVICIO EN LA TIERRA",
    ] },
    { kind: "nodes", items: [
      { label: "Memoria estelar", text: "El alma conserva registros de otros sistemas, planos o civilizaciones de conciencia. Esa memoria se siente como nostalgia por el cielo, sensibilidad profunda o certeza interior de misión." },
      { label: "Encarnación humana", text: "La semilla acepta cuerpo, emoción, familia, tiempo y olvido. La frecuencia estelar entra en la densidad para aprender a expresarse desde lo humano." },
      { label: "Servicio en la Tierra", text: "La memoria madura al volverse presencia concreta: sanar, crear, cuidar, enseñar, acompañar, proteger la vida o sostener luz en medio del caos." },
    ] },
    { kind: "box", formula: "CIELO + TIERRA = GERMINACIÓN", lines: [
      "El origen estelar entrega dirección.",
      "La Tierra entrega raíz.",
      "La misión nace cuando ambas memorias cooperan dentro del alma encarnada.",
    ] },
  ],
  registro: "Una semilla estelar despierta cuando su origen deja de ser identidad y se convierte en responsabilidad.",
  cierre: "La memoria del cielo alcanza su forma más alta cuando aprende a servir en la Tierra.",
}

const EP4_HERIDA_DEL_OLVIDO: ArchivoContent = {
  lead: "El alma aceptó olvidar para entrar en la experiencia humana con libertad real.",
  sections: [
    { kind: "arch", caption: "Tecnología de encarnación", stack: [
      "ACUERDO PREVIO", "↓", "VELO DEL OLVIDO", "↓", "RECORDACIÓN GRADUAL",
    ] },
    { kind: "nodes", items: [
      { label: "Acuerdo previo", text: "Antes de nacer, el alma observa vínculos, aprendizajes, desafíos, dones y rutas posibles. La vida se prepara como un campo exacto de experiencia." },
      { label: "Velo del olvido", text: "La memoria se comprime para que el amor, la elección y el aprendizaje nazcan desde la libertad. El alma entra en la vida y se descubre desde dentro." },
      { label: "Recordación gradual", text: "El recuerdo vuelve por capas: primero sensación, luego intuición, después comprensión y finalmente integración." },
    ] },
    { kind: "chips", label: "La memoria permanece activa", chips: [
      "Sueños", "Símbolos", "Talentos", "Miedos inexplicables", "Lugares que llaman", "Encuentros que despiertan", "Sensaciones de misión",
    ] },
    { kind: "note", text: "La herida del olvido se siente como nostalgia de algo esencial. Esa nostalgia señala memoria que espera madurez para abrirse." },
  ],
  registro: "La herida del olvido sana cuando la encarnación se reconoce como el escenario elegido para recuperar la luz desde dentro de la experiencia.",
  cierre: "El recuerdo auténtico llega cuando la conciencia está preparada para sostenerlo.",
}

const EP5_NOMBRE_QUE_OLVIDASTE: ArchivoContent = {
  lead: "Antes de recibir un nombre humano, tu conciencia ya emitía una vibración reconocible dentro de la Creación.",
  sections: [
    { kind: "arch", caption: "Arquitectura de la clave personal", stack: [
      "NOMBRE CÓSMICO", "=", "ORIGEN", "+", "DESPERTAR",
    ] },
    { kind: "twoCol", cols: [
      { label: "Primera parte del nombre", text: "Sonido original del alma al nacer como ser individual dentro de la Creación. Aquí se registra la nota primordial, la firma vibracional y la frecuencia que permanece más allá de vidas, cuerpos e historias." },
      { label: "Terminación cósmica", text: "Las dos últimas letras del nombre indican el momento del despertar espiritual. Señalan el punto en que la conciencia comienza a reconocer su camino, su misión y su retorno consciente." },
    ] },
    { kind: "box", title: "Trabajo con el Nombre Cósmico" },
    { kind: "twoCol", cols: [
      { label: "Meditación lunar", sublabel: "Lunes · Miércoles · Viernes", lines: ["Interioriza.", "Escucha.", "Afina.", "Recibe la vibración desde planos profundos."] },
      { label: "Meditación solar", sublabel: "Martes · Jueves · Sábados", lines: ["Proyecta.", "Afirma.", "Irradia.", "Ancla la vibración en la acción consciente."] },
    ] },
    { kind: "pairs", rows: [
      ["Lunar recibe", "Solar proyecta"],
      ["Lunar abre memoria", "Solar activa propósito"],
    ] },
    { kind: "note", text: "El nombre cósmico se recibe, se practica, se afina y se desarrolla. Su repetición consciente actúa como un diapasón interior: ordena la frecuencia, despierta memoria y alinea la identidad humana con la vibración esencial del alma." },
  ],
  registro: "El nombre cósmico guarda el sonido de tu origen y la señal de tu despertar. Al recordarlo, la identidad humana comienza a alinearse con la memoria esencial del alma.",
  cierre: "Tu nombre verdadero ordena el camino.",
}

const EP6_GRAN_MISION_TIERRA: ArchivoContent = {
  lead: "La Tierra fue preparada como un punto de integración dentro del Plan Cósmico.",
  sections: [
    { kind: "arch", caption: "Síntesis planetaria", stack: [
      "CUERPO", "+", "EMOCIÓN", "+", "MENTE", "+", "ESPÍRITU", "=", "SÍNTESIS PLANETARIA",
    ] },
    { kind: "nodes", items: [
      { label: "Cuerpo", text: "La conciencia aprende a expresarse dentro de la materia." },
      { label: "Emoción", text: "El alma descubre vínculo, dolor, compasión, profundidad y amor." },
      { label: "Mente", text: "La experiencia se vuelve comprensión, elección y responsabilidad." },
      { label: "Espíritu", text: "La memoria superior desciende para actuar dentro de la vida cotidiana." },
    ] },
    { kind: "box", title: "La Tierra como proyecto evolutivo", text: "Muchas civilizaciones desarrollaron mente, tecnología, organización o espiritualidad en líneas separadas. La Tierra reunió esas fuerzas en un mismo escenario para producir integración." },
    { kind: "box", title: "La humanidad como sistema nervioso", text: "Cada pensamiento, emoción, conflicto, acto de amor o decisión colectiva genera información dentro del campo planetario. Cuando una persona sana, la Tierra registra una posibilidad nueva." },
    { kind: "box", formula: "AMOR = TECNOLOGÍA EVOLUTIVA", lines: [
      "Amor como capacidad de integrar opuestos sin destruirlos.",
      "Amor como elección consciente dentro del conflicto.",
      "Amor como respuesta que la Tierra entrega al cosmos.",
    ] },
  ],
  registro: "La misión de la Tierra consiste en demostrar que la conciencia puede atravesar la densidad, recordar el amor y transformar la experiencia humana en una respuesta para el cosmos.",
  cierre: "La Tierra enseña integración.",
}

const EP7_PROPOSITO_Y_DISCERNIMIENTO: ArchivoContent = {
  lead: "El propósito de vida se revela cuando una persona aprende a reconocer la felicidad profunda de su alma.",
  sections: [
    { kind: "arch", caption: "Ruta de coherencia", stack: [
      "FELICIDAD DEL ALMA", "↓", "PROPÓSITO", "↓", "DISCERNIMIENTO",
    ] },
    { kind: "nodes", items: [
      { label: "Felicidad del alma", text: "Alegría profunda que aparece cuando la vida se alinea con la verdad interior. El alma se expande donde hay vida y se contrae donde existe desgaste." },
      { label: "Propósito", text: "Dirección del alma expresada en servicio, creación, sanación, enseñanza, cuidado, arte, presencia o construcción de algo que devuelve vida." },
      { label: "Discernimiento", text: "Capacidad de reconocer la vibración de cada señal por sus frutos: claridad, libertad, humildad, paz y responsabilidad." },
    ] },
    { kind: "box", title: "El niño interior como puerta del propósito", text: "Jesús señaló la infancia como camino de regreso a la esencia. El niño interior conserva memoria de la alegría original: lo que emocionaba, lo que nacía sin esfuerzo, lo que el mundo intentó apagar y lo que el alma hacía antes de traicionarse para encajar." },
    { kind: "twoCol", cols: [
      { label: "Señal verdadera", chips: ["Paz profunda", "Claridad", "Humildad", "Libertad interior", "Responsabilidad"] },
      { label: "Interferencia", chips: ["Urgencia", "Confusión", "Dependencia", "Superioridad", "Miedo", "Separación"] },
    ] },
    { kind: "triad", lines: ["El espíritu inspira.", "El alma traduce.", "La acción encarna."] },
    { kind: "note", text: "El propósito se vuelve real cuando baja a decisiones concretas: cómo vivo, cómo amo, cómo trabajo, cómo cuido mi energía, cómo escucho mi cuerpo y cómo sostengo coherencia cuando la vida me prueba." },
  ],
  registro: "El propósito florece cuando la felicidad deja de ser búsqueda externa y se convierte en una forma de vivir en verdad, coherencia y servicio.",
  cierre: "La dicha del alma muestra el camino. El discernimiento sostiene el rumbo.",
}

/**
 * Contenido del archivo de Sergel para un episodio de la Temporada 1 (solo 3–7).
 * Retorna null para el resto (incluidos Ep. 1 y 2, que no se tocan).
 */
export function getSeason1Archivo(num: number, title: string): ArchivoContent | null {
  const t = (title || "").toLowerCase()
  if (num === 3 || /semilla/.test(t)) return EP3_SEMILLA_ESTELAR
  if (num === 4 || (/herida/.test(t) && /olvid/.test(t))) return EP4_HERIDA_DEL_OLVIDO
  if (num === 5 || (/nombre/.test(t) && /olvid/.test(t))) return EP5_NOMBRE_QUE_OLVIDASTE
  if (num === 6 || (/misi[oó]n/.test(t) && /tierra/.test(t))) return EP6_GRAN_MISION_TIERRA
  if (num === 7 || /prop[oó]sito/.test(t)) return EP7_PROPOSITO_Y_DISCERNIMIENTO
  return null
}
