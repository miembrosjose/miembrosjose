"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  LA LECTURA · la rueda arriba, y debajo lo que elijas mirar
// ═══════════════════════════════════════════════════════════════════════════
//
// ── EL PROBLEMA QUE RESUELVE ──────────────────────────────────────────────
// La primera versión era un scroll larguísimo de párrafos: todo estaba, y por
// eso no se encontraba nada. Lo dijo José con una frase que vale más que
// cualquier métrica: «me has enviado un texto tan plano y tan grande que es
// difícil la navegación».
//
// Tres cambios, y ninguno quita contenido:
//
//   1. LA RUEDA SE QUEDA ARRIBA SIEMPRE. No se va al hacer scroll: es el
//      mapa, y un mapa que desaparece al moverte no sirve de mapa.
//   2. DEBAJO HAY PESTAÑAS, no un rollo. Cada una cabe en una pantalla o dos.
//   3. TOCAR LA RUEDA NAVEGA. Tocas Venus y te abre Venus, resaltado. Tocas
//      una casa y te abre esa casa.
//
// ── POR DÓNDE SE EMPIEZA ──────────────────────────────────────────────────
// La pestaña por defecto es «Empieza aquí», y existe porque la pregunta de
// alguien que abre esto por primera vez no es «¿qué dice mi Neptuno?» sino
// «¿qué estoy mirando?». Si lo primero que ve es una tabla de trece filas, se
// va.

import { useEffect, useRef, useState } from "react"
import { RotateCcw } from "lucide-react"

import type { Nacimiento } from "../../_lib/cartografia-estelar/domain/types"
import type { Carta, PuntoId } from "../../_lib/carta-astral/motor/carta"
import type { PesoDeSigno } from "../../_lib/carta-astral/motor/pesos"
import { type SignoId, SIGNOS } from "../../_lib/carta-astral/contenido/signos"
import { SISTEMAS } from "../../_lib/carta-astral/contenido/sistemas"
import { MAPA_POR_DEFECTO } from "../../_lib/carta-astral/contenido/mapa-sistemas"
import {
  CASAS, PLANETAS, AVISO_DOS_CAPAS, AVISO_GENERACIONALES, type PlanetaId,
} from "../../_lib/carta-astral/contenido/vocabulario"
import { textoEnCasa } from "../../_lib/carta-astral/contenido/planeta-en-casa"
import { textoEnSigno, GENERACIONALES } from "../../_lib/carta-astral/contenido/planeta-en-signo"
import { textoAngulo } from "../../_lib/carta-astral/contenido/angulos-en-signo"
import { COMO_ACTUA, textoPareja } from "../../_lib/carta-astral/contenido/aspectos-texto"
import { GUIA } from "../../_lib/carta-astral/contenido/guia"

import { RuedaCarta } from "./RuedaCarta"
import s from "./carta.module.css"
import r from "./rueda.module.css"

const PLANETAS_IDS: PlanetaId[] = [
  "sol", "luna", "mercurio", "venus", "marte",
  "jupiter", "saturno", "urano", "neptuno", "pluton",
]

type Pestana = "empezar" | "puntos" | "casas" | "aspectos" | "camino" | "guia"

const PESTANAS: Array<{ id: Pestana; rotulo: string }> = [
  { id: "empezar", rotulo: "Empieza aquí" },
  { id: "puntos", rotulo: "Planetas" },
  { id: "casas", rotulo: "Casas" },
  { id: "aspectos", rotulo: "Aspectos" },
  { id: "camino", rotulo: "Camino Solar" },
  { id: "guia", rotulo: "Guía" },
]

export function Lectura({ carta, pesos, nacimiento, desfase, onReiniciar }: {
  carta: Carta
  pesos: PesoDeSigno[]
  nacimiento: Nacimiento
  desfase: string
  onReiniciar: () => void
}) {
  const [pestana, setPestana] = useState<Pestana>("empezar")
  const [resaltado, setResaltado] = useState<PuntoId | null>(null)
  const [casaAbierta, setCasaAbierta] = useState<number | null>(null)
  const contenidoRef = useRef<HTMLDivElement | null>(null)
  const ruedaRef = useRef<HTMLDivElement | null>(null)

  const punto = (id: PuntoId) => carta.puntos.find((p) => p.id === id)!

  // Al navegar desde la rueda, el contenido cambia DEBAJO de la rueda. Sin
  // llevar la vista hasta ahí, parece que no ha pasado nada.
  const irA = (destino: Pestana) => {
    setPestana(destino)
    requestAnimationFrame(() => {
      contenidoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  const tocarPunto = (id: PuntoId) => {
    setResaltado(id)
    irA("puntos")
  }

  const tocarCasa = (numero: number) => {
    setCasaAbierta(numero)
    irA("casas")
  }

  const tocarSigno = (signo: SignoId) => {
    setResaltado(null)
    irA("camino")
    // La fila del signo se abre sola. Se busca por id en el DOM porque la
    // lista de signos vive dentro de otro componente y pasarle estado por
    // props para esto solo enredaría a los dos.
    requestAnimationFrame(() => {
      document.getElementById(`signo-${signo}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
    })
  }

  return (
    <div className={s.lectura}>
      {/* ── LA RUEDA, PEGADA ARRIBA ──────────────────────────────── */}
      <div className={s.zonaRueda} ref={ruedaRef}>
        <RuedaCarta
          carta={carta}
          onPunto={tocarPunto}
          onCasa={tocarCasa}
          onSigno={tocarSigno}
          resaltado={resaltado}
        />
        <p className={r.leyenda}>
          <span className={r.leyendaItem}>
            <span className={r.muestra} style={{ background: "#c3b2e0" }} /> juntos
          </span>
          <span className={r.leyendaItem}>
            <span className={r.muestra} style={{ background: "#e07a7a" }} /> tensión
          </span>
          <span className={r.leyendaItem}>
            <span className={r.muestra} style={{ background: "#6fb3d0" }} /> fluidez
          </span>
        </p>
      </div>

      {/* ── PESTAÑAS ─────────────────────────────────────────────── */}
      <div className={s.pestanas} role="tablist" aria-label="Partes de tu carta">
        {/* La rueda ya no se queda pegada arriba —se superponía al texto—,
            así que hace falta una forma de volver a ella sin desplazar a
            mano. Va la primera porque es el punto de partida. */}
        <button
          type="button"
          className={s.pestanaRueda}
          aria-label="Volver a la rueda"
          onClick={() => ruedaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          ◎ Rueda
        </button>
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={pestana === p.id}
            className={pestana === p.id ? s.pestanaActiva : s.pestana}
            onClick={() => setPestana(p.id)}
          >
            {p.rotulo}
          </button>
        ))}
      </div>

      <div className={s.contenido} ref={contenidoRef}>
        {pestana === "empezar" && (
          <Empezar carta={carta} nacimiento={nacimiento} desfase={desfase} onPunto={tocarPunto} />
        )}
        {pestana === "puntos" && (
          <Puntos carta={carta} resaltado={resaltado} onResaltar={setResaltado} />
        )}
        {pestana === "casas" && (
          <CasasVista carta={carta} abierta={casaAbierta} onAbrir={setCasaAbierta} />
        )}
        {pestana === "aspectos" && <Aspectos carta={carta} />}
        {pestana === "camino" && <CaminoSolar pesos={pesos} />}
        {pestana === "guia" && <GuiaVista />}
      </div>

      <p className={s.avisoCapas}>{AVISO_DOS_CAPAS}</p>

      <div className={s.pie}>
        <button type="button" className={s.secundario} onClick={onReiniciar}>
          <RotateCcw size={13} /> Cambiar mis datos
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  1 · EMPIEZA AQUÍ
// ═══════════════════════════════════════════════════════════════════════════

function Empezar({ carta, nacimiento, desfase, onPunto }: {
  carta: Carta
  nacimiento: Nacimiento
  desfase: string
  onPunto: (id: PuntoId) => void
}) {
  const punto = (id: PuntoId) => carta.puntos.find((p) => p.id === id)!

  const TRES = [
    { id: "sol" as const, rotulo: "Sol", pregunta: "Lo que vienes a ser" },
    { id: "luna" as const, rotulo: "Luna", pregunta: "Lo que necesitas para estar bien" },
    { id: "ascendente" as const, rotulo: "Ascendente", pregunta: "Cómo apareces ante los demás" },
  ]

  return (
    <div>
      <p className={s.entradilla}>
        Lo que tienes arriba es el cielo del minuto en que naciste, visto desde{" "}
        {nacimiento.lugar.nombre}. El anillo de fuera son los doce signos; el de dentro,
        las doce casas. Los símbolos del medio son los planetas, cada uno en su sitio,
        y las líneas del centro son las distancias entre ellos.
      </p>

      <p className={s.instruccion}>
        <strong>Toca cualquier símbolo de la rueda</strong> y te lleva a lo que significa.
        Si prefieres leerlo ordenado, usa las pestañas de arriba.
      </p>

      <h3 className={s.h3}>Si solo vas a mirar tres cosas, mira estas</h3>
      <div className={s.tresGrandes}>
        {TRES.map(({ id, rotulo, pregunta }) => {
          const p = punto(id)
          return (
            <button key={id} type="button" className={s.grande} onClick={() => onPunto(id)}>
              <span className={s.grandeRotulo}>{rotulo}</span>
              <strong className={s.grandeSigno}>{SIGNOS[p.signo].nombre}</strong>
              <span className={s.grandeGrado}>{Math.floor(p.grado)}° · casa {p.casa}</span>
              <span className={s.grandePie}>{pregunta}</span>
            </button>
          )
        })}
      </div>
      <p className={s.nota}>
        Casi todo el mundo conoce solo su Sol: es lo que sale en las revistas. La Luna y el
        Ascendente suelen explicar mejor lo que a uno le pasa, y casi nadie los sabe.
      </p>

      <h3 className={s.h3}>Tus datos</h3>
      <p className={s.datosNacimiento}>
        {String(nacimiento.dia).padStart(2, "0")}/{String(nacimiento.mes).padStart(2, "0")}/{nacimiento.anio}
        {" · "}{String(nacimiento.hora).padStart(2, "0")}:{String(nacimiento.minuto).padStart(2, "0")}
        {" · "}{nacimiento.lugar.nombre}{" · "}{desfase}
      </p>
      <p className={s.nota}>
        Casas por <strong>{carta.sistemaCasas === "placidus" ? "Placidus" : "signos enteros"}</strong>
        {carta.motivoCasas
          ? ` — ${carta.motivoCasas}`
          : ", el sistema que usan casi todas las webs de astrología, para que te cuadre si comparas."}
        {" "}El cálculo ocurre en este dispositivo y no se envía a ningún servidor.
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  2 · PLANETAS
// ═══════════════════════════════════════════════════════════════════════════

function Puntos({ carta, resaltado, onResaltar }: {
  carta: Carta
  resaltado: PuntoId | null
  onResaltar: (id: PuntoId | null) => void
}) {
  const refs = useRef<Record<string, HTMLElement | null>>({})

  // Al llegar desde la rueda, el bloque correspondiente se trae a la vista.
  useEffect(() => {
    if (!resaltado) return
    refs.current[resaltado]?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [resaltado])

  const orden: PuntoId[] = ["sol", "luna", "ascendente", "medio_cielo", ...PLANETAS_IDS.filter((x) => x !== "sol" && x !== "luna")]

  return (
    <div>
      <p className={s.entradilla}>
        Cada uno dice dos cosas. El <strong>signo</strong> dice cómo funciona esa parte de
        ti. La <strong>casa</strong> dice en qué terreno de tu vida se nota. Las dos hacen
        falta: Marte en Aries es actuar de frente, Marte en la casa 7 es gastar esa fuerza
        en los vínculos.
      </p>

      <div className={s.tiraPuntos}>
        {orden.map((id) => {
          const p = carta.puntos.find((x) => x.id === id)!
          return (
            <button key={id} type="button"
              className={resaltado === id ? s.chipActivo : s.chip}
              onClick={() => onResaltar(id)}
            >
              {p.nombre}
            </button>
          )
        })}
      </div>

      {orden.map((id) => {
        const p = carta.puntos.find((x) => x.id === id)!
        const esAngulo = id === "ascendente" || id === "medio_cielo"
        const textoSigno = esAngulo
          ? textoAngulo(id, p.signo)
          : textoEnSigno(id as PlanetaId, p.signo)
        const info = esAngulo ? null : PLANETAS[id as PlanetaId]
        const generacional = !esAngulo && GENERACIONALES.includes(id as PlanetaId)

        return (
          <article
            key={id}
            ref={(el) => { refs.current[id] = el }}
            className={`${s.bloquePlaneta} ${resaltado === id ? s.bloqueResaltado : ""}`}
          >
            <h4 className={s.bloqueTitulo}>
              {p.nombre} en {SIGNOS[p.signo].nombre}
              {p.retrogrado && <span className={s.retro} title="Retrógrado">R</span>}
              <span className={s.bloqueCasa}>casa {p.casa} · {CASAS[p.casa].nombre}</span>
            </h4>

            {info && <p className={s.bloqueBreve}>{info.largo}</p>}
            {id === "ascendente" && (
              <p className={s.bloqueBreve}>
                El signo que asomaba por el horizonte este cuando naciste. Cambia cada cuatro
                minutos: es lo más personal de la carta.
              </p>
            )}
            {id === "medio_cielo" && (
              <p className={s.bloqueBreve}>
                El punto más alto de la carta: tu lugar público y tu vocación.
              </p>
            )}

            <p className={s.etiquetaMini}>Cómo — el signo</p>
            <p className={s.parrafo}>{textoSigno}</p>
            {generacional && <p className={s.notaGeneracional}>{AVISO_GENERACIONALES}</p>}

            {!esAngulo && (
              <>
                <p className={s.etiquetaMini}>Dónde — la casa {p.casa}</p>
                <p className={s.parrafo}>{textoEnCasa(id as PlanetaId, p.casa)}</p>
              </>
            )}
          </article>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  3 · CASAS
// ═══════════════════════════════════════════════════════════════════════════

function CasasVista({ carta, abierta, onAbrir }: {
  carta: Carta
  abierta: number | null
  onAbrir: (n: number | null) => void
}) {
  const refs = useRef<Record<number, HTMLElement | null>>({})

  useEffect(() => {
    if (abierta == null) return
    refs.current[abierta]?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [abierta])

  return (
    <div>
      <p className={s.entradilla}>
        Doce terrenos de una vida. No dependen solo de tu fecha: dependen de la hora y del
        lugar. Por eso dos personas nacidas el mismo día pueden tener cartas muy distintas.
      </p>

      {carta.casas.map((casa) => {
        const dentro = carta.puntos.filter((p) => p.casa === casa.numero && p.id !== "ascendente" && p.id !== "medio_cielo")
        const info = CASAS[casa.numero]
        const esta = abierta === casa.numero
        return (
          <article
            key={casa.numero}
            ref={(el) => { refs.current[casa.numero] = el }}
            className={`${s.filaCasa} ${esta ? s.bloqueResaltado : ""}`}
          >
            <button type="button" className={s.filaCabecera} onClick={() => onAbrir(esta ? null : casa.numero)}>
              <span className={s.casaNumero}>{casa.numero}</span>
              <span className={s.filaNombre}>{info.nombre}</span>
              <span className={s.casaSigno}>
                {SIGNOS[casa.signo].nombre}
                {dentro.length > 0 && ` · ${dentro.length}`}
              </span>
            </button>
            {esta && (
              <div className={s.filaCuerpo}>
                <p className={s.parrafo}>{info.largo}</p>
                <p className={s.parrafoSecundario}>
                  Empieza en {Math.floor(casa.grado)}° de {SIGNOS[casa.signo].nombre}.
                </p>
                {dentro.length > 0 ? (
                  <p className={s.parrafoSecundario}>
                    Aquí tienes: <strong>{dentro.map((p) => p.nombre).join(", ")}</strong>.
                    Una casa con planetas dentro es un terreno donde pasan cosas.
                  </p>
                ) : (
                  <p className={s.parrafoSecundario}>
                    Sin planetas dentro. No significa que esté vacía tu vida ahí: significa
                    que no es un terreno de conflicto ni de foco especial.
                  </p>
                )}
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  4 · ASPECTOS
// ═══════════════════════════════════════════════════════════════════════════

function Aspectos({ carta }: { carta: Carta }) {
  return (
    <div>
      <p className={s.entradilla}>
        Las líneas del centro de la rueda. Son distancias concretas entre dos planetas, y
        dicen si esas dos partes de ti se llevan bien o se estorban. Están del más exacto
        al más flojo: cuanto menor es el orbe, más se nota.
      </p>
      {carta.aspectos.length === 0 && (
        <p className={s.nota}>Tu carta no tiene aspectos dentro de los orbes habituales. Es poco común y no es un fallo.</p>
      )}
      {carta.aspectos.map((a, i) => (
        <article key={i} className={s.aspecto}>
          <h4 className={s.aspectoTitulo}>
            <span className={`${s.punto} ${s[a.naturaleza]}`} aria-hidden />
            {a.nombreA} {a.nombre.toLowerCase()} {a.nombreB}
            <span className={s.orbe}>{a.desviacion.toFixed(1)}°</span>
          </h4>
          <p className={s.parrafo}>{textoPareja(a.a, a.b)}</p>
          <p className={s.parrafoSecundario}>
            <strong>{COMO_ACTUA[a.tipo].titulo}.</strong> {COMO_ACTUA[a.tipo].texto}
          </p>
        </article>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  5 · CAMINO SOLAR
// ═══════════════════════════════════════════════════════════════════════════

function CaminoSolar({ pesos }: { pesos: PesoDeSigno[] }) {
  return (
    <div>
      <p className={s.entradilla}>
        La lectura propia de Los 144.000. Cada signo pesa según lo que haya caído en él: el
        Sol, la Luna y el Ascendente valen 3; los planetas personales, 2; los lentos, 1,
        porque esos los comparte una generación entera.
      </p>
      <p className={s.instruccion}>
        Lo <strong>ausente</strong> es tan parte de la lectura como lo que predomina. Ahí es
        donde el Camino Solar señala el sistema orgánico que pide atención.
      </p>
      {pesos.map((w) => <FilaSigno key={w.signo} w={w} />)}
    </div>
  )
}

function FilaSigno({ w }: { w: PesoDeSigno }) {
  const [abierto, setAbierto] = useState(w.estado !== "presente")
  const signo = SIGNOS[w.signo]
  const mapa = MAPA_POR_DEFECTO[w.signo]
  const sistema = SISTEMAS[mapa.sistema]
  const ausente = w.estado === "ausente"

  return (
    <article id={`signo-${w.signo}`} className={`${s.filaSigno} ${s[w.estado]}`}>
      <button type="button" className={s.filaCabecera} onClick={() => setAbierto((v) => !v)}>
        <span className={s.filaNombre}>{signo.nombre}</span>
        <span className={s.filaEstado}>
          {w.estado === "predominante" ? "Predominante"
            : w.estado === "presente" ? "Presente" : "Ausente o débil"}
        </span>
        <span className={s.filaPuntos}>{w.puntos}</span>
      </button>

      {abierto && (
        <div className={s.filaCuerpo}>
          {w.habitantes.length > 0 && (
            <p className={s.filaHabitantes}>Ahí tienes: {w.habitantes.map((h) => h.nombre).join(", ")}</p>
          )}

          <p className={s.etiquetaMini}>{ausente ? "Conflicto" : "Atributos"}</p>
          <p className={s.parrafo}>{ausente ? signo.conflictos : signo.atributos}</p>

          {w.estado === "predominante" && (
            <>
              <p className={s.etiquetaMini}>Y su sombra, cuando se pasa</p>
              <p className={s.parrafoSecundario}>{signo.conflictos}</p>
            </>
          )}

          <div className={s.sistema}>
            <p className={s.etiquetaMini}>Sistema orgánico · {sistema.nombre}</p>
            <p className={s.parrafo}>{ausente ? sistema.desequilibrio : sistema.equilibrio}</p>
            {mapa.zona && (
              <p className={s.parrafoSecundario}>
                <strong>Zona:</strong> {mapa.zona}
                {mapa.somatizaciones && <> · <strong>Se expresa como:</strong> {mapa.somatizaciones}</>}
                {mapa.borrador && <span className={s.borrador}>borrador</span>}
              </p>
            )}
            {mapa.emocion && (
              <p className={s.parrafoSecundario}><strong>Emoción:</strong> {mapa.emocion}</p>
            )}
          </div>
        </div>
      )}
    </article>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  6 · GUÍA
// ═══════════════════════════════════════════════════════════════════════════

function GuiaVista() {
  const [abierta, setAbierta] = useState<string | null>(GUIA[0]?.id ?? null)
  return (
    <div>
      <p className={s.entradilla}>
        Si nunca has leído una carta, empieza por aquí. Son cuatro ideas y ninguna es difícil.
      </p>
      {GUIA.map((g) => (
        <article key={g.id} className={s.filaGuia}>
          <button type="button" className={s.filaCabecera}
            onClick={() => setAbierta(abierta === g.id ? null : g.id)}
          >
            <span className={s.filaNombre}>{g.pregunta}</span>
          </button>
          {abierta === g.id && (
            <div className={s.filaCuerpo}>
              <p className={s.parrafo}>{g.respuesta}</p>
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
