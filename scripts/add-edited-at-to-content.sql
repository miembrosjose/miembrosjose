-- ──────────────────────────────────────────────────────────────────────────
-- Permite que user edite seu próprio post/reply/comment.
-- Adiciona coluna edited_at pra exibir "(editado)" no UI.
-- RLS UPDATE policy já existe pra forum_* (users update own); episode_comments
-- precisa garantir que tem.
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS edited_at timestamptz;
ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS edited_at timestamptz;
ALTER TABLE episode_comments ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- Garante UPDATE policy pra owner em episode_comments (forum_* já tem)
DROP POLICY IF EXISTS "users update own ec" ON episode_comments;
CREATE POLICY "users update own ec"
  ON episode_comments FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE funnel_feedbacks ADD COLUMN IF NOT EXISTS edited_at timestamptz;
DROP POLICY IF EXISTS "users update own funnel feedback" ON funnel_feedbacks;
CREATE POLICY "users update own funnel feedback"
  ON funnel_feedbacks FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
