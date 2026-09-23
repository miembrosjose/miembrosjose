-- ============================================================================
-- QUITAR LA «BIENVENIDA» DE ENCIMA  [EJECUTAR UNA VEZ]
-- ============================================================================
--
-- QUÉ PASA
--   `welcome` —la insignia «Bienvenida»— está RETIRADA del catálogo desde hace
--   tiempo, pero seguía siendo el valor por defecto en media plataforma: quien
--   no había elegido ninguna aparecía con ella. Por eso las cuentas nuevas
--   entraban luciendo una insignia vieja que nadie les había dado.
--
--   El código ya no la pone: sin insignia elegida no se enseña ninguna. Falta
--   quitarla de donde quedó escrita.
--
-- DE PASO, UNA CORRECCIÓN MÍA
--   La limpieza anterior (insignias_limpiar_regaladas.sql, PASO 4) puso
--   'welcome' en los mensajes ya publicados, dando por hecho que era "la que
--   tiene todo el mundo". Era justo lo contrario: es una retirada que nadie
--   debería llevar. Esto lo deja en nulo, que es lo que significa "sin
--   insignia".
--
-- QUÉ NO TOCA
--   Las cuentas de administración: su Sello va con el cargo.
--   Las insignias de verdad: solo se quita 'welcome'.
--
-- CÓMO APLICARLO
--   Supabase → SQL Editor → pega todo → Run. Idempotente.
-- ============================================================================


-- ── PASO 1 · Cuánta hay ─────────────────────────────────────────────────────
select 'perfiles con welcome destacada' as donde, count(*) as cuantos
from auth.users
where raw_user_meta_data->>'featured_badge_id' = 'welcome'
union all
select 'mensajes del foro', count(*) from public.forum_posts where author_badge_id = 'welcome'
union all
select 'respuestas del foro', count(*) from public.forum_replies where author_badge_id = 'welcome'
union all
select 'comentarios de capitulo', count(*) from public.episode_comments where author_badge_id = 'welcome';


-- ── PASO 2 · Quitarla ───────────────────────────────────────────────────────
-- De los perfiles: se borra la clave entera, que es lo que significa "no he
-- elegido ninguna".
update auth.users
   set raw_user_meta_data = raw_user_meta_data - 'featured_badge_id'
 where raw_user_meta_data->>'featured_badge_id' = 'welcome';

-- De lo ya publicado.
update public.forum_posts      set author_badge_id = null where author_badge_id = 'welcome';
update public.forum_replies    set author_badge_id = null where author_badge_id = 'welcome';
update public.episode_comments set author_badge_id = null where author_badge_id = 'welcome';

-- Estas dos pueden no existir en este proyecto; si dan error, se saltan.
update public.funnel_feedbacks set author_badge_id = null where author_badge_id = 'welcome';
update public.user_funnels     set author_badge_id = null where author_badge_id = 'welcome';


-- ── PASO 3 · Cómo quedó ─────────────────────────────────────────────────────
-- Las cuatro filas deben decir 0.
select 'perfiles con welcome destacada' as donde, count(*) as cuantos
from auth.users
where raw_user_meta_data->>'featured_badge_id' = 'welcome'
union all
select 'mensajes del foro', count(*) from public.forum_posts where author_badge_id = 'welcome'
union all
select 'respuestas del foro', count(*) from public.forum_replies where author_badge_id = 'welcome'
union all
select 'comentarios de capitulo', count(*) from public.episode_comments where author_badge_id = 'welcome';
