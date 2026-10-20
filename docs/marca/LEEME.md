# El logo de Los 144.000

Se regeneran todos con `npm run logo`. La fuente es `app/icon.svg`, que es el
mismo dibujo que usa la plataforma: no hay dos versiones que mantener.

## Cuál usar

**`los144000.svg`** — El original. No tiene resolución: es un dibujo, no una
fotografía. Para una valla publicitaria, una imprenta o cualquier sitio que
acepte vectores, se usa este y no hay tamaño que se quede corto.

**`los144000-icono-*.png`** — El cuadrado redondeado **con su fondo**. Es lo
que va en la pantalla de inicio de un teléfono, en una tienda de
aplicaciones, o como foto de perfil de una cuenta. Al traer fondo propio, se
ve igual contra cualquier color.

**`los144000-emblema-*.png`** — Solo el dibujo —la corona, el disco y el
144— **sobre transparente**. Es lo que va encima de una foto, de un vídeo, de
una miniatura o de un fondo que no sea el nuestro.

## El error que hay que evitar

Usar el **icono** donde tocaba el **emblema**: deja un cuadrado oscuro pegado
en medio de la imagen. Es el fallo más común con cualquier logo.

La regla corta: si debajo hay una foto o un color que no es el nuestro, va el
emblema. Si el logo tiene que sostenerse solo, va el icono.

## Los colores

El violeta es `#6D4A9B`. El fondo oscuro va de `#1b1136` a `#050510`.

Ojo con una trampa de este proyecto: en `globals.css` hay variables que se
llaman `--color-gold` y **no son doradas**, valen violeta. Son nombres
heredados de una identidad anterior. Hay que mirar los valores, nunca los
nombres.
