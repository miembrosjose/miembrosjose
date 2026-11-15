-- ════════════════════════════════════════════════════════════════════════════
--  NOVEDADES · el tablón de José, con comentarios
-- ════════════════════════════════════════════════════════════════════════════
--
-- Córrelo entero en el SQL Editor de la PLATAFORMA. Es idempotente: se puede
-- repetir sin duplicar nada.
--
-- ── QUÉ ES ────────────────────────────────────────────────────────────────
-- Un sitio cronológico donde José publica —reuniones, directos, avisos— y la
-- gente comenta. Un foro que no es un foro: escribe una sola persona.
--
-- ── POR QUÉ NO ES UN MÓDULO NUEVO ─────────────────────────────────────────
-- Porque lo que hace falta ya existe y funciona: hilos, respuestas de un solo
-- nivel, «me gusta», la foto y la insignia del autor congeladas en el momento
-- de publicar, moderación, denuncias. Construir eso otra vez al lado sería
-- tener dos foros que se parecen y se estropean por separado.
--
-- Novedades es un ESPACIO más de la comunidad. Lo único que lo distingue es
-- que solo puede abrir hilos la administración, y que se dibuja en Inicio con
-- otra cara en vez de en la lista de espacios.
--
-- ── LO QUE AÑADE ESTA MIGRACIÓN ───────────────────────────────────────────
--   1. Dos interruptores en los espacios: quién puede abrir hilo, y si el
--      espacio se enseña o todavía no.
--   2. Tres columnas opcionales en los hilos, para lo que una novedad tiene
--      y una conversación no: la fecha del acto y un botón.
--   3. El espacio «Novedades», creado OCULTO.
--
-- Nada de esto cambia lo que ya hay publicado.

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  1 · LOS DOS INTERRUPTORES DEL ESPACIO                               ║
-- ╚══════════════════════════════════════════════════════════════════════╝

alter table public.community_spaces
  -- Quién puede ABRIR un hilo aquí. Responder no se toca: el sentido de
  -- Novedades es que la gente conteste.
  add column if not exists solo_admin boolean not null default false,
  -- Mientras esté en false, el espacio solo lo ve la administración. Sirve
  -- para montar una sección entera con contenido real, revisarla en
  -- producción, y abrirla cuando esté — sin que nadie vea las costuras.
  add column if not exists visible boolean not null default true;

comment on column public.community_spaces.solo_admin is
  'Solo la administración abre hilos. Responder sigue siendo de todos.';
comment on column public.community_spaces.visible is
  'En false, el espacio existe pero solo lo ve la administración.';


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  2 · LO QUE UNA NOVEDAD TIENE Y UNA CONVERSACIÓN NO                  ║
-- ╚══════════════════════════════════════════════════════════════════════╝
--
-- Las tres son opcionales y nadie más las usa. Un hilo normal las deja en
-- null y sigue siendo exactamente lo que era.
--
-- ── POR QUÉ EL BOTÓN NO VA DENTRO DEL TEXTO ──────────────────────────────
-- Porque un enlace escrito en el cuerpo es un enlace: se pierde entre los
-- párrafos y en el móvil hay que apuntar con el dedo. Lo que convoca a una
-- reunión es un botón, y para dibujarlo hace falta saber que existe.

alter table public.forum_posts
  -- Cuándo ocurre lo que se anuncia. Con esto, la interfaz puede decir «es
  -- mañana» o «ya pasó» sin que nadie tenga que reescribir el texto.
  add column if not exists evento_at timestamptz,
  -- La zona en que se dijo la hora: 'America/Mexico_City'. Se guarda aparte
  -- porque 11:00 de México es otra hora en Santiago, y quien lo lee necesita
  -- las dos cosas: la original y la suya.
  add column if not exists evento_zona text,
  add column if not exists cta_texto text,
  add column if not exists cta_url text;

comment on column public.forum_posts.evento_at is
  'Cuándo ocurre lo anunciado. Solo lo usan las novedades.';


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  3 · EL ESPACIO, CREADO OCULTO                                       ║
-- ╚══════════════════════════════════════════════════════════════════════╝

insert into public.community_spaces (slug, name, kicker, description, tipo, solo_admin, visible)
values (
  'novedades',
  'Novedades',
  'Lo que viene',
  'Reuniones, directos y avisos. Lo escribe José; aquí se comenta.',
  'global',
  true,
  false      -- ← oculto. Se abre cambiando esto a true (abajo está la línea).
)
on conflict (slug) do update
  set solo_admin = true,
      name       = excluded.name,
      kicker     = excluded.kicker,
      description = excluded.description;
-- Ojo: el `do update` NO toca `visible` a propósito. Volver a correr esta
-- migración después de haber abierto la sección no debe cerrarla otra vez.


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  4 · LA PRIMERA NOVEDAD                                              ║
-- ╚══════════════════════════════════════════════════════════════════════╝
--
-- Se publica a nombre de José. El `user_id` se busca por correo para no
-- pegar aquí un identificador que mañana no signifique nada.

-- La columna del espacio se llama `space_id`. El índice que la usa se llama
-- `forum_posts_espacio_idx`, y por eso es fácil escribir `espacio_id` y que
-- la migración reviente en producción con «column does not exist».
insert into public.forum_posts (
  user_id, author_name, title, body,
  space_id, is_official, last_activity_at,
  evento_at, evento_zona, cta_texto, cta_url
)
select
  u.id,
  'José María',
  'Este domingo nos vemos en vivo',
  E'¡Hola, semilla estelar!\n\n'
  || E'Llegó el momento que estábamos esperando. Este domingo tenemos nuestra primera reunión en vivo de Los 144.000, y queremos que estés.\n\n'
  || E'Va a ser la primera vez que nos encontremos todos al mismo tiempo, cara a cara, desde distintos lugares del mundo. Ven con lo que tengas: preguntas, ganas de escuchar o simplemente presencia.\n\n'
  || E'Vamos a revisar juntos los Objetivos de Los 144.000.\n\n'
  || E'Te sugerimos entrar unos minutos antes para comenzar todos juntos.',
  s.id,
  -- Oficial: la interfaz la distingue sin gritar.
  true,
  -- Lo que ordena la lista es la última actividad, no la fecha de creación.
  -- Sin esto, la primera novedad nacería al final de su propia sección.
  now(),
  -- 15 de noviembre de 2026, 11:00 en Ciudad de México.
  timestamptz '2026-11-15 11:00:00 America/Mexico_City',
  'America/Mexico_City',
  'Unirme a la reunión',
  'https://us02web.zoom.us/j/82919755425'
from auth.users u
cross join public.community_spaces s
where lower(u.email) = lower('bacigalupojose@hotmail.com')   -- ← la cuenta de José
  and s.slug = 'novedades'
  -- Sin esto, correr la migración dos veces publica la reunión dos veces.
  and not exists (
    select 1 from public.forum_posts p
    where p.space_id = s.id
      and p.title = 'Este domingo nos vemos en vivo'
  );


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  COMPROBAR                                                           ║
-- ╚══════════════════════════════════════════════════════════════════════╝

select
  s.name,
  s.solo_admin,
  s.visible,
  count(p.id)                                   as novedades,
  to_char(max(p.evento_at), 'DD/MM/YYYY HH24:MI') as proximo_acto
from public.community_spaces s
left join public.forum_posts p on p.space_id = s.id
where s.slug = 'novedades'
group by s.name, s.solo_admin, s.visible;

-- Tiene que decir: solo_admin = true, visible = false, novedades = 1.


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  CUANDO QUIERAS ABRIRLA AL MUNDO                                     ║
-- ╚══════════════════════════════════════════════════════════════════════╝
--
-- update public.community_spaces set visible = true where slug = 'novedades';
