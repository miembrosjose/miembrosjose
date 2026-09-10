-- ============================================================================
-- MOCK / DESARROLLO — 3 transmisiones de prueba (NO es contenido real de José)
-- ============================================================================
-- Úsalo solo para previsualizar el diseño. Idempotente (upsert por slug).
-- Para BORRAR los mocks antes de producción, corre el bloque del final.
-- ============================================================================

insert into public.transmissions
  (slug, title, excerpt, body, category_slug, tags, status, featured, featured_order, related_season, related_post_slugs, source_basis, editorial_notes, reading_time)
values
  ('mock-transmision-destacada',
   '[MOCK] Placeholder de transmisión destacada',
   'Contenido de prueba para validar el diseño. Reemplazar antes de producción.',
   E'**Este es un texto de prueba (mock).** No representa una enseñanza real de José.\n\n## Un subtítulo de ejemplo\n\nPárrafo de relleno para comprobar el interlineado y el ancho de columna.\n\n> Una cita de ejemplo para verificar el estilo de blockquote.',
   'vida-proposito', array['mock','prueba'], 'published', true, 1, 2, array[]::text[], 'other',
   'MOCK de desarrollo — eliminar antes de producción.', 2),

  ('mock-abundancia',
   '[MOCK] Placeholder sobre abundancia',
   'Segundo contenido de prueba. Reemplazar antes de producción.',
   E'**Texto de prueba (mock).** Al buscar "dinero" o "abundancia" debería aparecer gracias a la búsqueda con sinónimos.',
   'abundancia-creacion', array['mock','prueba','abundancia'], 'published', true, 2, null, array[]::text[], 'other',
   'MOCK de desarrollo — eliminar antes de producción.', 1),

  ('mock-archivo',
   '[MOCK] Placeholder de archivo',
   'Tercer contenido de prueba, no destacado. Reemplazar antes de producción.',
   E'**Texto de prueba (mock).** Para poblar la cuadrícula del archivo y verificar "SEGUIR EXPLORANDO".',
   'consciencia-realidad', array['mock','prueba'], 'published', false, null, null,
   array['mock-transmision-destacada','mock-abundancia'], 'other',
   'MOCK de desarrollo — eliminar antes de producción.', 1)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  body = excluded.body,
  category_slug = excluded.category_slug,
  tags = excluded.tags,
  status = excluded.status,
  featured = excluded.featured,
  featured_order = excluded.featured_order,
  related_season = excluded.related_season,
  related_post_slugs = excluded.related_post_slugs,
  reading_time = excluded.reading_time,
  updated_at = now();

-- ── BORRAR los mocks (correr antes de producción) ──
-- delete from public.transmissions where editorial_notes like 'MOCK de desarrollo%';

select 'mocks cargados' as status;
