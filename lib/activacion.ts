// ═══════════════════════════════════════════════════════════════════════════
//  LA INVITACIÓN PARA ENTRAR POR PRIMERA VEZ
// ═══════════════════════════════════════════════════════════════════════════
//
// Lo que recibe alguien que acaba de activarse en el embudo. Lo pide
// `member-sync` cuando llega una activación, y también el botón de probar el
// alta del panel de administración.
//
// ── POR QUÉ NO LA MANDA SUPABASE ──────────────────────────────────────────
// La mandaba, con `inviteUserByEmail`, y traía los mismos tres problemas que
// ya habían obligado a sacar de ahí el correo de «he olvidado mi contraseña»:
//
//   1. El enlace de la plantilla de fábrica pasa por /auth/v1/verify, que
//      GASTA el token nada más abrirlo. Los antivirus de correo y los
//      previsualizadores abren los enlaces antes que la persona. Cuando ella
//      pulsa, ya está usado — y el mensaje de «usado» es idéntico al de
//      «caducado». Una invitación gastada así dejó fuera a alguien el 6 de
//      noviembre de 2026, y volvió a pasar en las pruebas del 25 de
//      noviembre: «me está enviando directamente a este enlace ha expirado».
//
//   2. El servidor de correo de fábrica manda DOS correos por hora para todo
//      el proyecto, y cuando se pasa no envía y no avisa. Con veinte altas
//      seguidas en un encuentro presencial, dieciocho personas se quedan sin
//      correo y nadie se entera.
//
//   3. Era el último correo de la plataforma que no quedaba registrado en
//      `email_send_log`. Si no salía, no había dónde verlo.
//
// Ahora el enlace lo genera la plataforma con la clave de servicio
// (`generateLink` NO manda correo), el correo sale por Resend como todos los
// demás, y el enlace apunta a /recuperar-acceso/confirmar, que no consume el
// token al abrirse: solo enseña un botón. Los escáneres no pulsan botones.
//
// ── LO QUE NO CAMBIA ──────────────────────────────────────────────────────
// Dónde acaba la persona: /activar-cuenta, igual que siempre. Y que a quien
// ya tiene cuenta no se le manda nada, que es lo correcto y lo de antes.

import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { enviarInvitacionDeActivacion } from "@/lib/email/invitacion-activacion"

/** Donde la persona crea su contraseña, al final del camino. */
export const RUTA_ACTIVAR_CUENTA = "/activar-cuenta"

/** La pantalla intermedia, la que no gasta el token al abrirse. */
const RUTA_CONFIRMACION = "/recuperar-acceso/confirmar"

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_MIEMBROS_URL || "https://los144000.com"
}

/**
 * La dirección completa de la pantalla de activación.
 *
 * Supabase solo redirige aquí si está en su lista de direcciones permitidas
 * (Authentication → URL Configuration). Con el camino de ahora el enlace lo
 * construimos nosotros, así que esto ya no es imprescindible — pero sigue
 * declarándose para que `generateLink` no invente otro destino.
 */
export const URL_ACTIVAR_CUENTA = `${baseUrl()}${RUTA_ACTIVAR_CUENTA}`

export type ResultadoInvitacion =
  | { estado: "enviada" }
  /** Ya tiene cuenta: Supabase no invita, y está bien que no lo haga. */
  | { estado: "ya_tiene_cuenta" }
  /** Se generó el enlace pero el correo no salió. Hay detalle. */
  | { estado: "no_enviada"; detalle: string }
  /** Ni siquiera se pudo generar el enlace. Hay detalle. */
  | { estado: "sin_enlace"; detalle: string }

/** ¿Este error de Supabase significa «esa cuenta ya existe»? */
function yaTieneCuenta(error: { status?: number; code?: string; message?: string }): boolean {
  const code = error.code || ""
  const msg = (error.message || "").toLowerCase()
  return (
    code === "email_exists" ||
    error.status === 422 ||
    msg.includes("already been registered") ||
    msg.includes("already registered") ||
    msg.includes("already exists")
  )
}

/**
 * Manda la invitación para crear la cuenta.
 *
 * No lanza nunca: devuelve qué pasó. Quien llama decide si eso es un fallo
 * del que haya que enterarse — en `member-sync` sí lo es, porque conviene
 * reintentarlo; en el botón de prueba del panel solo hay que enseñarlo.
 */
export async function invitarAActivarCuenta(email: string): Promise<ResultadoInvitacion> {
  const admin = getSupabaseAdmin()

  // `generateLink` crea el usuario si no existe y devuelve el token SIN
  // mandar ningún correo. Es la única forma de quedarnos con el envío.
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo: URL_ACTIVAR_CUENTA },
  })

  if (error) {
    if (yaTieneCuenta(error as { status?: number; code?: string; message?: string })) {
      return { estado: "ya_tiene_cuenta" }
    }
    return { estado: "sin_enlace", detalle: error.message || "no se pudo generar el enlace" }
  }

  const token = data?.properties?.hashed_token
  if (!token) {
    return { estado: "sin_enlace", detalle: "Supabase no devolvió token" }
  }

  const enlace =
    `${baseUrl()}${RUTA_CONFIRMACION}` +
    `?token_hash=${encodeURIComponent(token)}` +
    `&type=invite` +
    `&next=${encodeURIComponent(RUTA_ACTIVAR_CUENTA)}`

  const enviado = await enviarInvitacionDeActivacion({ email, enlace })
  if (!enviado.ok) {
    return { estado: "no_enviada", detalle: enviado.error || "Resend no lo mandó" }
  }

  return { estado: "enviada" }
}
