# Revisión de accesibilidad y responsive — Los 144.000

Revisión técnica de las pantallas esenciales. Regla vigente: **no rediseñar**; solo correcciones
claras y de bajo riesgo. Este documento registra lo revisado, lo corregido y lo pendiente de
inspección humana.

## Alcance revisado

Plataforma: login, activación (`/activar-cuenta`), recuperación (`/recuperar-contrasena`),
confirmación (`/recuperar-acceso/confirmar`), nueva contraseña (`/miembros/cuenta/recuperar`),
acceso suspendido, perfil / Mi membresía, páginas legales, `/soporte`, 404/error, panel admin
(Suscripciones). Embudo: formulario y CTA de pago (implementado por el programador).

## Estado general (lo que ya cumple)

- `lang="es"` en el layout raíz.
- Contraste alto: texto `#F3F6FA`/`#a8a8c0` sobre fondo `#050510`/`#0c0c1a`.
- Mensajes de error con `role="alert"`; estados de carga con `role="status"`.
- Botones y enlaces son elementos nativos (`<button>` / `<a>`), navegables por teclado.
- Formularios con `<label>` asociado por `htmlFor`/`id` (login, recuperación, nueva contraseña).
- Inputs de contraseña con `autoComplete="new-password"` / `current-password`.
- Responsive: media queries y layouts fluidos ya aprobados (home, carruseles, drawer).

## Correcciones aplicadas en esta tanda (bajo riesgo)

- Nuevas páginas legales/soporte/error: headings semánticos (`h1`/`h2`), foco de teclado nativo,
  `aria-label` en la navegación de enlaces legales.
- Tabla admin de Suscripciones: `aria-label` en el buscador; contenedor con `overflow-x-auto`
  para evitar desbordes horizontales en móvil.
- Página de error: sin stack traces; foco en botones nativos.
- Botón de portal / acciones en acceso suspendido: estados `disabled` y de carga visibles.

## Pendiente de inspección humana (no bloqueante)

- Verificar **foco visible** (anillo) de forma consistente en todas las superficies con navegación
  por teclado real (algunos estilos usan `focus-visible`; conviene una pasada manual).
- Verificar `aria-live` para mensajes dinámicos en el embudo (fuera de alcance de este repo).
- Contraste exacto del violeta `#6D4A9B` como fondo de botón con texto claro: cumple AA para texto
  grande; confirmar en texto pequeño con herramienta.
- Prueba con lector de pantalla (VoiceOver / NVDA) en login, activación y checkout del embudo.
- Prueba en móviles pequeños (≤360px) y tablet del panel admin (tablas anchas → scroll horizontal).
- Tamaños táctiles ≥44px en todos los controles del área de miembros.

## Notas

No se instaló ningún framework de auditoría. La revisión es estática + manual. Cualquier corrección
que implique cambio visual significativo se marca como **"requiere aprobación visual"** y no se aplicó.
