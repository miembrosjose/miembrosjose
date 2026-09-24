// API — las opciones de audiencia que existen de verdad.
//
//   GET /api/admin/comunicaciones/filtros
//
// ── POR QUÉ ESTO VIENE DEL SERVIDOR Y NO ESTÁ ESCRITO EN LA PANTALLA ───────
// Las insignias son un catálogo de más de cincuenta, con categorías y rangos,
// y crece. Una copia escrita a mano en el panel se queda desactualizada el día
// que se añada una, y el fallo no se ve: simplemente esa insignia no aparece
// como filtro y nadie sabe por qué.
//
// Viniendo de aquí, la lista es siempre la de verdad. Y las retiradas se
// quedan fuera: siguen existiendo para quien las ganó en su día, pero ofrecer
// un filtro por un grupo que ya no crece solo confunde.
//
// Los roles y las temporadas también salen de aquí, por coherencia: un solo
// sitio del que la pantalla pregunta «¿qué puedo ofrecer?».

import { NextResponse } from "next/server"
import { exigirAdmin } from "@/lib/comunicaciones/servidor"
import { FILTROS_DISPONIBLES } from "@/lib/comunicaciones/audiencia"

export const dynamic = "force-dynamic"

/**
 * Cómo se agrupan las insignias en la pantalla.
 *
 * Son muchas para una sola tira de pastillas. Agruparlas por lo que significan
 * —el camino, la comunidad, el tiempo, lo excepcional— convierte una lista de
 * cincuenta en cuatro listas de doce, que sí se leen.
 */
const GRUPOS: Record<string, string> = {
  progression: "Avance y logros",
  products: "Recursos y productos",
  agents: "Herramientas",
  community: "Comunidad",
  time: "Constancia",
  exclusive: "Excepcionales",
}

export async function GET() {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const porGrupo = new Map<string, Array<{ id: string; etiqueta: string }>>()
  for (const i of FILTROS_DISPONIBLES.insignias) {
    const grupo = GRUPOS[i.categoria] || "Otras"
    const lista = porGrupo.get(grupo) ?? []
    lista.push({ id: i.id, etiqueta: i.etiqueta })
    porGrupo.set(grupo, lista)
  }

  return NextResponse.json({
    ok: true,
    temporadas: FILTROS_DISPONIBLES.temporadas,
    roles: FILTROS_DISPONIBLES.roles,
    insignias: [...porGrupo.entries()].map(([grupo, items]) => ({ grupo, items })),
    total_insignias: FILTROS_DISPONIBLES.insignias.length,
  })
}
