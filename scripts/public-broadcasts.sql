-- ──────────────────────────────────────────────────────────────────────────
-- PUBLIC BROADCASTS — eventos que merecem ser vistos por todos members
--
-- Estratégia:
--  - Triggers SQL inserem notification 'public_*' broadcast (1 row por user)
--  - Frontend filtra por tipo e mostra popup overlay (queue)
--  - Som específico por tipo
--
-- Eventos:
--   public_level_up    — user subiu pra LV >= 10 (qualquer level a partir de 10)
--   public_rank_up     — community rank changed (Recluta → Agente, etc.)
--   public_insignia    — desbloqueou insignia silver/gold/platinum (raras)
--   public_funnel_hot  — funnel atingiu 3+ likes (libera XP + broadcast)
--   public_streak      — completou marco de 30, 90 ou 365 dias
--   public_top3        — entrou no top 3 do ranking de XP (futuro)
-- ──────────────────────────────────────────────────────────────────────────

-- ── 1) Level-up broadcast (LV >= 10 sempre, qualquer level) ────────────────
CREATE OR REPLACE FUNCTION on_user_xp_change()
RETURNS TRIGGER AS $$
DECLARE
  v_new_level int;
  v_meta jsonb;
  v_name text;
  v_avatar text;
BEGIN
  v_new_level := compute_level_from_xp(NEW.total_xp, NEW.bonus_levels);
  IF v_new_level <> NEW.current_level THEN
    NEW.current_level := v_new_level;
    -- Subiu de level
    IF v_new_level > COALESCE(OLD.current_level, 1) THEN
      -- 1) Notification privada (sempre)
      INSERT INTO notifications (user_id, type, title, preview)
      VALUES (NEW.user_id, 'level_up', '¡Subiste de nivel! Ahora eres LV ' || v_new_level,
        'Sigue creando, comentando y ganando insignias para subir más.');

      -- 2) Broadcast público SE level >= 10
      IF v_new_level >= 10 THEN
        SELECT raw_user_meta_data INTO v_meta FROM auth.users WHERE id = NEW.user_id;
        v_name := COALESCE(v_meta->>'full_name', 'Miembro');
        v_avatar := v_meta->>'avatar_url';
        INSERT INTO notifications (user_id, type, source_user_id, source_user_name, source_user_avatar_url, title, preview)
        SELECT u.id, 'public_level_up', NEW.user_id, v_name, v_avatar,
          v_name || ' subió a LV ' || v_new_level || ' 🚀',
          '¡Felicítalo en la comunidad!'
        FROM auth.users u WHERE u.id <> NEW.user_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 2) Funnel HOT broadcast (atinge 3+ likes — libera XP + broadcast) ──────
CREATE OR REPLACE FUNCTION on_funnel_likes_threshold() RETURNS TRIGGER AS $$
DECLARE v_meta jsonb; v_name text; v_avatar text;
BEGIN
  IF NEW.likes_count >= 3 AND NEW.xp_released = false THEN
    PERFORM apply_xp_delta(NEW.user_id, 'funnel_created', 150, 0, 'user_funnels', NEW.id::text);
    NEW.xp_released := true;

    -- Notification privada pro author
    INSERT INTO notifications (user_id, type, title, preview)
    VALUES (NEW.user_id, 'funnel_xp_released', '¡Tu funnel ganó XP!',
      'Recibió 3+ likes y desbloqueó +150 XP. Sigue compartiendo.');

    -- Broadcast público pra todos (funnel HOT)
    SELECT raw_user_meta_data INTO v_meta FROM auth.users WHERE id = NEW.user_id;
    v_name := COALESCE(v_meta->>'full_name', 'Miembro');
    v_avatar := v_meta->>'avatar_url';
    INSERT INTO notifications (user_id, type, source_user_id, source_user_name, source_user_avatar_url, title, preview)
    SELECT u.id, 'public_funnel_hot', NEW.user_id, v_name, v_avatar,
      'Funnel HOT 🔥 ' || NEW.name,
      v_name || ' compartió un funnel que está pegando.'
    FROM auth.users u WHERE u.id <> NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 3) Helper: broadcast genérico (chamado por APIs server-side) ───────────
-- Pra insignia raras + streak milestone + rank up: vamos chamar de Node em vez
-- de trigger SQL (tem mais contexto sobre tier/category).
-- Esse helper já existe via INSERT direto, então só precisa do trigger acima.
