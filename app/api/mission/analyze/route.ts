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

Extensión: patternText, herida, medicina y territorio deben tener entre 3 y 5 frases cada uno (párrafos ricos, evocadores). primeraMision, 1-2 frases concretas. frase, una sola línea memorable en primera persona. pasos, 3 pasos concretos y realizables.

Devuelve ÚNICAMENTE un objeto JSON válido (sin markdown, sin texto extra) con exactamente estas claves:
{
  "patternText": "Patrón central detectado: el hilo que aparece con más fuerza atravesando historia, linaje y territorio. Explica por qué es el eje de su misión (3-5 frases).",
  "herida": "La herida personal o familiar que se está convirtiendo en conciencia. Nómbrala con respeto y muestra el don que esconde (3-5 frases).",
  "medicina": "Cómo esa herida atravesada se vuelve medicina y servicio para la Red. Concreta y elevada a la vez (3-5 frases).",
  "territorio": "Qué territorio o campo le llama y qué debe INVESTIGAR/custodiar (pueblos, aguas, cerros, memorias, heridas colectivas). Misional, no vago (3-5 frases).",
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
        max_tokens: 2400,
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
