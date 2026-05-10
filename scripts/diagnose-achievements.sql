-- DIAGNÓSTICO DO SISTEMA DE INSIGNIAS
-- Roda esse SQL no Supabase Dashboard > SQL Editor.
-- Cada bloco retorna info diferente — copia o output e me manda.
--
-- ⚠️ Esse script só LÊ dados, não modifica nada.

-- 1) Verifica se a tabela user_unlocked_achievements existe
SELECT
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_name = 'user_unlocked_achievements';

-- 2) Verifica colunas da tabela (schema esperado: user_id uuid, achievement_id text, unlocked_at timestamptz)
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_unlocked_achievements'
ORDER BY ordinal_position;

-- 3) Verifica se tem PRIMARY KEY (user_id, achievement_id) — necessário pro upsert idempotente
SELECT
  tc.constraint_name,
  tc.constraint_type,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_unlocked_achievements'
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
GROUP BY tc.constraint_name, tc.constraint_type;

-- 4) Conta total de unlocks por insignia (top 30) — ajuda ver se algum user tá unlockando
SELECT
  achievement_id,
  COUNT(*) AS unlock_count,
  MAX(unlocked_at) AS last_unlocked
FROM user_unlocked_achievements
GROUP BY achievement_id
ORDER BY unlock_count DESC, last_unlocked DESC
LIMIT 30;

-- 5) Conta unlocks total + users distintos
SELECT
  COUNT(*) AS total_unlocks,
  COUNT(DISTINCT user_id) AS distinct_users_with_at_least_one_unlock,
  MIN(unlocked_at) AS first_unlock_ever,
  MAX(unlocked_at) AS last_unlock_ever
FROM user_unlocked_achievements;

-- 6) Conta total de users na auth (pra comparar com #5)
SELECT COUNT(*) AS total_auth_users FROM auth.users;

-- 7) Verifica RLS policies da tabela (se RLS estiver bloqueando, é problema)
SELECT
  schemaname,
  tablename,
  policyname,
  cmd AS operation,
  roles
FROM pg_policies
WHERE tablename = 'user_unlocked_achievements';

-- 8) Verifica se tem trigger ou função que pode estar bloqueando insert
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_unlocked_achievements';

-- 9) Sample dos últimos 10 unlocks (pra ver dados reais)
SELECT
  user_id,
  achievement_id,
  unlocked_at
FROM user_unlocked_achievements
ORDER BY unlocked_at DESC
LIMIT 10;

-- 10) Compara: users que assistiram episódios mas NÃO têm insignia
-- (se episode_progress existir, deveria ter pelo menos first_lesson)
SELECT
  COUNT(DISTINCT ep.user_id) AS users_with_episodes_watched,
  COUNT(DISTINCT ach.user_id) AS users_with_achievements,
  COUNT(DISTINCT ep.user_id) FILTER (
    WHERE ep.user_id NOT IN (SELECT user_id FROM user_unlocked_achievements)
  ) AS users_with_episodes_but_no_achievements
FROM episode_progress ep
LEFT JOIN user_unlocked_achievements ach ON ach.user_id = ep.user_id;
