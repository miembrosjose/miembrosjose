-- ============================================================================
-- FALTA LA MEDITACIÓN INCLUIDA DEL EPISODIO 5
-- ============================================================================
-- El catálogo del navegador (app/miembros/_lib/meditaciones.ts) tiene DOS
-- prácticas para «El Nombre que Olvidaste»: una incluida y una premium. En la
-- tabla `meditations` solo existe la premium.
--
-- Por eso la incluida fallaba: el servidor no la encuentra en el catálogo, y
-- devuelve 404 antes siquiera de ir a buscar el MP3 a R2. No era un problema
-- de nombres de archivo.
--
-- Solo INSERTA una fila. No toca la premium ni ninguna otra.
-- Idempotente: si ya existe, no hace nada.
-- ============================================================================

insert into public.meditations
  (id, title, subtitle, access_type, price_cents, currency, audio_object_key, season_num, episode_num, is_purchasable)
values
  ('s1e5-nombre-included',
   'Sintonía con el Nombre Cósmico',
   'Aquieta la mente y abre el silencio interior para percibir tu vibración.',
   'included', 0, 'usd',
   'audio/included/Temporada 1/nombre-cosmico-sintonia.mp3', 1, 5, false)
on conflict (id) do nothing;


-- ════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN (solo lectura)
-- ════════════════════════════════════════════════════════════════════════
-- Se esperan DOS filas.

select id, title, access_type, audio_object_key
from public.meditations
where id like 's1e5-%'
order by access_type;
