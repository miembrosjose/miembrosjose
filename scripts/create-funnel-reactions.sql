-- ──────────────────────────────────────────────────────────────────────────
-- funnel_reactions + funnel_feedbacks — likes/dislikes + comentarios
--
-- funnel_reactions: 1 row por par (funnel_id, user_id) com vote 'like' | 'dislike'
-- funnel_feedbacks: comentarios (texto) com snapshot identidade do autor
-- Counters em user_funnels mantidos via triggers.
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE user_funnels ADD COLUMN IF NOT EXISTS likes_count int NOT NULL DEFAULT 0;
ALTER TABLE user_funnels ADD COLUMN IF NOT EXISTS dislikes_count int NOT NULL DEFAULT 0;
ALTER TABLE user_funnels ADD COLUMN IF NOT EXISTS feedbacks_count int NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS funnel_reactions (
  funnel_id uuid NOT NULL REFERENCES user_funnels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('like', 'dislike')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (funnel_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_funnel_reactions_user ON funnel_reactions (user_id);
ALTER TABLE funnel_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated read funnel_reactions" ON funnel_reactions;
CREATE POLICY "authenticated read funnel_reactions" ON funnel_reactions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "users react own" ON funnel_reactions;
CREATE POLICY "users react own" ON funnel_reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "users update own reaction" ON funnel_reactions;
CREATE POLICY "users update own reaction" ON funnel_reactions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "users delete own reaction" ON funnel_reactions;
CREATE POLICY "users delete own reaction" ON funnel_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());


CREATE TABLE IF NOT EXISTS funnel_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid NOT NULL REFERENCES user_funnels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_username text,
  author_avatar_url text,
  body text NOT NULL CHECK (length(body) > 0 AND length(body) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_funnel_feedbacks_funnel ON funnel_feedbacks (funnel_id, created_at ASC);
ALTER TABLE funnel_feedbacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated read feedbacks" ON funnel_feedbacks;
CREATE POLICY "authenticated read feedbacks" ON funnel_feedbacks FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "users insert own feedback" ON funnel_feedbacks;
CREATE POLICY "users insert own feedback" ON funnel_feedbacks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "users delete own feedback" ON funnel_feedbacks;
CREATE POLICY "users delete own feedback" ON funnel_feedbacks FOR DELETE TO authenticated USING (user_id = auth.uid());


-- Triggers: mantém counters
CREATE OR REPLACE FUNCTION recompute_funnel_counts(p_funnel_id uuid)
RETURNS void AS $$
DECLARE v_likes int; v_dislikes int; v_feedbacks int;
BEGIN
  SELECT COUNT(*) INTO v_likes FROM funnel_reactions WHERE funnel_id = p_funnel_id AND vote = 'like';
  SELECT COUNT(*) INTO v_dislikes FROM funnel_reactions WHERE funnel_id = p_funnel_id AND vote = 'dislike';
  SELECT COUNT(*) INTO v_feedbacks FROM funnel_feedbacks WHERE funnel_id = p_funnel_id;
  UPDATE user_funnels SET likes_count = v_likes, dislikes_count = v_dislikes, feedbacks_count = v_feedbacks, updated_at = now()
  WHERE id = p_funnel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION on_funnel_reaction_change() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN PERFORM recompute_funnel_counts(NEW.funnel_id); RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN PERFORM recompute_funnel_counts(OLD.funnel_id); RETURN OLD; END IF;
  RETURN NULL;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_funnel_reaction ON funnel_reactions;
CREATE TRIGGER trg_funnel_reaction AFTER INSERT OR UPDATE OR DELETE ON funnel_reactions FOR EACH ROW EXECUTE FUNCTION on_funnel_reaction_change();

CREATE OR REPLACE FUNCTION on_funnel_feedback_change() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN PERFORM recompute_funnel_counts(NEW.funnel_id); RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN PERFORM recompute_funnel_counts(OLD.funnel_id); RETURN OLD; END IF;
  RETURN NULL;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_funnel_feedback ON funnel_feedbacks;
CREATE TRIGGER trg_funnel_feedback AFTER INSERT OR DELETE ON funnel_feedbacks FOR EACH ROW EXECUTE FUNCTION on_funnel_feedback_change();
