# Guía rápida — Cómo trabajar en tu Área de Miembros

Solo necesitás instalar 3 herramientas. Toma 15-20 minutos la primera vez.

---

## 1. Instalar Node.js (5 min)

Node es lo que hace funcionar el proyecto en tu computadora.

1. Ir a [nodejs.org](https://nodejs.org)
2. Descargar la versión **LTS** (la verde, a la izquierda)
3. Instalar con las opciones por defecto (clic en *Siguiente* / *Next* hasta el final)

**Verificar que funcionó:**

Abrí Terminal (Mac) o PowerShell (Windows) y escribí:
```
node --version
```
Tiene que mostrar algo como `v20.x` o superior. Si muestra error, reinstalar.

---

## 2. Instalar VS Code (5 min)

VS Code es el editor donde vas a abrir el proyecto.

1. Ir a [code.visualstudio.com](https://code.visualstudio.com)
2. Clic en **Download** (detecta automáticamente Windows o Mac)
3. Instalar con las opciones por defecto
4. Abrir VS Code una vez para confirmar que arranca

---

## 3. Instalar Claude Code (10 min)

Claude Code es la IA que te va a ayudar a hacer cambios al proyecto **sin que tengas que saber programar**. Le escribís en español lo que querés cambiar y él lo hace.

1. Abrí VS Code
2. En la barra lateral izquierda, clic en el ícono de **Extensiones** (los cuatro cuadraditos)
3. En el buscador, escribir: `Claude Code`
4. Buscar el que dice **Claude Code** de **Anthropic** → clic en **Install**
5. Cuando termine de instalar, va a aparecer un mensaje pidiendo iniciar sesión con tu cuenta de Anthropic
6. Si no tenés cuenta, crear una en [claude.ai](https://claude.ai) primero
7. Necesitás un **plan pago** (Claude Pro o superior) para usar Claude Code sin límites estrictos

---

## Cómo usar Claude Code

Una vez instalado y con el proyecto abierto:

1. Abrir Claude Code (ícono en la barra lateral o atajo `Ctrl + L` / `Cmd + L`)
2. Escribirle lo que querés cambiar, por ejemplo:
   - *"Cambiá el título de la temporada 1 a 'Awakening'"*
   - *"Agregá un nuevo producto llamado 'Mentoría 1-1' a la tienda"*
   - *"El color del botón de comprar tiene que ser dorado más brillante"*

Claude te va a mostrar qué archivos va a modificar, vos aprobás (clic en *Allow* o presionar Enter), y listo.

---

## Importante: la mayoría de cosas se editan SIN código

Iniciá sesión en `los144000.com/miembros/login` con tu cuenta admin y podés editar directamente desde el navegador:

- Crear/editar/borrar **temporadas**
- Crear/editar/borrar **episodios** (subir videos, miniaturas, descripciones)
- Crear/editar/borrar **productos** de la tienda
- Crear/editar **módulos** dentro de cada producto
- Agregar **bloques de contenido** (texto rico, imágenes) arriba o abajo de cada video
- Moderar comentarios, mensajes, reportes
- Ver lista de miembros

**Solo abrí Claude Code cuando quieras cambiar el diseño o funcionalidades del sitio.** Para contenido (temporadas, episodios, productos), no hace falta tocar nada de código.

---

## Soporte

Si algo falla, mandame:
1. Captura de pantalla del error
2. Qué estabas intentando hacer
3. En qué paso de esta guía estás
