-- ============================================================================
-- Los 144.000 — Meditaciones premium: catálogo + entitlements
-- ============================================================================
-- NO destructivo: create table if not exists; no borra/toca datos ni tablas
-- existentes; RLS activo. Ejecutar en Supabase → SQL Editor → Run.
-- ============================================================================

-- 1) CATÁLOGO (precio/acceso/objeto viven aquí; el precio NUNCA en el frontend)
create table if not exists public.meditations (
  id               text primary key,               -- ej. "s1e5-nombre-premium"
  title            text        not null,
  subtitle         text,
  access_type      text        not null default 'premium'
                     check (access_type in ('included','premium')),
  price_cents      integer     not null default 0, -- ej. 799 = US$ 7.99
  currency         text        not null default 'usd',
  audio_object_key text        not null,           -- ej. audio/premium/Temporada 1/xxx.mp3
  season_num       integer,
  episode_num      integer,
  image_url        text,
  is_purchasable   boolean     not null default true,
  created_at       timestamptz not null default now()
);

alter table public.meditations enable row level security;

-- Lectura del catálogo por usuarios autenticados (el precio real igual se valida
-- server-side al cobrar). Escritura SOLO service_role (server) → sin policy de
-- insert/update, el cliente no puede modificar el catálogo.
drop policy if exists "meditations read" on public.meditations;
create policy "meditations read"
  on public.meditations for select
  using (auth.role() = 'authenticated');


-- 2) ENTITLEMENTS / COMPRAS (una fila por compra; una compra por meditación)
create table if not exists public.meditation_purchases (
  id                       uuid        primary key default gen_random_uuid(),
  user_id                  uuid        not null references auth.users(id) on delete cascade,
  meditation_id            text        not null references public.meditations(id),
  stripe_payment_intent_id text,
  amount_cents             integer,
  currency                 text        not null default 'usd',
  status                   text        not null default 'paid'
                             check (status in ('paid','refunded')),
  purchased_at             timestamptz not null default now(),
  created_at               timestamptz not null default now(),
  unique (user_id, meditation_id)                  -- protección contra compra duplicada
);

alter table public.meditation_purchases enable row level security;

-- El usuario solo VE lo suyo. Sin policy de insert/update → el cliente NO puede
-- crear entitlements; eso solo lo hace el servidor (service_role bypassa RLS).
drop policy if exists "own med purchases read" on public.meditation_purchases;
create policy "own med purchases read"
  on public.meditation_purchases for select
  using (auth.uid() = user_id);


-- 3) SEED — meditación premium de PRUEBA (ajusta price_cents/audio_object_key)
insert into public.meditations
  (id, title, subtitle, access_type, price_cents, currency, audio_object_key, season_num, episode_num, is_purchasable)
values
  ('s1e5-nombre-premium',
   'Activación del Nombre Cósmico',
   'Práctica guiada completa: recibir, vocalizar y afinar tu nombre cósmico.',
   'premium',
   100,                    -- US$ 1.00  (prueba real de bajo monto)
   'usd',
   'audio/premium/Temporada 1/nombre-cosmico-activacion.mp3',
   1, 5, true)
on conflict (id) do update set
  title            = excluded.title,
  subtitle         = excluded.subtitle,
  access_type      = excluded.access_type,
  price_cents      = excluded.price_cents,
  currency         = excluded.currency,
  audio_object_key = excluded.audio_object_key,
  season_num       = excluded.season_num,
  episode_num      = excluded.episode_num,
  is_purchasable   = excluded.is_purchasable;

-- (Opcional) también puedes registrar la incluida en el catálogo; hoy funciona
-- por fallback en código, así que este INSERT es opcional:
-- insert into public.meditations (id, title, access_type, price_cents, currency, audio_object_key, season_num, episode_num, is_purchasable)
-- values ('s1e5-nombre-included','Sintonía con el Nombre Cósmico','included',0,'usd','audio/included/Temporada 1/nombre-cosmico-sintonia.mp3',1,5,false)
-- on conflict (id) do nothing;
