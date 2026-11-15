// ═══════════════════════════════════════════════════════════════════════════
//  POR QUÉ A ESTA PERSONA NO LE LLEGAN LOS AVISOS
// ═══════════════════════════════════════════════════════════════════════════
//
//   GET /api/admin/push/persona?correo=alguien@ejemplo.com
//
// ── POR QUÉ HACE FALTA ────────────────────────────────────────────────────
// Una administradora tenía la aplicación instalada, los avisos activados, y
// no le llegaba ninguno. A los demás sí. Desde el panel no había NADA que
// mirar: los envíos salían, el servicio los aceptaba, y su teléfono estaba en
// silencio.
//
// Averiguarlo exigía consultas a mano a dos tablas y saber qué significa un
// 410. Eso no es un diagnóstico, es una tarde. Y mientras no exista, la
// conclusión razonable es «los avisos están rotos» cuando lo que está vacío
// es la suscripción de una sola persona.
//
// ── POR QUÉ ESTO SÍ SE PUEDE MIRAR Y LO DE LA INSTALACIÓN NO ──────────────
// La pantalla de al lado dice, con razón, que el estado de instalación de
// otro teléfono no se puede consultar: vive en el almacenamiento local de ese
// aparato y no viaja a ninguna parte.
//
// Las suscripciones de push son lo contrario. Viven en el servidor porque son
// LA DIRECCIÓN a la que se manda: sin ellas no habría a dónde enviar. Y cada
// envío deja escrito su resultado. Todo lo que hace falta ya estaba guardado;
// lo único que faltaba era enseñarlo.
//
// ── LO QUE NO DEVUELVE, NUNCA ─────────────────────────────────────────────
// Ni el endpoint ni las claves p256dh/auth. Son lo único sensible de esa
// tabla —con ellas se le pueden mandar avisos a alguien desde fuera— y no
// hacen falta para nada de lo que se ve en pantalla.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

type Dispositivo = {
  aparato: string
  activa: boolean
  motivo: string | null
  creado: string | null
  ultimoUso: string | null
}

type Envio = {
  cuando: string
  categoria: string | null
  titulo: string | null
  resultado: string | null
  http: number | null
}

/**
 * De la cadena larga del navegador, el nombre del aparato.
 *
 * No busca precisión: busca que en pantalla se lea «iPhone · Safari» en vez
 * de doscientos caracteres que nadie va a leer. Lo que importa es distinguir
 * un iPhone de un Android, porque las causas de que no llegue un aviso son
 * distintas en cada uno.
 */
function nombreDelAparato(ua: string | null): string {
  if (!ua) return "Aparato sin identificar"
  const u = ua.toLowerCase()
  const sistema =
    u.includes("iphone") ? "iPhone"
      : u.includes("ipad") ? "iPad"
        : u.includes("android") ? "Android"
          : u.includes("windows") ? "Windows"
            : u.includes("mac os") || u.includes("macintosh") ? "Mac"
              : "Sin identificar"
  const navegador =
    u.includes("edg/") ? "Edge"
      : u.includes("samsungbrowser") ? "Samsung Internet"
        : u.includes("firefox") ? "Firefox"
          : u.includes("chrome") ? "Chrome"
            : u.includes("safari") ? "Safari"
              : "Navegador sin identificar"
  return sistema + " · " + navegador
}

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const correo = (req.nextUrl.searchParams.get("correo") || "").trim().toLowerCase()
  if (!correo) {
    return NextResponse.json({ error: "Escribe el correo de la persona." }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  const { data: perfil } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .ilike("email", correo)
    .maybeSingle<{ id: string; email: string; full_name: string | null }>()

  if (!perfil) {
    return NextResponse.json({
      encontrada: false,
      veredicto: "No hay ninguna cuenta con ese correo. Comprueba cómo está escrito.",
    })
  }

  // ── SUS PREFERENCIAS ───────────────────────────────────────────────────
  // Un «no» explícito aquí hace que el envío la salte sin más, y eso no se ve
  // en ningún sitio: para quien manda, el aviso salió perfecto.
  let apagados: string[] = []
  try {
    const { data: cuenta } = await admin.auth.admin.getUserById(perfil.id)
    const push = (cuenta?.user?.user_metadata as {
      notification_prefs?: { push?: Record<string, boolean | undefined> }
    } | null)?.notification_prefs?.push
    if (push) {
      apagados = Object.entries(push).filter(([, v]) => v === false).map(([k]) => k)
    }
  } catch {
    // Si no se pueden leer, se dice todo lo demás igual. Un diagnóstico
    // incompleto sigue valiendo; uno que no sale, no.
  }

  const { data: subs } = await admin
    .from("push_subscriptions")
    // Sin endpoint, sin p256dh y sin auth. A propósito.
    .select("activa, motivo_baja, user_agent, created_at, last_used_at")
    .eq("user_id", perfil.id)
    .order("created_at", { ascending: false })
    .limit(30)

  const dispositivos: Dispositivo[] = (subs || []).map((s) => ({
    aparato: nombreDelAparato(s.user_agent as string | null),
    activa: s.activa === true,
    motivo: (s.motivo_baja as string | null) ?? null,
    creado: (s.created_at as string | null) ?? null,
    ultimoUso: (s.last_used_at as string | null) ?? null,
  }))

  const activos = dispositivos.filter((d) => d.activa)
  const muertos = dispositivos.filter((d) => !d.activa && d.motivo === "gone")

  const { data: envios } = await admin
    .from("push_envios")
    .select("created_at, categoria, titulo, resultado, http_status")
    .eq("user_id", perfil.id)
    .order("created_at", { ascending: false })
    .limit(12)

  const historial: Envio[] = (envios || []).map((e) => ({
    cuando: e.created_at as string,
    categoria: (e.categoria as string | null) ?? null,
    titulo: (e.titulo as string | null) ?? null,
    resultado: (e.resultado as string | null) ?? null,
    http: (e.http_status as number | null) ?? null,
  }))

  // ── EL VEREDICTO ───────────────────────────────────────────────────────
  // Una sola frase, con lo que hay que hacer dentro. Una lista de datos sin
  // conclusión obliga a quien mira a saberse ya la respuesta, que es justo lo
  // que no tiene.
  //
  // El orden va de lo que hace IMPOSIBLE que llegue a lo que solo lo hace
  // improbable.
  let veredicto: string
  if (dispositivos.length === 0) {
    veredicto =
      "Nunca ha activado los avisos en ningún dispositivo. Desde su teléfono: abrir la " +
      "aplicación instalada y activarlos en la campana. Ojo: el permiso del navegador " +
      "concedido no es lo mismo que la suscripción guardada, y en pantalla se parecen."
  } else if (activos.length === 0) {
    veredicto =
      "No tiene ningún dispositivo activo: " + muertos.length + " de los suyos están " +
      "apagados porque el servicio de Apple o de Google contestó que ya no existen (410). " +
      "Eso pasa al reinstalar la aplicación, al borrar los datos del navegador, o porque el " +
      "teléfono recicló la suscripción. No lo nota nadie: ella sigue viendo «activados». " +
      "Se arregla desde su teléfono, abriendo la aplicación instalada y volviendo a " +
      "activarlos en la campana."
  } else if (apagados.includes("comunicados") && apagados.includes("recordatorios")) {
    veredicto =
      "Tiene dispositivo activo, pero ha apagado los comunicados Y los recordatorios en " +
      "sus preferencias. Los envíos la saltan en silencio. Se cambia en su perfil."
  } else if (apagados.length > 0) {
    veredicto =
      "Tiene dispositivo activo, pero en sus preferencias ha apagado: " +
      apagados.join(", ") + ". Los avisos de esas categorías la saltan en silencio."
  } else if (historial.length === 0) {
    veredicto =
      "Tiene dispositivo activo y correcto, y no se le ha intentado mandar ningún aviso " +
      "todavía. No hay nada roto: no ha entrado en la audiencia de ningún envío."
  } else if (historial.some((h) => h.resultado === "ok")) {
    const ultimo = historial.find((h) => h.resultado === "ok")!
    veredicto =
      "Tiene dispositivo activo y el servicio de push ACEPTÓ su último aviso (" +
      new Date(ultimo.cuando).toLocaleString("es-419") + "). Desde el servidor está todo " +
      "bien, así que el corte está en el teléfono: permisos del sistema para la aplicación, " +
      "modo concentración o no molestar, ahorro de batería, o la aplicación abierta en " +
      "primer plano. En iPhone, además, los avisos solo llegan a la aplicación instalada en " +
      "la pantalla de inicio, nunca a una pestaña de Safari."
  } else {
    const fallo = historial.find((h) => h.resultado !== "ok")
    veredicto =
      "Tiene dispositivo activo, pero los envíos están fallando" +
      (fallo?.http ? " (respuesta " + fallo.http + " del servicio de push)" : "") +
      ". Eso es un fallo del envío, no del teléfono."
  }

  return NextResponse.json({
    encontrada: true,
    persona: { nombre: perfil.full_name || perfil.email, correo: perfil.email },
    apagados,
    dispositivos,
    envios: historial,
    veredicto,
  })
}
