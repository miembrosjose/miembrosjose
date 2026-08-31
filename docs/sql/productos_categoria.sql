-- ────────────────────────────────────────────────────────────────────
-- Categoría de productos: separa "Biblioteca de los 144000" de "Tienda".
-- Ejecutar en el SQL Editor de Supabase (proyecto principal).
-- Idempotente: se puede correr varias veces sin romper nada.
-- ────────────────────────────────────────────────────────────────────

-- 1) Columna category (por defecto todo cae en "biblioteca").
alter table public.products
  add column if not exists category text not null default 'biblioteca';

-- 2) Mueve "Niño Interior" y "Numerología Cósmica" a la Tienda.
--    ILIKE = case-insensitive, y cubrimos variantes de acento/escritura.
update public.products
set category = 'tienda'
where name ilike 'niño interior'
   or name ilike 'nino interior'
   or name ilike 'numerología cósmica'
   or name ilike 'numerologia cosmica';

-- 3) Verificación (opcional): revisa cómo quedó cada producto.
select num, name, category, available_from
from public.products
order by category, sort_order;
