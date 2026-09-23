-- ============================================================================
-- PULSO 144 — corazones en las respuestas  [PENDIENTE DE EJECUTAR]
-- ============================================================================
--
-- QUÉ HACE
--   Crea UNA tabla nueva, `pulso_corazones`. No modifica ninguna tabla
--   existente: ni `pulso_respuestas`, ni `profiles`, ni nada más.
--
-- POR QUÉ
--   Hasta ahora se podía responder al pulso y leer a los demás, pero no había
--   forma de decirle a alguien "te he leído". Escribir algo personal y que no
--   pase nada es la manera más rápida de que la gente deje de escribir.
--
-- POR QUÉ UN SOLO GESTO Y NO CINCO EMOJIS
--   El Pulso es una observación, no una publicación que compite por likes. Un
--   único corazón dice lo justo —"esto me llegó"— sin convertir la semana en
--   un ranking. Si algún día hacen falta más reacciones, la columna `tipo`
--   ya está puesta para admitirlas sin migrar nada.
--
-- CÓMO APLICARLO
--   Supabase → SQL Editor → pega todo → Run. Es idempotente: se puede
--   ejecutar varias veces sin romper nada.
--
-- CÓMO DESHACERLO
--   drop table if exists public.pulso_corazones;
--
-- MIENTRAS NO SE EJECUTE
--   La plataforma NO se rompe. La API detecta que la tabla no existe y
--   devuelve cero corazones; los botones simplemente no aparecen.
-- ============================================================================


-- ── Quién ha marcado qué ────────────────────────────────────────────────────
create table if not exists public.pulso_corazones (
  respuesta_id uuid not null references public.pulso_respuestas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Hoy solo existe 'corazon'. Está aquí para que añadir otro gesto más
  -- adelante no obligue a cambiar la forma de la tabla.
  tipo text not null default 'corazon',

  creado_en timestamptz not null default now(),

  -- Una persona, un corazón por respuesta. La clave primaria es la que lo
  -- garantiza: no depende de que el código se acuerde de comprobarlo.
  primary key (respuesta_id, user_id, tipo)
);

-- Para contar los corazones de una respuesta sin recorrer la tabla entera.
create index if not exists pulso_corazones_respuesta_idx
  on public.pulso_corazones (respuesta_id);

comment on table public.pulso_corazones is
  'Pulso 144: un corazon por persona y respuesta. Sirve para decir "te he leido".';


-- ── Seguridad ───────────────────────────────────────────────────────────────
alter table public.pulso_corazones enable row level security;

-- Los corazones los ve cualquier miembro con sesión: el número tiene que ser
-- el mismo para todos, si no deja de significar algo.
drop policy if exists "pulso_corazones_lectura" on public.pulso_corazones;
create policy "pulso_corazones_lectura"
  on public.pulso_corazones for select
  to authenticated
  using (true);

-- Pero cada quien solo pone y quita el suyo. Sin esto, cualquiera podría
-- inflar el contador de su propia respuesta desde la consola del navegador.
drop policy if exists "pulso_corazones_insert_propio" on public.pulso_corazones;
create policy "pulso_corazones_insert_propio"
  on public.pulso_corazones for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "pulso_corazones_delete_propio" on public.pulso_corazones;
create policy "pulso_corazones_delete_propio"
  on public.pulso_corazones for delete
  to authenticated
  using (auth.uid() = user_id);

-- No hay policy de UPDATE a propósito: un corazón se pone o se quita, no se
-- edita. Lo que no existe no se puede usar mal.


-- ── Permisos de tabla ───────────────────────────────────────────────────────
-- RLS y GRANT son capas distintas y las dos tienen que dar permiso. Este
-- proyecto endureció los privilegios por defecto (ver rls_hardening.sql), así
-- que no se dan por supuestos: se declaran.
grant select, insert, delete on public.pulso_corazones to authenticated;
revoke all on public.pulso_corazones from anon;


-- ── Comprobación ────────────────────────────────────────────────────────────
-- Si esto devuelve una fila con 0 corazones, la tabla quedó bien creada.
select
  'pulso_corazones' as tabla,
  count(*) as corazones_guardados
from public.pulso_corazones;
