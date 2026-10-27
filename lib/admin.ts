// Helper: verifica se user logado é admin.
//
// Fonte de verdade: user.app_metadata.is_admin === true.
// IMPORTANTE: usamos app_metadata, NÃO user_metadata.
// - user_metadata: editável pelo próprio user (via auth.updateUser) → INSEGURO
// - app_metadata: só editável via service_role (server-side) → SEGURO
//
// Pra promover um user a admin, rodar no SQL Editor do Supabase:
//   UPDATE auth.users
//   SET raw_app_meta_data = raw_app_meta_data || '{"is_admin": true}'::jsonb
//   WHERE email = 'admin@SEU_DOMINIO.com';

import type { User } from "@supabase/supabase-js"

type AdminMeta = { is_admin?: boolean }

export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false
  const meta = (user.app_metadata || {}) as AdminMeta
  return meta.is_admin === true
}

/**
 * ¿El objetivo de esta acción es OTRO administrador?
 *
 * ── POR QUÉ HACE FALTA ──────────────────────────────────────────────────
 * El panel da acceso a acciones que deshacen el trabajo de alguien: borrar
 * una cuenta, reiniciar su avance, quitarle un producto. Estaban pensadas
 * para usarse CON MIEMBROS, y mientras hubo un solo administrador daba
 * igual.
 *
 * Con dos ya no. Un correo mal escrito, o un identificador copiado de la
 * fila de al lado, y el avance del otro administrador desaparece.
 *
 * ── Y POR QUÉ SOBRE UNO MISMO SÍ SE DEJA ────────────────────────────
 * Porque reiniciar el propio avance es justo lo que se hace para probar
 * algo. Lo que no se puede es hacerlo en la cuenta del otro.
 *
 * ── LO QUE ESTO NO ES ─────────────────────────────────────────────────────
 * No es desconfianza: es que las acciones irreversibles no deben depender de
 * que nadie se equivoque nunca al teclear. El borrado de cuentas ya lo hacía
 * así desde el principio; esto lleva la misma regla a las demás.
 */
export function esOtroAdmin(
  objetivo: User | null | undefined,
  idDeQuienActua: string,
): boolean {
  if (!objetivo) return false
  if (objetivo.id === idDeQuienActua) return false
  return isAdmin(objetivo)
}

/** La frase que se le devuelve, con el nombre de lo que se intentaba. */
export function avisoDeOtroAdmin(accion: string): string {
  return `Esa cuenta es de administración. ${accion} en la cuenta de otro `
    + "administrador no se puede hacer desde aquí."
}
