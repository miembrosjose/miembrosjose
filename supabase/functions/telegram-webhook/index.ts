// ═══════════════════════════════════════════════════════════════════════════
//  telegram-webhook · lo que Telegram le cuenta al bot
// ═══════════════════════════════════════════════════════════════════════════
//
// ── QUÉ CAMBIÓ AL AÑADIR PROTOCOLOS ───────────────────────────────────────
// El manejador de `chat_join_request` empezaba con una salida temprana:
//
//     if (String(request.chat.id) !== String(GROUP_ID)) return ok;
//
// Es decir, YA distinguía por chat. Eso permitió que esto fuera aditivo: el
// bloque del grupo general no cambia una sola comprobación, solo pasa de
// «sal si no eres tú» a «entra si eres tú». Lo nuevo cuelga de un `else if`.
//
// ── LA DOBLE ESCRITURA, Y POR QUÉ ES TEMPORAL ─────────────────────────────
// Al aprobar a alguien en el general se escribe en las DOS tablas: la vieja
// `telegram_memberships.is_in_telegram` y la nueva
// `telegram_group_memberships`. Mientras dure el traspaso, el barrido
// antiguo tiene que poder seguir funcionando si hay que volver atrás.
// Cuando el barrido nuevo lleve un tiempo, se retira la escritura vieja.

import {
  clienteAdmin, clienteEmbudo, cargarPersona,
  tieneAccesoGeneral, tieneAccesoProtocolos,
  telegram, log, colaDelEnlace,
} from "../_shared/acceso.ts";

const GROUP_ID = Deno.env.get("TELEGRAM_GROUP_ID")!;
const PROTOCOLS_GROUP_ID = Deno.env.get("TELEGRAM_PROTOCOLS_GROUP_ID") ?? "";
const WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET")!;

const supabase = clienteAdmin();
const embudo = clienteEmbudo();

/** El acceso general, sin reventar si el embudo no contesta. */
async function puedeGeneral(userId: string): Promise<boolean | "indeterminado"> {
  const persona = await cargarPersona(supabase, userId);
  if (!persona) return false;
  try {
    return await tieneAccesoGeneral(embudo, persona);
  } catch {
    return "indeterminado";
  }
}

Deno.serve(async (req) => {
  try {
    const secret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (secret !== WEBHOOK_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    const update = await req.json();

    // Alguien escribe /start a secas: o abrió el bot por su cuenta, o el
    // chat ya estaba iniciado y Telegram no reenvía el código. Sin esto se
    // queda mirando un chat mudo y da por hecho que está roto.
    if (update.message?.text === "/start") {
      await telegram("sendMessage", {
        chat_id: update.message.from.id,
        text: "Para vincular tu cuenta, entra a los144000.com y pulsa el botón de Telegram. Desde ahí se genera tu enlace personal.",
      });

      return Response.json({ ok: true });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  1 · VINCULAR LA CUENTA — /start TOKEN
    // ═══════════════════════════════════════════════════════════════════════
    if (update.message?.text?.startsWith("/start ")) {
      const telegramUser = update.message.from;
      const telegramUserId = telegramUser.id;
      const token = update.message.text.split(" ")[1];

      const { data: linkToken } = await supabase
        .from("telegram_link_tokens")
        .select("*")
        .eq("token", token)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (!linkToken) {
        await telegram("sendMessage", {
          chat_id: telegramUserId,
          text: "Este enlace ha expirado o ya fue utilizado. Genera uno nuevo desde los144000.com.",
        });

        return Response.json({ ok: true });
      }

      const access = await puedeGeneral(linkToken.user_id);

      // Antes, un fallo de la base del embudo se veía igual que «no tienes
      // suscripción», y a quien sí paga se le decía que no. Ahora se
      // distinguen: lo que no se pudo comprobar se dice que no se pudo.
      if (access === "indeterminado") {
        await telegram("sendMessage", {
          chat_id: telegramUserId,
          text: "No hemos podido comprobar tu membresía ahora mismo. Vuelve a intentarlo en unos minutos.",
        });

        return Response.json({ ok: true });
      }

      if (!access) {
        await telegram("sendMessage", {
          chat_id: telegramUserId,
          text: "No encontramos una membresía activa asociada a tu cuenta.",
        });

        return Response.json({ ok: true });
      }

      const { error: membershipError } = await supabase
        .from("telegram_memberships")
        .upsert(
          {
            user_id: linkToken.user_id,
            telegram_user_id: telegramUserId,
            telegram_username: telegramUser.username ?? null,
            telegram_first_name: telegramUser.first_name ?? null,
            telegram_linked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (membershipError) {
        console.error(membershipError);

        // Con el índice único puesto, este error también cubre el caso de una
        // cuenta de Telegram que ya pertenece a OTRO usuario. Antes eso se
        // colaba y dejaba a alguien rechazado para siempre sin explicación.
        const yaEsDeOtro = /telegram_user_id_unico|duplicate key/i.test(membershipError.message);

        await telegram("sendMessage", {
          chat_id: telegramUserId,
          text: yaEsDeOtro
            ? "Esta cuenta de Telegram ya está vinculada a otra cuenta de Los 144.000. Escríbenos si crees que es un error."
            : "No pudimos vincular tu Telegram. Intenta nuevamente.",
        });

        return Response.json({ ok: true });
      }

      const expireDate = Math.floor(Date.now() / 1000) + 600;

      const invite = await telegram("createChatInviteLink", {
        chat_id: GROUP_ID,
        expire_date: expireDate,
        creates_join_request: true,
        name: "Acceso 144000",
      });

      // Aquí antes se callaba y se iba. La cuenta quedaba vinculada, el
      // enlace fallaba, y quien estaba al otro lado no veía absolutamente
      // nada. Un fallo que no se cuenta es un fallo que nadie puede
      // arreglar.
      if (!invite.ok) {
        console.error("createChatInviteLink:", invite);

        await telegram("sendMessage", {
          chat_id: telegramUserId,
          text:
            "Tu cuenta quedó vinculada, pero no pudimos generar el acceso al grupo.\n\n" +
            `Motivo: ${invite.description ?? "desconocido"}`,
        });

        return Response.json({ ok: true });
      }

      await supabase
        .from("telegram_link_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", linkToken.id);

      await telegram("sendMessage", {
        chat_id: telegramUserId,
        text:
          "✨ Tu cuenta está vinculada.\n\nTu membresía está activa. Pulsa el botón para solicitar acceso a la Comunidad de los 144000.",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "ENTRAR A LA COMUNIDAD",
                url: invite.result.invite_link,
              },
            ],
          ],
        },
      });

      return Response.json({ ok: true });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  2 · SOLICITUD PARA ENTRAR A UN GRUPO
    // ═══════════════════════════════════════════════════════════════════════
    if (update.chat_join_request) {
      const request = update.chat_join_request;
      const chatId = String(request.chat.id);

      // ── 2A · COMUNIDAD GENERAL ─────────────────────────────────────────
      // Mismas comprobaciones que antes, en el mismo orden.
      if (chatId === String(GROUP_ID)) {
        const telegramUserId = request.from.id;

        const { data: membership } = await supabase
          .from("telegram_memberships")
          .select("user_id")
          .eq("telegram_user_id", telegramUserId)
          .maybeSingle();

        if (!membership) {
          await telegram("declineChatJoinRequest", {
            chat_id: GROUP_ID,
            user_id: telegramUserId,
          });

          return Response.json({ ok: true });
        }

        const access = await puedeGeneral(membership.user_id);

        // Lo que no se ha podido comprobar no se rechaza: se deja la
        // solicitud en pie. Telegram la guarda, y la persona puede volver a
        // pedirlo. Rechazar por una caída ajena obliga a repetir todo el
        // camino desde la plataforma.
        if (access === "indeterminado") {
          log("join_general_indeterminado", { user_id: membership.user_id });
          return Response.json({ ok: true });
        }

        if (!access) {
          await telegram("declineChatJoinRequest", {
            chat_id: GROUP_ID,
            user_id: telegramUserId,
          });

          return Response.json({ ok: true });
        }

        await telegram("approveChatJoinRequest", {
          chat_id: GROUP_ID,
          user_id: telegramUserId,
        });

        const ahora = new Date().toISOString();

        await supabase
          .from("telegram_memberships")
          .update({
            is_in_telegram: true,
            telegram_joined_at: ahora,
            updated_at: ahora,
          })
          .eq("user_id", membership.user_id);

        // La misma verdad en la tabla nueva, que es la que lee el barrido.
        await supabase
          .from("telegram_group_memberships")
          .upsert(
            {
              user_id: membership.user_id,
              group_key: "general",
              telegram_chat_id: Number(GROUP_ID),
              is_member: true,
              joined_at: ahora,
              removed_at: null,
              updated_at: ahora,
            },
            { onConflict: "user_id,group_key" },
          );

        return Response.json({ ok: true });
      }

      // ── 2B · PROTOCOLOS DE CONTACTO ────────────────────────────────────
      if (PROTOCOLS_GROUP_ID && chatId === String(PROTOCOLS_GROUP_ID)) {
        return await resolverProtocolos(request);
      }

      // Cualquier otro chat: no es asunto nuestro.
      return Response.json({ ok: true });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false }, { status: 500 });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  PROTOCOLOS · la puerta que sí comprueba el enlace
// ═══════════════════════════════════════════════════════════════════════════
//
// La diferencia con el general no es capricho. Al general se entra porque
// eres miembro: da igual por qué enlace llegaste. A Protocolos se entra
// porque ALGUIEN CONCRETO pidió entrar, y ese alguien tiene nombre.
//
// Telegram manda en la solicitud el campo `invite_link` con el enlace exacto
// que se usó. Eso es lo que permite atarla a la invitación que se generó, y
// comprobar que quien llama a la puerta es quien la pidió.
async function resolverProtocolos(request: {
  from: { id: number };
  invite_link?: { invite_link?: string };
}): Promise<Response> {
  const telegramUserId = request.from.id;
  const enlace = request.invite_link?.invite_link ?? null;

  const rechazar = async (motivo: string) => {
    await telegram("declineChatJoinRequest", {
      chat_id: PROTOCOLS_GROUP_ID,
      user_id: telegramUserId,
    });
    log("protocols_join_declined", { telegram_user_id: telegramUserId, motivo, enlace: colaDelEnlace(enlace) });
    return Response.json({ ok: true });
  };

  // Sin enlace de invitación significa que llegó por otra vía: el enlace
  // principal del grupo, o alguien que lo compartió desde dentro. Ninguna de
  // esas rutas pasa por la comprobación de acceso.
  if (!enlace) return await rechazar("sin_invite_link");

  const { data: invitacion } = await supabase
    .from("telegram_invites")
    .select("id, user_id, telegram_user_id, expires_at, used_at, revoked_at")
    .eq("invite_link", enlace)
    .eq("group_key", "protocols")
    .maybeSingle();

  if (!invitacion) return await rechazar("invitacion_desconocida");
  if (invitacion.used_at) return await rechazar("invitacion_ya_usada");
  if (invitacion.revoked_at) return await rechazar("invitacion_revocada");
  if (new Date(invitacion.expires_at).getTime() <= Date.now()) return await rechazar("invitacion_expirada");

  // ── EL ENLACE COMPARTIDO ────────────────────────────────────────────────
  // Este es el caso que da sentido a todo lo anterior: José genera el suyo y
  // se lo pasa a Pedro. El enlace es válido; quien lo usa, no.
  //
  // Se revoca además de rechazar: si ya circula por ahí, no vale la pena
  // dejarlo vivo los minutos que le queden.
  if (String(invitacion.telegram_user_id) !== String(telegramUserId)) {
    await telegram("revokeChatInviteLink", { chat_id: PROTOCOLS_GROUP_ID, invite_link: enlace });
    await supabase.from("telegram_invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", invitacion.id);
    log("protocols_invite_revoked", { motivo: "enlace_compartido", enlace: colaDelEnlace(enlace) });
    return await rechazar("telegram_user_id_no_coincide");
  }

  // ── SE VUELVE A COMPROBAR TODO ──────────────────────────────────────────
  // Entre pedir el enlace y usarlo pasan minutos, y en esos minutos una
  // suscripción puede vencer. El enlace no autoriza: autoriza esto.
  const persona = await cargarPersona(supabase, invitacion.user_id);
  if (!persona) return await rechazar("usuario_inexistente");

  let puede: boolean;
  try {
    puede = await tieneAccesoProtocolos(supabase, embudo, persona);
  } catch {
    // No se rechaza por una caída ajena: la solicitud se queda en pie y se
    // puede resolver cuando el embudo vuelva.
    log("protocols_join_indeterminado", { user_id: invitacion.user_id });
    return Response.json({ ok: true });
  }

  if (!puede) return await rechazar("sin_acceso");

  const aprobado = await telegram("approveChatJoinRequest", {
    chat_id: PROTOCOLS_GROUP_ID,
    user_id: telegramUserId,
  });

  // Si Telegram no confirma, NO se anota nada. Una base que dice que alguien
  // entró cuando no entró es peor que no saberlo: el barrido deja de mirarlo.
  if (!aprobado.ok) {
    console.error("approveChatJoinRequest:", JSON.stringify(aprobado));
    return Response.json({ ok: true });
  }

  const ahora = new Date().toISOString();

  await supabase.from("telegram_invites")
    .update({ used_at: ahora, revoked_at: ahora })
    .eq("id", invitacion.id);

  await telegram("revokeChatInviteLink", { chat_id: PROTOCOLS_GROUP_ID, invite_link: enlace });

  await supabase.from("telegram_group_memberships").upsert(
    {
      user_id: invitacion.user_id,
      group_key: "protocols",
      telegram_chat_id: Number(PROTOCOLS_GROUP_ID),
      is_member: true,
      joined_at: ahora,
      removed_at: null,
      updated_at: ahora,
    },
    { onConflict: "user_id,group_key" },
  );

  log("protocols_join_approved", {
    user_id: invitacion.user_id,
    telegram_user_id: telegramUserId,
    enlace: colaDelEnlace(enlace),
  });

  return Response.json({ ok: true });
}
