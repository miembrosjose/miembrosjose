-- ============================================================================
-- NUMEROLOGÍA CÓSMICA — producto único (tarjeta + desbloqueo profundo US$ 20)
-- ============================================================================
-- Un solo producto en la Biblioteca representa la herramienta:
--   · Portada (media_url), nombre y descripción → editables desde "Gestionar".
--   · price_cents = 2000 (US$ 20) → precio de la Lectura Profunda (editable).
--   · is_locked = true → el desbloqueo usa el checkout 1-click de Stripe
--     (/api/products/[id]/unlock · /state · /confirm · /create-pi).
--
-- La tarjeta gratuita se muestra SIEMPRE (abre la herramienta); el precio solo
-- aplica al desbloqueo de la "Revelación Numerológica de Misión" dentro de ella.
-- El producto se filtra del carrusel de Biblioteca (se muestra como tarjeta
-- principal), así que no aparece duplicado.
--
-- Ejecutar en Supabase (proyecto principal) → SQL Editor → Run. Idempotente.
-- ============================================================================

-- Columnas necesarias (idempotentes).
alter table public.products add column if not exists price_cents integer not null default 0;
alter table public.products add column if not exists currency text not null default 'usd';
alter table public.products add column if not exists category text not null default 'biblioteca';
alter table public.products add column if not exists available_from text;

-- Consolidar: eliminar el producto "profunda" separado si se creó antes.
delete from public.products where name ilike '%numerolog%profund%';

-- 1) Si ya existe "Numerología Cósmica" → configurarlo como producto activo.
update public.products
set category       = 'biblioteca',
    available_from = null,       -- deja de ser "próximamente": comprable
    is_locked      = true,
    price_cents    = 2000,
    currency       = 'usd',
    description    = coalesce(nullif(description, ''), 'Tu código personal: nombre, fecha, alma y misión.')
where name ilike '%numerolog%' and name not ilike '%profund%';

-- 2) Si no existía, crearlo.
insert into public.products
  (num, name, description, category, gradient, emoji, sort_order, is_locked, price_cents, currency)
select
  91,
  'Numerología Cósmica',
  'Tu código personal: nombre, fecha, alma y misión.',
  'biblioteca',
  'linear-gradient(135deg, #2a2140 0%, #6D4A9B 100%)',
  '🔮',
  0,
  true,
  2000,
  'usd'
where not exists (
  select 1 from public.products
  where name ilike '%numerolog%' and name not ilike '%profund%'
);

-- 3) Verificar.
select id, num, name, category, price_cents, currency, is_locked, available_from, media_url
from public.products
where name ilike '%numerolog%';
