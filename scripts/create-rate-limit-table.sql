-- Tabela para rate limiting do dashboard (substitui Upstash Redis)
-- Armazena tentativas erradas por IP com expiração automática

CREATE TABLE IF NOT EXISTS public.dashboard_rate_limit (
  ip       text        PRIMARY KEY,
  attempts integer     NOT NULL DEFAULT 0,
  blocked_until timestamptz NOT NULL DEFAULT now()
);
