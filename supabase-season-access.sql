-- ============================================================================
-- Acesso a temporadas (bloqueado/liberado) + controle por user
-- ============================================================================

-- ─── 1. Colunas extras em seasons ─────────────────────────────────────
ALTER TABLE public.seasons
  ADD COLUMN IF NOT EXISTS is_locked    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checkout_url text;

-- ─── 2. Tabela user_season_access ────────────────────────────────────
-- Liga user → temporadas que ele tem acesso. Admin libera via painel ou
-- via integração futura (webhook de compra, etc).
CREATE TABLE IF NOT EXISTS public.user_season_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id  uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note       text,
  UNIQUE (user_id, season_id)
);

CREATE INDEX IF NOT EXISTS idx_user_season_access_user
  ON public.user_season_access (user_id);
CREATE INDEX IF NOT EXISTS idx_user_season_access_season
  ON public.user_season_access (season_id);

ALTER TABLE public.user_season_access ENABLE ROW LEVEL SECURITY;

-- User vê os próprios acessos
DROP POLICY IF EXISTS "user reads own access" ON public.user_season_access;
CREATE POLICY "user reads own access"
  ON public.user_season_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin vê tudo
DROP POLICY IF EXISTS "admin reads all access" ON public.user_season_access;
CREATE POLICY "admin reads all access"
  ON public.user_season_access FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Só admin grants/revokes
DROP POLICY IF EXISTS "admin manages access" ON public.user_season_access;
CREATE POLICY "admin manages access"
  ON public.user_season_access FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
