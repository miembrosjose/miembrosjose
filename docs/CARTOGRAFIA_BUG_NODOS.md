# Error matemático encontrado en el cálculo del nodo lunar

Fecha: 22 de septiembre de 2026
Archivo: `app/miembros/_lib/cartografia-estelar/astronomy/efemerides.ts`
Función: `nodoNorte`

## El error

La implementación buscaba el cruce ascendente de la Luna por la eclíptica más
cercano al nacimiento (`SearchMoonNode` / `NextMoonNode`) y devolvía la
longitud de la Luna **en el instante de ese cruce**, no en el instante del
nacimiento.

Como los cruces ascendentes ocurren cada ~27.2 días, todas las personas
nacidas dentro de una misma ventana de 27 días recibían **exactamente la misma
longitud de nodo**.

Medido sobre 40 días consecutivos (nacimiento base 27-12-1988, Quito):

```
dia   nodo_norte   salto
  0   337.91582
  7   337.91582    0.0000
  8   335.63450   -2.2813   <-- escalón
 34   335.63452    0.0000
 35   334.87940   -0.7551   <-- escalón
```

El nodo verdadero se mueve de forma continua, unos 0.053°/día en retrógrado,
con una oscilación de ±1.5° alrededor del nodo medio. Una escalera plana con
saltos de 2.28° no es un problema de precisión: es un valor equivocado.

## Impacto

El salto máximo observado, **2.28°, es mayor que el orbe completo de la
conjunción (2.0°)**.

Consecuencia concreta sobre los resultados:

- Contactos de `nodo_norte` y `nodo_sur` que **no existen** aparecían en la
  cartografía.
- Contactos reales de esos dos puntos **no aparecían**.
- Los orbes mostrados para esos contactos eran incorrectos, y con ellos la
  fuerza y la resonancia del portal.

Alcance: solo `nodo_norte` (peso 0.9) y `nodo_sur` (peso 0.8). Los diez
cuerpos, el Ascendente y el Medio Cielo **no estaban afectados**: sus valores
se verificaron y son correctos.

El ejemplo real que trabajamos —Aldebarán con cuadraturas de ambos nodos a Ain
con orbe 0°24′— es exactamente un caso que esta corrección puede mover.

## Corrección aplicada

El nodo se calcula ahora a partir del **plano orbital instantáneo** de la Luna
en el momento del nacimiento, que es la definición del nodo verdadero:

1. `GeoMoonState(t)` da posición **r** y velocidad **v** de la Luna (EQJ).
2. `RotateState(Rotation_EQJ_ECT(t), ...)` las lleva a la eclíptica de la fecha.
3. **h** = **r** × **v** es normal al plano orbital.
4. La dirección del nodo ascendente es **ẑ** × **h** = (−h_y, h_x, 0).
5. λ = atan2(h_x, −h_y).

Sin búsquedas, sin iteración, sin ventanas: una expresión cerrada evaluada en
el instante exacto del nacimiento.

## Verificación

Sobre los mismos 40 días:

- Salto máximo entre días consecutivos: **0.1526°** (antes 2.2813°).
- Desviación respecto al nodo medio de Meeus (cap. 47): **máximo 1.6563°**,
  dentro de la oscilación conocida de ±1.5–1.8°.
- Deriva media medida: 2.065° en 39 días = **0.0529°/día retrógrado**, que es
  el período nodal de 18.6 años.

Las tres comprobaciones son independientes entre sí y las tres pasan.

## Nota

Esta corrección **cambia resultados ya vistos** por cualquiera que haya trazado
su cartografía antes de hoy, en los contactos que impliquen a los nodos. Es
inevitable: los valores anteriores eran incorrectos.
