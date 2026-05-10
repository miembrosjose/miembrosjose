-- Email Send Log — auditoria centralizada de todos os disparos de email
-- pós-compra (invite, account_exists, retry manual, recovery, etc).
--
-- Source-of-truth pra:
--   - Dashboard admin "compras sem email entregue"
--   - Detecção de falhas Resend
--   - Retry automático (futuro: cron job)

CREATE TABLE IF NOT EXISTS email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  -- Tipos: 'invite' (criar conta), 'account_exists' (já tem conta),
  -- 'recovery' (recuperação senha), 'manual' (admin grant)
  email_type text NOT NULL CHECK (email_type IN ('invite', 'account_exists', 'recovery', 'manual')),
  -- Origem: stripe_front, stripe_installment, hotmart, manual_grant, admin_resend
  source text NOT NULL,
  -- Reference: PI Stripe, transactionId Hotmart, ou null pra manual
  source_ref text,
  -- Status do envio
  status text NOT NULL CHECK (status IN ('success', 'failed', 'error')),
  error_message text,
  -- Resend response id (pra debug/cross-reference)
  resend_id text,
  -- Tentativa atual (1, 2, 3...) — pra retry tracking
  attempt integer NOT NULL DEFAULT 1,
  -- Snapshot do payload enviado (pra replay/debug)
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Lookup por email (admin: histórico desse cliente)
CREATE INDEX IF NOT EXISTS idx_email_log_email
  ON email_send_log(email, created_at DESC);

-- Lookup por status falhado (admin: lista de problemas)
CREATE INDEX IF NOT EXISTS idx_email_log_failed
  ON email_send_log(created_at DESC)
  WHERE status IN ('failed', 'error');

-- Lookup por source_ref (cross-reference com stripe_sales / hotmart txn)
CREATE INDEX IF NOT EXISTS idx_email_log_source_ref
  ON email_send_log(source_ref)
  WHERE source_ref IS NOT NULL;

-- RLS: só admin lê (via service_role). Insert é só backend (service_role).
ALTER TABLE email_send_log ENABLE ROW LEVEL SECURITY;
-- Sem policies = ninguém via anon/authenticated, só service_role bypassa
