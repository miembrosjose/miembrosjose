# Código de Origen

Herramienta de autoconocimiento dentro de la sección **Recursos**, hermana de
Numerología Cósmica. Se abre desde su propia tarjeta en el carrusel.

## Qué hace

A partir de la fecha y la hora de nacimiento devuelve una lectura simbólica:

1. Un mandala con el reparto de las cinco **frecuencias**.
2. La frecuencia **raíz** (la más presente).
3. La frecuencia de **apoyo** (la segunda).
4. La frecuencia de **integración** (la menos presente — dirección, no carencia).
5. El **vector** (proyección o recepción).
6. El **arquetipo de origen** (uno de diez).
7. Una **síntesis de la configuración**, armada con reglas deterministas.
8. La **Síntesis 144**, que combina esta lectura con la de Numerología Cósmica
   cuando esta última ya existe en el dispositivo.

## Dónde vive

```
app/miembros/_lib/codigo-origen/
  types.ts            tipos de la lectura
  mappings.ts         la ÚNICA frontera entre el motor y el producto
  interpretations.ts  todos los textos
  engine.ts           el cálculo
  sintesis-144.ts     puente con Numerología Cósmica (NO la recalcula)
app/miembros/_components/
  CodigoOrigen.tsx           interfaz
  codigo-origen.module.css   estilos propios
tests/codigo-origen.test.ts  pruebas del motor
```

## Reglas que no se rompen

- **El motor de cálculo es invisible.** De `engine.ts` salen índices numéricos;
  `mappings.ts` los traduce al vocabulario de Los 144.000. Ninguna terminología
  del motor llega a la interfaz. Hay una prueba automática que lo verifica.
- **Sin IA y sin red.** Todo el cálculo ocurre en el navegador de quien mira. La
  fecha y la hora de nacimiento no se envían a ningún servicio, no se guardan en
  Supabase y no se añade ninguna medición nueva.
- **Sin azar.** No hay `Math.random` ni `Date.now` en ninguna rama: los mismos
  datos dan siempre la misma lectura.
- **Fechas por componentes.** El nacimiento viaja como `{anio, mes, dia, hora,
  minuto}`, nunca como cadena pasada por `new Date`: esa función la interpreta
  según la zona horaria y un nacimiento de madrugada podría saltar al día
  anterior.
- **El día corta a las 23:00**, no a medianoche. Quien nace después de las 23:00
  recibe ya la columna del día siguiente. No es un fallo de zona horaria; está
  fijado en las pruebas para que nadie lo "corrija".

## Pruebas

```
node --experimental-strip-types --import ./tests/resolver-ts.mjs --test "tests/codigo-origen.test.ts"
```

## Atribución

El cálculo de efemérides usa **[tyme4ts](https://github.com/6tail/tyme4ts)**
v1.5.2, de 6tail, publicado bajo licencia **MIT**.

```
MIT License

Copyright (c) 6tail <6tail@6tail.cn>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

La librería se usa **solo como motor de efemérides**. El vocabulario, los
textos, el reparto de pesos, el mandala y la Síntesis 144 son propios de
Los 144.000.
