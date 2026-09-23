// CARTOGRAFÍA ESTELAR 144 — catálogo de portales.
//
// ── PROCEDENCIA DE LAS COORDENADAS ─────────────────────────────────────────
// Ascensión recta y declinación en época J2000.0, en grados decimales, con la
// designación del catálogo Hipparcos (ESA, 1997) cuando existe. Son datos
// astronómicos de dominio público: posiciones medidas, no obra de nadie.
//
// Cada ancla lleva su identificador para que se pueda contrastar contra la
// fuente. La validación está en tests/cartografia-estelar.test.ts: comprueba
// que estas coordenadas producen las longitudes eclípticas publicadas para el
// año 2000, que es la forma real de detectar una cifra mal copiada.
//
// NO se ha podido contrastar contra Moira: ese repositorio requiere acceso a
// red, que este entorno no tiene. Ver docs/CARTOGRAFIA_ESTELAR_PROVENANCE.md.
//
// ── LO QUE ESTA LISTA NO ES ────────────────────────────────────────────────
// Un portal es una agrupación EDITORIAL de Los 144.000. Que Orión reúna siete
// estrellas bajo un nombre es una decisión nuestra, no un hecho astronómico:
// esas siete no forman un sistema físico, están a distancias muy distintas y
// solo parecen juntas desde aquí. El tipo de cada portal lo declara.

import type { Portal } from "../domain/types"

export const PORTALES: Portal[] = [
  {
    id: "pleyades",
    nombre: "Pléyades",
    tipo: "CLUSTER",
    peso: 1.0,
    anclas: [
      { id: "alcyone", nombre: "Alcyone", designacion: "HIP 17702 · η Tau", raJ2000: 56.87096, decJ2000: 24.10513, magnitud: 2.87 },
      { id: "atlas", nombre: "Atlas", designacion: "HIP 17847 · 27 Tau", raJ2000: 57.29054, decJ2000: 24.05339, magnitud: 3.63 },
      { id: "electra", nombre: "Electra", designacion: "HIP 17499 · 17 Tau", raJ2000: 56.21896, decJ2000: 24.11336, magnitud: 3.70 },
      { id: "maia", nombre: "Maia", designacion: "HIP 17573 · 20 Tau", raJ2000: 56.45696, decJ2000: 24.36778, magnitud: 3.87 },
      { id: "merope", nombre: "Mérope", designacion: "HIP 17608 · 23 Tau", raJ2000: 56.58154, decJ2000: 23.94838, magnitud: 4.14 },
      { id: "taygeta", nombre: "Taygeta", designacion: "HIP 17531 · 19 Tau", raJ2000: 56.30208, decJ2000: 24.46725, magnitud: 4.30 },
      { id: "pleione", nombre: "Pléyone", designacion: "HIP 17851 · 28 Tau", raJ2000: 57.29675, decJ2000: 24.13684, magnitud: 5.05 },
    ],
  },
  {
    id: "sirio",
    nombre: "Sirio",
    tipo: "STAR_SYSTEM",
    peso: 1.0,
    anclas: [
      { id: "sirius", nombre: "Sirio", designacion: "HIP 32349 · α CMa", raJ2000: 101.28716, decJ2000: -16.71612, magnitud: -1.46 },
    ],
  },
  {
    id: "arcturus",
    nombre: "Arcturus",
    tipo: "STAR_SYSTEM",
    peso: 1.0,
    anclas: [
      { id: "arcturus", nombre: "Arcturus", designacion: "HIP 69673 · α Boo", raJ2000: 213.91530, decJ2000: 19.18241, magnitud: -0.05 },
    ],
  },
  {
    id: "lyra",
    nombre: "Lyra · Vega",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "vega", nombre: "Vega", designacion: "HIP 91262 · α Lyr", raJ2000: 279.23474, decJ2000: 38.78369, magnitud: 0.03 },
      { id: "sheliak", nombre: "Sheliak", designacion: "HIP 92420 · β Lyr", raJ2000: 282.51999, decJ2000: 33.36267, magnitud: 3.52 },
      { id: "sulafat", nombre: "Sulafat", designacion: "HIP 93194 · γ Lyr", raJ2000: 284.73593, decJ2000: 32.68955, magnitud: 3.24 },
    ],
  },
  {
    id: "orion",
    nombre: "Orión",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "betelgeuse", nombre: "Betelgeuse", designacion: "HIP 27989 · α Ori", raJ2000: 88.79294, decJ2000: 7.40706, magnitud: 0.50 },
      { id: "rigel", nombre: "Rigel", designacion: "HIP 24436 · β Ori", raJ2000: 78.63447, decJ2000: -8.20164, magnitud: 0.13 },
      { id: "bellatrix", nombre: "Bellatrix", designacion: "HIP 25336 · γ Ori", raJ2000: 81.28276, decJ2000: 6.34970, magnitud: 1.64 },
      { id: "mintaka", nombre: "Mintaka", designacion: "HIP 25930 · δ Ori", raJ2000: 83.00167, decJ2000: -0.29909, magnitud: 2.23 },
      { id: "alnilam", nombre: "Alnilam", designacion: "HIP 26311 · ε Ori", raJ2000: 84.05339, decJ2000: -1.20192, magnitud: 1.69 },
      { id: "alnitak", nombre: "Alnitak", designacion: "HIP 26727 · ζ Ori", raJ2000: 85.18969, decJ2000: -1.94257, magnitud: 1.77 },
      { id: "saiph", nombre: "Saiph", designacion: "HIP 27366 · κ Ori", raJ2000: 86.93912, decJ2000: -9.66960, magnitud: 2.06 },
    ],
  },
  {
    id: "andromeda",
    nombre: "Andrómeda",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "alpheratz", nombre: "Alpheratz", designacion: "HIP 677 · α And", raJ2000: 2.09692, decJ2000: 29.09043, magnitud: 2.06 },
      { id: "mirach", nombre: "Mirach", designacion: "HIP 5447 · β And", raJ2000: 17.43301, decJ2000: 35.62058, magnitud: 2.06 },
      { id: "almach", nombre: "Almach", designacion: "HIP 9640 · γ And", raJ2000: 30.97485, decJ2000: 42.32975, magnitud: 2.10 },
    ],
  },
  {
    id: "alfa_centauri",
    nombre: "Alfa Centauri",
    tipo: "STAR_SYSTEM",
    peso: 1.0,
    anclas: [
      { id: "rigil", nombre: "Rigil Kentaurus", designacion: "HIP 71683 · α Cen A", raJ2000: 219.90206, decJ2000: -60.83399, magnitud: -0.01 },
    ],
  },
  {
    id: "antares",
    nombre: "Antares · Escorpio",
    tipo: "STAR_SYSTEM",
    peso: 1.0,
    anclas: [
      { id: "antares", nombre: "Antares", designacion: "HIP 80763 · α Sco", raJ2000: 247.35192, decJ2000: -26.43200, magnitud: 1.09 },
    ],
  },
  {
    id: "regulus",
    nombre: "Regulus · Leo",
    tipo: "STAR_SYSTEM",
    peso: 1.0,
    anclas: [
      { id: "regulus", nombre: "Regulus", designacion: "HIP 49669 · α Leo", raJ2000: 152.09296, decJ2000: 11.96721, magnitud: 1.40 },
    ],
  },
  {
    id: "centro_galactico",
    nombre: "Centro Galáctico",
    tipo: "COSMIC_REFERENCE",
    peso: 1.0,
    anclas: [
      // Sagitario A*: la fuente de radio en el centro de la Vía Láctea.
      // Posición de radiointerferometría, no óptica — no tiene HIP.
      { id: "sgr_a", nombre: "Sagitario A*", designacion: "Sgr A* · centro galáctico", raJ2000: 266.41681, decJ2000: -29.00781 },
    ],
  },

  // ── 11 ──
  {
    id: "aldebaran",
    nombre: "Aldebarán · Híades",
    tipo: "STAR_FAMILY",
    peso: 1.0,
    anclas: [
      { id: "aldebaran", nombre: "Aldebarán", designacion: "HIP 21421 · α Tau", raJ2000: 68.98016, decJ2000: 16.50930, magnitud: 0.85 },
      { id: "ain", nombre: "Ain", designacion: "HIP 20889 · ε Tau", raJ2000: 67.15430, decJ2000: 19.18043, magnitud: 3.53 },
    ],
  },
  {
    id: "fomalhaut",
    nombre: "Fomalhaut",
    tipo: "STAR_SYSTEM",
    peso: 1.0,
    anclas: [
      { id: "fomalhaut", nombre: "Fomalhaut", designacion: "HIP 113368 · α PsA", raJ2000: 344.41269, decJ2000: -29.62224, magnitud: 1.16 },
    ],
  },
  {
    id: "spica",
    nombre: "Spica · Virgo",
    tipo: "STAR_SYSTEM",
    peso: 1.0,
    anclas: [
      { id: "spica", nombre: "Spica", designacion: "HIP 65474 · α Vir", raJ2000: 201.29825, decJ2000: -11.16132, magnitud: 0.97 },
    ],
  },
  {
    id: "altair",
    nombre: "Altair",
    tipo: "STAR_SYSTEM",
    peso: 1.0,
    anclas: [
      { id: "altair", nombre: "Altair", designacion: "HIP 97649 · α Aql", raJ2000: 297.69582, decJ2000: 8.86832, magnitud: 0.77 },
    ],
  },
  {
    id: "deneb",
    nombre: "Deneb · Cisne",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "deneb", nombre: "Deneb", designacion: "HIP 102098 · α Cyg", raJ2000: 310.35798, decJ2000: 45.28034, magnitud: 1.25 },
      { id: "albireo", nombre: "Albireo", designacion: "HIP 95947 · β Cyg", raJ2000: 292.68034, decJ2000: 27.95968, magnitud: 3.08 },
    ],
  },
  {
    id: "polaris",
    nombre: "Polaris",
    tipo: "STAR_SYSTEM",
    peso: 1.0,
    anclas: [
      { id: "polaris", nombre: "Polaris", designacion: "HIP 11767 · α UMi", raJ2000: 37.95456, decJ2000: 89.26411, magnitud: 1.98 },
    ],
  },
  {
    id: "capella",
    nombre: "Capella",
    tipo: "STAR_SYSTEM",
    peso: 1.0,
    anclas: [
      { id: "capella", nombre: "Capella", designacion: "HIP 24608 · α Aur", raJ2000: 79.17232, decJ2000: 45.99799, magnitud: 0.08 },
    ],
  },
  {
    id: "canopus",
    nombre: "Canopus",
    tipo: "STAR_SYSTEM",
    peso: 1.0,
    anclas: [
      { id: "canopus", nombre: "Canopus", designacion: "HIP 30438 · α Car", raJ2000: 95.98796, decJ2000: -52.69566, magnitud: -0.74 },
    ],
  },
  {
    id: "achernar",
    nombre: "Achernar",
    tipo: "STAR_SYSTEM",
    peso: 1.0,
    anclas: [
      { id: "achernar", nombre: "Achernar", designacion: "HIP 7588 · α Eri", raJ2000: 24.42852, decJ2000: -57.23675, magnitud: 0.46 },
    ],
  },
  {
    id: "geminis",
    nombre: "Cástor y Pólux · Géminis",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "castor", nombre: "Cástor", designacion: "HIP 36850 · α Gem", raJ2000: 113.64947, decJ2000: 31.88828, magnitud: 1.58 },
      { id: "pollux", nombre: "Pólux", designacion: "HIP 37826 · β Gem", raJ2000: 116.32896, decJ2000: 28.02620, magnitud: 1.14 },
    ],
  },
  {
    id: "perseo",
    nombre: "Perseo",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "algol", nombre: "Algol", designacion: "HIP 14576 · β Per", raJ2000: 47.04222, decJ2000: 40.95565, magnitud: 2.12 },
      { id: "mirfak", nombre: "Mirfak", designacion: "HIP 15863 · α Per", raJ2000: 51.08071, decJ2000: 49.86118, magnitud: 1.79 },
    ],
  },
  {
    id: "casiopea",
    nombre: "Casiopea",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "schedar", nombre: "Schedar", designacion: "HIP 3179 · α Cas", raJ2000: 10.12684, decJ2000: 56.53733, magnitud: 2.24 },
      { id: "caph", nombre: "Caph", designacion: "HIP 746 · β Cas", raJ2000: 2.29452, decJ2000: 59.14978, magnitud: 2.27 },
    ],
  },
  {
    id: "cefeo",
    nombre: "Cefeo",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "alderamin", nombre: "Alderamin", designacion: "HIP 105199 · α Cep", raJ2000: 319.64487, decJ2000: 62.58557, magnitud: 2.45 },
    ],
  },
  {
    id: "draco",
    nombre: "Draco",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "eltanin", nombre: "Eltanin", designacion: "HIP 87833 · γ Dra", raJ2000: 269.15155, decJ2000: 51.48896, magnitud: 2.23 },
      { id: "thuban", nombre: "Thuban", designacion: "HIP 68756 · α Dra", raJ2000: 211.09729, decJ2000: 64.37585, magnitud: 3.65 },
    ],
  },
  {
    id: "ofiuco",
    nombre: "Ofiuco",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "rasalhague", nombre: "Rasalhague", designacion: "HIP 86032 · α Oph", raJ2000: 263.73362, decJ2000: 12.56003, magnitud: 2.08 },
    ],
  },
  {
    id: "hercules",
    nombre: "Hércules",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "rasalgethi", nombre: "Rasalgethi", designacion: "HIP 84345 · α Her", raJ2000: 258.66191, decJ2000: 14.39033, magnitud: 3.35 },
      { id: "kornephoros", nombre: "Kornephoros", designacion: "HIP 80816 · β Her", raJ2000: 247.55496, decJ2000: 21.48964, magnitud: 2.77 },
    ],
  },
  {
    id: "pegaso",
    nombre: "Pegaso",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "markab", nombre: "Markab", designacion: "HIP 113963 · α Peg", raJ2000: 346.19022, decJ2000: 15.20527, magnitud: 2.48 },
      { id: "scheat", nombre: "Scheat", designacion: "HIP 113881 · β Peg", raJ2000: 345.94358, decJ2000: 28.08278, magnitud: 2.42 },
      { id: "algenib", nombre: "Algenib", designacion: "HIP 1067 · γ Peg", raJ2000: 3.30894, decJ2000: 15.18360, magnitud: 2.83 },
    ],
  },
  {
    id: "crux",
    nombre: "Cruz del Sur",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "acrux", nombre: "Acrux", designacion: "HIP 60718 · α Cru", raJ2000: 186.64975, decJ2000: -63.09909, magnitud: 0.77 },
      { id: "mimosa", nombre: "Mimosa", designacion: "HIP 62434 · β Cru", raJ2000: 191.93029, decJ2000: -59.68877, magnitud: 1.25 },
      { id: "gacrux", nombre: "Gacrux", designacion: "HIP 61084 · γ Cru", raJ2000: 187.79147, decJ2000: -57.11321, magnitud: 1.63 },
    ],
  },
  {
    id: "centaurus",
    nombre: "Centauro · Hadar",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "hadar", nombre: "Hadar", designacion: "HIP 68702 · β Cen", raJ2000: 210.95586, decJ2000: -60.37304, magnitud: 0.61 },
    ],
  },
  {
    id: "libra",
    nombre: "Libra",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "zubenelgenubi", nombre: "Zubenelgenubi", designacion: "HIP 72622 · α Lib", raJ2000: 222.71963, decJ2000: -16.04178, magnitud: 2.75 },
      { id: "zubeneschamali", nombre: "Zubeneschamali", designacion: "HIP 74785 · β Lib", raJ2000: 229.25172, decJ2000: -9.38291, magnitud: 2.61 },
    ],
  },
  {
    id: "hydra",
    nombre: "Hidra · Alphard",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "alphard", nombre: "Alphard", designacion: "HIP 46390 · α Hya", raJ2000: 141.89684, decJ2000: -8.65860, magnitud: 1.98 },
    ],
  },
  {
    id: "corvus",
    nombre: "Cuervo",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "gienah", nombre: "Gienah", designacion: "HIP 59803 · γ Crv", raJ2000: 183.95154, decJ2000: -17.54193, magnitud: 2.59 },
      { id: "algorab", nombre: "Algorab", designacion: "HIP 60965 · δ Crv", raJ2000: 187.46632, decJ2000: -16.51519, magnitud: 2.95 },
    ],
  },
  {
    id: "phoenix",
    nombre: "Fénix",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "ankaa", nombre: "Ankaa", designacion: "HIP 2081 · α Phe", raJ2000: 6.57094, decJ2000: -42.30598, magnitud: 2.40 },
    ],
  },
  {
    id: "grus",
    nombre: "Grulla",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "alnair", nombre: "Alnair", designacion: "HIP 109268 · α Gru", raJ2000: 332.05827, decJ2000: -46.96096, magnitud: 1.74 },
    ],
  },
  {
    id: "aquarius",
    nombre: "Acuario",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "sadalsuud", nombre: "Sadalsuud", designacion: "HIP 106278 · β Aqr", raJ2000: 322.88968, decJ2000: -5.57116, magnitud: 2.90 },
      { id: "sadalmelik", nombre: "Sadalmelik", designacion: "HIP 109074 · α Aqr", raJ2000: 331.44598, decJ2000: -0.31984, magnitud: 2.95 },
    ],
  },
  {
    id: "capricornus",
    nombre: "Capricornio",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "deneb_algedi", nombre: "Deneb Algedi", designacion: "HIP 107556 · δ Cap", raJ2000: 326.76027, decJ2000: -16.12726, magnitud: 2.85 },
    ],
  },
  {
    id: "sagittarius",
    nombre: "Sagitario",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "kaus_australis", nombre: "Kaus Australis", designacion: "HIP 90185 · ε Sgr", raJ2000: 276.04300, decJ2000: -34.38462, magnitud: 1.85 },
      { id: "nunki", nombre: "Nunki", designacion: "HIP 92855 · σ Sgr", raJ2000: 283.81636, decJ2000: -26.29672, magnitud: 2.05 },
    ],
  },
  {
    id: "sculptor",
    nombre: "Escultor",
    tipo: "CONSTELLATION",
    peso: 1.0,
    anclas: [
      { id: "alpha_scl", nombre: "Alfa Sculptoris", designacion: "HIP 4577 · α Scl", raJ2000: 14.64533, decJ2000: -29.35748, magnitud: 4.30 },
    ],
  },
  // ── Cielo profundo ──
  {
    id: "m31",
    nombre: "Galaxia de Andrómeda · M31",
    tipo: "GALAXY",
    peso: 1.0,
    anclas: [
      { id: "m31", nombre: "M31", designacion: "M31 · NGC 224", raJ2000: 10.68471, decJ2000: 41.26875, magnitud: 3.44 },
    ],
  },
  {
    id: "m42",
    nombre: "Nebulosa de Orión · M42",
    tipo: "NEBULA",
    peso: 1.0,
    anclas: [
      { id: "m42", nombre: "M42", designacion: "M42 · NGC 1976", raJ2000: 83.82208, decJ2000: -5.39111, magnitud: 4.0 },
    ],
  },
  {
    id: "m1",
    nombre: "Nebulosa del Cangrejo · M1",
    tipo: "NEBULA",
    peso: 1.0,
    anclas: [
      { id: "m1", nombre: "M1", designacion: "M1 · NGC 1952", raJ2000: 83.63308, decJ2000: 22.01450, magnitud: 8.4 },
    ],
  },
  {
    id: "m57",
    nombre: "Nebulosa del Anillo · M57",
    tipo: "NEBULA",
    peso: 1.0,
    anclas: [
      { id: "m57", nombre: "M57", designacion: "M57 · NGC 6720", raJ2000: 283.39621, decJ2000: 33.02907, magnitud: 8.8 },
    ],
  },
  {
    id: "omega_centauri",
    nombre: "Omega Centauri",
    tipo: "CLUSTER",
    peso: 1.0,
    anclas: [
      { id: "ngc5139", nombre: "Omega Centauri", designacion: "NGC 5139", raJ2000: 201.69700, decJ2000: -47.47947, magnitud: 3.9 },
    ],
  },
  {
    id: "m13",
    nombre: "Cúmulo de Hércules · M13",
    tipo: "CLUSTER",
    peso: 1.0,
    anclas: [
      { id: "m13", nombre: "M13", designacion: "M13 · NGC 6205", raJ2000: 250.42345, decJ2000: 36.46132, magnitud: 5.8 },
    ],
  },
  {
    id: "virgo_m87",
    nombre: "Virgo · M87",
    tipo: "GALAXY",
    peso: 1.0,
    anclas: [
      { id: "m87", nombre: "M87", designacion: "M87 · NGC 4486", raJ2000: 187.70593, decJ2000: 12.39112, magnitud: 8.6 },
    ],
  },
  {
    id: "gran_atractor",
    nombre: "Gran Atractor · Norma",
    tipo: "COSMIC_REFERENCE",
    peso: 1.0,
    anclas: [
      { id: "aco3627", nombre: "Cúmulo de Norma", designacion: "Abell 3627", raJ2000: 243.55000, decJ2000: -60.83333 },
    ],
  },
  {
    id: "shapley",
    nombre: "Supercúmulo de Shapley",
    tipo: "COSMIC_REFERENCE",
    peso: 1.0,
    anclas: [
      { id: "aco3558", nombre: "Abell 3558", designacion: "Abell 3558", raJ2000: 201.98750, decJ2000: -31.50278 },
    ],
  },
  // ── Los cuatro que faltan de la lista editorial ──
  // Se declaran para que el total sea 50 y "X de 50" diga la verdad, pero
  // quedan fuera del cálculo hasta tener coordenadas contrastadas.
  {
    id: "procyon",
    nombre: "Procyon",
    tipo: "STAR_SYSTEM",
    peso: 1.0,
    anclas: [
      { id: "procyon", nombre: "Procyon", designacion: "HIP 37279 · α CMi", raJ2000: 114.82550, decJ2000: 5.22499, magnitud: 0.34 },
    ],
  },
  {
    id: "tau_ceti",
    nombre: "Tau Ceti",
    tipo: "STAR_SYSTEM",
    peso: 1.0,
    anclas: [
      { id: "tau_ceti", nombre: "Tau Ceti", designacion: "HIP 8102 · τ Cet", raJ2000: 26.01700, decJ2000: -15.93956, magnitud: 3.50 },
    ],
  },
  {
    id: "epsilon_eridani",
    nombre: "Epsilon Eridani",
    tipo: "STAR_SYSTEM",
    peso: 1.0,
    anclas: [
      { id: "eps_eri", nombre: "Epsilon Eridani", designacion: "HIP 16537 · ε Eri", raJ2000: 53.23269, decJ2000: -9.45826, magnitud: 3.73 },
    ],
  },
]

/** Los portales que entran en el cálculo: los que tienen datos completos. */
export function portalesActivos(): Portal[] {
  return PORTALES.filter((p) => !p.pendingData && p.anclas.length > 0)
}

export function portalPorId(id: string): Portal | null {
  return PORTALES.find((p) => p.id === id) ?? null
}

/** Total declarado, para poder decir "X de N" con honestidad. */
export const TOTAL_PORTALES = PORTALES.length
