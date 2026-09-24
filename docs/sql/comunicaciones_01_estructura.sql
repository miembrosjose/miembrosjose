-- ============================================================================
-- CENTRO DE COMUNICACIONES — ESTRUCTURA  ·  PREPARADO PARA REVISIÓN
-- ============================================================================
--
-- **NO EJECUTAR SIN LEERLO.** No borra nada, no cambia ninguna tabla existente
-- y no toca ninguna policy que ya esté puesta. Solo crea cuatro tablas nuevas.
--
-- ── QUÉ RESUELVE ───────────────────────────────────────────────────────────
-- Hoy los correos de Los 144.000 son tres: la invitación de cuenta, el aviso
-- de «ya tienes cuenta» y el de pago fallido. Los tres son TRANSACCIONALES:
-- salen de un hecho concreto —una compra, una recuperación— y no dependen de
-- que nadie se haya suscrito a nada. Eso sigue exactamente igual después de
-- esta migración.
--
-- Lo que falta, y es lo que se construye aquí, son las COMUNICACIONES DE LA
-- RED: un episodio nuevo, una transmisión, una sesión en vivo, un encuentro.
-- Esas sí dependen de que cada miembro quiera recibirlas, y esas sí necesitan
-- borrador, prueba, audiencia, programación y resultados.
--
-- ── LAS CUATRO TABLAS ──────────────────────────────────────────────────────
--   communications          una comunicación, de borrador a enviada
--   communication_events    quién hizo qué y cuándo (auditoría)
--   email_preferences       qué quiere recibir cada miembro
--   communication_contacts  el puente entre un miembro y su contacto en Resend
--
-- ── POR QUÉ ESA CUARTA TABLA ───────────────────────────────────────────────
-- Resend envía las comunicaciones masivas a una «audiencia» suya, que es su
-- propia lista de contactos. No se puede evitar: es como funciona su API de
-- Broadcasts, y usar Broadcasts es justamente lo que impide que un Worker
-- tenga que mandar mil correos de uno en uno.
--
-- Pero Resend NO pasa a ser una segunda base de usuarios. Supabase sigue
-- siendo la fuente de verdad de quién es miembro, con qué correo y qué quiere
-- recibir. Esta tabla solo guarda la correspondencia —este miembro es aquel
-- contacto— para poder sincronizar sin duplicar: sin ella, cada envío crearía
-- los mismos contactos otra vez.
--
-- CÓMO APLICARLO
--   Supabase → SQL Editor → pegar entero → Run. Idempotente: se puede volver
--   a ejecutar sin efectos.
-- ============================================================================


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  1 · LAS COMUNICACIONES                                              ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create table if not exists public.communications (
  id uuid primary key default gen_random_uuid(),

  -- QUÉ CLASE DE COMUNICACIÓN ES.
  -- No hay una tabla por tipo: el tipo elige la familia de plantilla y qué
  -- campos tienen sentido, nada más. Añadir un tipo nuevo es añadir un valor
  -- aquí y una familia en el renderizador, sin tocar el esquema.
  type text not null check (type in (
    'contenido',   -- episodio, módulo, transmisión, sección, temporada
    'sesion',      -- sesión en vivo
    'activacion',  -- activación
    'encuentro',   -- encuentro de La Red
    'novedades',   -- novedades de La Red
    'especial'     -- comunicación especial
  )),

  -- Cómo la reconoce administración en la lista. No sale en el correo.
  internal_title text not null default '',

  -- ── Lo que se ve en la bandeja de entrada ──────────────────────────────
  subject   text not null default '',
  preheader text not null default '',

  -- ── El cuerpo ──────────────────────────────────────────────────────────
  eyebrow   text not null default '',
  heading   text not null default '',
  body      text not null default '',
  image_url text,
  cta_text  text,
  cta_url   text,

  -- ── El bloque de fecha, solo en sesiones y encuentros ──────────────────
  -- La zona horaria se guarda aparte y SIEMPRE. Un timestamptz sin la zona en
  -- la que se eligió no permite volver a escribir «7:00 PM México» sin
  -- adivinar, y adivinar la hora de una sesión en vivo es un fallo caro.
  event_title    text,
  event_at       timestamptz,
  event_timezone text,
  event_location text,

  -- ── A quién va ─────────────────────────────────────────────────────────
  -- Un objeto, no una columna por filtro: hoy solo existe «todos los miembros
  -- activos», y cuando existan los datos para filtrar por temporada o ciudad
  -- será un campo más aquí dentro, sin otra migración.
  --   {"kind": "todos"}
  audience jsonb not null default '{"kind":"todos"}'::jsonb,

  -- ── Dónde está en su vida ──────────────────────────────────────────────
  --   draft      se está escribiendo
  --   scheduled  aceptada por el proveedor con fecha futura
  --   queued     el proveedor la tiene y va a repartirla
  --   sending    repartiendo
  --   sent       repartida
  --   cancelled  se canceló antes de salir
  --   failed     el proveedor la rechazó
  --
  -- NUNCA se marca como enviada algo que el proveedor no aceptó.
  status text not null default 'draft' check (status in (
    'draft', 'scheduled', 'queued', 'sending', 'sent', 'cancelled', 'failed'
  )),

  scheduled_at       timestamptz,
  scheduled_timezone text,

  -- ── El lado del proveedor ──────────────────────────────────────────────
  provider_broadcast_id text,
  provider_audience_id  text,
  provider_topic_id     text,
  provider_error        text,

  -- ── Lo que se calculó antes de enviar ──────────────────────────────────
  recipients_estimated integer,
  recipients_excluded  integer,

  sent_at timestamptz,

  -- ── Resultados ─────────────────────────────────────────────────────────
  -- Un objeto y no ocho columnas: las métricas las define el proveedor y
  -- cambian. Aquí solo se guarda la última foto, no el historial de eventos.
  metrics           jsonb,
  metrics_synced_at timestamptz,

  -- ── Quién y cuándo ─────────────────────────────────────────────────────
  created_by uuid references auth.users(id) on delete set null,
  sent_by    uuid references auth.users(id) on delete set null,

  -- ── La barrera contra el doble envío ───────────────────────────────────
  -- Dos clics seguidos, un reintento o un refresco a destiempo no pueden
  -- crear dos Broadcasts. Quien envía manda una llave con la petición; la
  -- segunda vez que llega la misma llave, el índice único de abajo la rechaza
  -- y no sale nada.
  send_idempotency_key text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.communications is
  'Comunicaciones de La Red. Los correos transaccionales NO viven aqui.';

create index if not exists communications_estado_idx
  on public.communications (status, created_at desc);

create index if not exists communications_programadas_idx
  on public.communications (scheduled_at)
  where status = 'scheduled';

create index if not exists communications_broadcast_idx
  on public.communications (provider_broadcast_id)
  where provider_broadcast_id is not null;

-- La llave de idempotencia es única cuando existe. Un índice parcial deja que
-- los borradores —que no tienen llave— convivan sin chocar entre ellos.
create unique index if not exists communications_idempotencia_idx
  on public.communications (send_idempotency_key)
  where send_idempotency_key is not null;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  2 · LA AUDITORÍA                                                    ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Enviar un correo a toda La Red es una acción que no se deshace. Queda
-- escrito quién la hizo y cuándo.
--
-- Guarda ACCIONES, no eventos del proveedor: las aperturas y los clics viven
-- en Resend y se consultan cuando hacen falta. Copiarlos aquí sería mantener
-- dos verdades y hacer crecer la tabla sin motivo.
create table if not exists public.communication_events (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid not null
    references public.communications(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in (
    'created', 'updated', 'duplicated',
    'test_sent', 'audience_checked',
    'sent', 'scheduled', 'cancelled', 'failed',
    'metrics_synced'
  )),
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists communication_events_por_comunicacion_idx
  on public.communication_events (communication_id, created_at desc);


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  3 · LO QUE CADA MIEMBRO QUIERE RECIBIR                              ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- ── POR QUÉ UNA TABLA Y NO user_metadata ───────────────────────────────────
-- Las preferencias de notificación que ya existen viven en
-- `user_metadata.notification_prefs`, y ahí deben quedarse: son de la campana
-- de dentro de la plataforma y las edita el propio usuario.
--
-- Estas son otra cosa. Deciden si a alguien se le ESCRIBE, y hay que poder
-- preguntarlo del lado del servidor para miles de personas a la vez —«cuántos
-- recibirían esto»— sin recorrer usuarios uno por uno. `user_metadata` no se
-- puede consultar así. Una tabla sí.
--
-- La fila puede no existir: quien no ha tocado nada lo recibe todo. Eso se
-- resuelve al leer, no llenando la tabla de filas por defecto.
create table if not exists public.email_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- Las cuatro familias. Un tipo de comunicación pertenece a una y solo a una.
  novedades  boolean not null default true,  -- novedades y comunicación especial
  contenidos boolean not null default true,  -- episodios, módulos, transmisiones
  sesiones   boolean not null default true,  -- sesiones en vivo y activaciones
  red        boolean not null default true,  -- encuentros y actividad de La Red

  -- La baja global. Gana sobre las cuatro de arriba.
  --
  -- NO afecta a los correos transaccionales: quien se da de baja de las
  -- novedades sigue recibiendo su enlace de acceso y su recuperación de
  -- cuenta. Son cosas distintas y la ley las trata distinto.
  unsubscribed_all boolean not null default false,
  unsubscribed_at  timestamptz,

  updated_at timestamptz not null default now()
);

comment on table public.email_preferences is
  'Correo editorial. NO gobierna los transaccionales (acceso, recuperacion).';

-- Para contar la audiencia interesan las filas que EXCLUYEN, que son pocas.
create index if not exists email_preferences_bajas_idx
  on public.email_preferences (user_id)
  where unsubscribed_all = true;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  4 · EL PUENTE CON EL PROVEEDOR                                      ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Un miembro de Supabase ↔ un contacto de Resend. Nada más.
--
-- Sin esto, cada sincronización volvería a crear los mismos contactos y la
-- audiencia se llenaría de duplicados. Con esto, sincronizar es comparar y
-- actualizar solo lo que cambió.
create table if not exists public.communication_contacts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  resend_contact_id  text,
  resend_audience_id text,

  -- Qué se mandó la última vez. Si no ha cambiado, no se vuelve a mandar.
  synced_email        text,
  synced_unsubscribed boolean,
  synced_at  timestamptz,
  sync_error text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists communication_contacts_email_idx
  on public.communication_contacts (lower(email));

create index if not exists communication_contacts_pendientes_idx
  on public.communication_contacts (synced_at nulls first);


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  5 · updated_at AL DÍA                                               ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $tocar$
begin
  new.updated_at = now();
  return new;
end;
$tocar$;

drop trigger if exists communications_tocar on public.communications;
create trigger communications_tocar
  before update on public.communications
  for each row execute function public.tocar_updated_at();

drop trigger if exists email_preferences_tocar on public.email_preferences;
create trigger email_preferences_tocar
  before update on public.email_preferences
  for each row execute function public.tocar_updated_at();

drop trigger if exists communication_contacts_tocar on public.communication_contacts;
create trigger communication_contacts_tocar
  before update on public.communication_contacts
  for each row execute function public.tocar_updated_at();


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  6 · QUIÉN PUEDE TOCAR QUÉ                                           ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- ── LA REGLA ───────────────────────────────────────────────────────────────
-- Tres de estas cuatro tablas no las toca NADIE con sesión normal. Ni leer.
-- Todo lo que hace el panel pasa por rutas de servidor que comprueban que
-- quien pide es administración y usan la clave de servicio, que se salta RLS
-- por diseño.
--
-- Activar RLS sin escribir ni una policy es, por tanto, la postura correcta y
-- la más segura: cierra la puerta a cualquiera que pruebe a pedir estas tablas
-- desde el navegador, y no rompe nada del panel.
--
-- La excepción es `email_preferences`: cada quien tiene que poder ver y
-- cambiar la suya desde su perfil.
alter table public.communications          enable row level security;
alter table public.communication_events    enable row level security;
alter table public.communication_contacts  enable row level security;
alter table public.email_preferences       enable row level security;

-- Sin policies: nadie con rol `authenticated` o `anon` entra. Solo la clave de
-- servicio, desde el servidor.
drop policy if exists "nadie lee comunicaciones" on public.communications;
drop policy if exists "nadie lee eventos"        on public.communication_events;
drop policy if exists "nadie lee contactos"      on public.communication_contacts;

-- Cada quien, y solo, sus propias preferencias.
drop policy if exists "preferencias propias lectura" on public.email_preferences;
create policy "preferencias propias lectura" on public.email_preferences
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "preferencias propias alta" on public.email_preferences;
create policy "preferencias propias alta" on public.email_preferences
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "preferencias propias cambio" on public.email_preferences;
create policy "preferencias propias cambio" on public.email_preferences
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Y los permisos de tabla, que son una capa aparte de las policies: una policy
-- no sirve de nada si el rol no tiene el GRANT, y un GRANT de más deja pasar
-- lo que la policy no llega a filtrar.
revoke all on public.communications         from anon, authenticated;
revoke all on public.communication_events   from anon, authenticated;
revoke all on public.communication_contacts from anon, authenticated;

revoke all on public.email_preferences from anon;
grant select, insert, update on public.email_preferences to authenticated;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  7 · CÓMO QUEDÓ                                                      ║
-- ╚══════════════════════════════════════════════════════════════════════╝
select
  t.tabla,
  (select count(*) from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = t.tabla) as columnas,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = t.tabla) as policies,
  (select c.relrowsecurity from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where c.relname = t.tabla and n.nspname = 'public') as rls_activo
from (values
  ('communications'), ('communication_events'),
  ('email_preferences'), ('communication_contacts')
) as t(tabla)
order by t.tabla;
