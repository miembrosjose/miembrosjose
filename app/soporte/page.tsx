import type { Metadata } from "next"
import { LegalPage, H2, P, Ul, Section } from "@/components/legal/legal-page"
import {
  LEGAL,
  hasContactChannel,
  supportEmailHref,
  supportWhatsAppUrl,
} from "@/lib/site/legal-config"

export const metadata: Metadata = {
  title: "Soporte · Los 144.000",
  description: "Ayuda y contacto para tu membresía de Los 144.000.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${LEGAL.siteUrl}${LEGAL.supportPath}` },
}

export default function SoportePage() {
  const email = supportEmailHref()
  const whatsapp = supportWhatsAppUrl()

  return (
    <LegalPage
      eyebrow="Ayuda"
      title="Soporte"
      summary={
        <>
          Estamos para ayudarte con tu acceso y tu membresía de {LEGAL.serviceName}. Muchas gestiones
          puedes resolverlas tú mismo desde <strong className="text-[#F3F6FA]">Mi membresía</strong>.
        </>
      }
    >
      <Section>
        <H2>Contacto</H2>
        {hasContactChannel() ? (
          <Ul>
            {email && (
              <li>
                Correo:{" "}
                <a href={email} className="text-[#a78bca] underline">
                  {LEGAL.supportEmail}
                </a>
              </li>
            )}
            {whatsapp && (
              <li>
                WhatsApp:{" "}
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="text-[#a78bca] underline">
                  Escribir por WhatsApp
                </a>
              </li>
            )}
          </Ul>
        ) : (
          <P>
            El canal de contacto se publicará en breve. Mientras tanto, puedes gestionar tu membresía
            y tu contraseña desde las opciones de tu cuenta.
          </P>
        )}
        <P>Respondemos lo antes posible, normalmente en días hábiles.</P>
      </Section>

      <Section>
        <H2>Gestiones rápidas</H2>
        <Ul>
          <li>
            <a href={LEGAL.memberBillingPath} className="text-[#a78bca] underline">
              Mi membresía
            </a>{" "}
            — actualizar pago, ver facturas o cancelar (Stripe Customer Portal).
          </li>
          <li>
            <a href="/recuperar-contrasena" className="text-[#a78bca] underline">
              Recuperar contraseña
            </a>{" "}
            — si no puedes iniciar sesión.
          </li>
          <li>
            <a href="/miembros/login" className="text-[#a78bca] underline">
              Iniciar sesión
            </a>
          </li>
        </Ul>
      </Section>

      <Section>
        <H2>Preguntas frecuentes</H2>
        <P>
          <strong className="text-[#F3F6FA]">¿Cómo cancelo?</strong> Desde{" "}
          <a href={LEGAL.memberBillingPath} className="text-[#a78bca] underline">
            Mi membresía
          </a>
          . Una cancelación al final del periodo mantiene el acceso hasta la fecha ya pagada.
        </P>
        <P>
          <strong className="text-[#F3F6FA]">Mi pago falló y perdí el acceso.</strong> Actualiza tu
          método de pago desde el portal; al regularizarlo, el acceso se restablece automáticamente.
        </P>
        <P>
          <strong className="text-[#F3F6FA]">No recibí el correo de acceso.</strong> Revisa spam y
          promociones; si no aparece, contáctanos.
        </P>
      </Section>

      <Section>
        <H2>Documentos</H2>
        <Ul>
          <li>
            <a href={LEGAL.refundsPath} className="text-[#a78bca] underline">
              Cancelaciones y reembolsos
            </a>
          </li>
          <li>
            <a href={LEGAL.privacyPath} className="text-[#a78bca] underline">
              Política de privacidad
            </a>
          </li>
          <li>
            <a href={LEGAL.termsPath} className="text-[#a78bca] underline">
              Términos y condiciones
            </a>
          </li>
        </Ul>
      </Section>
    </LegalPage>
  )
}
