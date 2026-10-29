-- ════════════════════════════════════════════════════════════════════════════
--  RETIRAR UN COMUNICADO INTERNO · deja de salir, ya
-- ════════════════════════════════════════════════════════════════════════════
--
-- Esto se corre cuando haga falta, no una sola vez. No depende de ninguna
-- migración ni hay que correrlo en orden.
--
-- ── QUÉ HACE ───────────────────────────────────────────────────────────────
-- Le quita la fecha de publicación. La consulta que enseña los comunicados al
-- miembro exige que esa fecha exista, así que sin ella deja de aparecer:
--
--   · no sale en el centro de avisos
--   · no interrumpe a nadie más
--   · deja de contar como no leído
--
-- Efecto inmediato. No hace falta desplegar nada.
--
-- ── LO QUE NO HACE ─────────────────────────────────────────────────────────
-- NO borra la comunicación: el texto se queda y vuelve a ser un borrador que
-- se puede editar y volver a publicar.
--
-- NO deshace lo que ya pasó. Quien lo abrió, lo abrió; quien cerró la ventana
-- que interrumpe, la cerró, y su marca de leído sigue ahí. Retirar algo no es
-- hacer que no hubiera ocurrido.
--
-- ── Y POR QUÉ NO SE BORRAN LAS MARCAS DE LECTURA ──────────────────────────
-- Porque si se borraran y luego se volviera a publicar, la ventana que
-- interrumpe le saldría OTRA VEZ a quien ya la cerró. Esas marcas son lo
-- único que impide que un aviso de «una sola vez» salga dos.

-- ── 1 · MIRAR QUÉ HAY PUBLICADO ────────────────────────────────────────────

select
  id,
  coalesce(nullif(interno_titulo, ''), heading, subject, '(sin título)') as titulo,
  display_mode,
  to_char(published_at, 'DD/MM/YYYY HH24:MI')                           as publicado,
  case
    when interno_destinatarios is null then 'TODO EL MUNDO'
    else array_length(interno_destinatarios, 1)::text || ' personas'
  end                                                                   as llega_a,
  (select count(*) from public.communication_reads r
    where r.communication_id = communications.id)                       as lo_abrieron
from public.communications
where 'interno' = any(canales)
  and published_at is not null
order by published_at desc;


-- ── 2 · RETIRAR UNO EN CONCRETO ────────────────────────────────────────────
--
-- Copia el `id` de arriba y pégalo aquí. Es lo más seguro: se retira
-- exactamente el que se ha mirado.

-- update public.communications
-- set published_at = null
-- where id = 'PEGA-AQUÍ-EL-ID';


-- ── 3 · RETIRAR TODAS LAS PRUEBAS DE GOLPE ─────────────────────────────────
--
-- Para cuando lo publicado son pruebas y no hay nada que conservar.
--
-- ⚠ Esto retira TODOS los comunicados internos publicados. Mira primero la
--   consulta de arriba: si ahí sale algo que sí quieres que siga viéndose,
--   usa el punto 2 y retíralos uno a uno.
--
-- Va comentado a propósito. Quítale los guiones para correrlo.

-- update public.communications
-- set published_at = null
-- where 'interno' = any(canales)
--   and published_at is not null;


-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────
-- Después de retirar, esto tiene que dar 0.

select count(*) as siguen_publicados
from public.communications
where 'interno' = any(canales)
  and published_at is not null;
