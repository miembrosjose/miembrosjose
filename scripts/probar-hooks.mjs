// ═══════════════════════════════════════════════════════════════════════════
//  NINGÚN HOOK DEBAJO DE UN «RETURN» · la prueba
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:hooks
//
// ── POR QUÉ EXISTE ESTO ────────────────────────────────────────────────────
// El 28 de octubre de 2026 un despliegue tumbó el área de miembros entera.
// La causa: un `useRef` y un `useEffect` colocados debajo del `return null`
// de `TelegramFab`, pegados al JSX, que es donde se leían mejor.
//
// React cuenta los hooks de cada pintado y espera siempre los mismos. Con el
// hook debajo de la salida, el componente ejecutaba dos hooks estando oculto
// y cuatro estando visible. En cuanto pasaba de uno a otro —cargar antes de
// que llegue la sesión, entrar en mensajes y volver— React tiraba el árbol.
//
// ── POR QUÉ NO LO CAZÓ NADA DE LO QUE YA HABÍA ────────────────────────────
// TypeScript compila eso perfectamente: no es un error de tipos. El `build`
// de Next también. Las seis baterías de pruebas pasaron. Y el `curl` contra
// producción devolvió lo correcto, porque sin sesión el componente nunca
// llega a la transición que rompe.
//
// Solo se ve ejecutando la aplicación, con sesión, y pasando de oculto a
// visible. Es decir: solo se ve cuando ya está desplegado.
//
// ── POR QUÉ NO SE USA ESLINT ───────────────────────────────────────────────
// La regla `react-hooks/rules-of-hooks` hace justo esto y lo hace mejor. No
// está instalada —el proyecto no tiene ESLint— y meter el plugin con su
// configuración es una decisión que no corresponde tomar de paso mientras se
// arregla una caída. Esto cubre el caso concreto que rompió producción, y
// cuando ESLint entre, esto se borra.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")

const CARPETAS = ["app", "lib"]
const SALTAR = new Set(["node_modules", ".next", ".git", "dist"])

const ES_HOOK = /\b(use[A-Z]\w*)\s*\(/

/** Una función que puede tener hooks: componente (Mayúscula) o hook propio. */
const ES_COMPONENTE = /(?:export\s+)?(?:async\s+)?function\s+([A-Z]\w*|use[A-Z]\w*)\s*\(|(?:const|let)\s+([A-Z]\w*|use[A-Z]\w*)\s*(?::[^=]+)?=\s*(?:async\s*)?\(/

/**
 * Quita comentarios y cadenas, dejando los saltos de línea.
 *
 * Sin esto, una llave dentro de un texto —`"{"`— descuadra el recuento de
 * profundidad, y a partir de ahí todo lo que se diga del archivo es mentira.
 * Los saltos se conservan para que los números de línea sigan valiendo.
 */
function despejar(src) {
  let out = ""
  let i = 0
  const n = src.length
  while (i < n) {
    const c = src[i]
    const d = src[i + 1]

    if (c === "/" && d === "/") {
      while (i < n && src[i] !== "\n") i++
      continue
    }
    if (c === "/" && d === "*") {
      i += 2
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) {
        out += src[i] === "\n" ? "\n" : " "
        i++
      }
      i += 2
      continue
    }
    if (c === '"' || c === "'" || c === "`") {
      const cierre = c
      i++
      while (i < n && src[i] !== cierre) {
        if (src[i] === "\\") { i += 2; continue }
        out += src[i] === "\n" ? "\n" : " "
        i++
      }
      i++
      out += " "
      continue
    }
    out += c
    i++
  }
  return out
}

/**
 * Los hallazgos de un archivo.
 *
 * ── CÓMO SE DISTINGUE UN «RETURN» QUE IMPORTA ─────────────────────────────
 * Solo cuentan los que están en el cuerpo del componente, no los que están
 * dentro de una función anidada. El `return` de limpieza de un `useEffect`
 * —`return () => {...}`— es perfectamente legítimo y no sale.
 *
 * Para eso cada llave que se abre recuerda si abría una FUNCIÓN. Se mira la
 * línea donde se abrió: si lleva `=>` o `function`, lo era.
 */
function revisar(ruta, src) {
  const limpio = despejar(src)
  const lineas = limpio.split("\n")
  const hallazgos = []

  // Pila de llaves abiertas. Cada entrada dice si abrió una función.
  const pila = []
  let linea = 0

  // Por cada función con hooks que se está recorriendo: en qué línea se vio
  // la primera salida.
  const salidaDe = new Map()

  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i]
    if (c === "\n") { linea++; continue }

    if (c === "{") {
      const texto = lineas[linea] || ""
      // La llave de un bloque de función viene en la misma línea que `=>` o
      // `function`. Un `if (x) {` no.
      const abreFuncion = /=>|function\b/.test(texto)
      pila.push({ abreFuncion, linea })
      continue
    }

    if (c === "}") {
      const fuera = pila.pop()
      // Al cerrar una función se olvida lo que se sabía de ella.
      if (fuera?.abreFuncion) salidaDe.delete(pila.filter((x) => x.abreFuncion).length + 1)
      continue
    }

    // Solo se mira al principio de una palabra.
    if (i > 0 && /[\w$]/.test(limpio[i - 1])) continue

    const nivelFuncion = pila.filter((x) => x.abreFuncion).length

    // Nivel 1 = dentro del componente, fuera de cualquier función anidada.
    if (nivelFuncion !== 1) continue

    // ¿Es este componente uno de los que pueden tener hooks?
    const inicio = pila.find((x) => x.abreFuncion)
    const cabecera = lineas[inicio?.linea ?? 0] || ""
    if (!ES_COMPONENTE.test(cabecera)) continue

    const resto = limpio.slice(i, i + 220)

    if (/^return\b/.test(resto)) {
      if (!salidaDe.has(1)) salidaDe.set(1, linea + 1)

      // ── EL HOOK QUE VA DENTRO DEL PROPIO RETURN ──────────────────────
      // `return useContext(X)` es la forma normal de escribir un hook
      // propio, y el `useContext` no está DESPUÉS de la salida: ES la
      // salida. Sin saltar el resto de la línea, los seis hooks de
      // contexto del proyecto salían marcados, y una prueba que acusa a
      // código correcto se desactiva a la semana.
      while (i < limpio.length && limpio[i] !== "\n") i++
      linea++
      continue
    }

    const hook = resto.match(ES_HOOK)
    if (hook && resto.indexOf(hook[0]) === 0) {
      const salida = salidaDe.get(1)
      if (salida !== undefined) {
        hallazgos.push({
          ruta,
          hook: hook[1],
          linea: linea + 1,
          salida,
          componente: (cabecera.match(ES_COMPONENTE) || [])[1]
            || (cabecera.match(ES_COMPONENTE) || [])[2]
            || "?",
        })
      }
    }
  }

  return hallazgos
}

function recorrer(dir, archivos = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SALTAR.has(e.name)) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) recorrer(p, archivos)
    else if (/\.tsx$/.test(e.name)) archivos.push(p)
  }
  return archivos
}

// ── ARRANQUE ───────────────────────────────────────────────────────────────

const archivos = CARPETAS
  .map((c) => path.join(raiz, c))
  .filter((d) => fs.existsSync(d))
  .flatMap((d) => recorrer(d))

console.log(`\nRevisando ${archivos.length} componentes…\n`)

const todos = []
for (const a of archivos) {
  try {
    todos.push(...revisar(path.relative(raiz, a).replace(/\\/g, "/"), fs.readFileSync(a, "utf8")))
  } catch (e) {
    console.log(`  (no se pudo revisar ${a}: ${e.message})`)
  }
}

if (todos.length === 0) {
  console.log("  ok  ningún hook debajo de un return\n")
  console.log("TODO BIEN\n")
  process.exit(0)
}

for (const h of todos) {
  console.log(`FALLA  ${h.ruta}:${h.linea}`)
  console.log(`       \`${h.hook}\` en «${h.componente}», debajo del return de la línea ${h.salida}.`)
  console.log(`       React espera los mismos hooks en cada pintado. Cuando ese return`)
  console.log(`       se toma, este hook no se ejecuta, y el árbol se cae al cambiar.`)
  console.log(`       Súbelo por encima de la salida.\n`)
}

console.log(`${todos.length} ${todos.length === 1 ? "FALLO" : "FALLOS"}\n`)
process.exit(1)
