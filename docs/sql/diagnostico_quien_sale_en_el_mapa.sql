-- ============================================================================
-- ¿POR QUÉ ALGUIEN NO SALE EN EL MAPA?  (solo lectura, no cambia nada)
-- ============================================================================
--
-- En el mapa y en el directorio de La Red solo aparece quien cumple LAS DOS
-- cosas:
--   1. Tiene una CIUDAD elegida (no basta con el país).
--   2. Tiene activado «Mostrar mi ciudad».
--
-- Esto dice, persona por persona, cuál de las dos falta. La columna
-- `veredicto` lo resume en una frase.
--
-- No toca nada. Se puede ejecutar las veces que haga falta.
-- ============================================================================

select
  u.email,
  coalesce(ml.country_code, '—')                  as pais,
  coalesce(c.name, '—')                           as ciudad,
  coalesce(ml.show_city::text, '—')               as muestra_ciudad,
  case
    when ml.user_id is null
      then 'No ha guardado ninguna ubicación todavía'
    when ml.city_id is null
      then 'Guardó el país pero NO eligió ciudad: por eso no aparece'
    when ml.show_city is not true
      then 'Tiene ciudad pero el interruptor «Mostrar mi ciudad» está apagado'
    else 'SALE en el mapa y en el directorio'
  end                                             as veredicto,
  ml.updated_at                                   as ultima_vez
from auth.users u
left join public.member_location ml on ml.user_id = u.id
left join public.network_cities  c  on c.id = ml.city_id
where u.email is not null
order by
  case
    when ml.user_id is null then 1
    when ml.city_id is null then 2
    when ml.show_city is not true then 3
    else 4
  end,
  u.email;
