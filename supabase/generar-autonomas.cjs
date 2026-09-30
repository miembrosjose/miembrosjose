/**
 * Genera las versiones AUTÓNOMAS de las Edge Functions, para pegar en el panel.
 *
 * ── POR QUÉ EXISTE ESTO ────────────────────────────────────────────────────
 * El panel de Supabase no resuelve imports relativos entre carpetas, así que
 * `../_shared/acceso.ts` no funciona pegando código a mano. Hace falta que
 * cada función lleve dentro lo que comparte.
 *
 * Duplicar ese bloque a mano tres veces es la forma más segura de que dentro
 * de dos meses haya tres versiones distintas de «quién puede entrar», que es
 * exactamente el problema que veníamos de arreglar: la comprobación de
 * membresía estaba escrita tres veces y no eran iguales.
 *
 * Así que se sigue editando UN solo archivo —_shared/acceso.ts— y esto pega
 * el resultado dentro de cada función. Si cambia la regla, se corre otra vez
 * y se vuelven a pegar las tres.
 *
 *     node supabase/generar-autonomas.cjs
 *
 * Lo generado va a supabase/standalone/ y NO se edita a mano: se regenera.
 */
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "functions");
const SALIDA = path.join(__dirname, "standalone");

const FUNCIONES = ["telegram-protocols-access", "telegram-webhook", "telegram-sweep"];

// El import de supabase-js se sube a la cabecera: lo necesitan tanto el
// bloque compartido como, en algún caso, la propia función.
const IMPORT_SUPABASE = 'import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";';

function bloqueCompartido() {
  let s = fs.readFileSync(path.join(RAIZ, "_shared", "acceso.ts"), "utf8");

  // Fuera la cabecera de imports: se hoistea arriba del archivo final.
  s = s.replace(/^import .*?;$/gm, "");

  // `export` no estorba en un módulo de Deno, pero deja la impresión de que
  // alguien importa esto desde fuera. Aquí ya no lo hace nadie.
  s = s.replace(/^export /gm, "");

  return s.trim();
}

function generar(nombre) {
  const origen = path.join(RAIZ, nombre, "index.ts");
  let s = fs.readFileSync(origen, "utf8");

  // El import del bloque compartido puede ocupar varias líneas.
  const antes = s;
  s = s.replace(/import\s*\{[\s\S]*?\}\s*from\s*"\.\.\/_shared\/acceso\.ts";\s*/m, "");
  if (s === antes) {
    console.error(`  ⚠ ${nombre}: no encontré el import de _shared. ¿Cambió?`);
    process.exitCode = 1;
  }

  // Si la función ya traía su propio createClient, el de la cabecera lo cubre.
  s = s.replace(/^import \{ createClient \} from "npm:@supabase\/supabase-js@2";\s*$/m, "");

  // La cabecera de comentarios del archivo original se queda donde está; el
  // bloque compartido entra justo después de los imports que quedan.
  const aviso = `
// ═══════════════════════════════════════════════════════════════════════════
//  ▼▼▼  BLOQUE COMPARTIDO — GENERADO, NO EDITAR AQUÍ  ▼▼▼
//
//  Copia de supabase/functions/_shared/acceso.ts, incrustada porque el panel
//  de Supabase no resuelve imports entre carpetas.
//
//  Para cambiar algo de esto: edita _shared/acceso.ts y vuelve a correr
//  \`node supabase/generar-autonomas.cjs\`. Editarlo aquí deja esta función
//  diciendo una cosa y las otras dos diciendo otra.
// ═══════════════════════════════════════════════════════════════════════════

${bloqueCompartido()}

// ═══════════════════════════════════════════════════════════════════════════
//  ▲▲▲  FIN DEL BLOQUE COMPARTIDO  ▲▲▲
// ═══════════════════════════════════════════════════════════════════════════
`;

  // ── DÓNDE SE INSERTA ────────────────────────────────────────────────────
  // Justo antes de la primera declaración real, pero POR ENCIMA del
  // comentario que la explica. Buscar simplemente «la primera línea que
  // empieza por const» dejaba el comentario de esa constante huérfano, colgado
  // de la cabecera del archivo y separado de lo que describe.
  const lineas = s.split("\n");

  let corte = lineas.findIndex((l) =>
    /^(const|let|var|function|async function|type|interface|Deno\.serve)\b/.test(l.trim()),
  );
  if (corte < 0) corte = lineas.length;

  // Y se retrocede por encima del comentario pegado a esa declaración.
  while (corte > 0) {
    const anterior = lineas[corte - 1].trim();
    if (anterior.startsWith("//") || anterior.startsWith("/*") || anterior.startsWith("*")) corte--;
    else break;
  }

  const salida =
    lineas.slice(0, corte).join("\n").trimEnd() +
    "\n\n" + IMPORT_SUPABASE + "\n" + aviso + "\n" +
    lineas.slice(corte).join("\n");

  fs.mkdirSync(SALIDA, { recursive: true });
  const destino = path.join(SALIDA, nombre + ".ts");
  fs.writeFileSync(destino, salida.replace(/\n{4,}/g, "\n\n\n"));

  const cuantas = salida.split("\n").length;
  console.log(`  ok  ${nombre.padEnd(28)} ${cuantas} líneas`);
}

console.log("Generando funciones autónomas para pegar en el panel:");
for (const f of FUNCIONES) generar(f);
console.log(`\nListas en supabase/standalone/`);
