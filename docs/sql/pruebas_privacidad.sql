-- ============================================================================
-- PRUEBAS DE PRIVACIDAD de la policy "profiles read own"
-- ============================================================================
-- SOLO LECTURA. Cada bloque va en begin/rollback y no deja ningun rastro.
--
-- CORRER DE UNA EN UNA: el SQL Editor solo muestra el resultado de la ultima
-- consulta, asi que si pegas las tres juntas solo veras la tercera.
-- Copiar el bloque completo, desde su 'begin;' hasta su 'rollback;'.
-- ============================================================================


-- ── PRUEBA 1 · Un usuario normal SI ve su propia fila ──────────────────
-- Esperado: filas_propias = 1
begin;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub',  (select id from public.profiles where coalesce(is_admin,false) = false limit 1),
      'role', 'authenticated'
    )::text, true);
  set local role authenticated;

  select count(*) as filas_propias,
         case when count(*) = 1 then 'ok' else 'FALLO: no ve su perfil' end as veredicto
  from public.profiles
  where id = auth.uid();
rollback;


-- ── PRUEBA 2 · Ese usuario NO ve el perfil ni el email de nadie mas ────
-- Esperado: perfiles_ajenos = 0  y  emails_ajenos = 0
begin;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub',  (select id from public.profiles where coalesce(is_admin,false) = false limit 1),
      'role', 'authenticated'
    )::text, true);
  set local role authenticated;

  select count(*)                          as perfiles_ajenos,
         count(*) filter (where email is not null) as emails_ajenos,
         case when count(*) = 0 then 'ok' else 'FALLO: la fuga sigue abierta' end as veredicto
  from public.profiles
  where id <> auth.uid();
rollback;


-- ── PRUEBA 3 · Un administrador sigue siendo reconocido como admin ─────
-- Evalua EXACTAMENTE la expresion que usan las 14 policies de admin
-- (seasons, episodes, products, transmissions, etc.). Si sale true,
-- todas ellas siguen funcionando.
-- Esperado: reconocido_como_admin = true
begin;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub',  (select id from public.profiles where is_admin = true limit 1),
      'role', 'authenticated'
    )::text, true);
  set local role authenticated;

  select exists (
           select 1 from public.profiles p
           where p.id = auth.uid() and p.is_admin = true
         ) as reconocido_como_admin,
         case when exists (
           select 1 from public.profiles p
           where p.id = auth.uid() and p.is_admin = true
         ) then 'ok' else 'FALLO: el panel perderia permisos' end as veredicto;
rollback;
