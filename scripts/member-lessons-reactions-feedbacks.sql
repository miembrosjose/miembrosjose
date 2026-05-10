-- Migration aditiva: adiciona dislikes + feedbacks em member_lessons.
-- Roda DEPOIS de scripts/member-lessons-schema.sql (que já criou as tabelas base).
-- Idempotente: ADD COLUMN IF NOT EXISTS / CREATE IF NOT EXISTS / DROP POLICY IF EXISTS.

-- ─────────────────────────────────────────────────────────────────────────
-- 1) DISLIKES em member_lessons (count + vote em member_lesson_likes)
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE member_lessons
  ADD COLUMN IF NOT EXISTS dislikes_count integer NOT NULL DEFAULT 0;

-- Adiciona vote em member_lesson_likes (default 'like' pra preservar dados existentes)
ALTER TABLE member_lesson_likes
  ADD COLUMN IF NOT EXISTS vote text NOT NULL DEFAULT 'like';

-- Constraint de vote válido (idempotente: drop se existir)
ALTER TABLE member_lesson_likes
  DROP CONSTRAINT IF EXISTS member_lesson_likes_vote_check;
ALTER TABLE member_lesson_likes
  ADD CONSTRAINT member_lesson_likes_vote_check
  CHECK (vote IN ('like', 'dislike'));

-- Atualiza trigger pra contar likes vs dislikes corretamente
CREATE OR REPLACE FUNCTION trg_member_lesson_likes_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote = 'like' THEN
      UPDATE member_lessons SET likes_count = likes_count + 1 WHERE id = NEW.lesson_id;
    ELSE
      UPDATE member_lessons SET dislikes_count = dislikes_count + 1 WHERE id = NEW.lesson_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote = 'like' THEN
      UPDATE member_lessons SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.lesson_id;
    ELSE
      UPDATE member_lessons SET dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = OLD.lesson_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Mudança de like → dislike ou vice-versa: ajusta os 2 counters
    IF OLD.vote <> NEW.vote THEN
      IF NEW.vote = 'like' THEN
        UPDATE member_lessons
          SET likes_count = likes_count + 1,
              dislikes_count = GREATEST(0, dislikes_count - 1)
          WHERE id = NEW.lesson_id;
      ELSE
        UPDATE member_lessons
          SET dislikes_count = dislikes_count + 1,
              likes_count = GREATEST(0, likes_count - 1)
          WHERE id = NEW.lesson_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS member_lesson_likes_count_trg ON member_lesson_likes;
CREATE TRIGGER member_lesson_likes_count_trg
  AFTER INSERT OR UPDATE OR DELETE ON member_lesson_likes
  FOR EACH ROW EXECUTE FUNCTION trg_member_lesson_likes_count();

-- ─────────────────────────────────────────────────────────────────────────
-- 2) FEEDBACKS (comentários) — clone de funnel_feedbacks
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS member_lesson_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES member_lessons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES member_lesson_feedbacks(id) ON DELETE CASCADE,
  -- Snapshot do autor no momento do post (igual funnel_feedbacks pattern)
  author_name text NOT NULL,
  author_username text,
  author_avatar text NOT NULL,            -- iniciais
  author_avatar_url text,
  author_badge_id text,
  author_star_id text,
  author_flame_id text,
  author_avatar_border text,
  author_is_admin boolean NOT NULL DEFAULT false,
  body text NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_feedbacks_lesson
  ON member_lesson_feedbacks(lesson_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_lesson_feedbacks_user
  ON member_lesson_feedbacks(user_id);

ALTER TABLE member_lesson_feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_fb_select_all" ON member_lesson_feedbacks;
CREATE POLICY "lesson_fb_select_all" ON member_lesson_feedbacks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "lesson_fb_insert_own" ON member_lesson_feedbacks;
CREATE POLICY "lesson_fb_insert_own" ON member_lesson_feedbacks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lesson_fb_delete_own" ON member_lesson_feedbacks;
CREATE POLICY "lesson_fb_delete_own" ON member_lesson_feedbacks
  FOR DELETE USING (auth.uid() = user_id);
