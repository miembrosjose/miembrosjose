// ═══════════════════════════════════════════════════════════════════════════
//  telegram-protocols-access
//  Abre la puerta del grupo «Protocolos de Contacto» a quien le corresponde.
// ═══════════════════════════════════════════════════════════════════════════
//
// ── EL ENLACE NO ES LA AUTORIZACIÓN ───────────────────────────────────────
// Lo único que hace un enlace de invitación es llevar a alguien hasta la
// puerta. Quien decide si pasa es el webhook, cuando llega la solicitud, y lo
// decide otra vez desde cero: usuario autenticado, telegram_user_id que
// coincide, membresía viva y Umbral alcanzado.
//
// Por eso el enlace dura cinco minutos y se anota aquí a nombre de una
// persona concreta. Si se comparte, el webhook lo rechaza.
//
// ── POR QUÉ NO SE AÑADE A NADIE DIRECTAMENTE ──────────────────────────────
// `creates_join_request: true` obliga a pasar por una solicitud que el bot
// aprueba o rechaza. Meter a alguien con addChatMember se saltaría la única
// comprobación que se hace con los datos frescos.

import {
  clienteAdmin, clienteEmbudo, cargarPersona, tieneAccesoProtocolos,
  telegram, log, colaDelEnlace,
} from "../_shared/acceso.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/** Cinco minutos. El tope que pidió la especificación. */
const VIGENCIA_MS = 5 * 60 * 1000;

// ── POR QUÉ HACE FALTA ESTO ───────────────────────────────────────────────
// A esta función la llama un NAVEGADOR, y antes de la petición de verdad el
// navegador manda una consulta previa (OPTIONS) preguntando si tiene permiso.
// Si nadie le contesta, la llamada se cae ANTES de ejecutar una sola línea:
// desde el otro lado se ve un error de red sin código ni cuerpo, y el botón
// solo puede enseñar un mensaje genérico. En los registros de la función no
// aparece nada, porque nunca llegó a entrar.
//
// `telegram-link-start` no lo necesitaba porque su envoltorio `withSupabase`
// ya lo resolvía por dentro. Esta va con `Deno.serve` a pelo, así que le toca.
//
// El origen queda abierto porque la autorización no depende de él: sin un JWT
// válido en la cabecera, aquí no entra nadie.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Respuesta JSON con las cabeceras que el navegador necesita ver. */
function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const admin = clienteAdmin();

    // ── DE DÓNDE SALE EL USUARIO ──────────────────────────────────────────
    // Igual que en telegram-link-start: `ctx.userClaims` llega VACÍO con los
    // tokens firmados con las claves asimétricas nuevas (ES256 con `kid`).
    // Aquí se va directo a preguntarle al servidor de Auth, que funciona con
    // los dos esquemas y es una llamada menos de adivinar.
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Usuario no identificado" }, 401);

    const auth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: authData } = await auth.auth.getUser(jwt);
    const userId = authData?.user?.id;
    if (!userId) return json({ error: "Usuario no identificado" }, 401);

    const persona = await cargarPersona(admin, userId);
    if (!persona) return json({ error: "Usuario no identificado" }, 401);

    log("protocols_access_requested", { user_id: userId, admin: persona.esAdmin });

    const grupoId = Deno.env.get("TELEGRAM_PROTOCOLS_GROUP_ID");
    if (!grupoId) {
      console.error("falta TELEGRAM_PROTOCOLS_GROUP_ID");
      return json({ error: "Configuración incompleta" }, 500);
    }

    // ── ¿PUEDE ENTRAR? ────────────────────────────────────────────────────
    let puede: boolean;
    try {
      puede = await tieneAccesoProtocolos(admin, clienteEmbudo(), persona);
    } catch {
      // Una caída del embudo no es «no tienes acceso». Decirlo así mandaría a
      // soporte a gente que sí paga.
      return json(
        { error: "No se pudo comprobar tu acceso ahora mismo. Inténtalo en unos minutos." },
        503,
      );
    }

    if (!puede) {
      log("protocols_access_denied", { user_id: userId });
      // El motivo se queda vago a propósito: detallar cuál de las dos
      // condiciones falla le dice a quien sondea cómo está construido esto.
      return json(
        {
          status: "not_eligible",
          error: "Todavía no tienes acceso a la comunidad de preparación. Se abre al completar la Temporada 4 con la membresía activa.",
        },
        403,
      );
    }

    // ── ¿TIENE TELEGRAM VINCULADO? ────────────────────────────────────────
    // Se reutiliza la vinculación que ya existe. No hay un segundo sistema:
    // si falta, el navegador manda a la persona por telegram-link-start, que
    // es el mismo camino del grupo general.
    const { data: vinculo } = await admin
      .from("telegram_memberships")
      .select("telegram_user_id")
      .eq("user_id", userId)
      .maybeSingle();

    const telegramUserId = vinculo?.telegram_user_id ?? null;
    if (!telegramUserId) {
      log("protocols_access_not_linked", { user_id: userId });
      return json({ status: "not_linked" });
    }

    // ── ¿YA ESTÁ DENTRO? ──────────────────────────────────────────────────
    // No se le genera una invitación que no necesita: cada una es un enlace
    // vivo durante cinco minutos, y no hay razón para crear enlaces de más.
    const { data: yaDentro } = await admin
      .from("telegram_group_memberships")
      .select("is_member")
      .eq("user_id", userId)
      .eq("group_key", "protocols")
      .maybeSingle();

    if (yaDentro?.is_member) {
      log("protocols_access_already_member", { user_id: userId });
      return json({ status: "already_member" });
    }

    // ── LA INVITACIÓN ─────────────────────────────────────────────────────
    const expiraEn = Date.now() + VIGENCIA_MS;

    const invite = await telegram("createChatInviteLink", {
      chat_id: grupoId,
      expire_date: Math.floor(expiraEn / 1000),
      creates_join_request: true,
      // Se ve solo para la administración del grupo. Los ocho primeros
      // caracteres del id bastan para saber de quién es sin escribirlo entero.
      name: `Protocolos ${userId.slice(0, 8)}`,
    });

    if (!invite.ok) {
      // Esto ya falló una vez en silencio en el grupo general y costó una
      // tarde averiguar por qué: el motivo se cuenta.
      console.error("createChatInviteLink:", JSON.stringify(invite));
      return json(
        { error: `No se pudo generar el acceso. Motivo: ${invite.description ?? "desconocido"}` },
        502,
      );
    }

    const enlace: string = invite.result.invite_link;

    const { error: errInvite } = await admin.from("telegram_invites").insert({
      user_id: userId,
      telegram_user_id: telegramUserId,
      group_key: "protocols",
      invite_link: enlace,
      expires_at: new Date(expiraEn).toISOString(),
    });

    // Si la invitación no queda anotada, el webhook NO la va a reconocer y
    // rechazaría a esta persona. Mejor revocarla y decirlo que mandarla a una
    // puerta que se le va a cerrar en la cara.
    if (errInvite) {
      console.error("telegram_invites insert:", errInvite.message);
      await telegram("revokeChatInviteLink", { chat_id: grupoId, invite_link: enlace });
      return json({ error: "No se pudo registrar tu acceso. Inténtalo otra vez." }, 500);
    }

    log("protocols_invite_created", {
      user_id: userId,
      telegram_user_id: telegramUserId,
      enlace: colaDelEnlace(enlace),
      expira: new Date(expiraEn).toISOString(),
    });

    return json({
      status: "ok",
      invite_url: enlace,
      telegram_url: enlace, // el navegador acepta cualquiera de los dos nombres
      expires_at: new Date(expiraEn).toISOString(),
    });
  } catch (error) {
    console.error(error);
    return json({ error: "Error interno" }, 500);
  }
});
