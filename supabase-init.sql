-- ============================================================================
-- SUPABASE INIT — Los 144000 (MÍNIMO PRA CONTA ADMIN)
-- ============================================================================
-- Só cria o necessário pra ter um user admin no painel:
--   - Tabela profiles (1:1 com auth.users) com flag is_admin
--   - Trigger que cria profile automaticamente quando user se cadastra
--   - RLS: user lê/edita só o próprio, admin lê todos
-- Resto do schema (forum, XP, etc) vamos adicionar depois.
-- ============================================================================

-- 1. Tabela profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;

-- 2. Trigger: ao criar user em auth.users, cria automaticamente row em profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Trigger: atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. RLS — Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Qualquer user autenticado lê todos os profiles (necessário pra área de membros)
DROP POLICY IF EXISTS "authenticated read all profiles" ON public.profiles;
CREATE POLICY "authenticated read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- User edita só o próprio profile
DROP POLICY IF EXISTS "user updates own profile" ON public.profiles;
CREATE POLICY "user updates own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin atualiza qualquer profile (pra eventualmente promover outros admins via painel)
DROP POLICY IF EXISTS "admin updates any profile" ON public.profiles;
CREATE POLICY "admin updates any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Service role bypassa tudo (já é default do Supabase, mas explicito)
-- Insert e Delete: só via trigger (handle_new_user) ou service_role.
