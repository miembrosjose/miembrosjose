-- Corrige registros históricos onde is_order_bump é NULL
-- Lê o campo raw JSONB para determinar o valor correto

UPDATE hotmart_sales
SET is_order_bump = COALESCE(
  (raw->'data'->'purchase'->'order_bump'->>'is_order_bump')::boolean,
  false
)
WHERE is_order_bump IS NULL;
