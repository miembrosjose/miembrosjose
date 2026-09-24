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
//
// ── QUIÉN HABLA AQUÍ ───────────────────────────────────────────────────────
// El rigor no obliga a sonar como un informe. Esta pantalla llegó a estar
// escrita como una ficha técnica: frases que empiezan negando, sustantivos sin
// verbo, «no es una jerarquía de importancia». Quien abre su cartografía no
// está estudiando astronomía: está intentando reconocerse, y a menudo por
// primera vez.
//
// El tono es el de alguien que acompaña: dice lo que ve, dice de dónde lo saca,
// y devuelve la última palabra a quien lee. Nunca afirma quién eres. Lo que
// pueda sonar a veredicto se convierte en pregunta.

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
          {triada.parrafos.map((p, i) => (
            <p key={i} className={s.parrafo}>{p}</p>
          ))}
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
            Ninguna de estas aparece porque suene bien. Cada una viene de contactos
            concretos de tu carta, y puedes ver cuáles abriendo «Qué la sostiene en tu
            mapa». Léelas como algo que ya haces, no como algo que deberías hacer.
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
        <Capa titulo="Dónde pide equilibrio">
          <p className={s.avisoLente}>
            Son las tensiones que aparecen en tu carta: dos fuerzas que tiran en
            direcciones distintas. No hay nada que arreglar aquí. Se nombran porque
            reconocerlas suele bastar para que dejen de tirar a oscuras.
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
        <Capa titulo="Una práctica para estos días" abiertoPorDefecto>
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
      <Capa titulo="Siete preguntas para llevarte">
        <p className={s.avisoLente}>
          Una por día. No hay que responderlas aquí ni en ningún sitio: a veces basta con
          llevarlas encima y ver qué contesta el día por su cuenta.
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
      {/* La trastienda. Cerrada, y última: quien quiera comprobar los números
          los tiene, y quien no, no se tropieza con ellos. */}
      <Capa titulo="Los números del cálculo">
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
