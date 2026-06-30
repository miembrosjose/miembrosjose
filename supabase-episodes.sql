-- ============================================================================
-- Episodios + blocos de texto editáveis (admin)
-- ============================================================================
-- Cada temporada tem N episodios.
-- Cada episodio tem 1 vídeo (URL) + N blocos de texto livres com posição
-- (above_video ou below_video) e ordem dentro daquela posição.
-- Admin gerencia tudo via /miembros painel. Membros só leem.

-- ─── Tabela episodes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  num int NOT NULL,
  title text NOT NULL,
  description text,
  video_url text,
  thumb_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_id, num)
);

CREATE INDEX IF NOT EXISTS idx_episodes_season ON public.episodes(season_id, sort_order, num);

DROP TRIGGER IF EXISTS trg_episodes_updated_at ON public.episodes;
CREATE TRIGGER trg_episodes_updated_at
  BEFORE UPDATE ON public.episodes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read episodes" ON public.episodes;
CREATE POLICY "authenticated read episodes"
  ON public.episodes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin insert episodes" ON public.episodes;
CREATE POLICY "admin insert episodes"
  ON public.episodes FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "admin update episodes" ON public.episodes;
CREATE POLICY "admin update episodes"
  ON public.episodes FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "admin delete episodes" ON public.episodes;
CREATE POLICY "admin delete episodes"
  ON public.episodes FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ─── Tabela episode_blocks ────────────────────────────────────────────
-- Cada block é um "card de texto" posicionado dentro do episode.
-- position: 'above_video' (antes do player) ou 'below_video' (depois).
-- sort_order define ordem DENTRO da posição (não global).

CREATE TABLE IF NOT EXISTS public.episode_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id uuid NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  position text NOT NULL CHECK (position IN ('above_video', 'below_video')),
  sort_order int NOT NULL DEFAULT 0,
  -- content: HTML/markdown livre (renderizado como texto com formatação simples)
  content text NOT NULL DEFAULT '',
  -- tipo opcional pra futuras extensões (heading, list, callout, etc).
  -- Por enquanto só 'text'.
  kind text NOT NULL DEFAULT 'text',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocks_episode ON public.episode_blocks(episode_id, position, sort_order);

DROP TRIGGER IF EXISTS trg_blocks_updated_at ON public.episode_blocks;
CREATE TRIGGER trg_blocks_updated_at
  BEFORE UPDATE ON public.episode_blocks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.episode_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read blocks" ON public.episode_blocks;
CREATE POLICY "authenticated read blocks"
  ON public.episode_blocks FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin insert blocks" ON public.episode_blocks;
CREATE POLICY "admin insert blocks"
  ON public.episode_blocks FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "admin update blocks" ON public.episode_blocks;
CREATE POLICY "admin update blocks"
  ON public.episode_blocks FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "admin delete blocks" ON public.episode_blocks;
CREATE POLICY "admin delete blocks"
  ON public.episode_blocks FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
