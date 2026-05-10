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
ALTER FUNCTION on_xp_purchase() SECURITY DEFINER;
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
