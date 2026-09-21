// Selector de ARCHIVOS COMPLEMENTARIOS — Temporada 2 (Alina), episodios 1 a 6.
//
// Mismo criterio que la Temporada 1 (season1-archivos.ts): se casa por número
// de episodio O por palabras clave del título, para que renumerar o retocar un
// título no deje el archivo sin renderizar.
//
// Diferencia con la T1: allí el archivo es un objeto de datos que pinta
// EpisodioArchivo; aquí cada episodio tiene su propio módulo visual (SVG +
// estado), así que el selector devuelve el COMPONENTE ya montado.

import type { ReactNode } from "react"

import FlorDeLaVida from "@/components/archivo/FlorDeLaVida"
import ArquitecturaCosmica from "@/components/archivo/ArquitecturaCosmica"
import MapaDelSer from "@/components/archivo/MapaDelSer"
import MapaJerarquia from "@/components/archivo/MapaJerarquia"
import RuedaLeyes from "@/components/archivo/RuedaLeyes"
import RedConfederacion from "@/components/archivo/RedConfederacion"

export function getSeason2Archivo(num: number, title: string): ReactNode | null {
  const t = (title || "").toLowerCase()

  if (num === 1 || /fuente/.test(t)) return <FlorDeLaVida />
  if (num === 2 || /cosmos|universo|dimensi/.test(t)) return <ArquitecturaCosmica />
  if (num === 3 || /siete cuerpos|7 cuerpos|cuerpos/.test(t)) return <MapaDelSer />
  if (num === 4 || /jerarqu/.test(t)) return <MapaJerarquia />
  if (num === 5 || /leyes/.test(t)) return <RuedaLeyes />
  if (num === 6 || /confederaci/.test(t)) return <RedConfederacion />

  return null
}
