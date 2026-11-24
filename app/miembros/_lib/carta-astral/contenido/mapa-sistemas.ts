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
// `emocion` se deja vacía en los diez. Esa es lectura de José y ponerle yo
// palabras sería firmar con su nombre.

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
    emocion: "",
    borrador: true,
  },
  aries: {
    sistema: "reproductor",
    zona: "Órganos reproductores, zona pélvica",
    somatizaciones: "Alteraciones del ciclo, dolor pélvico, desajustes hormonales",
    emocion: "",
    borrador: true,
  },
  tauro: {
    sistema: "muscular",
    zona: "Musculatura, cuello y espalda",
    somatizaciones: "Contracturas, tensión cervical, rigidez lumbar",
    emocion: "",
    borrador: true,
  },
  geminis: {
    sistema: "respiratorio",
    zona: "Pulmones, bronquios, garganta",
    somatizaciones: "Falta de aire, tos persistente, bronquitis, afonía",
    emocion: "",
    borrador: true,
  },
  cancer: {
    sistema: "linfatico",
    zona: "Ganglios, bazo, retención de líquidos",
    somatizaciones: "Hinchazón, ganglios inflamados, defensas bajas",
    emocion: "",
    borrador: true,
  },
  leo: {
    sistema: "digestivo",
    zona: "Estómago, intestino, hígado",
    somatizaciones: "Acidez, digestiones pesadas, colon irritable",
    emocion: "",
    borrador: true,
  },
  virgo: {
    sistema: "tegumentario",
    zona: "Piel, cabello y uñas",
    somatizaciones: "Dermatitis, picores, caída del cabello, uñas quebradizas",
    emocion: "",
    borrador: true,
  },
  libra: {
    sistema: "inmune",
    zona: "Defensas, procesos inflamatorios",
    somatizaciones: "Infecciones repetidas, alergias, inflamación crónica",
    emocion: "",
    borrador: true,
  },
  escorpio: {
    sistema: "excretor",
    zona: "Riñones, vejiga, intestino grueso",
    somatizaciones: "Infecciones urinarias, estreñimiento, retención",
    emocion: "",
    borrador: true,
  },
  sagitario: {
    sistema: "endocrino",
    zona: "Tiroides, suprarrenales, hormonas",
    somatizaciones: "Fatiga sostenida, tiroides alterada, insomnio",
    emocion: "",
    borrador: true,
  },
}
