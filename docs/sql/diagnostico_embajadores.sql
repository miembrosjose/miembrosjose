-- ============================================================================
-- DIAGNÓSTICO — ¿por qué el mapa no muestra a todos los Embajadores?
-- ============================================================================
-- Solo LEE. No modifica nada.
--
-- Conceder la insignia toca TRES sitios, y el mapa depende del último:
--
--   1. user_unlocked_achievements   → la tiene desbloqueada
--   2. auth.users.raw_user_meta_data → la lleva DESTACADA
--   3. member_location.featured_badge_id → copia denormalizada que lee el mapa
--
-- El paso 2→3 lo hace un trigger sobre auth.users. Si ese trigger no corrió
-- —porque la fila del directorio se creó después, o porque la concesión fue
-- anterior a que existiera la columna—, el miembro tiene la insignia pero el
-- mapa no se entera.
-- ============================================================================

select
  coalesce(ml.display_name, u.email)                          as miembro,

  -- 1 · ¿La tiene concedida?
  exists (
    select 1 from public.user_unlocked_achievements a
    where a.user_id = u.id and a.achievement_id = 'embajador_galactico'
  )                                                            as concedida,

  -- 2 · ¿La lleva destacada en su perfil?
  nullif(u.raw_user_meta_data->>'featured_badge_id', '')       as destacada_en_perfil,

  -- 3 · ¿Lo sabe el directorio, que es de donde bebe el mapa?
  ml.featured_badge_id                                         as la_ve_el_mapa,

  -- ¿Sale en el mapa siquiera?
  ml.show_city                                                 as visible,

  case
    when ml.user_id is null then 'Sin ficha en el directorio'
    when not ml.show_city then 'Tiene la ciudad oculta'
    when nullif(u.raw_user_meta_data->>'featured_badge_id','') is distinct from ml.featured_badge_id
      then 'DESINCRONIZADO — el trigger no propagó'
    when ml.featured_badge_id is distinct from 'embajador_galactico'
      then 'Lleva destacada otra insignia'
    else 'Correcto'
  end                                                          as diagnostico

from auth.users u
left join public.member_location ml on ml.user_id = u.id
where exists (
  select 1 from public.user_unlocked_achievements a
  where a.user_id = u.id and a.achievement_id = 'embajador_galactico'
)
order by 1;
