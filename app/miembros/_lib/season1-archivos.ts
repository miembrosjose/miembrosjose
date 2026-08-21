// Contenido de los "Archivos de Sergel" — Temporada 1, episodios 3 a 7.
// Se renderiza con <EpisodioArchivo> (mismo lenguaje visual que el Episodio 2).
//
// Los episodios 1 y 2 NO se tocan (el 2 usa components/EpisodioBloque).
// La selección es por nº de episodio + palabras clave del título, para no
// romperse si se renumera o cambia levemente el título guardado en el banco.

import type { ArchivoContent } from "@/components/EpisodioArchivo"

const EP3_SEMILLA_ESTELAR: ArchivoContent = {
  lead: "Tu alma llegó a la Tierra portando memoria de otros mundos y aceptó germinar dentro de la experiencia humana.",
  formula: "ORIGEN ESTELAR × ENCARNACIÓN = SERVICIO",
  formulaCaption: "Proceso de germinación",
  blocks: [
    { type: "p", text: "Una semilla estelar es una conciencia que trae registros de otros sistemas, planos o civilizaciones del cosmos. Su memoria puede expresarse como nostalgia por las estrellas, sensibilidad ante el dolor del mundo, rechazo a la violencia, atracción por lo sagrado o una sensación persistente de haber venido para algo." },
    { type: "p", text: "Esa memoria, al entrar en la Tierra, atraviesa cuerpo, emoción, familia, tiempo, olvido y libre albedrío. La semilla acepta una densidad mayor para transformar su frecuencia en experiencia. El origen estelar funciona como raíz; la vida humana funciona como terreno." },
    { type: "p", text: "El verdadero proceso comienza cuando la memoria deja de quedarse en nostalgia y empieza a convertirse en servicio. La semilla estelar madura cuando aprende a ser humana, cuando habita su cuerpo, honra la Tierra y pone su sensibilidad al servicio de la vida concreta." },
    { type: "p", text: "La misión puede expresarse de muchas formas: sanar un linaje, cuidar el planeta, crear belleza, acompañar procesos, enseñar, proteger la vida, abrir conciencia o sostener una frecuencia de paz en medio del caos." },
    { type: "p", text: "La Tierra también posee almas profundamente ligadas a su memoria planetaria. El encuentro entre semillas estelares y almas terráqueas forma parte del Plan. El cielo trae dirección. La Tierra entrega raíz. La evolución ocurre cuando ambas memorias cooperan." },
  ],
  registro: "Una semilla estelar revela su madurez cuando su origen deja de ser identidad y se convierte en responsabilidad.",
  cierre: "La memoria estelar encuentra su forma más alta cuando aprende a servir en la Tierra.",
}

const EP4_HERIDA_DEL_OLVIDO: ArchivoContent = {
  lead: "El alma aceptó olvidar para entrar en la experiencia humana con libertad real.",
  formula: "ACUERDO PREVIO → VELO → RECORDACIÓN",
  formulaCaption: "Tecnología de encarnación",
  blocks: [
    { type: "p", text: "Antes de nacer, el alma observa posibilidades. Reconoce vínculos, pruebas, dones, heridas, aprendizajes y rutas de expansión. Desde ese plano, la vida humana aparece como un escenario preciso dentro de un proceso mayor." },
    { type: "p", text: "Al entrar en el cuerpo, la conciencia acepta el velo. Ese velo comprime la memoria para que cada elección nazca desde la experiencia. El alma olvida para amar, decidir, aprender y responder desde la libertad, y no desde una certeza impuesta por el recuerdo completo." },
    { type: "p", text: "La memoria permanece activa en capas profundas. Aparece en sueños, símbolos, intuiciones, talentos, miedos inexplicables, atracción por ciertos lugares, rechazo ante determinadas energías, encuentros significativos y sensaciones de misión." },
    { type: "p", text: "La herida del olvido se siente como nostalgia interior. Una parte del ser sabe que existe algo más: una promesa antigua, una verdad escondida, una memoria esperando madurez para regresar." },
    { type: "p", text: "El recuerdo vuelve por etapas. Primero llega como sensación. Luego como intuición. Después como comprensión. Finalmente como integración. Cada capa se abre cuando la conciencia puede sostenerla con equilibrio." },
    { type: "p", text: "El velo ordena el proceso. Permite que el ser conquiste su memoria desde la vida, desde el cuerpo, desde la emoción y desde sus propias decisiones." },
  ],
  registro: "La herida del olvido sana cuando la encarnación se reconoce como el escenario elegido para recuperar la luz desde dentro de la experiencia.",
  cierre: "El recuerdo auténtico llega cuando la conciencia está preparada para sostenerlo.",
}

const EP5_NOMBRE_QUE_OLVIDASTE: ArchivoContent = {
  lead: "Antes de recibir un nombre humano, tu conciencia ya emitía una vibración reconocible dentro de la Creación.",
  formula: "NOMBRE CÓSMICO = ORIGEN + DESPERTAR",
  formulaCaption: "Clave vibracional del alma",
  blocks: [
    { type: "p", text: "El Nombre Cósmico es una clave personal e intransferible. Guarda la vibración original del alma y la memoria del momento en que la conciencia comenzó a existir como ser individual dentro de la Creación." },
    { type: "p", text: "La primera parte del nombre corresponde al sonido de origen. Es la vibración que surge cuando el alma nace como una expresión única. Allí queda registrada la nota primordial del ser, su firma interna, la frecuencia que permanece más allá de los nombres humanos, cuerpos, historias y encarnaciones." },
    { type: "p", text: "La terminación cósmica corresponde a las dos últimas letras del nombre. Esta terminación señala el momento en que la conciencia despierta al camino espiritual. Representa el punto del recorrido en que el alma comienza a caminar con mayor claridad hacia su misión, su retorno y su servicio." },
    { type: "p", text: "El Nombre Cósmico une entonces dos memorias: el nacimiento espiritual del ser y el despertar consciente del caminante." },
    { type: "p", text: "Puede revelarse en meditación, sueños, símbolos, sonidos interiores, intuiciones, comunicaciones internas o experiencias de contacto profundo. A veces llega completo. A veces llega por partes. A veces primero se siente como vibración y luego puede traducirse en sonido." },
    { type: "p", text: "Al vocalizarlo, repetirlo o mantralizarlo con presencia, el nombre actúa como un diapasón interno. Ordena la frecuencia, afina el campo energético, despierta memoria y permite que la conciencia empiece a responder desde una identidad más profunda." },
    { type: "subheading", text: "Trabajo con el Nombre Cósmico" },
    { type: "p", text: "La práctica lunar se realiza lunes, miércoles y viernes. Su función es interiorizar, escuchar y afinar. Ayuda a percibir el nombre desde planos profundos, favorece la receptividad y permite que la vibración emerja desde el silencio interior." },
    { type: "p", text: "La práctica solar se realiza martes, jueves y sábados. Su función es proyectar, afirmar y anclar. Ayuda a irradiar la frecuencia del nombre, fortalecer la voluntad y llevar esa vibración hacia la acción consciente." },
    { type: "antiphon", lines: [
      "Lunar recibe. · Solar proyecta.",
      "Lunar escucha. · Solar encarna.",
      "Lunar abre memoria. · Solar activa propósito.",
    ] },
    { type: "p", text: "El Nombre Cósmico se recibe, se practica, se afina y se desarrolla. Su poder crece con constancia, humildad, coherencia y servicio. Cada repetición consciente acerca al alma a su frecuencia original." },
  ],
  registro: "El nombre cósmico guarda el sonido de tu origen y la señal de tu despertar. Al recordarlo, la identidad humana comienza a alinearse con la memoria esencial del alma.",
  cierre: "Tu nombre verdadero no adorna tu camino. Lo ordena.",
}

const EP6_GRAN_MISION_TIERRA: ArchivoContent = {
  lead: "La Tierra fue preparada como un punto de integración dentro del Plan Cósmico.",
  formula: "CUERPO + EMOCIÓN + MENTE + ESPÍRITU",
  formulaCaption: "Síntesis planetaria",
  blocks: [
    { type: "p", text: "La Tierra forma parte de un proyecto evolutivo mayor. Su misión consiste en integrar fuerzas que en otros mundos avanzaron por separado: mente, emoción, cuerpo, espíritu, tecnología, instinto, polaridad, libre albedrío y amor." },
    { type: "p", text: "Muchas civilizaciones alcanzaron grandes desarrollos. Algunas dominaron la mente. Otras dominaron la tecnología. Otras comprendieron planos sutiles. Otras vivieron altos niveles de organización colectiva. Pero el avance en una sola dirección produjo estancamientos. La mente sin emoción pierde profundidad. La tecnología sin amor pierde propósito. La espiritualidad sin cuerpo pierde encarnación." },
    { type: "p", text: "La Tierra fue preparada para reunir aquello que estaba separado." },
    { type: "p", text: "Aquí la conciencia despierta desde la densidad. El alma olvida, siente, ama, pierde, elige, cae, aprende, se contradice y vuelve a levantarse. Esa complejidad convierte la experiencia humana en una fuente de información para muchos mundos." },
    { type: "p", text: "El ser humano es una convergencia. En su biología y su conciencia se encuentran múltiples patrones, linajes y memorias. Por eso la humanidad puede ser intensa, contradictoria y difícil de comprender. También por eso posee un valor inmenso dentro del Plan." },
    { type: "p", text: "La Tierra es un ser vivo. Montañas, mares, volcanes, cristales, bosques, animales y ciclos forman parte de un organismo mayor. La humanidad actúa como un sistema nervioso en desarrollo dentro del cuerpo planetario." },
    { type: "p", text: "Cada decisión humana genera información. Cuando una persona sana una herida, el planeta recibe una nueva posibilidad. Cuando una comunidad aprende a cooperar, la Tierra registra un patrón de unidad. Cuando la humanidad repite dominio o separación, el campo planetario también recibe esa carga." },
    { type: "p", text: "La llave central de esta misión es el amor entendido como tecnología evolutiva. Amor como capacidad de integrar opuestos sin destruirlos. Amor como fuerza capaz de reconocer vida en medio de la diferencia. Amor como elección consciente dentro del conflicto." },
    { type: "p", text: "La humanidad vino a integrar. El cielo debe expresarse en la Tierra. El espíritu debe actuar dentro del cuerpo. La memoria estelar debe humanizarse. El libre albedrío debe madurar hasta convertirse en servicio." },
  ],
  registro: "La misión de la Tierra consiste en demostrar que la conciencia puede atravesar la densidad, recordar el amor y transformar la experiencia humana en una respuesta para el cosmos.",
  cierre: "La Tierra enseña integración.",
}

const EP7_PROPOSITO_Y_DISCERNIMIENTO: ArchivoContent = {
  lead: "El propósito de vida se revela cuando una persona aprende a reconocer la felicidad profunda de su alma.",
  formula: "FELICIDAD DEL ALMA → PROPÓSITO → DISCERNIMIENTO",
  formulaCaption: "Ruta de coherencia",
  blocks: [
    { type: "p", text: "El propósito de vida está unido a la felicidad profunda. Esa felicidad se sostiene por dentro: aparece cuando la vida empieza a alinearse con la verdad del alma, más allá de la aprobación externa, el éxito superficial o el placer momentáneo." },
    { type: "p", text: "Antes de nacer, la conciencia observa posibilidades. Reconoce dones, vínculos, aprendizajes, heridas, caminos de servicio y experiencias necesarias. Al encarnar, esa ruta se cubre con educación, miedo, mandatos familiares, expectativas, necesidad de pertenecer y mecanismos de defensa." },
    { type: "p", text: "Muchas personas se alejan de su propósito porque aprenden a sobrevivir, complacer, demostrar o protegerse. Con el tiempo, dejan de escuchar aquello que les daba vida." },
    { type: "p", text: "El propósito empieza a revelarse cuando la persona vuelve a sentir dónde hay expansión y dónde hay desgaste. El alma se abre cuando una dirección tiene vida. El cuerpo se contrae cuando la vida se aleja demasiado de la verdad interior." },
    { type: "p", text: "Jesús dejó una clave profunda al hablar de los niños. La infancia representa una cercanía directa con la esencia. Antes del miedo, la aprobación y la programación, el niño sabía jugar, imaginar, crear, confiar, amar y expresar vida con naturalidad." },
    { type: "p", text: "Por eso el camino hacia el propósito pasa por sanar al niño interior. En la infancia quedaron pistas del llamado: aquello que emocionaba, aquello que dolía, aquello que surgía sin esfuerzo, aquello que el mundo intentó apagar, aquello que el alma hacía antes de aprender a traicionarse para encajar." },
    { type: "p", text: "Ser feliz, desde esta mirada, significa volver a alinearse con la vida." },
    { type: "p", text: "El propósito puede expresarse en una obra grande o en una forma silenciosa de existir. Puede aparecer como enseñanza, sanación, creación, cuidado, maternidad, paternidad, comunidad, arte, palabra, guía, servicio o presencia amorosa en lo cotidiano." },
    { type: "p", text: "La felicidad verdadera vuelve natural el servicio. Una persona alineada con su alma irradia orden. Sus decisiones se vuelven más claras. Sus vínculos se vuelven más honestos. Su energía deja de perderse en caminos que la alejan de su centro." },
    { type: "subheading", text: "El pacto de discernimiento" },
    { type: "p", text: "El propósito necesita discernimiento. En el camino espiritual aparecen intuiciones verdaderas, deseos del ego, heridas disfrazadas de misión, señales auténticas e interferencias. Discernir significa reconocer la vibración de cada información por sus frutos." },
    { type: "p", text: "Una guía verdadera trae paz profunda, claridad, humildad, libertad interior y mayor responsabilidad. Una interferencia genera urgencia, confusión, dependencia, superioridad, miedo o separación." },
    { type: "p", text: "El pacto de discernimiento es un compromiso con la verdad interior. Significa elegir aquello que trae vida, incluso cuando exige esperar, corregir, soltar o caminar con más humildad." },
    { type: "antiphon", lines: [
      "El espíritu inspira.",
      "El alma traduce.",
      "La acción encarna.",
    ] },
    { type: "p", text: "El propósito se vuelve real cuando baja a decisiones concretas: cómo vivo, cómo amo, cómo trabajo, cómo cuido mi energía, cómo escucho mi cuerpo, cómo sirvo y cómo sostengo coherencia cuando la vida me prueba." },
  ],
  registro: "El propósito florece cuando la felicidad deja de ser búsqueda externa y se convierte en una forma de vivir en verdad, coherencia y servicio.",
  cierre: "La dicha del alma muestra el camino. El discernimiento sostiene el rumbo.",
}

/**
 * Devuelve el contenido del archivo de Sergel para un episodio de la Temporada 1
 * (solo 3–7). Retorna null para el resto (incluidos Ep. 1 y 2, que no se tocan).
 * Ancla por nº de episodio, con palabras clave del título como respaldo.
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
