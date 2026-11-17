-- ============================================================================
-- ENCUENTROS — comentarios bajo la grabación      [PENDIENTE DE EJECUTAR]
-- ============================================================================
--
-- POR QUÉ UNA TABLA PROPIA Y NO EL FORO
--   La tentación era reusar `forum_posts` + `forum_replies`: ya tienen «me
--   gusta», respuestas de un nivel, insignias y moderación. Se descartó por
--   una razón concreta, no por gusto:
--
--   `/api/forum/posts` NO filtra por espacio. Filtra por `pinned`. O sea que
--   un hilo creado para una grabación aparecería en la conversación del foro
--   mezclado con todo lo demás. Para evitarlo habría que tocar esa ruta, que
--   es central y funciona, y arriesgarse a cambiar de paso lo que ve la
--   comunidad en su pantalla principal.
--
--   Una tabla propia no toca nada de eso.
--
-- POR QUÉ UN SOLO NIVEL
--   Igual que en el foro. Una conversación que se puede anidar sin fin acaba
--   siendo ilegible en un teléfono: a la cuarta respuesta el texto cabe en
--   tres palabras por línea. Responder a una respuesta cuelga del comentario
--   raíz, y se menciona a quién se contesta.
--
--   Eso se garantiza en el SERVIDOR, no confiando en la pantalla.
--
-- CÓMO APLICARLO
--   Supabase → SQL Editor → Run. Idempotente.
-- ============================================================================

create table if not exists public.network_recording_comments (
  id            uuid primary key default gen_random_uuid(),
  recording_id  bigint not null
                references public.network_recordings(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,

  -- Nulo = comentario raíz. Si no, cuelga de uno raíz: NUNCA de otra
  -- respuesta. Lo impone la ruta al insertar.
  parent_id     uuid references public.network_recording_comments(id)
                on delete cascade,

  -- ── LA IDENTIDAD, CONGELADA ───────────────────────────────────────────
  -- Se guarda cómo se llamaba y qué insignia llevaba al escribir, igual que
  -- en el foro. Si alguien cambia su nombre mañana, lo que dijo hace un mes
  -- sigue apareciendo como lo dijo: el pasado no se reescribe solo.
  author_name     text not null,
  author_username text,
  author_avatar   text not null default '',
  author_avatar_url text,
  author_badge_id text,
  author_is_admin boolean not null default false,

  body          text not null
                check (length(btrim(body)) between 1 and 1000),

  likes_count   int not null default 0,

  created_at    timestamptz not null default now(),
  edited_at     timestamptz
);

-- El orden en que se lee el hilo: por grabación, del más antiguo al más
-- nuevo, que es como se lee una conversación.
create index if not exists idx_rec_comments_grabacion
  on public.network_recording_comments (recording_id, created_at);

create index if not exists idx_rec_comments_padre
  on public.network_recording_comments (parent_id);

create index if not exists idx_rec_comments_autor
  on public.network_recording_comments (user_id);

-- ── «ME GUSTA» ──────────────────────────────────────────────────────────────
-- Una fila por persona y comentario: la clave primaria doble hace imposible
-- dar dos veces el mismo me gusta, sin que la ruta tenga que comprobar nada.
create table if not exists public.network_recording_comment_likes (
  comment_id  uuid not null
              references public.network_recording_comments(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists idx_rec_comment_likes_user
  on public.network_recording_comment_likes (user_id);

-- ── EL CONTADOR LO LLEVA LA BASE ────────────────────────────────────────────
-- No la ruta. Si lo sumara la ruta, bastaría un fallo a medio camino —o dos
-- personas pulsando a la vez— para que el número dejara de coincidir con las
-- filas, y nadie se enteraría hasta que alguien los contara a mano.
create or replace function public.rec_comment_likes_contar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.network_recording_comments
       set likes_count = likes_count + 1
     where id = new.comment_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.network_recording_comments
       set likes_count = greatest(0, likes_count - 1)
     where id = old.comment_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_rec_comment_likes on public.network_recording_comment_likes;
create trigger trg_rec_comment_likes
  after insert or delete on public.network_recording_comment_likes
  for each row execute function public.rec_comment_likes_contar();

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.network_recording_comments enable row level security;
alter table public.network_recording_comment_likes enable row level security;

-- Los lee cualquiera con sesión. El acceso a la grabación ya se comprueba
-- antes, al entrar en la página.
drop policy if exists "rec comments read" on public.network_recording_comments;
create policy "rec comments read"
  on public.network_recording_comments for select
  to authenticated using (true);

-- Solo se puede escribir en nombre propio. Aunque una ruta se equivocara y
-- mandara otro `user_id`, la base lo rechaza.
drop policy if exists "rec comments insert" on public.network_recording_comments;
create policy "rec comments insert"
  on public.network_recording_comments for insert
  to authenticated with check (user_id = auth.uid());

-- Editar: solo lo propio.
drop policy if exists "rec comments update" on public.network_recording_comments;
create policy "rec comments update"
  on public.network_recording_comments for update
  to authenticated using (user_id = auth.uid());

-- Borrar: lo propio, o cualquiera si es administración.
drop policy if exists "rec comments delete" on public.network_recording_comments;
create policy "rec comments delete"
  on public.network_recording_comments for delete
  to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Los «me gusta»: se ven todos —hace falta para saber si ya lo diste— y cada
-- quien solo pone y quita el suyo.
drop policy if exists "rec likes read" on public.network_recording_comment_likes;
create policy "rec likes read"
  on public.network_recording_comment_likes for select
  to authenticated using (true);

drop policy if exists "rec likes insert" on public.network_recording_comment_likes;
create policy "rec likes insert"
  on public.network_recording_comment_likes for insert
  to authenticated with check (user_id = auth.uid());

drop policy if exists "rec likes delete" on public.network_recording_comment_likes;
create policy "rec likes delete"
  on public.network_recording_comment_likes for delete
  to authenticated using (user_id = auth.uid());

-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────
-- Deben salir las dos tablas y sus políticas.
select tablename, policyname from pg_policies
where schemaname = 'public'
  and tablename in ('network_recording_comments', 'network_recording_comment_likes')
order by tablename, policyname;
