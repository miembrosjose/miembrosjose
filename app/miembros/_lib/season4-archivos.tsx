// Selector de ARCHIVOS COMPLEMENTARIOS — Temporada 4 (Ivika), episodios 1 a 7.
// Memoria solar: cómo la memoria descendió a la historia visible y desembocó
// en el mensaje primordial del perdón.
//
// Mismo criterio que las temporadas anteriores: se casa por número de episodio
// O por palabras clave del título.

import type { ReactNode } from "react"

import DiscosSolares from "@/components/archivo/DiscosSolares"
import ZiguratSumeria from "@/components/archivo/ZiguratSumeria"
import NiloIniciatico from "@/components/archivo/NiloIniciatico"
import CaminoAbraham from "@/components/archivo/CaminoAbraham"
import PuenteMoisesEsenio from "@/components/archivo/PuenteMoisesEsenio"
import CodigoJesus from "@/components/archivo/CodigoJesus"
import MensajePrimordial from "@/components/archivo/MensajePrimordial"

export function getSeason4Archivo(num: number, title: string): ReactNode | null {
  const t = (title || "").toLowerCase()

  if (num === 1 || /discos? solar/.test(t)) return <DiscosSolares />
  if (num === 2 || /sumeria|mesopotamia/.test(t)) return <ZiguratSumeria />
  if (num === 3 || /egipto|nilo/.test(t)) return <NiloIniciatico />
  if (num === 4 || /abraham|pacto/.test(t)) return <CaminoAbraham />
  if (num === 5 || /mois[eé]s|esenio/.test(t)) return <PuenteMoisesEsenio />
  if (num === 6 || /jes[uú]s/.test(t)) return <CodigoJesus />
  if (num === 7 || /mensaje primordial|primordial/.test(t)) return <MensajePrimordial />

  return null
}
