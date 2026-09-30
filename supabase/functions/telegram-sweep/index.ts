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

import {
  clienteAdmin, clienteEmbudo, cargarPersona, deberiaEstarEn,
  telegram, log, type GrupoKey,
} from "../_shared/acceso.ts";

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
