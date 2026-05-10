-- ──────────────────────────────────────────────────────────────────────────
-- TOP 3 RANKING REALTIME BROADCAST
--
-- Detecta quando alguém entra no TOP 3 do ranking de XP e broadcast pra todos
-- os outros members. Throttle: cooldown 24h por user (anti-spam: pessoa não
-- pode disparar broadcast mais de 1x/dia mesmo se ficar revezando posição).
--
-- Como funciona:
--   1. Snapshot do top 3 atual fica em leaderboard_top3_snapshot (3 rows fixas)
--   2. Quando user_xp.total_xp ou current_level muda, recomputa top 3
--   3. Compara com snapshot — se alguém NOVO entrou no top 3 (não estava antes),
--      gera broadcast 'public_top3' pra todos os outros users.
--   4. Atualiza snapshot.
--
-- Cooldown: leaderboard_top3_broadcasts armazena last_broadcast_at por user.
-- Se < 24h, ignora (não rebroadcasta a mesma pessoa subindo/descendo).
-- ──────────────────────────────────────────────────────────────────────────

-- Snapshot do top 3 atual (3 rows fixas, position 1/2/3)
CREATE TABLE IF NOT EXISTS leaderboard_top3_snapshot (
  position int PRIMARY KEY CHECK (position BETWEEN 1 AND 3),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total_xp int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Inicializa as 3 posições vazias se ainda não existirem
INSERT INTO leaderboard_top3_snapshot (position, user_id, total_xp)
VALUES (1, NULL, 0), (2, NULL, 0), (3, NULL, 0)
ON CONFLICT (position) DO NOTHING;


-- Cooldown por user (anti-spam)
CREATE TABLE IF NOT EXISTS leaderboard_top3_broadcasts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_broadcast_at timestamptz NOT NULL DEFAULT now()
);


-- Função: recomputa top 3 e detecta entradas novas
CREATE OR REPLACE FUNCTION on_user_xp_top3_check() RETURNS TRIGGER AS $$
DECLARE
  v_old_top3 uuid[];
  v_new_top3 uuid[];
  v_new_user_id uuid;
  v_new_position int;
  v_meta jsonb;
  v_name text;
  v_avatar text;
  v_last_broadcast timestamptz;
  v_can_broadcast boolean;
BEGIN
  -- Pega o top 3 atual (snapshot)
  SELECT array_agg(user_id ORDER BY position)
    INTO v_old_top3
    FROM leaderboard_top3_snapshot;

  -- Calcula o novo top 3 baseado em user_xp
  SELECT array_agg(user_id ORDER BY rn)
    INTO v_new_top3
    FROM (
      SELECT user_id, ROW_NUMBER() OVER (ORDER BY current_level DESC, total_xp DESC) AS rn
      FROM user_xp
      ORDER BY current_level DESC, total_xp DESC
      LIMIT 3
    ) t;

  -- Se não mudou, sai
  IF v_new_top3 IS NOT DISTINCT FROM v_old_top3 THEN
    RETURN NEW;
  END IF;

  -- Detecta entradas novas (alguém que NÃO estava no top 3 antes)
  FOR v_new_position IN 1..LEAST(COALESCE(array_length(v_new_top3, 1), 0), 3) LOOP
    v_new_user_id := v_new_top3[v_new_position];
    IF v_new_user_id IS NULL THEN CONTINUE; END IF;
    -- Já estava no top 3? Ignora (só broadcasta entrada nova)
    IF v_old_top3 IS NOT NULL AND v_new_user_id = ANY(v_old_top3) THEN CONTINUE; END IF;

    -- Cooldown: já fez broadcast nas últimas 24h?
    SELECT last_broadcast_at INTO v_last_broadcast
      FROM leaderboard_top3_broadcasts WHERE user_id = v_new_user_id;
    v_can_broadcast := (v_last_broadcast IS NULL) OR (v_last_broadcast < now() - interval '24 hours');

    IF v_can_broadcast THEN
      -- Pega metadata do user pra avatar/nome
      SELECT raw_user_meta_data INTO v_meta FROM auth.users WHERE id = v_new_user_id;
      v_name := COALESCE(v_meta->>'full_name', 'Miembro');
      v_avatar := v_meta->>'avatar_url';

      -- Broadcast pra todos os outros users
      INSERT INTO notifications (user_id, type, source_user_id, source_user_name, source_user_avatar_url, title, preview)
      SELECT u.id, 'public_top3', v_new_user_id, v_name, v_avatar,
        v_name || ' entró al TOP ' || v_new_position || ' del ranking 👑',
        'El ranking de XP se mueve. ¡Sube de nivel y compite!'
      FROM auth.users u WHERE u.id <> v_new_user_id;

      -- Atualiza cooldown
      INSERT INTO leaderboard_top3_broadcasts (user_id, last_broadcast_at)
      VALUES (v_new_user_id, now())
      ON CONFLICT (user_id) DO UPDATE SET last_broadcast_at = now();
    END IF;
  END LOOP;

  -- Atualiza snapshot com o novo top 3
  FOR v_new_position IN 1..3 LOOP
    UPDATE leaderboard_top3_snapshot
      SET user_id = v_new_top3[v_new_position],
          total_xp = COALESCE((SELECT total_xp FROM user_xp WHERE user_id = v_new_top3[v_new_position]), 0),
          updated_at = now()
      WHERE position = v_new_position;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


DROP TRIGGER IF EXISTS trg_user_xp_top3_check ON user_xp;
CREATE TRIGGER trg_user_xp_top3_check
  AFTER UPDATE OF total_xp, current_level ON user_xp
  FOR EACH ROW EXECUTE FUNCTION on_user_xp_top3_check();


-- Bootstrap: popula o snapshot com o top 3 atual (executa 1x ao rodar)
DO $$
DECLARE
  v_user_id uuid;
  v_total_xp int;
  v_position int := 1;
  v_rec record;
BEGIN
  FOR v_rec IN
    SELECT user_id, total_xp FROM user_xp
    ORDER BY current_level DESC, total_xp DESC
    LIMIT 3
  LOOP
    UPDATE leaderboard_top3_snapshot
      SET user_id = v_rec.user_id, total_xp = v_rec.total_xp, updated_at = now()
      WHERE position = v_position;
    v_position := v_position + 1;
  END LOOP;
END$$;
