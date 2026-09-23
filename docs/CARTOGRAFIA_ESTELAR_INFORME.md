# Cartografía Estelar 144 — informe de la profundización

22 de septiembre de 2026. Sin deploy, sin push, sin tocar producción.

---

## 0. Qué existía antes (análisis previo)

**Motor astronómico** — `astronomy/` (3 archivos, 396 líneas) sobre
astronomy-engine 2.1.19 (MIT). Correcto y probado. **Reutilizado entero.**

**Catálogo** — 50 portales, 81 anclas, coordenadas J2000 con designación
Hipparcos, 0 `pendingData`. **Reutilizado entero, sin tocar una cifra.**

**Scoring** — `config.ts` + `puntuacion.ts`: aspectos, orbes, pesos por punto,
curva saturante, `ECO_MISMA_ANCLA`, tope y suelo. **Reutilizado entero.** Lo
único que se añadió es una reconstrucción paso a paso para poder explicarlo.

**Contenido editorial** — 170 líneas. 10 portales de 50: 3 con borrador y 7
solo con una línea de esencia. **40 portales no tenían ninguna entrada.**

**Interfaz** — 4 etapas, mapa SVG, sin lista, sin filtros, sin 3D.

**Three.js / React Three Fiber** — instalados en `package.json` y **usados en
cero archivos**. El mapa 3D estaba por construir entero.

**Tests** — 17, todos de astronomía, tiempo, geometría y puntuación.

---

## 1. Error matemático encontrado

Documentado aparte en `docs/CARTOGRAFIA_BUG_NODOS.md`.

`nodoNorte` devolvía la longitud de la Luna **en el cruce por la eclíptica más
cercano**, no en el instante del nacimiento. Como los cruces ascendentes
ocurren cada ~27 días, todos los nacidos en una misma ventana recibían el
mismo nodo: una escalera plana con saltos de hasta **2.28°**, mayor que el
orbe completo de la conjunción (2.0°).

Afectaba solo a `nodo_norte` y `nodo_sur`. Los diez cuerpos, el Ascendente y
el Medio Cielo se verificaron y eran correctos.

**Corregido** calculando el nodo verdadero desde el plano orbital instantáneo
(`h = r × v`). Verificado por tres vías independientes: salto día a día
0.1526° (antes 2.2813°), desviación del nodo medio de Meeus dentro de ±1.66°,
y deriva medida de 0.0529°/día retrógrado — el período nodal de 18.6 años.

Hay una prueba de regresión que falla si vuelve a aparecer un escalón.

**Esto cambia resultados ya vistos** por quien trazara su cartografía antes de
hoy, en los contactos que impliquen a los nodos. Era inevitable: los valores
anteriores estaban mal.

---

## 2. Archivos creados

**Contenido editorial (14 archivos)**

```
content/tipos.ts                     contrato de la capa B
content/avisos.ts                    textos fijos que la interfaz repite
content/puntos.content.ts            14 puntos natales, en profundidad
content/aspectos.content.ts          5 aspectos + exactitud + densidad
content/ejes.content.ts              9 ejes + polo de cada uno de los 50 portales
content/capacidades.content.ts       12 capacidades + 9 zonas de integración
content/framework144.content.ts      3 universos, 7 cuerpos, 12 dimensiones
content/cruces-1..4.ts               140 cruces portal × punto, escritos a mano
content/portales/index.ts            ensamblado de los 50
content/portales/principales.ts      pleyades, sirio, arcturus, lyra, orion
content/portales/principales-b.ts    andromeda, alfa_centauri, antares, regulus, centro_galactico
content/portales/resto-1..4.ts       los otros 40
```

**Motor editorial (4 archivos)**

```
domain/editorial/lectura-portal.ts     compone las 14 secciones de un portal
domain/editorial/sintesis.ts           qué une los contactos · lo que no habías visto
domain/editorial/sintesis-global.ts    tríada · eje · capacidades · pregunta · práctica
domain/editorial/explicacion-score.ts  reconstrucción paso a paso de la cifra
```

**Proyección**

```
proyeccion/esfera.ts                 RA/DEC → cartesianas sobre la esfera celeste
```

**Componentes (6 nuevos)**

```
Mapa3D.tsx              R3F, carga diferida
VistaLista.tsx          lista + orden + filtros
VistaPortal.tsx         las 14 secciones
SintesisGlobal.tsx      tríada, eje, capacidades, zonas, pregunta, práctica, diario
ExplicacionScore.tsx    "¿Por qué 48.9?"
Drawers.tsx             ¿qué es un aspecto? · ¿qué es un orbe?
PrimeraExperiencia.tsx  los seis pasos progresivos
```

**Pruebas y documentación**

```
tests/cartografia-editorial.test.ts   30 pruebas nuevas
docs/CARTOGRAFIA_BUG_NODOS.md         el error de los nodos
docs/CARTOGRAFIA_ESTELAR_INFORME.md   este archivo
```

## 2b. Archivos modificados

| Archivo | Cambio |
|---|---|
| `astronomy/efemerides.ts` | **solo** la función `nodoNorte` (el bug) |
| `_components/.../CartografiaEstelar.tsx` | reescrito como orquestador con estado compartido |
| `_components/.../Metodologia.tsx` | añadidos los diez pasos del cálculo; imports repuntados |
| `_components/.../FormularioNacimiento.tsx` | un import |
| `cartografia.module.css` | +959 líneas |
| `tests/resolver-ts-hook.mjs` | resolvía mal `./puntos.content` y `./portales/` |

**Eliminado:** `content/portales.content.ts`, sustituido por `content/portales/`
y `content/avisos.ts`. Con él desaparece `AVISO_SEMILLA`, que decía a la cara
"este portal está en fase de semilla".

**No se tocó:** el catálogo, la configuración de scoring, `puntuacion.ts`,
`angulos.ts`, `tiempo.ts`, `construir.ts`, `types.ts`, `MapaEstelar.tsx`,
las pruebas astronómicas existentes, Numerología Cósmica, Código de Origen ni
ninguna otra parte de la plataforma.

---

## 3. Estructura editorial final

Un portal entrega 18 campos. `astronomia` es capa A y se muestra marcada
aparte; los otros 17 son capa B:

```
astronomia · esencia · fraseUmbral · arquetipo · nucleo
potenciales[] · tensiones[] · cuandoIntegrado[] · cuandoSobrecargado[]
patronesCotidianos[] · relaciones{consigo,vinculos,grupo,servicio}
aprendizajeCentral · paradoja · preguntaUmbral · preguntas[]
journalPrompts[] · practicaBase{titulo,pasos[],cierre}
framework144{fisico,mental,espiritual}
```

Los 50 los tienen completos. Ningún componente de React contiene
interpretación: todo sale de `content/` a través de `domain/editorial/`.

---

## 4. Cómo funciona el mapa 3D

React Three Fiber sobre Three.js, cargado con `dynamic(..., { ssr: false })`.

- La persona en el centro. Los 50 portales sobre una esfera de radio fijo.
- Fondo de ~1400 estrellas en **un solo** `BufferGeometry`, generadas con una
  secuencia de Weyl (ángulo áureo). Sin `Math.random`: el fondo es idéntico
  en cada visita y en cada dispositivo.
- Etiquetas permanentes solo para los 8 portales de mayor resonancia; el resto
  aparece al pasar por encima o al seleccionar. Más de eso y el mapa es ilegible.
- Cada portal tiene una esfera invisible de radio ×2.6 como objetivo táctil.
- Un portal **sin contacto** se dibuja en alambre, tenue, con la etiqueta
  "Sin contacto natal directo", y **no abre**.

## 5. Cómo funciona la lista

Misma información, misma selección. Solo portales activos.

- Orden: mayor resonancia (por defecto), más contactos, alfabético, por punto
  natal, por tipo. Todos con desempate por identificador para que el orden sea
  estable entre dos cálculos idénticos.
- Filtros por tipo de objeto (7) y por punto natal (14), combinables.
- Al desplegar una fila se ven sus contactos con aspecto y orbe.
- Al pie: "31 de 50 portales tienen contacto… No bajamos los orbes para llenar
  el mapa."

Es también el equivalente accesible del lienzo: dentro del mapa 3D hay un
`<details>` que despliega el mapa SVG navegable con teclado.

## 6. Cómo se representan RA/DEC

`proyeccion/esfera.ts`. Las coordenadas del catálogo se precesan a la fecha
del nacimiento con el mismo motor que calcula los contactos, de modo que mapa
y números describen el mismo cielo.

```
x = cos(dec)·cos(ra)
y = sin(dec)            ← vertical en la escena; el polo norte queda arriba
z = −cos(dec)·sin(ra)
```

Un portal con varias anclas se sitúa en la **media normalizada** de sus
direcciones. Todo cae sobre radio 10.

**La posición es dirección, no distancia.** Sirio está a 8.6 años luz y M87 a
53 millones, y ambos caen sobre la misma esfera. La pantalla lo dice. La
resonancia se codifica en tamaño y brillo, **nunca en posición**: mover un
portal según su puntuación falsearía el cielo.

Hay una prueba que comprueba que dos portales nunca se proyectan al mismo
punto y que declinación +90 cae exactamente en el eje vertical.

## 7. Cómo funciona el zoom

Escritorio: rueda, arrastre, órbita, clic, botones. Móvil: pellizco,
arrastre, toque. Botones visibles de 44 px: **+ · − · centrar · mi mapa**.

Al seleccionar un portal la cámara viaja hasta él en 600–1200 ms, con
interpolación de paso independiente de la tasa de refresco (a 120 Hz dura lo
mismo que a 60). Con `prefers-reduced-motion` el salto es **inmediato**.

Tres niveles:

1. **Mi cartografía** — los portales activos sobre la esfera.
2. **Portal** — al seleccionar uno con varias anclas, se separan y se ven
   (Betelgeuse, Rigel, Mintaka…).
3. **Contacto** — aparecen los puntos natales implicados y la línea que une
   cada uno con su ancla.

## 8. Cómo se determina un portal activo

`contactos.length > 0`. Nada más.

- Solo los activos abren. `leerPortal` devuelve `null` para el resto.
- Los inactivos aparecen tenues como contexto, sin puntuación ni lectura.
- No se bajan orbes para llenar resultados y no se inventan conexiones.
- Una prueba comprueba que activos + sin contacto = 50 exactamente, sin
  solaparse, y que ningún activo tiene cero contactos.

---

## 9. Ejemplo real de una carta

**27/12/1988, 14:30, Quito** (UTC−5)

```
31 portales activos de 50 · 24 contactos exactos · punto más implicado: Luna

 70.9  Cruz del Sur            5 contactos
 57.0  Pléyades                7 contactos
 56.5  Sagitario               3 contactos
 52.2  Regulus · Leo           1 contacto
 46.7  Casiopea                3 contactos
 46.3  Draco                   3 contactos
 43.9  Andrómeda               4 contactos
 39.3  Lyra · Vega             3 contactos
```

## 10. Aldebarán con varios contactos

**3/5/1956, Quito** — resonancia 54.1, *un eje estructural*

```
Nodo Sur   → Ain        conjunción  orbe 0°34′  (cercano)  sep. real   2.6°
Nodo Sur   → Aldebarán  conjunción  orbe 0°45′  (cercano)  sep. real   5.5°
Nodo Norte → Ain        oposición   orbe 0°34′  (cercano)  sep. real 177.4°
Nodo Norte → Aldebarán  oposición   orbe 0°45′  (cercano)  sep. real 174.5°
```

**Lo que une tus contactos:**

> Este portal aparece conectado con los dos extremos de tu eje nodal a la vez.
> Uno señala lo que ya tienes practicado y el otro la dirección que cuesta
> más, y aquí ambos apuntan al mismo asunto: sostener en los hechos lo que se
> declara, sin que la coherencia se vuelva incapacidad de cambiar. Eso hace
> que el tema no quede limitado a una sola parte de tu experiencia, sino que
> aparezca tanto en lo que te sale solo como en lo que llevas tiempo
> posponiendo.

**Lo que tal vez no habías visto:**

> Podrías pensar que aquí el tema principal es elegir correctamente entre lo
> que ya sabes hacer y lo que te falta. Sin embargo, la presencia simultánea
> de ambos nodos sugiere otra pregunta, menos cómoda: qué criterio utilizas
> para decidir qué merece seguir formando parte de tu vida y qué ya cumplió su
> función.

**Pregunta central:** ¿Estás viviendo de una manera coherente con aquello que
dices que es importante para ti?

## 11–14. Cruces portal × punto

Los cuatro que pediste están escritos a mano, en
`content/cruces-1.ts` … `cruces-3.ts`:

- **Sirio × Luna** — la disciplina entrando por la vía emocional: el trabajo
  calma, la falta de estructura inquieta. Se observa en qué haces un domingo
  sin nada pendiente.
- **Pléyades × Venus** — el vínculo como criterio de valor, y el ajuste del
  propio criterio al tono compartido. Se observa al revisar elecciones
  tomadas con alguien delante.
- **Arcturus × Mercurio** — la combinación más directa del portal: la mente
  entrando por la función de la mente. El riesgo es explicar cuando hacía
  falta escuchar.
- **Orión × Marte** — sostener un enfrentamiento sin desbordarse, y anticipar
  conflictos que aún no han ocurrido. Se observa en cuántas discusiones has
  tenido mentalmente antes de tenerlas.

Los 140 miden entre 352 y 546 caracteres, dentro del rango 350–650 que pediste.

## 15. Tríada

`DEDUCIR → PERCIBIR → APUNTAR` (Cruz del Sur → Pléyades → Sagitario)

No son tres etiquetas: cada portal aporta un verbo y los tres leídos en orden
describen un recorrido. El texto lo explica y aclara que el orden **no es una
jerarquía de importancia**, solo el orden en que están marcados.

## 16. Eje

`Pertenencia ↔ Soberanía` — Pléyades, Casiopea y Omega Centauri empujan desde
un polo; Lyra desde el otro. La pantalla los enfrenta agrupados por polo y
explica cómo reconocer hacia cuál se está cayendo.

Se detecta buscando dos portales activos en polos opuestos del mismo eje y
quedándose con el par de mayor resonancia combinada. Si no hay ninguno, no se
fuerza: no aparece eje.

## 17. Mapa de capacidades

`Vínculo · Discernimiento · Transmisión · Perspectiva · Servicio · Creación`

Cada una lleva su **punto ciego** y, desplegable, exactamente qué portales y
qué puntos natales la sostienen. Nunca aparece un "tienes este don" sin el
porqué debajo. Máximo seis.

## 18. Lo que tal vez no habías visto

Obligatorio en toda lectura. Seis reglas, de la más específica a la más
general: eje nodal completo → contacto exacto que no es el más fuerte → el
punto dominante repetido en otro portal → contradicción con otro portal del
mismo eje → contacto único y fluido → la paradoja del portal aplicada al punto
dominante. Nunca repite el contacto principal.

## 19. Pregunta central

`¿Puedo sostener lo mío dentro de un vínculo, sin retirarme y sin disolverme?`

Con su origen siempre a la vista: *"Sale de la polaridad entre Pléyades y Lyra
· Vega, que empujan desde extremos opuestos del mismo eje, y del hecho de que
Luna es el punto que aparece en más contactos."*

## 20. Práctica de 7 días

*Preguntar en vez de deducir* (de Cruz del Sur, el portal más marcado):

1. Cada vez que deduzcas algo sobre lo que otra persona siente o quiere, no lo
   des por hecho.
2. Pregúntaselo directamente, con una pregunta simple.
3. Anota tu deducción antes de preguntar y la respuesta después.
4. No corrijas la deducción anotada.

**Cierre:** cuenta en cuántos casos coincidieron. La proporción es el dato.

Más el diario de 7 días: reconocí / rechacé / se repite / vínculos /
decisiones / pide integración / acción concreta.

## 21. Tres universos

Lente **voluntaria**. Botón, tres opciones, y el aviso de que no se derivan
del cálculo ni lo modifican. Para Cruz del Sur:

- **Físico** — observa si tu cuerpo se tensa al pedir información que crees
  que deberías saber.
- **Mental** — observa cuántas de tus certezas sobre otros son deducciones.
- **Espiritual** — observa si puedes avanzar sabiendo que no tienes la
  dirección confirmada.

## 22. Siete cuerpos

Físico · Astral · Mental inferior · Mental superior · Alma · Espíritu ·
Esencia.

**La herramienta no asigna ninguno.** Elige la persona, y según lo que elija
cambian las preguntas — no el cálculo. Las 12 dimensiones quedan declaradas
como arquitectura preparada y deliberadamente **sin derivar de las estrellas**:
no hay nada que sostenga esa correspondencia y afirmarla sería justo lo que
esta herramienta evita.

## 23. Cómo se explica un score

Con el caso real de Aldebarán = 54.1:

```
nodo_sur    orbe 0.5660/2.0   cerc 0.6071  ×1.00 ×0.8 ×1 = 0.4857   aporte 0.4857
nodo_sur    orbe 0.7579/2.0   cerc 0.4894  ×1.00 ×0.8 ×1 = 0.3915   eco → 0.0587
nodo_norte  orbe 0.5660/1.5   cerc 0.4913  ×0.80 ×0.9 ×1 = 0.3538   aporte 0.3538
nodo_norte  orbe 0.7579/1.5   cerc 0.3480  ×0.80 ×0.9 ×1 = 0.2505   eco → 0.0376
                                                    total   0.9357
      100 × (1 − e^(−0.9357/1.2))  =  54.1498   →  54.1
```

Accesible desde el botón "Resonancia 54.1" de la cabecera de cualquier portal.
Explica también por qué dos contactos cuentan atenuados, el tope de 99.9 y el
suelo de 0.1.

Una prueba comprueba que esta reconstrucción da **exactamente** la misma cifra
que el motor, en todas las cartas y todos los portales. Si se separaran, la
pantalla estaría mintiendo.

---

## 24. Pruebas

**59 pasan, 0 fallan.** 17 astronómicas previas (intactas), 12 de Código de
Origen (intactas), 30 nuevas.

Las nuevas cubren lo que pediste: cobertura de los 50 · ningún campo vacío ·
ninguna lectura con "undefined" ni marcas de estado · los 140 cruces existen y
miden lo debido · los 40 restantes componen texto válido · portal sin contacto
no abre y con contacto sí · mapa y lista ven el mismo conjunto · posiciones
RA/DEC deterministas · la explicación del score reproduce la cifra · los nodos
se mueven de forma continua (regresión del bug).

Dos pruebas nuevas verifican reglas editoriales directamente sobre el texto:
que ningún cruce afirme procedencia ("vienes de", "pleyadiano") ni prediga, y
que ningún aspecto se describa con lenguaje de valor ("favorable",
"desfavorable", "maléfico").

Hubo un fallo real durante el desarrollo: 126 de los 140 cruces quedaban por
debajo del mínimo de 350 caracteres. **Se extendió el contenido, no se relajó
la prueba.**

## 25. Build

`✓ Compiled successfully in 18.4s`

Typecheck: **4 errores, todos preexistentes** y ajenos a este módulo
(`avatar-border/route.ts`, `notification-prefs/route.ts`,
`heal-missing-invites/route.ts` ×2). Cero en Cartografía Estelar.

**Lint no se pudo ejecutar**: `npm run lint` invoca `eslint .`, pero no existe
ningún `eslint.config.*` en el repositorio y eslint no figura en
`devDependencies`. Falla igual antes de estos cambios. No lo he arreglado
porque queda fuera de lo que pediste, pero conviene saberlo.

## 26. Bundle

**Three.js no entra en el paquete inicial de `/miembros`.** Comprobado sobre
el build: los 5 chunks que contienen `WebGLRenderer` (1.9 MB en total) son
alcanzables **solo** por carga diferida. `Mapa3D` aparece en
`react-loadable-manifest.json` como módulo dinámico con 5 archivos.

Quien no abre el mapa 3D no descarga nada de eso, y la lista funciona entera
sin WebGL.

## 27. Ruta para probar

```
npm run dev
```

→ `http://localhost:3000/miembros` → tarjeta **Cartografía Estelar 144** en
la fila de recursos.

La primera vez se entra por los seis pasos progresivos; después va directo al
mapa. Para volver a ver la introducción, borra
`los144k_cartografia_estelar_intro_vista` de localStorage.

Pruebas: `node --import ./tests/resolver-ts.mjs --test tests/cartografia-estelar.test.ts tests/cartografia-editorial.test.ts tests/codigo-origen.test.ts`

---

## Revisión final: alguien que no sabe nada

| Pregunta | Dónde se responde |
|---|---|
| ¿Qué está calculando? | Pasos 1 y 2: su cielo reconstruido, y 14 puntos vs. 50 portales |
| ¿Por qué aparece una estrella concreta? | Paso 2 con **su** contacto real; sección "Por qué está en tu mapa" |
| ¿Qué significa el contacto? | Paso 3 explica su contacto con su orbe; cajón "¿Qué es un aspecto?" |
| ¿Qué significa el orbe? | Cajón "¿Qué es un orbe?", desde el paso 3 y desde cada ficha |
| ¿Por qué obtuvo ese score? | Botón "Resonancia NN" → desglose completo |
| ¿Qué es astronomía? | Bloques marcados con el icono de telescopio |
| ¿Qué es interpretación 144? | La frontera explícita: "Aquí termina el cálculo y empieza la lectura" |
| ¿Qué puede explorar sobre sí misma? | 14 secciones por portal + tríada, eje, capacidades, zonas |
| ¿Qué puede hacer con eso? | Práctica de 7 días, diario de 7 días, "¿lo reconoces?" |

---

## Lo que queda pendiente

1. **46 de 81 anclas** siguen sin contrastar contra posiciones publicadas (35
   sí lo están). Requiere red, que este entorno no tiene.
2. **Los 50 portales están en `estado: "draft"`.** Es un control interno y no
   se muestra a nadie, pero el contenido está sin revisar por ti.
3. **Nada de esta sesión está commiteado.** Último commit `a7d4050`.
4. **Lint sigue roto** en el repositorio, por lo dicho en el punto 25.

---

# Revisión posterior: lenguaje, reinicio y navegación

## Fuera la lista accesible del mapa

Eliminado el desplegable "Ver el mapa como lista accesible" que había debajo
del mapa 3D, y con él `MapaEstelar.tsx`, que se quedaba sin ningún punto de
entrada. La pestaña **Lista** ya cubre esa función: es una vista completa, es
la que se abre por defecto y funciona entera sin WebGL.

## Botón de reinicio

Nuevo botón **Cambiar mis datos**, en dos sitios: el pie del panel y la
pantalla de metodología, justo debajo de los datos que estás viendo.

Pide confirmación antes de borrar, explicando que no se pierde nada
irrecuperable: si vuelves a escribir los mismos datos sale exactamente la
misma cartografía, porque el cálculo es determinista y no hay nada guardado en
ningún servidor.

Borra la fecha y también la marca de "ya viste la introducción", de modo que
quien cambia sus datos vuelve a recorrer la explicación con los nuevos.

## Botón de retroceder

La introducción solo dejaba avanzar. Ahora tiene **Atrás** en cada paso, junto
a "Saltar la explicación". Una explicación por la que solo se avanza obliga a
entenderlo todo a la primera.

## Lenguaje: de técnico a normal

El criterio: **lo técnico no se ha quitado, se ha plegado.** Lo que se lee
primero son palabras normales; los números exactos siguen ahí, dentro de un
desplegable, para quien quiera comprobarlos. Esto conserva la regla de que
ningún número puede ser una caja negra.

| Antes | Ahora |
|---|---|
| "diferencia de 0° en longitud eclíptica" | "Imagina un círculo grande alrededor de la Tierra, como la esfera de un reloj" |
| "orbe 0°34′ de 2°00′ permitidos" | "Se quedó a 0°34′ de ser exacta. Aceptamos hasta 2°00′." |
| "Relación utilizada por el método" | "Lo que usa esta herramienta" |
| "Distancia real sobre el cielo" | "Lo lejos que están de verdad" |
| "Aspecto" / "Exactitud" | "Qué relación hay" / "Lo llamamos" |
| "De geometría a resonancia" | "Aquí cambia lo que estás leyendo" |
| "Aquí termina el cálculo" | "Hasta aquí, hechos comprobables" |
| "¿Cómo se calcula?" | "¿De dónde sale todo esto?" |

**Cajón del aspecto** — ahora empieza por la imagen del círculo y enseña las
cinco distancias con una frase cada una ("están en el mismo sitio", "una a
cada lado, mirándose desde extremos"). La tabla de ángulos y márgenes queda
plegada.

**Cajón del orbe** — usa la imagen de una diana: el centro es la distancia
perfecta, el orbe es cuánto te has quedado del centro. Y deja claro que un
orbe pequeño **no** significa más verdadero ni más espiritual.

**"¿Por qué 48.9?"** — ahora abre con cuatro razones en castellano llano
(cuántos contactos tienes, cuánto se acercaron, que no todos los puntos pesan
igual, y que los primeros cuentan más que los siguientes). La tabla con
cercanías, pesos y la exponencial está detrás de un botón "Ver los números
exactos".

**Metodología** — reescrita como cuatro pasos ("Reconstruye tu cielo",
"Los compara con 50 puntos del cielo", "Busca cinco distancias concretas",
"Suma y ordena"). Todo lo técnico —coordenadas J2000, tabla de orbes, pesos
por punto, fórmula completa— vive en un desplegable al final.

**Avisos** — reescritos todos salvo `AVISO_DOS_CAPAS`, que es el texto que
fijaste tú y se ha dejado palabra por palabra.

## Verificación tras estos cambios

Build `✓ Compiled successfully`. 59/59 pruebas pasan. Typecheck: los mismos 4
errores preexistentes, ninguno en este módulo. Three.js sigue fuera del
paquete inicial: los 5 chunks siguen siendo alcanzables solo por carga
diferida.
