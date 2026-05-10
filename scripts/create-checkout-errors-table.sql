-- Tabela de erros do checkout — toda falha visível ao cliente é registrada aqui.
-- Permite descobrir bugs em minutos em vez de dias quando taxa de erro sobe.
--
-- Usage:
--  - API server-side loga via lib/checkout-errors.ts (logCheckoutError)
--  - Client-side reporta via /api/checkout-error → mesmo helper
--  - Dashboard agrega por error_code e ip nas últimas 24h

CREATE TABLE IF NOT EXISTS public.checkout_errors (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Origem do erro: "create_pi", "create_subscription", "update_pi",
  -- "update_subscription", "client_fetch", "client_timeout", "client_confirm"
  source text NOT NULL,
  -- Código curto agrupável: "rate_limit", "stripe_api", "network", "timeout",
  -- "invalid_email", "missing_price_id", etc.
  error_code text NOT NULL,
  -- Mensagem original (Stripe, etc) — pra debug
  error_message text,
  -- IP do cliente (cf-connecting-ip)
  ip text,
  -- Email tentado (se disponível) — útil pra reachout em vendas perdidas
  email text,
  -- Região do checkout (DEFAULT, USD, EUR, GBP, CHF)
  region text,
  -- Moeda usada
  currency text,
  -- User-agent abreviado (primeiros 200 chars)
  user_agent text,
  -- Payload extra em JSON (status code, retry attempt, etc)
  context jsonb
);

ALTER TABLE public.checkout_errors ENABLE ROW LEVEL SECURITY;

-- Sem policies → só service_role acessa (que ignora RLS)
-- Cliente não pode SELECT/INSERT direto

-- Indexes pra agregação no dashboard
CREATE INDEX IF NOT EXISTS idx_checkout_errors_created_at
  ON public.checkout_errors(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_checkout_errors_error_code
  ON public.checkout_errors(error_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_checkout_errors_source
  ON public.checkout_errors(source, created_at DESC);

-- ============================================================================
-- Cleanup automático — deleta registros > 30 dias.
-- Sem isso, a tabela cresceria indefinidamente em produção.
-- ============================================================================

-- 1. Função que deleta os registros antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_checkout_errors()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- roda com privilégio do owner; service_role já tem acesso
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.checkout_errors
  WHERE created_at < now() - interval '30 days';
END;
$$;

-- 2. Agenda o cleanup via pg_cron (extensão nativa Supabase)
-- Roda diariamente às 03:00 UTC (00:00 Brasília) — horário de baixo tráfego
-- Nota: pg_cron precisa estar habilitado no Supabase Dashboard:
--   Database → Extensions → pg_cron → Enable
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove job antigo se existir (idempotente)
    PERFORM cron.unschedule('cleanup-checkout-errors')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-checkout-errors');

    PERFORM cron.schedule(
      'cleanup-checkout-errors',
      '0 3 * * *',  -- todo dia às 03:00 UTC
      $cleanup$SELECT public.cleanup_old_checkout_errors();$cleanup$
    );
  ELSE
    RAISE NOTICE 'pg_cron não habilitado — habilite em Database → Extensions e re-rode este SQL';
  END IF;
END $$;
