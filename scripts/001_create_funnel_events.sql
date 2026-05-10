-- Tabela de eventos do funil
CREATE TABLE IF NOT EXISTS public.funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  page TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'pageview', -- 'pageview' | 'checkout_click'
  country TEXT,
  country_code TEXT,
  form_data JSONB,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas rápidas no dashboard
CREATE INDEX IF NOT EXISTS idx_funnel_events_created_at ON public.funnel_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_events_session_id ON public.funnel_events(session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_page ON public.funnel_events(page);
CREATE INDEX IF NOT EXISTS idx_funnel_events_event_type ON public.funnel_events(event_type);

-- Desabilitar RLS para inserção pública (eventos anônimos de visitantes)
ALTER TABLE public.funnel_events DISABLE ROW LEVEL SECURITY;
