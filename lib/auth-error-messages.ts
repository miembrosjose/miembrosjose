// Tradução centralizada de erros de auth do Supabase pra mensagens em ES.
// Usada nos forms de login, signup e reset de senha.
//
// Quando Supabase retorna mensagem que conhecemos, traduz. Caso contrário,
// retorna fallback genérico (NUNCA mostra mensagem técnica em inglês pro user).

const EXACT_MATCHES: Record<string, string> = {
  // Login
  "Invalid login credentials": "Email o contraseña incorrectos. Verifica e intenta nuevamente.",
  "Email not confirmed": "Tu email aún no ha sido confirmado. Revisa tu bandeja de entrada.",
  "User not found": "No encontramos una cuenta con ese email.",

  // Signup / criação de conta
  "User already registered": "Ya existe una cuenta con este email. Inicia sesión.",
  "Email rate limit exceeded": "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",

  // Senha
  "Password should be at least 6 characters": "La contraseña debe tener al menos 8 caracteres.",
  "Password should be at least 8 characters": "La contraseña debe tener al menos 8 caracteres.",
  "New password should be different from the old password": "La nueva contraseña debe ser diferente de la actual.",

  // Códigos custom nossos
  invalid_or_expired: "Este enlace ya fue utilizado o ha expirado.",
  password_too_short: "La contraseña debe tener al menos 8 caracteres.",
  account_already_exists: "Ya existe una cuenta con este email. Inicia sesión.",
  missing_token: "Falta el token de activación.",
  database_error: "Error temporal en nuestro sistema. Por favor contacta soporte.",
}

const PATTERN_MATCHES: Array<{ pattern: RegExp; message: string }> = [
  // Rate limit do Supabase Auth — IP fez muitas requests em pouco tempo.
  // Default Supabase: 30 req/h por IP. Cobre login, signup, reset, magic link.
  {
    pattern: /rate limit|too many requests|over_email_send_rate_limit/i,
    message: "Demasiados intentos. Espera 30 minutos o usa otra red (4G del celular) e inténtalo de nuevo.",
  },
  // Senha fraca
  {
    pattern: /weak.*password|password.*weak/i,
    message: "Contraseña demasiado débil. Usa al menos 8 caracteres con letras y números.",
  },
  // Mesma senha
  {
    pattern: /same.*password|new password should be different/i,
    message: "La nueva contraseña debe ser diferente de la actual.",
  },
  // Captcha
  {
    pattern: /captcha/i,
    message: "Verificación de seguridad falló. Recarga la página e inténtalo de nuevo.",
  },
  // Network / fetch failures
  {
    pattern: /failed to fetch|network|timeout/i,
    message: "Error de conexión. Verifica tu internet e inténtalo de nuevo.",
  },
]

const FALLBACK = "Algo salió mal. Intenta nuevamente en unos segundos."

/**
 * Traduz mensagem/código de erro de auth pra ES amigável.
 * NUNCA retorna mensagem técnica em inglês — sempre cai no fallback se não bater nada.
 */
export function translateAuthError(message: string | undefined | null): string {
  if (!message) return FALLBACK
  const trimmed = message.trim()

  // Match exato primeiro
  if (EXACT_MATCHES[trimmed]) return EXACT_MATCHES[trimmed]

  // Match por pattern
  for (const { pattern, message: translated } of PATTERN_MATCHES) {
    if (pattern.test(trimmed)) return translated
  }

  // Fallback — nunca expõe mensagem técnica em inglês
  return FALLBACK
}
