-- ════════════════════════════════════════════════════════════════════════════
--  PROTOCOLOS DE CONTACTO · PASO 2 — TRASPASO DEL GRUPO GENERAL
-- ════════════════════════════════════════════════════════════════════════════
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │  COMPRUEBA ESTE NÚMERO ANTES DE CORRER NADA                              │
-- │                                                                          │
-- │      -1003717374442                                                      │
-- │                                                                          │
-- │  Es el chat id de «Red de los 144.000 | Comunidad», comprobado contra    │
-- │  la API de Telegram (getChat devolvió ese título y is_forum = true).     │
-- │  Es el mismo valor que guarda el secreto TELEGRAM_GROUP_ID, que desde    │
-- │  SQL no se puede leer: Supabase no enseña el valor de un secreto.        │
-- │                                                                          │
-- │  Para confirmarlo tú mismo: abre cualquier mensaje del grupo, «Copiar    │
-- │  enlace», y mira el número de t.me/c/<NUMERO>/… El chat id es ese        │
-- │  número con -100 delante.                                                │
-- │                                                                          │
-- │  Si no coincide, cámbialo AQUÍ y solo aquí.                              │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- ── QUÉ HACE ───────────────────────────────────────────────────────────────
-- Copia el estado actual del grupo general a la tabla nueva. No borra ni
-- modifica `telegram_memberships`: al terminar, la misma información está en
-- los dos sitios, y el barrido antiguo sigue funcionando exactamente igual
-- hasta que despliegues el nuevo.
--
-- ── ES REPETIBLE ───────────────────────────────────────────────────────────
-- `on conflict do nothing`: correrlo dos veces no duplica ni pisa nada. Si ya
-- desplegaste las funciones nuevas y han escrito filas, este traspaso NO las
-- sobrescribe — lo que ya esté al día se respeta.

begin;

insert into public.telegram_group_memberships
  (user_id, group_key, telegram_chat_id, is_member, joined_at, removed_at, created_at, updated_at)
select m.user_id,
       'general',
       -1003717374442,          -- ← el número del recuadro de arriba
       m.is_in_telegram,
       m.telegram_joined_at,
       m.telegram_removed_at,
       m.created_at,
       m.updated_at
  from public.telegram_memberships m
on conflict (user_id, group_key) do nothing;

commit;

-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────
-- Las dos cifras de «dentro» tienen que coincidir. Si no, NO despliegues las
-- funciones todavía.
select
  (select count(*) from public.telegram_memberships)                          as filas_viejas,
  (select count(*) from public.telegram_group_memberships
    where group_key = 'general')                                              as filas_nuevas,
  (select count(*) from public.telegram_memberships where is_in_telegram)     as dentro_viejo,
  (select count(*) from public.telegram_group_memberships
    where group_key = 'general' and is_member)                                as dentro_nuevo;
