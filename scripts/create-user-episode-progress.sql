-- Cria tabela user_episode_progress
-- Usada por /api/profile/episode-progress pra trackear quais episódios o user
-- já viu e onde parou. Sem ela, esse endpoint retorna 500.

create table if not exists public.user_episode_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  episode_id text not null,
  position_seconds integer default 0,
  completed boolean default false,
  updated_at timestamptz default now(),
  unique(user_id, episode_id)
);

create index if not exists user_episode_progress_user_idx
  on public.user_episode_progress(user_id);

alter table public.user_episode_progress enable row level security;

drop policy if exists "user_reads_own_progress" on public.user_episode_progress;
create policy "user_reads_own_progress"
  on public.user_episode_progress for select
  to authenticated using (auth.uid() = user_id);

drop policy if exists "user_writes_own_progress" on public.user_episode_progress;
create policy "user_writes_own_progress"
  on public.user_episode_progress for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
