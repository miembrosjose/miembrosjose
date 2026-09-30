// ═══════════════════════════════════════════════════════════════════════════
//  telegram-sweep · el barrido diario
// ═══════════════════════════════════════════════════════════════════════════
//
// Lo llama pg_cron a las 09:00 UTC. Recorre quién está dentro de cada grupo,
// comprueba si le sigue correspondiendo, y echa a quien ya no.
//
// ── QUÉ CAMBIÓ AL AÑADIR PROTOCOLOS ───────────────────────────────────────
// Antes recorría `telegram_memberships` —una fila por persona, un booleano—
// y el chat era una constante del módulo. Ahora recorre
// `telegram_group_memberships`, que tiene una fila POR PERSONA Y GRUPO y
// guarda su propio chat id.
//
// De ahí sale solo el comportamiento que se pedía: quien pierde la membresía
// sale de los dos grupos porque tiene dos filas y las dos fallan la
// comprobación; quien conserva la membresía pero pierde el Umbral sale
// únicamente de Protocolos, porque la fila del general sigue estando bien.
// No hay ninguna regla especial escrita en ningún sitio.
//
// ── EL FALLO QUE SE ARREGLA ───────────────────────────────────────────────
// Cuando `banChatMember` fallaba, se anotaba el fallo y EL CÓDIGO SEGUÍA:
// desbaneaba, marcaba la persona como fuera, le mandaba el mensaje de
// despedida y la contaba como expulsada.
//
// Si el fallo era «el bot perdió permisos de administrador», la base pasaba a
// decir que esa persona salió cuando seguía dentro. Y como el barrido solo
// mira a quien consta dentro, ya no volvía a revisarla nunca: quedaba dentro
// para siempre, sin membresía y sin que nadie lo supiera.
//
// Ahora un ban fallido corta el paso: no se desbanea, no se escribe, no se
// avisa, no se cuenta. La base solo dice que alguien salió cuando Telegram lo
// confirmó.

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

// Cuántas filas se revisan por pasada. Antes eran 200 personas; ahora son
// filas, y cada persona puede tener dos. El tope existe para que una lista
// larga no agote el tiempo de ejecución a mitad y deje el barrido hecho por
// la mitad sin saberlo.
const POR_PASADA = 400;

const DESPEDIDA: Record<GrupoKey, string> = {
  general:
    "Tu membresía de Los 144.000 ha terminado, así que tu acceso a la comunidad de Telegram se ha cerrado.\n\n" +
    "Puedes volver cuando quieras: reactiva tu membresía en los144000.com y pulsa de nuevo el botón de Telegram.",
  // Aquí el motivo puede ser otro —seguir pagando pero no cumplir ya el
  // Umbral— así que el mensaje no da por hecho que se canceló nada.
  protocols:
    "Tu acceso a Protocolos de Contacto se ha cerrado.\n\n" +
    "Se abre con la membresía activa y la Temporada 4 completa. Cuando vuelvas a cumplirlo, entra en los144000.com y pulsa de nuevo el botón del Umbral del Contacto.",
};

type Fila = {
  user_id: string;
  group_key: GrupoKey;
  telegram_chat_id: number;
};

Deno.serve(async (req) => {
  // ── QUIÉN PUEDE LLAMAR A ESTO ─────────────────────────────────────────
  // Nadie desde fuera. Esta función expulsa gente de un grupo, así que no
  // puede quedar abierta a quien descubra la dirección.
  //
  // La protege la propia pasarela de Supabase: la función se despliega CON
  // verificación de JWT (al revés que el webhook de Telegram, que la lleva
  // apagada porque Telegram no puede mandar uno). El cron la llama con la
  // clave de servicio, que sí es un token válido.
  try {
    const dryRun = new URL(req.url).searchParams.get("dry") === "1";

    const supabase = clienteAdmin();
    const embudo = clienteEmbudo();

    const { data: filas, error } = await supabase
      .from("telegram_group_memberships")
      .select("user_id, group_key, telegram_chat_id")
      .eq("is_member", true)
      .limit(POR_PASADA);

    if (error) {
      console.error("leer miembros:", error);
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }

    // ── POR QUÉ DOS CONSULTAS Y NO UN JOIN ────────────────────────────────
    // El telegram_user_id vive en la tabla de identidad. Pedirlo embebido
    // —`telegram_memberships!inner(...)`— exige una clave foránea ENTRE las
    // dos tablas para que PostgREST sepa relacionarlas, y no la hay: la
    // pertenencia apunta a auth.users, no a la identidad.
    //
    // Se podría añadir esa clave, pero obligaría a que la migración no deje
    // ni una fila huérfana para poder crearse. Dos consultas cuestan un viaje
    // más por pasada y no pueden fallar al desplegar.
    const identidades = new Map<string, number | null>();
    const ids = [...new Set((filas ?? []).map((f) => f.user_id))];

    if (ids.length) {
      const { data: vinculos } = await supabase
        .from("telegram_memberships")
        .select("user_id, telegram_user_id")
        .in("user_id", ids);

      for (const v of vinculos ?? []) {
        identidades.set(v.user_id as string, (v.telegram_user_id as number | null) ?? null);
      }
    }

    // Contadores POR GRUPO. Con los planos de antes, un fallo en Protocolos y
    // uno en el general se veían igual, y no había forma de saber cuál se
    // rompió mirando el resumen del cron.
    const cuenta: Record<GrupoKey, { revisados: number; expulsados: number; fallidos: number; indeterminados: number }> = {
      general:   { revisados: 0, expulsados: 0, fallidos: 0, indeterminados: 0 },
      protocols: { revisados: 0, expulsados: 0, fallidos: 0, indeterminados: 0 },
    };

    for (const bruta of (filas ?? []) as unknown as Fila[]) {
      const grupo = bruta.group_key;
      const telegramUserId = identidades.get(bruta.user_id) ?? null;
      cuenta[grupo].revisados++;

      // Sin cuenta de Telegram vinculada no hay a quién echar. No es un
      // fallo: es una fila que no debería estar marcada como dentro.
      if (!telegramUserId) continue;

      const persona = await cargarPersona(supabase, bruta.user_id);
      if (!persona) continue;

      let deberia: boolean;
      try {
        deberia = await deberiaEstarEn(grupo, supabase, embudo, persona);
      } catch {
        // El embudo no contestó. NO se expulsa: una caída ajena no puede
        // vaciar un grupo. Se cuenta y se revisará mañana.
        cuenta[grupo].indeterminados++;
        log("sweep_indeterminado", { user_id: bruta.user_id, grupo });
        continue;
      }

      if (deberia) continue;

      // En modo ensayo se anota a quién se echaría, pero no se echa a nadie.
      // Es la única forma responsable de estrenar algo que expulsa gente.
      if (dryRun) {
        cuenta[grupo].expulsados++;
        continue;
      }

      // ── ECHAR NO ES BANEAR ──────────────────────────────────────────
      // Telegram solo sabe sacar a alguien baneándolo. Si se deja así, esa
      // persona NO puede volver aunque renueve mañana — y eso convierte una
      // baja temporal en una pérdida definitiva.
      //
      // Banear y desbanear acto seguido es la forma correcta de echar: sale
      // del grupo y queda libre para volver a entrar por la puerta normal.
      const ban = await telegram("banChatMember", {
        chat_id: String(bruta.telegram_chat_id),
        user_id: telegramUserId,
      });

      // Aquí estaba el fallo. Si Telegram no confirma, no se toca nada más:
      // la fila se queda marcada como dentro y mañana se vuelve a intentar.
      if (!ban.ok) {
        console.error(JSON.stringify({ evento: "sweep_ban_fallido", grupo, user_id: bruta.user_id, motivo: ban.description ?? null }));
        cuenta[grupo].fallidos++;
        continue;
      }

      await telegram("unbanChatMember", {
        chat_id: String(bruta.telegram_chat_id),
        user_id: telegramUserId,
        only_if_banned: true,
      });

      const ahora = new Date().toISOString();

      await supabase
        .from("telegram_group_memberships")
        .update({ is_member: false, removed_at: ahora, updated_at: ahora })
        .eq("user_id", bruta.user_id)
        .eq("group_key", grupo);

      // La tabla vieja se mantiene al día mientras dure el traspaso, para que
      // volver atrás siga siendo posible. Solo la toca el grupo general: la
      // columna nunca supo de Protocolos.
      if (grupo === "general") {
        await supabase
          .from("telegram_memberships")
          .update({ is_in_telegram: false, telegram_removed_at: ahora, updated_at: ahora })
          .eq("user_id", bruta.user_id);
      }

      // Se le explica. Alguien que desaparece de un grupo sin aviso da por
      // hecho que lo echaron a dedo, y eso llega como queja en vez de como
      // renovación.
      //
      // Si tiene al bot bloqueado esto falla; da igual, no se comprueba.
      await telegram("sendMessage", {
        chat_id: telegramUserId,
        text: DESPEDIDA[grupo],
      });

      cuenta[grupo].expulsados++;
      log(grupo === "protocols" ? "protocols_reconciliation_removed" : "general_reconciliation_removed", {
        user_id: bruta.user_id,
        grupo,
      });
    }

    const resumen = {
      ok: true,
      dryRun,
      revisados: cuenta.general.revisados + cuenta.protocols.revisados,
      general: cuenta.general,
      protocols: cuenta.protocols,
    };
    console.log("[telegram-sweep]", JSON.stringify(resumen));

    return Response.json(resumen);
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false }, { status: 500 });
  }
});
