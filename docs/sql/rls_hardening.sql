-- ============================================================================
-- ENDURECIMIENTO DE RLS — VERSIÓN FINAL. **NO EJECUTAR HASTA CONFIRMACIÓN.**
-- ============================================================================
-- Base: salida real de audit_rls.sql (54 tablas) y audit_rls_policies.sql
-- (todas las policies vigentes). Cada columna y cada rol usados aquí están
-- verificados contra esas dos salidas y contra el código de la app.
--
-- GARANTÍAS
--   · No hace insert, update, delete ni truncate sobre datos de negocio.
--   · No borra tablas, columnas, índices NI POLICIES existentes.
--   · No toca ninguna de las 46 tablas que ya tienen policies funcionales.
--   · Idempotente: re-ejecutarla no duplica nada.
--
-- ┌──────────────────────────────────────────────────────────────────────┐
-- │ REGLA QUE GOBIERNA TODO                                              │
-- │ Las policies permissive se combinan con OR. Añadir una policy a una  │
-- │ tabla que ya tiene otras AMPLÍA el acceso. Por eso aquí solo se      │
-- │ crean policies en tablas que hoy tienen CERO, y ninguna existente    │
-- │ se modifica ni se elimina.                                           │
-- └──────────────────────────────────────────────────────────────────────┘
--
-- FUERA DE ALCANCE (por indicación expresa, no por olvido):
--   · contact_places — RLS activa con 0 policies. Es puesta en marcha del
--     Mapa Cósmico, no seguridad. Va en su propio SQL.
--   · function_search_path_mutable — las 29 funciones security definer.
--   · Las 11 tablas que el código usa y no existen en la base.
--
-- EJECUCIÓN: tres fases. Probar el sitio entre una y otra.
-- ============================================================================



-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  FASE A — REVOCAR ESCRITURA DE anon                                  ║
-- ╚══════════════════════════════════════════════════════════════════════╝
--
-- POR QUÉ: la auditoría mostró que 52 de las 54 tablas conceden 'SIUD' a
-- anon (select+insert+update+delete). Solo member_subscriptions y
-- member_sync_events estaban en '----'. En las 46 tablas con RLS las policies
-- frenan ese grant; en las 8 sin RLS no lo frena nada, y la clave anon es
-- pública (viaja en el bundle del navegador y en wrangler.jsonc).
--
-- POR QUÉ NO ROMPE NADA: ningún componente de navegador hace .from() (solo
-- auth.* y channel), y el cliente SSR escribe siempre con sesión, es decir
-- como 'authenticated', no como 'anon'. Las policies que apuntan al rol
-- 'public' (direct_messages, user_meditation_progress, meditation_purchases)
-- siguen intactas: para anon ya fallaban solas, porque auth.uid() es NULL.
--
-- No se toca SELECT. Eso sería otra decisión, y no está en esta migración.

do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke insert, update, delete, truncate on public.%I from anon', r.tablename);
  end loop;
end $$;

-- Que las tablas futuras nazcan igual de cerradas:
alter default privileges in schema public revoke insert, update, delete on tables from anon;



-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  FASE B — RLS Y POLICIES EN LAS 8 TABLAS DESPROTEGIDAS               ║
-- ╚══════════════════════════════════════════════════════════════════════╝
--
-- Activar RLS y crear las policies van juntos, en la misma sesión: entre un
-- paso y otro las tablas quedan en "solo service_role".
--
-- Criterio de mínimo privilegio aplicado tabla por tabla. Dato decisivo:
-- SEIS de las OCHO no aparecen en ninguna llamada .from() del código. Para
-- esas, el mínimo privilegio real es CERO policies, no una policy por
-- auth.uid(). Si mañana una función las necesita, se añade entonces.

-- ── B.1 · Activar RLS en las 8 ─────────────────────────────────────────
-- Lista explícita, no dinámica: así se revisa una por una.

alter table public.dashboard_rate_limit        enable row level security;
alter table public.funnel_events               enable row level security;
alter table public.funnel_feedbacks            enable row level security;
alter table public.funnel_likes                enable row level security;
alter table public.funnel_reactions            enable row level security;
alter table public.leaderboard_top3_broadcasts enable row level security;
alter table public.leaderboard_top3_snapshot   enable row level security;
alter table public.user_funnels                enable row level security;


-- ── B.2 · Solo backend: RLS activa, CERO policies, sin grants ──────────
--
-- dashboard_rate_limit → infraestructura anti-abuso, sin columna de dueño.
--                        Sin uso en el código. Requisito explícito: solo
--                        backend/service_role.
-- funnel_events        → telemetría. Sin uso en el código.
-- funnel_likes         → sin uso en el código.
-- funnel_reactions     → sin uso en el código.
--
-- Sin policies, solo service_role entra (bypassa RLS). Retirar además los
-- grants las saca del Data API: dejan de responder incluso con un 401.

revoke all on public.dashboard_rate_limit from anon, authenticated;
revoke all on public.funnel_events        from anon, authenticated;
revoke all on public.funnel_likes         from anon, authenticated;
revoke all on public.funnel_reactions     from anon, authenticated;


-- ── B.3 · user_funnels — directorio de embudos entre miembros ──────────
--
-- ATENCIÓN, esto corrige mi propuesta anterior. Iba a poner
-- "select ... using (user_id = auth.uid())", y HABRÍA ROTO LA BÚSQUEDA.
--
-- app/api/search/route.ts lee user_funnels con el cliente SSR (rol
-- authenticated) SIN filtrar por usuario: busca por name/niche entre los
-- embudos de todos. Es un directorio compartido, como forum_posts, no un
-- dato privado. Los campos que expone son públicos dentro del sitio:
-- id, user_id, author_name, name, niche, url, image_url, created_at.
--
-- Lectura para miembros; escritura NINGUNA desde el cliente. Verificado:
-- los cuatro /api/profile/* actualizan con admin.from(...) (service_role),
-- no con el cliente de sesión. No hace falta policy de update.

drop policy if exists "user_funnels read members" on public.user_funnels;
create policy "user_funnels read members" on public.user_funnels
  for select to authenticated
  using (true);


-- ── B.4 · funnel_feedbacks — la policy que estaba dormida ──────────────
--
-- Es la única de las 8 que ya tenía una policy, inerte porque RLS estaba
-- apagada. Dice exactamente esto:
--
--     "users update own funnel feedback"
--     UPDATE · to authenticated
--     using      (user_id = auth.uid())
--     with check (user_id = auth.uid())
--
-- O sea: permite SOLO actualizar las filas propias, y solo a usuarios con
-- sesión. Es correcta y de mínimo privilegio. NO permite select, insert ni
-- delete a nadie.
--
-- NO SE AÑADE NINGUNA POLICY. Comprobado que no hace falta: los cinco sitios
-- que leen la tabla (/api/reports y los cuatro /api/profile/*) usan
-- admin.from(...), que bypassa RLS. Al activar RLS en B.1, esta tabla queda
-- en "solo service_role, más el update propio". Es el estado deseado.
--
-- Nota menor, sin acción: esa policy de update es hoy redundante, porque las
-- actualizaciones en cascada también van por service_role. Se deja como está;
-- eliminarla sería un cambio no pedido y podría romper una ruta no visible.


-- ── B.5 · Ranking — lectura para miembros, escritura solo por triggers ─
--
-- Requisito explícito. Las escribe el trigger on_user_xp_top3_check, que es
-- security definer y salta RLS: no necesita policy de insert.
-- Sin policy de insert/update/delete → ningún usuario puede falsear el ranking.
--
-- (Hoy ninguna ruta las lee todavía; la policy deja el ranking listo para
--  cuando la UI lo consuma, sin volver a tocar la base.)

drop policy if exists "leaderboard read members" on public.leaderboard_top3_snapshot;
create policy "leaderboard read members" on public.leaderboard_top3_snapshot
  for select to authenticated
  using (true);

drop policy if exists "leaderboard read members" on public.leaderboard_top3_broadcasts;
create policy "leaderboard read members" on public.leaderboard_top3_broadcasts
  for select to authenticated
  using (true);



-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  FASE C — PROTEGER profiles.is_admin CONTRA AUTOESCALACIÓN           ║
-- ╚══════════════════════════════════════════════════════════════════════╝
--
-- AGUJERO CONFIRMADO POR LA AUDITORÍA. profiles tiene esta policy:
--
--     "user updates own profile"
--     UPDATE · to authenticated
--     using      (auth.uid() = id)
--     with check (auth.uid() = id)
--
-- y el rol authenticated tiene grant 'SIUD' sobre la tabla. Combinando las
-- dos cosas, cualquier miembro con sesión puede hacer un PATCH a
-- /rest/v1/profiles?id=eq.<su-id> poniendo is_admin = true, y entrar al panel
-- de administración. La policy es correcta; el problema es que el grant de
-- UPDATE cubre TODAS las columnas.
--
-- Se revoca el privilegio SOBRE LA COLUMNA, no sobre la tabla: editar
-- nombre, avatar y demás sigue funcionando exactamente igual.
--
-- El admin legítimo no se ve afectado: los cambios de is_admin se hacen con
-- service_role, que no pasa por estos grants.

revoke update (is_admin) on public.profiles from anon, authenticated;



-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  VERIFICACIÓN — solo lectura, una sola consulta                      ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- El SQL Editor de Supabase solo muestra el resultado de la ÚLTIMA sentencia,
-- por eso las cinco comprobaciones van unidas en una. Correr después de las
-- tres fases. Todas las filas deben decir 'ok'.

with t as (
  select c.oid, c.relname::text as tabla, c.relrowsecurity as rls,
         (select count(*) from pg_policies p
            where p.schemaname = 'public' and p.tablename = c.relname) as npol
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
),
w as (  -- ¿anon puede escribir en algo?
  select tabla from t
  where has_table_privilege('anon', oid, 'INSERT')
     or has_table_privilege('anon', oid, 'UPDATE')
     or has_table_privilege('anon', oid, 'DELETE')
)

-- 1 · Inventario completo: las 54 tablas deben tener RLS.
select '1 · inventario' as chequeo,
       'tablas en public' as detalle,
       count(*)::text as valor,
       case when count(*) = 54 then 'ok' else 'REVISAR: ya no son 54' end as veredicto
from t
union all
select '1 · inventario', 'tablas SIN RLS', count(*)::text,
       case when count(*) = 0 then 'ok' else 'FALLO' end
from t where not rls

-- 2 · Las 8 vulnerables, una por una.
union all
select '2 · las 8', tabla,
       case when rls then 'RLS activa' else 'RLS APAGADA' end || ' · ' || npol || ' policies',
       case when rls then 'ok' else 'FALLO' end
from t
where tabla in ('dashboard_rate_limit','funnel_events','funnel_feedbacks',
                'funnel_likes','funnel_reactions','user_funnels',
                'leaderboard_top3_snapshot','leaderboard_top3_broadcasts')

-- 3 · anon no debe poder escribir en ninguna tabla.
union all
select '3 · anon escritura',
       coalesce((select string_agg(tabla, ', ') from w), 'ninguna tabla'),
       (select count(*) from w)::text,
       case when (select count(*) from w) = 0 then 'ok' else 'FALLO' end

-- 4 · authenticated solo donde hace falta: las backend-only deben estar a cero.
union all
select '4 · authenticated', tabla,
       concat(
         case when has_table_privilege('authenticated', oid, 'SELECT') then 'S' else '-' end,
         case when has_table_privilege('authenticated', oid, 'INSERT') then 'I' else '-' end,
         case when has_table_privilege('authenticated', oid, 'UPDATE') then 'U' else '-' end,
         case when has_table_privilege('authenticated', oid, 'DELETE') then 'D' else '-' end),
       case when has_table_privilege('authenticated', oid, 'SELECT')
              or has_table_privilege('authenticated', oid, 'INSERT')
              or has_table_privilege('authenticated', oid, 'UPDATE')
              or has_table_privilege('authenticated', oid, 'DELETE')
            then 'FALLO: deberia estar sin permisos' else 'ok' end
from t
where tabla in ('dashboard_rate_limit','funnel_events','funnel_likes','funnel_reactions',
                'stripe_sales','revoked_products','email_send_log',
                'api_rate_limit','member_sync_events')

-- 5 · El panel de administración debe seguir intacto.
--     Las rutas app/api/admin/* escriben como 'authenticated', no como
--     service_role, así que dependen de estas policies y de estos grants.
union all
select '5 · admin', tabla,
       npol || ' policies · authenticated ' ||
       concat(
         case when has_table_privilege('authenticated', oid, 'SELECT') then 'S' else '-' end,
         case when has_table_privilege('authenticated', oid, 'INSERT') then 'I' else '-' end,
         case when has_table_privilege('authenticated', oid, 'UPDATE') then 'U' else '-' end,
         case when has_table_privilege('authenticated', oid, 'DELETE') then 'D' else '-' end),
       case when npol >= 2
             and has_table_privilege('authenticated', oid, 'INSERT')
             and has_table_privilege('authenticated', oid, 'UPDATE')
            then 'ok' else 'REVISAR: el panel podria no escribir' end
from t
where tabla in ('seasons','episodes','episode_blocks','products',
                'product_modules','product_module_blocks','series_info')

-- 6 · is_admin ya no debe ser escribible desde el cliente.
union all
select '6 · is_admin', 'profiles.is_admin',
       case when has_column_privilege('authenticated', 'public.profiles', 'is_admin', 'UPDATE')
            then 'authenticated AUN puede escribirla' else 'protegida' end,
       case when has_column_privilege('authenticated', 'public.profiles', 'is_admin', 'UPDATE')
            then 'FALLO' else 'ok' end

order by 1, 2;



-- ============================================================================
-- APÉNDICE · Dos cosas que la auditoría destapó y que NO arregla esta
-- migración. Ninguna es urgente; conviene decidirlas aparte.
-- ============================================================================
--
-- a) profiles: "authenticated read all profiles" es SELECT using (true).
--    Cualquier miembro puede leer la fila completa de cualquier otro, con
--    todas sus columnas. Si ahí hay email o datos personales, es una fuga
--    silenciosa. Se arregla con una vista pública o restringiendo columnas.
--    No lo toco aquí: cambiar esa policy podría romper el directorio de
--    miembros, el foro y los perfiles públicos de golpe.
--
-- b) user_xp: "authenticated read xp" es SELECT using (true). Probablemente
--    intencional, para el ranking. Solo queda anotado.
