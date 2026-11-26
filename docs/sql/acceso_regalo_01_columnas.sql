-- ============================================================
-- ACCESO DE REGALO · distinguir a quien entró con código del que paga
--
-- El embudo empieza a regalar el primer mes con un código promocional de
-- Stripe (LLAMADO144) a quien asiste a los encuentros presenciales.
--
-- QUÉ NO CAMBIA
--   El acceso. Esas personas se activan igual que cualquier miembro y
--   tienen lo mismo, Telegram incluido. El acceso sigue dependiendo de
--   `status` y de la suscripción, exactamente como hasta hoy. Estas cuatro
--   columnas son una ETIQUETA para el panel y para no contarlas como
--   ingresos. Nada en la plataforma limita nada a partir de ellas.
--
-- QUÉ ES SEGURO DE ESTO
--   Solo añade. No borra, no renombra, no cambia tipos y no toca ninguna
--   fila que ya exista: las que ya están quedan como 'pago', que es lo que
--   son. Se puede correr dos veces sin consecuencias.
--
-- ORDEN
--   Da igual si se corre antes o después de publicar el código. La
--   plataforma funciona sin estas columnas: cuando no existen, escribe el
--   resto del aviso y se salta la etiqueta (ver member-sync/regalo.ts).
--
-- Aplicar en el proyecto Supabase de la PLATAFORMA.
-- ============================================================

alter table public.member_subscriptions
  -- 'regalo' | 'pago'. Sin CHECK a propósito: esta tabla es la fuente de
  -- verdad del acceso, y un valor inesperado del embudo no debe poder
  -- hacer fallar la activación de nadie. El código normaliza a estos dos.
  add column if not exists tipo_acceso text not null default 'pago',

  -- El código con el que entró, p. ej. 'LLAMADO144'.
  add column if not exists codigo_promocional text,

  -- Lo cobrado al entrar, EN UNIDADES DE LA MONEDA (no en centavos), igual
  -- que LEGAL.monthlyPrice, que vale '14.99'. Con el regalo es 0.
  add column if not exists primer_pago numeric(10,2),

  -- Cuándo llegó el primer cobro de verdad. Null mientras no haya pagado.
  -- El código nunca la vacía: es una fecha que ya ocurrió.
  add column if not exists pago_real_at timestamptz;

-- Para contar los de regalo aparte sin recorrer la tabla entera.
create index if not exists member_subscriptions_tipo_acceso_idx
  on public.member_subscriptions (tipo_acceso);

-- ============================================================
-- RLS: no hace falta tocar nada
--
-- Las políticas son por FILA, no por columna, y siguen como estaban: cada
-- miembro autenticado solo ve su propia fila, y solo el service_role
-- escribe. Consecuencia de añadir columnas: un miembro puede leer su
-- propio `tipo_acceso` si lo pide. Es su propio dato —sabe perfectamente
-- que entró invitado— y la plataforma no se lo muestra en ninguna pantalla.
-- ============================================================

-- ============================================================
-- COMPROBAR (opcional, después de correrlo)
-- ============================================================
-- select tipo_acceso, count(*)
--   from public.member_subscriptions
--  group by tipo_acceso;
--
-- Antes de que el embudo encienda el interruptor, esto debe devolver una
-- sola línea: 'pago' con el total de miembros de siempre.

-- ============================================================
-- VOLVER ATRÁS (solo si hiciera falta; borra los datos de esas columnas)
-- ============================================================
-- drop index if exists public.member_subscriptions_tipo_acceso_idx;
-- alter table public.member_subscriptions
--   drop column if exists tipo_acceso,
--   drop column if exists codigo_promocional,
--   drop column if exists primer_pago,
--   drop column if exists pago_real_at;
