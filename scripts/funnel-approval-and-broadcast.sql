-- ──────────────────────────────────────────────────────────────────────────
-- FUNNEL APPROVAL WORKFLOW + BROADCAST DE NOVO FUNNEL
--
-- Mudanças:
--   1. user_funnels.approved boolean (default false) — admin precisa aprovar
--      antes do funnel virar visível pra comunidade.
--   2. user_funnels.approved_at timestamptz, approved_by uuid
--   3. Trigger BEFORE UPDATE OF approved: quando vira de false → true,
--      broadcast 'public_funnel_new' pra todos os outros users.
--   4. Notification privada pro author quando aprovado.
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE user_funnels ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;
ALTER TABLE user_funnels ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE user_funnels ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_funnels_approved ON user_funnels (approved, created_at DESC);


-- Trigger: quando approved sobe de false → true, dispara notifications
CREATE OR REPLACE FUNCTION on_funnel_approved() RETURNS TRIGGER AS $$
DECLARE
  v_meta jsonb;
  v_name text;
  v_avatar text;
BEGIN
  -- Só dispara quando approved muda de false → true
  IF NEW.approved = true AND COALESCE(OLD.approved, false) = false THEN
    NEW.approved_at := COALESCE(NEW.approved_at, now());

    -- 1) Notif privada pro author: "Tu funnel fue aprobado"
    INSERT INTO notifications (user_id, type, title, preview)
    VALUES (NEW.user_id, 'funnel_approved',
      '¡Tu funnel fue aprobado! 🎬',
      NEW.name || ' ya está visible para la comunidad.');

    -- 2) Broadcast público pra todos os outros users
    SELECT raw_user_meta_data INTO v_meta FROM auth.users WHERE id = NEW.user_id;
    v_name := COALESCE(v_meta->>'full_name', 'Miembro');
    v_avatar := v_meta->>'avatar_url';

    INSERT INTO notifications (user_id, type, source_user_id, source_user_name, source_user_avatar_url, title, preview)
    SELECT u.id, 'public_funnel_new', NEW.user_id, v_name, v_avatar,
      v_name || ' compartió un nuevo funnel ✨',
      NEW.name
    FROM auth.users u WHERE u.id <> NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


DROP TRIGGER IF EXISTS trg_funnel_approved ON user_funnels;
CREATE TRIGGER trg_funnel_approved
  BEFORE UPDATE OF approved ON user_funnels
  FOR EACH ROW EXECUTE FUNCTION on_funnel_approved();


-- Funnels antigos (criados antes desse approval workflow): aprovar todos
-- automaticamente pra não desaparecer da UI da comunidade.
UPDATE user_funnels SET approved = true, approved_at = COALESCE(created_at, now())
  WHERE approved IS NOT TRUE;
