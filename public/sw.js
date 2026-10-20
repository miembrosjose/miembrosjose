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

// ── EL DESTINO SIEMPRE ES DE ESTA PLATAFORMA ───────────────────────────────
//
// `data.url` llega dentro del push, y quien manda un push es el servidor. Pero
// este es el único sitio de todo el sistema que abre una ventana a partir de un
// dato recibido, y si algún día ese dato llegara mal, lo que se abriría es una
// página cualquiera con toda la apariencia de venir de aquí: la persona ha
// tocado un aviso de Los 144.000 y confiará en lo que vea.
//
// Resolverlo contra el origen y descartar lo que caiga fuera cuesta seis líneas.
function dentroDelSitio(bruto) {
  const inicio = self.location.origin + "/miembros";
  try {
    // Resuelve tanto "/miembros/mensajes/x" como una dirección completa.
    const u = new URL(bruto, self.location.origin);
    return u.origin === self.location.origin ? u.href : inicio;
  } catch {
    return inicio;
  }
}

// ── EL CLIC ────────────────────────────────────────────────────────────────
//
// Primero se busca una ventana ya abierta de la plataforma y se la enfoca,
// navegándola al destino. Abrir una pestaña nueva cada vez deja a la persona
// con seis copias de la misma aplicación.
//
// Solo se abre una ventana nueva si no había ninguna.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const destino = dentroDelSitio(
    (event.notification.data && event.notification.data.url) || "/miembros",
  );

  event.waitUntil(
    (async () => {
      const ventanas = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const v of ventanas) {
        // Misma plataforma → se reutiliza.
        if (new URL(v.url).origin === self.location.origin) {
          await v.focus();
          if ("navigate" in v) {
            try { await v.navigate(destino); } catch { /* algunas no dejan */ }
          }
          return;
        }
      }

      await self.clients.openWindow(destino);
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
