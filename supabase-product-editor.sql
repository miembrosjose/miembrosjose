-- ============================================================================
-- Editor interno do produto: MÓDULOS + blocos por módulo
-- ============================================================================
-- Hierarquia: Producto → Módulos → (video + blocos de texto).
-- Espelha exatamente Temporada → Episodio → blocos.
--
-- Substitui a estrutura anterior (product_blocks direto no produto).

-- Remove tabela anterior se existir (era product_blocks com product_id direto)
DROP TABLE IF EXISTS public.product_blocks CASCADE;

-- Tabela principal: módulos do produto
CREATE TABLE IF NOT EXISTS public.product_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  num int NOT NULL,
  title text NOT NULL,
  description text,
  video_url text,
  thumb_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, num)
);

CREATE INDEX IF NOT EXISTS idx_product_modules_product
  ON public.product_modules(product_id, sort_order, num);

DROP TRIGGER IF EXISTS trg_product_modules_updated_at ON public.product_modules;
CREATE TRIGGER trg_product_modules_updated_at
  BEFORE UPDATE ON public.product_modules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.product_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read product_modules" ON public.product_modules;
CREATE POLICY "authenticated read product_modules"
  ON public.product_modules FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin insert product_modules" ON public.product_modules;
CREATE POLICY "admin insert product_modules"
  ON public.product_modules FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "admin update product_modules" ON public.product_modules;
CREATE POLICY "admin update product_modules"
  ON public.product_modules FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "admin delete product_modules" ON public.product_modules;
CREATE POLICY "admin delete product_modules"
  ON public.product_modules FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Blocos de texto livres de cada módulo
CREATE TABLE IF NOT EXISTS public.product_module_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.product_modules(id) ON DELETE CASCADE,
  position text NOT NULL CHECK (position IN ('above_video', 'below_video')),
  sort_order int NOT NULL DEFAULT 0,
  content text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'text',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_module_blocks_module
  ON public.product_module_blocks(module_id, position, sort_order);

DROP TRIGGER IF EXISTS trg_module_blocks_updated_at ON public.product_module_blocks;
CREATE TRIGGER trg_module_blocks_updated_at
  BEFORE UPDATE ON public.product_module_blocks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.product_module_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read module_blocks" ON public.product_module_blocks;
CREATE POLICY "authenticated read module_blocks"
  ON public.product_module_blocks FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin insert module_blocks" ON public.product_module_blocks;
CREATE POLICY "admin insert module_blocks"
  ON public.product_module_blocks FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "admin update module_blocks" ON public.product_module_blocks;
CREATE POLICY "admin update module_blocks"
  ON public.product_module_blocks FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "admin delete module_blocks" ON public.product_module_blocks;
CREATE POLICY "admin delete module_blocks"
  ON public.product_module_blocks FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Mantém colunas thumb_url e video_url em products pra retro-compatibilidade,
-- mas o uso real do video agora é dentro de cada módulo.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS thumb_url text,
  ADD COLUMN IF NOT EXISTS video_url text;
