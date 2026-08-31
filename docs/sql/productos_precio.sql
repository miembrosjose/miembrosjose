-- ────────────────────────────────────────────────────────────────────
-- Precio de productos (para compra 1-click con Stripe, estilo meditación).
-- Ejecutar en el SQL Editor de Supabase (proyecto principal).
-- Idempotente: se puede correr varias veces.
-- ────────────────────────────────────────────────────────────────────

-- Precio en centavos (ej. 499 = US$ 4.99). 0 = sin precio configurado.
alter table public.products
  add column if not exists price_cents integer not null default 0;

alter table public.products
  add column if not exists currency text not null default 'usd';

-- Ejemplo (opcional): poné precio a los productos de la Tienda.
-- update public.products set price_cents = 499, currency = 'usd'
-- where name ilike 'niño interior' or name ilike 'numerología cósmica';
