// CARTOGRAFÍA ESTELAR 144 — textos fijos que la interfaz repite.
//
// Están aquí y no dentro de los componentes para que se puedan revisar todos
// juntos: son las frases que más veces va a leer una persona.
//
// ── ESCRITOS PARA QUIEN NO SABE NADA ───────────────────────────────────────
// Sin tecnicismos y sin dar por supuesto ningún conocimiento previo. Donde
// hace falta una palabra técnica, se explica en la misma frase.
//
// AVISO_DOS_CAPAS es la excepción: ese texto está fijado y no se toca.

/** Fijado. No modificar sin decisión expresa. */
export const AVISO_DOS_CAPAS =
  "Las posiciones y relaciones celestes corresponden a cálculos astronómicos. Las interpretaciones sobre resonancia, memoria y conciencia estelar pertenecen al marco espiritual y contemplativo de Los 144000."

export const QUE_NO_ES_RESONANCIA =
  "Esto no dice de dónde vienes, ni a qué perteneces, ni quién eres. Dice que, con las cuentas que hacemos en esta herramienta, ese punto del cielo aparece especialmente marcado en tu mapa. Las cuentas están a la vista y puedes revisarlas cuando quieras."

export const AVISO_METODOLOGIA_PROPIA =
  "Estas cinco separaciones y estos márgenes son una elección nuestra, no una regla universal de la astrología. Otra herramienta podría usar otros y le saldrían otros resultados. Por eso los enseñamos: para que sepas con qué se ha hecho tu mapa."

export const AVISO_POSICIONES_3D =
  "Cada portal está en la dirección en que se ve desde la Tierra. La distancia real no se usa: unos están a pocos años luz y otros a millones, y aquí caben todos en la misma esfera."

export const AVISO_SIN_CONTACTO =
  "Sin contacto con tu cielo"

export const EXPLICACION_SIN_CONTACTO =
  "El resto no tiene ninguna relación con tu cielo al nacer, y eso es lo normal. Los márgenes que usamos son estrechos a propósito, así que en cualquier carta la mayoría se quedan fuera. Podríamos ampliarlos para que aparecieran más, pero entonces el mapa no distinguiría nada."

export const AVISO_PRIVACIDAD =
  "Tu fecha, tu hora y tu lugar de nacimiento no salen de este dispositivo. Todo el cálculo ocurre aquí mismo, en tu navegador, y no se guarda nada en ningún servidor."

export const AVISO_NO_RECONOZCO =
  "No hace falta que te encaje. Puedes dejarlo ahí y seguir mirando otras partes de tu cartografía."

/** Qué se muestra cuando la persona dice que no reconoce algo. */
export const RESPUESTAS_RECONOCIMIENTO = {
  si: "Bien. Lo que puedes observar en tu vida es lo único que vale de esta lectura.",
  aveces:
    "Eso suele ser lo más útil. Algo que aparece en unas situaciones y en otras no dice bastante más que algo que apareciera siempre. Fíjate en cuáles.",
  no: AVISO_NO_RECONOZCO,
} as const
