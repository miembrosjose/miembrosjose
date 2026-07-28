# Información legal requerida — Los 144.000 (plataforma)

> ⚠️ **Antes del lanzamiento público definitivo deben definirse la identidad del responsable
> contractual y de datos, país de establecimiento, dirección legal o comercial, identificación
> fiscal cuando corresponda y jurisdicción aplicable.**

## Identidad actual (provisional)

- **Operador / marca pública:** UFO Camping
- **Servicio comercial:** Los 144.000
- **Empresa constituida:** no existe por ahora. Por eso `legalEntityName`, `taxOrRegistrationId`,
  `legalAddress`, `countryOfEstablishment` y `governingLaw` se mantienen en `null` (no se inventan).
- En las páginas públicas, cuando un dato legal no está definido **no se renderiza esa fila**: nunca
  se muestra "null", "pendiente" ni vacíos. Los textos usan al operador (UFO Camping) como
  responsable y una fórmula neutral para la jurisdicción.
- **Política de reembolso provisional (vigente):** los pagos no generan reembolso automático una vez
  iniciado el acceso; las solicitudes se revisan individualmente según el caso y la ley obligatoria
  aplicable. No promete reembolsos ni afirma pérdida automática de derechos.


Las páginas legales (`/terminos`, `/privacidad`, `/cancelaciones-y-reembolsos`, `/soporte`)
y el consentimiento del embudo **leen todo desde un único archivo**:

- Plataforma: `lib/site/legal-config.ts`
- Embudo: `src/lib/legal-config.ts` (subconjunto espejo)

Los datos ya conocidos (marca, precio US$14.99, periodicidad mensual, versiones) están completos.
Los siguientes campos están en `null` **a propósito** (no se inventan). Mientras falten, las páginas
usan una fórmula neutral (p. ej. *"el titular de Los 144.000"*, *"la legislación aplicable en la
jurisdicción del titular"*). Complétalos en `lib/site/legal-config.ts` (y refleja los de contacto en el embudo).

| Campo (`LEGAL.*`) | Qué es | Estado |
|---|---|---|
| `legalEntityName` | Nombre legal del titular (persona física o empresa) | ⏳ Pendiente |
| `taxOrRegistrationId` | Identificación fiscal / registro | ⏳ Pendiente |
| `legalAddress` | Domicilio legal | ⏳ Pendiente |
| `countryOfEstablishment` | País de establecimiento | ⏳ Pendiente |
| `governingLaw` | Ley y jurisdicción aplicables | ⏳ Pendiente |
| `supportEmail` | Correo de soporte | ⏳ Pendiente |
| `privacyEmail` | Correo de privacidad/datos | ⏳ Pendiente |
| `supportWhatsApp` | WhatsApp de soporte (E.164 sin `+`, ej. `5491123456789`) | ⏳ Pendiente |

## Versiones de documentos (ya fijadas)

`termsVersion`, `privacyVersion`, `refundPolicyVersion`, `recurringConsentVersion`, `effectiveDate`
= **2026-07-27**. Deben coincidir entre plataforma y embudo. Si el texto legal cambia tras revisión
jurídica, **incrementa la versión correspondiente** en ambos `legal-config` para que el consentimiento
quede ligado al documento vigente.

## Política de reembolso

`refundPolicySummary` tiene un valor prudente por defecto (evaluación caso a caso conforme a la ley).
Si el titular define una política concreta (p. ej. sin reembolsos / 7 días), edítala ahí.

## ⚠️ Aviso

Los borradores legales son un marco general redactado para reflejar el funcionamiento real del
servicio. **Requieren revisión por un profesional legal** según la jurisdicción real del titular antes
del lanzamiento público.
