# Foto de José para la sección TRANSMISIONES

Coloca aquí **una sola** imagen con este nombre exacto:

```
/public/images/transmisiones-jose.webp
```

Es la **única presencia fotográfica** de José en la sección (no va foto por post).
Se integra como fondo del hero: aparece lateral a la derecha en escritorio,
fundida con máscaras de gradiente sobre profundidad cósmica (azul/negro/violeta),
y en móvil pasa arriba, más tenue, con crop inteligente.

## Requisitos
- Formato **WebP** (mejor compresión). Nombre exacto `transmisiones-jose.webp`.
- Orientación apaisada, José hacia un lado (deja aire para el texto a la izquierda).
- ~1600×1000 px, < 300 KB idealmente.
- Foto **real** de José (no stock, no IA).

## Fallback
Si este archivo aún no existe, el hero muestra igualmente el gradiente cósmico
(la imagen simplemente no carga, sin romper el diseño). Al subir el `.webp`
aparece automáticamente — no hay que tocar código.

## Cómo cambiarla luego
Reemplaza el archivo por otro con el mismo nombre y vuelve a desplegar.
Para ajustar intensidad/posición: `app/miembros/_components/transmisiones.module.css`,
clase `.heroBg` (opacity, background-position, máscaras).
