"use client"

// CARTOGRAFÍA ESTELAR 144 — la primera vez.
//
// ── EL PRINCIPIO QUE GOBIERNA ESTA PANTALLA ────────────────────────────────
// No se revela complejidad antes de explicarla. Cincuenta portales y veinte
// controles de golpe es exactamente lo que hundió el módulo anterior.
//
// Una idea → una interacción → una explicación → la siguiente capa.
//
// Todo lo que se muestra aquí es de la persona que está mirando: el contacto
// que se explica en el paso 3 es SU contacto real, con su orbe real. Nada es
// un ejemplo genérico, porque un ejemplo genérico no enseña a leer el propio.

import { useEffect, useMemo, useState } from "react"
import { ArrowRight, ArrowLeft, Telescope, Sparkles } from "lucide-react"
import { aGradosMinutos } from "../../_lib/cartografia-estelar/astronomy/angulos"
import { PUNTOS } from "../../_lib/cartografia-estelar/content/puntos.content"
import { ASPECTOS_CONTENIDO } from "../../_lib/cartografia-estelar/content/aspectos.content"
import { contenidoPortal } from "../../_lib/cartografia-estelar/content/portales"
import { portalPorId } from "../../_lib/cartografia-estelar/catalog/portales"
import { aspectoPorId } from "../../_lib/cartografia-estelar/resonancia/config"
import { QUE_NO_ES_RESONANCIA, AVISO_PRIVACIDAD } from "../../_lib/cartografia-estelar/content/avisos"
import { DrawerAspecto, DrawerOrbe } from "./Drawers"
import { DrawerDistancia } from "./DrawerDistancia"
import type { Cartografia } from "../../_lib/cartografia-estelar/domain/types"
import s from "./cartografia.module.css"

/** Los catorce puntos, en el orden en que se muestran al reconstruir el cielo. */
const ORDEN_REVELADO = [
  "sol", "luna", "mercurio", "venus", "marte",
  "jupiter", "saturno", "urano", "neptuno", "pluton",
  "ascendente", "medio_cielo", "nodo_norte", "nodo_sur",
] as const

export function PrimeraExperiencia({ carto, onTerminar, onCambioDePaso }: {
  carto: Cartografia
  onTerminar: () => void
  /** El panel vuelve arriba: cada paso empieza por su título, no por la mitad. */
  onCambioDePaso?: () => void
}) {
  const [paso, setPaso] = useState(1)

  useEffect(() => { onCambioDePaso?.() }, [paso, onCambioDePaso])
  const [cajon, setCajon] = useState<null | "aspecto" | "orbe" | "distancia">(null)

  // El contacto que se va a explicar: el más fuerte de toda la cartografía.
  // Es el que mejor se ve y el que más probablemente le diga algo.
  const ejemplo = useMemo(() => {
    const r = carto.resonancias[0]
    if (!r) return null
    const c = r.contactos[0]
    const def = aspectoPorId(c.aspecto)
    return {
      contacto: c,
      portal: portalPorId(r.portalId),
      punto: PUNTOS[c.punto],
      aspecto: ASPECTOS_CONTENIDO[c.aspecto],
      orbePermitido: def.orbe,
      anguloExacto: def.angulo,
    }
  }, [carto])

  const top3 = carto.resonancias.slice(0, 3)
  const siguiente = () => setPaso((p) => p + 1)

  // Sin ningún contacto no hay nada que explicar paso a paso.
  if (!ejemplo) {
    return (
      <div className={s.limpia}>
        <h2 className={s.tituloGrande}>Tu cielo ha sido reconstruido.</h2>
        <p className={s.textoLimpio}>
          Ninguno de tus catorce puntos ha quedado a las separaciones que buscamos con ninguno de
          los cincuenta portales. No es un error ni te falta nada: los márgenes que usamos
          son muy estrechos, y podríamos ampliarlos para que salieran cosas, pero entonces
          el mapa no significaría nada.
        </p>
        <button type="button" className={s.primario} onClick={onTerminar}>
          Ver el mapa igualmente
        </button>
      </div>
    )
  }

  return (
    <div className={s.experiencia}>
      <div className={s.progreso} aria-hidden>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <span key={n} className={n <= paso ? s.progresoPuntoActivo : s.progresoPunto} />
        ))}
      </div>

      {/* ── PASO 1 ───────────────────────────────────────────────────────── */}
      {paso === 1 && (
        <section className={s.pasoBloque}>
          <h2 className={s.tituloGrande}>Tu cielo ha sido reconstruido</h2>
          <p className={s.textoLimpio}>
            En el momento de tu nacimiento, el Sol, la Luna y los planetas ocupaban
            posiciones concretas vistos desde la Tierra. Cartografía Estelar 144 reconstruye
            ese instante y lo compara con estrellas, grupos de estrellas, nebulosas, galaxias
            y algunos centros del universo.
          </p>

          {/* La persona en el centro; sus catorce puntos alrededor. Sin ninguna
              interpretación todavía: aquí solo se está mostrando el cálculo. */}
          <div className={s.cieloReconstruido}>
            <span className={s.cieloCentro} aria-hidden />
            {ORDEN_REVELADO.map((id, i) => {
              const p = carto.puntos.find((x) => x.id === id)
              if (!p) return null
              const ang = (p.longitud - 90) * (Math.PI / 180)
              const R = 44
              return (
                <span
                  key={id}
                  className={s.cieloPunto}
                  style={{
                    left: `${50 + R * Math.cos(ang)}%`,
                    top: `${50 + R * Math.sin(ang)}%`,
                    animationDelay: `${i * 90}ms`,
                  }}
                >
                  <em>{PUNTOS[id].nombre}</em>
                </span>
              )
            })}
          </div>

          <p className={s.datoInstante}>
            {String(carto.nacimiento.dia).padStart(2, "0")}/
            {String(carto.nacimiento.mes).padStart(2, "0")}/{carto.nacimiento.anio} ·{" "}
            {String(carto.nacimiento.hora).padStart(2, "0")}:
            {String(carto.nacimiento.minuto).padStart(2, "0")} ·{" "}
            {carto.nacimiento.lugar.nombre} · {carto.instante.desfaseTexto}
          </p>

          <button type="button" className={s.primario} onClick={siguiente}>
            Ver qué buscamos <ArrowRight size={14} />
          </button>
        </section>
      )}

      {/* ── PASO 2 ───────────────────────────────────────────────────────── */}
      {paso === 2 && (
        <section className={s.pasoBloque}>
          <h2 className={s.tituloGrande}>¿Qué estamos comparando?</h2>

          <div className={s.comparacion}>
            <div className={s.comparacionLado}>
              <p className={s.comparacionTitulo}>Tu cielo al nacer</p>
              <p className={s.comparacionDato}>{carto.puntos.length} puntos</p>
              <p className={s.comparacionNota}>
                El Sol, la Luna, los ocho planetas y cuatro puntos más que se calculan
                a partir de tu hora y tu lugar.
              </p>
            </div>
            <span className={s.comparacionVs} aria-hidden>vs.</span>
            <div className={s.comparacionLado}>
              <p className={s.comparacionTitulo}>Portales celestes</p>
              <p className={s.comparacionDato}>{carto.resumen.portalesTotales} portales</p>
              <p className={s.comparacionNota}>
                Estrellas, grupos de estrellas, nebulosas, galaxias y centros del
                universo, con las posiciones que publican los observatorios.
              </p>
            </div>
          </div>

          <p className={s.textoLimpio}>
            No miramos qué estrellas se veían esa noche, que es lo que suele imaginarse.
            Miramos la <strong>separación</strong>: cuántos grados hay entre la dirección de
            uno de tus catorce puntos y la dirección de una de esas estrellas.
          </p>

          <div className={s.contactoEjemplo}>
            <span className={s.ejemploPunto}>{ejemplo.punto.nombre}</span>
            <span className={s.ejemploFlecha} aria-hidden>↓</span>
            <span className={s.ejemploOrbe}>{aGradosMinutos(ejemplo.contacto.orbe)}</span>
            <span className={s.ejemploFlecha} aria-hidden>↓</span>
            <span className={s.ejemploAncla}>{ejemplo.contacto.ancla.nombre}</span>
          </div>

          <button type="button" className={s.primario} onClick={siguiente}>
            Entender este contacto <ArrowRight size={14} />
          </button>
        </section>
      )}

      {/* ── PASO 3 ───────────────────────────────────────────────────────── */}
      {paso === 3 && (
        <section className={s.pasoBloque}>
          <p className={s.marcaCapa}><Telescope size={12} /> Astronomía</p>
          <h2 className={s.tituloContacto}>
            {ejemplo.punto.nombre} ↔ {ejemplo.contacto.ancla.nombre}
          </h2>
          <p className={s.subtituloContacto}>
            {ejemplo.aspecto.nombre} · orbe {aGradosMinutos(ejemplo.contacto.orbe)}
          </p>

          <p className={s.textoLimpio}>
            Imagina un aro alrededor de la Tierra. Todo lo que hay en el cielo proyecta su
            sombra sobre ese aro y cae en un punto. Para que haya{" "}
            {ejemplo.aspecto.nombre === "Conjunción" ? "una conjunción" : `${ejemplo.aspecto.nombre === "Oposición" ? "una oposición" : `un ${ejemplo.aspecto.nombre.toLowerCase()}`}`}{" "}
            exacta, sus dos sombras tendrían que estar separadas justo{" "}
            <strong>{ejemplo.anguloExacto}°</strong>.
          </p>
          <p className={s.textoLimpio}>
            En tu caso se quedaron a <strong>{aGradosMinutos(ejemplo.contacto.orbe)}</strong>{" "}
            de esa separación exacta. Como aceptamos hasta{" "}
            {aGradosMinutos(ejemplo.orbePermitido)}, cuenta como contacto.
          </p>

          {/* Las dos distancias, separadas. Confundirlas es el error más común
              de este tipo de herramientas, y aquí se explica antes de que
              aparezca en ninguna ficha. */}
          <div className={s.dosDistancias}>
            <div>
              <p className={s.distanciaEtiqueta}>Separación en el aro</p>
              <p className={s.distanciaValor}>
                {ejemplo.aspecto.nombre}, a {aGradosMinutos(ejemplo.contacto.orbe)} de ser exacta
              </p>
            </div>
            <div>
              <p className={s.distanciaEtiqueta}>Separación real en el cielo</p>
              <p className={s.distanciaValor}>
                {ejemplo.contacto.separacionReal.toFixed(1)}°
              </p>
            </div>
          </div>

          <p className={s.textoLimpio}>
            Los dos son ángulos, los dos van en grados, y ninguno es una distancia en años
            luz. El primero mide las sombras sobre el aro. El segundo, el ángulo verdadero
            entre las dos direcciones. Te mostramos siempre los dos.
          </p>

          <div className={s.ayudasPaso}>
            <p className={s.ayudasPasoTitulo}>Si algo no ha quedado claro</p>
            <div className={s.chips}>
              <button type="button" className={s.chipDestacado} onClick={() => setCajon("distancia")}>
                ¿Qué se mide?
              </button>
              <button type="button" className={s.chip} onClick={() => setCajon("aspecto")}>
                ¿Qué es un aspecto?
              </button>
              <button type="button" className={s.chip} onClick={() => setCajon("orbe")}>
                ¿Qué es un orbe?
              </button>
            </div>
          </div>
          <button type="button" className={s.primario} onClick={siguiente}>
            Continuar <ArrowRight size={14} />
          </button>
        </section>
      )}

      {/* ── PASO 4 ───────────────────────────────────────────────────────── */}
      {paso === 4 && (
        <section className={s.pasoBloque}>
          <h2 className={s.tituloGrande}>Aquí cambia lo que estás leyendo</h2>

          <div className={s.dosCapas}>
            <div className={s.capaA}>
              <p className={s.marcaCapa}><Telescope size={12} /> Astronomía</p>
              <ul className={s.listaDatos}>
                <li>{ejemplo.punto.nombre}</li>
                <li>{ejemplo.contacto.ancla.nombre}</li>
                <li>{ejemplo.aspecto.nombre}</li>
                <li>orbe {aGradosMinutos(ejemplo.contacto.orbe)}</li>
                <li>separación real {ejemplo.contacto.separacionReal.toFixed(1)}°</li>
              </ul>
              <p className={s.capaNota}>Hasta aquí, hechos comprobables.</p>
            </div>

            <span className={s.capaFlecha} aria-hidden>↓</span>

            <div className={s.capaB}>
              <p className={s.marcaCapaB}><Sparkles size={12} /> Lectura 144</p>
              <p className={s.parrafo}>
                A partir de aquí usamos esas separaciones como <strong>símbolos</strong>{" "}
                para hablar de cosas tuyas: lo que se te da bien, lo que te cuesta, lo que
                se repite en tu vida. Eso ya no es astronomía, y te lo decimos cada vez.
              </p>
              <p className={s.capaNota}>A partir de aquí, nuestra lectura.</p>
            </div>
          </div>

          <button type="button" className={s.primario} onClick={siguiente}>
            Descubrir mis resonancias <ArrowRight size={14} />
          </button>
        </section>
      )}

      {/* ── PASO 5 ───────────────────────────────────────────────────────── */}
      {paso === 5 && (
        <section className={s.pasoBloque}>
          <h2 className={s.tituloGrande}>Tus tres resonancias principales</h2>

          <ol className={s.top}>
            {top3.map((r, i) => {
              const p = portalPorId(r.portalId)!
              const c = contenidoPortal(r.portalId)
              return (
                <li key={r.portalId} className={s.topItem}>
                  <span className={s.topNum}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={s.topTextos}>
                    <span className={s.topNombre}>{p.nombre}</span>
                    <span className={s.topEsencia}>{c?.esencia}</span>
                    <span className={s.topContactos}>
                      {r.contactos.length} {r.contactos.length === 1 ? "contacto" : "contactos"}
                    </span>
                  </span>
                  <span className={s.topScore}>{r.resonancia}</span>
                </li>
              )
            })}
          </ol>

          <p className={s.textoLimpio}>
            Estos nombres no son etiquetas sobre quién eres. Lo importante es descubrir{" "}
            <strong>qué parte de tu configuración</strong> conecta con cada portal y qué
            patrón aparece cuando observamos todos esos contactos juntos.
          </p>
          <p className={s.aclaracion}>{QUE_NO_ES_RESONANCIA}</p>

          <button type="button" className={s.primario} onClick={siguiente}>
            Explorar mi cartografía <ArrowRight size={14} />
          </button>
        </section>
      )}

      {/* ── PASO 6 ───────────────────────────────────────────────────────── */}
      {paso >= 6 && (
        <section className={s.pasoFinal}>
          <span className={s.selloFinal} aria-hidden />
          <h2 className={s.tituloGrande}>Tu cartografía está lista</h2>

          <div className={s.cifrasFinal}>
            <div>
              <strong>{carto.resumen.portalesActivos}</strong>
              <em>portales con contacto</em>
            </div>
            <div>
              <strong>{carto.resumen.portalesTotales}</strong>
              <em>puntos mirados</em>
            </div>
            <div>
              <strong>{carto.resumen.contactosExactos}</strong>
              <em>contactos exactos</em>
            </div>
          </div>

          <p className={s.textoLimpio}>
            Puedes recorrerlos en el mapa o en la lista: es lo mismo visto de dos
            maneras. No hace falta leerlo todo hoy — está pensado para volver.
          </p>

          <button type="button" className={s.primario} onClick={onTerminar}>
            Entrar en mi cartografía <ArrowRight size={14} />
          </button>

          <p className={s.privacidadFinal}>{AVISO_PRIVACIDAD}</p>
        </section>
      )}

      {/* Se puede volver atrás en cualquier momento. Una explicación por la
          que solo se avanza obliga a entenderlo todo a la primera. */}
      <nav className={s.navPasos} aria-label="Navegación de la introducción">
        {paso > 1 ? (
          <button type="button" className={s.atras} onClick={() => setPaso((p) => p - 1)}>
            <ArrowLeft size={14} /> Atrás
          </button>
        ) : (
          <span />
        )}
        {paso < 6 && (
          <button type="button" className={s.saltar} onClick={onTerminar}>
            Saltar la explicación
          </button>
        )}
      </nav>

      {cajon === "aspecto" && <DrawerAspecto onCerrar={() => setCajon(null)} />}
      {cajon === "orbe" && <DrawerOrbe onCerrar={() => setCajon(null)} />}
      {cajon === "distancia" && <DrawerDistancia carto={carto} onCerrar={() => setCajon(null)} />}
    </div>
  )
}
