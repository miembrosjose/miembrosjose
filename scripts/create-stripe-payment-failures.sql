-- ──────────────────────────────────────────────────────────────────────────
-- stripe_payment_failures: registra falhas de pagamento Stripe pra recovery.
--
-- Cada falha de confirmPayment dispara recovery (Hotmart link via WhatsApp + email).
-- Tabela serve dois propósitos:
--   1) Dedup — não disparar 2 mensagens pro mesmo payment_intent_id ou pro
--      mesmo email em curto período (cooldown 30min)
--   2) Analytics — medir quantas falhas viram conversão Hotmart depois
--
-- RLS desabilitado (server-side via service_role).
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stripe_payment_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Stripe IDs (payment_intent_id é a fonte de verdade)
  stripe_payment_intent_id text UNIQUE,    -- pi_xxx; null se falha aconteceu antes do PI
  stripe_customer_id text,

  -- Cliente
  customer_email text NOT NULL,
  customer_name text,
  customer_phone text,
  customer_country text,                   -- ISO 2 (ex: "CO", "ES")

  -- Erro Stripe
  error_code text,                         -- card_declined, setup_future_usage_invalid, etc
  error_message text,
  error_decline_code text,

  -- Recovery dispatch
  hotmart_url text NOT NULL,               -- URL final montada com pre-fill + UTMs
  hotmart_region text,                     -- DEFAULT, USD, EUR, GBP, CHF
  whatsapp_sent_at timestamptz,
  whatsapp_error text,
  email_sent_at timestamptz,
  email_error text,

  -- Conversão (preenchido depois quando Hotmart webhook bater — futuro)
  converted_to_hotmart_at timestamptz,
  hotmart_transaction_id text,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_failures_email ON stripe_payment_failures (customer_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_failures_pi ON stripe_payment_failures (stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_failures_created ON stripe_payment_failures (created_at DESC);

ALTER TABLE stripe_payment_failures DISABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION update_payment_failures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_failures_updated_at ON stripe_payment_failures;
CREATE TRIGGER trg_payment_failures_updated_at
  BEFORE UPDATE ON stripe_payment_failures
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_failures_updated_at();
