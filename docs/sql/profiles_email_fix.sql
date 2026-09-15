-- ============================================================================
-- FUGA DE profiles.email — PREPARADO PARA REVISIÓN. **NO EJECUTAR.**
-- ============================================================================
-- Problema: la policy "authenticated read all profiles" es SELECT using (true)
-- y la tabla tiene columna 'email'. Cualquier miembro con sesión puede pedir
--     GET /rest/v1/profiles?select=email
-- y llevarse el correo de todos los demás.
--
-- NO TOCA las 8 tablas ni las policies aseguradas en la migración anterior.
-- No modifica datos. Cambia una sola policy de SELECT sobre profiles.
-- ============================================================================


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  OPCIÓN RECOMENDADA — restringir la FILA, no la columna              ║
-- ╚══════════════════════════════════════════════════════════════════════╝
--
-- POR QUÉ ESTA Y NO LA DE COLUMNAS: las DIEZ lecturas de public.profiles del
-- repo filtran por la fila propia (.eq("id", user.id)). Ninguna lee perfiles
-- ajenos. Verificado uno por uno, incluidos los tres llamadores de
-- getCategoryAccess, que siempre pasan user.id.
--
-- Por tanto, limitar la lectura a la fila propia no rompe absolutamente nada,
-- NO requiere tocar el código y NO requiere desplegar — cosa importante,
-- porque GitHub Actions sigue bloqueado y hoy no se puede publicar código.
--
-- Y protege más que la solución por columnas: esconde TODAS las columnas de
-- los demás miembros, no solo el email.

drop policy if exists "authenticated read all profiles" on public.profiles;

create policy "profiles read own" on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- Las otras dos policies de profiles ("admin updates any profile" y
-- "user updates own profile") se dejan intactas. Sus subconsultas leen
-- p.id = auth.uid(), o sea la fila propia, que la nueva policy permite.
-- No hay recursión: la nueva expresión no consulta profiles.


-- ── Si algún día el admin necesita leer perfiles ajenos ────────────────
-- NO se puede añadir "or exists (select 1 from profiles ...)" a esta policy:
-- sería recursión infinita. Hay que pasar por una función security definer.
-- Hoy no hace falta: las rutas de admin leen con service_role.
--
-- create or replace function public.is_admin()
-- returns boolean language sql stable security definer
-- set search_path = public, pg_temp as $$
--   select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
-- $$;
-- revoke all on function public.is_admin() from public, anon;
-- grant execute on function public.is_admin() to authenticated, service_role;
--
-- drop policy if exists "profiles read own" on public.profiles;
-- create policy "profiles read own" on public.profiles
--   for select to authenticated
--   using (id = auth.uid() or public.is_admin());



-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  OPCIÓN DESCARTADA — grants por columna   ⚠ ROMPE EL PANEL ⚠         ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Era la propuesta de partida. No sirve, por tres razones concretas:
--
-- 1) ROMPE EL PANEL DE ADMIN, HOY MISMO Y SIN ARREGLO POSIBLE.
--    lib/admin-auth.ts:30 hace .select("is_admin, email"). Si se revoca
--    'email', PostgREST devuelve permission denied, 'profile' queda null,
--    !profile?.is_admin da 403 y TODAS las rutas /api/admin/* dejan de
--    responder. El arreglo es de una línea (usar el user.email que
--    supabase.auth.getUser() ya devuelve dos líneas más arriba), pero
--    exige desplegar, y GitHub Actions está bloqueado.
--
-- 2) is_admin NO PUEDE SALIR DEL GRANT. Catorce tablas tienen policies con
--    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin
--    = true): seasons, episodes, episode_blocks, episode_comments, products,
--    product_modules, product_module_blocks, series_info, community_events,
--    transmissions, transmission_comments, user_product_access,
--    user_season_access y profiles. Las subconsultas de una policy se
--    evalúan con los privilegios del rol que lanza la consulta, así que
--    'authenticated' necesita SELECT sobre profiles.id y profiles.is_admin.
--    Sin eso caería incluso "tx read published", es decir el archivo de
--    transmisiones entero.
--
-- 3) NO ARREGLA DEL TODO LA FUGA. Los grants por columna recortan columnas,
--    no filas: con la policy en using (true), un miembro seguiría pudiendo
--    leer el is_admin y el manual_access de todos los demás.
--
-- Quedaría así, y no se recomienda:
--   revoke select on public.profiles from authenticated, anon;
--   grant select (id, is_admin, manual_access, access_role)
--     on public.profiles to authenticated;
--
-- Se puede aplicar MÁS ADELANTE, encima de la opción recomendada, como
-- segunda capa — pero solo después de desplegar el arreglo de admin-auth.ts.



-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  SOBRE USAR UNA VIEW public_profiles — POR QUÉ NO                    ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Preguntabas expresamente por el comportamiento de seguridad de las views.
-- Es un riesgo real y merece la advertencia:
--
-- · Una view NO tiene RLS propia. Por defecto se ejecuta con los privilegios
--   de SU PROPIETARIO, no de quien consulta. Como en Supabase las views se
--   crean casi siempre como 'postgres', una view sobre profiles IGNORARÍA
--   por completo la RLS de la tabla y volvería a exponerlo todo. Es el lint
--   'security_definer_view' del propio Advisor.
--
-- · A partir de PostgreSQL 15 se corrige declarando
--       create view ... with (security_invoker = true)
--   que hace que la view se ejecute con los permisos de quien consulta y por
--   tanto respete la RLS de profiles.
--
-- · Además, toda view en el schema public queda EXPUESTA automáticamente por
--   el Data API, igual que una tabla.
--
-- La auditoría confirmó que hoy NO existe ninguna view en public, así que no
-- hay ninguna fuga de este tipo abierta ahora mismo.
--
-- CONCLUSIÓN: aquí no hace falta ninguna view. Nadie lee full_name ni
-- avatar_url desde profiles (salen siempre de auth.users.user_metadata), así
-- que no hay ningún "perfil público" que exponer. Introducir una view sería
-- añadir superficie de ataque para resolver un problema que no existe.
--
-- Si en el futuro hiciera falta un directorio de miembros, la forma segura:
--   create view public.public_profiles with (security_invoker = true) as
--     select id, full_name, avatar_url from public.profiles;
--   revoke all on public.public_profiles from anon;
--   grant select on public.public_profiles to authenticated;
-- y aun así habría que darle a profiles una policy que permita ver las filas
-- ajenas SOLO a través de esas columnas.



-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  VERIFICACIÓN — solo lectura                                         ║
-- ╚══════════════════════════════════════════════════════════════════════╝

select
  'policies de profiles' as chequeo,
  policyname::text as detalle,
  cmd::text as operacion,
  coalesce(qual::text, '-') as using_expr
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
order by cmd, policyname;
-- Esperado: 3 filas. La de SELECT debe ser "profiles read own" con
-- using (id = auth.uid()). Las dos de UPDATE, sin cambios.



-- ============================================================================
-- PRUEBA — correr después, una sola vez. Va en begin/rollback: no deja rastro.
-- ============================================================================
-- Simula un miembro normal intentando leer el correo de OTRO miembro.
-- RESULTADO ESPERADO: 0 filas.  Si devuelve filas, la fuga sigue abierta.
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
--   -- correos ajenos visibles para este usuario: debe dar 0
--   select count(*) as correos_ajenos_visibles
--   from public.profiles
--   where id <> auth.uid();
--
--   -- y su propia fila SÍ debe verse: debe dar 1
--   select count(*) as fila_propia_visible
--   from public.profiles
--   where id = auth.uid();
-- rollback;
--
-- (El editor de Supabase muestra solo el último resultado, así que si quieres
--  ver los dos números, corre el bloque dos veces comentando una consulta.)
