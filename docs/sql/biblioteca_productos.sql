-- ============================================================================
-- Biblioteca de los 144000 — productos "Próximamente" con fecha de disponibilidad
-- ============================================================================
-- Añade la columna available_from, renombra "Producto 1" y crea los demás.
-- Ejecutar en Supabase (proyecto principal) → SQL Editor → Run.
-- NO destructivo: solo añade columna e inserta/renombra filas.
-- ============================================================================

-- 1) Nueva columna (texto libre tipo "Diciembre 2026"). Idempotente.
alter table public.products add column if not exists available_from text;

-- 2) Renombrar el existente "Producto 1" → primer producto de la biblioteca.
update public.products
set name           = 'Protocolo de Contacto',
    available_from = 'Diciembre 2026',
    is_locked      = true,
    checkout_url   = null,
    description    = null
where name = 'Producto 1';

-- 3) Crear los demás. Si ya tienes productos con num 2–8, cambia esos números.
insert into public.products (num, name, available_from, gradient, emoji, sort_order, is_locked)
values
  (2, 'Lugares de Contacto',     'Diciembre 2026', 'linear-gradient(135deg, #14142a 0%, #6D4A9B 100%)', '🛸', 2, true),
  (3, 'Discos Solares',          'Febrero 2027',   'linear-gradient(135deg, #14142a 0%, #6D4A9B 100%)', '☀️', 3, true),
  (4, 'Ciudades intraterrenas',  'Febrero 2027',   'linear-gradient(135deg, #14142a 0%, #6D4A9B 100%)', '🏛️', 4, true),
  (5, 'Razas primarias',         'Enero 2027',     'linear-gradient(135deg, #14142a 0%, #6D4A9B 100%)', '🧬', 5, true),
  (6, 'Niño interior',           'Marzo 2027',     'linear-gradient(135deg, #14142a 0%, #6D4A9B 100%)', '🌙', 6, true),
  (7, 'Sanación Extraterrestre', 'Abril 2027',     'linear-gradient(135deg, #14142a 0%, #6D4A9B 100%)', '💠', 7, true),
  (8, 'Numerología Cósmica',     'Enero 2027',     'linear-gradient(135deg, #14142a 0%, #6D4A9B 100%)', '🔢', 8, true);
