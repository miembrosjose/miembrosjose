// ═══════════════════════════════════════════════════════════════════════════
//  ¿PASARÍA ESTA PERSONA EL BOTÓN DE TELEGRAM? · solo lectura
// ═══════════════════════════════════════════════════════════════════════════
//
//   node scripts/comprobar-acceso-telegram.mjs correo@ejemplo.com
//
// ── QUÉ HACE ───────────────────────────────────────────────────────────────
// Ejecuta la MISMA regla que `tieneAccesoGeneral()` en
// supabase/functions/_shared/acceso.ts, condición por condición, y dice qué
// devolvería. No escribe nada, en ninguna de las dos bases: solo `select`.
// Tampoco llama a Telegram ni genera ningún enlace de invitación.
//
// ── POR QUÉ UN SCRIPT Y NO UNA CONSULTA ───────────────────────────────────
// Porque la regla cruza DOS proyectos de Supabase: el correo sale de
// `auth.users` de la plataforma y la suscripción de `embudo_registros` del
// embudo. Ninguna consulta SQL ve las dos a la vez, y copiar el correo a mano
// de una a otra es justo el paso donde se escondía el fallo.
//
// ── LAS CLAVES NO SE ESCRIBEN AQUÍ ────────────────────────────────────────
// Se leen del entorno. Ponlas en la terminal antes de ejecutar, o en un
// archivo que git no siga. Este script nunca las imprime.
//
//   SUPABASE_URL                        → el proyecto de la plataforma
//   SUPABASE_SERVICE_ROLE_KEY
//   EMBUDO_SUPABASE_URL                 → el proyecto del embudo
//   EMBUDO_SUPABASE_SERVICE_ROLE_KEY
//
// Son las cuatro que ya usan las Edge Functions. No hace falta ninguna más.

import { createClient } from "@supabase/supabase-js"

const correoPedido = (process.argv[2] || "").trim().toLowerCase()
if (!correoPedido) {
  console.error("\nFalta el correo.\n\n  node scripts/comprobar-acceso-telegram.mjs correo@ejemplo.com\n")
  process.exit(2)
}

// ── LAS CUATRO VARIABLES, Y SI ESTÁN ───────────────────────────────────────
const V = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "EMBUDO_SUPABASE_URL", "EMBUDO_SUPABASE_SERVICE_ROLE_KEY"]
const faltan = V.filter((v) => !process.env[v])
if (faltan.length > 0) {
  console.error("\nNo puedo comprobarlo sin estas variables:\n")
  for (const v of V) console.error(`  ${process.env[v] ? "EXISTE     " : "NO EXISTE  "} ${v}`)
  console.error("\nSon las mismas que usan las Edge Functions. Están en Supabase →")
  console.error("Edge Functions → Secrets, en cada uno de los dos proyectos.\n")
  process.exit(2)
}

const opc = { auth: { persistSession: false, autoRefreshToken: false } }
const plataforma = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, opc)
const embudo = createClient(process.env.EMBUDO_SUPABASE_URL, process.env.EMBUDO_SUPABASE_SERVICE_ROLE_KEY, opc)

const linea = (s = "") => console.log(s)
linea(`\n═══ ${correoPedido} ═══\n`)

// ═══════════════════════════════════════════════════════════════════════════
//  1 · ¿TIENE CUENTA EN LA PLATAFORMA, Y CON QUÉ CORREO EXACTO?
// ═══════════════════════════════════════════════════════════════════════════
//
// `cargarPersona()` saca el correo de `auth.users` y lo pasa a minúsculas. Ese
// —y no el que escriba quien pregunta— es el que se le enseña al embudo.
//
// No existe `getUserByEmail`, así que hay que recorrer las páginas. Son unos
// cientos de cuentas: una pasada y basta.
let persona = null
for (let pagina = 1; pagina <= 20 && !persona; pagina++) {
  const { data, error } = await plataforma.auth.admin.listUsers({ page: pagina, perPage: 1000 })
  if (error) { console.error("No pude leer las cuentas:", error.message); process.exit(1) }
  if (!data.users.length) break
  const u = data.users.find((x) => (x.email ?? "").toLowerCase() === correoPedido)
  if (u) {
    persona = {
      userId: u.id,
      emailCrudo: u.email ?? "",
      email: (u.email ?? "").toLowerCase(),
      esAdmin: u.app_metadata?.is_admin === true,
      creada: u.created_at,
    }
  }
  if (data.users.length < 1000) break
}

if (!persona) {
  linea("PASO 1 · Cuenta en la plataforma:  NO HAY")
  linea("")
  linea("  Ninguna cuenta de `auth.users` tiene ese correo. Si ella entra al área")
  linea("  de miembros, entra con OTRO correo, y es ese el que se le pregunta al")
  linea("  embudo. Arreglar la fila del embudo con este no cambia nada.")
  linea("")
  linea("VEREDICTO: NO PASA — no hay cuenta con ese correo.\n")
  process.exit(0)
}

linea(`PASO 1 · Cuenta en la plataforma:  SÍ`)
linea(`         user_id        ${persona.userId}`)
linea(`         correo         ${persona.emailCrudo}`)
linea(`         coincide       ${persona.email === correoPedido ? "SÍ (ignorando mayúsculas)" : "NO"}`)
linea(`         espacios       ${persona.emailCrudo !== persona.emailCrudo.trim() ? "SÍ — ROMPE LA BÚSQUEDA" : "no"}`)
linea(`         administradora ${persona.esAdmin ? "SÍ" : "no"}`)
linea("")

// La salida para administración va ANTES de preguntarle al embudo.
if (persona.esAdmin) {
  linea("VEREDICTO: PASA — es administradora, y eso pasa sin mirar la suscripción.")
  linea("  Ojo: entonces esto no comprueba nada sobre su suscripción. Para probar")
  linea("  la regla de verdad hace falta una cuenta que no sea administradora.\n")
  process.exit(0)
}

// ═══════════════════════════════════════════════════════════════════════════
//  2 · LO QUE DICE EL EMBUDO
// ═══════════════════════════════════════════════════════════════════════════
//
// Primero TODAS las filas de ese correo, para ver si hay más de una. La regla
// se queda con la de `updated_at` más reciente, así que con duplicados puede
// ganar la equivocada.
const { data: todas, error: errTodas } = await embudo
  .from("embudo_registros")
  .select("email, subscription_status, current_period_end, updated_at")
  .ilike("email", persona.email)
  .order("updated_at", { ascending: false })

if (errTodas) {
  linea(`PASO 2 · El embudo:  NO RESPONDIÓ — ${errTodas.message}`)
  linea("")
  linea("  Eso NO es «no tiene acceso»: la función lanza `embudo_no_disponible` a")
  linea("  propósito, para que una caída del embudo no vacíe el grupo en el")
  linea("  siguiente barrido. El mensaje que vería ella sería otro, no el de la")
  linea("  membresía.")
  linea("")
  linea("VEREDICTO: INDETERMINADO — el embudo no contestó.\n")
  process.exit(1)
}

linea(`PASO 2 · Filas en embudo_registros:  ${todas.length}`)
for (const [i, f] of todas.entries()) {
  linea(`         ${i === 0 ? "→" : " "} ${f.subscription_status ?? "(sin estado)"}  hasta ${f.current_period_end ?? "(sin fecha)"}  · act. ${f.updated_at}`)
}
if (todas.length > 1) {
  linea("")
  linea("         Hay más de una. La regla usa SOLO la marcada con →, que es la de")
  linea("         `updated_at` más reciente con estado no vacío.")
}
linea("")

// ── Y AHORA LA CONSULTA EXACTA DE LA FUNCIÓN ──────────────────────────────
const { data: registro, error } = await embudo
  .from("embudo_registros")
  .select("subscription_status, current_period_end")
  .ilike("email", persona.email)
  .not("subscription_status", "is", null)
  .order("updated_at", { ascending: false })
  .limit(1)
  .maybeSingle()

if (error) {
  linea(`VEREDICTO: INDETERMINADO — el embudo falló en la consulta real: ${error.message}\n`)
  process.exit(1)
}

// ═══════════════════════════════════════════════════════════════════════════
//  3 · LA REGLA, CONDICIÓN POR CONDICIÓN
// ═══════════════════════════════════════════════════════════════════════════
const ACEPTADOS = ["active", "trialing", "canceled"]

if (!registro) {
  linea("PASO 3 · La regla:")
  linea("         fila con estado   NO — no hay ninguna fila con estado para ese correo")
  linea("")
  linea("VEREDICTO: NO PASA — el embudo no tiene suscripción a nombre de ese correo.\n")
  process.exit(0)
}

const fin = registro.current_period_end ? new Date(registro.current_period_end) : null
const fechaVale = fin !== null && fin.getTime() > Date.now()
const estadoVale = ACEPTADOS.includes(registro.subscription_status)

linea("PASO 3 · La regla:")
linea(`         estado            ${registro.subscription_status}  → ${estadoVale ? "aceptado" : "NO aceptado (solo " + ACEPTADOS.join(", ") + ")"}`)
linea(`         hasta             ${registro.current_period_end ?? "(vacío)"}`)
linea(`         fecha en futuro   ${fechaVale ? "SÍ" : "NO — es la que manda, no el estado"}`)
if (fechaVale) {
  const dias = Math.round((fin.getTime() - Date.now()) / 86400000)
  linea(`         le quedan         ${dias} ${dias === 1 ? "día" : "días"}`)
}
linea("")

const pasa = fechaVale && estadoVale
linea(`VEREDICTO: ${pasa ? "PASA" : "NO PASA"}`)
if (!pasa) {
  linea("")
  linea(`  Falla: ${!fechaVale ? "la fecha" : ""}${!fechaVale && !estadoVale ? " y " : ""}${!estadoVale ? "el estado" : ""}.`)
}
linea("")
linea("  Esto comprueba la regla de supabase/functions/_shared/acceso.ts. La")
linea("  función que responde al botón —`telegram-link-start`— NO está en este")
linea("  repositorio y lleva su propia copia de la comprobación, así que esto no")
linea("  demuestra lo que hará ella. Ver el informe.")
linea("")
