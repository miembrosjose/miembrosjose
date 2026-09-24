-- ============================================================================
-- ¿POR QUÉ SALE VACÍO EL FORO?  (solo lectura, no cambia nada)
-- ============================================================================
--
-- Una sola consulta con seis filas. Cada una comprueba un eslabón de la
-- cadena, de abajo arriba. La primera que diga MAL es la que rompe.
--
-- El editor de Supabase solo enseña el resultado de la última consulta, por
-- eso va todo junto en una.
-- ============================================================================

select * from (

  -- 1 · ¿Llegó la migración 03? Sin esta columna, el código antiguo devolvía
  --     CERO espacios, y sin espacios no se ve ninguna conversación.
  select 1 as orden,
    'Columna desbloquea_con (migracion 03)' as comprobacion,
    (select count(*) from information_schema.columns
      where table_schema='public' and table_name='community_spaces'
        and column_name='desbloquea_con')::text as valor,
    case when exists (select 1 from information_schema.columns
      where table_schema='public' and table_name='community_spaces'
        and column_name='desbloquea_con') then 'BIEN' else 'MAL — falta correr el 03' end as veredicto

  union all

  -- 2 · ¿Existen los espacios?
  select 2, 'Espacios activos',
    (select count(*)::text from public.community_spaces where activo),
    case when (select count(*) from public.community_spaces where activo) >= 3
      then 'BIEN' else 'MAL — faltan espacios, correr el 01' end

  union all

  -- 3 · ¿Y las conversaciones siguen ahí? Esto es lo que importa de verdad:
  --     si el número es mayor que cero, NO se ha perdido nada.
  select 3, 'Conversaciones en total',
    (select count(*)::text from public.forum_posts),
    case when (select count(*) from public.forum_posts) > 0
      then 'BIEN' else 'MAL — no hay conversaciones' end

  union all

  -- 4 · ¿Están colocadas en algún espacio? Una conversación sin espacio no la
  --     ve nadie, aunque exista.
  select 4, 'Conversaciones SIN espacio',
    (select count(*)::text from public.forum_posts where space_id is null),
    case when (select count(*) from public.forum_posts where space_id is null) = 0
      then 'BIEN' else 'MAL — correr el 02 otra vez' end

  union all

  -- 5 · ¿Apuntan a un espacio que exista? Si un espacio se borró, sus
  --     conversaciones quedan apuntando al vacío.
  select 5, 'Conversaciones con espacio inexistente',
    (select count(*)::text from public.forum_posts p
      where p.space_id is not null
        and not exists (select 1 from public.community_spaces s where s.id = p.space_id)),
    case when (select count(*) from public.forum_posts p
      where p.space_id is not null
        and not exists (select 1 from public.community_spaces s where s.id = p.space_id)) = 0
      then 'BIEN' else 'MAL' end

  union all

  -- 6 · ¿Hay temporadas con numero? De ahi sale el acceso: sin numeros, nadie
  --     tiene ninguna temporada abierta y todo queda cerrado.
  select 6, 'Temporadas en la tabla seasons',
    (select count(*)::text from public.seasons),
    case when (select count(*) from public.seasons) > 0
      then 'BIEN' else 'MAL — sin temporadas no se abre nada' end

) r order by orden;


-- ── EL REPARTO, ESPACIO POR ESPACIO ─────────────────────────────────────────
-- Descomenta y ejecuta SOLO esto si quieres ver dónde quedó cada conversación.
--
-- select s.sort_order, s.tipo, s.name, s.season_num, s.desbloquea_con,
--        count(p.id) as conversaciones
--   from public.community_spaces s
--   left join public.forum_posts p on p.space_id = s.id
--  where s.activo
--  group by s.id, s.sort_order, s.tipo, s.name, s.season_num, s.desbloquea_con
--  order by s.sort_order;
