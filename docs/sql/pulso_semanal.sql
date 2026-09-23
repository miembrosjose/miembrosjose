-- ============================================================================
-- PULSO 144 — el ritual semanal  [PENDIENTE DE EJECUTAR]
-- ============================================================================
--
-- QUÉ HACE
--   Crea DOS tablas nuevas y siembra los primeros pulsos. No modifica ninguna
--   tabla existente, no toca `profiles`, `forum_posts` ni `feed_posts`.
--
-- QUÉ ES
--   Una pregunta por semana. Se publica, la comunidad responde, y la semana
--   siguiente hay otra. Es lo que hace que alguien vuelva: algo cambió desde
--   la última vez, y no lo cambió él.
--
-- DISEÑADO PARA EMPEZAR VACÍO
--   Hoy no hay usuarios. Un contador que diga "0 personas han participado"
--   comunica que esto está muerto, así que la interfaz NO muestra números
--   cuando no hay nadie: muestra una invitación. La pregunta de la semana
--   funciona igual para una persona sola que para cincuenta.
--
-- CÓMO APLICARLO
--   Supabase → SQL Editor → Run. Idempotente.
--
-- CÓMO DESHACERLO
--   drop table if exists public.pulso_respuestas;
--   drop table if exists public.pulso_semanal;
-- ============================================================================


-- ── La pregunta de cada semana ──────────────────────────────────────────────
create table if not exists public.pulso_semanal (
  id uuid primary key default gen_random_uuid(),

  -- Número de semana visible ("Semana 12"). Lo decide quien publica.
  numero int not null,

  -- El titular grande. Es la pregunta.
  pregunta text not null,

  -- El párrafo que la acompaña y da contexto.
  invitacion text not null default '',

  -- Meditación o práctica asociada, si la hay. Opcional a propósito: no todas
  -- las semanas tienen que traer audio.
  practica_titulo text,
  practica_url text,
  practica_duracion text,

  -- Cuándo empieza a estar activa. La activa es la más reciente cuya fecha ya
  -- pasó: así se pueden dejar varias preparadas y rotan solas, sin que nadie
  -- tenga que entrar un lunes a publicarlas.
  inicia_en date not null,

  -- Cuántos días dura. Siete por defecto.
  dias int not null default 7,

  creado_en timestamptz not null default now()
);

create index if not exists pulso_semanal_inicia_idx
  on public.pulso_semanal (inicia_en desc);

comment on table public.pulso_semanal is
  'Pulso 144: la pregunta semanal. La activa es la más reciente ya iniciada.';


-- ── Lo que responde la gente ────────────────────────────────────────────────
create table if not exists public.pulso_respuestas (
  id uuid primary key default gen_random_uuid(),
  pulso_id uuid not null references public.pulso_semanal(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  cuerpo text not null,

  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  -- Una respuesta por persona y semana. Quien quiera cambiar la suya, la edita:
  -- el pulso es una observación de la semana, no un hilo de mensajes.
  unique (pulso_id, user_id)
);

create index if not exists pulso_respuestas_pulso_idx
  on public.pulso_respuestas (pulso_id, creado_en desc);


-- ── Seguridad ───────────────────────────────────────────────────────────────
alter table public.pulso_semanal enable row level security;
alter table public.pulso_respuestas enable row level security;

-- La pregunta de la semana la ve cualquier miembro con sesión. Publicarla es
-- cosa de la administración, y eso pasa por la API con service_role.
drop policy if exists "pulso_semanal_lectura" on public.pulso_semanal;
create policy "pulso_semanal_lectura"
  on public.pulso_semanal for select
  to authenticated
  using (true);

-- Las respuestas las lee todo el mundo: leerse entre miembros es el punto.
drop policy if exists "pulso_respuestas_lectura" on public.pulso_respuestas;
create policy "pulso_respuestas_lectura"
  on public.pulso_respuestas for select
  to authenticated
  using (true);

-- Pero cada quien solo escribe la suya.
drop policy if exists "pulso_respuestas_insert_propia" on public.pulso_respuestas;
create policy "pulso_respuestas_insert_propia"
  on public.pulso_respuestas for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "pulso_respuestas_update_propia" on public.pulso_respuestas;
create policy "pulso_respuestas_update_propia"
  on public.pulso_respuestas for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "pulso_respuestas_delete_propia" on public.pulso_respuestas;
create policy "pulso_respuestas_delete_propia"
  on public.pulso_respuestas for delete
  to authenticated
  using (auth.uid() = user_id);


-- ── Permisos de tabla ───────────────────────────────────────────────────────
-- RLS y GRANT son capas distintas y las dos tienen que dar permiso. Este
-- proyecto endureció los privilegios por defecto (ver rls_hardening.sql), así
-- que no se pueden dar por supuestos: se declaran.
grant select on public.pulso_semanal to authenticated;
grant select, insert, update, delete on public.pulso_respuestas to authenticated;
revoke all on public.pulso_semanal from anon;
revoke all on public.pulso_respuestas from anon;


-- ── Primeros pulsos ─────────────────────────────────────────────────────────
-- Tres, para que la rotación exista desde el primer día y no haya que entrar
-- cada lunes. Se pueden editar o borrar sin problema.
insert into public.pulso_semanal (numero, pregunta, invitacion, inicia_en)
select v.numero, v.pregunta, v.invitacion, v.inicia::date
from (values
  (1,
   '¿Qué estás observando esta semana que antes pasabas por alto?',
   'A veces lo más importante siempre estuvo ahí. Esta semana te invitamos a mirar con otros ojos tu entorno, tus relaciones, tus pensamientos o la vida cotidiana. ¿Qué detalles están apareciendo ahora en tu campo de visión?',
   current_date),
  (2,
   '¿Qué has dejado de hacer, y qué ha ocupado su lugar?',
   'Los cambios grandes rara vez se anuncian. Suelen notarse porque algo que hacías cada día simplemente dejó de estar. Esta semana, mira qué se fue sin que lo decidieras y qué llegó a ocupar ese hueco.',
   current_date + 7),
  (3,
   '¿A quién le debes una conversación?',
   'Hay conversaciones que llevamos meses posponiendo, y casi siempre sabemos exactamente cuál es. Esta semana no hace falta tenerla: basta con nombrarla y mirar qué la ha estado frenando.',
   current_date + 14)
) as v(numero, pregunta, invitacion, inicia)
where not exists (
  select 1 from public.pulso_semanal p where p.numero = v.numero
);


-- ── Comprobación ────────────────────────────────────────────────────────────
select numero, inicia_en, left(pregunta, 60) as pregunta
from public.pulso_semanal
order by inicia_en;
