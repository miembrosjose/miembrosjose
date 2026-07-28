/**
 * Configuración legal/comercial CENTRALIZADA (fuente canónica).
 *
 * Toda página legal, de soporte y de consentimiento debe leer de aquí — nunca
 * duplicar estos datos en componentes. El embudo (los-144000-embudo) mantiene
 * un subconjunto espejo en su propio `src/lib/legal-config.ts`; las versiones
 * (termsVersion / privacyVersion / recurringConsentVersion) DEBEN coincidir
 * entre ambos para que el consentimiento registrado apunte al documento correcto.
 *
 * ⚠️ Datos de identidad jurídica y contacto: se dejan en `null` a propósito
 * cuando el propietario aún no los aportó. NO se inventan. Las páginas usan
 * fórmulas neutrales (ver helpers al final) mientras falten. Lista de pendientes
 * en docs/LEGAL_INFORMATION_REQUIRED.md.
 */

export const LEGAL = {
  // ── Operador (marca) y servicio comercial ────────────────────────────
  // Marca pública y operativa: "UFO Camping". Servicio comercial: "Los 144.000".
  // NO es una razón social ni implica una empresa constituida.
  operatorName: "UFO Camping",
  serviceName: "Los 144.000",
  serviceDescription:
    "Experiencia audiovisual de membresía por suscripción de Los 144.000: acceso a temporadas, episodios y contenido exclusivo dentro del área de miembros.",

  // ── Precio y facturación (en producción — NO modificar) ──────────────
  currency: "USD",
  currencySymbol: "US$",
  monthlyPrice: "14.99",
  billingInterval: "mensual",
  subscriptionAutoRenews: true,
  cancellationMethod: "Stripe Customer Portal",
  accessUntilPeriodEnd: true,

  // Política de reembolso provisional (configurable). No promete reembolso
  // automático ni afirma pérdida automática de derechos legales.
  refundPolicySummary:
    "Los pagos no generan un reembolso automático una vez iniciado el acceso al contenido digital de la plataforma. Las solicitudes serán revisadas individualmente según las circunstancias del caso y la legislación obligatoria aplicable.",

  // ── Versiones y fecha (deben alinearse con el embudo) ────────────────
  effectiveDate: "2026-07-27",
  termsVersion: "2026-07-27",
  privacyVersion: "2026-07-27",
  refundPolicyVersion: "2026-07-27",
  recurringConsentVersion: "2026-07-27",

  // ── Dominio y rutas legales públicas ─────────────────────────────────
  siteUrl: "https://los144000.com",
  termsPath: "/terminos",
  privacyPath: "/privacidad",
  refundsPath: "/cancelaciones-y-reembolsos",
  supportPath: "/soporte",
  memberBillingPath: "/miembros/perfil", // sección "Mi membresía"

  // ── Proveedores (para la política de privacidad) ─────────────────────
  providers: {
    auth: "Supabase",
    payments: "Stripe",
    email: "Resend",
    infrastructure: "Cloudflare",
  },

  // ── Identidad jurídica y contacto — PENDIENTES (no inventar) ─────────
  legalEntityName: null as string | null,
  taxOrRegistrationId: null as string | null,
  legalAddress: null as string | null,
  countryOfEstablishment: null as string | null,
  governingLaw: null as string | null,
  supportEmail: null as string | null,
  privacyEmail: null as string | null,
  supportWhatsApp: null as string | null, // formato E.164 sin "+", p. ej. "5491123456789"
} as const

export type LegalConfig = typeof LEGAL

// ── Helpers de presentación (fórmulas neutrales cuando falta el dato) ──

/** Precio con símbolo, p. ej. "US$14.99". */
export function priceLabel(): string {
  return `${LEGAL.currencySymbol}${LEGAL.monthlyPrice}`
}

/** Precio con periodicidad, p. ej. "US$14.99 al mes". */
export function priceWithInterval(): string {
  return `${priceLabel()} al mes`
}

/** Responsable para textos legales: razón social si existe; si no, la marca operadora. */
export function legalEntityDisplay(): string {
  return LEGAL.legalEntityName ?? LEGAL.operatorName
}

/** mailto de privacidad: usa el correo de privacidad o, si no existe, el de soporte. */
export function privacyEmailHref(): string | null {
  const e = LEGAL.privacyEmail ?? LEGAL.supportEmail
  return e ? `mailto:${e}` : null
}

/** Ley/jurisdicción para textos legales; neutral si no está definida. */
export function governingLawDisplay(): string {
  return LEGAL.governingLaw ?? "la legislación aplicable en la jurisdicción del titular del servicio"
}

/** WhatsApp como URL wa.me si está configurado. */
export function supportWhatsAppUrl(): string | null {
  return LEGAL.supportWhatsApp ? `https://wa.me/${LEGAL.supportWhatsApp}` : null
}

/** mailto de soporte si está configurado. */
export function supportEmailHref(): string | null {
  return LEGAL.supportEmail ? `mailto:${LEGAL.supportEmail}` : null
}

/** ¿Hay al menos un canal de contacto configurado? */
export function hasContactChannel(): boolean {
  return Boolean(LEGAL.supportEmail || LEGAL.supportWhatsApp)
}
