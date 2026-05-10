-- Cria tabela checkout_config — uma linha por região (DEFAULT, USD, EUR, GBP, CHF)
-- Cada linha guarda o config completo em JSONB pra editar via dashboard

CREATE TABLE IF NOT EXISTS checkout_config (
  region text PRIMARY KEY,
  config jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS desativado (acesso só via service_role no servidor)
ALTER TABLE checkout_config DISABLE ROW LEVEL SECURITY;

-- Index pra buscas por updated_at (útil pro dashboard mostrar "última edição")
CREATE INDEX IF NOT EXISTS idx_checkout_config_updated_at ON checkout_config(updated_at DESC);

-- Trigger pra atualizar updated_at automaticamente em UPDATE
CREATE OR REPLACE FUNCTION update_checkout_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_checkout_config_updated_at ON checkout_config;
CREATE TRIGGER trg_checkout_config_updated_at
  BEFORE UPDATE ON checkout_config
  FOR EACH ROW
  EXECUTE FUNCTION update_checkout_config_updated_at();
