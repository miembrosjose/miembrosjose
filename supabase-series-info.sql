-- ============================================================================
-- series_info — metadados editáveis da série (single-row pattern)
-- ============================================================================
-- Mantém UMA row apenas. Admin edita via painel.

CREATE TABLE IF NOT EXISTS public.series_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL DEFAULT 'El método para crear embudos gamificados que convierten.',
  cast_text   text NOT NULL DEFAULT 'Los 144000',
  genres      text NOT NULL DEFAULT 'Informativa, Estratégica',
  kind        text NOT NULL DEFAULT 'Informativa, Estratégica',
  year        int  NOT NULL DEFAULT 2026,
  rating      text NOT NULL DEFAULT '+18',
  quality     text NOT NULL DEFAULT 'HD',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_series_info_updated_at ON public.series_info;
CREATE TRIGGER trg_series_info_updated_at
  BEFORE UPDATE ON public.series_info
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.series_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read series_info" ON public.series_info;
CREATE POLICY "authenticated read series_info"
  ON public.series_info FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin update series_info" ON public.series_info;
CREATE POLICY "admin update series_info"
  ON public.series_info FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Seed: garante 1 row existente
INSERT INTO public.series_info (description, cast_text, genres, kind)
SELECT
  'El método para crear embudos gamificados que convierten. Domina los Agentes GPTs, construye tu estructura con producción de contenido audiovisual cinematográfico y entra en la comunidad VIP.',
  'Los 144000',
  'Marketing Digital, Embudos Cinematográficos, Gamificación',
  'Informativa, Estratégica'
WHERE NOT EXISTS (SELECT 1 FROM public.series_info);
