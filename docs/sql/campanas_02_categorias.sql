-- ════════════════════════════════════════════════════════════════════════════
--  CAMPAÑAS · 2 de 3 · LAS CATEGORÍAS NUEVAS Y EL FRENO QUE LAS ACOMPAÑA
-- ════════════════════════════════════════════════════════════════════════════
--
-- Tres clases de comunicación no caben hoy en la tabla, y las tres son las que
-- hacen falta para lo que se quiere hacer:
--
--   lanzamiento   «algo está por llegar» — se anuncia ANTES de publicarlo
--   recursos      guías, meditaciones, materiales, biblioteca
--   recordatorio  «continúa donde lo dejaste», «hace un mes que no apareces»
--
-- ── POR QUÉ `recordatorio` ES UNA CATEGORÍA Y NO UN TIPO MÁS ────────────────
-- Porque es la única que la persona no ha pedido de ninguna manera. Un aviso
-- de episodio nuevo responde a algo que esa persona está siguiendo; un «vuelve,
-- que te echamos de menos» es una decisión nuestra sobre su tiempo.
--
-- Eso cambia cómo hay que tratarla: necesita su propio interruptor, para que
-- alguien pueda apagar los recordatorios sin perder el aviso de una sesión en
-- vivo. Meterla en «novedades» habría obligado a elegir entre las dos cosas.
--
-- ── Y POR QUÉ ESO ES UNA COLUMNA NUEVA EN email_preferences ────────────────
-- Las cuatro familias que hay —novedades, contenidos, sesiones, red— se
-- corresponden una a una con lo que el miembro ve en su perfil. Colgar los
-- recordatorios de una familia existente sería mentir en esa pantalla: diría
-- «novedades importantes» y estaría apagando también los recordatorios.
--
-- NO DESTRUCTIVO. Amplía dos restricciones y añade una columna con valor por
-- defecto, así que nada de lo que ya existe cambia de comportamiento.

begin;

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  1 · LOS TIPOS NUEVOS                                                ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- El `check` se reemplaza entero: en Postgres no se «añade un valor» a una
-- restricción, se sustituye por otra. Se tira primero para que correr este
-- archivo dos veces no falle.
alter table public.communications
  drop constraint if exists communications_type_check;

alter table public.communications
  add constraint communications_type_check
  check (type in (
    'contenido',     -- episodio, módulo, transmisión, sección, temporada
    'sesion',        -- sesión en vivo
    'activacion',    -- activación
    'encuentro',     -- encuentro de La Red
    'novedades',     -- novedades de La Red
    'especial',      -- comunicación especial
    'lanzamiento',   -- algo que estará disponible próximamente
    'recursos',      -- guías, meditaciones, materiales, biblioteca
    'recordatorio'   -- continuidad y reactivación
  ));

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  2 · EL INTERRUPTOR DE LOS RECORDATORIOS                             ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Empieza encendido, como las otras cuatro: quien no ha tocado nada lo recibe
-- todo, y la fila puede no existir siquiera. Apagarlo es una decisión, no un
-- estado por defecto.
alter table public.email_preferences
  add column if not exists recordatorios boolean not null default true;

comment on column public.email_preferences.recordatorios is
  'Avisos de continuidad y reactivacion. Es lo mas prescindible: su propio interruptor.';

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  3 · ATAR CADA ENVÍO A SU CAMPAÑA                                    ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- `push_envios` guardaba el título y la hora, y con eso la única forma de saber
-- qué pasó con una campaña concreta era buscar por texto y cruzar los dedos:
-- dos campañas con el mismo título se mezclaban, y un título corregido entre
-- dos envíos las separaba sin motivo.
--
-- Nulo para todo lo que no viene de una campaña: un mensaje privado o una
-- insignia también se apuntan aquí y no pertenecen a ninguna.
alter table public.push_envios
  add column if not exists communication_id uuid
    references public.communications(id) on delete set null;

-- Cuándo tocó el aviso, si lo tocó.
--
-- ── POR QUÉ ESTO SÍ SE PUEDE MEDIR Y LA ENTREGA NO ─────────────────────────
-- El servicio de push responde «aceptado», no «entregado»: de ahí en adelante
-- no informa de nada. Pero el toque ocurre en nuestro propio trabajador de
-- servicio, que puede avisarnos. Es el único dato de verdad que hay después
-- del envío, y por eso es el que se guarda.
alter table public.push_envios
  add column if not exists clic_at timestamptz;

-- ── LOS DOS ÍNDICES, Y QUÉ CONSULTA SOSTIENE CADA UNO ──────────────────────
-- Por campaña: la pantalla de resultados.
create index if not exists push_envios_por_comunicacion_idx
  on public.push_envios (communication_id, created_at desc)
  where communication_id is not null;

-- Por persona y fecha: el control de frecuencia, que se pregunta ANTES de cada
-- envío masivo —«¿a quién le mandamos algo esta semana?»— y sin índice sería
-- recorrer la tabla entera cada vez.
create index if not exists push_envios_por_persona_idx
  on public.push_envios (user_id, created_at desc);

commit;

-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='email_preferences'
      and column_name='recordatorios')                                as interruptor,
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='push_envios'
      and column_name in ('communication_id','clic_at'))              as columnas_push,
  (select count(*) from public.communications)                        as comunicaciones_intactas;

-- ── CÓMO DESHACERLO ────────────────────────────────────────────────────────
--   drop index if exists public.push_envios_por_comunicacion_idx;
--   drop index if exists public.push_envios_por_persona_idx;
--   alter table public.push_envios drop column if exists clic_at;
--   alter table public.push_envios drop column if exists communication_id;
--   alter table public.email_preferences drop column if exists recordatorios;
--   -- Y el check, de vuelta a los seis tipos de siempre. Ojo: si ya hay
--   -- comunicaciones de los tipos nuevos, esto falla hasta que se borren o se
--   -- cambien de tipo. Es a propósito: perder una comunicación enviada es
--   -- perder la prueba de qué se dijo.
--   alter table public.communications drop constraint if exists communications_type_check;
--   alter table public.communications add constraint communications_type_check
--     check (type in ('contenido','sesion','activacion','encuentro','novedades','especial'));
