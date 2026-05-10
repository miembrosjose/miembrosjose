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
