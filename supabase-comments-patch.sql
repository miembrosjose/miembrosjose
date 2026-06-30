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
