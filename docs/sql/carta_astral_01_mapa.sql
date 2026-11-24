-- ═══════════════════════════════════════════════════════════════════════════
--  CARTA ASTRAL · el mapa signo → sistema orgánico
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Correr una vez en el SQL Editor de Supabase.
--
-- ── QUÉ GUARDA ESTO, Y POR QUÉ NO VA EN EL CÓDIGO ─────────────────────────
-- La hoja «Registro» del Camino Solar une cada signo con un sistema orgánico,
-- una zona del cuerpo, unas somatizaciones y una emoción. En el Excel solo
-- están rellenos Capricornio y Acuario; los otros diez están vacíos.
--
-- Esas correspondencias son de José, no de la astrología general: cada
-- tradición las reparte distinto. Escribirlas en el código significaría que
-- cambiar una coma le necesita a él pidiéndomelo a mí. Aquí las edita desde la
-- plataforma y quedan guardadas.
--
-- Los TEXTOS largos —atributos y conflictos de cada signo, equilibrio y
-- desequilibrio de cada sistema— NO están aquí: salen generados del Excel a
-- `app/miembros/_lib/carta-astral/contenido/`. Son prosa cerrada, no datos que
-- se toqueteen; y así no viajan en cada consulta.
--
-- ── NADA DE DATOS DE NACIMIENTO ───────────────────────────────────────────
-- Esta tabla NO guarda fechas, horas ni lugares de nacimiento de nadie. La
-- carta se calcula en el navegador y se queda ahí, igual que en la Cartografía
-- Estelar. Lo único que vive en el servidor es este mapa, que es contenido
-- editorial y es el mismo para todo el mundo.

create table if not exists public.solar_signo_sistema (
  -- El identificador del signo tal como lo usa el código: minúsculas y sin
  -- tildes. «geminis», no «Géminis».
  signo text primary key
    check (signo in (
      'aries','tauro','geminis','cancer','leo','virgo',
      'libra','escorpio','sagitario','capricornio','acuario','piscis'
    )),

  -- El sistema orgánico, con los mismos ids que contenido/sistemas.ts.
  sistema text
    check (sistema is null or sistema in (
      'esqueleto','nervioso','circulatorio','reproductor','muscular','respiratorio',
      'linfatico','digestivo','tegumentario','inmune','excretor','endocrino'
    )),

  -- Las tres columnas de la hoja Registro que acompañan al sistema. Son
  -- opcionales: el mapa sirve igual con solo el sistema puesto.
  zona_corporal   text,
  somatizaciones  text,
  emocion         text,

  -- ── POR QUÉ SE PUEDE GUARDAR A MEDIAS ───────────────────────────────────
  -- `sistema` admite nulo a propósito. José va a rellenar esto signo por
  -- signo, y obligar a tenerlo completo para poder guardar significaría
  -- perder el trabajo de media tarde o inventarse valores de relleno. La
  -- pantalla avisa de lo que falta; la base no lo impide.
  updated_at timestamptz not null default now()
);

-- ── LAS DOCE CORRESPONDENCIAS, TAL COMO ESTÁN EN EL EXCEL ─────────────────
-- Los doce sistemas salen de la hoja «Registro» del Camino Solar, leídos del
-- archivo, no deducidos. El orden de los sistemas acompaña al de los signos
-- empezando por Capricornio, que es el orden del Camino Solar.
--
-- Ojo con una cosa: estas correspondencias NO son las de la astrología
-- tradicional. La tradición da la cabeza a Aries; aquí la cabeza va con
-- Acuario, por el sistema nervioso. Es el sistema de José, y manda el suyo.
-- Quien venga después a «corregirlo» con un manual, que lea esto primero.
--
-- ── LO QUE ES DATO Y LO QUE ES BORRADOR ───────────────────────────────────
-- `sistema` es dato: está en el Excel, verificado signo por signo.
--
-- `zona_corporal`, `somatizaciones` y `emocion` solo estaban rellenos en
-- Capricornio y Acuario; ésos van literales. Los otros diez son UN BORRADOR,
-- y se marcan como tal:
--
--   · La zona y las somatizaciones se derivan de la ANATOMÍA del sistema
--     —el respiratorio son los pulmones y los bronquios, no hay nada que
--     interpretar ahí—, no de la astrología.
--   · La emoción se deja en blanco a propósito. Esa es lectura de José, sale
--     de su conflicto del signo, y ponerle yo palabras sería firmar con su
--     nombre. La pantalla lo señala como pendiente.
insert into public.solar_signo_sistema (signo, sistema, zona_corporal, somatizaciones, emocion)
values
  -- Del Excel, literal.
  ('capricornio', 'esqueleto',     'Rodilla derecha, cadera', 'Dolor Rodilla, Dolor de cadera',
   'Sobrecarga de trabajo, rigidez a los movimientos'),
  ('acuario',     'nervioso',      'Cabeza', 'Migraña',
   'Conflictos emocionales profundos, como culpa, resentimiento o estrés acumulado'),

  -- Sistema del Excel; zona y somatizaciones, borrador anatómico; emoción, de José.
  ('piscis',      'circulatorio',  'Corazón, arterias y venas, pies',
   'Presión alta o baja, manos y pies fríos, varices, palpitaciones', null),
  ('aries',       'reproductor',   'Órganos reproductores, zona pélvica',
   'Alteraciones del ciclo, dolor pélvico, desajustes hormonales', null),
  ('tauro',       'muscular',      'Musculatura, cuello y espalda',
   'Contracturas, tensión cervical, rigidez lumbar', null),
  ('geminis',     'respiratorio',  'Pulmones, bronquios, garganta',
   'Falta de aire, tos persistente, bronquitis, afonía', null),
  ('cancer',      'linfatico',     'Ganglios, bazo, retención de líquidos',
   'Hinchazón, ganglios inflamados, defensas bajas', null),
  ('leo',         'digestivo',     'Estómago, intestino, hígado',
   'Acidez, digestiones pesadas, colon irritable', null),
  ('virgo',       'tegumentario',  'Piel, cabello y uñas',
   'Dermatitis, picores, caída del cabello, uñas quebradizas', null),
  ('libra',       'inmune',        'Defensas, procesos inflamatorios',
   'Infecciones repetidas, alergias, inflamación crónica', null),
  ('escorpio',    'excretor',      'Riñones, vejiga, intestino grueso',
   'Infecciones urinarias, estreñimiento, retención', null),
  ('sagitario',   'endocrino',     'Tiroides, suprarrenales, hormonas',
   'Fatiga sostenida, tiroides alterada, insomnio', null)
on conflict (signo) do update set
  -- Si la tabla ya existía con los diez vacíos, esto los completa. Lo que ya
  -- estuviera escrito a mano NO se pisa: `coalesce` deja ganar lo existente.
  sistema        = coalesce(public.solar_signo_sistema.sistema, excluded.sistema),
  zona_corporal  = coalesce(public.solar_signo_sistema.zona_corporal, excluded.zona_corporal),
  somatizaciones = coalesce(public.solar_signo_sistema.somatizaciones, excluded.somatizaciones),
  emocion        = coalesce(public.solar_signo_sistema.emocion, excluded.emocion);

-- ── QUIÉN PUEDE VER Y QUIÉN PUEDE TOCAR ───────────────────────────────────
alter table public.solar_signo_sistema enable row level security;

-- Leer: cualquiera con sesión. Es contenido editorial, el mismo para todos, y
-- la herramienta lo necesita para redactar la lectura.
drop policy if exists "solar_mapa_leer" on public.solar_signo_sistema;
create policy "solar_mapa_leer"
  on public.solar_signo_sistema for select
  to authenticated
  using (true);

-- Escribir: solo administración.
drop policy if exists "solar_mapa_escribir" on public.solar_signo_sistema;
create policy "solar_mapa_escribir"
  on public.solar_signo_sistema for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- No se dan permisos de INSERT ni DELETE a nadie: las doce filas son las doce
-- filas. Un signo no se crea ni se borra, se rellena. Así no hay forma de
-- quedarse con once ni con trece.

-- `updated_at` al día sin tener que acordarse.
create or replace function public.solar_mapa_touch()
returns trigger
language plpgsql
-- `search_path` fijado: sin esto, quien pudiera crear objetos en otro esquema
-- podría colar una función que se ejecutara con los permisos de esta.
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists solar_mapa_touch_trg on public.solar_signo_sistema;
create trigger solar_mapa_touch_trg
  before update on public.solar_signo_sistema
  for each row execute function public.solar_mapa_touch();

-- ── COMPROBACIÓN ──────────────────────────────────────────────────────────
-- Deben salir DOCE filas, las doce con sistema. La columna «emoción» estará
-- rellena solo en Capricornio y Acuario: lo demás lo escribe José desde la
-- pantalla de administración.
select
  signo,
  sistema,
  coalesce(zona_corporal, '—') as zona,
  case when emocion is null then 'PENDIENTE' else 'escrita' end as emocion
from public.solar_signo_sistema
order by
  array_position(
    array['capricornio','acuario','piscis','aries','tauro','geminis',
          'cancer','leo','virgo','libra','escorpio','sagitario'],
    signo
  );
