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

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

/** Los grupos que conoce el sistema. */
export type GrupoKey = "general" | "protocols";

/** Lo que hace falta saber de una persona para decidir. */
export type Persona = {
  userId: string;
  email: string;
  esAdmin: boolean;
};

export function clienteAdmin(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export function clienteEmbudo(): SupabaseClient {
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
export async function cargarPersona(
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
export async function tieneAccesoGeneral(
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
export async function haLlegadoAlUmbral(
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
export async function tieneAccesoProtocolos(
  admin: SupabaseClient,
  embudo: SupabaseClient,
  persona: Persona,
): Promise<boolean> {
  return (await tieneAccesoGeneral(embudo, persona)) && (await haLlegadoAlUmbral(admin, persona));
}

/** Lo que se espera de una persona en un grupo concreto. */
export async function deberiaEstarEn(
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
export async function telegram(method: string, body: unknown) {
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
export function log(evento: string, datos: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ evento, ...datos }));
}

export function colaDelEnlace(link: string | null | undefined): string {
  return link ? "…" + link.slice(-8) : "(sin enlace)";
}
