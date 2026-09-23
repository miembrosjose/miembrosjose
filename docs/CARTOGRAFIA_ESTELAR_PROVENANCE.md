# Cartografía Estelar 144 — procedencia y licencias

Este documento existe para que cualquiera pueda **auditar de dónde sale cada
número** de la herramienta. Si algo no está aquí, no debería estar en el
producto.

## Las dos capas

La herramienta separa estrictamente dos cosas que no deben mezclarse:

**Capa A — Astronomía.** Determinista, reproducible y contrastable contra
fuentes públicas. Todo lo que este documento cubre.

**Capa B — Interpretación 144.** Contemplativa, editorial y propia de
Los 144.000. No pretende ser astronomía y no se presenta como tal.

El aviso que aparece en pantalla:

> Las posiciones y relaciones celestes corresponden a cálculos astronómicos.
> Las interpretaciones sobre resonancia, memoria y conciencia estelar
> pertenecen al marco espiritual y contemplativo de Los 144000.

---

## Software

| Paquete | Versión | Licencia | Para qué |
|---|---|---|---|
| `astronomy-engine` | 2.1.19 | MIT | Posiciones de los diez cuerpos, tiempo sideral, matrices de rotación entre sistemas de coordenadas, nodos lunares |
| `city-timezones` | 1.3.4 | MIT | Ciudad → identificador IANA de zona horaria |
| `Intl` (nativo) | — | — | Desfase horario histórico, incluido horario de verano |

**Ninguna dependencia nueva fue instalada.** Las tres ya estaban en el
proyecto antes de empezar.

### Atribución MIT requerida

`astronomy-engine` — Copyright © Don Cross. Licencia MIT. El texto completo
está en `node_modules/astronomy-engine/LICENSE` y viaja con el paquete.

`city-timezones` — Licencia MIT. Texto en `node_modules/city-timezones/LICENSE`.

---

## Datos astronómicos

### Coordenadas de las anclas

Ascensión recta y declinación en **época J2000.0**, en grados decimales, con
la designación del catálogo **Hipparcos (ESA, 1997)** cuando existe.

Son posiciones medidas: datos de dominio público, no obra sujeta a derechos.

**Cómo están verificadas.** `tests/cartografia-estelar.test.ts` comprueba que
esas coordenadas, precesadas a época 2000, producen las longitudes eclípticas
publicadas desde hace décadas en los listados de estrellas fijas. Las doce
anclas con valor publicado conocido coinciden dentro de 5 minutos de arco:

| Ancla | Calculado | Publicado |
|---|---|---|
| Alcyone | 29°59′ Tau | 29°59′ Tau |
| Sirio | 14°05′ Cnc | 14°05′ Cnc |
| Arcturus | 24°14′ Lib | 24°14′ Lib |
| Vega | 15°19′ Cap | 15°19′ Cap |
| Betelgeuse | 28°45′ Gem | 28°45′ Gem |
| Rigel | 16°50′ Gem | 16°50′ Gem |
| Alnilam | 23°28′ Gem | 23°28′ Gem |
| Alpheratz | 14°18′ Ari | 14°18′ Ari |
| Rigil Kentaurus | 29°29′ Sco | 29°30′ Sco |
| Antares | 9°46′ Sgr | 9°46′ Sgr |
| Regulus | 29°50′ Leo | 29°50′ Leo |
| Sagitario A* | 26°51′ Sgr | 26°51′ Sgr |

Esa prueba es lo que detecta una coordenada mal copiada: un error de un dígito
desplaza la longitud varios grados y la comprobación falla.

### Sagitario A*

Posición de radiointerferometría, no óptica. No tiene número Hipparcos porque
no es una estrella visible: es la fuente de radio del centro galáctico.

### Lo que NO se hizo

**No se pudo contrastar contra Moira.** El repositorio
`github.com/TheDaniel166/moira` requiere acceso a red, y este entorno no lo
tiene. No se ha inspeccionado su `LICENSE` ni su `PROVENANCE.md`, y por tanto
**no se ha importado ni un solo registro suyo**, como se pidió.

Si se quiere incorporar su catálogo, hacen falta esos dos archivos primero.

**No se usó movimiento propio.** Las estrellas se mueven, pero incluso las más
rápidas se desplazan mucho menos que el orbe más estrecho del método a lo largo
de un siglo. Añadirlo daría una precisión que el método no aprovecha. La
estructura del catálogo admite el campo cuando se quiera.

---

## Transformaciones

**Precesión.** El catálogo guarda J2000 sin transformar, tal como lo publica la
fuente. La precesión hasta la fecha del nacimiento la hace `astronomy-engine`
con `Rotation_EQJ_ECT`. Así el dato almacenado es siempre contrastable.

**Oblicuidad de la eclíptica.** Serie de la IAU 1980. Cambia unos 47 segundos
de arco por siglo; un valor fijo introduciría error creciente.

**Ascendente y Medio Cielo.** `astronomy-engine` no los ofrece. Se calculan con
las fórmulas astronómicas estándar a partir del tiempo sideral local y la
oblicuidad, documentadas en `astronomy/efemerides.ts`:

```
tan(MC)  = tan(TSL) / cos(ε)
tan(ASC) = cos(TSL) / −(sin(TSL)·cos(ε) + tan(φ)·sin(ε))
```

**Nodo lunar.** Nodo verdadero, no medio. Se obtiene con `SearchMoonNode` y
`NextMoonNode` buscando el cruce ascendente, y tomando la longitud de la Luna
en ese instante.

**Tiempo.** La hora local de nacimiento se convierte a universal usando la zona
horaria del lugar, con el desfase histórico que da la base IANA del propio
motor de JavaScript. Verificado: Madrid en junio de 1975 era UTC+2 y en enero
de 1975 UTC+1. Nunca se usa `new Date(cadena)`, que interpretaría la hora en la
zona de quien mira.

---

## Metodología 144

Los orbes, pesos y fórmulas **son una elección nuestra**, no reglas universales
de ninguna escuela. Viven todos en `resonancia/config.ts`, comentados, para que
la decisión sea auditable. Cambiar un número cambia todos los resultados.

No proceden de Galactic Astro Chart, Galactic Astrology, Starseed Astrology,
Gene Keys, Human Design ni de ningún curso, PDF o tabla comercial. No se
consultaron ni se parafrasearon.

---

## Privacidad

El cálculo ocurre **entero en el navegador**. La fecha, la hora y el lugar de
nacimiento no se envían a ningún servicio, no se guardan en Supabase y no se
ha creado ninguna migración.
