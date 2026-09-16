-- ============================================================================
-- STRIPE — ARREGLO MINIMO. Copiar ESTE ARCHIVO ENTERO (Ctrl+A, Ctrl+C).
-- ============================================================================
-- Crea las dos tablas que el webhook ya espera y hoy no existen.
-- No requiere desplegar codigo: app/api/stripe-webhook/route.ts ya las usa y
-- ahora mismo cae en su rama fail-open con un console.warn.
--
-- 100% aditivo. No toca ninguna tabla existente, no modifica datos, no crea
-- funciones, no usa pg_cron, no concede ni revoca permisos.
--
-- Sin policies: con RLS activa y cero policies solo entra service_role, que es
-- exactamente quien las usa. Mismo patron que stripe_sales.
--
-- NOTA: sin la funcion de limpieza, stripe_processed_events crece sin podarse.
-- Son 3 columnas de texto por evento: irrelevante durante mucho tiempo.
-- ============================================================================


-- ── 1 · purchase_webhook_log ───────────────────────────────────────────
-- Auditoria historica y replay del webhook externo de Purchase.
-- Las 7 columnas que inserta el codigo estan todas aqui; las 4 restantes
-- son serial, default o nulables.

CREATE TABLE IF NOT EXISTS public.purchase_webhook_log (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Identificadores de la venta
  payment_intent_id text NOT NULL,
  sale_type text NOT NULL,   -- front | front_installment | upsell | downsell | standalone

  -- Resultado
  status text NOT NULL,      -- success | failed | error
  status_code integer,       -- HTTP status del destino (null en exception/timeout)
  response_body text,        -- response del destino (truncado a 500 chars)
  error_message text,        -- mensaje de la exception (status='error')

  -- Payload completo enviado (para replay)
  payload jsonb NOT NULL,

  -- El replay manual marca aqui
  retried_at timestamptz,
  retry_status text          -- success | failed | error
);

ALTER TABLE public.purchase_webhook_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_purchase_webhook_log_status_created
  ON public.purchase_webhook_log (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_webhook_log_pi
  ON public.purchase_webhook_log (payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_purchase_webhook_log_created
  ON public.purchase_webhook_log (created_at DESC);


-- ── 2 · stripe_processed_events ────────────────────────────────────────
-- Idempotencia del webhook. La PRIMARY KEY sobre event_id es lo que hace
-- que una reentrega de Stripe devuelva 23505 y el codigo la ignore.

CREATE TABLE IF NOT EXISTS public.stripe_processed_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_processed_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_stripe_processed_events_processed_at
  ON public.stripe_processed_events (processed_at DESC);


-- ── 3 · Verificacion (solo lectura) ────────────────────────────────────
-- Esperado: 2 filas, ambas con existe = true, rls = true y veredicto = ok.

select
  t.nombre                                   as tabla,
  (c.oid is not null)                        as existe,
  coalesce(c.relrowsecurity, false)          as rls,
  coalesce((select count(*) from pg_policies p
              where p.schemaname = 'public'
                and p.tablename = t.nombre), 0) as policies,
  case
    when c.oid is null                then 'FALLO: no se creo'
    when not c.relrowsecurity         then 'FALLO: sin RLS'
    else 'ok'
  end                                        as veredicto
from (values ('purchase_webhook_log'), ('stripe_processed_events')) as t(nombre)
left join pg_class c
  on c.relname = t.nombre
 and c.relkind = 'r'
 and c.relnamespace = 'public'::regnamespace
order by t.nombre;
