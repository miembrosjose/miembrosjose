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

export type EstadoPush =
  | "no_soportado"      // el navegador no sabe de esto
  | "requiere_instalar" // iPhone en Safari sin instalar
  | "sin_permiso"       // se puede pedir
  | "denegado"          // lo denegó: solo se arregla en los ajustes
  | "activo"            // suscrito y funcionando

/** ¿Está corriendo desde el icono y no desde una pestaña del navegador? */
export function estaInstalada(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    // Safari en iOS no soporta display-mode y usa esta propiedad suya.
    (window.navigator as { standalone?: boolean }).standalone === true
  )
}

export function esIOS(): boolean {
  if (typeof navigator === "undefined") return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS se hace pasar por Mac; la pista es que tiene pantalla táctil.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

export async function estadoActual(): Promise<EstadoPush> {
  if (typeof window === "undefined") return "no_soportado"

  const soporta =
    "serviceWorker" in navigator && "PushManager" in window && "Notification" in window

  if (!soporta) {
    // En iPhone la causa casi siempre es que no está instalada, no que el
    // navegador sea incapaz. Distinguirlo cambia por completo qué se le dice.
    return esIOS() && !estaInstalada() ? "requiere_instalar" : "no_soportado"
  }

  if (esIOS() && !estaInstalada()) return "requiere_instalar"

  if (Notification.permission === "denied") return "denegado"
  if (Notification.permission !== "granted") return "sin_permiso"

  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    return sub ? "activo" : "sin_permiso"
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
 */
export async function activarNotificaciones(clavePublica: string): Promise<EstadoPush> {
  const estado = await estadoActual()
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
    if (!res.ok) return "sin_permiso"

    return "activo"
  } catch {
    return "sin_permiso"
  }
}

/** Deja de recibir en ESTE dispositivo. Los demás siguen igual. */
export async function desactivarNotificaciones(): Promise<void> {
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
