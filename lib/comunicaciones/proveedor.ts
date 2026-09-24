// CENTRO DE COMUNICACIONES — el trato con Resend.
//
// Todo lo que sale hacia el proveedor pasa por aquí. Ninguna ruta del panel
// habla con Resend directamente: si mañana cambia la forma de una llamada, o
// el proveedor, se cambia en este archivo y en ninguno más.
//
// ── POR QUÉ BROADCASTS Y NO UN BUCLE DE ENVÍOS ─────────────────────────────
// La tentación es obvia: recorrer la lista y mandar un correo por persona. Con
// ochocientos miembros eso son ochocientas peticiones desde un Worker que
// tiene un tiempo de ejecución limitado. Si se corta a la mitad, unos lo
// reciben y otros no, y no hay forma de saber por dónde iba; si se reintenta,
// los primeros lo reciben dos veces.
//
// Un Broadcast es UNA petición. Resend se encarga del reparto, de los
// reintentos, del enlace de baja y de las métricas. Lo que hay que hacer bien
// desde aquí es que su lista de contactos se parezca a la nuestra, y eso es lo
// que hace `sincronizarContactos`.
//
// ── QUÉ NO SE HACE AQUÍ ────────────────────────────────────────────────────
// No se tocan dominios, ni DNS, ni claves. Eso se configura una vez, fuera, y
// no tiene por qué automatizarse.

import { Resend } from "resend"

/**
 * El cliente, creado solo cuando se usa.
 *
 * Se instancia perezosamente igual que el de los correos transaccionales: sin
 * clave configurada, el proyecto tiene que poder compilar y arrancar. Lo que
 * no puede es fingir que envió algo.
 */
let cliente: Resend | null = null

export class ProveedorNoConfigurado extends Error {
  constructor() {
    super("El proveedor de correo no está configurado")
    this.name = "ProveedorNoConfigurado"
  }
}

export function hayProveedor(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

function resend(): Resend {
  if (cliente) return cliente
  const clave = process.env.RESEND_API_KEY
  if (!clave) throw new ProveedorNoConfigurado()
  cliente = new Resend(clave)
  return cliente
}

/**
 * El remitente.
 *
 * Se comparte con los correos transaccionales a propósito: un solo dominio
 * verificado, una sola reputación que cuidar. Si el editorial saliera de otro
 * dominio habría que calentarlo aparte y los primeros envíos irían a spam.
 */
export function remitente(): string {
  return process.env.EMAIL_FROM || "Los 144000 <noreply@los144000.com>"
}

export function responderA(): string | undefined {
  return process.env.EMAIL_REPLY_TO || undefined
}

/** El sitio, para los enlaces del correo. */
export function sitio(): string {
  return process.env.NEXT_PUBLIC_MIEMBROS_URL || "https://los144000.com"
}

/**
 * Traduce un fallo del proveedor a algo que se pueda enseñar.
 *
 * Nunca sale hacia el navegador el mensaje crudo: puede traer identificadores
 * internos y, en algunos casos, trozos de la petición. Se registra entero en
 * el servidor y se devuelve una frase.
 */
export function mensajeDeError(e: unknown): string {
  if (e instanceof ProveedorNoConfigurado) {
    return "El proveedor de correo no está configurado en este entorno."
  }
  const texto = e instanceof Error ? e.message : String(e ?? "")
  if (/rate.?limit/i.test(texto)) return "El proveedor está limitando las peticiones. Inténtalo en un minuto."
  if (/unauthor|forbidden|invalid.*key|401|403/i.test(texto)) return "El proveedor rechazó las credenciales."
  if (/not.?found|404/i.test(texto)) return "El proveedor no encuentra ese recurso."
  if (/domain|verif/i.test(texto)) return "El dominio de envío no está verificado en el proveedor."
  if (/network|fetch|timeout|ECONN/i.test(texto)) return "No se pudo contactar con el proveedor."
  return "El proveedor devolvió un error. Revisa el registro del servidor."
}

// ── La audiencia ───────────────────────────────────────────────────────────

/** Cómo se llama nuestra lista dentro de Resend. */
const NOMBRE_AUDIENCIA = "Los 144000 · Miembros"

/**
 * El identificador de nuestra audiencia, creándola si aún no existe.
 *
 * Se prefiere la variable de entorno cuando está puesta: fija la audiencia y
 * evita que un despiste cree una segunda con el mismo nombre. Sin ella, se
 * busca por nombre antes de crear, que es lo que hace esto idempotente.
 */
export async function audienciaPrincipal(): Promise<string> {
  const fijada = process.env.RESEND_AUDIENCE_ID
  if (fijada) return fijada

  const r = resend()
  const lista = await r.audiences.list()
  if (lista.error) throw new Error(lista.error.message)

  const ya = (lista.data?.data || []).find((a) => a.name === NOMBRE_AUDIENCIA)
  if (ya) return ya.id

  const creada = await r.audiences.create({ name: NOMBRE_AUDIENCIA })
  if (creada.error || !creada.data) throw new Error(creada.error?.message || "No se pudo crear la audiencia")
  return creada.data.id
}

// ── Los contactos ──────────────────────────────────────────────────────────

export type ContactoDeseado = {
  userId: string
  email: string
  nombre: string | null
  /** True si esta persona NO debe recibir nada editorial. */
  dadoDeBaja: boolean
}

export type ResultadoSincronizacion = {
  audienceId: string
  creados: number
  actualizados: number
  sinCambios: number
  fallidos: number
  errores: Array<{ email: string; error: string }>
}

/**
 * Deja la lista de Resend igual que la nuestra, sin duplicar nada.
 *
 * ── LA IDEMPOTENCIA ────────────────────────────────────────────────────────
 * `communication_contacts` guarda, por miembro, qué se le mandó al proveedor
 * la última vez. Si el correo y el estado de baja no han cambiado, no se hace
 * ninguna llamada. Sincronizar dos veces seguidas no toca nada.
 *
 * Y cuando Resend responde que ese contacto ya existe —porque se creó en otra
 * ejecución que no llegó a guardarse— no se trata como un fallo: se pasa a
 * actualizarlo. Ese caso es exactamente el que llenaría la audiencia de
 * duplicados si se insistiera en crear.
 *
 * Recibe y devuelve datos; NO toca la base. Quien llama decide qué guardar,
 * para que este archivo siga hablando solo con el proveedor.
 */
export async function sincronizarContactos(
  audienceId: string,
  deseados: ContactoDeseado[],
  yaSincronizados: Map<string, { contactId: string | null; email: string | null; unsubscribed: boolean | null }>,
  registrar: (userId: string, datos: { contactId: string | null; email: string; unsubscribed: boolean; error?: string }) => void,
): Promise<ResultadoSincronizacion> {
  const r = resend()
  const res: ResultadoSincronizacion = {
    audienceId, creados: 0, actualizados: 0, sinCambios: 0, fallidos: 0, errores: [],
  }

  for (const d of deseados) {
    const previo = yaSincronizados.get(d.userId)
    const nombrePila = (d.nombre || "").trim().split(/\s+/)[0] || undefined

    // Nada que hacer: ya está y no ha cambiado.
    if (previo?.contactId && previo.email === d.email && previo.unsubscribed === d.dadoDeBaja) {
      res.sinCambios++
      continue
    }

    try {
      if (previo?.contactId) {
        const up = await r.contacts.update({
          audienceId,
          id: previo.contactId,
          unsubscribed: d.dadoDeBaja,
          firstName: nombrePila ?? null,
        })
        if (up.error) throw new Error(up.error.message)
        res.actualizados++
        registrar(d.userId, { contactId: previo.contactId, email: d.email, unsubscribed: d.dadoDeBaja })
        continue
      }

      const creado = await r.contacts.create({
        audienceId,
        email: d.email,
        firstName: nombrePila,
        unsubscribed: d.dadoDeBaja,
      })

      if (creado.error) {
        // Ya existía. No es un fallo: es el caso normal cuando una ejecución
        // anterior creó el contacto y no llegó a anotarse.
        if (/already|exists|duplicate/i.test(creado.error.message || "")) {
          const up = await r.contacts.update({
            audienceId,
            email: d.email,
            unsubscribed: d.dadoDeBaja,
            firstName: nombrePila ?? null,
          })
          if (up.error) throw new Error(up.error.message)
          res.actualizados++
          registrar(d.userId, { contactId: up.data?.id ?? null, email: d.email, unsubscribed: d.dadoDeBaja })
          continue
        }
        throw new Error(creado.error.message)
      }

      res.creados++
      registrar(d.userId, { contactId: creado.data?.id ?? null, email: d.email, unsubscribed: d.dadoDeBaja })
    } catch (e) {
      res.fallidos++
      const msg = e instanceof Error ? e.message : String(e)
      // El correo sí puede ir en este registro: es del propio panel y ayuda a
      // saber a quién hay que revisar. No sale de la respuesta de la API.
      res.errores.push({ email: d.email, error: msg })
      registrar(d.userId, { contactId: previo?.contactId ?? null, email: d.email, unsubscribed: d.dadoDeBaja, error: msg })
    }
  }

  return res
}

// ── Las comunicaciones ─────────────────────────────────────────────────────

export type BorradorProveedor = {
  audienceId: string
  nombre: string
  asunto: string
  preheader: string
  html: string
  texto: string
}

/**
 * Crea la comunicación en el proveedor SIN enviarla.
 *
 * Crear y enviar son dos pasos separados a propósito. Si fueran uno, cualquier
 * reintento de la creación sería un envío. Así, lo peor que puede pasar con un
 * reintento aquí es que quede un borrador de más en el proveedor.
 */
export async function crearBroadcast(b: BorradorProveedor): Promise<string> {
  const r = resend()
  const creado = await r.broadcasts.create({
    audienceId: b.audienceId,
    name: b.nombre.slice(0, 120),
    from: remitente(),
    replyTo: responderA(),
    subject: b.asunto,
    previewText: b.preheader || undefined,
    html: b.html,
    text: b.texto,
  })
  if (creado.error || !creado.data) {
    throw new Error(creado.error?.message || "El proveedor no aceptó la comunicación")
  }
  return creado.data.id
}

/**
 * Lo manda. Con `cuando`, lo programa.
 *
 * `cuando` va en ISO y en UTC. La zona horaria que eligió administración se
 * guarda en nuestra base para poder volver a escribirla en pantalla; al
 * proveedor se le da un instante, que no admite interpretación.
 */
export async function enviarBroadcast(id: string, cuando?: string | null): Promise<void> {
  const r = resend()
  const enviado = await r.broadcasts.send(id, cuando ? { scheduledAt: cuando } : undefined)
  if (enviado.error) throw new Error(enviado.error.message)
}

export type EstadoProveedor = {
  status: "draft" | "queued" | "sent"
  scheduledAt: string | null
  sentAt: string | null
}

export async function estadoBroadcast(id: string): Promise<EstadoProveedor> {
  const r = resend()
  const b = await r.broadcasts.get(id)
  if (b.error || !b.data) throw new Error(b.error?.message || "No se pudo consultar la comunicación")
  return {
    status: b.data.status,
    scheduledAt: b.data.scheduled_at,
    sentAt: b.data.sent_at,
  }
}

/**
 * Cancela una comunicación programada.
 *
 * En Resend, cancelar una programada es borrar el broadcast. Solo tiene efecto
 * mientras no haya salido; por eso quien llama comprueba antes el estado, y no
 * se deja cancelar nada que ya esté enviado.
 */
export async function cancelarBroadcast(id: string): Promise<void> {
  const r = resend()
  const fuera = await r.broadcasts.remove(id)
  if (fuera.error) throw new Error(fuera.error.message)
}

// ── La prueba ──────────────────────────────────────────────────────────────

/**
 * Un correo de prueba.
 *
 * NO es un broadcast. No toca la audiencia, no cuenta como envío, no aparece
 * en las métricas de ninguna campaña y no puede alcanzar a un miembro por
 * accidente: va por el canal de correo suelto, exactamente a las direcciones
 * que se le pasan.
 *
 * El HTML es el mismo que recibiría la gente. Si fuera otro, la prueba no
 * probaría nada.
 */
export async function enviarPrueba(p: {
  para: string[]
  asunto: string
  html: string
  texto: string
}): Promise<string | null> {
  const r = resend()
  const enviado = await r.emails.send({
    from: remitente(),
    to: p.para,
    replyTo: responderA(),
    // El prefijo evita el error de confundir una prueba con lo real en la
    // propia bandeja de quien la pidió.
    subject: `[PRUEBA] ${p.asunto}`,
    html: p.html,
    text: p.texto,
    headers: { "X-Entity-Ref-ID": `prueba-${Date.now()}` },
  })
  if (enviado.error) throw new Error(enviado.error.message)
  return enviado.data?.id ?? null
}
