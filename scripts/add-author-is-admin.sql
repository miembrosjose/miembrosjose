-- ──────────────────────────────────────────────────────────────────────────
-- Snapshot is_admin no autor de cada interação — pra renderizar tag "ADM"
-- (ou "MIEMBRO") no UI sem precisar consultar auth.users a cada render.
--
-- Também atualiza posts/replies/comments existentes do admin pra ter
-- author_is_admin=true E author_badge_id='admin_seal' (insignia exclusiva).
-- ──────────────────────────────────────────────────────────────────────────

-- 1) Adiciona coluna author_is_admin nas 4 tabelas de interações
ALTER TABLE forum_posts        ADD COLUMN IF NOT EXISTS author_is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE forum_replies      ADD COLUMN IF NOT EXISTS author_is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE episode_comments   ADD COLUMN IF NOT EXISTS author_is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE funnel_feedbacks   ADD COLUMN IF NOT EXISTS author_is_admin boolean NOT NULL DEFAULT false;

-- 2) Marca interações existentes do admin
UPDATE forum_posts SET author_is_admin = true
WHERE user_id IN (
  SELECT id FROM auth.users WHERE raw_app_meta_data->>'is_admin' = 'true'
);

UPDATE forum_replies SET author_is_admin = true
WHERE user_id IN (
  SELECT id FROM auth.users WHERE raw_app_meta_data->>'is_admin' = 'true'
);

UPDATE episode_comments SET author_is_admin = true
WHERE user_id IN (
  SELECT id FROM auth.users WHERE raw_app_meta_data->>'is_admin' = 'true'
);

UPDATE funnel_feedbacks SET author_is_admin = true
WHERE user_id IN (
  SELECT id FROM auth.users WHERE raw_app_meta_data->>'is_admin' = 'true'
);

-- 3) Aplica insignia ADM (admin_seal) em todas as interações existentes do admin
--    (substitui featured_badge_id antigo se houver — admin sempre mostra ADM seal)
UPDATE forum_posts SET author_badge_id = 'admin_seal'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE raw_app_meta_data->>'is_admin' = 'true'
);

UPDATE forum_replies SET author_badge_id = 'admin_seal'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE raw_app_meta_data->>'is_admin' = 'true'
);

UPDATE episode_comments SET author_badge_id = 'admin_seal'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE raw_app_meta_data->>'is_admin' = 'true'
);
