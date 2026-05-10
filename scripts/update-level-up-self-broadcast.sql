-- Atualiza o trigger on_user_xp_change pra também inserir notif "self"
-- pro recipient quando ele sobe pra LV >= 10. Assim:
--   - Recipient: notif persistente no sino, popup no próximo login se offline
--   - Outros: broadcast só em tempo real (filtrado por idade no /api/notifications)
--
-- LV < 10 continua só com 'level_up' privado (sem popup, evita spam de
-- popups de levels iniciais que sobem rápido).
--
-- ⚠️ RODAR NO SUPABASE SQL EDITOR

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
      -- 1) Notification privada simples (sempre, qualquer level)
      INSERT INTO notifications (user_id, type, title, preview)
      VALUES (NEW.user_id, 'level_up', '¡Subiste de nivel! Ahora eres LV ' || v_new_level,
        'Sigue creando, comentando y ganando insignias para subir más.');

      -- 2) LV >= 10: broadcast popup pessoal pro recipient + FOMO pros outros
      IF v_new_level >= 10 THEN
        SELECT raw_user_meta_data INTO v_meta FROM auth.users WHERE id = NEW.user_id;
        v_name := COALESCE(v_meta->>'full_name', 'Miembro');
        v_avatar := v_meta->>'avatar_url';

        -- 2a) Notif pessoal pro recipient (type _self bypassa fresh window)
        INSERT INTO notifications (user_id, type, source_user_id, source_user_name, source_user_avatar_url, title, preview)
        VALUES (NEW.user_id, 'public_level_up_self', NEW.user_id, v_name, v_avatar,
          '¡Subiste a LV ' || v_new_level || '! 🚀',
          'Sigue creando, comentando y ganando insignias para subir más.');

        -- 2b) Broadcast FOMO pros outros (filtrado por 5min em /api/notifications)
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

-- Verifica que o trigger continua attached (não foi removido)
SELECT tgname, tgenabled FROM pg_trigger
WHERE tgname LIKE '%xp%' AND tgrelid = 'user_xp'::regclass;
