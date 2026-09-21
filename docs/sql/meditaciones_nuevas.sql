-- ============================================================================
-- MEDITACIONES NUEVAS — Temporadas 1 a 4.  PREPARADO, NO EJECUTADO.
-- ============================================================================
-- Da de alta las 12 meditaciones nuevas en la tabla `meditations`.
-- Las dos del Ep. 5 de T1 ya existen y NO se tocan.
--
-- Aditivo: `insert ... on conflict (id) do nothing`. Re-ejecutarlo no duplica
-- ni pisa nada. No borra ni modifica filas existentes.
--
-- ANTES DE CORRERLO:
--   1. Sube cada MP3 al bucket PRIVADO los144000-media, en la ruta exacta que
--      aparece en audio_object_key. Si el audio todavía no existe, la fila se
--      puede crear igual: la tarjeta aparece y el audio dará 404 hasta que
--      subas el archivo.
--   2. Las portadas NO van aquí: se ponen en el campo `image` de
--      app/miembros/_lib/meditaciones.ts (hoy vacío a propósito).
--
-- PRECIO DE LAS PREMIUM: manda price_cents de esta tabla, no el código.
--   499 = US$ 4.99.  Cámbialo aquí si quieres otro precio.
-- ============================================================================

insert into public.meditations
  (id, title, subtitle, access_type, price_cents, currency, audio_object_key, season_num, episode_num, is_purchasable)
values

-- ── TEMPORADA 1 · SERGEL ───────────────────────────────────────────────────
-- Ep. 7 · Propósito y Discernimiento — dos incluidas
('s1e7-proposito-included',
 'Reconocimiento del Propósito de Vida',
 'Práctica de escucha para reconocer tu propósito y sellar el pacto de discernimiento.',
 'included', 0, 'usd',
 'audio/included/Temporada 1/proposito-reconocimiento.mp3', 1, 7, false),

('s1e7-nino-interior-included',
 'Sanación del Niño Interior',
 'Sana la herida temprana y abre la percepción a las señales del propósito de vida.',
 'included', 0, 'usd',
 'audio/included/Temporada 1/nino-interior-sanacion.mp3', 1, 7, false),

-- ── TEMPORADA 2 · ALINA ────────────────────────────────────────────────────
-- Ep. 1 · La Fuente — PREMIUM
('s2e1-fuente-premium',
 'Conexión con la Fuente',
 'Práctica guiada completa de encuentro con el Supremo Amor en el centro del origen.',
 'premium', 499, 'usd',
 'audio/premium/Temporada 2/fuente-supremo-amor.mp3', 2, 1, true),

-- Ep. 3 · Los Siete Cuerpos
('s2e3-siete-cuerpos-included',
 'Conexión con los Siete Cuerpos',
 'Recorrido consciente por los siete vehículos, de la raíz a la corona.',
 'included', 0, 'usd',
 'audio/included/Temporada 2/siete-cuerpos.mp3', 2, 3, false),

-- Ep. 5 · Las Siete Leyes Universales
('s2e5-siete-leyes-included',
 'Repaso de las Siete Leyes Universales',
 'Práctica de integración para reconocer las siete leyes actuando en tu experiencia.',
 'included', 0, 'usd',
 'audio/included/Temporada 2/siete-leyes-repaso.mp3', 2, 5, false),

-- ── TEMPORADA 3 · ANTAREL ──────────────────────────────────────────────────
-- Ep. 2 · Lemuria — una incluida + una PREMIUM
('s3e2-lemuria-included',
 'Conexión con Lemuria',
 'Regresa a la memoria del Pacífico: agua, sonido y consciencia sin separación.',
 'included', 0, 'usd',
 'audio/included/Temporada 3/lemuria-conexion.mp3', 3, 2, false),

('s3e2-codigos-lemuria-premium',
 'Activación de los Códigos de Lemuria',
 'Práctica guiada completa para activar los códigos lemurianos dormidos en tu memoria.',
 'premium', 499, 'usd',
 'audio/premium/Temporada 3/lemuria-codigos.mp3', 3, 2, true),

-- Ep. 3 · Las Guerras de Orión
('s3e3-memorias-orion-included',
 'Sanación de las Memorias de Orión',
 'Libera memorias de guerra, control, persecución, abuso de poder y antiguas lealtades.',
 'included', 0, 'usd',
 'audio/included/Temporada 3/orion-memorias.mp3', 3, 3, false),

-- Ep. 4 · Los Atlantes — dos incluidas
('s3e4-atlantida-included',
 'Conexión con la Atlántida',
 'Abre el recuerdo del mundo atlante y de lo que allí quedó pendiente.',
 'included', 0, 'usd',
 'audio/included/Temporada 3/atlantida-conexion.mp3', 3, 4, false),

('s3e4-abuso-generacional-included',
 'Sanación de Memorias de Abuso Generacional',
 'Reconoce y libera el abuso de poder transmitido a través del linaje.',
 'included', 0, 'usd',
 'audio/included/Temporada 3/abuso-generacional.mp3', 3, 4, false),

-- Ep. 8 · Auge y Caída
('s3e8-caida-atlante-included',
 'Integración y Trascendencia de la Atlántida',
 'Cierra el ciclo de la caída atlante e integra su aprendizaje en el presente.',
 'included', 0, 'usd',
 'audio/included/Temporada 3/caida-atlante-integracion.mp3', 3, 8, false),

-- ── TEMPORADA 4 · IVIKA ────────────────────────────────────────────────────
-- Ep. 1 · Los Discos Solares — dos incluidas
('s4e1-am-on-included',
 'Mantra AM-ON',
 'Vocalización del mantra de activación que enlaza con la red de discos solares.',
 'included', 0, 'usd',
 'audio/included/Temporada 4/mantra-am-on.mp3', 4, 1, false),

('s4e1-discos-solares-included',
 'Conexión con los Discos Solares',
 'Recorrido por los trece nodos de memoria, desde Ilumana hacia toda la red.',
 'included', 0, 'usd',
 'audio/included/Temporada 4/discos-solares-conexion.mp3', 4, 1, false),

-- Ep. 6 · Jesús, la llave del amor
('s4e6-perdon-included',
 'La Llave del Perdón',
 'Experiencia de perdón a la luz de Jesús: primero contigo, después con los demás.',
 'included', 0, 'usd',
 'audio/included/Temporada 4/perdon-llave.mp3', 4, 6, false)

on conflict (id) do nothing;


-- ── Verificación (solo lectura) ────────────────────────────────────────────
-- Esperado: 16 filas (las 2 de T1 Ep5 que ya existían + las 14 nuevas).
select
  season_num  as temporada,
  episode_num as episodio,
  id,
  access_type as acceso,
  case when price_cents > 0
       then '$' || (price_cents / 100.0)::numeric(6,2)
       else '—' end as precio,
  audio_object_key
from public.meditations
order by season_num, episode_num, access_type desc, id;
