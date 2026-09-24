"use client"

// «¿DE DÓNDE SALE ESTE NÚMERO?»
//
// ── POR QUÉ ESTO ESTÁ AQUÍ ─────────────────────────────────────────────────
// La lectura enseñaba cuatro números grandes —camino, alma, personalidad,
// expresión— y ni una palabra de cómo se habían obtenido. Quien no conoce la
// numerología ve cuatro cifras caídas del cielo, y eso no invita a confiar:
// invita a creer o a descreer, que son las dos formas de no entender nada.
//
// Aquí está la cuenta entera, hecha con SU nombre y SU fecha: qué entra, cuánto
// vale cada pieza, cuánto suman y cómo se reduce. Ver el 3+8=11 de tu propia
// fecha explica la numerología mejor que tres párrafos sobre la numerología.
//
// ── PLEGADO, NO ESCONDIDO ──────────────────────────────────────────────────
// Va cerrado. Quien quiere su lectura la tiene delante sin tropezar con una
// tabla de aritmética; quien quiere saber de dónde sale, lo abre. Las dos
// personas son la misma en días distintos.

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { explicarNumeros, TABLA_PITAGORICA } from "../_lib/numerologia"
import s from "./como-sale.module.css"

export function ComoSaleElNumero({ nombre, fecha }: { nombre: string; fecha: string }) {
  const [abierto, setAbierto] = useState(false)
  const pasos = explicarNumeros(nombre, fecha)

  return (
    <section className={s.bloque}>
      <button
        type="button"
        className={s.cabecera}
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
      >
        <span className={s.titulo}>¿De dónde salen estos números?</span>
        <ChevronDown size={16} aria-hidden className={abierto ? s.chevronAbierto : s.chevron} />
      </button>

      {!abierto && (
        <p className={s.invitacion}>
          La cuenta completa, hecha con tu nombre y tu fecha.
        </p>
      )}

      {abierto && (
        <div className={s.cuerpo}>
          <p className={s.intro}>
            No hay nada oculto en el cálculo. Cada letra de tu nombre tiene un número
            asignado, y cada número se obtiene sumando un grupo concreto de ellas. Esto es
            lo que se ha hecho con lo que escribiste.
          </p>

          {pasos.map((p) => (
            <div key={p.titulo} className={s.paso}>
              <div className={s.pasoCabecera}>
                <span className={s.pasoTitulo}>{p.titulo}</span>
                <span className={s.pasoResultado}>{p.resultado}</span>
              </div>
              <p className={s.pasoDeDonde}>{p.deDonde}</p>

              {p.piezas.length === 0 ? (
                <p className={s.pasoVacio}>
                  Aquí no entró ninguna letra, así que no hay nada que sumar.
                </p>
              ) : (
                <>
                  <div className={s.piezas}>
                    {p.piezas.map((pieza, i) => (
                      <span key={`${pieza.simbolo}-${i}`} className={s.pieza}>
                        <span className={s.piezaSimbolo}>{pieza.simbolo}</span>
                        <span className={s.piezaValor}>{pieza.valor}</span>
                      </span>
                    ))}
                  </div>
                  <p className={s.cuenta}>
                    Suma: <strong>{p.suma}</strong>
                    {p.reduccion.length > 0 && (
                      <>
                        {p.reduccion.map((n, i) => (
                          <span key={i}> → <strong>{n}</strong></span>
                        ))}
                      </>
                    )}
                    {p.esMaestro && (
                      <span className={s.maestro}>
                        · se detiene aquí: {p.resultado} es un número maestro y no se reduce
                      </span>
                    )}
                  </p>
                </>
              )}
            </div>
          ))}

          <div className={s.tabla}>
            <p className={s.tablaTitulo}>El valor de cada letra</p>
            <p className={s.tablaNota}>
              Es la tabla pitagórica: el alfabeto repartido en nueve columnas, de 1 a 9.
              Las tildes no cuentan y la Ñ se lee como N.
            </p>
            <div className={s.tablaRejilla}>
              {TABLA_PITAGORICA.map((col) => (
                <div key={col.numero} className={s.tablaCol}>
                  <span className={s.tablaNum}>{col.numero}</span>
                  <span className={s.tablaLetras}>{col.letras.join(" ")}</span>
                </div>
              ))}
            </div>
          </div>

          <p className={s.cierre}>
            Los números 11, 22, 33 y 44 no se reducen: en esta tradición se llaman
            maestros y se leen tal cual. Por eso una suma de 38 puede quedarse en 11 y no
            continuar hasta el 2.
          </p>
        </div>
      )}
    </section>
  )
}
