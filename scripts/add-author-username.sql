-- Adiciona campo author_username em snapshots de comments/posts/replies
-- pra exibir @username junto com nome completo nas interações da comunidade.
-- Idempotente.

ALTER TABLE episode_comments ADD COLUMN IF NOT EXISTS author_username text;
ALTER TABLE forum_posts      ADD COLUMN IF NOT EXISTS author_username text;
ALTER TABLE forum_replies    ADD COLUMN IF NOT EXISTS author_username text;
