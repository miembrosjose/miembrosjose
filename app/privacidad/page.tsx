import type { Metadata } from "next"
import { LegalPage, H2, P, Ul, Section } from "@/components/legal/legal-page"
import { LEGAL, legalEntityDisplay } from "@/lib/site/legal-config"

export const metadata: Metadata = {
  title: "Política de Privacidad · Los 144.000",
  description: "Cómo Los 144.000 recopila, usa y protege tus datos personales.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${LEGAL.siteUrl}${LEGAL.privacyPath}` },
}

export default function PrivacidadPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Política de Privacidad"
      updated={LEGAL.effectiveDate}
      version={LEGAL.privacyVersion}
      summary={
        <>
          Recopilamos solo los datos necesarios para prestar {LEGAL.serviceName}: tu cuenta, correo,
          perfil y estado de membresía. La autenticación usa {LEGAL.providers.auth}, los pagos{" "}
          {LEGAL.providers.payments} y los correos {LEGAL.providers.email}.{" "}
          <strong className="text-[#F3F6FA]">No almacenamos los números completos de tu tarjeta.</strong>
        </>
      }
    >
      <Section>
        <H2>1. Responsable</H2>
        <P>
          {LEGAL.serviceName} es operado por {legalEntityDisplay()}. Para asuntos de privacidad,
          consulta la sección de contacto al final de este documento.
        </P>
      </Section>

      <Section>
        <H2>2. Qué datos recopilamos</H2>
        <Ul>
          <li>Datos de cuenta: correo electrónico y credenciales de acceso.</li>
          <li>Perfil: nombre y datos que decidas añadir a tu perfil.</li>
          <li>Información de membresía: estado de la suscripción y fechas de periodo.</li>
          <li>Datos técnicos estrictamente necesarios para el funcionamiento y la seguridad.</li>
          <li>Progreso y actividad dentro de la plataforma, cuando exista (p. ej. episodios vistos).</li>
        </Ul>
      </Section>

      <Section>
        <H2>3. Para qué usamos los datos</H2>
        <Ul>
          <li>Crear y autenticar tu cuenta.</li>
          <li>Dar acceso al contenido de la membresía y guardar tu progreso.</li>
          <li>Procesar la suscripción y gestionar el estado de tu acceso.</li>
          <li>Enviar correos transaccionales (activación, recuperación, avisos de la cuenta).</li>
          <li>Prevenir fraude y mantener la seguridad del servicio.</li>
        </Ul>
      </Section>

      <Section>
        <H2>4. Proveedores que tratan datos</H2>
        <Ul>
          <li>
            <strong className="text-[#F3F6FA]">{LEGAL.providers.auth}</strong>: autenticación y base
            de datos de cuentas.
          </li>
          <li>
            <strong className="text-[#F3F6FA]">{LEGAL.providers.payments}</strong>: procesamiento de
            pagos y gestión de la suscripción. Los datos de tarjeta los trata directamente el
            proveedor; nosotros no almacenamos números completos de tarjeta.
          </li>
          <li>
            <strong className="text-[#F3F6FA]">{LEGAL.providers.email}</strong>: envío de correos
            transaccionales.
          </li>
          <li>
            <strong className="text-[#F3F6FA]">{LEGAL.providers.infrastructure}</strong>:
            infraestructura, entrega y seguridad del sitio.
          </li>
        </Ul>
      </Section>

      <Section>
        <H2>5. Conservación</H2>
        <P>
          Conservamos tus datos mientras mantengas una cuenta activa y durante el tiempo necesario
          para cumplir obligaciones legales y de seguridad. Puedes solicitar la eliminación de tu
          cuenta a través del contacto de soporte.
        </P>
      </Section>

      <Section>
        <H2>6. Transferencias internacionales</H2>
        <P>
          Algunos proveedores pueden procesar datos fuera de tu país. En esos casos, el tratamiento
          se realiza conforme a las salvaguardas que ofrezcan dichos proveedores.
        </P>
      </Section>

      <Section>
        <H2>7. Seguridad</H2>
        <P>
          Aplicamos medidas técnicas y organizativas razonables para proteger tus datos (control de
          acceso, cifrado en tránsito y control server-side de la sesión). Ningún sistema es
          completamente infalible, pero trabajamos para reducir los riesgos.
        </P>
      </Section>

      <Section>
        <H2>8. Tus derechos</H2>
        <P>
          Según tu jurisdicción, puedes tener derecho a acceder, rectificar, eliminar u oponerte al
          tratamiento de tus datos, así como a la portabilidad. Para ejercerlos, contáctanos.
        </P>
      </Section>

      <Section>
        <H2>9. Cookies y almacenamiento</H2>
        <P>
          Usamos almacenamiento estrictamente necesario (por ejemplo, cookies de sesión para
          mantenerte autenticado). No utilizamos cookies publicitarias ni rastreadores de terceros
          con fines de marketing en la plataforma.
        </P>
      </Section>

      <Section>
        <H2>10. Contacto</H2>
        <P>
          Para cualquier consulta de privacidad, visita la página de{" "}
          <a href={LEGAL.supportPath} className="text-[#a78bca] underline">
            soporte
          </a>. Este documento es un marco general y puede requerir revisión legal según tu jurisdicción.
        </P>
      </Section>
    </LegalPage>
  )
}
