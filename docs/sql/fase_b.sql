-- FASE B — RLS y policies en las 8 tablas desprotegidas.
-- Copiar ESTE ARCHIVO ENTERO y correrlo de una sola vez.
-- Los pasos van juntos a proposito: entre uno y otro las tablas quedan
-- en "solo service_role". No modifica datos.

-- B.1 · Activar RLS
alter table public.dashboard_rate_limit        enable row level security;
alter table public.funnel_events               enable row level security;
alter table public.funnel_feedbacks            enable row level security;
alter table public.funnel_likes                enable row level security;
alter table public.funnel_reactions            enable row level security;
alter table public.leaderboard_top3_broadcasts enable row level security;
alter table public.leaderboard_top3_snapshot   enable row level security;
alter table public.user_funnels                enable row level security;

-- B.2 · Solo backend: sin policies y sin grants
revoke all on public.dashboard_rate_limit from anon, authenticated;
revoke all on public.funnel_events        from anon, authenticated;
revoke all on public.funnel_likes         from anon, authenticated;
revoke all on public.funnel_reactions     from anon, authenticated;

-- B.3 · user_funnels: directorio compartido (lo lee /api/search sin filtrar)
drop policy if exists "user_funnels read members" on public.user_funnels;
create policy "user_funnels read members" on public.user_funnels
  for select to authenticated using (true);

-- B.4 · funnel_feedbacks conserva su policy existente. No se anade nada.

-- B.5 · Ranking: lectura para miembros, escritura solo por triggers
drop policy if exists "leaderboard read members" on public.leaderboard_top3_snapshot;
create policy "leaderboard read members" on public.leaderboard_top3_snapshot
  for select to authenticated using (true);

drop policy if exists "leaderboard read members" on public.leaderboard_top3_broadcasts;
create policy "leaderboard read members" on public.leaderboard_top3_broadcasts
  for select to authenticated using (true);

-- Comprobacion inmediata. Esperado: 8 filas, todas con rls = true
select c.relname::text as tabla, c.relrowsecurity as rls,
       (select count(*) from pg_policies p
          where p.schemaname='public' and p.tablename=c.relname) as policies
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname='public'
  and c.relname in ('dashboard_rate_limit','funnel_events','funnel_feedbacks',
                    'funnel_likes','funnel_reactions','user_funnels',
                    'leaderboard_top3_snapshot','leaderboard_top3_broadcasts')
order by c.relname;
