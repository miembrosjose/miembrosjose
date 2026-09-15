-- ============================================================================
-- ENDURECIMIENTO DE RLS  ─ PREPARADA PARA REVISIÓN. **NO EJECUTAR TODAVÍA.**
-- ============================================================================
-- Responde al aviso del Security Advisor: rls_disabled_in_public.
--
-- GARANTÍAS DE ESTA MIGRACIÓN:
--   · No hace insert, update, delete ni truncate sobre datos de negocio.
--   · No borra tablas, columnas ni índices.
--   · Solo: activa RLS, ajusta grants y crea policies. Es idempotente.
--   · Todas las policies nuevas se crean con drop policy if exists antes,
--     así que re-ejecutarla no duplica nada.
--
-- ORDEN DE EJECUCIÓN RECOMENDADO: bloque por bloque, no todo de una vez.
-- Tras cada bloque, probar el sitio. El BLOQUE 7 es opcional y va al final.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════
-- BLOQUE 0 · Helper de administrador
-- ════════════════════════════════════════════════════════════════════════
-- Necesario porque una policy sobre 'profiles' que consulte 'profiles'
-- provoca recursión infinita. security definer rompe el ciclo.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;


-- ════════════════════════════════════════════════════════════════════════
-- BLOQUE 1 · Quitar a 'anon' toda capacidad de ESCRITURA en public
-- ════════════════════════════════════════════════════════════════════════
-- Riesgo de rotura: nulo. Ninguna ruta de la app escribe con la clave anon
-- sin sesión: el navegador no hace .from() en ningún componente, y el
-- cliente SSR solo escribe con sesión activa (rol authenticated).
-- No se toca SELECT aquí — eso es el BLOQUE 7, opcional.

do $$
declare r record;
begin
  for r in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('revoke insert, update, delete, truncate on public.%I from anon', r.tablename);
  end loop;
end $$;

-- Y que las tablas futuras nazcan igual de cerradas:
alter default privileges in schema public revoke insert, update, delete on tables from anon;


-- ════════════════════════════════════════════════════════════════════════
-- BLOQUE 2 · Activar RLS donde falte  ← esto es lo que apaga la alerta
-- ════════════════════════════════════════════════════════════════════════
-- Activar RLS sin policies deja la tabla en "nadie ve nada salvo service_role".
-- Por eso los BLOQUES 3-6 devuelven los permisos legítimos. Si se ejecuta el
-- BLOQUE 2 solo y se para ahí, la web se queda sin datos: ejecutarlos seguidos.

do $$
declare r record;
begin
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false
  loop
    execute format('alter table public.%I enable row level security', r.relname);
    raise notice 'RLS activado en %', r.relname;
  end loop;
end $$;


-- ════════════════════════════════════════════════════════════════════════
-- BLOQUE 3 · Catálogo: lectura para miembros, escritura solo para admin
-- ════════════════════════════════════════════════════════════════════════
-- ¡IMPORTANTE! El panel de administración escribe con el cliente SSR
-- (clave anon + cookie de sesión), es decir como rol 'authenticated', NO como
-- service_role. Verificado en app/api/admin/*. Sin estas policies de escritura
-- el panel deja de poder crear/editar temporadas, episodios, productos,
-- bloques y textos del sitio.

do $$
declare t text;
begin
  foreach t in array array[
    'seasons','episodes','episode_blocks',
    'products','product_modules','product_blocks','product_module_blocks',
    'series_info','site_texts','meditations'
  ]
  loop
    if to_regclass('public.'||t) is null then
      raise notice 'omitida (no existe): %', t; continue;
    end if;

    execute format('drop policy if exists "rls_read_members" on public.%I', t);
    execute format(
      'create policy "rls_read_members" on public.%I for select to authenticated using (true)', t);

    execute format('drop policy if exists "rls_admin_all" on public.%I', t);
    execute format(
      'create policy "rls_admin_all" on public.%I for all to authenticated '
      'using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- feed_posts: se lee desde SSR pero se escribe solo desde el backend.
do $$
begin
  if to_regclass('public.feed_posts') is not null then
    drop policy if exists "rls_read_members" on public.feed_posts;
    create policy "rls_read_members" on public.feed_posts
      for select to authenticated using (true);
  end if;
end $$;

-- community_events: NO lleva using (true). La tabla tiene una columna
-- 'visibility' (public | members | country | city | anonymous | admin) que
-- existe justamente para filtrar. Un using (true) publicaría los eventos
-- marcados como 'admin' a todos los miembros.
do $$
begin
  if to_regclass('public.community_events') is null then return; end if;

  drop policy if exists "rls_read_members" on public.community_events;
  create policy "rls_read_members" on public.community_events
    for select to authenticated
    using (
      public.is_admin()
      or (visibility <> 'admin' and (expires_at is null or expires_at > now()))
    );

  drop policy if exists "rls_admin_all" on public.community_events;
  create policy "rls_admin_all" on public.community_events
    for all to authenticated
    using (public.is_admin()) with check (public.is_admin());
end $$;
-- Sin policy de insert para authenticated: las altas las hacen los triggers
-- security definer del fan-out (on_feed_post_inserted, on_user_xp_change,
-- on_funnel_likes_threshold, on_user_xp_top3_check), que saltan RLS.

-- contact_places: tiene 'status' (published | pending_review | rejected |
-- hidden) y 'created_by_id'. Sin filtrar, un miembro vería los lugares
-- rechazados y ocultos de los demás, que es justo lo que modera el admin.
do $$
begin
  if to_regclass('public.contact_places') is null then return; end if;

  drop policy if exists "rls_read_members" on public.contact_places;
  create policy "rls_read_members" on public.contact_places
    for select to authenticated
    using (status = 'published' or created_by_id = auth.uid() or public.is_admin());

  drop policy if exists "rls_insert_own" on public.contact_places;
  create policy "rls_insert_own" on public.contact_places
    for insert to authenticated with check (created_by_id = auth.uid());

  drop policy if exists "rls_admin_all" on public.contact_places;
  create policy "rls_admin_all" on public.contact_places
    for all to authenticated
    using (public.is_admin()) with check (public.is_admin());
end $$;


-- ════════════════════════════════════════════════════════════════════════
-- BLOQUE 4 · Tablas privadas por usuario  (auth.uid() = user_id)
-- ════════════════════════════════════════════════════════════════════════
-- El bloque comprueba antes que la columna user_id exista de verdad, así que
-- nunca crea una policy contra una columna inexistente.

-- 4.a  Solo lectura de lo propio. Las altas las hace el backend (pagos, XP).
do $$
declare t text;
begin
  foreach t in array array[
    'user_product_access','user_season_access','user_xp','xp_events',
    'user_unlocked_achievements','meditation_purchases','member_subscriptions',
    'revoked_products','user_category_access'
  ]
  loop
    if to_regclass('public.'||t) is null then continue; end if;
    if not exists (select 1 from information_schema.columns
                   where table_schema='public' and table_name=t and column_name='user_id') then
      raise notice 'REVISAR A MANO (sin columna user_id): %', t; continue;
    end if;

    execute format('drop policy if exists "rls_read_own" on public.%I', t);
    execute format(
      'create policy "rls_read_own" on public.%I for select to authenticated '
      'using (user_id = auth.uid() or public.is_admin())', t);
  end loop;
end $$;

-- 4.b  Lectura y escritura de lo propio (progreso, notificaciones, embudos).
do $$
declare t text;
begin
  foreach t in array array[
    'user_episode_progress','user_meditation_progress','notifications','user_funnels'
  ]
  loop
    if to_regclass('public.'||t) is null then continue; end if;
    if not exists (select 1 from information_schema.columns
                   where table_schema='public' and table_name=t and column_name='user_id') then
      raise notice 'REVISAR A MANO (sin columna user_id): %', t; continue;
    end if;

    execute format('drop policy if exists "rls_read_own" on public.%I', t);
    execute format(
      'create policy "rls_read_own" on public.%I for select to authenticated '
      'using (user_id = auth.uid() or public.is_admin())', t);

    execute format('drop policy if exists "rls_insert_own" on public.%I', t);
    execute format(
      'create policy "rls_insert_own" on public.%I for insert to authenticated '
      'with check (user_id = auth.uid())', t);

    execute format('drop policy if exists "rls_update_own" on public.%I', t);
    execute format(
      'create policy "rls_update_own" on public.%I for update to authenticated '
      'using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- 4.c  profiles: cada quien ve y edita el suyo; el admin ve todos.
--      Nota: sin policy de delete → nadie puede borrar perfiles salvo service_role.
do $$
begin
  if to_regclass('public.profiles') is null then return; end if;

  drop policy if exists "rls_profiles_read" on public.profiles;
  create policy "rls_profiles_read" on public.profiles
    for select to authenticated using (id = auth.uid() or public.is_admin());

  drop policy if exists "rls_profiles_update_own" on public.profiles;
  create policy "rls_profiles_update_own" on public.profiles
    for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

  drop policy if exists "rls_profiles_admin" on public.profiles;
  create policy "rls_profiles_admin" on public.profiles
    for all to authenticated using (public.is_admin()) with check (public.is_admin());
end $$;
-- ATENCIÓN: con esta policy un usuario puede editar su propia fila entera,
-- incluida is_admin, si esa columna es escribible por PostgREST. Ver BLOQUE 6.


-- ════════════════════════════════════════════════════════════════════════
-- BLOQUE 5 · Tablas sociales: todos los miembros leen, cada uno escribe lo suyo
-- ════════════════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  foreach t in array array[
    'forum_posts','forum_replies','forum_likes','forum_dislikes',
    'forum_reply_likes','forum_reply_dislikes',
    'episode_comments','episode_comment_reactions',
    'transmission_comments','transmission_reactions','series_likes'
  ]
  loop
    if to_regclass('public.'||t) is null then continue; end if;
    if not exists (select 1 from information_schema.columns
                   where table_schema='public' and table_name=t and column_name='user_id') then
      raise notice 'REVISAR A MANO (sin columna user_id): %', t; continue;
    end if;

    execute format('drop policy if exists "rls_read_members" on public.%I', t);
    execute format(
      'create policy "rls_read_members" on public.%I for select to authenticated using (true)', t);

    execute format('drop policy if exists "rls_insert_own" on public.%I', t);
    execute format(
      'create policy "rls_insert_own" on public.%I for insert to authenticated '
      'with check (user_id = auth.uid())', t);

    execute format('drop policy if exists "rls_update_own" on public.%I', t);
    execute format(
      'create policy "rls_update_own" on public.%I for update to authenticated '
      'using (user_id = auth.uid()) with check (user_id = auth.uid())', t);

    execute format('drop policy if exists "rls_delete_own" on public.%I', t);
    execute format(
      'create policy "rls_delete_own" on public.%I for delete to authenticated '
      'using (user_id = auth.uid() or public.is_admin())', t);
  end loop;
end $$;

-- user_follows queda fuera a propósito: sus columnas son follower/following,
-- no user_id. Se resuelve en una segunda pasada con los nombres confirmados.


-- ════════════════════════════════════════════════════════════════════════
-- BLOQUE 6 · Tablas exclusivas del backend: RLS activo y CERO policies
-- ════════════════════════════════════════════════════════════════════════
-- Sin policies, solo service_role entra (bypassa RLS). Además se retiran los
-- grants de anon y authenticated para que ni siquiera aparezcan en el Data API.
-- Contienen dinero, logs, datos de terceros o moderación.

do $$
declare t text;
begin
  foreach t in array array[
    'stripe_sales','stripe_processed_events','purchase_webhook_log',
    'abandoned_checkout','member_sync_events','email_send_log',
    'whatsapp_logs','whatsapp_pending','api_rate_limit',
    'account_invites','user_reports','funnel_feedbacks',
    'feed_comments','feed_likes','direct_messages','direct_message_blocks'
  ]
  loop
    if to_regclass('public.'||t) is null then continue; end if;
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- Endurecer profiles: que nadie pueda auto-ascenderse a admin desde el cliente.
-- (Revocar la columna, no la tabla: el resto del update propio sigue funcionando.)
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='profiles' and column_name='is_admin') then
    revoke update (is_admin) on public.profiles from anon, authenticated;
  end if;
end $$;


-- ════════════════════════════════════════════════════════════════════════
-- BLOQUE 7 · OPCIONAL — quitar también la LECTURA a 'anon'
-- ════════════════════════════════════════════════════════════════════════
-- Hoy 'anon' ya no ve ni una fila (comprobado: 46 tablas, count = 0), así que
-- esto es cinturón y tirantes. Ejecutar SOLO si se confirma que ninguna página
-- pública (sin sesión) lee de la base. Si alguna landing lee site_texts sin
-- login, este bloque la deja vacía.
--
-- do $$
-- declare r record;
-- begin
--   for r in select tablename from pg_tables where schemaname = 'public' loop
--     execute format('revoke select on public.%I from anon', r.tablename);
--   end loop;
-- end $$;
-- alter default privileges in schema public revoke select on tables from anon;


-- ════════════════════════════════════════════════════════════════════════
-- BLOQUE 7-bis · OPCIONAL — fijar search_path en las funciones security definer
-- ════════════════════════════════════════════════════════════════════════
-- La auditoría encontró 29 funciones security definer en public, todas
-- propiedad de postgres (triggers de XP, contadores de foro, fan-out de
-- community_events, handle_new_user). Ninguna declara search_path.
--
-- Eso es BUENA noticia para esta migración: al saltar RLS por diseño, el
-- sistema de XP, los contadores y la creación de perfil al registrarse
-- seguirán funcionando con RLS activo. Por eso el BLOQUE 4 no les da policies
-- de insert a los usuarios: no las necesitan.
--
-- Pero es un aviso aparte del Advisor (function_search_path_mutable): una
-- función security definer sin search_path fijo puede ser engañada para
-- ejecutar código con permisos de postgres. Se arregla sin tocar la lógica:
--
-- do $$
-- declare r record;
-- begin
--   for r in
--     select p.oid::regprocedure as f
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--     where n.nspname = 'public' and p.prosecdef
--       and coalesce(array_to_string(p.proconfig, ''), '') not like '%search_path%'
--   loop
--     execute format('alter function %s set search_path = public, pg_temp', r.f);
--   end loop;
-- end $$;
--
-- Va en una sesión aparte, después de confirmar que el sitio funciona con RLS.


-- ════════════════════════════════════════════════════════════════════════
-- BLOQUE 8 · Verificación (solo lectura)
-- ════════════════════════════════════════════════════════════════════════

-- Esperado: 0 filas.
select c.relname as tabla_sin_rls
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false;

-- Tablas con RLS pero sin ninguna policy: correcto solo si son backend-only.
select c.relname as tabla, 'RLS sin policies (solo service_role)' as nota
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname='public' and c.relkind='r' and c.relrowsecurity
  and not exists (select 1 from pg_policies p
                  where p.schemaname='public' and p.tablename=c.relname)
order by c.relname;

-- Nadie debe poder escribir como anon. Esperado: 0 filas.
select table_name, privilege_type
from information_schema.role_table_grants
where table_schema='public' and grantee='anon'
  and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE');
