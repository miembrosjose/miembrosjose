-- Adiciona campos pra suportar parcelamento via Stripe Subscription.
-- Cada parcela vira uma linha em stripe_sales (installment_number = 1, 2, 3).
-- access_revoked = true quando Smart Retries esgotam e cliente fica inadimplente.

ALTER TABLE stripe_sales
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS stripe_invoice_id text,
  ADD COLUMN IF NOT EXISTS installment_number int,
  ADD COLUMN IF NOT EXISTS total_installments int,
  ADD COLUMN IF NOT EXISTS access_revoked boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS payment_failed_count int DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS access_revoked_at timestamptz;

-- Permite mais opções no sale_type pra cobrir parcelas
ALTER TABLE stripe_sales DROP CONSTRAINT IF EXISTS stripe_sales_sale_type_check;
ALTER TABLE stripe_sales ADD CONSTRAINT stripe_sales_sale_type_check
  CHECK (sale_type IN ('front', 'upsell', 'front_installment'));

-- Permite status 'unpaid' (Smart Retries esgotadas) e 'pending'
ALTER TABLE stripe_sales DROP CONSTRAINT IF EXISTS stripe_sales_status_check;
ALTER TABLE stripe_sales ADD CONSTRAINT stripe_sales_status_check
  CHECK (status IN ('paid', 'refunded', 'disputed', 'failed', 'unpaid', 'pending'));

CREATE INDEX IF NOT EXISTS idx_stripe_sales_subscription ON stripe_sales(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stripe_sales_invoice ON stripe_sales(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stripe_sales_access_revoked ON stripe_sales(access_revoked) WHERE access_revoked = true;
