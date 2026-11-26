// GET /api/admin/subscriptions
//
// Datos para la pestaña admin de Suscripciones + Estado del sistema + métricas.
// Solo admins (requireAdmin, validación server-side). Usa el service role para
// leer TODAS las filas (member_subscriptions y member_sync_events tienen RLS que
// solo deja ver la propia fila; el admin necesita el conjunto completo).
//
// Nunca expone claves secretas. Los ids de Stripe se abrevian. No devuelve
// payloads sensibles de los eventos de sync.

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { LEGAL } from "@/lib/site/legal-config"
import { esColumnaQueNoExiste } from "@/app/api/internal/member-sync/regalo"
import { construirMeses } from "@/lib/admin/meses"
import { tipoDeAcceso } from "@/lib/admin/tipo-acceso"

const MAX_ROWS = 2000

function abbrev(id: string | null | undefined): string | null {
  if (!id) return null
  if (id.length <= 12) return id
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "private, no-store")
  return res
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const admin = getSupabaseAdmin()

  // ── Suscripciones ────────────────────────────────────────────────────
  //
  // Las cuatro columnas de regalo pueden no existir todavía: el código se
  // publica empujando a `main` y la migración la corre José cuando puede. Se
  // piden; si la base de datos aún no las tiene, se lee sin ellas y el panel
  // lo dice en vez de quedarse en blanco.
  const CAMPOS_BASE =
    "id, email, status, subscription_status, stripe_customer_id, stripe_subscription_id, current_period_end, created_at, updated_at"
  const CAMPOS_REGALO = "tipo_acceso, codigo_promocional, primer_pago, pago_real_at"

  let regaloDisponible = true
  let { data: subs, error: subsErr } = await admin
    .from("member_subscriptions")
    .select(`${CAMPOS_BASE}, ${CAMPOS_REGALO}`)
    .order("updated_at", { ascending: false })
    .limit(MAX_ROWS)

  if (subsErr && esColumnaQueNoExiste(subsErr)) {
    regaloDisponible = false
    const reintento = await admin
      .from("member_subscriptions")
      .select(CAMPOS_BASE)
      .order("updated_at", { ascending: false })
      .limit(MAX_ROWS)
    // El reintento trae las columnas base y ninguna de regalo, así que su
    // forma no es la de `subs`. La conversión es deliberada y es justo lo que
    // `regaloDisponible: false` le anuncia al panel: esas cuatro llegan
    // ausentes, y `tipoDeAcceso` devuelve null en vez de inventarse «pago».
    subs = reintento.data as typeof subs
    subsErr = reintento.error
  }

  if (subsErr) {
    console.error("[admin/subscriptions] stage=subs code=%s", subsErr.code || "db_error")
    return noStore(NextResponse.json({ error: "load_error" }, { status: 500 }))
  }

  const rows = (subs || []).map((s) => {
    const r = s as Record<string, unknown>
    return {
      // El id va al navegador a propósito: es lo que identifica la fila
      // cuando hay que cancelarla o borrarla. Buscarla por el correo
      // fallaba con las filas raras —una guardaba el texto
      // «TU-CORREO-DE-PRUEBA», en mayúsculas, y no había forma de darle.
      id: r.id as string,
      email: r.email as string,
      status: (r.status as string) || "pending",
      subscription_status: (r.subscription_status as string) || null,
      stripe_customer_id: abbrev(r.stripe_customer_id as string | null),
      stripe_subscription_id: abbrev(r.stripe_subscription_id as string | null),
      current_period_end: (r.current_period_end as string) || null,
      created_at: (r.created_at as string) || null,
      updated_at: (r.updated_at as string) || null,
      // Cómo entró. Sin la migración no hay dato, y eso NO es «pago»: es
      // «no se sabe». Decirlo así evita que el panel invente certezas.
      tipo_acceso: regaloDisponible ? ((r.tipo_acceso as string) || "pago") : null,
      codigo_promocional: (r.codigo_promocional as string) || null,
      primer_pago: r.primer_pago != null ? Number(r.primer_pago) : null,
      pago_real_at: (r.pago_real_at as string) || null,
    }
  })

  const counts = { active: 0, past_due: 0, canceled: 0, pending: 0 }
  // Las tres puertas se cuentan por separado. Las tres dan el mismo acceso;
  // lo que cambia es que dos de ellas todavía no son ingresos.
  let activosDeRegalo = 0
  let activosDePago = 0
  let activosEnPrueba = 0
  let regaloTotal = 0
  let pruebaTotal = 0
  for (const r of rows) {
    if (r.status === "active") counts.active++
    else if (r.status === "past_due") counts.past_due++
    else if (r.status === "canceled") counts.canceled++
    else counts.pending++

    const tipo = tipoDeAcceso(r)
    if (tipo === "regalo") regaloTotal++
    if (tipo === "prueba") pruebaTotal++
    if (r.status === "active") {
      if (tipo === "regalo") activosDeRegalo++
      else if (tipo === "prueba") activosEnPrueba++
      else activosDePago++
    }
  }
  const total = rows.length
  const price = Number(LEGAL.monthlyPrice)
  // El MRR cuenta SOLO a los activos que pagan. Ni el primer mes de regalo
  // ni los días de prueba de los invitados suman: todavía no han
  // pagado nada, y meterlos aquí sería inventarse ingresos.
  const mrrEstimate = Number.isFinite(price) ? +(activosDePago * price).toFixed(2) : null

  const summary = {
    total,
    ...counts,
    activosDeRegalo,
    activosDePago,
    activosEnPrueba,
    regaloTotal,
    pruebaTotal,
    regaloDisponible,
    currency: LEGAL.currency,
    mrrEstimate, // estimación bruta = activos que pagan × precio (sin comisiones ni impuestos)
  }

  // ── Corte mensual: quién entró y quién se fue, mes a mes ─────────────
  //
  // ── DE DÓNDE SALE CADA NÚMERO ────────────────────────────────────────
  // Las ALTAS salen de `created_at` de la propia fila: el día que esa
  // persona apareció por primera vez. Es un dato que no se mueve nunca.
  //
  // Las BAJAS no se pueden sacar de la fila, porque la fila solo guarda su
  // estado de HOY: si alguien se fue en marzo, la fila dice «cancelado» sin
  // decir cuándo. Por eso se cuentan los eventos de cancelación que mandó
  // el embudo, que sí llevan fecha.
  //
  // La consecuencia, y conviene saberla al leer la tabla: en los meses
  // anteriores a que existiera esa sincronización no hay bajas que contar,
  // y saldrán a cero aunque las hubiera.
  const { data: cancelaciones } = await admin
    .from("member_sync_events")
    .select("created_at")
    .eq("action", "cancel")
    .order("created_at", { ascending: false })
    .limit(5000)

  const meses = construirMeses(rows, cancelaciones || [])

  // ── Estado del sistema: member_sync_events ───────────────────────────
  const { data: syncRows, error: syncErr } = await admin
    .from("member_sync_events")
    .select("source_event_id, source_event_type, action, processing_status, created_at, completed_at, error_at")
    .order("created_at", { ascending: false })
    .limit(500)

  let sync: {
    failed: number
    processing: number
    completed: number
    lastSuccessAt: string | null
    recentFailures: { id: string | null; type: string | null; action: string | null; at: string | null }[]
    health: "operativo" | "requiere_atencion" | "sin_datos"
    available: boolean
  } = {
    failed: 0,
    processing: 0,
    completed: 0,
    lastSuccessAt: null,
    recentFailures: [],
    health: "sin_datos",
    available: true,
  }

  if (syncErr) {
    // La tabla podría no estar aplicada aún; no rompemos el panel.
    console.error("[admin/subscriptions] stage=sync code=%s", syncErr.code || "db_error")
    sync = { ...sync, available: false }
  } else {
    const list = syncRows || []
    for (const e of list) {
      const st = e.processing_status as string
      if (st === "failed") sync.failed++
      else if (st === "processing") sync.processing++
      else if (st === "completed") sync.completed++
    }
    const lastCompleted = list.find((e) => e.processing_status === "completed" && e.completed_at)
    sync.lastSuccessAt = (lastCompleted?.completed_at as string) || null
    sync.recentFailures = list
      .filter((e) => e.processing_status === "failed")
      .slice(0, 10)
      .map((e) => ({
        id: abbrev(e.source_event_id as string),
        type: (e.source_event_type as string) || null,
        action: (e.action as string) || null,
        at: (e.error_at as string) || (e.created_at as string) || null,
      }))
    sync.health = sync.failed > 0 ? "requiere_atencion" : list.length > 0 ? "operativo" : "sin_datos"
  }

  return noStore(NextResponse.json({ rows, summary, sync, meses }))
}
