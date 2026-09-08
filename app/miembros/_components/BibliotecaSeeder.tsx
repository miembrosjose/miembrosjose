"use client"

// Sembrador de tarjetas "próximamente" de la Biblioteca (Razas Primarias,
// Sanación Extraterrestre). Se crean una vez (si eres admin y no existen) como
// productos normales → aparecen como tarjetas "Disponible a partir de…" y son
// editables desde Gestionar → Biblioteca (nombre, descripción, portada, fecha).
// Identidad por num estable para no duplicar al renombrar. No renderiza nada.

import { useEffect, useRef } from "react"
import { useProducts } from "../_lib/use-products"
import { useProductAccess } from "../_lib/use-product-access"

function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

const SEED = [
  { num: 93, key: "razas", name: "Razas Primarias", available_from: "Diciembre 2026", emoji: "🧬",
    description: "Las razas primarias y su papel en la historia de la Tierra y la Red." },
  { num: 94, key: "sanacion extraterrestre", name: "Sanación Extraterrestre", available_from: "Enero 2027", emoji: "💠",
    description: "Claves y prácticas de sanación de origen estelar para el cuerpo y el campo." },
]

export function BibliotecaSeeder() {
  const { products, loading, createProduct } = useProducts()
  const { isAdminOverride } = useProductAccess()
  const done = useRef(false)

  useEffect(() => {
    if (done.current || !isAdminOverride || loading) return
    const missing = SEED.filter((s) => !products.some((p) => p.num === s.num || norm(p.name).includes(s.key)))
    done.current = true
    if (missing.length === 0) return
    ;(async () => {
      for (const s of missing) {
        await createProduct({
          num: s.num, name: s.name, description: s.description,
          category: "biblioteca", gradient: "linear-gradient(135deg, #14142a 0%, #6D4A9B 100%)",
          emoji: s.emoji, sort_order: s.num, is_locked: false,
          available_from: s.available_from, price_cents: 0, currency: "usd",
        } as never).catch(() => { /* ignora fallos */ })
      }
    })()
  }, [isAdminOverride, loading, products, createProduct])

  return null
}
