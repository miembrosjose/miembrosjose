"use client"

// CARTOGRAFÍA ESTELAR 144 — "¿qué se mide exactamente?"
//
// ── LA EXPLICACIÓN CENTRAL DE TODA LA HERRAMIENTA ──────────────────────────
// Si alguien solo lee una pantalla, que sea esta.
//
// El vocabulario está unificado a propósito, porque mezclarlo fue justo lo que
// hizo que no se entendiera:
//
//   DIRECCIÓN   — hacia dónde hay que mirar para ver algo.
//   SEPARACIÓN  — cuántos grados hay entre dos direcciones. Es lo que medimos.
//   DISTANCIA   — a cuántos años luz está algo. Esto NO se usa nunca.
//
// La imagen que sostiene todo: las cosas del cielo proyectan su sombra sobre
// un aro alrededor de la Tierra, y lo que se mide es cuánto se separan esas
// sombras sobre el aro.
//
// Todo lo de esta pantalla es CAPA A. Son hechos astronómicos.

import { X } from "lucide-react"
import { aGradosMinutos } from "../../_lib/cartografia-estelar/astronomy/angulos"
import {
  explicarSigno, portalDelMismoNombre, signoTexto,
} from "../../_lib/cartografia-estelar/domain/editorial/signos"
import { tablaAspectos } from "../../_lib/cartografia-estelar/domain/editorial/explicacion-score"
import { AVISO_METODOLOGIA_PROPIA } from "../../_lib/cartografia-estelar/content/avisos"
import type { Cartografia } from "../../_lib/cartografia-estelar/domain/types"
import s from "./cartografia.module.css"
import { usePropsDelFondo } from "../../_lib/panel-modal"

export function DrawerDistancia({ carto, onCerrar }: {
  carto: Cartografia
  onCerrar: () => void
}) {
  const propsDelFondo = usePropsDelFondo(onCerrar)
  const e = explicarSigno(carto, "sol")
  const homonimo = e ? portalDelMismoNombre(carto, e.signo) : null
  const tabla = tablaAspectos()

  return (
    <div className={s.cajonFondo} {...propsDelFondo}>
      <div className={s.cajon} role="dialog" aria-label="Qué se mide exactamente">
        <div className={s.cajonCabecera}>
          <h3 className={s.cajonTitulo}>¿Qué se mide exactamente?</h3>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className={s.cajonCerrar}>
            <X size={16} />
          </button>
        </div>

        <div className={s.cajonCuerpo}>
          <p className={s.parrafoGrande}>
            Es la pregunta más importante de toda la herramienta. Va en cuatro pasos.
          </p>

          {/* ── 1 ─────────────────────────────────────────────────────────── */}
          <div className={s.pasoIdea}>
            <span className={s.pasoIdeaNum}>1</span>
            <div>
              <p className={s.pasoIdeaTitulo}>Todo lo que hay en el cielo es una dirección</p>
              <p className={s.parrafo}>
                Cuando miras una estrella, lo único que sabes es hacia dónde mirar. No
                notas si está cerca o lejos. Desde aquí, todo el cielo parece pegado a una
                bóveda.
              </p>
            </div>
          </div>

          {/* ── 2 ─────────────────────────────────────────────────────────── */}
          <div className={s.pasoIdea}>
            <span className={s.pasoIdeaNum}>2</span>
            <div>
              <p className={s.pasoIdeaTitulo}>A qué distancia está algo no se usa nunca</p>
              <p className={s.parrafo}>
                Sirio está a 8,6 años luz. El Centro Galáctico, a 26.000. Esa diferencia
                enorme <strong>no entra en ningún cálculo</strong>. Los dos son direcciones,
                y eso es lo único que se mira.
              </p>
            </div>
          </div>

          {/* ── 3 ─────────────────────────────────────────────────────────── */}
          <div className={s.pasoIdea}>
            <span className={s.pasoIdeaNum}>3</span>
            <div>
              <p className={s.pasoIdeaTitulo}>Las direcciones se proyectan sobre un aro</p>
              <p className={s.parrafo}>
                Imagina un aro alrededor de la Tierra: el camino que recorre el Sol a lo
                largo del año. Cada cosa del cielo proyecta su sombra sobre ese aro, y esa
                sombra cae en un punto concreto.
              </p>
            </div>
          </div>

          {/* ── 4 ─────────────────────────────────────────────────────────── */}
          <div className={s.pasoIdea}>
            <span className={s.pasoIdeaNum}>4</span>
            <div>
              <p className={s.pasoIdeaTitulo}>Se mide cuánto se separan dos sombras</p>
              <p className={s.parrafo}>
                Eso es todo. Se llama <strong>separación</strong> y se mide en grados, del
                0 al 180. No es una distancia en kilómetros: es un ángulo.
              </p>
            </div>
          </div>

          <div className={s.ideaClave}>
            <p className={s.parrafo}>
              Dicho en una frase: <strong>no medimos a qué distancia está nada. Medimos
              cuántos grados separan dos direcciones.</strong>
            </p>
          </div>

          {/* ── Por qué esas cinco ───────────────────────────────────────── */}
          <p className={s.cajonSubtitulo}>¿Y por qué solo cinco separaciones?</p>
          <p className={s.parrafo}>
            Porque parten el aro en trozos enteros:
          </p>
          <ul className={s.listaPuntos}>
            {tabla.map((a) => (
              <li key={a.id}>
                <strong>{a.angulo}°</strong> — {a.nombre.toLowerCase()}
                {a.angulo === 0 && " · las dos sombras en el mismo punto"}
                {a.angulo === 180 && " · media vuelta de aro, una enfrente de la otra"}
                {a.angulo === 120 && " · un tercio de aro"}
                {a.angulo === 90 && " · un cuarto de aro"}
                {a.angulo === 60 && " · un sexto de aro"}
              </li>
            ))}
          </ul>
          <p className={s.parrafoSecundario}>
            Que esas divisiones signifiquen algo es una decisión nuestra, no un hecho
            demostrado. Lo decimos claro porque es la parte que no podemos probarte.
          </p>

          {/* ── Los dos números ──────────────────────────────────────────── */}
          <p className={s.cajonSubtitulo}>Por qué verás dos números distintos</p>
          <p className={s.parrafo}>
            Como trabajamos con sombras sobre el aro, perdemos una información: si algo
            está muy por encima o muy por debajo de ese aro.
          </p>
          <p className={s.parrafo}>
            Dos cosas pueden tener la sombra exactamente en el mismo punto —separación
            0°— y estar lejísimos la una de la otra mirando al cielo de verdad. Por eso
            en cada contacto aparecen dos cifras:
          </p>
          <ul className={s.listaPuntos}>
            <li>
              <strong>Separación en el aro</strong> — la que construye el contacto. Es la
              que usa el método.
            </li>
            <li>
              <strong>Separación real en el cielo</strong> — el ángulo verdadero entre las
              dos direcciones, sin aplastar nada.
            </li>
          </ul>
          <p className={s.parrafoSecundario}>
            Las dos son ángulos, las dos van en grados, y ninguna de las dos es una
            distancia en años luz. Te mostramos siempre las dos, aunque la segunda a veces
            deje menos lucida a la primera.
          </p>

          {/* ── Por qué no sale tu signo ─────────────────────────────────── */}
          {e && (
            <>
              <p className={s.cajonSubtitulo}>¿Y por qué no aparece mi signo?</p>

              <p className={s.parrafoGrande}>
                Tu Sol está en <strong>{signoTexto(e.longitud)}</strong>. La herramienta lo
                sabe. Lo que pasa es que nunca trabaja con signos, sino con estrellas de
                verdad, y son dos cosas distintas.
              </p>

              <div className={s.ideaClave}>
                <p className={s.parrafo}>
                  Un <strong>signo</strong> es un trozo de 30° del aro. No tiene estrellas
                  dentro: es una división en doce partes iguales.
                </p>
                <p className={s.parrafo}>
                  Una <strong>constelación</strong> es una región del cielo con estrellas
                  reales, que puedes ver.
                </p>
              </div>

              <p className={s.parrafoGrande}>
                Hace unos dos mil años coincidían. Desde entonces el eje de la Tierra se ha
                ido desplazando y se han separado más de veinte grados. Hoy el signo y la
                constelación del mismo nombre ya no están en el mismo sitio.
              </p>

              {e.estrella && e.desajuste && (
                <div className={s.casoReal}>
                  <p className={s.casoRealTitulo}>En tu caso concreto</p>
                  <p className={s.parrafo}>
                    Tu Sol, en el signo de {e.signo}, tenía detrás a{" "}
                    <strong>{e.estrella.anclaNombre}</strong>, una estrella de{" "}
                    {e.estrella.portalNombre}. Sus sombras en el aro están a{" "}
                    {aGradosMinutos(e.estrella.separacion)} la una de la otra
                    {e.estrella.esContacto
                      ? ", y por eso ese portal sí aparece en tu lista."
                      : "."}
                  </p>
                  <p className={s.parrafo}>
                    Es decir: tu signo dice {e.signo}, pero el cielo que tenías detrás era
                    otro. No es un error de la herramienta ni de tu carta. Es lo que hay
                    ahí arriba.
                  </p>
                </div>
              )}

              {homonimo && (
                <p className={s.parrafoSecundario}>
                  {homonimo.resonancia === null ? (
                    <>
                      Aquí existe un portal llamado <strong>{homonimo.nombre}</strong>, pero
                      se refiere a la constelación, no al signo. En tu carta no forma ningún
                      contacto, y por eso no lo ves.
                    </>
                  ) : (
                    <>
                      Aquí existe un portal llamado <strong>{homonimo.nombre}</strong> —la
                      constelación, no el signo— y en tu caso sí forma contacto, con
                      resonancia {homonimo.resonancia}.
                    </>
                  )}
                </p>
              )}

              <p className={s.parrafoSecundario}>
                Nada de esto invalida tu signo solar. Esta herramienta mira otra cosa: no en
                qué trozo del aro caíste, sino qué estrellas tenías detrás.
              </p>
            </>
          )}

          <p className={s.avisoMetodologia}>{AVISO_METODOLOGIA_PROPIA}</p>
        </div>
      </div>
    </div>
  )
}
