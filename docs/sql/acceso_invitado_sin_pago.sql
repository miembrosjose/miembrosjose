-- ════════════════════════════════════════════════════════════════════════════
--  DEJAR ENTRAR A ALGUIEN QUE NO PASA POR EL EMBUDO
-- ════════════════════════════════════════════════════════════════════════════
--
-- Para invitadas: gente que entra a la plataforma sin pagar por el embudo
-- —porque paga por otro lado, o porque no paga—. NO las hace administradoras.
--
-- ── POR QUÉ HACE FALTA ESTO ────────────────────────────────────────────────
-- La invitación de Supabase crea la CUENTA. No da el acceso. Son dos cosas
-- distintas y por eso alguien recién invitado entra, se identifica bien, y
-- aterriza en «Acceso suspendido»: tiene sesión y no tiene membresía.
--
-- La puerta —app/miembros/_lib/auth-server.ts— deja pasar por tres sitios:
--
--   1. `profiles.is_admin`            → administración. No es el caso.
--   2. `profiles.manual_access`       → ESTE. El de las invitadas.
--   3. `member_subscriptions.status`  → la escribe SOLO el webhook del
--                                       embudo. Quien no pasa por ahí no
--                                       tiene fila, y sin fila no entra.
--
-- Ojo con el camino que parece el bueno y no lo es: el panel de administración
-- tiene «liberar membership», que escribe en `stripe_sales` y manda el correo
-- de alta. Eso le da los PRODUCTOS, no la puerta. Sin lo de aquí abajo,
-- sigue en «Acceso suspendido».
--
-- ── LO QUE ESTO NO DA ──────────────────────────────────────────────────────
-- El grupo de Telegram. Esa puerta es otra y pregunta por la suscripción a la
-- base del embudo, donde una invitada no tiene fila. Si además tiene que
-- entrar al Telegram, hay que ponerla a mano en el embudo — dímelo y vemos.

-- ════════════════════════════════════════════════════════════════════════════
--  PASO 1 · ¿EXISTE YA SU CUENTA?
-- ════════════════════════════════════════════════════════════════════════════
--
-- La invitación de Supabase crea la fila en `auth.users` en cuanto se manda,
-- aunque ella todavía no haya pulsado nada. Si sale aquí, no hay que volver a
-- invitarla: hay que mandarle un enlace nuevo.

select
  u.id,
  u.email,
  u.email_confirmed_at is not null  as ya_confirmo,
  u.last_sign_in_at,
  to_char(u.invited_at, 'DD/MM/YYYY HH24:MI') as invitada_el,
  p.id is not null                  as tiene_perfil,
  coalesce(p.manual_access, false)  as acceso_manual,
  coalesce(p.is_admin, false)       as es_admin
from auth.users u
left join public.profiles p on p.id = u.id
where lower(u.email) = lower('CORREO_DE_LA_INVITADA@ejemplo.com');   -- ← CAMBIA ESTO

-- Sin filas → la invitación nunca llegó a crear la cuenta. Vuelve a invitarla
--             desde Authentication → Users → Invite.


-- ════════════════════════════════════════════════════════════════════════════
--  PASO 2 · EL PERFIL, SI NO LO TIENE
-- ════════════════════════════════════════════════════════════════════════════
--
-- El perfil se crea solo al entrar por primera vez. Quien todavía no ha
-- entrado no lo tiene, y entonces el UPDATE de abajo actualiza cero filas sin
-- decir nada. Esto lo adelanta.
--
-- ── EL CORREO VA AQUÍ, NO ES OPCIONAL ─────────────────────────────────────
-- `profiles.email` no admite nulo. Crear el perfil solo con el `id` revienta
-- con «null value in column "email" violates not-null constraint», y como el
-- editor de Supabase corre todo en una transacción, el fallo deshace también
-- el UPDATE de abajo: parece que no pasó nada y no se aplicó nada.

insert into public.profiles (id, email)
select u.id, u.email
from auth.users u
where lower(u.email) = lower('CORREO_DE_LA_INVITADA@ejemplo.com')     -- ← CAMBIA ESTO
on conflict (id) do nothing;


-- ════════════════════════════════════════════════════════════════════════════
--  PASO 3 · ABRIRLE LA PUERTA
-- ════════════════════════════════════════════════════════════════════════════
--
-- `access_role` se deja como está a propósito. La puerta ya pasa con
-- `manual_access`, y marcarla de 'tester' la mete en una categoría que no es
-- la suya.

update public.profiles p
set manual_access = true
from auth.users u
where u.id = p.id
  and lower(u.email) = lower('CORREO_DE_LA_INVITADA@ejemplo.com');    -- ← CAMBIA ESTO

-- Debe decir «UPDATE 1». Si dice «UPDATE 0», vuelve al paso 2.


-- ════════════════════════════════════════════════════════════════════════════
--  PASO 4 · COMPROBAR
-- ════════════════════════════════════════════════════════════════════════════

select u.email, p.manual_access, p.access_role, p.is_admin
from public.profiles p
join auth.users u on u.id = p.id
where p.manual_access = true or p.is_admin = true
order by p.is_admin desc, u.email;

-- Deben salir las administradoras y todas las invitadas. Si aparece alguien
-- que no reconoces, es que tiene acceso gratis sin que nadie lo decidiera.


-- ════════════════════════════════════════════════════════════════════════════
--  QUITARLE EL ACCESO, EL DÍA QUE TOQUE
-- ════════════════════════════════════════════════════════════════════════════
--
-- update public.profiles p set manual_access = false
-- from auth.users u
-- where u.id = p.id and lower(u.email) = lower('CORREO@ejemplo.com');
