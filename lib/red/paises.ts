// Nombres de país en español para los códigos ISO 3166-1 alfa-2.
//
// Por qué un mapa aquí y no una tabla: el nombre de un país no cambia y no se
// consulta ni se filtra por él (para eso está country_code). La lista de países
// que se OFRECE al miembro NO sale de aquí: sale de los países que realmente
// tienen ciudades en network_cities. Así nunca se puede elegir un país y
// quedarse sin ciudades que seleccionar.
//
// Si se añade una ciudad de un país que no esté en este mapa, la interfaz
// muestra el código (p. ej. «KE») en lugar de romperse. Basta con añadir aquí
// la línea correspondiente.

export const PAIS_NOMBRE: Record<string, string> = {
  AR: "Argentina", BO: "Bolivia", BR: "Brasil", CL: "Chile", CO: "Colombia",
  CR: "Costa Rica", CU: "Cuba", DO: "República Dominicana", EC: "Ecuador",
  SV: "El Salvador", GT: "Guatemala", HN: "Honduras", MX: "México",
  NI: "Nicaragua", PA: "Panamá", PY: "Paraguay", PE: "Perú", PR: "Puerto Rico",
  UY: "Uruguay", VE: "Venezuela", ES: "España", PT: "Portugal",
  US: "Estados Unidos", CA: "Canadá", GB: "Reino Unido", IE: "Irlanda",
  FR: "Francia", DE: "Alemania", IT: "Italia", NL: "Países Bajos",
  BE: "Bélgica", CH: "Suiza", AT: "Austria", SE: "Suecia", NO: "Noruega",
  DK: "Dinamarca", FI: "Finlandia", PL: "Polonia", CZ: "Chequia",
  GR: "Grecia", RO: "Rumanía", HU: "Hungría", RU: "Rusia", UA: "Ucrania",
  TR: "Turquía", IL: "Israel", AE: "Emiratos Árabes Unidos", IN: "India",
  CN: "China", JP: "Japón", KR: "Corea del Sur", TH: "Tailandia",
  ID: "Indonesia", PH: "Filipinas", VN: "Vietnam", MY: "Malasia",
  SG: "Singapur", AU: "Australia", NZ: "Nueva Zelanda", ZA: "Sudáfrica",
  MA: "Marruecos", EG: "Egipto", NG: "Nigeria", KE: "Kenia", GH: "Ghana",
  BZ: "Belice", GY: "Guyana", SR: "Surinam", TT: "Trinidad y Tobago",
  JM: "Jamaica", HT: "Haití", BS: "Bahamas", BB: "Barbados",
  GQ: "Guinea Ecuatorial", AD: "Andorra", LU: "Luxemburgo", IS: "Islandia",
}

/** Nombre del país; si el código no está mapeado, devuelve el propio código. */
export function nombrePais(code: string): string {
  return PAIS_NOMBRE[code?.toUpperCase()] || code?.toUpperCase() || ""
}

/**
 * Bandera como emoji a partir del código ISO. Se calcula con los caracteres
 * regionales Unicode: no hace falta ningún set de imágenes ni dependencia.
 */
export function banderaPais(code: string): string {
  const c = (code || "").toUpperCase()
  if (!/^[A-Z]{2}$/.test(c)) return ""
  return String.fromCodePoint(
    0x1f1e6 + (c.charCodeAt(0) - 65),
    0x1f1e6 + (c.charCodeAt(1) - 65),
  )
}

/** Quita tildes y pasa a minúsculas — mismo criterio que name_norm en la base. */
export function normalizar(texto: string): string {
  return (texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
}
