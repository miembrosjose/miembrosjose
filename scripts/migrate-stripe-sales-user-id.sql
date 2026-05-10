-- ──────────────────────────────────────────────────────────────────────────
-- Migration: vincular stripe_sales ao auth.users via user_id
--
-- Bug que isso resolve:
--   Hoje stripe_sales só tem customer_email. Quando user cria conta com
--   email que já tem testes antigos (de testes de checkout em modo dev),
--   /api/profile/owned-products agrega TODAS as vendas desse email —
--   incluindo testes antigos. Resultado: user manual vê produtos liberados
--   indevidamente.
--
-- Solução:
--   1. Adicionar coluna user_id em stripe_sales (FK auth.users)
--   2. Adicionar used_by_user_id em account_invites
--   3. Backfill: vincular sales aos users via account_invites.stripe_payment_intent_id
--      → user_id de quem usou o invite. SEGURO porque invites são fluxo natural
--      de compra → criação de conta. Sales sem invite ficam user_id=NULL.
--   4. Trigger 1: ao criar user em auth.users, AUTO-criar stripe_sale placeholder
--      com sale_type=front pra esse user_id (libera membership básica).
--      Sales antigos com mesmo email NÃO são vinculados — ficam orphan ou
--      ligados ao user antigo. Resultado: user manual = SÓ front, sem testes antigos.
--   5. Trigger 2: ao marcar invite como usado (used_at preenchido), vincula
--      todas as stripe_sales daquele payment_intent_id ao user. Resultado:
--      user via invite = front + bumps/upsells reais.
--   6. owned-products muda pra filtrar por user_id (não mais customer_email).
-- ──────────────────────────────────────────────────────────────────────────

-- ── 1) Schema changes ─────────────────────────────────────────────────────
ALTER TABLE stripe_sales
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stripe_sales_user_id ON stripe_sales(user_id);

ALTER TABLE account_invites
  ADD COLUMN IF NOT EXISTS used_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── 2) Backfill seguro via account_invites ────────────────────────────────
-- Pra invites já usados (used_at preenchido), tenta encontrar o user_id pelo
-- email match em auth.users. Esse vínculo é seguro porque: invite usado =
-- conta criada com aquele email = user_id ÚNICO daquele email.
UPDATE account_invites ai
SET used_by_user_id = u.id
FROM auth.users u
WHERE ai.used_by_user_id IS NULL
  AND ai.used_at IS NOT NULL
  AND LOWER(ai.email) = LOWER(u.email);

-- Vincula stripe_sales aos users via account_invites.used_by_user_id.
-- Match por stripe_payment_intent_id (UNIQUE em ambas tabelas).
UPDATE stripe_sales s
SET user_id = ai.used_by_user_id
FROM account_invites ai
WHERE s.user_id IS NULL
  AND ai.used_by_user_id IS NOT NULL
  AND s.stripe_payment_intent_id = ai.stripe_payment_intent_id;

-- ── 3) Trigger 1: cria placeholder front ao criar user em auth.users ──────
-- Garante que TODO user criado (manual via Supabase Auth Studio ou via invite)
-- tenha pelo menos 1 stripe_sale com sale_type=front + user_id setado.
-- Isso libera a área de membros básica.
--
-- Sales antigos com mesmo email NÃO são vinculados aqui — ficam orphan
-- (user_id=NULL) ou vinculados ao user antigo. Trigger 2 cuida do flow normal
-- (compra → invite → conta).
CREATE OR REPLACE FUNCTION on_auth_user_created_link_sales()
RETURNS TRIGGER AS $$
DECLARE
  v_has_front boolean;
BEGIN
  -- Verifica se já tem stripe_sale com front pra esse user (caso edge: trigger
  -- 2 já rodou antes, ou backfill anterior já vinculou).
  SELECT EXISTS(
    SELECT 1 FROM stripe_sales
    WHERE user_id = NEW.id
      AND status = 'paid'
      AND items @> '[{"key": "front"}]'::jsonb
  ) INTO v_has_front;

  IF NOT v_has_front THEN
    INSERT INTO stripe_sales (
      stripe_payment_intent_id,
      sale_type,
      region,
      items,
      amount_total,
      currency,
      customer_email,
      status,
      user_id,
      utm
    ) VALUES (
      'auto_signup_' || NEW.id::text,
      'front',
      'AUTO',
      '[{"key":"front","name":"[BRAND_NAME]","price":0,"qty":1}]'::jsonb,
      0,
      'usd',
      NEW.email,
      'paid',
      NEW.id,
      jsonb_build_object('source', 'auto_on_signup')
    )
    -- Idempotência: se trigger rodar 2x (impossível mas defensivo), não duplica
    ON CONFLICT (stripe_payment_intent_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_link_sales_trigger ON auth.users;
CREATE TRIGGER on_auth_user_created_link_sales_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION on_auth_user_created_link_sales();

-- ── 4) Trigger 2: vincula stripe_sales reais quando invite é usado ───────
-- Quando markInviteUsed roda (UPDATE em account_invites com used_at + user_id),
-- vincula a sale daquele payment_intent ao user.
CREATE OR REPLACE FUNCTION on_invite_used_link_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Só processa quando used_by_user_id passa de NULL pra preenchido
  IF NEW.used_by_user_id IS NOT NULL
     AND (OLD.used_by_user_id IS NULL OR OLD.used_by_user_id != NEW.used_by_user_id)
     AND NEW.stripe_payment_intent_id IS NOT NULL
  THEN
    UPDATE stripe_sales
    SET user_id = NEW.used_by_user_id
    WHERE stripe_payment_intent_id = NEW.stripe_payment_intent_id
      AND user_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_invite_used_link_sale_trigger ON account_invites;
CREATE TRIGGER on_invite_used_link_sale_trigger
  AFTER UPDATE ON account_invites
  FOR EACH ROW
  EXECUTE FUNCTION on_invite_used_link_sale();
