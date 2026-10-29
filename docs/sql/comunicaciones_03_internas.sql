-- ════════════════════════════════════════════════════════════════════════════
--  COMUNICACIONES DENTRO DE LA PLATAFORMA · avisos, respuestas y modo código
-- ════════════════════════════════════════════════════════════════════════════
--
-- NO SE HA EJECUTADO. Léelo entero antes de correrlo.
--
-- Es idempotente: correrlo dos veces no rompe nada ni duplica nada.
-- Va todo en una transacción: o entra entero, o no entra nada.
--
-- ── QUÉ RESUELVE ───────────────────────────────────────────────────────────
--
--   1. Que una comunicación pueda ir por VARIOS canales a la vez: dentro de
--      la plataforma, por correo, o las dos cosas.
--
--   2. Que se sepa quién la ha leído SIN crear una fila por miembro al
--      publicarla. Con 144.000 miembros, publicar un aviso no puede escribir
--      144.000 filas.
--
--   3. Que un aviso pueda mostrarse UNA SOLA VEZ como ventana que bloquea, y
--      que eso quede registrado en el servidor y no en el navegador.
--
--   4. Que ese aviso llegue solo a quien ya existía cuando se publicó, y no
--      a quien entre dentro de seis meses.
--
--   5. Que un correo pueda escribirse en HTML a mano, además de con el
--      formulario de siempre.
--
--   6. Que en el foro se pueda responder a un comentario.
--
-- ── LO QUE NO HACE ─────────────────────────────────────────────────────────
-- No borra nada. No toca ninguna fila existente salvo para rellenar el canal
-- nuevo con el que ya tenían. No cambia ninguna política de seguridad que ya
-- funcione.

begin;

-- ═══════════════════════════════════════════════════════════════════════════
--  1 · VARIOS CANALES POR COMUNICACIÓN
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── POR QUÉ UNA LISTA Y NO OTRA COLUMNA BOOLEANA ──────────────────────────
-- Había `canal text` con un solo valor. Lo obvio sería añadir
-- `tambien_interno boolean`, pero entonces «por dónde va esto» se contesta
-- mirando dos columnas y combinándolas, y el día que aparezca un tercer canal
-- habrá que añadir una tercera. Una lista contesta la pregunta de una vez.
--
-- `canal` NO se borra. Se sigue rellenando con el primer elemento, porque
-- puede quedar alguna consulta que lo use y una columna de más no hace daño;
-- una consulta que de pronto lee null, sí.

alter table public.communications
  add column if not exists canales text[] not null default '{}';

-- Rellenar desde lo que ya había. Solo las que están vacías: correrlo dos
-- veces no pisa lo que alguien haya cambiado después.
update public.communications
set canales = array[coalesce(nullif(canal, ''), 'email')]
where canales = '{}' or canales is null;

-- ── EL CÓDIGO VIEJO SIGUE INSERTANDO SIN `canales` ────────────────────────
--
-- Esto es lo que hace que correr este archivo sea seguro ANTES de desplegar.
-- Lo que hay ahora mismo en producción escribe `canal` y no sabe que existe
-- `canales`: sin este disparador, cada comunicación nueva nacería con la
-- lista vacía, y con la restricción de abajo puesta dejaría de poder
-- crearse ninguna.
--
-- El disparador la rellena desde `canal`, que es exactamente lo que el
-- código viejo quería decir. Cuando se despliegue el nuevo, que sí manda la
-- lista, el disparador ve que ya viene llena y no toca nada.
--
-- ── Y POR QUÉ NO BASTA CON EL `default` ───────────────────────────────────
-- Porque un valor por defecto es el mismo para todas, y aquí depende de la
-- fila: una comunicación de `canal = 'push'` tiene que nacer con ['push'],
-- no con ['email']. El defecto no puede mirar las otras columnas.

create or replace function public.mkt_canales_desde_canal()
returns trigger
language plpgsql
-- `search_path` fijado: es la misma precaución que se tomó en la auditoría
-- de seguridad para el resto de funciones del proyecto.
set search_path = public, pg_temp
as $$
begin
  if new.canales is null or array_length(new.canales, 1) is null then
    new.canales := array[coalesce(nullif(new.canal, ''), 'email')];
  end if;
  return new;
end;
$$;

drop trigger if exists communications_canales_trg on public.communications;
create trigger communications_canales_trg
  before insert or update on public.communications
  for each row execute function public.mkt_canales_desde_canal();

alter table public.communications
  drop constraint if exists communications_canales_validos;

-- ── POR QUÉ `coalesce` Y NO `array_length(...) >= 1` A SECAS ──────────────
-- Porque `array_length('{}', 1)` no devuelve 0: devuelve NULL. Y una
-- restricción `check` que da NULL PASA — Postgres solo rechaza cuando da
-- `false`. Escrita de la forma obvia, esta restricción habría dejado entrar
-- justo lo único que pretendía impedir, y nadie se habría enterado hasta
-- encontrar una comunicación que no se puede enviar por ningún sitio.
alter table public.communications
  add constraint communications_canales_validos check (
    coalesce(array_length(canales, 1), 0) >= 1
    and canales <@ array['email', 'push', 'interno']::text[]
  );

-- La pantalla pregunta «¿qué hay para este canal?». Con una lista eso es un
-- operador de contención, y sin índice GIN recorre la tabla entera.
create index if not exists communications_canales_idx
  on public.communications using gin (canales);


-- ═══════════════════════════════════════════════════════════════════════════
--  2 · LO QUE SE VE DENTRO DE LA PLATAFORMA
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── POR QUÉ CAMPOS APARTE Y NO LOS DEL CORREO ─────────────────────────────
-- Porque un asunto de correo y un titular dentro de la plataforma no se
-- escriben igual: el asunto compite en una bandeja de entrada, el titular ya
-- tiene la atención de quien lo lee.
--
-- Todos admiten nulo, y cuando lo son se cae al campo del correo. Así, marcar
-- «también dentro de la plataforma» en una comunicación ya escrita no obliga
-- a reescribir nada.

alter table public.communications
  add column if not exists interno_titulo    text,
  add column if not exists interno_cuerpo    text,
  add column if not exists interno_cta_text  text,
  add column if not exists interno_cta_url   text,
  add column if not exists interno_image_url text;

-- ── CÓMO SE PRESENTA ───────────────────────────────────────────────────────
--
--   feed        aparece en el centro de avisos y espera a que la abran.
--   modal_once  interrumpe UNA vez: ventana que bloquea hasta que se cierra.
--
-- `modal_once` es para lo que de verdad no puede pasarse por alto. Si todo
-- fuera modal, dejaría de interrumpir a nadie: se cierra sin leer.
alter table public.communications
  add column if not exists display_mode text not null default 'feed';

alter table public.communications
  drop constraint if exists communications_display_mode_valido;

alter table public.communications
  add constraint communications_display_mode_valido
  check (display_mode in ('feed', 'modal_once'));

-- ── HASTA DÓNDE LLEGA ──────────────────────────────────────────────────────
-- Solo lo ven las cuentas creadas ANTES de este instante.
--
-- Es lo que impide que quien se registre dentro de seis meses se encuentre
-- con el anuncio de Telegram de hoy. Nulo = lo ve todo el mundo, también
-- quien llegue después, que es lo normal para un aviso corriente.
alter table public.communications
  add column if not exists audiencia_hasta timestamptz;

-- Cuándo se publicó hacia dentro. Es distinto de `sent_at`, que es cuándo
-- salió el correo: una comunicación puede ir solo por dentro y no enviar
-- ningún correo nunca.
alter table public.communications
  add column if not exists published_at timestamptz;

create index if not exists communications_internas_idx
  on public.communications (published_at desc)
  where published_at is not null;


-- ═══════════════════════════════════════════════════════════════════════════
--  3 · QUIÉN LA HA LEÍDO
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── POR QUÉ NO HAY UNA FILA POR MIEMBRO AL PUBLICAR ───────────────────────
-- Porque publicar un aviso escribiría una fila por cada miembro elegible, y
-- el día que sean 144.000 eso es una tabla que crece 144.000 filas por aviso.
-- La mayoría de esas filas no diría nada: «no leído» es la ausencia de
-- noticia, no un dato que haya que guardar.
--
-- Así que la fila nace cuando la persona INTERACTÚA. Sin fila = sin leer.
-- Los no leídos se cuentan restando, que es barato con el índice de abajo.
--
-- ── POR QUÉ LEER Y CERRAR SON LA MISMA TABLA ──────────────────────────────
-- Para la ventana que bloquea, «cerrarla» ES haberla leído: no hay nada más
-- que hacer con ella. Dos tablas para el mismo hecho se desincronizan, y
-- entonces hay que decidir cuál manda.

create table if not exists public.communication_reads (
  communication_id uuid not null
    references public.communications(id) on delete cascade,

  user_id uuid not null
    references auth.users(id) on delete cascade,

  read_at timestamptz not null default now(),

  -- Cómo se cerró. Sirve para saber si el enlace de Telegram funcionó, sin
  -- montar analítica aparte: 'abierta' (la leyó), 'cerrada' (cerró la
  -- ventana), 'cta' (pulsó el botón).
  via text not null default 'abierta' check (via in ('abierta', 'cerrada', 'cta')),

  primary key (communication_id, user_id)
);

-- «¿Qué tengo yo sin leer?» es la consulta de cada carga de página.
create index if not exists communication_reads_user_idx
  on public.communication_reads (user_id, read_at desc);

alter table public.communication_reads enable row level security;

-- ── LAS POLÍTICAS ──────────────────────────────────────────────────────────
-- Cada cual ve y marca lo suyo, y nada más. El panel lee los recuentos con
-- la llave de servicio, que se salta RLS: no hace falta una política de
-- administración, y no tenerla evita que un fallo de la bandera `is_admin`
-- abra la tabla entera.

drop policy if exists "lecturas propias" on public.communication_reads;
create policy "lecturas propias"
  on public.communication_reads for select
  using (auth.uid() = user_id);

drop policy if exists "marcar lo propio" on public.communication_reads;
create policy "marcar lo propio"
  on public.communication_reads for insert
  with check (auth.uid() = user_id);

-- Sin update ni delete a propósito: una vez leída, leída. Permitir borrar la
-- marca sería permitir que la ventana que bloquea vuelva a salir.


-- ═══════════════════════════════════════════════════════════════════════════
--  4 · CORREOS ESCRITOS A MANO
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── POR QUÉ UNA COLUMNA Y NO OTRA TABLA ───────────────────────────────────
-- Porque es el mismo correo, escrito de otra manera. La comunicación sigue
-- teniendo su asunto, su preencabezado, su audiencia y su estado; lo único
-- que cambia es de dónde sale el cuerpo.
--
--   visual   lo dibuja `renderCorreo` con los campos del formulario.
--   codigo   sale de `email_html`, tal cual, después de limpiarlo.
--
-- El HTML se guarda SIN limpiar y se limpia al dibujarlo. Guardar lo limpio
-- destruiría el original: si mañana mejora el saneador, lo que ya está
-- guardado no se recupera.
alter table public.communications
  add column if not exists email_modo text not null default 'visual';

alter table public.communications
  drop constraint if exists communications_email_modo_valido;

alter table public.communications
  add constraint communications_email_modo_valido
  check (email_modo in ('visual', 'codigo'));

alter table public.communications
  add column if not exists email_html text;


-- ── PLANTILLAS GUARDADAS ───────────────────────────────────────────────────
-- Unas pocas de partida, más las que alguien quiera guardar. No veinte: una
-- biblioteca de plantillas que nadie poda acaba siendo un cajón donde no se
-- encuentra la que sirve.

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),

  nombre text not null,
  descripcion text not null default '',

  -- De qué va, para agruparlas. Coincide con las familias que ya existen en
  -- lib/comunicaciones/tipos.ts.
  familia text not null default 'especial',

  html text not null,

  -- Las que vienen de fábrica no se pueden borrar desde la pantalla: son el
  -- punto de partida, y recuperarlas exigiría volver a correr este archivo.
  es_base boolean not null default false,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists email_templates_nombre_idx
  on public.email_templates (lower(nombre));

alter table public.email_templates enable row level security;
-- Sin políticas: solo la llave de servicio entra. Las plantillas son cosa de
-- administración, y el navegador de un miembro no tiene nada que hacer aquí.


-- ═══════════════════════════════════════════════════════════════════════════
--  5 · RESPONDER A UN COMENTARIO
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── POR QUÉ UNA COLUMNA Y NO UNA TABLA DE RESPUESTAS ──────────────────────
-- Porque una respuesta a un comentario ES un comentario: tiene el mismo
-- autor, el mismo cuerpo, los mismos «me gusta», la misma moderación y las
-- mismas denuncias. Una tabla aparte obligaría a duplicar las cinco cosas y
-- a decidir en cada pantalla cuál de las dos mirar.
--
-- ── POR QUÉ `on delete cascade` ───────────────────────────────────────────
-- Si se borra un comentario, sus respuestas se van con él. La alternativa
-- —dejarlas huérfanas— deja en pantalla respuestas a algo que ya no está,
-- que es peor que no verlas.
alter table public.forum_replies
  add column if not exists parent_reply_id uuid
    references public.forum_replies(id) on delete cascade;

-- Pintar un hilo es: traer las de primer nivel, y traer sus respuestas.
create index if not exists forum_replies_parent_idx
  on public.forum_replies (parent_reply_id, created_at)
  where parent_reply_id is not null;

create index if not exists forum_replies_post_raiz_idx
  on public.forum_replies (post_id, created_at)
  where parent_reply_id is null;


-- ═══════════════════════════════════════════════════════════════════════════
--  6 · UN BOTÓN QUE HACE ALGO AQUÍ DENTRO
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── POR QUÉ NO BASTA CON `interno_cta_url` ────────────────────────────────
-- Para Telegram no hay ninguna dirección que se pueda escribir. La del grupo
-- la fabrica la Edge Function `telegram-link-start` a nombre de quien la
-- pide, y caduca: una fija saltaría la comprobación de suscripción, y una
-- personal no cabe en una comunicación que leen setenta personas distintas.
--
-- Así que el botón no lleva a ningún sitio. Le pide al botón flotante que ya
-- existe que haga lo que ya sabe hacer.
--
-- ── POR QUÉ UNA LISTA CERRADA Y NO TEXTO LIBRE ────────────────────────────
-- Porque esto lo acaba rellenando una pantalla de administración, y un campo
-- de texto libre que el navegador convierte en una llamada es la puerta por
-- la que entra lo que nadie previó. Si algún día hay una segunda acción, se
-- añade aquí y se añade en el componente: dos sitios, los dos a la vista.

alter table public.communications
  add column if not exists interno_cta_accion text;

alter table public.communications
  drop constraint if exists communications_interno_cta_accion_valida;

alter table public.communications
  add constraint communications_interno_cta_accion_valida check (
    interno_cta_accion is null or interno_cta_accion in ('telegram')
  );


commit;


-- ════════════════════════════════════════════════════════════════════════════
--  COMPROBACIÓN · no cambia nada, solo mira
-- ════════════════════════════════════════════════════════════════════════════

select
  exists (select 1 from information_schema.columns
    where table_schema='public' and table_name='communications'
      and column_name='canales')                          as ok_canales,

  exists (select 1 from information_schema.columns
    where table_schema='public' and table_name='communications'
      and column_name='display_mode')                     as ok_display_mode,

  exists (select 1 from information_schema.columns
    where table_schema='public' and table_name='communications'
      and column_name='audiencia_hasta')                  as ok_cutoff,

  exists (select 1 from information_schema.columns
    where table_schema='public' and table_name='communications'
      and column_name='email_html')                       as ok_modo_codigo,

  to_regclass('public.communication_reads') is not null   as ok_lecturas,
  to_regclass('public.email_templates')     is not null   as ok_plantillas,

  exists (select 1 from information_schema.columns
    where table_schema='public' and table_name='forum_replies'
      and column_name='parent_reply_id')                  as ok_respuestas,

  -- El disparador que rellena `canales` cuando quien escribe no la manda.
  -- Es lo que permite que esto se corra ANTES de desplegar el código nuevo.
  exists (select 1 from pg_trigger
    where tgname = 'communications_canales_trg'
      and tgrelid = 'public.communications'::regclass)    as ok_disparador,

  -- Ninguna comunicación puede quedarse sin canal: si esto no da 0, el
  -- relleno de arriba no llegó a correr.
  (select count(*) from public.communications
    where canales = '{}' or canales is null)              as sin_canal;

-- Todas las `ok_*` tienen que dar true y `sin_canal` tiene que dar 0.
