// Contenido de los "Archivos de Sergel" — Temporada 1, episodios 3 a 7.
// Composición VISUAL compacta (estética del Ep. 2): frase breve de apertura,
// arquitectura central protagonista, explicación compacta en tarjetas-nodo y
// Registro de Sergel. Extensión similar al Ep. 2, para dejar espacio debajo a
// recursos complementarios (meditaciones, ejercicios).
//
// Ep. 1 y 2 NO se tocan. Selección por nº de episodio + palabras clave.

import type { ArchivoContent } from "@/components/EpisodioArchivo"

const EP3_SEMILLA_ESTELAR: ArchivoContent = {
  lead: "Una semilla despierta cuando su origen se convierte en servicio sobre la Tierra.",
  sections: [
    { kind: "arch", caption: "Proceso de germinación", stack: ["ORIGEN", "→", "ENCARNACIÓN", "→", "SERVICIO"] },
    { kind: "nodes", items: [
      { label: "Origen estelar", text: "Memoria de otros mundos, planos o civilizaciones de conciencia." },
      { label: "Encarnación humana", text: "La frecuencia entra en cuerpo, emoción, tiempo y olvido para aprender desde la experiencia terrestre." },
      { label: "Servicio", text: "La memoria madura cuando se transforma en acción: sanar, crear, cuidar, enseñar, acompañar o sostener luz." },
    ] },
  ],
  registro: "La semilla estelar alcanza madurez cuando deja de buscar solo de dónde viene y reconoce qué vino a sembrar.",
}

const EP4_HERIDA_DEL_OLVIDO: ArchivoContent = {
  lead: "El alma aceptó olvidar para elegir, amar y recordar desde la experiencia.",
  sections: [
    { kind: "arch", caption: "Tecnología de encarnación", stack: ["ACUERDO", "→", "VELO", "→", "RECORDACIÓN"] },
    { kind: "nodes", items: [
      { label: "Acuerdo previo", text: "Antes de nacer, el alma reconoce vínculos, aprendizajes, dones y rutas de expansión." },
      { label: "Velo del olvido", text: "La memoria se comprime para que la vida sea real y cada elección nazca desde la libertad." },
      { label: "Recordación gradual", text: "El recuerdo vuelve como sensación, intuición, comprensión e integración." },
    ] },
  ],
  registro: "La herida del olvido sana cuando la encarnación se reconoce como el escenario elegido para recuperar la luz desde dentro.",
}

const EP5_NOMBRE_QUE_OLVIDASTE: ArchivoContent = {
  lead: "Tu nombre cósmico guarda el sonido de tu origen y la señal de tu despertar.",
  sections: [
    { kind: "arch", caption: "Clave vibracional del alma", stack: ["NOMBRE CÓSMICO", "=", "ORIGEN", "+", "DESPERTAR"] },
    { kind: "twoCol", cols: [
      { label: "Primera parte", text: "Sonido original que surge cuando la conciencia nace como ser individual dentro de la Creación." },
      { label: "Terminación cósmica", text: "Las dos últimas letras indican el momento en que el alma despierta al camino espiritual." },
    ] },
    { kind: "twoCol", cols: [
      { label: "Trabajo lunar", sublabel: "Lunes · Miércoles · Viernes", text: "Interioriza, escucha, afina y recibe la vibración desde planos profundos." },
      { label: "Trabajo solar", sublabel: "Martes · Jueves · Sábados", text: "Proyecta, afirma, irradia y ancla la vibración en la acción consciente." },
    ] },
  ],
  registro: "El nombre cósmico se recibe, se practica y se afina. Cada repetición consciente ordena la frecuencia interna y acerca al alma a su memoria.",
}

const EP6_GRAN_MISION_TIERRA: ArchivoContent = {
  lead: "La Tierra fue preparada como un punto de integración dentro del Plan Cósmico.",
  sections: [
    { kind: "arch", caption: "Síntesis planetaria", stack: ["CUERPO", "+", "EMOCIÓN", "+", "MENTE", "+", "ESPÍRITU"] },
    { kind: "nodes", items: [
      { label: "Cuerpo", text: "La conciencia aprende a expresarse dentro de la materia." },
      { label: "Emoción", text: "El alma descubre vínculo, dolor, compasión y amor." },
      { label: "Mente", text: "La experiencia se convierte en comprensión, elección y responsabilidad." },
      { label: "Espíritu", text: "La memoria superior desciende para actuar en la vida cotidiana." },
    ] },
    { kind: "box", formula: "AMOR = TECNOLOGÍA EVOLUTIVA", text: "Integrar opuestos sin destruirlos. Elegir conciencia dentro del conflicto. Convertir la experiencia humana en respuesta para el cosmos." },
  ],
  registro: "La misión de la Tierra consiste en demostrar que la conciencia puede atravesar la densidad, recordar el amor y generar integración.",
}

const EP7_PROPOSITO_Y_DISCERNIMIENTO: ArchivoContent = {
  lead: "El propósito se revela cuando una persona reconoce la felicidad profunda de su alma.",
  sections: [
    { kind: "arch", caption: "Ruta de coherencia", stack: ["FELICIDAD DEL ALMA", "→", "PROPÓSITO", "→", "DISCERNIMIENTO"] },
    { kind: "nodes", items: [
      { label: "Felicidad del alma", text: "Alegría profunda que aparece cuando la vida se alinea con la verdad interior." },
      { label: "Propósito", text: "Dirección expresada en servicio, creación, sanación, cuidado, enseñanza o presencia." },
      { label: "Niño interior", text: "Memoria de la alegría original, antes del miedo, la aprobación y la programación." },
      { label: "Discernimiento", text: "Pacto con la verdad interior para reconocer señales por sus frutos: claridad, humildad, libertad y coherencia." },
    ] },
  ],
  registro: "El propósito florece cuando la felicidad deja de ser búsqueda externa y se convierte en una forma de vivir en verdad y servicio.",
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
