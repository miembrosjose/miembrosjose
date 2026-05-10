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
