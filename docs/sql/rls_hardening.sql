-- ============================================================================
-- ENDURECIMIENTO DE RLS  ─ PREPARADA PARA REVISIÓN. **NO EJECUTAR TODAVÍA.**
-- ============================================================================
-- Escrita contra la salida real de docs/sql/audit_rls.sql (54 tablas en public).
-- Todos los nombres de columna usados aquí están verificados en esa salida.
--
-- GARANTÍAS:
--   · No hace insert, update, delete ni truncate sobre datos de negocio.
--   · No borra tablas, columnas, índices ni policies existentes.
--   · Solo: activa RLS en 8 tablas, ajusta grants y crea policies nuevas.
--   · Idempotente: re-ejecutarla no duplica nada.
--
-- ┌──────────────────────────────────────────────────────────────────────┐
-- │ REGLA QUE GOBIERNA TODA ESTA MIGRACIÓN                               │
-- │                                                                      │
-- │ En PostgreSQL las policies permissive se COMBINAN CON *OR*. Añadir   │
-- │ una policy a una tabla que ya tiene otras AMPLÍA el acceso, nunca lo │
-- │ reduce. Por eso esta migración NO toca ninguna de las 46 tablas que  │
-- │ ya tienen RLS y policies: añadirles reglas las debilitaría.          │
-- │                                                                      │
-- │ Solo se crean policies donde hoy hay CERO.                           │
-- └──────────────────────────────────────────────────────────────────────┘
--
-- ORDEN: bloque por bloque, probando el sitio entre uno y otro.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════
-- BLOQUE 0 · Helper de administrador
-- ════════════════════════════════════════════════════════════════════════
-- security definer para que una policy sobre profiles que consulte profiles
-- no entre en recursión infinita.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;


-- ════════════════════════════════════════════════════════════════════════
-- BLOQUE 1 · Quitar a 'anon' toda capacidad de ESCRITURA en public
-- ════════════════════════════════════════════════════════════════════════
-- ESTE ES EL BLOQUE MÁS IMPORTANTE DE LA MIGRACIÓN.
--
-- La auditoría reveló que 52 de las 54 tablas tienen grants 'SIUD' para anon:
-- select, insert, update y delete. Las únicas dos salvadas son
-- member_subscriptions ('----') y member_sync_events ('----').
--
-- En las 46 tablas con RLS, las policies frenan ese grant. En las 8 SIN RLS,
-- no lo frena nada: la clave anon es pública (viaja en el bundle del navegador
-- y está en wrangler.jsonc), así que hoy cualquiera puede escribir y borrar
-- en esas 8 tablas.
--
-- Riesgo de rotura: nulo. Ningún componente de navegador hace .from(), y el
-- cliente SSR solo escribe con sesión activa (rol authenticated, no anon).

do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke insert, update, delete, truncate on public.%I from anon', r.tablename);
  end loop;
end $$;

alter default privileges in schema public revoke insert, update, delete on tables from anon;


-- ════════════════════════════════════════════════════════════════════════
-- BLOQUE 2 · Activar RLS en las 8 tablas que disparan la alerta
-- ════════════════════════════════════════════════════════════════════════
-- Lista explícita, no dinámica: así se revisa una por una y no se activa RLS
-- por sorpresa en algo que aparezca mañana.
--
-- OJO: ejecutar este bloque SIN el BLOQUE 3 deja estas 8 tablas en
-- "solo service_role". Van seguidos, en la misma sesión.

alter table public.dashboard_rate_limit        enable row level security;
alter table public.funnel_events               enable row level security;
alter table public.funnel_feedbacks            enable row level security;
alter table public.funnel_likes                enable row level security;
alter table public.funnel_reactions            enable row level security;
alter table public.leaderboard_top3_broadcasts enable row level security;
alter table public.leaderboard_top3_snapshot   enable row level security;
alter table public.user_funnels                enable row level security;


-- ════════════════════════════════════════════════════════════════════════
-- BLOQUE 3 · Policies para esas 8 tablas (las únicas con 0 policies)
-- ════════════════════════════════════════════════════════════════════════

-- 3.a  dashboard_rate_limit — infraestructura, sin columna de dueño.
--      RLS activo y CERO policies = solo service_role. Es lo correcto.
revoke all on public.dashboard_rate_limit from anon, authenticated;


-- 3.b  user_funnels — el embudo del propio usuario.
--      Columna verificada: user_id. El código hace select y update vía SSR.
drop policy if exists "rls_read_own" on public.user_funnels;
create policy "rls_read_own" on public.user_funnels
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "rls_insert_own" on public.user_funnels;
create policy "rls_insert_own" on public.user_funnels
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "rls_update_own" on public.user_funnels;
create policy "rls_update_own" on public.user_funnels
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Sin delete: borrar embudos queda para service_role.


-- 3.c  funnel_events — telemetría del embudo. Columna verificada: user_id.
--      Solo lectura de lo propio; las altas las hace el backend.
drop policy if exists "rls_read_own" on public.funnel_events;
create policy "rls_read_own" on public.funnel_events
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());


-- 3.d  funnel_likes y funnel_reactions — sociales sobre embudos ajenos.
--      Columna verificada: user_id. Lectura para miembros, escritura propia.
do $$
declare t text;
begin
  foreach t in array array['funnel_likes','funnel_reactions']
  loop
    execute format('drop policy if exists "rls_read_members" on public.%I', t);
    execute format(
      'create policy "rls_read_members" on public.%I for select to authenticated using (true)', t);

    execute format('drop policy if exists "rls_insert_own" on public.%I', t);
    execute format(
      'create policy "rls_insert_own" on public.%I for insert to authenticated '
      'with check (user_id = auth.uid())', t);

    execute format('drop policy if exists "rls_delete_own" on public.%I', t);
    execute format(
      'create policy "rls_delete_own" on public.%I for delete to authenticated '
      'using (user_id = auth.uid() or public.is_admin())', t);
  end loop;
end $$;


-- 3.e  leaderboard_top3_snapshot y leaderboard_top3_broadcasts
--      Un ranking es visible para los miembros por definición.
--      Columna verificada: user_id. Las escribe el trigger
--      on_user_xp_top3_check (security definer → salta RLS), no el cliente.
do $$
declare t text;
begin
  foreach t in array array['leaderboard_top3_snapshot','leaderboard_top3_broadcasts']
  loop
    execute format('drop policy if exists "rls_read_members" on public.%I', t);
    execute format(
      'create policy "rls_read_members" on public.%I for select to authenticated using (true)', t);
  end loop;
end $$;


-- 3.f  funnel_feedbacks — ¡ATENCIÓN! Es la única de las 8 que YA tiene una
--      policy (1), pero estaba inerte porque RLS estaba apagado. El BLOQUE 2
--      acaba de despertarla y no sé qué dice.
--
--      NO se le añade ninguna policy aquí a propósito: si la existente ya es
--      correcta, añadir otra la ampliaría (recordar la regla del encabezado).
--
--      ANTES de dar por buena la migración, correr docs/sql/audit_rls_policies.sql
--      y leer la fila de funnel_feedbacks. El código hace select y update vía
--      SSR sobre user_id, así que la policy debería permitir eso y nada más.


-- ════════════════════════════════════════════════════════════════════════
-- BLOQUE 4 · Tablas exclusivas del backend: retirar grants
-- ════════════════════════════════════════════════════════════════════════
-- Todas tienen RLS activo y CERO policies, así que hoy ya solo entra
-- service_role. Retirar además los grants las saca del Data API por completo:
-- dejan de responder incluso con un 401 informativo.
--
-- Lista recortada respecto a mi borrador anterior. Salieron de aquí:
--   · direct_messages y direct_message_blocks → tienen 3 policies cada una y
--     el SSR las usa. Revocarles grants habría roto los mensajes privados.
--   · account_invites y funnel_feedbacks → tienen policy y uso desde el cliente.
--   · Ocho nombres del borrador (abandoned_checkout, purchase_webhook_log,
--     stripe_processed_events, whatsapp_logs, whatsapp_pending, feed_comments,
--     feed_likes, user_reports) NO EXISTEN en la base. El código los referencia
--     pero nunca se crearon. El guard to_regclass los ignora sin fallar.

do $$
declare t text;
begin
  foreach t in array array[
    'stripe_sales',        -- dinero. 0 policies, pero anon tenía SIUD.
    'revoked_products',    -- moderación de accesos.
    'email_send_log',      -- correos de miembros.
    'api_rate_limit',      -- infraestructura.
    'member_sync_events'   -- ya estaba en '----'; queda como no-op.
  ]
  loop
    if to_regclass('public.'||t) is null then
      raise notice 'omitida (no existe): %', t; continue;
    end if;
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;


-- ════════════════════════════════════════════════════════════════════════
-- BLOQUE 5 · profiles: que nadie se auto-ascienda a admin
-- ════════════════════════════════════════════════════════════════════════
-- profiles tiene 3 policies y grants 'SIUD' para anon y authenticated. Si
-- alguna de esas policies permite update de la fila propia, un miembro podría
-- ponerse is_admin = true desde PostgREST y entrar al panel.
--
-- Se revoca el privilegio SOBRE LA COLUMNA, no sobre la tabla: el resto del
-- update propio (nombre, avatar) sigue funcionando igual.

revoke update (is_admin) on public.profiles from anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════
-- BLOQUE 6 · contact_places — decisión pendiente, NO incluida
-- ════════════════════════════════════════════════════════════════════════
-- Anomalía detectada: RLS activo con CERO policies. Eso significa que hoy el
-- Mapa Cósmico no muestra nada a los miembros (solo service_role lee).
-- Encaja con que docs/sql/contact_places.sql sigue pendiente de ejecutar.
--
-- Como es la puesta en marcha de un módulo y no un arreglo de seguridad, no
-- lo mezclo aquí. Las policies correctas, con columnas ya verificadas
-- (status, created_by_id), serían:
--
-- create policy "rls_read_members" on public.contact_places
--   for select to authenticated
--   using (status = 'published' or created_by_id = auth.uid() or public.is_admin());
--
-- create policy "rls_insert_own" on public.contact_places
--   for insert to authenticated with check (created_by_id = auth.uid());
--
-- create policy "rls_admin_all" on public.contact_places
--   for all to authenticated
--   using (public.is_admin()) with check (public.is_admin());


-- ════════════════════════════════════════════════════════════════════════
-- BLOQUE 7 · OPCIONAL — quitar también la LECTURA a 'anon'
-- ════════════════════════════════════════════════════════════════════════
-- Cinturón y tirantes. Ejecutar SOLO tras confirmar que ninguna página
-- pública sin sesión lee de la base (si alguna landing lee site_texts sin
-- login, este bloque la deja vacía).
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
-- BLOQUE 8 · function_search_path_mutable — NO EJECUTAR AHORA
-- ════════════════════════════════════════════════════════════════════════
-- Las 29 funciones security definer de public (triggers de XP, contadores de
-- foro, fan-out, handle_new_user) no fijan search_path. Es el otro aviso del
-- Advisor y un vector real de escalada, porque corren como postgres.
--
-- Va en una sesión aparte, después de confirmar que el sitio funciona con RLS.
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


-- ════════════════════════════════════════════════════════════════════════
-- BLOQUE 9 · Verificación (solo lectura)
-- ════════════════════════════════════════════════════════════════════════
-- Una sola consulta: el editor de Supabase solo muestra el último resultado.

select
  c.relname::text as tabla,
  case when c.relrowsecurity then 'si' else '*** NO ***' end as rls,
  (select count(*) from pg_policies p
     where p.schemaname='public' and p.tablename=c.relname) as policies,
  concat(
    case when has_table_privilege('anon', c.oid, 'SELECT') then 'S' else '-' end,
    case when has_table_privilege('anon', c.oid, 'INSERT') then 'I' else '-' end,
    case when has_table_privilege('anon', c.oid, 'UPDATE') then 'U' else '-' end,
    case when has_table_privilege('anon', c.oid, 'DELETE') then 'D' else '-' end
  ) as anon,
  case
    when not c.relrowsecurity then 'FALLO: sigue sin RLS'
    when has_table_privilege('anon', c.oid, 'INSERT')
      or has_table_privilege('anon', c.oid, 'UPDATE')
      or has_table_privilege('anon', c.oid, 'DELETE') then 'FALLO: anon aun escribe'
    else 'ok'
  end as veredicto
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by (case when c.relrowsecurity then 1 else 0 end), c.relname;
-- Esperado: 54 filas, todas con veredicto 'ok'.
