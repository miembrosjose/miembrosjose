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

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

// ═══════════════════════════════════════════════════════════════════════════
//  ▼▼▼  BLOQUE COMPARTIDO — GENERADO, NO EDITAR AQUÍ  ▼▼▼
//
//  Copia de supabase/functions/_shared/acceso.ts, incrustada porque el panel
//  de Supabase no resuelve imports entre carpetas.
//
//  Para cambiar algo de esto: edita _shared/acceso.ts y vuelve a correr
//  `node supabase/generar-autonomas.cjs`. Editarlo aquí deja esta función
//  diciendo una cosa y las otras dos diciendo otra.
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
//  QUIÉN PUEDE ENTRAR A CADA GRUPO · definición única
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ ESTO EXISTE ───────────────────────────────────────────────────
// La comprobación de membresía estaba escrita TRES veces, y no eran iguales:
// `telegram-sweep` y `telegram-webhook` tenían una `hasAccess()` idéntica sin
// salida para administración, y `telegram-link-start` la llevaba en línea CON
// esa salida.
//
// El resultado era una contradicción esperando su turno: un administrador
// podía generar su enlace en link-start, ser aprobado por el webhook —que no
// le daba paso por ser admin sino porque casualmente tenía suscripción— y
// ser expulsado por el barrido en cuanto dejara de tenerla.
//
// Aquí hay una sola definición. Si cambia, cambia para las cuatro.
//
// ── LA IDENTIDAD DE TELEGRAM ──────────────────────────────────────────────
// La autoritativa es `telegram_user_id`. Nunca el correo ni el @usuario: el
// primero se puede cambiar en el perfil y el segundo en Telegram, y los dos
// se pueden suplantar. El correo se usa SOLO para preguntarle al embudo si
// hay suscripción, que es otra cosa.


/** Los grupos que conoce el sistema. */
type GrupoKey = "general" | "protocols";

/** Lo que hace falta saber de una persona para decidir. */
type Persona = {
  userId: string;
  email: string;
  esAdmin: boolean;
};

function clienteAdmin(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function clienteEmbudo(): SupabaseClient {
  return createClient(
    Deno.env.get("EMBUDO_SUPABASE_URL")!,
    Deno.env.get("EMBUDO_SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * El correo y la condición de administrador, en UNA sola consulta.
 *
 * Antes cada comprobación llamaba a `getUserById` por su cuenta. Con dos
 * grupos eso son cuatro viajes por persona en cada pasada del barrido, y el
 * barrido recorre cientos.
 */
async function cargarPersona(
  admin: SupabaseClient,
  userId: string,
): Promise<Persona | null> {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data?.user) return null;

  return {
    userId,
    email: (data.user.email ?? "").toLowerCase(),
    esAdmin: (data.user.app_metadata as { is_admin?: boolean } | null)?.is_admin === true,
  };
}

/**
 * Membresía activa: lo mismo que ya decidía quién entra al grupo general.
 *
 * ── LA SALIDA PARA ADMINISTRACIÓN ────────────────────────────────────────
 * Sin ella, el dueño de la plataforma no puede comprobar que su propia
 * integración funciona sin contratarse una suscripción. Estaba solo en
 * link-start; ahora vale en las cuatro, que es lo que la hace coherente.
 *
 * ── POR QUÉ POR CORREO, Y QUÉ TIENE DE FRÁGIL ────────────────────────────
 * La suscripción vive en OTRA base —la del embudo— y el único dato que une
 * las dos es el correo. Quien lo cambie en su perfil deja de encontrarse.
 * Es una deuda conocida, no un descuido; se arregla el día que el embudo
 * guarde el user_id.
 */
async function tieneAccesoGeneral(
  embudo: SupabaseClient,
  persona: Persona,
): Promise<boolean> {
  if (persona.esAdmin) return true;
  if (!persona.email) return false;

  const { data: registro, error } = await embudo
    .from("embudo_registros")
    .select("subscription_status, current_period_end")
    .ilike("email", persona.email)
    .not("subscription_status", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Un fallo de la base NO es «no tiene acceso». Si se tratara como tal, una
  // caída del embudo vaciaría el grupo en el siguiente barrido.
  if (error) {
    console.error(JSON.stringify({ evento: "acceso_general_error", user_id: persona.userId, motivo: error.message }));
    throw new Error("embudo_no_disponible");
  }

  if (!registro) return false;

  const fin = registro.current_period_end ? new Date(registro.current_period_end) : null;
  if (fin === null || fin.getTime() <= Date.now()) return false;

  // ── POR QUÉ "canceled" TAMBIÉN ENTRA ──────────────────────────────────
  // Cancelar en Stripe no corta el servicio: lo corta al final del periodo ya
  // cobrado. Quien cancela el 29 de septiembre con el periodo pagado hasta el
  // 23 de octubre tiene tres semanas más, y las pagó.
  //
  // Esto antes solo aceptaba "active" y "trialing", así que el barrido echaba
  // del grupo a esa persona EL MISMO DÍA que cancelaba. La plataforma, en
  // cambio, la dejaba entrar: su puerta sí mira la fecha (ver
  // app/miembros/_lib/auth-server.ts). El resultado era gente fuera del
  // Telegram y dentro de la web, con motivo para pedir el dinero de vuelta.
  //
  // La fecha es la que manda. El estado solo dice si va a renovar.
  return ["active", "trialing", "canceled"].includes(registro.subscription_status);
}

/**
 * Haber llegado al Umbral del Contacto.
 *
 * No inventa nada: pregunta a `public.has_reached_umbral`, que transcribe la
 * regla de lib/insignias-ganadas.ts —Temporada 4 completa— y es la misma que
 * usa la interfaz para abrir la tarjeta.
 *
 * `umbral.enabled` NO entra aquí a propósito. Es el interruptor con el que la
 * administración publica la tarjeta, no un hecho sobre esta persona: si
 * entrara, despublicarla expulsaría gente del grupo en el siguiente barrido.
 */
async function haLlegadoAlUmbral(
  admin: SupabaseClient,
  persona: Persona,
): Promise<boolean> {
  if (persona.esAdmin) return true;

  const { data, error } = await admin.rpc("has_reached_umbral", { p_user_id: persona.userId });

  if (error) {
    console.error(JSON.stringify({ evento: "umbral_rpc_error", user_id: persona.userId, motivo: error.message }));
    throw new Error("umbral_no_disponible");
  }

  return data === true;
}

/** Protocolos exige las dos cosas. */
async function tieneAccesoProtocolos(
  admin: SupabaseClient,
  embudo: SupabaseClient,
  persona: Persona,
): Promise<boolean> {
  return (await tieneAccesoGeneral(embudo, persona)) && (await haLlegadoAlUmbral(admin, persona));
}

/** Lo que se espera de una persona en un grupo concreto. */
async function deberiaEstarEn(
  grupo: GrupoKey,
  admin: SupabaseClient,
  embudo: SupabaseClient,
  persona: Persona,
): Promise<boolean> {
  return grupo === "protocols"
    ? await tieneAccesoProtocolos(admin, embudo, persona)
    : await tieneAccesoGeneral(embudo, persona);
}

/** Llamada a la API de Telegram. */
async function telegram(method: string, body: unknown) {
  const r = await fetch(`https://api.telegram.org/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return await r.json();
}

/**
 * Registro estructurado. Una línea, un objeto, sin secretos.
 *
 * Los enlaces de invitación NO se registran enteros: llevan el token que
 * abre el grupo. Se guardan los últimos ocho caracteres, que bastan para
 * seguirle la pista a uno concreto en los registros sin regalarlo.
 */
function log(evento: string, datos: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ evento, ...datos }));
}

function colaDelEnlace(link: string | null | undefined): string {
  return link ? "…" + link.slice(-8) : "(sin enlace)";
}

// ═══════════════════════════════════════════════════════════════════════════
//  ▲▲▲  FIN DEL BLOQUE COMPARTIDO  ▲▲▲
// ═══════════════════════════════════════════════════════════════════════════

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
