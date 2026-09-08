-- ============================================================================
-- LUGARES DE CONTACTO — producto (tarjeta gestionable + desbloqueo 1-clic)
-- ============================================================================
-- Asegura el producto en la tabla `products` para:
--   · editar portada/nombre/descripción/precio desde "Gestionar → Biblioteca";
--   · desbloqueo con compra 1-clic (Stripe) — precio inicial US$ 4.99.
-- category = 'biblioteca' → aparece en Gestionar; se oculta del carrusel porque
-- se muestra como tarjeta principal del módulo.
-- Ejecutar en Supabase → SQL Editor → Run. Idempotente.
-- ============================================================================

alter table public.products add column if not exists price_cents integer not null default 0;
alter table public.products add column if not exists currency text not null default 'usd';
alter table public.products add column if not exists category text not null default 'biblioteca';
alter table public.products add column if not exists available_from text;

-- 1) Configurar si ya existe.
update public.products
set category       = 'biblioteca',
    available_from = null,
    is_locked      = true,
    price_cents    = 499,
    currency       = 'usd',
    description    = coalesce(nullif(description, ''), 'Mapa Cósmico de la Red: lugares sagrados, discos solares, zonas de contacto y nodos.')
where name ilike '%lugares%contacto%';

-- 2) Crear si no existe.
insert into public.products
  (num, name, description, category, gradient, emoji, sort_order, is_locked, price_cents, currency)
select
  92,
  'Lugares de Contacto',
  'Mapa Cósmico de la Red: lugares sagrados, discos solares, zonas de contacto y nodos.',
  'biblioteca',
  'linear-gradient(135deg, #14142a 0%, #6D4A9B 100%)',
  '🛸',
  2,
  true,
  499,
  'usd'
where not exists (select 1 from public.products where name ilike '%lugares%contacto%');

select id, num, name, category, price_cents, currency, is_locked, available_from
from public.products where name ilike '%lugares%contacto%';
