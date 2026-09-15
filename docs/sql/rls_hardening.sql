-- ============================================================================
-- ENDURECIMIENTO DE RLS — VERSIÓN FINAL. **NO EJECUTAR HASTA CONFIRMACIÓN.**
-- ============================================================================
-- Base: audit_rls.sql (54 tablas), audit_rls_policies.sql (policies vigentes)
-- y una revisión exhaustiva del código. Ninguna columna está adivinada.
--
-- GARANTÍAS
--   · No hace insert, update, delete ni truncate sobre datos de negocio.
--   · No borra tablas, columnas, índices NI POLICIES existentes.
--   · No toca ninguna de las 46 tablas que ya tienen policies funcionales.
--   · Idempotente.
--
-- ┌──────────────────────────────────────────────────────────────────────┐
-- │ REGLA QUE GOBIERNA TODO                                              │
-- │ Las policies permissive se combinan con OR: añadir una policy a una  │
-- │ tabla que ya tiene otras AMPLÍA el acceso. Aquí solo se crean        │
-- │ policies donde hoy hay CERO, y ninguna existente se modifica.        │
-- └──────────────────────────────────────────────────────────────────────┘
--
-- FUERA DE ALCANCE por indicación expresa: contact_places,
-- function_search_path_mutable, y las 11 tablas inexistentes.
-- ============================================================================



-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  FASE A — REVOCAR ESCRITURA DE anon                                  ║
-- ╚══════════════════════════════════════════════════════════════════════╝
--
-- POR QUÉ: 52 de las 54 tablas conceden 'SIUD' a anon. En las 46 con RLS las
-- policies frenan ese grant; en las 8 sin RLS no lo frena nada, y la clave
-- anon es pública (va en el bundle del navegador y en wrangler.jsonc).
--
-- COMPROBACIÓN FINAL DE FLUJOS PÚBLICOS (hecha antes de escribir esto):
--   1. Ningún componente 'use client' hace .from(). Cero resultados.
--   2. Ninguna ruta de app/api importa getSupabaseBrowser. Cero resultados.
--   3. Solo tres sitios crean un cliente anon propio, y los tres tocan
--      únicamente el schema 'auth', nunca 'public':
--        · app/api/auth/recovery-verify    → auth.verifyOtp
--        · app/api/profile/recover-password → auth.resetPasswordForEmail
--        · app/api/profile/change-password  → auth.signInWithPassword
--      Los grants de 'public' no afectan al schema 'auth'.
--   4. El cliente SSR solo escribe con cookie de sesión, es decir como
--      'authenticated'. Nunca como 'anon'.
--   5. Las policies dirigidas al rol 'public' (direct_messages,
--      user_meditation_progress, meditation_purchases) ya fallaban para anon
--      por sí solas, porque auth.uid() es NULL.
--
-- CONCLUSIÓN: no existe ninguna escritura pública no autenticada.
-- Revocar INSERT/UPDATE/DELETE a anon no rompe ningún flujo.
--
-- No se toca SELECT: esa es otra decisión y no entra aquí.

do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke insert, update, delete, truncate on public.%I from anon', r.tablename);
  end loop;
end $$;

alter default privileges in schema public revoke insert, update, delete on tables from anon;



-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  FASE B — RLS Y POLICIES EN LAS 8 TABLAS DESPROTEGIDAS               ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- B.1 y el resto van JUNTOS en la misma sesión: entre medias las tablas
-- quedan en "solo service_role".

-- ── B.1 · Activar RLS ──────────────────────────────────────────────────
alter table public.dashboard_rate_limit        enable row level security;
alter table public.funnel_events               enable row level security;
alter table public.funnel_feedbacks            enable row level security;
alter table public.funnel_likes                enable row level security;
alter table public.funnel_reactions            enable row level security;
alter table public.leaderboard_top3_broadcasts enable row level security;
alter table public.leaderboard_top3_snapshot   enable row level security;
alter table public.user_funnels                enable row level security;


-- ── B.2 · Solo backend: RLS activa, CERO policies, sin grants ──────────
-- Ninguna de estas cuatro aparece en una sola llamada .from() del código.
-- El mínimo privilegio real es cero policies, no una policy por auth.uid().
revoke all on public.dashboard_rate_limit from anon, authenticated;
revoke all on public.funnel_events        from anon, authenticated;
revoke all on public.funnel_likes         from anon, authenticated;
revoke all on public.funnel_reactions     from anon, authenticated;


-- ── B.3 · user_funnels — directorio compartido entre miembros ──────────
-- app/api/search/route.ts lo lee con el cliente SSR SIN filtrar por usuario
-- (busca por name/niche entre los embudos de todos). Una policy
-- user_id = auth.uid() habría roto la búsqueda.
-- Escritura: ninguna desde el cliente. Los /api/profile/* usan admin.from().
drop policy if exists "user_funnels read members" on public.user_funnels;
create policy "user_funnels read members" on public.user_funnels
  for select to authenticated using (true);


-- ── B.4 · funnel_feedbacks — conserva su policy, no se añade nada ──────
-- Su única policy es "users update own funnel feedback": UPDATE, to
-- authenticated, using y with check (user_id = auth.uid()). No permite
-- select, insert ni delete. Sus lecturas van por service_role.


-- ── B.5 · Ranking — lectura para miembros, escritura solo por triggers ─
-- Lo escribe on_user_xp_top3_check (security definer → salta RLS).
-- Sin policy de escritura: nadie puede falsear el ranking.
drop policy if exists "leaderboard read members" on public.leaderboard_top3_snapshot;
create policy "leaderboard read members" on public.leaderboard_top3_snapshot
  for select to authenticated using (true);

drop policy if exists "leaderboard read members" on public.leaderboard_top3_broadcasts;
create policy "leaderboard read members" on public.leaderboard_top3_broadcasts
  for select to authenticated using (true);



-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  FASE C — PROTEGER profiles.is_admin  (CORREGIDA)                    ║
-- ╚══════════════════════════════════════════════════════════════════════╝
--
-- ── POR QUÉ LA VERSIÓN ANTERIOR NO SERVÍA ──────────────────────────────
-- Decía "revoke update (is_admin) on public.profiles from authenticated".
-- Eso NO funciona. En PostgreSQL un GRANT UPDATE a nivel de tabla equivale
-- a conceder UPDATE sobre TODAS las columnas, y un REVOKE de columna no
-- puede recortar un privilegio de tabla: el permiso de tabla sigue vigente
-- y sigue permitiendo escribir esa columna. El agujero quedaba abierto.
--
-- La forma correcta es la inversa: quitar el UPDATE de tabla y devolver
-- UPDATE solo sobre una lista explícita de columnas.
--
-- ── EL AGUJERO, CONFIRMADO ─────────────────────────────────────────────
-- profiles tiene la policy "user updates own profile" (UPDATE, to
-- authenticated, using y with check auth.uid() = id) y el rol authenticated
-- tiene grant 'SIUD'. Combinados, cualquier miembro puede hacer
--   PATCH /rest/v1/profiles?id=eq.<su-id>   {"is_admin": true}
-- y entrar al panel: lib/admin-auth.ts decide con profiles.is_admin.
--
-- ── LA WHITELIST ES VACÍA, Y NO ES UNA SUPOSICIÓN ──────────────────────
-- Búsqueda exhaustiva en todo el repo: las NUEVE llamadas .from("profiles")
-- son .select(). No existe un solo .update(), .upsert() ni .insert() sobre
-- esa tabla en ningún archivo .ts/.tsx/.mjs/.js.
--
-- La edición de perfil NO pasa por public.profiles. Va por
-- supabase.auth.updateUser({ data }), que escribe en
-- auth.users.raw_user_meta_data. Verificado en app/api/profile/update
-- (bio, niche, instagram, instagram_url), /avatar, /avatar-border,
-- /featured-badge, /featured-flame, /featured-star, /notification-prefs.
--
-- public.profiles la escriben solo: el trigger handle_new_user (security
-- definer, salta grants) y SQL manual con service_role, como
-- docs/sql/acceso_manual_tester.sql (manual_access, access_role).
--
-- Por tanto: authenticated no necesita UPDATE sobre ninguna columna.
-- Whitelist vacía = mínimo privilegio real, y no rompe nada.

revoke update on public.profiles from authenticated, anon;

-- ── Whitelist (hoy vacía a propósito) ──────────────────────────────────
-- Si algún día la edición de perfil se mueve de auth.users a esta tabla,
-- se descomenta SOLO con los campos de presentación. La lista se construye
-- verificando antes que la columna exista, para no fallar.
--
-- do $$
-- declare c text; cols text[] := array['bio','niche','instagram','instagram_url'];
-- begin
--   foreach c in array cols loop
--     if exists (select 1 from information_schema.columns
--                where table_schema='public' and table_name='profiles' and column_name=c) then
--       execute format('grant update (%I) on public.profiles to authenticated', c);
--     else
--       raise notice 'columna inexistente, omitida: %', c;
--     end if;
--   end loop;
-- end $$;
--
-- NUNCA deben entrar en esa lista: is_admin, manual_access, access_role,
-- ni ninguna columna de rol, permiso, membresía, saldo o estado de pago.

-- La policy "user updates own profile" (auth.uid() = id) se conserva intacta.
-- Sigue ahí como segunda barrera: si mañana se concede UPDATE sobre alguna
-- columna, seguirá limitado a la fila propia.
--
-- No se tocan INSERT ni DELETE: profiles no tiene policies para esas
-- operaciones, así que la RLS ya las bloquea por sí sola.



-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  VERIFICACIÓN — solo lectura, una sola consulta                      ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Correr tras las tres fases. Todas las filas deben decir 'ok'.

with t as (
  select c.oid, c.relname::text as tabla, c.relrowsecurity as rls,
         (select count(*) from pg_policies p
            where p.schemaname = 'public' and p.tablename = c.relname) as npol
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
),
w as (
  select tabla from t
  where has_table_privilege('anon', oid, 'INSERT')
     or has_table_privilege('anon', oid, 'UPDATE')
     or has_table_privilege('anon', oid, 'DELETE')
)

select '1 · inventario' as chequeo, 'tablas en public' as detalle,
       count(*)::text as valor,
       case when count(*) = 54 then 'ok' else 'REVISAR: ya no son 54' end as veredicto
from t
union all
select '1 · inventario', 'tablas SIN RLS', count(*)::text,
       case when count(*) = 0 then 'ok' else 'FALLO' end
from t where not rls

union all
select '2 · las 8', tabla,
       case when rls then 'RLS activa' else 'RLS APAGADA' end || ' · ' || npol || ' policies',
       case when rls then 'ok' else 'FALLO' end
from t
where tabla in ('dashboard_rate_limit','funnel_events','funnel_feedbacks',
                'funnel_likes','funnel_reactions','user_funnels',
                'leaderboard_top3_snapshot','leaderboard_top3_broadcasts')

union all
select '3 · anon escritura',
       coalesce((select string_agg(tabla, ', ') from w), 'ninguna tabla'),
       (select count(*) from w)::text,
       case when (select count(*) from w) = 0 then 'ok' else 'FALLO' end

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

-- El panel de admin escribe como 'authenticated': depende de estas policies
-- y de conservar INSERT/UPDATE.
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

-- Columna por columna de profiles. Muestra además el esquema real.
-- Con la whitelist vacía, TODAS deben salir 'bloqueada'.
union all
select '6 · profiles', col.column_name::text,
       case when has_column_privilege('authenticated','public.profiles',col.column_name::text,'UPDATE')
            then 'EDITABLE por authenticated' else 'bloqueada' end,
       case when col.column_name::text in ('is_admin','manual_access','access_role')
            then case when has_column_privilege('authenticated','public.profiles',col.column_name::text,'UPDATE')
                      then 'FALLO CRITICO' else 'ok' end
            when has_column_privilege('authenticated','public.profiles',col.column_name::text,'UPDATE')
            then 'revisar: fuera de la whitelist' else 'ok' end
from information_schema.columns col
where col.table_schema = 'public' and col.table_name = 'profiles'

-- La lectura de profiles NO debe romperse: de ella dependen el login,
-- requireAdmin() y el control de membresía.
union all
select '7 · lectura', 'profiles select para authenticated',
       case when has_table_privilege('authenticated','public.profiles','SELECT')
            then 'conservado' else 'PERDIDO' end,
       case when has_table_privilege('authenticated','public.profiles','SELECT')
            then 'ok' else 'FALLO: se rompe el login' end

order by 1, 2;



-- ============================================================================
-- PRUEBAS DE PENETRACIÓN — correr UNA CADA VEZ, después de la FASE C
-- ============================================================================
-- Las dos van dentro de begin/rollback: no dejan ningún cambio.
-- Si el UPDATE llegara a tener éxito (fallo), el rollback lo deshace igual.
--
--
-- PRUEBA 1 · Un usuario normal NO puede ascenderse a admin.
--            RESULTADO ESPERADO: ERROR: permission denied for table profiles
--            Si en vez de error devuelve "UPDATE 1", la protección FALLÓ.
--
-- begin;
--   select set_config(
--     'request.jwt.claims',
--     json_build_object(
--       'sub',  (select id from public.profiles where coalesce(is_admin,false) = false limit 1),
--       'role', 'authenticated'
--     )::text, true);
--   set local role authenticated;
--
--   update public.profiles set is_admin = true where id = auth.uid();
-- rollback;
--
--
-- PRUEBA 2 · Ese mismo usuario SÍ puede seguir leyendo su perfil.
--            De esta lectura dependen el login, requireAdmin() y la
--            comprobación de membresía.
--            RESULTADO ESPERADO: exactamente 1 fila.
--
-- begin;
--   select set_config(
--     'request.jwt.claims',
--     json_build_object(
--       'sub',  (select id from public.profiles where coalesce(is_admin,false) = false limit 1),
--       'role', 'authenticated'
--     )::text, true);
--   set local role authenticated;
--
--   select id, is_admin from public.profiles where id = auth.uid();
-- rollback;
--
--
-- PRUEBA 3 · En la web, con un usuario normal: editar bio, nicho, Instagram
--            y avatar en Configuración y confirmar que guarda. Esa ruta va
--            por auth.updateUser (schema auth), así que la FASE C no la
--            toca — pero conviene verlo funcionar con los propios ojos.



-- ============================================================================
-- APÉNDICE · Dos cosas destapadas por la auditoría que esta migración NO
-- arregla. Ninguna urgente; decidir aparte.
-- ============================================================================
-- a) profiles: "authenticated read all profiles" es SELECT using (true).
--    Cualquier miembro lee la fila completa de cualquier otro, con todas sus
--    columnas. Si ahí hay email u otros datos personales, es una fuga
--    silenciosa. Cambiar esa policy podría romper el directorio de miembros,
--    el foro y los perfiles públicos a la vez, así que va por separado.
--
-- b) user_xp: "authenticated read xp" es SELECT using (true). Probablemente
--    intencional, para el ranking. Solo queda anotado.
