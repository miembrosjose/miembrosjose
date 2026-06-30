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
