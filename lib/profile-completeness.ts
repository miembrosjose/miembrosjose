// Helper de completude de perfil — usado pelo gate de onboarding em
// SpaHomeShell. User só acessa a área de membros se preencher todos os
// campos obrigatórios. Bio é opcional.

export type ProfileMeta = {
  avatar_url?: string
  full_name?: string
  username?: string
  niche?: string
  instagram?: string
}

const REQUIRED_FIELDS: Array<keyof ProfileMeta> = [
  "avatar_url",
  "full_name",
  "username",
  "niche",
  "instagram",
]

/**
 * Retorna true se o user tem TODOS os campos obrigatórios preenchidos.
 * Bio é opcional e NÃO entra na checagem.
 */
export function isProfileComplete(
  meta: Record<string, unknown> | null | undefined,
): boolean {
  if (!meta) return false
  const m = meta as ProfileMeta
  return REQUIRED_FIELDS.every((k) => {
    const v = m[k]
    return typeof v === "string" && v.trim().length > 0
  })
}

/**
 * Retorna lista de campos obrigatórios faltantes (pra mostrar UI granular
 * no modal de onboarding se quiser).
 */
export function getMissingProfileFields(
  meta: Record<string, unknown> | null | undefined,
): Array<keyof ProfileMeta> {
  if (!meta) return [...REQUIRED_FIELDS]
  const m = meta as ProfileMeta
  return REQUIRED_FIELDS.filter((k) => {
    const v = m[k]
    return typeof v !== "string" || v.trim().length === 0
  })
}
