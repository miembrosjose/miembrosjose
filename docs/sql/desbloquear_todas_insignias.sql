-- ============================================================================
-- DESBLOQUEAR TODAS LAS INSIGNIAS PARA UNA CUENTA
-- ============================================================================
-- Para probar las tres ranuras del perfil: insignia destacada, estrella y
-- llama. Solo se pueden elegir insignias DESBLOQUEADAS, y en las cuentas de
-- prueba casi ninguna lo está.
--
-- ⚠ ES UN ATAJO DE PRUEBAS. Desbloquea de golpe cosas que en el recorrido
--   normal se ganan avanzando o comprando. No lo corras sobre una cuenta real.
--
-- Por defecto actúa sobre TU cuenta de administrador. Cambia el correo si
-- quieres hacerlo sobre otra.
--
-- Idempotente: lo ya desbloqueado se respeta, con su fecha original.
-- ============================================================================

with cuenta as (
  select id from auth.users where email = 'bacigalupojose@hotmail.com'
),
catalogo (achievement_id) as (values
  ('el_estudio'),           -- exclusive   Servicio Premium A
  ('el_topo'),              -- exclusive   Servicio Premium B
  ('admin_seal'),           -- exclusive   Admin
  ('welcome'),              -- progression Bienvenida
  ('first_lesson'),         -- progression Primera Clase
  ('agent_estratega'),      -- progression 144
  ('agent_minivsl'),        -- progression Agente 2
  ('agent_copywriter'),     -- progression Agente 3
  ('agent_constructor'),    -- progression Agente 4
  ('semilla_estelar'),      -- progression Semilla Estelar
  ('embajador_galactico'),  -- exclusive   Embajador Galáctico
  ('season_1_complete'),    -- progression Navegante Estelar
  ('season_2_complete'),    -- progression Activador de la Red
  ('season_3_complete'),    -- progression Guardián de la Red
  ('season_4_complete'),    -- progression Arquitecto Cósmico
  ('vip_community'),        -- progression Círculo VIP
  ('training_complete'),    -- progression Entrenamiento Completo
  ('product_bonus_ganchos'),-- products    Bonus 1
  ('product_creativos'),    -- products    Producto 1
  ('product_andromeda'),    -- products    Producto 2
  ('product_analytics'),    -- products    Producto 3
  ('product_minivsl'),      -- products    Upsell 1
  ('product_revisao'),      -- products    Servicio Premium
  ('rank_recluta'),         -- community   Rank 1
  ('rank_agente'),          -- community   Rank 2
  ('rank_operador'),        -- community   Rank 3
  ('rank_estratega'),       -- community   Rank 4
  ('rank_capo'),            -- community   Rank 5
  ('rank_padrino'),         -- community   Rank 6
  ('rank_leyenda'),         -- community   Rank 7
  ('time_devoto'),          -- time        Tiempo 1
  ('time_habitue'),         -- time        Tiempo 2
  ('time_veterano'),        -- time        Tiempo 3
  ('time_eterno')          -- time        Tiempo 4
)
insert into public.user_unlocked_achievements (user_id, achievement_id)
select c.id, k.achievement_id
from cuenta c
cross join catalogo k
where not exists (
  select 1 from public.user_unlocked_achievements u
  where u.user_id = c.id and u.achievement_id = k.achievement_id
);


-- ════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN (solo lectura)
-- ════════════════════════════════════════════════════════════════════════
select count(*) as insignias_desbloqueadas
from public.user_unlocked_achievements u
join auth.users a on a.id = u.user_id
where a.email = 'bacigalupojose@hotmail.com';
-- Se esperan 34.
