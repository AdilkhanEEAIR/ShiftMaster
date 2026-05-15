import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from './types'
import { authApi } from './api'

interface AuthCtx {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (input: { email: string; password: string; fullName: string; companyName: string }) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi.me().then(u => setUser(u)).finally(() => setLoading(false))
  }, [])

  const value: AuthCtx = {
    user,
    loading,
    async login(email, password) {
      const { user } = await authApi.login(email, password)
      setUser(user)
    },
    async register(input) {
      const { user } = await authApi.register(input)
      setUser(user)
    },
    logout() {
      authApi.logout()
      setUser(null)
    },
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}