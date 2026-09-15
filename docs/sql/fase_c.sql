-- FASE C — Proteger profiles.is_admin contra autoescalacion.
-- Copiar ESTE ARCHIVO ENTERO. No modifica datos.
--
-- Quita el UPDATE de tabla al rol authenticated. La whitelist queda vacia
-- porque ninguna ruta de la app escribe en public.profiles: la edicion de
-- perfil va por auth.updateUser -> auth.users.raw_user_meta_data.
-- La policy "user updates own profile" se conserva intacta.

revoke update on public.profiles from authenticated, anon;

-- Comprobacion inmediata. Columna por columna de profiles.
-- Esperado: todas 'bloqueada', y is_admin con veredicto 'ok'.
select
  col.column_name::text as columna,
  case when has_column_privilege('authenticated','public.profiles',col.column_name::text,'UPDATE')
       then 'EDITABLE por authenticated' else 'bloqueada' end as estado,
  case when col.column_name::text in ('is_admin','manual_access','access_role')
       then case when has_column_privilege('authenticated','public.profiles',col.column_name::text,'UPDATE')
                 then 'FALLO CRITICO' else 'ok' end
       else 'ok' end as veredicto
from information_schema.columns col
where col.table_schema = 'public' and col.table_name = 'profiles'
order by col.ordinal_position;
