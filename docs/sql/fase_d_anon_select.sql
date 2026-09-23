-- ============================================================================
-- FASE D — QUITARLE LA LECTURA AL ROL anon  [PENDIENTE DE EJECUTAR]
-- ============================================================================
--
-- QUÉ ES ESTO
--   La continuación de la FASE A. Aquella revocó insert, update y delete al
--   rol `anon` y dejó fuera el SELECT a propósito, porque quitar la lectura es
--   una decisión aparte: si alguna pantalla pública leyera de la base, se
--   quedaría en blanco. Esto cierra esa parte, ya con la comprobación hecha.
--
-- POR QUÉ IMPORTA
--   La clave `anon` es PÚBLICA: viaja en el paquete del navegador y está en
--   wrangler.jsonc. Cualquiera puede sacarla y hablar con la base con ella.
--   Hoy las 54 tablas tienen RLS, así que las policies frenan casi todo, pero
--   una policy escrita sin cláusula `to` se aplica al rol `public`, y `public`
--   incluye a `anon`. Basta con una de esas y un `using (true)` para que se
--   pueda leer esa tabla entera sin iniciar sesión. Quitar el SELECT cierra la
--   puerta por debajo, sin depender de que las 60 y pico policies estén todas
--   bien escritas.
--
-- ── LA COMPROBACIÓN, HECHA SOBRE EL CÓDIGO ACTUAL ─────────────────────────
--   1. Ningún componente de navegador consulta tablas. Los quince archivos que
--      usan getSupabaseBrowser solo llaman a `auth.*` y a `.channel()`
--      (Realtime, que va con la sesión del miembro, no con anon).
--   2. Ninguna ruta de app/api importa getSupabaseBrowser.
--   3. Los tres clientes anon del servidor tocan solo el schema `auth`:
--        · app/api/profile/change-password   → auth.signInWithPassword
--        · app/api/profile/recover-password  → auth.resetPasswordForEmail
--        · app/api/auth/recovery-verify      → auth.verifyOtp
--      Los permisos de `public` no afectan al schema `auth`.
--   4. Todas las rutas que leen tablas con el cliente de sesión exigen antes
--      un usuario: o `auth.getUser()`, o `requireAdmin()`, o `getMembership()`,
--      que devuelve `authenticated: false` y corta antes de consultar nada.
--   5. Las páginas públicas —portada, soporte, privacidad, términos,
--      activar-cuenta, recuperar-acceso— no consultan Supabase. La única que
--      lo menciona, activate-form.tsx, usa `auth.*`.
--   6. Los webhooks y el alta de cuentas usan service_role, que salta esto.
--
--   CONCLUSIÓN: nadie lee `public` sin haber iniciado sesión. Quitarle el
--   SELECT a `anon` no deja ninguna pantalla en blanco.
--
-- QUÉ NO HACE
--   No toca policies, ni tablas, ni datos, ni los permisos de `authenticated`.
--   Es idempotente y se deshace entero con fase_d_anon_select_rollback.sql.
--
-- CÓMO APLICARLO
--   Supabase → SQL Editor. Ejecuta el PASO 1, mira el resultado, y después el
--   PASO 2. El PASO 3 confirma cómo quedó.
-- ============================================================================


-- ── PASO 1 · Qué puede leer anon ahora mismo ────────────────────────────────
-- Antes de tocar nada, la foto del estado actual. Si esta consulta devuelve
-- muchas filas, es exactamente el problema que se está cerrando.
select
  t.tablename                                                    as tabla,
  has_table_privilege('anon', 'public.' || quote_ident(t.tablename), 'SELECT') as anon_puede_leer,
  c.relrowsecurity                                               as tiene_rls
from pg_tables t
join pg_class c on c.relname = t.tablename and c.relnamespace = 'public'::regnamespace
where t.schemaname = 'public'
order by anon_puede_leer desc, t.tablename;


-- ── PASO 2 · Revocar ────────────────────────────────────────────────────────
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke select on public.%I from anon', r.tablename);
  end loop;
end $$;

-- Y que las tablas NUEVAS nazcan igual. Sin esto, la próxima migración que
-- cree una tabla le volvería a dar lectura a anon sin que nadie se entere,
-- porque Supabase deja puestos esos privilegios por defecto.
--
-- Solo afecta a lo que cree el rol que ejecuta esta línea (postgres, que es
-- con el que trabaja el SQL Editor). Si algún día se crea una tabla desde
-- otro rol, habrá que repetir el PASO 2 para ella.
alter default privileges in schema public revoke select on tables from anon;

-- Las secuencias y las funciones no se tocan: revocar `usage` sobre las
-- secuencias rompería cualquier inserción futura de `authenticated` que use
-- un id autonumérico, y no aportan lectura de datos por sí solas.


-- ── PASO 3 · Cómo quedó ─────────────────────────────────────────────────────
-- `anon_puede_leer` debe salir `false` en TODAS las filas.
select
  t.tablename                                                    as tabla,
  has_table_privilege('anon', 'public.' || quote_ident(t.tablename), 'SELECT') as anon_puede_leer
from pg_tables t
where t.schemaname = 'public'
order by anon_puede_leer desc, t.tablename;


-- ── QUÉ PROBAR DESPUÉS ──────────────────────────────────────────────────────
-- Con sesión cerrada: que la portada, /soporte, /privacidad y /terminos
-- carguen, y que el login funcione. Con sesión abierta: entrar a Recursos, La
-- Red, Transmisiones y el panel de administración. Si algo se quedara vacío,
-- el rollback lo devuelve todo en una línea.
