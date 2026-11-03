-- ════════════════════════════════════════════════════════════════════════════
--  «TU MEMBRESÍA NO ESTÁ ACTIVA» CON LOS PAGOS AL DÍA · por qué
-- ════════════════════════════════════════════════════════════════════════════
--
-- No cambia nada. Solo mira.
--
-- ── DE DÓNDE SALE ESE MENSAJE ──────────────────────────────────────────────
-- NO lo dice la plataforma: lo dice el botón de Telegram. Es el error que
-- devuelve la Edge Function `telegram-link-start` cuando no encuentra una
-- suscripción, y el botón lo enseña tal cual —a propósito, para no decir «algo
-- falló» cuando el motivo se sabe.
--
-- Por eso esa persona SÍ entra a la plataforma y SÍ ve su perfil: la puerta de
-- la web y la de Telegram no preguntan lo mismo.
--
-- ── CÓMO DECIDE TELEGRAM ───────────────────────────────────────────────────
-- En supabase/functions/_shared/acceso.ts, `tieneAccesoGeneral()`:
--
--   1. Si es administrador, pasa.
--   2. Si no, busca en `embudo_registros` POR CORREO.
--   3. Exige `current_period_end` en el futuro.
--   4. Exige estado 'active', 'trialing' o 'canceled'.
--
-- ── LAS CUATRO FORMAS DE QUE FALLE CON LOS PAGOS AL DÍA ───────────────────
--
--   A. EL CORREO NO COINCIDE. La suscripción vive en OTRA base —la del
--      embudo— y lo único que une las dos es el correo. Si compró con uno y
--      entra con otro, no se encuentran. Es lo más probable.
--
--   B. `current_period_end` vacío o pasado. El estado puede decir 'active' y
--      la fecha no haberse actualizado: manda la FECHA, no el estado.
--
--   C. Un estado fuera de la lista: 'past_due', 'unpaid', 'incomplete'. Un
--      cobro reintentándose deja 'past_due' aunque el dinero acabe entrando.
--
--   D. El embudo no respondió. Eso da otro mensaje, no este.

-- ════════════════════════════════════════════════════════════════════════════
--  PASO 1 · EN LA BASE DE LA PLATAFORMA (esta)
-- ════════════════════════════════════════════════════════════════════════════
--
-- Con qué correo entra exactamente. Cámbialo por el de la persona.

select
  u.id                                              as user_id,
  u.email                                           as correo_plataforma,
  length(u.email)                                   as largo,
  -- Un espacio al principio o al final no se ve y rompe la búsqueda.
  (u.email <> btrim(u.email))                       as tiene_espacios,
  coalesce(p.full_name, '—')                        as nombre,
  coalesce((u.raw_app_meta_data ->> 'is_admin')::boolean, false) as es_admin,
  to_char(u.created_at, 'DD/MM/YYYY')               as creada
from auth.users u
left join public.profiles p on p.id = u.id
where u.email ilike '%academiated%'      -- ← CAMBIA ESTO
   or p.full_name ilike '%daniela%';     -- ← o busca por nombre

-- Copia el `correo_plataforma` que salga. Hace falta para el paso 2.


-- ════════════════════════════════════════════════════════════════════════════
--  PASO 2 · EN LA BASE DEL EMBUDO (la OTRA, no esta)
-- ════════════════════════════════════════════════════════════════════════════
--
-- ⚠ Esto NO se corre aquí. `embudo_registros` está en el otro proyecto de
--   Supabase, el del embudo. Ábrelo y pega esto allí.

-- select
--   email,
--   subscription_status,
--   current_period_end,
--   (current_period_end > now())                    as periodo_vigente,
--   (subscription_status in ('active','trialing','canceled')) as estado_aceptado,
--   updated_at
-- from embudo_registros
-- where email ilike 'PEGA-AQUI-EL-CORREO'
-- order by updated_at desc;

-- ── CÓMO SE LEE ────────────────────────────────────────────────────────────
--
--   Sin filas              → es el caso A: el correo no coincide. Busca por
--                            nombre o por los últimos dígitos de la tarjeta
--                            en Stripe y mira con qué correo compró.
--
--   periodo_vigente false  → caso B: la fecha venció o no se actualizó.
--
--   estado_aceptado false  → caso C: mira qué pone `subscription_status`.
--                            'past_due' con el cobro ya entrado es un desajuste
--                            entre Stripe y el embudo.
--
--   Las dos true           → entonces el problema NO es la membresía, y hay
--                            que mirar los registros de la Edge Function.


-- ════════════════════════════════════════════════════════════════════════════
--  SI ES EL CASO A · qué hacer
-- ════════════════════════════════════════════════════════════════════════════
--
-- Dos caminos, y el bueno depende de cuál sea el correo «de verdad»:
--
--   · Si el bueno es el de la suscripción → que ella cambie el correo de su
--     cuenta en la plataforma, o cámbialo tú desde Supabase → Authentication.
--
--   · Si el bueno es el de la plataforma → cambia el correo en el embudo, que
--     es donde está la fila de la suscripción.
--
-- ⚠ NO hay que hacerla administradora para que entre. Esa salida existe para
--   que el dueño pruebe la integración sin contratarse una suscripción, y usarla
--   como parche le daría además acceso al panel entero.
--
-- ── LA DEUDA DE FONDO ──────────────────────────────────────────────────────
-- Mientras lo único que una las dos bases sea el correo, esto volverá a pasar
-- cada vez que alguien compre con uno y entre con otro. Se arregla el día que
-- el embudo guarde el `user_id` además del correo.
