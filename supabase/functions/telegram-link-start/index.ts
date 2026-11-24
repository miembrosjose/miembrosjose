// ═══════════════════════════════════════════════════════════════════════════
//  telegram-link-start · el botón de Telegram del área de miembros
// ═══════════════════════════════════════════════════════════════════════════
//
// Devuelve una dirección personal y de un solo uso para vincular la cuenta de
// Telegram con la de Los 144.000. Quien la pide tiene que poder entrar.
//
// ── POR QUÉ ESTA FUNCIÓN NO IMPORTA `_shared/acceso.ts` ───────────────────
// Las otras tres (webhook, sweep, protocols-access) comparten la definición
// de quién entra. Esta no: está escrita sobre `withSupabase` de
// `npm:@supabase/server`, otra forma distinta, y lleva su propia copia de la
// comprobación.
//
// Eso es deuda conocida, y el 17-11-2026 cobró: a `_shared/acceso.ts` se le
// añadió el acceso concedido a mano y aquí no, así que el barrido y el webhook
// dejaban entrar a los invitados y el BOTÓN seguía diciéndoles que no tenían
// suscripción. Unificarla es el paso siguiente; ver el apartado de abajo.
//
// ── LA OTRA DIFERENCIA, QUE SIGUE AQUÍ A PROPÓSITO ────────────────────────
// `_shared/acceso.ts` acepta `canceled` y esta copia NO. No es un descuido:
// cancelar en Stripe no corta el servicio hasta el final del periodo ya
// cobrado, así que quien cancela con tres semanas pagadas las conserva en la
// web y en el grupo —el barrido no lo echa—, pero si todavía no se había
// vinculado, este botón le dice que su membresía no está activa.
//
// No se ha tocado porque cambiarlo afloja quién puede entrar, y eso es una
// decisión del dueño, no un arreglo. Queda escrito para que se vea.

import { withSupabase } from "npm:@supabase/server@^1";
import { createClient } from "npm:@supabase/supabase-js@2";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    try {
      // ── DE DÓNDE SALE EL USUARIO ──────────────────────────────────────
      // `ctx.userClaims` llega vacío cuando el token viene firmado con las
      // claves asimétricas nuevas de Supabase (ES256 con `kid`) y el helper
      // solo sabe validar el esquema antiguo HS256. Preguntarle al servidor
      // de Auth funciona con los dos.
      let userId = String(ctx.userClaims?.sub ?? "");
      let email = String(ctx.userClaims?.email ?? "").toLowerCase();
      let appMetadata: Record<string, unknown> =
        (ctx.userClaims?.app_metadata as Record<string, unknown>) ?? {};

      if (!userId || !email) {
        const jwt = (req.headers.get("Authorization") ?? "")
          .replace(/^Bearer\s+/i, "");

        if (jwt) {
          const auth = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
          );

          const { data, error } = await auth.auth.getUser(jwt);
          if (error) console.error("getUser:", error.message);

          userId = String(data?.user?.id ?? "");
          email = String(data?.user?.email ?? "").toLowerCase();
          appMetadata = (data?.user?.app_metadata as Record<string, unknown>) ?? {};
        }
      }

      if (!userId || !email) {
        return Response.json(
          { error: "Usuario no identificado" },
          { status: 401 }
        );
      }

      // ── EL PERFIL: ADMINISTRACIÓN Y ACCESO CONCEDIDO A MANO ───────────
      // `manual_access` es la bandera con la que se da entrada a alguien que
      // paga por fuera de Stripe. La puerta de la web ya la mira —ver
      // app/miembros/_lib/auth-server.ts—; esta no lo hacía, y como un
      // invitado no tiene fila en el embudo, la respuesta era siempre que no
      // había suscripción asociada a su cuenta.
      //
      // ── SI ESTA LECTURA FALLA, NO SE CORTA A NADIE ────────────────────
      // Un fallo aquí NO devuelve error: se sigue con la comprobación de
      // siempre. Convertirlo en un 500 dejaría a TODO el mundo sin Telegram
      // —incluidos los que pagan— por un problema que solo afecta a los
      // invitados. Quien tenga suscripción no nota nada; el invitado ve el
      // mensaje de antes y puede volver a pulsar.
      let accesoManual = false;
      let esAdmin = appMetadata?.is_admin === true;

      const { data: perfil, error: perfilError } = await ctx.supabaseAdmin
        .from("profiles")
        .select("manual_access, is_admin")
        .eq("id", userId)
        .maybeSingle();

      if (perfilError) {
        console.error("profiles:", perfilError);
      } else {
        accesoManual = perfil?.manual_access === true;
        // ── LAS DOS BANDERAS DE ADMINISTRACIÓN ──────────────────────────
        // Esto miraba solo `app_metadata.is_admin`. El resto de la
        // plataforma acepta las dos —ver `requireAdmin()`—, así que una
        // administradora marcada solo en `profiles` entraba en la web y no
        // en el grupo.
        esAdmin = esAdmin || perfil?.is_admin === true;
      }

      const botUsername = Deno.env.get("TELEGRAM_BOT_USERNAME");

      if (!botUsername) {
        return Response.json(
          { error: "Faltan variables de configuración" },
          { status: 500 }
        );
      }

      // ── LA COMPROBACIÓN DE MEMBRESÍA ──────────────────────────────────
      // Administración no la pasa: sin esta salida, el propio dueño no puede
      // comprobar que su integración funciona sin tener una suscripción real.
      //
      // Quien tiene acceso concedido a mano tampoco: en el embudo no hay
      // ninguna fila que buscar, ni la va a haber nunca. Y va antes de llamar
      // al embudo a propósito, para que un invitado no dependa de que la otra
      // base esté en pie.
      if (!esAdmin && !accesoManual) {
        const embudoUrl = Deno.env.get("EMBUDO_SUPABASE_URL");
        const embudoKey = Deno.env.get("EMBUDO_SUPABASE_SERVICE_ROLE_KEY");

        if (!embudoUrl || !embudoKey) {
          return Response.json(
            { error: "Faltan variables de configuración" },
            { status: 500 }
          );
        }

        const embudo = createClient(embudoUrl, embudoKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });

        const { data: registro, error: registroError } = await embudo
          .from("embudo_registros")
          .select("email, subscription_status, current_period_end")
          .ilike("email", email)
          .not("subscription_status", "is", null)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // El motivo se queda en el registro del servidor, no viaja al
        // navegador: un error interno de la base dice más de la estructura
        // de lo que conviene enseñar a quien no debe verla.
        if (registroError) {
          console.error("embudo_registros:", registroError);

          return Response.json(
            { error: "No se pudo comprobar la suscripción" },
            { status: 500 }
          );
        }

        if (!registro) {
          return Response.json(
            { error: "No encontramos una suscripción asociada a esta cuenta" },
            { status: 403 }
          );
        }

        const status = registro.subscription_status;
        const periodEnd = registro.current_period_end
          ? new Date(registro.current_period_end)
          : null;

        const tieneAcceso =
          ["active", "trialing"].includes(status) &&
          periodEnd !== null &&
          periodEnd.getTime() > Date.now();

        if (!tieneAcceso) {
          return Response.json(
            { error: "Tu membresía no está activa" },
            { status: 403 }
          );
        }
      }

      // ── EL ENLACE DE UN SOLO USO ──────────────────────────────────────
      const token = crypto.randomUUID().replaceAll("-", "");

      const expiresAt = new Date(
        Date.now() + 10 * 60 * 1000
      ).toISOString();

      const { error: tokenError } = await ctx.supabaseAdmin
        .from("telegram_link_tokens")
        .insert({
          user_id: userId,
          token,
          expires_at: expiresAt,
        });

      if (tokenError) {
        console.error(tokenError);

        return Response.json(
          { error: "No se pudo generar el acceso a Telegram" },
          { status: 500 }
        );
      }

      return Response.json({
        ok: true,
        telegram_url: `https://t.me/${botUsername}?start=${token}`,
        expires_at: expiresAt,
      });

    } catch (error) {
      console.error(error);

      return Response.json(
        { error: "Error interno" },
        { status: 500 }
      );
    }
  }),
};
