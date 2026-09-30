-- ════════════════════════════════════════════════════════════════════════════
--  LA BITÁCORA, EN EL SERVIDOR
-- ════════════════════════════════════════════════════════════════════════════
--
-- ── EL PROBLEMA QUE RESUELVE ───────────────────────────────────────────────
-- Hasta ahora la bitácora entera vivía en `localStorage`. Solo ahí: ni tabla,
-- ni ruta de API, ni copia en ninguna parte.
--
-- Para quien la usa, eso significaba tres cosas que nadie le avisaba:
--   · entrar desde el móvil después de haber escrito en el ordenador la
--     mostraba VACÍA;
--   · borrar los datos del navegador la borraba entera;
--   · reinstalar el navegador, también.
--
-- Y es justo lo que el Portal de Ingreso promete que alimentará la revelación
-- de misión. Alguien podía llevar meses escribiendo y perderlo sin enterarse.
--
-- ── POR QUÉ EL ID VIENE DEL CLIENTE ────────────────────────────────────────
-- No es un uuid del servidor: es `<origen>__<pregunta-en-slug>`, que el
-- navegador ya calcula desde hace tiempo. Gracias a eso, responder otra vez la
-- misma pregunta ACTUALIZA su entrada en vez de crear una nueva, y lo hace
-- igual en cada dispositivo sin tener que preguntar antes.
--
-- Por eso la clave primaria es (user_id, id): el mismo id puede repetirse
-- entre personas distintas —todas responden las mismas preguntas—, pero
-- nunca dentro de una.

begin;

create table if not exists public.journal_entries (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  id           text        not null,
  category     text        not null,
  source       text        not null,
  source_label text        not null default '',
  prompt       text        not null,
  answer       text        not null,
  is_private   boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (user_id, id)
);

-- La pantalla de la bitácora agrupa por categoría, y es la consulta caliente.
create index if not exists journal_entries_categoria_idx
  on public.journal_entries (user_id, category, updated_at desc);

alter table public.journal_entries enable row level security;

-- ── LAS POLÍTICAS ─────────────────────────────────────────────────────────
-- Cada persona, y solo ella. No hay política de lectura para nadie más: ni
-- para administración.
--
-- Eso es deliberado y conviene que quede escrito. La bitácora es el sitio
-- donde se pide contar heridas de infancia, patrones familiares y memorias de
-- abuso. Que exista una pantalla desde la que alguien pueda leer eso —aunque
-- nunca se use— cambia lo que la gente se atreve a escribir. Si algún día
-- hiciera falta agregado, se hace con cifras, no con textos.
drop policy if exists "journal propio: leer"     on public.journal_entries;
drop policy if exists "journal propio: insertar" on public.journal_entries;
drop policy if exists "journal propio: editar"   on public.journal_entries;
drop policy if exists "journal propio: borrar"   on public.journal_entries;

create policy "journal propio: leer"
  on public.journal_entries for select
  using (auth.uid() = user_id);

create policy "journal propio: insertar"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

create policy "journal propio: editar"
  on public.journal_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "journal propio: borrar"
  on public.journal_entries for delete
  using (auth.uid() = user_id);

revoke all on public.journal_entries from anon;
grant select, insert, update, delete on public.journal_entries to authenticated;

commit;

-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.tables
    where table_schema='public' and table_name='journal_entries')            as tabla,
  (select count(*) from pg_policies
    where schemaname='public' and tablename='journal_entries')               as politicas,
  (select relrowsecurity from pg_class where relname='journal_entries')      as rls_activo;
