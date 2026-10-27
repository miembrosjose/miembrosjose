-- ════════════════════════════════════════════════════════════════════════════
--  LAS CATEGORÍAS, COMO SE HABLA DE ELLAS DE VERDAD
-- ════════════════════════════════════════════════════════════════════════════
--
-- Corre esto ANTES que `marketing_04_efemerides.sql`: ese mete filas de las
-- categorías nuevas, y sin este archivo la tabla las rechaza.
--
-- ── QUÉ CAMBIA ─────────────────────────────────────────────────────────────
--
--   SE VA   `guion`
--           Un guion no es una actividad aparte: es parte de hacer un reel,
--           un carrusel o unas historias. Tenerlo suelto obligaba a crear dos
--           cosas para una sola, y a que el reparto de la semana contara el
--           doble de trabajo del que hay.
--
--   SE VA   `contenido_miembros` y `comunidad`  →  `administracion`
--           Las dos eran «atender el área de miembros». Se funden en una.
--
--   LLEGA   `telegram`
--           Estaba pasando por `notificacion`, que es otra cosa: una se manda
--           desde Comunicaciones y la otra se escribe en el grupo.
--
--   LLEGAN  `luna`, `zodiaco`, `estacion`, `portal`
--           Para que el cielo tenga su propio color en el calendario y no se
--           confunda con el trabajo. Entran como referencia, así que no
--           cuentan para el cumplimiento.
--
-- ── LO QUE NO SE PIERDE ────────────────────────────────────────────────────
-- Nada se borra. Las actividades de las categorías que desaparecen se MUEVEN
-- a la que las sustituye. Lo que estaba en `guion` pasa a `otra`, que es
-- donde se ve sin estorbar; si eran huecos del generador, se borran luego con
-- un botón desde la pantalla.

begin;

-- ── 1 · MOVER LO QUE HAY ───────────────────────────────────────────────────
-- Antes de tocar la restricción, porque si no la restricción nueva no deja
-- que existan las filas viejas.

update public.mkt_actividades set categoria = 'administracion'
where categoria in ('contenido_miembros', 'comunidad');

update public.mkt_actividades set categoria = 'otra'
where categoria = 'guion';

-- ── 2 · LA LISTA NUEVA ─────────────────────────────────────────────────────

alter table public.mkt_actividades
  drop constraint if exists mkt_actividades_categoria_check;

alter table public.mkt_actividades
  add constraint mkt_actividades_categoria_check check (categoria in (
    -- Lo que se publica fuera
    'reel', 'carrusel', 'historias',

    -- El área de miembros, que es una sola cosa: atenderla
    'administracion',

    -- Lo que se ENVÍA. Correo y notificación salen de Comunicaciones;
    -- Telegram se escribe a mano en el grupo, y por eso va aparte.
    'correo', 'notificacion', 'telegram',

    -- En vivo
    'transmision', 'protocolo',

    -- Trabajo interno
    'reunion', 'resultados', 'otra',

    -- ── EL CIELO ──────────────────────────────────────────────────────────
    -- Todas estas entran con `es_referencia`. No son trabajo de nadie: son
    -- el contexto del que se parte al planificar la semana.
    'luna',       -- llenas y nuevas
    'zodiaco',    -- el Sol entrando en un signo
    'estacion',   -- equinoccios y solsticios
    'portal',     -- 8·8 y los demás días de dígitos repetidos
    'efemeride'   -- cualquier otra, a mano
  ));

-- ── 3 · LO QUE SE ACUERDA HACER CADA SEMANA ────────────────────────────────
--
-- Esto es el ACUERDO —cuánto de cada cosa—, no el calendario. El calendario
-- lo arma el generador con la plantilla que vive en el código, que además
-- le pone nombre y día a cada actividad.
--
-- `guion`, `contenido_miembros` y `comunidad` salen de aquí: las dos primeras
-- ya no existen y la tercera es parte de `administracion`.

update public.mkt_plan
set frecuencias = '[
  {"categoria": "reel",           "cantidad": 3, "cada": "semana"},
  {"categoria": "carrusel",       "cantidad": 2, "cada": "semana"},
  {"categoria": "historias",      "cantidad": 3, "cada": "semana"},
  {"categoria": "correo",         "cantidad": 1, "cada": "semana"},
  {"categoria": "notificacion",   "cantidad": 1, "cada": "semana"},
  {"categoria": "telegram",       "cantidad": 3, "cada": "semana"},
  {"categoria": "administracion", "cantidad": 5, "cada": "semana"},
  {"categoria": "protocolo",      "cantidad": 1, "cada": "semana"},
  {"categoria": "resultados",     "cantidad": 1, "cada": "semana"},
  {"categoria": "reunion",        "cantidad": 1, "cada": "semana"},
  {"categoria": "transmision",    "cantidad": 1, "cada": "mes"}
]'::jsonb;

commit;

-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────

select categoria, count(*) as actividades
from public.mkt_actividades
group by categoria
order by count(*) desc;

-- No puede salir ninguna fila con `guion`, `contenido_miembros` ni
-- `comunidad`. Si sale alguna, la migración no llegó a correr entera.

select
  not exists (
    select 1 from public.mkt_actividades
    where categoria in ('guion', 'contenido_miembros', 'comunidad')
  )                                                        as ok_sin_categorias_viejas,
  (select jsonb_array_length(frecuencias) from public.mkt_plan
    where mes = date_trunc('month', current_date)::date)   as frecuencias_del_mes;

-- `frecuencias_del_mes` tiene que dar 11. Si da nulo, es que el mes en curso
-- todavía no tiene plan: se crea solo al guardar desde la pantalla.
