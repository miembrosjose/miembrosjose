// ═══════════════════════════════════════════════════════════════════════════
//  UNA GRABACIÓN, EN SU PROPIA DIRECCIÓN
// ═══════════════════════════════════════════════════════════════════════════
//
//   /miembros/encuentro/<id>
//
// ── PARA QUÉ EXISTE ───────────────────────────────────────────────────────
// Para poder pegar el enlace de UNA grabación en el grupo de Telegram y que
// quien lo abra caiga exactamente en ella.
//
// Mientras el archivo fue solo una rejilla con una ventana encima, eso no se
// podía: todas las grabaciones compartían la misma dirección, así que lo
// único que se podía mandar era «entra a La Red y búscala».
//
// ── Y SIGUE SIENDO PRIVADA ────────────────────────────────────────────────
// La dirección se reparte; el contenido no. Quien la abre sin sesión va a la
// pantalla de acceso, y al entrar vuelve AQUÍ —eso es lo que hace `volverA`—.
// Quien tenga la suscripción caducada va a la pantalla de acceso suspendido.
// La comprobación es la misma de siempre y ocurre en el servidor.
//
// ── POR QUÉ EL TÍTULO NO SALE EN LA PREVISUALIZACIÓN DE TELEGRAM ──────────
// Porque los datos de esta página solo se pueden leer con sesión, y el robot
// que dibuja la tarjeta de Telegram no tiene ninguna. Se podría hacer público
// el título y la imagen para que esa tarjeta quedara bonita, pero eso es una
// decisión sobre qué se enseña fuera, no un detalle técnico: las
// Transmisiones ya resolvieron lo mismo diciendo solo «Transmisión · Los
// 144000». Aquí se hace igual hasta que se decida otra cosa.

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CalendarDays } from "lucide-react"
import { requireMiembrosAuth } from "../../_lib/auth-server"
import { leerVturb } from "@/lib/red/vturb"
import { VturbPlayer } from "../../_components/VturbPlayer"
import { CompartirGrabacion } from "../../_components/CompartirGrabacion"
import styles from "./encuentro.module.css"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return {
    title: "Encuentro de la Red · Los 144000",
    robots: { index: false, follow: false },
    alternates: { canonical: `/miembros/encuentro/${id}` },
  }
}

type Fila = {
  id: number
  titulo: string
  descripcion: string
  fecha: string
  embed: string
  estado: string
}

export default async function PaginaEncuentro({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numero = Number(id)
  if (!Number.isInteger(numero)) notFound()

  // `volverA` es lo que hace que el enlace repartido funcione de verdad: sin
  // esto, quien entra desde Telegram sin sesión acaba en la portada.
  const { supabase } = await requireMiembrosAuth({
    volverA: `/miembros/encuentro/${numero}`,
  })

  // La RLS ya decide: las publicadas las ve cualquiera con sesión, los
  // borradores solo administración. Aquí no hay que filtrar nada a mano.
  const { data: g } = await supabase
    .from("network_recordings")
    .select("id, titulo, descripcion, fecha, embed, estado")
    .eq("id", numero)
    .maybeSingle<Fila>()

  if (!g) notFound()

  const lectura = leerVturb(g.embed)
  const v = lectura.ok ? lectura.grabacion : null

  return (
    <main className={styles.pagina}>
      <article className={styles.articulo}>
        {/* Enlace duro, no next/link: fuerza la recarga de /miembros/red para
            que el SPA lea el hash y abra la pestaña de Encuentros. El
            proveedor de vistas vive en el layout y no se resincroniza con
            pushState — es la misma razón que en la lectura de Transmisiones. */}
        <a href="/miembros/red#encuentros" className={styles.volver}>
          ← Volver a los Encuentros
        </a>

        {g.estado !== "publicado" && (
          <p className={styles.borrador}>
            Esta grabación está en borrador: solo la ve administración. El
            enlace no le funcionará a nadie más hasta que la publiques.
          </p>
        )}

        <p className={styles.fecha}>
          <CalendarDays size={13} aria-hidden /> <Fecha iso={g.fecha} />
        </p>

        <h1 className={styles.titulo}>{g.titulo}</h1>

        <div className={styles.reproductor}>
          <VturbPlayer
            script={v?.script ?? null}
            iframe={v?.iframe ?? null}
            elementoId={v?.elementoId ?? null}
            titulo={g.titulo}
          />
        </div>

        <CompartirGrabacion id={g.id} titulo={g.titulo} />

        {g.descripcion && <p className={styles.descripcion}>{g.descripcion}</p>}
      </article>
    </main>
  )
}

/**
 * La fecha, pintada por el navegador.
 *
 * El servidor vive en UTC: formateada allí, una grabación del día 15 aparece
 * como del 14 para media América. El `suppressHydrationWarning` es porque el
 * servidor y el navegador pintan a propósito cosas distintas aquí.
 */
function Fecha({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {new Date(iso + "T12:00:00").toLocaleDateString("es-419", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
    </time>
  )
}
