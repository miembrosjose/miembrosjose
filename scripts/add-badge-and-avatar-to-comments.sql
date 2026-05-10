-- ──────────────────────────────────────────────────────────────────────────
-- ALTER TABLE episode_comments — adicionar:
--   - author_avatar_url TEXT  : URL absoluta do avatar (R2) na hora do post.
--                                Snapshot — se user trocar foto depois, comentários
--                                antigos mantêm a foto da época. Cliente decide:
--                                se URL existe → renderiza <img>; senão → letras
--                                em author_avatar.
--   - author_badge_id   TEXT  : id da insignia destacada (de lib/achievements.ts)
--                                na hora do post. NULL = sem insignia.
--                                Snapshot — old comments keep their badge mesmo se
--                                user trocar a featured_badge depois.
--
-- Rodar UMA VEZ no SQL Editor do Supabase. Idempotente (IF NOT EXISTS).
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE episode_comments
  ADD COLUMN IF NOT EXISTS author_avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS author_badge_id   TEXT;
