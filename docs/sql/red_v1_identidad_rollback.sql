-- ============================================================================
-- ROLLBACK · LA RED VERTICAL 1 — IDENTIDAD
-- ============================================================================
-- Deshace red_v1_identidad.sql. NO se ejecuta entero: cada bloque va suelto.
--
-- ⚠ BORRA DATOS. member_location y network_role_assignments contienen lo que
-- los miembros hayan guardado (su ciudad, sus roles concedidos). Si alguien ya
-- completó su ubicación, esto lo pierde.
--
-- Antes de borrar nada, el bloque 0 guarda una copia. Úsalo siempre.
-- Nada de esto toca tablas anteriores a la Vertical 1.
-- ============================================================================


-- ── 0 · COPIA DE SEGURIDAD (correr SIEMPRE primero) ────────────────────────
-- Deja dos tablas gemelas con los datos de los miembros. No estorban y
-- permiten restaurar si el rollback fue un error.

create table if not exists public.member_location_backup as
  select *, now() as backed_up_at from public.member_location;

create table if not exists public.network_role_assignments_backup as
  select *, now() as backed_up_at from public.network_role_assignments;

-- Comprobar que la copia tiene lo mismo que el original antes de seguir:
select
  (select count(*) from public.member_location)                    as ubicaciones,
  (select count(*) from public.member_location_backup)             as ubicaciones_copia,
  (select count(*) from public.network_role_assignments)           as roles,
  (select count(*) from public.network_role_assignments_backup)    as roles_copia;


-- ── 1 · Quitar solo las policies (deja los datos intactos) ─────────────────
-- Opción conservadora: si el problema es de permisos y no de datos, empieza
-- por aquí. Con RLS activa y sin policies, las tablas quedan en service_role.
--
-- drop policy if exists "cities read members"        on public.network_cities;
-- drop policy if exists "location read own or visible" on public.member_location;
-- drop policy if exists "location insert own"        on public.member_location;
-- drop policy if exists "location update own"        on public.member_location;
-- drop policy if exists "location delete own"        on public.member_location;
-- drop policy if exists "roles read members"         on public.network_roles;
-- drop policy if exists "assignments read active"    on public.network_role_assignments;


-- ── 2 · Eliminar la Vertical 1 completa ⚠ DESTRUCTIVO ──────────────────────
-- El orden respeta las claves foráneas. Descomentar solo con la copia hecha.
--
-- drop function if exists public.has_network_role(uuid, text);
-- drop table    if exists public.network_role_assignments;
-- drop table    if exists public.network_roles;
-- drop table    if exists public.member_location;
-- drop trigger  if exists trg_network_cities_norm on public.network_cities;
-- drop function if exists public.network_cities_norm();
-- drop table    if exists public.network_cities;


-- ── 3 · Restaurar desde la copia ───────────────────────────────────────────
-- Si volviste a crear las tablas con red_v1_identidad.sql y quieres recuperar
-- lo que los miembros habían guardado:
--
-- insert into public.member_location (user_id, country_code, city_id, show_city, created_at, updated_at)
--   select user_id, country_code, city_id, show_city, created_at, updated_at
--   from public.member_location_backup
-- on conflict (user_id) do nothing;
--
-- insert into public.network_role_assignments (user_id, role_code, granted_by, granted_at, revoked_at, note)
--   select user_id, role_code, granted_by, granted_at, revoked_at, note
--   from public.network_role_assignments_backup;
--
-- OJO: city_id apunta a network_cities. Si se recreó el catálogo, los ids
-- pueden haber cambiado. Restaurar primero las ciudades con el mismo seed.
