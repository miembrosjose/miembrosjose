-- ============================================================================
-- SUPABASE FULL SETUP — Los 144000
-- Agregado dos 8 SQLs na ordem certa. Cole uma vez no SQL Editor.
-- ============================================================================

-- Limpa schema public pra começar do zero (cuidado: apaga todas as tabelas)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;



-- ============================================================================
-- ▼  STUBS legacy: user_funnels / funnel_likes / funnel_feedbacks
-- ============================================================================
-- Este projeto NÃO usa sistema de funnels, mas vários triggers de XP do
-- código original os referenciam. Criamos tabelas vazias só pra permitir
-- os CREATE TRIGGER sem erro. Como ninguém insere nessas tabelas, os
-- triggers nunca disparam.

CREATE TABLE IF NOT EXISTS public.user_funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  niche text,
  url text,
  image_url text,
  approved boolean DEFAULT true,
  likes_count int DEFAULT 0,
  dislikes_count int DEFAULT 0,
  feedbacks_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.funnel_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid REFERENCES public.user_funnels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_like boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.funnel_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid REFERENCES public.user_funnels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_feedback_id uuid REFERENCES public.funnel_feedbacks(id) ON DELETE CASCADE,
  body text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.funnel_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid REFERENCES public.user_funnels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid REFERENCES public.user_funnels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text,
  event_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- ▼  supabase-init.sql
-- ============================================================================

-- ============================================================================
-- SUPABASE INIT — Los 144000 (MÍNIMO PRA CONTA ADMIN)
-- ============================================================================
-- Só cria o necessário pra ter um user admin no painel:
--   - Tabela profiles (1:1 com auth.users) com flag is_admin
--   - Trigger que cria profile automaticamente quando user se cadastra
--   - RLS: user lê/edita só o próprio, admin lê todos
-- Resto do schema (forum, XP, etc) vamos adicionar depois.
-- ============================================================================

-- 1. Tabela profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;

-- 2. Trigger: ao criar user em auth.users, cria automaticamente row em profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Trigger: atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. RLS — Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Qualquer user autenticado lê todos os profiles (necessário pra área de membros)
DROP POLICY IF EXISTS "authenticated read all profiles" ON public.profiles;
CREATE POLICY "authenticated read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- User edita só o próprio profile
DROP POLICY IF EXISTS "user updates own profile" ON public.profiles;
CREATE POLICY "user updates own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin atualiza qualquer profile (pra eventualmente promover outros admins via painel)
DROP POLICY IF EXISTS "admin updates any profile" ON public.profiles;
CREATE POLICY "admin updates any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Service role bypassa tudo (já é default do Supabase, mas explicito)
-- Insert e Delete: só via trigger (handle_new_user) ou service_role.


-- ============================================================================
-- ▼  supabase-seasons.sql
-- ============================================================================

-- ============================================================================
-- Tabela SEASONS — gerenciada pelo painel admin
-- ============================================================================
-- Admin (is_admin=true em profiles) cria, edita e remove temporadas.
-- Qualquer user logado lê (necessário pro carrossel renderizar).

CREATE TABLE IF NOT EXISTS public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  num int NOT NULL UNIQUE,
  name text NOT NULL,
  episodes int NOT NULL DEFAULT 0,
  starter boolean NOT NULL DEFAULT false,
  external boolean NOT NULL DEFAULT false,
  redirect_url text,
  video_bg text,
  gradient text NOT NULL DEFAULT 'linear-gradient(135deg, #14142a 0%, #6D4A9B 100%)',
  emoji text NOT NULL DEFAULT '🎬',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seasons_sort ON public.seasons(sort_order, num);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_seasons_updated_at ON public.seasons;
CREATE TRIGGER trg_seasons_updated_at
  BEFORE UPDATE ON public.seasons
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

-- Qualquer user autenticado lê
DROP POLICY IF EXISTS "authenticated read seasons" ON public.seasons;
CREATE POLICY "authenticated read seasons"
  ON public.seasons FOR SELECT
  TO authenticated
  USING (true);

-- Só admins escrevem (insert/update/delete)
DROP POLICY IF EXISTS "admin insert seasons" ON public.seasons;
CREATE POLICY "admin insert seasons"
  ON public.seasons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin update seasons" ON public.seasons;
CREATE POLICY "admin update seasons"
  ON public.seasons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin delete seasons" ON public.seasons;
CREATE POLICY "admin delete seasons"
  ON public.seasons FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- Seed com as 5 temporadas atuais (vai substituir o array SEASONS estático)
INSERT INTO public.seasons (num, name, episodes, starter, external, video_bg, gradient, emoji, sort_order)
VALUES
  (1, 'Temporada 1', 0, true,  false, NULL, 'linear-gradient(135deg, #14142a 0%, #6D4A9B 100%)', '🎬', 1),
  (2, 'Temporada 2', 0, false, false, NULL, 'linear-gradient(135deg, #050510 0%, #14142a 100%)', '🎞️', 2),
  (3, 'Temporada 3', 0, false, false, NULL, 'linear-gradient(135deg, #14142a 0%, #4A3170 100%)', '📽️', 3),
  (4, 'Temporada 4', 0, false, false, NULL, 'linear-gradient(135deg, #050510 0%, #14142a 100%)', '🎥', 4),
  (5, 'Comunidad',   0, false, true,  NULL, 'linear-gradient(135deg, #050510 0%, #2a2a45 100%)', '💬', 5)
ON CONFLICT (num) DO NOTHING;


-- ============================================================================
-- ▼  supabase-season-access.sql
-- ============================================================================

-- ============================================================================
-- Acesso a temporadas (bloqueado/liberado) + controle por user
-- ============================================================================

-- ─── 1. Colunas extras em seasons ─────────────────────────────────────
ALTER TABLE public.seasons
  ADD COLUMN IF NOT EXISTS is_locked    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checkout_url text;

-- ─── 2. Tabela user_season_access ────────────────────────────────────
-- Liga user → temporadas que ele tem acesso. Admin libera via painel ou
-- via integração futura (webhook de compra, etc).
CREATE TABLE IF NOT EXISTS public.user_season_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id  uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note       text,
  UNIQUE (user_id, season_id)
);

CREATE INDEX IF NOT EXISTS idx_user_season_access_user
  ON public.user_season_access (user_id);
CREATE INDEX IF NOT EXISTS idx_user_season_access_season
  ON public.user_season_access (season_id);

ALTER TABLE public.user_season_access ENABLE ROW LEVEL SECURITY;

-- User vê os próprios acessos
DROP POLICY IF EXISTS "user reads own access" ON public.user_season_access;
CREATE POLICY "user reads own access"
  ON public.user_season_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin vê tudo
DROP POLICY IF EXISTS "admin reads all access" ON public.user_season_access;
CREATE POLICY "admin reads all access"
  ON public.user_season_access FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Só admin grants/revokes
DROP POLICY IF EXISTS "admin manages access" ON public.user_season_access;
CREATE POLICY "admin manages access"
  ON public.user_season_access FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));


-- ============================================================================
-- ▼  supabase-episodes.sql
-- ============================================================================

-- ============================================================================
-- Episodios + blocos de texto editáveis (admin)
-- ============================================================================
-- Cada temporada tem N episodios.
-- Cada episodio tem 1 vídeo (URL) + N blocos de texto livres com posição
-- (above_video ou below_video) e ordem dentro daquela posição.
-- Admin gerencia tudo via /miembros painel. Membros só leem.

-- ─── Tabela episodes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  num int NOT NULL,
  title text NOT NULL,
  description text,
  video_url text,
  thumb_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_id, num)
);

CREATE INDEX IF NOT EXISTS idx_episodes_season ON public.episodes(season_id, sort_order, num);

DROP TRIGGER IF EXISTS trg_episodes_updated_at ON public.episodes;
CREATE TRIGGER trg_episodes_updated_at
  BEFORE UPDATE ON public.episodes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read episodes" ON public.episodes;
CREATE POLICY "authenticated read episodes"
  ON public.episodes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin insert episodes" ON public.episodes;
CREATE POLICY "admin insert episodes"
  ON public.episodes FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "admin update episodes" ON public.episodes;
CREATE POLICY "admin update episodes"
  ON public.episodes FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "admin delete episodes" ON public.episodes;
CREATE POLICY "admin delete episodes"
  ON public.episodes FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ─── Tabela episode_blocks ────────────────────────────────────────────
-- Cada block é um "card de texto" posicionado dentro do episode.
-- position: 'above_video' (antes do player) ou 'below_video' (depois).
-- sort_order define ordem DENTRO da posição (não global).

CREATE TABLE IF NOT EXISTS public.episode_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id uuid NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  position text NOT NULL CHECK (position IN ('above_video', 'below_video')),
  sort_order int NOT NULL DEFAULT 0,
  -- content: HTML/markdown livre (renderizado como texto com formatação simples)
  content text NOT NULL DEFAULT '',
  -- tipo opcional pra futuras extensões (heading, list, callout, etc).
  -- Por enquanto só 'text'.
  kind text NOT NULL DEFAULT 'text',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocks_episode ON public.episode_blocks(episode_id, position, sort_order);

DROP TRIGGER IF EXISTS trg_blocks_updated_at ON public.episode_blocks;
CREATE TRIGGER trg_blocks_updated_at
  BEFORE UPDATE ON public.episode_blocks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.episode_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read blocks" ON public.episode_blocks;
CREATE POLICY "authenticated read blocks"
  ON public.episode_blocks FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin insert blocks" ON public.episode_blocks;
CREATE POLICY "admin insert blocks"
  ON public.episode_blocks FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "admin update blocks" ON public.episode_blocks;
CREATE POLICY "admin update blocks"
  ON public.episode_blocks FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "admin delete blocks" ON public.episode_blocks;
CREATE POLICY "admin delete blocks"
  ON public.episode_blocks FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));


-- ============================================================================
-- ▼  supabase-comments.sql
-- ============================================================================

-- ============================================================================
-- episode_comments — comentários por episódio (visão do membro)
-- ============================================================================
-- Cada miembro autenticado pode comentar abaixo de um episódio.
-- Identificação: chave composta (season_num, episode_num) — não FK pra
-- evitar acoplamento com a tabela episodes (já existe, mas o componente
-- legado usa números). Funcional pra ambos.

CREATE TABLE IF NOT EXISTS public.episode_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_num int NOT NULL,
  episode_num int NOT NULL,
  author_name text NOT NULL,
  author_avatar text,
  text text NOT NULL CHECK (length(text) > 0 AND length(text) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_episode_comments_season_ep
  ON public.episode_comments (season_num, episode_num, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_episode_comments_user
  ON public.episode_comments (user_id);

ALTER TABLE public.episode_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read all comments" ON public.episode_comments;
CREATE POLICY "authenticated read all comments"
  ON public.episode_comments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "users insert own comments" ON public.episode_comments;
CREATE POLICY "users insert own comments"
  ON public.episode_comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users update own comments" ON public.episode_comments;
CREATE POLICY "users update own comments"
  ON public.episode_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users delete own comments" ON public.episode_comments;
CREATE POLICY "users delete own comments"
  ON public.episode_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admin delete any comment" ON public.episode_comments;
CREATE POLICY "admin delete any comment"
  ON public.episode_comments FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Trigger updated_at (já existe a função touch_updated_at do init principal)
DROP TRIGGER IF EXISTS trg_episode_comments_updated_at ON public.episode_comments;
CREATE TRIGGER trg_episode_comments_updated_at
  BEFORE UPDATE ON public.episode_comments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ============================================================================
-- ▼  supabase-comments-patch.sql
-- ============================================================================

-- Patch: adiciona colunas extras esperadas pelo endpoint /api/episode-comments.
-- Roda DEPOIS do supabase-comments.sql.

ALTER TABLE public.episode_comments
  ADD COLUMN IF NOT EXISTS author_username       text,
  ADD COLUMN IF NOT EXISTS author_avatar_url     text,
  ADD COLUMN IF NOT EXISTS author_badge_id       text,
  ADD COLUMN IF NOT EXISTS author_star_id        text,
  ADD COLUMN IF NOT EXISTS author_flame_id       text,
  ADD COLUMN IF NOT EXISTS author_avatar_border  text,
  ADD COLUMN IF NOT EXISTS author_is_admin       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_comment_id     uuid REFERENCES public.episode_comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS edited_at             timestamptz;

CREATE INDEX IF NOT EXISTS idx_episode_comments_parent
  ON public.episode_comments (parent_comment_id);

-- ─── episode_comment_reactions (likes/dislikes nos comentários) ──
-- O endpoint /api/episode-comments/[id]/react usa esta tabela.

CREATE TABLE IF NOT EXISTS public.episode_comment_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.episode_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction text NOT NULL CHECK (reaction IN ('like', 'dislike')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment
  ON public.episode_comment_reactions (comment_id);

ALTER TABLE public.episode_comment_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read reactions" ON public.episode_comment_reactions;
CREATE POLICY "authenticated read reactions"
  ON public.episode_comment_reactions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "user manages own reaction" ON public.episode_comment_reactions;
CREATE POLICY "user manages own reaction"
  ON public.episode_comment_reactions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================================
-- ▼  supabase-series-info.sql
-- ============================================================================

-- ============================================================================
-- series_info — metadados editáveis da série (single-row pattern)
-- ============================================================================
-- Mantém UMA row apenas. Admin edita via painel.

CREATE TABLE IF NOT EXISTS public.series_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL DEFAULT 'El método para crear embudos gamificados que convierten.',
  cast_text   text NOT NULL DEFAULT 'Los 144000',
  genres      text NOT NULL DEFAULT 'Informativa, Estratégica',
  kind        text NOT NULL DEFAULT 'Informativa, Estratégica',
  year        int  NOT NULL DEFAULT 2026,
  rating      text NOT NULL DEFAULT '+18',
  quality     text NOT NULL DEFAULT 'HD',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_series_info_updated_at ON public.series_info;
CREATE TRIGGER trg_series_info_updated_at
  BEFORE UPDATE ON public.series_info
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.series_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read series_info" ON public.series_info;
CREATE POLICY "authenticated read series_info"
  ON public.series_info FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin update series_info" ON public.series_info;
CREATE POLICY "admin update series_info"
  ON public.series_info FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Seed: garante 1 row existente
INSERT INTO public.series_info (description, cast_text, genres, kind)
SELECT
  'El método para crear embudos gamificados que convierten. Domina los Agentes GPTs, construye tu estructura con producción de contenido audiovisual cinematográfico y entra en la comunidad VIP.',
  'Los 144000',
  'Marketing Digital, Embudos Cinematográficos, Gamificación',
  'Informativa, Estratégica'
WHERE NOT EXISTS (SELECT 1 FROM public.series_info);


-- ============================================================================
-- ▼  supabase-gamification.sql
-- ============================================================================

-- ============================================================================
-- SUPABASE GAMIFICATION — Los 144000
-- ============================================================================
-- Agrega o sistema de gamificação (XP, fórum, follows, notificações, broadcasts,
-- mensagens diretas, etc). Stripe REMOVIDO — este projeto não tem pagamento.
--
-- Como usar:
--   1. Abra SQL Editor do Supabase
--   2. Ctrl+A → Delete
--   3. Cole TODO este arquivo
--   4. Run → "Run without RLS"
--
-- Pré-requisitos: supabase-init.sql + supabase-seasons.sql + supabase-episodes.sql
-- + supabase-comments.sql + supabase-comments-patch.sql JÁ RODADOS.
-- ============================================================================


-- ============================================================================
-- ▼  create-forum-tables.sql
-- ============================================================================
-- ──────────────────────────────────────────────────────────────────────────
-- Fórum da comunidade — posts, respostas e curtidas.
--
-- Estratégia:
--  - forum_posts: post raiz com snapshot de identidade do autor (avatar, badge)
--  - forum_replies: respostas em lista plana (sem threading aninhado)
--  - forum_likes: junction table (1 row por user/post). Garante 1 like por user.
--    likes_count em forum_posts é mantido por trigger (consistência atômica).
--  - replies_count em forum_posts mantido por trigger.
--  - hot: flag auto-marcada por trigger quando likes_count >= 10.
--
-- RLS:
--  - Read: qualquer authenticated (área de membros é gated)
--  - Insert: user só posta com seu próprio user_id
--  - Update/Delete: user só edita/deleta o próprio (admin via service_role bypass)
--
-- Idempotente — pode rodar mais de uma vez.
-- ──────────────────────────────────────────────────────────────────────────

-- ── 1) Posts ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_avatar text,                          -- iniciais OU URL R2 (snapshot)
  author_avatar_url text,                       -- URL absoluta avatar (snapshot)
  author_badge_id text,                         -- insignia destacada (snapshot)
  title text NOT NULL CHECK (length(title) > 0 AND length(title) <= 200),
  body text NOT NULL CHECK (length(body) > 0 AND length(body) <= 5000),
  image_url text,                              -- URL R2 (avatars.SEU_DOMINIO.com/forum/...)
  tags text[] DEFAULT '{}',                    -- array de tags (max 5 cada 30 chars)
  likes_count int NOT NULL DEFAULT 0,
  replies_count int NOT NULL DEFAULT 0,
  hot boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user ON forum_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_hot ON forum_posts (hot, created_at DESC);

ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read posts" ON forum_posts;
CREATE POLICY "authenticated read posts"
  ON forum_posts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users insert own posts" ON forum_posts;
CREATE POLICY "users insert own posts"
  ON forum_posts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users update own posts" ON forum_posts;
CREATE POLICY "users update own posts"
  ON forum_posts FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users delete own posts" ON forum_posts;
CREATE POLICY "users delete own posts"
  ON forum_posts FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- ── 2) Replies ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_avatar text,
  author_avatar_url text,
  author_badge_id text,
  body text NOT NULL CHECK (length(body) > 0 AND length(body) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forum_replies_post ON forum_replies (post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_forum_replies_user ON forum_replies (user_id);

ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read replies" ON forum_replies;
CREATE POLICY "authenticated read replies"
  ON forum_replies FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users insert own replies" ON forum_replies;
CREATE POLICY "users insert own replies"
  ON forum_replies FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users delete own replies" ON forum_replies;
CREATE POLICY "users delete own replies"
  ON forum_replies FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- ── 3) Likes (junction table) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_likes (
  post_id uuid NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_likes_user ON forum_likes (user_id);

ALTER TABLE forum_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read likes" ON forum_likes;
CREATE POLICY "authenticated read likes"
  ON forum_likes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users like own" ON forum_likes;
CREATE POLICY "users like own"
  ON forum_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users unlike own" ON forum_likes;
CREATE POLICY "users unlike own"
  ON forum_likes FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- ── 4) Triggers: mantém likes_count, replies_count, hot ────────────────────
CREATE OR REPLACE FUNCTION recompute_post_counts(p_post_id uuid)
RETURNS void AS $$
DECLARE
  v_likes int;
  v_replies int;
BEGIN
  SELECT COUNT(*) INTO v_likes FROM forum_likes WHERE post_id = p_post_id;
  SELECT COUNT(*) INTO v_replies FROM forum_replies WHERE post_id = p_post_id;
  UPDATE forum_posts
  SET likes_count = v_likes,
      replies_count = v_replies,
      hot = (v_likes >= 10),
      updated_at = now()
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION on_forum_likes_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM recompute_post_counts(NEW.post_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM recompute_post_counts(OLD.post_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_forum_likes_change ON forum_likes;
CREATE TRIGGER trg_forum_likes_change
  AFTER INSERT OR DELETE ON forum_likes
  FOR EACH ROW EXECUTE FUNCTION on_forum_likes_change();

CREATE OR REPLACE FUNCTION on_forum_replies_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM recompute_post_counts(NEW.post_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM recompute_post_counts(OLD.post_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_forum_replies_change ON forum_replies;
CREATE TRIGGER trg_forum_replies_change
  AFTER INSERT OR DELETE ON forum_replies
  FOR EACH ROW EXECUTE FUNCTION on_forum_replies_change();


-- ============================================================================
-- ▼  create-admin-and-feed-posts.sql
-- ============================================================================
-- ──────────────────────────────────────────────────────────────────────────
-- Setup admin + feed_posts.
--
-- 1) Promove user a admin:
--    Use app_metadata.is_admin = true (NÃO user_metadata).
--    user_metadata é editável pelo próprio user → inseguro pra checar role.
--    app_metadata só muda via service_role → fonte de verdade segura.
--
-- 2) Cria tabela feed_posts pra posts do creador (só admin posta).
--
-- IMPORTANT: substituir 'TROCAR_POR_SEU_EMAIL@exemplo.com' pelo email real
-- antes de rodar. Idempotente (pode rodar mais de uma vez sem problema).
-- ──────────────────────────────────────────────────────────────────────────

-- ── 1) Promover user a admin ──────────────────────────────────────────────
-- Substitua o email abaixo pelo seu.
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
WHERE email = 'TROCAR_POR_SEU_EMAIL@exemplo.com';

-- Pra verificar se deu certo:
--   SELECT email, raw_app_meta_data FROM auth.users WHERE email = 'seu@email.com';
-- Esperado: raw_app_meta_data tem "is_admin": true

-- ── 3) Tabela feed_posts ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_avatar text,                          -- iniciais OU URL R2
  type_emoji text NOT NULL DEFAULT '🎬',       -- emoji do tipo (🎬 contenido, 🏆 desafío, 💡 tip, 🎁 bonus)
  type_label text NOT NULL DEFAULT 'NUEVO CONTENIDO',
  type_key text NOT NULL DEFAULT 'content' CHECK (type_key IN ('content','challenge','tip','bonus')),
  title text NOT NULL CHECK (length(title) > 0 AND length(title) <= 200),
  body text NOT NULL CHECK (length(body) > 0 AND length(body) <= 5000),
  pinned boolean NOT NULL DEFAULT false,
  reactions jsonb NOT NULL DEFAULT '[]'::jsonb, -- [["❤️", 142], ["🔥", 89]]
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON feed_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_pinned ON feed_posts (pinned, created_at DESC);

-- RLS: leitura pra qualquer user autenticado (area de membros gated).
-- Insert/Update/Delete: server-side via service_role (admin gateado na API).
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read feed posts" ON feed_posts;
CREATE POLICY "authenticated read feed posts"
  ON feed_posts FOR SELECT
  TO authenticated
  USING (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_feed_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feed_posts_updated_at ON feed_posts;
CREATE TRIGGER trg_feed_posts_updated_at
  BEFORE UPDATE ON feed_posts
  FOR EACH ROW
  EXECUTE FUNCTION set_feed_posts_updated_at();


-- ============================================================================
-- ▼  create-follows-and-notifications.sql
-- ============================================================================
-- ──────────────────────────────────────────────────────────────────────────
-- user_follows + notifications — sistema de seguir + notificações.
--
-- Estratégia:
--  - user_follows: junction table (follower_id, followed_id). Garante 1 follow
--    por par via PRIMARY KEY composto.
--  - notifications: 1 row por evento (reply em post, like, novo feed_post, etc).
--    Cada user vê suas próprias notificações via RLS (user_id = auth.uid()).
--  - Triggers automatizam criação de notification em eventos:
--      a) forum_replies INSERT  → notifica author do post
--      b) forum_likes   INSERT  → notifica author do post (com dedup soft)
--      c) feed_posts    INSERT  → notifica TODOS users (broadcast)
--      d) forum_posts   INSERT  → notifica seguidores do author
--
-- RLS: user só vê suas próprias notificações. Insert/update via service_role.
-- ──────────────────────────────────────────────────────────────────────────

-- ── 1) user_follows ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_follows (
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_followed ON user_follows (followed_id);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read follows" ON user_follows;
CREATE POLICY "authenticated read follows"
  ON user_follows FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users follow as themselves" ON user_follows;
CREATE POLICY "users follow as themselves"
  ON user_follows FOR INSERT TO authenticated
  WITH CHECK (follower_id = auth.uid());

DROP POLICY IF EXISTS "users unfollow themselves" ON user_follows;
CREATE POLICY "users unfollow themselves"
  ON user_follows FOR DELETE TO authenticated
  USING (follower_id = auth.uid());


-- ── 2) notifications ───────────────────────────────────────────────────────
-- type: 'forum_reply' | 'forum_like' | 'feed_post' | 'forum_post_followed'
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  source_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source_user_name text,
  source_user_avatar_url text,
  -- Refs opcionais (preenchidas conforme o type):
  source_forum_post_id uuid,
  source_forum_reply_id uuid,
  source_feed_post_id uuid,
  -- Texto pre-renderizado pro dropdown (evita JOINs no read path)
  title text NOT NULL,
  preview text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON notifications (user_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_user_recent ON notifications (user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own notifications" ON notifications;
CREATE POLICY "users read own notifications"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users update own notifications" ON notifications;
CREATE POLICY "users update own notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- ── 3) Trigger: forum_replies INSERT → notifica author do post ─────────────
CREATE OR REPLACE FUNCTION on_forum_reply_inserted()
RETURNS TRIGGER AS $$
DECLARE
  v_post forum_posts%ROWTYPE;
  v_source_name text;
  v_source_avatar text;
BEGIN
  SELECT * INTO v_post FROM forum_posts WHERE id = NEW.post_id;
  IF NOT FOUND OR v_post.user_id = NEW.user_id THEN
    -- post não existe OU author respondeu próprio post: pula
    RETURN NEW;
  END IF;

  v_source_name := COALESCE(NEW.author_name, 'Miembro');
  v_source_avatar := NEW.author_avatar_url;

  INSERT INTO notifications (
    user_id, type, source_user_id, source_user_name, source_user_avatar_url,
    source_forum_post_id, source_forum_reply_id, title, preview
  ) VALUES (
    v_post.user_id,
    'forum_reply',
    NEW.user_id,
    v_source_name,
    v_source_avatar,
    NEW.post_id,
    NEW.id,
    v_source_name || ' respondió tu publicación',
    LEFT(NEW.body, 140)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notif_forum_reply ON forum_replies;
CREATE TRIGGER trg_notif_forum_reply
  AFTER INSERT ON forum_replies
  FOR EACH ROW EXECUTE FUNCTION on_forum_reply_inserted();


-- ── 4) Trigger: forum_likes INSERT → notifica author (1x por par user/post) ─
CREATE OR REPLACE FUNCTION on_forum_like_inserted()
RETURNS TRIGGER AS $$
DECLARE
  v_post forum_posts%ROWTYPE;
  v_source_meta jsonb;
  v_source_name text;
  v_source_avatar text;
  v_existing_count int;
BEGIN
  SELECT * INTO v_post FROM forum_posts WHERE id = NEW.post_id;
  IF NOT FOUND OR v_post.user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Dedup: se já tem notification de like desse mesmo user pra esse post nas
  -- últimas 24h, pula. Evita spam de "X gostou", "X descurtiu", "X gostou".
  SELECT COUNT(*) INTO v_existing_count
  FROM notifications
  WHERE user_id = v_post.user_id
    AND source_user_id = NEW.user_id
    AND source_forum_post_id = NEW.post_id
    AND type = 'forum_like'
    AND created_at > now() - interval '24 hours';
  IF v_existing_count > 0 THEN
    RETURN NEW;
  END IF;

  -- Pega nome/avatar via metadata
  SELECT raw_user_meta_data INTO v_source_meta FROM auth.users WHERE id = NEW.user_id;
  v_source_name := COALESCE(v_source_meta->>'full_name', 'Miembro');
  v_source_avatar := v_source_meta->>'avatar_url';

  INSERT INTO notifications (
    user_id, type, source_user_id, source_user_name, source_user_avatar_url,
    source_forum_post_id, title, preview
  ) VALUES (
    v_post.user_id,
    'forum_like',
    NEW.user_id,
    v_source_name,
    v_source_avatar,
    NEW.post_id,
    v_source_name || ' le dio ❤️ a tu publicación',
    LEFT(v_post.title, 140)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notif_forum_like ON forum_likes;
CREATE TRIGGER trg_notif_forum_like
  AFTER INSERT ON forum_likes
  FOR EACH ROW EXECUTE FUNCTION on_forum_like_inserted();


-- ── 5) Trigger: feed_posts INSERT → notifica TODOS users (broadcast) ────────
-- Admin postou no feed → todo user que já fez login vê notification.
CREATE OR REPLACE FUNCTION on_feed_post_inserted()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, source_user_id, source_user_name, source_user_avatar_url, source_feed_post_id, title, preview)
  SELECT
    u.id,
    'feed_post',
    NEW.author_id,
    NEW.author_name,
    CASE WHEN NEW.author_avatar LIKE 'http%' THEN NEW.author_avatar ELSE NULL END,
    NEW.id,
    NEW.author_name || ' publicó: ' || LEFT(NEW.title, 80),
    LEFT(NEW.body, 140)
  FROM auth.users u
  WHERE u.id <> NEW.author_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notif_feed_post ON feed_posts;
CREATE TRIGGER trg_notif_feed_post
  AFTER INSERT ON feed_posts
  FOR EACH ROW EXECUTE FUNCTION on_feed_post_inserted();


-- ── 6) Trigger: forum_posts INSERT → notifica seguidores do author ──────────
CREATE OR REPLACE FUNCTION on_forum_post_inserted()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, source_user_id, source_user_name, source_user_avatar_url, source_forum_post_id, title, preview)
  SELECT
    f.follower_id,
    'forum_post_followed',
    NEW.user_id,
    NEW.author_name,
    NEW.author_avatar_url,
    NEW.id,
    NEW.author_name || ' publicó: ' || LEFT(NEW.title, 80),
    LEFT(NEW.body, 140)
  FROM user_follows f
  WHERE f.followed_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notif_forum_post ON forum_posts;
CREATE TRIGGER trg_notif_forum_post
  AFTER INSERT ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION on_forum_post_inserted();


-- ============================================================================
-- ▼  direct-messages-schema.sql
-- ============================================================================
-- Direct Messages — chat privado entre miembros.
-- Texto + imagem + áudio. Realtime via postgres_changes.
-- Bloqueio individual + admin pode ler tudo via service_role (bypassa RLS).

-- ─────────────────────────────────────────────────────────────────────────
-- TABELAS
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text,
  media_url text,
  media_type text CHECK (media_type IN ('image', 'audio')),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  edited_at timestamptz,
  deleted_at timestamptz,
  CHECK (sender_id <> recipient_id),
  CHECK (body IS NULL OR (char_length(body) > 0 AND char_length(body) <= 2000)),
  CHECK (
    (body IS NOT NULL AND char_length(body) > 0)
    OR (media_url IS NOT NULL AND media_type IS NOT NULL)
  )
);

-- Bloqueios individuais. Bloqueia A→B = A não recebe mensagens de B,
-- B não consegue enviar pra A. B pode até tentar mas backend rejeita.
CREATE TABLE IF NOT EXISTS direct_message_blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────

-- Unread badge (recipient queries, otimizado pra count rápido)
CREATE INDEX IF NOT EXISTS idx_dm_recipient_unread
  ON direct_messages(recipient_id)
  WHERE read_at IS NULL AND deleted_at IS NULL;

-- Lista de mensagens por sender (timeline)
CREATE INDEX IF NOT EXISTS idx_dm_sender_created
  ON direct_messages(sender_id, created_at DESC);

-- Lista de mensagens por recipient
CREATE INDEX IF NOT EXISTS idx_dm_recipient_created
  ON direct_messages(recipient_id, created_at DESC);

-- Threads pair lookup (LEAST/GREATEST normaliza ordem dos ids)
CREATE INDEX IF NOT EXISTS idx_dm_thread_pair
  ON direct_messages(LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_message_blocks ENABLE ROW LEVEL SECURITY;

-- Mensagens: sender e recipient leem. Admin lê tudo via service_role (bypassa RLS).
DROP POLICY IF EXISTS "dm_select_own" ON direct_messages;
CREATE POLICY "dm_select_own" ON direct_messages
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "dm_insert_own" ON direct_messages;
CREATE POLICY "dm_insert_own" ON direct_messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "dm_update_own" ON direct_messages;
CREATE POLICY "dm_update_own" ON direct_messages
  FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Recipient pode marcar como lida (UPDATE read_at). Sender pode editar/deletar próprias.
-- Granularidade fina via app — RLS deixa ambos atualizarem porque postgres não distingue
-- qual coluna foi setada na update sem trigger. Trigger desnecessário pra MVP.

-- Bloqueios: cada user gerencia os próprios.
DROP POLICY IF EXISTS "dmb_select_own" ON direct_message_blocks;
CREATE POLICY "dmb_select_own" ON direct_message_blocks
  FOR SELECT
  USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "dmb_insert_own" ON direct_message_blocks;
CREATE POLICY "dmb_insert_own" ON direct_message_blocks
  FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "dmb_delete_own" ON direct_message_blocks;
CREATE POLICY "dmb_delete_own" ON direct_message_blocks
  FOR DELETE
  USING (auth.uid() = blocker_id);

-- ─────────────────────────────────────────────────────────────────────────
-- REALTIME
-- ─────────────────────────────────────────────────────────────────────────

-- Habilita postgres_changes na tabela direct_messages.
-- Cliente assina WHERE recipient_id = auth.uid() pra receber novas msgs em tempo real.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'direct_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
  END IF;
END $$;


-- ============================================================================
-- ▼  create-account-invites-table.sql
-- ============================================================================
-- ──────────────────────────────────────────────────────────────────────────
-- account_invites: tokens únicos para criação de conta após compra Stripe.
--
-- Fluxo:
--  1. Stripe webhook (sale_type=front) cria registro com token + envia email
--  2. Cliente clica no link → /cuenta/crear?token=XXX
--  3. Servidor valida (não usado, não expirado) → cria conta no Supabase Auth
--  4. Marca token como used_at (uma vez só)
--
-- Idempotência:
--  - unique constraint em (email): se cliente recompra, regeneramos token (não duplica)
--  - unique constraint em (stripe_payment_intent_id): proteção contra retry de webhook
--  - unique constraint em (token): garante busca por token única
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS account_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  email_error TEXT,
  resend_count INT NOT NULL DEFAULT 0
);

-- Índices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_account_invites_token ON account_invites (token) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_account_invites_email ON account_invites (email);
CREATE INDEX IF NOT EXISTS idx_account_invites_pi ON account_invites (stripe_payment_intent_id);

-- RLS: nenhum acesso direto via anon. Tudo passa por service_role nas API routes.
ALTER TABLE account_invites ENABLE ROW LEVEL SECURITY;

-- Policy: bloqueia tudo por default. Service role bypass RLS automaticamente.
CREATE POLICY "no_public_access" ON account_invites
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Cleanup automático de tokens expirados há mais de 30 dias (limpa tabela).
-- Roda via pg_cron — adicionar no scheduler depois:
--   SELECT cron.schedule('cleanup-expired-invites', '0 3 * * *',
--     $$DELETE FROM account_invites WHERE expires_at < now() - interval '30 days' AND used_at IS NULL$$);


-- ============================================================================
-- ▼  create-site-texts.sql
-- ============================================================================
-- ──────────────────────────────────────────────────────────────────────────
-- site_texts: overrides editáveis pelo admin pra textos da plataforma.
--
-- Estrutura key/value:
--   key   = identificador estável (ex: "section.tienda.title")
--   value = texto exibido (admin pode editar)
--
-- Frontend mantém defaults em código (lib/site-texts.ts). Se uma key tem
-- registro nessa tabela, o valor sobrescreve o default. Senão, mostra default.
--
-- Idempotente — pode rodar várias vezes sem problema.
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS site_texts (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: leitura pública (qualquer authenticated pode ler).
-- Insert/Update: server-side via service_role (admin gateado nas APIs).
ALTER TABLE site_texts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read site_texts" ON site_texts;
CREATE POLICY "authenticated read site_texts"
  ON site_texts FOR SELECT
  TO authenticated
  USING (true);


-- ============================================================================
-- ▼  email-send-log-schema.sql
-- ============================================================================
-- Email Send Log — auditoria centralizada de todos os disparos de email
-- pós-compra (invite, account_exists, retry manual, recovery, etc).
--
-- Source-of-truth pra:
--   - Dashboard admin "compras sem email entregue"
--   - Detecção de falhas Resend
--   - Retry automático (futuro: cron job)

CREATE TABLE IF NOT EXISTS email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  -- Tipos: 'invite' (criar conta), 'account_exists' (já tem conta),
  -- 'recovery' (recuperação senha), 'manual' (admin grant)
  email_type text NOT NULL CHECK (email_type IN ('invite', 'account_exists', 'recovery', 'manual')),
  -- Origem: stripe_front, stripe_installment, hotmart, manual_grant, admin_resend
  source text NOT NULL,
  -- Reference: PI Stripe, transactionId Hotmart, ou null pra manual
  source_ref text,
  -- Status do envio
  status text NOT NULL CHECK (status IN ('success', 'failed', 'error')),
  error_message text,
  -- Resend response id (pra debug/cross-reference)
  resend_id text,
  -- Tentativa atual (1, 2, 3...) — pra retry tracking
  attempt integer NOT NULL DEFAULT 1,
  -- Snapshot do payload enviado (pra replay/debug)
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Lookup por email (admin: histórico desse cliente)
CREATE INDEX IF NOT EXISTS idx_email_log_email
  ON email_send_log(email, created_at DESC);

-- Lookup por status falhado (admin: lista de problemas)
CREATE INDEX IF NOT EXISTS idx_email_log_failed
  ON email_send_log(created_at DESC)
  WHERE status IN ('failed', 'error');

-- Lookup por source_ref (cross-reference com sistemas externos)
CREATE INDEX IF NOT EXISTS idx_email_log_source_ref
  ON email_send_log(source_ref)
  WHERE source_ref IS NOT NULL;

-- RLS: só admin lê (via service_role). Insert é só backend (service_role).
ALTER TABLE email_send_log ENABLE ROW LEVEL SECURITY;
-- Sem policies = ninguém via anon/authenticated, só service_role bypassa


-- ============================================================================
-- ▼  public-broadcasts.sql
-- ============================================================================
-- ──────────────────────────────────────────────────────────────────────────
-- PUBLIC BROADCASTS — eventos que merecem ser vistos por todos members
--
-- Estratégia:
--  - Triggers SQL inserem notification 'public_*' broadcast (1 row por user)
--  - Frontend filtra por tipo e mostra popup overlay (queue)
--  - Som específico por tipo
--
-- Eventos:
--   public_level_up    — user subiu pra LV >= 10 (qualquer level a partir de 10)
--   public_rank_up     — community rank changed (Recluta → Agente, etc.)
--   public_insignia    — desbloqueou insignia silver/gold/platinum (raras)
--   public_funnel_hot  — funnel atingiu 3+ likes (libera XP + broadcast)
--   public_streak      — completou marco de 30, 90 ou 365 dias
--   public_top3        — entrou no top 3 do ranking de XP (futuro)
-- ──────────────────────────────────────────────────────────────────────────

-- ── 1) Level-up broadcast (LV >= 10 sempre, qualquer level) ────────────────
CREATE OR REPLACE FUNCTION on_user_xp_change()
RETURNS TRIGGER AS $$
DECLARE
  v_new_level int;
  v_meta jsonb;
  v_name text;
  v_avatar text;
BEGIN
  v_new_level := compute_level_from_xp(NEW.total_xp, NEW.bonus_levels);
  IF v_new_level <> NEW.current_level THEN
    NEW.current_level := v_new_level;
    -- Subiu de level
    IF v_new_level > COALESCE(OLD.current_level, 1) THEN
      -- 1) Notification privada (sempre)
      INSERT INTO notifications (user_id, type, title, preview)
      VALUES (NEW.user_id, 'level_up', '¡Subiste de nivel! Ahora eres LV ' || v_new_level,
        'Sigue creando, comentando y ganando insignias para subir más.');

      -- 2) Broadcast público SE level >= 10
      IF v_new_level >= 10 THEN
        SELECT raw_user_meta_data INTO v_meta FROM auth.users WHERE id = NEW.user_id;
        v_name := COALESCE(v_meta->>'full_name', 'Miembro');
        v_avatar := v_meta->>'avatar_url';
        INSERT INTO notifications (user_id, type, source_user_id, source_user_name, source_user_avatar_url, title, preview)
        SELECT u.id, 'public_level_up', NEW.user_id, v_name, v_avatar,
          v_name || ' subió a LV ' || v_new_level || ' 🚀',
          '¡Felicítalo en la comunidad!'
        FROM auth.users u WHERE u.id <> NEW.user_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 2) Funnel HOT broadcast (atinge 3+ likes — libera XP + broadcast) ──────
CREATE OR REPLACE FUNCTION on_funnel_likes_threshold() RETURNS TRIGGER AS $$
DECLARE v_meta jsonb; v_name text; v_avatar text;
BEGIN
  IF NEW.likes_count >= 3 AND NEW.xp_released = false THEN
    PERFORM apply_xp_delta(NEW.user_id, 'funnel_created', 150, 0, 'user_funnels', NEW.id::text);
    NEW.xp_released := true;

    -- Notification privada pro author
    INSERT INTO notifications (user_id, type, title, preview)
    VALUES (NEW.user_id, 'funnel_xp_released', '¡Tu funnel ganó XP!',
      'Recibió 3+ likes y desbloqueó +150 XP. Sigue compartiendo.');

    -- Broadcast público pra todos (funnel HOT)
    SELECT raw_user_meta_data INTO v_meta FROM auth.users WHERE id = NEW.user_id;
    v_name := COALESCE(v_meta->>'full_name', 'Miembro');
    v_avatar := v_meta->>'avatar_url';
    INSERT INTO notifications (user_id, type, source_user_id, source_user_name, source_user_avatar_url, title, preview)
    SELECT u.id, 'public_funnel_hot', NEW.user_id, v_name, v_avatar,
      'Funnel HOT 🔥 ' || NEW.name,
      v_name || ' compartió un funnel que está pegando.'
    FROM auth.users u WHERE u.id <> NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 3) Helper: broadcast genérico (chamado por APIs server-side) ───────────
-- Pra insignia raras + streak milestone + rank up: vamos chamar de Node em vez
-- de trigger SQL (tem mais contexto sobre tier/category).
-- Esse helper já existe via INSERT direto, então só precisa do trigger acima.


-- ============================================================================
-- ▼  create-api-rate-limit-table.sql
-- ============================================================================
-- Rate limit genérico pra rotas API públicas (track, lead, upsell, etc).
-- Cada bucket = (chave do limite + IP). Auto-limpa via TTL na função.

CREATE TABLE IF NOT EXISTS public.api_rate_limit (
  bucket text NOT NULL,
  ip text NOT NULL,
  hits integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket, ip)
);

ALTER TABLE public.api_rate_limit ENABLE ROW LEVEL SECURITY;

-- Index pra cleanup periódico
CREATE INDEX IF NOT EXISTS idx_api_rate_limit_window
  ON public.api_rate_limit(window_start);


-- ============================================================================
-- ▼  create-rate-limit-table.sql
-- ============================================================================
-- Tabela para rate limiting do dashboard (substitui Upstash Redis)
-- Armazena tentativas erradas por IP com expiração automática

CREATE TABLE IF NOT EXISTS public.dashboard_rate_limit (
  ip       text        PRIMARY KEY,
  attempts integer     NOT NULL DEFAULT 0,
  blocked_until timestamptz NOT NULL DEFAULT now()
);


-- ============================================================================
-- ▼  create-user-xp.sql
-- ============================================================================
-- ──────────────────────────────────────────────────────────────────────────
-- user_xp + xp_events — sistema de XP e Level.
--
-- user_xp: 1 row por user com snapshot do total_xp + bonus_levels (compras)
-- xp_events: log append-only de cada evento que deu XP/level (audit + history)
--
-- Triggers automatizam award:
--   - forum_posts INSERT     → +50 XP
--   - forum_replies INSERT   → +20 XP
--   - forum_likes INSERT     → +5 XP pro author do post
--   - episode_comments INSERT → +10 XP
--
-- Compra de produto (removida nesta build — sem Stripe)
-- → +1 bonus_level (NÃO via XP). Trigger separada.
--
-- Notification de level-up: lib/xp-grant.ts (server-side) detecta level
-- mudou e cria row em notifications.
-- ──────────────────────────────────────────────────────────────────────────

-- ── user_xp ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_xp (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp int NOT NULL DEFAULT 0,
  bonus_levels int NOT NULL DEFAULT 0,    -- +1 por produto comprado
  current_level int NOT NULL DEFAULT 1,   -- cache do level computado (helper na app calcula real)
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read xp" ON user_xp;
CREATE POLICY "authenticated read xp"
  ON user_xp FOR SELECT TO authenticated USING (true);


-- ── xp_events (log) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  xp_delta int NOT NULL DEFAULT 0,
  level_delta int NOT NULL DEFAULT 0,
  source_table text,                       -- 'forum_posts', 'forum_replies', etc
  source_id text,                          -- id do recurso (string pra suportar pi_xxx)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xp_events_user ON xp_events (user_id, created_at DESC);

ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users read own xp events" ON xp_events;
CREATE POLICY "users read own xp events"
  ON xp_events FOR SELECT TO authenticated USING (user_id = auth.uid());


-- ── Helper: aplica delta atomicamente ──────────────────────────────────────
CREATE OR REPLACE FUNCTION apply_xp_delta(
  p_user_id uuid,
  p_event_type text,
  p_xp_delta int,
  p_level_delta int,
  p_source_table text,
  p_source_id text
)
RETURNS void AS $$
BEGIN
  -- Garante row em user_xp
  INSERT INTO user_xp (user_id, total_xp, bonus_levels)
  VALUES (p_user_id, GREATEST(0, p_xp_delta), GREATEST(0, p_level_delta))
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = user_xp.total_xp + GREATEST(0, p_xp_delta),
    bonus_levels = user_xp.bonus_levels + GREATEST(0, p_level_delta),
    updated_at = now();

  -- Log do evento
  INSERT INTO xp_events (user_id, event_type, xp_delta, level_delta, source_table, source_id)
  VALUES (p_user_id, p_event_type, p_xp_delta, p_level_delta, p_source_table, p_source_id);
END;
$$ LANGUAGE plpgsql;


-- ── Triggers: awards automáticos ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION on_xp_forum_post()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM apply_xp_delta(NEW.user_id, 'forum_post', 50, 0, 'forum_posts', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_xp_forum_post ON forum_posts;
CREATE TRIGGER trg_xp_forum_post
  AFTER INSERT ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION on_xp_forum_post();


CREATE OR REPLACE FUNCTION on_xp_forum_reply()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM apply_xp_delta(NEW.user_id, 'forum_reply', 20, 0, 'forum_replies', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_xp_forum_reply ON forum_replies;
CREATE TRIGGER trg_xp_forum_reply
  AFTER INSERT ON forum_replies
  FOR EACH ROW EXECUTE FUNCTION on_xp_forum_reply();


CREATE OR REPLACE FUNCTION on_xp_forum_like()
RETURNS TRIGGER AS $$
DECLARE v_post_owner uuid;
BEGIN
  SELECT user_id INTO v_post_owner FROM forum_posts WHERE id = NEW.post_id;
  IF v_post_owner IS NOT NULL AND v_post_owner <> NEW.user_id THEN
    PERFORM apply_xp_delta(v_post_owner, 'forum_like_received', 5, 0, 'forum_likes', NEW.post_id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_xp_forum_like ON forum_likes;
CREATE TRIGGER trg_xp_forum_like
  AFTER INSERT ON forum_likes
  FOR EACH ROW EXECUTE FUNCTION on_xp_forum_like();


CREATE OR REPLACE FUNCTION on_xp_episode_comment()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM apply_xp_delta(NEW.user_id, 'episode_comment', 10, 0, 'episode_comments', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_xp_episode_comment ON episode_comments;
CREATE TRIGGER trg_xp_episode_comment
  AFTER INSERT ON episode_comments
  FOR EACH ROW EXECUTE FUNCTION on_xp_episode_comment();


-- ── Detector de Level-Up: cria notification quando level aumenta ────────────
-- Replica curva da app: XP do level N → N+1 = round(100 * N^1.35).
-- Quando user_xp.total_xp ou bonus_levels atualiza, recalcula level e
-- compara com current_level. Se subiu, atualiza + cria notification.

CREATE OR REPLACE FUNCTION compute_level_from_xp(p_total_xp int, p_bonus int)
RETURNS int AS $$
DECLARE
  v_level int := 1;
  v_acc int := 0;
  v_need int;
BEGIN
  WHILE v_level < 200 LOOP
    v_need := round(100 * power(v_level, 1.35));
    EXIT WHEN v_acc + v_need > p_total_xp;
    v_acc := v_acc + v_need;
    v_level := v_level + 1;
  END LOOP;
  RETURN LEAST(200, v_level + GREATEST(0, p_bonus));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION on_user_xp_change()
RETURNS TRIGGER AS $$
DECLARE
  v_new_level int;
BEGIN
  v_new_level := compute_level_from_xp(NEW.total_xp, NEW.bonus_levels);
  IF v_new_level <> NEW.current_level THEN
    NEW.current_level := v_new_level;
    -- Só dispara notification se subiu (não desce)
    IF v_new_level > COALESCE(OLD.current_level, 1) THEN
      INSERT INTO notifications (user_id, type, title, preview)
      VALUES (
        NEW.user_id,
        'level_up',
        '¡Subiste de nivel! Ahora eres LV ' || v_new_level,
        'Sigue creando, comentando y ganando insignias para subir más.'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_xp_change ON user_xp;
CREATE TRIGGER trg_user_xp_change
  BEFORE UPDATE OF total_xp, bonus_levels ON user_xp
  FOR EACH ROW EXECUTE FUNCTION on_user_xp_change();


-- ============================================================================
-- ▼  expand-xp-system.sql
-- ============================================================================
-- ──────────────────────────────────────────────────────────────────────────
-- EXPANSÃO DO SISTEMA DE XP — XP em TODAS interações da gamificação
--
-- Roda esse SQL UMA VEZ depois das migrations anteriores. Idempotente.
--
-- Adiciona:
--  - forum_reply_likes table (pra dar like em respostas)
--  - episode_comments.parent_comment_id (replies em comentarios de aulas)
--  - SECURITY DEFINER em todas as funções de trigger (fix RLS)
--  - Novos triggers de XP pra:
--      * forum_reply_like recebido (+5)
--      * forum_post_like dado (+1) -- low incentive pra incentivar engajamento
--      * funnel compartilhado (+30)
--      * funnel_reaction recebida (+10 like)
--      * funnel_feedback dado (+15) e recebido (+5)
--      * user_follows recebido (+5)
-- ──────────────────────────────────────────────────────────────────────────

-- ── 1) ALTER episode_comments pra threading ───────────────────────────────
ALTER TABLE episode_comments ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES episode_comments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_episode_comments_parent ON episode_comments (parent_comment_id, created_at ASC);


-- ── 2) forum_reply_likes (likes em respostas do fórum) ────────────────────
CREATE TABLE IF NOT EXISTS forum_reply_likes (
  reply_id uuid NOT NULL REFERENCES forum_replies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reply_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_forum_reply_likes_user ON forum_reply_likes (user_id);
ALTER TABLE forum_reply_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated read reply likes" ON forum_reply_likes;
CREATE POLICY "authenticated read reply likes" ON forum_reply_likes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "users like reply own" ON forum_reply_likes;
CREATE POLICY "users like reply own" ON forum_reply_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "users unlike reply own" ON forum_reply_likes;
CREATE POLICY "users unlike reply own" ON forum_reply_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS likes_count int NOT NULL DEFAULT 0;


-- ── 3) Helper: recompute reply count
CREATE OR REPLACE FUNCTION recompute_reply_likes(p_reply_id uuid) RETURNS void AS $$
DECLARE v int;
BEGIN
  SELECT COUNT(*) INTO v FROM forum_reply_likes WHERE reply_id = p_reply_id;
  UPDATE forum_replies SET likes_count = v WHERE id = p_reply_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION on_forum_reply_like_change() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN PERFORM recompute_reply_likes(NEW.reply_id); RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN PERFORM recompute_reply_likes(OLD.reply_id); RETURN OLD; END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_forum_reply_like_change ON forum_reply_likes;
CREATE TRIGGER trg_forum_reply_like_change AFTER INSERT OR DELETE ON forum_reply_likes FOR EACH ROW EXECUTE FUNCTION on_forum_reply_like_change();


-- ── 4) XP triggers — fix SECURITY DEFINER em tudo ──────────────────────────
ALTER FUNCTION on_forum_reply_inserted() SECURITY DEFINER;
ALTER FUNCTION on_forum_like_inserted() SECURITY DEFINER;
ALTER FUNCTION on_feed_post_inserted() SECURITY DEFINER;
ALTER FUNCTION on_forum_post_inserted() SECURITY DEFINER;
ALTER FUNCTION apply_xp_delta(uuid, text, int, int, text, text) SECURITY DEFINER;
ALTER FUNCTION on_xp_forum_post() SECURITY DEFINER;
ALTER FUNCTION on_xp_forum_reply() SECURITY DEFINER;
ALTER FUNCTION on_xp_forum_like() SECURITY DEFINER;
ALTER FUNCTION on_xp_episode_comment() SECURITY DEFINER;
ALTER FUNCTION on_user_xp_change() SECURITY DEFINER;
ALTER FUNCTION recompute_post_counts(uuid) SECURITY DEFINER;
ALTER FUNCTION on_forum_likes_change() SECURITY DEFINER;
ALTER FUNCTION on_forum_replies_change() SECURITY DEFINER;


-- ── 5) Novos triggers de XP ────────────────────────────────────────────────

-- 5.1 — Like em forum_reply: +5 pro autor do reply (não pro próprio user)
CREATE OR REPLACE FUNCTION on_xp_forum_reply_like() RETURNS TRIGGER AS $$
DECLARE v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM forum_replies WHERE id = NEW.reply_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    PERFORM apply_xp_delta(v_owner, 'forum_reply_like_received', 5, 0, 'forum_reply_likes', NEW.reply_id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_xp_forum_reply_like ON forum_reply_likes;
CREATE TRIGGER trg_xp_forum_reply_like AFTER INSERT ON forum_reply_likes FOR EACH ROW EXECUTE FUNCTION on_xp_forum_reply_like();

-- 5.2 — Dar like em post: +1 pra quem curtiu (incentivo leve a engajamento)
CREATE OR REPLACE FUNCTION on_xp_forum_like_given() RETURNS TRIGGER AS $$
BEGIN
  PERFORM apply_xp_delta(NEW.user_id, 'forum_like_given', 1, 0, 'forum_likes', NEW.post_id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_xp_forum_like_given ON forum_likes;
CREATE TRIGGER trg_xp_forum_like_given AFTER INSERT ON forum_likes FOR EACH ROW EXECUTE FUNCTION on_xp_forum_like_given();

-- 5.3 — Compartilhar funnel: +30 pro autor
CREATE OR REPLACE FUNCTION on_xp_funnel_created() RETURNS TRIGGER AS $$
BEGIN
  PERFORM apply_xp_delta(NEW.user_id, 'funnel_created', 30, 0, 'user_funnels', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_xp_funnel_created ON user_funnels;
CREATE TRIGGER trg_xp_funnel_created AFTER INSERT ON user_funnels FOR EACH ROW EXECUTE FUNCTION on_xp_funnel_created();

-- 5.4 — Like em funnel: +10 pro author do funnel (só like, dislike não dá)
CREATE OR REPLACE FUNCTION on_xp_funnel_reaction() RETURNS TRIGGER AS $$
DECLARE v_owner uuid;
BEGIN
  IF NEW.vote <> 'like' THEN RETURN NEW; END IF;
  SELECT user_id INTO v_owner FROM user_funnels WHERE id = NEW.funnel_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    PERFORM apply_xp_delta(v_owner, 'funnel_like_received', 10, 0, 'funnel_reactions', NEW.funnel_id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_xp_funnel_reaction ON funnel_reactions;
CREATE TRIGGER trg_xp_funnel_reaction AFTER INSERT OR UPDATE ON funnel_reactions FOR EACH ROW EXECUTE FUNCTION on_xp_funnel_reaction();

-- 5.5 — Comentar/feedback em funnel: +15 pra quem comentou, +5 pro autor do funnel
CREATE OR REPLACE FUNCTION on_xp_funnel_feedback() RETURNS TRIGGER AS $$
DECLARE v_owner uuid;
BEGIN
  -- Quem comentou ganha +15
  PERFORM apply_xp_delta(NEW.user_id, 'funnel_feedback_given', 15, 0, 'funnel_feedbacks', NEW.id::text);
  -- Author do funnel ganha +5 (se não for o próprio comentando)
  SELECT user_id INTO v_owner FROM user_funnels WHERE id = NEW.funnel_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    PERFORM apply_xp_delta(v_owner, 'funnel_feedback_received', 5, 0, 'funnel_feedbacks', NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_xp_funnel_feedback ON funnel_feedbacks;
CREATE TRIGGER trg_xp_funnel_feedback AFTER INSERT ON funnel_feedbacks FOR EACH ROW EXECUTE FUNCTION on_xp_funnel_feedback();

-- 5.6 — Ser seguido: +5 pro user seguido + notification
CREATE OR REPLACE FUNCTION on_xp_user_followed() RETURNS TRIGGER AS $$
DECLARE v_follower_meta jsonb; v_follower_name text; v_follower_avatar text;
BEGIN
  -- XP: +5 pro user seguido
  PERFORM apply_xp_delta(NEW.followed_id, 'user_followed', 5, 0, 'user_follows', NEW.follower_id::text);

  -- Notification: avisa o user seguido
  SELECT raw_user_meta_data INTO v_follower_meta FROM auth.users WHERE id = NEW.follower_id;
  v_follower_name := COALESCE(v_follower_meta->>'full_name', 'Miembro');
  v_follower_avatar := v_follower_meta->>'avatar_url';
  INSERT INTO notifications (user_id, type, source_user_id, source_user_name, source_user_avatar_url, title, preview)
  VALUES (NEW.followed_id, 'user_followed', NEW.follower_id, v_follower_name, v_follower_avatar,
    v_follower_name || ' empezó a seguirte', 'Activó las notificaciones de tus publicaciones.');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_xp_user_followed ON user_follows;
CREATE TRIGGER trg_xp_user_followed AFTER INSERT ON user_follows FOR EACH ROW EXECUTE FUNCTION on_xp_user_followed();


-- ============================================================================
-- ▼  xp-tweaks.sql
-- ============================================================================
-- ──────────────────────────────────────────────────────────────────────────
-- Ajustes de valores de XP + likes "dados" em todas categorias
--
-- Mudanças:
--   funnel_created: 30 → 500
--   funnel_like_received: 10 → 5 (alinha com regra "qualquer like recebido = 5")
--   user_followed: 5 → 10
--
-- Novos: dar like em qualquer lugar = +1 XP
--   forum_reply_like (dado): +1
--   episode_comment_like (dado): +1
--   funnel_reaction_like (dado): +1
-- ──────────────────────────────────────────────────────────────────────────

-- Funnel created: 500 XP
CREATE OR REPLACE FUNCTION on_xp_funnel_created() RETURNS TRIGGER AS $$
BEGIN
  PERFORM apply_xp_delta(NEW.user_id, 'funnel_created', 500, 0, 'user_funnels', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funnel like recebido: 5 XP (era 10)
CREATE OR REPLACE FUNCTION on_xp_funnel_reaction() RETURNS TRIGGER AS $$
DECLARE v_owner uuid;
BEGIN
  IF NEW.vote <> 'like' THEN RETURN NEW; END IF;
  SELECT user_id INTO v_owner FROM user_funnels WHERE id = NEW.funnel_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    PERFORM apply_xp_delta(v_owner, 'funnel_like_received', 5, 0, 'funnel_reactions', NEW.funnel_id::text);
  END IF;
  -- Quem deu like também ganha +1
  IF NEW.vote = 'like' THEN
    PERFORM apply_xp_delta(NEW.user_id, 'funnel_like_given', 1, 0, 'funnel_reactions', NEW.funnel_id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ser seguido: 10 XP (era 5)
CREATE OR REPLACE FUNCTION on_xp_user_followed() RETURNS TRIGGER AS $$
DECLARE v_meta jsonb; v_name text; v_avatar text;
BEGIN
  PERFORM apply_xp_delta(NEW.followed_id, 'user_followed', 10, 0, 'user_follows', NEW.follower_id::text);
  SELECT raw_user_meta_data INTO v_meta FROM auth.users WHERE id = NEW.follower_id;
  v_name := COALESCE(v_meta->>'full_name', 'Miembro');
  v_avatar := v_meta->>'avatar_url';
  INSERT INTO notifications (user_id, type, source_user_id, source_user_name, source_user_avatar_url, title, preview)
  VALUES (NEW.followed_id, 'user_followed', NEW.follower_id, v_name, v_avatar, v_name || ' empezó a seguirte', 'Activó las notificaciones de tus publicaciones.');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Forum reply like: ja dá 5 pro author. Agora também +1 pra quem deu like.
CREATE OR REPLACE FUNCTION on_xp_forum_reply_like() RETURNS TRIGGER AS $$
DECLARE v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM forum_replies WHERE id = NEW.reply_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    PERFORM apply_xp_delta(v_owner, 'forum_reply_like_received', 5, 0, 'forum_reply_likes', NEW.reply_id::text);
  END IF;
  -- +1 pra quem deu o like
  PERFORM apply_xp_delta(NEW.user_id, 'forum_reply_like_given', 1, 0, 'forum_reply_likes', NEW.reply_id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Episode comment reaction: +5 pro author no like + 1 pra quem deu
CREATE OR REPLACE FUNCTION on_xp_ec_reaction() RETURNS TRIGGER AS $$
DECLARE v_owner uuid;
BEGIN
  IF NEW.vote <> 'like' THEN RETURN NEW; END IF;
  SELECT user_id INTO v_owner FROM episode_comments WHERE id = NEW.comment_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    PERFORM apply_xp_delta(v_owner, 'episode_comment_like_received', 5, 0, 'episode_comment_reactions', NEW.comment_id::text);
  END IF;
  -- +1 pra quem deu o like
  PERFORM apply_xp_delta(NEW.user_id, 'episode_comment_like_given', 1, 0, 'episode_comment_reactions', NEW.comment_id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Standardização: comentar/responder em QUALQUER LUGAR = +10 XP ───────────
-- forum_reply: 20 → 10
CREATE OR REPLACE FUNCTION on_xp_forum_reply() RETURNS TRIGGER AS $$
BEGIN
  PERFORM apply_xp_delta(NEW.user_id, 'forum_reply', 10, 0, 'forum_replies', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- funnel_feedback (dar feedback): 15 → 10
-- Mantém o +5 pro author do funnel (já está ok)
CREATE OR REPLACE FUNCTION on_xp_funnel_feedback() RETURNS TRIGGER AS $$
DECLARE v_owner uuid;
BEGIN
  PERFORM apply_xp_delta(NEW.user_id, 'funnel_feedback_given', 10, 0, 'funnel_feedbacks', NEW.id::text);
  SELECT user_id INTO v_owner FROM user_funnels WHERE id = NEW.funnel_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    PERFORM apply_xp_delta(v_owner, 'funnel_feedback_received', 5, 0, 'funnel_feedbacks', NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- episode_comment continua +10 (já estava certo)


-- ============================================================================
-- ▼  update-level-up-self-broadcast.sql
-- ============================================================================
-- Atualiza o trigger on_user_xp_change pra também inserir notif "self"
-- pro recipient quando ele sobe pra LV >= 10. Assim:
--   - Recipient: notif persistente no sino, popup no próximo login se offline
--   - Outros: broadcast só em tempo real (filtrado por idade no /api/notifications)
--
-- LV < 10 continua só com 'level_up' privado (sem popup, evita spam de
-- popups de levels iniciais que sobem rápido).
--
-- ⚠️ RODAR NO SUPABASE SQL EDITOR

CREATE OR REPLACE FUNCTION on_user_xp_change()
RETURNS TRIGGER AS $$
DECLARE
  v_new_level int;
  v_meta jsonb;
  v_name text;
  v_avatar text;
BEGIN
  v_new_level := compute_level_from_xp(NEW.total_xp, NEW.bonus_levels);
  IF v_new_level <> NEW.current_level THEN
    NEW.current_level := v_new_level;
    -- Subiu de level
    IF v_new_level > COALESCE(OLD.current_level, 1) THEN
      -- 1) Notification privada simples (sempre, qualquer level)
      INSERT INTO notifications (user_id, type, title, preview)
      VALUES (NEW.user_id, 'level_up', '¡Subiste de nivel! Ahora eres LV ' || v_new_level,
        'Sigue creando, comentando y ganando insignias para subir más.');

      -- 2) LV >= 10: broadcast popup pessoal pro recipient + FOMO pros outros
      IF v_new_level >= 10 THEN
        SELECT raw_user_meta_data INTO v_meta FROM auth.users WHERE id = NEW.user_id;
        v_name := COALESCE(v_meta->>'full_name', 'Miembro');
        v_avatar := v_meta->>'avatar_url';

        -- 2a) Notif pessoal pro recipient (type _self bypassa fresh window)
        INSERT INTO notifications (user_id, type, source_user_id, source_user_name, source_user_avatar_url, title, preview)
        VALUES (NEW.user_id, 'public_level_up_self', NEW.user_id, v_name, v_avatar,
          '¡Subiste a LV ' || v_new_level || '! 🚀',
          'Sigue creando, comentando y ganando insignias para subir más.');

        -- 2b) Broadcast FOMO pros outros (filtrado por 5min em /api/notifications)
        INSERT INTO notifications (user_id, type, source_user_id, source_user_name, source_user_avatar_url, title, preview)
        SELECT u.id, 'public_level_up', NEW.user_id, v_name, v_avatar,
          v_name || ' subió a LV ' || v_new_level || ' 🚀',
          '¡Felicítalo en la comunidad!'
        FROM auth.users u WHERE u.id <> NEW.user_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verifica que o trigger continua attached (não foi removido)
SELECT tgname, tgenabled FROM pg_trigger
WHERE tgname LIKE '%xp%' AND tgrelid = 'user_xp'::regclass;


-- ============================================================================
-- ▼  add-author-username.sql
-- ============================================================================
-- Adiciona campo author_username em snapshots de comments/posts/replies
-- pra exibir @username junto com nome completo nas interações da comunidade.
-- Idempotente.

ALTER TABLE episode_comments ADD COLUMN IF NOT EXISTS author_username text;
ALTER TABLE forum_posts      ADD COLUMN IF NOT EXISTS author_username text;
ALTER TABLE forum_replies    ADD COLUMN IF NOT EXISTS author_username text;


-- ============================================================================
-- ▼  add-author-is-admin.sql
-- ============================================================================
-- ──────────────────────────────────────────────────────────────────────────
-- Snapshot is_admin no autor de cada interação — pra renderizar tag "ADM"
-- (ou "MIEMBRO") no UI sem precisar consultar auth.users a cada render.
--
-- Também atualiza posts/replies/comments existentes do admin pra ter
-- author_is_admin=true E author_badge_id='admin_seal' (insignia exclusiva).
-- ──────────────────────────────────────────────────────────────────────────

-- 1) Adiciona coluna author_is_admin nas 4 tabelas de interações
ALTER TABLE forum_posts        ADD COLUMN IF NOT EXISTS author_is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE forum_replies      ADD COLUMN IF NOT EXISTS author_is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE episode_comments   ADD COLUMN IF NOT EXISTS author_is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE funnel_feedbacks   ADD COLUMN IF NOT EXISTS author_is_admin boolean NOT NULL DEFAULT false;

-- 2) Marca interações existentes do admin
UPDATE forum_posts SET author_is_admin = true
WHERE user_id IN (
  SELECT id FROM auth.users WHERE raw_app_meta_data->>'is_admin' = 'true'
);

UPDATE forum_replies SET author_is_admin = true
WHERE user_id IN (
  SELECT id FROM auth.users WHERE raw_app_meta_data->>'is_admin' = 'true'
);

UPDATE episode_comments SET author_is_admin = true
WHERE user_id IN (
  SELECT id FROM auth.users WHERE raw_app_meta_data->>'is_admin' = 'true'
);

UPDATE funnel_feedbacks SET author_is_admin = true
WHERE user_id IN (
  SELECT id FROM auth.users WHERE raw_app_meta_data->>'is_admin' = 'true'
);

-- 3) Aplica insignia ADM (admin_seal) em todas as interações existentes do admin
--    (substitui featured_badge_id antigo se houver — admin sempre mostra ADM seal)
UPDATE forum_posts SET author_badge_id = 'admin_seal'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE raw_app_meta_data->>'is_admin' = 'true'
);

UPDATE forum_replies SET author_badge_id = 'admin_seal'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE raw_app_meta_data->>'is_admin' = 'true'
);

UPDATE episode_comments SET author_badge_id = 'admin_seal'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE raw_app_meta_data->>'is_admin' = 'true'
);


-- ============================================================================
-- ▼  add-edited-at-to-content.sql
-- ============================================================================
-- ──────────────────────────────────────────────────────────────────────────
-- Permite que user edite seu próprio post/reply/comment.
-- Adiciona coluna edited_at pra exibir "(editado)" no UI.
-- RLS UPDATE policy já existe pra forum_* (users update own); episode_comments
-- precisa garantir que tem.
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS edited_at timestamptz;
ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS edited_at timestamptz;
ALTER TABLE episode_comments ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- Garante UPDATE policy pra owner em episode_comments (forum_* já tem)
DROP POLICY IF EXISTS "users update own ec" ON episode_comments;
CREATE POLICY "users update own ec"
  ON episode_comments FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE funnel_feedbacks ADD COLUMN IF NOT EXISTS edited_at timestamptz;
DROP POLICY IF EXISTS "users update own funnel feedback" ON funnel_feedbacks;
CREATE POLICY "users update own funnel feedback"
  ON funnel_feedbacks FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================================
-- ▼  add-badge-and-avatar-to-comments.sql
-- ============================================================================
-- ──────────────────────────────────────────────────────────────────────────
-- ALTER TABLE episode_comments — adicionar:
--   - author_avatar_url TEXT  : URL absoluta do avatar (R2) na hora do post.
--                                Snapshot — se user trocar foto depois, comentários
--                                antigos mantêm a foto da época. Cliente decide:
--                                se URL existe → renderiza <img>; senão → letras
--                                em author_avatar.
--   - author_badge_id   TEXT  : id da insignia destacada (de lib/achievements.ts)
--                                na hora do post. NULL = sem insignia.
--                                Snapshot — old comments keep their badge mesmo se
--                                user trocar a featured_badge depois.
--
-- Rodar UMA VEZ no SQL Editor do Supabase. Idempotente (IF NOT EXISTS).
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE episode_comments
  ADD COLUMN IF NOT EXISTS author_avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS author_badge_id   TEXT;


-- ============================================================================
-- ▼  add-comment-reactions.sql
-- ============================================================================
-- ──────────────────────────────────────────────────────────────────────────
-- Like/dislike em comentários de aulas (episode_comments)
-- + XP +5 pro autor quando recebe like
-- + Counters likes_count/dislikes_count em episode_comments
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE episode_comments ADD COLUMN IF NOT EXISTS likes_count int NOT NULL DEFAULT 0;
ALTER TABLE episode_comments ADD COLUMN IF NOT EXISTS dislikes_count int NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS episode_comment_reactions (
  comment_id uuid NOT NULL REFERENCES episode_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('like', 'dislike')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_ec_reactions_user ON episode_comment_reactions (user_id);

ALTER TABLE episode_comment_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read ec_reactions" ON episode_comment_reactions;
CREATE POLICY "auth read ec_reactions" ON episode_comment_reactions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "users react own ec" ON episode_comment_reactions;
CREATE POLICY "users react own ec" ON episode_comment_reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "users update own ec_reaction" ON episode_comment_reactions;
CREATE POLICY "users update own ec_reaction" ON episode_comment_reactions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "users delete own ec_reaction" ON episode_comment_reactions;
CREATE POLICY "users delete own ec_reaction" ON episode_comment_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION recompute_comment_reactions(p_comment_id uuid) RETURNS void AS $$
DECLARE v_likes int; v_dislikes int;
BEGIN
  SELECT COUNT(*) INTO v_likes FROM episode_comment_reactions WHERE comment_id = p_comment_id AND vote = 'like';
  SELECT COUNT(*) INTO v_dislikes FROM episode_comment_reactions WHERE comment_id = p_comment_id AND vote = 'dislike';
  UPDATE episode_comments SET likes_count = v_likes, dislikes_count = v_dislikes WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION on_ec_reaction_change() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN PERFORM recompute_comment_reactions(NEW.comment_id); RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN PERFORM recompute_comment_reactions(OLD.comment_id); RETURN OLD; END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_ec_reaction_change ON episode_comment_reactions;
CREATE TRIGGER trg_ec_reaction_change AFTER INSERT OR UPDATE OR DELETE ON episode_comment_reactions FOR EACH ROW EXECUTE FUNCTION on_ec_reaction_change();

-- XP: +5 pro author do comentario quando recebe like
CREATE OR REPLACE FUNCTION on_xp_ec_reaction() RETURNS TRIGGER AS $$
DECLARE v_owner uuid;
BEGIN
  IF NEW.vote <> 'like' THEN RETURN NEW; END IF;
  SELECT user_id INTO v_owner FROM episode_comments WHERE id = NEW.comment_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    PERFORM apply_xp_delta(v_owner, 'episode_comment_like_received', 5, 0, 'episode_comment_reactions', NEW.comment_id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_xp_ec_reaction ON episode_comment_reactions;
CREATE TRIGGER trg_xp_ec_reaction AFTER INSERT OR UPDATE ON episode_comment_reactions FOR EACH ROW EXECUTE FUNCTION on_xp_ec_reaction();


-- ============================================================================
-- ▼  add-comment-replies.sql
-- ============================================================================
-- Adiciona suporte a respostas threaded em comentários de aulas.
-- Self-reference em episode_comments via parent_comment_id (1 nível de profundidade).
-- Idempotente.

ALTER TABLE episode_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES episode_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_episode_comments_parent
  ON episode_comments (parent_comment_id, created_at ASC);


-- ============================================================================
-- ▼  fix-forum-replies-update-policy.sql
-- ============================================================================
-- Fix: forum_replies não tinha policy de UPDATE no RLS, então edição
-- do próprio reply falhava com "Forbidden or not found".
--
-- Esse script adiciona a policy faltante + garante que as tabelas
-- relevantes estão publicadas no Realtime (pra postgres_changes
-- subscriptions funcionarem).
--
-- Rodar UMA VEZ no Supabase Studio → SQL Editor.

-- ── 1) Policy de UPDATE faltante ──────────────────────────────────────
DROP POLICY IF EXISTS "users update own replies" ON forum_replies;
CREATE POLICY "users update own replies"
  ON forum_replies FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 2) Publicação Realtime — tabelas que precisam de postgres_changes ──
-- Se já estiverem publicadas, ALTER PUBLICATION ADD dá erro (idempotência
-- via DO + EXCEPTION pra não quebrar).
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN
  -- já publicada, ignora
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE forum_posts;
EXCEPTION WHEN duplicate_object THEN
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE forum_replies;
EXCEPTION WHEN duplicate_object THEN
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE episode_comments;
EXCEPTION WHEN duplicate_object THEN
END $$;


-- ============================================================================
-- ▼  add-star-flame-snapshots.sql
-- ============================================================================
-- Adiciona campos de snapshot de estrella + llama destacadas em todas
-- as tabelas que armazenam author_badge_id. Permite renderizar os 3
-- cantos do avatar (insignia + estrella + llama) em forum/feed/comentarios.
--
-- ⚠️ RODAR NO SUPABASE SQL EDITOR

ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS author_star_id text,
  ADD COLUMN IF NOT EXISTS author_flame_id text;

ALTER TABLE forum_replies
  ADD COLUMN IF NOT EXISTS author_star_id text,
  ADD COLUMN IF NOT EXISTS author_flame_id text;

ALTER TABLE episode_comments
  ADD COLUMN IF NOT EXISTS author_star_id text,
  ADD COLUMN IF NOT EXISTS author_flame_id text;

ALTER TABLE funnel_feedbacks
  ADD COLUMN IF NOT EXISTS author_star_id text,
  ADD COLUMN IF NOT EXISTS author_flame_id text;

ALTER TABLE user_funnels
  ADD COLUMN IF NOT EXISTS author_star_id text,
  ADD COLUMN IF NOT EXISTS author_flame_id text;

-- Verifica que as colunas foram criadas
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE column_name IN ('author_star_id', 'author_flame_id')
ORDER BY table_name, column_name;


-- ============================================================================
-- ▼  add-prev-page-is-direct.sql
-- ============================================================================
-- Adiciona colunas prev_page e is_direct na tabela funnel_events
ALTER TABLE funnel_events
  ADD COLUMN IF NOT EXISTS prev_page text,
  ADD COLUMN IF NOT EXISTS is_direct boolean DEFAULT false;


-- ============================================================================
-- ▼  pinned-welcome-post.sql
-- ============================================================================
-- ──────────────────────────────────────────────────────────────────────────
-- Posts FIXADOS na comunidade (Bienvenida + Bono opcional)
-- Autor: usuario admin (email definido em adm@SEU_DOMINIO.com)
--
-- 1. Adiciona colunas `pinned` + `pin_order` em forum_posts
-- 2. Index pra ordenação eficiente
-- 3. Insere posts fixados como placeholders — cliente edita pelo painel admin
--
-- Ordem final no fórum: pinned DESC, pin_order ASC, created_at DESC
--   → posts pinned aparecem primeiro
--   → entre pinned: pin_order menor = mais em cima
--   → não-pinned: ordenados por created_at desc
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS pin_order int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_forum_posts_pinned_order
  ON forum_posts (pinned DESC, pin_order ASC, created_at DESC);


-- POST #1 — BIENVENIDA (pin_order = 1) — placeholder, edite no painel admin
DO $$
DECLARE
  v_user_id uuid;
  v_meta jsonb;
  v_full_name text;
  v_avatar text;
  v_existing_id uuid;
BEGIN
  SELECT id, raw_user_meta_data INTO v_user_id, v_meta
    FROM auth.users WHERE email = 'adm@SEU_DOMINIO.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User adm@SEU_DOMINIO.com no encontrado — saltando post BIENVENIDA';
    RETURN;
  END IF;

  v_full_name := COALESCE(v_meta->>'full_name', 'Admin');
  v_avatar := v_meta->>'avatar_url';

  SELECT id INTO v_existing_id
    FROM forum_posts
    WHERE pinned = true AND pin_order = 1
    LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE forum_posts SET pin_order = 1 WHERE id = v_existing_id;
    RAISE NOTICE 'Post BIENVENIDA ya existe (id=%), actualizado pin_order=1', v_existing_id;
  ELSE
    INSERT INTO forum_posts (
      user_id, author_name, author_username, author_avatar_url,
      author_badge_id, author_is_admin,
      title, body, tags, pinned, pin_order
    )
    VALUES (
      v_user_id, v_full_name, 'admin', v_avatar,
      'admin_seal', true,
      'Bienvenida — edita este post en el panel admin',
      E'Este es un post de bienvenida placeholder. Edítalo en el panel de administración para personalizar el contenido.',
      ARRAY['BIENVENIDA'],
      true, 1
    );
    RAISE NOTICE 'Post BIENVENIDA placeholder creado';
  END IF;
END$$;


-- ============================================================================
-- ▼  top3-ranking-broadcast.sql
-- ============================================================================
-- ──────────────────────────────────────────────────────────────────────────
-- TOP 3 RANKING REALTIME BROADCAST
--
-- Detecta quando alguém entra no TOP 3 do ranking de XP e broadcast pra todos
-- os outros members. Throttle: cooldown 24h por user (anti-spam: pessoa não
-- pode disparar broadcast mais de 1x/dia mesmo se ficar revezando posição).
--
-- Como funciona:
--   1. Snapshot do top 3 atual fica em leaderboard_top3_snapshot (3 rows fixas)
--   2. Quando user_xp.total_xp ou current_level muda, recomputa top 3
--   3. Compara com snapshot — se alguém NOVO entrou no top 3 (não estava antes),
--      gera broadcast 'public_top3' pra todos os outros users.
--   4. Atualiza snapshot.
--
-- Cooldown: leaderboard_top3_broadcasts armazena last_broadcast_at por user.
-- Se < 24h, ignora (não rebroadcasta a mesma pessoa subindo/descendo).
-- ──────────────────────────────────────────────────────────────────────────

-- Snapshot do top 3 atual (3 rows fixas, position 1/2/3)
CREATE TABLE IF NOT EXISTS leaderboard_top3_snapshot (
  position int PRIMARY KEY CHECK (position BETWEEN 1 AND 3),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total_xp int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Inicializa as 3 posições vazias se ainda não existirem
INSERT INTO leaderboard_top3_snapshot (position, user_id, total_xp)
VALUES (1, NULL, 0), (2, NULL, 0), (3, NULL, 0)
ON CONFLICT (position) DO NOTHING;


-- Cooldown por user (anti-spam)
CREATE TABLE IF NOT EXISTS leaderboard_top3_broadcasts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_broadcast_at timestamptz NOT NULL DEFAULT now()
);


-- Função: recomputa top 3 e detecta entradas novas
CREATE OR REPLACE FUNCTION on_user_xp_top3_check() RETURNS TRIGGER AS $$
DECLARE
  v_old_top3 uuid[];
  v_new_top3 uuid[];
  v_new_user_id uuid;
  v_new_position int;
  v_meta jsonb;
  v_name text;
  v_avatar text;
  v_last_broadcast timestamptz;
  v_can_broadcast boolean;
BEGIN
  -- Pega o top 3 atual (snapshot)
  SELECT array_agg(user_id ORDER BY position)
    INTO v_old_top3
    FROM leaderboard_top3_snapshot;

  -- Calcula o novo top 3 baseado em user_xp
  SELECT array_agg(user_id ORDER BY rn)
    INTO v_new_top3
    FROM (
      SELECT user_id, ROW_NUMBER() OVER (ORDER BY current_level DESC, total_xp DESC) AS rn
      FROM user_xp
      ORDER BY current_level DESC, total_xp DESC
      LIMIT 3
    ) t;

  -- Se não mudou, sai
  IF v_new_top3 IS NOT DISTINCT FROM v_old_top3 THEN
    RETURN NEW;
  END IF;

  -- Detecta entradas novas (alguém que NÃO estava no top 3 antes)
  FOR v_new_position IN 1..LEAST(COALESCE(array_length(v_new_top3, 1), 0), 3) LOOP
    v_new_user_id := v_new_top3[v_new_position];
    IF v_new_user_id IS NULL THEN CONTINUE; END IF;
    -- Já estava no top 3? Ignora (só broadcasta entrada nova)
    IF v_old_top3 IS NOT NULL AND v_new_user_id = ANY(v_old_top3) THEN CONTINUE; END IF;

    -- Cooldown: já fez broadcast nas últimas 24h?
    SELECT last_broadcast_at INTO v_last_broadcast
      FROM leaderboard_top3_broadcasts WHERE user_id = v_new_user_id;
    v_can_broadcast := (v_last_broadcast IS NULL) OR (v_last_broadcast < now() - interval '24 hours');

    IF v_can_broadcast THEN
      -- Pega metadata do user pra avatar/nome
      SELECT raw_user_meta_data INTO v_meta FROM auth.users WHERE id = v_new_user_id;
      v_name := COALESCE(v_meta->>'full_name', 'Miembro');
      v_avatar := v_meta->>'avatar_url';

      -- Broadcast pra todos os outros users
      INSERT INTO notifications (user_id, type, source_user_id, source_user_name, source_user_avatar_url, title, preview)
      SELECT u.id, 'public_top3', v_new_user_id, v_name, v_avatar,
        v_name || ' entró al TOP ' || v_new_position || ' del ranking 👑',
        'El ranking de XP se mueve. ¡Sube de nivel y compite!'
      FROM auth.users u WHERE u.id <> v_new_user_id;

      -- Atualiza cooldown
      INSERT INTO leaderboard_top3_broadcasts (user_id, last_broadcast_at)
      VALUES (v_new_user_id, now())
      ON CONFLICT (user_id) DO UPDATE SET last_broadcast_at = now();
    END IF;
  END LOOP;

  -- Atualiza snapshot com o novo top 3
  FOR v_new_position IN 1..3 LOOP
    UPDATE leaderboard_top3_snapshot
      SET user_id = v_new_top3[v_new_position],
          total_xp = COALESCE((SELECT total_xp FROM user_xp WHERE user_id = v_new_top3[v_new_position]), 0),
          updated_at = now()
      WHERE position = v_new_position;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


DROP TRIGGER IF EXISTS trg_user_xp_top3_check ON user_xp;
CREATE TRIGGER trg_user_xp_top3_check
  AFTER UPDATE OF total_xp, current_level ON user_xp
  FOR EACH ROW EXECUTE FUNCTION on_user_xp_top3_check();


-- Bootstrap: popula o snapshot com o top 3 atual (executa 1x ao rodar)
DO $$
DECLARE
  v_user_id uuid;
  v_total_xp int;
  v_position int := 1;
  v_rec record;
BEGIN
  FOR v_rec IN
    SELECT user_id, total_xp FROM user_xp
    ORDER BY current_level DESC, total_xp DESC
    LIMIT 3
  LOOP
    UPDATE leaderboard_top3_snapshot
      SET user_id = v_rec.user_id, total_xp = v_rec.total_xp, updated_at = now()
      WHERE position = v_position;
    v_position := v_position + 1;
  END LOOP;
END$$;



-- ============================================================================
-- GRANTS finais (garante permissão pra tabelas criadas)
-- ============================================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
