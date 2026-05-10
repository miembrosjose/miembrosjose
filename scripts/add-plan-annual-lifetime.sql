-- ──────────────────────────────────────────────────────────────────────────
-- Migration: distinguir plano "annual" vs "lifetime" no stripe_sales
--
-- Contexto: o checkout vende DOIS produtos com preços diferentes:
--   - Acceso Anual: USD 57 (LATAM) / USD 127 (USD/EUR/GBP/CHF)
--     → vence em 1 ano da compra
--   - Acceso Vitalício: USD 97 (LATAM) / USD 197 (USD/EUR/GBP/CHF)
--     → permanente, nunca vence
--
-- Antes dessa migration: stripe_sales.items[] só tinha key="front",
-- sem distinguir entre os 2 planos. Sistema aplicou 1 ano em TUDO.
--
-- Esta migration:
--   1. Adiciona coluna `plan` em stripe_sales
--   2. Backfill TODOS sales antigos como 'lifetime' (vitalício) — sem
--      prejuízo a ninguém. Quem comprou no fluxo antigo (key="front")
--      mantém acesso permanente.
--   3. Atualiza trigger BEFORE INSERT pra só popular expires_at quando
--      plan='annual' E items contém key='front'.
-- ──────────────────────────────────────────────────────────────────────────

-- ── 1) Schema change ─────────────────────────────────────────────────────
ALTER TABLE stripe_sales
  ADD COLUMN IF NOT EXISTS plan text
  CHECK (plan IS NULL OR plan IN ('lifetime', 'annual'));

CREATE INDEX IF NOT EXISTS idx_stripe_sales_plan ON stripe_sales(plan);

-- ── 2) Backfill: antigos viram vitalícios ────────────────────────────────
-- Todos sales front sem plan definido viram 'lifetime' + expires_at NULL
-- (vitalício/permanente). Sem prejuízo: cliente que comprou ANTES da
-- distinção annual vs lifetime mantém acesso permanente.
UPDATE stripe_sales
SET plan = 'lifetime',
    expires_at = NULL
WHERE plan IS NULL
  AND items @> '[{"key": "front"}]'::jsonb;

-- ── 3) Trigger BEFORE INSERT atualizado ──────────────────────────────────
-- Só popula expires_at se plan='annual'. Lifetime fica permanente (NULL).
CREATE OR REPLACE FUNCTION on_stripe_sale_set_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Só popula se NULL (não sobrescreve admin extend-access que já setou)
  -- E só pra sales com plan='annual' contendo front no items[]
  IF NEW.expires_at IS NULL
     AND NEW.plan = 'annual'
     AND NEW.items @> '[{"key": "front"}]'::jsonb
  THEN
    NEW.expires_at := COALESCE(NEW.created_at, now()) + INTERVAL '1 year';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger já está ativo (criado em migration anterior). CREATE OR REPLACE
-- da function basta — não precisa recriar trigger.
