-- ──────────────────────────────────────────────────────────────────────────
-- Setup admin + feed_posts.
--
-- 1) Promove user a admin:
--    Use app_metadata.is_admin = true (NÃO user_metadata).
--    user_metadata é editável pelo próprio user → inseguro pra checar role.
--    app_metadata só muda via service_role → fonte de verdade segura.
--
-- 2) Cria tabela feed_posts pra posts do creador (só admin posta).
--
-- IMPORTANT: substituir 'TROCAR_POR_SEU_EMAIL@exemplo.com' pelo email real
-- antes de rodar. Idempotente (pode rodar mais de uma vez sem problema).
-- ──────────────────────────────────────────────────────────────────────────

-- ── 1) Promover user a admin ──────────────────────────────────────────────
-- Substitua o email abaixo pelo seu.
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
WHERE email = 'TROCAR_POR_SEU_EMAIL@exemplo.com';

-- Pra verificar se deu certo:
--   SELECT email, raw_app_meta_data FROM auth.users WHERE email = 'seu@email.com';
-- Esperado: raw_app_meta_data tem "is_admin": true

-- ── 2) Permitir todos sale_types necessários ──────────────────────────────
-- Inclui 'manual' (admin grant), 'standalone' (produtos avulsos) e 'hotmart'
-- (vendas processadas pelo /api/hotmart-webhook).
ALTER TABLE stripe_sales DROP CONSTRAINT IF EXISTS stripe_sales_sale_type_check;
ALTER TABLE stripe_sales ADD CONSTRAINT stripe_sales_sale_type_check
  CHECK (sale_type IN ('front', 'upsell', 'manual', 'standalone', 'hotmart'));

-- ── 3) Tabela feed_posts ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_avatar text,                          -- iniciais OU URL R2
  type_emoji text NOT NULL DEFAULT '🎬',       -- emoji do tipo (🎬 contenido, 🏆 desafío, 💡 tip, 🎁 bonus)
  type_label text NOT NULL DEFAULT 'NUEVO CONTENIDO',
  type_key text NOT NULL DEFAULT 'content' CHECK (type_key IN ('content','challenge','tip','bonus')),
  title text NOT NULL CHECK (length(title) > 0 AND length(title) <= 200),
  body text NOT NULL CHECK (length(body) > 0 AND length(body) <= 5000),
  pinned boolean NOT NULL DEFAULT false,
  reactions jsonb NOT NULL DEFAULT '[]'::jsonb, -- [["❤️", 142], ["🔥", 89]]
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON feed_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_pinned ON feed_posts (pinned, created_at DESC);

-- RLS: leitura pra qualquer user autenticado (area de membros gated).
-- Insert/Update/Delete: server-side via service_role (admin gateado na API).
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read feed posts" ON feed_posts;
CREATE POLICY "authenticated read feed posts"
  ON feed_posts FOR SELECT
  TO authenticated
  USING (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_feed_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feed_posts_updated_at ON feed_posts;
CREATE TRIGGER trg_feed_posts_updated_at
  BEFORE UPDATE ON feed_posts
  FOR EACH ROW
  EXECUTE FUNCTION set_feed_posts_updated_at();
