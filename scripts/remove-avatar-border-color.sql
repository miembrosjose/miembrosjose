-- Remove avatar_border_color de todos os users.
-- A feature de borda colorida foi descontinuada — admin recebe border
-- branca via flag is_admin (renderização condicional no frontend).
--
-- Esse script:
--   1) Limpa raw_user_meta_data.avatar_border_color de todos os users
--   2) Limpa snapshots em forum_posts, forum_replies, episode_comments,
--      funnel_feedback (pra consistência — frontend já ignora esses campos
--      mas é boa prática zerar pra refletir a remoção da feature)
--
-- ⚠️ RODAR NO SUPABASE SQL EDITOR

-- 1) auth.users metadata
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'avatar_border_color'
WHERE raw_user_meta_data ? 'avatar_border_color';

-- 2) Snapshots em posts/replies/comments/feedback
UPDATE forum_posts SET author_avatar_border = NULL WHERE author_avatar_border IS NOT NULL;
UPDATE forum_replies SET author_avatar_border = NULL WHERE author_avatar_border IS NOT NULL;
UPDATE episode_comments SET author_avatar_border = NULL WHERE author_avatar_border IS NOT NULL;
UPDATE funnel_feedback SET author_avatar_border = NULL WHERE author_avatar_border IS NOT NULL;

-- 3) Verifica que zerou tudo
SELECT
  (SELECT COUNT(*) FROM auth.users WHERE raw_user_meta_data ? 'avatar_border_color') AS users_remaining,
  (SELECT COUNT(*) FROM forum_posts WHERE author_avatar_border IS NOT NULL) AS forum_posts_remaining,
  (SELECT COUNT(*) FROM forum_replies WHERE author_avatar_border IS NOT NULL) AS forum_replies_remaining,
  (SELECT COUNT(*) FROM episode_comments WHERE author_avatar_border IS NOT NULL) AS comments_remaining,
  (SELECT COUNT(*) FROM funnel_feedback WHERE author_avatar_border IS NOT NULL) AS feedback_remaining;
