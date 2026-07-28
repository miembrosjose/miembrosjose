import type { Metadata } from "next"
import { LegalPage, H2, P, Ul, Section } from "@/components/legal/legal-page"
import { LEGAL, priceWithInterval } from "@/lib/site/legal-config"

export const metadata: Metadata = {
  title: "Cancelaciones y Reembolsos · Los 144.000",
  description:
    "Cómo cancelar tu membresía de Los 144.000 y política de reembolsos.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${LEGAL.siteUrl}${LEGAL.refundsPath}` },
}

export default function CancelacionesPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cancelaciones y Reembolsos"
      updated={LEGAL.effectiveDate}
      version={LEGAL.refundPolicyVersion}
      summary={
        <>
          Tu membresía es {LEGAL.billingInterval} ({priceWithInterval()}) y se renueva hasta que la
          canceles. Puedes gestionarla en cualquier momento desde{" "}
          <strong className="text-[#F3F6FA]">Mi membresía</strong>.
        </>
      }
    >
      <Section>
        <H2>1. Cómo cancelar</H2>
        <P>
          Puedes cancelar cuando quieras desde <strong className="text-[#F3F6FA]">Mi membresía</strong>{" "}
          en tu perfil, que abre el {LEGAL.cancellationMethod}. Allí también puedes actualizar tu
          método de pago y ver tus facturas.
        </P>
      </Section>

      <Section>
        <H2>2. Qué pasa al cancelar</H2>
        <Ul>
          <li>
            <strong className="text-[#F3F6FA]">Cancelación al final del periodo:</strong> mantienes el
            acceso hasta la fecha ya pagada; después no se realizan más cobros.
          </li>
          <li>
            <strong className="text-[#F3F6FA]">Cancelación inmediata:</strong> puede finalizar el
            acceso de inmediato.
          </li>
        </Ul>
      </Section>

      <Section>
        <H2>3. Pagos fallidos y suspensión</H2>
        <P>
          Si un pago falla, la cuenta puede quedar temporalmente suspendida. Podrás actualizar tu
          método de pago desde el portal; al regularizar el pago, el acceso se restablece
          automáticamente.
        </P>
      </Section>

      <Section>
        <H2>4. Reembolsos</H2>
        <P>{LEGAL.refundPolicySummary}</P>
        <P>
          Al tratarse de un servicio digital de acceso inmediato, los reembolsos no están
          garantizados salvo que la legislación aplicable disponga lo contrario. Si consideras que tu
          caso amerita un reembolso, escríbenos por soporte y lo evaluaremos.
        </P>
      </Section>

      <Section>
        <H2>5. Soporte</H2>
        <P>
          Para cancelar con ayuda o solicitar un reembolso, visita la página de{" "}
          <a href={LEGAL.supportPath} className="text-[#a78bca] underline">
            soporte
          </a>. Consulta también los{" "}
          <a href={LEGAL.termsPath} className="text-[#a78bca] underline">
            términos
          </a>{" "}
          y la{" "}
          <a href={LEGAL.privacyPath} className="text-[#a78bca] underline">
            política de privacidad
          </a>.
        </P>
      </Section>
    </LegalPage>
  )
}
