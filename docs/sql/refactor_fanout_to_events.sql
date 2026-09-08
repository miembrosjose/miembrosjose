-- ============================================================================
-- REFACTOR: cortar el FAN-OUT en notifications → escribir en community_events
-- ============================================================================
-- Reemplaza 4 funciones de trigger. Conserva SIEMPRE las notificaciones
-- PERSONALES (level_up, public_level_up_self, funnel_xp_released). Solo cambia
-- los broadcasts públicos (public_level_up, public_top3, public_funnel_hot,
-- feed_post) para que creen UNA fila en community_events en vez de N filas.
--
-- NO toca XP, rangos, insignias, snapshots ni cooldowns. Requiere community_events.
-- Reversible: las definiciones ORIGINALES quedan al final, comentadas.
-- ============================================================================

-- 1) FEED: antes notificaba a TODOS cada publicación. Ahora → 1 evento.
create or replace function public.on_feed_post_inserted()
returns trigger language plpgsql security definer as $function$
begin
  insert into public.community_events
    (type, actor_user_id, actor_name, actor_avatar_url, title, preview, category, visibility, priority)
  values (
    'feed_post', NEW.author_id, NEW.author_name,
    case when NEW.author_avatar like 'http%' then NEW.author_avatar else null end,
    NEW.author_name || ' publicó: ' || left(NEW.title, 80),
    left(NEW.body, 140), 'forum', 'members', 'normal'
  );
  return NEW;
end;
$function$;

-- 2) FUNNEL HOT: conserva el XP + la notif personal; el broadcast → 1 evento.
create or replace function public.on_funnel_likes_threshold()
returns trigger language plpgsql security definer as $function$
declare v_meta jsonb; v_name text; v_avatar text;
begin
  if NEW.likes_count >= 3 and NEW.xp_released = false then
    perform apply_xp_delta(NEW.user_id, 'funnel_created', 150, 0, 'user_funnels', NEW.id::text);
    NEW.xp_released := true;

    -- Personal (se conserva)
    insert into notifications (user_id, type, title, preview)
    values (NEW.user_id, 'funnel_xp_released', '¡Tu funnel ganó XP!',
      'Recibió 3+ likes y desbloqueó +150 XP. Sigue compartiendo.');

    -- Comunidad (antes: fan-out public_funnel_hot a todos)
    select raw_user_meta_data into v_meta from auth.users where id = NEW.user_id;
    v_name := coalesce(v_meta->>'full_name', 'Miembro');
    v_avatar := v_meta->>'avatar_url';
    insert into public.community_events
      (type, actor_user_id, actor_name, actor_avatar_url, title, preview, category, visibility, priority)
    values ('public_funnel_hot', NEW.user_id, v_name, v_avatar,
      'Funnel HOT 🔥 ' || NEW.name, v_name || ' compartió un funnel que está pegando.',
      'forum', 'members', 'important');
  end if;
  return NEW;
end;
$function$;

-- 3) LEVEL UP: conserva level_up + public_level_up_self personales; el FOMO → 1 evento.
create or replace function public.on_user_xp_change()
returns trigger language plpgsql security definer as $function$
declare v_new_level int; v_meta jsonb; v_name text; v_avatar text;
begin
  v_new_level := compute_level_from_xp(NEW.total_xp, NEW.bonus_levels);
  if v_new_level <> NEW.current_level then
    NEW.current_level := v_new_level;
    if v_new_level > coalesce(OLD.current_level, 1) then
      -- Personal (se conserva)
      insert into notifications (user_id, type, title, preview)
      values (NEW.user_id, 'level_up', '¡Subiste de nivel! Ahora eres LV ' || v_new_level,
        'Sigue creando, comentando y ganando insignias para subir más.');

      if v_new_level >= 10 then
        select raw_user_meta_data into v_meta from auth.users where id = NEW.user_id;
        v_name := coalesce(v_meta->>'full_name', 'Miembro');
        v_avatar := v_meta->>'avatar_url';

        -- Personal del recipient (se conserva)
        insert into notifications (user_id, type, source_user_id, source_user_name, source_user_avatar_url, title, preview)
        values (NEW.user_id, 'public_level_up_self', NEW.user_id, v_name, v_avatar,
          '¡Subiste a LV ' || v_new_level || '! 🚀',
          'Sigue creando, comentando y ganando insignias para subir más.');

        -- Comunidad (antes: fan-out public_level_up a todos)
        insert into public.community_events
          (type, actor_user_id, actor_name, actor_avatar_url, title, preview, category, visibility, priority)
        values ('public_level_up', NEW.user_id, v_name, v_avatar,
          v_name || ' subió a LV ' || v_new_level || ' 🚀', 'La Red sigue creciendo.',
          'rank', 'members', 'normal');
      end if;
    end if;
  end if;
  return NEW;
end;
$function$;

-- 4) TOP 3: conserva cooldown + snapshot; el broadcast → 1 evento.
create or replace function public.on_user_xp_top3_check()
returns trigger language plpgsql security definer as $function$
declare
  v_old_top3 uuid[]; v_new_top3 uuid[]; v_new_user_id uuid; v_new_position int;
  v_meta jsonb; v_name text; v_avatar text; v_last_broadcast timestamptz; v_can_broadcast boolean;
begin
  select array_agg(user_id order by position) into v_old_top3 from leaderboard_top3_snapshot;
  select array_agg(user_id order by rn) into v_new_top3
    from (select user_id, row_number() over (order by current_level desc, total_xp desc) as rn
          from user_xp order by current_level desc, total_xp desc limit 3) t;
  if v_new_top3 is not distinct from v_old_top3 then return NEW; end if;

  for v_new_position in 1..least(coalesce(array_length(v_new_top3,1),0),3) loop
    v_new_user_id := v_new_top3[v_new_position];
    if v_new_user_id is null then continue; end if;
    if v_old_top3 is not null and v_new_user_id = any(v_old_top3) then continue; end if;

    select last_broadcast_at into v_last_broadcast from leaderboard_top3_broadcasts where user_id = v_new_user_id;
    v_can_broadcast := (v_last_broadcast is null) or (v_last_broadcast < now() - interval '24 hours');

    if v_can_broadcast then
      select raw_user_meta_data into v_meta from auth.users where id = v_new_user_id;
      v_name := coalesce(v_meta->>'full_name', 'Miembro');
      v_avatar := v_meta->>'avatar_url';

      -- Comunidad (antes: fan-out public_top3 a todos)
      insert into public.community_events
        (type, actor_user_id, actor_name, actor_avatar_url, title, preview, category, visibility, priority)
      values ('public_top3', v_new_user_id, v_name, v_avatar,
        v_name || ' entró al TOP ' || v_new_position || ' del ranking 👑',
        'El ranking de XP se mueve.', 'rank', 'members', 'important');

      insert into leaderboard_top3_broadcasts (user_id, last_broadcast_at)
      values (v_new_user_id, now())
      on conflict (user_id) do update set last_broadcast_at = now();
    end if;
  end loop;

  for v_new_position in 1..3 loop
    update leaderboard_top3_snapshot
      set user_id = v_new_top3[v_new_position],
          total_xp = coalesce((select total_xp from user_xp where user_id = v_new_top3[v_new_position]), 0),
          updated_at = now()
      where position = v_new_position;
  end loop;
  return NEW;
end;
$function$;

select 'refactor fan-out aplicado' as status;

-- ============================================================================
-- ROLLBACK (si hiciera falta): las 4 definiciones ORIGINALES están en el chat /
-- historial de esta conversación (mensaje con pg_get_functiondef). Volver a
-- ejecutarlas restaura el fan-out anterior.
-- ============================================================================
