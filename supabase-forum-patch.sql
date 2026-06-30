-- ============================================================================
-- Patch do fórum: adiciona colunas + tabelas faltantes que o frontend espera
-- ============================================================================
-- O sistema original tinha estrutura mais simples. O frontend atual espera:
--   - dislikes_count em forum_posts e forum_replies
--   - author_avatar_border em forum_posts e forum_replies
--   - hot em forum_replies
--   - parent_reply_id em forum_replies (replies aninhadas)
--   - tabelas forum_dislikes + forum_reply_dislikes
--   - triggers de recompute pras counts

-- ─── Colunas em forum_posts ────────────────────────────────────────────
ALTER TABLE public.forum_posts
  ADD COLUMN IF NOT EXISTS dislikes_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS author_avatar_border text;

-- ─── Colunas em forum_replies ──────────────────────────────────────────
ALTER TABLE public.forum_replies
  ADD COLUMN IF NOT EXISTS dislikes_count   int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS author_avatar_border text,
  ADD COLUMN IF NOT EXISTS hot              boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_reply_id  uuid REFERENCES public.forum_replies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_forum_replies_parent
  ON public.forum_replies(parent_reply_id);

-- ─── forum_dislikes (dislike em post) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.forum_dislikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_forum_dislikes_post ON public.forum_dislikes(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_dislikes_user ON public.forum_dislikes(user_id);

ALTER TABLE public.forum_dislikes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth read forum_dislikes" ON public.forum_dislikes;
CREATE POLICY "auth read forum_dislikes" ON public.forum_dislikes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth manage own forum_dislikes" ON public.forum_dislikes;
CREATE POLICY "auth manage own forum_dislikes" ON public.forum_dislikes FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── forum_reply_dislikes (dislike em reply) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.forum_reply_dislikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id uuid NOT NULL REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reply_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_forum_reply_dislikes_reply ON public.forum_reply_dislikes(reply_id);
CREATE INDEX IF NOT EXISTS idx_forum_reply_dislikes_user  ON public.forum_reply_dislikes(user_id);

ALTER TABLE public.forum_reply_dislikes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth read forum_reply_dislikes" ON public.forum_reply_dislikes;
CREATE POLICY "auth read forum_reply_dislikes" ON public.forum_reply_dislikes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth manage own forum_reply_dislikes" ON public.forum_reply_dislikes;
CREATE POLICY "auth manage own forum_reply_dislikes" ON public.forum_reply_dislikes FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── Triggers de recompute dislikes_count ──────────────────────────────
CREATE OR REPLACE FUNCTION public.recompute_post_dislikes_count() RETURNS TRIGGER AS $$
DECLARE v_post uuid;
BEGIN
  v_post := COALESCE(NEW.post_id, OLD.post_id);
  UPDATE public.forum_posts
     SET dislikes_count = (SELECT count(*) FROM public.forum_dislikes WHERE post_id = v_post)
   WHERE id = v_post;
  RETURN NULL;
END $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recompute_post_dislikes ON public.forum_dislikes;
CREATE TRIGGER trg_recompute_post_dislikes
  AFTER INSERT OR DELETE ON public.forum_dislikes
  FOR EACH ROW EXECUTE FUNCTION public.recompute_post_dislikes_count();

CREATE OR REPLACE FUNCTION public.recompute_reply_dislikes_count() RETURNS TRIGGER AS $$
DECLARE v_reply uuid;
BEGIN
  v_reply := COALESCE(NEW.reply_id, OLD.reply_id);
  UPDATE public.forum_replies
     SET dislikes_count = (SELECT count(*) FROM public.forum_reply_dislikes WHERE reply_id = v_reply)
   WHERE id = v_reply;
  RETURN NULL;
END $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recompute_reply_dislikes ON public.forum_reply_dislikes;
CREATE TRIGGER trg_recompute_reply_dislikes
  AFTER INSERT OR DELETE ON public.forum_reply_dislikes
  FOR EACH ROW EXECUTE FUNCTION public.recompute_reply_dislikes_count();
