-- ════════════════════════════════════════════════════════════════════════════
--  LOS CORREOS SE MANDAN A LA LISTA, NO A UNA AUDIENCIA
-- ════════════════════════════════════════════════════════════════════════════
--
-- Córrelo en el SQL Editor de la PLATAFORMA. No borra nada ni toca ninguna
-- fila existente: solo añade una columna.
--
-- ── QUÉ PASÓ ──────────────────────────────────────────────────────────────
-- El 12 de noviembre de 2026, un correo dirigido a dos personas llegó a toda
-- la plataforma.
--
-- El envío calculaba bien los destinatarios —el panel decía «2 personas» y
-- era verdad— y después mandaba un *Broadcast* del proveedor sobre la
-- audiencia principal, que es la lista de todo el mundo. La lista filtrada
-- solo se usaba para contar y para refrescar contactos. Había dos listas y
-- nadie las había mirado juntas.
--
-- Desde ahora los correos salen uno a uno a la misma lista que se calcula y
-- se enseña en pantalla. No hay dos listas que puedan separarse.
--
-- ── PARA QUÉ ESTA COLUMNA ─────────────────────────────────────────────────
-- Un Broadcast programado se cancelaba con un solo identificador. Doscientos
-- correos programados se cancelan uno por uno, así que hay que guardar los
-- doscientos identificadores.
--
-- `provider_broadcast_id` se queda donde está: mientras exista una
-- comunicación programada de las de antes, su cancelación sigue necesitando
-- el camino viejo.

alter table public.communications
  add column if not exists provider_email_ids jsonb;

comment on column public.communications.provider_email_ids is
  'Identificadores de cada correo en el proveedor. Solo para poder cancelar lo programado: un envío inmediato no los necesita y los deja en null.';
