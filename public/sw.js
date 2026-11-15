// ═══════════════════════════════════════════════════════════════════════════
//  SERVICE WORKER DE LOS 144.000
// ═══════════════════════════════════════════════════════════════════════════
//
// ── QUÉ HACE, Y SOBRE TODO QUÉ NO ──────────────────────────────────────────
// Solo dos cosas: recibir notificaciones push y abrir la pantalla correcta al
// tocarlas. Nada más.
//
// NO guarda nada en caché. Y eso es deliberado, no una fase pendiente.
//
// Un service worker con caché en una plataforma con sesiones es una trampa
// esperando: guarda la página de alguien y se la sirve a quien entre después
// en ese dispositivo, o devuelve una versión vieja cuando se despliega una
// nueva, y la persona ve datos que ya no existen sin entender por qué. Aquí
// hay bitácoras privadas, progreso y mensajes. No compensa.
//
// Si algún día hace falta funcionar sin conexión, se añade con una lista
// explícita de rutas públicas — nunca con una estrategia general.
//
// ── POR QUÉ ESTE ARCHIVO ESTÁ EN public/ Y NO EN app/ ──────────────────────
// Un service worker solo controla las rutas que cuelgan de su propia
// dirección. Servido desde /sw.js, su ámbito es todo el sitio. Si viviera bajo
// una ruta más profunda, no podría recibir nada fuera de ella.

// ── CICLO DE VIDA ──────────────────────────────────────────────────────────
// `skipWaiting` + `clients.claim` hacen que una versión nueva tome el relevo
// sin esperar a que se cierren todas las pestañas. Sin esto, un service worker
// viejo puede seguir activo días, y una corrección de push no llegaría nunca.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ── LA NOTIFICACIÓN QUE LLEGA ──────────────────────────────────────────────
//
// `event.waitUntil` no es opcional: sin él el navegador puede dormir el worker
// antes de que la notificación se muestre, y no aparece nada.
//
// Si el cuerpo no se puede leer —un push vacío, o mal formado— se enseña un
// aviso genérico en vez de no enseñar nada. Un push recibido y silenciado es
// peor que uno escueto: la persona nunca sabrá que ocurrió algo.
self.addEventListener("push", (event) => {
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch {
    datos = { title: "Los 144.000", body: "Tienes un aviso nuevo." };
  }

  const titulo = datos.title || "Los 144.000";

  const opciones = {
    body: datos.body || "",
    icon: datos.icon || "/icon-192.png",
    // El badge es el icono monocromo de la barra de estado en Android.
    badge: "/icon-192.png",
    // `tag` agrupa: un segundo aviso del mismo hilo reemplaza al anterior en
    // vez de apilarse. Sin esto, diez mensajes son diez notificaciones.
    tag: datos.tag || undefined,
    renotify: Boolean(datos.tag),
    // Lo que necesita el clic para saber a dónde ir. No lleva nada privado.
    data: {
      url: datos.url || "/miembros",
      id: datos.id || null,
    },
    requireInteraction: false,
    silent: false,
  };

  // ── NO VIBRAR A QUIEN YA ESTÁ MIRANDO ────────────────────────────────────
  // Completar una temporada ocurre DENTRO de la aplicación: la persona está
  // ahí, acaba de ver el último capítulo y el aviso en pantalla ya se lo dijo.
  // Que además le suene el teléfono en la mano es el aviso contándole algo que
  // acaba de leer.
  //
  // La notificación se muestra igual —el navegador exige que todo push acabe
  // en una visible, y además queda en el historial— pero sin sonido ni
  // vibración. Interrumpir solo tiene sentido cuando no estás delante.
  //
  // Los mensajes NO llevan esta marca a propósito: alguien puede tener la
  // aplicación abierta en otra pantalla y querer enterarse igual.
  event.waitUntil(
    (async () => {
      if (datos.silenciarSiAbierta) {
        const ventanas = await self.clients.matchAll({ type: "window" });
        if (ventanas.some((v) => v.focused)) opciones.silent = true;
      }
      await self.registration.showNotification(titulo, opciones);
    })(),
  );
});

// ── A DÓNDE SE ABRE, Y EN QUÉ VENTANA ────────────────────────────
//
// ── LO QUE ESTABA MAL ───────────────────────────────────────
// Esto descartaba TODO destino de otro dominio y lo cambiaba en silencio por
// el inicio de la plataforma. O sea: se podía configurar un aviso con el
// enlace de un Zoom, el panel lo aceptaba, el aviso llegaba bien —y al
// tocarlo se abría la portada de miembros—. Sin ningún error en ninguna
// pantalla, porque para el servidor el envío había ido perfecto.
//
// El enlace del encuentro es justo el caso que hacía falta.
//
// ── POR QUÉ AHORA SÍ SE PUEDE CONFIAR EN EL DESTINO ───────────────────
// El miedo original era razonable: este es el único sitio del sistema que
// abre una ventana a partir de un dato recibido, y una dirección cualquiera
// se abriría con toda la apariencia de venir de aquí.
//
// Pero el cuerpo de un push viaja cifrado de extremo a extremo con las claves
// de ESTE dispositivo (RFC 8291) y firmado con nuestra clave VAPID. Nadie
// más puede meter un destino ahí dentro: lo que llega lo escribió nuestro
// servidor, y lo que escribe nuestro servidor es lo que la administración
// tecleó en el panel. Descartarlo no protegía de nada y rompía los enlaces.
//
// Lo que SÍ se sigue rechazando es un esquema que no sea http o https:
// `javascript:`, `data:` y compañía no son destinos, son otra cosa.
function destinoDelAviso(bruto) {
  const inicio = self.location.origin + "/miembros";
  try {
    // Resuelve tanto "/miembros/mensajes/x" como una dirección completa.
    const u = new URL(bruto, self.location.origin);
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      return { href: inicio, fuera: false };
    }
    return { href: u.href, fuera: u.origin !== self.location.origin };
  } catch {
    return { href: inicio, fuera: false };
  }
}

// ── EL CLIC ─────────────────────────────────────────────────
//
// Dentro de la plataforma: se reutiliza la ventana que ya esté abierta. Abrir
// una pestaña nueva cada vez deja a la persona con seis copias de la
// aplicación.
//
// ── EL FALLO SILENCIOSO QUE HABÍA AQUÍ ────────────────────────────
// `v.navigate()` no siempre puede: el navegador la rechaza cuando la ventana
// no la controla este trabajador —la primera carga, una pestaña vieja— y
// algunos no la implementan. Eso estaba envuelto en un `catch` vacío con el
// comentario «algunas no dejan», y lo que pasaba después era que la ventana
// se enfocaba y se quedaba EXACTAMENTE donde estaba.
//
// Si la aplicación estaba abierta en la portada —que es lo normal—, tocar un
// aviso enfocaba la portada. Visto desde fuera: «me lleva a miembros y no al
// enlace». Y no había nada que mirar, porque no fallaba nada.
//
// Ahora, si no se puede navegar, se abre el destino en una ventana. Una copia
// de más es una molestia; no llegar nunca al sitio es el aviso entero
// perdido.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const destino = destinoDelAviso(
    (event.notification.data && event.notification.data.url) || "/miembros",
  );

  // ── APUNTAR EL TOQUE, SIN HACER ESPERAR A NADIE ────────────────────
  // Es el único dato real que hay después de un envío: el servicio de push dice
  // "aceptado" y de ahí en adelante no informa de nada.
  //
  // Va aparte del flujo de abrir la ventana a propósito: lo que la persona ha
  // pedido es que se abra la pantalla, y una estadística no puede retrasar eso
  // ni fallar en su nombre. Si no hay sesión o la red falla, se pierde el
  // apunte y no pasa nada más.
  const campana = event.notification.data && event.notification.data.id;
  if (campana) {
    event.waitUntil(
      fetch("/api/push/clic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: campana }),
      }).catch(() => {}),
    );
  }

  event.waitUntil(
    (async () => {
      // ── UN DESTINO DE FUERA VA EN SU PROPIA VENTANA ─────────────────
      // Un Zoom, un YouTube. Meterlo DENTRO de la aplicación instalada deja a
      // la persona sin barra de direcciones y sin botón de atrás: para volver
      // a la plataforma tendría que cerrar la app y abrirla otra vez.
      if (destino.fuera) {
        await self.clients.openWindow(destino.href);
        return;
      }

      const ventanas = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const v of ventanas) {
        let esNuestra = false;
        try { esNuestra = new URL(v.url).origin === self.location.origin; } catch { /* vacía */ }
        if (!esNuestra) continue;

        try {
          await v.focus();
          if ("navigate" in v) {
            // Devuelve el cliente si consiguió moverlo; `null` si no.
            const movida = await v.navigate(destino.href);
            if (movida) return;
          }
        } catch { /* no se pudo: se abre ventana, abajo */ }

        // Enfocada pero sin poder moverla. Antes esto se daba por bueno y la
        // persona se quedaba donde estuviera.
        break;
      }

      await self.clients.openWindow(destino.href);
    })(),
  );
});

// ── SUSCRIPCIÓN CADUCADA ───────────────────────────────────────────────────
//
// El navegador puede rotar la suscripción por su cuenta. Cuando pasa, lanza
// este evento y la anterior deja de servir: si no se avisa al servidor, esa
// persona deja de recibir avisos para siempre y nadie se entera.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const nueva = await self.registration.pushManager.subscribe(
          event.oldSubscription
            ? {
                userVisibleOnly: true,
                applicationServerKey: event.oldSubscription.options.applicationServerKey,
              }
            : { userVisibleOnly: true },
        );

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            subscription: nueva.toJSON(),
            reemplaza: event.oldSubscription ? event.oldSubscription.endpoint : null,
          }),
        });
      } catch {
        /* Sin sesión no se puede re-registrar. Se hará al volver a entrar. */
      }
    })(),
  );
});
