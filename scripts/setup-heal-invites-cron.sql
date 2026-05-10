-- Setup pg_cron pra rodar /api/cron/heal-invites a cada 5 minutos.
--
-- Esse cron e a REDE DE SEGURANCA contra falhas de webhook em assinaturas.
-- Funciona independente de invoice.payment_succeeded / invoice_payment.paid /
-- payment_intent.succeeded — se QUALQUER coisa falhar no webhook, em ate
-- 5 minutos esse cron varre o banco e libera acesso pra todo cliente que
-- pagou e nao recebeu email de invite.
--
-- COMO RODAR:
-- 1. Abre Supabase Dashboard → SQL Editor
-- 2. Cola esse SQL inteiro
-- 3. Executa
-- 4. Verifica que o job foi criado: ultimo SELECT mostra ele

-- Remove job antigo se existir (idempotente)
SELECT cron.unschedule('heal-invites-every-5min')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'heal-invites-every-5min');

-- Agenda novo
SELECT cron.schedule(
  'heal-invites-every-5min',
  '*/5 * * * *',  -- a cada 5 minutos
  $$
  SELECT net.http_post(
    url := 'https://SEU_DOMINIO.com/api/cron/heal-invites',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Secret', 'whats_cron_8K3jL9fM2nP4qR7vX1yZ5bC0dE6gH8wT'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verifica que foi criado
SELECT jobname, schedule, active, jobid
FROM cron.job
WHERE jobname IN ('heal-invites-every-5min', 'whatsapp-process-pending', 'whatsapp-pending-cleanup')
ORDER BY jobname;
