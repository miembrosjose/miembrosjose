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
