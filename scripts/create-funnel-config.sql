create table if not exists funnel_config (
  key   text primary key,
  value text not null
);

-- Valores padrão
insert into funnel_config (key, value) values ('test_mode', 'off') on conflict (key) do nothing;
insert into funnel_config (key, value) values ('owner_ip', '') on conflict (key) do nothing;
