-- ════════════════════════════════════════════════════════════════════════════
--  EL CUARTO CANAL · mensaje directo
-- ════════════════════════════════════════════════════════════════════════════
--
-- Corre esto DESPUÉS de `comunicaciones_03_internas.sql`.
--
-- Es pequeño: una lista de valores permitidos que crece en uno.
--
-- ── LAS CUATRO FORMAS DE COMUNICAR, Y EN QUÉ SE DIFERENCIAN ───────────────
--
--   email     Llega a la bandeja de entrada. Depende de que no se haya dado
--             de baja y de que el correo no caiga en promociones.
--
--   push      Suena en el móvil. Depende de que haya dado permiso al
--             navegador y de que tenga la aplicación instalada.
--
--   interno   Espera dentro de la plataforma. No depende de nada. UNA fila
--             para todo el mundo: nadie recibe una copia.
--
--   dm        Un mensaje privado de verdad, en la bandeja de mensajes, con
--             su conversación y su respuesta.
--
-- ── POR QUÉ `dm` NO PODÍA SER `interno` CON OTRO NOMBRE ───────────────────
-- Porque son cosas distintas en lo que de verdad importa: lo interno es un
-- tablón —una fila que mucha gente lee— y un mensaje directo es correo
-- privado: una fila POR PERSONA, en una conversación donde se puede
-- responder.
--
-- Esa diferencia no es de presentación. A un comunicado no se le contesta; a
-- un mensaje, sí, y esa respuesta llega a la bandeja de quien lo mandó.
--
-- ── Y POR QUÉ ESTE SÍ CREA UNA FILA POR PERSONA ───────────────────────────
-- Es la excepción deliberada al principio de «una fila, muchos lectores». No
-- es una copia de un anuncio: es una conversación con cada uno, que sigue
-- existiendo después y en la que cada persona escribe lo suyo.
--
-- Por eso lleva tope, y por eso el panel avisa de cuántas va a crear antes de
-- crearlas.

begin;

alter table public.communications
  drop constraint if exists communications_canales_validos;

alter table public.communications
  add constraint communications_canales_validos check (
    coalesce(array_length(canales, 1), 0) >= 1
    and canales <@ array['email', 'push', 'interno', 'dm']::text[]
  );

-- ── EL TEXTO DEL MENSAJE ───────────────────────────────────────────────────
--
-- Aparte del cuerpo del correo, porque no se escribe igual: un mensaje
-- privado se lee en una burbuja de chat, sin titular, sin botón y sin pie.
-- Un párrafo de correo ahí dentro se ve como un muro.
--
-- Admite nulo y cae al cuerpo del correo, igual que los campos de lo interno:
-- marcar este canal en algo ya escrito no obliga a reescribirlo.
alter table public.communications
  add column if not exists dm_texto text;

-- Cuándo se mandaron. Es distinto de `sent_at` —que es cuándo salió el
-- correo— y de `published_at` —cuándo se publicó por dentro. Los tres pueden
-- ser nulos, y los tres significan cosas distintas.
alter table public.communications
  add column if not exists dm_enviado_at timestamptz;

-- Cuántas conversaciones se crearon. Se guarda porque es lo único que queda
-- como prueba de lo que pasó: las filas están en `direct_messages`,
-- repartidas, y contarlas luego exige saber de quién a quién y cuándo.
alter table public.communications
  add column if not exists dm_enviados integer;

commit;


-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────

select
  exists (select 1 from information_schema.columns
    where table_schema='public' and table_name='communications'
      and column_name='dm_texto')                           as ok_texto,

  exists (select 1 from information_schema.columns
    where table_schema='public' and table_name='communications'
      and column_name='dm_enviado_at')                      as ok_fecha,

  -- Que la restricción acepta ya el cuarto canal.
  (select pg_get_constraintdef(oid) like '%''dm''%'
     from pg_constraint
    where conname = 'communications_canales_validos'
      and conrelid = 'public.communications'::regclass)     as ok_canal_dm;

-- Las tres tienen que dar true.
