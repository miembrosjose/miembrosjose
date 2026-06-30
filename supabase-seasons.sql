-- ============================================================================
-- Tabela SEASONS — gerenciada pelo painel admin
-- ============================================================================
-- Admin (is_admin=true em profiles) cria, edita e remove temporadas.
-- Qualquer user logado lê (necessário pro carrossel renderizar).

CREATE TABLE IF NOT EXISTS public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  num int NOT NULL UNIQUE,
  name text NOT NULL,
  episodes int NOT NULL DEFAULT 0,
  starter boolean NOT NULL DEFAULT false,
  external boolean NOT NULL DEFAULT false,
  redirect_url text,
  video_bg text,
  gradient text NOT NULL DEFAULT 'linear-gradient(135deg, #14142a 0%, #6D4A9B 100%)',
  emoji text NOT NULL DEFAULT '🎬',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seasons_sort ON public.seasons(sort_order, num);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_seasons_updated_at ON public.seasons;
CREATE TRIGGER trg_seasons_updated_at
  BEFORE UPDATE ON public.seasons
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

-- Qualquer user autenticado lê
DROP POLICY IF EXISTS "authenticated read seasons" ON public.seasons;
CREATE POLICY "authenticated read seasons"
  ON public.seasons FOR SELECT
  TO authenticated
  USING (true);

-- Só admins escrevem (insert/update/delete)
DROP POLICY IF EXISTS "admin insert seasons" ON public.seasons;
CREATE POLICY "admin insert seasons"
  ON public.seasons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin update seasons" ON public.seasons;
CREATE POLICY "admin update seasons"
  ON public.seasons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin delete seasons" ON public.seasons;
CREATE POLICY "admin delete seasons"
  ON public.seasons FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- Seed com as 5 temporadas atuais (vai substituir o array SEASONS estático)
INSERT INTO public.seasons (num, name, episodes, starter, external, video_bg, gradient, emoji, sort_order)
VALUES
  (1, 'Temporada 1', 0, true,  false, NULL, 'linear-gradient(135deg, #14142a 0%, #6D4A9B 100%)', '🎬', 1),
  (2, 'Temporada 2', 0, false, false, NULL, 'linear-gradient(135deg, #050510 0%, #14142a 100%)', '🎞️', 2),
  (3, 'Temporada 3', 0, false, false, NULL, 'linear-gradient(135deg, #14142a 0%, #4A3170 100%)', '📽️', 3),
  (4, 'Temporada 4', 0, false, false, NULL, 'linear-gradient(135deg, #050510 0%, #14142a 100%)', '🎥', 4),
  (5, 'Comunidad',   0, false, true,  NULL, 'linear-gradient(135deg, #050510 0%, #2a2a45 100%)', '💬', 5)
ON CONFLICT (num) DO NOTHING;
