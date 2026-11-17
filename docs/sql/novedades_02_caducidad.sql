-- ============================================================================
-- NOVEDADES — que se retiren solas            [PENDIENTE DE EJECUTAR]
-- ============================================================================
--
-- EL PROBLEMA
--   Una novedad se queda puesta para siempre. «El domingo 15 nos vemos en
--   vivo» seguía en la portada días después de la reunión, que es peor que no
--   anunciar nada: quien entra el martes lee una convocatoria a algo que ya
--   pasó y aprende que esa sección no es de fiar.
--
--   Retirarlas a mano exige acordarse. Nadie se acuerda, y menos de algo que
--   solo molesta a quien entra, no a quien lo escribió.
--
-- QUÉ HACE
--   Añade `caduca_at` a forum_posts. Cuando esa hora pasa, la novedad deja de
--   salir en la portada. No se borra: sigue en el espacio de Novedades, con
--   sus respuestas, y administración la sigue viendo en su panel.
--
-- POR QUÉ RETIRAR Y NO BORRAR
--   Porque una convocatoria con conversación debajo es parte del registro de
--   lo que pasó. Lo que sobra es el ANUNCIO, no el hecho.
--
-- POR QUÉ NO SE DEDUCE DE `evento_at`
--   Porque no todas las novedades son una cita. «Ya está subida la grabación
--   del primer encuentro» no tiene hora de reunión y aun así debe durar unos
--   días y marcharse. Y al revés: un aviso sobre una reunión puede tener que
--   seguir visible un par de días DESPUÉS, para quien se la perdió.
--
--   Una regla automática acertaría en la mitad de los casos y haría
--   desaparecer la otra mitad sin explicación.
--
-- LA COLUMNA VA EN forum_posts, NO EN UNA TABLA NUEVA
--   Las novedades SON entradas del foro en el espacio `novedades`. En las
--   demás entradas la columna queda nula y no la mira nadie.
--
-- CÓMO APLICARLO
--   Supabase → SQL Editor → Run. Idempotente.
-- ============================================================================

alter table public.forum_posts
  add column if not exists caduca_at timestamptz;

comment on column public.forum_posts.caduca_at is
  'Solo para el espacio «novedades»: a partir de esta hora la novedad deja de '
  'salir en la portada. No se borra; administración la sigue viendo. Nula = '
  'no caduca.';

-- Índice para la consulta de la portada: las del espacio, de la más nueva a
-- la más vieja.
--
-- OJO: aquí NO cabe un índice parcial del tipo `where caduca_at > now()`, que
-- es lo primero que se ocurre. Postgres exige que el filtro de un índice sea
-- INMUTABLE —el mismo resultado siempre— y `now()` cambia a cada segundo: el
-- índice quedaría describiendo un pasado que ya no es cierto. La base lo
-- rechaza al crearlo.
create index if not exists idx_forum_posts_espacio_fecha
  on public.forum_posts (space_id, created_at desc);

-- ── COMPROBACIÓN ────────────────────────────────────────────────────────────
-- Debe aparecer la columna, y la lista de novedades con su caducidad.
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'forum_posts'
  and column_name = 'caduca_at';

select p.id, p.title, p.evento_at, p.caduca_at,
       case
         when p.caduca_at is null then 'no caduca'
         when p.caduca_at <= now() then 'ya retirada'
         else 'visible'
       end as estado
from public.forum_posts p
join public.community_spaces e on e.id = p.space_id
where e.slug = 'novedades'
order by p.created_at desc;
