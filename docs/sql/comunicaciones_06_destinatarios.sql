-- ════════════════════════════════════════════════════════════════════════════
--  UN COMUNICADO INTERNO SOLO LO VE A QUIEN VA
-- ════════════════════════════════════════════════════════════════════════════
--
-- Corre esto DESPUÉS de `comunicaciones_05_canal_columna.sql`.
--
-- ⚠ ESTO ARREGLA UN FALLO DE PRIVACIDAD. Léelo.
--
-- ── QUÉ PASABA ─────────────────────────────────────────────────────────────
-- Un comunicado dentro de la plataforma se publicaba con una audiencia —«solo
-- a Regi»— y lo veía TODO EL MUNDO. La consulta que lo enseña al miembro
-- comprobaba tres cosas: que fuera interno, que estuviera publicado, y el
-- corte por fecha de alta. La audiencia, no. Ninguna.
--
-- ── POR QUÉ ────────────────────────────────────────────────────────────────
-- Cuando lo escribí, lo interno no tenía selector de audiencia: iba a todos
-- por definición, y el único recorte era el corte por fecha. Lo dejé así a
-- propósito y lo anoté como «quien pueda llamar a esto ya es miembro».
--
-- Después añadí el selector de audiencia —el mismo del correo— y no volví a
-- esa consulta. El panel dejaba elegir a quién, y la plataforma lo enseñaba a
-- todos igual.
--
-- ── CÓMO SE ARREGLA SIN CREAR UNA FILA POR PERSONA ────────────────────────
-- Al publicar se resuelve la audiencia UNA vez y se guardan los
-- identificadores en una columna de la propia comunicación. Sigue siendo una
-- fila para todos: lo que se guarda es a quién, no una copia por cabeza.
--
--   NULL   va a todo el mundo. Es lo que significaba antes, y es lo que
--          siguen siendo las que ya están publicadas.
--   lista  solo estas personas.
--
-- ── POR QUÉ SE CONGELA AL PUBLICAR Y NO SE RECALCULA ──────────────────────
-- Porque un comunicado publicado es un hecho con fecha. Si la audiencia se
-- volviera a resolver en cada visita, alguien que terminara la temporada 2
-- mañana empezaría a ver un aviso de hace un mes dirigido a quien ya la había
-- terminado entonces. Y al revés: quien se diera de baja de un rol dejaría de
-- ver algo que sí le llegó.
--
-- Es la misma decisión que `audiencia_hasta`: lo que vale es el estado en el
-- momento de publicar.

begin;

alter table public.communications
  add column if not exists interno_destinatarios uuid[];

comment on column public.communications.interno_destinatarios is
  'A quién llega el comunicado interno. NULL = a todo el mundo. '
  'Se resuelve UNA vez al publicar y no se recalcula.';

-- La consulta del miembro pregunta «¿está mi identificador en esta lista?».
-- Sin índice GIN eso recorre la tabla entera en cada carga de página.
create index if not exists communications_interno_destinatarios_idx
  on public.communications using gin (interno_destinatarios);

commit;


-- ════════════════════════════════════════════════════════════════════════════
--  LO QUE YA ESTABA PUBLICADO
-- ════════════════════════════════════════════════════════════════════════════
--
-- Se queda en NULL, o sea «a todo el mundo», que es exactamente lo que era
-- antes de este arreglo. No se toca nada retroactivamente: cambiar a quién
-- llegó algo que ya llegó no deshace que llegara.
--
-- ⚠ LAS PRUEBAS QUE HICISTE SIGUEN VIÉNDOSE POR TODOS. Para quitarlas, borra
--   esas comunicaciones desde el panel y vuelve a publicarlas si hacen falta.
--   Esta consulta te dice cuáles son:

select
  id,
  coalesce(nullif(interno_titulo, ''), heading, subject, '(sin título)') as titulo,
  display_mode,
  published_at,
  case
    when interno_destinatarios is null then 'TODO EL MUNDO'
    else array_length(interno_destinatarios, 1)::text || ' personas'
  end as llega_a
from public.communications
where 'interno' = any(canales)
  and published_at is not null
order by published_at desc;


-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────

select
  exists (select 1 from information_schema.columns
    where table_schema='public' and table_name='communications'
      and column_name='interno_destinatarios')            as ok_columna,

  exists (select 1 from pg_indexes
    where schemaname='public'
      and indexname='communications_interno_destinatarios_idx') as ok_indice;

-- Las dos tienen que dar true.


-- ════════════════════════════════════════════════════════════════════════════
--  ¿QUIÉN LLEGÓ A VERLO DE VERDAD?
-- ════════════════════════════════════════════════════════════════════════════
--
-- «Visible para todos» no es «lo vieron todos». Solo lo vio quien entrara a
-- la plataforma después de publicarlo, y eso queda registrado: cada vez que
-- alguien abre o cierra un comunicado se escribe una fila en
-- `communication_reads`.
--
-- Esto no cambia nada. Contesta quién lo abrió, quién pulsó el botón y quién
-- cerró la ventana, por nombre.
--
-- ── CÓMO SE LEE LA COLUMNA `via` ───────────────────────────────────────────
--   abierta   lo abrió desde el centro de avisos
--   cerrada   cerró la ventana que interrumpe
--   cta       pulsó el botón

select
  coalesce(nullif(c.interno_titulo, ''), c.heading, c.subject, '(sin título)') as comunicado,
  to_char(c.published_at, 'DD/MM/YYYY HH24:MI')                               as publicado,
  coalesce(p.full_name, u.email)                                              as quien,
  r.via,
  to_char(r.read_at, 'DD/MM/YYYY HH24:MI')                                    as cuando
from public.communication_reads r
join public.communications c on c.id = r.communication_id
join auth.users u            on u.id = r.user_id
left join public.profiles p  on p.id = r.user_id
where 'interno' = any(c.canales)
order by c.published_at desc, r.read_at;

-- Sin filas = no lo abrió nadie. Estuvo visible y nadie entró a mirarlo.
--
-- ⚠ OJO: esto registra a quien lo ABRIÓ. Un comunicado que espera en los
--   avisos y que nadie tocó no deja rastro, pero su titular SÍ se vio en la
--   campana. Para esos, lo que estuvo a la vista es el título, no el texto.
