-- ════════════════════════════════════════════════════════════════════════════
--  FUERA «PROTOCOLO», Y EL ACUERDO COMO SE HABLÓ
-- ════════════════════════════════════════════════════════════════════════════
--
-- Corre esto DESPUÉS de `marketing_05_categorias.sql`.
--
-- ── QUÉ CAMBIA ─────────────────────────────────────────────────────────────
--
--   SE VA  `protocolo`
--          «Protocolo de contacto» era una categoría que no significaba nada
--          para quien tiene que usar el calendario. Lo que había los jueves
--          bajo ese nombre es atender el área de miembros, así que ahí va.
--
--   EL ACUERDO queda como se habló: reels, carruseles, historias, correos,
--   notificaciones, Telegram, área de miembros, revisión de resultados,
--   reuniones y la transmisión de José María. Nada más.
--
-- ── «ÁREA DE MIEMBROS» SON SEIS, NO CINCO ──────────────────────────────────
-- Eran cinco más el jueves de «protocolo». Al fundirlos son seis, y el
-- acuerdo dice seis: el número sale de lo que de verdad hay en la semana
-- tipo, no de una cifra escrita aparte que luego nadie cuadra.

begin;

-- ── 1 · MOVER LO QUE HAY ───────────────────────────────────────────────────
update public.mkt_actividades
set categoria = 'administracion'
where categoria = 'protocolo';

-- ── 2 · LA LISTA SIN ÉL ────────────────────────────────────────────────────
alter table public.mkt_actividades
  drop constraint if exists mkt_actividades_categoria_check;

alter table public.mkt_actividades
  add constraint mkt_actividades_categoria_check check (categoria in (
    -- Lo que se publica fuera
    'reel', 'carrusel', 'historias',

    -- La plataforma por dentro
    'administracion',

    -- Lo que se envía
    'correo', 'notificacion', 'telegram',

    -- El directo del mes
    'transmision',

    -- Trabajo interno
    'reunion', 'resultados', 'otra',

    -- El cielo. No se elige a mano: lo pone `npm run efemerides`.
    'luna', 'zodiaco', 'estacion', 'portal', 'efemeride'
  ));

-- ── 3 · EL ACUERDO ─────────────────────────────────────────────────────────
-- En el mismo orden en que se habla de ello en la reunión.

update public.mkt_plan
set frecuencias = '[
  {"categoria": "reel",           "cantidad": 3, "cada": "semana"},
  {"categoria": "carrusel",       "cantidad": 2, "cada": "semana"},
  {"categoria": "historias",      "cantidad": 3, "cada": "semana"},
  {"categoria": "correo",         "cantidad": 1, "cada": "semana"},
  {"categoria": "notificacion",   "cantidad": 1, "cada": "semana"},
  {"categoria": "telegram",       "cantidad": 3, "cada": "semana"},
  {"categoria": "administracion", "cantidad": 6, "cada": "semana"},
  {"categoria": "resultados",     "cantidad": 1, "cada": "semana"},
  {"categoria": "reunion",        "cantidad": 1, "cada": "semana"},
  {"categoria": "transmision",    "cantidad": 1, "cada": "mes"}
]'::jsonb;

-- ── 4 · LOS NOMBRES INVENTADOS ─────────────────────────────────────────────
--
-- La tanda anterior creó actividades con títulos propuestos —«Reel de
-- atracción», «Historias interactivas»— y eso se lee como una decisión que
-- nadie tomó. Las que nadie ha tocado vuelven a llamarse como su categoría;
-- las que alguien ya cambió, o a las que puso notas, responsable o checklist,
-- no se tocan: ahí sí hay una decisión detrás.

update public.mkt_actividades a
set titulo = c.nombre
from (values
  ('reel',           'Reel'),
  ('carrusel',       'Carrusel'),
  ('historias',      'Historias'),
  ('administracion', 'Área de miembros'),
  ('correo',         'Correo'),
  ('notificacion',   'Notificación'),
  ('telegram',       'Telegram'),
  ('transmision',    'Transmisión'),
  ('reunion',        'Reunión'),
  ('resultados',     'Revisión de resultados'),
  ('otra',           'Otra')
) as c(categoria, nombre)
where a.categoria = c.categoria
  and not a.es_referencia
  and a.estado = 'pendiente'
  and a.responsable_id is null
  and coalesce(a.notas, '') = ''
  and coalesce(jsonb_array_length(a.checklist), 0) = 0
  and coalesce(jsonb_array_length(a.enlaces), 0) = 0
  and a.titulo in (
    -- Los que puso el generador, y solo esos.
    'Por definir',
    'Reel de atracción', 'Reel de misterio', 'Reel de pertenencia',
    'Carrusel de conocimiento', 'Carrusel de comunidad',
    'Historias interactivas', 'Historias y conversión', 'Historias / resumen',
    'Publicar enseñanza exclusiva', 'Moderación y respuestas',
    'Seguimiento de miembros', 'Revisión de comentarios',
    'Actividad comunitaria', 'Práctica o protocolo',
    'Notificación de nuevo contenido', 'Email semanal',
    'Participación en Telegram', 'Activación en Telegram',
    'Planificar próxima semana', 'Transmisión de José María',
    'Atender el área de miembros', 'Correo a la comunidad',
    'Mensaje en Telegram', 'Reunión de equipo'
  );

commit;

-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────

select categoria, count(*) as actividades, count(distinct titulo) as nombres
from public.mkt_actividades
where not es_referencia
group by categoria
order by count(*) desc;

select
  not exists (select 1 from public.mkt_actividades where categoria = 'protocolo')
                                                           as ok_sin_protocolo,
  (select jsonb_array_length(frecuencias) from public.mkt_plan
    where mes = date_trunc('month', current_date)::date)   as frecuencias_del_mes;

-- `ok_sin_protocolo` tiene que dar true y `frecuencias_del_mes` 10.
-- Si sale nulo, es que el mes en curso todavía no tiene plan: se crea solo
-- al guardar desde la pantalla.
