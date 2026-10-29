// ═══════════════════════════════════════════════════════════════════════════
//  EL CORREO ESCRITO A MANO · la prueba
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:correo
//
// ── QUÉ SE PRUEBA, Y POR QUÉ JUSTO ESTO ────────────────────────────────────
// Dos cosas, y las dos fallan en silencio:
//
//   LA LIMPIEZA. Un `<script>` que se cuela no rompe nada visible. No se vería
//   hasta que alguien abriera la vista previa en el panel y ese script se
//   ejecutara con su sesión de administración delante.
//
//   QUE SEA EL MISMO HTML. La vista previa, el correo de prueba y el envío
//   real llaman todos a `renderCorreo`. Si alguien partiera ese camino en
//   dos, la vista previa seguiría enseñando algo bonito y lo que saldría
//   sería otra cosa. Nadie lo notaría hasta tener mil correos fuera.

import fs from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const aqui = dirname(fileURLToPath(import.meta.url))
const ruta = (...p) => "file:///" + join(aqui, "..", ...p).replace(/\\/g, "/")

const { limpiarHtmlCorreo, revisarHtmlCorreo } = await import(
  ruta("lib", "comunicaciones", "html-correo.ts")
)
const leer = (...p) => fs.readFileSync(join(aqui, "..", ...p), "utf8")

let fallos = 0
const comprobar = (titulo, bien, detalle = "") => {
  if (!bien) fallos++
  console.log(`${bien ? "  ok" : "FALLA"}  ${titulo}${bien || !detalle ? "" : `  — ${detalle}`}`)
}

// ── LO QUE NO PUEDE SALIR ──────────────────────────────────────────────────

console.log("\n— Lo que se quita —")

const peligros = [
  ["un script", `<p>Hola</p><script>alert(1)</script>`, /<script/i],
  ["un script con atributos", `<script type="text/javascript" src="x.js"></script>`, /<script/i],
  ["un iframe", `<iframe src="https://x.com"></iframe>`, /<iframe/i],
  ["un formulario", `<form action="/x"><input name="clave"></form>`, /<form|<input/i],
  ["un onclick", `<a href="https://x.com" onclick="robar()">Pulsa</a>`, /onclick/i],
  ["un onerror en una imagen", `<img src="x.png" onerror="alert(1)">`, /onerror/i],
  ["un onload en el cuerpo", `<body onload="alert(1)">hola</body>`, /onload/i],
  ["javascript: en un enlace", `<a href="javascript:alert(1)">x</a>`, /javascript:/i],
  ["data: en un enlace", `<a href="data:text/html,<script>alert(1)</script>">x</a>`, /data:text/i],
  ["un srcdoc", `<iframe srcdoc="<script>alert(1)</script>"></iframe>`, /srcdoc/i],
  ["expression() de CSS", `<div style="width:expression(alert(1))">x</div>`, /expression\s*\(/i],
  ["una etiqueta base", `<base href="https://malo.com/">`, /<base/i],
  ["un meta de recarga", `<meta http-equiv="refresh" content="0;url=https://malo.com">`, /<meta/i],
]

for (const [que, html, prohibido] of peligros) {
  const limpio = limpiarHtmlCorreo(html)
  comprobar(`fuera ${que}`, !prohibido.test(limpio), JSON.stringify(limpio).slice(0, 90))
}

// Mayúsculas, espacios raros y atributos sin comillas: las tres formas
// clásicas de que un filtro escrito a ojo deje pasar lo que buscaba.
console.log("\n— Y no vale disfrazarlo —")

const disfraces = [
  ["mayúsculas", `<SCRIPT>alert(1)</SCRIPT>`, /<script/i],
  ["espacios antes del igual", `<a href="#" onclick = "x()">y</a>`, /onclick/i],
  ["sin comillas", `<img src=x onerror=alert(1)>`, /onerror/i],
  ["mezclado", `<ScRiPt >alert(1)</ScRiPt>`, /<script/i],
]
for (const [que, html, prohibido] of disfraces) {
  comprobar(`${que}`, !prohibido.test(limpiarHtmlCorreo(html)), JSON.stringify(limpiarHtmlCorreo(html)).slice(0, 80))
}

// ── LO QUE SÍ TIENE QUE QUEDARSE ───────────────────────────────────────────
//
// Un saneador que se pasa de celoso es igual de inútil: si borra la
// maquetación, nadie lo usa y se acaba quitando entero.

console.log("\n— Lo que NO se toca —")

const intacto = `<table role="presentation" width="600"><tr><td style="padding:20px;color:#fff;">
<a href="https://los144000.com/miembros">Entrar</a>
<img src="https://los144000.com/x.png" alt="Logo" width="120">
</td></tr></table>`

const limpioIntacto = limpiarHtmlCorreo(intacto)
comprobar("la tabla sigue entera", limpioIntacto.includes("<table"))
comprobar("el estilo en línea se queda", limpioIntacto.includes("padding:20px"))
comprobar("el enlace https se queda", limpioIntacto.includes("https://los144000.com/miembros"))
comprobar("la imagen se queda", limpioIntacto.includes("x.png"))
comprobar("el alt se queda", limpioIntacto.includes('alt="Logo"'))

// Los comentarios condicionales son la ÚNICA forma de arreglar Outlook.
// Quitarlos a ciegas rompería justo el cliente más difícil.
const mso = `<!--[if mso]><table><tr><td><![endif]--><p>hola</p><!--[if mso]></td></tr></table><![endif]-->`
comprobar(
  "los comentarios de Outlook sobreviven",
  limpiarHtmlCorreo(mso).includes("[if mso]"),
  "sin ellos no hay forma de arreglar Outlook",
)

comprobar("mailto: se queda", limpiarHtmlCorreo(`<a href="mailto:a@b.com">x</a>`).includes("mailto:"))
comprobar("un enlace relativo se queda", limpiarHtmlCorreo(`<a href="/miembros">x</a>`).includes('href="/miembros"'))

// ── LOS AVISOS ─────────────────────────────────────────────────────────────

console.log("\n— Lo que se avisa —")

const dice = (html, trozo) =>
  revisarHtmlCorreo(html).some((a) => a.mensaje.toLowerCase().includes(trozo))

comprobar("vacío es un error, no un aviso",
  revisarHtmlCorreo("").some((a) => a.nivel === "error"))
comprobar("se avisa de flex", dice(`<div style="display:flex">x</div>`, "outlook"))
comprobar("se avisa de una imagen sin alt", dice(`<img src="x.png">`, "alternativo"))
comprobar("no se avisa si tiene alt", !dice(`<img src="x.png" alt="y">`, "alternativo"))
comprobar("se avisa del script que se va a quitar", dice(`<script></script>`, "script"))
comprobar("se avisa de la hoja de estilos", dice(`<style>p{color:red}</style>`, "gmail"))

// Un aviso NO puede impedir enviar: puede que alguien sepa que ese correo va
// a una lista que solo usa Gmail.
comprobar(
  "los avisos no son errores",
  revisarHtmlCorreo(`<div style="display:flex">x</div>`).every((a) => a.nivel === "aviso"),
  "si bloquearan el envío, la gente aprendería a rodearlos",
)

// ── UN SOLO CAMINO DE DIBUJO ───────────────────────────────────────────────
//
// Esto no se ejecuta: se LEE. Y es a propósito.
//
// Lo que puede romper la promesa de «lo que se ve es lo que se manda» no es
// un fallo de cálculo: es que alguien, con toda la buena intención, escriba
// un segundo camino para el modo código. La vista previa seguiría enseñando
// algo bonito, el envío mandaría otra cosa, y las dos funcionarían.
//
// Eso no se caza ejecutando una función. Se caza mirando quién llama a quién.

console.log("\n— Un solo camino de dibujo —")

const RUTAS = [
  ["la vista previa", "app/api/admin/comunicaciones/preview/route.ts"],
  ["el correo de prueba", "app/api/admin/comunicaciones/[id]/prueba/route.ts"],
  ["el envío real", "app/api/admin/comunicaciones/[id]/enviar/route.ts"],
]

for (const [que, ruta] of RUTAS) {
  const src = leer(ruta)
  comprobar(
    `${que} dibuja con renderCorreo`,
    /\brenderCorreo\s*\(/.test(src),
    "si dibujara por su cuenta, podría quedarse atrás sin que nadie lo notara",
  )
  comprobar(
    `${que} manda también el texto plano`,
    /\brenderTexto\s*\(/.test(src),
  )
}

const plantilla = leer("lib", "comunicaciones", "plantilla.ts")

comprobar(
  "el modo código se decide DENTRO de renderCorreo",
  /export function renderCorreo[\s\S]{0,800}?d\.modo === "codigo"/.test(plantilla),
  "si se decidiera fuera, cada ruta tendría que acordarse de decidirlo igual",
)

comprobar(
  "y el HTML se limpia al dibujar, no al guardar",
  /limpiarHtmlCorreo\(d\.html/.test(plantilla),
  "guardarlo ya limpio destruiría el original",
)

comprobar(
  "el modo código también tiene texto plano",
  /renderTexto[\s\S]{0,400}?d\.modo === "codigo"/.test(plantilla),
  "un texto plano vacío puntúa peor en los filtros de spam",
)

// El puente entre la fila y el dibujo es uno solo. Si cada ruta leyera la
// fila por su cuenta, el modo código se quedaría fuera de alguna.
comprobar(
  "datosDesdeComunicacion pasa el modo",
  /datosDesdeComunicacion[\s\S]*?modo:\s*c\.email_modo/.test(plantilla),
)

comprobar(
  "y cae a visual cuando la columna no existe",
  /c\.email_modo === "codigo" \? "codigo" : "visual"/.test(plantilla),
  "entre desplegar y correr el SQL la columna no llega",
)

console.log(fallos === 0 ? "\nTODO BIEN\n" : `\n${fallos} FALLOS\n`)
process.exit(fallos === 0 ? 0 : 1)
