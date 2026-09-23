-- ============================================================================
-- INSIGNIAS REGALADAS POR EL AGUJERO ANTIGUO  [EJECUTAR UNA VEZ]
-- ============================================================================
--
-- QUÉ PASÓ
--   /api/profile/insignia-unlocked concedía CUALQUIER insignia del catálogo a
--   quien la pidiera, sin comprobar nada. Y el navegador la pedía solo: en
--   cada arranque subía al servidor toda su copia en localStorage. Por eso
--   había cuentas luciendo temporadas sin completar y roles de la Red, y por
--   eso reiniciar el avance de alguien no servía de nada.
--
--   El código ya está arreglado: el servidor deduce esas insignias de los
--   hechos que guarda él mismo (capítulos vistos, días de acceso,
--   aportaciones al foro, compras). Falta limpiar lo que quedó escrito.
--
-- QUÉ HACE ESTE ARCHIVO
--   Borra de `user_unlocked_achievements` SOLO las insignias que el servidor
--   vuelve a calcular por su cuenta. Quien se las haya ganado de verdad las
--   seguirá viendo: se recalculan al entrar. Quien no, deja de verlas.
--
-- QUÉ NO TOCA
--   · Las que concede la administración a mano: Embajador Galáctico, Faro del
--     Territorio, los cuatro roles de la Red, el Sello del Admin, El Topo y
--     El Estudio. Esas las diste tú y no hay forma de deducirlas.
--   · Bibliotecario Cósmico y Práctica Profunda: vienen de compras que no
--     están en `stripe_sales.items`, así que borrarlas las perdería.
--   · Las retiradas del catálogo (los agentes 2, 3 y 4): ya no se conceden,
--     pero quien las tenga se las queda.
--   · El avance, el XP y los niveles. Aquí solo se tocan insignias.
--
-- CÓMO APLICARLO
--   Supabase → SQL Editor → pega todo → Run. Mira el PASO 1 antes del 2.
-- ============================================================================


-- ── PASO 1 · Qué hay ahora, y a quién ───────────────────────────────────────
-- Ejecuta este bloque solo, mira el resultado, y después el PASO 2.
select
  u.email,
  a.achievement_id,
  a.unlocked_at
from public.user_unlocked_achievements a
join auth.users u on u.id = a.user_id
order by u.email, a.achievement_id;


-- ── PASO 2 · Borrar lo que el servidor recalcula ────────────────────────────
delete from public.user_unlocked_achievements
where achievement_id in (
  -- Progreso por capítulos vistos
  'welcome',
  'first_lesson',
  'agent_estratega',
  'semilla_estelar',
  'season_1_complete',
  'season_2_complete',
  'season_3_complete',
  'season_4_complete',
  'training_complete',
  -- Patentes de comunidad (salen de forum_posts + forum_replies)
  'rank_recluta',
  'rank_agente',
  'rank_operador',
  'rank_estratega',
  'rank_capo',
  'rank_padrino',
  'rank_leyenda',
  -- Llamas de tiempo (salen de unique_login_days)
  'time_devoto',
  'time_habitue',
  'time_veterano',
  'time_eterno',
  -- Compras que sí están en stripe_sales.items
  'product_creativos',
  'product_andromeda',
  'product_analytics',
  'product_revisao',
  'product_minivsl',
  'product_bonus_ganchos'
);


-- ── PASO 3 · Lo que queda, para revisarlo a mano ────────────────────────────
-- Son las que concede la administración. Si aquí aparece alguien con un rol
-- que tú no le diste, se lo quitas desde el panel o con un delete puntual:
--
--   delete from public.user_unlocked_achievements
--    where user_id = (select id from auth.users where email = 'quien@correo.com')
--      and achievement_id = 'rol_instructor';
select
  u.email,
  a.achievement_id,
  a.unlocked_at
from public.user_unlocked_achievements a
join auth.users u on u.id = a.user_id
order by u.email, a.achievement_id;
