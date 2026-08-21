# Sistema de meditaciones (audio) — Los 144.000

Reproduce meditaciones en audio dentro de los episodios, desde el bucket privado
`los144000-media` (R2), con control de acceso server-side. No expone URLs
públicas ni object keys al cliente.

## Pasos manuales requeridos (tú)

### 1. Cloudflare — binding R2 `MEDIA`
El binding ya quedó declarado en `wrangler.jsonc`:
```jsonc
"r2_buckets": [
  { "binding": "AVATARS_BUCKET", "bucket_name": "miembros" },
  { "binding": "MEDIA", "bucket_name": "los144000-media" }
]
```
Confirma que el bucket **privado** `los144000-media` existe en tu cuenta de R2.
No lo hagas público. Al desplegar, el Worker tendrá `env.MEDIA`.

### 2. Sube el MP3 de prueba a R2 (bucket `los144000-media`)
Con el object key EXACTO que espera el catálogo (`lib/meditations.ts`):
```
audio/included/Temporada 1/nombre-cosmico-sintonia.mp3
```
(Si usas otro nombre, ajústalo en `lib/meditations.ts`.)

### 3. Supabase — tabla de progreso (ejecuta este SQL una vez)
```sql
create table if not exists public.user_meditation_progress (
  user_id          uuid        not null references auth.users(id) on delete cascade,
  meditation_id    text        not null,
  position_seconds integer     not null default 0,
  duration_seconds integer     not null default 0,
  percent          integer     not null default 0,
  completed        boolean     not null default false,
  updated_at       timestamptz not null default now(),
  primary key (user_id, meditation_id)
);

alter table public.user_meditation_progress enable row level security;

create policy "own med progress select"
  on public.user_meditation_progress for select
  using (auth.uid() = user_id);

create policy "own med progress insert"
  on public.user_meditation_progress for insert
  with check (auth.uid() = user_id);

create policy "own med progress update"
  on public.user_meditation_progress for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## Añadir una meditación nueva
1. Sube el `.mp3` a `los144000-media` con un object key claro, por ejemplo:
   `audio/included/Temporada 1/nombre-del-audio.mp3`
2. Añade una entrada en `lib/meditations.ts` (server, con `objectKey` + `access`).
3. Añade sus metadatos en `app/miembros/_lib/season1-meditaciones.ts` (cliente,
   sin object key) usando el MISMO `id`, y enlázala al episodio en
   `getSeason1Meditaciones`.

> Iteración 1: el catálogo vive en código. Cuando quieras administrar meditaciones
> desde Supabase, migramos `lib/meditations.ts` a una tabla `meditations`.

## Acceso
- `included` → sesión válida + membresía activa (`member_subscriptions.status='active'`
  o `profiles.is_admin`).
- `premium` → además, entitlement de compra. Hoy `hasPremiumEntitlement()` devuelve
  `false` (sin sistema de cobro aún) → la meditación premium aparece **bloqueada** y
  su MP3 nunca se entrega.
