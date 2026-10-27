-- ════════════════════════════════════════════════════════════════════════════
--  CENTRO DE ORGANIZACIÓN · 3 de 3 · resultados y plan mensual
-- ════════════════════════════════════════════════════════════════════════════
--
-- ── TODO SE ESCRIBE A MANO, Y ESO ES UNA DECISIÓN ──────────────────────────
-- No hay ninguna conexión con Instagram, Meta ni nada parecido. Los números
-- los copia una persona una vez por semana.
--
-- Parece un atajo y no lo es: una integración con una API ajena es una cosa
-- que se rompe sola —cambian los permisos, caduca un token, cambian el
-- nombre de una métrica— y el día que se rompe nadie se entera hasta que
-- alguien mira un gráfico vacío. Copiar siete números una vez por semana
-- cuesta dos minutos y no se rompe nunca.
--
-- ── Y TODOS LOS CAMPOS SON OPCIONALES ──────────────────────────────────────
-- Porque la semana que no haya un dato no lo hay. Obligar a rellenarlo
-- llevaría a escribir un cero, y un cero no significa «no lo sé»: significa
-- «no pasó nada». Son cosas distintas y mezclarlas estropea cualquier
-- comparación posterior.

begin;

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  1 · LOS NÚMEROS                                                     ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create table if not exists public.mkt_metricas (
  id uuid primary key default gen_random_uuid(),

  -- ── EL PERIODO ES SIEMPRE UN LUNES ──────────────────────────────────────
  -- Así «la semana del 2» es un valor y no un rango que haya que comparar.
  -- Dos filas de la misma semana no pueden referirse a semanas distintas.
  periodo date not null,

  -- ── UNA FILA POR SEMANA, O UNA POR PUBLICACIÓN ──────────────────────────
  -- Nulo: es el resumen de la semana entera.
  -- Con valor: son los números de ESA publicación concreta.
  --
  -- Las dos cosas conviven porque las dos preguntas existen: «¿cómo fue la
  -- semana?» y «¿qué reel funcionó mejor?».
  actividad_id uuid references public.mkt_actividades(id) on delete set null,

  -- ── REDES ───────────────────────────────────────────────────────────────
  -- Todos nulos a propósito. Ver la cabecera.
  alcance integer,
  visualizaciones integer,
  me_gusta integer,
  comentarios integer,
  compartidos integer,
  guardados integer,
  nuevos_seguidores integer,

  -- ── LA COMUNIDAD ────────────────────────────────────────────────────────
  contenidos_publicados integer,
  interacciones integer,

  -- ── CORREO Y AVISOS ─────────────────────────────────────────────────────
  -- La apertura y los clics del correo los da Resend y ya se guardan en
  -- `communications.metrics`; esto es para anotarlos juntos con lo demás
  -- cuando se hace la revisión semanal, no para sustituir aquello.
  correos_enviados integer,
  tasa_apertura numeric(5, 2),
  clics integer,
  notificaciones_enviadas integer,

  -- ── LAS CUATRO PREGUNTAS ────────────────────────────────────────────────
  -- Esto vale más que los números, y por eso está en la misma fila: lo que
  -- se aprende de una semana no es el alcance, es por qué fue ese alcance.
  que_funciono text not null default '',
  que_interes text not null default '',
  que_repetir text not null default '',
  que_mejorar text not null default '',

  observaciones text not null default '',

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── UNA SOLA FILA DE RESUMEN POR SEMANA ───────────────────────────────────
-- Sin esto, abrir dos veces la pantalla y guardar crearía dos resúmenes de la
-- misma semana, y la comparación entre semanas contaría doble sin avisar.
--
-- El índice es PARCIAL —solo donde no hay actividad— porque de una misma
-- publicación sí puede haber varias anotaciones si hace falta.
create unique index if not exists mkt_metricas_semana_idx
  on public.mkt_metricas (periodo)
  where actividad_id is null;

create index if not exists mkt_metricas_periodo_idx
  on public.mkt_metricas (periodo desc);

alter table public.mkt_metricas enable row level security;

drop trigger if exists mkt_metricas_updated_at on public.mkt_metricas;
create trigger mkt_metricas_updated_at
  before update on public.mkt_metricas
  for each row execute function public.mkt_tocar_updated_at();

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  2 · EL PLAN DEL MES                                                 ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- La hoja de la reunión mensual: qué queremos, qué acordamos y con qué
-- frecuencia trabajamos.
create table if not exists public.mkt_plan (
  -- El día 1 del mes. Es la clave: un mes, un plan.
  mes date primary key,

  objetivos text not null default '',
  prioridades text not null default '',
  -- Lo que se decidió en la reunión. Es lo que se consulta tres semanas
  -- después cuando nadie recuerda por qué se acordó algo.
  acuerdos text not null default '',
  observaciones text not null default '',

  -- ── LAS FRECUENCIAS, EDITABLES ──────────────────────────────────────────
  -- [{ "categoria": "reel", "cantidad": 3, "cada": "semana", "responsable_id": null }]
  --
  -- Son metas, no publicaciones automáticas. De aquí sale la propuesta de
  -- calendario del mes: se cuenta lo que ya hay y se crea solo lo que falta,
  -- nunca duplicando lo existente.
  frecuencias jsonb not null default '[]'::jsonb,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mkt_plan enable row level security;

drop trigger if exists mkt_plan_updated_at on public.mkt_plan;
create trigger mkt_plan_updated_at
  before update on public.mkt_plan
  for each row execute function public.mkt_tocar_updated_at();

commit;

-- ════════════════════════════════════════════════════════════════════════════
--  LAS FRECUENCIAS DE PARTIDA
-- ════════════════════════════════════════════════════════════════════════════
-- Las del encargo, para el mes en curso. Son EDITABLES desde la pantalla: lo
-- que se guarda aquí es un punto de partida, no una regla.
--
-- Telegram, ManyChat, publicidad y embudo no están, y es a propósito: son
-- del propietario y no entran en el checklist de Regi.
insert into public.mkt_plan (mes, frecuencias)
values (
  date_trunc('month', current_date)::date,
  '[
    {"categoria": "reel",               "cantidad": 3, "cada": "semana"},
    {"categoria": "carrusel",           "cantidad": 2, "cada": "semana"},
    {"categoria": "historias",          "cantidad": 5, "cada": "semana"},
    {"categoria": "guion",              "cantidad": 5, "cada": "semana"},
    {"categoria": "contenido_miembros", "cantidad": 1, "cada": "semana"},
    {"categoria": "correo",             "cantidad": 1, "cada": "semana"},
    {"categoria": "notificacion",       "cantidad": 1, "cada": "semana"},
    {"categoria": "comunidad",          "cantidad": 2, "cada": "semana"},
    {"categoria": "resultados",         "cantidad": 1, "cada": "semana"},
    {"categoria": "transmision",        "cantidad": 1, "cada": "mes"},
    {"categoria": "reunion",            "cantidad": 1, "cada": "mes"}
  ]'::jsonb
)
on conflict (mes) do nothing;

-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.tables
    where table_schema='public' and table_name='mkt_metricas')  as tabla_metricas,
  (select count(*) from information_schema.tables
    where table_schema='public' and table_name='mkt_plan')      as tabla_plan,
  (select count(*) from public.mkt_plan)                        as meses_con_plan,
  (select jsonb_array_length(frecuencias) from public.mkt_plan
    where mes = date_trunc('month', current_date)::date)        as frecuencias_del_mes;

-- Las dos primeras tienen que dar 1, y `frecuencias_del_mes` 11.

-- ── CÓMO DESHACERLO ────────────────────────────────────────────────────────
--   drop table if exists public.mkt_metricas;
--   drop table if exists public.mkt_plan;
