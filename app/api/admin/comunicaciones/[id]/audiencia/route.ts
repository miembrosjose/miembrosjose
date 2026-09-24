// API — el ensayo de audiencia.
//
//   GET /api/admin/comunicaciones/<id>/audiencia
//
// Responde a la única pregunta que hay que poder contestar antes de enviar:
// ¿a cuántas personas le va a llegar esto, y quién se queda fuera y por qué?
//
// ── SE CUENTA ENTERO EN EL SERVIDOR ────────────────────────────────────────
// Lo que sale de aquí son cifras y motivos. Ni una dirección de correo viaja
// al navegador. Con ochocientos miembros daría casi igual; con veinte mil sería
// la diferencia entre una pantalla que responde y una que se cuelga, y además
// no hay ninguna razón para que el portátil de administración tenga en memoria
// el correo de toda La Red solo para enseñar un número.
//
// ── ES EL MISMO CÁLCULO QUE EL DEL ENVÍO ───────────────────────────────────
// `resolverAudiencia` es la función que decide quién entra, y es la que usa el
// envío. No hay una cuenta «de muestra» y otra «de verdad»: el número que se
// enseña aquí es exactamente la cantidad de gente a la que se le va a escribir.

import { NextRequest, NextResponse } from "next/server"
import { exigirAdmin, leerComunicacion, registrarEvento } from "@/lib/comunicaciones/servidor"
import { contarAudiencia, etiquetaPreferencia } from "@/lib/comunicaciones/audiencia"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const { id } = await ctx.params
  const c = await leerComunicacion(id)
  if (!c) return NextResponse.json({ error: "No existe" }, { status: 404 })

  try {
    const resumen = await contarAudiencia(c.audience, c.type)

    // Se guarda lo calculado. Si el envío ocurre después, el resumen final
    // enseña esta misma cifra y no otra hecha en otro momento.
    await registrarEvento(id, g.user.id, "audience_checked", {
      destinatarios: resumen.destinatarios,
      excluidos: resumen.excluidos,
    })

    return NextResponse.json({
      ok: true,
      resumen: {
        ...resumen,
        // Qué interruptor del perfil gobierna este envío, dicho con las
        // mismas palabras que ve el miembro en su perfil.
        preferenciaEtiqueta: etiquetaPreferencia(resumen.preferencia),
      },
    })
  } catch (e) {
    console.error("[comunicaciones] audiencia:", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "No se pudo calcular la audiencia" }, { status: 500 })
  }
}
