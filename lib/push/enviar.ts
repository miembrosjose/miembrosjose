// ═══════════════════════════════════════════════════════════════════════════
//  WEB PUSH · el envío, con Web Crypto y sin dependencias
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ NO SE USA LA LIBRERÍA `web-push` ───────────────────────────────
// Es la opción obvia y aquí no sirve. `web-push` está escrita para Node: usa
// su módulo `crypto` con APIs que el runtime de Cloudflare Workers no expone
// igual, y arrastra dependencias pensadas para un servidor con sistema de
// archivos. Con `nodejs_compat` puede que funcione hoy y deje de hacerlo en la
// siguiente fecha de compatibilidad, y el fallo aparecería en producción, al
// enviar, no al construir.
//
// Todo lo que hace falta está en la Web Crypto estándar, que Workers soporta
// de forma nativa. Son dos cosas:
//
//   1. VAPID — un JWT firmado con ES256 que le dice al servicio de push
//      (Google, Apple, Mozilla) quién envía. Sin esto rechazan la petición.
//
//   2. aes128gcm — el cuerpo va CIFRADO de extremo a extremo con las claves
//      que generó el navegador. Ni Google ni Apple pueden leerlo: solo el
//      dispositivo. Por eso las suscripciones guardan `p256dh` y `auth`.
//
// ── POR QUÉ NO SE PAGA NADA ────────────────────────────────────────────────
// Web Push es un estándar abierto. Los servicios de Google y Apple son
// gratuitos y no requieren cuenta: la autenticación la da la clave VAPID, que
// generamos nosotros. No hay proveedor de por medio.

// ── Utilidades de base64url ────────────────────────────────────────────────
// Todo el protocolo habla en base64url (sin relleno, con - y _). El `atob` del
// navegador espera base64 normal, así que hay que traducir en los dos sentidos.

function b64urlADatos(s: string): Uint8Array<ArrayBuffer> {
  const base = s.replace(/-/g, "+").replace(/_/g, "/")
  const relleno = base + "=".repeat((4 - (base.length % 4)) % 4)
  const bin = atob(relleno)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function datosAB64url(b: ArrayBuffer | Uint8Array): string {
  const bytes = b instanceof Uint8Array ? b : new Uint8Array(b)
  let s = ""
  for (const x of bytes) s += String.fromCharCode(x)
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/**
 * Texto a bytes, con el tipo concreto que pide Web Crypto.
 *
 * `TextEncoder.encode` devuelve un Uint8Array genérico sobre su buffer, y las
 * APIs de criptografía piden uno respaldado por un ArrayBuffer concreto. Esto
 * lo normaliza en un sitio en vez de repetir la conversión diez veces.
 */
function enc(s: string): Uint8Array<ArrayBuffer> {
  const u = new TextEncoder().encode(s)
  const out = new Uint8Array(u.length)
  out.set(u)
  return out
}

function unir(...partes: Uint8Array<ArrayBuffer>[]): Uint8Array<ArrayBuffer> {
  const total = partes.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let i = 0
  for (const p of partes) { out.set(p, i); i += p.length }
  return out
}

// ── VAPID ──────────────────────────────────────────────────────────────────
//
// El JWT dice: «esto va para tal servicio, caduca en tantas horas, y me puedes
// escribir a este correo si algo va mal». Lo firma la clave privada, y el
// servicio lo valida contra la pública que el navegador ya conoce.
//
// `exp` NO puede ser muy largo: los servicios rechazan tokens con más de 24
// horas de vida. Se usan 12, que da margen de sobra para un envío.

/**
 * El JWT firmado, guardado por servicio de push.
 *
 * ── POR QUÉ SE GUARDA ────────────────────────────────────────────────────
 * El token no depende del dispositivo ni del aviso: solo de a qué servicio va
 * —todos los Android pasan por el mismo, todos los iPhone por otro— y de
 * cuándo caduca. Firmarlo otra vez para cada dispositivo es repetir la misma
 * operación de criptografía con el mismo resultado.
 *
 * En un aviso suelto da igual. En una tanda de doscientos son doscientas
 * firmas en lugar de dos, y el tiempo de proceso de un Worker no es infinito:
 * esa diferencia es la que decide si un comunicado sale entero o se corta.
 *
 * ── POR QUÉ NO HACE FALTA LIMPIARLA ──────────────────────────────────────
 * Son dos o tres entradas —hay tres servicios de push en el mundo— y el mapa
 * vive lo que viva la instancia del Worker, que son minutos. Una caché con
 * desalojo aquí sería más código que el problema que resuelve.
 */
const JWT_POR_SERVICIO = new Map<string, { cabecera: string; caduca: number }>()

/** Margen antes de la caducidad: nunca se reutiliza un token a punto de morir. */
const MARGEN_JWT_MS = 60 * 60 * 1000

async function cabeceraVapid(endpoint: string): Promise<string> {
  const privada = process.env.VAPID_PRIVATE_KEY
  // ── POR QUÉ DOS NOMBRES PARA LA MISMA CLAVE ─────────────────────────────
  // La pública tiene que estar en los dos lados: el navegador la necesita
  // para suscribirse —y ahí se llama NEXT_PUBLIC_…, que es como Next la
  // incrusta en el paquete— y el servidor la necesita para firmar.
  //
  // Al configurarla solo con el nombre del navegador, esto encontraba la
  // privada, no encontraba la pública, y respondía «VAPID no configurado».
  // El mensaje señalaba al secreto de Cloudflare, que estaba perfecto, y
  // mandaba a buscar el fallo justo donde no estaba.
  //
  // Se aceptan los dos nombres para que no vuelva a depender de cuál se
  // configuró.
  const publica = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const contacto = process.env.VAPID_SUBJECT || "mailto:soporte@los144000.com"

  // Se dice CUÁL falta. «VAPID_no_configurado» a secas obligaba a adivinar
  // entre dos claves y un secreto de Cloudflare.
  if (!privada) throw new Error("falta_VAPID_PRIVATE_KEY")
  if (!publica) throw new Error("falta_VAPID_PUBLIC_KEY")

  const origen = new URL(endpoint).origin

  const guardado = JWT_POR_SERVICIO.get(origen)
  if (guardado && guardado.caduca - MARGEN_JWT_MS > Date.now()) return guardado.cabecera

  const caducaEn = Date.now() + 12 * 60 * 60 * 1000
  const cabecera = { typ: "JWT", alg: "ES256" }
  const cuerpo = {
    aud: origen,
    exp: Math.floor(caducaEn / 1000),
    sub: contacto,
  }
  const parte1 = datosAB64url(enc(JSON.stringify(cabecera)))
  const parte2 = datosAB64url(enc(JSON.stringify(cuerpo)))
  const sinFirmar = `${parte1}.${parte2}`

  // La clave privada llega como el escalar `d` en base64url; se importa como
  // JWK reconstruyendo también la pública, que Web Crypto exige.
  const pub = b64urlADatos(publica)
  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    d: privada,
    x: datosAB64url(pub.slice(1, 33)),
    y: datosAB64url(pub.slice(33, 65)),
    ext: true,
  }

  const clave = await crypto.subtle.importKey(
    "jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"],
  )
  const firma = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" }, clave, enc(sinFirmar),
  )

  const resultado = `vapid t=${sinFirmar}.${datosAB64url(firma)}, k=${publica}`
  JWT_POR_SERVICIO.set(origen, { cabecera: resultado, caduca: caducaEn })
  return resultado
}

// ── CIFRADO aes128gcm (RFC 8291) ───────────────────────────────────────────
//
// El resumen: se genera una pareja de claves efímera, se hace ECDH contra la
// clave pública del navegador, y de ahí salen —vía HKDF— la clave AES y el
// vector de inicialización. El resultado lleva delante una cabecera con la
// sal y la clave pública efímera, para que el dispositivo pueda repetir el
// cálculo y descifrarlo.
//
// Nadie en el camino puede leerlo: ni el servicio de push, ni nosotros una vez
// enviado.

async function hkdf(sal: Uint8Array<ArrayBuffer>, ikm: Uint8Array<ArrayBuffer>, info: Uint8Array<ArrayBuffer>, largo: number): Promise<Uint8Array<ArrayBuffer>> {
  const base = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"])
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: sal, info }, base, largo * 8,
  )
  return new Uint8Array(bits)
}

async function cifrar(
  p256dh: string,
  auth: string,
  cuerpo: string,
): Promise<{ datos: Uint8Array<ArrayBuffer> }> {
  const clavePublicaCliente = b64urlADatos(p256dh)
  const secretoAuth = b64urlADatos(auth)

  // Pareja efímera: una distinta por cada envío.
  const efimera = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"],
  )
  const efimeraPublica = new Uint8Array(await crypto.subtle.exportKey("raw", efimera.publicKey))

  const clienteImportada = await crypto.subtle.importKey(
    "raw", clavePublicaCliente, { name: "ECDH", namedCurve: "P-256" }, false, [],
  )
  const compartido = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: clienteImportada }, efimera.privateKey, 256),
  )

  // Paso 1: del secreto compartido + el `auth` del navegador sale el PRK.
  const infoPrk = unir(
    enc("WebPush: info\0"),
    clavePublicaCliente,
    efimeraPublica,
  )
  const prk = await hkdf(secretoAuth, compartido, infoPrk, 32)

  // Paso 2: con una sal aleatoria salen la clave y el nonce.
  const sal = crypto.getRandomValues(new Uint8Array(16))
  const claveBytes = await hkdf(sal, prk, enc("Content-Encoding: aes128gcm\0"), 16)
  const nonce = await hkdf(sal, prk, enc("Content-Encoding: nonce\0"), 12)

  const clave = await crypto.subtle.importKey("raw", claveBytes, "AES-GCM", false, ["encrypt"])

  // El relleno obligatorio: un 0x02 al final del texto marca el último bloque.
  const conRelleno = unir(enc(cuerpo), new Uint8Array([2]))
  const cifrado = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce, tagLength: 128 }, clave, conRelleno),
  )

  // Cabecera: sal(16) + tamaño de registro(4) + largo de la clave(1) + clave(65)
  const tam = new Uint8Array(4)
  new DataView(tam.buffer).setUint32(0, 4096, false)
  const cabecera = unir(sal, tam, new Uint8Array([efimeraPublica.length]), efimeraPublica)

  return { datos: unir(cabecera, cifrado) }
}

// ── EL ENVÍO ───────────────────────────────────────────────────────────────

export type Suscripcion = {
  id?: string
  endpoint: string
  p256dh: string
  auth: string
}

export type Aviso = {
  title: string
  body?: string
  url?: string
  tag?: string
  icon?: string
  id?: string
  /**
   * Si la aplicación está abierta y en primer plano, llega sin sonido.
   *
   * Para los logros, que ocurren mientras la persona está usando la
   * plataforma y ya los ve en pantalla. Los mensajes NO lo llevan: se puede
   * estar en otra sección y querer enterarse igual.
   */
  silenciarSiAbierta?: boolean
}

export type Resultado =
  | { estado: "ok"; http: number }
  /** La suscripción está muerta: hay que desactivarla, no reintentarla. */
  | { estado: "gone"; http: number }
  | { estado: "fallo"; http: number | null; error: string }

/**
 * Lo que cabe en un push, en bytes.
 *
 * Los servicios no aceptan paquetes mayores y responden 413. El cifrado añade
 * 103 bytes fijos —la cabecera de 86, el delimitador y la etiqueta de AES—
 * así que el texto que se puede mandar es lo que queda.
 */
const TOPE_PAQUETE = 4096
const SOBRECARGA_CIFRADO = 103

/** Cuántas veces se vuelve a intentar un fallo que puede ser pasajero. */
const REINTENTOS = 1

/** Lo máximo que se espera antes de reintentar, aunque el servicio pida más. */
const ESPERA_MAXIMA_MS = 2000

/**
 * ¿Merece la pena volver a intentarlo?
 *
 * ── POR QUÉ SOLO ESTOS ─────────────────────────────────────────────────────
 * Un 429 es el servicio diciendo «vas muy rápido», y un 5xx es un problema
 * suyo: las dos cosas se arreglan solas en un segundo. Reintentarlos recupera
 * avisos que si no se perderían sin que nadie se entere.
 *
 * Un 400 o un 403 NO se reintentan: significan que algo está mal en lo que
 * mandamos —la firma, el formato— y repetirlo da exactamente el mismo error.
 * Y un 404 o un 410 tampoco, porque esa suscripción ya no existe.
 */
function vuelveAIntentarse(http: number): boolean {
  return http === 429 || (http >= 500 && http < 600)
}

/** Lo que pide esperar el servicio, acotado para no colgar la petición. */
function esperaPedida(res: Response): number {
  const cabecera = res.headers.get("retry-after")
  const segundos = cabecera ? Number(cabecera) : NaN
  if (!Number.isFinite(segundos) || segundos < 0) return 600
  return Math.min(segundos * 1000, ESPERA_MAXIMA_MS)
}

/**
 * Manda un aviso a UN dispositivo. Nunca lanza.
 *
 * ── POR QUÉ "gone" ES UN ESTADO APARTE ────────────────────────────────────
 * Un 404 o un 410 del servicio de push no es un error pasajero: significa que
 * esa suscripción ya no existe —desinstalaron la aplicación, se revocó el
 * permiso— y no va a volver. Reintentarla es gastar llamadas para siempre.
 * Quien llama la desactiva.
 */
export async function enviarAUnDispositivo(sub: Suscripcion, aviso: Aviso): Promise<Resultado> {
  try {
    const cuerpo = JSON.stringify({
      title: aviso.title,
      body: aviso.body ?? "",
      url: aviso.url ?? "/miembros",
      tag: aviso.tag,
      icon: aviso.icon,
      id: aviso.id,
      silenciarSiAbierta: aviso.silenciarSiAbierta === true,
    })

    // ── ANTES DE CIFRAR, QUE QUEPA ────────────────────────────────────────
    // Un paquete de más vuelve como 413, que aquí se vería como un fallo
    // cualquiera y mandaría a buscar el problema en la firma o en las claves.
    // Decirlo con su nombre ahorra esa tarde.
    //
    // No se recorta por las bravas: lo que se manda lo decide quien llama, y
    // un aviso cortado a la mitad por sorpresa es peor que uno que no sale y
    // deja constancia de por qué.
    const tamano = new TextEncoder().encode(cuerpo).length
    if (tamano + SOBRECARGA_CIFRADO > TOPE_PAQUETE) {
      return {
        estado: "fallo",
        http: null,
        error: `aviso_demasiado_largo: ${tamano} bytes, caben ${TOPE_PAQUETE - SOBRECARGA_CIFRADO}`,
      }
    }

    const { datos } = await cifrar(sub.p256dh, sub.auth, cuerpo)
    const autorizacion = await cabeceraVapid(sub.endpoint)

    let ultimo: Resultado = { estado: "fallo", http: null, error: "sin_intentar" }

    for (let intento = 0; intento <= REINTENTOS; intento++) {
      const res = await fetch(sub.endpoint, {
        method: "POST",
        headers: {
          Authorization: autorizacion,
          "Content-Encoding": "aes128gcm",
          "Content-Type": "application/octet-stream",
          // Cuánto guarda el servicio el aviso si el móvil está apagado.
          TTL: "86400",
          Urgency: "normal",
        },
        body: datos,
      })

      if (res.status === 404 || res.status === 410) return { estado: "gone", http: res.status }
      if (res.ok) return { estado: "ok", http: res.status }

      const txt = await res.text().catch(() => "")
      ultimo = { estado: "fallo", http: res.status, error: txt.slice(0, 300) }

      if (intento < REINTENTOS && vuelveAIntentarse(res.status)) {
        await new Promise((listo) => setTimeout(listo, esperaPedida(res)))
        continue
      }
      return ultimo
    }

    return ultimo
  } catch (e) {
    return { estado: "fallo", http: null, error: e instanceof Error ? e.message : "error" }
  }
}
