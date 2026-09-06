// POST /api/mission/analyze
// Revelador de Misión con IA (Claude / Anthropic). Recibe la bitácora del
// usuario (que vive en su dispositivo) y devuelve una lectura de misión.
//
// SEGURIDAD / PRIVACIDAD:
//  - Requiere sesión autenticada.
//  - La API key se lee de ANTHROPIC_API_KEY (secret del Worker). Si no existe,
//    responde { configured:false } y el cliente cae al análisis LOCAL. Así el
//    proyecto nunca se rompe por falta de clave.
//  - Solo se procesa la bitácora que el propio usuario envía; nada se publica.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type InEntry = { category?: string; sourceLabel?: string; prompt?: string; answer?: string }

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
const DEFAULT_MODEL = "claude-sonnet-5"

const SYSTEM_PROMPT = `Eres el "Revelador de Misión" de la comunidad Los 144.000: una inteligencia de análisis que lee la bitácora personal de un miembro y le devuelve una lectura de su posible misión dentro de la Red.

Hablas el lenguaje de Los 144.000: red, misión, territorio, linaje, memoria, herida, medicina, custodia, servicio, discernimiento, Hermandad Blanca, archivos, contacto, responsabilidad. Tono profundo, humano, espiritual, revelador, cuidadoso y maduro. Nada de new age superficial, nada de lenguaje escolar.

REGLAS ESTRICTAS:
- No afirmes verdades absolutas. Usa lenguaje tentativo: "Según lo registrado en tu bitácora, aparece con fuerza…", "Tu proceso parece mostrar…", "Una posible línea de servicio sería…".
- No diagnostiques traumas ni reemplaces terapia. No prometas sanación instantánea. No digas "tu misión es definitivamente".
- Esta lectura es un espejo, no una imposición.
- Básate SOLO en lo que la persona escribió. Si hay poco, sé honesto y modesto.
- Escribe en ESPAÑOL NEUTRAL, cálido. NO uses voseo ni localismos rioplatenses: nada de "vos", "tenés", "podés", "mirá", "sentí", "completá", "elegí", "registrá". Usa "tú" o formas impersonales ("la persona", "conviene", "es posible").

Escribe como un GUÍA ESPIRITUAL sabio y cálido, no como un resumen. Habla en segunda persona ("tú"), con imágenes, hondura y precisión. Cada texto debe REVELAR algo, no solo describir: nombra la herida con dignidad, muestra su sentido y ábrela hacia el servicio. Evita frases genéricas y clichés de autoayuda. Cita o parafrasea de vez en cuando lo que la persona escribió, para que se sienta vista.

PROFUNDIDAD DE LA LECTURA. No te quedes en lo genérico. Estudia de verdad lo que la persona escribió y aplica:
- BIODESCODIFICACIÓN: decodifica el sentido emocional/biológico de la herida y de lo que se repite (conflictos de desvalorización, abandono, territorio, protección, silencio; cómo el cuerpo o los síntomas guardan la memoria; lealtades familiares invisibles). Con cuidado, sin diagnosticar ni alarmar.
- MEMORIA TRANSGENERACIONAL: qué lealtad o patrón del árbol se está transformando en la persona.
- ESTUDIO DE LOS LUGARES MENCIONADOS: si la persona nombra una ciudad, país, río, cerro, pueblo o región, habla de su memoria histórica y espiritual (pueblos originarios, heridas de conquista, aguas, sitios sagrados) y de qué pide ser recordado o custodiado ahí. Si no menciona un lugar concreto, invítala a investigarlo.

La pieza central es "sintesis": una GRAN SÍNTESIS integradora, un solo texto de EXACTAMENTE 2 párrafos. Teje, como una sola lectura fluida y elevada: qué vino a sanar (la herida/el veneno), cómo se transmuta en conciencia, y qué medicina nace para la Red. Prosa de guía espiritual, cálida, en segunda persona ("tú"), citando algo de lo que escribió. Sin encabezados ni viñetas.

Además, escribe una lectura EXTENSA y reveladora para cada uno de los 4 planos (planoPersonal, planoLinaje, planoTerritorio, planoRed), de 4 a 6 frases cada una, guiando desde ese pilar específico (no repitas la síntesis: profundiza distinto en cada plano).

Los campos de apoyo son cortos: "objetivo" (uno exacto), "primeraMision" (1-2 frases), "frase" (una línea memorable), "pasos" (3 pasos concretos).

Devuelve ÚNICAMENTE un objeto JSON válido (sin markdown, sin texto extra) con exactamente estas claves:
{
  "sintesis": "Gran Síntesis: 2 párrafos (herida/veneno → conciencia → medicina). Guía íntima, elevada, con biodescodificación.",
  "planoPersonal": "PLANO PERSONAL (4-6 frases): sanar la memoria personal. Biodescodificación de la herida, cómo vive en el cuerpo/emoción, el don que esconde.",
  "planoLinaje": "PLANO DEL LINAJE (4-6 frases): memoria transgeneracional, lealtades del árbol, patrón que termina en la persona, don heredado.",
  "planoTerritorio": "PLANO DEL TERRITORIO (4-6 frases): estudio del lugar mencionado (o invitación a investigarlo): pueblos, aguas, heridas colectivas, qué custodiar.",
  "planoRed": "PLANO DE LA RED (4-6 frases): cómo su proceso se vuelve servicio concreto, ser sol en la Tierra, irradiar la medicina.",
  "herida": "1-2 frases: la herida central, por si se necesita aparte.",
  "medicina": "1-2 frases: la medicina/servicio, por si se necesita aparte.",
  "territorio": "1-2 frases: qué territorio le llama.",
  "objetivo": "UNO de los 7 objetivos, con su nombre EXACTO: Formar Comunidad de Base | Irradiar la Clave del Recuerdo | Redescubrir la Historia Sagrada del Territorio | Convertirse en Guardián del Lugar | Atravesar la Catastro-fe | Prepararse para el Contacto con los Guías | Reencontrarse con la Hermandad Blanca y custodiar los archivos.",
  "primeraMision": "Una primera misión concreta y realizable (1-2 frases).",
  "frase": "Una frase de misión personal, breve, profunda y memorable, en primera persona.",
  "pasos": ["Paso 1 concreto", "Paso 2 concreto", "Paso 3 concreto"]
}`

export async function POST(req: Request) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Sin clave configurada → el cliente usa el análisis local.
    return NextResponse.json({ configured: false })
  }

  let body: { entries?: InEntry[] }
  try { body = await req.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  const entries = Array.isArray(body.entries) ? body.entries : []
  const clean = entries
    .filter((e) => e && typeof e.answer === "string" && e.answer.trim())
    .slice(0, 200)
    .map((e) => ({
      seccion: String(e.sourceLabel || e.category || "").slice(0, 120),
      pregunta: String(e.prompt || "").slice(0, 300),
      respuesta: String(e.answer || "").slice(0, 1200),
    }))

  if (clean.length < 4) {
    return NextResponse.json({ configured: true, sufficient: false })
  }

  const userContent =
    "Esta es la bitácora privada del miembro (sección · pregunta · respuesta). " +
    "Analízala y devuelve el JSON pedido.\n\n" +
    clean.map((e) => `— [${e.seccion}] ${e.pregunta}\n${e.respuesta}`).join("\n\n")

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: 3600,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    })

    if (!res.ok) {
      const errTxt = await res.text().catch(() => "")
      console.error("[mission/analyze] anthropic error", res.status, errTxt.slice(0, 300))
      // Falla del proveedor → cliente cae a análisis local.
      return NextResponse.json({ configured: false, providerError: true })
    }

    const data = (await res.json()) as { content?: { type: string; text?: string }[] }
    const text = (data.content || []).filter((c) => c.type === "text").map((c) => c.text || "").join("")
    const jsonStr = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)
    let report: Record<string, unknown>
    try { report = JSON.parse(jsonStr) } catch {
      console.error("[mission/analyze] no se pudo parsear JSON del modelo")
      return NextResponse.json({ configured: false, providerError: true })
    }

    // Normaliza: pasos como array de 3 strings.
    const pasos = Array.isArray(report.pasos)
      ? (report.pasos as unknown[]).map((p) => String(p)).filter(Boolean).slice(0, 5)
      : []

    return NextResponse.json({
      configured: true,
      sufficient: true,
      report: {
        patternLabel: "",
        patternText: String(report.patternText || ""),
        sintesis: String(report.sintesis || [report.herida, report.medicina].filter(Boolean).join("\n\n")),
        planoPersonal: String(report.planoPersonal || ""),
        planoLinaje: String(report.planoLinaje || ""),
        planoTerritorio: String(report.planoTerritorio || ""),
        planoRed: String(report.planoRed || ""),
        herida: String(report.herida || ""),
        medicina: String(report.medicina || ""),
        territorio: String(report.territorio || ""),
        objetivo: String(report.objetivo || ""),
        primeraMision: String(report.primeraMision || ""),
        frase: String(report.frase || ""),
        pasos: pasos.length ? pasos : ["Completar el Mapa de mi Misión.", "Elegir un punto de custodia.", "Registrar una acción de reparación."],
      },
    })
  } catch (e) {
    console.error("[mission/analyze] error", e)
    return NextResponse.json({ configured: false, providerError: true })
  }
}
