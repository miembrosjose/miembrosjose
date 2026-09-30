# Edge Functions de Supabase

Estas funciones **no se ejecutan desde el repo**: viven desplegadas en el
proyecto de Supabase `kjozrcugsywykpuvuqzu`. Están aquí por dos razones:

1. Hasta ahora no estaban versionadas **en ningún sitio**. La única copia era
   la del panel de Supabase. Perder ese proyecto era perder el código.
2. Para poder revisarlas en un *diff* antes de desplegarlas.

## Para desplegar a mano: `standalone/`

El panel de Supabase no resuelve imports entre carpetas, así que las funciones
de `functions/` **no se pueden pegar tal cual**.

```bash
node supabase/generar-autonomas.cjs
```

Deja en `supabase/standalone/` las tres funciones con el bloque compartido ya
incrustado, listas para copiar y pegar. **Esos archivos no se editan**: se
regeneran.

La regla de acceso sigue viviendo en UN solo sitio —`_shared/acceso.ts`—. Si
cambia, se corre el generador otra vez y se vuelven a pegar las tres. Duplicar
ese bloque a mano es exactamente cómo se llegó a tener tres versiones
distintas de «quién puede entrar», que es el problema que veníamos a arreglar.

## `_shared/acceso.ts`

Es la definición única de quién puede entrar a cada grupo. La importan las
cuatro funciones con `../_shared/acceso.ts`.

**Ese import relativo solo funciona desplegando con la CLI.** Si despliegas
pegando en el panel, hay que copiar `acceso.ts` como segundo archivo dentro de
la carpeta de cada función y cambiar el import a `./acceso.ts`.

Merece la pena instalar la CLI:

```bash
npm i -g supabase
supabase login
supabase link --project-ref kjozrcugsywykpuvuqzu
supabase functions deploy telegram-webhook --no-verify-jwt
supabase functions deploy telegram-sweep
supabase functions deploy telegram-protocols-access
```

`--no-verify-jwt` **solo** para `telegram-webhook`: Telegram no puede mandar un
JWT de Supabase. Se protege con su propio secreto de cabecera. Las otras dos
llevan verificación de JWT y deben conservarla.

## Las que faltan aquí

`telegram-link-start` no se ha tocado en este trabajo, así que no se ha
copiado para no dar a entender que sí. Cuando se retoque, se trae.
