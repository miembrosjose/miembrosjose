-- ════════════════════════════════════════════════════════════════════════════
--  CENTRO DE ORGANIZACIÓN · 1 de 3 · el calendario
-- ════════════════════════════════════════════════════════════════════════════
--
-- ── UNA SOLA TABLA PARA EL CALENDARIO Y PARA LOS CHECKLISTS ────────────────
-- Parecen dos cosas y son la misma. «El checklist de la semana del 2 al 8» no
-- es una lista aparte: son las actividades cuya fecha cae en esa semana.
--
-- Tenerlas separadas habría significado mantenerlas sincronizadas —crear una
-- tarea al crear una actividad, borrarla al borrarla, cambiarla al
-- reprogramar— y el primer despiste deja el checklist diciendo una cosa y el
-- calendario otra. Con una tabla eso no puede pasar.
--
-- ── Y TAMBIÉN GUARDA LAS EFEMÉRIDES ────────────────────────────────────────
-- Una luna llena o un solsticio son algo con fecha que hay que ver en el
-- calendario, pero NO son una tarea: nadie tiene que hacerlas. Van aquí con
-- `es_referencia = true`, salen en gris y no cuentan para el cumplimiento.
--
-- Eso es lo que las convierte en un banco de posibilidades y no en una
-- obligación: están a la vista cuando se planifica el mes, y si ese mes no se
-- hace nada con ellas, no aparecen como pendientes ni bajan ningún porcentaje.

begin;

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  1 · QUIÉN APRUEBA                                                   ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- ── POR QUÉ UN CAMPO Y NO UN SISTEMA DE ROLES ──────────────────────────────
-- Las dos listas de permisos del encargo se solapan casi enteras. La única
-- diferencia real es quién aprueba los guiones y quién cambia las
-- frecuencias. Para una diferencia, un campo.
--
-- Un sistema de roles para dos personas es una pantalla de administración más
-- que mantener, y nadie la va a tocar nunca.
alter table public.profiles
  add column if not exists es_propietario boolean not null default false;

comment on column public.profiles.es_propietario is
  'Aprueba guiones y cambia las frecuencias. Solo el dueno de la plataforma.';

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  2 · LAS ACTIVIDADES                                                 ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create table if not exists public.mkt_actividades (
  id uuid primary key default gen_random_uuid(),

  titulo text not null,

  -- Qué clase de cosa es. Texto con lista cerrada y no un enum: añadir una
  -- categoría no debería exigir un ALTER TYPE con la tabla bloqueada.
  categoria text not null check (categoria in (
    'reel', 'carrusel', 'historias',      -- redes
    'guion',                              -- la entrega de un guion
    'contenido_miembros',                 -- lo exclusivo de la plataforma
    'correo', 'notificacion',             -- se ENVÍAN desde Comunicaciones
    'comunidad',                          -- dinámicas y participación
    'transmision', 'protocolo',           -- experiencias en vivo
    'reunion', 'resultados',              -- trabajo interno
    'efemeride',                          -- luna llena, solsticio, signo…
    'otra'
  )),

  -- Dónde se ve: fuera, dentro, o en ningún sitio porque es trabajo nuestro.
  -- Sirve para la pregunta «¿estamos coordinando lo público con lo privado?».
  ambito text not null default 'interno'
    check (ambito in ('publico', 'miembros', 'interno')),

  -- ── EL EJE EDITORIAL ────────────────────────────────────────────────────
  -- Atracción 40 / conocimiento 25 / comunidad 20 / membresía 15. No se
  -- fuerza nada: se guarda para poder CONTAR si el mes está equilibrado.
  -- Nulo mientras no se decida, que es lo normal al crear la actividad.
  eje text check (eje in ('atraccion', 'conocimiento', 'comunidad', 'membresia')),

  -- El tema del mes, en texto libre: «El contacto extraterrestre».
  -- Es lo que ata un reel público con la meditación privada de esa semana.
  campana text not null default '',

  -- ── LAS DOS FECHAS, Y POR QUÉ SON DOS ───────────────────────────────────
  -- `fecha` es cuándo ocurre: el día que se publica, se envía o se transmite.
  -- `fecha_entrega` es cuándo tiene que estar listo, que casi siempre es
  -- antes. Con una sola, o se pierde de vista la entrega o se pierde de vista
  -- la publicación, y el trabajo por anticipado deja de poder planificarse.
  fecha date not null,
  fecha_entrega date,

  -- 'atrasada' NO está aquí a propósito: se deduce de estar pendiente con la
  -- fecha pasada. Guardarla exigiría un proceso que las fuera marcando cada
  -- noche, y el día que ese proceso fallara la pantalla mentiría.
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'en_curso', 'hecha', 'cancelada')),

  -- Nulo = sin asignar. No hay un valor «los dos» porque una tarea de dos no
  -- es de nadie: si hace falta, se crean dos.
  responsable_id uuid references auth.users(id) on delete set null,

  notas text not null default '',

  -- [{ "titulo": "...", "url": "..." }]
  enlaces jsonb not null default '[]'::jsonb,

  -- [{ "texto": "...", "hecha": false }]
  -- El checklist PROPIO de una actividad: los catorce pasos de un protocolo
  -- de contacto, por ejemplo. No se confunde con el checklist de la semana,
  -- que son las actividades mismas.
  checklist jsonb not null default '[]'::jsonb,

  -- Está en el calendario pero nadie tiene que hacerlo. Ver la cabecera.
  es_referencia boolean not null default false,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- La consulta de la pantalla es siempre «qué hay entre estas dos fechas».
create index if not exists mkt_actividades_fecha_idx
  on public.mkt_actividades (fecha);

-- «Qué tiene que hacer Regi esta semana» y «qué está atrasado».
create index if not exists mkt_actividades_responsable_idx
  on public.mkt_actividades (responsable_id, fecha)
  where estado <> 'hecha' and not es_referencia;

-- ── POR QUÉ LA TABLA NO TIENE NI UNA POLÍTICA ──────────────────────────────
-- Con RLS activo y sin políticas, nadie puede leerla con una sesión normal.
-- Solo la clave de servicio, que es la que usan las rutas de administración
-- después de comprobar el permiso.
--
-- Es a propósito: aquí dentro hay guiones sin publicar, fechas sin anunciar y
-- la planificación entera del negocio. Un miembro no tiene por qué poder
-- pedirla, ni siquiera por accidente.
alter table public.mkt_actividades enable row level security;

-- Que `updated_at` diga la verdad sin que haya que acordarse de ponerlo en
-- cada escritura.
create or replace function public.mkt_tocar_updated_at()
returns trigger language plpgsql
set search_path = public
as $fn$
begin
  new.updated_at := now();
  return new;
end $fn$;

drop trigger if exists mkt_actividades_updated_at on public.mkt_actividades;
create trigger mkt_actividades_updated_at
  before update on public.mkt_actividades
  for each row execute function public.mkt_tocar_updated_at();

commit;

-- ════════════════════════════════════════════════════════════════════════════
--  EL DUEÑO
-- ════════════════════════════════════════════════════════════════════════════
-- Sin esto nadie puede aprobar nada. Cámbialo si el correo no es ese.
update public.profiles p
set es_propietario = true
from auth.users u
where u.id = p.id
  and lower(u.email) = lower('jos.bacigalupo@gmail.com');

-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.tables
    where table_schema='public' and table_name='mkt_actividades')     as tabla_creada,
  (select count(*) from public.profiles where es_propietario)         as propietarios,
  (select count(*) from public.profiles where is_admin)               as administradores,
  (select count(*) from public.mkt_actividades)                       as actividades;

-- `propietarios` tiene que dar 1 y `administradores` 2. Si propietarios da 0,
-- el correo de arriba no coincide con ninguna cuenta.

-- ── CÓMO DESHACERLO ────────────────────────────────────────────────────────
--   drop trigger if exists mkt_actividades_updated_at on public.mkt_actividades;
--   drop function if exists public.mkt_tocar_updated_at();
--   drop table if exists public.mkt_actividades;
--   alter table public.profiles drop column if exists es_propietario;
