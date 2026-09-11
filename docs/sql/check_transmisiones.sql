-- ============================================================================
-- VERIFICACIÓN — qué transmisiones están cargadas y cuáles faltan.
-- Solo lee. No modifica nada.
-- Pegar en Supabase → SQL Editor → Run.
-- ============================================================================

-- 1) Total cargado (debería ser 72 cuando esté todo al día).
select count(*) as total_cargadas
from public.transmissions
where is_mock = false;

-- 2) Conteo por categoría.
select category, count(*) as n
from public.transmissions
where is_mock = false
group by category
order by n desc;

-- 3) Cuáles de las últimas 11 YA están y cuáles FALTAN.
with esperadas(slug) as (
  values
    ('percepcion'), ('dualidad'), ('holograma'), ('red'), ('proyeccion'),
    ('simulacion'), ('matrix'), ('observador'), ('unidad'), ('separacion'),
    ('tiempo')
)
select
  e.slug,
  case when t.slug is null then 'FALTA' else 'ok' end as estado
from esperadas e
left join public.transmissions t
  on t.slug = e.slug and t.is_mock = false
order by estado, e.slug;
