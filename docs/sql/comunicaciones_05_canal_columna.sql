-- ════════════════════════════════════════════════════════════════════════════
--  LA COLUMNA `canal` TAMBIÉN TIENE QUE CONOCER LOS CUATRO
-- ════════════════════════════════════════════════════════════════════════════
--
-- Corre esto DESPUÉS de `comunicaciones_04_mensaje_directo.sql`.
-- Es una línea. Tarda nada.
--
-- ── QUÉ PASABA ─────────────────────────────────────────────────────────────
-- «No se pudo crear la comunicación», en «Dentro de la plataforma» y en
-- «Mensajes directos». Las dos.
--
-- ── POR QUÉ ────────────────────────────────────────────────────────────────
-- Hay DOS columnas que dicen por dónde sale una comunicación:
--
--   `canales text[]`  la lista, que es la que manda desde que hay cuatro
--   `canal text`      el valor único de antes, que se sigue rellenando
--
-- Al añadir los canales nuevos actualicé la restricción de `canales` —dos
-- veces, una por migración— y nunca la de `canal`, que seguía diciendo:
--
--   check (canal in ('email', 'push'))
--
-- Así que la fila se rechazaba al insertarla. Y el panel enseñaba «No se pudo
-- crear la comunicación», que es verdad y no sirve de nada.
--
-- ── LA LECCIÓN, PORQUE ES LA TERCERA VEZ ───────────────────────────────────
-- Dos columnas para el mismo hecho se desincronizan. Lo escribí yo mismo en
-- el comentario de la primera migración —«por donde va esto se contesta
-- mirando dos sitios»— y luego mantuve una sola de las dos.
--
-- `canal` NO se borra ahora: hay código desplegado que lo lee, y quitarlo en
-- caliente cambia un fallo por otro. Pero queda anotado abajo como deuda.

begin;

alter table public.communications
  drop constraint if exists communications_canal_valido;

alter table public.communications
  add constraint communications_canal_valido
  check (canal in ('email', 'push', 'interno', 'dm'));

commit;


-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────

select
  pg_get_constraintdef(oid) like '%''dm''%'       as ok_dm,
  pg_get_constraintdef(oid) like '%''interno''%'  as ok_interno
from pg_constraint
where conname = 'communications_canal_valido'
  and conrelid = 'public.communications'::regclass;

-- Las dos tienen que dar true.


-- ════════════════════════════════════════════════════════════════════════════
--  DEUDA ANOTADA · NO CORRER AHORA
-- ════════════════════════════════════════════════════════════════════════════
--
-- Cuando no quede nada leyendo `canal` —hoy sigue habiendo— se puede quitar
-- la columna y quedarse solo con la lista, que es la única que debería haber
-- existido desde que hubo más de un canal:
--
--   drop trigger if exists communications_canales_trg on public.communications;
--   drop function if exists public.mkt_canales_desde_canal();
--   alter table public.communications drop constraint if exists communications_canal_valido;
--   drop index if exists communications_canal_idx;
--   alter table public.communications drop column if exists canal;
--
-- Antes de correr eso: `grep -rn "canal\b" app/ lib/` y comprobar que no
-- queda ninguna lectura. Mientras haya una, esto rompe producción.
