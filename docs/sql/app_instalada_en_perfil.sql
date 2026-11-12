-- ════════════════════════════════════════════════════════════════════════════
--  «ESTA PERSONA YA TIENE LA APLICACIÓN» · en el perfil
-- ════════════════════════════════════════════════════════════════════════════
--
-- Córrelo en el SQL Editor de la PLATAFORMA. Solo añade una columna; no toca
-- ninguna fila existente.
--
-- ── PARA QUÉ ──────────────────────────────────────────────────────────────
-- Para poder mandar el recordatorio de instalar la aplicación SOLO a quien no
-- la tiene. Hasta ahora salía a todo el mundo, incluida la gente que la usa a
-- diario desde el icono — y recibir tres veces «descárgate la app» cuando ya
-- la tienes es la forma más rápida de dejar de leer lo que llega.
--
-- ── POR QUÉ EN DOS SITIOS ─────────────────────────────────────────────────
-- El mismo hecho se guarda en `user_metadata` y aquí, y cada copia sirve para
-- algo que la otra no puede:
--
--   user_metadata  viaja dentro de la sesión. El navegador lo consulta sin
--                  una sola petición, que es lo que necesita algo que se mira
--                  en cada carga para decidir si enseñar una invitación.
--
--   profiles       es una tabla. Se puede filtrar y contar desde el servidor,
--                  que es lo que necesita el cálculo de audiencias. El padrón
--                  de las comunicaciones sale de aquí, no de `auth.users`.
--
-- Las escribe la misma petición, así que no pueden desincronizarse por un
-- lado sin el otro.
--
-- ── LO QUE ESTA COLUMNA NO SABE ───────────────────────────────────────────
-- Solo se rellena desde el 12 de noviembre de 2026, que es cuando empezó a
-- anotarse. Quien instaló la aplicación antes aparecerá como que no la tiene
-- hasta que la abra una vez desde el icono.
--
-- Eso significa que, durante los primeros días, el filtro «todavía no la
-- tiene» incluirá a gente que sí la tiene. Se va corrigiendo sola conforme
-- cada persona abre su aplicación, y conviene saberlo antes de sacar
-- conclusiones del número.

alter table public.profiles
  add column if not exists app_instalada_at timestamptz;

comment on column public.profiles.app_instalada_at is
  'Cuándo se abrió la plataforma por primera vez desde la aplicación instalada. Null no prueba que no la tenga: solo se anota desde el 12/11/2026.';

-- Quien ya la tiene, de un vistazo.
select
  count(*) filter (where app_instalada_at is not null) as con_app,
  count(*)                                             as miembros
from public.profiles;
