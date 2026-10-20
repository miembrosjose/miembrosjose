-- ════════════════════════════════════════════════════════════════════════════
--  COMUNICACIONES POR PUSH · una columna, no un módulo nuevo
-- ════════════════════════════════════════════════════════════════════════════
--
-- ── POR QUÉ NO HAY TABLA NUEVA ─────────────────────────────────────────────
-- Una notificación del panel y un correo del panel son lo mismo con otra
-- salida: se redactan igual, se dirigen a la misma gente, se programan igual,
-- se guardan como borrador y se consultan en el mismo historial.
--
-- Duplicar la tabla habría significado duplicar también la audiencia, los
-- estados, la programación, la idempotencia y el historial — y que al mes
-- siguiente uno de los dos tuviera una corrección que el otro no.
--
-- Así que `communications` gana UNA columna que dice por dónde sale.
--
-- ── QUÉ CAMPOS SE REUTILIZAN ───────────────────────────────────────────────
--   subject  →  el título de la notificación
--   body     →  el texto
--   cta_url  →  a dónde lleva al tocarla
--
-- Los demás (preheader, eyebrow, heading, imagen, datos del encuentro) son del
-- correo y en una notificación quedan vacíos. No estorban: una notificación
-- tiene sitio para un título y dos líneas, y cualquier cosa de más se corta.

begin;

alter table public.communications
  add column if not exists canal text not null default 'email';

-- Un valor fuera de la lista dejaría una comunicación que nadie sabe enviar:
-- ni el correo la reconoce ni el push tampoco, y se quedaría en 'sending'
-- para siempre.
alter table public.communications
  drop constraint if exists communications_canal_valido;

alter table public.communications
  add constraint communications_canal_valido
  check (canal in ('email', 'push'));

-- El listado del panel separa por canal, y es la consulta de la pantalla.
create index if not exists communications_canal_idx
  on public.communications (canal, created_at desc);

commit;

-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='communications' and column_name='canal') as columna,
  (select count(*) from public.communications where canal = 'email')                     as correos,
  (select count(*) from public.communications where canal = 'push')                      as notificaciones;

-- ── CÓMO DESHACERLO ────────────────────────────────────────────────────────
-- Todo lo que había sigue siendo 'email' por el valor por defecto, así que
-- nada cambia de comportamiento. Para revertir:
--
--   alter table public.communications drop constraint if exists communications_canal_valido;
--   drop index if exists communications_canal_idx;
--   alter table public.communications drop column if exists canal;
