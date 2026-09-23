-- ============================================================================
-- LOS AVISOS DE INSIGNIAS VIEJAS  [EJECUTAR UNA VEZ]
-- ============================================================================
--
-- QUÉ PASÓ
--   Una insignia `retirada` está fuera del catálogo: quien la tenga se la
--   queda, pero no se concede a nadie más. El servidor no lo sabía: cada vez
--   que alguien marcaba un capítulo, deducía también las retiradas —la
--   «Bienvenida», la «Primera Clase», «Semilla Estelar», las de producto—,
--   las concedía otra vez y mandaba un aviso por cada una.
--
--   Justo después de limpiar la tabla, la primera clase vista devolvía media
--   docena de avisos de insignias que se acababan de borrar. Eso es lo que
--   estabas viendo.
--
--   El código ya no las deduce. Falta quitar lo que dejó escrito.
--
-- QUÉ HACE
--   1. Borra de `user_unlocked_achievements` las retiradas que se concedieron
--      SOLAS en este arreglo (de hoy en adelante). Las de antes no se tocan:
--      quien se las ganó de verdad se las queda.
--   2. Borra los avisos de esas mismas insignias.
--
-- QUÉ NO TOCA
--   Ninguna insignia vigente, ningún avance, ningún XP, ningún aviso que no
--   sea de insignia.
--
-- CÓMO APLICARLO
--   Supabase → SQL Editor → pega todo → Run. Idempotente.
-- ============================================================================


-- ── PASO 1 · Qué hay ────────────────────────────────────────────────────────
select
  'insignias retiradas concedidas hoy' as que,
  count(*) as cuantas
from public.user_unlocked_achievements
where achievement_id in (
  'el_estudio', 'el_topo', 'welcome', 'first_lesson',
  'agent_minivsl', 'agent_copywriter', 'agent_constructor',
  'semilla_estelar', 'vip_community', 'training_complete',
  'product_bonus_ganchos', 'product_creativos', 'product_andromeda',
  'product_analytics', 'product_minivsl', 'product_revisao'
)
  and unlocked_at >= current_date
union all
select
  'avisos de insignia de hoy',
  count(*)
from public.notifications
where type in ('public_insignia_self', 'public_insignia')
  and created_at >= current_date;


-- ── PASO 2 · Quitar las que se concedieron solas hoy ────────────────────────
-- El corte por fecha es lo que separa "se lo ganó hace meses" de "se lo acaba
-- de dar el fallo". Sin él, esto le quitaría a alguien una insignia legítima.
delete from public.user_unlocked_achievements
where achievement_id in (
  'el_estudio', 'el_topo', 'welcome', 'first_lesson',
  'agent_minivsl', 'agent_copywriter', 'agent_constructor',
  'semilla_estelar', 'vip_community', 'training_complete',
  'product_bonus_ganchos', 'product_creativos', 'product_andromeda',
  'product_analytics', 'product_minivsl', 'product_revisao'
)
  and unlocked_at >= current_date;


-- ── PASO 3 · Y sus avisos ───────────────────────────────────────────────────
-- Los avisos guardan el NOMBRE de la insignia dentro del título
-- («Desbloqueaste "Bienvenida" 🥈»), no su identificador. Por eso se buscan
-- por nombre, uno a uno, y solo entre los de hoy.
delete from public.notifications
where type in ('public_insignia_self', 'public_insignia')
  and created_at >= current_date
  and (
       title like '%"Bienvenida"%'
    or title like '%"Primera Clase"%'
    or title like '%"Semilla Estelar"%'
    or title like '%"Círculo VIP"%'
    or title like '%"Entrenamiento Completo"%'
    or title like '%"Agente 2"%'
    or title like '%"Agente 3"%'
    or title like '%"Agente 4"%'
    or title like '%"Producto 1"%'
    or title like '%"Producto 2"%'
    or title like '%"Producto 3"%'
    or title like '%"Upsell 1"%'
    or title like '%"Bonus 1"%'
    or title like '%"Servicio Premium"%'
    or title like '%"Servicio Premium A"%'
    or title like '%"Servicio Premium B"%'
  );


-- ── PASO 4 · Cómo quedó ─────────────────────────────────────────────────────
-- Las dos filas deben decir 0.
select
  'insignias retiradas concedidas hoy' as que,
  count(*) as cuantas
from public.user_unlocked_achievements
where achievement_id in (
  'el_estudio', 'el_topo', 'welcome', 'first_lesson',
  'agent_minivsl', 'agent_copywriter', 'agent_constructor',
  'semilla_estelar', 'vip_community', 'training_complete',
  'product_bonus_ganchos', 'product_creativos', 'product_andromeda',
  'product_analytics', 'product_minivsl', 'product_revisao'
)
  and unlocked_at >= current_date
union all
select
  'avisos de insignias retiradas de hoy',
  count(*)
from public.notifications
where type in ('public_insignia_self', 'public_insignia')
  and created_at >= current_date
  and (
       title like '%"Bienvenida"%'
    or title like '%"Primera Clase"%'
    or title like '%"Semilla Estelar"%'
    or title like '%"Círculo VIP"%'
    or title like '%"Entrenamiento Completo"%'
  );
