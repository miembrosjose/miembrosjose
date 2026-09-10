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

## Flujo de trabajo oficial

> **CONTENIDO APROBADO → JOSÉ LO ENTREGA → CLAUDE PREPARA TODO → JOSÉ HACE UN SOLO RUN EN SUPABASE.**

José **no** maneja plantillas, `.md`, terminal ni comandos. Cuando entrega las
transmisiones reales (ya redactadas y aprobadas), **Claude** hace todo lo local:

1. Crea cada archivo en `content/transmissions/` usando la estructura de `_TEMPLATE.md`.
2. Genera slugs estables (derivados del título; no cambian al editar el título).
3. Asigna categoría, extracto, tags, `featured`/`featured_order`, `related_*` y
   metadata exactamente según el contenido entregado.
4. **No modifica ni resume** el cuerpo editorial.
5. Corre `node scripts/generate-transmissions-sql.mjs`.
6. Verifica que el SQL se generó bien: sin slugs duplicados, sin errores de
   frontmatter, sin transmisiones omitidas (el generador **aborta** si algo falla,
   así el corpus entra completo o no entra).
7. Deja listo `docs/sql/transmissions_generated.sql`.

**Única acción manual de José:** abrir `docs/sql/transmissions_generated.sql`,
copiarlo en Supabase → SQL Editor → **Run**.

Ese Run es idempotente (upsert por slug, no duplica) e incluye la purga segura de
mocks (`delete … where is_mock = true`), que solo se ejecuta tras cargar contenido
real y nunca toca transmisiones reales (`is_mock = false`).

### Referencia de comandos (los corre Claude, no José)

```bash
node scripts/generate-transmissions-sql.mjs                # genera el .sql desde los .md reales
node scripts/generate-transmissions-sql.mjs --include-mock # incluye placeholders (solo para pruebas)
```

Alternativa por red (con service_role key) — no es el flujo por defecto:

```bash
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/import-transmissions.mjs
```
