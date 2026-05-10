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
