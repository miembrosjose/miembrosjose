// QUIÉN SIGUE SIENDO MIEMBRO · definición única para los listados.
//
// ── EL FALLO QUE ARREGLA ───────────────────────────────────────────────────
// La puerta de la plataforma (app/miembros/_lib/auth-server.ts) siempre estuvo
// bien cerrada: quien deja de pagar no entra, lo manda a acceso-suspendido.
//
// Pero los LISTADOS no preguntaban nada. «Explorar la Red», el mapa y la tabla
// de clasificación sacaban a todos los usuarios con correo, hubieran cancelado
// o no. El resultado era gente que ya no puede entrar —y a la que el barrido
// de Telegram ya había echado del grupo— apareciendo como miembro activo de la
// Red, con su ciudad y su botón de mensaje.
//
// ── POR QUÉ EN UN SOLO ARCHIVO ─────────────────────────────────────────────
// Porque la regla no es «tiene suscripción»: son tres casos, y hay que
// acertarlos los tres en cada sitio donde se liste gente. La comprobación de
// Telegram estuvo copiada en tres funciones y las tres acabaron distintas.
// Aquí hay una, y quien liste personas la llama.
//
// ── LA REGLA, IGUAL QUE LA DE LA PUERTA ────────────────────────────────────
//   · administración;
//   · acceso concedido a mano (tester, reviewer, invitado);
//   · suscripción activa, O cancelada pero con el periodo todavía por acabar
//     —eso ya está pagado y la propia página dice «Acceso hasta …».

import type { SupabaseClient } from "@supabase/supabase-js"

export type Persona = { id: string; email: string | null | undefined }

/**
 * De una lista de personas, las que hoy siguen teniendo acceso.
 *
 * Devuelve un conjunto de ids. Lo que no esté dentro, no se enseña.
 *
 * ── POR QUÉ FALLA HACIA DENTRO Y NO HACIA FUERA ───────────────────────────
 * Si la consulta de suscripciones falla, se devuelven TODOS. Es lo contrario
 * que en la puerta, y es deliberado: aquí un fallo de base de datos no puede
 * vaciar el directorio de la Red y hacer creer a todo el mundo que se quedó
 * solo. Enseñar de más durante unos minutos se arregla recargando; enseñar de
 * menos parece que la comunidad se murió.
 */
export async function conAccesoActivo(
  admin: SupabaseClient,
  personas: Persona[],
): Promise<Set<string>> {
  const ids = personas.map((p) => p.id)
  if (ids.length === 0) return new Set()

  const dentro = new Set<string>()

  // ── 1 y 2 · administración y accesos concedidos a mano ──────────────────
  // Se piden las tres columnas de una vez, y si `manual_access` o
  // `access_role` todavía no existen en esta base, se reintenta con lo
  // mínimo. La puerta hace lo mismo: una columna que falta no puede tumbar
  // un listado entero.
  let perfiles: Array<{ id: string; is_admin?: boolean; manual_access?: boolean; access_role?: string | null }> = []
  const completo = await admin
    .from("profiles")
    .select("id, is_admin, manual_access, access_role")
    .in("id", ids)

  if (completo.error) {
    const basico = await admin.from("profiles").select("id, is_admin").in("id", ids)
    perfiles = (basico.data || []) as typeof perfiles
  } else {
    perfiles = (completo.data || []) as typeof perfiles
  }

  for (const p of perfiles) {
    const rol = p.access_role
    if (
      p.is_admin === true ||
      p.manual_access === true ||
      rol === "tester" || rol === "reviewer" || rol === "admin"
    ) {
      dentro.add(p.id)
    }
  }

  // ── 3 · la suscripción ──────────────────────────────────────────────────
  // `member_subscriptions` se identifica por CORREO, no por user_id: la
  // sincroniza el embudo, que solo conoce el correo de quien pagó.
  const porCorreo = new Map<string, string>()
  for (const p of personas) {
    const correo = (p.email || "").trim().toLowerCase()
    if (correo) porCorreo.set(correo, p.id)
  }

  if (porCorreo.size === 0) return dentro

  const { data: subs, error } = await admin
    .from("member_subscriptions")
    .select("email, status, current_period_end")
    .in("email", [...porCorreo.keys()])

  // Fallo de base: se enseña a todos. Ver la nota de arriba.
  if (error) {
    console.error("[membresia] no se pudo leer member_subscriptions:", error.message)
    return new Set(ids)
  }

  const ahora = Date.now()
  for (const s of subs || []) {
    const id = porCorreo.get(String(s.email || "").toLowerCase())
    if (!id) continue

    const fin = s.current_period_end ? new Date(s.current_period_end as string).getTime() : 0
    const vigente =
      s.status === "active" ||
      (s.status === "canceled" && fin > ahora)

    if (vigente) dentro.add(id)
  }

  return dentro
}

/**
 * Los correos de unos ids, para los listados que solo manejan user_id.
 *
 * El mapa de la Red parte de `member_location`, que no guarda correo. Y la
 * suscripción se identifica por correo, así que hay que traerlo de Auth.
 */
export async function correosDe(
  admin: SupabaseClient,
  ids: string[],
): Promise<Persona[]> {
  if (ids.length === 0) return []
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const quiero = new Set(ids)
  return (data?.users || [])
    .filter((u) => quiero.has(u.id))
    .map((u) => ({ id: u.id, email: u.email ?? null }))
}
