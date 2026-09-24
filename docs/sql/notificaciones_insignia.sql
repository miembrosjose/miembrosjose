-- ============================================================================
-- EL AVISO DE UNA INSIGNIA DEBE ENSEÑAR LA INSIGNIA  [EJECUTAR UNA VEZ]
-- ============================================================================
--
-- QUÉ PASA
--   La campana pinta siempre la foto de quien provoca el aviso. Para «Fulano
--   respondió a tu conversación» está bien: la cara es el dato. Para
--   «Desbloqueaste 144» no: ahí lo que hay que ver es la insignia, y lo que
--   salía era tu propia foto de perfil.
--
--   El aviso no guardaba CUÁL insignia era —solo su nombre dentro del título—,
--   así que la pantalla no tenía con qué dibujarla.
--
-- QUÉ HACE
--   Añade una columna para guardar el identificador de la insignia. Nada más:
--   no borra, no cambia nada existente, y los avisos que no son de insignia
--   la dejan vacía.
--
-- CÓMO APLICARLO
--   Supabase → SQL Editor → pega todo → Run. Idempotente.
--
-- MIENTRAS NO SE EJECUTE
--   Nada se rompe: la API detecta que la columna no está y sigue sirviendo los
--   avisos como hasta ahora, con la foto.
-- ============================================================================

alter table public.notifications
  add column if not exists source_insignia_id text;

comment on column public.notifications.source_insignia_id is
  'Que insignia provoco el aviso. La campana dibuja su emblema en vez de la foto.';


-- ── Comprobación ────────────────────────────────────────────────────────────
select
  column_name as columna,
  data_type   as tipo
from information_schema.columns
where table_schema = 'public'
  and table_name = 'notifications'
  and column_name = 'source_insignia_id';
