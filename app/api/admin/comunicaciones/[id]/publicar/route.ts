// API — publicar una comunicación DENTRO de la plataforma.
//
//   POST /api/admin/comunicaciones/<id>/publicar
//
// ── POR QUÉ NO ES LA MISMA RUTA QUE «ENVIAR» ──────────────────────────────
// Porque no se parecen en nada más que en el botón. Enviar un correo habla
// con Resend, crea un Broadcast, calcula destinatarios, respeta preferencias
// y bajas, y puede fallar a medias dejando a unos con correo y a otros sin
// él. Publicar hacia dentro es poner una fecha en una columna.
//
// Meterlas en la misma ruta obligaría a que la de enviar —que es la delicada,
// la que mueve dinero y reputación— tuviera ramas para un caso que no se le
// parece. Esa es la clase de mezcla que acaba mandando un correo cuando
// alguien quería publicar un aviso.
//
// ── Y POR QUÉ NO CAMBIA EL `status` ───────────────────────────────────────
// `status` cuenta la vida del CORREO: borrador, programado, enviando,
// enviado. Una comunicación que solo va por dentro no tiene correo, y
// marcarla «enviada» diría que salió algo que nunca salió. Lo que cuenta si
// está publicada por dentro es `published_at`, y nada más.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { exigirAdmin, registrarEvento } from "@/lib/comunicaciones/servidor"

export const dynamic = "force-dynamic"

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const { id } = await ctx.params
  const admin = getSupabaseAdmin()

  const { data: c, error: errLeer } = await admin
    .from("communications")
    .select("id, canales, display_mode, published_at, interno_titulo, interno_cuerpo, heading, body, audiencia_hasta")
    .eq("id", id)
    .maybeSingle()

  if (errLeer) {
    if (/canales|published_at|does not exist|schema cache/i.test(errLeer.message)) {
      return NextResponse.json({
        error: "Falta correr docs/sql/comunicaciones_03_internas.sql en Supabase.",
      }, { status: 503 })
    }
    console.error("[comunicaciones] publicar · leer:", errLeer.message)
    return NextResponse.json({ error: "No se pudo leer" }, { status: 500 })
  }
  if (!c) return NextResponse.json({ error: "No existe" }, { status: 404 })

  const canales = (c.canales as string[] | null) ?? []
  if (!canales.includes("interno")) {
    return NextResponse.json(
      { error: "Esta comunicación no va por dentro de la plataforma. Marca ese canal primero." },
      { status: 409 },
    )
  }

  // Publicar dos veces no vuelve a publicar. La fecha es la de la primera
  // vez: si se moviera, los avisos que ya se habían visto volverían arriba
  // del centro de avisos como si fueran nuevos.
  if (c.published_at) {
    return NextResponse.json({ ok: true, yaEstaba: true, published_at: c.published_at })
  }

  // ── NO SE PUBLICA LO QUE NO TIENE NADA QUE DECIR ───────────────────────
  // Una comunicación vacía publicada es una fila en el centro de avisos de
  // setenta personas que al abrirla no dice nada. Y si es de las que
  // interrumpen, es una ventana en blanco que hay que cerrar.
  const titulo = (c.interno_titulo || c.heading || "").trim()
  const cuerpo = (c.interno_cuerpo || c.body || "").trim()
  if (!titulo) {
    return NextResponse.json({ error: "Falta el titular. Es lo que se lee primero." }, { status: 400 })
  }
  if (!cuerpo) {
    return NextResponse.json({ error: "Falta el texto." }, { status: 400 })
  }

  // ── EL CORTE DE AUDIENCIA, SI NO SE PUSO ───────────────────────────────
  //
  // Cuando la comunicación interrumpe y nadie ha dicho hasta dónde llega, se
  // pone AHORA. Es lo que evita que quien se registre dentro de seis meses se
  // encuentre con una ventana que habla de algo que pasó.
  //
  // Para las normales no se pone nada: un aviso que espera en el centro de
  // avisos lo puede leer quien llegue después sin que estorbe.
  const esBloqueante = c.display_mode === "modal_once"
  const corte = c.audiencia_hasta ?? (esBloqueante ? new Date().toISOString() : null)

  const { data, error } = await admin
    .from("communications")
    .update({ published_at: new Date().toISOString(), audiencia_hasta: corte })
    .eq("id", id)
    // Que no se publique dos veces aunque lleguen dos peticiones a la vez:
    // la segunda no encuentra fila que cumpla y no hace nada.
    .is("published_at", null)
    .select("published_at, audiencia_hasta")
    .maybeSingle()

  if (error) {
    console.error("[comunicaciones] publicar:", error.message)
    return NextResponse.json({ error: "No se pudo publicar" }, { status: 500 })
  }
  if (!data) {
    // Alguien se adelantó entre la lectura y la escritura.
    return NextResponse.json({ ok: true, yaEstaba: true })
  }

  await registrarEvento(id, g.user.id, "updated", {
    accion: "publicada_dentro",
    display_mode: c.display_mode,
    audiencia_hasta: data.audiencia_hasta,
  })

  return NextResponse.json({ ok: true, ...data })
}
