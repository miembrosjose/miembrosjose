-- ════════════════════════════════════════════════════════════════════════════
--  PROTOCOLOS DE CONTACTO · PASO 1 — ESTRUCTURA
-- ════════════════════════════════════════════════════════════════════════════
--
-- ── POR QUÉ HACE FALTA UNA TABLA NUEVA ─────────────────────────────────────
-- `telegram_memberships` mezcla dos cosas distintas en una sola fila:
--
--   QUIÉN ERES EN TELEGRAM   telegram_user_id, username, first_name, linked_at
--   EN QUÉ GRUPO ESTÁS       is_in_telegram, joined_at, removed_at
--
-- Lo primero es por persona. Lo segundo es por GRUPO, y hay un solo booleano.
-- Con dos grupos, esa fila no puede decir «está en general pero no en
-- protocolos», que es exactamente el estado más común que vamos a tener.
--
-- ── POR QUÉ NO SE BORRA NADA ───────────────────────────────────────────────
-- Las columnas viejas se quedan donde están. Mientras las tres funciones no
-- estén desplegadas y comprobadas, el barrido antiguo tiene que poder seguir
-- funcionando con la tabla antigua. Se retiran en un paso posterior, cuando
-- ya no las lea nadie.

begin;

-- ════════════════════════════════════════════════════════════════════════════
--  1 · PERTENENCIA POR GRUPO
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.telegram_group_memberships (
  user_id          uuid    not null references auth.users(id) on delete cascade,
  -- 'general' | 'protocols'. Texto y no enum: añadir un grupo no debería
  -- exigir un ALTER TYPE con la tabla bloqueada.
  group_key        text    not null check (group_key in ('general', 'protocols')),
  telegram_chat_id bigint  not null,
  is_member        boolean not null default false,
  joined_at        timestamptz,
  removed_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (user_id, group_key)
);

-- El barrido pide «filas donde is_member», así que ese es el índice que usa.
create index if not exists telegram_group_memberships_dentro_idx
  on public.telegram_group_memberships (group_key, is_member)
  where is_member;

alter table public.telegram_group_memberships enable row level security;
-- Sin políticas: solo la clave de servicio entra, que es quien la usa desde
-- las Edge Functions. El navegador no tiene nada que hacer aquí.

-- ════════════════════════════════════════════════════════════════════════════
--  2 · INVITACIONES TEMPORALES
-- ════════════════════════════════════════════════════════════════════════════
--
-- `telegram_link_tokens` NO sirve para esto: es para vincular la cuenta. No
-- tiene telegram_user_id, ni grupo, ni enlace, ni revocación.
--
-- ── POR QUÉ SE GUARDA EL ENLACE ENTERO ─────────────────────────────────────
-- Porque es la única forma de atar una solicitud a una persona. Telegram
-- manda en `chat_join_request` el campo `invite_link` con el enlace exacto
-- que se usó; buscándolo aquí se sabe a quién se le dio, y se compara con el
-- `from.id` de quien pide entrar. Si no coinciden, el enlace se compartió.
--
-- ── POR QUÉ NO SE USA member_limit ─────────────────────────────────────────
-- Telegram NO admite `member_limit` junto con `creates_join_request`. El uso
-- único lo garantiza `used_at`, aquí, no la API.
create table if not exists public.telegram_invites (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid   not null references auth.users(id) on delete cascade,
  telegram_user_id bigint not null,
  group_key        text   not null check (group_key in ('general', 'protocols')),
  invite_link      text   not null,
  created_at       timestamptz not null default now(),
  expires_at       timestamptz not null,
  used_at          timestamptz,
  revoked_at       timestamptz
);

-- El webhook busca por enlace, y es el camino caliente.
create unique index if not exists telegram_invites_link_idx
  on public.telegram_invites (invite_link);

create index if not exists telegram_invites_usuario_idx
  on public.telegram_invites (user_id, group_key, created_at desc);

alter table public.telegram_invites enable row level security;

-- ════════════════════════════════════════════════════════════════════════════
--  3 · LA CONDICIÓN DEL UMBRAL, COMO FUNCIÓN
-- ════════════════════════════════════════════════════════════════════════════
--
-- ── POR QUÉ EN LA BASE Y NO EN CADA SITIO ──────────────────────────────────
-- La regla vive hoy en lib/insignias-ganadas.ts, que es TypeScript del repo y
-- una Edge Function no puede importar. Copiarla sería tener dos definiciones
-- de «temporada completa» que se separan en cuanto alguien toque una.
-- Aquí la ven las dos: la app por RPC y las funciones por RPC.
--
-- ── ES UNA TRANSCRIPCIÓN, NO UNA VERSIÓN NUEVA ─────────────────────────────
-- Copia exactamente lo que hace insignias-ganadas.ts (líneas 107-125):
--   · el total son las filas REALES de `episodes`;
--   · `seasons.episodes` queda de respaldo si aún no se cargaron capítulos;
--   · una temporada sin capítulos NO está completa, está vacía;
--   · una temporada externa nunca cuenta;
--   · se cuentan capítulos DISTINTOS vistos, no filas de progreso.
--
-- ── POR QUÉ security definer ───────────────────────────────────────────────
-- Para que responda igual llamada desde la app o desde una función, sin
-- depender de las políticas de quien pregunte. Solo devuelve un booleano
-- sobre el usuario que se le pasa: no hay nada que filtrar.
create or replace function public.has_reached_umbral(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with t as (
    select id, num, episodes, external
      from seasons
     where num = 4
     limit 1
  ),
  total as (
    select coalesce(
             nullif((select count(*) from episodes e where e.season_id = t.id), 0),
             t.episodes,
             0
           )::int                    as n,
           coalesce(t.external, false) as externa,
           t.num                       as num
      from t
  ),
  vistos as (
    select count(distinct p.episode_num)::int as n
      from user_episode_progress p, total
     where p.user_id = p_user_id
       and p.season_num = total.num
  )
  select coalesce(
    (select not total.externa
        and total.n > 0
        and vistos.n >= total.n
       from total, vistos),
    false
  );
$$;

revoke all on function public.has_reached_umbral(uuid) from public, anon;
grant execute on function public.has_reached_umbral(uuid) to authenticated, service_role;

commit;
