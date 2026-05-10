-- ──────────────────────────────────────────────────────────────────────────
-- Ajustes de valores de XP + likes "dados" em todas categorias
--
-- Mudanças:
--   funnel_created: 30 → 500
--   funnel_like_received: 10 → 5 (alinha com regra "qualquer like recebido = 5")
--   user_followed: 5 → 10
--
-- Novos: dar like em qualquer lugar = +1 XP
--   forum_reply_like (dado): +1
--   episode_comment_like (dado): +1
--   funnel_reaction_like (dado): +1
-- ──────────────────────────────────────────────────────────────────────────

-- Funnel created: 500 XP
CREATE OR REPLACE FUNCTION on_xp_funnel_created() RETURNS TRIGGER AS $$
BEGIN
  PERFORM apply_xp_delta(NEW.user_id, 'funnel_created', 500, 0, 'user_funnels', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funnel like recebido: 5 XP (era 10)
CREATE OR REPLACE FUNCTION on_xp_funnel_reaction() RETURNS TRIGGER AS $$
DECLARE v_owner uuid;
BEGIN
  IF NEW.vote <> 'like' THEN RETURN NEW; END IF;
  SELECT user_id INTO v_owner FROM user_funnels WHERE id = NEW.funnel_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    PERFORM apply_xp_delta(v_owner, 'funnel_like_received', 5, 0, 'funnel_reactions', NEW.funnel_id::text);
  END IF;
  -- Quem deu like também ganha +1
  IF NEW.vote = 'like' THEN
    PERFORM apply_xp_delta(NEW.user_id, 'funnel_like_given', 1, 0, 'funnel_reactions', NEW.funnel_id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ser seguido: 10 XP (era 5)
CREATE OR REPLACE FUNCTION on_xp_user_followed() RETURNS TRIGGER AS $$
DECLARE v_meta jsonb; v_name text; v_avatar text;
BEGIN
  PERFORM apply_xp_delta(NEW.followed_id, 'user_followed', 10, 0, 'user_follows', NEW.follower_id::text);
  SELECT raw_user_meta_data INTO v_meta FROM auth.users WHERE id = NEW.follower_id;
  v_name := COALESCE(v_meta->>'full_name', 'Miembro');
  v_avatar := v_meta->>'avatar_url';
  INSERT INTO notifications (user_id, type, source_user_id, source_user_name, source_user_avatar_url, title, preview)
  VALUES (NEW.followed_id, 'user_followed', NEW.follower_id, v_name, v_avatar, v_name || ' empezó a seguirte', 'Activó las notificaciones de tus publicaciones.');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Forum reply like: ja dá 5 pro author. Agora também +1 pra quem deu like.
CREATE OR REPLACE FUNCTION on_xp_forum_reply_like() RETURNS TRIGGER AS $$
DECLARE v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM forum_replies WHERE id = NEW.reply_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    PERFORM apply_xp_delta(v_owner, 'forum_reply_like_received', 5, 0, 'forum_reply_likes', NEW.reply_id::text);
  END IF;
  -- +1 pra quem deu o like
  PERFORM apply_xp_delta(NEW.user_id, 'forum_reply_like_given', 1, 0, 'forum_reply_likes', NEW.reply_id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Episode comment reaction: +5 pro author no like + 1 pra quem deu
CREATE OR REPLACE FUNCTION on_xp_ec_reaction() RETURNS TRIGGER AS $$
DECLARE v_owner uuid;
BEGIN
  IF NEW.vote <> 'like' THEN RETURN NEW; END IF;
  SELECT user_id INTO v_owner FROM episode_comments WHERE id = NEW.comment_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    PERFORM apply_xp_delta(v_owner, 'episode_comment_like_received', 5, 0, 'episode_comment_reactions', NEW.comment_id::text);
  END IF;
  -- +1 pra quem deu o like
  PERFORM apply_xp_delta(NEW.user_id, 'episode_comment_like_given', 1, 0, 'episode_comment_reactions', NEW.comment_id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Standardização: comentar/responder em QUALQUER LUGAR = +10 XP ───────────
-- forum_reply: 20 → 10
CREATE OR REPLACE FUNCTION on_xp_forum_reply() RETURNS TRIGGER AS $$
BEGIN
  PERFORM apply_xp_delta(NEW.user_id, 'forum_reply', 10, 0, 'forum_replies', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- funnel_feedback (dar feedback): 15 → 10
-- Mantém o +5 pro author do funnel (já está ok)
CREATE OR REPLACE FUNCTION on_xp_funnel_feedback() RETURNS TRIGGER AS $$
DECLARE v_owner uuid;
BEGIN
  PERFORM apply_xp_delta(NEW.user_id, 'funnel_feedback_given', 10, 0, 'funnel_feedbacks', NEW.id::text);
  SELECT user_id INTO v_owner FROM user_funnels WHERE id = NEW.funnel_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    PERFORM apply_xp_delta(v_owner, 'funnel_feedback_received', 5, 0, 'funnel_feedbacks', NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- episode_comment continua +10 (já estava certo)
