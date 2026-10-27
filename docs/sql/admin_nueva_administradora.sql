-- ════════════════════════════════════════════════════════════════════════════
--  DAR ROL DE ADMINISTRACIÓN · regisaccagno21@gmail.com
-- ════════════════════════════════════════════════════════════════════════════
--
-- ⚠️  ANTES DE CORRER ESTO, ELLA TIENE QUE TENER CUENTA.
--
--     Supabase → Authentication → Users → «Invite user» → su correo.
--     Le llega un enlace para que ponga SU PROPIA contraseña. Tú no la ves
--     nunca, y no hay que inventarle una ni mandársela por ningún sitio.
--
--     Si corres esto antes, no falla: simplemente no encuentra a nadie y no
--     cambia nada. La comprobación del final te lo dirá.
--
-- ── POR QUÉ SON DOS BANDERAS Y NO UNA ──────────────────────────────────────
-- Esto es lo que no es obvio, y lo que se hace mal si uno sigue el comentario
-- que hay en lib/admin.ts, que solo menciona la primera:
--
--   auth.users.raw_app_meta_data.is_admin
--     Abre el PANEL de administración. Vive en `app_metadata` y no en
--     `user_metadata` por seguridad: lo segundo lo puede editar el propio
--     usuario desde el navegador, lo primero solo la clave de servicio.
--
--   public.profiles.is_admin
--     Abre el CONTENIDO: deja entrar al área de miembros saltándose la
--     comprobación de membresía, y desbloquea todas las temporadas y todos
--     los productos.
--
-- Con solo la primera, entra al panel y ve el contenido bloqueado —o ni
-- siquiera pasa de la puerta—. Con solo la segunda, lo ve todo pero no tiene
-- panel. Hacen falta las dos.
--
-- Eso es además lo que responde a «todo desbloqueado»: no hay que comprarle
-- nada ni darle una suscripción. La segunda bandera ya lo cubre.
--
-- NO DESTRUCTIVO. Solo enciende dos banderas.

begin;

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  1 · EL PANEL DE ADMINISTRACIÓN                                      ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- `coalesce` no sobra: en Postgres, `null || algo` da NULL. Sin él, una
-- cuenta sin metadatos —que es el caso normal de una cuenta recién creada—
-- se quedaría con los metadatos en nulo y SIN la bandera, en silencio.
update auth.users
set raw_app_meta_data =
      coalesce(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
where lower(email) = lower('regisaccagno21@gmail.com');

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  2 · EL CONTENIDO                                                    ║
-- ╚══════════════════════════════════════════════════════════════════════╝
update public.profiles p
set is_admin = true
from auth.users u
where u.id = p.id
  and lower(u.email) = lower('regisaccagno21@gmail.com');

-- ── SI NO TENÍA FICHA EN `profiles` ───────────────────────────────────────
-- La ficha la crea un disparador al registrarse, pero si por lo que sea no
-- está, el UPDATE de arriba no afecta a ninguna fila y la bandera del
-- contenido se queda sin poner — sin que nada avise.
--
-- Esto la crea solo si falta. Si ya existe, no hace nada.
insert into public.profiles (id, email, is_admin)
select u.id, u.email, true
from auth.users u
where lower(u.email) = lower('regisaccagno21@gmail.com')
  and not exists (select 1 from public.profiles p where p.id = u.id);

commit;

-- ════════════════════════════════════════════════════════════════════════════
--  COMPROBACIÓN · las dos tienen que decir «true»
-- ════════════════════════════════════════════════════════════════════════════
select
  u.email,
  coalesce((u.raw_app_meta_data ->> 'is_admin')::boolean, false) as panel_admin,
  coalesce(p.is_admin, false)                                    as contenido_desbloqueado,
  u.created_at                                                   as cuenta_creada,
  u.last_sign_in_at                                              as ultimo_acceso,
  case
    when u.email_confirmed_at is null then 'TODAVÍA NO HA CREADO SU CONTRASEÑA'
    else 'cuenta lista'
  end                                                            as estado
from auth.users u
left join public.profiles p on p.id = u.id
where lower(u.email) in (
  lower('regisaccagno21@gmail.com'),
  -- La tuya al lado, para comparar que quedan iguales.
  lower('bacigalupojose@hotmail.com')
)
order by u.created_at;

-- ── SI «panel_admin» SALE FALSE O NO SALE NINGUNA FILA ────────────────────
-- Es que la cuenta todavía no existe. Invítala desde Authentication → Users y
-- vuelve a correr este archivo entero. Es idempotente: correrlo dos veces no
-- rompe nada.

-- ── PARA QUE EL CAMBIO LE HAGA EFECTO ─────────────────────────────────────
-- `app_metadata` viaja dentro de su sesión, así que si ya estaba dentro NO lo
-- verá hasta cerrar sesión y volver a entrar. Si dice «no me sale el panel»,
-- eso es lo primero que hay que pedirle.

-- ════════════════════════════════════════════════════════════════════════════
--  CÓMO QUITARLE EL ROL
-- ════════════════════════════════════════════════════════════════════════════
-- No borra su cuenta ni su avance: solo la devuelve a ser un miembro normal.
-- Ojo: sin la segunda bandera, si no tiene suscripción, dejará de poder
-- entrar al área de miembros.
--
--   begin;
--   update auth.users
--   set raw_app_meta_data = raw_app_meta_data - 'is_admin'
--   where lower(email) = lower('regisaccagno21@gmail.com');
--
--   update public.profiles p set is_admin = false
--   from auth.users u
--   where u.id = p.id and lower(u.email) = lower('regisaccagno21@gmail.com');
--   commit;
