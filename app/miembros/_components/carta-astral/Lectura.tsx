"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  LA LECTURA · la rueda arriba, y debajo lo que elijas abrir
// ═══════════════════════════════════════════════════════════════════════════
//
// ── DOS REGLAS, Y LAS DOS VIENEN DE PROBARLO ──────────────────────────────
//
//   1. NADA VIENE ABIERTO. Ni los planetas, ni los aspectos, ni los signos.
//      La versión anterior lo desplegaba todo y José lo dijo claro: «todo
//      está abierto, se ve muy feo, es difícil a la vista y no se entiende
//      nada». Trece planetas con dos párrafos cada uno no es información: es
//      un muro.
//
//   2. NO SE SALTA DE PESTAÑA. «Si yo estoy en el botón empieza aquí, debe
//      permanecer en ese empieza aquí siempre.» Tocar tu Sol en la portada
//      abre algo breve AHÍ MISMO. Lo completo está en Planetas, cuando se
//      vaya a Planetas, y no antes.
//
//      La única excepción es la rueda, porque ese es su trabajo: es el mapa,
//      y un mapa existe para llevarte a un sitio.
//
// ── LO QUE SE QUITÓ ───────────────────────────────────────────────────────
// El cruce signo × punto —«Sagitario en Venus: discusiones que no se
// concretan»—. Se escribió a petición suya y se quita a petición suya:
// «quita eso que te pedí del cruce porque se confunde más». Dentro de una
// fila que ya trae el arquetipo, su sombra y el sistema orgánico con sus dos
// estados, una cuarta capa deja de aclarar y empieza a estorbar.

import { useEffect, useRef, useState } from "react"
import { ChevronDown, RotateCcw } from "lucide-react"

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

type Pestana = "empezar" | "puntos" | "casas" | "aspectos" | "camino" | "guia"

const PESTANAS: Array<{ id: Pestana; rotulo: string }> = [
  { id: "empezar", rotulo: "Empieza aquí" },
  { id: "puntos", rotulo: "Planetas" },
  { id: "casas", rotulo: "Casas" },
  { id: "aspectos", rotulo: "Aspectos" },
  { id: "camino", rotulo: "Camino Solar" },
  { id: "guia", rotulo: "Guía" },
]

/** El orden en que se leen los puntos: primero los tres que más dicen. */
const ORDEN_PUNTOS: PuntoId[] = [
  "sol", "luna", "ascendente", "medio_cielo",
  "mercurio", "venus", "marte",
  "jupiter", "saturno", "urano", "neptuno", "pluton",
]

const esAngulo = (id: PuntoId) => id === "ascendente" || id === "medio_cielo"

// ═══════════════════════════════════════════════════════════════════════════
//  UNA FILA QUE SE ABRE · el mismo gesto en las cinco pestañas
// ═══════════════════════════════════════════════════════════════════════════
//
// Existe para que abrir un planeta, una casa, un aspecto y un signo se sientan
// lo mismo. Cuando cada lista inventa su forma de desplegarse, hay que
// aprender la pantalla en vez de usarla.
function Fila({ titulo, apunte, extra, abierta, onAlternar, resaltada, children }: {
  titulo: React.ReactNode
  /** La línea pequeña de debajo del título. */
  apunte?: React.ReactNode
  /** Lo que va a la derecha: grados, orbe, puntos. */
  extra?: React.ReactNode
  abierta: boolean
  onAlternar: () => void
  resaltada?: boolean
  children: React.ReactNode
}) {
  return (
    <article className={`${s.fila} ${resaltada ? s.filaResaltada : ""}`}>
      <button
        type="button"
        className={s.filaBoton}
        onClick={onAlternar}
        aria-expanded={abierta}
      >
        <span className={s.filaTextos}>
          <span className={s.filaTitulo}>{titulo}</span>
          {apunte && <span className={s.filaApunte}>{apunte}</span>}
        </span>
        {extra && <span className={s.filaExtra}>{extra}</span>}
        <ChevronDown size={15} className={abierta ? s.giro : ""} aria-hidden />
      </button>
      {abierta && <div className={s.filaCuerpo}>{children}</div>}
    </article>
  )
}

/** Abrir una a la vez, o ninguna. Vuelve a tocar y se cierra. */
function useUnaAbierta<T>(inicial: T | null = null) {
  const [abierta, setAbierta] = useState<T | null>(inicial)
  const alternar = (id: T) => setAbierta((x) => (x === id ? null : id))
  return { abierta, setAbierta, alternar }
}

// ═══════════════════════════════════════════════════════════════════════════

export function Lectura({ carta, pesos, nacimiento, desfase, onReiniciar }: {
  carta: Carta
  pesos: PesoDeSigno[]
  nacimiento: Nacimiento
  desfase: string
  onReiniciar: () => void
}) {
  const [pestana, setPestana] = useState<Pestana>("empezar")
  const [puntoAbierto, setPuntoAbierto] = useState<PuntoId | null>(null)
  const [casaAbierta, setCasaAbierta] = useState<number | null>(null)
  const [signoAbierto, setSignoAbierto] = useState<SignoId | null>(null)
  const ruedaRef = useRef<HTMLDivElement | null>(null)
  const contenidoRef = useRef<HTMLDivElement | null>(null)

  const irA = (destino: Pestana) => {
    setPestana(destino)
    requestAnimationFrame(() => {
      contenidoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  // La rueda SÍ navega: es su oficio. Las pestañas no se saltan solas.
  const tocarPunto = (id: PuntoId) => { setPuntoAbierto(id); irA("puntos") }
  const tocarCasa = (n: number) => { setCasaAbierta(n); irA("casas") }
  const tocarSigno = (sig: SignoId) => { setSignoAbierto(sig); irA("camino") }

  return (
    <div className={s.lectura}>
      <div className={s.zonaRueda} ref={ruedaRef}>
        <RuedaCarta
          carta={carta}
          onPunto={tocarPunto}
          onCasa={tocarCasa}
          onSigno={tocarSigno}
          resaltado={puntoAbierto}
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

      <div className={s.pestanas} role="tablist" aria-label="Partes de tu carta">
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
          <Empezar carta={carta} nacimiento={nacimiento} desfase={desfase} />
        )}
        {pestana === "puntos" && (
          <Puntos carta={carta} abierto={puntoAbierto} onAbrir={setPuntoAbierto} />
        )}
        {pestana === "casas" && (
          <CasasVista carta={carta} abierta={casaAbierta} onAbrir={setCasaAbierta} />
        )}
        {pestana === "aspectos" && <Aspectos carta={carta} />}
        {pestana === "camino" && (
          <CaminoSolar pesos={pesos} abierto={signoAbierto} onAbrir={setSignoAbierto} />
        )}
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
//
// Tocar el Sol abre el Sol AQUÍ. No manda a Planetas.
//
// Lo que se abre es corto a propósito: una frase de qué es ese punto y el
// texto de su signo. Lo de la casa, los aspectos y el resto está en Planetas,
// para quien quiera seguir. Esta pestaña contesta «¿qué estoy mirando?», no
// «cuéntamelo todo».

function Empezar({ carta, nacimiento, desfase }: {
  carta: Carta
  nacimiento: Nacimiento
  desfase: string
}) {
  const { abierta, alternar } = useUnaAbierta<PuntoId>()
  const punto = (id: PuntoId) => carta.puntos.find((p) => p.id === id)!

  const TRES: Array<{ id: PuntoId; rotulo: string; pregunta: string; que: string }> = [
    {
      id: "sol", rotulo: "Sol", pregunta: "Lo que vienes a ser",
      que: "El Sol es el centro: la dirección hacia la que tiende una vida cuando nadie la empuja. Es lo que casi todo el mundo llama «su signo».",
    },
    {
      id: "luna", rotulo: "Luna", pregunta: "Lo que necesitas para estar bien",
      que: "La Luna es la necesidad básica: lo que te calma, lo que te altera, aquello a lo que vuelves sin pensarlo. Reaccionas desde aquí antes de decidir.",
    },
    {
      id: "ascendente", rotulo: "Ascendente", pregunta: "Cómo apareces ante los demás",
      que: "El signo que asomaba por el horizonte este en el minuto en que naciste. Cambia cada cuatro minutos: es lo más personal de la carta.",
    },
  ]

  return (
    <div>
      <p className={s.entradilla}>
        Lo de arriba es el cielo del minuto en que naciste, visto desde{" "}
        {nacimiento.lugar.nombre}. El anillo de fuera son los doce signos; el de dentro,
        las doce casas. Los símbolos del medio son los planetas, y las líneas del centro
        son las distancias entre ellos.
      </p>

      <p className={s.instruccion}>
        <strong>Toca cualquier símbolo de la rueda</strong> y te lleva a lo que significa.
        Las pestañas de arriba son lo mismo, ordenado.
      </p>

      <h3 className={s.h3}>Si solo vas a mirar tres cosas, mira estas</h3>
      <p className={s.nota}>
        Casi todo el mundo conoce solo su Sol: es lo que sale en las revistas. La Luna y
        el Ascendente suelen explicar mejor lo que a uno le pasa, y casi nadie los sabe.
        Tócalos para ver qué dicen.
      </p>

      {TRES.map(({ id, rotulo, pregunta, que }) => {
        const p = punto(id)
        const texto = esAngulo(id)
          ? textoAngulo(id, p.signo)
          : textoEnSigno(id as PlanetaId, p.signo)
        return (
          <Fila
            key={id}
            titulo={<><strong>{rotulo}</strong> en {SIGNOS[p.signo].nombre}</>}
            apunte={pregunta}
            extra={`${Math.floor(p.grado)}° · casa ${p.casa}`}
            abierta={abierta === id}
            onAlternar={() => alternar(id)}
          >
            <p className={s.parrafoSecundario}>{que}</p>
            <p className={s.parrafo}>{texto}</p>
            <p className={s.pieDeFila}>
              Lo que significa estar en la <strong>casa {p.casa}</strong>, y el resto de tu
              carta, está en la pestaña <strong>Planetas</strong>.
            </p>
          </Fila>
        )
      })}

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

function Puntos({ carta, abierto, onAbrir }: {
  carta: Carta
  abierto: PuntoId | null
  onAbrir: (id: PuntoId | null) => void
}) {
  const refs = useRef<Record<string, HTMLElement | null>>({})

  // Al llegar desde la rueda, se trae a la vista el que se tocó.
  useEffect(() => {
    if (!abierto) return
    refs.current[abierto]?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [abierto])

  return (
    <div>
      <p className={s.entradilla}>
        Cada uno dice dos cosas. El <strong>signo</strong> dice cómo funciona esa parte de
        ti; la <strong>casa</strong>, en qué terreno de tu vida se nota. Marte en Aries es
        actuar de frente; Marte en la casa 7 es gastar esa fuerza en los vínculos.
      </p>
      <p className={s.nota}>Toca cualquiera para abrirlo.</p>

      {ORDEN_PUNTOS.map((id) => {
        const p = carta.puntos.find((x) => x.id === id)!
        const angulo = esAngulo(id)
        const textoSigno = angulo
          ? textoAngulo(id, p.signo)
          : textoEnSigno(id as PlanetaId, p.signo)
        const info = angulo ? null : PLANETAS[id as PlanetaId]
        const generacional = !angulo && GENERACIONALES.includes(id as PlanetaId)

        return (
          <div key={id} ref={(el) => { refs.current[id] = el }}>
            <Fila
              titulo={<><strong>{p.nombre}</strong> en {SIGNOS[p.signo].nombre}</>}
              apunte={`Casa ${p.casa} — ${CASAS[p.casa].nombre}`}
              extra={
                <>
                  {Math.floor(p.grado)}°
                  {p.retrogrado && <span className={s.retro} title="Retrógrado">R</span>}
                </>
              }
              abierta={abierto === id}
              onAlternar={() => onAbrir(abierto === id ? null : id)}
              resaltada={abierto === id}
            >
              {info && <p className={s.parrafoSecundario}>{info.largo}</p>}
              {id === "ascendente" && (
                <p className={s.parrafoSecundario}>
                  El signo que asomaba por el horizonte este cuando naciste. Cambia cada
                  cuatro minutos: es lo más personal de la carta.
                </p>
              )}
              {id === "medio_cielo" && (
                <p className={s.parrafoSecundario}>
                  El punto más alto de la carta: tu lugar público y tu vocación.
                </p>
              )}

              <p className={s.etiquetaMini}>Cómo — el signo</p>
              <p className={s.parrafo}>{textoSigno}</p>
              {generacional && <p className={s.notaGeneracional}>{AVISO_GENERACIONALES}</p>}

              {!angulo && (
                <>
                  <p className={s.etiquetaMini}>Dónde — la casa {p.casa}</p>
                  <p className={s.parrafo}>{textoEnCasa(id as PlanetaId, p.casa)}</p>
                </>
              )}
            </Fila>
          </div>
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
      {/* La entradilla anterior decía «doce terrenos de una vida» y se quedaba
          ahí. José: «lo de las casas no se entiende». Faltaba lo básico: qué
          es una casa, de dónde sale y para qué sirve saberlo. */}
      <p className={s.entradilla}>
        Si los planetas dicen <strong>qué</strong> y los signos <strong>cómo</strong>, las
        casas dicen <strong>dónde</strong>: en qué parte de tu vida se nota cada cosa. Son
        doce terrenos —el cuerpo, el dinero, la familia, la pareja, el trabajo, lo que no
        se ve— y la rueda los reparte alrededor de ti.
      </p>
      <p className={s.entradilla}>
        Salen de tu <strong>hora y tu lugar</strong> de nacimiento, no de la fecha. Por eso
        dos personas del mismo día pueden tener cartas muy distintas, y por eso la hora
        importa tanto.
      </p>
      <p className={s.nota}>
        Una casa con planetas dentro es un terreno donde pasan cosas. Una vacía no es una
        parte vacía de tu vida: es una que no pide tanto de ti.
      </p>

      {carta.casas.map((casa) => {
        const dentro = carta.puntos.filter(
          (p) => p.casa === casa.numero && !esAngulo(p.id),
        )
        const info = CASAS[casa.numero]
        return (
          <div key={casa.numero} ref={(el) => { refs.current[casa.numero] = el }}>
            <Fila
              titulo={<><strong>Casa {casa.numero}</strong> — {info.nombre}</>}
              apunte={info.breve}
              extra={dentro.length > 0 ? `${dentro.length}` : ""}
              abierta={abierta === casa.numero}
              onAlternar={() => onAbrir(abierta === casa.numero ? null : casa.numero)}
              resaltada={abierta === casa.numero}
            >
              <p className={s.parrafo}>{info.largo}</p>
              <p className={s.parrafoSecundario}>
                Empieza en {Math.floor(casa.grado)}° de {SIGNOS[casa.signo].nombre}.
              </p>
              {dentro.length > 0 ? (
                <p className={s.parrafoSecundario}>
                  Aquí tienes: <strong>{dentro.map((p) => p.nombre).join(", ")}</strong>.
                </p>
              ) : (
                <p className={s.parrafoSecundario}>Sin planetas dentro.</p>
              )}
            </Fila>
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  4 · ASPECTOS
// ═══════════════════════════════════════════════════════════════════════════

function Aspectos({ carta }: { carta: Carta }) {
  const { abierta, alternar } = useUnaAbierta<number>()

  return (
    <div>
      {/* «Todos están tan abiertos que es difícil a la vista y no se entiende
          nada, no se explica.» Las dos cosas: ahora vienen cerrados y antes
          va qué es un aspecto, en una frase que no da nada por sabido. */}
      <p className={s.entradilla}>
        Un aspecto es la <strong>distancia entre dos planetas</strong> de tu carta. Cuando
        esa distancia es una de cinco concretas, se lee como que esas dos partes de ti se
        hablan: a veces ayudándose, a veces estorbándose.
      </p>
      <p className={s.entradilla}>
        Son las líneas del centro de la rueda. <strong>Ninguno es bueno ni malo:</strong>{" "}
        los fáciles dan talento que no se nota porque nunca costó, y los difíciles dan el
        empuje que acaba construyendo algo.
      </p>
      <p className={s.nota}>
        Están del más exacto al más flojo. El número de la derecha es el{" "}
        <strong>orbe</strong>: cuánto se aparta de la distancia exacta. Cuanto menor, más
        se nota.
      </p>

      {carta.aspectos.length === 0 && (
        <p className={s.nota}>
          Tu carta no tiene aspectos dentro de los márgenes habituales. Es poco común y no
          es un fallo.
        </p>
      )}

      {carta.aspectos.map((a, i) => (
        <Fila
          key={i}
          titulo={
            <>
              <span className={`${s.punto} ${s[a.naturaleza]}`} aria-hidden />
              {a.nombreA} <strong>{a.nombre.toLowerCase()}</strong> {a.nombreB}
            </>
          }
          apunte={COMO_ACTUA[a.tipo].titulo}
          extra={`${a.desviacion.toFixed(1)}°`}
          abierta={abierta === i}
          onAlternar={() => alternar(i)}
        >
          <p className={s.etiquetaMini}>De qué va</p>
          <p className={s.parrafo}>{textoPareja(a.a, a.b)}</p>
          <p className={s.etiquetaMini}>Y en qué términos</p>
          <p className={s.parrafo}>{COMO_ACTUA[a.tipo].texto}</p>
        </Fila>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  5 · CAMINO SOLAR
// ═══════════════════════════════════════════════════════════════════════════

function CaminoSolar({ pesos, abierto, onAbrir }: {
  pesos: PesoDeSigno[]
  abierto: SignoId | null
  onAbrir: (s: SignoId | null) => void
}) {
  const refs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    if (!abierto) return
    refs.current[abierto]?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [abierto])

  return (
    <div>
      <p className={s.entradilla}>
        La lectura propia de Los 144.000. Los doce signos del zodiaco están alineados con
        los <strong>doce sistemas orgánicos</strong>, uno a uno: Capricornio con el
        esqueleto, Acuario con el nervioso, Piscis con el circulatorio. Esa correspondencia
        es el centro de todo.
      </p>
      <p className={s.entradilla}>
        Lo que se mide aquí es <strong>cuánto aparece cada signo en tu carta</strong>. El
        Sol, la Luna y el Ascendente valen 3; los planetas personales, 2; los lentos, 1,
        porque esos los comparte una generación entera.
      </p>
      <p className={s.instruccion}>
        <strong>Presencia no es estado.</strong> Que un signo aparezca poco no significa
        que su sistema orgánico esté en desequilibrio, igual que aparecer mucho no
        significa que esté en equilibrio. La carta dice cuánto hay, y nada más. Lo otro lo
        sabes tú.
      </p>

      {pesos.map((w) => {
        const signo = SIGNOS[w.signo]
        const mapa = MAPA_POR_DEFECTO[w.signo]
        const sistema = SISTEMAS[mapa.sistema]
        return (
          <div key={w.signo} ref={(el) => { refs.current[w.signo] = el }}>
            <Fila
              titulo={<strong>{signo.nombre}</strong>}
              apunte={sistema.nombre}
              extra={
                <>
                  {w.estado === "predominante" ? "Muy presente"
                    : w.estado === "presente" ? "Presente" : "Poco presente"}
                  <span className={s.filaPuntos}>{w.puntos}</span>
                </>
              }
              abierta={abierto === w.signo}
              onAlternar={() => onAbrir(abierto === w.signo ? null : w.signo)}
              resaltada={abierto === w.signo}
            >
              <p className={s.filaHabitantes}>
                {w.habitantes.length > 0
                  ? `En tu carta: ${w.habitantes.map((h) => h.nombre).join(", ")}.`
                  : "En tu carta no cayó ningún planeta en este signo."}
              </p>

              <p className={s.etiquetaMini}>El arquetipo</p>
              <p className={s.parrafo}>{signo.atributos}</p>
              <p className={s.etiquetaMini}>Y su sombra</p>
              <p className={s.parrafoSecundario}>{signo.conflictos}</p>

              <div className={s.sistema}>
                <p className={s.etiquetaSistema}>Sistema orgánico · {sistema.nombre}</p>
                <p className={s.etiquetaMini}>En equilibrio</p>
                <p className={s.parrafo}>{sistema.equilibrio}</p>
                <p className={s.etiquetaMini}>En desequilibrio</p>
                <p className={s.parrafo}>{sistema.desequilibrio}</p>

                {mapa.zona && (
                  <p className={s.parrafoSecundario}>
                    <strong>Si este sistema entra en desequilibrio</strong>, suele notarse
                    en {mapa.zona.toLowerCase()}
                    {mapa.somatizaciones && <>: {mapa.somatizaciones.toLowerCase()}</>}.
                  </p>
                )}
                {mapa.emocion && (
                  <p className={s.parrafoSecundario}>
                    <strong>Emoción detrás:</strong> {mapa.emocion}
                  </p>
                )}
              </div>
            </Fila>
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  6 · GUÍA
// ═══════════════════════════════════════════════════════════════════════════

function GuiaVista() {
  const { abierta, alternar } = useUnaAbierta<string>()
  return (
    <div>
      <p className={s.entradilla}>
        Si nunca has leído una carta, empieza por aquí. Son cuatro ideas y ninguna es
        difícil.
      </p>
      {GUIA.map((g) => (
        <Fila
          key={g.id}
          titulo={g.pregunta}
          abierta={abierta === g.id}
          onAlternar={() => alternar(g.id)}
        >
          <p className={s.parrafo}>{g.respuesta}</p>
        </Fila>
      ))}
    </div>
  )
}
