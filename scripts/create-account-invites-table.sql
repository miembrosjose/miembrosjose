-- ──────────────────────────────────────────────────────────────────────────
-- account_invites: tokens únicos para criação de conta após compra Stripe.
--
-- Fluxo:
--  1. Stripe webhook (sale_type=front) cria registro com token + envia email
--  2. Cliente clica no link → /cuenta/crear?token=XXX
--  3. Servidor valida (não usado, não expirado) → cria conta no Supabase Auth
--  4. Marca token como used_at (uma vez só)
--
-- Idempotência:
--  - unique constraint em (email): se cliente recompra, regeneramos token (não duplica)
--  - unique constraint em (stripe_payment_intent_id): proteção contra retry de webhook
--  - unique constraint em (token): garante busca por token única
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS account_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  email_error TEXT,
  resend_count INT NOT NULL DEFAULT 0
);

-- Índices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_account_invites_token ON account_invites (token) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_account_invites_email ON account_invites (email);
CREATE INDEX IF NOT EXISTS idx_account_invites_pi ON account_invites (stripe_payment_intent_id);

-- RLS: nenhum acesso direto via anon. Tudo passa por service_role nas API routes.
ALTER TABLE account_invites ENABLE ROW LEVEL SECURITY;

-- Policy: bloqueia tudo por default. Service role bypass RLS automaticamente.
CREATE POLICY "no_public_access" ON account_invites
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Cleanup automático de tokens expirados há mais de 30 dias (limpa tabela).
-- Roda via pg_cron — adicionar no scheduler depois:
--   SELECT cron.schedule('cleanup-expired-invites', '0 3 * * *',
--     $$DELETE FROM account_invites WHERE expires_at < now() - interval '30 days' AND used_at IS NULL$$);
