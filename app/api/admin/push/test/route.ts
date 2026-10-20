// API — mandar un push de prueba A MIS PROPIOS dispositivos.
//
//   POST /api/admin/push/test   { title?, body?, url? }
//
// ── PARA QUÉ ES Y PARA QUÉ NO ──────────────────────────────────────────────
// Sirve para comprobar que la tecnología funciona de verdad: que un aviso sale
// del servidor, atraviesa el servicio de Apple o de Google, y aparece en un
// móvil con la aplicación CERRADA. Eso no se puede verificar de ninguna otra
// forma, y una notificación creada por la propia página no lo demuestra.
//
// NO es el módulo de envíos del panel. Ese llega en la fase 8, con
// destinatarios, programación e historial.
//
// ── POR QUÉ SOLO A UNO MISMO ───────────────────────────────────────────────
// Esta ruta no acepta destinatario. Manda siempre a quien la llama, y solo si
// es administración.
//
// Un endpoint de prueba que acepte un `user_id` es un endpoint que manda
// notificaciones a cualquiera en cuanto alguien descubra la dirección o se
// equivoque un día con el parámetro. Mientras no haya permisos por
// destinatario, control de frecuencia e historial —fase 8—, lo responsable es
// que no exista esa posibilidad.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin"
import { avisarAPersona } from "@/lib/push/repartir"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { title?: unknown; body?: unknown; url?: unknown } = {}
  try { body = await req.json() } catch { /* el cuerpo es opcional */ }

  const t = (v: unknown, max: number, fb: string) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : fb

  const resumen = await avisarAPersona(
    user.id,
    {
      title: t(body.title, 100, "Los 144.000"),
      body: t(body.body, 300, "La Red te alcanza aunque no estés mirando."),
      url: t(body.url, 500, "/miembros"),
      // Con la misma etiqueta, una prueba nueva reemplaza a la anterior en vez
      // de apilar diez avisos iguales en la pantalla.
      tag: "prueba-admin",
    },
    "prueba",
  )

  // Si no hay dispositivos no es un error del servidor, es que todavía no se
  // ha autorizado desde ninguno. Se dice con esas palabras para que no se
  // confunda con un fallo de envío.
  if (resumen.dispositivos === 0) {
    return NextResponse.json({
      ok: false,
      motivo: "sin_dispositivos",
      mensaje:
        "No hay ningún dispositivo suscrito con esta cuenta. Instala la aplicación en tu móvil y activa las notificaciones primero.",
      ...resumen,
    })
  }

  return NextResponse.json({ ok: resumen.entregados > 0, ...resumen })
}
