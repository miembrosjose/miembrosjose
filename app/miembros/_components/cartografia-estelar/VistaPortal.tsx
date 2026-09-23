"use client"

// CARTOGRAFÍA ESTELAR 144 — dentro de un portal.
//
// ── CATORCE SECCIONES, NO UN MURO ──────────────────────────────────────────
// La lectura es larga a propósito, pero nunca se muestra entera de golpe.
// Cada bloque se abre cuando se pide. El orden va de lo observable a lo
// interpretado, nunca al revés:
//
//   qué es en el cielo → por qué está en tu mapa → cómo leer esos contactos
//   → qué parte de ti tocan → qué los une → el mensaje → potencial → tensión
//   → cómo reconocerlo → lo que no habías visto → pregunta → preguntas
//   → práctica → ¿lo reconoces?
//
// ── LAS DOS CAPAS, SEPARADAS EN PANTALLA ───────────────────────────────────
// La primera sección es astronomía factual y lleva su propia marca. Todo lo
// que viene después es lectura 144 y lo dice. Nunca se presentan como lo
// mismo.

import { useEffect, useState, type ReactNode } from "react"
import {
  ArrowLeft, ArrowRight, ChevronDown, Telescope, Sparkles, HelpCircle,
} from "lucide-react"
import { aGradosMinutos } from "../../_lib/cartografia-estelar/astronomy/angulos"
import { portalPorId } from "../../_lib/cartografia-estelar/catalog/portales"
import { leerPortal } from "../../_lib/cartografia-estelar/domain/editorial/lectura-portal"
import { UNIVERSOS, CUERPOS, ORDEN_CUERPOS, AVISO_CUERPOS, AVISO_UNIVERSOS }
  from "../../_lib/cartografia-estelar/content/framework144.content"
import { AVISO_DOS_CAPAS, RESPUESTAS_RECONOCIMIENTO } from "../../_lib/cartografia-estelar/content/avisos"
import { AVISO_HERMANDAD } from "../../_lib/cartografia-estelar/content/hermandad.content"
import { ExplicacionScore } from "./ExplicacionScore"
import { DrawerAspecto, DrawerOrbe } from "./Drawers"
import type { Cartografia } from "../../_lib/cartografia-estelar/domain/types"
import type { CuerpoId } from "../../_lib/cartografia-estelar/content/tipos"
import s from "./cartografia.module.css"

/** Un bloque que se abre al pedirlo. Cerrado por defecto salvo los primeros. */
function Capa({
  titulo, children, abiertoPorDefecto = false, invitacion,
}: {
  titulo: string
  children: ReactNode
  abiertoPorDefecto?: boolean
  invitacion?: string
}) {
  const [abierto, setAbierto] = useState(abiertoPorDefecto)
  return (
    <section className={s.capa}>
      <button
        type="button"
        className={s.capaCabecera}
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
      >
        <span className={s.capaTitulo}>{titulo}</span>
        <ChevronDown size={16} className={abierto ? s.chevronAbierto : s.chevron} aria-hidden />
      </button>
      {abierto ? (
        <div className={s.capaCuerpo}>{children}</div>
      ) : (
        invitacion && <p className={s.capaInvitacion}>{invitacion}</p>
      )}
    </section>
  )
}

export function VistaPortal({
  carto, portalId, onVolver, onIrAPortal, onCambioDePortal,
}: {
  carto: Cartografia
  portalId: string
  onVolver: () => void
  onIrAPortal: (id: string) => void
  /** Al saltar a un portal vecino, se empieza por su cabecera. */
  onCambioDePortal?: () => void
}) {
  useEffect(() => { onCambioDePortal?.() }, [portalId, onCambioDePortal])
  const L = leerPortal(carto, portalId)
  const [verPorQue, setVerPorQue] = useState(false)
  const [drawer, setDrawer] = useState<null | "aspecto" | "orbe">(null)
  const [universo, setUniverso] = useState<keyof typeof UNIVERSOS | null>(null)
  const [cuerpo, setCuerpo] = useState<CuerpoId | null>(null)
  const [reconoce, setReconoce] = useState<null | "si" | "aveces" | "no">(null)

  if (!L) return null

  return (
    <div className={s.portalVista}>
      <button type="button" onClick={onVolver} className={s.volver}>
        <ArrowLeft size={14} /> Volver al mapa
      </button>

      <header className={s.portalCabecera}>
        <p className={s.kicker}>{L.tipoEtiqueta}</p>
        <h2 className={s.portalTitulo}>{L.nombre}</h2>
        <button type="button" className={s.portalScoreBoton} onClick={() => setVerPorQue(true)}>
          Resonancia {L.resonancia} <HelpCircle size={13} />
        </button>
        <p className={s.portalEsencia}>{L.contenido.esencia}</p>
        <p className={s.fraseUmbral}>{L.contenido.fraseUmbral}</p>
      </header>

      {verPorQue && (
        <ExplicacionScore lectura={L} onCerrar={() => setVerPorQue(false)} />
      )}

      {/* Lo primero que se pregunta al abrir un portal es qué representa.
          Antes había que bajar mucho para averiguarlo. */}
      <section className={s.queRepresenta}>
        <p className={s.queRepresentaTitulo}>Qué representa</p>
        <p className={s.queRepresentaTexto}>{L.contenido.nucleo}</p>
      </section>

      {/* ── 1 · CAPA A ─────────────────────────────────────────────────── */}
      <section className={s.bloqueAstronomia}>
        <p className={s.marcaCapa}><Telescope size={12} /> Astronomía</p>
        <h3 className={s.seccionTitulo}>Qué es esto realmente</h3>
        <p className={s.parrafo}>{L.astronomia}</p>
        <ul className={s.anclas}>
          {L.anclas.map((a) => (
            <li key={a.designacion}>
              <strong>{a.nombre}</strong>
              <span>{a.designacion}</span>
              {a.magnitud !== undefined && <em>magnitud {a.magnitud}</em>}
            </li>
          ))}
        </ul>
      </section>

      {/* ── 2 y 3 · CAPA A ─────────────────────────────────────────────── */}
      <section className={s.bloqueAstronomia}>
        <p className={s.marcaCapa}><Telescope size={12} /> Astronomía</p>
        <h3 className={s.seccionTitulo}>Por qué está en tu mapa</h3>
        <p className={s.densidad}>
          <strong>{L.densidadEtiqueta}.</strong> {L.densidadTexto}
        </p>

        {L.contactos.map((c, i) => (
          <article key={i} className={s.contactoFicha}>
            <div className={s.contactoLinea}>
              <span className={s.contactoPunto}>{c.puntoNombre}</span>
              <ArrowRight size={12} aria-hidden />
              <span className={s.contactoAncla}>{c.contacto.ancla.nombre}</span>
            </div>
            <dl className={s.contactoDatos}>
              <div>
                <dt>Qué separación hay</dt>
                <dd>
                  {c.aspectoNombre} — sus sombras quedaron a {c.aspectoAngulo} sobre el aro
                  <button type="button" className={s.enlaceAyuda} onClick={() => setDrawer("aspecto")}>
                    ¿qué significa?
                  </button>
                </dd>
              </div>
              <div>
                <dt>Cuánto se acercó</dt>
                <dd>
                  Se quedó a {aGradosMinutos(c.contacto.orbe)} de ser exacta.{" "}
                  <span className={s.datoSecundario}>
                    Aceptamos hasta {aGradosMinutos(c.orbePermitido)}.
                  </span>
                  <button type="button" className={s.enlaceAyuda} onClick={() => setDrawer("orbe")}>
                    ¿qué significa?
                  </button>
                </dd>
              </div>
              <div>
                <dt>Lo llamamos</dt>
                <dd>{c.exactitudEtiqueta} — {c.exactitudTexto}</dd>
              </div>
              {/* Las dos distancias, separadas a propósito: confundirlas es el
                  error más común de este tipo de herramientas. */}
              <div className={s.separacionRealFila}>
                <dt>Separación real en el cielo</dt>
                <dd>
                  {c.contacto.separacionReal.toFixed(1)}°
                  <em>
                    El ángulo verdadero entre las dos direcciones, sin proyectar sobre el
                    aro. Puede ser muy distinto del anterior, y no es un error.
                  </em>
                </dd>
              </div>
            </dl>
            <p className={s.contactoFuncion}>
              <strong>{c.puntoNombre}</strong> — {c.puntoFuncion}
            </p>
          </article>
        ))}
      </section>

      {/* ── Frontera explícita ─────────────────────────────────────────── */}
      <div className={s.frontera}>
        <span className={s.fronteraLinea} aria-hidden />
        <p className={s.fronteraTexto}>
          <Sparkles size={13} /> Hasta aquí, hechos. A partir de aquí, nuestra lectura
        </p>
        <span className={s.fronteraLinea} aria-hidden />
      </div>

      {/* ── 5 ──────────────────────────────────────────────────────────── */}
      {L.sintesis && (
        <Capa titulo="Lo que une todos tus contactos aquí" abiertoPorDefecto>
          <p className={s.parrafoGrande}>{L.sintesis}</p>
        </Capa>
      )}

      {/* ── 6 ──────────────────────────────────────────────────────────── */}
      <Capa titulo="El mensaje de tu configuración" abiertoPorDefecto>
        <p className={s.parrafoGrande}>{L.mensajePrincipal}</p>
        {L.contactos.length > 1 && (
          <details className={s.masContactos}>
            <summary>Ver la lectura de los otros contactos</summary>
            {L.contactos.slice(1).map((c, i) => (
              <div key={i} className={s.otroContacto}>
                <p className={s.otroContactoTitulo}>
                  {c.puntoNombre} · {c.aspectoNombre.toLowerCase()}
                </p>
                <p className={s.parrafo}>{c.mensaje}</p>
              </div>
            ))}
          </details>
        )}
      </Capa>

      {/* ── Hermandad cósmica ──────────────────────────────────────────── */}
      {L.hermandad && (
        <Capa
          titulo="Hermandad cósmica"
          invitacion="La afinidad con este portal, leída como vínculo."
        >
          <p className={s.familiaNombre}>{L.hermandad.familia}</p>
          <p className={s.parrafoGrande}>{L.hermandad.vinculo}</p>
          <div className={s.disposicion}>
            <p className={s.disposicionTitulo}>Cómo podrías reconocerlo</p>
            <p className={s.parrafo}>{L.hermandad.disposicion}</p>
          </div>
          <p className={s.avisoLente}>{AVISO_HERMANDAD}</p>
        </Capa>
      )}

      {/* ── 7 y 8 ──────────────────────────────────────────────────────── */}
      <Capa titulo="Potencial" invitacion="Lo que esta configuración hace posible.">
        <ul className={s.listaPuntos}>
          {L.potenciales.map((x, i) => <li key={i}>{x}</li>)}
        </ul>
        <h4 className={s.subtitulo}>Cuando está integrado</h4>
        <ul className={s.listaPuntos}>
          {L.cuandoIntegrado.map((x, i) => <li key={i}>{x}</li>)}
        </ul>
      </Capa>

      <Capa titulo="Tensión" invitacion="No es un defecto: es la misma capacidad sin contrapeso.">
        <ul className={s.listaPuntos}>
          {L.tensiones.map((x, i) => <li key={i}>{x}</li>)}
        </ul>
        <h4 className={s.subtitulo}>Cuando va sobrecargado</h4>
        <ul className={s.listaPuntos}>
          {L.cuandoSobrecargado.map((x, i) => <li key={i}>{x}</li>)}
        </ul>
      </Capa>

      {/* ── 9 ──────────────────────────────────────────────────────────── */}
      <Capa titulo="Cómo podrías reconocerlo" invitacion="Escenas concretas, no ideas.">
        <ul className={s.listaPuntos}>
          {L.patronesCotidianos.map((x, i) => <li key={i}>{x}</li>)}
        </ul>
        <h4 className={s.subtitulo}>En tus relaciones</h4>
        <dl className={s.relaciones}>
          <div><dt>Contigo</dt><dd>{L.relaciones.consigo}</dd></div>
          <div><dt>En los vínculos</dt><dd>{L.relaciones.vinculos}</dd></div>
          <div><dt>En grupo</dt><dd>{L.relaciones.grupo}</dd></div>
          <div><dt>En el servicio</dt><dd>{L.relaciones.servicio}</dd></div>
        </dl>
      </Capa>

      {/* ── 10 ─────────────────────────────────────────────────────────── */}
      <Capa
        titulo="Lo que tal vez no habías visto"
        invitacion="Lo menos evidente de esta configuración."
      >
        <p className={s.parrafoGrande}>{L.loQueNoHabiasVisto}</p>
        <p className={s.parrafoSecundario}>
          <strong>Aprendizaje central.</strong> {L.aprendizajeCentral}
        </p>
        <p className={s.parrafoSecundario}>
          <strong>La paradoja.</strong> {L.paradoja}
        </p>
      </Capa>

      {/* ── 11 y 12 ────────────────────────────────────────────────────── */}
      <section className={s.preguntaCentral}>
        <p className={s.kickerPeq}>Pregunta central de este portal</p>
        <p className={s.preguntaGrande}>{L.preguntaCentral}</p>
      </section>

      <Capa titulo="Preguntas para explorar">
        <ol className={s.preguntas}>
          {L.preguntas.map((q, i) => <li key={i}>{q}</li>)}
        </ol>
        <h4 className={s.subtitulo}>Para escribir</h4>
        <ol className={s.preguntas}>
          {L.journalPrompts.map((q, i) => <li key={i}>{q}</li>)}
        </ol>
      </Capa>

      {/* ── 13 ─────────────────────────────────────────────────────────── */}
      <Capa titulo="Práctica de 7 días" invitacion="Observable. No pide creer nada.">
        <p className={s.practicaTitulo}>{L.practica.titulo}</p>
        <ol className={s.pasos}>
          {L.practica.pasos.map((p, i) => <li key={i}>{p}</li>)}
        </ol>
        <p className={s.practicaCierre}>{L.practica.cierre}</p>
      </Capa>

      {/* ── Lentes voluntarias ─────────────────────────────────────────── */}
      <Capa
        titulo="Observar desde los 3 universos"
        invitacion="Una lente opcional. No cambia el cálculo."
      >
        <p className={s.avisoLente}>{AVISO_UNIVERSOS}</p>
        <div className={s.chips}>
          {(Object.keys(UNIVERSOS) as Array<keyof typeof UNIVERSOS>).map((u) => (
            <button
              key={u}
              type="button"
              className={universo === u ? s.chipActivo : s.chip}
              onClick={() => setUniverso(universo === u ? null : u)}
            >
              {UNIVERSOS[u].nombre}
            </button>
          ))}
        </div>
        {universo && (
          <div className={s.lenteResultado}>
            <p className={s.lentePregunta}>{UNIVERSOS[universo].pregunta}</p>
            <p className={s.parrafo}>{L.framework144[universo]}</p>
          </div>
        )}
      </Capa>

      <Capa
        titulo="¿Dónde reconoces más este patrón?"
        invitacion="Eliges tú. La herramienta no lo asigna."
      >
        <p className={s.avisoLente}>{AVISO_CUERPOS}</p>
        <div className={s.chips}>
          {ORDEN_CUERPOS.map((c) => (
            <button
              key={c}
              type="button"
              className={cuerpo === c ? s.chipActivo : s.chip}
              onClick={() => setCuerpo(cuerpo === c ? null : c)}
            >
              {CUERPOS[c].nombre}
            </button>
          ))}
        </div>
        {cuerpo && (
          <div className={s.lenteResultado}>
            <p className={s.parrafo}>{CUERPOS[cuerpo].descripcion}</p>
            <ol className={s.preguntas}>
              {CUERPOS[cuerpo].preguntas.map((q, i) => <li key={i}>{q}</li>)}
            </ol>
          </div>
        )}
      </Capa>

      {/* ── 14 ─────────────────────────────────────────────────────────── */}
      <section className={s.reconoces}>
        <p className={s.kickerPeq}>¿Lo reconoces en tu vida?</p>
        <div className={s.reconocesBotones}>
          <button type="button" className={reconoce === "si" ? s.chipActivo : s.chip} onClick={() => setReconoce("si")}>
            Sí, claramente
          </button>
          <button type="button" className={reconoce === "aveces" ? s.chipActivo : s.chip} onClick={() => setReconoce("aveces")}>
            A veces
          </button>
          <button type="button" className={reconoce === "no" ? s.chipActivo : s.chip} onClick={() => setReconoce("no")}>
            No lo reconozco
          </button>
        </div>
        {reconoce && <p className={s.reconocesRespuesta}>{RESPUESTAS_RECONOCIMIENTO[reconoce]}</p>}
      </section>

      {/* Portales vecinos, para seguir explorando sin volver atrás. */}
      <nav className={s.vecinos} aria-label="Otros portales de tu cartografía">
        {carto.resonancias
          .filter((r) => r.portalId !== portalId)
          .slice(0, 3)
          .map((r) => (
            <button key={r.portalId} type="button" className={s.vecino} onClick={() => onIrAPortal(r.portalId)}>
              <span>{portalPorId(r.portalId)?.nombre ?? r.portalId}</span>
              <em>{r.resonancia}</em>
            </button>
          ))}
      </nav>

      <p className={s.avisoCapas}>{AVISO_DOS_CAPAS}</p>

      {drawer === "aspecto" && <DrawerAspecto onCerrar={() => setDrawer(null)} />}
      {drawer === "orbe" && <DrawerOrbe onCerrar={() => setDrawer(null)} />}
    </div>
  )
}
