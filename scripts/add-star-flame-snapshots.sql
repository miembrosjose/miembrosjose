-- Adiciona campos de snapshot de estrella + llama destacadas em todas
-- as tabelas que armazenam author_badge_id. Permite renderizar os 3
-- cantos do avatar (insignia + estrella + llama) em forum/feed/comentarios.
--
-- ⚠️ RODAR NO SUPABASE SQL EDITOR

ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS author_star_id text,
  ADD COLUMN IF NOT EXISTS author_flame_id text;

ALTER TABLE forum_replies
  ADD COLUMN IF NOT EXISTS author_star_id text,
  ADD COLUMN IF NOT EXISTS author_flame_id text;

ALTER TABLE episode_comments
  ADD COLUMN IF NOT EXISTS author_star_id text,
  ADD COLUMN IF NOT EXISTS author_flame_id text;

ALTER TABLE funnel_feedbacks
  ADD COLUMN IF NOT EXISTS author_star_id text,
  ADD COLUMN IF NOT EXISTS author_flame_id text;

ALTER TABLE user_funnels
  ADD COLUMN IF NOT EXISTS author_star_id text,
  ADD COLUMN IF NOT EXISTS author_flame_id text;

-- Verifica que as colunas foram criadas
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE column_name IN ('author_star_id', 'author_flame_id')
ORDER BY table_name, column_name;
