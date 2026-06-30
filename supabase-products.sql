-- ============================================================================
-- Tabela PRODUCTS — Tienda Premium (admin gerencia)
-- ============================================================================
-- Estrutura igual seasons, mas cada row é um produto individual.
-- Sem episódios. Pode ter mídia (img/vídeo) + descrição + bloqueio + checkout.

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  num int NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  media_url text,
  gradient text NOT NULL DEFAULT 'linear-gradient(135deg, #14142a 0%, #6D4A9B 100%)',
  emoji text NOT NULL DEFAULT '🎁',
  sort_order int NOT NULL DEFAULT 0,
  is_locked boolean NOT NULL DEFAULT true,
  checkout_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_sort ON public.products(sort_order, num);

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read products" ON public.products;
CREATE POLICY "authenticated read products"
  ON public.products FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin insert products" ON public.products;
CREATE POLICY "admin insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "admin update products" ON public.products;
CREATE POLICY "admin update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "admin delete products" ON public.products;
CREATE POLICY "admin delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ─── user_product_access ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_product_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_user_product_access_user ON public.user_product_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_product_access_product ON public.user_product_access(product_id);

ALTER TABLE public.user_product_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user reads own product access" ON public.user_product_access;
CREATE POLICY "user reads own product access"
  ON public.user_product_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admin reads all product access" ON public.user_product_access;
CREATE POLICY "admin reads all product access"
  ON public.user_product_access FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "admin manages product access" ON public.user_product_access;
CREATE POLICY "admin manages product access"
  ON public.user_product_access FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
