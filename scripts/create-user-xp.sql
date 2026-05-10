-- ──────────────────────────────────────────────────────────────────────────
-- user_xp + xp_events — sistema de XP e Level.
--
-- user_xp: 1 row por user com snapshot do total_xp + bonus_levels (compras)
-- xp_events: log append-only de cada evento que deu XP/level (audit + history)
--
-- Triggers automatizam award:
--   - forum_posts INSERT     → +50 XP
--   - forum_replies INSERT   → +20 XP
--   - forum_likes INSERT     → +5 XP pro author do post
--   - episode_comments INSERT → +10 XP
--
-- Compra de produto (stripe_sales sale_type IN ('front','upsell','standalone'))
-- → +1 bonus_level (NÃO via XP). Trigger separada.
--
-- Notification de level-up: lib/xp-grant.ts (server-side) detecta level
-- mudou e cria row em notifications.
-- ──────────────────────────────────────────────────────────────────────────

-- ── user_xp ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_xp (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp int NOT NULL DEFAULT 0,
  bonus_levels int NOT NULL DEFAULT 0,    -- +1 por produto comprado
  current_level int NOT NULL DEFAULT 1,   -- cache do level computado (helper na app calcula real)
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read xp" ON user_xp;
CREATE POLICY "authenticated read xp"
  ON user_xp FOR SELECT TO authenticated USING (true);


-- ── xp_events (log) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  xp_delta int NOT NULL DEFAULT 0,
  level_delta int NOT NULL DEFAULT 0,
  source_table text,                       -- 'forum_posts', 'forum_replies', etc
  source_id text,                          -- id do recurso (string pra suportar pi_xxx)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xp_events_user ON xp_events (user_id, created_at DESC);

ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users read own xp events" ON xp_events;
CREATE POLICY "users read own xp events"
  ON xp_events FOR SELECT TO authenticated USING (user_id = auth.uid());


-- ── Helper: aplica delta atomicamente ──────────────────────────────────────
CREATE OR REPLACE FUNCTION apply_xp_delta(
  p_user_id uuid,
  p_event_type text,
  p_xp_delta int,
  p_level_delta int,
  p_source_table text,
  p_source_id text
)
RETURNS void AS $$
BEGIN
  -- Garante row em user_xp
  INSERT INTO user_xp (user_id, total_xp, bonus_levels)
  VALUES (p_user_id, GREATEST(0, p_xp_delta), GREATEST(0, p_level_delta))
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = user_xp.total_xp + GREATEST(0, p_xp_delta),
    bonus_levels = user_xp.bonus_levels + GREATEST(0, p_level_delta),
    updated_at = now();

  -- Log do evento
  INSERT INTO xp_events (user_id, event_type, xp_delta, level_delta, source_table, source_id)
  VALUES (p_user_id, p_event_type, p_xp_delta, p_level_delta, p_source_table, p_source_id);
END;
$$ LANGUAGE plpgsql;


-- ── Triggers: awards automáticos ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION on_xp_forum_post()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM apply_xp_delta(NEW.user_id, 'forum_post', 50, 0, 'forum_posts', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_xp_forum_post ON forum_posts;
CREATE TRIGGER trg_xp_forum_post
  AFTER INSERT ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION on_xp_forum_post();


CREATE OR REPLACE FUNCTION on_xp_forum_reply()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM apply_xp_delta(NEW.user_id, 'forum_reply', 20, 0, 'forum_replies', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_xp_forum_reply ON forum_replies;
CREATE TRIGGER trg_xp_forum_reply
  AFTER INSERT ON forum_replies
  FOR EACH ROW EXECUTE FUNCTION on_xp_forum_reply();


CREATE OR REPLACE FUNCTION on_xp_forum_like()
RETURNS TRIGGER AS $$
DECLARE v_post_owner uuid;
BEGIN
  SELECT user_id INTO v_post_owner FROM forum_posts WHERE id = NEW.post_id;
  IF v_post_owner IS NOT NULL AND v_post_owner <> NEW.user_id THEN
    PERFORM apply_xp_delta(v_post_owner, 'forum_like_received', 5, 0, 'forum_likes', NEW.post_id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_xp_forum_like ON forum_likes;
CREATE TRIGGER trg_xp_forum_like
  AFTER INSERT ON forum_likes
  FOR EACH ROW EXECUTE FUNCTION on_xp_forum_like();


CREATE OR REPLACE FUNCTION on_xp_episode_comment()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM apply_xp_delta(NEW.user_id, 'episode_comment', 10, 0, 'episode_comments', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_xp_episode_comment ON episode_comments;
CREATE TRIGGER trg_xp_episode_comment
  AFTER INSERT ON episode_comments
  FOR EACH ROW EXECUTE FUNCTION on_xp_episode_comment();


-- ── Trigger: compra → +1 level ─────────────────────────────────────────────
-- Só dispara quando uma row em stripe_sales fica status='paid' (insert OU update).
-- 1 level por venda — independente de quantos items tem (front + bumps = 1 level só).
-- Match user via customer_email → auth.users.email.
CREATE OR REPLACE FUNCTION on_xp_purchase()
RETURNS TRIGGER AS $$
DECLARE v_user_id uuid;
BEGIN
  IF NEW.status <> 'paid' THEN RETURN NEW; END IF;
  IF (TG_OP = 'UPDATE' AND OLD.status = 'paid') THEN RETURN NEW; END IF;
  IF NEW.sale_type NOT IN ('front', 'upsell', 'standalone', 'manual') THEN RETURN NEW; END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(NEW.customer_email) LIMIT 1;
  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  PERFORM apply_xp_delta(v_user_id, 'product_purchase', 0, 1, 'stripe_sales', NEW.stripe_payment_intent_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_xp_purchase ON stripe_sales;
CREATE TRIGGER trg_xp_purchase
  AFTER INSERT OR UPDATE OF status ON stripe_sales
  FOR EACH ROW EXECUTE FUNCTION on_xp_purchase();


-- ── Detector de Level-Up: cria notification quando level aumenta ────────────
-- Replica curva da app: XP do level N → N+1 = round(100 * N^1.35).
-- Quando user_xp.total_xp ou bonus_levels atualiza, recalcula level e
-- compara com current_level. Se subiu, atualiza + cria notification.

CREATE OR REPLACE FUNCTION compute_level_from_xp(p_total_xp int, p_bonus int)
RETURNS int AS $$
DECLARE
  v_level int := 1;
  v_acc int := 0;
  v_need int;
BEGIN
  WHILE v_level < 200 LOOP
    v_need := round(100 * power(v_level, 1.35));
    EXIT WHEN v_acc + v_need > p_total_xp;
    v_acc := v_acc + v_need;
    v_level := v_level + 1;
  END LOOP;
  RETURN LEAST(200, v_level + GREATEST(0, p_bonus));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION on_user_xp_change()
RETURNS TRIGGER AS $$
DECLARE
  v_new_level int;
BEGIN
  v_new_level := compute_level_from_xp(NEW.total_xp, NEW.bonus_levels);
  IF v_new_level <> NEW.current_level THEN
    NEW.current_level := v_new_level;
    -- Só dispara notification se subiu (não desce)
    IF v_new_level > COALESCE(OLD.current_level, 1) THEN
      INSERT INTO notifications (user_id, type, title, preview)
      VALUES (
        NEW.user_id,
        'level_up',
        '¡Subiste de nivel! Ahora eres LV ' || v_new_level,
        'Sigue creando, comentando y ganando insignias para subir más.'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_xp_change ON user_xp;
CREATE TRIGGER trg_user_xp_change
  BEFORE UPDATE OF total_xp, bonus_levels ON user_xp
  FOR EACH ROW EXECUTE FUNCTION on_user_xp_change();
