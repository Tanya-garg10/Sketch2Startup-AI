const API = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000"

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData
  const headers: Record<string, string> = isFormData
    ? {}
    : { "Content-Type": "application/json" }

  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
  })

  if (!response.ok) {
    const text = await response.text()
    // Try to parse JSON error detail
    try {
      const json = JSON.parse(text)
      throw new Error(json.detail || json.message || text || `HTTP ${response.status}: ${response.statusText}`)
    } catch (parseErr) {
      if (parseErr instanceof SyntaxError) {
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`)
      }
      throw parseErr
    }
  }

  return response.json() as Promise<T>
}

