-- ============================================================================
-- ROLLBACK · LA RED VERTICAL 2 — DIRECTORIO
-- ============================================================================
-- Deshace red_v2_directorio.sql. Cada bloque va suelto, no se corre entero.
--
-- Esta vuelta atrás es MUCHO menos grave que la de la Vertical 1: las columnas
-- que añade son una COPIA de datos que siguen viviendo en auth.users. Borrarlas
-- no pierde nada original — se pueden reconstruir volviendo a correr la
-- migración, que las rellena sola.
--
-- Lo que NO se puede perder es la ubicación en sí (country_code, city_id,
-- show_city), y ningún bloque de aquí la toca.
-- ============================================================================


-- ── 1 · Desactivar solo la sincronización automática ───────────────────────
-- Si el problema es el trigger sobre auth.users (por ejemplo, ralentiza el
-- guardado de perfil), empieza por aquí. El directorio deja de actualizarse
-- solo, pero todo lo demás sigue funcionando con los datos que ya tiene.
--
-- drop trigger if exists trg_sync_directory_from_auth on auth.users;
-- drop function if exists public.sync_directory_from_auth();


-- ── 2 · Quitar los índices del directorio ──────────────────────────────────
-- Las consultas seguirán respondiendo, pero con recorrido secuencial. Útil
-- solo si alguno diera problemas de escritura.
--
-- drop index if exists public.idx_ml_dir_city;
-- drop index if exists public.idx_ml_dir_country;
-- drop index if exists public.idx_ml_dir_name;
-- drop index if exists public.idx_ml_dir_recent;


-- ── 3 · Revertir la Vertical 2 completa ────────────────────────────────────
-- Devuelve member_location al estado que tenía tras la Vertical 1.
-- La ubicación de cada miembro se conserva intacta.
--
-- drop trigger  if exists trg_sync_directory_from_auth on auth.users;
-- drop function if exists public.sync_directory_from_auth();
-- drop trigger  if exists trg_member_location_sync on public.member_location;
-- drop function if exists public.member_location_sync();
--
-- drop index if exists public.idx_ml_dir_city;
-- drop index if exists public.idx_ml_dir_country;
-- drop index if exists public.idx_ml_dir_name;
-- drop index if exists public.idx_ml_dir_recent;
--
-- alter table public.member_location drop column if exists display_name;
-- alter table public.member_location drop column if exists display_name_norm;
-- alter table public.member_location drop column if exists avatar_url;
-- alter table public.member_location drop column if exists username;
-- alter table public.member_location drop column if exists member_since;
--
-- OJO: el trigger trg_member_location_sync también era el que ponía
-- updated_at. Si lo quitas, ese campo deja de refrescarse solo; la ruta
-- /api/red/ubicacion ya lo escribe explícitamente, así que no se rompe nada.


-- ── 4 · Comprobación tras revertir ─────────────────────────────────────────
-- La ubicación debe seguir ahí, que es lo único irreemplazable.
--
-- select count(*) as ubicaciones_intactas,
--        count(*) filter (where show_city) as visibles
-- from public.member_location;
