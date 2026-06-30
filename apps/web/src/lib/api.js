import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request(path, options = {}) {
  const headers = await getAuthHeaders()
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    })
  } catch {
    throw new Error(
      `Não foi possível conectar à API em ${API_URL}. Verifique se o backend está rodando (uvicorn na porta 8000).`
    )
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail ?? `HTTP ${response.status}`)
  }

  if (response.status === 204) return null
  return response.json()
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
