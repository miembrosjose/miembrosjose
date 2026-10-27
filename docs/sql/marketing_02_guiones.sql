-- ════════════════════════════════════════════════════════════════════════════
--  CENTRO DE ORGANIZACIÓN · 2 de 3 · guiones y aprobaciones
-- ════════════════════════════════════════════════════════════════════════════
--
-- ── POR QUÉ UNA TABLA APARTE Y NO UNA ACTIVIDAD MÁS ────────────────────────
-- Un guion no es una tarea con fecha: es un TEXTO que va y viene. Se propone,
-- se escribe, se devuelve con observaciones, se corrige y se aprueba. Tiene
-- diez campos propios —gancho, objetivo, idea visual— y una conversación
-- encima.
--
-- Meterlo en `mkt_actividades` habría significado diez columnas que están
-- vacías en el 90 % de las filas, y un estado que significa una cosa para un
-- reel y otra distinta para una reunión.
--
-- Lo que sí comparten es el calendario: un guion puede apuntar a la actividad
-- que lo va a publicar. Esa es la única relación, y es opcional.
--
-- ── EL BANCO DE IDEAS NO ES OTRO MÓDULO ────────────────────────────────────
-- Una idea es un guion que todavía no se ha escrito. Vive aquí con
-- `estado = 'idea'`, con su título, su formato y su motivo, y el día que se
-- decide desarrollarla no se copia a ningún sitio: cambia de estado.
--
-- Un «banco» aparte habría obligado a convertir una cosa en otra, que es
-- donde se pierden las ideas.

begin;

create table if not exists public.mkt_guiones (
  id uuid primary key default gen_random_uuid(),

  titulo text not null,

  formato text not null default 'reel'
    check (formato in ('reel', 'carrusel', 'historias', 'transmision', 'otro')),

  -- Dónde acaba: fuera o dentro. En el banco de ideas es la pregunta
  -- «¿público o privado?».
  ambito text not null default 'publico'
    check (ambito in ('publico', 'miembros')),

  -- ── EL RECORRIDO ────────────────────────────────────────────────────────
  --   idea        anotada, sin escribir. El banco de propuestas.
  --   desarrollo  Regi está escribiéndolo, o corrigiendo observaciones.
  --   revision    entregado. Está esperando al dueño. ESTE es el estado que
  --               se cuenta arriba: «tienes 3 guiones por aprobar».
  --   aprobado    listo para publicarse.
  --   publicado   ya salió.
  --
  -- Pedir cambios no es un estado: es volver a `desarrollo` dejando una
  -- observación. Un estado «rechazado» habría sido un callejón sin salida,
  -- y lo que de verdad pasa es que el guion sigue vivo y se corrige.
  estado text not null default 'idea'
    check (estado in ('idea', 'desarrollo', 'revision', 'aprobado', 'publicado')),

  -- ── LO QUE SE ESCRIBE ───────────────────────────────────────────────────
  -- Todo opcional menos el título: una idea recién anotada no tiene gancho ni
  -- guion, y obligar a rellenarlos sería obligar a no anotarla.
  tema text not null default '',         -- de qué va, o qué lo motiva
  objetivo text not null default '',     -- qué queremos que pase al verlo
  gancho text not null default '',       -- los primeros tres segundos
  guion text not null default '',        -- el texto, o la escaleta
  idea_visual text not null default '',  -- qué se ve mientras se oye

  -- El tema del mes, escrito igual que en las actividades. Es lo que ata un
  -- reel público con la meditación privada de esa semana.
  campana text not null default '',

  fecha_entrega date,       -- cuándo se compromete a entregarlo
  fecha_publicacion date,   -- cuándo saldría

  responsable_id uuid references auth.users(id) on delete set null,

  -- La actividad del calendario que lo publicará. Opcional: un guion puede
  -- existir antes de tener hueco.
  --
  -- `set null` y no `cascade`: si se borra la actividad del calendario, el
  -- guion NO se borra. Es trabajo escrito y se reprograma; perderlo porque
  -- alguien movió una fecha sería imperdonable.
  actividad_id uuid references public.mkt_actividades(id) on delete set null,

  -- [{ "autor_id": "...", "autor": "José María", "texto": "...", "fecha": "..." }]
  --
  -- ── POR QUÉ LOS COMENTARIOS VAN AQUÍ Y NO EN SU TABLA ──────────────────
  -- Porque son una conversación corta —dos personas, unas pocas líneas— que
  -- solo se lee junto al guion y nunca por separado. Una tabla aparte habría
  -- añadido una consulta a cada lectura para traer tres filas.
  --
  -- El nombre del autor se guarda copiado a propósito: así un comentario de
  -- hace tres meses sigue diciendo quién lo escribió aunque esa cuenta ya no
  -- exista.
  comentarios jsonb not null default '[]'::jsonb,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- La pregunta de la cabecera: «¿cuántos tengo por aprobar?». Es la consulta
-- que se hace en cada carga de la pantalla.
create index if not exists mkt_guiones_estado_idx
  on public.mkt_guiones (estado, fecha_entrega);

create index if not exists mkt_guiones_actividad_idx
  on public.mkt_guiones (actividad_id)
  where actividad_id is not null;

-- Igual que las actividades: RLS activo y ninguna política. Aquí hay guiones
-- sin publicar. Solo entran las rutas de administración.
alter table public.mkt_guiones enable row level security;

drop trigger if exists mkt_guiones_updated_at on public.mkt_guiones;
create trigger mkt_guiones_updated_at
  before update on public.mkt_guiones
  for each row execute function public.mkt_tocar_updated_at();

commit;

-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.tables
    where table_schema='public' and table_name='mkt_guiones')  as tabla_creada,
  (select count(*) from information_schema.triggers
    where event_object_table='mkt_guiones')                    as disparador,
  (select count(*) from public.mkt_guiones)                    as guiones;

-- `tabla_creada` y `disparador` tienen que dar 1. Si `disparador` da 0, es
-- que falta correr antes marketing_01_actividades.sql, que es donde se crea
-- la función que lo alimenta.

-- ── CÓMO DESHACERLO ────────────────────────────────────────────────────────
--   drop table if exists public.mkt_guiones;
