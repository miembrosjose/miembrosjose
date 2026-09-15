-- ============================================================================
-- ROLLBACK DE rls_hardening.sql
-- ============================================================================
-- Devuelve la base al estado previo a la migración, fase por fase.
--
-- NO SE EJECUTA ENTERO. Cada sección es independiente y se copia sola.
-- Revertir de más reabre agujeros de seguridad que la migración cerró.
--
-- GARANTÍAS, las mismas que la migración:
--   · No hace insert, update, delete ni truncate sobre datos de negocio.
--   · No borra tablas, columnas ni índices.
--   · Solo elimina las policies que creó la migración (las tres que llevan
--     nombre propio). Ninguna policy preexistente se toca.
--
-- ORDEN DE USO
--   1. Correr el DIAGNÓSTICO de abajo.
--   2. Revertir SOLO la fase implicada, empezando por la más reciente
--      (C → B → A). Casi siempre basta con un bloque pequeño.
--   3. Volver a probar. Si se arregla, parar ahí.
-- ============================================================================



-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  PASO 0 — DIAGNÓSTICO: ¿qué fase causó el problema?                  ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Solo lectura. Correr esto ANTES de revertir nada.
--
-- Guía rápida según el síntoma:
--   · El panel de admin no guarda        → mirar fila '5 · admin' del
--                                          verificador de la migración. Raro:
--                                          la FASE A no toca authenticated.
--   · La búsqueda no encuentra embudos   → FASE B, sección R-B3.
--   · Un módulo devuelve listas vacías   → FASE B, sección R-B2 o R-B1.
--   · Editar el perfil falla             → FASE C, sección R-C.
--   · Algo público dejó de escribir      → FASE A, sección R-A.

select
  'FASE A' as fase,
  'tablas donde anon aun puede escribir' as detalle,
  count(*)::text as valor
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
  and (has_table_privilege('anon', c.oid, 'INSERT')
    or has_table_privilege('anon', c.oid, 'UPDATE')
    or has_table_privilege('anon', c.oid, 'DELETE'))
union all
select 'FASE B', 'de las 8, cuantas tienen RLS activa',
       count(*)::text
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relrowsecurity
  and c.relname in ('dashboard_rate_limit','funnel_events','funnel_feedbacks',
                    'funnel_likes','funnel_reactions','user_funnels',
                    'leaderboard_top3_snapshot','leaderboard_top3_broadcasts')
union all
select 'FASE B', 'policies creadas por la migracion que siguen vivas',
       count(*)::text
from pg_policies
where schemaname = 'public'
  and policyname in ('user_funnels read members','leaderboard read members')
union all
select 'FASE C', 'authenticated puede hacer UPDATE en profiles',
       case when has_table_privilege('authenticated','public.profiles','UPDATE')
            then 'si (rollback ya aplicado o fase no ejecutada)'
            else 'no (fase C activa)' end;



-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  R-C — REVERTIR LA FASE C  (profiles)                                ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Síntoma que lo justifica: al editar el perfil, la app devuelve
-- "permission denied for table profiles".
--
-- OJO: eso sería muy raro. La edición de perfil va por auth.updateUser
-- (schema auth), no por public.profiles. Si aparece ese error, es que existe
-- una ruta de escritura que la auditoría no encontró: MERECE LA PENA
-- localizarla antes de revertir, porque revertir reabre la autoescalación
-- de is_admin.
--
-- ALTERNATIVA PREFERIBLE a revertir del todo: conceder solo la columna que
-- de verdad haga falta, por ejemplo
--     grant update (bio) on public.profiles to authenticated;
-- Eso arregla el caso concreto y mantiene is_admin protegida.

grant update on public.profiles to authenticated;

-- Deliberadamente NO se devuelve UPDATE a anon. Lo quitó la FASE A y ningún
-- flujo público escribe en profiles. Si hiciera falta, está en R-A.



-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  R-B3 — REVERTIR LAS POLICIES CREADAS EN LA FASE B                   ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Quita solo las tres policies que creó la migración. Son las únicas con
-- estos nombres; ninguna policy preexistente se ve afectada.
--
-- CUIDADO: borrarlas NO "abre" esas tablas. Con RLS activa y sin policies,
-- las tablas quedan en "solo service_role", o sea MÁS cerradas. Si el
-- síntoma es "la búsqueda no encuentra embudos" o "el ranking sale vacío",
-- el problema NO se arregla borrando la policy: hay que revisar su
-- condición, o pasar a R-B1.

drop policy if exists "user_funnels read members"  on public.user_funnels;
drop policy if exists "leaderboard read members"   on public.leaderboard_top3_snapshot;
drop policy if exists "leaderboard read members"   on public.leaderboard_top3_broadcasts;



-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  R-B2 — DEVOLVER LOS GRANTS DE LAS CUATRO TABLAS DE BACKEND          ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Síntoma: algo devuelve 401 / "permission denied" al tocar una de estas
-- cuatro. Según la auditoría, ninguna aparece en el código, así que esto
-- solo debería hacer falta si existe una función que no vive en el repo
-- (un Edge Function, un cron, una integración externa).
--
-- Restaura el estado exacto que tenían antes: 'SIUD' para anon y para
-- authenticated. TRUNCATE no se devuelve a propósito: la auditoría no midió
-- ese privilegio y ningún flujo lo necesita.

grant select, insert, update, delete on public.dashboard_rate_limit to anon, authenticated;
grant select, insert, update, delete on public.funnel_events        to anon, authenticated;
grant select, insert, update, delete on public.funnel_likes         to anon, authenticated;
grant select, insert, update, delete on public.funnel_reactions     to anon, authenticated;



-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  R-B1 — APAGAR RLS EN LAS 8 TABLAS   ⚠ ÚLTIMO RECURSO ⚠              ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- ESTO REABRE EXACTAMENTE EL AGUJERO DEL SECURITY ADVISOR. Vuelve a dejar
-- esas ocho tablas legibles y escribibles con la clave anon, que es pública.
--
-- Antes de llegar aquí, probar SIEMPRE lo otro: añadir la policy que falte
-- es casi siempre la solución correcta, y no desprotege nada.
--
-- Si aun así hay que hacerlo, apagar SOLO la tabla implicada, no las ocho.
-- Por eso van comentadas una a una: descomentar la que toque.
--
-- alter table public.dashboard_rate_limit        disable row level security;
-- alter table public.funnel_events               disable row level security;
-- alter table public.funnel_feedbacks            disable row level security;
-- alter table public.funnel_likes                disable row level security;
-- alter table public.funnel_reactions            disable row level security;
-- alter table public.leaderboard_top3_broadcasts disable row level security;
-- alter table public.leaderboard_top3_snapshot   disable row level security;
-- alter table public.user_funnels                disable row level security;
--
-- NOTA sobre funnel_feedbacks: apagarle la RLS también vuelve a dormir su
-- policy "users update own funnel feedback", que ya existía antes de la
-- migración. Vuelve al estado original, pero desprotegida.



-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  R-A — DEVOLVER LA ESCRITURA A anon   ⚠ ÚLTIMO RECURSO ⚠             ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- ESTO DEVUELVE A LA CLAVE PÚBLICA LA CAPACIDAD DE INSERTAR, MODIFICAR Y
-- BORRAR en casi todas las tablas. Es el cambio más peligroso de revertir.
--
-- La auditoría del código concluyó que no existe ninguna escritura pública
-- no autenticada. Si aparece una, lo correcto es devolver el permiso SOLO a
-- esa tabla:
--     grant insert on public.<tabla> to anon;
-- y no correr el bloque entero.
--
-- DOS EXCLUSIONES IMPORTANTES: member_subscriptions y member_sync_events
-- nunca tuvieron estos permisos ('----' en la auditoría). Devolvérselos
-- dejaría la base MENOS segura que antes de la migración, así que quedan
-- fuera del bucle.
--
-- TRUNCATE tampoco se devuelve: no se midió en la auditoría y nada lo usa.
--
-- do $$
-- declare r record;
-- begin
--   for r in
--     select tablename from pg_tables
--     where schemaname = 'public'
--       and tablename not in ('member_subscriptions','member_sync_events')
--   loop
--     execute format('grant insert, update, delete on public.%I to anon', r.tablename);
--   end loop;
-- end $$;
--
-- alter default privileges in schema public grant insert, update, delete on tables to anon;



-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  VERIFICACIÓN DEL ROLLBACK — solo lectura                            ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Correr después de revertir, para confirmar en qué estado quedó la base.
-- Aquí no hay 'ok' ni 'FALLO': describe la situación, porque el estado
-- correcto depende de cuánto se haya revertido a propósito.

select
  c.relname::text as tabla,
  case when c.relrowsecurity then 'RLS si' else 'RLS NO' end as rls,
  (select count(*) from pg_policies p
     where p.schemaname = 'public' and p.tablename = c.relname) as policies,
  concat(
    case when has_table_privilege('anon', c.oid, 'SELECT') then 'S' else '-' end,
    case when has_table_privilege('anon', c.oid, 'INSERT') then 'I' else '-' end,
    case when has_table_privilege('anon', c.oid, 'UPDATE') then 'U' else '-' end,
    case when has_table_privilege('anon', c.oid, 'DELETE') then 'D' else '-' end
  ) as anon,
  concat(
    case when has_table_privilege('authenticated', c.oid, 'SELECT') then 'S' else '-' end,
    case when has_table_privilege('authenticated', c.oid, 'INSERT') then 'I' else '-' end,
    case when has_table_privilege('authenticated', c.oid, 'UPDATE') then 'U' else '-' end,
    case when has_table_privilege('authenticated', c.oid, 'DELETE') then 'D' else '-' end
  ) as auth
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by (case when c.relrowsecurity then 1 else 0 end), c.relname;
