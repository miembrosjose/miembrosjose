-- ============================================================================
-- CENTRO DE COMUNIDAD — LOS PORTALES, DENTRO DE SU TEMPORADA  [DESPUÉS DEL 03]
-- ============================================================================
--
-- QUÉ CAMBIA
--   El recorrido tenía diez pasos y siete de ellos eran lo mismo contado dos
--   veces: la Temporada 1 y, justo detrás, el Portal del Compromiso que sale
--   de la Temporada 1. Dos entradas para una sola etapa.
--
--   Los portales de paso dejan de ser espacios propios y se convierten en lo
--   que siempre fueron: una conversación DENTRO de la temporada que los abre.
--
--     Portal del Compromiso        (T1 → T2)  →  dentro de Temporada 1
--     Portal del Mapa Cósmico      (T2 → T3)  →  dentro de Temporada 2
--     Portal de la Memoria Terrestre (T3 → T4) →  dentro de Temporada 3
--
--   El recorrido queda en siete pasos, que se leen de un tirón:
--
--     1  Temporada 1 · El Llamado
--     2  Temporada 2 · La Estructura del Cosmos
--     3  Temporada 3 · Orígenes ocultos de la Tierra
--     4  Temporada 4 · Archivos del Sol hasta Jesús
--     5  Umbral del Contacto
--     6  Objetivos de los 144.000
--     7  Misión de la Tierra
--
-- ── POR QUÉ DENTRO Y NO AL LADO ────────────────────────────────────────────
--   El Portal del Compromiso pide escribir una declaración de intención al
--   terminar la Temporada 1. Eso no es otra etapa: es el cierre de esa. Quien
--   acaba la temporada y quiere compartirlo no debería tener que decidir entre
--   dos puertas casi iguales, y quien pasa por la lista no debería leer siete
--   nombres para encontrar cuatro.
--
-- ── LO QUE NO SE PIERDE ────────────────────────────────────────────────────
--   Ni una conversación se borra. Las de cada portal se mudan a su temporada
--   antes de que el espacio desaparezca, y quedan en «Prácticas y experiencias»,
--   que es lo que son: un ejercicio y lo que salió de él.
--
-- CÓMO APLICARLO
--   Supabase → SQL Editor → pega todo → Run. Idempotente.
-- ============================================================================


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  1 · CADA PORTAL, A SU TEMPORADA                                     ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Se mueve por TÍTULO y también por espacio de origen: por título para las
-- conversaciones sembradas con el temario, y por espacio para cualquier cosa
-- que alguien haya escrito dentro del portal mientras existía.
do $$
declare
  r          record;
  v_destino  uuid;
  v_origen   uuid;
  v_practica uuid;
begin
  for r in
    select * from (values
      ('portal-compromiso',         'Portal del Compromiso%',          'temporada-1'),
      ('portal-mapa-cosmico',       'Portal del Mapa Cósmico%',        'temporada-2'),
      ('portal-memoria-terrestre',  'Portal de la Memoria Terrestre%', 'temporada-3')
    ) as t(portal, patron, temporada)
  loop
    select id into v_destino from public.community_spaces where slug = r.temporada;
    -- Sin temporada de destino no se mueve nada: antes dejar el portal en pie
    -- que soltar sus conversaciones en el vacío.
    if v_destino is null then continue; end if;

    select id into v_practica
      from public.community_categories
     where space_id = v_destino and slug = 'practicas';

    select id into v_origen from public.community_spaces where slug = r.portal;

    -- Lo que vivía dentro del portal.
    if v_origen is not null then
      update public.forum_posts
         set space_id = v_destino, category_id = v_practica
       where space_id = v_origen;
    end if;

    -- Y el tema del portal, esté donde esté: el reparto original lo dejó en la
    -- temporada de DESTINO (el Compromiso en la 2), y le toca la de ORIGEN.
    update public.forum_posts
       set space_id = v_destino, category_id = v_practica, is_official = true
     where title like r.patron;

    -- Ya vacío, el espacio se va.
    if v_origen is not null then
      delete from public.community_spaces where id = v_origen;
    end if;
  end loop;
end $$;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  2 · EL RECORRIDO, EN SIETE PASOS                                    ║
-- ╚══════════════════════════════════════════════════════════════════════╝
update public.community_spaces set sort_order = 11 where slug = 'temporada-1';
update public.community_spaces set sort_order = 12 where slug = 'temporada-2';
update public.community_spaces set sort_order = 13 where slug = 'temporada-3';
update public.community_spaces set sort_order = 14 where slug = 'temporada-4';
update public.community_spaces set sort_order = 15 where slug = 'umbral-contacto';
update public.community_spaces set sort_order = 16 where slug = 'objetivos-144000';
update public.community_spaces set sort_order = 17 where slug = 'mision-tierra';

-- Los tres permanentes no se tocan: siguen en 1, 2 y 3.


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  3 · CÓMO QUEDÓ                                                      ║
-- ╚══════════════════════════════════════════════════════════════════════╝
select
  s.sort_order as orden,
  case s.tipo when 'global' then 'espacio' when 'season' then 'temporada' else 'hito' end as clase,
  s.name,
  coalesce(s.season_num, s.desbloquea_con) as abre_con,
  count(p.id) as conversaciones
from public.community_spaces s
left join public.forum_posts p on p.space_id = s.id
where s.activo
group by s.id, s.sort_order, s.tipo, s.name, s.season_num, s.desbloquea_con
order by s.sort_order;
