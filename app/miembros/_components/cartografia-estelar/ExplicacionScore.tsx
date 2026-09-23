"use client"

// CARTOGRAFÍA ESTELAR 144 — "¿Por qué esta cifra?"
//
// Un número sin explicación es una caja negra, y una caja negra pide fe.
//
// ── CÓMO ESTÁ ESCRITO ──────────────────────────────────────────────────────
// Primero, en palabras normales, las cuatro cosas que hacen subir o bajar la
// cifra. Después, plegado, el desglose con todos los números para quien quiera
// comprobarlo. No se ha quitado ni un dato: se ha cambiado el orden, para que
// lo primero que se lea sea algo que se entiende.
//
// Toda esta pantalla es CAPA A. No hay interpretación en ninguna parte.

import { useState } from "react"
import { X } from "lucide-react"
import { aGradosMinutos } from "../../_lib/cartografia-estelar/astronomy/angulos"
import { PUNTOS } from "../../_lib/cartografia-estelar/content/puntos.content"
import { AVISO_METODOLOGIA_PROPIA } from "../../_lib/cartografia-estelar/content/avisos"
import type { LecturaPortal } from "../../_lib/cartografia-estelar/domain/editorial/lectura-portal"
import s from "./cartografia.module.css"

export function ExplicacionScore({ lectura, onCerrar }: {
  lectura: LecturaPortal
  onCerrar: () => void
}) {
  const e = lectura.explicacion
  const [verNumeros, setVerNumeros] = useState(false)

  // El contacto que más aporta, para poder señalarlo con nombre y apellido.
  const principal = e.lineas[0]
  const otros = e.lineas.length - 1

  return (
    <div className={s.cajonFondo} onClick={(ev) => { if (ev.target === ev.currentTarget) onCerrar() }}>
      <div className={s.cajon} role="dialog" aria-label={`Por qué ${lectura.resonancia}`}>
        <div className={s.cajonCabecera}>
          <h3 className={s.cajonTitulo}>¿Por qué {lectura.resonancia}?</h3>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className={s.cajonCerrar}>
            <X size={16} />
          </button>
        </div>

        <div className={s.cajonCuerpo}>
          <p className={s.parrafoGrande}>
            Ese número no significa nada por sí solo, y no mide nada del mundo: es una
            cuenta nuestra. Sirve para ordenar tus portales de más marcado a menos
            marcado, y para nada más.
          </p>

          <p className={s.cajonSubtitulo}>De dónde sale</p>

          <ol className={s.razones}>
            <li>
              <strong>Tienes {e.lineas.length}{" "}
              {e.lineas.length === 1 ? "contacto" : "contactos"} con este portal.</strong>{" "}
              Cada uno suma. Más contactos, más resonancia.
            </li>
            <li>
              <strong>Cuanto más ajustado el contacto, más suma.</strong> El tuyo más
              fuerte es el de {PUNTOS[principal.contacto.punto].nombre}, que se quedó a{" "}
              {aGradosMinutos(principal.contacto.orbe)} de la separación exacta.
              {otros > 0 && ` Los otros ${otros === 1 ? "queda" : "quedan"} un poco más lejos y por eso ${otros === 1 ? "suma" : "suman"} menos.`}
            </li>
            <li>
              <strong>No todos los puntos pesan igual.</strong> Un contacto con tu Sol o
              tu Luna cuenta más que uno con Plutón, porque la posición de Plutón la
              comparte con millones de personas nacidas el mismo año y dice menos de ti.
            </li>
            <li>
              <strong>Los primeros contactos cuentan mucho, los siguientes cada vez
              menos.</strong> Si no fuera así, diez contactos flojos superarían a uno
              perfecto con tu Sol, y eso sería absurdo.
            </li>
          </ol>

          {e.ecos > 0 && (
            <div className={s.notaEco}>
              <p className={s.cajonSubtitulo}>Una cosa más</p>
              <p className={s.parrafo}>
                {e.ecos === 1 ? "Uno de tus contactos cuenta" : `${e.ecos} de tus contactos cuentan`}{" "}
                reducido. Pasa cuando un mismo punto tuyo alcanza a varias estrellas de
                este portal a la vez: como están muy juntas en el cielo, un solo contacto
                las toca todas.
              </p>
              <p className={s.parrafo}>
                Si las contáramos todas por separado, un grupo de estrellas apretadas
                ganaría siempre, no por resonar más contigo sino por tener más estrellas en
                la lista. Así que la más fuerte cuenta entera y las demás cuentan poco.
                Las verás todas igualmente: lo que cambia es cuánto suman.
              </p>
            </div>
          )}

          <p className={s.cajonSubtitulo}>Dos límites</p>
          <ul className={s.listaPuntos}>
            <li>
              <strong>Nunca llega a 100.</strong> Por mucho que se acumule, la cifra se
              acerca a 100 sin tocarlo. No existe el portal perfecto.
            </li>
            <li>
              <strong>Nunca baja de {e.constantes.sueloResonancia}.</strong> Si hay
              contacto, se ve. Mostrarte un cero con un contacto listado debajo sería
              contradecirnos solos.
            </li>
          </ul>

          <button
            type="button"
            className={s.verNumeros}
            onClick={() => setVerNumeros((v) => !v)}
            aria-expanded={verNumeros}
          >
            {verNumeros ? "Ocultar los números" : "Ver los números exactos"}
          </button>

          {verNumeros && (
            <div className={s.bloqueNumeros}>
              <p className={s.parrafo}>
                Esto es la cuenta completa, tal cual la hace la herramienta. No hace falta
                entenderla para usar tu cartografía: está aquí para que puedas comprobar
                que no nos hemos inventado nada.
              </p>

              <p className={s.formula}>
                cercanía = (1 − orbe ÷ margen) <sup>{e.constantes.exponenteCercania}</sup>
                <br />
                aporte = cercanía × peso del aspecto × peso del punto × peso del portal
              </p>

              <div className={s.tablaEnvoltura}>
                <table className={s.tabla}>
                  <thead>
                    <tr>
                      <th>Contacto</th>
                      <th>Orbe</th>
                      <th>Cercanía</th>
                      <th>Pesos</th>
                      <th>Aporte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {e.lineas.map((l, i) => (
                      <tr key={i} className={l.esEco ? s.filaEco : undefined}>
                        <td>
                          {PUNTOS[l.contacto.punto].nombre}
                          <br />
                          <em>→ {l.contacto.ancla.nombre}</em>
                        </td>
                        <td>
                          {aGradosMinutos(l.contacto.orbe)}
                          <br />
                          <em>de {aGradosMinutos(l.orbePermitido)}</em>
                        </td>
                        <td>{l.cercania.toFixed(3)}</td>
                        <td>{l.pesoAspecto} × {l.pesoPunto} × {l.pesoPortal}</td>
                        <td>
                          <strong>{l.aporte.toFixed(3)}</strong>
                          {l.esEco && <em> reducido ×{e.constantes.ecoMismaAncla}</em>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className={s.formula}>
                suma de aportes = {e.total.toFixed(4)}
                <br />
                {lectura.resonancia} = 100 × (1 − e<sup>−{e.total.toFixed(4)} ÷ {e.constantes.escalaSaturacion}</sup>)
              </p>
              <p className={s.parrafoSecundario}>
                Con tope en {e.constantes.topeResonancia}, suelo en{" "}
                {e.constantes.sueloResonancia} y redondeo a un decimal.
              </p>
            </div>
          )}

          <p className={s.resultadoFinal}>
            Tu resonancia con {lectura.nombre}: <strong>{e.final}</strong>
          </p>

          <p className={s.avisoMetodologia}>{AVISO_METODOLOGIA_PROPIA}</p>
        </div>
      </div>
    </div>
  )
}
