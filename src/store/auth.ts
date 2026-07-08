import { create } from 'zustand'
import {
  clearToken, clearRefreshToken,
  decodeJwt,
  getToken,
  login as apiLogin,
  registerLogoutCallback,
  setToken, setRefreshToken,
  type JwtClaims,
} from '../lib/api'

interface AuthState {
  token: string | null
  claims: JwtClaims | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

function claimsFrom(token: string | null): JwtClaims | null {
  return token ? decodeJwt(token) : null
}

const initialToken = getToken()

export const useAuth = create<AuthState>((set) => {
  // When api.ts silently fails to refresh, it calls this to clear the session.
  // The Protected wrapper in App.tsx will then redirect to /login automatically.
  registerLogoutCallback(() => {
    clearToken()
    clearRefreshToken()
    set({ token: null, claims: null, isAuthenticated: false })
  })

  return {
    token: initialToken,
    claims: claimsFrom(initialToken),
    isAuthenticated: !!initialToken,

    login: async (email, password) => {
      const tokens = await apiLogin(email, password)
      setToken(tokens.accessToken)
      setRefreshToken(tokens.refreshToken)
      set({ token: tokens.accessToken, claims: claimsFrom(tokens.accessToken), isAuthenticated: true })
    },

    logout: () => {
      clearToken()
      clearRefreshToken()
      set({ token: null, claims: null, isAuthenticated: false })
    },
  }
})
