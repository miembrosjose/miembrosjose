// Storage resiliente: escreve em sessionStorage + localStorage,
// lê preferindo sessionStorage com fallback pra localStorage.
// Resolve: iOS Safari ITP / Facebook in-app browser que limpam sessionStorage
// no meio da navegação, quebrando o funil.

// Incrementar este número força limpeza das chaves de estado do funil
// em TODOS os dispositivos que já acessaram o site.
// Chaves limpas: clickedCheckout (preserva pricingRegion e UTMs)
export const STORAGE_VERSION = "2"
const VERSION_KEY = "_cfv"

export function resetStorageIfOutdated(): void {
  if (typeof window === "undefined") return
  try {
    const stored =
      sessionStorage.getItem(VERSION_KEY) ?? localStorage.getItem(VERSION_KEY)
    if (stored === STORAGE_VERSION) return

    // Versão antiga ou ausente — limpa flags de estado do funil
    for (const key of ["clickedCheckout"]) {
      try { sessionStorage.removeItem(key) } catch {}
      try { localStorage.removeItem(key) } catch {}
    }

    // Marca versão nova nos dois storages
    try { sessionStorage.setItem(VERSION_KEY, STORAGE_VERSION) } catch {}
    try { localStorage.setItem(VERSION_KEY, STORAGE_VERSION) } catch {}
  } catch {}
}

export const safeStorage = {
  get(key: string): string | null {
    try {
      const fromSession = sessionStorage.getItem(key)
      if (fromSession !== null) return fromSession
    } catch {}
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string): void {
    try { sessionStorage.setItem(key, value) } catch {}
    try { localStorage.setItem(key, value) } catch {}
  },
  remove(key: string): void {
    try { sessionStorage.removeItem(key) } catch {}
    try { localStorage.removeItem(key) } catch {}
  },
}
