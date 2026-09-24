"use client"

// «¿DE DÓNDE SALEN ESTOS PORCENTAJES?» — Código de Origen.
//
// Mismo problema y misma solución que en Numerología: la lectura enseñaba un
// mandala y cinco cifras, y en ningún sitio decía de dónde venían. Aquí está la
// cuenta, y además qué significa cada una de las cinco frecuencias, que es la
// otra mitad de la pregunta.
//
// ── QUÉ SE PUEDE CONTAR Y QUÉ NO ───────────────────────────────────────────
// Se cuenta el MÉTODO —cuatro columnas, capas, pesos, reparto sobre cien—, que
// es verificable y es lo que convierte una cifra en una medida. No se cuenta
// que la cifra signifique nada por sí misma: el texto de cada frecuencia ya
// dice lo que sugiere, y ahí sigue.

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { FRECUENCIAS } from "../_lib/codigo-origen/interpretations"
import type { CodigoOrigenResultado } from "../_lib/codigo-origen/types"
import s from "./como-sale.module.css"

const PASOS = [
  {
    titulo: "Tu nacimiento se convierte en cuatro columnas",
    texto:
      "El año, el mes, el día y la hora. No son cuatro datos sueltos: cada uno describe el mismo instante desde una distancia distinta, del ciclo más largo al más corto.",
  },
  {
    titulo: "Cada columna contiene varias capas",
    texto:
      "Una capa visible, la que se lee de inmediato, y bajo ella otras que están contenidas y pesan menos. Es la diferencia entre lo que se ve de un árbol y lo que sostiene su raíz.",
  },
  {
    titulo: "Cada capa suma puntos a una frecuencia",
    texto:
      "La capa visible y la contenida principal valen 2 puntos; la media, 1; la residual, medio punto. Siempre los mismos valores, para todo el mundo y en todas las fechas.",
  },
  {
    titulo: "Los puntos se reparten sobre cien",
    texto:
      "Se suma todo y se convierte a porcentaje, de modo que las cinco cifras sumen exactamente 100. La más alta es tu frecuencia raíz; la segunda, la de apoyo; la más baja, la de integración.",
  },
]

export function ComoSaleElPorcentaje({ r }: { r: CodigoOrigenResultado }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <section className={s.bloque}>
      <button
        type="button"
        className={s.cabecera}
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
      >
        <span className={s.titulo}>¿De dónde salen estos porcentajes?</span>
        <ChevronDown size={16} aria-hidden className={abierto ? s.chevronAbierto : s.chevron} />
      </button>

      {!abierto && (
        <p className={s.invitacion}>
          Cómo se hace la cuenta, y qué nombra cada una de las cinco frecuencias.
        </p>
      )}

      {abierto && (
        <div className={s.cuerpo}>
          <p className={s.intro}>
            Un porcentaje no es una opinión sobre ti: es el resultado de un reparto, y el
            reparto se puede seguir paso a paso. Esto es lo que ocurrió con tu fecha y tu
            hora.
          </p>

          {PASOS.map((p, i) => (
            <div key={p.titulo} className={s.paso}>
              <div className={s.pasoCabecera}>
                <span className={s.pasoTitulo}>Paso {i + 1}</span>
                <span className={s.pasoResultado}>{i + 1}</span>
              </div>
              <p className={s.pasoNombre}>{p.titulo}</p>
              <p className={s.pasoDeDonde}>{p.texto}</p>
            </div>
          ))}

          <div className={s.tabla}>
            <p className={s.tablaTitulo}>Qué nombra cada frecuencia</p>
            <p className={s.tablaNota}>
              Las cinco están siempre presentes. Tener poca de una no es una carencia:
              señala la dirección que queda por recorrer.
            </p>
            <dl className={s.glosario}>
              {r.reparto.map((f) => {
                const frec = FRECUENCIAS[f.id]
                return (
                  <div key={f.id} className={s.glosarioFila}>
                    <dt className={s.glosarioNombre} style={{ color: frec.color }}>
                      {frec.nombre}
                      <span className={s.glosarioPct}>{f.porcentaje}%</span>
                    </dt>
                    <dd className={s.glosarioTexto}>{frec.frase}</dd>
                  </div>
                )
              })}
            </dl>
          </div>

          <p className={s.cierre}>
            El cálculo ocurre entero en tu dispositivo y siempre da lo mismo con los mismos
            datos. Si cambiaras la hora de nacimiento, la cuarta columna cambiaría y con
            ella el reparto: por eso la hora importa, aunque sea aproximada.
          </p>
        </div>
      )}
    </section>
  )
}
