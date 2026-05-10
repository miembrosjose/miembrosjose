-- ──────────────────────────────────────────────────────────────────────────
-- site_texts: overrides editáveis pelo admin pra textos da plataforma.
--
-- Estrutura key/value:
--   key   = identificador estável (ex: "section.tienda.title")
--   value = texto exibido (admin pode editar)
--
-- Frontend mantém defaults em código (lib/site-texts.ts). Se uma key tem
-- registro nessa tabela, o valor sobrescreve o default. Senão, mostra default.
--
-- Idempotente — pode rodar várias vezes sem problema.
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS site_texts (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: leitura pública (qualquer authenticated pode ler).
-- Insert/Update: server-side via service_role (admin gateado nas APIs).
ALTER TABLE site_texts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read site_texts" ON site_texts;
CREATE POLICY "authenticated read site_texts"
  ON site_texts FOR SELECT
  TO authenticated
  USING (true);
