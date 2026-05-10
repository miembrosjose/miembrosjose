-- Backfill pras compras 1-click off-session que ficaram sem user_id e/ou sem plan='lifetime'.
--
-- Problema 1: webhook stripe-webhook NÃO setava user_id em sale_type='upsell' criadas
-- via /api/buy-product (off-session 1-click). Resultado: cliente comprou bump/upsell
-- mas owned-products query (`WHERE user_id = $`) não encontrava → produto não liberava.
--
-- Problema 2: handleUpgradeToLifetime UPDATE pode não ter aplicado se a sale do front
-- não tinha user_id setado (ex: user antigo, sale criada antes do account invite flow).
--
-- COMO RODAR:
-- 1. Abre o Supabase Dashboard → SQL Editor
-- 2. Cola esse SQL inteiro
-- 3. Executa
-- 4. Resultado mostra quantas linhas foram afetadas em cada CTE

-- ============================================================
-- STEP 1: Backfill user_id em sales sale_type='upsell' usando customer_email
-- ============================================================
-- Lê customer_email da sale e procura user em auth.users com mesmo email.
-- Aplica só pra sales sem user_id (não sobrescreve nada).

WITH upsells_to_fix AS (
  SELECT s.id, s.customer_email, u.id AS auth_user_id
  FROM stripe_sales s
  JOIN auth.users u ON LOWER(u.email) = LOWER(s.customer_email)
  WHERE s.sale_type = 'upsell'
    AND s.user_id IS NULL
    AND s.status = 'paid'
    AND s.customer_email IS NOT NULL
)
UPDATE stripe_sales s
SET user_id = uf.auth_user_id
FROM upsells_to_fix uf
WHERE s.id = uf.id
RETURNING s.id, s.customer_email, s.user_id, s.items;

-- ============================================================
-- STEP 2: Forca plan='lifetime' nas sales do front pra users que PAGARAM upgrade
-- ============================================================
-- Detecta upgrades que foram cobrados (sale_type vazio mas metadata.upgrade_to_lifetime
-- via PaymentIntent succeeded) — isso fica em stripe_processed_events.
--
-- Como não temos os PIs de upgrade na tabela stripe_sales (handleUpgradeToLifetime
-- só faz UPDATE, não cria sale), olhamos por outro caminho: pra cada user que TENTOU
-- upgrade nos últimos 7 dias e a sale do front continua plan='annual', forçamos
-- pra lifetime APENAS se houver indício de pagamento.
--
-- ATENÇÃO: esse step requer ID do user pra rodar com segurança. Substitui
-- 'EMAIL_DO_USUARIO_AQUI' pelo email real do cliente que pagou e não recebeu.

-- 2a) Descobre o user_id pelo email
WITH target_user AS (
  SELECT id FROM auth.users
  WHERE LOWER(email) = LOWER('EMAIL_DO_USUARIO_AQUI')  -- ← TROCA AQUI
  LIMIT 1
)
-- 2b) Atualiza TODAS sales front desse user pra lifetime
UPDATE stripe_sales s
SET plan = 'lifetime', expires_at = NULL
FROM target_user tu
WHERE s.user_id = tu.id
  AND s.status = 'paid'
  AND s.items @> '[{"key": "front"}]'
  AND (s.plan = 'annual' OR s.plan IS NULL)
RETURNING s.id, s.user_id, s.plan, s.expires_at, s.items;

-- ============================================================
-- VERIFICAÇÃO: lista sales do user pra confirmar que o backfill rodou
-- ============================================================
SELECT
  s.id,
  s.sale_type,
  s.plan,
  s.user_id,
  s.customer_email,
  s.items,
  s.status,
  s.expires_at,
  s.created_at
FROM stripe_sales s
WHERE LOWER(s.customer_email) = LOWER('EMAIL_DO_USUARIO_AQUI')  -- ← TROCA AQUI TAMBÉM
  AND s.status = 'paid'
ORDER BY s.created_at DESC;
