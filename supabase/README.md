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

Es la definición única de quién puede entrar a cada grupo. La importan **tres**
de las cuatro funciones con `../_shared/acceso.ts`. La cuarta,
`telegram-link-start`, lleva todavía su propia copia: ver más abajo.

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
supabase functions deploy telegram-link-start
```

`--no-verify-jwt` **solo** para `telegram-webhook`: Telegram no puede mandar un
JWT de Supabase. Se protege con su propio secreto de cabecera. Las otras tres
llevan verificación de JWT y deben conservarla.

## `telegram-link-start`

Es la que atiende el botón de Telegram del área de miembros: devuelve la
dirección personal de un solo uso. **Sí está aquí** desde el 17-11-2026, que
es cuando hubo que retocarla.

No tiene imports relativos, así que **se puede pegar tal cual en el panel**,
sin pasar por el generador.

**Lleva su propia copia de la comprobación de acceso**, porque está escrita
sobre `withSupabase` de `npm:@supabase/server` y no sobre `Deno.serve` como
las otras tres. Eso ya cobró una vez: se añadió el acceso concedido a mano a
`_shared/acceso.ts` y aquí no, así que el barrido y el webhook dejaban entrar
a los invitados mientras **el botón** seguía diciéndoles que no tenían
suscripción. Si la regla cambia, hay que cambiarla en los dos sitios hasta
que se unifiquen.

Queda una diferencia a propósito: `_shared/acceso.ts` acepta `canceled` y esta
copia no. Está explicada en la cabecera del archivo; aflojar eso es una
decisión del dueño, no un arreglo.
