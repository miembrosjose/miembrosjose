-- ──────────────────────────────────────────────────────────────────────────
-- user_funnels — funnels gamificados que membros compartilham na comunidade.
--
-- Cada row = 1 funil compartilhado por um membro.
-- Snapshot de identidade do autor pra evitar JOIN no read.
-- Imagem hospedada em R2 (mesmo bucket dos avatares, prefix funnels/).
-- URL é arbitrária (do user) — popup tenta abrir em iframe, fallback link.
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_username text,
  author_avatar_url text,
  name text NOT NULL CHECK (length(name) > 0 AND length(name) <= 80),
  niche text NOT NULL CHECK (length(niche) > 0 AND length(niche) <= 80),
  url text NOT NULL CHECK (length(url) > 0 AND length(url) <= 500),
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_user_funnels_created ON user_funnels (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_funnels_user ON user_funnels (user_id);
CREATE INDEX IF NOT EXISTS idx_user_funnels_niche ON user_funnels (niche, created_at DESC);

ALTER TABLE user_funnels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read funnels" ON user_funnels;
CREATE POLICY "authenticated read funnels"
  ON user_funnels FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users insert own funnels" ON user_funnels;
CREATE POLICY "users insert own funnels"
  ON user_funnels FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users update own funnels" ON user_funnels;
CREATE POLICY "users update own funnels"
  ON user_funnels FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users delete own funnels" ON user_funnels;
CREATE POLICY "users delete own funnels"
  ON user_funnels FOR DELETE TO authenticated
  USING (user_id = auth.uid());
