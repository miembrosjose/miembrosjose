// API admin — eliminar un miembro por completo.
//
// DELETE /api/admin/members/<id>/eliminar
//
// ── POR QUÉ HACE FALTA ESTA RUTA ───────────────────────────────────────────
// Borrar al usuario desde el panel de Supabase no basta. Deja dos cabos:
//
//   1. La suscripción de Stripe sigue viva y sigue cobrando. Stripe es un
//      sistema externo: ninguna clave foránea ni ningún trigger de Postgres
//      puede tocarlo. Hace falta código que llame a su API.
//
//   2. Las tablas que guardan al miembro por CORREO —y no por user_id— no
//      tienen clave foránea hacia auth.users, así que Postgres no sabe que
//      están relacionadas y no las limpia.
//
// Esta ruta hace las tres cosas en el orden correcto.
//
// ── EL ORDEN IMPORTA ───────────────────────────────────────────────────────
// Primero Stripe, después las tablas por correo, y el usuario al final. Si se
// borrara el usuario antes, se perdería el correo y con él el vínculo hacia
// la suscripción: quedaría cobrando para siempre sin forma de encontrarla.
//
// ── QUÉ SE BORRA Y QUÉ NO ──────────────────────────────────────────────────
// El criterio: STRIPE ES EL REGISTRO CONTABLE. Las facturas, los cargos, los
// importes y el correo del cliente viven allí, no se pueden borrar, y ahí
// seguirán. Las tablas de aquí son una COPIA para poder enseñarle sus compras
// a la persona y darle acceso.
//
// Cuando se elimina a alguien no hay acceso que dar ni compras que enseñar:
// esa copia deja de tener función y lo único que hace es conservar su nombre,
// su teléfono y su correo sin motivo. Por eso se borra entera, incluidas
// `stripe_sales` y `account_invites`, que antes se trataban de forma
// incoherente —se guardaba la venta pero se borraba el puente hacia ella—.
//
// LA EXCEPCIÓN es `revoked_products`. No es contabilidad: es el registro de
// reembolsos, disputas y devoluciones, indexado por correo. Si se borrara,
// quien pidiera un reembolso podría eliminar su cuenta, registrarse otra vez
// con el mismo correo y recuperar el producto gratis. Se conserva.
//
// Tampoco se borra el Customer de Stripe: solo se cancela la suscripción, para
// que el historial de pagos siga teniendo nombre en su panel.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/server"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

/**
 * Tablas que guardan al miembro por correo y NO tienen clave foránea a
 * auth.users. Postgres no las limpia solo: hay que nombrarlas aquí.
 *
 * `revoked_products` NO está, y es a propósito: ver la cabecera.
 */
const TABLAS_POR_CORREO: Array<{ tabla: string; columna: string }> = [
  { tabla: "member_subscriptions", columna: "email" },
  { tabla: "member_sync_events", columna: "email" },
  { tabla: "account_invites", columna: "email" },
  { tabla: "email_send_log", columna: "email" },
  { tabla: "funnel_feedbacks", columna: "email" },
  // La copia local de las ventas. El original está en Stripe.
  { tabla: "stripe_sales", columna: "email" },
]

/**
 * Las mismas tablas, por si guardan el id en vez del correo.
 *
 * `stripe_sales` tiene ambas columnas: hay filas antiguas enlazadas solo por
 * correo y filas nuevas con user_id. Se barre por las dos para no dejar ni
 * unas ni otras.
 */
const TABLAS_POR_ID: Array<{ tabla: string; columna: string }> = [
  { tabla: "stripe_sales", columna: "user_id" },
]

type Resultado = {
  ok: boolean
  email: string
  stripe: {
    suscripcionCancelada: string | null
    yaEstabaCancelada: boolean
    error: string | null
  }
  tablasLimpiadas: Array<{ tabla: string; filas: number }>
  conservado: string[]
  usuarioBorrado: boolean
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Falta el id" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Prohibido" }, { status: 403 })

  const admin = getSupabaseAdmin()

  // ── Quién es ──
  const { data: encontrado, error: errBuscar } = await admin.auth.admin.getUserById(id)
  if (errBuscar || !encontrado?.user) {
    return NextResponse.json({ error: "Ese miembro no existe" }, { status: 404 })
  }
  const objetivo = encontrado.user
  const email = (objetivo.email || "").toLowerCase()

  // ── Dos protecciones ──
  // No se borra a un administrador, ni uno a sí mismo. Un panel que permite
  // quedarse sin administradores es un panel roto.
  if (objetivo.id === user.id) {
    return NextResponse.json(
      { error: "No puedes eliminar tu propia cuenta desde aquí." },
      { status: 400 },
    )
  }
  if (isAdmin(objetivo)) {
    return NextResponse.json(
      { error: "Esa cuenta es de administración. Quítale el rol antes de eliminarla." },
      { status: 400 },
    )
  }

  const resultado: Resultado = {
    ok: false,
    email,
    stripe: { suscripcionCancelada: null, yaEstabaCancelada: false, error: null },
    tablasLimpiadas: [],
    conservado: [],
    usuarioBorrado: false,
  }

  // ── 1 · Stripe, antes que nada ──
  // Si esto se dejara para después de borrar al usuario, se perdería el
  // correo y la suscripción se quedaría cobrando sin forma de localizarla.
  if (email) {
    const { data: suscripciones } = await admin
      .from("member_subscriptions")
      .select("stripe_subscription_id")
      .eq("email", email)

    const ids = [...new Set(
      (suscripciones || [])
        .map((s) => s.stripe_subscription_id as string | null)
        .filter((v): v is string => typeof v === "string" && v.length > 0),
    )]

    for (const subId of ids) {
      try {
        const stripe = getStripe()
        const sub = await stripe.subscriptions.retrieve(subId)
        if (sub.status === "canceled") {
          resultado.stripe.yaEstabaCancelada = true
          resultado.stripe.suscripcionCancelada = subId
        } else {
          // Cancelación inmediata, no al final del periodo: se está
          // eliminando la cuenta, no dando de baja una renovación.
          await stripe.subscriptions.cancel(subId)
          resultado.stripe.suscripcionCancelada = subId
        }
      } catch (e) {
        // Que Stripe falle NO debe dejar el borrado a medias, pero tampoco
        // puede pasar en silencio: se devuelve para que se vea en pantalla.
        resultado.stripe.error = e instanceof Error ? e.message : "Error desconocido de Stripe"
      }
    }
  }

  // Si Stripe falló, se para aquí. Borrar al usuario dejando una suscripción
  // viva es el peor de los desenlaces posibles: seguiría cobrando y ya no
  // habría a quién asociarla.
  if (resultado.stripe.error) {
    return NextResponse.json(
      {
        ...resultado,
        error:
          "No se pudo cancelar la suscripción en Stripe, así que no se ha borrado nada. " +
          "Cancélala a mano en el panel de Stripe y vuelve a intentarlo.",
      },
      { status: 502 },
    )
  }

  // ── 2 · Las tablas que van por correo ──
  if (email) {
    for (const { tabla, columna } of TABLAS_POR_CORREO) {
      // `.select()` tras un delete devuelve las filas borradas: contarlas es
      // la forma de saber cuántas había sin hacer una consulta previa.
      const { data, error } = await admin
        .from(tabla)
        .delete()
        .eq(columna, email)
        .select("*")

      // Una tabla que no existe en este proyecto no es un fallo: se salta.
      if (error) {
        if (/does not exist|schema cache/i.test(error.message)) continue
        console.error("[admin/members/eliminar] tabla=%s %s", tabla, error.message)
        continue
      }
      const filas = Array.isArray(data) ? data.length : 0
      if (filas > 0) resultado.tablasLimpiadas.push({ tabla, filas })
    }
  }

  // ── 2b · Lo que va por id en vez de por correo ──
  for (const { tabla, columna } of TABLAS_POR_ID) {
    const { data, error } = await admin
      .from(tabla)
      .delete()
      .eq(columna, id)
      .select("*")

    if (error) {
      if (/does not exist|schema cache/i.test(error.message)) continue
      console.error("[admin/members/eliminar] tabla=%s %s", tabla, error.message)
      continue
    }
    const filas = Array.isArray(data) ? data.length : 0
    if (filas > 0) {
      const ya = resultado.tablasLimpiadas.find((t) => t.tabla === tabla)
      if (ya) ya.filas += filas
      else resultado.tablasLimpiadas.push({ tabla, filas })
    }
  }

  // ── 3 · El usuario, al final ──
  // Todo lo que tiene clave foránea hacia auth.users cae solo con esto.
  const { error: errBorrar } = await admin.auth.admin.deleteUser(id)
  if (errBorrar) {
    return NextResponse.json(
      {
        ...resultado,
        error:
          "La suscripción se canceló y las tablas se limpiaron, pero el usuario no se pudo borrar: " +
          errBorrar.message,
      },
      { status: 500 },
    )
  }

  resultado.usuarioBorrado = true
  resultado.ok = true
  resultado.conservado = [
    "El historial de cobros en Stripe (facturas, cargos e importes). Es el registro contable, no se puede borrar y ahí seguirá.",
    "El Customer de Stripe: solo se canceló la suscripción, para que los pagos antiguos sigan teniendo nombre.",
    "revoked_products: el registro de reembolsos y disputas. Si se borrara, bastaría con eliminar la cuenta y volver a registrarse para recuperar un producto devuelto.",
  ]

  return NextResponse.json(resultado)
}
