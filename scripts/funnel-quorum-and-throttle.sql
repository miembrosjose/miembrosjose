-- ──────────────────────────────────────────────────────────────────────────
-- Funnel: XP por quorum + throttle + flag pendente
--
-- Mudanças:
--  - funnel_created: 500 → 150 XP, mas só LIBERA quando o funnel tem 3+ likes
--  - Trigger novo: detecta quando likes_count chega em 3 e libera o XP retroativo
--  - Coluna xp_released boolean em user_funnels (controla idempotência)
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE user_funnels ADD COLUMN IF NOT EXISTS xp_released boolean NOT NULL DEFAULT false;

-- Funnel created: NÃO dá XP imediato (espera 3 likes)
CREATE OR REPLACE FUNCTION on_xp_funnel_created() RETURNS TRIGGER AS $$
BEGIN
  -- Não awards XP aqui. XP só vem quando atingir 3 likes (via trigger separado).
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Quando user_funnels.likes_count atualiza, checa se cruzou o threshold de 3
CREATE OR REPLACE FUNCTION on_funnel_likes_threshold() RETURNS TRIGGER AS $$
BEGIN
  -- Só dispara se subiu pra 3+ likes E ainda não liberou XP
  IF NEW.likes_count >= 3 AND NEW.xp_released = false THEN
    PERFORM apply_xp_delta(NEW.user_id, 'funnel_created', 150, 0, 'user_funnels', NEW.id::text);
    NEW.xp_released := true;
    -- Notification pro author
    INSERT INTO notifications (user_id, type, title, preview)
    VALUES (NEW.user_id, 'funnel_xp_released', '¡Tu funnel ganó XP!',
      'Recibió 3+ likes y desbloqueó +150 XP. Sigue compartiendo.');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_funnel_likes_threshold ON user_funnels;
CREATE TRIGGER trg_funnel_likes_threshold
  BEFORE UPDATE OF likes_count ON user_funnels
  FOR EACH ROW EXECUTE FUNCTION on_funnel_likes_threshold();
