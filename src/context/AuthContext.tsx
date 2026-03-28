import { createContext, useContext, useState, ReactNode } from 'react'
import { authApi } from '../api/services'

export type Rol = 'admin' | 'vendedor' | 'cobrador'

export type Usuario = {
  id: string
  nombre: string
  email: string
  rol: Rol
}

export const PERMISOS: Record<Rol, string[]> = {
  admin:    ['dashboard', 'productos', 'clientes', 'ventas', 'cartera', 'despachos', 'garantias', 'reportes'],
  vendedor: ['dashboard', 'productos', 'clientes', 'ventas'],
  cobrador: ['dashboard', 'cartera', 'clientes'],
}

type AuthContextType = {
  usuario: Usuario | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  puede: (seccion: string) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem('usuario')
    return saved ? JSON.parse(saved) : null
  })

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('usuario', JSON.stringify(data.usuario))
    setUsuario(data.usuario)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

  const puede = (seccion: string) => {
    if (!usuario) return false
    return PERMISOS[usuario.rol].includes(seccion)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, puede }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fuera de AuthProvider')
  return ctx
}
