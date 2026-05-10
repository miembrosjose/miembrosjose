create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  meta jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists integrations_provider_idx on integrations (provider);
