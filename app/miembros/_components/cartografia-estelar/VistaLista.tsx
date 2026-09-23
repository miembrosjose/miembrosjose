"use client"

// CARTOGRAFÍA ESTELAR 144 — modo lista.
//
// No es un respaldo del mapa 3D: es la misma información y la misma selección,
// leída de otra manera. Quien no pueda o no quiera usar WebGL tiene aquí la
// experiencia completa, y además es el equivalente accesible del lienzo.
//
// Solo aparecen los portales ACTIVOS. Un portal sin contacto no se lista como
// si tuviera algo que mirar: se cuenta aparte, al final.

import { useMemo, useState } from "react"
import { ArrowRight, SlidersHorizontal, X } from "lucide-react"
import { portalPorId } from "../../_lib/cartografia-estelar/catalog/portales"
import { aGradosMinutos } from "../../_lib/cartografia-estelar/astronomy/angulos"
import { PUNTOS, ORDEN_PUNTOS } from "../../_lib/cartografia-estelar/content/puntos.content"
import { ASPECTOS_CONTENIDO } from "../../_lib/cartografia-estelar/content/aspectos.content"
import { contenidoPortal } from "../../_lib/cartografia-estelar/content/portales"
import { etiquetaTipo } from "../../_lib/cartografia-estelar/domain/editorial/lectura-portal"
import { UMBRAL_ALTA, UMBRAL_MEDIA } from "../../_lib/cartografia-estelar/resonancia/config"
import { EXPLICACION_SIN_CONTACTO } from "../../_lib/cartografia-estelar/content/avisos"
import type { Cartografia, PuntoNatalId, TipoPortal } from "../../_lib/cartografia-estelar/domain/types"
import s from "./cartografia.module.css"

export type Orden = "resonancia" | "contactos" | "alfabetico" | "punto" | "tipo"

export type Filtros = {
  tipos: TipoPortal[]
  puntos: PuntoNatalId[]
}

export const FILTROS_VACIOS: Filtros = { tipos: [], puntos: [] }

const TIPOS: Array<{ id: TipoPortal; etiqueta: string }> = [
  { id: "STAR_SYSTEM", etiqueta: "Estrellas" },
  { id: "STAR_FAMILY", etiqueta: "Familias estelares" },
  { id: "CONSTELLATION", etiqueta: "Constelaciones" },
  { id: "CLUSTER", etiqueta: "Cúmulos" },
  { id: "NEBULA", etiqueta: "Nebulosas" },
  { id: "GALAXY", etiqueta: "Galaxias" },
  { id: "COSMIC_REFERENCE", etiqueta: "Centros cósmicos" },
]

const ORDENES: Array<{ id: Orden; etiqueta: string }> = [
  { id: "resonancia", etiqueta: "Mayor resonancia" },
  { id: "contactos", etiqueta: "Más contactos" },
  { id: "alfabetico", etiqueta: "Alfabético" },
  { id: "punto", etiqueta: "Por punto natal" },
  { id: "tipo", etiqueta: "Por tipo" },
]

function nivelResonancia(r: number): string {
  if (r >= UMBRAL_ALTA) return "Marcada"
  if (r >= UMBRAL_MEDIA) return "Presente"
  return "Tenue"
}

type Props = {
  carto: Cartografia
  seleccionado: string | null
  onSeleccionar: (id: string) => void
  onAbrir: (id: string) => void
  orden: Orden
  onOrden: (o: Orden) => void
  filtros: Filtros
  onFiltros: (f: Filtros) => void
}

export function VistaLista({
  carto, seleccionado, onSeleccionar, onAbrir, orden, onOrden, filtros, onFiltros,
}: Props) {
  const [abreFiltros, setAbreFiltros] = useState(false)

  const filas = useMemo(() => {
    let xs = carto.resonancias.map((r) => {
      const p = portalPorId(r.portalId)!
      return {
        r,
        portal: p,
        esencia: contenidoPortal(r.portalId)?.esencia ?? "",
        puntos: [...new Set(r.contactos.map((c) => c.punto))],
      }
    })

    if (filtros.tipos.length) {
      xs = xs.filter((x) => filtros.tipos.includes(x.portal.tipo))
    }
    if (filtros.puntos.length) {
      xs = xs.filter((x) => x.puntos.some((p) => filtros.puntos.includes(p)))
    }

    // El desempate siempre por identificador: el mismo nacimiento debe dar
    // siempre exactamente el mismo orden.
    const porId = (a: typeof xs[number], b: typeof xs[number]) =>
      a.r.portalId.localeCompare(b.r.portalId)

    switch (orden) {
      case "contactos":
        xs.sort((a, b) => b.r.contactos.length - a.r.contactos.length || porId(a, b))
        break
      case "alfabetico":
        xs.sort((a, b) => a.portal.nombre.localeCompare(b.portal.nombre, "es"))
        break
      case "tipo":
        xs.sort((a, b) => a.portal.tipo.localeCompare(b.portal.tipo) || porId(a, b))
        break
      case "punto": {
        const peso = (x: typeof xs[number]) => {
          const i = x.puntos
            .map((p) => ORDEN_PUNTOS.indexOf(p))
            .filter((n) => n >= 0)
          return i.length ? Math.min(...i) : 99
        }
        xs.sort((a, b) => peso(a) - peso(b) || porId(a, b))
        break
      }
      default:
        xs.sort((a, b) => b.r.resonancia - a.r.resonancia || porId(a, b))
    }
    return xs
  }, [carto, orden, filtros])

  const hayFiltros = filtros.tipos.length > 0 || filtros.puntos.length > 0

  const alternar = <T,>(lista: T[], v: T): T[] =>
    lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]

  return (
    <div className={s.lista}>
      <div className={s.listaBarra}>
        <label className={s.selectEnvoltura}>
          <span className="sr-only">Ordenar por</span>
          <select
            className={s.select}
            value={orden}
            onChange={(e) => onOrden(e.target.value as Orden)}
          >
            {ORDENES.map((o) => (
              <option key={o.id} value={o.id}>{o.etiqueta}</option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className={hayFiltros ? s.botonFiltroActivo : s.botonFiltro}
          onClick={() => setAbreFiltros((v) => !v)}
          aria-expanded={abreFiltros}
        >
          <SlidersHorizontal size={13} />
          Filtros{hayFiltros ? ` (${filtros.tipos.length + filtros.puntos.length})` : ""}
        </button>
      </div>

      {abreFiltros && (
        <div className={s.panelFiltros}>
          <p className={s.filtroTitulo}>Por tipo de objeto</p>
          <div className={s.chips}>
            {TIPOS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={filtros.tipos.includes(t.id) ? s.chipActivo : s.chip}
                onClick={() => onFiltros({ ...filtros, tipos: alternar(filtros.tipos, t.id) })}
              >
                {t.etiqueta}
              </button>
            ))}
          </div>

          <p className={s.filtroTitulo}>Por punto natal</p>
          <div className={s.chips}>
            {ORDEN_PUNTOS.map((p) => (
              <button
                key={p}
                type="button"
                className={filtros.puntos.includes(p) ? s.chipActivo : s.chip}
                onClick={() => onFiltros({ ...filtros, puntos: alternar(filtros.puntos, p) })}
              >
                {PUNTOS[p].nombre}
              </button>
            ))}
          </div>

          {hayFiltros && (
            <button type="button" className={s.limpiar} onClick={() => onFiltros(FILTROS_VACIOS)}>
              <X size={12} /> Quitar filtros
            </button>
          )}
        </div>
      )}

      {filas.length === 0 ? (
        <p className={s.vacio}>
          Ningún portal de tu cartografía cumple estos filtros. Quítalos para ver los{" "}
          {carto.resonancias.length} que sí tienen contacto.
        </p>
      ) : (
        <ol className={s.filas}>
          {filas.map((x, i) => (
            <li
              key={x.r.portalId}
              className={seleccionado === x.r.portalId ? s.filaActiva : s.fila}
            >
              <button
                type="button"
                className={s.filaCabecera}
                onClick={() => onSeleccionar(x.r.portalId)}
                aria-expanded={seleccionado === x.r.portalId}
              >
                <span className={s.filaNum}>{String(i + 1).padStart(2, "0")}</span>
                <span className={s.filaTextos}>
                  <span className={s.filaNombre}>{x.portal.nombre}</span>
                  <span className={s.filaEsencia}>{x.esencia}</span>
                  <span className={s.filaMeta}>
                    {etiquetaTipo(x.portal.tipo)} · {x.r.contactos.length}{" "}
                    {x.r.contactos.length === 1 ? "contacto" : "contactos"}
                  </span>
                </span>
                <span className={s.filaScore}>
                  <strong>{x.r.resonancia}</strong>
                  <em>{nivelResonancia(x.r.resonancia)}</em>
                </span>
              </button>

              {seleccionado === x.r.portalId && (
                <div className={s.filaDetalle}>
                  {x.r.contactos.map((c, j) => (
                    <div key={j} className={s.contactoLinea}>
                      <span className={s.contactoPunto}>{PUNTOS[c.punto].nombre}</span>
                      <ArrowRight size={11} aria-hidden />
                      <span className={s.contactoAncla}>{c.ancla.nombre}</span>
                      <span className={s.contactoDato}>
                        {ASPECTOS_CONTENIDO[c.aspecto].nombre.toLowerCase()} · {aGradosMinutos(c.orbe)}
                      </span>
                    </div>
                  ))}
                  <button type="button" className={s.primario} onClick={() => onAbrir(x.r.portalId)}>
                    Explorar <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      <p className={s.pieLista}>
        {carto.resonancias.length} de {carto.resumen.portalesTotales} portales tienen contacto
        con tu configuración. {EXPLICACION_SIN_CONTACTO}
      </p>
    </div>
  )
}
