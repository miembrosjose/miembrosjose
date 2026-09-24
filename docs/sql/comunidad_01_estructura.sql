-- ============================================================================
-- CENTRO DE COMUNIDAD — ESTRUCTURA  [EJECUTAR UNA VEZ]
-- ============================================================================
--
-- QUÉ ES ESTO
--   El foro pasa de ser una lista de publicaciones a ser un centro de
--   comunidad con dos dimensiones que conviven: EL RECORRIDO (las cuatro
--   temporadas) y LOS ESPACIOS DE LA RED (los permanentes).
--
-- ── LO QUE NO SE TOCA ──────────────────────────────────────────────────────
--   No se borra ni se renombra NADA. `forum_posts` sigue siendo la tabla de
--   las conversaciones y `forum_replies` la de las respuestas, con sus likes,
--   sus reportes y sus identificadores intactos. Todo lo publicado hasta hoy
--   sigue donde estaba, con su autor y su fecha.
--
--   Lo único que se hace sobre ellas es AÑADIR columnas y repartir lo que ya
--   existe entre los espacios nuevos.
--
-- ── POR QUÉ NO SE CREA UNA TABLA DE HILOS NUEVA ────────────────────────────
--   Sería duplicar el sistema: habría que migrar los posts, las respuestas,
--   los "me gusta", los reportes y las insignias de autor, y mantener dos
--   caminos durante meses. Una conversación YA ES un post del foro; lo único
--   que le faltaba era saber a qué espacio pertenece.
--
-- ── LAS TRES PIEZAS NUEVAS ─────────────────────────────────────────────────
--   ESPACIO   · área permanente creada por administración. Global (Misión de
--               la Tierra) o de temporada (Temporada 2).
--   CATEGORÍA · subdivisión dentro de un espacio, también de administración.
--               Solo las temporadas la usan; los espacios globales están lo
--               bastante enfocados y partirlos los dejaría vacíos.
--   HILO      · lo crea un miembro. Es una fila de `forum_posts`.
--
-- CÓMO APLICARLO
--   Supabase → SQL Editor → pega todo → Run. Idempotente.
--   Después, el archivo comunidad_02_reparto.sql coloca lo ya publicado.
-- ============================================================================


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  1 · ESPACIOS                                                        ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create table if not exists public.community_spaces (
  id uuid primary key default gen_random_uuid(),

  -- Va en la URL: /miembros/comunidad/<slug>. Estable, no se renombra.
  slug text not null unique,
  name text not null,

  -- La frase de tres palabras que distingue este espacio de su vecino:
  -- "Lo que viví" frente a "Cómo me preparo". Es lo que evita que la gente
  -- publique en el sitio equivocado, y por eso se guarda con el espacio y no
  -- se escribe suelta en la interfaz.
  kicker text not null default '',
  description text not null default '',

  -- 'global' = permanente; 'season' = una de las cuatro temporadas.
  tipo text not null default 'global' check (tipo in ('global', 'season')),

  -- Solo para tipo 'season'. Es el número de temporada, no su uuid: el número
  -- es lo estable entre entornos y lo que usa el resto de la plataforma.
  season_num int,

  -- El icono lo elige la interfaz por slug; aquí solo se guarda un nombre
  -- corto por si algún día se gestiona desde el panel.
  icono text not null default '',

  sort_order int not null default 0,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),

  -- Un espacio de temporada sin número no sabría a quién dejar entrar.
  constraint space_season_coherente
    check ((tipo = 'season') = (season_num is not null))
);

create index if not exists community_spaces_orden_idx
  on public.community_spaces (activo, sort_order);

comment on table public.community_spaces is
  'Centro de Comunidad: areas permanentes. Las crea administracion, nunca un miembro.';


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  2 · CATEGORÍAS                                                      ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create table if not exists public.community_categories (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.community_spaces(id) on delete cascade,
  slug text not null,
  name text not null,
  description text not null default '',
  sort_order int not null default 0,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  unique (space_id, slug)
);

create index if not exists community_categories_espacio_idx
  on public.community_categories (space_id, activo, sort_order);


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  3 · LO QUE LE FALTABA A UNA CONVERSACIÓN                            ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Columnas nuevas sobre la tabla de siempre. Ninguna es obligatoria, así que
-- lo ya publicado sigue siendo válido mientras se reparte.
alter table public.forum_posts
  add column if not exists space_id uuid references public.community_spaces(id) on delete set null,
  add column if not exists category_id uuid references public.community_categories(id) on delete set null,
  -- Escrita por administración: se distingue sin gritar.
  add column if not exists is_official boolean not null default false,
  -- Cerrada: se puede leer, no se puede responder.
  add column if not exists is_locked boolean not null default false,
  -- Cuándo pasó algo aquí por última vez. Es lo que ordena la lista: una
  -- conversación de hace un mes con una respuesta de hoy está viva.
  add column if not exists last_activity_at timestamptz;

-- Quien no tenga marca de actividad hereda su fecha de creación.
update public.forum_posts
   set last_activity_at = coalesce(last_activity_at, created_at)
 where last_activity_at is null;

create index if not exists forum_posts_espacio_idx
  on public.forum_posts (space_id, pinned desc, last_activity_at desc);
create index if not exists forum_posts_categoria_idx
  on public.forum_posts (category_id, last_activity_at desc);


-- ── Una respuesta sube la conversación ──────────────────────────────────────
-- Sin esto, "actividad reciente" sería "fecha de creación" con otro nombre.
create or replace function public.forum_touch_last_activity()
returns trigger language plpgsql security definer
set search_path = public, extensions, pg_temp as $fn$
begin
  update public.forum_posts
     set last_activity_at = now()
   where id = new.post_id;
  return new;
end $fn$;

drop trigger if exists forum_replies_touch_activity on public.forum_replies;
create trigger forum_replies_touch_activity
  after insert on public.forum_replies
  for each row execute function public.forum_touch_last_activity();


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  4 · SEGUIR UNA CONVERSACIÓN                                         ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- El tipo de `post_id` se copia del de `forum_posts.id` en vez de darlo por
-- supuesto: si allí es uuid y aquí se declarara bigint, la clave foránea
-- fallaría y la migración entera se caería.
do $$
declare t text;
begin
  select data_type into t
    from information_schema.columns
   where table_schema = 'public' and table_name = 'forum_posts' and column_name = 'id';

  execute format($f$
    create table if not exists public.community_thread_follows (
      post_id %s not null references public.forum_posts(id) on delete cascade,
      user_id uuid not null references auth.users(id) on delete cascade,
      creado_en timestamptz not null default now(),
      primary key (post_id, user_id)
    )$f$, case when t = 'uuid' then 'uuid' else 'bigint' end);
end $$;

create index if not exists community_follows_usuario_idx
  on public.community_thread_follows (user_id);


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  5 · PROPONER UNA TEMÁTICA                                           ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Un miembro no crea espacios, pero sí puede pedir uno. La propuesta llega a
-- administración y allí se decide. Nunca se convierte en espacio sola.
create table if not exists public.community_space_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  descripcion text not null default '',
  motivo text not null default '',
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aprobada', 'rechazada', 'fusionada', 'archivada')),
  nota_admin text not null default '',
  creado_en timestamptz not null default now(),
  resuelto_en timestamptz
);

create index if not exists community_proposals_estado_idx
  on public.community_space_proposals (estado, creado_en desc);


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  6 · UN CONTENIDO Y SU CONVERSACIÓN                                  ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Para que una meditación o un capítulo pueda llevar a "compartir mi
-- experiencia" sin cablear nada a mano. `contenido_tipo` + `contenido_ref`
-- identifican el contenido con el vocabulario que ya usa cada módulo
-- (por ejemplo 'episodio' + '<uuid>', o 'meditacion' + 'el-nombre').
do $$
declare t text;
begin
  select data_type into t
    from information_schema.columns
   where table_schema = 'public' and table_name = 'forum_posts' and column_name = 'id';

  execute format($f$
    create table if not exists public.community_content_links (
      id uuid primary key default gen_random_uuid(),
      contenido_tipo text not null,
      contenido_ref text not null,
      space_id uuid references public.community_spaces(id) on delete set null,
      category_id uuid references public.community_categories(id) on delete set null,
      -- Si está puesto, ese contenido tiene UNA conversación oficial y todo el
      -- mundo responde ahí. Si está vacío, cada quien abre la suya.
      post_id %s references public.forum_posts(id) on delete set null,
      creado_en timestamptz not null default now(),
      unique (contenido_tipo, contenido_ref)
    )$f$, case when t = 'uuid' then 'uuid' else 'bigint' end);
end $$;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  7 · SEGURIDAD                                                       ║
-- ╚══════════════════════════════════════════════════════════════════════╝
alter table public.community_spaces           enable row level security;
alter table public.community_categories       enable row level security;
alter table public.community_thread_follows   enable row level security;
alter table public.community_space_proposals  enable row level security;
alter table public.community_content_links    enable row level security;

-- La ESTRUCTURA la lee cualquier miembro: necesita ver qué espacios existen,
-- incluso los de temporadas que todavía no ha desbloqueado —los ve cerrados,
-- con su candado—. Lo que nunca sale por aquí es el CONTENIDO de esos
-- espacios: eso lo filtra el servidor comprobando el acceso de la persona.
drop policy if exists "comunidad espacios lectura" on public.community_spaces;
create policy "comunidad espacios lectura"
  on public.community_spaces for select to authenticated using (true);

drop policy if exists "comunidad categorias lectura" on public.community_categories;
create policy "comunidad categorias lectura"
  on public.community_categories for select to authenticated using (true);

-- Escribir la estructura es cosa de administración, y pasa por rutas que usan
-- service_role. Por eso aquí NO hay policy de insert, update ni delete: lo que
-- no existe no se puede usar mal.

-- Seguir una conversación: cada quien las suyas.
drop policy if exists "comunidad seguir lectura" on public.community_thread_follows;
create policy "comunidad seguir lectura"
  on public.community_thread_follows for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "comunidad seguir alta" on public.community_thread_follows;
create policy "comunidad seguir alta"
  on public.community_thread_follows for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "comunidad seguir baja" on public.community_thread_follows;
create policy "comunidad seguir baja"
  on public.community_thread_follows for delete to authenticated
  using (user_id = auth.uid());

-- Propuestas: se escriben y se ven las propias. Administración las lee todas
-- con service_role.
drop policy if exists "comunidad propuestas propias" on public.community_space_proposals;
create policy "comunidad propuestas propias"
  on public.community_space_proposals for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "comunidad propuestas alta" on public.community_space_proposals;
create policy "comunidad propuestas alta"
  on public.community_space_proposals for insert to authenticated
  with check (user_id = auth.uid());

-- Los enlaces contenido↔conversación los lee cualquiera con sesión: son
-- punteros, no contenido.
drop policy if exists "comunidad enlaces lectura" on public.community_content_links;
create policy "comunidad enlaces lectura"
  on public.community_content_links for select to authenticated using (true);


-- ── Permisos de tabla ───────────────────────────────────────────────────────
-- RLS y GRANT son capas distintas y las dos tienen que dar permiso. Este
-- proyecto endureció los privilegios por defecto, así que se declaran.
grant select on public.community_spaces          to authenticated;
grant select on public.community_categories      to authenticated;
grant select on public.community_content_links   to authenticated;
grant select, insert, delete on public.community_thread_follows  to authenticated;
grant select, insert on public.community_space_proposals to authenticated;

revoke all on public.community_spaces          from anon;
revoke all on public.community_categories      from anon;
revoke all on public.community_thread_follows  from anon;
revoke all on public.community_space_proposals from anon;
revoke all on public.community_content_links   from anon;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  8 · LOS ESPACIOS, SEMBRADOS                                         ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Diez espacios: seis permanentes y cuatro de temporada. Ni uno más.
--
-- Con una comunidad que empieza, seis espacios fuertes laten; treinta
-- espacios con dos conversaciones cada uno parecen un pueblo abandonado. El
-- `kicker` de cada uno es lo que impide que se confundan entre sí.
insert into public.community_spaces (slug, name, kicker, description, tipo, season_num, icono, sort_order)
values
  ('presentaciones', 'Presentaciones y Comunidad', 'Quién eres',
   'Preséntate a la Red. Comparte quién eres, desde dónde te conectas, qué te trajo hasta aquí, y conoce a otros miembros que también recorren este camino.',
   'global', null, 'personas', 1),

  ('experiencias-contacto', 'Experiencias de Contacto', 'Lo que viví',
   'Un espacio para compartir experiencias personales relacionadas con el contacto: avistamientos, meditaciones, sueños, percepciones, sincronicidades y otros acontecimientos significativos.',
   'global', null, 'destello', 2),

  ('preparacion-contacto', 'Preparación para el Contacto', 'Cómo me preparo',
   'Prácticas, herramientas, preguntas y aprendizajes sobre la preparación consciente para experiencias de contacto: meditación, respiración, concentración, intención, práctica en grupo.',
   'global', null, 'brujula', 3),

  ('objetivos-144000', 'Objetivos de los 144.000', 'Qué hacemos',
   'Un espacio para comprender, reflexionar y conversar sobre los objetivos colectivos de la Red y la forma en que pueden expresarse en acciones concretas.',
   'global', null, 'objetivo', 4),

  ('mision-tierra', 'Misión de la Tierra', 'El contexto planetario',
   'Un espacio para explorar la misión de la Tierra, el proceso colectivo de la humanidad y nuestra relación con este momento planetario.',
   'global', null, 'globo', 5),

  ('preguntas-144000', 'Preguntas sobre los 144.000', 'Lo que necesito comprender',
   'Un espacio abierto para plantear preguntas sobre el camino, los contenidos, la Red, sus principios y aquello que todavía necesitas comprender.',
   'global', null, 'pregunta', 6),

  ('temporada-1', 'Temporada 1', 'El Llamado',
   'Las conversaciones de quienes están atravesando la primera etapa del recorrido.',
   'season', 1, 'temporada', 11),
  ('temporada-2', 'Temporada 2', 'La Estructura del Cosmos',
   'Las conversaciones de quienes están atravesando la segunda etapa del recorrido.',
   'season', 2, 'temporada', 12),
  ('temporada-3', 'Temporada 3', 'Orígenes ocultos de la Tierra',
   'Las conversaciones de quienes están atravesando la tercera etapa del recorrido.',
   'season', 3, 'temporada', 13),
  ('temporada-4', 'Temporada 4', 'Archivos del Sol hasta Jesús',
   'Las conversaciones de quienes están atravesando la cuarta etapa del recorrido.',
   'season', 4, 'temporada', 14)
on conflict (slug) do update
  set name        = excluded.name,
      kicker      = excluded.kicker,
      description = excluded.description,
      tipo        = excluded.tipo,
      season_num  = excluded.season_num,
      sort_order  = excluded.sort_order;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  9 · CATEGORÍAS: SOLO DENTRO DE LAS TEMPORADAS                       ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- TRES, no cinco. La propuesta inicial separaba "Experiencias", "Prácticas" e
-- "Integración", y en una temporada eso son tres puertas para casi lo mismo:
-- lo que pasó al hacer la práctica. Con cinco por temporada serían veinte
-- salas, y hoy no hay gente para llenar dos.
--
-- Además, lo experiencial fuerte ya tiene su propio espacio permanente
-- —Experiencias de Contacto—, que no depende de por dónde vaya cada quien.
insert into public.community_categories (space_id, slug, name, description, sort_order)
select s.id, c.slug, c.name, c.description, c.sort_order
from public.community_spaces s
cross join (values
  ('conversacion', 'Conversación',
   'Ideas, comprensiones y reflexiones sobre esta etapa del recorrido.', 1),
  ('practicas', 'Prácticas y experiencias',
   'Las meditaciones y ejercicios de esta temporada, y lo que ocurrió al hacerlos.', 2),
  ('preguntas', 'Preguntas',
   'Dudas sobre los contenidos, las prácticas o las experiencias de esta temporada.', 3)
) as c(slug, name, description, sort_order)
where s.tipo = 'season'
on conflict (space_id, slug) do update
  set name        = excluded.name,
      description = excluded.description,
      sort_order  = excluded.sort_order;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  10 · COMPROBACIÓN                                                   ║
-- ╚══════════════════════════════════════════════════════════════════════╝
select
  s.sort_order as orden,
  s.slug,
  s.name,
  s.tipo,
  s.season_num as temporada,
  count(c.id) as categorias
from public.community_spaces s
left join public.community_categories c on c.space_id = s.id
group by s.id, s.sort_order, s.slug, s.name, s.tipo, s.season_num
order by s.sort_order;
