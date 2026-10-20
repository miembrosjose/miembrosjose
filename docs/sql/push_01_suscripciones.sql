-- ════════════════════════════════════════════════════════════════════════════
--  NOTIFICACIONES PUSH · PASO 1 — LAS SUSCRIPCIONES
-- ════════════════════════════════════════════════════════════════════════════
--
-- ── QUÉ GUARDA ESTO ────────────────────────────────────────────────────────
-- Cuando alguien autoriza las notificaciones, su navegador genera una
-- suscripción: una dirección única del servicio de push de su fabricante
-- (Google para Android, Apple para iPhone) más dos claves para cifrar lo que
-- se le manda. Sin esa fila, no hay forma de avisarle.
--
-- ── POR QUÉ LA CLAVE ES EL ENDPOINT Y NO EL USUARIO ────────────────────────
-- Una persona tiene varios dispositivos: el móvil, la tablet, el ordenador de
-- casa. Cada uno genera SU PROPIA suscripción y todas tienen que convivir, o
-- el aviso llegaría solo al último que autorizó.
--
-- El `endpoint` es único en el mundo por dispositivo y navegador, así que es
-- la clave natural. Si el mismo dispositivo vuelve a suscribirse, machaca su
-- fila en vez de duplicarla.
--
-- ── POR QUÉ NO SE BORRAN AL FALLAR, SE MARCAN ──────────────────────────────
-- Cuando un servicio de push responde 404 o 410, esa suscripción está muerta
-- —desinstalaron la aplicación, revocaron el permiso— y hay que dejar de
-- usarla. Pero borrar la fila sin más deja sin rastro de cuánta gente perdió
-- las notificaciones y por qué. Se desactiva y se anota el motivo.

begin;

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,

  -- La dirección del servicio de push. Larga: Apple y Google usan rutas de
  -- varios cientos de caracteres.
  endpoint    text not null unique,

  -- Las dos claves del navegador, en base64url. Sin ellas el mensaje no se
  -- puede cifrar y el servicio lo rechaza.
  p256dh      text not null,
  auth        text not null,

  -- Para que la persona reconozca sus dispositivos en la lista y pueda
  -- quitar el que ya no usa. Es lo que dice el navegador de sí mismo: no
  -- identifica a nadie más de lo que ya lo hace una visita normal.
  user_agent  text,

  activa      boolean not null default true,
  -- Por qué dejó de servir: 'gone' (404/410 del servicio), 'revocada' (la
  -- persona la quitó), 'error' (fallo repetido).
  motivo_baja text,

  created_at  timestamptz not null default now(),
  last_used_at timestamptz,
  updated_at  timestamptz not null default now()
);

-- El envío pide «las suscripciones vivas de esta persona», y es la consulta
-- que corre en cada notificación.
create index if not exists push_subscriptions_usuario_idx
  on public.push_subscriptions (user_id)
  where activa;

alter table public.push_subscriptions enable row level security;

-- ── LAS POLÍTICAS ──────────────────────────────────────────────────────────
-- Cada persona ve y borra las suyas: hace falta para que pueda desconectar un
-- dispositivo desde sus preferencias.
--
-- Pero NO puede insertarlas ni modificarlas desde el navegador. Eso solo lo
-- hace el servidor, con la clave de servicio, después de comprobar la sesión.
-- Si el navegador pudiera escribir aquí, cualquiera podría registrar una
-- suscripción a nombre de otro y recibir sus avisos.
drop policy if exists "push propio: leer"  on public.push_subscriptions;
drop policy if exists "push propio: borrar" on public.push_subscriptions;

create policy "push propio: leer"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "push propio: borrar"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

revoke all on public.push_subscriptions from anon;
grant select, delete on public.push_subscriptions to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
--  REGISTRO DE ENVÍOS
-- ════════════════════════════════════════════════════════════════════════════
--
-- ── PARA QUÉ ───────────────────────────────────────────────────────────────
-- Un push que no llega no deja rastro en ninguna parte: ni en el navegador, ni
-- en el móvil, ni en la consola. Sin esta tabla, «no me llegó» es imposible de
-- investigar.
--
-- Guarda QUÉ se intentó y QUÉ respondió el servicio, nunca el contenido
-- íntegro de un mensaje privado. El título y el cuerpo que se registran son
-- los de la notificación, que ya son visibles en la pantalla de bloqueo.
create table if not exists public.push_envios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  subscription_id uuid references public.push_subscriptions(id) on delete set null,

  categoria   text not null default 'sistema',
  titulo      text,
  -- El destino al que lleva el clic. Nunca un identificador sensible.
  url         text,

  -- 'ok' | 'fallo' | 'gone'
  resultado   text not null,
  http_status integer,
  error       text,

  created_at  timestamptz not null default now()
);

create index if not exists push_envios_fecha_idx
  on public.push_envios (created_at desc);

alter table public.push_envios enable row level security;
-- Sin políticas: solo lo lee la administración con la clave de servicio.

commit;

-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.tables
    where table_schema='public' and table_name='push_subscriptions')  as tabla_suscripciones,
  (select count(*) from information_schema.tables
    where table_schema='public' and table_name='push_envios')         as tabla_envios,
  (select count(*) from pg_policies
    where schemaname='public' and tablename='push_subscriptions')     as politicas;

-- ── CÓMO DESHACERLO ────────────────────────────────────────────────────────
-- Es reversible y no toca nada existente. Para revertir:
--
--   drop table if exists public.push_envios;
--   drop table if exists public.push_subscriptions;
