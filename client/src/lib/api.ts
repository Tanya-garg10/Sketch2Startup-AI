import { firebaseAuth } from "./firebase"

const API = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000"

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData
  const headers: Record<string, string> = isFormData
    ? {}
    : { "Content-Type": "application/json" }

  // Attach Firebase auth token when user is signed in
  const user = firebaseAuth.currentUser
  if (user) {
    try {
      const token = await user.getIdToken()
      headers["Authorization"] = `Bearer ${token}`
    } catch {
      // Token fetch failed — proceed without it (backend will 401)
    }
  }

  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json() as Promise<T>
}
