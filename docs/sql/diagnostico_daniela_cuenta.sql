-- ════════════════════════════════════════════════════════════════════════════
--  ¿CON QUÉ CORREO ENTRA ELLA A LA PLATAFORMA? · solo lectura
-- ════════════════════════════════════════════════════════════════════════════
--
-- Córrelo en el SQL Editor del proyecto de la PLATAFORMA (no el del embudo).
-- No cambia nada: solo `select`.
--
-- ── POR QUÉ IMPORTA ESTO Y NO OTRA COSA ───────────────────────────────────
-- El embudo ya corrigió la fila: estado 'active' y periodo hasta el 24 de
-- noviembre. Pero quien le pregunta al embudo no usa el correo que escribimos
-- nosotros: usa el de `auth.users`, pasado a minúsculas. Si esa cuenta tiene
-- otro correo, la fila arreglada no es la suya y el botón seguirá diciendo lo
-- mismo.
--
-- Esto es, literalmente, lo único que queda por saber de este lado.

select
  u.id                                                as user_id,
  u.email                                             as correo_de_la_cuenta,
  (lower(u.email) = 'damkaragori1@gmail.com')         as coincide,
  (u.email <> btrim(u.email))                         as tiene_espacios,
  coalesce(p.full_name, '—')                          as nombre,
  coalesce((u.raw_app_meta_data ->> 'is_admin')::boolean, false) as es_admin,
  u.email_confirmed_at is not null                    as correo_confirmado,
  to_char(u.created_at,     'DD/MM/YYYY')             as cuenta_creada,
  to_char(u.last_sign_in_at,'DD/MM/YYYY HH24:MI')     as ultima_entrada
from auth.users u
left join public.profiles p on p.id = u.id
where lower(u.email) = 'damkaragori1@gmail.com'
   or lower(u.email) like '%damkaragori%'
   or lower(u.email) like '%karagori%'
   or p.full_name ilike '%daniela%gori%'
   or p.full_name ilike '%gori%'
order by u.last_sign_in_at desc nulls last;

-- ── CÓMO SE LEE ───────────────────────────────────────────────────────────
--
--   Una fila con `coincide` = true
--       → el correo es el bueno. La regla, con lo que ya arregló el embudo,
--         devuelve PASA. No hay nada más que hacer de este lado.
--
--   Una fila con `coincide` = false
--       → ella entra con OTRO correo. Ese es el que hay que mirar en el
--         embudo. Dime cuál y sigo.
--
--   `tiene_espacios` = true
--       → hay un espacio invisible pegado al correo. No se ve en pantalla y
--         rompe la búsqueda. Se limpia desde Authentication, no desde SQL.
--
--   `es_admin` = true
--       → entonces pasa por la salida de administración, sin mirar la
--         suscripción, y esta prueba no demuestra nada sobre la regla.
--
--   Ninguna fila
--       → no tiene cuenta en la plataforma con ningún correo parecido. Mira
--         con qué correo entra de verdad (Authentication → Users, buscando
--         por nombre).
--
--
-- ── SI QUIERES VER CUÁNTAS CUENTAS COMPARTEN LA MISMA PERSONA ─────────────
-- Dos cuentas con dos correos distintos explican este fallo entero: compró
-- con una y entra con la otra.
--
-- select lower(split_part(email, '@', 1)) as antes_de_la_arroba,
--        count(*), array_agg(email)
-- from auth.users
-- group by 1
-- having count(*) > 1
-- order by 2 desc
-- limit 20;
