-- Member Lessons — sistema de "Compartir aprendizaje".
-- Membros sobem vídeos ensinando coisas do funil. Workflow igual ao de Funnels:
-- aprovação admin antes de virar público. Tags livres + likes + views count.

-- ─────────────────────────────────────────────────────────────────────────
-- TABELAS
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS member_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 120),
  description text CHECK (description IS NULL OR char_length(description) <= 1000),
  video_url text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  approved boolean NOT NULL DEFAULT false,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  rejected_at timestamptz,
  rejected_reason text,
  likes_count integer NOT NULL DEFAULT 0,
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS member_lesson_likes (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES member_lessons(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────

-- Lista de aprovadas ordenada por created_at desc (feed principal)
CREATE INDEX IF NOT EXISTS idx_lessons_approved_recent
  ON member_lessons(created_at DESC)
  WHERE approved = true;

-- Lista de aprovadas ordenada por likes (filtro "Más populares")
CREATE INDEX IF NOT EXISTS idx_lessons_approved_popular
  ON member_lessons(likes_count DESC, created_at DESC)
  WHERE approved = true;

-- Filas de aprovação pro admin
CREATE INDEX IF NOT EXISTS idx_lessons_pending
  ON member_lessons(created_at ASC)
  WHERE approved = false AND rejected_at IS NULL;

-- Lessões de um user específico (perfil futuramente)
CREATE INDEX IF NOT EXISTS idx_lessons_user
  ON member_lessons(user_id, created_at DESC);

-- Tags pra filtros (GIN pra arrays)
CREATE INDEX IF NOT EXISTS idx_lessons_tags ON member_lessons USING GIN (tags);

-- Likes lookup
CREATE INDEX IF NOT EXISTS idx_lesson_likes_lesson ON member_lesson_likes(lesson_id);

-- ─────────────────────────────────────────────────────────────────────────
-- TRIGGERS pra likes_count automático
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_member_lesson_likes_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE member_lessons SET likes_count = likes_count + 1 WHERE id = NEW.lesson_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE member_lessons SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.lesson_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS member_lesson_likes_count_trg ON member_lesson_likes;
CREATE TRIGGER member_lesson_likes_count_trg
  AFTER INSERT OR DELETE ON member_lesson_likes
  FOR EACH ROW EXECUTE FUNCTION trg_member_lesson_likes_count();

-- ─────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE member_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_lesson_likes ENABLE ROW LEVEL SECURITY;

-- Lessons: todos veem aprovadas; user vê próprias (mesmo se pendentes); admin vê tudo via service_role
DROP POLICY IF EXISTS "lessons_select_approved_or_own" ON member_lessons;
CREATE POLICY "lessons_select_approved_or_own" ON member_lessons
  FOR SELECT
  USING (approved = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "lessons_insert_own" ON member_lessons;
CREATE POLICY "lessons_insert_own" ON member_lessons
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lessons_update_own" ON member_lessons;
CREATE POLICY "lessons_update_own" ON member_lessons
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lessons_delete_own" ON member_lessons;
CREATE POLICY "lessons_delete_own" ON member_lessons
  FOR DELETE
  USING (auth.uid() = user_id);

-- Likes: todos veem; cada user gerencia os próprios
DROP POLICY IF EXISTS "lesson_likes_select_all" ON member_lesson_likes;
CREATE POLICY "lesson_likes_select_all" ON member_lesson_likes
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "lesson_likes_insert_own" ON member_lesson_likes;
CREATE POLICY "lesson_likes_insert_own" ON member_lesson_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lesson_likes_delete_own" ON member_lesson_likes;
CREATE POLICY "lesson_likes_delete_own" ON member_lesson_likes
  FOR DELETE
  USING (auth.uid() = user_id);
