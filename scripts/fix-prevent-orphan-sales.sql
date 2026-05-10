-- ──────────────────────────────────────────────────────────────────────────
-- Fix preventivo: vincular automaticamente novos sales ao user_id pelo email.
--
-- Problema observado em prod (07/05/2026):
-- 30 sales criados via webhook (Stripe/Hotmart) ficaram com user_id=NULL
-- porque o webhook só conhece o customer_email, não o user_id. Quando
-- cliente criava conta, o trigger on_invite_used_link_sale dependia do
-- account_invite ter o stripe_payment_intent_id correto — em alguns casos
-- isso falhava (invite criado depois do sale, payment_intent diferente, etc).
-- Resultado: sales orfãos. Cliente logava e via "Tu acceso ha vencido".
--
-- Solução: trigger BEFORE INSERT que tenta vincular pelo email match em
-- auth.users. Se acha user com mesmo email, popula user_id. Se não acha,
-- deixa NULL e os outros triggers (on_auth_user_created, on_invite_used)
-- vão cuidar quando o user criar conta.
--
-- Combinado com on_stripe_sale_set_expires_at (que roda BEFORE INSERT pra
-- popular expires_at), agora todo sale criado em prod tem:
-- 1. user_id correto (se conta já existe)
-- 2. expires_at populado (se for front)
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION on_stripe_sale_link_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Só busca se user_id NULL E temos email
  IF NEW.user_id IS NULL AND NEW.customer_email IS NOT NULL THEN
    BEGIN
      SELECT id INTO NEW.user_id
      FROM auth.users
      WHERE LOWER(email) = LOWER(NEW.customer_email)
      LIMIT 1;
      -- Se não acha user, fica NULL (trigger on_auth_user_created cuida depois)
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'on_stripe_sale_link_user failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_stripe_sale_link_user_trigger ON stripe_sales;
CREATE TRIGGER on_stripe_sale_link_user_trigger
  BEFORE INSERT ON stripe_sales
  FOR EACH ROW
  EXECUTE FUNCTION on_stripe_sale_link_user();
