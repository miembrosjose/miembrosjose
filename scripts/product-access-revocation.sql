-- ──────────────────────────────────────────────────────────────────────────
-- PRODUCT ACCESS REVOCATION
--
-- Sistema pra revogar acesso a produto, manualmente (admin UI) ou automaticamente
-- (webhooks Stripe/Hotmart em refund/chargeback).
--
-- Estratégia:
--   - Refunds via Stripe webhook já marcam stripe_sales.status='refunded' (existente)
--   - Mas isso não cobre revogação manual SEM cobrança original (admin "tirou
--     porque cliente fez besteira", ou conteúdo foi compartilhado fora do que
--     pagou). Pra esses casos, tabela `revoked_products` registra revogação
--     por (email, product_key).
--   - /api/profile/owned-products filtra: NÃO retorna keys que estão em
--     revoked_products pra esse email.
--   - Pra "front refund = perde acesso COMPLETO": app_metadata.access_revoked = true
--     no auth.users (middleware bloqueia + signOut força logout).
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS revoked_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text NOT NULL,
  product_key text NOT NULL,                    -- creativos, andromeda, analytics, revisao, minivsl, front
  reason text,                                   -- 'refund', 'chargeback', 'manual', 'fraud'
  source text NOT NULL DEFAULT 'manual',         -- 'stripe', 'hotmart', 'manual'
  source_ref text,                               -- payment_intent_id, hotmart transaction id, ou admin email
  revoked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- admin que revogou
  revoked_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

CREATE INDEX IF NOT EXISTS idx_revoked_products_email
  ON revoked_products (customer_email, product_key);
CREATE INDEX IF NOT EXISTS idx_revoked_products_revoked_at
  ON revoked_products (revoked_at DESC);

-- RLS: só service_role acessa (admin server-side). Authenticated não precisa ler.
ALTER TABLE revoked_products ENABLE ROW LEVEL SECURITY;

-- Helper: testa se um (email, key) está revogado. Útil em queries do app.
CREATE OR REPLACE FUNCTION is_product_revoked(p_email text, p_key text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM revoked_products
    WHERE customer_email = lower(p_email) AND product_key = p_key
    LIMIT 1
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
