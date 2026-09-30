-- ════════════════════════════════════════════════════════════════════════════
--  MEDITACIONES · precio único de 4,99 USD y retirada de la premium de Lemuria
--  27-09-2026
-- ════════════════════════════════════════════════════════════════════════════
--
-- ── POR QUÉ ESTO NO SE ARREGLA EN EL CÓDIGO ────────────────────────────────
-- El precio de una meditación premium lo decide SIEMPRE `meditations.price_cents`.
-- El campo `price` de app/miembros/_lib/meditaciones.ts es solo un texto de
-- respaldo para pintar la tarjeta antes de que responda el servidor: cambiarlo
-- allí no cambia lo que cobra Stripe.
--
-- Y había una diferencia real: `s1e5-nombre-premium` estaba sembrada a 100
-- céntimos —un dólar, de cuando se probó el cobro con un importe mínimo— y
-- nunca se subió. La tarjeta decía 4,99 y el cobro era de 1,00.
--
-- ── POR QUÉ LA DE LEMURIA NO SE BORRA ──────────────────────────────────────
-- Borrar la fila dejaría sin audio a quien ya la compró: el endpoint
-- /api/meditations/<id>/audio resuelve el MP3 mirando ESTA tabla, no el
-- catálogo del cliente. Quitarla del catálogo la hace invisible; quitarle
-- `is_purchasable` impide comprarla por un enlace viejo. Quien pagó, sigue
-- teniendo su compra en `meditation_purchases` y su audio.

begin;

-- 1) Todas las premium a 4,99 USD.
update public.meditations
   set price_cents = 499,
       currency    = 'usd'
 where access_type = 'premium'
   and (price_cents is distinct from 499 or currency is distinct from 'usd');

-- 2) La premium de Lemuria deja de venderse, sin dejar de existir.
update public.meditations
   set is_purchasable = false
 where id = 's3e2-codigos-lemuria-premium';

commit;

-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────
-- Todas las premium deben salir a 4.99. La de Lemuria, con se_vende = false.
select id,
       access_type,
       '$' || (price_cents / 100.0)::numeric(6,2) as precio,
       currency,
       is_purchasable as se_vende
  from public.meditations
 where access_type = 'premium'
 order by id;
