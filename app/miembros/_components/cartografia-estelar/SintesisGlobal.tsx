"use client"

// CARTOGRAFÍA ESTELAR 144 — la lectura de conjunto.
//
// Lo que no se ve mirando los portales uno a uno: la secuencia que forman los
// tres más marcados, la polaridad entre ellos, las capacidades que varios
// sostienen a la vez, y la pregunta que atraviesa todo.
//
// ── NADA SE AFIRMA SIN MOSTRAR DE DÓNDE SALE ───────────────────────────────
// Cada capacidad lleva debajo los portales y los puntos natales que la
// sostienen. La pregunta central lleva su origen. Un "tienes este don" sin el
// porqué es adulación, y la adulación no enseña nada a nadie.

import { useState } from "react"
import { ChevronDown, ArrowRight } from "lucide-react"
import {
  construirTriada, detectarEje, mapaCapacidades, practicaPrincipal,
  preguntaCentral, zonasIntegracion, DIARIO_CARTOGRAFIA,
} from "../../_lib/cartografia-estelar/domain/editorial/sintesis-global"
import { PUNTOS } from "../../_lib/cartografia-estelar/content/puntos.content"
import { AVISO_DOS_CAPAS } from "../../_lib/cartografia-estelar/content/avisos"
import type { Cartografia } from "../../_lib/cartografia-estelar/domain/types"
import s from "./cartografia.module.css"

function Capa({ titulo, children, abiertoPorDefecto = false }: {
  titulo: string
  children: React.ReactNode
  abiertoPorDefecto?: boolean
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
      {abierto && <div className={s.capaCuerpo}>{children}</div>}
    </section>
  )
}

export function SintesisGlobal({ carto, onAbrirPortal }: {
  carto: Cartografia
  onAbrirPortal: (id: string) => void
}) {
  const triada = construirTriada(carto)
  const eje = detectarEje(carto)
  const capacidades = mapaCapacidades(carto)
  const zonas = zonasIntegracion(carto)
  const pregunta = preguntaCentral(carto)
  const practica = practicaPrincipal(carto)

  return (
    <div className={s.sintesis}>
      {/* ── Tríada ─────────────────────────────────────────────────────── */}
      {triada && (
        <Capa titulo="Tu tríada estelar" abiertoPorDefecto>
          <p className={s.secuencia}>{triada.secuencia}</p>
          <div className={s.triadaPortales}>
            {triada.portales.map((p, i) => (
              <button key={p.id} type="button" className={s.triadaPortal} onClick={() => onAbrirPortal(p.id)}>
                <span className={s.triadaNum}>{String(i + 1).padStart(2, "0")}</span>
                <span className={s.triadaNombre}>{p.nombre}</span>
                <span className={s.triadaVerbo}>{p.verbo}</span>
                <span className={s.triadaScore}>{p.resonancia}</span>
              </button>
            ))}
          </div>
          <p className={s.parrafo}>{triada.texto}</p>
        </Capa>
      )}

      {/* ── Eje ────────────────────────────────────────────────────────── */}
      {eje && (
        <Capa titulo="Tu eje de integración" abiertoPorDefecto>
          <p className={s.ejeNombre}>{eje.nombre}</p>
          <p className={s.parrafo}>{eje.descripcion}</p>

          <div className={s.ejePolos}>
            {[0, 1].map((polo) => (
              <div key={polo} className={s.ejePolo}>
                <p className={s.ejePoloNombre}>{eje.polos[polo]}</p>
                <ul className={s.ejeLista}>
                  {eje.desde.filter((d) => d.polo === polo).map((d) => (
                    <li key={d.portalId}>
                      <button type="button" onClick={() => onAbrirPortal(d.portalId)}>
                        {d.nombre} <em>{d.resonancia}</em>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className={s.parrafoSecundario}>
            <strong>Cómo reconocerlo.</strong> {eje.comoReconocerlo}
          </p>
        </Capa>
      )}

      {/* ── Capacidades ────────────────────────────────────────────────── */}
      {capacidades.length > 0 && (
        <Capa titulo="Mapa de capacidades">
          <p className={s.avisoLente}>
            No aparecen porque sí. Debajo de cada una están los portales y los puntos
            natales que la sostienen en tu cartografía.
          </p>
          {capacidades.map((c) => (
            <article key={c.id} className={s.capacidad}>
              <h4 className={s.capacidadNombre}>{c.nombre}</h4>
              <p className={s.parrafo}>{c.descripcion}</p>
              <p className={s.puntoCiego}>
                <strong>Punto ciego.</strong> {c.puntoCiego}
              </p>
              <details className={s.sostenida}>
                <summary>Qué la sostiene en tu mapa</summary>
                <ul className={s.listaPuntos}>
                  {c.sostenidaPor.map((x) => (
                    <li key={x.portalId}>
                      <strong>{x.nombre}</strong> ({x.resonancia}) — por {x.puntos.join(", ")}
                    </li>
                  ))}
                </ul>
              </details>
            </article>
          ))}
        </Capa>
      )}

      {/* ── Zonas de integración ───────────────────────────────────────── */}
      {zonas.length > 0 && (
        <Capa titulo="Zonas de integración">
          <p className={s.avisoLente}>
            Salen de los aspectos tensos y de las contradicciones entre tus portales. Como
            mucho tres: más de tres dejan de orientar.
          </p>
          {zonas.map((z) => (
            <article key={z.nombre} className={s.zona}>
              <h4 className={s.zonaNombre}>{z.nombre}</h4>
              <p className={s.parrafo}>{z.descripcion}</p>
            </article>
          ))}
        </Capa>
      )}

      {/* ── Pregunta central ───────────────────────────────────────────── */}
      {pregunta && (
        <section className={s.preguntaCentralGlobal}>
          <p className={s.kickerPeq}>La pregunta de tu cartografía</p>
          <p className={s.preguntaGrande}>{pregunta.pregunta}</p>
          <p className={s.preguntaOrigen}>{pregunta.origen}</p>
        </section>
      )}

      {/* ── Práctica ───────────────────────────────────────────────────── */}
      {practica && (
        <Capa titulo="Tu práctica de 7 días" abiertoPorDefecto>
          <p className={s.practicaTitulo}>{practica.practica.titulo}</p>
          <ol className={s.pasos}>
            {practica.practica.pasos.map((p, i) => <li key={i}>{p}</li>)}
          </ol>
          <p className={s.practicaCierre}>{practica.practica.cierre}</p>
          <p className={s.parrafoSecundario}>{practica.origen}</p>
          <button type="button" className={s.secundario} onClick={() => onAbrirPortal(practica.portalId)}>
            Ir a {practica.portalNombre} <ArrowRight size={13} />
          </button>
        </Capa>
      )}

      {/* ── Diario ─────────────────────────────────────────────────────── */}
      <Capa titulo="Diario de cartografía">
        <p className={s.avisoLente}>
          Siete días, una pregunta por día. No hace falta responderlas aquí: basta con
          tenerlas delante.
        </p>
        <ol className={s.diario}>
          {DIARIO_CARTOGRAFIA.map((d) => (
            <li key={d.dia}>
              <span className={s.diarioDia}>Día {d.dia}</span>
              <span className={s.diarioPregunta}>{d.pregunta}</span>
            </li>
          ))}
        </ol>
      </Capa>

      {/* ── Resumen calculado ──────────────────────────────────────────── */}
      <Capa titulo="Resumen del cálculo">
        <dl className={s.resumen}>
          <div>
            <dt>Portales con contacto</dt>
            <dd>{carto.resumen.portalesActivos} de {carto.resumen.portalesTotales}</dd>
          </div>
          <div><dt>Contactos exactos</dt><dd>{carto.resumen.contactosExactos}</dd></div>
          <div>
            <dt>Punto más implicado</dt>
            <dd>{carto.resumen.puntoMasImplicado ? PUNTOS[carto.resumen.puntoMasImplicado].nombre : "—"}</dd>
          </div>
          <div><dt>Aspecto más repetido</dt><dd>{carto.resumen.aspectoMasRepetido ?? "—"}</dd></div>
          <div><dt>Desfase horario aplicado</dt><dd>{carto.instante.desfaseTexto}</dd></div>
        </dl>
      </Capa>

      <p className={s.avisoCapas}>{AVISO_DOS_CAPAS}</p>
    </div>
  )
}
