// ═══════════════════════════════════════════════════════════════════════════
//  LEER EL CÓDIGO DE VTURB · la prueba del intérprete
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:vturb
//
// POR QUÉ ESTA PRUEBA EXISTE
//   Todo el archivo de los Encuentros cuelga de una función que lee un pegote
//   de HTML ajeno. Si esa lectura falla, no falla con un error: falla
//   enseñando una miniatura equivocada o un rectángulo negro, y eso solo se
//   descubre cuando alguien entra a ver una grabación.
//
//   VTurb da DOS formatos de código y los dos tienen que entrar. Probarlo a
//   mano exige subir un vídeo de verdad cada vez; aquí se prueba en un
//   milisegundo y sin tocar su cuenta.
//
// LO QUE ESTO NO PRUEBA
//   Que la dirección de la miniatura exista de verdad en los servidores de
//   VTurb. Eso NO se puede saber sin preguntárselo a ellos, y es exactamente
//   lo que hace `miniaturaExiste` al guardar. Aquí solo se comprueba que la
//   dirección se construye bien.

import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const aqui = dirname(fileURLToPath(import.meta.url))
const { leerVturb } = await import(
  "file:///" + join(aqui, "..", "lib", "red", "vturb.ts").replace(/\\/g, "/")
)

const CUENTA = "9eb16354-b405-7b75-06df-99d12e3463e7"
const PLAYER = "68f3a1b2c4d5e6f708192a3b"

// El formato moderno: un elemento propio de VTurb y el script al lado.
const MODERNO = `
<vturb-smartplayer id="vid-${PLAYER}" style="display: block; margin: 0 auto; width: 100%;"></vturb-smartplayer>
<script type="text/javascript">
  var s=document.createElement("script"); s.src="https://scripts.converteai.net/${CUENTA}/players/${PLAYER}/v4/player.js", s.async=!0, document.head.appendChild(s);
</script>`

// El formato clásico: la miniatura viene ESCRITA dentro.
const CLASICO = `
<div id="vid_${PLAYER}" style="position:relative;width:100%;padding:56.25% 0 0;">
  <img id="thumb_${PLAYER}" src="https://images.converteai.net/${CUENTA}/players/${PLAYER}/thumbnail.jpg" style="position:absolute;width:100%;height:100%;top:0;left:0;object-fit:cover;">
  <div id="backdrop_${PLAYER}" style="backdrop-filter:blur(5px);position:absolute;inset:0;"></div>
</div>
<script type="text/javascript" id="scr_${PLAYER}">var s=document.createElement("script");s.src="https://scripts.converteai.net/${CUENTA}/players/${PLAYER}/v4/player.js",s.async=!0,document.head.appendChild(s);</script>`

let fallos = 0
const comprobar = (titulo, real, esperado) => {
  const bien = real === esperado
  if (!bien) fallos++
  console.log(
    `${bien ? "  ok" : "FALLA"}  ${titulo}` +
    (bien ? "" : `\n        esperaba: ${esperado}\n        salió:    ${real}`),
  )
}

console.log("\n── El formato moderno ───────────────────────────────────────")
{
  const r = leerVturb(MODERNO)
  comprobar("se entiende", r.ok, true)
  const g = r.grabacion
  comprobar("saca la cuenta", g.cuentaId, CUENTA)
  comprobar("saca el reproductor", g.playerId, PLAYER)
  comprobar("saca el elemento nativo", g.elementoId, `vid-${PLAYER}`)
  comprobar(
    "deduce la miniatura",
    g.miniatura,
    `https://images.converteai.net/${CUENTA}/players/${PLAYER}/thumbnail.jpg`,
  )
  comprobar("sabe que la dedujo", g.miniaturaDelCodigo, false)
  comprobar(
    "arma el script",
    g.script,
    `https://scripts.converteai.net/${CUENTA}/players/${PLAYER}/v4/player.js`,
  )
}

console.log("\n── El formato clásico ───────────────────────────────────────")
{
  const r = leerVturb(CLASICO)
  comprobar("se entiende", r.ok, true)
  const g = r.grabacion
  comprobar("saca la cuenta", g.cuentaId, CUENTA)
  comprobar("saca el reproductor", g.playerId, PLAYER)
  // Sin elemento nativo → el reproductor irá en un iframe.
  comprobar("no inventa elemento nativo", g.elementoId, null)
  comprobar(
    "toma la miniatura DEL CÓDIGO, no deducida",
    g.miniaturaDelCodigo,
    true,
  )
  comprobar(
    "arma el iframe",
    g.iframe,
    `https://scripts.converteai.net/${CUENTA}/players/${PLAYER}/v4/embed.html`,
  )
}

console.log("\n── Una versión futura del reproductor ───────────────────────")
{
  // Estaba escrito «v4» a fuego. Con una v5, un código válido daba el error
  // de «no encuentro el código», que manda a buscar donde no está.
  const r = leerVturb(MODERNO.replace(/\/v4\//g, "/v5/"))
  comprobar("una v5 se entiende igual", r.ok, true)
  comprobar("y respeta la versión", r.grabacion?.version, "v5")
  comprobar(
    "sin colar la v4 en el script",
    r.grabacion?.script,
    `https://scripts.converteai.net/${CUENTA}/players/${PLAYER}/v5/player.js`,
  )
}

console.log("\n── Lo que NO se acepta ──────────────────────────────────────")
{
  comprobar("nada pegado", leerVturb("").ok, false)
  comprobar("solo espacios", leerVturb("   \n  ").ok, false)
  comprobar("texto cualquiera", leerVturb("hola, aquí va el video").ok, false)

  // El error más probable de todos, y tiene su propio aviso.
  const pagina = leerVturb("https://app.vturb.com/videos/68f3a1b2c4d5e6f708192a3b")
  comprobar("la dirección de la página de VTurb", pagina.ok, false)
  comprobar(
    "y se le dice que busque el icono </>",
    pagina.motivo?.includes("</>"),
    true,
  )

  // Media línea copiada: con la dirección del script basta.
  const media = leerVturb(
    `https://scripts.converteai.net/${CUENTA}/players/${PLAYER}/v4/player.js`,
  )
  comprobar("la dirección del script a secas SÍ vale", media.ok, true)
}

console.log("\n── Que un pegote hostil no pueda cargar nada ────────────────")
{
  // De todo el texto solo sobreviven dos identificadores, y las direcciones
  // se construyen desde cero. Aunque alguien colara un script de otro sitio,
  // de aquí no puede salir más que converteai.
  const HOSTIL = `
    <script src="https://sitio-de-otro.example/x.js"></script>
    <img src="https://sitio-de-otro.example/trampa.jpg">
    <script>var s=document.createElement("script");s.src="https://scripts.converteai.net/${CUENTA}/players/${PLAYER}/v4/player.js";</script>`

  const r = leerVturb(HOSTIL)
  comprobar("se entiende", r.ok, true)
  comprobar(
    "el script solo puede ser de converteai",
    r.grabacion?.script.startsWith("https://scripts.converteai.net/"),
    true,
  )
  comprobar(
    "el iframe solo puede ser de converteai",
    r.grabacion?.iframe.startsWith("https://scripts.converteai.net/"),
    true,
  )
  comprobar(
    "la miniatura solo puede ser de converteai",
    r.grabacion?.miniatura.startsWith("https://images.converteai.net/"),
    true,
  )
  comprobar(
    "el elemento nativo no se inventa desde un id ajeno",
    r.grabacion?.elementoId,
    null,
  )
}

console.log(
  fallos === 0
    ? "\n✓ El intérprete de VTurb entiende los dos formatos y rechaza el resto.\n"
    : `\n✗ ${fallos} comprobación(es) fallan.\n`,
)
process.exit(fallos === 0 ? 0 : 1)
