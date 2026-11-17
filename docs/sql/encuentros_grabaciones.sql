-- ============================================================================
-- ENCUENTROS DE LA RED — las grabaciones            [PENDIENTE DE EJECUTAR]
-- ============================================================================
--
-- QUÉ CAMBIA
--   «Encuentros» se diseñó para convocar: fecha futura, ciudad, cupo, quién
--   asiste. Los anuncios se van al canal de Telegram, que es donde la gente
--   ya mira. Lo que queda aquí son las GRABACIONES de los encuentros, que es
--   lo contrario: mira hacia atrás y gana valor con el tiempo.
--
-- POR QUÉ UNA TABLA NUEVA Y NO UNA COLUMNA EN network_meetings
--   Porque no son lo mismo. Un encuentro convocado tiene ciudad obligatoria,
--   cupo y lista de asistentes; una grabación no tiene nada de eso y sí tiene
--   un reproductor. Colgar `grabacion_url` de la convocatoria obligaría a
--   crear una convocatoria falsa por cada vídeo que se publique.
--
--   Y hay algo más: una reunión no da una grabación, da varias. La sesión
--   entera y los dos o tres momentos que valen sueltos. Por eso cada
--   grabación es su propia fila, con su título y su orden.
--
-- QUÉ NO HACE
--   No borra ni modifica network_meetings ni network_meeting_participants.
--   Las convocatorias siguen en la base intactas. Si algún día vuelven a la
--   pantalla, están donde estaban.
--
-- CÓMO APLICARLO
--   Supabase → SQL Editor → Run. Idempotente: se puede correr dos veces.
-- ============================================================================

create table if not exists public.network_recordings (
  id            bigserial primary key,

  titulo        text not null,
  descripcion   text not null default '',

  -- ── EL PEGOTE DE VTURB, TAL CUAL ──────────────────────────────────────
  -- Se guarda el código completo que da el panel de VTurb, sin recortarlo.
  -- Los identificadores de abajo se deducen de aquí al guardar, pero el
  -- original se conserva: si mañana VTurb cambia el formato del código, lo
  -- que hay guardado sigue siendo exactamente lo que ellos entregaron y se
  -- puede volver a interpretar sin pedirle nada a nadie.
  embed         text not null,

  -- Deducidos de `embed` por el servidor. Nunca los escribe el navegador.
  cuenta_id     text,
  player_id     text,

  -- ── LA PREVISUALIZACIÓN ───────────────────────────────────────────────
  -- No se pide imagen de portada: la miniatura sale del propio vídeo. El
  -- servidor la deduce del código de VTurb y COMPRUEBA que existe antes de
  -- guardarla. Si no la encuentra, queda nula y la tarjeta se dibuja sin
  -- imagen, en vez de dejar el hueco roto de una imagen que no carga.
  miniatura     text,

  -- Cuándo OCURRIÓ el encuentro, que no es cuándo se subió. Es el eje por el
  -- que se ordena el archivo.
  fecha         date not null default current_date,

  -- borrador  → solo la ve administración
  -- publicado → la ve toda la Red
  --
  -- Existe para que se pueda pegar el código, mirar que la previsualización
  -- es la correcta y publicar después. Sin esto, cada pegote a medias sería
  -- visible para todo el mundo mientras se arregla.
  estado        text not null default 'borrador'
                check (estado in ('borrador', 'publicado')),

  -- Para fijar una arriba sin tocar su fecha. 0 = orden normal, por fecha.
  sort_order    int not null default 0,

  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- El índice sigue el MISMO orden en que se lee la lista (fijadas primero,
-- después lo más reciente). Sin esto, cada página del archivo ordena la tabla
-- entera en memoria.
create index if not exists idx_recordings_orden
  on public.network_recordings (sort_order desc, fecha desc, id desc);

create index if not exists idx_recordings_estado
  on public.network_recordings (estado, fecha desc);

-- updated_at automático, con la función que ya usa el resto del esquema.
drop trigger if exists trg_recordings_updated_at on public.network_recordings;
create trigger trg_recordings_updated_at
  before update on public.network_recordings
  for each row execute function public.touch_updated_at();

-- ── RLS ────────────────────────────────────────────────────────────────────
-- La última palabra es de la base, no de la pantalla. Aunque una ruta se
-- equivocara y pidiera los borradores, aquí no salen.

alter table public.network_recordings enable row level security;

-- Cualquiera con sesión ve las PUBLICADAS. Administración ve todo.
drop policy if exists "recordings read" on public.network_recordings;
create policy "recordings read"
  on public.network_recordings for select
  to authenticated
  using (
    estado = 'publicado'
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "recordings insert" on public.network_recordings;
create policy "recordings insert"
  on public.network_recordings for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "recordings update" on public.network_recordings;
create policy "recordings update"
  on public.network_recordings for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "recordings delete" on public.network_recordings;
create policy "recordings delete"
  on public.network_recordings for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────
-- Debe devolver 4 políticas y la tabla con sus columnas.
select policyname from pg_policies
where schemaname = 'public' and tablename = 'network_recordings'
order by policyname;
