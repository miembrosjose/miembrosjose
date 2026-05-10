-- Adiciona suporte a respostas threaded em comentários de aulas.
-- Self-reference em episode_comments via parent_comment_id (1 nível de profundidade).
-- Idempotente.

ALTER TABLE episode_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES episode_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_episode_comments_parent
  ON episode_comments (parent_comment_id, created_at ASC);
