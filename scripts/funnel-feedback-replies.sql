-- ──────────────────────────────────────────────────────────────────────────
-- FUNNEL FEEDBACK REPLIES — threaded comments em feedbacks de funnel
--
-- Adiciona parent_id pra suportar respostas. UI mostra threaded:
-- feedback raiz com replies abaixo (1 nível só, sem aninhamento profundo).
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE funnel_feedbacks ADD COLUMN IF NOT EXISTS parent_id uuid
  REFERENCES funnel_feedbacks(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_funnel_feedbacks_parent
  ON funnel_feedbacks (parent_id, created_at ASC)
  WHERE parent_id IS NOT NULL;
