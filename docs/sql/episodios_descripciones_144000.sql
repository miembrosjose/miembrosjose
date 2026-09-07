-- ============================================================================
-- LOS 144.000 — Descripciones cortas de episodios (T1–T4)
-- ----------------------------------------------------------------------------
-- Qué hace (idempotente y seguro — se puede correr varias veces):
--   1) Actualiza SOLO la columna `description` de cada episodio, emparejando
--      por (número de temporada, número de episodio). NO toca títulos,
--      imágenes, thumbnails, orden ni rutas.
--   2) Temporada 4 · Episodio 7 "El Mensaje Primordial": si existe, corrige su
--      título + descripción; si NO existe, lo crea al final (sort_order 7).
--      (El título de ep7 se fija porque fue autorizado explícitamente.)
--   3) Re-sincroniza `seasons.episodes` (el contador del encabezado) con el
--      número REAL de episodios de cada temporada, para que el header no diga
--      "7 EPS" si faltaba uno.
--   4) Muestra al final una verificación con todo T1–T4.
--
-- Cómo correrlo: Supabase → SQL Editor → pegar todo → Run.
-- ============================================================================

begin;

-- 1) DESCRIPCIONES (por temporada + número de episodio). Solo `description`.
--    Temporada 4 ep7 se maneja aparte (pasos 2), por eso no está aquí.
with nuevas(season_num, ep_num, descr) as (
  values
    -- ── TEMPORADA 1 · SERGEL ──
    (1, 1, 'El camino se abre como una entrada a la memoria, la misión y la preparación interior.'),
    (1, 2, 'El 144.000 se revela como frecuencia, compromiso y responsabilidad dentro del Plan.'),
    (1, 3, 'La memoria de origen despierta en quienes sienten que la Tierra nunca fue un destino casual.'),
    (1, 4, 'El alma aceptó olvidar para recordar desde libertad, experiencia y conciencia propia.'),
    (1, 5, 'El nombre cósmico se revela como una clave vibratoria del alma y de su origen.'),
    (1, 6, 'La Tierra aparece como escuela de integración, amor y evolución para muchos mundos.'),
    (1, 7, 'El propósito se ordena cuando la felicidad del alma se une con verdad y discernimiento.'),

    -- ── TEMPORADA 2 · ALINA ──
    (2, 1, 'Todo nace de una Conciencia mayor que se proyecta en universos, dimensiones y vida.'),
    (2, 2, 'El cosmos se revela como una arquitectura viva de planos, leyes y evolución.'),
    (2, 3, 'El ser humano aparece como una estructura multidimensional en proceso de integración.'),
    (2, 4, 'Consejos, inteligencias y custodios acompañan el desarrollo evolutivo de la galaxia.'),
    (2, 5, 'Las leyes ordenan la mente, la energía, la experiencia y el camino de ascenso.'),
    (2, 6, 'La Confederación sostiene equilibrio, vigilancia y coordinación entre mundos conscientes.'),

    -- ── TEMPORADA 3 · ANTAREL ──
    (3, 1, 'La Tierra se revela como un proyecto destinado a abrir una posibilidad evolutiva única.'),
    (3, 2, 'La tercera humanidad nace entre océanos, memoria biológica y conexión profunda con la Tierra.'),
    (3, 3, 'Una antigua fractura estelar proyecta sobre la Tierra memorias de control, rebelión y dominio.'),
    (3, 4, 'Atlántida surge de una mezcla, una herida y una oportunidad de transformación.'),
    (3, 5, 'Dos linajes acompañan la evolución humana: memoria del cielo y arquitectura en la materia.'),
    (3, 6, 'Sirio entrega estructura; Orión abre rutas, dirección y memorias profundas del Plan.'),
    (3, 7, 'Atlántida organiza sus linajes como funciones vivas dentro de una red civilizatoria.'),
    (3, 8, 'El conocimiento separado del corazón transforma la tecnología en poder y precipita la caída.'),
    (3, 9, 'Después del derrumbe, la memoria sagrada es protegida en los retiros interiores.'),

    -- ── TEMPORADA 4 · IVIKA (ep 1–6; ep 7 en el paso 2) ──
    (4, 1, 'La red solar preserva la memoria del tiempo verdadero y sostiene el retorno de la Tierra.'),
    (4, 2, 'El primer archivo entrega escritura, medida, ciudad y memoria celeste a la civilización.'),
    (4, 3, 'La memoria atlante se transforma en templo, símbolo, pirámide y escuela interior.'),
    (4, 4, 'El Plan pasa del templo y la civilización al pacto vivo dentro de un individuo.'),
    (4, 5, 'La alianza se convierte en ley, arca, enseñanza interna y preparación crística.'),
    (4, 6, 'Jesús abre la séptima dimensión mediante amor, perdón, servicio y entrega total.')
)
update episodes e
set description = n.descr,
    updated_at  = now()
from nuevas n
join seasons s on s.num = n.season_num
where e.season_id = s.id
  and e.num = n.ep_num;

-- 2a) T4 · ep7 SI YA EXISTE → corrige título + descripción.
update episodes e
set title       = 'El Mensaje Primordial',
    description  = 'La memoria solar se resume en una verdad: recordar, perdonar, servir y preparar el Nuevo Tiempo.',
    updated_at   = now()
from seasons s
where e.season_id = s.id
  and s.num = 4
  and e.num = 7;

-- 2b) T4 · ep7 SI NO EXISTE → lo crea al final (sin video/thumb, listo para editar).
insert into episodes (season_id, num, title, description, sort_order)
select s.id,
       7,
       'El Mensaje Primordial',
       'La memoria solar se resume en una verdad: recordar, perdonar, servir y preparar el Nuevo Tiempo.',
       7
from seasons s
where s.num = 4
  and not exists (
    select 1 from episodes e where e.season_id = s.id and e.num = 7
  );

-- 3) Re-sincroniza el contador del encabezado con la cantidad REAL de episodios.
update seasons s
set episodes = sub.cnt
from (
  select season_id, count(*)::int as cnt
  from episodes
  group by season_id
) sub
where s.id = sub.season_id
  and s.num in (1, 2, 3, 4)
  and s.episodes is distinct from sub.cnt;

commit;

-- 4) VERIFICACIÓN — revisar que no haya descripciones vacías ni títulos raros.
select s.num                              as temporada,
       s.name                             as nombre,
       s.episodes                         as header_count,
       e.num                              as ep,
       e.title                            as titulo,
       coalesce(nullif(trim(e.description), ''), '⚠ VACÍA') as descripcion
from seasons s
join episodes e on e.season_id = s.id
where s.num in (1, 2, 3, 4)
order by s.num, e.num;
