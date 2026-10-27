// API — la propuesta de calendario del mes.
//
//   POST /api/admin/marketing/plan/generar   { mes: "AAAA-MM-01", simular?: true }
//
// ── LO QUE HACE, DICHO CON PRECISIÓN ───────────────────────────────────────
// Cuenta lo que YA hay en el mes para cada categoría, lo compara con la meta
// de las frecuencias, y crea únicamente la diferencia.
//
// Si la meta son tres reels por semana y esa semana ya hay dos, crea uno. Si
// ya hay tres, no crea nada. Si hay cuatro porque se decidió hacer uno más,
// tampoco quita nada: las metas son metas, no un corsé.
//
// ── POR QUÉ CUENTA POR SEMANA Y NO POR MES ─────────────────────────────────
// Porque «3 a la semana» no es «12 al mes». Si se contara el mes entero,
// hacer los doce la primera semana dejaría el resto vacío y el sistema diría
// que todo está en orden.
//
// ── Y POR QUÉ SE PUEDE SIMULAR ANTES ───────────────────────────────────────
// Porque esto crea decenas de filas de una vez. Pulsar un botón y encontrarse
// cuarenta actividades que no se esperaban es la clase de cosa que hace que
// nadie vuelva a pulsar ese botón. Con `simular` se ve qué haría, y se decide
// después.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { exigirMarketing, CATEGORIAS } from "@/lib/marketing/servidor"

export const dynamic = "force-dynamic"

const ES_MES = /^\d{4}-\d{2}-01$/

/** Tope de seguridad: una frecuencia mal puesta no puede llenar la base. */
const MAX_POR_TANDA = 200

type Frecuencia = {
  categoria: string
  cantidad: number
  cada: "semana" | "mes"
  responsable_id?: string | null
}

function diaISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Los lunes del mes.
 *
 * Una semana «del mes» es aquella cuyo lunes cae dentro de él. Es un criterio
 * y hay otros —las semanas que lo tocan, las que tienen más días dentro— pero
 * el importante es elegir UNO: con dos criterios conviviendo, la última
 * semana de enero se planificaría dos veces o ninguna.
 */
function lunesDelMes(mes: string): string[] {
  const [a, m] = mes.split("-").map(Number)
  const lunes: string[] = []
  const d = new Date(Date.UTC(a, m - 1, 1))
  // Al primer lunes.
  while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1)
  while (d.getUTCMonth() === m - 1) {
    lunes.push(diaISO(d))
    d.setUTCDate(d.getUTCDate() + 7)
  }
  return lunes
}

export async function POST(req: NextRequest) {
  const g = await exigirMarketing()
  if ("respuesta" in g) return g.respuesta

  let body: { mes?: string; simular?: boolean }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const mes = String(body.mes || "")
  if (!ES_MES.test(mes)) {
    return NextResponse.json({ error: "Falta el mes, como AAAA-MM-01." }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  const { data: plan } = await admin
    .from("mkt_plan")
    .select("frecuencias")
    .eq("mes", mes)
    .maybeSingle()

  const frecuencias = (plan?.frecuencias ?? []) as Frecuencia[]
  if (!Array.isArray(frecuencias) || frecuencias.length === 0) {
    return NextResponse.json(
      { error: "Este mes no tiene frecuencias configuradas. Guárdalas antes en el plan." },
      { status: 400 },
    )
  }

  // ── LO QUE YA HAY ─────────────────────────────────────────────────────
  const [a, m] = mes.split("-").map(Number)
  const fin = diaISO(new Date(Date.UTC(a, m, 0)))

  const { data: existentes, error: errLeer } = await admin
    .from("mkt_actividades")
    .select("categoria, fecha")
    .gte("fecha", mes)
    .lte("fecha", fin)

  if (errLeer) {
    console.error("[marketing] generar · leer:", errLeer.message)
    return NextResponse.json({ error: "No se pudo leer el mes" }, { status: 500 })
  }

  const lunes = lunesDelMes(mes)
  const semanaDe = (fecha: string): string | null => {
    for (let i = lunes.length - 1; i >= 0; i--) {
      if (fecha >= lunes[i]) return lunes[i]
    }
    // Cae antes del primer lunes: pertenece a una semana del mes anterior.
    return null
  }

  // Cuántas hay de cada categoría, por semana y en todo el mes.
  const porSemana = new Map<string, number>()
  const porMes = new Map<string, number>()
  for (const e of (existentes || []) as Array<{ categoria: string; fecha: string }>) {
    porMes.set(e.categoria, (porMes.get(e.categoria) || 0) + 1)
    const s = semanaDe(e.fecha)
    if (s) {
      const k = `${e.categoria}|${s}`
      porSemana.set(k, (porSemana.get(k) || 0) + 1)
    }
  }

  // ── LO QUE FALTA ──────────────────────────────────────────────────────
  const nuevas: Array<Record<string, unknown>> = []
  const resumen: Array<{ categoria: string; crea: number }> = []

  for (const f of frecuencias) {
    const categoria = String(f.categoria || "")
    const cantidad = Number(f.cantidad)

    // Una categoría inventada en el plan no debe reventar la generación
    // entera: se salta y se sigue.
    if (!CATEGORIAS.includes(categoria as never)) continue
    if (!Number.isFinite(cantidad) || cantidad < 1 || cantidad > 30) continue

    let creadasDeEsta = 0

    if (f.cada === "mes") {
      const faltan = Math.max(0, cantidad - (porMes.get(categoria) || 0))
      for (let i = 0; i < faltan; i++) {
        // A mitad de mes: una transmisión mensual sin fecha decidida es más
        // fácil de mover desde el día 15 que desde el día 1.
        nuevas.push(crear(categoria, diaISO(new Date(Date.UTC(a, m - 1, 15))), f))
        creadasDeEsta++
      }
    } else {
      for (const l of lunes) {
        const faltan = Math.max(0, cantidad - (porSemana.get(`${categoria}|${l}`) || 0))
        for (let i = 0; i < faltan; i++) {
          // Repartidas de lunes a viernes, sin amontonarlas el mismo día.
          nuevas.push(crear(categoria, sumar(l, i % 5), f))
          creadasDeEsta++
        }
      }
    }

    if (creadasDeEsta > 0) resumen.push({ categoria, crea: creadasDeEsta })
  }

  if (nuevas.length > MAX_POR_TANDA) {
    return NextResponse.json({
      error: `Saldrían ${nuevas.length} actividades, que es demasiado. `
        + "Revisa las frecuencias del plan antes de generar.",
    }, { status: 400 })
  }

  // ── SOLO MIRAR ────────────────────────────────────────────────────────
  if (body.simular === true) {
    return NextResponse.json({ ok: true, simulado: true, crearia: nuevas.length, resumen })
  }

  if (nuevas.length === 0) {
    return NextResponse.json({ ok: true, creadas: 0, resumen: [] })
  }

  const { error } = await admin
    .from("mkt_actividades")
    .insert(nuevas.map((n) => ({ ...n, created_by: g.user.id })))

  if (error) {
    console.error("[marketing] generar · crear:", error.message)
    return NextResponse.json({ error: "No se pudieron crear las actividades" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, creadas: nuevas.length, resumen })
}

function sumar(iso: string, n: number): string {
  const [a, m, d] = iso.split("-").map(Number)
  return diaISO(new Date(Date.UTC(a, m - 1, d + n)))
}

/**
 * Una actividad propuesta.
 *
 * Nace en `pendiente` y con el nombre de su categoría: es un hueco que hay
 * que llenar, no una tarea ya pensada. Ponerle un título inventado haría
 * creer que alguien decidió algo.
 */
function crear(categoria: string, fecha: string, f: Frecuencia): Record<string, unknown> {
  const publico = ["reel", "carrusel", "historias"].includes(categoria)
  const miembros = ["contenido_miembros", "comunidad", "transmision", "protocolo"].includes(categoria)

  return {
    titulo: "Por definir",
    categoria,
    ambito: publico ? "publico" : miembros ? "miembros" : "interno",
    fecha,
    estado: "pendiente",
    responsable_id: f.responsable_id ?? null,
  }
}
