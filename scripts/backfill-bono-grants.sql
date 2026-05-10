-- Backfill auto-grant do bonus-ganchos pra users que JÁ comentaram em
-- posts com tag "bono" antes da feature ser deployada (commit b576120).
--
-- Lógica: pra cada user que tem reply em forum_posts com tag "bono" no
-- array tags, cria um stripe_sales fake (sale_type=manual, region=AUTO_BONO)
-- com items=[{key:"bonus-ganchos"}] — desde que NÃO exista já uma venda
-- equivalente. ON CONFLICT por user/email evita duplicar.
--
-- Rodar no Supabase SQL Editor (service_role). Idempotente — pode rodar
-- mais de uma vez sem efeito colateral.

-- 1) Lista preview do que vai ser criado (rode antes do INSERT pra conferir).
-- IMPORTANTE: a checagem de tag eh case-insensitive (LOWER(tag)='bono')
-- porque o admin tipicamente cadastra em MAIUSCULO ("BONO"). O JS do API
-- usa t.toLowerCase() === "bono" — mantemos consistencia aqui.
SELECT DISTINCT
  r.user_id,
  u.email AS customer_email,
  COUNT(DISTINCT r.post_id) AS qtd_posts_bono_comentados
FROM forum_replies r
JOIN forum_posts  p ON p.id = r.post_id
JOIN auth.users   u ON u.id = r.user_id
WHERE EXISTS (
    SELECT 1 FROM unnest(p.tags) AS tag WHERE LOWER(tag) = 'bono'
  )
  AND u.email IS NOT NULL
  AND NOT EXISTS (                                -- ainda não tem venda do bonus
    SELECT 1
    FROM stripe_sales s
    WHERE LOWER(s.customer_email) = LOWER(u.email)
      AND s.items @> '[{"key":"bonus-ganchos"}]'::jsonb
  )
GROUP BY r.user_id, u.email
ORDER BY u.email;


-- 2) INSERT — cria a venda fake (rode depois de conferir o preview acima).
-- Usa CTE pra agregar replies primeiro (MIN data + first post_id) e
-- DEPOIS joina com auth.users — evita erro de GROUP BY com colunas
-- não agregadas (raw_user_meta_data, email).
WITH bono_users AS (
  SELECT
    r.user_id,
    MIN(r.created_at) AS first_reply_at,
    (array_agg(r.post_id ORDER BY r.created_at))[1] AS first_post_id
  FROM forum_replies r
  JOIN forum_posts p ON p.id = r.post_id
  WHERE EXISTS (
    SELECT 1 FROM unnest(p.tags) AS tag WHERE LOWER(tag) = 'bono'
  )
  GROUP BY r.user_id
)
INSERT INTO stripe_sales (
  stripe_session_id,
  stripe_payment_intent_id,
  stripe_customer_id,
  sale_type,
  region,
  items,
  amount_total,
  currency,
  customer_email,
  customer_name,
  customer_phone,
  customer_country,
  utm,
  status,
  user_id,
  created_at
)
SELECT
  NULL,
  'auto_bono_backfill_' || b.user_id || '_' || EXTRACT(EPOCH FROM b.first_reply_at)::bigint,
  NULL,
  'manual',
  'AUTO_BONO',
  '[{"key":"bonus-ganchos","name":"Pack de Ganchos Neuronales™","price":0,"qty":1}]'::jsonb,
  0,
  'usd',
  LOWER(u.email),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1)),
  NULL,
  NULL,
  jsonb_build_object('source', 'bono_backfill', 'first_reply_post_id', b.first_post_id),
  'paid',
  b.user_id,
  b.first_reply_at                               -- usa data do primeiro comentário
FROM bono_users b
JOIN auth.users u ON u.id = b.user_id
WHERE u.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM stripe_sales s
    WHERE LOWER(s.customer_email) = LOWER(u.email)
      AND s.items @> '[{"key":"bonus-ganchos"}]'::jsonb
  );


-- 3) Verifica resultado — quantos foram criados
SELECT
  customer_email,
  status,
  region,
  items,
  created_at
FROM stripe_sales
WHERE region = 'AUTO_BONO'
ORDER BY created_at DESC
LIMIT 50;
