-- Fix: forum_replies não tinha policy de UPDATE no RLS, então edição
-- do próprio reply falhava com "Forbidden or not found".
--
-- Esse script adiciona a policy faltante + garante que as tabelas
-- relevantes estão publicadas no Realtime (pra postgres_changes
-- subscriptions funcionarem).
--
-- Rodar UMA VEZ no Supabase Studio → SQL Editor.

-- ── 1) Policy de UPDATE faltante ──────────────────────────────────────
DROP POLICY IF EXISTS "users update own replies" ON forum_replies;
CREATE POLICY "users update own replies"
  ON forum_replies FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 2) Publicação Realtime — tabelas que precisam de postgres_changes ──
-- Se já estiverem publicadas, ALTER PUBLICATION ADD dá erro (idempotência
-- via DO + EXCEPTION pra não quebrar).
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN
  -- já publicada, ignora
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE forum_posts;
EXCEPTION WHEN duplicate_object THEN
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE forum_replies;
EXCEPTION WHEN duplicate_object THEN
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE episode_comments;
EXCEPTION WHEN duplicate_object THEN
END $$;
