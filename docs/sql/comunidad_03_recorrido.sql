-- ============================================================================
-- CENTRO DE COMUNIDAD — EL RECORRIDO COMPLETO  [EJECUTAR DESPUÉS DEL 02]
-- ============================================================================
--
-- QUÉ CAMBIA
--   El recorrido dejaba fuera la mitad del camino. Estaban las cuatro
--   temporadas, pero los portales que hay ENTRE ellas —el del Compromiso, el
--   del Mapa Cósmico, el de la Memoria Terrestre— vivían sueltos, y el final
--   del camino —el Umbral del Contacto, los Objetivos, la Misión de la
--   Tierra— estaba en la lista de espacios permanentes, como si fuera un tema
--   más y no el destino.
--
--   Ahora el recorrido es el camino entero, en orden:
--
--     1  Temporada 1 · El Llamado
--     2  Temporada 2 · La Estructura del Cosmos
--     3  Temporada 3 · Orígenes ocultos de la Tierra
--     4  Temporada 4 · Archivos del Sol hasta Jesús
--     5  Umbral del Contacto
--     6  Objetivos de los 144.000
--     7  Misión de la Tierra
--
--   Los portales de paso —Compromiso, Mapa Cósmico, Memoria Terrestre— NO son
--   pasos aparte: son el cierre de la temporada que los abre, y viven dentro
--   de ella. Este archivo llegó a crearlos como espacios propios; el 04 los
--   metió donde iban y aquí ya no se crean.
--
--   Y quedan TRES espacios permanentes, los que no dependen de por dónde vaya
--   cada quien:
--
--     · Presentaciones y Comunidad
--     · Experiencias de Contacto
--     · Preguntas sobre los 144.000
--
-- ── POR QUÉ MENOS ES MÁS AQUÍ ──────────────────────────────────────────────
--   Diez espacios permanentes en una comunidad que empieza es un pasillo con
--   diez puertas y nadie detrás de ninguna. Los que hablan del camino solo
--   tienen sentido DENTRO del camino: quien va por la Temporada 2 no necesita
--   decidir si lo suyo va en «Misión de la Tierra» o en «Objetivos». Lo que sí
--   necesita siempre —presentarse, contar lo que vivió, preguntar— se queda
--   fuera y a mano.
--
-- ── LO QUE NO SE PIERDE ────────────────────────────────────────────────────
--   Ninguna conversación se borra ni se queda sin sitio. Las que estaban en
--   los espacios que ahora son pasos del camino siguen ahí: el espacio no
--   desaparece, cambia de sitio en la interfaz.
--
-- CÓMO APLICARLO
--   Supabase → SQL Editor → pega todo → Run. Idempotente.
-- ============================================================================


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  1 · UN TIPO NUEVO: EL HITO                                          ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Un hito es un paso del camino que no es una temporada: un portal de paso,
-- el umbral, el destino. Se ordena con los demás y se abre con la temporada
-- que lo precede.
alter table public.community_spaces
  drop constraint if exists space_season_coherente;

alter table public.community_spaces
  add column if not exists desbloquea_con int;

comment on column public.community_spaces.desbloquea_con is
  'Numero de temporada que hay que tener abierta para entrar en este hito.';

-- El tipo admite ahora los tres valores.
alter table public.community_spaces
  drop constraint if exists community_spaces_tipo_check;
alter table public.community_spaces
  add constraint community_spaces_tipo_check
  check (tipo in ('global', 'season', 'hito'));

-- Se quita antes de volver a ponerla. Sin este drop, ejecutar el archivo dos
-- veces fallaba con «la restricción ya existe», y en el editor de Supabase un
-- error aborta TODO el bloque: parecía aplicado y no había entrado nada.
alter table public.community_spaces
  drop constraint if exists space_coherente;

-- Coherencia: una temporada lleva su número; un hito, la temporada con la que
-- se abre; un espacio permanente, ninguna de las dos.
alter table public.community_spaces
  add constraint space_coherente check (
    (tipo = 'season' and season_num is not null) or
    (tipo = 'hito'   and desbloquea_con is not null) or
    (tipo = 'global' and season_num is null)
  );


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  2 · LOS HITOS DEL CAMINO                                            ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- `sort_order` los coloca ENTRE las temporadas: 11, 12, 13… es el orden del
-- recorrido de principio a fin.
insert into public.community_spaces
  (slug, name, kicker, description, tipo, season_num, desbloquea_con, icono, sort_order)
values
  ('umbral-contacto', 'Umbral del Contacto', 'La preparación',
   'Prácticas, herramientas y preguntas sobre la preparación consciente para el contacto: meditación, respiración, concentración, intención, práctica en grupo.',
   'hito', null, 4, 'umbral', 15)
on conflict (slug) do update
  set name           = excluded.name,
      kicker         = excluded.kicker,
      description    = excluded.description,
      tipo           = excluded.tipo,
      desbloquea_con = excluded.desbloquea_con,
      season_num     = null,
      sort_order     = excluded.sort_order;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  3 · LOS QUE SE MUDAN AL CAMINO                                      ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Objetivos y Misión de la Tierra dejan de ser espacios permanentes: son el
-- final del recorrido, y ahí se entienden. Se abren con la Temporada 4.
--
-- La Misión de la Tierra va DESPUÉS de los Objetivos a propósito: primero qué
-- hacemos, y después el contexto en el que eso ocurre. Al revés, la carga de
-- información llega antes que el motivo para sostenerla.
update public.community_spaces
   set tipo = 'hito', season_num = null, desbloquea_con = 4, sort_order = 16
 where slug = 'objetivos-144000';

update public.community_spaces
   set tipo = 'hito', season_num = null, desbloquea_con = 4, sort_order = 17
 where slug = 'mision-tierra';

-- «Preparación para el Contacto» pasa a ser el Umbral del Contacto, que es su
-- nombre dentro del camino. Se conserva la fila —con sus conversaciones— y se
-- le cambia el sitio; no se crea una nueva ni se mueve nada a mano.
do $$
declare v_umbral uuid; v_prep uuid;
begin
  select id into v_prep   from public.community_spaces where slug = 'preparacion-contacto';
  select id into v_umbral from public.community_spaces where slug = 'umbral-contacto';

  if v_prep is not null and v_umbral is not null then
    -- Lo publicado en Preparación se va con él al Umbral.
    update public.forum_posts set space_id = v_umbral where space_id = v_prep;
    delete from public.community_spaces where id = v_prep;
  elsif v_prep is not null then
    -- Sin fila de Umbral, se reutiliza la de Preparación cambiándole el sitio.
    update public.community_spaces
       set slug = 'umbral-contacto', name = 'Umbral del Contacto',
           kicker = 'La preparación', tipo = 'hito', season_num = null,
           desbloquea_con = 4, sort_order = 15
     where id = v_prep;
  end if;
end $$;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  4 · LAS TEMPORADAS, EN SU SITIO DEL CAMINO                          ║
-- ╚══════════════════════════════════════════════════════════════════════╝
update public.community_spaces set sort_order = 11 where slug = 'temporada-1';
update public.community_spaces set sort_order = 12 where slug = 'temporada-2';
update public.community_spaces set sort_order = 13 where slug = 'temporada-3';
update public.community_spaces set sort_order = 14 where slug = 'temporada-4';

-- Y los tres permanentes, en el orden pedido.
update public.community_spaces set sort_order = 1 where slug = 'presentaciones';
update public.community_spaces set sort_order = 2 where slug = 'experiencias-contacto';
update public.community_spaces set sort_order = 3 where slug = 'preguntas-144000';


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  5 · LOS TEMAS DEL CAMINO, CADA UNO EN SU PASO                       ║
-- ╚══════════════════════════════════════════════════════════════════════╝
do $$
declare r record; v_space uuid;
begin
  for r in
    select * from (values
      ('Rumbo al Umbral del Contacto%',   'umbral-contacto'),
      ('Objetivos de Los 144.000%',       'objetivos-144000'),
      ('Nodos 144.000%',                  'objetivos-144000'),
      ('Misión Territorial%',             'mision-tierra')
    ) as t(patron, slug)
  loop
    select id into v_space from public.community_spaces where slug = r.slug;
    if v_space is null then continue; end if;
    update public.forum_posts
       set space_id = v_space, category_id = null, is_official = true
     where title like r.patron;
  end loop;
end $$;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  6 · UNA SOLA DESTACADA                                              ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- «¿Por qué llegaste a este camino?» es la puerta de entrada de cualquiera, y
-- por eso vive en Presentaciones y es la única fijada arriba.
--
-- El resto de los temas del camino dejan de estar fijados: no desaparecen,
-- pasan a ser el contenido de su paso. Doce conversaciones «destacadas» a la
-- vez no destacan nada.
update public.forum_posts
   set space_id = (select id from public.community_spaces where slug = 'presentaciones'),
       category_id = null,
       pinned = true,
       is_official = true
 where title like 'Portal de Ingreso%';

-- `pin_order` NO admite nulos en esta base. Ponerlo a null hacía fallar este
-- update, y en el editor de Supabase un error aborta TODO el bloque: la
-- migración entera se quedaba sin aplicar y el foro salía vacío. Cero es el
-- valor neutro correcto para algo que ya no está fijado.
update public.forum_posts
   set pinned = false, pin_order = 0
 where pinned = true
   and title not like 'Portal de Ingreso%';


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  7 · CÓMO QUEDÓ                                                      ║
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
