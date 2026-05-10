-- ──────────────────────────────────────────────────────────────────────────
-- episode_comments: comentários por episódio na area de membros.
--
-- Cada miembro autenticado pode comentar abaixo de um episódio. Todos veem
-- todos os comentários (público dentro da area de membros — só usuários
-- logados podem ler/escrever).
--
-- Identificação do episódio: chave composta (season_num, episode_num).
-- Não usamos FK pra episódios (não temos tabela episodes — eles são fixos
-- no HTML do prototipo). Se algum dia migrar pra Supabase, criar tabela
-- episodes + FK aqui.
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS episode_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_num INT NOT NULL,
  episode_num INT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,                  -- iniciais OU URL de avatar
  text TEXT NOT NULL CHECK (length(text) > 0 AND length(text) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Índices: query mais comum é "comentários de S{n}E{n} ordenados por created_at desc"
CREATE INDEX IF NOT EXISTS idx_episode_comments_season_ep
  ON episode_comments (season_num, episode_num, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_episode_comments_user
  ON episode_comments (user_id);

-- RLS habilitado
ALTER TABLE episode_comments ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer user autenticado pode ler todos os comentários.
-- (Area de membros já é gated — só miembros logados acessam o app.)
CREATE POLICY "authenticated users can read all comments"
  ON episode_comments FOR SELECT
  TO authenticated
  USING (true);

-- Insert: user só pode inserir comentário com seu próprio user_id.
-- (Previne spoofing de autoria.)
CREATE POLICY "users can insert their own comments"
  ON episode_comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Update: user só edita seus próprios comentários (futuro — não usado ainda).
CREATE POLICY "users can update their own comments"
  ON episode_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Delete: user só deleta seus próprios comentários.
CREATE POLICY "users can delete their own comments"
  ON episode_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger: atualiza updated_at em cada UPDATE
CREATE OR REPLACE FUNCTION set_episode_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_episode_comment_updated_at ON episode_comments;
CREATE TRIGGER trg_episode_comment_updated_at
  BEFORE UPDATE ON episode_comments
  FOR EACH ROW
  EXECUTE FUNCTION set_episode_comment_updated_at();
