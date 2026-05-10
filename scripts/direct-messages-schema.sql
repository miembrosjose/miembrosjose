-- Direct Messages — chat privado entre miembros.
-- Texto + imagem + áudio. Realtime via postgres_changes.
-- Bloqueio individual + admin pode ler tudo via service_role (bypassa RLS).

-- ─────────────────────────────────────────────────────────────────────────
-- TABELAS
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text,
  media_url text,
  media_type text CHECK (media_type IN ('image', 'audio')),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  edited_at timestamptz,
  deleted_at timestamptz,
  CHECK (sender_id <> recipient_id),
  CHECK (body IS NULL OR (char_length(body) > 0 AND char_length(body) <= 2000)),
  CHECK (
    (body IS NOT NULL AND char_length(body) > 0)
    OR (media_url IS NOT NULL AND media_type IS NOT NULL)
  )
);

-- Bloqueios individuais. Bloqueia A→B = A não recebe mensagens de B,
-- B não consegue enviar pra A. B pode até tentar mas backend rejeita.
CREATE TABLE IF NOT EXISTS direct_message_blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────

-- Unread badge (recipient queries, otimizado pra count rápido)
CREATE INDEX IF NOT EXISTS idx_dm_recipient_unread
  ON direct_messages(recipient_id)
  WHERE read_at IS NULL AND deleted_at IS NULL;

-- Lista de mensagens por sender (timeline)
CREATE INDEX IF NOT EXISTS idx_dm_sender_created
  ON direct_messages(sender_id, created_at DESC);

-- Lista de mensagens por recipient
CREATE INDEX IF NOT EXISTS idx_dm_recipient_created
  ON direct_messages(recipient_id, created_at DESC);

-- Threads pair lookup (LEAST/GREATEST normaliza ordem dos ids)
CREATE INDEX IF NOT EXISTS idx_dm_thread_pair
  ON direct_messages(LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_message_blocks ENABLE ROW LEVEL SECURITY;

-- Mensagens: sender e recipient leem. Admin lê tudo via service_role (bypassa RLS).
DROP POLICY IF EXISTS "dm_select_own" ON direct_messages;
CREATE POLICY "dm_select_own" ON direct_messages
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "dm_insert_own" ON direct_messages;
CREATE POLICY "dm_insert_own" ON direct_messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "dm_update_own" ON direct_messages;
CREATE POLICY "dm_update_own" ON direct_messages
  FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Recipient pode marcar como lida (UPDATE read_at). Sender pode editar/deletar próprias.
-- Granularidade fina via app — RLS deixa ambos atualizarem porque postgres não distingue
-- qual coluna foi setada na update sem trigger. Trigger desnecessário pra MVP.

-- Bloqueios: cada user gerencia os próprios.
DROP POLICY IF EXISTS "dmb_select_own" ON direct_message_blocks;
CREATE POLICY "dmb_select_own" ON direct_message_blocks
  FOR SELECT
  USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "dmb_insert_own" ON direct_message_blocks;
CREATE POLICY "dmb_insert_own" ON direct_message_blocks
  FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "dmb_delete_own" ON direct_message_blocks;
CREATE POLICY "dmb_delete_own" ON direct_message_blocks
  FOR DELETE
  USING (auth.uid() = blocker_id);

-- ─────────────────────────────────────────────────────────────────────────
-- REALTIME
-- ─────────────────────────────────────────────────────────────────────────

-- Habilita postgres_changes na tabela direct_messages.
-- Cliente assina WHERE recipient_id = auth.uid() pra receber novas msgs em tempo real.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'direct_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
  END IF;
END $$;
