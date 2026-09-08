-- ============================================================================
-- ACCESO MANUAL / TESTERS — Los 144.000
-- ============================================================================
-- Permite que usuarios invitados por el admin entren a /miembros sin suscripción
-- pagada, marcándolos en profiles. El gate (auth-server.ts / membership.ts) da
-- acceso si: is_admin, manual_access = true, o access_role in (tester/reviewer/
-- admin). NO cambia nada para los usuarios pagos ni abre acceso público.
-- Ejecutar en Supabase → SQL Editor → Run. Idempotente.
-- ============================================================================

-- 1) Columnas nuevas en profiles (no rompen filas existentes).
alter table public.profiles add column if not exists manual_access boolean not null default false;
alter table public.profiles add column if not exists access_role text;   -- 'tester' | 'reviewer' | null

-- ============================================================================
-- 2) DAR ACCESO MANUAL A UNA USUARIA (por email)
--    Reemplaza el correo. Si actualiza 1 fila, listo.
-- ============================================================================
update public.profiles p
set manual_access = true, access_role = coalesce(access_role, 'tester')
from auth.users u
where u.id = p.id and lower(u.email) = lower('CORREO_DE_LA_USUARIA@ejemplo.com');

-- Si lo anterior actualizó 0 filas, es que aún no existe su perfil. Créalo y
-- vuelve a correr el UPDATE de arriba (id se vincula al auth.user):
-- insert into public.profiles (id)
-- select id from auth.users where lower(email) = lower('CORREO_DE_LA_USUARIA@ejemplo.com')
-- on conflict (id) do nothing;

-- ============================================================================
-- 3) QUITAR acceso manual a alguien (por email)
-- ============================================================================
-- update public.profiles p set manual_access = false, access_role = null
-- from auth.users u
-- where u.id = p.id and lower(u.email) = lower('CORREO@ejemplo.com');

-- 4) Verificar quién tiene acceso manual.
select u.email, p.is_admin, p.manual_access, p.access_role
from public.profiles p join auth.users u on u.id = p.id
where p.manual_access = true or p.access_role is not null or p.is_admin = true
order by u.email;
