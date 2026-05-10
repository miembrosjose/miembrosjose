import { safeStorage } from "./safe-storage"

// List of UTM parameters and click IDs to capture
const TRACKED_PARAMS = [
  // UTM parameters
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  // Click IDs
  "fbclid",
  "gclid",
  "ttclid",
  "msclkid",
  "wbraid",
  "gbraid",
  // Custom parameters
  "xcod",
  "src",
  "sck",
  "ref",
  "affiliate_id",
]

const STORAGE_KEY = "funnel_utm_params"

// Capture UTM params from current URL and save to sessionStorage
export function captureAndStoreParams(): Record<string, string> {
  if (typeof window === "undefined") return {}

  const urlParams = new URLSearchParams(window.location.search)
  const capturedParams: Record<string, string> = {}

  // Get existing stored params
  const storedParams = getStoredParams()

  // Capture new params from URL
  TRACKED_PARAMS.forEach((param) => {
    const value = urlParams.get(param)
    // Descarta templates não resolvidos do Facebook (ex: {{campaign.name}})
    if (value && !/\{\{.*?\}\}/.test(value)) {
      // Normaliza utm_campaign e utm_medium: minúsculas, espaços → hífens
      if (param === "utm_campaign" || param === "utm_medium" || param === "utm_content") {
        capturedParams[param] = value.trim().toLowerCase().replace(/\s+/g, "-")
      } else {
        capturedParams[param] = value
      }
    }
  })

  // Merge: stored params as base, URL params override (mais recentes têm prioridade)
  const mergedParams = { ...storedParams, ...capturedParams }

  // Sempre salva — mesmo que só tenha params do sessionStorage já existentes
  if (Object.keys(mergedParams).length > 0) {
    try {
      safeStorage.set(STORAGE_KEY, JSON.stringify(mergedParams))
    } catch (e) {
      console.warn("Error saving params to sessionStorage:", e)
    }
  }

  return mergedParams
}

// Get stored params from sessionStorage
export function getStoredParams(): Record<string, string> {
  if (typeof window === "undefined") return {}

  try {
    const stored = safeStorage.get(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn("Error reading params from sessionStorage:", e)
  }

  return {}
}

// Build path with stored UTM params for internal navigation
export function getPathWithParams(basePath: string): string {
  const params = getStoredParams()

  if (Object.keys(params).length === 0) {
    return basePath
  }

  // Preserva parâmetros existentes no basePath (ex: ?intro=true)
  const [pathPart, existingQuery] = basePath.split("?")
  const combinedParams = new URLSearchParams(existingQuery || "")
  
  // Adiciona os params armazenados (UTMs), sem sobrescrever os existentes
  Object.entries(params).forEach(([key, value]) => {
    if (!combinedParams.has(key)) {
      combinedParams.set(key, value as string)
    }
  })
  
  const queryString = combinedParams.toString()
  return queryString ? `${pathPart}?${queryString}` : pathPart
}

// Append stored params to external URL (like Hotmart checkout)
// Lê do sessionStorage E da URL atual como fallback — garante que os params
// nunca se percam mesmo que o sessionStorage esteja vazio por algum motivo.
export function appendParamsToUrl(baseUrl: string): string {
  // 1. Params do sessionStorage
  const storedParams = getStoredParams()

  // 2. Fallback: lê params diretamente da URL atual (window.location.search)
  //    Isso cobre o caso onde sessionStorage foi limpo ou não foi populado ainda
  const urlParams: Record<string, string> = {}
  if (typeof window !== "undefined") {
    const current = new URLSearchParams(window.location.search)
    TRACKED_PARAMS.forEach((p) => {
      const v = current.get(p)
      // Descarta templates não resolvidos do Facebook (ex: {{campaign.name}})
      if (v && !/\{\{.*?\}\}/.test(v)) {
        if (p === "utm_campaign" || p === "utm_medium" || p === "utm_content") {
          urlParams[p] = v.trim().toLowerCase().replace(/\s+/g, "-")
        } else {
          urlParams[p] = v
        }
      }
    })
  }

  // Merge: sessionStorage como base, URL atual prevalece se tiver o mesmo param
  const params = { ...storedParams, ...urlParams }

  if (Object.keys(params).length === 0) {
    return baseUrl
  }

  // Se encontrou params na URL que não estavam no sessionStorage, salva agora
  if (Object.keys(urlParams).length > 0) {
    try {
      safeStorage.set(STORAGE_KEY, JSON.stringify({ ...storedParams, ...urlParams }))
    } catch { /* silent */ }
  }

  try {
    // Suporta tanto URL absoluta (https://...) quanto relativa (/checkout/...).
    // Pra relativa, usa window.location.origin como base.
    const isRelative = baseUrl.startsWith("/")
    const origin = typeof window !== "undefined" ? window.location.origin : "https://SEU_DOMINIO.com"
    const url = isRelative ? new URL(baseUrl, origin) : new URL(baseUrl)

    // Passa todos os params UTM/click diretamente
    // mas filtra qualquer template não resolvido antes de injetar
    Object.entries(params).forEach(([key, value]) => {
      if (!url.searchParams.has(key) && !/\{\{.*?\}\}/.test(value)) {
        url.searchParams.append(key, value)
      }
    })

    // Hotmart usa `src` como campo de origem visível no painel.
    // Prioridade: utm_campaign > src existente > utm_source > fbclid (extrai campanha do sck) > "organico"
    if (!url.searchParams.has("src")) {
      const campaign = params["utm_campaign"]
      const medium   = params["utm_medium"] || ""
      const srcParam = params["src"]
      const utmSource = params["utm_source"]
      const fbclid = params["fbclid"]

      // Extrai campanha do utm_medium se vier no formato "cpc_NomeCampanha"
      let mediumCampanha = ""
      if (medium && !campaign) {
        const parts = medium.split("_")
        if (parts.length >= 2 && ["cpc","cpm","cpv","ppc"].includes(parts[0])) {
          mediumCampanha = parts.slice(1).join("_").replace(/[^a-zA-Z0-9\-_]/g, "").slice(0, 50)
        }
      }

      // Tenta extrair a campanha do sck já salvo no sessionStorage
      // Formato do sck: {campanha}_{tipo}_{sid} — ex: "seu-projeto-latam_funil_abc123"
      let sckCampanha = ""
      try {
        if (typeof window !== "undefined") {
          const stored = safeStorage.get("funnel_utm_params")
          const p = stored ? JSON.parse(stored) : {}
          const sckStored = p["sck"] || ""
          if (sckStored) {
            const parts = sckStored.split("_")
            // Remove os 2 últimos segmentos (tipo + sid) e junta o resto como campanha
            if (parts.length >= 3) {
              sckCampanha = parts.slice(0, -2).join("_")
            }
          }
        }
      } catch { /* silent */ }

      let srcValue = ""
      if (campaign && !/\{\{.*?\}\}/.test(campaign)) {
        srcValue = campaign.replace(/[^a-zA-Z0-9\-_]/g, "").slice(0, 50)
      } else if (mediumCampanha) {
        // utm_medium = "cpc_NomeCampanha" → usa NomeCampanha como src
        srcValue = mediumCampanha
      } else if (srcParam && !/\{\{.*?\}\}/.test(srcParam)) {
        srcValue = srcParam
      } else if (utmSource && !/\{\{.*?\}\}/.test(utmSource)) {
        srcValue = utmSource.replace(/[^a-zA-Z0-9\-_]/g, "").slice(0, 50)
      } else if (fbclid && sckCampanha && sckCampanha !== "direct" && sckCampanha !== "funil") {
        // Tem fbclid e conseguiu extrair campanha do sck → usa campanha_facebook
        srcValue = `${sckCampanha}_facebook`
      } else if (fbclid) {
        // Tem fbclid mas sem UTMs e sem campanha no sck → pelo menos identifica como Facebook
        srcValue = "facebook"
      } else {
        srcValue = "organico"
      }

      if (srcValue) {
        url.searchParams.set("src", srcValue)
      }
    }

    // NOTA: o campo "sck" do checkout Hotmart NÃO deve ser preenchido aqui.
    // Ele é sempre sobrescrito por buildCheckoutSck() nas páginas salespage/salespagees,
    // que retorna "funil_<sid>" ou "direct_<sid>" com base no sessionStorage.
    // Incluir o sck da campanha aqui quebraria a lógica de rastreio de origem.

    // fbclid → xcod para atribuição do Facebook via Hotmart
    if (!url.searchParams.has("xcod") && params["fbclid"]) {
      url.searchParams.set("xcod", params["fbclid"])
    }

    return url.toString()
  } catch (e) {
    console.warn("Error appending params to URL:", e)
    return baseUrl
  }
}
