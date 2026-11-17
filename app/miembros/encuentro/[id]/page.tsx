// ═══════════════════════════════════════════════════════════════════════════
//  UNA GRABACIÓN, EN SU PROPIA DIRECCIÓN
// ═══════════════════════════════════════════════════════════════════════════
//
//   /miembros/encuentro/<id>
//
// Para poder pegar el enlace de UNA grabación en el grupo y que quien lo abra
// caiga exactamente en ella.
//
// ── POR QUÉ ESTA PÁGINA NO REDIRIGE Y YA ──────────────────────────────────
// Al principio sí: sin sesión, redirección a la pantalla de acceso. Correcto
// para una persona, y rompía justo lo que hace útil un enlace repartido.
//
// Cuando se pega una dirección en WhatsApp o en Telegram, su robot la visita
// para dibujar la tarjeta de la previsualización. Ese robot no tiene sesión,
// así que recibía la redirección, leía la pantalla de acceso, y pintaba el
// título genérico del sitio: «Los 144000 · La Red de Los 144.000…». El mismo
// para las cuarenta grabaciones. Un enlace que no dice cuál es.
//
// Así que ahora la página SIEMPRE responde. Lo que cambia es qué responde:
//
//   · Con sesión y membresía → la grabación entera, con su reproductor.
//   · Sin sesión             → una página mínima que lleva a la de acceso en
//                              el acto, con esta dirección apuntada para
//                              volver después.
//
// Para la persona el efecto es el que se pidió: acaba en la pantalla de
// acceso. Para el robot, hay por fin un título y una imagen que leer.
//
// ── Y EL VÍDEO SIGUE SIENDO PRIVADO ───────────────────────────────────────
// Lo que se hace público es el título, la descripción y la portada: lo que
// aparece en la tarjeta del mensaje, que es exactamente lo que se quería
// enseñar. El reproductor NO se monta sin sesión, y el código de VTurb no
// sale de aquí.
//
// Conviene saberlo al escribir: el título y la descripción de una grabación
// los puede leer cualquiera que reciba el enlace, tenga cuenta o no. La
// portada ya era pública de todos modos —VTurb la sirve abierta en su propio
// servidor—, así que ahí no se enseña nada nuevo.

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CalendarDays } from "lucide-react"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { requireMiembrosAuth } from "../../_lib/auth-server"
import { leerVturb } from "@/lib/red/vturb"
import { miniaturaBuena } from "@/lib/red/grabaciones"
import { VturbPlayer } from "../../_components/VturbPlayer"
import { LlevarAlAcceso } from "../../_components/LlevarAlAcceso"
import styles from "./encuentro.module.css"

export const dynamic = "force-dynamic"

type Fila = {
  id: number
  titulo: string
  descripcion: string
  fecha: string
  miniatura: string | null
  embed: string
  estado: string
}

/**
 * Lee la grabación SIN sesión, solo para la tarjeta de la previsualización.
 *
 * Usa el cliente de servicio porque quien pregunta puede ser el robot de
 * WhatsApp, que no tiene cuenta. Devuelve únicamente lo que va a salir en esa
 * tarjeta, y solo si la grabación está publicada: un borrador no debe
 * anunciarse ni aunque alguien acierte el número.
 */
async function paraLaTarjeta(id: number): Promise<Fila | null> {
  try {
    const admin = getSupabaseAdmin()
    const { data } = await admin
      .from("network_recordings")
      .select("id, titulo, descripcion, fecha, miniatura, embed, estado")
      .eq("id", id)
      .eq("estado", "publicado")
      .maybeSingle<Fila>()
    return data ?? null
  } catch {
    // Sin clave de servicio —en pruebas, por ejemplo— la tarjeta queda
    // genérica. Es peor previsualización, no un fallo: la página funciona.
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const numero = Number(id)
  const g = Number.isInteger(numero) ? await paraLaTarjeta(numero) : null

  if (!g) {
    return {
      title: "Encuentro de la Red · Los 144000",
      robots: { index: false, follow: false },
    }
  }

  const lectura = leerVturb(g.embed)
  const portada = miniaturaBuena(
    g.miniatura,
    lectura.ok ? lectura.grabacion.miniatura : null,
  )

  const descripcion =
    g.descripcion?.trim() || "Grabación de un Encuentro de la Red de Los 144.000."

  // ── LA DIRECCIÓN TIENE QUE SER ABSOLUTA ─────────────────────────────
  // `og:url` salía como «/miembros/encuentro/1». OpenGraph pide una
  // dirección completa, y Next solo convierte las relativas si hay un
  // `metadataBase` general, que aquí no lo hay. Unos lectores lo perdonan y
  // otros descartan la tarjeta entera: el fallo aparecería en una aplicación
  // sí y en otra no, que es de los peores de diagnosticar.
  const base = (process.env.NEXT_PUBLIC_MIEMBROS_URL || "https://los144000.com")
    .replace(/\/+$/, "")
  const direccion = `${base}/miembros/encuentro/${numero}`

  return {
    title: `${g.titulo} · Encuentros de la Red`,
    description: descripcion,
    // Sin indexar: que la tarjeta del mensaje se vea bien no significa querer
    // esto en los buscadores.
    robots: { index: false, follow: false },
    alternates: { canonical: direccion },
    openGraph: {
      title: g.titulo,
      description: descripcion,
      type: "video.other",
      url: direccion,
      siteName: "Los 144000",
      locale: "es_LA",
      images: portada ? [{ url: portada, width: 640, height: 360 }] : undefined,
    },
    twitter: {
      card: portada ? "summary_large_image" : "summary",
      title: g.titulo,
      description: descripcion,
      images: portada ? [portada] : undefined,
    },
  }
}

export default async function PaginaEncuentro({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numero = Number(id)
  if (!Number.isInteger(numero)) notFound()

  const destino = `/miembros/encuentro/${numero}`

  // ── ¿Hay sesión? ────────────────────────────────────────────────────────
  // Se mira a mano, antes de nada, porque sin sesión esta página NO redirige:
  // responde con la versión mínima para que el robot de la previsualización
  // encuentre algo que leer. Ver el comentario de arriba.
  const supabaseSesion = await getSupabaseServer()
  const { data: { user } } = await supabaseSesion.auth.getUser()

  if (!user) {
    const g = await paraLaTarjeta(numero)
    return (
      <main className={styles.pagina}>
        <div className={styles.espera}>
          {/* Visible una fracción de segundo para una persona. Para el robot
              de la previsualización, esto es la página entera. */}
          <h1 className={styles.esperaTitulo}>{g?.titulo ?? "Encuentro de la Red"}</h1>
          <p className={styles.esperaTexto}>
            Esta grabación es para miembros. Llevándote a la pantalla de acceso…
          </p>
          <a className={styles.esperaEnlace} href={`/miembros/login?redirectTo=${encodeURIComponent(destino)}`}>
            Entrar
          </a>
        </div>
        <LlevarAlAcceso destino={destino} />
      </main>
    )
  }

  // Con sesión, la comprobación de siempre: membresía activa, o pantalla de
  // acceso suspendido. `volverA` queda por si la sesión caducó entre medias.
  const { supabase } = await requireMiembrosAuth({ volverA: destino })

  // La RLS decide: las publicadas las ve cualquiera con sesión, los borradores
  // solo administración.
  const { data: g } = await supabase
    .from("network_recordings")
    .select("id, titulo, descripcion, fecha, miniatura, embed, estado")
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
            pushState — misma razón que en la lectura de Transmisiones. */}
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
