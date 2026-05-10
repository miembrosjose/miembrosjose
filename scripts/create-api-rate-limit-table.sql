-- Rate limit genérico pra rotas API públicas (track, lead, upsell, etc).
-- Cada bucket = (chave do limite + IP). Auto-limpa via TTL na função.

CREATE TABLE IF NOT EXISTS public.api_rate_limit (
  bucket text NOT NULL,
  ip text NOT NULL,
  hits integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket, ip)
);

ALTER TABLE public.api_rate_limit ENABLE ROW LEVEL SECURITY;

-- Index pra cleanup periódico
CREATE INDEX IF NOT EXISTS idx_api_rate_limit_window
  ON public.api_rate_limit(window_start);
