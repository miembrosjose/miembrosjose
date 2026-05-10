-- ──────────────────────────────────────────────────────────────────────────
-- Posts FIXADOS na comunidade (Bienvenida + Bono opcional)
-- Autor: usuario admin (email definido em adm@SEU_DOMINIO.com)
--
-- 1. Adiciona colunas `pinned` + `pin_order` em forum_posts
-- 2. Index pra ordenação eficiente
-- 3. Insere posts fixados como placeholders — cliente edita pelo painel admin
--
-- Ordem final no fórum: pinned DESC, pin_order ASC, created_at DESC
--   → posts pinned aparecem primeiro
--   → entre pinned: pin_order menor = mais em cima
--   → não-pinned: ordenados por created_at desc
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS pin_order int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_forum_posts_pinned_order
  ON forum_posts (pinned DESC, pin_order ASC, created_at DESC);


-- POST #1 — BIENVENIDA (pin_order = 1) — placeholder, edite no painel admin
DO $$
DECLARE
  v_user_id uuid;
  v_meta jsonb;
  v_full_name text;
  v_avatar text;
  v_existing_id uuid;
BEGIN
  SELECT id, raw_user_meta_data INTO v_user_id, v_meta
    FROM auth.users WHERE email = 'adm@SEU_DOMINIO.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User adm@SEU_DOMINIO.com no encontrado — saltando post BIENVENIDA';
    RETURN;
  END IF;

  v_full_name := COALESCE(v_meta->>'full_name', 'Admin');
  v_avatar := v_meta->>'avatar_url';

  SELECT id INTO v_existing_id
    FROM forum_posts
    WHERE pinned = true AND pin_order = 1
    LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE forum_posts SET pin_order = 1 WHERE id = v_existing_id;
    RAISE NOTICE 'Post BIENVENIDA ya existe (id=%), actualizado pin_order=1', v_existing_id;
  ELSE
    INSERT INTO forum_posts (
      user_id, author_name, author_username, author_avatar_url,
      author_badge_id, author_is_admin,
      title, body, tags, pinned, pin_order
    )
    VALUES (
      v_user_id, v_full_name, 'admin', v_avatar,
      'admin_seal', true,
      'Bienvenida — edita este post en el panel admin',
      E'Este es un post de bienvenida placeholder. Edítalo en el panel de administración para personalizar el contenido.',
      ARRAY['BIENVENIDA'],
      true, 1
    );
    RAISE NOTICE 'Post BIENVENIDA placeholder creado';
  END IF;
END$$;
