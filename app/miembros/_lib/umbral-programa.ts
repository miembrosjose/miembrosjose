// EL UMBRAL DEL CONTACTO — contenido del programa.
//
// Vive aquí, en datos, no en site_texts: son listas con estructura propia y un
// campo de texto plano no puede representarlas. Este es el archivo que se
// edita para cambiar el programa.

/** Un encuentro del ciclo. Dieciséis semanas, un encuentro por semana. */
export type Encuentro = {
  n: number
  titulo: string
  texto: string
}

export const ENCUENTROS: Encuentro[] = [
  {
    n: 1,
    titulo: "Preparación para el contacto",
    texto:
      "Respiración, relajación, concentración, visualización y primera meditación de contacto. Cómo se trabajará durante los cuatro meses, y apertura de la bitácora personal.",
  },
  {
    n: 2,
    titulo: "Armonización, sonido y vocalización",
    texto:
      "Preparación individual y grupal. Respiración, vocalizaciones, mantras, intención y oración. Uso consciente del sonido, y el silencio que viene después.",
  },
  {
    n: 3,
    titulo: "Preparación física y energética",
    texto:
      "Ejercicios psicofísicos, respiración con movimiento y atención corporal. Captación y circulación de energía, cadenas energéticas y preparación del cuerpo para lo que viene.",
  },
  {
    n: 4,
    titulo: "Concentración y dominio mental",
    texto:
      "Rosa, pizarra mental, punto, vela, universo blanco, figuras, colores, túnel de luz y mantenimiento de imágenes. Esta capacidad es la base de casi todo lo posterior.",
  },
  {
    n: 5,
    titulo: "Meditación y profundización interior",
    texto:
      "La diferencia entre relajación, concentración y meditación. Meditación «¿Quién soy?», silencio interior, observación del pensamiento y meditación profunda de contacto.",
  },
  {
    n: 6,
    titulo: "Sensibilización y percepción",
    texto:
      "Sonidos internos y externos, sensaciones corporales, percepción del entorno, atención, memoria e intuición. Aprender a percibir sin interpretar de inmediato.",
  },
  {
    n: 7,
    titulo: "Proyección mental y percepción a distancia",
    texto:
      "Lugares conocidos, objetos escondidos, sobre cerrado, caja cerrada, fotografías y objetivos desconocidos. Siempre registrar primero y comprobar después.",
  },
  {
    n: 8,
    titulo: "Psicometría y percepción de campos",
    texto:
      "Trabajo con objetos y fotografías, percepción mediante las manos, campo energético, aura y formas de pensamiento, dentro del marco espiritual del entrenamiento.",
  },
  {
    n: 9,
    titulo: "Telepatía I",
    texto:
      "Emisión y recepción de colores, números, figuras, símbolos, imágenes y emociones. Ejercicios por parejas.",
  },
  {
    n: 10,
    titulo: "Telepatía II",
    texto:
      "Uno a uno, uno a grupo, grupo a uno. Imágenes complejas, lugares y conceptos. Aquí el grupo empieza a trabajar como verdadero grupo de contacto.",
  },
  {
    n: 11,
    titulo: "Canalización y comunicación",
    texto:
      "Recepción mental, escritura psicográfica, intuición, imágenes, frases y símbolos. Mensajes durante la meditación y el sueño. Práctica formal de recepción escrita.",
  },
  {
    n: 12,
    titulo: "Canalización avanzada y discernimiento",
    texto:
      "Tres puertas, templo interior, captación simbólica de un guía y recepción colectiva. Comparación de comunicaciones, y criterios para separar lo recibido de la sugestión, la imaginación, la expectativa y el ego.",
  },
  {
    n: 13,
    titulo: "Sueños, memoria y percepción temporal",
    texto:
      "Diario de sueños, programación antes de dormir, sueños lúcidos y experiencias de contacto durante el sueño. Ejercicios de premonición y de memoria profunda, entendidos como experiencias internas que luego se analizan.",
  },
  {
    n: 14,
    titulo: "Proyección de conciencia y trabajo mental avanzado",
    texto:
      "Viaje mental, proyección con desplazamiento, estados ampliados de conciencia y visualización fuera del cuerpo. Proyección hacia lugares y hacia el cosmos. Comienza la serie de las siete puertas.",
  },
  {
    n: 15,
    titulo: "Preparación de una salida de contacto",
    texto:
      "Cómo se organiza el grupo y se prepara el lugar. Armonización, respiración, vocalización, meditación, cadenas, proyección mental colectiva, silencio receptivo, observación y el papel de cada participante.",
  },
  {
    n: 16,
    titulo: "Salida de contacto y cierre del ciclo",
    texto:
      "La reunión completa en campo: preparación, meditación, telepatía, proyección, observación y registro. Comparación posterior y cierre. Cómo seguir practicando y cómo formar círculos de contacto propios.",
  },
]

/** Cuándo abre cada formación. Una nueva cada cuatro meses. */
export const FORMACIONES: Array<{ cuando: string; nota: string; primera?: boolean }> = [
  { cuando: "Enero 2027", nota: "Primera formación", primera: true },
  { cuando: "Mayo 2027", nota: "Segunda formación" },
  { cuando: "Septiembre 2027", nota: "Tercera formación" },
]
