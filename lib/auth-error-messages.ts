// Tradução centralizada de erros de auth do Supabase pra mensagens em ES.
// Usada nos forms de login, signup, activación e reset de senha.
//
// Quando Supabase retorna mensagem que conhecemos, traduz. Caso contrário,
// retorna fallback genérico (NUNCA mostra mensagem técnica em inglês pro user).
//
// ── POR QUÉ ESTO CRECIÓ (24-11-2026) ──────────────────────────────────────
// Alguien se quedó a mitad de crear su cuenta: escribió la contraseña dos
// veces y la plataforma le contestó «Algo salió mal. Intenta nuevamente en
// unos segundos». Volvió a intentarlo y pasó lo mismo, porque ese mensaje
// era mentira: el error de abajo no se arreglaba esperando.
//
// El comodín se había tragado los errores más frecuentes de esta pantalla:
// la sesión del enlace caducada, el enlace ya usado, y las reglas de
// contraseña del propio Supabase. Ninguno estaba traducido, así que los
// tres salían iguales y ninguno decía qué hacer.
//
// Dos reglas desde entonces:
//   1. Si reintentar NO va a funcionar, no se dice «intenta de nuevo». Se
//      dice qué pasó y adónde ir.
//   2. Cuando ni así se reconoce el error, se enseña un código corto. Un
//      pantallazo vale entonces como diagnóstico, que es exactamente lo que
//      faltó aquel día.

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

/** Lo que se dice cuando el enlace de acceso ya no sirve. */
const ENLACE_MUERTO =
  "Este enlace de acceso ya no sirve: se usó antes o caducó. Pide uno nuevo y ábrelo en cuanto te llegue."

const PATTERN_MATCHES: Array<{ pattern: RegExp; message: string; sesionMuerta?: boolean }> = [
  // ── La sesión del enlace ya no vale ──────────────────────────────────
  // Todo este bloque termina en la misma pantalla: pedir un enlace nuevo.
  // Reintentar aquí no arregla nada y antes se invitaba a hacerlo.
  {
    pattern: /auth session missing|session missing|session_not_found|session not found/i,
    message: ENLACE_MUERTO,
    sesionMuerta: true,
  },
  {
    pattern: /refresh token not found|invalid refresh token|refresh_token_not_found/i,
    message: ENLACE_MUERTO,
    sesionMuerta: true,
  },
  {
    pattern: /jwt expired|token is expired|token has expired|otp_expired|bad_jwt/i,
    message: ENLACE_MUERTO,
    sesionMuerta: true,
  },
  {
    pattern: /user from sub claim in jwt does not exist|user_not_found/i,
    message: ENLACE_MUERTO,
    sesionMuerta: true,
  },
  {
    pattern: /email link is invalid or has expired|link is invalid or has expired/i,
    message: ENLACE_MUERTO,
    sesionMuerta: true,
  },

  // Supabase obliga a esperar unos segundos entre intentos. No es un fallo
  // de la persona y se pasa solo; se dice cuánto hay que esperar.
  {
    pattern: /you can only request this after|for security purposes/i,
    message: "Espera unos segundos antes de volver a intentarlo.",
  },

  // ── Reglas de contraseña del propio Supabase ─────────────────────────
  // Este mensaje lo devuelve el panel cuando exige variedad de caracteres.
  // Es larguísimo y viene con el alfabeto entero dentro; no se enseña.
  {
    pattern: /password should contain at least one character of each|insufficient.*character|password_strength/i,
    message:
      "Esa contraseña no cumple los requisitos. Prueba con una que mezcle letras, números y algún símbolo (por ejemplo: Luz144000!).",
  },
  // Contraseña filtrada en brechas conocidas: Supabase la rechaza.
  {
    pattern: /pwned|compromised|found in a data breach/i,
    message: "Esa contraseña aparece en listas de contraseñas filtradas. Elige otra distinta.",
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
  // Rate limit do Supabase Auth — IP fez muitas requests em pouco tempo.
  // Default Supabase: 30 req/h por IP. Cobre login, signup, reset, magic link.
  {
    pattern: /rate limit|too many requests|over_email_send_rate_limit/i,
    message: "Demasiados intentos. Espera 30 minutos o usa otra red (4G del celular) e inténtalo de nuevo.",
  },
  // Captcha
  {
    pattern: /captcha/i,
    message: "Verificación de seguridad falló. Recarga la página e inténtalo de nuevo.",
  },
  // Network / fetch failures
  {
    pattern: /failed to fetch|network|timeout|load failed/i,
    message: "Error de conexión. Verifica tu internet e inténtalo de nuevo.",
  },
  // Un fallo de la base de datos al tocar el usuario. No es culpa de quien
  // está delante y reintentar rara vez ayuda.
  {
    pattern: /database error|unexpected_failure/i,
    message: "Error temporal en nuestro sistema. Escríbenos a soporte y lo resolvemos.",
  },
]

const FALLBACK = "Algo salió mal. Intenta nuevamente en unos segundos."

export type AuthFallo = {
  /** Lo que se le enseña a la persona. Siempre en español. */
  mensaje: string
  /**
   * ¿El enlace o la sesión ya no sirven? Entonces la pantalla no debe
   * ofrecer «reintentar»: debe ofrecer pedir un enlace nuevo.
   */
  sesionMuerta: boolean
  /**
   * Código corto y sin datos personales, para enseñar junto al comodín.
   * Sirve para que un pantallazo diga qué pasó.
   */
  codigo: string | null
}

/**
 * Reduce cualquier texto a un código corto y seguro de enseñar.
 * Solo letras, números y guiones bajos; nunca más de 40 caracteres.
 */
function aCodigo(texto: string): string | null {
  const limpio = texto
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40)
  return limpio.length > 0 ? limpio : null
}

/** Saca el código que trae el propio error de Supabase, si trae alguno. */
function codigoDelError(e: unknown): string | null {
  if (!e || typeof e !== "object") return null
  const obj = e as { code?: unknown; status?: unknown; name?: unknown }
  if (typeof obj.code === "string" && obj.code.trim()) return aCodigo(obj.code)
  if (typeof obj.status === "number") return `http_${obj.status}`
  if (typeof obj.name === "string" && obj.name.trim()) return aCodigo(obj.name)
  return null
}

/**
 * Clasifica un error de auth: qué decirle a la persona, si tiene sentido
 * reintentar, y con qué código referirse a él.
 */
export function clasificarAuthError(e: unknown): AuthFallo {
  const bruto =
    typeof e === "string"
      ? e
      : e && typeof e === "object" && typeof (e as { message?: unknown }).message === "string"
        ? ((e as { message: string }).message)
        : ""

  const trimmed = bruto.trim()
  const codigo = codigoDelError(e)

  if (trimmed && EXACT_MATCHES[trimmed]) {
    return { mensaje: EXACT_MATCHES[trimmed], sesionMuerta: false, codigo: null }
  }

  if (trimmed) {
    for (const { pattern, message, sesionMuerta } of PATTERN_MATCHES) {
      if (pattern.test(trimmed)) {
        return { mensaje: message, sesionMuerta: sesionMuerta === true, codigo: null }
      }
    }
  }

  // Ni idea. Se enseña el comodín Y un código, para que un pantallazo sirva
  // de algo. Antes esto era un callejón sin salida para quien lo recibía y
  // para quien tenía que averiguar qué había pasado.
  return { mensaje: FALLBACK, sesionMuerta: false, codigo: codigo ?? aCodigo(trimmed.slice(0, 40)) }
}

/**
 * Traduz mensagem/código de erro de auth pra ES amigável.
 * NUNCA retorna mensagem técnica em inglês — sempre cai no fallback se não bater nada.
 */
export function translateAuthError(message: string | undefined | null): string {
  if (!message) return FALLBACK
  return clasificarAuthError(message).mensaje
}
