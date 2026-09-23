"use client"

// CARTOGRAFÍA ESTELAR 144 — de dónde sale todo esto.
//
// Esta pantalla existe para que nadie tenga que creerse el número.
//
// ── CÓMO ESTÁ ESCRITA ──────────────────────────────────────────────────────
// Para alguien que entra sin saber nada y quiere entender qué le están
// enseñando. Primero, con palabras normales, qué se hace y en qué orden.
// Después, plegados, todos los números: los orbes, los pesos, la fórmula.
//
// No se ha quitado ni un dato respecto a la versión anterior. Lo que ha
// cambiado es qué se lee primero.
//
// Todo lo que sale aquí se lee de la configuración, no está escrito a mano:
// si alguien cambia un orbe en config.ts, esta pantalla lo refleja sola.

import { useState } from "react"
import { ArrowLeft, RotateCcw, HelpCircle } from "lucide-react"
import {
  ASPECTOS, ECO_MISMA_ANCLA, ESCALA_SATURACION, EXPONENTE_CERCANIA,
  PESO_PUNTO, TOPE_RESONANCIA,
} from "../../_lib/cartografia-estelar/resonancia/config"
import { PORTALES } from "../../_lib/cartografia-estelar/catalog/portales"
import { PUNTOS } from "../../_lib/cartografia-estelar/content/puntos.content"
import {
  AVISO_METODOLOGIA_PROPIA, AVISO_PRIVACIDAD, QUE_NO_ES_RESONANCIA,
} from "../../_lib/cartografia-estelar/content/avisos"
import { DrawerDistancia } from "./DrawerDistancia"
import type { Cartografia } from "../../_lib/cartografia-estelar/domain/types"
import s from "./cartografia.module.css"

export function Metodologia({ carto, onVolver, onReiniciar }: {
  carto: Cartografia
  onVolver: () => void
  onReiniciar?: () => void
}) {
  const anclas = PORTALES.reduce((a, p) => a + p.anclas.length, 0)
  const [verDistancia, setVerDistancia] = useState(false)

  return (
    <div className={s.metodologia}>
      <button type="button" onClick={onVolver} className={s.volver}>
        <ArrowLeft size={14} /> Volver
      </button>

      <header className={s.cabecera}>
        <p className={s.kicker}>Cómo está hecho</p>
        <h2 className={s.titulo}>¿De dónde sale todo esto?</h2>
      </header>

      {/* ── En una frase ─────────────────────────────────────────────────── */}
      <section className={s.seccion}>
        <p className={s.parrafoGrande}>
          Con tu fecha, tu hora y tu lugar de nacimiento calculamos dónde estaba cada
          planeta en ese momento. Después miramos cuántos grados lo separan de{" "}
          {PORTALES.length} puntos del cielo que hemos elegido.
        </p>
        <p className={s.parrafoGrande}>
          Cuando eso pasa, lo llamamos un <strong>contacto</strong>. Y a partir de esos
          contactos escribimos tu lectura.
        </p>
        <button type="button" className={s.secundario} onClick={() => setVerDistancia(true)}>
          <HelpCircle size={13} /> ¿Qué se mide exactamente? ¿Por qué no sale mi signo?
        </button>
      </section>

      {/* ── Los cuatro pasos, sin tecnicismos ────────────────────────────── */}
      <section className={s.seccion}>
        <h3 className={s.seccionTitulo}>Lo que hace la herramienta, paso a paso</h3>
        <ol className={s.pasosAmables}>
          <li>
            <span className={s.pasoNum}>1</span>
            <div>
              <p className={s.pasoTitulo}>Reconstruye tu cielo</p>
              <p className={s.parrafo}>
                Calcula dónde estaban el Sol, la Luna y los planetas en el instante exacto
                de tu nacimiento, vistos desde el lugar donde naciste.
              </p>
            </div>
          </li>
          <li>
            <span className={s.pasoNum}>2</span>
            <div>
              <p className={s.pasoTitulo}>Los compara con {PORTALES.length} puntos del cielo</p>
              <p className={s.parrafo}>
                Estrellas, grupos de estrellas, nebulosas, galaxias y centros del universo.
                Sus posiciones salen de catálogos astronómicos públicos, los mismos que usa
                cualquier observatorio.
              </p>
            </div>
          </li>
          <li>
            <span className={s.pasoNum}>3</span>
            <div>
              <p className={s.pasoTitulo}>Busca cinco separaciones concretas</p>
              <p className={s.parrafo}>
                Si un punto tuyo quedó a una de esas separaciones de una estrella —o muy
                cerca—, hay contacto. Si no, no lo hay, y no forzamos nada para que
                aparezca.
              </p>
            </div>
          </li>
          <li>
            <span className={s.pasoNum}>4</span>
            <div>
              <p className={s.pasoTitulo}>Suma y ordena</p>
              <p className={s.parrafo}>
                Cuantos más contactos y más ajustados, más arriba queda ese portal en tu
                lista. Ese es todo el misterio del número que ves.
              </p>
            </div>
          </li>
        </ol>
      </section>

      {/* ── Tus datos ────────────────────────────────────────────────────── */}
      <section className={s.seccion}>
        <h3 className={s.seccionTitulo}>Los datos que hemos usado</h3>
        <dl className={s.datos}>
          <div><dt>Fecha y hora</dt><dd>
            {String(carto.nacimiento.dia).padStart(2, "0")}/
            {String(carto.nacimiento.mes).padStart(2, "0")}/{carto.nacimiento.anio}
            {" a las "}
            {String(carto.nacimiento.hora).padStart(2, "0")}:
            {String(carto.nacimiento.minuto).padStart(2, "0")}
          </dd></div>
          <div><dt>Lugar</dt><dd>{carto.nacimiento.lugar.nombre}</dd></div>
          <div><dt>Huso horario aplicado</dt><dd>{carto.instante.desfaseTexto}</dd></div>
        </dl>
        <p className={s.parrafoSec}>
          El huso horario es el que regía en ese lugar <strong>ese día</strong>, no el de
          hoy. Importa más de lo que parece: una hora de diferencia mueve bastante tu
          Ascendente.
        </p>
        <p className={s.parrafoSec}>{AVISO_PRIVACIDAD}</p>

        {onReiniciar && (
          <button type="button" className={s.secundario} onClick={onReiniciar}>
            <RotateCcw size={13} /> Cambiar mis datos
          </button>
        )}
      </section>

      {/* ── Qué NO significa ─────────────────────────────────────────────── */}
      <section className={s.seccion}>
        <h3 className={s.seccionTitulo}>Lo que este número no es</h3>
        <p className={s.parrafoGrande}>{QUE_NO_ES_RESONANCIA}</p>
        <p className={s.parrafo}>
          Tampoco es una nota ni un ranking de lo bien que te ha ido. Un portal con
          resonancia baja no es peor que uno con resonancia alta: simplemente aparece
          menos veces en tu configuración.
        </p>
      </section>

      {/* ── Todo lo técnico, plegado ─────────────────────────────────────── */}
      <details className={s.detalleTecnico}>
        <summary>Los números exactos, para quien quiera comprobarlos</summary>

        <div className={s.cajonBloque}>
          <p className={s.cajonSubtitulo}>De dónde salen las posiciones</p>
          <p className={s.parrafo}>
            {PORTALES.length} portales con {anclas} estrellas de referencia. Las
            coordenadas están en época J2000 con su identificador de catálogo, y el
            desplazamiento hasta tu fecha lo calcula el motor astronómico. Así el dato
            guardado es el de la fuente original y cualquiera puede contrastarlo.
          </p>
          <p className={s.parrafo}>
            Tus datos exactos: {carto.nacimiento.lugar.latitud.toFixed(4)}°,{" "}
            {carto.nacimiento.lugar.longitud.toFixed(4)}° ·{" "}
            {carto.nacimiento.lugar.zonaHoraria} ·{" "}
            {new Date(carto.instante.utcMs).toISOString().replace("T", " ").slice(0, 19)} UTC
          </p>
        </div>

        <div className={s.cajonBloque}>
          <p className={s.cajonSubtitulo}>Las cinco separaciones y su margen</p>
          <div className={s.tablaEnvoltura}>
            <table className={s.tabla}>
              <thead><tr><th>Aspecto</th><th>Separación</th><th>Margen</th><th>Peso</th></tr></thead>
              <tbody>
                {ASPECTOS.map((a) => (
                  <tr key={a.id}>
                    <td>{a.nombre}</td><td>{a.angulo}°</td>
                    <td>±{a.orbe}°</td><td>{a.peso.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={s.cajonBloque}>
          <p className={s.cajonSubtitulo}>Cuánto pesa cada punto tuyo</p>
          <div className={s.pesos}>
            {Object.entries(PESO_PUNTO).map(([id, peso]) => (
              <span key={id} className={s.peso}>
                {PUNTOS[id as keyof typeof PUNTOS]?.nombre ?? id} <em>{peso.toFixed(2)}</em>
              </span>
            ))}
          </div>
          <p className={s.parrafoSec}>
            Los planetas lentos pesan menos porque su posición la comparten millones de
            personas nacidas el mismo año: dicen menos sobre ti en concreto.
          </p>
        </div>

        <div className={s.cajonBloque}>
          <p className={s.cajonSubtitulo}>La fórmula completa</p>
          <pre className={s.formula}>{`cercanía   = (1 − orbe / margen) ^ ${EXPONENTE_CERCANIA}
aporte     = cercanía × pesoAspecto × pesoPunto × pesoPortal

total      = suma de aportes
             (el contacto más fuerte de cada punto cuenta entero;
              los demás del mismo portal, × ${ECO_MISMA_ANCLA})

resonancia = 100 × (1 − e^(−total / ${ESCALA_SATURACION}))
             con tope en ${TOPE_RESONANCIA}`}</pre>
        </div>

        <div className={s.cajonBloque}>
          <p className={s.cajonSubtitulo}>Por qué verás dos números</p>
          <p className={s.parrafo}>
            Cada contacto guarda dos ángulos distintos y los muestra por separado. El{" "}
            <strong>orbe</strong> sale de proyectar todo sobre un aro de referencia, y es lo
            que construye el contacto. La <strong>separación real</strong> es el ángulo
            verdadero entre las dos direcciones en el cielo.
          </p>
          <p className={s.parrafoSec}>
            Para una estrella muy por encima o muy por debajo del aro, las dos cifras
            pueden ser muy distintas: un orbe de 0°42′ puede convivir con una separación
            real de 18°. Ninguna de las dos es una distancia en años luz.
          </p>
        </div>
      </details>

      <p className={s.avisoMetodologia}>{AVISO_METODOLOGIA_PROPIA}</p>

      {verDistancia && <DrawerDistancia carto={carto} onCerrar={() => setVerDistancia(false)} />}
    </div>
  )
}
