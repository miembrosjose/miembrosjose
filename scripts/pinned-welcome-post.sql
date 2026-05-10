-- ──────────────────────────────────────────────────────────────────────────
-- Posts FIXADOS na comunidade (Bem-vindo + Bono por experiência)
-- Autor: adm@SEU_DOMINIO.com
--
-- 1. Adiciona colunas `pinned` + `pin_order` em forum_posts
-- 2. Index pra ordenação eficiente
-- 3. Insere 2 posts fixados (pin_order 1 = Bienvenido, pin_order 2 = Bono)
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


-- POST #1 — BIENVENIDO (pin_order = 1)
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
    RAISE NOTICE 'User adm@SEU_DOMINIO.com no encontrado — saltando post BIENVENIDO';
    RETURN;
  END IF;

  v_full_name := COALESCE(v_meta->>'full_name', '[BRAND_NAME]');
  v_avatar := v_meta->>'avatar_url';

  SELECT id INTO v_existing_id
    FROM forum_posts
    WHERE pinned = true AND title = '¡BIENVENIDO! 🎬 [EMPEZÁ ACÁ]'
    LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Garante pin_order correto se já existe
    UPDATE forum_posts SET pin_order = 1 WHERE id = v_existing_id;
    RAISE NOTICE 'Post BIENVENIDO ya existe (id=%), actualizado pin_order=1', v_existing_id;
  ELSE
    INSERT INTO forum_posts (
      user_id, author_name, author_username, author_avatar_url,
      author_badge_id, author_is_admin,
      title, body, tags, pinned, pin_order
    )
    VALUES (
      v_user_id, v_full_name, 'copyfilms', v_avatar,
      'admin_seal', true,
      '¡BIENVENIDO! 🎬 [EMPEZÁ ACÁ]',
      E'¡Sea muy bienvenido(a) a la Comunidad Copy Film''s!\n\n¡Felicitaciones por tu decisión de entrar! Ahora vamos a poner manos a la obra y hacer que pase. 🔥\n\nPara empezar, vamos a conocernos y conectar mejor.\n\nDale un ❤️ a este post y escribí abajo en los comentarios:\n\n1) Tu nombre y de qué país sos\n2) Una breve descripción de tu negocio — qué hacés y qué vendés\n3) Cuáles son tus mayores especialidades/habilidades\n4) ¿Cuáles son tus mayores desafíos hoy?',
      ARRAY['NOVEDADES', 'ANUNCIOS', 'COMUNIDAD'],
      true, 1
    );
    RAISE NOTICE 'Post BIENVENIDO creado';
  END IF;
END$$;


-- POST #2 — BONO POR EXPERIENCIA (pin_order = 2)
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
    RAISE NOTICE 'User adm@SEU_DOMINIO.com no encontrado — saltando post BONO';
    RETURN;
  END IF;

  v_full_name := COALESCE(v_meta->>'full_name', '[BRAND_NAME]');
  v_avatar := v_meta->>'avatar_url';

  SELECT id INTO v_existing_id
    FROM forum_posts
    WHERE pinned = true AND pin_order = 2
    LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE forum_posts SET pin_order = 2 WHERE id = v_existing_id;
    RAISE NOTICE 'Post BONO ya existe (id=%), actualizado pin_order=2', v_existing_id;
  ELSE
    INSERT INTO forum_posts (
      user_id, author_name, author_username, author_avatar_url,
      author_badge_id, author_is_admin,
      title, body, tags, pinned, pin_order
    )
    VALUES (
      v_user_id, v_full_name, 'copyfilms', v_avatar,
      'admin_seal', true,
      'Tu experiencia en el Entrenamiento vale un bono 🎁',
      E'Describí cómo está siendo tu experiencia acá en la Mentoría y desbloqueá un contenido bono (PACK CON 30 GANCHOS NEURONALES PARA CREATIVOS).\n\nCómo desbloquear el bono:\n\n1) Respondé este post contando cómo está siendo tu experiencia, qué te está pareciendo la Comunidad, cómo te está yendo implementar los métodos y estrategias, resultados obtenidos, etc.\n2) Tu bono será liberado en tu área de miembros en hasta 24h después de tu posteo.\n\n📌 Importante — leelo antes de responder:\n\nObs: si recién entraste a la Comunidad y todavía no tuviste oportunidad de aprender e implementar el contenido, NO comentes ''acabo de entrar y aún no vi nada'' solamente para ganar el bono. Primero, estudiá al menos el 50% del contenido como mínimo, interactuá con los demás miembros acá en la plataforma y en el grupo de WhatsApp. Sólo así vas a tener vivencia suficiente en el entrenamiento para compartir tu experiencia.\n\nLa idea no es dar el bono gratis — es recompensar a quien realmente está construyendo. 🚀',
      ARRAY['NOVEDADES', 'ANUNCIOS', 'BONO'],
      true, 2
    );
    RAISE NOTICE 'Post BONO creado';
  END IF;
END$$;
