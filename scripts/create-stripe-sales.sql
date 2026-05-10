-- Tabela de vendas Stripe (separada de hotmart_sales pra não misturar fontes)
-- Cada linha = uma venda confirmada (front product OU upsell 1-click)

CREATE TABLE IF NOT EXISTS stripe_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- IDs Stripe
  stripe_session_id text,                    -- cs_xxx (só pra compras via Checkout Session)
  stripe_payment_intent_id text NOT NULL UNIQUE, -- pi_xxx (sempre presente)
  stripe_customer_id text,                   -- cus_xxx (pra cobrar upsells off-session depois)

  -- Tipo de venda
  sale_type text NOT NULL CHECK (sale_type IN ('front', 'upsell')),
  region text NOT NULL,                      -- DEFAULT, USD, EUR, GBP, CHF

  -- Conteúdo da compra
  items jsonb NOT NULL,                      -- [{key, name, price, qty}]

  -- Valores
  amount_total integer NOT NULL,             -- em centavos (Stripe amount)
  currency text NOT NULL,                    -- usd, eur, gbp, chf, brl, etc
  amount_total_brl numeric(10,2),            -- conversão pra BRL pra dashboard (opcional)

  -- Cliente
  customer_email text,
  customer_name text,
  customer_phone text,
  customer_country text,

  -- Tracking
  utm jsonb,                                 -- {utm_source, utm_medium, utm_campaign, fbclid, gclid}
  ip_address text,
  user_agent text,

  -- Status
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'refunded', 'disputed', 'failed')),

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stripe_sales DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_stripe_sales_payment_intent ON stripe_sales(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_sales_customer ON stripe_sales(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_sales_session ON stripe_sales(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_stripe_sales_created ON stripe_sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_sales_email ON stripe_sales(customer_email);

CREATE OR REPLACE FUNCTION update_stripe_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stripe_sales_updated_at ON stripe_sales;
CREATE TRIGGER trg_stripe_sales_updated_at
  BEFORE UPDATE ON stripe_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_stripe_sales_updated_at();
