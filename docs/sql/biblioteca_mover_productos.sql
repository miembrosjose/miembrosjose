-- ============================================================================
-- SECCIÓN «BIBLIOTECA» — mover dos productos  [EJECUTAR UNA VEZ]
-- ============================================================================
--
-- QUÉ HACE
--   Cambia la sección de «Protocolo de Contacto» y «Sanación Extraterrestre»
--   de «Recursos de los 144000» a la nueva «Biblioteca». Nada más: ni precios,
--   ni portadas, ni accesos.
--
-- POR QUÉ LA CATEGORÍA SE LLAMA 'libreria' Y LA SECCIÓN «Biblioteca»
--   Porque 'biblioteca' ya estaba cogida: es la categoría de la sección que de
--   cara a quien mira se llama «Recursos de los 144000». Renombrar aquella
--   obligaría a tocar todos los productos ya cargados y los enlaces guardados.
--   Los dos nombres cruzados son feos; migrar la categoría entera, peor.
--
-- QUÉ NO SE MUEVE
--   · «Razas Primarias» se queda en Recursos.
--   · «Niño Interior» y todo lo demás de la Tienda no se toca.
--
-- CÓMO APLICARLO
--   Supabase → SQL Editor → pega todo → Run. Es idempotente.
-- ============================================================================


-- ── PASO 1 · Qué hay antes ──────────────────────────────────────────────────
select num, name, category
from public.products
where num in (93, 94, 95)
   or lower(name) like '%protocolo de contacto%'
   or lower(name) like '%sanaci%extraterrestre%'
order by num;


-- ── PASO 2 · Mover ──────────────────────────────────────────────────────────
-- Se localizan por `num` —94 y 95, estables desde que las creó el sembrador—
-- y también por nombre, por si alguna se creó a mano con otro número.
update public.products
   set category = 'libreria'
 where category is distinct from 'libreria'
   and (
     num in (94, 95)
     or lower(name) like '%protocolo de contacto%'
     or lower(name) like '%sanaci%extraterrestre%'
   );


-- ── PASO 3 · Cómo quedó ─────────────────────────────────────────────────────
-- Las dos deben aparecer con category = 'libreria'. Razas Primarias sigue en
-- 'biblioteca'.
select num, name, category
from public.products
where num in (93, 94, 95)
   or category = 'libreria'
order by category, num;
