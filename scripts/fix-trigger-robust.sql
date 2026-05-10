-- ──────────────────────────────────────────────────────────────────────────
-- Fix CRÍTICO: tornar trigger on_auth_user_created_link_sales ROBUSTO
--
-- Problema: trigger original fazia INSERT em stripe_sales sem proteção. Se
-- algum constraint falhar (CHECK sale_type, NOT NULL, etc), o INSERT em
-- auth.users também falha (porque trigger é AFTER INSERT no MESMO transaction).
-- Resultado: criação de conta quebra inteira.
--
-- Bug observado em prod (07/05/2026):
-- Cliente Mauricio (morti.mkt@gmail.com) acabou de comprar e não conseguiu
-- criar conta. Tela mostra "Algo salió mal".
--
-- Fix: envolve toda lógica em BEGIN/EXCEPTION pra que QUALQUER erro do trigger
-- seja loggado mas NÃO impeça a criação do user em auth.users. Auth tem que
-- funcionar mesmo se a vinculação de sales falhar.
--
-- RODAR esse SQL no Supabase Studio AGORA pra desbloquear o cliente.
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION on_auth_user_created_link_sales()
RETURNS TRIGGER AS $$
DECLARE
  v_has_front boolean;
BEGIN
  -- TODA lógica dentro de BEGIN/EXCEPTION pra robustez. Trigger NUNCA pode
  -- quebrar o INSERT em auth.users.
  BEGIN
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
      ON CONFLICT (stripe_payment_intent_id) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Loga mas NÃO falha — auth.users INSERT continua.
    -- Logs do Postgres ficam em supabase logs > postgres-logs.
    RAISE WARNING 'on_auth_user_created_link_sales failed for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mesma robustez pro outro trigger (vincula sales quando invite usado)
CREATE OR REPLACE FUNCTION on_invite_used_link_sale()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    IF NEW.used_by_user_id IS NOT NULL
       AND (OLD.used_by_user_id IS NULL OR OLD.used_by_user_id != NEW.used_by_user_id)
       AND NEW.stripe_payment_intent_id IS NOT NULL
    THEN
      UPDATE stripe_sales
      SET user_id = NEW.used_by_user_id
      WHERE stripe_payment_intent_id = NEW.stripe_payment_intent_id
        AND user_id IS NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'on_invite_used_link_sale failed for invite %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
