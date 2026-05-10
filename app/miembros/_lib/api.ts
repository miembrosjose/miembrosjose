// Wrapper centralizado pra fetch de endpoints /api/* da área de membros.
//
// Substitui o padrão repetido no código original:
//   fetch('/api/foo', { credentials: 'include' })
//   if (!res.ok) ...
//   const data = await res.json()
//
// Por:
//   const data = await api<{ posts: Post[] }>('/api/foo')
//
// Vantagens:
//   - credentials: 'include' por default
//   - error handling unificado (lança ApiError com status + payload)
//   - tipado com generic
//   - cache control configurável
//
// Não substitui useSWR/React Query — é a camada mais baixa.

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public payload: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown // permite passar objeto direto — JSON.stringify automático
}

export async function api<T = unknown>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { body, headers, ...rest } = opts
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData
  const isStringBody = typeof body === "string"
  // Bug histórico: alguns componentes passavam JSON.stringify(...) por engano.
  // Resultado: duplo stringify gera string JSON escapada, backend recebe lixo.
  // Fix: se já é string, passa direto. Se é objeto, faz stringify.
  // Retrocompatível com chamadas erradas (12 arquivos no projeto).
  const needsStringify = body != null && !isFormData && !isStringBody
  const isJsonBody = (needsStringify || isStringBody) && !isFormData

  const init: RequestInit = {
    credentials: "include",
    ...rest,
    headers: {
      ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
    body: needsStringify
      ? JSON.stringify(body)
      : (body as BodyInit | undefined),
  }

  const res = await fetch(path, init)

  // Tenta parsear JSON sempre — endpoints podem retornar { error } mesmo com 4xx/5xx
  let payload: unknown = null
  const text = await res.text()
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!res.ok) {
    const errMsg =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `${res.status} ${res.statusText}`
    throw new ApiError(res.status, errMsg, payload)
  }

  return payload as T
}
