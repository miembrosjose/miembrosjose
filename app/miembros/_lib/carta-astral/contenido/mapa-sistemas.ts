// ═══════════════════════════════════════════════════════════════════════════
//  SIGNO → SISTEMA ORGÁNICO · el mapa del Camino Solar
// ═══════════════════════════════════════════════════════════════════════════
//
// Leído de la hoja «Registro» de «Camino Solar 2026.xlsx», signo por signo.
// No es la correspondencia de la astrología tradicional: la tradición da la
// cabeza a Aries, y aquí la cabeza va con Acuario por el sistema nervioso.
// Manda el de José. Quien venga después a «corregirlo» con un manual, que lea
// esto primero.
//
// ── POR QUÉ ESTÁ EN EL CÓDIGO SI HAY UNA TABLA EN SUPABASE ────────────────
// Esto es el valor POR DEFECTO, no la última palabra. La tabla
// `solar_signo_sistema` lo sobrescribe en cuanto exista.
//
// Está aquí para que la herramienta funcione desde el primer momento, sin
// depender de que una migración se haya corrido. Una pantalla que no puede
// enseñar nada hasta que alguien ejecute un SQL es una pantalla que se queda
// rota un fin de semana entero.
//
// ── QUÉ ES DATO Y QUÉ ES BORRADOR ─────────────────────────────────────────
// `sistema` es dato de José, verificado contra su archivo.
//
// `zona` y `somatizaciones` solo son suyas en Capricornio y Acuario; en los
// otros diez se derivan de la ANATOMÍA del sistema —el respiratorio son los
// pulmones y los bronquios, ahí no hay nada que interpretar— y están marcadas
// como borrador.
//
// ── LAS EMOCIONES, Y DE DÓNDE SALEN ───────────────────────────────────────
// Capricornio y Acuario las escribió José. Las otras diez las pidió él
// expresamente, «en función de una investigación de biodecodificación».
//
// La investigación dio un resultado incómodo: las fuentes de biodescodificación
// SE CONTRADICEN ENTRE SÍ. El aparato digestivo aparece ligado al miedo, a la
// dificultad para aceptar cambios o a la sobrecarga laboral según qué página
// se lea, y ninguna aporta evidencia. No hay un mapa autorizado que copiar, y
// copiar uno habría sido fingir que lo hay.
//
// Así que cada una cruza DOS cosas:
//
//   · El tema que casi todas las fuentes sí comparten para ese sistema —el
//     óseo con la desvalorización y el sostén, el excretor con soltar, el
//     respiratorio con el espacio y el ritmo—.
//   · El CONFLICTO que José escribió para ese signo, palabra por palabra.
//
// Por eso la de Escorpio habla de rencor que no se suelta: su texto dice que
// «recuerda todo, no olvida, guarda memoria emocional profunda», y el excretor
// es el sistema de lo que se deja ir. La de Tauro habla de quedarse inmóvil
// porque su conflicto empieza exactamente así.
//
// Son derivadas de su material, no de un blog, y siguen marcadas como borrador
// para que las revise: van a leerse como suyas.
//
// ── Y LO QUE NO SON ───────────────────────────────────────────────────────
// No son un diagnóstico ni afirman que una emoción cause una enfermedad. La
// pantalla las presenta condicionadas —«si este sistema entra en
// desequilibrio»— y el aviso de las dos capas sigue abajo, visible: si algo
// del cuerpo preocupa, eso se consulta con quien sabe de cuerpos.

import type { SignoId } from "./signos"
import type { SistemaId } from "./sistemas"

export type FilaMapa = {
  sistema: SistemaId
  zona: string
  somatizaciones: string
  emocion: string
  /** `false` cuando la zona y las somatizaciones las escribió José. */
  borrador: boolean
}

export const MAPA_POR_DEFECTO: Record<SignoId, FilaMapa> = {
  capricornio: {
    sistema: "esqueleto",
    zona: "Rodilla derecha, cadera",
    somatizaciones: "Dolor de rodilla, dolor de cadera",
    emocion: "Sobrecarga de trabajo, rigidez a los movimientos",
    borrador: false,
  },
  acuario: {
    sistema: "nervioso",
    zona: "Cabeza",
    somatizaciones: "Migraña",
    emocion: "Conflictos emocionales profundos, como culpa, resentimiento o estrés acumulado",
    borrador: false,
  },
  piscis: {
    sistema: "circulatorio",
    zona: "Corazón, arterias y venas, pies",
    somatizaciones: "Presión alta o baja, manos y pies fríos, varices, palpitaciones",
    emocion: "Huir de lo concreto. No poner límites y cargar con lo que no es propio, hasta que el afecto deja de circular y uno se diluye en los demás",
    borrador: true,
  },
  aries: {
    sistema: "reproductor",
    zona: "Órganos reproductores, zona pélvica",
    somatizaciones: "Alteraciones del ciclo, dolor pélvico, desajustes hormonales",
    emocion: "Ira retenida y lucha constante. Empujar sin pausa, conquistar sin responsabilidad, y no encontrar dónde depositar esa fuerza",
    borrador: true,
  },
  tauro: {
    sistema: "muscular",
    zona: "Musculatura, cuello y espalda",
    somatizaciones: "Contracturas, tensión cervical, rigidez lumbar",
    emocion: "Quedarse inmóvil. Aferrarse a lo que ya no nutre y resistirse al cambio, hasta que el cuerpo carga un peso que la decisión no quiso mover",
    borrador: true,
  },
  geminis: {
    sistema: "respiratorio",
    zona: "Pulmones, bronquios, garganta",
    somatizaciones: "Falta de aire, tos persistente, bronquitis, afonía",
    emocion: "Dispersión sin centro. Hablar mucho y no decir lo esencial, adaptarse a todo sin saber desde dónde, y perder el ritmo propio",
    borrador: true,
  },
  cancer: {
    sistema: "linfatico",
    zona: "Ganglios, bazo, retención de líquidos",
    somatizaciones: "Hinchazón, ganglios inflamados, defensas bajas",
    emocion: "Apego que no suelta. Proteger en exceso, vivir el cambio como amenaza y guardar dentro lo que dolió, sin dejar que se drene",
    borrador: true,
  },
  leo: {
    sistema: "digestivo",
    zona: "Estómago, intestino, hígado",
    somatizaciones: "Acidez, digestiones pesadas, colon irritable",
    emocion: "Necesidad de aprobación. Forzarse a brillar, tragarse lo que no se puede mostrar, y no terminar de digerir lo vivido por estar pendiente de cómo se ve",
    borrador: true,
  },
  virgo: {
    sistema: "tegumentario",
    zona: "Piel, cabello y uñas",
    somatizaciones: "Dermatitis, picores, caída del cabello, uñas quebradizas",
    emocion: "Control y miedo al error. Corregirlo todo, no tolerar el fallo propio, y vivir en una alerta que acaba notándose en la frontera entre uno y el mundo",
    borrador: true,
  },
  libra: {
    sistema: "inmune",
    zona: "Defensas, procesos inflamatorios",
    somatizaciones: "Infecciones repetidas, alergias, inflamación crónica",
    emocion: "Evitar el conflicto a cualquier precio. Tapar lo que está mal, no tomar postura por miedo a romper la armonía, y dejar de defender lo propio",
    borrador: true,
  },
  escorpio: {
    sistema: "excretor",
    zona: "Riñones, vejiga, intestino grueso",
    somatizaciones: "Infecciones urinarias, estreñimiento, retención",
    emocion: "Rencor que no se suelta. Guardar memoria emocional profunda, revivir lo no resuelto y retener lo que tendría que haberse dejado ir",
    borrador: true,
  },
  sagitario: {
    sistema: "endocrino",
    zona: "Tiroides, suprarrenales, hormonas",
    somatizaciones: "Fatiga sostenida, tiroides alterada, insomnio",
    emocion: "Huir del límite. Rechazar compromisos, dispersarse antes del enfrentamiento real, y vivir a un ritmo que el cuerpo no puede sostener",
    borrador: true,
  },
}
