-- ============================================================================
-- CENTRO DE COMUNIDAD — REPARTO DE LO YA PUBLICADO  [EJECUTAR DESPUÉS DEL 01]
-- ============================================================================
--
-- QUÉ HACE
--   Coloca cada conversación existente en el espacio que le corresponde. No
--   borra, no mueve de tabla, no cambia autores ni fechas ni respuestas: solo
--   rellena `space_id` (y `category_id` cuando toca).
--
-- ── EL CRITERIO, Y POR QUÉ ES CONSERVADOR ──────────────────────────────────
--   1. Los doce temas FIJADOS son el temario del Camino y se reconocen por su
--      título. Van a la temporada que nombran, marcados como oficiales.
--      Los portales de paso —"(T1 → T2)"— van a la temporada a la que LLEVAN,
--      porque funcionan como puerta de entrada de la siguiente etapa.
--   2. El resto se reparte por su categoría actual (`tags`), que ya expresaba
--      de qué hablaba cada uno.
--   3. Lo que no encaje en ninguna regla va a «Presentaciones y Comunidad»,
--      que es el espacio general. Ante la duda, al sitio más inocuo: moverlo
--      después es un clic, y nada queda escondido.
--
--   Nada se queda sin espacio. Al final, la comprobación lo verifica.
--
-- CÓMO APLICARLO
--   Supabase → SQL Editor → pega todo → Run. Idempotente: se puede repetir.
-- ============================================================================


-- ── PASO 1 · Cómo está ahora ────────────────────────────────────────────────
select
  count(*) filter (where space_id is null)     as sin_espacio,
  count(*) filter (where space_id is not null) as ya_colocadas,
  count(*) filter (where pinned)               as fijadas,
  count(*)                                     as total
from public.forum_posts;


-- ── PASO 2 · El temario del Camino ──────────────────────────────────────────
-- Por título, que es lo único estable: el sembrador del temario los crea con
-- estos nombres y comprueba por título para no duplicarlos.
do $$
declare
  r record;
  v_space uuid;
begin
  for r in
    select * from (values
      ('Portal de Ingreso%',                 'temporada-1'),
      ('Temporada 1 ·%',                     'temporada-1'),
      ('Portal del Compromiso%',             'temporada-2'),
      ('Temporada 2 ·%',                     'temporada-2'),
      ('Portal del Mapa Cósmico%',           'temporada-3'),
      ('Temporada 3 ·%',                     'temporada-3'),
      ('Portal de la Memoria Terrestre%',    'temporada-4'),
      ('Temporada 4 ·%',                     'temporada-4'),
      ('Objetivos de Los 144.000%',          'objetivos-144000'),
      ('Nodos 144.000%',                     'objetivos-144000'),
      ('Misión Territorial%',                'mision-tierra'),
      ('Rumbo al Umbral del Contacto%',      'preparacion-contacto')
    ) as t(patron, slug)
  loop
    select id into v_space from public.community_spaces where slug = r.slug;
    if v_space is null then continue; end if;

    update public.forum_posts
       set space_id = v_space,
           is_official = true
     where title like r.patron
       and space_id is null;
  end loop;
end $$;


-- ── PASO 3 · El resto, por su categoría ─────────────────────────────────────
-- Las siete categorías del foro antiguo se reparten entre los seis espacios.
-- Dos de ellas —Señales y Sueños, Umbral del Contacto— ya eran claramente
-- experienciales o de preparación, y ahí van.
do $$
declare
  r record;
  v_space uuid;
begin
  for r in
    select * from (values
      ('SEÑALES',        'experiencias-contacto'),
      ('UMBRAL',         'preparacion-contacto'),
      ('DISCERNIMIENTO', 'preparacion-contacto'),
      ('NODOS',          'objetivos-144000'),
      ('CUSTODIA',       'mision-tierra'),
      ('ARCHIVOS',       'mision-tierra'),
      ('LINAJE',         'mision-tierra')
    ) as t(tag, slug)
  loop
    select id into v_space from public.community_spaces where slug = r.slug;
    if v_space is null then continue; end if;

    update public.forum_posts
       set space_id = v_space
     where space_id is null
       and tags @> array[r.tag]::text[];
  end loop;
end $$;


-- ── PASO 4 · Lo que no encajó ───────────────────────────────────────────────
-- Al espacio general. Nada se queda huérfano y nada se esconde.
update public.forum_posts
   set space_id = (select id from public.community_spaces where slug = 'presentaciones')
 where space_id is null;


-- ── PASO 5 · Dentro de una temporada, una categoría ─────────────────────────
-- Los temas del temario abren la conversación de su etapa, así que van a
-- «Conversación». Se puede mover cualquiera desde el panel después.
update public.forum_posts p
   set category_id = c.id
  from public.community_spaces s
  join public.community_categories c
    on c.space_id = s.id and c.slug = 'conversacion'
 where p.space_id = s.id
   and s.tipo = 'season'
   and p.category_id is null;


-- ── PASO 6 · La actividad, al día ───────────────────────────────────────────
-- Una conversación con respuestas está viva desde su última respuesta, no
-- desde que se abrió. Sin esto, el orden por actividad enterraría hilos
-- antiguos que siguen moviéndose.
update public.forum_posts p
   set last_activity_at = greatest(
         coalesce(p.last_activity_at, p.created_at),
         coalesce((select max(r.created_at) from public.forum_replies r where r.post_id = p.id), p.created_at)
       );


-- ── PASO 7 · Cómo quedó ─────────────────────────────────────────────────────
-- `sin_espacio` debe ser 0. Lo demás es el reparto, para mirarlo con calma.
select 'sin espacio asignado' as espacio, count(*) as conversaciones, 0 as orden
from public.forum_posts where space_id is null
union all
select s.name, count(p.id), s.sort_order
from public.community_spaces s
left join public.forum_posts p on p.space_id = s.id
group by s.name, s.sort_order
order by orden;
