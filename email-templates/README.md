# Plantillas de correo (Supabase Auth) · Los 144.000

Plantillas de correo con la identidad visual de Los 144.000:

- **Invitación** — el nuevo miembro **crea su contraseña** y activa su cuenta.
- **Recuperación** — un miembro existente **restablece su contraseña**.

## Archivos

| Archivo | Uso |
|---|---|
| `invite.html` | **Plantilla real** de invitación. Se copia en Supabase. Contiene `{{ .ConfirmationURL }}`. |
| `invite-preview.html` | Solo para **previsualizar** en el navegador (variable reemplazada por `https://los144000.com/activar-cuenta`). **No se pega en Supabase.** |
| `recovery.html` | **Plantilla real** de recuperación de contraseña. Se copia en Supabase. Contiene `{{ .ConfirmationURL }}`. |
| `recovery-preview.html` | Solo para **previsualizar** (variable reemplazada por `https://los144000.com/miembros/cuenta/recuperar`). **No se pega en Supabase.** |
| `README.md` | Este documento. |

## Qué copiar en Supabase

### Invitación (Invite user)

1. Abrí **Supabase → Authentication → Emails → Email Templates → *Invite user***.
2. **Asunto (Subject):**
   ```
   Tu acceso a Los 144.000 está listo
   ```
3. En el cuerpo (Message body / HTML), pegá **todo el contenido de `invite.html`**.
4. Guardá los cambios.

### Recuperación (Reset password)

1. Abrí **Supabase → Authentication → Emails → Email Templates → *Reset password***.
2. **Asunto (Subject):**
   ```
   Restablece tu acceso a Los 144.000
   ```
3. En el cuerpo (Message body / HTML), pegá **todo el contenido de `recovery.html`**.
4. Guardá los cambios.

> Remitente esperado: `Los 144.000 <no-reply@auth.los144000.com>` (ya configurado en el proyecto; estos archivos no lo modifican).

## ⚠️ Regla crítica (variables de Supabase)

**Invitación (`invite.html`)** — usa la variable, en el botón (con respaldo VML) y en el enlace de texto:

```
{{ .ConfirmationURL }}
```

**Recuperación (`recovery.html`)** — usa el patrón SSR con `verifyOtp`. El enlace (botón + texto) es exactamente:

```
{{ .SiteURL }}/recuperar-acceso/confirmar?token_hash={{ .TokenHash }}&type=recovery&next=/miembros/cuenta/recuperar
```

**Nunca** elimines ni modifiques estas variables (`{{ .ConfirmationURL }}`, `{{ .SiteURL }}`, `{{ .TokenHash }}`). Si las borrás o las cambiás por una URL fija, el correo **dejará de funcionar**.

- No las pongas entre comillas ni las alteres.
- No uses un enlace fijo ni compartido.
- En recuperación, `next=/miembros/cuenta/recuperar` es la ruta interna real donde el usuario crea la nueva contraseña. `/recuperar-acceso/confirmar` es una **página intermedia**: al abrirse (GET) solo muestra una confirmación y **no** consume el token; recién al pulsar **“Continuar y crear contraseña”** se hace un POST que verifica el token (`verifyOtp`) y establece la sesión. Esto evita que los **escáneres de email** (Gmail/Outlook) consuman el enlace de un solo uso al pre-abrirlo.

### Configuración necesaria en Supabase (para recuperación SSR)

- **Authentication → URL Configuration → Site URL:** `https://los144000.com` (así `{{ .SiteURL }}` resuelve correctamente).
- **Authentication → URL Configuration → Redirect URLs:** debe incluir
  `https://los144000.com/miembros/cuenta/recuperar`
  (lo usa `resetPasswordForEmail({ redirectTo })`).
- **Invitación** sigue necesitando en Redirect URLs: `https://los144000.com/activar-cuenta`.

## Cómo previsualizar

Abrí `invite-preview.html` o `recovery-preview.html` directamente en el navegador:

- **Doble clic** sobre el archivo, o
- Arrastralo a una pestaña del navegador, o
- Clic derecho → *Abrir con* → tu navegador.

No requiere servidor ni build. Son HTML estáticos. Los archivos `*-preview.html` **no** se pegan en Supabase.

## Seguridad

- Estos archivos **no contienen** claves, tokens, secretos ni variables de entorno.
- No incluyen imágenes externas (la cabecera es tipográfica), así que **no hay imágenes que se puedan romper**.
- Las únicas URLs externas son la de Google Fonts (mejora progresiva de tipografías) y, en las vistas previas, las URLs de ejemplo del propio dominio `los144000.com`.

## Checklist antes de publicar

**Invitación**
- [ ] El **asunto** es exactamente: `Tu acceso a Los 144.000 está listo`.
- [ ] Pegaste el contenido de **`invite.html`** (no el de `invite-preview.html`).
- [ ] `{{ .ConfirmationURL }}` sigue presente en el botón y en el enlace de texto.
- [ ] En **Authentication → URL Configuration → Redirect URLs** está permitido `https://los144000.com/activar-cuenta`.
- [ ] Invitación de prueba: llega el correo y el botón **“Crear mi contraseña”** funciona.

**Recuperación**
- [ ] El **asunto** es exactamente: `Restablece tu acceso a Los 144.000`.
- [ ] Pegaste el contenido de **`recovery.html`** (no el de `recovery-preview.html`).
- [ ] El enlace (botón + texto) contiene `{{ .SiteURL }}/recuperar-acceso/confirmar?token_hash={{ .TokenHash }}&type=recovery&next=/miembros/cuenta/recuperar`.
- [ ] **Site URL** = `https://los144000.com`.
- [ ] En **Redirect URLs** está permitido `https://los144000.com/miembros/cuenta/recuperar`.
- [ ] Reset de prueba: llega el correo, el botón **“Restablecer mi contraseña”** pasa por `/recuperar-acceso/confirmar` y llega a la pantalla de nueva contraseña **sin** el mensaje de enlace inválido.

## Compatibilidad

- Estructura basada en tablas + estilos inline → compatible con Gmail, Outlook (incluye fallback VML para el botón), Apple Mail y móvil.
- Las tipografías de marca (Orbitron / Cinzel / Manrope) se cargan como **mejora progresiva**; los clientes que no las soporten (p. ej. Outlook de escritorio) usan alternativas del sistema con el mismo espaciado, manteniendo la identidad.
- El diseño es oscuro por defecto y usa colores en hexadecimal explícito para verse correcto tanto en clientes en modo claro como oscuro.
