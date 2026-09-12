-- ============================================================================
-- VERIFICACION DEL ARCHIVO VIVO
-- Solo lee. No modifica nada. Pegar entero en el SQL Editor de Supabase.
-- Esperado: 106 transmisiones en 11 categorias, y 'memoria-origen' ya borrada.
-- ============================================================================

-- 1) Total cargado  ─ esperado: 106
select count(*) as total_transmisiones from public.transmissions;

-- 2) Reparto por categoria  ─ esperado: 11 filas, ninguna con 0
select
  c.sort_order            as orden,
  c.name                  as categoria,
  count(t.id)             as transmisiones
from public.transmission_categories c
left join public.transmissions t on t.category = c.slug
group by c.sort_order, c.name
order by c.sort_order;

-- 3) La categoria retirada  ─ esperado: 0 filas
select slug, name from public.transmission_categories where slug = 'memoria-origen';

-- 4) Las ultimas de cada categoria nueva  ─ esperado: 'ok' en las 6
select v.slug,
       case when t.id is null then 'FALTA' else 'ok' end as estado
from (values ('karma'),('catastrofe'),('muerte'),('profecias'),('cristo'),('144000')) as v(slug)
left join public.transmissions t on t.slug = v.slug;

-- 5) Etapas de lectura  ─ esperado: 0 filas (todas deben tener 8)
select slug, coalesce(array_length(stages, 1), 0) as n_stages
from public.transmissions
where coalesce(array_length(stages, 1), 0) <> 8
order by slug;
