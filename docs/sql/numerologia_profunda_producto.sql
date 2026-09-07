-- ============================================================================
-- LECTURA PROFUNDA DE NUMEROLOGÍA CÓSMICA — producto premium (US$ 20)
-- ============================================================================
-- Crea el producto que desbloquea la "Revelación Numerológica de Misión"
-- dentro de la herramienta gratuita de Numerología Cósmica (Biblioteca).
--
-- category = 'numerologia'  → NO aparece en los carruseles de Biblioteca ni
--                             Tienda (esos filtran por 'biblioteca'/'tienda').
--                             El desbloqueo se hace solo desde la lectura.
-- price_cents = 2000 (US$ 20) · is_locked = true · sin available_from (comprable).
--
-- Usa el mismo checkout 1-click de Stripe que el resto de productos:
--   /api/products/[id]/unlock · /state · /confirm · /create-pi
-- Ejecutar en Supabase (proyecto principal) → SQL Editor → Run. Idempotente.
-- ============================================================================

-- Requiere las columnas price_cents/currency (productos_precio.sql) y
-- category (productos_categoria.sql). Ambas son idempotentes:
alter table public.products add column if not exists price_cents integer not null default 0;
alter table public.products add column if not exists currency text not null default 'usd';
alter table public.products add column if not exists category text not null default 'biblioteca';

-- 1) Crear el producto si aún no existe (identificado por nombre estable).
insert into public.products
  (num, name, description, category, gradient, emoji, sort_order, is_locked, price_cents, currency)
select
  90,
  'LECTURA PROFUNDA DE NUMEROLOGÍA CÓSMICA',
  'Revelación Numerológica de Misión — lectura profunda de 16 capítulos.',
  'numerologia',
  'linear-gradient(135deg, #2a2140 0%, #6D4A9B 100%)',
  '🔮',
  90,
  true,
  2000,
  'usd'
where not exists (
  select 1 from public.products
  where name = 'LECTURA PROFUNDA DE NUMEROLOGÍA CÓSMICA'
);

-- 2) Asegurar precio/estado si ya existía (no destructivo sobre media/textos).
update public.products
set price_cents    = 2000,
    currency       = 'usd',
    is_locked      = true,
    category       = 'numerologia',
    available_from = null
where name = 'LECTURA PROFUNDA DE NUMEROLOGÍA CÓSMICA';

-- 3) Verificar.
select id, num, name, category, price_cents, currency, is_locked, available_from
from public.products
where name = 'LECTURA PROFUNDA DE NUMEROLOGÍA CÓSMICA';
