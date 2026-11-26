// ═══════════════════════════════════════════════════════════════════════════
//  POST /api/admin/subscriptions/fila · cancelar o borrar una fila suelta
// ═══════════════════════════════════════════════════════════════════════════
//
//   Body: { email: string, accion: "cancelar" | "borrar" }
//   Solo administración.
//
// ── PARA QUÉ ES Y PARA QUÉ NO ─────────────────────────────────────────────
// Esto limpia la TABLA de suscripciones, nada más. No cancela en Stripe, no
// borra al usuario de Auth y no toca sus compras.
//
// Para eliminar a una persona de verdad ya existe otra herramienta
// (/api/admin/members/[id]/eliminar), que cancela en Stripe primero y luego
// limpia todo en el orden correcto. Esa es la buena cuando hay una persona
// detrás. Esta es para los restos: filas de prueba, correos que no son
// correos, cuentas que nunca llegaron a existir.
//
// ── LA REGLA QUE NO SE SALTA ──────────────────────────────────────────────
// `member_subscriptions` es la fuente de verdad del acceso, y el runbook es
// explícito: no se borran filas a mano. Así que aquí hay un freno duro —
// nunca se borra una fila ACTIVA que tenga una suscripción de Stripe viva.
//
// Borrarla sería lo peor de los dos mundos: la persona pierde el acceso en
// el acto, Stripe le sigue cobrando, y el siguiente evento de Stripe vuelve
// a crear la fila como si nada. Nadie entendería qué pasó.
//
// Para esas, la respuesta dice que se use la otra herramienta, que sí
// cancela el cobro.

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

type Accion = "cancelar" | "borrar"

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  let body: { id?: string; email?: string; accion?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const id = (body.id || "").trim()
  const email = (body.email || "").trim()
  const accion = body.accion as Accion
  if (!id && !email) return NextResponse.json({ error: "Falta la fila" }, { status: 400 })
  if (accion !== "cancelar" && accion !== "borrar") {
    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const CAMPOS = "id, email, status, stripe_subscription_id"

  // ── CÓMO SE ENCUENTRA LA FILA ───────────────────────────────────────────
  // Por el id, que es lo único que no depende de cómo esté escrito el
  // correo. Esto empezó buscando por correo y en minúsculas, porque todos
  // los correos se guardan así... todos menos los que no.
  //
  // Había una fila que guardaba el texto «TU-CORREO-DE-PRUEBA», en
  // mayúsculas y sin arroba. Al pasarlo a minúsculas no coincidía con nada,
  // el borrado decía «no hay ninguna fila con ese correo» y esa fila no se
  // podía quitar de ninguna manera.
  //
  // El correo se sigue aceptando por si quedara abierta una pestaña con la
  // versión anterior, y entonces se prueba tal cual y en minúsculas.
  // El tipo, con nombre y no con `typeof fila`. Escrito así, TypeScript
  // reducía `typeof fila` a `null` —el valor con el que se inicializa— y
  // todos los `fila.id` de abajo pasaban como accesos sobre `never`: seis
  // errores de tipo que el build no enseña, porque este proyecto tiene
  // `ignoreBuildErrors` puesto. Funcionaba por suerte, no por estar bien.
  type FilaSuscripcion = {
    id: string
    email: string
    status: string
    stripe_subscription_id: string | null
  }
  let fila: FilaSuscripcion | null = null
  let errorLectura: { code?: string } | null = null

  if (id) {
    const r = await admin.from("member_subscriptions").select(CAMPOS).eq("id", id).maybeSingle()
    fila = r.data as FilaSuscripcion | null
    errorLectura = r.error
  } else {
    const exacto = await admin.from("member_subscriptions").select(CAMPOS).eq("email", email).maybeSingle()
    fila = exacto.data as FilaSuscripcion | null
    errorLectura = exacto.error
    if (!fila && !errorLectura && email !== email.toLowerCase()) {
      const enMinusculas = await admin
        .from("member_subscriptions")
        .select(CAMPOS)
        .eq("email", email.toLowerCase())
        .maybeSingle()
      fila = enMinusculas.data as FilaSuscripcion | null
      errorLectura = enMinusculas.error
    }
  }

  if (errorLectura) {
    console.error("[subscriptions/fila] lectura code=%s", errorLectura.code || "db_error")
    return NextResponse.json({ error: "No se pudo leer esa fila." }, { status: 500 })
  }
  if (!fila) {
    return NextResponse.json({ error: "Esa fila ya no está." }, { status: 404 })
  }

  // ── CANCELAR ────────────────────────────────────────────────────────────
  // Marca la fila y corta el acceso. No toca Stripe a propósito: si la
  // suscripción sigue viva allí, el próximo evento la devolverá a activa, y
  // eso es correcto —Stripe manda—. Se avisa para que nadie lo lea como un
  // fallo de la plataforma.
  if (accion === "cancelar") {
    const { error } = await admin
      .from("member_subscriptions")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("id", fila.id)

    if (error) {
      console.error("[subscriptions/fila] cancelar code=%s", error.code || "db_error")
      return NextResponse.json({ error: "No se pudo cancelar." }, { status: 500 })
    }

    const viva = !!fila.stripe_subscription_id && fila.status === "active"
    return NextResponse.json({
      ok: true,
      mensaje: viva
        ? "Marcada como cancelada. Ojo: la suscripción sigue viva en Stripe, así que el próximo " +
          "cobro la devolverá a activa. Para cortarla de verdad, cancélala en Stripe."
        : "Marcada como cancelada. Esa cuenta ya no tiene acceso.",
    })
  }

  // ── BORRAR ──────────────────────────────────────────────────────────────
  const activaEnStripe = fila.status === "active" && !!fila.stripe_subscription_id
  if (activaEnStripe) {
    return NextResponse.json(
      {
        error:
          "Esa fila está activa y tiene una suscripción de Stripe viva: borrarla le quitaría el " +
          "acceso mientras le siguen cobrando, y el próximo evento de Stripe la recrearía. " +
          "Usa Gestionar miembros → eliminar, que cancela el cobro primero.",
      },
      { status: 409 },
    )
  }

  const { error } = await admin.from("member_subscriptions").delete().eq("id", fila.id)
  if (error) {
    console.error("[subscriptions/fila] borrar code=%s", error.code || "db_error")
    return NextResponse.json({ error: "No se pudo borrar." }, { status: 500 })
  }

  // Dicho con todas las letras: esto NO borra la cuenta de Auth. Si esa
  // persona existe, podrá seguir entrando a la pantalla de login — sin
  // membresía, pero existiendo. Para que desaparezca del todo está la otra
  // herramienta.
  return NextResponse.json({
    ok: true,
    mensaje:
      "Fila borrada de suscripciones. Si esa dirección tenía cuenta de acceso, la cuenta sigue " +
      "existiendo (sin membresía): para borrarla del todo, Gestionar miembros → eliminar.",
  })
}
