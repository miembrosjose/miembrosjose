-- ──────────────────────────────────────────────────────────────────────────
-- Migration: validade de 1 ano pro acesso ao treinamento (front)
--
-- Decisões (alinhadas com user 07/05/2026):
--   - Apenas FRONT vence em 1 ano. Bumps/upsells permanecem permanentes.
--   - Marco de início = stripe_sales.created_at (data da compra original)
--   - Ao expirar: bloqueia front mas mantém produtos premium acessíveis
--   - Aplicação RETROATIVA contando da data original da compra
--     (clientes que compraram há >12 meses já estão vencidos — admin pode
--     renovar via painel /api/admin/extend-access)
-- ──────────────────────────────────────────────────────────────────────────

-- ── 1) Schema change ─────────────────────────────────────────────────────
ALTER TABLE stripe_sales
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Index pra filtros frequentes em owned-products (WHERE expires_at > now())
CREATE INDEX IF NOT EXISTS idx_stripe_sales_expires_at ON stripe_sales(expires_at);

-- ── 2) Backfill: pra TODOS sales que liberam o front (qualquer sale_type
-- com items contendo key='front'), expires_at = created_at + 1 ano ────
-- Inclui sales antigos do Hotmart, do Stripe normal e parcelado, e os
-- placeholders do trigger on_auth_user_created (sale_type='front').
UPDATE stripe_sales
SET expires_at = created_at + INTERVAL '1 year'
WHERE expires_at IS NULL
  AND items @> '[{"key": "front"}]'::jsonb;

-- ── 3) Trigger ao INSERT em stripe_sales: auto-popula expires_at se sale
-- contém key='front'. Pra outros produtos (bumps/upsells), deixa NULL =
-- permanente. Roda em qualquer fonte (webhook, admin grant, trigger
-- on_auth_user_created — todos passam por aqui). ──────────────────────
CREATE OR REPLACE FUNCTION on_stripe_sale_set_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Só popula se NULL (não sobrescreve admin extend-access que já setou)
  -- E só pra sales que incluem o front no items[]
  IF NEW.expires_at IS NULL
     AND NEW.items @> '[{"key": "front"}]'::jsonb
  THEN
    NEW.expires_at := COALESCE(NEW.created_at, now()) + INTERVAL '1 year';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_stripe_sale_set_expires_at_trigger ON stripe_sales;
CREATE TRIGGER on_stripe_sale_set_expires_at_trigger
  BEFORE INSERT ON stripe_sales
  FOR EACH ROW
  EXECUTE FUNCTION on_stripe_sale_set_expires_at();
