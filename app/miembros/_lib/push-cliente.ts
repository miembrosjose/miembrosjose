"use client"

// EL LADO DEL NAVEGADOR DE LAS NOTIFICACIONES.
//
// ── POR QUÉ NO SE PIDE EL PERMISO AL ENTRAR ────────────────────────────────
// Pedirlo nada más abrir la web es la forma más rápida de que lo denieguen, y
// un permiso denegado NO se puede volver a pedir: el navegador deja de
// preguntar y la única salida es ir a los ajustes del sistema. Se gasta una
// sola vez.
//
// Por eso aquí no hay nada automático. El permiso se pide desde un gesto
// explícito, después de haber explicado para qué sirve.
//
// ── EL CASO DEL IPHONE ─────────────────────────────────────────────────────
// Safari solo entrega notificaciones web si la persona ha añadido la web a su
// pantalla de inicio. Abierta en una pestaña normal, `Notification` ni existe
// o el permiso falla siempre. Eso no se puede evitar ni pedirle al navegador
// que cambie: hay que detectarlo y explicarlo.

import { apagadoAdrede, marcarApagadoAdrede, olvidarApagado } from "@/lib/pwa/reglas"

export type EstadoPush =
  | "no_soportado"      // el navegador no sabe de esto
  | "requiere_instalar" // iPhone o iPad en Safari, sin instalar
  | "sin_permiso"       // se puede pedir
  | "denegado"          // lo denegó: solo se arregla en los ajustes
  | "activo"            // suscrito, y el servidor lo confirma
  /**
   * El navegador cree que sí y el servidor no se ha enterado.
   *
   * Ocurre de verdad: se concede el permiso, el navegador crea la suscripción
   * y la llamada que la guarda no llega —se cerró la pestaña, falló la red—.
   * Local dice que está todo bien y no llega ni un aviso, porque el servidor
   * no sabe a dónde mandarlos.
   *
   * Antes esto se veía como «activo» y era indistinguible de que funcionara.
   * Ahora se ve, y se arregla volviendo a registrar, que no vuelve a pedir
   * ningún permiso: ya está concedido.
   */
  | "incompleto"
  /**
   * Los activó y después los apagó, en este dispositivo y a propósito.
   *
   * Técnicamente es igual que `sin_permiso` —no hay suscripción— pero no es
   * lo mismo en absoluto: uno no ha decidido nada todavía y el otro ya
   * decidió. Confundirlos es volver a ofrecerle a alguien justo lo que acaba
   * de rechazar.
   */
  | "desactivado"

/** ¿Está corriendo desde el icono y no desde una pestaña del navegador? */
export function estaInstalada(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    // Safari en iOS no soporta display-mode y usa esta propiedad suya.
    (window.navigator as { standalone?: boolean }).standalone === true
  )
}

/**
 * ¿Es un iPad?
 *
 * ── POR QUÉ NO BASTA BUSCAR «iPad» ─────────────────────────────────────────
 * Desde iPadOS 13, Safari en iPad se presenta como un Mac de escritorio: su
 * identificación dice `MacIntel` y no menciona el iPad por ninguna parte. Es
 * deliberado por parte de Apple, para que las webs le sirvan la versión de
 * ordenador.
 *
 * La pista que lo delata es que ese «Mac» tiene pantalla táctil, cosa que
 * ningún Mac de verdad tiene. No es elegante, pero es fiable y es lo que hay.
 *
 * Importa porque las instrucciones son distintas: en el iPhone el botón de
 * compartir está ABAJO en el centro, y en el iPad ARRIBA a la derecha.
 * Decirle a alguien que mire abajo cuando está arriba es dejarlo buscando.
 */
export function esIPad(): boolean {
  if (typeof navigator === "undefined") return false
  if (/iPad/.test(navigator.userAgent)) return true
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
}

export function esIPhone(): boolean {
  if (typeof navigator === "undefined") return false
  return /iPhone|iPod/.test(navigator.userAgent)
}

export function esIOS(): boolean {
  return esIPhone() || esIPad()
}

export function esAndroid(): boolean {
  if (typeof navigator === "undefined") return false
  return /Android/.test(navigator.userAgent)
}

/** Qué aparato tenemos delante, hasta donde se puede saber. */
export type Aparato = "iphone" | "ipad" | "android" | "escritorio" | "desconocido"

/**
 * ── POR QUÉ HAY UN «DESCONOCIDO» Y NO SE ADIVINA ───────────────────────────
 * Porque unas instrucciones equivocadas son peores que unas genéricas. Quien
 * lee «toca Compartir abajo» en un aparato donde eso no existe concluye que la
 * plataforma está rota; quien lee «busca la opción de instalar en el menú de
 * tu navegador» encuentra el camino, aunque le cueste un momento más.
 */
export function queAparato(): Aparato {
  if (esIPhone()) return "iphone"
  if (esIPad()) return "ipad"
  if (esAndroid()) return "android"
  if (typeof navigator === "undefined") return "desconocido"
  // Sin pantalla táctil y con un ratón: es un ordenador con bastante certeza.
  const finoYSinTacto =
    window.matchMedia?.("(pointer: fine)").matches === true && navigator.maxTouchPoints === 0
  return finoYSinTacto ? "escritorio" : "desconocido"
}

/**
 * ¿Sabe el SERVIDOR que este dispositivo está suscrito?
 *
 * Lo que el navegador tiene es un objeto de suscripción. Que ese objeto esté
 * registrado, siga activo y pertenezca a quien ha iniciado sesión AHORA es
 * otra cosa, y es la que decide si va a llegar algo. Ver el `GET` de
 * /api/push/subscribe.
 */
async function elServidorLoConfirma(endpoint: string): Promise<boolean> {
  try {
    const r = await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
      credentials: "include",
    })
    if (!r.ok) return false
    const j = await r.json()
    return j?.esteDispositivo === true
  } catch {
    // Sin red no se puede saber. Se responde que no, que lleva al estado
    // «incompleto»: ofrece reintentar y no promete nada que no se ha podido
    // comprobar.
    return false
  }
}

/**
 * En qué estado están los avisos en ESTE dispositivo.
 *
 * @param userId Hace falta para distinguir a quien apagó los avisos a
 *        propósito de quien nunca los encendió. Sin él se asume que nadie los
 *        apagó, que es lo que hacía antes.
 */
export async function estadoActual(userId?: string): Promise<EstadoPush> {
  if (typeof window === "undefined") return "no_soportado"

  const soporta =
    "serviceWorker" in navigator && "PushManager" in window && "Notification" in window

  if (!soporta) {
    // En iPhone y iPad la causa casi siempre es que no está instalada, no que
    // el navegador sea incapaz. Distinguirlo cambia por completo qué se dice.
    return esIOS() && !estaInstalada() ? "requiere_instalar" : "no_soportado"
  }

  if (esIOS() && !estaInstalada()) return "requiere_instalar"

  if (Notification.permission === "denied") return "denegado"

  if (Notification.permission !== "granted") {
    // Sin permiso y con la marca de haberlos apagado: no es que no haya
    // decidido, es que decidió que no.
    return userId && apagadoAdrede(userId) ? "desactivado" : "sin_permiso"
  }

  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()

    if (!sub) {
      return userId && apagadoAdrede(userId) ? "desactivado" : "sin_permiso"
    }

    // Hay permiso y hay suscripción. Falta lo único que de verdad decide si
    // llega algo: que el servidor la tenga.
    return (await elServidorLoConfirma(sub.endpoint)) ? "activo" : "incompleto"
  } catch {
    return "sin_permiso"
  }
}

/** Deja el service worker instalado. No pide permisos ni molesta a nadie. */
export async function registrarWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null
  try {
    // `/sw.js` en la raíz para que su ámbito sea todo el sitio. Desde una ruta
    // más profunda no podría recibir avisos fuera de ella.
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" })
  } catch {
    return null
  }
}

function claveADatos(base64: string): Uint8Array<ArrayBuffer> {
  const base = base64.replace(/-/g, "+").replace(/_/g, "/")
  const relleno = base + "=".repeat((4 - (base.length % 4)) % 4)
  const bin = atob(relleno)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/**
 * Pide el permiso y registra el dispositivo. **Solo desde un gesto de la
 * persona** — un clic en un botón, nunca al cargar.
 *
 * Devuelve el estado en que queda, para que la pantalla diga la verdad.
 *
 * @param userId Para olvidar la marca de «lo apagué»: volver a encenderlos es
 *        exactamente la decisión contraria, y dejarla puesta haría que la
 *        tarjeta del inicio siguiera callada aunque ya no haya motivo.
 */
export async function activarNotificaciones(
  clavePublica: string,
  userId?: string,
): Promise<EstadoPush> {
  const estado = await estadoActual(userId)
  if (estado === "no_soportado" || estado === "requiere_instalar" || estado === "denegado") {
    return estado
  }

  const permiso = await Notification.requestPermission()
  if (permiso !== "granted") return permiso === "denied" ? "denegado" : "sin_permiso"

  const reg = (await navigator.serviceWorker.getRegistration()) || (await registrarWorker())
  if (!reg) return "no_soportado"

  // `ready` espera a que el worker esté ACTIVO. Sin esto, suscribirse justo
  // después de registrarlo falla porque todavía está instalándose.
  await navigator.serviceWorker.ready

  try {
    // `userVisibleOnly` es obligatorio: el navegador exige que todo push
    // acabe en una notificación visible. No se puede usar para nada en
    // segundo plano sin que la persona lo vea, y está bien que sea así.
    const sub =
      (await reg.pushManager.getSubscription()) ||
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: claveADatos(clavePublica),
      }))

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ subscription: sub.toJSON() }),
    })

    // ── SI EL SERVIDOR NO LA GUARDÓ, NO ES «ACTIVO» ─────────────────────
    // El permiso está concedido y el navegador tiene su suscripción, así que
    // todo PARECE bien. Pero si esto no se guardó, no hay a dónde mandar
    // nada. Antes se devolvía «sin_permiso», que mandaba a pedir otra vez un
    // permiso que ya estaba dado y no arreglaba nada.
    //
    // `incompleto` dice lo que pasa y ofrece lo que hace falta, que es
    // reintentar el registro.
    if (!res.ok) return "incompleto"

    if (userId) olvidarApagado(userId)
    return "activo"
  } catch {
    return "sin_permiso"
  }
}

/**
 * Deja de recibir en ESTE dispositivo. Los demás siguen igual.
 *
 * @param userId Para dejar constancia de que fue una decisión y no un
 *        descuido. Sin esa marca, la tarjeta del inicio volvería a ofrecer
 *        los avisos a quien acaba de apagarlos.
 */
export async function desactivarNotificaciones(userId?: string): Promise<void> {
  // Se marca ANTES de tocar nada. Si la llamada al servidor falla a mitad, la
  // persona ya ha expresado lo que quiere, y lo que no puede pasar es que
  // además le vuelvan a insistir por haber fallado la red.
  if (userId) marcarApagadoAdrede(userId)

  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    if (!sub) return

    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ endpoint: sub.endpoint }),
    })
    await sub.unsubscribe()
  } catch {
    /* si ya no existe, no hay nada que hacer */
  }
}

/**
 * Vuelve a registrar una suscripción que el navegador tiene y el servidor no.
 *
 * No pide ningún permiso: ya está concedido. Es la salida del estado
 * `incompleto`, y lo único que hace es repetir la llamada que falló.
 */
export async function reintentarRegistro(userId?: string): Promise<EstadoPush> {
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    if (!sub) return "sin_permiso"

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ subscription: sub.toJSON() }),
    })
    if (!res.ok) return "incompleto"

    if (userId) olvidarApagado(userId)
    return "activo"
  } catch {
    return "incompleto"
  }
}
