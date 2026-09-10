# Transmisiones — formato de carga

Cada transmisión es **un archivo `.md`** con frontmatter. El importador
(`scripts/import-transmissions.mjs`) los sube a Supabase haciendo **upsert por
`slug`**: re-ejecutarlo NO duplica, actualiza la fila existente.

> ⚠️ La plataforma **no genera contenido**. Estos `.md` los escribe José.
> Bashar es solo referencia de estudio: nunca se copia ni se atribuye a José.

## Ubicación
- Transmisiones reales → `content/transmissions/*.md` (o subcarpetas).
- Mocks de desarrollo → `content/transmissions/_mock/` (el `_` hace que el
  importador los **omita** salvo que pases `--include-mock`).

## Frontmatter

```markdown
---
title: El propósito no se encuentra, se recuerda
slug: el-proposito-no-se-encuentra          # opcional; si falta se deriva del título (estable)
excerpt: Una comprensión sobre por qué la búsqueda de propósito nos aleja de él.
category: vida-proposito                      # slug de transmission_categories
tags: [propósito, misión, recordar]
status: published                             # published | draft | archived
featured: false                               # marca destacada
featured_order: 1                             # orden entre destacadas (opcional)
reading_time: 7                               # opcional; si falta se calcula (~200 wpm)
image_url:                                    # opcional
related_season: 2                             # opcional — muestra "Relacionado con Temporada 2"
related_episode_id:                           # opcional (uuid del episodio)
related_post_slugs: [otra-transmision]        # opcional — "SEGUIR EXPLORANDO"
# ── Internos (nunca se muestran al público) ──
source_basis: jose_previous_work              # jose_previous_work | jose_contact_experience | los144000_previous_conversation | bashar_research | mixed | other
overlap_status: none                          # none | complementary | deepening
season_overlap_notes:
editorial_notes:
---

Aquí va el cuerpo en Markdown: párrafos, ## subtítulos, **negrita**,
> citas, listas, --- separadores. Sin HTML crudo.
```

## Categorías disponibles (slug)
`vida-proposito`, `abundancia-creacion`, `sanacion-mundo-interior`,
`amor-relaciones-familia`, `ninos-nueva-humanidad`, `consciencia-realidad`,
`tiempo-suenos-multidimensionalidad`, `intuicion-capacidades`,
`contacto-familia-cosmica`, `evolucion-futuro`, `memoria-origen`,
`tierra-servicio-red`.

## Mocks y purga automática

Los placeholders de desarrollo llevan `is_mock: true` (en su frontmatter y en
`docs/sql/transmissions_seed_mock.sql`). El contenido real **no** lleva ese campo
(queda `is_mock = false`).

En la **primera importación exitosa de contenido real**, el importador elimina
automáticamente **solo** las filas `is_mock = true` — nunca toca contenido real.
No hay que borrar nada a mano ni descomentar líneas. Reglas:

- Se purga si la corrida importó ≥1 transmisión real y el upsert no falló.
- **No** se purga en corridas con `--include-mock` (previsualización de dev).
- El borrado filtra estrictamente por `is_mock = true`.

> Regla de oro: **nunca** pongas `is_mock: true` en una transmisión real.

## Importar

```bash
# 1) Crear tablas (una vez): pegar docs/sql/transmissions.sql en Supabase SQL Editor.
# 2) Importar (idempotente):
SUPABASE_URL=https://xxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
node scripts/import-transmissions.mjs

# Ver qué haría sin escribir:
node scripts/import-transmissions.mjs --dry
# Incluir los mocks de desarrollo:
node scripts/import-transmissions.mjs --include-mock
```
