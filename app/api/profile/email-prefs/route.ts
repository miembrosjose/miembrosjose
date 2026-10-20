// API — qué correos quiere recibir cada miembro.
//
//   GET  /api/profile/email-prefs
//   POST /api/profile/email-prefs   { novedades?, contenidos?, sesiones?, red?, recordatorios?, unsubscribed_all? }
//
// ── ESTO NO ES notification-prefs ──────────────────────────────────────────
// Aquella ruta gobierna la CAMPANA de dentro de la plataforma: quién responde
// en el foro, quién sube de nivel. Vive en `user_metadata` y está bien ahí.
//
// Esta gobierna el CORREO. Son dos cosas distintas y se ven distintas en el
// perfil. Vive en tabla propia porque hay que poder preguntar «¿a cuántos les
// llegaría esto?» del lado del servidor, y `user_metadata` no se consulta así:
// habría que recorrer usuarios uno a uno cada vez que se prepara un envío.
//
// ── LO QUE ESTO NO APAGA ───────────────────────────────────────────────────
// Los correos transaccionales. Quien se da de baja de todo sigue recibiendo su
// enlace de acceso, su recuperación de cuenta y el aviso de un pago fallido.
// No son publicidad: son el funcionamiento de su cuenta, y dejarle sin ellos
// sería dejarle fuera de la plataforma sin haberlo pedido.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { PREFERENCIAS_POR_DEFECTO, type PreferenciasCorreo } from "@/lib/comunicaciones/servidor"

export const dynamic = "force-dynamic"

const CAMPOS = ["novedades", "contenidos", "sesiones", "red", "recordatorios", "unsubscribed_all"] as const

/**
 * Lo que se enseña en el perfil, con las mismas palabras que usa el panel al
 * calcular la audiencia. Si aquí dijera una cosa y allí otra, nadie sabría qué
 * apaga qué.
 */
// No se exporta: Next se queja de cualquier export de una ruta que no sea un
// manejador, y ya hay dos sitios del proyecto arrastrando ese aviso. La
// pantalla tiene su propia copia de estas etiquetas.
const FAMILIAS = [
  {
    id: "novedades" as const,
    titulo: "Novedades importantes",
    descripcion: "Anuncios y comunicaciones especiales de Los 144.000.",
  },
  {
    id: "contenidos" as const,
    titulo: "Nuevos contenidos y transmisiones",
    descripcion: "Cuando se publica un episodio, un módulo o una transmisión.",
  },
  {
    id: "sesiones" as const,
    titulo: "Sesiones en vivo y activaciones",
    descripcion: "Anuncios y recordatorios de lo que ocurre en directo.",
  },
  {
    id: "red" as const,
    titulo: "Encuentros y actividad de La Red",
    descripcion: "Encuentros y lo que se mueve en la comunidad.",
  },
  // ── POR QUÉ ESTA FAMILIA EXISTE APARTE ──────────────────────────────
  // Las otras cuatro responden a algo que la persona está siguiendo: un
  // episodio de su temporada, una sesión a la que va. Un recordatorio no
  // responde a nada suyo: es una decisión nuestra de insistirle para que
  // vuelva.
  //
  // Sin su propio interruptor, quien no quiere que le insistan tendría que
  // apagar también los avisos de las sesiones, y lo que acabaría haciendo
  // es darse de baja de todo.
  {
    id: "recordatorios" as const,
    titulo: "Recordatorios para continuar",
    descripcion: "Si dejaste algo a medias, o si llevas tiempo sin aparecer.",
  },
]

/**
 * Las columnas que se leen, y la vuelta atrás si una todavía no existe.
 *
 * ── POR QUÉ ESTO NO ES PARANOIA ────────────────────────────────────────────
 * El código se despliega con un empujón a `main`, y el SQL lo corre una
 * persona a mano en Supabase. Entre las dos cosas hay un hueco, y a veces son
 * horas o días.
 *
 * Sin esta vuelta atrás, durante ese hueco la pantalla de preferencias de
 * TODOS los miembros devolvería un error: la consulta pide una columna que
 * aún no está. Nadie podría cambiar nada, y lo que se vería es que la
 * plataforma se rompió — no que falta un paso.
 *
 * Es el mismo patrón que usa /api/notifications con `source_insignia_id`, y
 * por la misma razón. Cuando la columna lleve tiempo puesta, esto se puede
 * borrar y quedarse con la lista de arriba.
 */
const COLUMNAS = "novedades, contenidos, sesiones, red, recordatorios, unsubscribed_all"
const COLUMNAS_ANTES = "novedades, contenidos, sesiones, red, unsubscribed_all"

/** ¿Es el error de una columna que no existe, y no otra cosa? */
function faltaLaColumna(mensaje: string | undefined): boolean {
  return /recordatorios|column|schema cache/i.test(mensaje || "")
}

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  // Con la sesión de quien pregunta, no con la clave de servicio: la policy de
  // fila propia es la que garantiza que nadie lea las de otro, y usarla aquí es
  // la forma de comprobar que funciona.
  const leer = (columnas: string) => supabase
    .from("email_preferences")
    .select(columnas)
    .eq("user_id", user.id)
    .maybeSingle()

  let { data, error } = await leer(COLUMNAS)
  if (error && faltaLaColumna(error.message)) {
    ;({ data, error } = await leer(COLUMNAS_ANTES))
  }
  if (error) {
    console.error("[email-prefs] leer:", error.message)
    return NextResponse.json({ error: "No se pudieron leer las preferencias" }, { status: 500 })
  }

  // Sin fila, todo encendido. Quien acaba de entrar no ha dicho que no a nada.
  // Y si la columna de los recordatorios todavía no existe, el valor por
  // defecto la rellena encendida, que es lo correcto: nadie la ha apagado.
  // El `select` con una cadena variable no deja inferir la forma de la fila,
  // así que se afirma: un registro de banderas, que es lo que la tabla tiene.
  const fila = (data || {}) as Partial<PreferenciasCorreo>
  const prefs: PreferenciasCorreo = { ...PREFERENCIAS_POR_DEFECTO, ...fila }

  return NextResponse.json({ ok: true, prefs, familias: FAMILIAS })
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const cambios: Record<string, unknown> = {}
  for (const campo of CAMPOS) {
    if (typeof body[campo] === "boolean") cambios[campo] = body[campo]
  }
  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: "Nada que cambiar" }, { status: 400 })
  }

  // Cuándo se dio de baja, para poder responder si alguien reclama que sigue
  // recibiendo correos. Se pone al darse de baja y se limpia al volver.
  if (typeof cambios.unsubscribed_all === "boolean") {
    cambios.unsubscribed_at = cambios.unsubscribed_all ? new Date().toISOString() : null
  }

  const guardar = (c: Record<string, unknown>) => supabase
    .from("email_preferences")
    .upsert({ user_id: user.id, ...c }, { onConflict: "user_id" })

  let { error } = await guardar(cambios)
  if (error && faltaLaColumna(error.message)) {
    // Se guarda lo demás y se dice que el recordatorio no se pudo. Tirar el
    // cambio entero porque falta UNA columna significa que quien quiso
    // apagar las novedades tampoco lo consigue, y eso sí importa.
    const { recordatorios, ...resto } = cambios
    void recordatorios
    if (Object.keys(resto).length > 0) {
      ;({ error } = await guardar(resto))
    } else {
      error = null
    }
  }

  if (error) {
    console.error("[email-prefs] guardar:", error.message)
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 })
  }

  const leer = (columnas: string) => supabase
    .from("email_preferences")
    .select(columnas)
    .eq("user_id", user.id)
    .maybeSingle()

  let { data, error: errLeer } = await leer(COLUMNAS)
  if (errLeer && faltaLaColumna(errLeer.message)) {
    ;({ data } = await leer(COLUMNAS_ANTES))
  }

  return NextResponse.json({
    ok: true,
    prefs: { ...PREFERENCIAS_POR_DEFECTO, ...((data || {}) as Partial<PreferenciasCorreo>) },
  })
}
