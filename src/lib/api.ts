// Thin typed client over the FitCore API. The JWT carries gym_id, so requests need no X-Tenant header.

const TOKEN_KEY = 'fitcore_token'
const REFRESH_KEY = 'fitcore_refresh'

// Registered by the auth store — called when a refresh fails so the store can clear itself.
type LogoutFn = () => void
let _onLogout: LogoutFn | null = null
export function registerLogoutCallback(fn: LogoutFn) { _onLogout = fn }

export function getToken(): string | null { return localStorage.getItem(TOKEN_KEY) }
export function setToken(token: string) { localStorage.setItem(TOKEN_KEY, token) }
export function clearToken() { localStorage.removeItem(TOKEN_KEY) }

export function getRefreshToken(): string | null { return localStorage.getItem(REFRESH_KEY) }
export function setRefreshToken(token: string) { localStorage.setItem(REFRESH_KEY, token) }
export function clearRefreshToken() { localStorage.removeItem(REFRESH_KEY) }

export class ApiError extends Error {
  code?: string
  status: number
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.code = code
    this.status = status
  }
}

export interface PageMeta {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

interface Envelope<T> {
  success: boolean
  data: T | null
  error: { message: string; code: string } | null
  meta: PageMeta | null
}

// Single in-flight refresh so concurrent 401s don't trigger duplicate refresh calls.
let _refreshPromise: Promise<string> | null = null

async function silentRefresh(): Promise<string> {
  if (_refreshPromise) return _refreshPromise
  _refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) throw new Error('no refresh token')
    const res = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) throw new Error('refresh failed')
    const tokens: AuthTokens = await res.json()
    setToken(tokens.accessToken)
    setRefreshToken(tokens.refreshToken)
    return tokens.accessToken
  })().finally(() => { _refreshPromise = null })
  return _refreshPromise
}

function clearSession() {
  clearToken()
  clearRefreshToken()
  _onLogout?.()
}

async function request<T>(path: string, init?: RequestInit, isRetry = false): Promise<Envelope<T>> {
  const token = getToken()
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })

  if (res.status === 401) {
    if (!isRetry) {
      try {
        const newToken = await silentRefresh()
        return request<T>(path, {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`,
            ...(init?.headers ?? {}),
          },
        }, true)
      } catch {
        clearSession()
        throw new ApiError('Sessione scaduta', 401, 'SESSION_EXPIRED')
      }
    }
    clearSession()
    throw new ApiError('Non autorizzato', 401, 'UNAUTHORIZED')
  }

  const text = await res.text()
  const json = text ? JSON.parse(text) : {}
  if (!res.ok || json?.success === false) {
    const msg = json?.error?.message ?? json?.error ?? res.statusText
    throw new ApiError(msg, res.status, json?.error?.code)
  }
  return json as Envelope<T>
}

export const api = {
  async get<T>(path: string): Promise<{ data: T; meta: PageMeta | null }> {
    const env = await request<T>(path)
    return { data: env.data as T, meta: env.meta }
  },
  async post<T>(path: string, body: unknown): Promise<T> {
    const env = await request<T>(path, { method: 'POST', body: JSON.stringify(body) })
    return env.data as T
  },
  async put<T>(path: string, body: unknown): Promise<T> {
    const env = await request<T>(path, { method: 'PUT', body: JSON.stringify(body) })
    return env.data as T
  },
  async delete<T = void>(path: string): Promise<T> {
    const env = await request<T>(path, { method: 'DELETE' })
    return env.data as T
  },
  // Download binary file (PDF, etc.) — triggers browser save dialog
  async downloadFile(path: string, filename: string, isRetry = false): Promise<void> {
    const token = getToken()
    const res = await fetch(path, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })

    if (res.status === 401) {
      if (!isRetry) {
        try {
          await silentRefresh()
          return api.downloadFile(path, filename, true)
        } catch {
          clearSession()
          throw new ApiError('Sessione scaduta', 401, 'SESSION_EXPIRED')
        }
      }
      clearSession()
      throw new ApiError('Non autorizzato', 401, 'UNAUTHORIZED')
    }

    if (!res.ok) {
      // Try to extract a meaningful message from the response body (ProblemDetails, envelope, etc.)
      const text = await res.text().catch(() => '')
      let message: string | null = null
      if (text) {
        try {
          const json = JSON.parse(text)
          message = json?.detail ?? json?.error?.message ?? json?.error ?? json?.title ?? null
        } catch { /* not JSON */ }
      }
      throw new ApiError(message ?? `Errore ${res.status} dal server`, res.status)
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  // Multipart file upload — browser sets Content-Type with boundary automatically
  async upload<T>(path: string, formData: FormData): Promise<T> {
    const token = getToken()
    const res = await fetch(path, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    })
    const text = await res.text()
    const json = text ? JSON.parse(text) : {}
    if (!res.ok || json?.success === false) {
      const msg = json?.error?.message ?? json?.error ?? res.statusText
      throw new ApiError(msg, res.status, json?.error?.code)
    }
    return (json as Envelope<T>).data as T
  },
}

// --- Auth (non-enveloped) ---

export interface AuthTokens {
  accessToken: string
  expiresInSeconds: number
  refreshToken: string
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const res = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    throw new ApiError(j?.error ?? 'Credenziali non valide', res.status, j?.code)
  }
  return res.json()
}

export interface JwtClaims {
  gym_id: string
  user_id: string
  role: string
  email: string
  exp: number
}

export function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}
