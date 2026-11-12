-- ════════════════════════════════════════════════════════════════════════════
--  ¿A QUIÉN MÁS LE PASÓ? · gente que pidió entrar y no entró
-- ════════════════════════════════════════════════════════════════════════════
--
-- Córrelo en el SQL Editor de la PLATAFORMA. No cambia nada: solo mira.
--
-- ── POR QUÉ SE PUEDE SABER ────────────────────────────────────────────────
-- `auth.users` guarda dos fechas que, juntas, cuentan la historia entera:
--
--   recovery_sent_at   cuándo se le mandó su ÚLTIMO enlace de recuperación
--   last_sign_in_at    cuándo entró por última vez
--
-- Si la primera es más reciente que la segunda, esa persona pidió recuperar
-- su acceso y nunca llegó a usarlo. Sigue fuera.
--
-- Esto funciona también para los de antes del 6 de noviembre de 2026, cuando
-- los correos los mandaba Supabase y no quedaba registro nuestro: esa columna
-- la escribe Supabase pase lo que pase.
--
-- ── EL CONTEXTO ───────────────────────────────────────────────────────────
-- Hasta el 12 de noviembre de 2026, los enlaces caducaban a la HORA. Quien
-- pedía el suyo y lo abría más tarde —por la noche, al día siguiente— se
-- encontraba con «este enlace no es válido o ya expiró» y no tenía forma de
-- saber que solo tenía que pedir otro. Ese día se subió a 24 horas.
--
-- Lo de abajo es la lista de a quién le pudo pasar sin decírnoslo.

-- ════════════════════════════════════════════════════════════════════════════
--  1 · LOS QUE SIGUEN FUERA
-- ════════════════════════════════════════════════════════════════════════════
--
-- Pidieron un enlace y no han vuelto a entrar desde entonces. Son los que hay
-- que mirar uno por uno.

select
  u.email,
  coalesce(p.full_name, '—')                                as nombre,
  to_char(u.recovery_sent_at, 'DD/MM HH24:MI')              as pidio_enlace,
  coalesce(to_char(u.last_sign_in_at, 'DD/MM HH24:MI'), 'NUNCA') as ultima_entrada,
  case
    when u.last_sign_in_at is null then 'nunca ha entrado'
    else 'lleva ' || date_trunc('hour', now() - u.recovery_sent_at)::text || ' fuera'
  end                                                       as situacion
from auth.users u
left join public.profiles p on p.id = u.id
where u.recovery_sent_at is not null
  and (u.last_sign_in_at is null or u.last_sign_in_at < u.recovery_sent_at)
order by u.recovery_sent_at desc;

-- Sin filas → nadie está atascado. Se acabó.
--
-- Con filas → cada una es una persona que pidió entrar y no pudo. Ojo con una
-- excepción: si `pidio_enlace` es de hace menos de un rato, puede que
-- simplemente esté en ello ahora mismo.


-- ════════════════════════════════════════════════════════════════════════════
--  2 · LOS QUE LO INTENTARON VARIAS VECES
-- ════════════════════════════════════════════════════════════════════════════
--
-- Pedir el enlace tres veces no es un capricho: es alguien peleándose con una
-- puerta. Y cada intento mataba el enlace anterior, así que cuantos más pidió,
-- más probable es que acabara abriendo uno muerto.
--
-- Esto solo ve desde el 6 de noviembre de 2026, que es cuando la plataforma
-- empezó a mandar estos correos ella misma y a registrarlos.

select
  email,
  count(*)                                       as veces_que_lo_pidio,
  to_char(min(created_at), 'DD/MM HH24:MI')      as el_primero,
  to_char(max(created_at), 'DD/MM HH24:MI')      as el_ultimo,
  count(*) filter (where status <> 'success')    as envios_fallidos
from email_send_log
where source = 'password_reset'
group by email
having count(*) > 1
order by count(*) desc, max(created_at) desc;


-- ════════════════════════════════════════════════════════════════════════════
--  3 · LAS INVITACIONES QUE NUNCA SE USARON
-- ════════════════════════════════════════════════════════════════════════════
--
-- La otra forma de quedarse fuera sin decir nada. A alguien se le invita, el
-- enlace caduca, y esa persona no vuelve a insistir porque no sabe que puede.
--
-- Es lo que le pasó a Frida: la cuenta existía desde el primer día y nadie se
-- había dado cuenta.

select
  u.email,
  to_char(u.invited_at, 'DD/MM/YYYY')                       as invitada_el,
  (now() - u.invited_at) > interval '7 days'                as hace_mas_de_una_semana,
  coalesce(p.manual_access, false)                          as tiene_acceso_manual
from auth.users u
left join public.profiles p on p.id = u.id
where u.invited_at is not null
  and u.last_sign_in_at is null
order by u.invited_at desc;


-- ════════════════════════════════════════════════════════════════════════════
--  QUÉ HACER CON LOS QUE SALGAN
-- ════════════════════════════════════════════════════════════════════════════
--
-- Escribirles. Uno por uno, y con el mensaje concreto:
--
--   «Vi que intentaste entrar y no pudiste. El enlace que te llegó caducaba
--    en una hora; eso ya está arreglado. Pide uno nuevo en
--    los144000.com/miembros/recuperar-contrasena y ábrelo en cuanto llegue.
--    El asunto es "Tu enlace para crear una contraseña nueva" — los
--    anteriores ya no sirven.»
--
-- Lo que NO hay que hacer es mandarles a todos un enlace de golpe desde el
-- panel: si lo abren tarde, vuelven a estar donde estaban, y encima habrán
-- recibido un correo más de los que ya no entienden.
