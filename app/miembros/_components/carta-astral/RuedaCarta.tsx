"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  LA RUEDA · el mapa de la carta, y también su navegación
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ HAY UNA RUEDA ─────────────────────────────────────────────────
// Sin ella, la herramienta era una lista larguísima de párrafos y había que
// recorrerla entera para encontrar algo. Una carta astral ES un círculo: esa
// es su forma nativa, no un adorno que se le añade.
//
// Y la rueda no solo enseña: se toca. Tocas Venus y te lleva a lo que dice
// Venus. Tocas una casa y te lleva a esa casa. Es la respuesta a «me has
// enviado un texto tan plano que es difícil navegar».
//
// ── CÓMO SE COLOCAN LAS COSAS ─────────────────────────────────────────────
// Por convención, el Ascendente va a la IZQUIERDA —donde sale el Sol, el
// horizonte este— y los grados crecen en sentido antihorario. De ahí:
//
//     ángulo en pantalla = 180° + (longitud − longitud del Ascendente)
//
// En SVG el eje Y crece hacia abajo, así que la Y lleva un signo menos. Con
// eso, el Ascendente queda a las nueve y el Fondo del Cielo abajo, que es
// como se dibuja una carta desde hace siglos.
//
// ── LOS PLANETAS QUE SE PISAN ─────────────────────────────────────────────
// Tres planetas en el mismo grado se dibujarían encima unos de otros y no se
// podría tocar ninguno. Se separan lo justo para que quepan, y de cada uno
// sale una rayita hasta su posición REAL. Así se ve dónde está de verdad sin
// renunciar a poder tocarlo.
//
// ── ACCESIBILIDAD ─────────────────────────────────────────────────────────
// Cada planeta es un <button> dentro de un <foreignObject>… no: es un
// elemento SVG con role="button", tabIndex y onKeyDown. Se puede recorrer con
// el teclado y cada uno dice su nombre completo. Un dibujo que solo responde
// al ratón deja fuera a quien navega con teclado.

import { useMemo, useState } from "react"
import type { Carta, Punto, PuntoId } from "../../_lib/carta-astral/motor/carta"
import { type SignoId, ORDEN_ZODIACAL } from "../../_lib/carta-astral/contenido/signos"
import s from "./rueda.module.css"

// ── Glifos ────────────────────────────────────────────────────────────────
// Son los símbolos de verdad, los mismos que José tiene en la columna
// «Símbolo» de su Excel. Un glifo dice «esto es astrología» sin una palabra,
// y cabe donde no cabe un nombre.
const GLIFO_SIGNO: Record<SignoId, string> = {
  aries: "♈", tauro: "♉", geminis: "♊", cancer: "♋",
  leo: "♌", virgo: "♍", libra: "♎", escorpio: "♏",
  sagitario: "♐", capricornio: "♑", acuario: "♒", piscis: "♓",
}

const GLIFO_PUNTO: Record<PuntoId, string> = {
  sol: "☉", luna: "☽", mercurio: "☿", venus: "♀", marte: "♂",
  jupiter: "♃", saturno: "♄", urano: "♅", neptuno: "♆", pluton: "♇",
  nodo_norte: "☊", ascendente: "AC", medio_cielo: "MC",
}

/** Los cuatro elementos, que es lo que colorea el anillo exterior. */
const ELEMENTO: Record<SignoId, "fuego" | "tierra" | "aire" | "agua"> = {
  aries: "fuego", leo: "fuego", sagitario: "fuego",
  tauro: "tierra", virgo: "tierra", capricornio: "tierra",
  geminis: "aire", libra: "aire", acuario: "aire",
  cancer: "agua", escorpio: "agua", piscis: "agua",
}

const COLOR_ELEMENTO = {
  fuego: "#e0956a",
  tierra: "#9bbf7a",
  aire: "#d6c98a",
  agua: "#9a8fd6",
} as const

const COLOR_ASPECTO = {
  union: "#c3b2e0",
  tension: "#e07a7a",
  fluidez: "#6fb3d0",
} as const

// ── Geometría ─────────────────────────────────────────────────────────────
const TAM = 420
const C = TAM / 2
const R_FUERA = 198      // borde del anillo de signos
const R_SIGNOS = 172     // borde interior del anillo de signos
const R_CASAS = 150      // borde del anillo de casas
const R_PLANETAS = 128   // donde se dibujan los glifos
const R_ASPECTOS = 104   // donde empiezan las líneas de aspecto

const rad = (g: number) => (g * Math.PI) / 180

/** Longitud eclíptica → punto en pantalla. El Ascendente manda. */
function xy(longitud: number, radio: number, ascLon: number) {
  const a = rad(180 + (longitud - ascLon))
  return { x: C + radio * Math.cos(a), y: C - radio * Math.sin(a) }
}

/** Un sector de corona circular, para pintar signos y casas. */
function sector(desde: number, hasta: number, rInt: number, rExt: number, ascLon: number) {
  let barrido = ((hasta - desde) % 360 + 360) % 360
  if (barrido === 0) barrido = 360
  const a = xy(desde, rExt, ascLon)
  const b = xy(hasta, rExt, ascLon)
  const c = xy(hasta, rInt, ascLon)
  const d = xy(desde, rInt, ascLon)
  // El barrido va en sentido antihorario, que en SVG (con la Y invertida) es
  // sweep-flag 0.
  const grande = barrido > 180 ? 1 : 0
  return [
    `M ${a.x} ${a.y}`,
    `A ${rExt} ${rExt} 0 ${grande} 0 ${b.x} ${b.y}`,
    `L ${c.x} ${c.y}`,
    `A ${rInt} ${rInt} 0 ${grande} 1 ${d.x} ${d.y}`,
    "Z",
  ].join(" ")
}

/**
 * Separa los planetas que se pisan.
 *
 * Devuelve, para cada punto, el ángulo en que se DIBUJA. La posición real se
 * conserva aparte para la rayita que los une.
 */
function repartir(puntos: Punto[], ascLon: number, minimo = 9): Map<PuntoId, number> {
  // Se trabaja en «grados de pantalla» relativos al Ascendente, porque es ahí
  // donde se miden las distancias que importan.
  const items = puntos
    .map((p) => ({ id: p.id, a: ((p.longitud - ascLon) % 360 + 360) % 360 }))
    .sort((x, y) => x.a - y.a)

  // Dos pasadas de empuje. Más no hace falta: con trece puntos y 9° de hueco
  // caben de sobra en los 360°.
  for (let vuelta = 0; vuelta < 2; vuelta++) {
    for (let i = 0; i < items.length; i++) {
      const act = items[i]
      const sig = items[(i + 1) % items.length]
      let hueco = sig.a - act.a
      if (i === items.length - 1) hueco += 360
      if (hueco < minimo) {
        const empuje = (minimo - hueco) / 2
        act.a -= empuje
        sig.a += empuje
      }
    }
  }

  const salida = new Map<PuntoId, number>()
  for (const it of items) salida.set(it.id, ascLon + it.a)
  return salida
}

export function RuedaCarta({ carta, onPunto, onCasa, onSigno, resaltado }: {
  carta: Carta
  onPunto: (id: PuntoId) => void
  onCasa: (numero: number) => void
  onSigno: (signo: SignoId) => void
  resaltado: PuntoId | null
}) {
  const ascLon = carta.puntos.find((p) => p.id === "ascendente")!.longitud
  const [encima, setEncima] = useState<PuntoId | null>(null)

  const colocados = useMemo(() => repartir(carta.puntos, ascLon), [carta, ascLon])

  // Los aspectos se dibujan desde la posición REAL, no la repartida: son
  // geometría del cielo y moverlos sería dibujar algo que no es.
  const lineas = carta.aspectos.map((a, i) => {
    const pa = carta.puntos.find((p) => p.id === a.a)!
    const pb = carta.puntos.find((p) => p.id === a.b)!
    const A = xy(pa.longitud, R_ASPECTOS, ascLon)
    const B = xy(pb.longitud, R_ASPECTOS, ascLon)
    const activo = resaltado === a.a || resaltado === a.b || encima === a.a || encima === a.b
    return (
      <line
        key={i}
        x1={A.x} y1={A.y} x2={B.x} y2={B.y}
        stroke={COLOR_ASPECTO[a.naturaleza]}
        strokeWidth={activo ? 1.6 : 0.8}
        // Los flojos se ven menos. Un aspecto al borde del orbe no pesa igual
        // que uno exacto, y el dibujo debe decirlo.
        opacity={activo ? 0.95 : 0.14 + a.fuerza * 0.3}
      />
    )
  })

  return (
    <svg
      viewBox={`0 0 ${TAM} ${TAM}`}
      className={s.rueda}
      role="img"
      aria-label="Rueda de tu carta astral. Cada planeta, signo y casa se puede abrir."
    >
      {/* ── Anillo de signos ── */}
      {ORDEN_ZODIACAL.map((signo, i) => {
        const desde = i * 30
        const medio = desde + 15
        const pos = xy(medio, (R_FUERA + R_SIGNOS) / 2, ascLon)
        const color = COLOR_ELEMENTO[ELEMENTO[signo]]
        return (
          <g
            key={signo}
            className={s.tocable}
            role="button"
            tabIndex={0}
            aria-label={`Signo ${signo}`}
            onClick={() => onSigno(signo)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSigno(signo) } }}
          >
            <path
              d={sector(desde, desde + 30, R_SIGNOS, R_FUERA, ascLon)}
              fill={color}
              fillOpacity={0.1}
              stroke="rgba(167,139,202,0.22)"
              strokeWidth={0.6}
            />
            <text x={pos.x} y={pos.y} className={s.glifoSigno} fill={color}>
              {GLIFO_SIGNO[signo]}
            </text>
          </g>
        )
      })}

      {/* ── Anillo de casas ── */}
      {carta.casas.map((casa, i) => {
        const siguiente = carta.casas[(i + 1) % 12]
        const medio = casa.cuspide + (((siguiente.cuspide - casa.cuspide) % 360 + 360) % 360) / 2
        const pos = xy(medio, (R_CASAS + R_PLANETAS + 14) / 2, ascLon)
        // Los cuatro ángulos —1, 4, 7 y 10— son la estructura de la carta y se
        // marcan más fuerte. El resto, apenas una línea.
        const esAngulo = [1, 4, 7, 10].includes(casa.numero)
        return (
          <g
            key={casa.numero}
            className={s.tocable}
            role="button"
            tabIndex={0}
            aria-label={`Casa ${casa.numero}`}
            onClick={() => onCasa(casa.numero)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onCasa(casa.numero) } }}
          >
            <path
              d={sector(casa.cuspide, siguiente.cuspide, R_PLANETAS - 6, R_CASAS, ascLon)}
              fill={esAngulo ? "rgba(167,139,202,0.09)" : "transparent"}
              stroke="rgba(167,139,202,0.16)"
              strokeWidth={0.6}
            />
            <text x={pos.x} y={pos.y} className={esAngulo ? s.numCasaFuerte : s.numCasa}>
              {casa.numero}
            </text>
          </g>
        )
      })}

      {/* ── Los ejes: horizonte y meridiano ── */}
      {[0, 90].map((giro) => {
        const base = giro === 0
          ? ascLon
          : carta.puntos.find((p) => p.id === "medio_cielo")!.longitud
        const a = xy(base, R_CASAS, ascLon)
        const b = xy(base + 180, R_CASAS, ascLon)
        return (
          <line key={giro}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="rgba(167,139,202,0.35)" strokeWidth={0.9} strokeDasharray="3 3"
          />
        )
      })}

      {/* ── Aspectos ── */}
      <circle cx={C} cy={C} r={R_ASPECTOS} fill="rgba(10,10,20,0.55)" stroke="rgba(167,139,202,0.14)" strokeWidth={0.6} />
      <g>{lineas}</g>

      {/* ── Planetas ── */}
      {carta.puntos.map((p) => {
        const dibujo = colocados.get(p.id) ?? p.longitud
        const pos = xy(dibujo, R_PLANETAS, ascLon)
        const real = xy(p.longitud, R_CASAS - 2, ascLon)
        const tick = xy(p.longitud, R_CASAS - 9, ascLon)
        const activo = resaltado === p.id || encima === p.id
        const esAngulo = p.id === "ascendente" || p.id === "medio_cielo"

        return (
          <g key={p.id}>
            {/* La rayita a la posición de verdad. */}
            <line x1={real.x} y1={real.y} x2={tick.x} y2={tick.y}
              stroke="rgba(167,139,202,0.5)" strokeWidth={0.8} />
            <g
              className={s.tocable}
              role="button"
              tabIndex={0}
              aria-label={`${p.nombre} en grado ${Math.floor(p.grado)}, casa ${p.casa}${p.retrogrado ? ", retrógrado" : ""}`}
              onClick={() => onPunto(p.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPunto(p.id) } }}
              onPointerEnter={() => setEncima(p.id)}
              onPointerLeave={() => setEncima(null)}
              onFocus={() => setEncima(p.id)}
              onBlur={() => setEncima(null)}
            >
              <circle cx={pos.x} cy={pos.y} r={13}
                fill={activo ? "rgba(167,139,202,0.28)" : "rgba(13,13,24,0.9)"}
                stroke={activo ? "#c3b2e0" : "rgba(167,139,202,0.3)"}
                strokeWidth={activo ? 1.4 : 0.8}
              />
              <text x={pos.x} y={pos.y}
                className={esAngulo ? s.glifoAngulo : s.glifoPunto}
                fill={activo ? "#f3f6fa" : "#c3c6d8"}
              >
                {GLIFO_PUNTO[p.id]}
              </text>
              {p.retrogrado && (
                <text x={pos.x + 11} y={pos.y - 8} className={s.retroGlifo}>R</text>
              )}
            </g>
          </g>
        )
      })}

      {/* ── El centro: lo que tengas señalado ── */}
      <CentroRueda carta={carta} id={encima ?? resaltado} />
    </svg>
  )
}

/** El hueco del medio dice qué estás mirando. Si no miras nada, invita. */
function CentroRueda({ carta, id }: { carta: Carta; id: PuntoId | null }) {
  const p = id ? carta.puntos.find((x) => x.id === id) : null

  if (!p) {
    return (
      <text x={C} y={C} className={s.centroVacio}>
        Toca un símbolo
      </text>
    )
  }

  return (
    <g>
      <text x={C} y={C - 12} className={s.centroNombre}>{p.nombre}</text>
      <text x={C} y={C + 6} className={s.centroSigno}>
        {Math.floor(p.grado)}° {GLIFO_SIGNO[p.signo]}
      </text>
      <text x={C} y={C + 22} className={s.centroCasa}>casa {p.casa}</text>
    </g>
  )
}
