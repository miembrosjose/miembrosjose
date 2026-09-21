// Selector de ARCHIVOS COMPLEMENTARIOS — Temporada 3 (Antarel), episodios 1 a 9.
// Cartografía de la memoria: la historia oculta de la Tierra dentro de la
// cosmología de Los 144.000.
//
// Mismo criterio que las temporadas 1 y 2: se casa por número de episodio O por
// palabras clave del título, para que renumerar o retocar un título no deje el
// archivo sin renderizar.

import type { ReactNode } from "react"

import PlanCosmico from "@/components/archivo/PlanCosmico"
import LemuriaRed from "@/components/archivo/LemuriaRed"
import ConflictoOrion from "@/components/archivo/ConflictoOrion"
import TransgresionAtlante from "@/components/archivo/TransgresionAtlante"
import PuenteSirioOrion from "@/components/archivo/PuenteSirioOrion"
import DosDirecciones from "@/components/archivo/DosDirecciones"
import FamiliasAtlantes from "@/components/archivo/FamiliasAtlantes"
import EspiralPrecesion from "@/components/archivo/EspiralPrecesion"
import RedIntraterrena from "@/components/archivo/RedIntraterrena"

export function getSeason3Archivo(num: number, title: string): ReactNode | null {
  const t = (title || "").toLowerCase()

  if (num === 1 || /plan c[oó]smico/.test(t)) return <PlanCosmico />
  if (num === 2 || /lemuria|\bmu\b/.test(t)) return <LemuriaRed />
  if (num === 3 || /guerras? de ori[oó]n/.test(t)) return <ConflictoOrion />
  if (num === 4 || /atlantes|transgresi[oó]n/.test(t)) return <TransgresionAtlante />
  if (num === 5 || /sirio/.test(t)) return <PuenteSirioOrion />
  if (num === 6 || /arcturian|pleyadian|arcturus/.test(t)) return <DosDirecciones />
  if (num === 7 || /familias/.test(t)) return <FamiliasAtlantes />
  if (num === 8 || /auge|ca[ií]da|espejo/.test(t)) return <EspiralPrecesion />
  if (num === 9 || /hermandad/.test(t)) return <RedIntraterrena />

  return null
}
