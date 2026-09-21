-- ============================================================================
-- DIAGNÓSTICO — ¿qué marcas de administrador tiene cada cuenta?
-- ============================================================================
-- Solo LEE. No modifica nada.
--
-- La plataforma guarda «es administrador» en dos sitios distintos:
--   · auth.users.raw_app_meta_data->>'is_admin'   (lo mira el panel)
--   · public.profiles.is_admin                    (lo miraban las rutas /api/admin)
--
-- Tener solo una de las dos hacía que el panel mostrara las pestañas pero las
-- rutas respondieran 403. El código ya acepta cualquiera de las dos, así que
-- esto es solo para confirmar el estado y, si quieres, dejarlo coherente.
-- ============================================================================

select
  u.email,
  coalesce((u.raw_app_meta_data->>'is_admin')::boolean, false) as admin_en_metadata,
  coalesce(p.is_admin, false)                                  as admin_en_profiles,
  case
    when coalesce((u.raw_app_meta_data->>'is_admin')::boolean, false)
     and coalesce(p.is_admin, false)                 then 'Completo'
    when coalesce((u.raw_app_meta_data->>'is_admin')::boolean, false) then 'Solo metadata'
    when coalesce(p.is_admin, false)                              then 'Solo profiles'
    else '—'
  end as estado
from auth.users u
left join public.profiles p on p.id = u.id
where coalesce((u.raw_app_meta_data->>'is_admin')::boolean, false)
   or coalesce(p.is_admin, false)
order by u.email;


-- ════════════════════════════════════════════════════════════════════════
-- SI QUIERES DEJARLO COHERENTE
-- ════════════════════════════════════════════════════════════════════════
-- No hace falta: el código ya acepta cualquiera de las dos. Pero si prefieres
-- que tu cuenta tenga ambas, descomenta UNA de estas dos líneas según lo que
-- te haya faltado arriba, y cambia el correo si no es el tuyo.
--
-- Falta en profiles:
--   update public.profiles set is_admin = true
--    where id = (select id from auth.users where email = 'jos.bacigalupo@gmail.com');
--
-- Falta en metadata:
--   update auth.users
--      set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
--    where email = 'jos.bacigalupo@gmail.com';
