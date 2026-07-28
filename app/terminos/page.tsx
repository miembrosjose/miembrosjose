import type { Metadata } from "next"
import { LegalPage, H2, P, Ul, Section } from "@/components/legal/legal-page"
import {
  LEGAL,
  priceWithInterval,
  legalEntityDisplay,
  governingLawDisplay,
} from "@/lib/site/legal-config"

export const metadata: Metadata = {
  title: "Términos y Condiciones · Los 144.000",
  description:
    "Términos y condiciones de la membresía por suscripción de Los 144.000.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${LEGAL.siteUrl}${LEGAL.termsPath}` },
}

export default function TerminosPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Términos y Condiciones"
      updated={LEGAL.effectiveDate}
      version={LEGAL.termsVersion}
      summary={
        <>
          {LEGAL.serviceName} es un servicio digital por suscripción de{" "}
          {priceWithInterval()} con renovación automática. Puedes cancelar en cualquier momento
          desde <strong className="text-[#F3F6FA]">Mi membresía</strong> (Stripe Customer Portal).
          Al suscribirte aceptas estos términos.
        </>
      }
    >
      <Section>
        <H2>1. El servicio</H2>
        <P>
          {LEGAL.serviceName}, operado por {LEGAL.operatorName}, es una experiencia audiovisual digital de acceso
          a contenido exclusivo dentro del área de miembros. La membresía es un servicio digital: no
          se entrega ningún producto físico.
        </P>
      </Section>

      <Section>
        <H2>2. Cuenta, acceso personal e intransferible</H2>
        <P>
          El acceso es personal e intransferible. Para ingresar debes crear una cuenta y definir una
          contraseña. Eres responsable de mantener la confidencialidad de tus credenciales y de toda
          actividad realizada desde tu cuenta. No compartas tu acceso con terceros.
        </P>
      </Section>

      <Section>
        <H2>3. Precio, periodicidad y renovación automática</H2>
        <Ul>
          <li>Precio: {priceWithInterval()} ({LEGAL.currency}).</li>
          <li>Periodicidad: facturación {LEGAL.billingInterval}.</li>
          <li>
            Renovación automática: la suscripción se renueva automáticamente cada periodo hasta que
            la canceles.
          </li>
          <li>
            Al suscribirte autorizas expresamente el cobro recurrente de {priceWithInterval()} hasta
            que canceles tu suscripción.
          </li>
        </Ul>
      </Section>

      <Section>
        <H2>4. Pagos y gestión</H2>
        <P>
          Los pagos se procesan a través de {LEGAL.providers.payments}. La gestión de tu suscripción
          (método de pago, facturas y cancelación) se realiza mediante el {LEGAL.cancellationMethod},
          accesible desde <strong className="text-[#F3F6FA]">Mi membresía</strong>. {legalEntityDisplay()} no
          almacena los números completos de tu tarjeta; esos datos son gestionados por el proveedor de pagos.
        </P>
      </Section>

      <Section>
        <H2>5. Cancelación y acceso</H2>
        <P>
          Puedes cancelar cuando quieras desde el portal. Una cancelación programada mantiene el
          acceso hasta el final del periodo ya pagado. Una cancelación inmediata puede finalizar el
          acceso. Los pagos fallidos pueden suspender temporalmente la cuenta; al regularizar el pago
          el acceso puede restablecerse. Consulta la{" "}
          <a href={LEGAL.refundsPath} className="text-[#a78bca] underline">
            política de cancelaciones y reembolsos
          </a>.
        </P>
      </Section>

      <Section>
        <H2>6. Disponibilidad del contenido</H2>
        <P>
          El contenido puede añadirse, actualizarse o retirarse con el tiempo. Procuramos mantener la
          disponibilidad del servicio, pero no garantizamos que esté libre de interrupciones o errores.
        </P>
      </Section>

      <Section>
        <H2>7. Uso permitido y propiedad intelectual</H2>
        <P>
          Todo el contenido (videos, audios, textos e imágenes) está protegido por derechos de
          propiedad intelectual y se ofrece únicamente para tu uso personal dentro de la plataforma.
        </P>
        <Ul>
          <li>No copies, descargues de forma no autorizada, revendas ni distribuyas el contenido.</li>
          <li>No compartas tu acceso ni reproduzcas públicamente el material.</li>
          <li>No intentes eludir las medidas técnicas de acceso.</li>
        </Ul>
      </Section>

      <Section>
        <H2>8. Conducta</H2>
        <P>
          Dentro de los espacios comunitarios (comentarios, mensajes, foro) debes mantener un trato
          respetuoso. Nos reservamos el derecho de moderar o retirar contenido que incumpla estas reglas.
        </P>
      </Section>

      <Section>
        <H2>9. Suspensión y terminación</H2>
        <P>
          Podemos suspender o terminar el acceso en caso de impago, abuso, fraude o incumplimiento de
          estos términos.
        </P>
      </Section>

      <Section>
        <H2>10. Limitación de responsabilidad</H2>
        <P>
          El servicio se ofrece &ldquo;tal cual&rdquo;. En la medida permitida por la ley, la
          responsabilidad de {legalEntityDisplay()} se limita de forma razonable a los importes
          efectivamente abonados por el periodo correspondiente. Nada en estos términos excluye
          responsabilidades que no puedan excluirse legalmente.
        </P>
      </Section>

      <Section>
        <H2>11. Modificaciones</H2>
        <P>
          Podemos modificar el servicio o estos términos. Los cambios relevantes se comunicarán por
          los medios habituales y la versión vigente será la publicada en esta página.
        </P>
      </Section>

      <Section>
        <H2>12. Comunicaciones y contacto</H2>
        <P>
          Las comunicaciones relativas a tu cuenta se envían por correo electrónico. Para consultas,
          visita la página de{" "}
          <a href={LEGAL.supportPath} className="text-[#a78bca] underline">
            soporte
          </a>.
        </P>
      </Section>

      <Section>
        <H2>13. Ley aplicable</H2>
        <P>
          Estos términos se rigen por {governingLawDisplay()}. Este documento es un marco general y
          puede requerir revisión legal según tu jurisdicción.
        </P>
      </Section>
    </LegalPage>
  )
}
