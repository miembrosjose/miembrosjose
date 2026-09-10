-- ============================================================================
-- TRANSMISIONES — Archivo vivo del Feed de Los 144.000
-- ============================================================================
-- NO toca feed_posts, temporadas ni Biblioteca. Tablas nuevas + RLS + búsqueda
-- full-text (español). Ejecutar en Supabase → SQL Editor → Run. Idempotente.
-- ============================================================================

-- ── Categorías (data-driven) ────────────────────────────────────────────
create table if not exists public.transmission_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.transmission_categories (slug, name, sort_order) values
  ('vida-proposito','Vida y Propósito',1),
  ('abundancia-creacion','Abundancia y Creación',2),
  ('sanacion-mundo-interior','Sanación y Mundo Interior',3),
  ('amor-relaciones-familia','Amor, Relaciones y Familia',4),
  ('ninos-nueva-humanidad','Niños y Nueva Humanidad',5),
  ('consciencia-realidad','Consciencia y Realidad',6),
  ('tiempo-suenos-multidimensionalidad','Tiempo, Sueños y Multidimensionalidad',7),
  ('intuicion-capacidades','Intuición y Capacidades Humanas',8),
  ('contacto-familia-cosmica','Contacto y Familia Cósmica',9),
  ('evolucion-futuro','Evolución Humana y Futuro',10),
  ('memoria-origen','Memoria y Origen',11),
  ('tierra-servicio-red','Tierra, Servicio y Red 144.000',12)
on conflict (slug) do nothing;

-- ── Transmisiones ────────────────────────────────────────────────────────
create table if not exists public.transmissions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  body text not null default '',
  category_slug text references public.transmission_categories(slug),
  tags text[] not null default '{}',
  author_name text not null default 'José',
  status text not null default 'published',        -- published | draft | archived
  featured boolean not null default false,
  featured_order int,
  reading_time int,                                  -- minutos (calculado en import)
  image_url text,                                    -- opcional
  related_post_slugs text[] not null default '{}',
  related_season int,
  related_episode_id uuid,
  overlap_status text default 'none',                -- none | complementary | deepening
  source_basis text,                                 -- interno: jose_previous_work | jose_contact_experience | los144000_previous_conversation | bashar_research | mixed | other
  editorial_notes text,                              -- interno
  season_overlap_notes text,                         -- interno
  sort_order int not null default 0,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Búsqueda full-text (español) con pesos: título > extracto/tags > cuerpo.
  search tsvector generated always as (
    setweight(to_tsvector('spanish', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(excerpt,'')), 'B') ||
    setweight(to_tsvector('spanish', array_to_string(tags, ' ')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(body,'')), 'C')
  ) stored
);

create index if not exists transmissions_search_idx   on public.transmissions using gin (search);
create index if not exists transmissions_category_idx  on public.transmissions (category_slug);
create index if not exists transmissions_status_idx    on public.transmissions (status);
create index if not exists transmissions_featured_idx  on public.transmissions (featured, featured_order);
create index if not exists transmissions_published_idx on public.transmissions (published_at desc);

-- ── RLS: miembros autenticados leen lo publicado; escritura solo admin/service ─
alter table public.transmission_categories enable row level security;
alter table public.transmissions enable row level security;

drop policy if exists "tx_categories read" on public.transmission_categories;
create policy "tx_categories read" on public.transmission_categories
  for select to authenticated using (is_active = true);

drop policy if exists "tx read published" on public.transmissions;
create policy "tx read published" on public.transmissions
  for select to authenticated
  using (
    status = 'published'
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
-- Sin políticas de insert/update/delete → solo service_role (importador/admin).

select 'transmissions listo' as status;
