-- ────────────────────────────────────────────────────────────────────
-- FORO — Temario del Camino Iniciático de Los 144.000
-- Abre las temáticas de discusión en función de las tareas de cada
-- temporada y de los portales intermedios. Autor: admin
-- bacigalupojose@hotmail.com. Los posts quedan FIJADOS (pinned) en orden
-- del camino, así funcionan como índice oficial del foro.
--
-- Ejecutar en el SQL Editor de Supabase (proyecto principal) → Run.
-- Idempotente: si un tema ya existe (por título), no lo duplica.
-- ────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_user_id  uuid;
  v_meta     jsonb;
  v_name     text;
  v_username text;
  v_letters  text;
  v_avatar   text;
  v_badge    text;
  rec        record;
BEGIN
  SELECT id, raw_user_meta_data INTO v_user_id, v_meta
    FROM auth.users
    WHERE lower(email) = 'bacigalupojose@hotmail.com'
    LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el usuario admin bacigalupojose@hotmail.com';
  END IF;

  v_name     := COALESCE(v_meta->>'full_name', v_meta->>'name', 'José');
  v_username := COALESCE(v_meta->>'username', 'admin');
  v_avatar   := v_meta->>'avatar_url';
  v_badge    := COALESCE(v_meta->>'featured_badge_id', 'admin_seal');
  v_letters  := upper(left(regexp_replace(v_name, '\s', '', 'g'), 2));

  FOR rec IN
    SELECT * FROM (VALUES
      (1, 'Portal de Ingreso — ¿Por qué llegaste a este camino?',
       E'Antes de escuchar el Llamado, nos detenemos.\n\nEste es el punto de partida del camino. Comparte con la Red, con humildad y discernimiento:\n\n• ¿Por qué sientes que llegaste a este camino?\n• ¿Qué buscas realmente al entrar en Los 144.000?\n• ¿Estás dispuesto a recibir información sin perder discernimiento?\n\nNo hay respuestas correctas: hay honestidad. Escribe tu punto de partida.',
       ARRAY['INGRESO','CAMINO']),

      (2, 'Temporada 1 · El Llamado — ¿Qué parte de ti se sintió llamada?',
       E'La Temporada 1 abrió el Llamado de Los 144.000: frecuencia, responsabilidad, semilla estelar, olvido, nombre cósmico y misión de la Tierra.\n\nComparte tu experiencia de esta primera etapa:\n\n• ¿Qué parte de ti se sintió llamada?\n• ¿Qué resistencia apareció durante este recorrido?\n• ¿Qué comenzó a despertar en ti?',
       ARRAY['TEMPORADA 1','MEMORIA']),

      (3, 'Portal del Compromiso (T1 → T2) — Tu declaración de intención',
       E'Recordar no es saber más. Recordar es responder.\n\nEste portal marca el primer compromiso interior. La tarea es concreta:\n\nEscribe tu declaración personal de intención para este camino y compártela aquí.\n\nPreguntas guía:\n• ¿Qué parte de mí se sintió llamada?\n• ¿Qué resistencia apareció en esta primera etapa?\n• ¿Qué responsabilidad comienza a despertar en mí?',
       ARRAY['INTEGRACIÓN','COMPROMISO']),

      (4, 'Temporada 2 · La Estructura del Cosmos — ¿Qué cambió en tu visión del universo?',
       E'La Temporada 2 reveló la estructura del cosmos: la Fuente, los universos, las dimensiones, los cuerpos, la jerarquía galáctica, las leyes universales y la Confederación.\n\nCompartamos la integración:\n\n• ¿Qué cambió en tu visión del universo?\n• ¿Qué dimensión de tu vida necesita más orden?\n• ¿Qué ley universal sientes que debes encarnar con más conciencia?',
       ARRAY['TEMPORADA 2','COSMOS']),

      (5, 'Portal del Mapa Cósmico (T2 → T3) — Elige una de las 7 leyes universales',
       E'Quien conoce la estructura, puede comprender su lugar dentro del Plan.\n\nTarea de la semana:\n\nElige una de las 7 leyes universales y obsérvala durante una semana en tu vida diaria. Al terminar, vuelve aquí y cuéntanos qué observaste.\n\n¿Con qué ley trabajarás y por qué?',
       ARRAY['INTEGRACIÓN','LEYES']),

      (6, 'Temporada 3 · Orígenes ocultos de la Tierra — ¿Qué memoria sientes más cercana?',
       E'La Temporada 3 abrió los orígenes ocultos de la Tierra: las primeras humanidades, Lemuria, Orión, Atlántida, los linajes estelares, la caída atlante y la Hermandad Blanca de la Tierra.\n\nComparte:\n\n• ¿Qué parte de esta historia te removió más?\n• ¿Qué herida colectiva sientes que debe ser sanada?\n• ¿Qué memoria sientes más cercana: Lemuria, Orión, Atlántida, Sirio, Pléyades, Arcturus o la Hermandad Blanca?',
       ARRAY['TEMPORADA 3','ORÍGENES']),

      (7, 'Portal de la Memoria Terrestre (T3 → T4) — Sueños y señales (7 días)',
       E'La historia oculta de la Tierra también vive en la memoria humana.\n\nTarea de siete días:\n\nDurante una semana registra sueños, símbolos, emociones o intuiciones relacionadas con las memorias de la Tierra. Comparte aquí lo que vaya apareciendo.\n\n¿Qué señales estás registrando?',
       ARRAY['INTEGRACIÓN','TERRITORIO']),

      (8, 'Temporada 4 · Archivos del Sol hasta Jesús — ¿Qué te reveló esta etapa?',
       E'La Temporada 4 recorrió los Archivos del Sol preservados después de Atlántida hasta la llegada de Jesús.\n\nIntegración:\n\n• ¿Qué te reveló esta etapa sobre la historia de la Tierra?\n• ¿Qué comprensión te acompañará hacia la misión?\n• ¿Qué conecta esta memoria con tu vida hoy?',
       ARRAY['TEMPORADA 4','ARCHIVOS']),

      (9, 'Objetivos de Los 144.000 — De la memoria a la misión',
       E'Has recibido la memoria. Ahora comienza la misión.\n\nLos 7 objetivos muestran cómo la memoria se convierte en misión: formar comunidad de base, irradiar la Clave del Recuerdo, redescubrir la historia sagrada del territorio, convertirse en guardianes del lugar, atravesar la catastro-fe, prepararse para el contacto y reencontrarse con la Hermandad Blanca.\n\n¿Cuál de los 7 objetivos sientes más vivo en ti ahora, y por qué?',
       ARRAY['OBJETIVOS','MISIÓN']),

      (10, 'Misión Territorial — La historia sagrada de tu lugar',
       E'La misión planetaria no comienza lejos. Comienza en el territorio.\n\nAbre tu bitácora del territorio y comparte con la Red:\n\n• ¿Cuál es la historia ancestral de tu territorio?\n• ¿Qué pueblos lo habitaron?\n• ¿Qué lugares sagrados existen cerca?\n• ¿Qué heridas colectivas guarda esta tierra?\n• ¿Qué símbolos, mitos o relatos antiguos siguen presentes?\n• ¿Qué puedes hacer para honrar, sanar o custodiar este espacio?',
       ARRAY['TERRITORIO','MISIÓN']),

      (11, 'Nodos 144.000 — Formar comunidad de base',
       E'El llamado se fortalece cuando varias conciencias sostienen una misma frecuencia.\n\nUn nodo es un punto vivo de conciencia: personas que estudian, meditan, registran, sirven y visualizan un mismo objetivo, sin fanatismo, superioridad ni dependencia.\n\n• ¿Te gustaría formar o unirte a un nodo (físico, virtual o mental)?\n• ¿Desde qué ciudad o territorio escribes?\n\nUsa este espacio para encontrarte con otros miembros cercanos.',
       ARRAY['COMUNIDAD','NODOS']),

      (12, 'Rumbo al Umbral del Contacto — Preparación interior',
       E'El siguiente espacio no será una temporada de videos. Será un umbral.\n\nUn camino de prácticas, meditaciones, bitácora y preparación interior para que el contacto deje de ser una idea y se convierta en una responsabilidad sostenida.\n\nLa memoria fue entregada. El territorio debe ser recordado. La Red debe sostenerse. El contacto vendrá cuando la conciencia pueda responder.\n\n• ¿Qué prácticas sostienes hoy para preparar tu centro, tu discernimiento y tu servicio?',
       ARRAY['UMBRAL','CONTACTO'])
    ) AS t(ord, title, body, tags)
  LOOP
    IF EXISTS (SELECT 1 FROM forum_posts WHERE title = rec.title) THEN
      CONTINUE;
    END IF;

    INSERT INTO forum_posts (
      user_id, author_name, author_username, author_avatar, author_avatar_url,
      author_badge_id, author_is_admin, title, body, tags, pinned, pin_order
    )
    VALUES (
      v_user_id, v_name, v_username, v_letters, v_avatar,
      v_badge, true, rec.title, rec.body, rec.tags::text[], true, rec.ord
    );
  END LOOP;

  RAISE NOTICE 'Temario del foro creado/actualizado para % (% temas).', v_name, 12;
END $$;

-- Verificación (opcional):
-- select pin_order, title, tags from forum_posts where pinned order by pin_order;
