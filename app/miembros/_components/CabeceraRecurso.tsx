"use client"

// La cabecera de los módulos de Recursos: Cartografía Estelar 144, Código de
// Origen y Numerología Cósmica.
//
// ── POR QUÉ ES UN COMPONENTE Y NO TRES CABECERAS PARECIDAS ─────────────────
// Eran tres, y habían ido separándose sin que nadie lo decidiera: distintos
// tamaños de título, distintos anchos de línea, una centrada y otra alineada a
// la izquierda. Al abrirlos seguidos no parecían el mismo sitio.
//
// La forma vive en un solo archivo. Cada módulo pone su color y sus palabras.
//
// ── LAS CUATRO LÍNEAS, Y POR QUÉ SON CUATRO ────────────────────────────────
//   kicker   · de qué familia es esto
//   título   · cómo se llama
//   entrada  · QUÉ ES, en una idea. Es la línea que faltaba: «Compara tu
//              nacimiento con 50 puntos del cielo» dice lo que hace la máquina,
//              no lo que vas a ver.
//   matiz    · qué recibes, o qué no es esto. Pequeña a propósito.

import s from "./cabecera-recurso.module.css"

export function CabeceraRecurso({ kicker, titulo, entrada, matiz, acento }: {
  kicker: string
  titulo: string
  entrada: string
  matiz?: string
  /** El color del kicker. Violeta por defecto; Numerología va en dorado. */
  acento?: string
}) {
  return (
    <header
      className={s.cabecera}
      style={acento ? ({ "--acento-recurso": acento } as React.CSSProperties) : undefined}
    >
      <p className={s.kicker}>{kicker}</p>
      <h2 className={s.titulo}>{titulo}</h2>
      <p className={s.entrada}>{entrada}</p>
      {matiz && <p className={s.matiz}>{matiz}</p>}
    </header>
  )
}
