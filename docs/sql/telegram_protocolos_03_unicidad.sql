-- ════════════════════════════════════════════════════════════════════════════
--  PROTOCOLOS DE CONTACTO · PASO 3 — UNA CUENTA DE TELEGRAM, UNA PERSONA
-- ════════════════════════════════════════════════════════════════════════════
--
-- ⚠ NO CORRER hasta que el paso 00 haya devuelto CERO FILAS en el bloque A.
--   Si hay duplicados, esto falla (bien: no debe arreglarlos por su cuenta,
--   porque decidir cuál de las dos cuentas se queda no es cosa de una
--   migración).
--
-- ── EL FALLO QUE CIERRA ────────────────────────────────────────────────────
-- El upsert de vinculación del webhook va `onConflict: "user_id"`, así que
-- nada impedía que dos cuentas de la plataforma vincularan el MISMO Telegram.
--
-- Cuando eso pasa, el webhook hace:
--     .eq("telegram_user_id", id).maybeSingle()
-- y `maybeSingle()` devuelve ERROR cuando hay más de una fila. El código
-- ignora el error, así que `membership` queda nulo y la solicitud se rechaza.
--
-- Resultado: esa persona queda fuera para siempre, sin mensaje y sin rastro
-- salvo un rechazo silencioso. Con dos grupos el fallo se duplica, y además
-- las invitaciones de Protocolos se atan a `telegram_user_id`: si apunta a
-- dos personas, deja de identificar a nadie.
--
-- ── POR QUÉ UN ÍNDICE PARCIAL ──────────────────────────────────────────────
-- `telegram_user_id` es nulo mientras la cuenta no se ha vinculado, y de esos
-- hay muchos. Un índice único normal trataría cada NULL como distinto —así
-- que funcionaría igual—, pero el parcial deja escrito en el esquema que los
-- nulos no cuentan, y no los indexa.

create unique index if not exists telegram_memberships_telegram_user_id_unico
  on public.telegram_memberships (telegram_user_id)
  where telegram_user_id is not null;

-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────
select indexname, indexdef
  from pg_indexes
 where schemaname = 'public'
   and tablename  = 'telegram_memberships'
   and indexname  = 'telegram_memberships_telegram_user_id_unico';
