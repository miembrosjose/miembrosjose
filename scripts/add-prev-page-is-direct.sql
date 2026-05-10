-- Adiciona colunas prev_page e is_direct na tabela funnel_events
ALTER TABLE funnel_events
  ADD COLUMN IF NOT EXISTS prev_page text,
  ADD COLUMN IF NOT EXISTS is_direct boolean DEFAULT false;
