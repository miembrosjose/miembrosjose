"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  CARTA ASTRAL · Camino Solar
// ═══════════════════════════════════════════════════════════════════════════
//
// ── SOLO LA VE ADMINISTRACIÓN ─────────────────────────────────────────────
// Quien monta esta tarjeta lo hace dentro de un `isAdmin &&`, en
// SpaHomeShellInner. Mientras siga así, ningún miembro ve ni rastro: no
// aparece la tarjeta, no se descarga el código y no hay dirección a la que
// llegar escribiéndola a mano, porque esto no es una ruta.
//
// Cuando se abra a todo el mundo, basta quitar esa condición.
//
// ── EL CÁLCULO NO SALE DE ESTE NAVEGADOR ──────────────────────────────────
// Igual que la Cartografía Estelar: la fecha, la hora y el lugar se quedan en
// este dispositivo. No hay servidor que los vea, porque no se envían.
//
// ── SE REUTILIZA EL FORMULARIO DE LA CARTOGRAFÍA ──────────────────────────
// Pide exactamente lo mismo —fecha, hora y lugar— y ya tiene resuelta la
// parte difícil: la búsqueda de ciudad tolerante a tildes y a nombres en
// inglés. Duplicarlo habría significado arreglar dos veces el mismo fallo.

import { useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { X, Sparkles, RotateCcw, ChevronDown } from "lucide-react"

import { aTiempoUniversal } from "../../_lib/cartografia-estelar/astronomy/tiempo"
import type { Nacimiento } from "../../_lib/cartografia-estelar/domain/types"
import { FormularioNacimiento } from "../cartografia-estelar/FormularioNacimiento"

import { calcularCarta, type Carta, type PuntoId } from "../../_lib/carta-astral/motor/carta"
import { pesarSignos, type PesoDeSigno } from "../../_lib/carta-astral/motor/pesos"
import { SIGNOS } from "../../_lib/carta-astral/contenido/signos"
import { SISTEMAS } from "../../_lib/carta-astral/contenido/sistemas"
import { MAPA_POR_DEFECTO } from "../../_lib/carta-astral/contenido/mapa-sistemas"
import {
  CASAS, PLANETAS, AVISO_DOS_CAPAS, AVISO_GENERACIONALES, type PlanetaId,
} from "../../_lib/carta-astral/contenido/vocabulario"
import { textoEnCasa } from "../../_lib/carta-astral/contenido/planeta-en-casa"
import { textoEnSigno, GENERACIONALES } from "../../_lib/carta-astral/contenido/planeta-en-signo"
import { COMO_ACTUA, textoPareja } from "../../_lib/carta-astral/contenido/aspectos-texto"

import { usePanelAPantallaCompleta } from "../../_lib/panel-modal"
import { PanelFallo } from "../PanelFallo"
import prod from "../products.module.css"
import s from "./carta.module.css"

const CLAVE = "los144k_carta_astral_nacimiento"
const VIOLET = "#a78bca"

const PLANETAS_IDS: PlanetaId[] = [
  "sol", "luna", "mercurio", "venus", "marte",
  "jupiter", "saturno", "urano", "neptuno", "pluton",
]

function guardar(n: Nacimiento) {
  try { localStorage.setItem(CLAVE, JSON.stringify(n)) } catch { /* cuota llena */ }
}
function recuperar(): Nacimiento | null {
  try {
    const raw = localStorage.getItem(CLAVE)
    return raw ? (JSON.parse(raw) as Nacimiento) : null
  } catch { return null }
}
function olvidar() {
  try { localStorage.removeItem(CLAVE) } catch { /* bloqueado */ }
}

export function CartaAstral() {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={prod.card}
        style={{ cursor: "pointer", position: "relative" }}
      >
        {/* El letrero de NUEVO. Se quita borrando este bloque. */}
        <span className={s.etiquetaNuevo}>Nuevo</span>

        <div className={prod.thumb}>
          {/* Marcador: la portada se cambia luego, como en las demás
              herramientas. Hasta entonces, algo que no parezca un hueco. */}
          <div className={s.portadaProvisional}>
            <Sparkles size={26} color={VIOLET} aria-hidden />
          </div>
        </div>

        <div className={prod.body}>
          <h3 className={prod.name} style={{ color: "#F3F6FA" }}>Carta Astral · Camino Solar</h3>
          <p className={s.kicker}>Planetas · casas · sistemas</p>
        </div>
      </button>

      {abierto && <Panel onClose={() => setAbierto(false)} />}
    </>
  )
}

function Panel({ onClose }: { onClose: () => void }) {
  const { montado, propsDelFondo } = usePanelAPantallaCompleta(onClose)

  const [nacimiento, setNacimiento] = useState<Nacimiento | null>(() => recuperar())
  const [error, setError] = useState<string | null>(null)

  // El cálculo entero, de una vez. Es determinista y rápido: no hace falta
  // trocearlo ni guardarlo en ningún sitio.
  const calculo = useMemo(() => {
    if (!nacimiento) return null
    try {
      const { utcMs, desfaseTexto } = aTiempoUniversal(nacimiento)
      const carta = calcularCarta(utcMs, nacimiento.lugar.latitud, nacimiento.lugar.longitud)
      return { carta, pesos: pesarSignos(carta), desfaseTexto }
    } catch (e) {
      // Un fallo aquí casi siempre es una zona horaria que el navegador no
      // conoce. Se dice, en vez de dejar la pantalla en blanco.
      return { fallo: e instanceof Error ? e.message : "No se pudo calcular." } as const
    }
  }, [nacimiento])

  const trazar = (n: Nacimiento) => {
    setError(null)
    guardar(n)
    setNacimiento(n)
  }

  const reiniciar = () => {
    olvidar()
    setNacimiento(null)
    setError(null)
  }

  if (!montado) return null

  return createPortal(
    <div className={s.fondo} {...propsDelFondo} role="dialog" aria-label="Carta Astral">
      <div className={s.panel}>
        <button type="button" onClick={onClose} aria-label="Cerrar" className={s.cerrar}>
          <X size={18} />
        </button>

        <div className={s.scroll}>
          <PanelFallo modulo="Carta Astral" onReiniciar={reiniciar}>
            {!nacimiento || !calculo ? (
              <FormularioNacimiento onTrazar={trazar} error={error} />
            ) : "fallo" in calculo ? (
              <div className={s.aviso}>
                <p>{calculo.fallo}</p>
                <button type="button" className={s.secundario} onClick={reiniciar}>
                  <RotateCcw size={13} /> Volver a escribir mis datos
                </button>
              </div>
            ) : (
              <Resultado
                carta={calculo.carta}
                pesos={calculo.pesos}
                nacimiento={nacimiento}
                desfase={calculo.desfaseTexto}
                onReiniciar={reiniciar}
              />
            )}
          </PanelFallo>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ═══════════════════════════════════════════════════════════════════════════

function Resultado({ carta, pesos, nacimiento, desfase, onReiniciar }: {
  carta: Carta
  pesos: PesoDeSigno[]
  nacimiento: Nacimiento
  desfase: string
  onReiniciar: () => void
}) {
  const punto = (id: PuntoId) => carta.puntos.find((p) => p.id === id)!
  const sol = punto("sol"), luna = punto("luna"), asc = punto("ascendente")

  return (
    <div className={s.resultado}>
      <header className={s.cabecera}>
        <p className={s.kicker}>Carta Astral · Camino Solar</p>
        <h2 className={s.titulo}>Tu cielo de nacimiento</h2>
        <p className={s.datosNacimiento}>
          {String(nacimiento.dia).padStart(2, "0")}/{String(nacimiento.mes).padStart(2, "0")}/{nacimiento.anio}
          {" · "}{String(nacimiento.hora).padStart(2, "0")}:{String(nacimiento.minuto).padStart(2, "0")}
          {" · "}{nacimiento.lugar.nombre}{" · "}{desfase}
        </p>
      </header>

      {/* ── LOS TRES QUE MÁS PESAN ─────────────────────────────────── */}
      <div className={s.tresGrandes}>
        {[
          { p: sol, rotulo: "Sol", pie: "Lo que vienes a ser" },
          { p: luna, rotulo: "Luna", pie: "Lo que necesitas" },
          { p: asc, rotulo: "Ascendente", pie: "Cómo apareces" },
        ].map(({ p, rotulo, pie }) => (
          <div key={p.id} className={s.grande}>
            <span className={s.grandeRotulo}>{rotulo}</span>
            <strong className={s.grandeSigno}>{SIGNOS[p.signo].nombre}</strong>
            <span className={s.grandeGrado}>
              {Math.floor(p.grado)}° · casa {p.casa}
            </span>
            <span className={s.grandePie}>{pie}</span>
          </div>
        ))}
      </div>

      {/* ── LA TABLA ────────────────────────────────────────────────── */}
      <Seccion titulo="Todas las posiciones" abiertaPorDefecto>
        <p className={s.nota}>
          Casas por <strong>{carta.sistemaCasas === "placidus" ? "Placidus" : "signos enteros"}</strong>
          {carta.motivoCasas ? ` — ${carta.motivoCasas}` : ", que es el sistema que usan casi todas las webs de astrología."}
        </p>
        <table className={s.tabla}>
          <thead>
            <tr><th>Punto</th><th>Signo</th><th>Grado</th><th>Casa</th></tr>
          </thead>
          <tbody>
            {carta.puntos.map((p) => (
              <tr key={p.id}>
                <td className={s.celdaNombre}>
                  {p.nombre}
                  {p.retrogrado && <span className={s.retro} title="Retrógrado">R</span>}
                </td>
                <td>{SIGNOS[p.signo].nombre}</td>
                <td className={s.celdaNum}>{Math.floor(p.grado)}°{String(Math.floor((p.grado % 1) * 60)).padStart(2, "0")}′</td>
                <td className={s.celdaNum}>{p.casa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Seccion>

      {/* ── PLANETA POR PLANETA ─────────────────────────────────────── */}
      <Seccion titulo="Qué significa cada planeta en tu carta" abiertaPorDefecto>
        <p className={s.nota}>
          El <strong>signo</strong> dice cómo. La <strong>casa</strong> dice dónde. Son dos
          frases distintas sobre lo mismo, y las dos hacen falta.
        </p>
        {PLANETAS_IDS.map((id) => {
          const p = punto(id)
          const generacional = GENERACIONALES.includes(id)
          return (
            <article key={id} className={s.bloquePlaneta}>
              <h4 className={s.bloqueTitulo}>
                {PLANETAS[id].nombre} en {SIGNOS[p.signo].nombre}
                <span className={s.bloqueCasa}>casa {p.casa} · {CASAS[p.casa].nombre}</span>
              </h4>
              <p className={s.bloqueBreve}>{PLANETAS[id].breve}</p>

              <p className={s.etiquetaMini}>Cómo — el signo</p>
              <p className={s.parrafo}>{textoEnSigno(id, p.signo)}</p>
              {generacional && <p className={s.notaGeneracional}>{AVISO_GENERACIONALES}</p>}

              <p className={s.etiquetaMini}>Dónde — la casa</p>
              <p className={s.parrafo}>{textoEnCasa(id, p.casa)}</p>
            </article>
          )
        })}
      </Seccion>

      {/* ── ASPECTOS ────────────────────────────────────────────────── */}
      <Seccion titulo={`Aspectos (${carta.aspectos.length})`}>
        <p className={s.nota}>
          Distancias concretas entre dos puntos. Ordenados del más exacto al más flojo:
          cuanto menor es el orbe, más se nota.
        </p>
        {carta.aspectos.map((a, i) => (
          <article key={i} className={s.aspecto}>
            <h4 className={s.aspectoTitulo}>
              <span className={`${s.punto} ${s[a.naturaleza]}`} aria-hidden />
              {a.nombreA} {a.nombre.toLowerCase()} {a.nombreB}
              <span className={s.orbe}>{a.desviacion.toFixed(1)}° de orbe</span>
            </h4>
            <p className={s.parrafo}>{textoPareja(a.a, a.b)}</p>
            <p className={s.parrafoSecundario}>
              <strong>{COMO_ACTUA[a.tipo].titulo}.</strong> {COMO_ACTUA[a.tipo].texto}
            </p>
          </article>
        ))}
      </Seccion>

      {/* ── EL CAMINO SOLAR ─────────────────────────────────────────── */}
      <Seccion titulo="Tu Camino Solar" abiertaPorDefecto>
        <p className={s.nota}>
          Cada signo pesa según lo que haya caído en él. El Sol, la Luna y el Ascendente
          valen 3; los planetas personales, 2; los lentos, 1 — porque esos los comparte
          una generación entera. Lo que está <strong>ausente</strong> es tan parte de la
          lectura como lo que predomina.
        </p>
        {pesos.map((w) => <FilaSigno key={w.signo} w={w} />)}
      </Seccion>

      <p className={s.avisoCapas}>{AVISO_DOS_CAPAS}</p>

      <div className={s.pie}>
        <button type="button" className={s.secundario} onClick={onReiniciar}>
          <RotateCcw size={13} /> Cambiar mis datos
        </button>
      </div>
    </div>
  )
}

/** Un signo con su peso, su texto y su sistema orgánico. */
function FilaSigno({ w }: { w: PesoDeSigno }) {
  const [abierto, setAbierto] = useState(w.estado === "predominante" || w.estado === "ausente")
  const signo = SIGNOS[w.signo]
  const mapa = MAPA_POR_DEFECTO[w.signo]
  const sistema = SISTEMAS[mapa.sistema]

  // Ausente → el conflicto y el desequilibrio. Predominante → las dos caras,
  // porque en el propio archivo de José hay signos marcados a la vez como
  // predominantes y en desequilibrio: el exceso también desequilibra.
  const ausente = w.estado === "ausente"

  return (
    <article className={`${s.filaSigno} ${s[w.estado]}`}>
      <button type="button" className={s.filaCabecera} onClick={() => setAbierto((v) => !v)}>
        <span className={s.filaNombre}>{signo.nombre}</span>
        <span className={s.filaEstado}>
          {w.estado === "predominante" ? "Predominante"
            : w.estado === "presente" ? "Presente" : "Ausente o débil"}
        </span>
        <span className={s.filaPuntos}>{w.puntos} pts</span>
        <ChevronDown size={14} className={abierto ? s.giro : ""} aria-hidden />
      </button>

      {abierto && (
        <div className={s.filaCuerpo}>
          {w.habitantes.length > 0 && (
            <p className={s.filaHabitantes}>
              Ahí tienes: {w.habitantes.map((h) => h.nombre).join(", ")}
            </p>
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
                {mapa.borrador && <span className={s.borrador}>borrador — pendiente de revisar</span>}
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

/** Una sección plegable. */
function Seccion({ titulo, children, abiertaPorDefecto = false }: {
  titulo: string
  children: React.ReactNode
  abiertaPorDefecto?: boolean
}) {
  const [abierta, setAbierta] = useState(abiertaPorDefecto)
  return (
    <section className={s.seccion}>
      <button type="button" className={s.seccionCabecera} onClick={() => setAbierta((v) => !v)}>
        <h3 className={s.seccionTitulo}>{titulo}</h3>
        <ChevronDown size={16} className={abierta ? s.giro : ""} aria-hidden />
      </button>
      {abierta && <div className={s.seccionCuerpo}>{children}</div>}
    </section>
  )
}
