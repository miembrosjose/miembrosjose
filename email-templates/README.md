# Plantilla de correo — Invitación (Supabase Auth) · Los 144.000

Plantilla del correo que recibe un nuevo miembro para **crear su contraseña** y activar su cuenta.

## Archivos

| Archivo | Uso |
|---|---|
| `invite.html` | **La plantilla real.** Es la que se copia en Supabase. Contiene la variable `{{ .ConfirmationURL }}`. |
| `invite-preview.html` | Solo para **previsualizar** en el navegador. La variable fue reemplazada por `https://los144000.com/activar-cuenta`. **No se pega en Supabase.** |
| `README.md` | Este documento. |

## Qué copiar en Supabase

1. Abrí **Supabase → Authentication → Emails → Email Templates → *Invite user***.
2. **Asunto (Subject):**
   ```
   Tu acceso a Los 144.000 está listo
   ```
3. En el cuerpo (Message body / HTML), pegá **todo el contenido de `invite.html`**.
4. Guardá los cambios.

> Remitente esperado: `Los 144.000 <no-reply@auth.los144000.com>` (ya configurado en el proyecto; este archivo no lo modifica).

## ⚠️ Regla crítica

**Nunca** elimines ni reemplaces la variable dentro de `invite.html`:

```
{{ .ConfirmationURL }}
```

Aparece **dos veces** (en el botón y en el enlace de texto alternativo). Es la URL personal que Supabase genera para cada invitación. Si la borrás o la cambiás por una URL fija, **el correo dejará de funcionar** y nadie podrá activar su cuenta.

- No la pongas entre comillas ni la modifiques.
- No uses un enlace fijo ni compartido del portal.
- El destino final (`/activar-cuenta`) se controla con el **redirectTo** de la invitación y la lista de *Redirect URLs* de Supabase, no dentro de esta plantilla.

## Cómo previsualizar

Abrí `invite-preview.html` directamente en el navegador:

- **Doble clic** sobre el archivo, o
- Arrastralo a una pestaña del navegador, o
- Clic derecho → *Abrir con* → tu navegador.

No requiere servidor ni build. Es un HTML estático.

## Seguridad

- Estos archivos **no contienen** claves, tokens, secretos ni variables de entorno.
- No incluyen imágenes externas (la cabecera es tipográfica), así que **no hay imágenes que se puedan romper**.
- Las únicas URLs externas son la de Google Fonts (mejora progresiva de tipografías) y, en la vista previa, `https://los144000.com/activar-cuenta`.

## Checklist antes de publicar

- [ ] El **asunto** es exactamente: `Tu acceso a Los 144.000 está listo`.
- [ ] Pegaste el contenido de **`invite.html`** (no el de `invite-preview.html`).
- [ ] `{{ .ConfirmationURL }}` sigue presente **dos veces** en el HTML pegado.
- [ ] En **Authentication → URL Configuration → Redirect URLs** está permitido `https://los144000.com/activar-cuenta`.
- [ ] Enviaste una invitación de prueba y el correo llega con el botón **“Crear mi contraseña”** funcionando.
- [ ] El botón lleva a la página de activación y permite crear la contraseña.

## Compatibilidad

- Estructura basada en tablas + estilos inline → compatible con Gmail, Outlook (incluye fallback VML para el botón), Apple Mail y móvil.
- Las tipografías de marca (Orbitron / Cinzel / Manrope) se cargan como **mejora progresiva**; los clientes que no las soporten (p. ej. Outlook de escritorio) usan alternativas del sistema con el mismo espaciado, manteniendo la identidad.
- El diseño es oscuro por defecto y usa colores en hexadecimal explícito para verse correcto tanto en clientes en modo claro como oscuro.
