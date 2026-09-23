"use client"

// CARTOGRAFÍA ESTELAR 144 — cajones educativos.
//
// Aparecen cuando alguien pregunta qué es un aspecto o qué es un orbe, desde
// el punto exacto en que le hizo falta saberlo. No antes: explicar los cinco
// aspectos a quien aún no ha visto ninguno es la forma más rápida de que
// cierre la herramienta.
//
// ── CÓMO ESTÁ ESCRITO ──────────────────────────────────────────────────────
// Para alguien que no sabe nada de astronomía y no tiene por qué saberlo.
// Primero la idea con palabras normales y una imagen que se pueda ver en la
// cabeza. Los números exactos siguen estando, pero debajo y plegados: quien
// quiera comprobarlos los tiene, y quien no, no tropieza con ellos.

import { X } from "lucide-react"
import { tablaAspectos } from "../../_lib/cartografia-estelar/domain/editorial/explicacion-score"
import { ASPECTOS_CONTENIDO, EXACTITUD_TEXTO } from "../../_lib/cartografia-estelar/content/aspectos.content"
import { AVISO_METODOLOGIA_PROPIA } from "../../_lib/cartografia-estelar/content/avisos"
import type { AspectoId } from "../../_lib/cartografia-estelar/domain/types"
import s from "./cartografia.module.css"
import { usePropsDelFondo } from "../../_lib/panel-modal"

function Cajon({ titulo, onCerrar, children }: {
  titulo: string
  onCerrar: () => void
  children: React.ReactNode
}) {
  // El fondo solo cierra si el gesto empezó y terminó en él. Sin eso, pulsar
  // un botón que desaparece con el propio clic cerraba el cajón de rebote.
  const propsDelFondo = usePropsDelFondo(onCerrar)
  return (
    <div className={s.cajonFondo} {...propsDelFondo}>
      <div className={s.cajon} role="dialog" aria-label={titulo}>
        <div className={s.cajonCabecera}>
          <h3 className={s.cajonTitulo}>{titulo}</h3>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className={s.cajonCerrar}>
            <X size={16} />
          </button>
        </div>
        <div className={s.cajonCuerpo}>{children}</div>
      </div>
    </div>
  )
}

export function DrawerAspecto({ onCerrar }: { onCerrar: () => void }) {
  const tabla = tablaAspectos()
  return (
    <Cajon titulo="¿Qué es un aspecto?" onCerrar={onCerrar}>
      <p className={s.parrafoGrande}>
        Imagina un aro alrededor de la Tierra. Todo lo que hay en el cielo —el Sol, la
        Luna, los planetas, las estrellas— proyecta su sombra sobre ese aro y cae en un
        punto concreto.
      </p>
      <p className={s.parrafoGrande}>
        Un <strong>aspecto</strong> es simplemente cuántos grados separan dos de esas
        sombras sobre el aro. Es un ángulo, no una distancia en años luz.
      </p>
      <p className={s.parrafoGrande}>
        Lo que hace esta herramienta es fijarse en cinco separaciones concretas. Cuando
        dos cosas quedan separadas justo por una de ellas, decimos que hay un contacto.
      </p>

      <div className={s.aspectosAmables}>
        <div className={s.aspectoAmable}>
          <span className={s.aspectoNumero}>0°</span>
          <div>
            <p className={s.aspectoNombre}>Conjunción — juntas</p>
            <p className={s.aspectoFrase}>Sus sombras caen en el mismo punto del aro.</p>
          </div>
        </div>
        <div className={s.aspectoAmable}>
          <span className={s.aspectoNumero}>180°</span>
          <div>
            <p className={s.aspectoNombre}>Oposición — enfrentadas</p>
            <p className={s.aspectoFrase}>Una a cada lado, mirándose desde extremos.</p>
          </div>
        </div>
        <div className={s.aspectoAmable}>
          <span className={s.aspectoNumero}>120°</span>
          <div>
            <p className={s.aspectoNombre}>Trígono — cómodas</p>
            <p className={s.aspectoFrase}>A un tercio de vuelta de aro.</p>
          </div>
        </div>
        <div className={s.aspectoAmable}>
          <span className={s.aspectoNumero}>90°</span>
          <div>
            <p className={s.aspectoNombre}>Cuadratura — en ángulo</p>
            <p className={s.aspectoFrase}>A un cuarto de vuelta de aro.</p>
          </div>
        </div>
        <div className={s.aspectoAmable}>
          <span className={s.aspectoNumero}>60°</span>
          <div>
            <p className={s.aspectoNombre}>Sextil — cerca</p>
            <p className={s.aspectoFrase}>A un sexto de vuelta de aro.</p>
          </div>
        </div>
      </div>

      <p className={s.parrafoGrande}>
        <strong>Ninguno es mejor que otro.</strong> No hay aspectos buenos ni malos, ni
        de buena o mala suerte. Cada uno describe una manera distinta en que dos partes de
        ti se relacionan, y cada una tiene su lado fácil y su lado que cuesta.
      </p>

      <details className={s.detalleTecnico}>
        <summary>Y esto, ¿qué quiere decir en cada caso?</summary>
        {tabla.map((a) => {
          const c = ASPECTOS_CONTENIDO[a.id as AspectoId]
          return (
            <div key={a.id} className={s.cajonBloque}>
              <p className={s.cajonSubtitulo}>{c.nombre} · {c.cualidad}</p>
              <p className={s.parrafo}>{c.comoSeExperimenta}</p>
            </div>
          )
        })}
      </details>

      <details className={s.detalleTecnico}>
        <summary>Los números exactos, por si quieres comprobarlos</summary>
        <div className={s.tablaEnvoltura}>
          <table className={s.tabla}>
            <thead>
              <tr><th>Aspecto</th><th>Separación exacta</th><th>Margen que aceptamos</th></tr>
            </thead>
            <tbody>
              {tabla.map((a) => (
                <tr key={a.id}>
                  <td>{a.nombre}</td>
                  <td>{a.angulo}°</td>
                  <td>± {a.orbe}°</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <p className={s.avisoMetodologia}>{AVISO_METODOLOGIA_PROPIA}</p>
    </Cajon>
  )
}

export function DrawerOrbe({ onCerrar }: { onCerrar: () => void }) {
  return (
    <Cajon titulo="¿Qué es el orbe?" onCerrar={onCerrar}>
      <p className={s.parrafoGrande}>
        Piensa en una diana. El centro es la separación exacta: 0°, o 90°, o la que toque
        según el aspecto del que hablemos.
      </p>
      <p className={s.parrafoGrande}>
        En la vida real casi nunca se da justo en el centro. El <strong>orbe</strong> es
        cuánto te has quedado del centro: la diferencia entre la separación que salió y la
        que habría sido exacta.
      </p>

      <div className={s.ejemploOrbeCaja}>
        <p className={s.ejemploOrbeTitulo}>Un ejemplo</p>
        <p className={s.parrafo}>
          Si una conjunción perfecta son 0° y en tu caso la diferencia es de 42 minutos
          (menos de un grado), tu orbe es de 0°42′. Muy cerca del centro de la diana.
        </p>
      </div>

      <p className={s.parrafoGrande}>
        Cuanto más pequeño es el orbe, más limpia es la relación. Y aquí viene lo
        importante: <strong>eso no quiere decir que sea más verdadero, ni más profundo,
        ni más espiritual.</strong> Solo quiere decir que el cálculo salió más ajustado.
      </p>

      <div className={s.cajonBloque}>
        <p className={s.cajonSubtitulo}>Cómo lo llamamos en tu lectura</p>
        <ul className={s.listaPuntos}>
          <li><strong>{EXACTITUD_TEXTO.exacto.etiqueta}</strong> — muy cerca del centro.</li>
          <li><strong>{EXACTITUD_TEXTO.cercano.etiqueta}</strong> — dentro de la diana, sin discusión.</li>
          <li><strong>{EXACTITUD_TEXTO.amplio.etiqueta}</strong> — cerca del borde. Cuenta, pero menos.</li>
        </ul>
      </div>

      <div className={s.cajonBloque}>
        <p className={s.cajonSubtitulo}>Por qué verás dos números distintos</p>
        <p className={s.parrafo}>
          En cada contacto aparecen dos números que parecen contradecirse. No lo son:
          miden cosas diferentes.
        </p>
        <p className={s.parrafo}>
          El <strong>orbe</strong> sale de las sombras sobre el aro. La{" "}
          <strong>separación real</strong> es el ángulo verdadero entre las dos
          direcciones, sin aplastar nada sobre el aro.
        </p>
        <p className={s.parrafo}>
          Una estrella puede estar muy por encima o muy por debajo del aro, tener su sombra
          justo donde la de un planeta —y dar un orbe pequeñísimo— y aun así estar lejísimos
          la una de la otra vistas desde aquí. Las dos cifras son ángulos, y ninguna de las
          dos es una distancia en años luz.
        </p>
      </div>

      <p className={s.avisoMetodologia}>{AVISO_METODOLOGIA_PROPIA}</p>
    </Cajon>
  )
}
