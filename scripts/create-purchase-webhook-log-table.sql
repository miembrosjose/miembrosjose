-- Tabela de log do webhook externo de Purchase (SEU_TRACKING_WEBHOOK.com).
-- Cada chamada de sendPurchaseWebhook (em app/api/stripe-webhook/route.ts) grava
-- aqui sucesso, falha ou erro — permite auditoria histórica e replay manual.
--
-- Cloudflare Observability só retém 3 dias; essa tabela retém pra sempre.
--
-- Usage:
--  - Auditoria: select * from purchase_webhook_log where status != 'success' ...
--  - Cruzar com stripe_sales pra detectar vendas que não chegaram no destino
--  - Replay manual via scripts/replay-purchase-webhook-failures.mjs

CREATE TABLE IF NOT EXISTS public.purchase_webhook_log (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Identificadores da venda
  payment_intent_id text NOT NULL,
  sale_type text NOT NULL,   -- front | front_installment | upsell | downsell | standalone

  -- Resultado
  status text NOT NULL,      -- success | failed | error
  status_code integer,       -- HTTP status do destino (null em exception/timeout)
  response_body text,        -- response do destino (truncado em 500 chars)
  error_message text,        -- mensagem da exception (status='error')

  -- Payload completo enviado (pra replay)
  payload jsonb NOT NULL,

  -- Replay manual marca aqui
  retried_at timestamptz,
  retry_status text          -- success | failed | error
);

ALTER TABLE public.purchase_webhook_log ENABLE ROW LEVEL SECURITY;
-- Sem policies → só service_role escreve/lê (cliente não toca)

-- Index pra query de auditoria mais comum: "falhas no período"
CREATE INDEX IF NOT EXISTS idx_purchase_webhook_log_status_created
  ON public.purchase_webhook_log (status, created_at DESC);

-- Index pra lookup por payment_intent (replay, debug)
CREATE INDEX IF NOT EXISTS idx_purchase_webhook_log_pi
  ON public.purchase_webhook_log (payment_intent_id);

-- Index geral por data
CREATE INDEX IF NOT EXISTS idx_purchase_webhook_log_created
  ON public.purchase_webhook_log (created_at DESC);
