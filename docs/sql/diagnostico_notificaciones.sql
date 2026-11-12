-- ════════════════════════════════════════════════════════════════════════════
--  ¿POR QUÉ NO LLEGAN LAS NOTIFICACIONES AL MÓVIL?
-- ════════════════════════════════════════════════════════════════════════════
--
-- Córrelo en el SQL Editor de la PLATAFORMA, consulta por consulta: el editor
-- solo enseña el resultado de la última. No cambia nada.
--
-- ── DÓNDE SE PUEDE CORTAR ─────────────────────────────────────────────────
-- Una notificación atraviesa cuatro puertas, y falla distinto en cada una:
--
--   1. El móvil se suscribe        → tiene que haber fila en push_subscriptions
--   2. La plataforma intenta enviar → tiene que haber fila en push_envios
--   3. Apple o Google lo aceptan    → resultado 'ok'
--   4. El móvil lo enseña           → esto ya no deja rastro en la base
--
-- Lo que diga cada consulta señala una puerta distinta. Empieza por la 1: si
-- no hay suscripciones, lo demás no importa.

-- ════════════════════════════════════════════════════════════════════════════
--  1 · ¿HAY DISPOSITIVOS SUSCRITOS?
-- ════════════════════════════════════════════════════════════════════════════

select
  count(*)                                        as total,
  count(*) filter (where activa)                  as activas,
  count(*) filter (where not activa)              as dadas_de_baja,
  count(distinct user_id) filter (where activa)   as personas_con_aviso,
  to_char(max(created_at), 'DD/MM HH24:MI')       as la_mas_reciente
from public.push_subscriptions;

-- total = 0        → nadie ha llegado a suscribirse. El fallo está en el
--                    móvil o en el permiso, no en el envío. En iPhone hay que
--                    instalar la app en la pantalla de inicio ANTES de que el
--                    permiso pueda siquiera pedirse.
--
-- activas = 0 y dadas_de_baja > 0
--                  → se suscribieron y el servicio las invalidó. Mira el
--                    motivo en la consulta 2.
--
-- la_mas_reciente de hace mucho
--                  → nadie nuevo se suscribe desde entonces. Si coincide con
--                    algún despliegue, ahí está la pista.


-- ════════════════════════════════════════════════════════════════════════════
--  2 · LAS QUE SE CAYERON, Y POR QUÉ
-- ════════════════════════════════════════════════════════════════════════════

select
  coalesce(motivo_baja, '(sin motivo)')           as motivo,
  count(*)                                        as cuantas,
  to_char(max(updated_at), 'DD/MM HH24:MI')       as la_ultima
from public.push_subscriptions
where not activa
group by 1
order by 2 desc;

-- 'gone'     → el servicio de Apple/Google dice que esa instalación ya no
--              existe. Pasa al desinstalar la app o al limpiar los datos del
--              navegador. Es normal que haya algunas.
-- 'error'    → fallos repetidos. Mira la consulta 3.
-- 'revocada' → la persona las apagó. No hay nada que arreglar.


-- ════════════════════════════════════════════════════════════════════════════
--  3 · ¿SE ESTÁ INTENTANDO ENVIAR? Y SI SÍ, ¿QUÉ CONTESTAN?
-- ════════════════════════════════════════════════════════════════════════════

select
  resultado,
  http_status,
  coalesce(error, '—')                            as error,
  count(*)                                        as cuantos,
  to_char(max(created_at), 'DD/MM HH24:MI')       as el_ultimo
from public.push_envios
group by 1, 2, 3
order by 5 desc nulls last, 4 desc
limit 20;

-- SIN FILAS  → la plataforma NO está intentando enviar nada. El fallo está
--              antes del envío: en lo que debería dispararlo. No es un
--              problema de Apple ni de Google.
--
-- resultado 'ok'
--            → salió y el servicio lo aceptó. Si aun así no aparece en el
--              móvil, el problema está en el teléfono: permiso apagado para
--              esa app, modo concentración, o iPhone con la app abierta en
--              primer plano (ahí el aviso no se dibuja, llega en silencio).
--
-- 'gone' con 404/410
--            → la suscripción murió. Hay que volver a suscribir ese móvil.
--
-- 'fallo' con 401 o 403
--            → las claves VAPID. O no están en el Worker, o la pública que
--              usó el navegador al suscribirse NO es la que firma ahora. Si
--              se regeneraron las claves en algún momento, todas las
--              suscripciones viejas quedan inservibles y hay que rehacerlas.
--
-- 'fallo' con 400
--            → el mensaje va mal formado o el cifrado falla.
--
-- 'fallo' con 429 o 5xx
--            → el servicio estaba saturado. Pasajero.


-- ════════════════════════════════════════════════════════════════════════════
--  4 · LOS ÚLTIMOS INTENTOS, UNO A UNO
-- ════════════════════════════════════════════════════════════════════════════

select
  to_char(e.created_at, 'DD/MM HH24:MI')          as cuando,
  u.email,
  e.categoria,
  e.titulo,
  e.resultado,
  e.http_status,
  e.error
from public.push_envios e
left join auth.users u on u.id = e.user_id
order by e.created_at desc
limit 25;


-- ════════════════════════════════════════════════════════════════════════════
--  5 · ¿QUIÉN TIENE AVISOS Y QUIÉN NO?
-- ════════════════════════════════════════════════════════════════════════════
--
-- Para saber si el problema es de todos o de unos pocos móviles.

select
  u.email,
  count(*) filter (where s.activa)                as dispositivos_activos,
  count(*) filter (where not s.activa)            as caidos,
  to_char(max(s.created_at), 'DD/MM HH24:MI')     as se_suscribio
from public.push_subscriptions s
join auth.users u on u.id = s.user_id
group by u.email
order by max(s.created_at) desc
limit 30;
