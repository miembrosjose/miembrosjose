-- ============================================================================
-- LUGARES DE CONTACTO — Mapa Cósmico de la Red (persistencia + moderación)
-- ============================================================================
-- Tabla central para que los aportes de la comunidad lleguen a la administración
-- (antes vivían solo en localStorage por dispositivo). Lecturas/escrituras pasan
-- por /api/lugares con service role; RLS queda restrictiva (sin acceso directo).
-- Ejecutar en Supabase → SQL Editor → Run. Idempotente.
-- ============================================================================

create table if not exists public.contact_places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  country text not null default '',
  region text,
  city text,
  latitude double precision,
  longitude double precision,
  category text not null default 'comunitario',
  authority_level text not null default 'community',   -- official | community | pending | featured
  status text not null default 'pending_review',       -- published | pending_review | rejected | hidden
  short_description text not null default '',
  long_description text,
  memory_type text,
  visit_recommendations text,
  suggested_practice text,
  tags text[] not null default '{}',
  images text[] not null default '{}',
  videos text[] not null default '{}',
  created_by text,
  created_by_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_by text,
  approved_at timestamptz
);

create index if not exists contact_places_status_idx on public.contact_places (status);

-- RLS activado y restrictivo: el acceso se hace por API con service role.
alter table public.contact_places enable row level security;

-- Semilla oficial (idempotente por slug).
insert into public.contact_places (name, slug, country, region, latitude, longitude, category, authority_level, status, short_description, created_by)
select v.name, v.slug, v.country, v.region, v.lat, v.lon, v.category, 'official', 'published',
  'Punto registrado por la administración como lugar asociado por algunas tradiciones a memoria, contacto o trabajo espiritual. Información ampliada pendiente de edición.',
  'Administración'
from (values
  ('Chilca','chilca','Perú','Lima',-12.52,-76.73,'avistamiento'),
  ('Capilla del Monte / Uritorco','capilla-del-monte-uritorco','Argentina','Córdoba',-30.86,-64.52,'avistamiento'),
  ('Monte Shasta','monte-shasta','Estados Unidos','California',41.41,-122.19,'sagrado'),
  ('Cueva de los Tayos','cueva-de-los-tayos','Ecuador','Morona Santiago',-1.93,-78.20,'natural'),
  ('Guatavita','guatavita','Colombia','Cundinamarca',4.98,-73.77,'sagrado'),
  ('Lago Titicaca','lago-titicaca','Bolivia / Perú',null,-15.92,-69.33,'sagrado'),
  ('Rapa Nui','rapa-nui','Chile','Isla de Pascua',-27.11,-109.35,'sagrado'),
  ('Gizeh','gizeh','Egipto',null,29.98,31.13,'sagrado'),
  ('Teotihuacán','teotihuacan','México',null,19.69,-98.84,'sagrado'),
  ('Zona del Silencio','zona-del-silencio','México','Durango',26.69,-103.75,'activacion'),
  ('Monte Roraima','monte-roraima','Venezuela / Brasil / Guyana',null,5.14,-60.76,'natural'),
  ('Desierto del Gobi','desierto-del-gobi','Mongolia / China',null,42.5,105.0,'retiro')
) as v(name, slug, country, region, lat, lon, category)
where not exists (select 1 from public.contact_places p where p.slug = v.slug);

select status, count(*) from public.contact_places group by status;
