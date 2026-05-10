-- Tabela de idempotency pro webhook Stripe.
-- Cada event.id processado é registrado aqui. Se Stripe re-entregar o mesmo
-- evento (acontece em ~0.1-1% dos casos por timeout), ignoramos na 2ª chegada.
--
-- Sem isso:
--  - Parcelas podem ter installment_number errado (race condition)
--  - Refunds são marcados 2x
--  - Sistema de entrega (futuro Resend/Appsell) dispara emails duplicados
--
-- TTL: 30 dias (Stripe não retenta após 3 dias, 30d dá margem)

CREATE TABLE IF NOT EXISTS public.stripe_processed_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_processed_events ENABLE ROW LEVEL SECURITY;
-- Sem policies → só service_role acessa (que ignora RLS)

CREATE INDEX IF NOT EXISTS idx_stripe_processed_events_processed_at
  ON public.stripe_processed_events(processed_at DESC);

-- ============================================================================
-- Cleanup automático — deleta registros > 30 dias
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_stripe_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.stripe_processed_events
  WHERE processed_at < now() - interval '30 days';
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('cleanup-stripe-events')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-stripe-events');

    PERFORM cron.schedule(
      'cleanup-stripe-events',
      '15 3 * * *',  -- 03:15 UTC todo dia (15min após cleanup_checkout_errors)
      $cleanup$SELECT public.cleanup_old_stripe_events();$cleanup$
    );
  ELSE
    RAISE NOTICE 'pg_cron não habilitado — habilite em Database → Extensions e re-rode';
  END IF;
END $$;
