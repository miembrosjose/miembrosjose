// ═══════════════════════════════════════════════════════════════════════════
//  ACCESO DE REGALO · la prueba
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:regalo
//
// POR QUÉ ESTA PRUEBA EXISTE
//   `member-sync` es el único camino por el que alguien entra en la
//   plataforma. Si esa petición falla, la persona paga en Stripe, recibe su
//   recibo y no puede entrar; y nadie se entera hasta que escribe.
//
//   El embudo va a empezar a enviar cuatro campos nuevos en ese aviso. Lo
//   que se comprueba aquí es que NINGUNA forma de esos cuatro campos puede
//   impedir una activación: ni que falten, ni que vengan con el tipo
//   equivocado, ni que traigan basura, ni que la base de datos todavía no
//   tenga las columnas donde guardarlos.
//
//   El peor caso de esta tanda no es perder una etiqueta del panel. Es que
//   alguien no pueda entrar. Las dos cosas se prueban por separado.

import { fileURLToPath, pathToFileURL } from "node:url"
import { dirname, join } from "node:path"

const aqui = dirname(fileURLToPath(import.meta.url))
const ruta = join(aqui, "..", "app", "api", "internal", "member-sync", "regalo.ts")
const { leerCamposDeRegalo, cambiosDeRegalo, esColumnaQueNoExiste, COLUMNAS_DE_REGALO } =
  await import(pathToFileURL(ruta).href)

let pasadas = 0
let fallos = 0

function comprobar(titulo, condicion, detalle = "") {
  if (condicion) {
    pasadas++
    console.log(`  ok    ${titulo}`)
  } else {
    fallos++
    console.log(`  FALLA ${titulo}${detalle ? "  → " + detalle : ""}`)
  }
}

/** El aviso de siempre, tal como llega hoy. Sin nada de regalo. */
const AVISO_DE_SIEMPRE = {
  action: "activate",
  email: "alguien@correo.com",
  source_event_id: "evt_1234567890",
  source_event_type: "checkout.session.completed",
  source_event_created_at: 1764000000,
  subscription_status: "active",
  stripe_customer_id: "cus_ABCDEFGHIJKL",
  stripe_subscription_id: "sub_ABCDEFGHIJKL",
  current_period_end: "2026-12-25T00:00:00.000Z",
}

console.log("\n═══ 1 · LO QUE LLEGA HOY NO CAMBIA ═══\n")
// Antes de que el embudo encienda el interruptor, el aviso es el de siempre.
// Si esto escribiera algo, marcaría a todo el mundo sin que nadie lo pidiera.
{
  const c = leerCamposDeRegalo(AVISO_DE_SIEMPRE)
  comprobar("un aviso sin campos de regalo no opina", c.tipoAcceso === null)
  comprobar("...y no escribe ninguna columna", Object.keys(cambiosDeRegalo(c, null)).length === 0)
}
{
  // Y a quien ya estaba marcado como regalo no se le cambia la etiqueta
  // porque llegue una renovación de las de siempre.
  const c = leerCamposDeRegalo({ ...AVISO_DE_SIEMPRE, action: "renew" })
  const cambios = cambiosDeRegalo(c, { tipo_acceso: "regalo", pago_real_at: null })
  comprobar("una renovación muda no toca la etiqueta de quien es de regalo", !("tipo_acceso" in cambios))
}

console.log("\n═══ 2 · CAMPOS DESCONOCIDOS: SE IGNORAN, NO RECHAZAN ═══\n")
// Esto es lo que más importa de toda la tanda. El embudo y la plataforma se
// publican por separado, así que el embudo puede empezar a enviar un campo
// nuevo antes de que aquí se entienda. Si eso rechazara la petición, nadie
// podría activarse.
{
  const conBasura = {
    ...AVISO_DE_SIEMPRE,
    acceso_regalo: true,
    codigo_promocional: "LLAMADO144",
    primer_pago: 0,
    pago_real_at: null,
    // campos que esta plataforma no conoce de nada
    campo_del_futuro: "lo que sea",
    otra_cosa: { anidada: [1, 2, 3] },
  }
  const c = leerCamposDeRegalo(conBasura)
  comprobar("los campos desconocidos no estorban", c.tipoAcceso === "regalo")
  comprobar("...y el código se lee igual", c.codigoPromocional === "LLAMADO144")

  // El ÚNICO límite del endpoint que podría rechazar un aviso por traer
  // campos de más es el tope de 8 KB del cuerpo. Se mide de verdad.
  const bytes = new TextEncoder().encode(JSON.stringify(conBasura)).length
  comprobar(`el aviso completo cabe de sobra en 8 KB (${bytes} bytes)`, bytes < 8 * 1024)
}

console.log("\n═══ 3 · REGALO Y PAGO ═══\n")
{
  // Lo que llegará cuando alguien entre con el código en un encuentro.
  const c = leerCamposDeRegalo({
    ...AVISO_DE_SIEMPRE,
    acceso_regalo: true,
    codigo_promocional: "LLAMADO144",
    primer_pago: 0,
    pago_real_at: null,
  })
  comprobar("entra con código → regalo", c.tipoAcceso === "regalo")
  const cambios = cambiosDeRegalo(c, null)
  comprobar("se guarda la etiqueta", cambios.tipo_acceso === "regalo")
  comprobar("se guarda el código", cambios.codigo_promocional === "LLAMADO144")
  comprobar("se guarda el cero", cambios.primer_pago === 0)
  comprobar("no se inventa fecha de cobro", !("pago_real_at" in cambios))
}
{
  // Y lo que llegará un mes después, cuando Stripe cobre de verdad.
  const c = leerCamposDeRegalo({
    ...AVISO_DE_SIEMPRE,
    action: "renew",
    acceso_regalo: false,
    codigo_promocional: "LLAMADO144",
    primer_pago: 14.99,
    pago_real_at: "2026-12-25T10:30:00Z",
  })
  comprobar("el primer cobro real → pago", c.tipoAcceso === "pago")
  const cambios = cambiosDeRegalo(c, { tipo_acceso: "regalo", pago_real_at: null })
  comprobar("la etiqueta pasa a pago", cambios.tipo_acceso === "pago")
  comprobar("queda la fecha del cobro", cambios.pago_real_at === "2026-12-25T10:30:00.000Z")
  comprobar("y el importe en unidades de la moneda", cambios.primer_pago === 14.99)
}

console.log("\n═══ 4 · LA CONTABILIDAD NO SE DESHACE ═══\n")
// Quien ya pagó de verdad no vuelve a la cuenta de los regalos por un aviso
// repetido o que llega tarde.
{
  const c = leerCamposDeRegalo({ ...AVISO_DE_SIEMPRE, acceso_regalo: true })
  const cambios = cambiosDeRegalo(c, { tipo_acceso: "pago", pago_real_at: "2026-10-01T00:00:00Z" })
  comprobar("a quien ya pagó no se le vuelve a llamar regalo", !("tipo_acceso" in cambios))
}
{
  const c = leerCamposDeRegalo({ ...AVISO_DE_SIEMPRE, pago_real_at: null })
  const cambios = cambiosDeRegalo(c, { tipo_acceso: "pago", pago_real_at: "2026-10-01T00:00:00Z" })
  comprobar("la fecha de un cobro que ya ocurrió no se borra", !("pago_real_at" in cambios))
}

console.log("\n═══ 5 · TIPOS EQUIVOCADOS: SE PIERDE LA ETIQUETA, NO EL ACCESO ═══\n")
// Un campo mal formado del embudo no puede tumbar una activación. Lo que
// hace es no decir nada, que es lo correcto: mejor sin etiqueta que fuera.
for (const malo of ["true", 1, "si", [], {}, "regalo"]) {
  const c = leerCamposDeRegalo({ ...AVISO_DE_SIEMPRE, acceso_regalo: malo })
  comprobar(`acceso_regalo = ${JSON.stringify(malo)} no opina`, c.tipoAcceso === null)
}
{
  const c = leerCamposDeRegalo({ ...AVISO_DE_SIEMPRE, codigo_promocional: 144 })
  comprobar("un código que viene como número se ignora", !c.presentes.codigoPromocional)
}
{
  const c = leerCamposDeRegalo({ ...AVISO_DE_SIEMPRE, primer_pago: "0" })
  comprobar("un importe que viene como texto se ignora", !c.presentes.primerPago)
}
{
  const c = leerCamposDeRegalo({ ...AVISO_DE_SIEMPRE, primer_pago: -5 })
  comprobar("un importe negativo se ignora", !c.presentes.primerPago)
}
{
  const c = leerCamposDeRegalo({ ...AVISO_DE_SIEMPRE, primer_pago: Number.NaN })
  comprobar("un importe que no es número se ignora", !c.presentes.primerPago)
}
{
  const c = leerCamposDeRegalo({ ...AVISO_DE_SIEMPRE, pago_real_at: "ayer por la tarde" })
  comprobar("una fecha que no es fecha se ignora", c.pagoRealAt === null)
}

console.log("\n═══ 6 · EL CERO ES UN DATO, NO UN HUECO ═══\n")
// La trampa clásica: 0 es falso en JavaScript. Con el regalo, el importe del
// primer pago es justo 0, y si se tratara como «no vino» no se guardaría
// nunca y no habría forma de ver que entró gratis.
{
  const c = leerCamposDeRegalo({ ...AVISO_DE_SIEMPRE, primer_pago: 0 })
  comprobar("primer_pago = 0 se considera presente", c.presentes.primerPago)
  comprobar("...y vale 0, no null", c.primerPago === 0)
  comprobar("...y llega a la columna", cambiosDeRegalo(c, null).primer_pago === 0)
}

console.log("\n═══ 7 · EL CÓDIGO, LIMPIO ═══\n")
{
  const c = leerCamposDeRegalo({ ...AVISO_DE_SIEMPRE, codigo_promocional: "  LLAMADO144  " })
  comprobar("se le quitan los espacios", c.codigoPromocional === "LLAMADO144")
}
{
  const c = leerCamposDeRegalo({ ...AVISO_DE_SIEMPRE, codigo_promocional: "   " })
  comprobar("un código vacío es null, no cadena vacía", c.codigoPromocional === null)
}
{
  const largo = "L".repeat(400)
  const c = leerCamposDeRegalo({ ...AVISO_DE_SIEMPRE, codigo_promocional: largo })
  comprobar("un código larguísimo se recorta a 64", c.codigoPromocional.length === 64)
}
{
  const c = leerCamposDeRegalo({ ...AVISO_DE_SIEMPRE, codigo_promocional: null })
  comprobar("«sin código» explícito sí se guarda como null", c.presentes.codigoPromocional)
}

console.log("\n═══ 8 · LA BASE DE DATOS SIN MIGRAR ═══\n")
// El código se publica empujando a main; la migración la corre José cuando
// puede. En la ventana entre lo uno y lo otro, las columnas no existen. Si
// eso no se detectara, el INSERT fallaría y NADIE podría activarse.
comprobar(
  "PostgREST: columna que no existe al escribir",
  esColumnaQueNoExiste({ code: "PGRST204", message: "Column tipo_acceso not found" }),
)
comprobar(
  "Postgres: undefined_column al leer",
  esColumnaQueNoExiste({ code: "42703", message: "column does not exist" }),
)
comprobar(
  "sin código, por el mensaje",
  esColumnaQueNoExiste({ message: "column member_subscriptions.pago_real_at does not exist" }),
)
comprobar("un duplicado NO es eso", !esColumnaQueNoExiste({ code: "23505", message: "duplicate key" }))
comprobar("un fallo de red NO es eso", !esColumnaQueNoExiste({ message: "fetch failed" }))
comprobar("sin error no hay nada que reintentar", !esColumnaQueNoExiste(null))
comprobar("son cuatro columnas y están todas", COLUMNAS_DE_REGALO.length === 4)
comprobar(
  "...y son las que dice el SQL",
  ["tipo_acceso", "codigo_promocional", "primer_pago", "pago_real_at"].every((c) =>
    COLUMNAS_DE_REGALO.includes(c),
  ),
)

console.log("\n═══ 9 · ESTO NO DECIDE ACCESOS ═══\n")
// Una garantía por escrito: lo único que sale de este módulo son cuatro
// columnas de etiqueta. Si alguna vez apareciera aquí algo que oliera a
// permiso, esta prueba lo cantaría.
{
  const c = leerCamposDeRegalo({ ...AVISO_DE_SIEMPRE, acceso_regalo: true, primer_pago: 0 })
  const claves = Object.keys(cambiosDeRegalo(c, null))
  const sospechosas = claves.filter((k) => !COLUMNAS_DE_REGALO.includes(k))
  comprobar("no escribe ninguna columna fuera de las cuatro", sospechosas.length === 0, claves.join(","))
  comprobar("no toca `status`", !claves.includes("status"))
  comprobar("no toca `current_period_end`", !claves.includes("current_period_end"))
  comprobar("no toca `subscription_status`", !claves.includes("subscription_status"))
}

console.log(`\n═══ ${pasadas} pasadas · ${fallos} fallos ═══\n`)
process.exit(fallos > 0 ? 1 : 0)
